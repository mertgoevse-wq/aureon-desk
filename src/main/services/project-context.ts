import * as fs from 'fs'
import * as path from 'path'
import type { FileTreeNode, ProjectFileContext, ProjectContext, FileTreeOptions } from '../../shared/types/project'
import { logger } from '../utils/logger'

// Patterns to ignore when building file trees
const IGNORE_PATTERNS = [
  '.git', 'node_modules', 'dist', 'build', '.cache', '.next', '.nuxt',
  '.env', '.env.*', 'secrets', 'credentials', '*.pem', '*.key',
  '__pycache__', '.venv', 'venv', '.DS_Store', 'Thumbs.db'
]

// Directories to skip entirely
const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', '.cache', '.next', '.nuxt',
  '__pycache__', '.venv', 'venv', 'coverage'
])

// File extensions that are likely binary (skip for context)
const BINARY_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin', '.obj', '.o',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
  '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac',
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.ttf', '.otf', '.woff', '.woff2',
  '.db', '.sqlite', '.sqlite3',
  '.class', '.pyc', '.pyo',
  '.wasm', '.jar', '.war'
])

// Text extensions allowed for context
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rs', '.go', '.java', '.c', '.cpp', '.h', '.hpp',
  '.rb', '.php', '.swift', '.kt', '.scala', '.cs', '.fs',
  '.html', '.css', '.scss', '.less', '.sass',
  '.json', '.yaml', '.yml', '.toml', '.xml', '.ini', '.cfg',
  '.md', '.mdx', '.txt', '.log',
  '.env.example', '.env.sample', '.gitignore', '.dockerignore',
  '.prisma', '.graphql', '.gql',
  '.sh', '.bash', '.zsh', '.fish', '.ps1',
  '.sql', '.proto', '.csv',
  '.vue', '.svelte', '.astro'
])

// Max file size for context inclusion (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Secret patterns for detection in project files
const FILE_SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{20,}/,
  /sk-[a-zA-Z0-9]{32,}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /(?:api[_-]?key|apikey|secret|token|password)\s*[:=]\s*['\"]?\S{8,}['\"]?/i,
  /Bearer\s+\S{20,}/i,
  /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/,
]

/**
 * Check if a file/directory name should be ignored.
 */
function shouldIgnore(name: string): boolean {
  if (SKIP_DIRS.has(name)) return true
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$')
      if (regex.test(name)) return true
    } else if (name === pattern) {
      return true
    }
  }
  return false
}

/**
 * Check if a file extension is text (allowed for context).
 */
function isTextFile(ext: string): boolean {
  return TEXT_EXTENSIONS.has(ext.toLowerCase())
}

/**
 * Check if a file extension is binary.
 */
function isBinaryFile(ext: string): boolean {
  return BINARY_EXTENSIONS.has(ext.toLowerCase())
}

/**
 * Build a file tree from a root path.
 * Only includes text files and directories.
 */
export function buildFileTree(
  rootPath: string,
  options: FileTreeOptions = {},
  currentDepth: number = 0
): FileTreeNode[] {
  const { maxDepth = 5, maxFilesPerDir = 200 } = options

  if (currentDepth > maxDepth) return []

  try {
    const entries = fs.readdirSync(rootPath, { withFileTypes: true })
    const nodes: FileTreeNode[] = []
    let fileCount = 0

    for (const entry of entries) {
      if (fileCount >= maxFilesPerDir) break
      if (shouldIgnore(entry.name)) continue

      const fullPath = path.join(rootPath, entry.name)

      if (entry.isDirectory()) {
        const children = buildFileTree(fullPath, options, currentDepth + 1)
        nodes.push({
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          children
        })
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        // Include in tree if it's a text file or unrecognized but not binary
        if (isTextFile(ext) || (!isBinaryFile(ext) && ext)) {
          try {
            const stat = fs.statSync(fullPath)
            nodes.push({
              name: entry.name,
              path: fullPath,
              isDirectory: false,
              size: stat.size,
              extension: ext
            })
            fileCount++
          } catch {
            // Skip files we can't stat
          }
        }
      }
    }

    return nodes.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  } catch (err) {
    logger.warn(`Failed to read directory ${rootPath}: ${String(err)}`)
    return []
  }
}

/**
 * Read a single file for context, with safety checks.
 */
export function readFileForContext(filePath: string): ProjectFileContext | null {
  try {
    const stat = fs.statSync(filePath)

    // Size guard
    if (stat.size > MAX_FILE_SIZE) {
      return {
        path: filePath,
        content: '',
        size: stat.size,
        extension: path.extname(filePath),
        warnings: [`File exceeds max size (${(stat.size / 1024 / 1024).toFixed(1)}MB > 5MB). Skipped.`]
      }
    }

    const ext = path.extname(filePath).toLowerCase()

    // Binary check
    if (isBinaryFile(ext)) {
      return {
        path: filePath,
        content: '',
        size: stat.size,
        extension: ext,
        warnings: ['Binary file skipped.']
      }
    }

    // Unknown extension check
    if (!isTextFile(ext)) {
      return {
        path: filePath,
        content: '',
        size: stat.size,
        extension: ext,
        warnings: [`Unrecognized file type \"${ext}\". Skipped.`]
      }
    }

    // Read content
    const content = fs.readFileSync(filePath, 'utf-8')
    const warnings: string[] = []

    // Secret detection
    for (const pattern of FILE_SECRET_PATTERNS) {
      if (pattern.test(content)) {
        warnings.push(`Potential secret detected in file.`)
        break
      }
    }

    return {
      path: filePath,
      content,
      size: stat.size,
      extension: ext,
      warnings
    }
  } catch (err) {
    return {
      path: filePath,
      content: '',
      size: 0,
      extension: '',
      warnings: [`Failed to read file: ${String(err)}`]
    }
  }
}

/**
 * Build project context from selected file paths.
 */
export function buildProjectContext(
  projectName: string,
  rootPath: string | null,
  instructions: string | null,
  selectedFilePaths: string[]
): ProjectContext {
  const selectedFiles: ProjectFileContext[] = []
  const warnings: string[] = []
  let totalSize = 0

  for (const filePath of selectedFilePaths) {
    const ctx = readFileForContext(filePath)
    if (ctx) {
      selectedFiles.push(ctx)
      totalSize += ctx.size
      warnings.push(...ctx.warnings.map(w => `${path.basename(filePath)}: ${w}`))
    }
  }

  // Warn about remote provider upload
  warnings.push('⚠️ Selected project files will be sent to the active AI provider.')

  return {
    projectName,
    rootPath,
    instructions,
    selectedFiles,
    warnings,
    totalSize
  }
}

/**
 * Check if a file path matches any ignore pattern.
 */
export function isPathIgnored(filePath: string): boolean {
  const parts = filePath.split(/[\\/]/)
  for (const part of parts) {
    if (shouldIgnore(part)) return true
  }
  return false
}
