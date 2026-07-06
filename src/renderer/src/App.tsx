import React from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { SettingsLayout } from './layouts/SettingsLayout'
import { ChatWorkspace } from './pages/ChatWorkspace'
import { PromptLibrary } from './pages/PromptLibrary'
import { ProvidersPage } from './pages/settings/ProvidersPage'
import { PromptsPage } from './pages/settings/PromptsPage'
import { GitHubImportsPage } from './pages/settings/GitHubImportsPage'
import { ToolsPage } from './pages/settings/ToolsPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { LogsPage } from './pages/settings/LogsPage'
import { AppearancePage } from './pages/settings/AppearancePage'

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <ChatWorkspace /> },
      { path: 'prompts', element: <PromptLibrary /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'tools', element: <ToolsPage /> },
      {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
          { index: true, element: <ProvidersPage /> },
          { path: 'providers', element: <ProvidersPage /> },
          { path: 'prompts', element: <PromptsPage /> },
          { path: 'system-prompts', element: <PromptsPage /> },
          { path: 'appearance', element: <AppearancePage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'tools', element: <ToolsPage /> },
          { path: 'github', element: <GitHubImportsPage /> },
          { path: 'imports', element: <GitHubImportsPage /> },
          { path: 'logs', element: <LogsPage /> }
        ]
      }
    ]
  }
])

export function App(): React.ReactElement {
  return <RouterProvider router={router} />
}
