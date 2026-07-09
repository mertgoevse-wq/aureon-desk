/**
 * Attachment Store — Zustand store for drag-and-drop file state.
 * Manages attachments across Chat, Studio, and Code mode.
 */
import { create } from 'zustand'
import type { AttachmentFile } from '@shared/attachments'

interface AttachmentState {
  /** All current attachments */
  attachments: AttachmentFile[]

  /** Add one or more attachments */
  addAttachments: (files: AttachmentFile[]) => void

  /** Remove an attachment by ID */
  removeAttachment: (id: string) => void

  /** Toggle whether a file is included in AI context */
  toggleContext: (id: string) => void

  /** Update an attachment's fields */
  updateAttachment: (id: string, updates: Partial<AttachmentFile>) => void

  /** Clear all attachments */
  clearAll: () => void

  /** Get only attachments that are included in context */
  getContextFiles: () => AttachmentFile[]

  /** Get summary text for prompt injection */
  getContextSummary: () => string
}

export const useAttachmentStore = create<AttachmentState>((set, get) => ({
  attachments: [],

  addAttachments: (files) =>
    set((state) => {
      // Avoid duplicates by path
      const existingPaths = new Set(state.attachments.map((a) => a.path))
      const newFiles = files.filter((f) => !existingPaths.has(f.path))
      return { attachments: [...state.attachments, ...newFiles] }
    }),

  removeAttachment: (id) =>
    set((state) => ({
      attachments: state.attachments.filter((a) => a.id !== id),
    })),

  toggleContext: (id) =>
    set((state) => ({
      attachments: state.attachments.map((a) =>
        a.id === id ? { ...a, isIncludedInContext: !a.isIncludedInContext } : a,
      ),
    })),

  updateAttachment: (id, updates) =>
    set((state) => ({
      attachments: state.attachments.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    })),

  clearAll: () => set({ attachments: [] }),

  getContextFiles: () => {
    return get().attachments.filter((a) => a.isIncludedInContext && a.status !== 'blocked')
  },

  getContextSummary: () => {
    const files = get().attachments.filter((a) => a.isIncludedInContext && a.status !== 'blocked')
    if (files.length === 0) return ''
    const parts = files.map((f) => {
      const label = "- " + f.name + " (" + f.sizeLabel + ")"
      if (f.content) return label + "\n  Content: " + f.content.slice(0, 500) + (f.content.length > 500 ? '...' : '')
      return label
    })
    return "\n\nAttached files (included in context):\n" + parts.join("\n")
  },
}))
