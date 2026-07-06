import React, { useCallback, useEffect, useState } from 'react'
import {
  Github, Plus, Search, Trash2, CheckCircle, XCircle, AlertTriangle,
  Clock, RefreshCw, Eye, EyeOff, Upload, Star, Shield, ExternalLink,
  ChevronDown, ChevronRight, FileText, Filter, Download
} from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Badge, type BadgeVariant } from '../../components/shared/Badge'
import { EmptyState } from '../../components/shared/EmptyState'
import { useIpc } from '../../hooks/useIpc'
import { MERTS_STAR_LIST, STAR_LIST_NAME, STAR_LIST_DESCRIPTION } from '@shared/star-list'
import type { ImportedRepo, ImportedItem, ImportResult, ImportedItemType, RepoCategory } from '@shared/types/github'

export function GitHubImportsPage(): React.ReactElement {
  const api = useIpc()
  const [repos, setRepos] = useState<ImportedRepo[]>([])
  const [items, setItems] = useState<ImportedItem[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [bulkInput, setBulkInput] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null)
  const [itemFilter, setItemFilter] = useState<{ type?: string; status?: string; search?: string }>({})
  const [expandItem, setExpandItem] = useState<string | null>(null)

  useEffect(() => { loadRepos() }, [])

  const loadRepos = useCallback(async () => {
    try { setRepos(await api.githubListRepos()) } catch (e) { console.error(e) }
  }, [api])

  const loadItems = useCallback(async (repoId: string) => {
    try {
      setSelectedRepoId(repoId)
      setItems(await api.githubListItems({ repoId, ...itemFilter }))
    } catch (e) { console.error(e) }
  }, [api, itemFilter])

  const handleImportSingle = useCallback(async () => {
    if (!urlInput.trim()) return
    setImporting(true); setError(null)
    try {
      const result = await api.githubImportRepo({ repoUrl: urlInput.trim() })
      if (result.status === 'failed') setError(result.errors.join('; '))
      setUrlInput(''); loadRepos()
    } catch (e) { setError(String(e)) }
    finally { setImporting(false) }
  }, [urlInput, api])

  const handleImportBulk = useCallback(async () => {
    const urls = bulkInput.trim().split('\n').filter(u => u.trim())
    if (urls.length === 0) return
    setImporting(true); setError(null)
    try {
      const results = await api.githubImportBulk(urls)
      const fails = results.filter((r: ImportResult) => r.errors.length > 0)
      if (fails.length > 0) setError(`${fails.length} repos failed to import`)
      setBulkInput(''); loadRepos()
    } catch (e) { setError(String(e)) }
    finally { setImporting(false) }
  }, [bulkInput, api])

  const handleImportStarList = useCallback(async () => {
    setImporting(true); setError(null)
    try {
      const urls = MERTS_STAR_LIST.map(r => r.url)
      const results = await api.githubImportBulk(urls)
      const succeeded = results.filter((r: ImportResult) => r.status === 'imported').length
      const fails = results.filter((r: ImportResult) => r.errors.length > 0)
      setError(fails.length > 0
        ? `Imported ${succeeded}/${urls.length} repos. ${fails.length} failed.`
        : null)
      loadRepos()
    } catch (e) { setError(String(e)) }
    finally { setImporting(false) }
  }, [api])

  const handleDeleteRepo = useCallback(async (id: string) => {
    await api.githubDeleteRepo(id)
    if (selectedRepoId === id) { setSelectedRepoId(null); setItems([]) }
    loadRepos()
  }, [api, selectedRepoId])

  const handleToggleItem = useCallback(async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled'
    await api.githubUpdateItemStatus(itemId, newStatus)
    if (selectedRepoId) loadItems(selectedRepoId)
  }, [api, selectedRepoId])

  const handleDeleteItem = useCallback(async (itemId: string) => {
    await api.githubDeleteItem(itemId)
    if (selectedRepoId) loadItems(selectedRepoId)
  }, [api, selectedRepoId])

  const statusIcon = (status: string) => {
    switch (status) {
      case 'imported': return <CheckCircle size={14} className="text-green-600" />
      case 'failed': return <XCircle size={14} className="text-red-600" />
      case 'importing': return <RefreshCw size={14} className="text-amber-600 animate-spin" />
      default: return <Clock size={14} className="text-[var(--ivory-text-3)]" />
    }
  }

  const categoryLabel: Record<string, string> = {
    'system-prompt-pack': 'System Prompts',
    'prompt-library': 'Prompt Library',
    'agent-framework-reference': 'Agent Framework',
    'skill-pack': 'Skill Pack',
    'mcp-server-list': 'MCP Server List',
    'local-model-reference': 'Local Model',
    'research/reference': 'Research',
    'unrelated/reference': 'Unrelated'
  }

  const typeBadge = (t: ImportedItemType) => {
    const colors: Record<string, string> = {
      prompt: 'default',
      system_prompt: 'default',
      skill: 'success',
      unknown: 'default'
    }
    return <Badge variant={(colors[t] || 'default') as BadgeVariant} size="sm">{t.replace('_', ' ')}</Badge>
  }

  return (
    <div className="flex flex-col h-full bg-[var(--ivory-bg)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--ivory-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold display-text text-[var(--ivory-text)]">GitHub Imports</h2>
            <p className="text-xs text-[var(--ivory-text-3)] mt-0.5">{repos.length} repo{repos.length !== 1 ? 's' : ''} imported</p>
          </div>
          <Button onClick={handleImportStarList} disabled={importing} variant="secondary">
            <Star size={14} /> Import Mert's Star List
          </Button>
        </div>
      </div>

      {/* Import Controls */}
      <div className="px-6 py-3 border-b border-[var(--ivory-border)] space-y-2">
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleImportSingle()}
            placeholder="https://github.com/owner/repo"
            className="flex-1 px-3 py-1.5 text-sm rounded-[var(--radius-md)] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-[var(--ivory-text)] placeholder:text-[var(--ivory-text-3)] focus:outline-none focus:border-[var(--ivory-accent)]"
          />
          <Button onClick={handleImportSingle} disabled={importing || !urlInput.trim()} size="sm">
            <Plus size={14} /> Import
          </Button>
        </div>
        <details className="text-xs">
          <summary className="text-[var(--ivory-text-3)] cursor-pointer hover:text-[var(--ivory-text-2)]">Bulk import (one URL per line)</summary>
          <textarea
            value={bulkInput}
            onChange={e => setBulkInput(e.target.value)}
            rows={4}
            placeholder="https://github.com/owner/repo1&#10;https://github.com/owner/repo2"
            className="mt-1 w-full px-3 py-1.5 text-xs rounded-[var(--radius-md)] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-[var(--ivory-text)] font-mono resize-y placeholder:text-[var(--ivory-text-3)] focus:outline-none focus:border-[var(--ivory-accent)]"
          />
          <Button onClick={handleImportBulk} disabled={importing || !bulkInput.trim()} size="sm" className="mt-1">
            Import All
          </Button>
        </details>
        <p className="text-[10px] text-[var(--ivory-text-3)] flex items-center gap-1">
          <Shield size={10} /> All imported content is marked untrusted. Review before enabling.
        </p>
      </div>

      {error && (
        <div className="px-6 py-2 text-xs bg-[var(--ivory-error-bg)] text-[var(--ivory-error)] border-b border-[var(--ivory-error-bg)] flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><XCircle size={14} /></button>
        </div>
      )}

      {/* Main content: repos + items */}
      <div className="flex-1 overflow-y-auto">
        {repos.length === 0 ? (
          <EmptyState
            icon={<Github size={40} strokeWidth={1.5} />}
            title="No repositories imported"
            description="Import GitHub repositories to discover prompts, system prompts, and skills. Start with a single URL or import the curated star list."
            action={
              <Button onClick={handleImportStarList} disabled={importing}>
                <Star size={14} /> Import Mert's Star List (29 repos)
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--ivory-border)]">
            {/* Repo table */}
            <div className="px-6 py-2 text-[10px] text-[var(--ivory-text-3)] grid grid-cols-[1fr_80px_100px_80px_60px_40px] gap-2 items-center font-medium">
              <span>Repository</span><span>Category</span><span>Items</span><span>Warnings</span><span>Status</span><span></span>
            </div>
            {repos.map(repo => (
              <div key={repo.id}>
                <div
                  onClick={() => loadItems(repo.id)}
                  className={`px-6 py-2.5 grid grid-cols-[1fr_80px_100px_80px_60px_40px] gap-2 items-center cursor-pointer hover:bg-[var(--ivory-surface)] transition-colors text-xs
                    ${selectedRepoId === repo.id ? 'bg-[var(--ivory-surface)]' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {selectedRepoId === repo.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="truncate text-[var(--ivory-text)] font-medium">
                      {repo.repo_url.replace('https://github.com/', '')}
                    </span>
                  </div>
                  <span>{repo.category ? categoryLabel[repo.category] || repo.category : '—'}</span>
                  <span className="text-[var(--ivory-text-2)]">
                    P:{repo.prompt_count} S:{repo.system_prompt_count} K:{repo.skill_count}
                  </span>
                  <span className={repo.warning_count > 0 ? 'text-amber-600 font-medium' : 'text-[var(--ivory-text-3)]'}>                      {repo.warning_count > 0 ? <span><AlertTriangle size={10} className="inline mr-1" />{repo.warning_count}</span> : '0'}
                  </span>
                  <span className="flex items-center gap-1">{statusIcon(repo.status)} {repo.status}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteRepo(repo.id) }}
                    className="p-1 text-[var(--ivory-text-3)] hover:text-red-600"
                    title="Delete repo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Expanded items list */}
                {selectedRepoId === repo.id && (
                  <div className="px-6 pb-4 pl-10 space-y-2">
                    <div className="flex items-center gap-2 pt-2">
                      <Filter size={12} className="text-[var(--ivory-text-3)]" />
                      <select
                        value={itemFilter.type || ''}
                        onChange={e => setItemFilter(f => ({ ...f, type: e.target.value || undefined }))}
                        className="text-[11px] px-2 py-0.5 rounded border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-text-2)]"
                      >
                        <option value="">All types</option>
                        <option value="prompt">Prompts</option>
                        <option value="system_prompt">System Prompts</option>
                        <option value="skill">Skills</option>
                      </select>
                      <select
                        value={itemFilter.status || ''}
                        onChange={e => setItemFilter(f => ({ ...f, status: e.target.value || undefined }))}
                        className="text-[11px] px-2 py-0.5 rounded border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-text-2)]"
                      >
                        <option value="">All statuses</option>
                        <option value="unreviewed">Unreviewed</option>
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-xs text-[var(--ivory-text-3)] py-4">No items match filters</p>
                    ) : (
                      items.map(item => (
                        <div key={item.id} className="border border-[var(--ivory-border)] rounded-[var(--radius-md)] bg-[var(--ivory-bg)] p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {typeBadge(item.item_type)}
                                <span className="text-sm font-medium text-[var(--ivory-text)] truncate">{item.title}</span>
                                {item.safety_warnings && item.safety_warnings !== '[]' && (
                                  <AlertTriangle size={12} className="text-amber-500" />
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--ivory-text-3)] truncate">{item.source_file}</p>
                              {expandItem === item.id && (
                                <pre className="mt-2 p-2 text-[11px] text-[var(--ivory-text-2)] bg-[var(--ivory-surface)] rounded max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
                                  {item.content.slice(0, 1000)}
                                </pre>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-3 shrink-0">
                              <button onClick={() => setExpandItem(expandItem === item.id ? null : item.id)}
                                className="p-1 text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]">
                                {expandItem === item.id ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button onClick={() => handleToggleItem(item.id, item.status)}
                                className={`p-1 ${item.status === 'enabled' ? 'text-green-600' : 'text-[var(--ivory-text-3)] hover:text-green-600'}`}
                                title={item.status === 'enabled' ? 'Disable' : 'Enable'}>
                                {item.status === 'enabled' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                              </button>
                              <button onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-[var(--ivory-text-3)] hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
