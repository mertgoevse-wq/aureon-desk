import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// --- Providers ---
export const providers = sqliteTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  adapter: text('adapter').notNull(),
  base_url: text('base_url'),
  api_key_enc: text('api_key_enc'),
  is_enabled: integer('is_enabled').notNull().default(1),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

// --- Models ---
export const models = sqliteTable('models', {
  id: text('id').primaryKey(),
  provider_id: text('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  display_name: text('display_name').notNull(),
  context_window: integer('context_window'),
  is_default: integer('is_default').notNull().default(0),
  is_enabled: integer('is_enabled').notNull().default(1),
  created_at: text('created_at').notNull()
})

// --- System Prompts ---
export const systemPrompts = sqliteTable('system_prompts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  content: text('content').notNull(),
  is_default: integer('is_default').notNull().default(0),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

// --- Chats ---
export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('New Chat'),
  model_id: text('model_id').references(() => models.id),
  system_prompt_id: text('system_prompt_id').references(() => systemPrompts.id),
  project_id: text('project_id'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  archived: integer('archived').notNull().default(0)
})

// --- Messages ---
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  chat_id: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'system' | 'user' | 'assistant' | 'tool'
  content: text('content').notNull(),
  tool_calls: text('tool_calls'), // JSON
  tool_call_id: text('tool_call_id'),
  token_count: integer('token_count'),
  created_at: text('created_at').notNull(),
  sort_order: integer('sort_order').notNull()
})

// --- Attachments ---
export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  message_id: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  file_name: text('file_name').notNull(),
  file_path: text('file_path').notNull(),
  mime_type: text('mime_type'),
  file_size: integer('file_size'),
  content: text('content'), // extracted text
  created_at: text('created_at').notNull()
})

// --- Prompt Library ---
export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  description: text('description'),
  tags: text('tags'), // JSON array
  category: text('category'),
  source: text('source'),
  source_path: text('source_path'),
  is_template: integer('is_template').notNull().default(0),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

// --- Projects ---
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  instructions: text('instructions'),
  root_path: text('root_path'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

// --- Tools / MCP ---
export const tools = sqliteTable('tools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'builtin' | 'mcp-stdio' | 'mcp-sse'
  config: text('config').notNull(), // JSON
  description: text('description'),
  is_enabled: integer('is_enabled').notNull().default(1),
  source: text('source'),
  source_path: text('source_path'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

// --- GitHub Imports ---
export const githubImports = sqliteTable('github_imports', {
  id: text('id').primaryKey(),
  repo_url: text('repo_url').notNull(),
  branch: text('branch').default('main'),
  local_path: text('local_path').notNull(),
  import_type: text('import_type').notNull(), // 'prompts' | 'tools' | 'both'
  last_synced: text('last_synced'),
  created_at: text('created_at').notNull()
})

// --- Settings (key-value) ---
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull() // JSON
})
