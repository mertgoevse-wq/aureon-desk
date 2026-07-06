import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from '../shared/Modal'
import { Input, Textarea } from '../shared/Input'
import { Select } from '../shared/Select'
import { Toggle } from '../shared/Toggle'
import { TagInput } from './TagInput'
import { Button } from '../shared/Button'
import type { PromptRow, NewPrompt } from '@shared/types/prompt'

interface PromptEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: NewPrompt, id?: string) => Promise<void>
  existingPrompt?: PromptRow | null
  existingTags?: string[]
  existingCategories?: string[]
}

export function PromptEditor({
  isOpen,
  onClose,
  onSave,
  existingPrompt,
  existingTags = [],
  existingCategories = []
}: PromptEditorProps): React.ReactElement {
  const isEditing = !!existingPrompt

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [category, setCategory] = useState('')
  const [isTemplate, setIsTemplate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extract {{variable}} names from content
  const detectedVars = useMemo(() => {
    const matches = content.match(/\{\{(\w+)\}\}/g)
    if (!matches) return []
    return [...new Set(matches.map(m => m.slice(2, -2)))]
  }, [content])

  useEffect(() => {
    if (isOpen) {
      if (existingPrompt) {
        setTitle(existingPrompt.title)
        setDescription(existingPrompt.description || '')
        setContent(existingPrompt.content)
        setTags(existingPrompt.tags ? safeParseTags(existingPrompt.tags) : [])
        setCategory(existingPrompt.category || '')
        setIsTemplate(existingPrompt.is_template === 1)
      } else {
        setTitle('')
        setDescription('')
        setContent('')
        setTags([])
        setCategory('')
        setIsTemplate(false)
      }
      setError(null)
    }
  }, [isOpen, existingPrompt])

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!content.trim()) { setError('Content is required'); return }

    setSaving(true)
    setError(null)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        variables: detectedVars.length > 0 ? detectedVars : undefined,
        tags: tags.length > 0 ? tags : undefined,
        category: category || undefined,
        is_template: isTemplate
      }, existingPrompt?.id)
      onClose()
    } catch (err) {
      setError('Failed to save prompt')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Prompt' : 'New Prompt'}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., API Endpoint Designer"
        />

        <Input
          label="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What this prompt does"
        />

        <div>
          <Textarea
            label="Prompt Content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`Write your prompt template here...\n\nUse {{variable}} syntax for template variables.\nExample: "Help me build {{feature}} for {{projectName}}"\n`}
            rows={10}
          />
          {detectedVars.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-[var(--ivory-text-3)]">Detected variables:</span>
              {detectedVars.map(v => (
                <code key={v} className="text-[11px] px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--ivory-surface-2)] text-[var(--ivory-accent)] font-mono">
                  {`{{${v}}}`}
                </code>
              ))}
            </div>
          )}
        </div>

        <TagInput
          tags={tags}
          onChange={setTags}
          suggestions={existingTags}
          placeholder="Add tags..."
        />

        <div className="flex gap-4">
          <Select
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: '', label: 'None' },
              ...existingCategories.map(c => ({ value: c, label: c }))
            ]}
            placeholder="Select category..."
          />
        </div>

        <Toggle
          label="Template"
          description="Prompt contains {{variable}} placeholders that will be filled when used"
          checked={isTemplate}
          onChange={setIsTemplate}
        />

        {error && (
          <p className="text-xs text-[var(--ivory-error)]">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}>
            {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function safeParseTags(tags: string): string[] {
  try { return JSON.parse(tags) }
  catch { return [] }
}
