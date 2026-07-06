export interface IpcApi {
  chatList: (includeArchived?: boolean) => Promise<import('../shared/types/chat').ChatListItem[]>
  chatGet: (id: string) => Promise<import('../shared/types/chat').ChatWithMessages | undefined>
  chatCreate: (input: import('../shared/types/chat').NewChat) => Promise<import('../shared/types/chat').ChatRow>
  chatUpdate: (id: string, updates: Partial<import('../shared/types/chat').ChatRow>) => Promise<import('../shared/types/chat').ChatRow | undefined>
  chatDelete: (id: string) => Promise<boolean>
  chatArchive: (id: string) => Promise<import('../shared/types/chat').ChatRow | undefined>
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
  githubListItems: (filters?: import('../shared/types/github').ImportItemFilter) => Promise<import('../shared/types/github').ImportedItem[]>
  githubGetItem: (id: string) => Promise<import('../shared/types/github').ImportedItem | undefined>
  githubUpdateItemStatus: (id: string, status: string) => Promise<import('../shared/types/github').ImportedItem | undefined>
  githubDeleteItem: (id: string) => Promise<boolean>
  githubGetWarnings: (itemId?: string, repoUrl?: string) => Promise<import('../shared/types/github').ImportWarning[]>
}

declare global {
  interface Window {
    api: IpcApi
  }
}
