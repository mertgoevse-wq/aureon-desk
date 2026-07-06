import { v4 as uuid } from 'uuid'
import { getDb } from '../db/connection'
import { providers, models } from '../db/schema'
import { vault } from '../security/vault'
import { logger } from '../utils/logger'
import type { ProviderRow, ModelRow, NewProvider } from '../../shared/types/provider'
import { eq } from 'drizzle-orm'

export const providerService = {
  /** List all providers with their models */
  listProviders(): (ProviderRow & { models: ModelRow[] })[] {
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

  /** Get enabled models for a provider */
  getModels(providerId: string): ModelRow[] {
    const db = getDb()
    return db.select().from(models)
      .where(eq(models.provider_id, providerId))
      .all() as ModelRow[]
  },

  /** Get all enabled models across all enabled providers */
  getAllEnabledModels(): (ModelRow & { provider_name: string; provider_slug: string })[] {
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
  }
}
