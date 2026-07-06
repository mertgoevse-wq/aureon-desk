import { v4 as uuid } from 'uuid'
import fs from 'fs'
import path from 'path'
import { getDb } from '../db/connection'
import { githubImports, importedItems, importWarnings, importLogs } from '../db/schema'
import { eq } from 'drizzle-orm'
import { classifyRepo } from './repo-classifier'
import { parseFileContent, shouldProcessFile } from './import-parser'
import { getImportsPath } from '../utils/paths'
import { execSync } from 'child_process'
import { logger } from '../utils/logger'
import type {
  ImportedRepo, ImportedItem, ImportWarning,
  ImportResult, ImportStatus, ItemStatus
} from '../../shared/types/github'

/**
 * GitHub Import Service — main orchestrator for importing, parsing, classifying,
 * and safely storing content from GitHub repositories.
 *
 * IMPORTANT: This service never executes imported code. All parsing is static.
 * All imported content is marked as untrusted by default.
 */

export const githubImportService = {
  // ---- Repository Management ----

  /** List all imported repos */
  listRepos(): ImportedRepo[] {
    const db = getDb()
    return db.select().from(githubImports).all() as ImportedRepo[]
  },

  /** Get a single imported repo */
  getRepo(id: string): ImportedRepo | undefined {
    const db = getDb()
    return db.select().from(githubImports).where(eq(githubImports.id, id)).get() as ImportedRepo | undefined
  },

  /** Check if a URL was already imported */
  isAlreadyImported(repoUrl: string): boolean {
    const db = getDb()
    const normalized = repoUrl.replace(/\.git$/, '').replace(/\/$/, '').toLowerCase()
    const all = db.select().from(githubImports).all() as ImportedRepo[]
    return all.some(r => r.repo_url.replace(/\.git$/, '').replace(/\/$/, '').toLowerCase() === normalized)
  },

  /** Import a single repository */
  importRepo(repoUrl: string, branch = 'main'): ImportResult {
    const errors: string[] = []
    const warnings: ImportWarning[] = []

    // Sanitize branch name — allow only safe characters
    const safeBranch = branch.replace(/[^a-zA-Z0-9._\/-]/g, '').slice(0, 100) || 'main'

    // Check for duplicate
    if (this.isAlreadyImported(repoUrl)) {
      errors.push('Repository already imported')
      return { repoId: '', repoUrl, status: 'failed', category: null, itemsFound: 0, itemsImported: 0, warnings, errors, commitHash: null }
    }

    // Validate URL
    if (!repoUrl.match(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/)) {
      errors.push('Invalid GitHub URL')
      return { repoId: '', repoUrl, status: 'failed', category: null, itemsFound: 0, itemsImported: 0, warnings, errors, commitHash: null }
    }

    const db = getDb()
    const now = new Date().toISOString()
    const repoId = uuid()
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'unknown'
    const importDir = path.join(getImportsPath(), repoName)

    // Log import start
    db.insert(importLogs).values({
      id: uuid(), repo_url: repoUrl, message: `Starting import of ${repoUrl} (branch: ${safeBranch})`, level: 'info', created_at: now
    } as never).run()

    // Create repo record
    db.insert(githubImports).values({
      id: repoId, repo_url: repoUrl, branch,
      local_path: importDir, status: 'importing' as ImportStatus,
      updated_at: now, created_at: now,
    } as never).run()

    // Clone repo
    let commitHash: string | null = null
    try {
      fs.mkdirSync(importDir, { recursive: true })
      const cloneUrl = repoUrl.replace('https://github.com/', 'https://github.com/')
      execSync(`git clone --depth 1 --branch ${safeBranch} ${cloneUrl} "${importDir}"`, {
        timeout: 60000,
        stdio: 'pipe'
      })
      // Get commit hash
      try {
        commitHash = execSync('git rev-parse HEAD', { cwd: importDir, timeout: 5000 })
          .toString().trim()
      } catch { /* commit hash optional */ }
    } catch (err: any) {
      const msg = String(err.stderr || err.message || err)
      errors.push(`Clone failed: ${msg.slice(0, 200)}`)
      db.update(githubImports).set({ status: 'failed', updated_at: now } as never)
        .where(eq(githubImports.id, repoId)).run()
      return { repoId, repoUrl, status: 'failed', category: null, itemsFound: 0, itemsImported: 0, warnings, errors, commitHash: null }
    }

    // Discover files
    const filePaths = discoverFiles(importDir)

    // Read README for classification hints
    let readmeContent: string | undefined
    const readmePath = filePaths.find(f => /readme\.(md|txt)$/i.test(f))
    if (readmePath) {
      try { readmeContent = fs.readFileSync(readmePath, 'utf-8') } catch {}
    }

    // Classify repo
    const classification = classifyRepo({
      repoName: repoUrl,
      readmeContent,
      fileNames: filePaths.map(f => path.basename(f))
    })

    // Parse files
    let itemsFound = 0
    let itemsImported = 0

    for (const filePath of filePaths) {
      const stat = fs.statSync(filePath)
      const { accepted, reason } = shouldProcessFile(filePath, stat.size)
      if (!accepted) {
        if (reason?.includes('too large')) {
          warnings.push({
            id: uuid(), item_id: '', repo_url: repoUrl,
            type: 'large_file', message: reason, severity: 'low',
            line_number: null, context: filePath, created_at: now
          })
        } else if (reason?.includes('Extension')) {
          // Skip silently — not an accepted extension
        } else if (reason?.includes('skip pattern')) {
          warnings.push({
            id: uuid(), item_id: '', repo_url: repoUrl,
            type: 'binary_skipped', message: reason, severity: 'low',
            line_number: null, context: filePath, created_at: now
          })
        }
        continue
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const { items: parsed, warnings: fileWarnings } = parseFileContent(filePath, content)
        itemsFound += parsed.length

        for (const item of parsed) {
          const itemId = uuid()
          const relPath = path.relative(importDir, filePath)

          // Store all warnings
          for (const w of item.warnings) {
            warnings.push({
              id: uuid(), item_id: itemId, repo_url: repoUrl,
              type: w.type, message: w.message, severity: w.severity,
              line_number: (w as any).lineNumber || null, context: w.context || relPath,
              created_at: now
            } as ImportWarning)
          }
          for (const w of fileWarnings) {
            warnings.push({
              id: uuid(), item_id: itemId, repo_url: repoUrl,
              type: w.type, message: w.message, severity: w.severity,
              line_number: (w as any).lineNumber || null, context: w.context || null,
              created_at: now
            } as ImportWarning)
          }

          db.insert(importedItems).values({
            id: itemId, repo_id: repoId, repo_url: repoUrl,
            item_type: item.itemType, title: item.title, content: item.content,
            description: item.description,
            tags: item.tags.length > 0 ? JSON.stringify(item.tags) : null,
            category: item.category,
            source_file: relPath,
            status: 'unreviewed' as ItemStatus,
            safety_warnings: item.warnings.length > 0 ? JSON.stringify(item.warnings) : null,
            is_untrusted: 1,
            original_content: content,
            created_at: now
          } as never).run()
          itemsImported++
        }
      } catch (err) {
        warnings.push({
          id: uuid(), item_id: '', repo_url: repoUrl,
          type: 'parse_error', message: `Failed to read/parse ${filePath}: ${String(err)}`,
          severity: 'medium', line_number: null, context: filePath, created_at: now
        })
      }
    }

    // Store import warnings in DB
    for (const w of warnings) {
      if (w.item_id) {
        db.insert(importWarnings).values({
          id: uuid(), item_id: w.item_id, repo_url: w.repo_url,
          type: w.type, message: w.message, severity: w.severity,
          line_number: w.line_number, context: w.context, created_at: w.created_at
        } as never).run()
      }
    }

    // Update repo record
    const itemCounts = countItems(repoId)
    db.update(githubImports).set({
      status: 'imported',
      category: classification.category,
      detected_categories: JSON.stringify(classification.detectedCategories),
      commit_hash: commitHash,
      item_count: itemsImported,
      prompt_count: itemCounts.prompt,
      system_prompt_count: itemCounts.systemPrompt,
      skill_count: itemCounts.skill,
      warning_count: warnings.length,
      updated_at: new Date().toISOString()
    } as never).where(eq(githubImports.id, repoId)).run()

    logger.info(`Imported repo ${repoUrl}: ${itemsImported} items, ${warnings.length} warnings`)
    return {
      repoId, repoUrl, status: 'imported',
      category: classification.category,
      itemsFound, itemsImported,
      warnings, errors,
      commitHash
    }
  },

  /** Import multiple repos from a list */
  async importBulk(urls: string[]): Promise<ImportResult[]> {
    const results: ImportResult[] = []
    for (const url of urls) {
      try {
        results.push(this.importRepo(url))
      } catch (err) {
        results.push({
          repoId: '', repoUrl: url, status: 'failed',
          category: null, itemsFound: 0, itemsImported: 0,
          warnings: [], errors: [String(err)],
          commitHash: null
        })
      }
    }
    return results
  },

  /** Delete an imported repo and all its items, warnings, and local files */
  deleteRepo(id: string): boolean {
    const db = getDb()
    const repo = this.getRepo(id)
    if (repo) {
      // Try to clean up local files
      try {
        if (fs.existsSync(repo.local_path)) {
          fs.rmSync(repo.local_path, { recursive: true, force: true })
        }
      } catch { /* best effort */ }
    }
    // Cascade delete handles items + warnings
    const result = db.delete(githubImports).where(eq(githubImports.id, id)).run()
    return result.changes > 0
  },

  // ---- Imported Items Management ----

  /** List imported items with optional filters */
  listItems(filters?: {
    repoId?: string
    itemType?: string
    status?: string
    search?: string
    hasWarnings?: boolean
  }): ImportedItem[] {
    const db = getDb()
    let query = db.select().from(importedItems)

    if (filters?.repoId) {
      query = query.where(eq(importedItems.repo_id, filters.repoId)) as typeof query
    }
    if (filters?.itemType) {
      query = query.where(eq(importedItems.item_type, filters.itemType)) as typeof query
    }
    if (filters?.status) {
      query = query.where(eq(importedItems.status, filters.status)) as typeof query
    }

    let results = query.all() as ImportedItem[]

    // Client-side filters
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.tags && i.tags.toLowerCase().includes(q))
      )
    }
    if (filters?.hasWarnings) {
      results = results.filter(i => i.safety_warnings && i.safety_warnings !== '[]')
    }

    return results
  },

  /** Get a single imported item */
  getItem(id: string): ImportedItem | undefined {
    const db = getDb()
    return db.select().from(importedItems).where(eq(importedItems.id, id)).get() as ImportedItem | undefined
  },

  /** Update item status */
  updateItemStatus(id: string, status: ItemStatus): ImportedItem | undefined {
    const db = getDb()
    db.update(importedItems).set({ status } as never).where(eq(importedItems.id, id)).run()
    return this.getItem(id)
  },

  /** Delete an imported item */
  deleteItem(id: string): boolean {
    const db = getDb()
    const result = db.delete(importedItems).where(eq(importedItems.id, id)).run()
    return result.changes > 0
  },

  /** Get warnings for a repo or item */
  getWarnings(itemId?: string, repoUrl?: string): ImportWarning[] {
    const db = getDb()
    if (itemId) {
      return db.select().from(importWarnings).where(eq(importWarnings.item_id, itemId)).all() as ImportWarning[]
    }
    if (repoUrl) {
      return db.select().from(importWarnings).where(eq(importWarnings.repo_url, repoUrl)).all() as ImportWarning[]
    }
    return db.select().from(importWarnings).all() as ImportWarning[]
  }
}

// ---- Helpers ----

function discoverFiles(dir: string): string[] {
  const results: string[] = []
  function walk(current: string) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true })
      for (const entry of entries) {
        // Skip hidden files/dirs, node_modules, .git, etc.
        if (entry.name.startsWith('.') && entry.name !== '.github') continue
        if (entry.name === 'node_modules' || entry.name === 'dist' ||
            entry.name === 'build' || entry.name === '__pycache__') continue

        const fullPath = path.join(current, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath)
        } else {
          results.push(fullPath)
        }
      }
    } catch { /* permission denied etc. */ }
  }
  walk(dir)
  return results
}

function countItems(repoId: string): { prompt: number; systemPrompt: number; skill: number } {
  const db = getDb()
  const items = db.select().from(importedItems).where(eq(importedItems.repo_id, repoId)).all() as ImportedItem[]
  return {
    prompt: items.filter(i => i.item_type === 'prompt').length,
    systemPrompt: items.filter(i => i.item_type === 'system_prompt').length,
    skill: items.filter(i => i.item_type === 'skill').length
  }
}
