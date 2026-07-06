import { contextBridge, ipcRenderer } from 'electron'
import type { ChatRow, ChatWithMessages, ChatListItem, NewChat, NewMessage, MessageRow } from '../shared/types/chat'
import type { SystemPromptRow, NewSystemPrompt, PromptRow, NewPrompt } from '../shared/types/prompt'
import type { ProviderAdapterInfo } from '../shared/types/provider'
import type { AppSettings } from '../shared/types/settings'

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
  systemPromptList: (): Promise<SystemPromptRow[]> =>
    ipcRenderer.invoke('systemPrompt:list'),
  systemPromptGet: (id: string): Promise<SystemPromptRow | undefined> =>
    ipcRenderer.invoke('systemPrompt:get', id),
  systemPromptGetDefault: (): Promise<SystemPromptRow | undefined> =>
    ipcRenderer.invoke('systemPrompt:getDefault'),
  systemPromptCreate: (input: NewSystemPrompt): Promise<SystemPromptRow> =>
    ipcRenderer.invoke('systemPrompt:create', input),
  systemPromptUpdate: (id: string, input: Partial<NewSystemPrompt>): Promise<SystemPromptRow | undefined> =>
    ipcRenderer.invoke('systemPrompt:update', id, input),
  systemPromptDelete: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('systemPrompt:delete', id),

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
  promptLibraryList: (filters?: { search?: string; tags?: string[]; category?: string }): Promise<PromptRow[]> =>
    ipcRenderer.invoke('promptLibrary:list', filters),
  promptLibraryGet: (id: string): Promise<PromptRow | undefined> =>
    ipcRenderer.invoke('promptLibrary:get', id),
  promptLibraryCreate: (input: NewPrompt): Promise<PromptRow> =>
    ipcRenderer.invoke('promptLibrary:create', input),
  promptLibraryUpdate: (id: string, input: Partial<NewPrompt>): Promise<PromptRow | undefined> =>
    ipcRenderer.invoke('promptLibrary:update', id, input),
  promptLibraryDelete: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('promptLibrary:delete', id),
  promptLibraryGetTags: (): Promise<string[]> =>
    ipcRenderer.invoke('promptLibrary:getTags'),
  promptLibraryGetCategories: (): Promise<string[]> =>
    ipcRenderer.invoke('promptLibrary:getCategories'),
  credentialsIsAvailable: (): Promise<boolean> =>
    ipcRenderer.invoke('credentials:isAvailable'),
  credentialsMaskKey: (key: string): Promise<string> =>
    ipcRenderer.invoke('credentials:maskKey', key)
}

// Expose the API in the main world
contextBridge.exposeInMainWorld('api', api)

// Export type for use in renderer
export type IpcApi = typeof api
