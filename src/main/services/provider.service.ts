import { v4 as uuid } from 'uuid'
import { getDb } from '../db/connection'
import { providers, models } from '../db/schema'
import { vault } from '../security/vault'
import { logger } from '../utils/logger'
import type { ProviderRow, ModelRow, NewProvider, ProviderAdapterInfo } from '../../shared/types/provider'
import { PROVIDER_ADAPTERS } from '../../shared/constants'
import { eq } from 'drizzle-orm'

export const providerService = {
  /** Ensure built-in provider rows exist, including for older local databases. */
  ensureDefaultProviders(): void {
    const db = getDb()
    for (const adapter of PROVIDER_ADAPTERS) {
      const existing = db.select({ id: providers.id })
        .from(providers)
        .where(eq(providers.slug, adapter.slug))
        .get()

      if (!existing) {
        this.createFromAdapter(adapter)
      }
    }
  },

  /** List all providers with their models */
  listProviders(): (ProviderRow & { models: ModelRow[] })[] {
    this.ensureDefaultProviders()

    const db = getDb()
    const allProviders = db.select().from(providers).all() as ProviderRow[]
    const allModels = db.select().from(models).all() as ModelRow[]

    return allProviders.map(provider => ({
      ...provider,
      models: allModels.filter(m => m.provider_id === provider.id)
    }))
  },

  /** Get a single provider by ID */
  getProvider(id: string): (ProviderRow & { models: ModelRow[] }) | undefined {
    const db = getDb()
    const provider = db.select().from(providers)
      .where(eq(providers.id, id))
      .get() as ProviderRow | undefined

    if (!provider) return undefined

    const providerModels = db.select().from(models)
      .where(eq(models.provider_id, provider.id))
      .all() as ModelRow[]

    return { ...provider, models: providerModels }
  },

  /** Set (encrypt and store) API key for a provider */
  setApiKey(providerId: string, apiKey: string): void {
    const db = getDb()
    const encrypted = vault.encryptToBase64(apiKey)
    const now = new Date().toISOString()

    db.update(providers)
      .set({ api_key_enc: encrypted, updated_at: now } as never)
      .where(eq(providers.id, providerId))
      .run()

    logger.info(`API key stored for provider ${providerId}`)
  },

  /** Get decrypted API key for a provider (use with caution) */
  getApiKey(providerId: string): string | null {
    const db = getDb()
    const provider = db.select({ api_key_enc: providers.api_key_enc })
      .from(providers)
      .where(eq(providers.id, providerId))
      .get() as { api_key_enc: string | null } | undefined

    if (!provider?.api_key_enc) return null

    try {
      return vault.decryptFromBase64(provider.api_key_enc)
    } catch (err) {
      logger.error(`Failed to decrypt API key for provider ${providerId}`, err)
      return null
    }
  },

  /** Get masked API key (first 8 + last 4 chars) */
  getMaskedApiKey(providerId: string): string | null {
    const key = this.getApiKey(providerId)
    if (!key) return null
    return vault.maskKey(key)
  },

  /** Delete API key for a provider */
  deleteApiKey(providerId: string): void {
    const db = getDb()
    const now = new Date().toISOString()

    db.update(providers)
      .set({ api_key_enc: null, updated_at: now } as never)
      .where(eq(providers.id, providerId))
      .run()

    logger.info(`API key removed for provider ${providerId}`)
  },

  /** Toggle provider enabled/disabled */
  setProviderEnabled(providerId: string, enabled: boolean): void {
    const db = getDb()
    const now = new Date().toISOString()

    db.update(providers)
      .set({ is_enabled: enabled ? 1 : 0, updated_at: now } as never)
      .where(eq(providers.id, providerId))
      .run()
  },

  /** Set provider base URL */
  setBaseUrl(providerId: string, baseUrl: string): void {
    const db = getDb()
    const now = new Date().toISOString()

    db.update(providers)
      .set({ base_url: baseUrl, updated_at: now } as never)
      .where(eq(providers.id, providerId))
      .run()
  },

  /** Create a provider from an adapter definition (seeds models too) */
  createFromAdapter(adapter: ProviderAdapterInfo): ProviderRow {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuid()

    // Check if already exists
    const existing = db.select({ id: providers.id })
      .from(providers)
      .where(eq(providers.slug, adapter.slug))
      .get()
    if (existing) {
      throw new Error(`Provider ${adapter.slug} already exists`)
    }

    db.insert(providers).values({
      id,
      name: adapter.name,
      slug: adapter.slug,
      adapter: adapter.slug,
      base_url: adapter.defaultBaseUrl,
      api_key_enc: null,
      is_enabled: 1,
      created_at: now,
      updated_at: now
    } as never).run()

    // Seed default models
    for (const modelDef of adapter.defaultModels) {
      db.insert(models).values({
        id: uuid(),
        provider_id: id,
        name: modelDef.name,
        display_name: modelDef.displayName,
        context_window: modelDef.contextWindow,
        is_default: 0,
        is_enabled: 1,
        created_at: now
      } as never).run()
    }

    logger.info(`Created provider from adapter: ${adapter.name}`)
    return this.getProvider(id)!
  },

  /** Create a custom provider with user-specified details */
  createCustomProvider(input: { name: string; slug: string; baseUrl: string; apiKey?: string }): ProviderRow {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuid()

    // Check slug uniqueness
    const existing = db.select({ id: providers.id })
      .from(providers)
      .where(eq(providers.slug, input.slug))
      .get()
    if (existing) throw new Error(`Provider slug "${input.slug}" already exists`)

    db.insert(providers).values({
      id, name: input.name, slug: input.slug, adapter: 'custom',
      base_url: input.baseUrl || 'http://localhost:8000/v1',
      api_key_enc: null, is_enabled: 1, created_at: now, updated_at: now
    } as never).run()

    // Seed a generic model
    db.insert(models).values({
      id: uuid(), provider_id: id, name: 'custom-model',
      display_name: 'Custom Model', context_window: 128000,
      is_default: 1, is_enabled: 1, created_at: now
    } as never).run()

    // Store API key if provided
    if (input.apiKey) {
      this.setApiKey(id, input.apiKey)
    }

    logger.info(`Created custom provider: ${input.name}`)
    return this.getProvider(id)!
  },

  /** Delete a provider (cascade deletes models) */
  deleteProvider(providerId: string): boolean {
    const db = getDb()
    // Delete models first (cascade)
    db.delete(models).where(eq(models.provider_id, providerId)).run()
    const result = db.delete(providers).where(eq(providers.id, providerId)).run()
    logger.info(`Deleted provider: ${providerId}`)
    return result.changes > 0
  },

  /** Test connection to a provider by making a health/status check */
  async testConnection(providerId: string): Promise<{ success: boolean; message: string }> {
    const provider = this.getProvider(providerId)
    if (!provider) return { success: false, message: 'Provider not found' }

    const apiKey = this.getApiKey(providerId)
    const baseUrl = provider.base_url || ''

    // For Ollama, use /api/tags to check connection
    if (provider.adapter === 'ollama') {
      try {
        const ollamaBase = baseUrl.replace(/\/v1\/?$/, '')
        const response = await fetch(`${ollamaBase}/api/tags`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        })
        if (response.ok) {
          const data = await response.json() as { models?: Array<{ name: string }> }
          const modelCount = data.models?.length || 0
          try {
            await this.syncOllamaModels()
          } catch (syncErr) {
            logger.error('Failed to auto-sync Ollama models during test', syncErr)
          }
          return {
            success: true,
            message: `Connected to ${provider.name}${modelCount > 0 ? ` (${modelCount} model${modelCount !== 1 ? 's' : ''} available)` : ''}`
          }
        }
        return { success: false, message: `${provider.name} returned status ${response.status}` }
      } catch (err) {
        const msg = String(err)
        if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
          return { success: false, message: `Ollama is not running. Start it with "ollama serve" or install from https://ollama.com` }
        }
        return { success: false, message: `Cannot reach ${provider.name} at ${baseUrl}` }
      }
    }

    // For LM Studio, check /v1/models
    if (provider.adapter === 'lmstudio') {
      try {
        const response = await fetch(`${baseUrl}/models`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        })
        if (response.ok) {
          const data = await response.json() as { data?: Array<{ id: string }> }
          const modelCount = data.data?.length || 0
          try {
            await this.syncLMStudioModels()
          } catch (syncErr) {
            logger.error('Failed to auto-sync LM Studio models during test', syncErr)
          }
          return {
            success: true,
            message: `Connected to ${provider.name}${modelCount > 0 ? ` (${modelCount} model${modelCount !== 1 ? 's' : ''} loaded)` : ''}`
          }
        }
        return { success: false, message: `${provider.name} returned status ${response.status}` }
      } catch (err) {
        const msg = String(err)
        if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
          return { success: false, message: `LM Studio is not running. Start it from https://lmstudio.ai and load a model.` }
        }
        return { success: false, message: `Cannot reach ${provider.name} at ${baseUrl}` }
      }
    }

    // For remote providers, check if API key is configured
    if (!apiKey) {
      return { success: false, message: `No API key configured for ${provider.name}` }
    }

    // Try a simple models endpoint
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (provider.adapter === 'anthropic') {
        headers['x-api-key'] = apiKey
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        if (provider.adapter === 'openrouter') {
          try {
            await this.syncOpenRouterModels()
          } catch (syncErr) {
            logger.error('Failed to auto-sync OpenRouter models during test', syncErr)
          }
        }
        return { success: true, message: `Connected to ${provider.name}` }
      }
      // Some providers don't have /models endpoint, try a different check
      if (response.status === 401 || response.status === 403) {
        return { success: false, message: `Authentication failed for ${provider.name}. Check your API key.` }
      }
      return { success: true, message: `${provider.name} responded (status ${response.status})` }
    } catch (err) {
      return { success: false, message: `Cannot reach ${provider.name} at ${baseUrl}: ${String(err)}` }
    }
  },

  /** Set a model as default for its provider */
  setDefaultModel(providerId: string, modelId: string): void {
    const db = getDb()
    // Unset all defaults for this provider
    db.update(models)
      .set({ is_default: 0 } as never)
      .where(eq(models.provider_id, providerId))
      .run()
    // Set the selected one
    db.update(models)
      .set({ is_default: 1 } as never)
      .where(eq(models.id, modelId))
      .run()
    logger.info(`Set default model ${modelId} for provider ${providerId}`)
  },

  /** Get enabled models for a provider */
  getModels(providerId: string): ModelRow[] {
    const db = getDb()
    return db.select().from(models)
      .where(eq(models.provider_id, providerId))
      .all() as ModelRow[]
  },

  /** Get all enabled models across all enabled providers */
  getAllEnabledModels(): (ModelRow & { provider_name: string; provider_slug: string })[] {
    this.ensureDefaultProviders()

    const db = getDb()
    const enabledProviders = db.select()
      .from(providers)
      .where(eq(providers.is_enabled, 1))
      .all() as ProviderRow[]

    const allModels = db.select().from(models).all() as ModelRow[]
    const providerMap = new Map(enabledProviders.map(p => [p.id, p]))

    return allModels
      .filter(m => providerMap.has(m.provider_id))
      .map(m => ({
        ...m,
        provider_name: providerMap.get(m.provider_id)!.name,
        provider_slug: providerMap.get(m.provider_id)!.slug
      }))
  },

  /** Toggle model enabled/disabled */
  setModelEnabled(modelId: string, enabled: boolean): void {
    const db = getDb()
    db.update(models)
      .set({ is_enabled: enabled ? 1 : 0 } as never)
      .where(eq(models.id, modelId))
      .run()
  },

  /**
   * Fetch available models from Ollama's /api/tags endpoint.
   * Returns model names that can be used for completion.
   */
  async fetchOllamaModels(baseUrl?: string): Promise<Array<{ name: string; size: number }>> {
    const url = `${baseUrl || 'http://localhost:11434'}/api/tags`

    logger.info(`Fetching Ollama models from ${url}`)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`)
      }

      const data = await response.json() as { models?: Array<{ name: string; size: number }> }
      return data.models || []
    } catch (err) {
      const msg = String(err)
      if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
        logger.warn('Ollama server is not running or unreachable')
        return []
      }
      logger.error('Failed to fetch Ollama models', err instanceof Error ? err : msg)
      return []
    }
  },

  /**
   * Sync models from Ollama's /api/tags endpoint.
   * Adds any models not already in the database for the Ollama provider.
   */
  async syncOllamaModels(): Promise<{ added: number; total: number }> {
    const db = getDb()
    const now = new Date().toISOString()

    // Find the Ollama provider
    const ollamaProvider = db.select().from(providers)
      .where(eq(providers.slug, 'ollama'))
      .get() as ProviderRow | undefined

    if (!ollamaProvider) {
      logger.warn('Ollama provider not found in database')
      return { added: 0, total: 0 }
    }

    // Fetch models from Ollama
    const baseUrl = ollamaProvider.base_url || 'http://localhost:11434/v1'
    const ollamaBase = baseUrl.replace(/\/v1\/?$/, '')

    let ollamaModels: Array<{ name: string; size: number }> = []
    try {
      const response = await fetch(`${ollamaBase}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        logger.warn(`Ollama /api/tags returned status ${response.status}`)
        return { added: 0, total: 0 }
      }

      const data = await response.json() as { models?: Array<{ name: string; size: number }> }
      ollamaModels = data.models || []
    } catch (err) {
      logger.warn('Failed to fetch Ollama models', err instanceof Error ? err.message : String(err))
      return { added: 0, total: 0 }
    }

    // Get existing models for this provider
    const existingModels = db.select()
      .from(models)
      .where(eq(models.provider_id, ollamaProvider.id))
      .all() as ModelRow[]

    const existingNames = new Set(existingModels.map(m => m.name))
    let added = 0

    for (const om of ollamaModels) {
      if (!existingNames.has(om.name)) {
        db.insert(models).values({
          id: uuid(),
          provider_id: ollamaProvider.id,
          name: om.name,
          display_name: om.name,
          context_window: 128000,
          is_default: existingModels.length === 0 && added === 0 ? 1 : 0,
          is_enabled: 1,
          created_at: now
        } as never).run()
        added++
      }
    }

    logger.info(`Synced Ollama models: ${added} added, ${ollamaModels.length} total available`)
    return { added, total: ollamaModels.length }
  },

  /**
   * Sync models from LM Studio's /v1/models endpoint.
   * Adds any models not already in the database for the LM Studio provider.
   */
  async syncLMStudioModels(): Promise<{ added: number; total: number }> {
    const db = getDb()
    const now = new Date().toISOString()

    // Find the LM Studio provider
    const lmStudioProvider = db.select().from(providers)
      .where(eq(providers.slug, 'lmstudio'))
      .get() as ProviderRow | undefined

    if (!lmStudioProvider) {
      logger.warn('LM Studio provider not found in database')
      return { added: 0, total: 0 }
    }

    // Fetch models from LM Studio
    const baseUrl = lmStudioProvider.base_url || 'http://localhost:1234/v1'

    let lmStudioModels: Array<{ id: string }> = []
    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        logger.warn(`LM Studio /models returned status ${response.status}`)
        return { added: 0, total: 0 }
      }

      const data = await response.json() as { data?: Array<{ id: string }> }
      lmStudioModels = data.data || []
    } catch (err) {
      logger.warn('Failed to fetch LM Studio models', err instanceof Error ? err.message : String(err))
      return { added: 0, total: 0 }
    }

    // Get existing models for this provider
    const existingModels = db.select()
      .from(models)
      .where(eq(models.provider_id, lmStudioProvider.id))
      .all() as ModelRow[]

    const existingNames = new Set(existingModels.map(m => m.name))
    let added = 0

    for (const lm of lmStudioModels) {
      if (!existingNames.has(lm.id)) {
        db.insert(models).values({
          id: uuid(),
          provider_id: lmStudioProvider.id,
          name: lm.id,
          display_name: lm.id,
          context_window: 128000,
          is_default: existingModels.length === 0 && added === 0 ? 1 : 0,
          is_enabled: 1,
          created_at: now
        } as never).run()
        added++
      }
    }

    logger.info(`Synced LM Studio models: ${added} added, ${lmStudioModels.length} total available`)
    return { added, total: lmStudioModels.length }
  },

  /**
   * Sync models from OpenRouter's /models endpoint.
   * Adds any models not already in the database for the OpenRouter provider.
   */
  async syncOpenRouterModels(): Promise<{ added: number; total: number }> {
    const db = getDb()
    const now = new Date().toISOString()

    // Find the OpenRouter provider
    const openRouterProvider = db.select().from(providers)
      .where(eq(providers.slug, 'openrouter'))
      .get() as ProviderRow | undefined

    if (!openRouterProvider) {
      logger.warn('OpenRouter provider not found in database')
      return { added: 0, total: 0 }
    }

    const baseUrl = openRouterProvider.base_url || 'https://openrouter.ai/api/v1'

    let openRouterModels: Array<{ id: string; name?: string }> = []
    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        logger.warn(`OpenRouter /models returned status ${response.status}`)
        return { added: 0, total: 0 }
      }

      const data = await response.json() as { data?: Array<{ id: string; name?: string }> }
      openRouterModels = data.data || []
    } catch (err) {
      logger.warn('Failed to fetch OpenRouter models', err instanceof Error ? err.message : String(err))
      return { added: 0, total: 0 }
    }

    // Get existing models for this provider
    const existingModels = db.select()
      .from(models)
      .where(eq(models.provider_id, openRouterProvider.id))
      .all() as ModelRow[]

    const existingNames = new Set(existingModels.map(m => m.name))
    let added = 0

    for (const om of openRouterModels) {
      if (!existingNames.has(om.id)) {
        db.insert(models).values({
          id: uuid(),
          provider_id: openRouterProvider.id,
          name: om.id,
          display_name: om.name || om.id,
          context_window: 128000,
          is_default: 0,
          is_enabled: 1,
          created_at: now
        } as never).run()
        added++
      }
    }

    logger.info(`Synced OpenRouter models: ${added} added, ${openRouterModels.length} total available`)
    return { added, total: openRouterModels.length }
  },
}
