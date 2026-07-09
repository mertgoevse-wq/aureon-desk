export interface IpcApi {
  chatList: (includeArchived?: boolean) => Promise<import('../shared/types/chat').ChatListItem[]>
  chatGet: (id: string) => Promise<import('../shared/types/chat').ChatWithMessages | undefined>
  chatCreate: (input: import('../shared/types/chat').NewChat) => Promise<import('../shared/types/chat').ChatRow>
  chatUpdate: (id: string, updates: Partial<import('../shared/types/chat').ChatRow>) => Promise<import('../shared/types/chat').ChatRow | undefined>
  chatDelete: (id: string) => Promise<boolean>
  chatArchive: (id: string) => Promise<import('../shared/types/chat').ChatRow | undefined>
  chatSend: (chatId: string, expectedModelId?: string | null) => Promise<import('../shared/types/chat').ChatSendResult>
  messageList: (chatId: string) => Promise<import('../shared/types/chat').MessageRow[]>
  messageAdd: (input: import('../shared/types/chat').NewMessage) => Promise<import('../shared/types/chat').MessageRow>
  messageUpdate: (id: string, content: string) => Promise<import('../shared/types/chat').MessageRow | undefined>
  messageDelete: (id: string) => Promise<boolean>
  messageClear: (chatId: string) => Promise<boolean>
  systemPromptList: (includeArchived?: boolean) => Promise<import('../shared/types/prompt').SystemPromptRow[]>
  systemPromptGet: (id: string) => Promise<import('../shared/types/prompt').SystemPromptRow | undefined>
  systemPromptGetDefault: () => Promise<import('../shared/types/prompt').SystemPromptRow | undefined>
  systemPromptCreate: (input: import('../shared/types/prompt').NewSystemPrompt) => Promise<import('../shared/types/prompt').SystemPromptRow>
  systemPromptUpdate: (id: string, input: Partial<import('../shared/types/prompt').NewSystemPrompt & { is_archived?: boolean }>) => Promise<import('../shared/types/prompt').SystemPromptRow | undefined>
  systemPromptDelete: (id: string) => Promise<boolean>
  systemPromptArchive: (id: string) => Promise<import('../shared/types/prompt').SystemPromptRow | undefined>
  systemPromptRestore: (id: string) => Promise<import('../shared/types/prompt').SystemPromptRow | undefined>
  systemPromptDuplicate: (id: string) => Promise<import('../shared/types/prompt').SystemPromptRow | undefined>
  systemPromptResolveHierarchy: (input: import('../shared/types/prompt').HierarchyInput) => Promise<import('../shared/types/prompt').ResolvedPrompt>
  systemPromptValidateSecrets: (content: string) => Promise<{ hasSecrets: boolean; matches: string[] }>
  systemPromptValidateToolBypass: (content: string) => Promise<boolean>
  promptLibraryList: (filters?: { search?: string; tags?: string[]; category?: string; favoritesOnly?: boolean }) => Promise<import('../shared/types/prompt').PromptRow[]>
  promptLibraryGet: (id: string) => Promise<import('../shared/types/prompt').PromptRow | undefined>
  promptLibraryCreate: (input: import('../shared/types/prompt').NewPrompt) => Promise<import('../shared/types/prompt').PromptRow>
  promptLibraryUpdate: (id: string, input: Partial<import('../shared/types/prompt').NewPrompt>) => Promise<import('../shared/types/prompt').PromptRow | undefined>
  promptLibraryDelete: (id: string) => Promise<boolean>
  promptLibraryToggleFavorite: (id: string) => Promise<import('../shared/types/prompt').PromptRow | undefined>
  promptLibraryIncrementUsage: (id: string) => Promise<void>
  promptLibraryGetTags: () => Promise<string[]>
  promptLibraryGetCategories: () => Promise<string[]>
  promptLibraryExportAll: () => Promise<import('../shared/types/prompt').PromptExport>
  promptLibraryImportJson: (jsonString: string) => Promise<{ imported: number; errors: string[] }>
  promptLibraryImportText: (text: string, format?: string, extension?: string) => Promise<{ imported: number; errors: string[] }>
  promptLibraryResolveSlashCommand: (command: string) => Promise<{ content: string; label: string; isPrompt: boolean } | null>
  providerList: () => Promise<any[]>
  providerGet: (id: string) => Promise<any>
  providerAdapters: () => Promise<import('../shared/types/provider').ProviderAdapterInfo[]>
  providerSetApiKey: (providerId: string, apiKey: string) => Promise<boolean>
  providerDeleteApiKey: (providerId: string) => Promise<boolean>
  providerHasApiKey: (providerId: string) => Promise<boolean>
  providerToggleEnabled: (providerId: string, enabled: boolean) => Promise<boolean>
  providerSetBaseUrl: (providerId: string, baseUrl: string) => Promise<boolean>
  providerModels: (providerId: string) => Promise<any[]>
  providerCreateFromAdapter: (adapterSlug: string) => Promise<any>
  providerCreateCustom: (input: { name: string; slug: string; baseUrl: string; apiKey?: string }) => Promise<any>
  providerDelete: (providerId: string) => Promise<boolean>
  providerTestConnection: (providerId: string) => Promise<{ success: boolean; message: string }>
  providerSetDefaultModel: (providerId: string, modelId: string) => Promise<boolean>
  modelAllEnabled: () => Promise<any[]>
  modelToggleEnabled: (modelId: string, enabled: boolean) => Promise<boolean>
  settingsGet: (key: string) => Promise<string | null>
  settingsSet: (key: string, value: string) => Promise<boolean>
  settingsGetAll: () => Promise<Record<string, string>>
  settingsGetDefaults: () => Promise<import('../shared/types/settings').AppSettings>
  credentialsIsAvailable: () => Promise<boolean>
  credentialsMaskKey: (key: string) => Promise<string>
  routingAnalyze: (input: import('../shared/types/routing').AnalyzePromptInput) => Promise<import('../shared/types/routing').AnalyzePromptOutput>
  githubListRepos: () => Promise<import('../shared/types/github').ImportedRepo[]>
  githubGetRepo: (id: string) => Promise<import('../shared/types/github').ImportedRepo | undefined>
  githubImportRepo: (input: import('../shared/types/github').ImportRepoInput) => Promise<import('../shared/types/github').ImportResult>
  githubImportBulk: (urls: string[]) => Promise<import('../shared/types/github').ImportResult[]>
  githubDeleteRepo: (id: string) => Promise<boolean>
  githubIsAlreadyImported: (url: string) => Promise<boolean>
  githubRetryImport: (repoId: string) => Promise<import('../shared/types/github').ImportResult>
  githubListItems: (filters?: import('../shared/types/github').ImportItemFilter) => Promise<import('../shared/types/github').ImportedItem[]>
  githubGetItem: (id: string) => Promise<import('../shared/types/github').ImportedItem | undefined>
  githubUpdateItemStatus: (id: string, status: string) => Promise<import('../shared/types/github').ImportedItem | undefined>
  githubDeleteItem: (id: string) => Promise<boolean>
  githubGetWarnings: (itemId?: string, repoUrl?: string) => Promise<import('../shared/types/github').ImportWarning[]>
  githubApproveItem: (id: string, approveAs: string) => Promise<{ success: boolean; newId?: string; error?: string }>
  previewCreateSandbox: (input?: { templateType?: string; port?: number }) => Promise<{ success: boolean; sandboxPath: string; error?: string }>
  previewStart: (sandboxPath: string, port?: number) => Promise<any>
  previewStop: () => Promise<any>
  previewStatus: () => Promise<any>
  previewWriteFile: (sandboxPath: string, relativePath: string, content: string) => Promise<{ success: boolean; error?: string }>
  previewListSandboxes: () => Promise<Array<{ id: string; path: string; createdAt: string }>>
  previewCleanup: (maxAgeHours?: number) => Promise<number>
  previewCreateDemo: (port?: number, style?: string) => Promise<any>
  previewStartGenerated: (input: {
    source: 'studio-build-app' | 'code-demo' | 'manual'
    files?: Record<string, string>
    entryFile?: string
    style?: string
    port?: number
    autoOpenCodeMode?: boolean
    autoFocusPreview?: boolean
  }) => Promise<any>
  /** Subscribe to push-based preview status changes. Returns cleanup fn. */
  onPreviewStatusChange: (callback: (status: any) => void) => () => void
  toolList: () => Promise<import('../shared/types/tool').ToolRow[]>
  toolGet: (id: string) => Promise<import('../shared/types/tool').ToolRow | undefined>
  toolCreate: (input: any) => Promise<import('../shared/types/tool').ToolRow>
  toolUpdate: (id: string, input: any) => Promise<import('../shared/types/tool').ToolRow | undefined>
  toolDelete: (id: string) => Promise<boolean>
  toolSetEnabled: (id: string, enabled: boolean) => Promise<import('../shared/types/tool').ToolRow | undefined>
  toolSetTrusted: (id: string, trusted: boolean) => Promise<import('../shared/types/tool').ToolRow | undefined>
  toolCheckSafety: (toolId: string, input: Record<string, unknown>) => Promise<import('../shared/types/tool').SafetyCheckResult>
  toolExecute: (toolId: string, input: Record<string, unknown>) => Promise<import('../shared/types/tool').ToolExecuteResult>
  toolGetCallLogs: (toolId?: string) => Promise<import('../shared/types/tool').ToolCallLog[]>
  projectList: (includeArchived?: boolean, search?: string) => Promise<import('../shared/types/project').ProjectRow[]>
  projectGet: (id: string) => Promise<import('../shared/types/project').ProjectRow | undefined>
  projectCreate: (input: import('../shared/types/project').NewProject) => Promise<import('../shared/types/project').ProjectRow>
  projectUpdate: (id: string, input: import('../shared/types/project').ProjectUpdate) => Promise<import('../shared/types/project').ProjectRow | undefined>
  projectDelete: (id: string) => Promise<boolean>
  projectArchive: (id: string) => Promise<import('../shared/types/project').ProjectRow | undefined>
  projectRestore: (id: string) => Promise<import('../shared/types/project').ProjectRow | undefined>
  projectSelectFolder: () => Promise<string | null>
  projectGetFileTree: (rootPath: string, options?: import('../shared/types/project').FileTreeOptions) => Promise<import('../shared/types/project').FileTreeNode[]>
  projectGetContext: (projectId: string, selectedFilePaths: string[]) => Promise<import('../shared/types/project').ProjectContext | null>
  projectIsPathIgnored: (filePath: string) => Promise<boolean>
  logWrite: (input: { level: string; category: string; message: string; metadata?: Record<string, unknown>; chatId?: string; projectId?: string }) => Promise<import('../shared/types/log').AppLogRow>
  logQuery: (filter: import('../shared/types/log').LogFilter) => Promise<import('../shared/types/log').AppLogRow[]>
  logCount: (filter: import('../shared/types/log').LogFilter) => Promise<number>
  logGet: (id: string) => Promise<import('../shared/types/log').AppLogRow | undefined>
  logCategories: () => Promise<string[]>
  logClear: () => Promise<number>
  logClearToolCallLogs: () => Promise<number>
  logClearImportLogs: () => Promise<number>
  logExportDebugBundle: () => Promise<import('../shared/types/log').DebugBundle>
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void
  windowIsMaximized: () => Promise<boolean>
  onMaximizedState: (callback: (maximized: boolean) => void) => () => void
  studioOrchestrate: (input: import('../shared/types/studio-core').StudioIntentInput) => Promise<import('../shared/types/studio-core').StudioOrchestrationResult>
  studioTaskCategories: () => Promise<import('../shared/types/studio-core').TaskCategoryInfo[]>
  studioCapabilities: () => Promise<import('../shared/types/studio-core').CapabilityDefinition[]>
  studioAutonomyLevels: () => Promise<import('../shared/types/studio-core').AutonomyLevelInfo[]>
}

declare global {
  interface Window {
    api: IpcApi
  }
}
