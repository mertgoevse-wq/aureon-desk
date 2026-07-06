import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { RightInspector } from './RightInspector'

export function AppShell(): React.ReactElement {
  return (
    <div className="flex h-full w-full bg-[var(--ivory-bg)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--ivory-bg)]">
        <Outlet />
      </div>

      {/* Right Inspector */}
      <RightInspector />
    </div>
  )
}
