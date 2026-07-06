// Shared provider/model types

export interface ProviderRow {
  id: string
  name: string
  slug: string
  adapter: string
  base_url: string | null
  api_key_enc: string | null
  is_enabled: number
  created_at: string
  updated_at: string
}

export interface ModelRow {
  id: string
  provider_id: string
  name: string
  display_name: string
  context_window: number | null
  is_default: number
  is_enabled: number
  created_at: string
  capabilities?: string | null
}

export interface NewProvider {
  name: string
  slug: string
  adapter: string
  base_url?: string
}

export interface ProviderAdapterInfo {
  slug: string
  name: string
  description: string
  defaultBaseUrl: string
  defaultModels: { name: string; displayName: string; contextWindow: number }[]
  authType: 'api_key' | 'oauth' | 'none'
  capabilities: ProviderCapability[]
}

export type ProviderCapability = 'text' | 'vision' | 'tool_use' | 'streaming' | 'json_mode' | 'embeddings' | 'local'
