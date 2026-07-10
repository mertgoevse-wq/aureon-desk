import React from 'react'
import { File, Folder, ChevronRight } from 'lucide-react'
import type { FileTreeArtifact, FileTreeEntry } from '@shared/artifacts'

interface Props {
  artifact: FileTreeArtifact
}

export function FileTreeArtifactView({ artifact }: Props): React.ReactElement {
  return (
    <div className="space-y-0.5" data-testid="file-tree-artifact">
      {artifact.files.map((entry, i) => (
        <FileTreeRow key={i} entry={entry} depth={0} />
      ))}
    </div>
  )
}

function FileTreeRow({ entry, depth }: { entry: FileTreeEntry; depth: number }): React.ReactElement {
  const opColors: Record<string, string> = {
    create: 'text-emerald-600',
    update: 'text-amber-600',
    delete: 'text-red-600',
    rename: 'text-purple-600',
  }

  return (
    <>
      <div
        className={`flex items-center gap-1.5 py-0.5 text-[11px] ${
          entry.opType ? opColors[entry.opType] || 'text-[var(--ivory-text-2)]' : 'text-[var(--ivory-text-2)]'
        }`}
        style={{ paddingLeft: depth * 16 }}
      >
        {entry.type === 'directory' ? (
          <Folder size={12} className="shrink-0" />
        ) : (
          <File size={12} className="shrink-0" />
        )}
        <span className="font-mono truncate">{entry.name}</span>
        {entry.opType && (
          <span className="text-[9px] font-semibold uppercase ml-auto shrink-0">
            {entry.opType}
          </span>
        )}
      </div>
      {entry.children?.map((child, i) => (
        <FileTreeRow key={i} entry={child} depth={depth + 1} />
      ))}
    </>
  )
}
