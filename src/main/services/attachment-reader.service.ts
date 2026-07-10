/**
 * Attachment Reader Service — Safe, read-only file metadata extraction.
 *
 * Runs in the main process. Never auto-extracts ZIPs. Never sends
 * file content to remote providers without explicit user approval.
 * Redacts secrets from text files before storing in memory.
 */
import fs from 'fs'
import path from 'path'
import os from 'os'
import { v4 as uuid } from 'uuid'
import { logger } from '../utils/logger'
import { redactSecrets } from './log-redacter'
import {
  type AttachmentFile,
  type FileProcessResult,
  type ZipInspectResult,
  MAX_FILE_SIZE_BYTES,
  BLOCKED_DIRS,
  BLOCKED_EXTENSIONS,
  ALLOWED_IMAGE_TYPES,
  formatFileSize,
  hasBlockedDir,
  checkExtensionSafety,
  EXTENSION_MIME_MAP,
} from '../../shared/attachments'

/**
 * Safely read a text file with secret redaction.
 * Returns the content with API keys / secrets replaced by [REDACTED].
 */
function readTextFileSafe(filePath: string, maxBytes: number = MAX_FILE_SIZE_BYTES): string {
  const stat = fs.statSync(filePath)
  if (stat.size > maxBytes) {
    return `[File too large to preview: ${formatFileSize(stat.size)}. Max: ${formatFileSize(maxBytes)}]`
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  return redactSecrets(raw)
}

/**
 * Generate a base64 thumbnail for supported image types.
 * Returns null if the file is not an image or is too large.
 */
function generateThumbnail(filePath: string, ext: string, mimeType: string): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) return null
  const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024 // 5 MB max for thumbnails
  try {
    const stat = fs.statSync(filePath)
    if (stat.size > MAX_THUMBNAIL_BYTES) return null
    const buffer = fs.readFileSync(filePath)
    const base64 = buffer.toString('base64')
    return `data:${mimeType};base64,${base64}`
  } catch {
    return null
  }
}

/**
 * Inspect a ZIP file without extracting.
 * Returns file count, total size, and directory tree.
 */
function inspectZipContent(filePath: string): ZipInspectResult | null {
  try {
    // Use a lightweight approach: read the ZIP central directory
    // without extracting any files
    const buffer = fs.readFileSync(filePath)
    const entries: string[] = []
    let pos = 0

    // Simple ZIP parsing — find local file headers
    while (pos < buffer.length - 30) {
      // Look for local file header signature (PK\x03\x04)
      if (buffer[pos] === 0x50 && buffer[pos + 1] === 0x4b && buffer[pos + 2] === 0x03 && buffer[pos + 3] === 0x04) {
        const fileNameLen = buffer.readUInt16LE(pos + 26)
        const extraLen = buffer.readUInt16LE(pos + 28)
        if (fileNameLen > 0 && fileNameLen < 4096) {
          const nameStart = pos + 30
          if (nameStart + fileNameLen <= buffer.length) {
            const name = buffer.subarray(nameStart, nameStart + fileNameLen).toString('utf-8')
            // Skip directory entries (ending with /)
            if (!name.endsWith('/')) {
              entries.push(name)
            }
          }
        }
        pos += 30 + fileNameLen + extraLen
      } else {
        pos++
      }
    }

    if (entries.length === 0) {
      // Fallback: try to read via a simpler approach
      // Just count entries using a regex on the raw buffer
      const text = buffer.toString('latin1')
      const matches = text.match(/PK\x03\x04/g)
      if (matches) {
        return {
          fileCount: matches.length,
          totalSizeBytes: buffer.length,
          tree: [`${matches.length} files detected in archive`],
        }
      }
      return null
    }

    return {
      fileCount: entries.length,
      totalSizeBytes: buffer.length,
      tree: entries.slice(0, 50), // Limit tree to 50 entries
    }
  } catch {
    return null
  }
}

/**
 * Process a single file: validate, read metadata, generate thumbnail.
 * This is the main entry point called by the IPC handler.
 */
