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
  tags: text('tags'),
  category: text('category'),
  is_default: integer('is_default').notNull().default(0),
  is_archived: integer('is_archived').notNull().default(0),
  priority: integer('priority').notNull().default(0),
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
  role: text('role').notNull(),
  content: text('content').notNull(),
  tool_calls: text('tool_calls'),
  tool_call_id: text('tool_call_id'),
  token_count: integer('token_count'),
  provider_id: text('provider_id'),
  provider_name: text('provider_name'),
  model_id: text('model_id'),
  model_label: text('model_label'),
  adapter_type: text('adapter_type'),
  latency_ms: integer('latency_ms'),
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
  content: text('content'),
  created_at: text('created_at').notNull()
})

// --- Prompt Library ---
export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  description: text('description'),
  variables: text('variables'),     // JSON array of {{var}} names
  tags: text('tags'),               // JSON array
  category: text('category'),
  favorite: integer('favorite').notNull().default(0),
  usage_count: integer('usage_count').notNull().default(0),
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
  archived: integer('archived').notNull().default(0),
  default_provider_id: text('default_provider_id'),
  default_model: text('default_model'),
  default_system_prompt_id: text('default_system_prompt_id'),
  enabled_skill_ids: text('enabled_skill_ids'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

// --- Tools / MCP ---
export const tools = sqliteTable('tools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version').notNull().default('1.0.0'),
  source: text('source'),
  source_path: text('source_path'),
  transport: text('transport').notNull().default('local'),
  command: text('command'),
  config: text('config').notNull(),
  permissions: text('permissions'),
  is_enabled: integer('is_enabled').notNull().default(1),
  is_trusted: integer('is_trusted').notNull().default(0),
  trust_level: text('trust_level').notNull().default('untrusted'),
  env_vars: text('env_vars'),
  connection_status: text('connection_status').notNull().default('disconnected'),
  discovery_data: text('discovery_data'),
  last_discovered_at: text('last_discovered_at'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

export const toolPermissions = sqliteTable('tool_permissions', {
  id: text('id').primaryKey(),
  tool_id: text('tool_id').notNull().references(() => tools.id, { onDelete: 'cascade' }),
  permission: text('permission').notNull(),
  granted: integer('granted').notNull().default(0),
  created_at: text('created_at').notNull()
})

export const toolCallLogs = sqliteTable('tool_call_logs', {
  id: text('id').primaryKey(),
  tool_id: text('tool_id').notNull(),
  tool_name: text('tool_name').notNull(),
  status: text('status').notNull(),
  input_preview: text('input_preview').notNull().default(''),
  output_preview: text('output_preview'),
  permission_checks: text('permission_checks'),
  error_message: text('error_message'),
  created_at: text('created_at').notNull()
})

// --- GitHub Imports ---
export const githubImports = sqliteTable('imported_repositories', {
  id: text('id').primaryKey(),
  repo_url: text('repo_url').notNull(),
  branch: text('branch').default('main'),
  local_path: text('local_path').notNull(),
  category: text('category'),
  status: text('status').notNull().default('pending'),
  detected_categories: text('detected_categories'),
  last_synced: text('last_synced'),
  commit_hash: text('commit_hash'),
  item_count: integer('item_count').notNull().default(0),
  prompt_count: integer('prompt_count').notNull().default(0),
  system_prompt_count: integer('system_prompt_count').notNull().default(0),
  skill_count: integer('skill_count').notNull().default(0),
  warning_count: integer('warning_count').notNull().default(0),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

export const importedItems = sqliteTable('imported_items', {
  id: text('id').primaryKey(),
  repo_id: text('repo_id').notNull().references(() => githubImports.id, { onDelete: 'cascade' }),
  repo_url: text('repo_url').notNull(),
  item_type: text('item_type').notNull().default('unknown'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  description: text('description'),
  tags: text('tags'),
  category: text('category'),
  source_file: text('source_file').notNull(),
  status: text('status').notNull().default('unreviewed'),
  safety_warnings: text('safety_warnings'),
  is_untrusted: integer('is_untrusted').notNull().default(1),
  original_content: text('original_content').notNull(),
  created_at: text('created_at').notNull()
})

export const importWarnings = sqliteTable('import_warnings', {
  id: text('id').primaryKey(),
  item_id: text('item_id').references(() => importedItems.id, { onDelete: 'cascade' }),
  repo_url: text('repo_url').notNull(),
  type: text('type').notNull(),
  message: text('message').notNull(),
  severity: text('severity').notNull().default('medium'),
  line_number: integer('line_number'),
  context: text('context'),
  created_at: text('created_at').notNull()
})

// --- Import Logs ---
export const importLogs = sqliteTable('import_logs', {
  id: text('id').primaryKey(),
  repo_url: text('repo_url').notNull(),
  message: text('message').notNull(),
  level: text('level').notNull().default('info'),
  created_at: text('created_at').notNull()
})

// --- Approved Skills (imported skills promoted to registry) ---
export const approvedSkills = sqliteTable('approved_skills', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  content: text('content').notNull(),
  tags: text('tags'),
  source: text('source'),
  source_path: text('source_path'),
  is_enabled: integer('is_enabled').notNull().default(1),
  created_at: text('created_at').notNull()
})

// --- Settings (key-value) ---
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
})

// --- App Logs (audit trail) ---
export const appLogs = sqliteTable('app_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  level: text('level').notNull(),
  category: text('category').notNull(),
  message: text('message').notNull(),
  metadata: text('metadata'),
  chat_id: text('chat_id'),
  project_id: text('project_id')
})
