import React from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { SettingsLayout } from './layouts/SettingsLayout'
import { ChatWorkspace } from './pages/ChatWorkspace'
import { PromptLibrary } from './pages/PromptLibrary'
import { ProvidersPage } from './pages/settings/ProvidersPage'
import { PromptsPage } from './pages/settings/PromptsPage'
import { GitHubImportsPage } from './pages/settings/GitHubImportsPage'

// Placeholder pages for settings sections not yet implemented
function PlaceholderPage({ title }: { title: string }): React.ReactElement {
  return (
    <div className="max-w-2xl px-8 py-8">
      <h2 className="text-xl font-semibold display-text mb-2">{title}</h2>
      <p className="text-sm text-[var(--ivory-text-3)]">
        This settings page will be available in a future update.
      </p>
    </div>
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <ChatWorkspace /> },
      { path: 'prompts', element: <PromptLibrary /> },
      { path: 'projects', element: <PlaceholderPage title="Projects" /> },
      { path: 'tools', element: <PlaceholderPage title="Tools & MCP" /> },
      {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
          { index: true, element: <ProvidersPage /> },
          { path: 'providers', element: <ProvidersPage /> },
          { path: 'prompts', element: <PromptsPage /> },
          { path: 'appearance', element: <PlaceholderPage title="Appearance" /> },
          { path: 'projects', element: <PlaceholderPage title="Projects" /> },
          { path: 'tools', element: <PlaceholderPage title="Tools" /> },
          { path: 'github', element: <GitHubImportsPage /> },
          { path: 'logs', element: <PlaceholderPage title="Logs & Debug" /> }
        ]
      }
    ]
  }
])

export function App(): React.ReactElement {
  return <RouterProvider router={router} />
}
