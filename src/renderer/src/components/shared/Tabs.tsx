import React from 'react'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps): React.ReactElement {
  return (
    <div className="flex rounded-[var(--radius-md)] bg-[var(--ivory-surface)] p-0.5" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1 text-xs rounded-[var(--radius-sm)] font-medium transition-all duration-[var(--transition-fast)]
            ${activeTab === tab.id
              ? 'bg-[var(--ivory-bg)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
              : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]'
            }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-[10px] text-[var(--ivory-text-3)]">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}
