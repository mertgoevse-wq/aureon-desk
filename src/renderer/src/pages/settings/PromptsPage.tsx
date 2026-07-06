import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, Star, Archive, Copy, Eye, Search, AlertTriangle, Shield } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Input, Textarea } from '../../components/shared/Input'
import { Modal } from '../../components/shared/Modal'
import { EmptyState } from '../../components/shared/EmptyState'
import { Toggle } from '../../components/shared/Toggle'
import { Badge } from '../../components/shared/Badge'
import { Card } from '../../components/shared/Card'
import { Tabs } from '../../components/shared/Tabs'
import { TagInput } from '../../components/prompts/TagInput'
import { useIpc } from '../../hooks/useIpc'
import { usePromptStore } from '../../stores/promptStore'
import type { SystemPromptRow, NewSystemPrompt, ResolvedPrompt } from '@shared/types/prompt'

type TabMode = 'active' | 'archived'

export function PromptsPage(): React.ReactElement {
  const api = useIpc()
  const { prompts, setPrompts, addPrompt, updatePrompt, removePrompt, archivePrompt, restorePrompt } = usePromptStore()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedPrompt, setEditedPrompt] = useState<SystemPromptRow | null>(null)
  const [tab, setTab] = useState<TabMode>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [resolved, setResolved] = useState<ResolvedPrompt | null>(null)
  const [secretWarnings, setSecretWarnings] = useState<string[]>([])
  const [formData, setFormData] = useState<NewSystemPrompt>({
    name: '', description: '', content: '', tags: [], category: '', is_default: false, priority: 0
  })

  useEffect(() => { loadPrompts() }, [tab])

  const loadPrompts = useCallback(async () => {
    const all = await api.systemPromptList(tab === 'archived')
    setPrompts(all)
  }, [api, tab, setPrompts])

  const displayedPrompts = searchQuery
    ? prompts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tags && safeParseTags(p.tags).some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    : prompts

  const resetForm = () => setFormData({ name: '', description: '', content: '', tags: [], category: '', is_default: false, priority: 0 })

  const handleCreate = useCallback(async () => {
    if (!formData.name.trim() || !formData.content.trim()) return
    const prompt = await api.systemPromptCreate(formData)
    addPrompt(prompt)
    setIsCreateOpen(false)
    resetForm()
  }, [formData, api, addPrompt])

  const handleUpdate = useCallback(async (id: string) => {
    if (!editedPrompt) return
    const tags = editedPrompt.tags ? safeParseTags(editedPrompt.tags) : undefined
    const updated = await api.systemPromptUpdate(id, {
      name: editedPrompt.name, description: editedPrompt.description || '',
      content: editedPrompt.content, tags, category: editedPrompt.category || '',
      is_default: editedPrompt.is_default === 1, priority: editedPrompt.priority
    })
    if (updated) { updatePrompt(id, updated); loadPrompts() }
    setEditingId(null); setEditedPrompt(null)
  }, [editedPrompt, api, updatePrompt, loadPrompts])

  const handleDelete = useCallback(async (id: string) => {
    await api.systemPromptDelete(id); removePrompt(id)
  }, [api, removePrompt])

  const handleArchive = useCallback(async (id: string) => {
    await api.systemPromptArchive(id); archivePrompt(id)
  }, [api, archivePrompt])

  const handleRestore = useCallback(async (id: string) => {
    const restored = await api.systemPromptRestore(id)
    if (restored) { restorePrompt(id); loadPrompts() }
  }, [api, restorePrompt, loadPrompts])

  const handleDuplicate = useCallback(async (id: string) => {
    const dup = await api.systemPromptDuplicate(id)
    if (dup && tab === 'active') { addPrompt(dup); loadPrompts() }
  }, [api, addPrompt, tab, loadPrompts])

  const handlePreview = useCallback(async (prompt: SystemPromptRow) => {
    setPreviewId(prompt.id)
    const result = await api.systemPromptResolveHierarchy({
      selectedProfile: prompt
    })
    setResolved(result)
    setSecretWarnings([])
    setPreviewOpen(true)

    // Run secret check
    const secrets = await api.systemPromptValidateSecrets(prompt.content)
    if (secrets.hasSecrets) setSecretWarnings(secrets.matches)
  }, [api])

  const startEditing = (p: SystemPromptRow) => {
    setEditingId(p.id)
    setEditedPrompt({ ...p })
  }

  const cancelEditing = () => { setEditingId(null); setEditedPrompt(null) }

  const allTags = [...new Set(prompts.flatMap(p => safeParseTags(p.tags)))]

  return (
    <div className="flex flex-col h-full max-h-full">
      <div className="flex-1 overflow-y-auto max-w-2xl px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold display-text mb-1">System Prompt Profiles</h2>
            <p className="text-sm text-[var(--ivory-text-3)]">
              Manage how the AI behaves. Prompts stack in a hierarchy (project → profile → chat → task).
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
            <Plus size={16} /> New Profile
          </Button>
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center gap-3 mb-4">
          <Tabs
            tabs={[
              { id: 'active', label: 'Active', count: prompts.filter(p => !p.is_archived).length },
              { id: 'archived', label: 'Archived', count: prompts.filter(p => p.is_archived).length }
            ]}
            activeTab={tab}
            onChange={(id) => setTab(id as TabMode)}
          />
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ivory-text-3)]" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, tag, or content..." className="pl-9" />
          </div>
        </div>

        {displayedPrompts.length === 0 ? (
          <EmptyState title={searchQuery ? 'No matching profiles' : tab === 'active' ? 'No prompt profiles yet' : 'No archived profiles'}
            description={searchQuery ? 'Try adjusting your search.' : 'Create your first system prompt profile to define how the AI responds.'}
            action={!searchQuery && tab === 'active' ? <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(true)}><Plus size={14} /> Create Profile</Button> : undefined} />
        ) : (
          <div className="space-y-3">
            {displayedPrompts.map(prompt => (
              <Card key={prompt.id}>
                {editingId === prompt.id ? (
                  <div className="space-y-3">
                    <Input value={editedPrompt?.name || ''} onChange={e => setEditedPrompt(prev => prev ? { ...prev, name: e.target.value } : prev)} placeholder="Profile name" />
                    <Input value={editedPrompt?.description || ''} onChange={e => setEditedPrompt(prev => prev ? { ...prev, description: e.target.value } : prev)} placeholder="Description (optional)" />
                    <Textarea value={editedPrompt?.content || ''} onChange={e => setEditedPrompt(prev => prev ? { ...prev, content: e.target.value } : prev)} placeholder="System prompt content..." rows={6} className="font-mono text-xs" />
                    <div className="flex flex-wrap gap-2">
                      <Input label="Priority" type="number" value={(editedPrompt?.priority ?? 0).toString()}
                        onChange={e => setEditedPrompt(prev => prev ? { ...prev, priority: parseInt(e.target.value) || 0 } : prev)} hint="Higher = applied later in the hierarchy" className="w-24" />
                      <Input label="Category" value={editedPrompt?.category || ''}
                        onChange={e => setEditedPrompt(prev => prev ? { ...prev, category: e.target.value } : prev)} placeholder="e.g., coding, writing" />
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <Toggle label="Set as default" checked={editedPrompt?.is_default === 1}
                        onChange={(checked) => setEditedPrompt(prev => prev ? { ...prev, is_default: checked ? 1 : 0 } : prev)} />
                      <Button variant="ghost" size="sm" onClick={cancelEditing}><X size={14} /> Cancel</Button>
                      <Button size="sm" onClick={() => handleUpdate(prompt.id)}><Check size={14} /> Save</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold text-sm display-text truncate">{prompt.name}</h3>
                        {prompt.is_default === 1 && <Badge variant="warning" size="sm">default</Badge>}
                        {tab === 'archived' && <Badge variant="default" size="sm">archived</Badge>}
                        {prompt.priority > 0 && <span className="text-[10px] text-[var(--ivory-text-3)]">P{prompt.priority}</span>}
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <button onClick={() => handlePreview(prompt)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-accent)] hover:bg-[var(--ivory-surface)] transition-colors" title="Preview resolved"><Eye size={14} /></button>
                        <button onClick={() => handleDuplicate(prompt.id)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors" title="Duplicate"><Copy size={14} /></button>
                        {tab === 'active' ? (
                          <>
                            <button onClick={() => startEditing(prompt)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors" title="Edit"><Edit2 size={14} /></button>
                            <button onClick={() => handleArchive(prompt.id)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)] transition-colors" title="Archive"><Archive size={14} /></button>
                            <button onClick={() => handleDelete(prompt.id)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-error)] hover:bg-[var(--ivory-error-bg)] transition-colors" title="Delete"><Trash2 size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => handleRestore(prompt.id)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-success)] hover:bg-[var(--ivory-success-bg)] transition-colors" title="Restore"><Check size={14} /></button>
                        )}
                      </div>
                    </div>
                    {prompt.description && <p className="text-xs text-[var(--ivory-text-3)] mb-2">{prompt.description}</p>}
                    <pre className="text-xs bg-[var(--ivory-surface)] p-3 rounded-[var(--radius-md)] border border-[var(--ivory-border)] max-h-28 overflow-y-auto whitespace-pre-wrap line-clamp-4">{prompt.content}</pre>
                    <div className="flex items-center gap-1 mt-2">
                      {safeParseTags(prompt.tags).map(tag => <Badge key={tag} variant="default" size="sm">{tag}</Badge>)}
                      {prompt.category && <Badge variant="success" size="sm">{prompt.category}</Badge>}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); resetForm() }} title="New System Prompt Profile" size="lg">
          <div className="space-y-4">
            <Input label="Profile Name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Expert Coder, Creative Writer" />
            <Input label="Description" value={formData.description || ''} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="What this profile does" />
            <Textarea label="System Prompt Content" value={formData.content} onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))} placeholder="You are a helpful AI assistant..." rows={8} />
            <TagInput tags={formData.tags || []} onChange={tags => setFormData(prev => ({ ...prev, tags }))} suggestions={allTags} placeholder="Add tags..." />
            <div className="flex gap-4">
              <Input label="Category" value={formData.category || ''} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} placeholder="e.g., coding" className="flex-1" />
              <Input label="Priority" type="number" value={formData.priority?.toString() || '0'} onChange={e => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))} hint="Higher = later in hierarchy" className="w-24" />
            </div>
            <Toggle label="Set as default" description="Apply to new chats automatically" checked={formData.is_default || false}
              onChange={checked => setFormData(prev => ({ ...prev, is_default: checked }))} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => { setIsCreateOpen(false); resetForm() }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formData.name.trim() || !formData.content.trim()}>Create Profile</Button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Preview Modal */}
      {previewOpen && resolved && (
        <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Resolved System Prompt Preview" size="lg">
          <div className="space-y-3">
            {/* Warnings */}
            {secretWarnings.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--ivory-error-bg)] border border-[var(--ivory-error)] text-xs">
                <AlertTriangle size={16} className="text-[var(--ivory-error)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[var(--ivory-error)] mb-1">Secret Detected</p>
                  <p className="text-[var(--ivory-error)]">This prompt contains patterns that look like API keys or credentials. Remove them before sending.</p>
                </div>
              </div>
            )}
            {resolved.warnings.filter(w => w.type === 'tool_bypass').map(w => (
              <div key={w.type} className="flex items-start gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--ivory-warning-bg)] border border-[var(--ivory-warning)] text-xs">
                <Shield size={16} className="text-[var(--ivory-warning)] shrink-0 mt-0.5" />
                <p className="text-[var(--ivory-warning)]">{w.message}</p>
              </div>
            ))}

            {/* Layers */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--ivory-text-2)]">Active Layers ({resolved.sources.length})</p>
              {resolved.sources.map((layer, i) => (
                <div key={i} className="p-2 rounded-[var(--radius-md)] bg-[var(--ivory-surface)] border border-[var(--ivory-border)]">
                  <p className="text-[11px] font-medium text-[var(--ivory-text)] mb-1">{layer.name} (Priority: {layer.priority})</p>
                  <pre className="text-[10px] text-[var(--ivory-text-2)] whitespace-pre-wrap max-h-20 overflow-y-auto">{layer.content}</pre>
                </div>
              ))}
            </div>

            {/* Final resolved text */}
            <div>
              <p className="text-xs font-medium text-[var(--ivory-text-2)] mb-1">Final Resolved Prompt</p>
              <pre className="text-[11px] bg-[var(--ivory-surface)] p-3 rounded-[var(--radius-md)] border border-[var(--ivory-border)] max-h-48 overflow-y-auto whitespace-pre-wrap">{resolved.text}</pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function safeParseTags(tags: string | null): string[] {
  if (!tags) return []
  try { return JSON.parse(tags) } catch { return [] }
}
