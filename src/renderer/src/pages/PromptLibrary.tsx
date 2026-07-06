import React, { useCallback, useEffect, useState, useRef } from 'react'
import { Search, Plus, X, Filter, BookOpen, Star, Upload, Download } from 'lucide-react'
import { Button } from '../components/shared/Button'
import { Badge } from '../components/shared/Badge'
import { EmptyState } from '../components/shared/EmptyState'
import { PromptCard } from '../components/prompts/PromptCard'
import { PromptEditor } from '../components/prompts/PromptEditor'
import { useIpc } from '../hooks/useIpc'
import { usePromptLibraryStore } from '../stores/promptLibraryStore'
import type { PromptRow, NewPrompt } from '@shared/types/prompt'

export function PromptLibrary(): React.ReactElement {
  const api = useIpc()
  const {
    prompts, allTags, allCategories,
    searchQuery, selectedTags, selectedCategory, favoritesOnly, isLoading,
    setPrompts, setAllTags, setAllCategories, setSearchQuery,
    toggleTag, setSelectedCategory, toggleFavoritesOnly,
    addPrompt, updatePrompt, removePrompt, setLoading, clearFilters
  } = usePromptLibraryStore()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PromptRow | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasFilters = searchQuery || selectedTags.length > 0 || selectedCategory || favoritesOnly

  // Reload when filters change
  useEffect(() => {
    loadPrompts()
  }, [searchQuery, selectedTags, selectedCategory, favoritesOnly])

  // Load tags/categories once
  useEffect(() => { loadMeta() }, [])

  const loadPrompts = useCallback(async () => {
    setLoading(true)
    try {
      const filters: Record<string, unknown> = {}
      if (searchQuery) filters.search = searchQuery
      if (selectedTags.length > 0) filters.tags = selectedTags
      if (selectedCategory) filters.category = selectedCategory
      if (favoritesOnly) filters.favoritesOnly = true
      const results = await api.promptLibraryList(filters as any)
      setPrompts(results)
    } catch (err) {
      console.error('Failed to load prompts:', err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedTags, selectedCategory, favoritesOnly, api])

  const loadMeta = useCallback(async () => {
    try {
      const [tags, cats] = await Promise.all([
        api.promptLibraryGetTags(),
        api.promptLibraryGetCategories()
      ])
      setAllTags(tags)
      setAllCategories(cats)
    } catch (err) {
      console.error('Failed to load tags/categories:', err)
    }
  }, [])

  const handleCreate = useCallback(async (data: NewPrompt) => {
    const result = await api.promptLibraryCreate(data)
    addPrompt(result)
    loadMeta()
  }, [api, addPrompt])

  const handleUpdate = useCallback(async (data: NewPrompt, id?: string) => {
    if (!id) return
    const result = await api.promptLibraryUpdate(id, data)
    if (result) {
      updatePrompt(id, result)
      loadMeta()
    }
  }, [api, updatePrompt])

  const handleDelete = useCallback(async (id: string) => {
    await api.promptLibraryDelete(id)
    removePrompt(id)
    loadMeta()
  }, [api, removePrompt])

  const handleToggleFavorite = useCallback(async (id: string) => {
    const result = await api.promptLibraryToggleFavorite(id)
    if (result) updatePrompt(id, result)
  }, [api, updatePrompt])

  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }, [])

  const openEditor = useCallback((prompt?: PromptRow) => {
    setEditingPrompt(prompt || null)
    setEditorOpen(true)
  }, [])

  // Import / Export
  const handleExport = useCallback(async () => {
    try {
      const data = await api.promptLibraryExportAll()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aureon-prompts-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }, [api])

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const ext = file.name.split('.').pop()
      const result = await api.promptLibraryImportText(text, undefined, ext)
      setImportResult(result)
      loadPrompts()
      loadMeta()
      // Auto-dismiss result after 5 seconds
      setTimeout(() => setImportResult(null), 5000)
    } catch (err) {
      setImportResult({ imported: 0, errors: [String(err)] })
    } finally {
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [api, loadPrompts, loadMeta])

  // Save current composer text as a prompt (placeholder — composer integration comes later)
  const handleSaveFromComposer = useCallback(() => {
    openEditor()
  }, [openEditor])

  return (
    <div className="flex flex-col h-full bg-[var(--ivory-bg)]">
      {/* Import result banner */}
      {importResult && (
        <div className={`px-6 py-2 text-xs flex items-center justify-between border-b ${
          importResult.errors.length > 0
            ? 'bg-[var(--ivory-error-bg)] text-[var(--ivory-error)] border-[var(--ivory-error-bg)]'
            : 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)] border-[var(--ivory-success-bg)]'
        }`}>
          <span>
            Imported {importResult.imported} prompt{importResult.imported !== 1 ? 's' : ''}.
            {importResult.errors.length > 0 && ` ${importResult.errors.length} error(s).`}
          </span>
          <button onClick={() => setImportResult(null)}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ivory-border)]">
        <div>
          <h2 className="text-lg font-semibold display-text text-[var(--ivory-text)]">
            Prompt Library
          </h2>
          <p className="text-xs text-[var(--ivory-text-3)] mt-0.5">
            {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
            {hasFilters ? ' (filtered)' : ''}
            {favoritesOnly ? ' ★' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.md,.yaml,.yml"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Import prompts (JSON, Markdown, YAML)">
            <Upload size={14} />
            Import
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport} title="Export all prompts as JSON">
            <Download size={14} />
            Export
          </Button>
          <Button onClick={() => openEditor()}>
            <Plus size={16} />
            New Prompt
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-6 py-3 border-b border-[var(--ivory-border)] space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ivory-text-3)]" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search prompts..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-[var(--ivory-text)] placeholder:text-[var(--ivory-text-3)] focus:outline-none focus:border-[var(--ivory-accent)] focus:ring-1 focus:ring-[var(--ivory-accent)] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tags, Category filters, and Favorites toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={12} className="text-[var(--ivory-text-3)] shrink-0" />

          {/* Favorites toggle */}
          <button
            onClick={toggleFavoritesOnly}
            className={`px-2 py-0.5 text-[11px] rounded-[var(--radius-sm)] transition-colors flex items-center gap-1
              ${favoritesOnly
                ? 'bg-amber-500 text-white'
                : 'bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface-2)] border border-[var(--ivory-border)]'}`}
          >
            <Star size={10} fill={favoritesOnly ? 'currentColor' : 'none'} />
            Favorites
          </button>

          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2 py-0.5 text-[11px] rounded-[var(--radius-sm)] transition-colors
                ${selectedTags.includes(tag)
                  ? 'bg-[var(--ivory-accent)] text-white'
                  : 'bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface-2)] border border-[var(--ivory-border)]'}`}
            >
              {tag}
            </button>
          ))}
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-2 py-0.5 text-[11px] rounded-[var(--radius-sm)] transition-colors
                ${selectedCategory === cat
                  ? 'bg-[var(--ivory-success)] text-white'
                  : 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)] border border-[var(--ivory-success-bg)] hover:opacity-80'}`}
            >
              {cat}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-2 py-0.5 text-[11px] text-[var(--ivory-error)] hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Prompt list */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center py-12 text-sm text-[var(--ivory-text-3)]">
            Loading prompts...
          </div>
        ) : prompts.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={40} strokeWidth={1.5} />}
            title={hasFilters ? 'No matching prompts' : 'No prompts yet'}
            description={hasFilters
              ? 'Try adjusting your search or filters.'
              : 'Create reusable prompt templates to insert into any chat with /.'}
            action={
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} /> Import
                </Button>
                <Button size="sm" onClick={() => openEditor()}>
                  <Plus size={14} /> Create Prompt
                </Button>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {prompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={openEditor}
                onDelete={handleDelete}
                onCopy={handleCopy}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      <PromptEditor
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingPrompt(null) }}
        onSave={editingPrompt ? handleUpdate : handleCreate}
        existingPrompt={editingPrompt}
        existingTags={allTags}
        existingCategories={allCategories}
      />
    </div>
  )
}
