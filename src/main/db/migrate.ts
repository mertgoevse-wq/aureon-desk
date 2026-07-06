import Database from 'better-sqlite3'
import { getDbPath } from '../utils/paths'
import { logger } from '../utils/logger'

/**
 * Run migrations programmatically by creating tables if they don't exist.
 * Schema changes are additive — new columns are added with ALTER TABLE.
 */
export function runMigrations(): void {
  const dbPath = getDbPath()
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  logger.info('Running migrations...')

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      adapter TEXT NOT NULL,
      base_url TEXT,
      api_key_enc TEXT,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      context_window INTEGER,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_prompts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      tags TEXT,
      category TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      priority INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      instructions TEXT,
      root_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'New Chat',
      model_id TEXT REFERENCES models(id),
      system_prompt_id TEXT REFERENCES system_prompts(id),
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_calls TEXT,
      tool_call_id TEXT,
      token_count INTEGER,
      created_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER,
      content TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      variables TEXT,
      tags TEXT,
      category TEXT,
      favorite INTEGER NOT NULL DEFAULT 0,
      usage_count INTEGER NOT NULL DEFAULT 0,
      source TEXT,
      source_path TEXT,
      is_template INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      version TEXT NOT NULL DEFAULT '1.0.0',
      source TEXT,
      source_path TEXT,
      transport TEXT NOT NULL DEFAULT 'local',
      command TEXT,
      config TEXT NOT NULL,
      permissions TEXT,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      is_trusted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tool_permissions (
      id TEXT PRIMARY KEY,
      tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
      permission TEXT NOT NULL,
      granted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tool_call_logs (
      id TEXT PRIMARY KEY,
      tool_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      status TEXT NOT NULL,
      input_preview TEXT NOT NULL DEFAULT '',
      output_preview TEXT,
      permission_checks TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS imported_repositories (
      id TEXT PRIMARY KEY,
      repo_url TEXT NOT NULL,
      branch TEXT DEFAULT 'main',
      local_path TEXT NOT NULL,
      category TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      detected_categories TEXT,
      last_synced TEXT,
      commit_hash TEXT,
      item_count INTEGER NOT NULL DEFAULT 0,
      prompt_count INTEGER NOT NULL DEFAULT 0,
      system_prompt_count INTEGER NOT NULL DEFAULT 0,
      skill_count INTEGER NOT NULL DEFAULT 0,
      warning_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS imported_items (
      id TEXT PRIMARY KEY,
      repo_id TEXT NOT NULL REFERENCES imported_repositories(id) ON DELETE CASCADE,
      repo_url TEXT NOT NULL,
      item_type TEXT NOT NULL DEFAULT 'unknown',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      category TEXT,
      source_file TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unreviewed',
      safety_warnings TEXT,
      is_untrusted INTEGER NOT NULL DEFAULT 1,
      original_content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_warnings (
      id TEXT PRIMARY KEY,
      item_id TEXT REFERENCES imported_items(id) ON DELETE CASCADE,
      repo_url TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      line_number INTEGER,
      context TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS github_imports (
      id TEXT PRIMARY KEY,
      repo_url TEXT NOT NULL,
      branch TEXT DEFAULT 'main',
      local_path TEXT NOT NULL,
      import_type TEXT NOT NULL,
      last_synced TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_logs (
      id TEXT PRIMARY KEY,
      repo_url TEXT NOT NULL,
      message TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'info',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      level TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata TEXT,
      chat_id TEXT,
      project_id TEXT
    );
  `)

  // Additive migrations: add new columns if they don't exist
  const existingCols = sqlite.pragma('table_info(system_prompts)') as { name: string }[]
  const colNames = existingCols.map(c => c.name)

  const addCol = (name: string, ddl: string) => {
    if (!colNames.includes(name)) {
      logger.info(`Adding column: system_prompts.${name}`)
      sqlite.exec(`ALTER TABLE system_prompts ADD COLUMN ${name} ${ddl}`)
    }
  }

  addCol('tags', 'TEXT')
  addCol('category', 'TEXT')
  addCol('is_archived', "INTEGER NOT NULL DEFAULT 0")
  addCol('priority', 'INTEGER NOT NULL DEFAULT 0')

  // Prompt Library additive columns
  const promptCols = sqlite.pragma('table_info(prompts)') as { name: string }[]
  const promptColNames = promptCols.map(c => c.name)

  const addPromptCol = (name: string, ddl: string) => {
    if (!promptColNames.includes(name)) {
      logger.info(`Adding column: prompts.${name}`)
      sqlite.exec(`ALTER TABLE prompts ADD COLUMN ${name} ${ddl}`)
    }
  }

  addPromptCol('variables', 'TEXT')
  addPromptCol('favorite', 'INTEGER NOT NULL DEFAULT 0')
  addPromptCol('usage_count', 'INTEGER NOT NULL DEFAULT 0')

  // Tool columns additive migration
  const toolCols = sqlite.pragma('table_info(tools)') as { name: string }[]
  const toolColNames = toolCols.map(c => c.name)
  const addToolCol = (name: string, ddl: string) => {
    if (!toolColNames.includes(name)) {
      logger.info(`Adding column: tools.${name}`)
      sqlite.exec(`ALTER TABLE tools ADD COLUMN ${name} ${ddl}`)
    }
  }
  addToolCol('version', "TEXT NOT NULL DEFAULT '1.0.0'")
  addToolCol('transport', "TEXT NOT NULL DEFAULT 'local'")
  addToolCol('command', 'TEXT')
  addToolCol('permissions', 'TEXT')
  addToolCol('is_trusted', 'INTEGER NOT NULL DEFAULT 0')

  // Project columns additive migration
  const projectCols = sqlite.pragma('table_info(projects)') as { name: string }[]
  const projectColNames = projectCols.map(c => c.name)
  const addProjectCol = (name: string, ddl: string) => {
    if (!projectColNames.includes(name)) {
      logger.info(`Adding column: projects.${name}`)
      sqlite.exec(`ALTER TABLE projects ADD COLUMN ${name} ${ddl}`)
    }
  }
  addProjectCol('archived', 'INTEGER NOT NULL DEFAULT 0')
  addProjectCol('default_provider_id', 'TEXT')
  addProjectCol('default_model', 'TEXT')
  addProjectCol('default_system_prompt_id', 'TEXT')
  addProjectCol('enabled_skill_ids', 'TEXT')

  sqlite.close()
  logger.info('Migrations complete')
}

const isDirectRun = process.argv[1]?.includes('migrate.ts')
if (isDirectRun) {
  try {
    runMigrations()
    console.log('✅ Migrations applied successfully')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}
