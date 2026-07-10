/**
 * Vibeforge — Safe Drag & Drop Attachments
 * Shared types and safety constants for the attachment pipeline.
 */

export interface AttachmentFile {
  id: string
  name: string
  path: string
  mimeType: string
  sizeBytes: number
  /** Readable size string (e.g. "2.4 MB") */
  sizeLabel: string
  /** Text content (redacted if applicable), only populated for text files */
  content?: string
  /** Base64 data URI for image thumbnails */
  thumbnailBase64?: string
  /** Safety scan result */
  status: 'scanning' | 'safe' | 'warning' | 'blocked'
  /** Human-readable warning or block reason */
  statusMessage?: string
  /** True if the file is a ZIP archive */
  isZip: boolean
  /** Whether the user has opted to include this file in AI context */
  isIncludedInContext: boolean
}

export interface ZipInspectResult {
  fileCount: number
  totalSizeBytes: number
  tree: string[]
}

export interface ZipExtractResult {
  success: boolean
  extractedPaths: string[]
  error?: string
}

export interface FileProcessResult {
  attachment: AttachmentFile
  /** ZIP inspection result (only populated for ZIP files) */
  zipInspect?: ZipInspectResult
}

/**
 * Maximum file size allowed (10 MB).
 * Files larger than this are blocked with a warning.
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Directories that should always be blocked from drag-and-drop.
 * These contain sensitive or auto-generated content.
 */
export const BLOCKED_DIRS = [
  '.git',
  'node_modules',
  'dist',
  'out',
  '.next',
  'build',
  '__pycache__',
  '.venv',
  'venv',
  '.env',
]

/**
 * File extensions that should always be blocked.
 * These typically contain secrets or private keys.
 */
export const BLOCKED_EXTENSIONS = [
  '.env',
  '.pem',
  '.key',
  '.id_rsa',
  '.id_ed25519',
  '.pfx',
  '.p12',
  '.keystore',
  '.jks',
]

/**
 * File extensions that trigger a warning (not a block).
 * These may contain sensitive data but are not always secret files.
 */
export const WARN_EXTENSIONS = [
  '.sqlite',
  '.db',
  '.sqlite3',
  '.log',
]

/**
 * Image MIME types that can generate thumbnails.
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
]

/**
 * MIME type mapping for common file extensions.
 */
export const EXTENSION_MIME_MAP: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.jsx': 'text/javascript',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.xml': 'text/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.py': 'text/x-python',
  '.rs': 'text/x-rust',
  '.toml': 'text/plain',
  '.yml': 'text/yaml',
  '.yaml': 'text/yaml',
  '.sh': 'text/x-shellscript',
  '.bat': 'text/x-batch',
  '.ps1': 'text/x-powershell',
}

/**
 * Format a byte count into a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Get a human-readable MIME type label.
 */
export function getMimeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image'
  if (mimeType.includes('javascript') || mimeType.includes('typescript')) return 'Code'
  if (mimeType.startsWith('text/')) return 'Text'
  if (mimeType === 'application/json') return 'JSON'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'application/zip') return 'ZIP Archive'
  return 'File'
}

/**
 * Check if a file path contains any blocked directory.
 */
export function hasBlockedDir(filePath: string): string | null {
  const parts = filePath.replace(/\\/g, '/').split('/')
  for (const part of parts) {
    if (BLOCKED_DIRS.includes(part)) {
      return part
    }
  }
  return null
}

/**
 * Check if a file extension is in the blocked or warning list.
 */
export function checkExtensionSafety(ext: string): 'safe' | 'warning' | 'blocked' {
  const lower = ext.toLowerCase()
  if (BLOCKED_EXTENSIONS.includes(lower)) return 'blocked'
  if (WARN_EXTENSIONS.includes(lower)) return 'warning'
  return 'safe'
}
