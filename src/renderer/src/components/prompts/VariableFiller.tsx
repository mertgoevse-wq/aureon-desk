import React, { useState, useCallback, useEffect } from 'react'
import { Modal } from '../shared/Modal'
import { Input, Textarea } from '../shared/Input'
import { Button } from '../shared/Button'
import { Variable, ArrowRight } from 'lucide-react'

interface VariableFillerProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (text: string) => void
  title: string
  content: string
  variables: string[]
}

export function VariableFiller({
  isOpen,
  onClose,
  onInsert,
  title,
  content,
  variables
}: VariableFillerProps): React.ReactElement {
  const [values, setValues] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState(content)

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {}
      for (const v of variables) initial[v] = ''
      setValues(initial)
      setPreview(content)
    }
  }, [isOpen, content, variables])

  const updateValue = useCallback((variable: string, val: string) => {
    const newValues = { ...values, [variable]: val }
    setValues(newValues)

    // Render preview
    let rendered = content
    for (const [k, v] of Object.entries(newValues)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || `{{${k}}}`)
    }
    setPreview(rendered)
  }, [values, content])

  const handleInsert = useCallback(() => {
    let rendered = content
    for (const [k, v] of Object.entries(values)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || `[${k}]`)
    }
    onInsert(rendered)
    onClose()
  }, [values, content, onInsert, onClose])

  const allFilled = variables.every(v => values[v]?.trim())

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Fill Template: ${title}`} size="md">
      <div className="space-y-4">
        {/* Variable inputs */}
        <div className="space-y-3">
          {variables.map(variable => (
            <div key={variable}>
              <label className="block text-xs font-medium text-[var(--ivory-text-2)] mb-1">
                <Variable size={12} className="inline mr-1 text-[var(--ivory-accent)]" />
                {variable}
              </label>
              <Input
                value={values[variable] || ''}
                onChange={e => updateValue(variable, e.target.value)}
                placeholder={`Value for ${variable}...`}
                className="font-mono text-sm"
              />
            </div>
          ))}
        </div>

        {/* Preview */}
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-[var(--ivory-text-2)] mb-1">
            <ArrowRight size={12} />
            Preview
          </label>
          <Textarea
            value={preview}
            readOnly
            rows={6}
            className="text-xs font-mono text-[var(--ivory-text)] bg-[var(--ivory-surface)] border-[var(--ivory-border)] resize-none"
          />
          <p className="text-[10px] text-[var(--ivory-text-3)] mt-1">
            Unfilled variables will be inserted as <code className="font-mono text-[var(--ivory-accent)]">[variable]</code>
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleInsert} disabled={!allFilled}>
            Insert Template
          </Button>
        </div>
      </div>
    </Modal>
  )
}
