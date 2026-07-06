import { contextBridge, ipcRenderer } from 'electron'
import type { ChatRow, ChatWithMessages, ChatListItem, NewChat, NewMessage, MessageRow } from '../shared/types/chat'
import type { SystemPromptRow, NewSystemPrompt, PromptRow, NewPrompt, HierarchyInput, ResolvedPrompt, PromptExport } from '../shared/types/prompt'
import type { ProviderAdapterInfo } from '../shared/types/provider'
import type { AppSettings } from '../shared/types/settings'
import type { AnalyzePromptInput, AnalyzePromptOutput } from '../shared/types/routing'
import type { ImportedRepo, ImportedItem, ImportWarning, ImportResult, ImportRepoInput, ImportItemFilter } from '../shared/types/github'
import type { ToolRow, ToolCallLog, SafetyCheckResult, ToolExecuteInput, ToolExecuteResult } from '../shared/types/tool'
import type { ProjectRow, NewProject, ProjectUpdate, FileTreeNode, ProjectContext, FileTreeOptions } from '../shared/types/project'
import type { AppLogRow, LogFilter, DebugBundle } from '../shared/types/log'

// Define the IPC API exposed to the renderer
const api = {
  // Chat
  chatList: (includeArchived?: boolean): Promise<ChatListItem[]> =>
    ipcRenderer.invoke('chat:list', includeArchived),
  chatGet: (id: string): Promise<ChatWithMessages | undefined> =>
    ipcRenderer.invoke('chat:get', id),
  chatCreate: (input: NewChat): Promise<ChatRow> =>
    ipcRenderer.invoke('chat:create', input),
  chatUpdate: (id: string, updates: Partial<ChatRow>): Promise<ChatRow | undefined> =>
    ipcRenderer.invoke('chat:update', id, updates),
  chatDelete: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('chat:delete', id),
  chatArchive: (id: string): Promise<ChatRow | undefined> =>
    ipcRenderer.invoke('chat:archive', id),

  // Messages
  messageList: (chatId: string): Promise<MessageRow[]> =>
    ipcRenderer.invoke('message:list', chatId),
  messageAdd: (input: NewMessage): Promise<MessageRow> =>
    ipcRenderer.invoke('message:add', input),
  messageUpdate: (id: string, content: string): Promise<MessageRow | undefined> =>
    ipcRenderer.invoke('message:update', id, content),
  messageDelete: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('message:delete', id),
  messageClear: (chatId: string): Promise<boolean> =>
    ipcRenderer.invoke('message:clear', chatId),

  // System Prompts
  systemPromptList: (includeArchived?: boolean): Promise<SystemPromptRow[]> =>
    ipcRenderer.invoke('systemPrompt:list', includeArchived),
  systemPromptGet: (id: string): Promise<SystemPromptRow | undefined> =>
    ipcRenderer.invoke('systemPrompt:get', id),
  systemPromptGetDefault: (): Promise<SystemPromptRow | undefined> =>
    ipcRenderer.invoke('systemPrompt:getDefault'),
  systemPromptCreate: (input: NewSystemPrompt): Promise<SystemPromptRow> =>
    ipcRenderer.invoke('systemPrompt:create', input),
  systemPromptUpdate: (id: string, input: Partial<NewSystemPrompt & { is_archived?: boolean }>): Promise<SystemPromptRow | undefined> =>
    ipcRenderer.invoke('systemPrompt:update', id, input),
  systemPromptDelete: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('systemPrompt:delete', id),
  systemPromptArchive: (id: string): Promise<SystemPromptRow | undefined> =>
    ipcRenderer.invoke('systemPrompt:archive', id),
  systemPromptRestore: (id: string): Promise<SystemPromptRow | undefined> =>
    ipcRenderer.invoke('systemPrompt:restore', id),
  systemPromptDuplicate: (id: string): Promise<SystemPromptRow | undefined> =>
    ipcRenderer.invoke('systemPrompt:duplicate', id),
  systemPromptResolveHierarchy: (input: HierarchyInput): Promise<ResolvedPrompt> =>
    ipcRenderer.invoke('systemPrompt:resolveHierarchy', input),
  systemPromptValidateSecrets: (content: string): Promise<{ hasSecrets: boolean; matches: string[] }> =>
    ipcRenderer.invoke('systemPrompt:validateSecrets', content),
  systemPromptValidateToolBypass: (content: string): Promise<boolean> =>
    ipcRenderer.invoke('systemPrompt:validateToolBypass', content),

  // Providers
  providerList: (): Promise<any[]> =>
    ipcRenderer.invoke('provider:list'),
  providerGet: (id: string): Promise<any> =>
    ipcRenderer.invoke('provider:get', id),
  providerAdapters: (): Promise<ProviderAdapterInfo[]> =>
    ipcRenderer.invoke('provider:adapters'),
  providerSetApiKey: (providerId: string, apiKey: string): Promise<boolean> =>
    ipcRenderer.invoke('provider:setApiKey', providerId, apiKey),
  providerDeleteApiKey: (providerId: string): Promise<boolean> =>
    ipcRenderer.invoke('provider:deleteApiKey', providerId),
  providerHasApiKey: (providerId: string): Promise<boolean> =>
    ipcRenderer.invoke('provider:hasApiKey', providerId),
  providerToggleEnabled: (providerId: string, enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('provider:toggleEnabled', providerId, enabled),
  providerSetBaseUrl: (providerId: string, baseUrl: string): Promise<boolean> =>
    ipcRenderer.invoke('provider:setBaseUrl', providerId, baseUrl),
  providerModels: (providerId: string): Promise<any[]> =>
    ipcRenderer.invoke('provider:models', providerId),
  providerCreateFromAdapter: (adapterSlug: string): Promise<any> =>
    ipcRenderer.invoke('provider:createFromAdapter', adapterSlug),
  providerCreateCustom: (input: { name: string; slug: string; baseUrl: string; apiKey?: string }): Promise<any> =>
    ipcRenderer.invoke('provider:createCustom', input),
  providerDelete: (providerId: string): Promise<boolean> =>
    ipcRenderer.invoke('provider:delete', providerId),
  providerTestConnection: (providerId: string): Promise<{ success: boolean; message: string }> =>
    ipcRenderer.invoke('provider:testConnection', providerId),
  providerSetDefaultModel: (providerId: string, modelId: string): Promise<boolean> =>
    ipcRenderer.invoke('provider:setDefaultModel', providerId, modelId),
  modelAllEnabled: (): Promise<any[]> =>
    ipcRenderer.invoke('model:allEnabled'),
  modelToggleEnabled: (modelId: string, enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('model:toggleEnabled', modelId, enabled),

  // Settings
  settingsGet: (key: string): Promise<string | null> =>
    ipcRenderer.invoke('settings:get', key),
  settingsSet: (key: string, value: string): Promise<boolean> =>
    ipcRenderer.invoke('settings:set', key, value),
  settingsGetAll: (): Promise<Record<string, string>> =>
    ipcRenderer.invoke('settings:getAll'),
  settingsGetDefaults: (): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:getDefaults'),

  // Prompt Library
  promptLibraryList: (filters?: { search?: string; tags?: string[]; category?: string; favoritesOnly?: boolean }): Promise<PromptRow[]> =>
    ipcRenderer.invoke('promptLibrary:list', filters),
  promptLibraryGet: (id: string): Promise<PromptRow | undefined> =>
    ipcRenderer.invoke('promptLibrary:get', id),
  promptLibraryCreate: (input: NewPrompt): Promise<PromptRow> =>
    ipcRenderer.invoke('promptLibrary:create', input),
  promptLibraryUpdate: (id: string, input: Partial<NewPrompt>): Promise<PromptRow | undefined> =>
    ipcRenderer.invoke('promptLibrary:update', id, input),
  promptLibraryDelete: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('promptLibrary:delete', id),
  promptLibraryToggleFavorite: (id: string): Promise<PromptRow | undefined> =>
    ipcRenderer.invoke('promptLibrary:toggleFavorite', id),
  promptLibraryIncrementUsage: (id: string): Promise<void> =>
    ipcRenderer.invoke('promptLibrary:incrementUsage', id),
  promptLibraryGetTags: (): Promise<string[]> =>
    ipcRenderer.invoke('promptLibrary:getTags'),
  promptLibraryGetCategories: (): Promise<string[]> =>
    ipcRenderer.invoke('promptLibrary:getCategories'),
  promptLibraryExportAll: (): Promise<PromptExport> =>
    ipcRenderer.invoke('promptLibrary:exportAll'),
  promptLibraryImportJson: (jsonString: string): Promise<{ imported: number; errors: string[] }> =>
    ipcRenderer.invoke('promptLibrary:importJson', jsonString),
  promptLibraryImportText: (text: string, format?: string, extension?: string): Promise<{ imported: number; errors: string[] }> =>
    ipcRenderer.invoke('promptLibrary:importText', text, format, extension),
  promptLibraryResolveSlashCommand: (command: string): Promise<{ content: string; label: string; isPrompt: boolean } | null> =>
    ipcRenderer.invoke('promptLibrary:resolveSlashCommand', command),

  credentialsIsAvailable: (): Promise<boolean> =>
    ipcRenderer.invoke('credentials:isAvailable'),
  credentialsMaskKey: (key: string): Promise<string> =>
    ipcRenderer.invoke('credentials:maskKey', key),

  // Routing
  routingAnalyze: (input: AnalyzePromptInput): Promise<AnalyzePromptOutput> =>
    ipcRenderer.invoke('routing:analyze', input),

  // GitHub Imports
  githubListRepos: (): Promise<ImportedRepo[]> =>
    ipcRenderer.invoke('github:listRepos'),
  githubGetRepo: (id: string): Promise<ImportedRepo | undefined> =>
    ipcRenderer.invoke('github:getRepo', id),
  githubImportRepo: (input: ImportRepoInput): Promise<ImportResult> =>
    ipcRenderer.invoke('github:importRepo', input),
  githubImportBulk: (urls: string[]): Promise<ImportResult[]> =>
    ipcRenderer.invoke('github:importBulk', urls),
  githubDeleteRepo: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('github:deleteRepo', id),
  githubIsAlreadyImported: (url: string): Promise<boolean> =>
    ipcRenderer.invoke('github:isAlreadyImported', url),
  githubListItems: (filters?: ImportItemFilter): Promise<ImportedItem[]> =>
    ipcRenderer.invoke('github:listItems', filters),
  githubGetItem: (id: string): Promise<ImportedItem | undefined> =>
    ipcRenderer.invoke('github:getItem', id),
  githubUpdateItemStatus: (id: string, status: string): Promise<ImportedItem | undefined> =>
    ipcRenderer.invoke('github:updateItemStatus', id, status),
  githubDeleteItem: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('github:deleteItem', id),
  githubGetWarnings: (itemId?: string, repoUrl?: string): Promise<ImportWarning[]> =>
    ipcRenderer.invoke('github:getWarnings', itemId, repoUrl),

  // Tools / MCP
  toolList: (): Promise<ToolRow[]> =>
    ipcRenderer.invoke('tool:list'),
  toolGet: (id: string): Promise<ToolRow | undefined> =>
    ipcRenderer.invoke('tool:get', id),
  toolCreate: (input: any): Promise<ToolRow> =>
    ipcRenderer.invoke('tool:create', input),
  toolUpdate: (id: string, input: any): Promise<ToolRow | undefined> =>
    ipcRenderer.invoke('tool:update', id, input),
  toolDelete: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('tool:delete', id),
  toolSetEnabled: (id: string, enabled: boolean): Promise<ToolRow | undefined> =>
    ipcRenderer.invoke('tool:setEnabled', id, enabled),
  toolSetTrusted: (id: string, trusted: boolean): Promise<ToolRow | undefined> =>
    ipcRenderer.invoke('tool:setTrusted', id, trusted),
  toolCheckSafety: (toolId: string, input: Record<string, unknown>): Promise<SafetyCheckResult> =>
    ipcRenderer.invoke('tool:checkSafety', toolId, input),
  toolExecute: (toolId: string, input: Record<string, unknown>): Promise<ToolExecuteResult> =>
    ipcRenderer.invoke('tool:execute', toolId, input),
  toolGetCallLogs: (toolId?: string): Promise<ToolCallLog[]> =>
    ipcRenderer.invoke('tool:getCallLogs', toolId),

  // Projects
  projectList: (includeArchived?: boolean, search?: string): Promise<ProjectRow[]> =>
    ipcRenderer.invoke('project:list', includeArchived, search),
  projectGet: (id: string): Promise<ProjectRow | undefined> =>
    ipcRenderer.invoke('project:get', id),
  projectCreate: (input: NewProject): Promise<ProjectRow> =>
    ipcRenderer.invoke('project:create', input),
  projectUpdate: (id: string, input: ProjectUpdate): Promise<ProjectRow | undefined> =>
    ipcRenderer.invoke('project:update', id, input),
  projectDelete: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('project:delete', id),
  projectArchive: (id: string): Promise<ProjectRow | undefined> =>
    ipcRenderer.invoke('project:archive', id),
  projectRestore: (id: string): Promise<ProjectRow | undefined> =>
    ipcRenderer.invoke('project:restore', id),
  projectSelectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('project:selectFolder'),
  projectGetFileTree: (rootPath: string, options?: FileTreeOptions): Promise<FileTreeNode[]> =>
    ipcRenderer.invoke('project:getFileTree', rootPath, options),
  projectGetContext: (projectId: string, selectedFilePaths: string[]): Promise<ProjectContext | null> =>
    ipcRenderer.invoke('project:getContext', projectId, selectedFilePaths),
  projectIsPathIgnored: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('project:isPathIgnored', filePath),

  // Logs & Debug
  logWrite: (input: { level: string; category: string; message: string; metadata?: Record<string, unknown>; chatId?: string; projectId?: string }): Promise<AppLogRow> =>
    ipcRenderer.invoke('log:write', input),
  logQuery: (filter: LogFilter): Promise<AppLogRow[]> =>
    ipcRenderer.invoke('log:query', filter),
  logCount: (filter: LogFilter): Promise<number> =>
    ipcRenderer.invoke('log:count', filter),
  logGet: (id: string): Promise<AppLogRow | undefined> =>
    ipcRenderer.invoke('log:get', id),
  logCategories: (): Promise<string[]> =>
    ipcRenderer.invoke('log:categories'),
  logClear: (): Promise<number> =>
    ipcRenderer.invoke('log:clear'),
  logClearToolCallLogs: (): Promise<number> =>
    ipcRenderer.invoke('log:clearToolCallLogs'),
  logClearImportLogs: (): Promise<number> =>
    ipcRenderer.invoke('log:clearImportLogs'),
  logExportDebugBundle: (): Promise<DebugBundle> =>
    ipcRenderer.invoke('log:exportDebugBundle')
}

// Expose the API in the main world
contextBridge.exposeInMainWorld('api', api)

// Export type for use in renderer
export type IpcApi = typeof api
