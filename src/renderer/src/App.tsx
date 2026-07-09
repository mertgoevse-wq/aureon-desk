import React from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { AppShell } from './layouts/AppShell'
import { SettingsLayout } from './layouts/SettingsLayout'
import { ChatWorkspace } from './pages/ChatWorkspace'
import { CoworkPage } from './pages/CoworkPage'
import { PromptLibrary } from './pages/PromptLibrary'
import { ProvidersPage } from './pages/settings/ProvidersPage'
import { GeneralSettingsPage } from './pages/settings/GeneralSettingsPage'
import { DeveloperSettingsPage } from './pages/settings/DeveloperSettingsPage'
import { SettingsPlaceholderPage } from './pages/settings/SettingsPlaceholderPage'
import { PromptsPage } from './pages/settings/PromptsPage'
import { GitHubImportsPage } from './pages/settings/GitHubImportsPage'
import { ToolsPage } from './pages/settings/ToolsPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { LogsPage } from './pages/settings/LogsPage'
import { AppearancePage } from './pages/settings/AppearancePage'
import { LivePreview } from './pages/LivePreview'
import { VibeCoding } from './pages/VibeCoding'
import { Studio } from './pages/Studio'
import { ConnectorsPage } from './pages/settings/ConnectorsPage'
import { CapabilitiesPage } from './pages/settings/CapabilitiesPage'
import { SelfAudit } from './pages/SelfAudit'
import { DeviceInputsPage } from './pages/settings/DeviceInputsPage'

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Studio /> },
      { path: 'chat', element: <ChatWorkspace /> },
      { path: 'studio', element: <Studio /> },
      { path: 'cowork', element: <CoworkPage /> },
      { path: 'prompts', element: <PromptLibrary /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'tools', element: <ToolsPage /> },
      { path: 'preview', element: <LivePreview /> },
      { path: 'self-audit', element: <SelfAudit /> },
      { path: 'vibe', element: <VibeCoding /> },
      {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
          { index: true, element: <GeneralSettingsPage /> },
          { path: 'general', element: <GeneralSettingsPage /> },
          { path: 'providers', element: <ProvidersPage /> },
          { path: 'prompts', element: <PromptsPage /> },
          { path: 'system-prompts', element: <PromptsPage /> },
          { path: 'appearance', element: <AppearancePage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'tools', element: <ToolsPage /> },
          { path: 'connectors', element: <ConnectorsPage /> },
          { path: 'github', element: <GitHubImportsPage /> },
          { path: 'imports', element: <GitHubImportsPage /> },
          { path: 'logs', element: <LogsPage /> },
          { path: 'developer', element: <DeveloperSettingsPage /> },
          { path: 'extensions', element: <SettingsPlaceholderPage /> },
          { path: 'security', element: <SettingsPlaceholderPage /> },
          { path: 'capabilities', element: <CapabilitiesPage /> },
          { path: 'self-audit', element: <SelfAudit /> },
          { path: 'device-inputs', element: <DeviceInputsPage /> }
        ]
      }
    ]
  }
])

export function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
