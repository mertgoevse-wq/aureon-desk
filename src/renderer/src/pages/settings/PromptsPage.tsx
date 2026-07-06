import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, Star } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Input, Textarea } from '../../components/shared/Input'
import { Modal } from '../../components/shared/Modal'
import { EmptyState } from '../../components/shared/EmptyState'
import { Toggle } from '../../components/shared/Toggle'
import { useIpc } from '../../hooks/useIpc'
import { usePromptStore } from '../../stores/promptStore'
import type { SystemPromptRow, NewSystemPrompt } from '@shared/types/prompt'

export function PromptsPage(): React.ReactElement {
  const api = useIpc()
  const { prompts, isLoading, setPrompts, addPrompt, updatePrompt, removePrompt } = usePromptStore()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedPrompt, setEditedPrompt] = useState<SystemPromptRow | null>(null)
  const [formData, setFormData] = useState<NewSystemPrompt>({
    name: '',
    description: '',
    content: '',
    is_default: false
  })

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = useCallback(async () => {
    const all = await api.systemPromptList()
    setPrompts(all)
  }, [api, setPrompts])

  const resetForm = () => {
    setFormData({ name: '', description: '', content: '', is_default: false })
  }

  const handleCreate = useCallback(async () => {
    if (!formData.name.trim() || !formData.content.trim()) return
    const prompt = await api.systemPromptCreate(formData)
    addPrompt(prompt)
    setIsCreateOpen(false)
    resetForm()
  }, [formData, api, addPrompt])

  const handleUpdate = useCallback(async (id: string) => {
    if (!editedPrompt) return
    const updated = await api.systemPromptUpdate(id, {
      name: editedPrompt.name,
      description: editedPrompt.description,
      content: editedPrompt.content,
      is_default: editedPrompt.is_default === 1
    })
    if (updated) {
      updatePrompt(id, updated)
    }
    setEditingId(null)
    setEditedPrompt(null)
  }, [editedPrompt, api, updatePrompt])

  const handleDelete = useCallback(async (id: string) => {
    await api.systemPromptDelete(id)
    removePrompt(id)
  }, [api, removePrompt])

  const startEditing = (prompt: SystemPromptRow) => {
    setEditingId(prompt.id)
    setEditedPrompt({ ...prompt })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditedPrompt(null)
  }

  return (
    <div className="max-w-2xl px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold display-text mb-1">System Prompt Profiles</h2>
          <p className="text-sm text-[var(--ivory-text-3)]">
            Create reusable system prompts to control AI behavior across your conversations.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
          <Plus size={16} />
          New Profile
        </Button>
      </div>

      {prompts.length === 0 ? (
        <EmptyState
          title="No prompt profiles yet"
          description="Create your first system prompt profile to define how the AI responds."
          action={
            <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus size={14} /> Create Profile
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="p-4 rounded-[var(--radius-lg)] border border-[var(--ivory-border)] bg-[var(--ivory-bg)]"
            >
              {editingId === prompt.id ? (
                <div className="space-y-3">
                  <Input
                    value={editedPrompt?.name || ''}
                    onChange={(e) => setEditedPrompt(prev => prev ? { ...prev, name: e.target.value } : prev)}
                    placeholder="Profile name"
                  />
                  <Input
                    value={editedPrompt?.description || ''}
                    onChange={(e) => setEditedPrompt(prev => prev ? { ...prev, description: e.target.value } : prev)}
                    placeholder="Description (optional)"
                  />
                  <Textarea
                    value={editedPrompt?.content || ''}
                    onChange={(e) => setEditedPrompt(prev => prev ? { ...prev, content: e.target.value } : prev)}
                    placeholder="System prompt content..."
                    rows={6}
                    className="font-mono text-xs"
                  />
                  <div className="flex items-center gap-3 justify-end">
                    <Toggle
                      label="Set as default"
                      checked={editedPrompt?.is_default === 1}
                      onChange={(checked) => setEditedPrompt(prev => prev ? { ...prev, is_default: checked ? 1 : 0 } : prev)}
                    />
                    <Button variant="ghost" size="sm" onClick={cancelEditing}>
                      <X size={14} /> Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleUpdate(prompt.id)}>
                      <Check size={14} /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm display-text">{prompt.name}</h3>
                      {prompt.is_default === 1 && (
                        <span className="text-[var(--ivory-accent)]">
                          <Star size={12} fill="currentColor" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditing(prompt)}
                        className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-error)] hover:bg-[var(--ivory-error-bg)] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {prompt.description && (
                    <p className="text-xs text-[var(--ivory-text-3)] mb-2">{prompt.description}</p>
                  )}
                  <pre className="text-xs bg-[var(--ivory-surface)] p-3 rounded-[var(--radius-md)] border border-[var(--ivory-border)] max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {prompt.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); resetForm() }}
        title="New System Prompt Profile"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Profile Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Expert Coder, Creative Writer"
          />
          <Input
            label="Description (optional)"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What this profile does"
          />
          <Textarea
            label="System Prompt Content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="You are a helpful AI assistant..."
            rows={8}
          />
          <Toggle
            label="Set as default"
            description="Apply this profile to new chats automatically"
            checked={formData.is_default || false}
            onChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setIsCreateOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim() || !formData.content.trim()}>
              Create Profile
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
