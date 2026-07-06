import { v4 as uuid } from 'uuid'
import { getDb } from './connection'
import { providers, models, systemPrompts } from './schema'
import { PROVIDER_ADAPTERS } from '../../shared/constants'
import { logger } from '../utils/logger'
import { toolService } from '../services/tool.service'

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
    const providerId = uuid()

    // Check if provider already exists
    const existing = db.select({ id: providers.id })
      .from(providers)
      .where({ slug: adapter.slug } as never)
      .get()

    if (existing) {
      logger.debug(`Provider ${adapter.slug} already exists, skipping`)
      continue
    }

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

    // Insert default models for this provider
    for (const modelDef of adapter.defaultModels) {
      db.insert(models).values({
        id: uuid(),
        provider_id: providerId,
        name: modelDef.name,
        display_name: modelDef.displayName,
        context_window: modelDef.contextWindow,
        is_default: 0,
        is_enabled: 1,
        created_at: now
      }).run()
    }

    logger.debug(`Seeded provider: ${adapter.name} with ${adapter.defaultModels.length} models`)
  }

  // Seed default system prompt if none exists
  const existingPrompt = db.select({ id: systemPrompts.id })
    .from(systemPrompts)
    .where({ is_default: 1 } as never)
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
    console.log('✅ Database seeded successfully')
  }).catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
}