export function processAttachmentFile(filePath: string): FileProcessResult {
  // Normalize path for Windows
  const normalized = path.normalize(filePath)

  // Verify file exists
  if (!fs.existsSync(normalized)) {
    throw new Error(`File not found: ${normalized}`)
  }

  const stat = fs.statSync(normalized)
  const ext = path.extname(normalized).toLowerCase()
  const mimeType = EXTENSION_MIME_MAP[ext] || 'application/octet-stream'
  const isZip = ext === '.zip'
  const isDir = stat.isDirectory()

  // Block directories (user should drag individual files or ZIP a project)
  if (isDir) {
    const blockedDir = hasBlockedDir(normalized)
    if (blockedDir) {
      return {
        attachment: {
          id: uuid(),
          name: path.basename(normalized),
          path: normalized,
          mimeType: 'inode/directory',
          sizeBytes: 0,
          sizeLabel: 'Directory',
          status: 'blocked',
          statusMessage: `Blocked: contains '${blockedDir}' directory (sensitive/auto-generated content)`,
          isZip: false,
          isIncludedInContext: false,
        },
      }
    }
    return {
      attachment: {
        id: uuid(),
        name: path.basename(normalized),
        path: normalized,
        mimeType: 'inode/directory',
        sizeBytes: 0,
        sizeLabel: 'Directory',
        status: 'warning',
        statusMessage: 'Directories are not supported. Please ZIP the folder first, or drag individual files.',
        isZip: false,
        isIncludedInContext: false,
      },
    }
  }

  // Check extension safety
  const extSafety = checkExtensionSafety(ext)
  if (extSafety === 'blocked') {
    return {
      attachment: {
        id: uuid(),
        name: path.basename(normalized),
        path: normalized,
        mimeType,
        sizeBytes: stat.size,
        sizeLabel: formatFileSize(stat.size),
        status: 'blocked',
        statusMessage: `Blocked: '${ext}' files may contain secret keys or private credentials. For your safety, these are never read automatically.`,
        isZip: false,
        isIncludedInContext: false,
      },
    }
  }

  // Check file size
  if (stat.size > MAX_FILE_SIZE_BYTES) {
    return {
      attachment: {
        id: uuid(),
        name: path.basename(normalized),
        path: normalized,
        mimeType,
        sizeBytes: stat.size,
        sizeLabel: formatFileSize(stat.size),
        status: 'warning',
        statusMessage: `Large file (${formatFileSize(stat.size)}). Max: ${formatFileSize(MAX_FILE_SIZE_BYTES)}. Content will not be read into memory.`,
        isZip: false,
        isIncludedInContext: false,
      },
    }
  }

  // Read text content for text files
  let content: string | undefined
  const textExtensions = ['.txt', '.md', '.json', '.csv', '.xml', '.yml', '.yaml', '.toml']
  const codeExtensions = ['.html', '.css', '.js', '.ts', '.tsx', '.jsx', '.py', '.rs', '.sh', '.bat', '.ps1']
  const allTextExts = [...textExtensions, ...codeExtensions]

  if (allTextExts.includes(ext)) {
    try {
      content = readTextFileSafe(normalized)
    } catch {
      // Non-UTF8 file — skip content reading
    }
  }

  // Generate thumbnail for images
  const thumbnailBase64 = generateThumbnail(normalized, ext, mimeType)

  // Inspect ZIP if applicable
  let zipInspect: ZipInspectResult | undefined
  if (isZip) {
    const inspectResult = inspectZipContent(normalized)
    if (inspectResult) {
      zipInspect = inspectResult
    }
  }

  const status: AttachmentFile['status'] = extSafety === 'warning' ? 'warning' : 'safe'
  const statusMessage: string | undefined = extSafety === 'warning'
    ? `Warning: '${ext}' files may contain sensitive data. Content read with secrets redacted.`
    : undefined

  const attachment: AttachmentFile = {
    id: uuid(),
    name: path.basename(normalized),
    path: normalized,
    mimeType,
    sizeBytes: stat.size,
    sizeLabel: formatFileSize(stat.size),
    content,
    thumbnailBase64: thumbnailBase64 ?? undefined,
    status,
    statusMessage,
    isZip,
    isIncludedInContext: false, // Default: NOT included in AI context
  }

  return { attachment, zipInspect }
}

/**
 * Extract a ZIP file to a destination directory.
 * Only called after explicit user approval.
 */
export async function extractAttachmentZip(zipPath: string, destDir?: string): Promise<{ success: boolean; extractedPaths: string[]; error?: string }> {
  try {
    const AdmZip = (await import('adm-zip')).default
    const zip = new AdmZip(zipPath)
    const entries = zip.getEntries()

    // Use a safe temp directory if no destination provided
    const safeDest = path.resolve(destDir || path.join(os.tmpdir(), 'Vibeforge-zip-extract', uuid()))

    // Ensure the destination directory exists
    if (!fs.existsSync(safeDest)) {
      fs.mkdirSync(safeDest, { recursive: true })
    }

    // Safety check: ensure no entry escapes the destination
    for (const entry of entries) {
      if (entry.isDirectory) continue
      const entryPath = path.resolve(safeDest, entry.entryName)
      if (!entryPath.startsWith(safeDest)) {
        return { success: false, extractedPaths: [], error: `Security: entry '${entry.entryName}' attempts path traversal` }
      }
    }

    zip.extractAllTo(safeDest, true)
    const extractedPaths: string[] = []
    for (const entry of entries) {
      if (!entry.isDirectory) {
        // Return the full absolute path on disk, not just the relative entry name
        extractedPaths.push(path.join(safeDest, entry.entryName))
      }
    }

    return { success: true, extractedPaths }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(`ZIP extraction failed for ${zipPath}: ${msg}`)
    // If adm-zip is not available, provide a clear message
    if (msg.includes('Cannot find module')) {
      return {
        success: false,
        extractedPaths: [],
        error: 'ZIP extraction requires adm-zip. Run: npm install adm-zip',
      }
    }
    return { success: false, extractedPaths: [], error: msg }
  }
}
