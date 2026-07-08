import { v4 as uuid } from 'uuid'
import { getDb } from './connection'
import { providers, models, systemPrompts } from './schema'
import { PROVIDER_ADAPTERS } from '../../shared/constants'
import { logger } from '../utils/logger'
import { toolService } from '../services/tool.service'
import { eq, and } from 'drizzle-orm'

/**
 * Seed default providers, models, and a default system prompt.
 * Safe to run multiple times - uses INSERT OR IGNORE patterns.
 */
export async function seed(): Promise<void> {
  const db = getDb()
  const now = new Date().toISOString()

  logger.info('Seeding database...')

  // Seed providers and their default models
  for (const adapter of PROVIDER_ADAPTERS) {
    // Check if provider already exists
    const existing = db.select({ id: providers.id })
      .from(providers)
      .where(eq(providers.slug, adapter.slug))
      .get()

    let providerId = existing?.id

    if (!existing) {
      providerId = uuid()
      // Insert provider
      db.insert(providers).values({
        id: providerId,
        name: adapter.name,
        slug: adapter.slug,
        adapter: adapter.slug,
        base_url: adapter.defaultBaseUrl,
        api_key_enc: null,
        is_enabled: 1,
        created_at: now,
        updated_at: now
      }).run()
      logger.debug(`Seeded provider: ${adapter.name}`)
    }

    // Seed default models (inserting only if model name is missing for this provider)
    let seededModelsCount = 0
    for (const modelDef of adapter.defaultModels) {
      const existingModel = db.select({ id: models.id })
        .from(models)
        .where(and(eq(models.provider_id, providerId as string), eq(models.name, modelDef.name)))
        .get()

      if (!existingModel) {
        db.insert(models).values({
          id: uuid(),
          provider_id: providerId as string,
          name: modelDef.name,
          display_name: modelDef.displayName,
          context_window: modelDef.contextWindow,
          is_default: 0,
          is_enabled: 1,
          created_at: now
        }).run()
        seededModelsCount++
      }
    }

    if (seededModelsCount > 0) {
      logger.debug(`Seeded ${seededModelsCount} new models for provider: ${adapter.name}`)
    }
  }

  // Seed default system prompt if none exists
  const existingPrompt = db.select({ id: systemPrompts.id })
    .from(systemPrompts)
    .where(eq(systemPrompts.is_default, 1))
    .get()

  if (!existingPrompt) {
    db.insert(systemPrompts).values({
      id: uuid(),
      name: 'Default Assistant',
      description: 'The default system prompt applied to all new chats',
      content: 'You are a helpful AI assistant. You provide clear, thoughtful, and accurate responses. You aim to be direct and efficient while remaining warm and professional.',
      is_default: 1,
      is_archived: 0,
      priority: 0,
      created_at: now,
      updated_at: now
    }).run()
    logger.info('Seeded default system prompt')
  }

  logger.info('Seeding complete')

  // Seed built-in mock tools
  toolService.seedMockTools()
}

// Run directly with: npx tsx src/main/db/seed.ts
const isDirectRun = process.argv[1]?.includes('seed.ts')
if (isDirectRun) {
  seed().then(() => {
    logger.info('Database seeded successfully')
  }).catch((err) => {
    logger.error('Seed failed', err)
    process.exit(1)
  })
}
