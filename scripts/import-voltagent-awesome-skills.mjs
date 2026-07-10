#!/usr/bin/env node
/**
 * import-voltagent-awesome-skills.mjs
 *
 * Fetches the VoltAgent/awesome-agent-skills README.md, parses all markdown
 * bullet links in skill sections, and writes normalized JSON metadata to:
 *   src/shared/data/voltagent-awesome-skills.generated.json
 *
 * Supports both online fetch (default) and local file input:
 *   node scripts/import-voltagent-awesome-skills.mjs
 *   node scripts/import-voltagent-awesome-skills.mjs --local vendor/voltagent-awesome-agent-skills/README.md
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

const README_URL = 'https://raw.githubusercontent.com/VoltAgent/awesome-agent-skills/main/README.md'
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'src', 'shared', 'data', 'voltagent-awesome-skills.generated.json')

/** Category mapping based on provider/section headers */
function inferCategory(provider, description) {
  const lower = (provider + ' ' + description).toLowerCase()

  if (/test|playwright|cypress|selenium|appium|puppeteer|jest|vitest|mocha|junit|nunit|pytest|rspec|phpunit|testng|xunit|unittest|espresso|xcuitest|detox|nightwatch|protractor|webdriver|testcafe|robot.framework|specflow|cucumber|behat|behave|gauge|serenity|selenide|karma|jasmine|codeception|capybara|laravel.*dusk|lettuce|mstest|gherkin|test.*framework/.test(lower)) {
    if (/mobile|appium|espresso|xcuitest|detox|flutter.*test|android|ios/.test(lower)) return 'mobile-testing'
    if (/api|rest|graphql|grpc/.test(lower)) return 'api-testing'
    return 'webapp-testing'
  }
  if (/mcp.*(builder|server|tool)|model.context.protocol/.test(lower)) return 'mcp-builder'
  if (/ci.*cd|pipeline|github.actions|jenkins|gitlab.ci|azure.devops|hyperexecute/.test(lower)) return 'cicd-pipeline'
  if (/security|vulnerability|threat.model|audit|trail.of.bits|compliance/.test(lower)) return 'security-review'
  if (/brand|guidelines|identity/.test(lower)) return 'brand-guidelines'
  if (/theme|styl|design.*token/.test(lower)) return 'theme-factory'
  if (/doc|writing|readme|changelog|internal.comm|markdown/.test(lower)) return 'documentation'
  if (/spreadsheet|xlsx|excel|pdf|pptx|powerpoint|word|docx/.test(lower)) return 'spreadsheet-pdf'
  if (/frontend.*design|ui.*ux|canvas.*design|web.artifact|design/.test(lower)) return 'frontend-design'
  if (/build.*(web|app|site)|full.stack|next|react|vue|svelte|angular.*developer|create.*app|bolt/.test(lower)) return 'web-app-builder'
  if (/cloud|deploy|vercel|cloudflare|netlify|terraform|kubernetes|aws|azure|gcp|google.cloud|serverless/.test(lower)) return 'cloud-deploy'
  if (/database|postgres|sql|mysql|mongo|redis|clickhouse|neon|supabase|duckdb|tinybird/.test(lower)) return 'database'
  if (/auth|oauth|sso|login|jwt|better.auth|auth0/.test(lower)) return 'authentication'
  if (/browser|scrap|crawl|firecrawl|playwright|puppeteer|browserbase/.test(lower)) return 'browser-automation'
  if (/ai|gemini|openai|anthropic|llm|model|agent.*(build|create|develop)|nvidia|hugging.face|replicate|fal.ai|venice/.test(lower)) return 'ai-development'
  if (/code.*quality|lint|format|prettier|eslint|static.analysis/.test(lower)) return 'code-quality'
  if (/agent.*orch|multi.agent|team.*agent|workflow|volt.agent/.test(lower)) return 'agent-orchestration'

  return 'other'
}

function inferRiskLevel(provider, description) {
  const lower = (provider + ' ' + description).toLowerCase()
  if (/destructive|delete|drop|truncate|unlink|rm.|purge|burn|nuke|wipe/.test(lower)) return 'destructive'
  if (/deploy|publish|push|release|migrate|upgrade|terraform.*apply/.test(lower)) return 'caution'
  return 'safe'
}

function inferTags(provider, name, description) {
  const tags = [provider.toLowerCase()]
  const lower = (name + ' ' + description).toLowerCase()
  const tagMap = [
    ['testing', /test|e2e|unit|integration|spec|qa/],
    ['javascript', /javascript|js\b|node\.js|nodejs/],
    ['typescript', /typescript|ts\b|\.tsx/],
    ['python', /python|pytest|django|flask/],
    ['java', /java\b|junit|spring|android/],
    ['react', /react\b|next\.js|nextjs/],
    ['design', /design|css|tailwind|styling|ui/],
    ['api', /api\b|rest|graphql|grpc/],
    ['database', /database|sql|postgres|mongo|redis/],
    ['cloud', /cloud|aws|azure|gcp|deploy|serverless/],
    ['mobile', /mobile|android|ios|react.native|flutter/],
    ['ai', /ai\b|llm|gpt|claude|gemini|model/],
    ['security', /security|auth|vulnerability|compliance/],
    ['documentation', /doc|write|readme|changelog/],
  ]
  for (const [tag, regex] of tagMap) {
    if (regex.test(lower)) tags.push(tag)
  }
  return [...new Set(tags)].slice(0, 8)
}

/**
 * Parse the VoltAgent awesome-agent-skills README into structured entries.
 *
 * The README uses this format:
 *   <details>
 *   <summary><h3>Skills by Organization</h3></summary>
 *   - **[org-slug/skill-name](url)** - description
 *   </details>
 */
function parseReadme(markdown) {
  const entries = []
  const importTime = new Date().toISOString()

  // Match each <details> block with its section header
  const sectionRegex = /<details[^>]*>\s*<summary>\s*<h3[^>]*>\s*([^<]+)\s*<\/h3>\s*<\/summary>\s*([\s\S]*?)<\/details>/gi
  let sectionMatch

  while ((sectionMatch = sectionRegex.exec(markdown)) !== null) {
    const headerText = sectionMatch[1].trim()
    const sectionContent = sectionMatch[2]

    // Extract provider name from header
    // Format: "Skills by Organization" or "Official Claude Skills" or "Community Skills"
    let provider = headerText
      .replace(/^Skills\s+by\s+/i, '')
      .replace(/^Official\s+/i, '')
      .replace(/^Community\s+Skills$/i, 'Community')
      .trim()

    // Parse bullet-point skill entries in this section
    // Format: - **[org-slug/skill-name](url)** - description
    const bulletRegex = /-\s*\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\s*-\s*(.+)/g
    let bulletMatch

    while ((bulletMatch = bulletRegex.exec(sectionContent)) !== null) {
      const fullId = bulletMatch[1].trim() // e.g., "anthropics/docx"
      const url = bulletMatch[2].trim()
      const description = bulletMatch[3].trim()

      // Split org/skill-name
      const slashIdx = fullId.indexOf('/')
      const orgSlug = slashIdx >= 0 ? fullId.slice(0, slashIdx) : provider
      const skillName = slashIdx >= 0 ? fullId.slice(slashIdx + 1) : fullId

      const entry = {
        id: fullId,
        name: skillName,
        category: inferCategory(provider, description),
        provider: orgSlug,
        description,
        url,
        sourceRepo: 'https://github.com/VoltAgent/awesome-agent-skills',
        sourceLicense: undefined,
        licenseStatus: 'unknown',
        tags: inferTags(provider, skillName, description),
        supportedTools: [],
        riskLevel: inferRiskLevel(provider, description),
        importStatus: 'imported',
        adaptationStatus: 'none',
        notes: `From VoltAgent awesome-agent-skills index. Section: "${headerText}"`,
        importedAt: importTime,
      }

      entries.push(entry)
    }
  }

  return entries
}

async function main() {
  const args = process.argv.slice(2)
  const localFile = args.includes('--local') ? args[args.indexOf('--local') + 1] : null

  let markdown

  if (localFile) {
    console.log(`📂 Reading local file: ${localFile}`)
    markdown = await fs.readFile(localFile, 'utf-8')
  } else {
    console.log(`🌐 Fetching: ${README_URL}`)
    try {
      const response = await fetch(README_URL)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      markdown = await response.text()
    } catch (err) {
      console.error('❌ Failed to fetch README from GitHub.')
      console.error('   Error:', err.message)
      console.error('')
      console.error('   To use a local copy instead:')
      console.error('   1. Clone the repo:')
      console.error('      git clone https://github.com/VoltAgent/awesome-agent-skills.git vendor/voltagent-awesome-agent-skills')
      console.error('   2. Run with --local:')
      console.error('      node scripts/import-voltagent-awesome-skills.mjs --local vendor/voltagent-awesome-agent-skills/README.md')
      process.exit(1)
    }
  }

  console.log(`📝 Parsing README... (${markdown.length.toLocaleString()} chars)`)

  const entries = parseReadme(markdown)
  console.log(`✅ Parsed ${entries.length} skill entries`)

  // Compute statistics
  const categories = {}
  const providers = {}
  for (const e of entries) {
    categories[e.category] = (categories[e.category] || 0) + 1
    providers[e.provider] = (providers[e.provider] || 0) + 1
  }

  console.log(`📊 Categories: ${Object.keys(categories).length}`)
  console.log(`📊 Providers: ${Object.keys(providers).length}`)

  const output = {
    _metadata: {
      source: 'https://github.com/VoltAgent/awesome-agent-skills',
      generatedAt: new Date().toISOString(),
      generatedBy: 'scripts/import-voltagent-awesome-skills.mjs',
      totalSkills: entries.length,
      categories,
      providers: Object.entries(providers)
        .sort(([, a], [, b]) => b - a)
        .map(([name, count]) => ({ name, count })),
    },
    entries,
  }

  // Ensure output directory exists
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')

  // Also generate a TypeScript module for type-safe imports in the renderer
  const TS_OUTPUT_PATH = OUTPUT_PATH.replace(/\.json$/, '.ts')
  const tsContent = `// Auto-generated by scripts/import-voltagent-awesome-skills.mjs
// Source: https://github.com/VoltAgent/awesome-agent-skills
// Generated at: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY — re-run "npm run skills:import:voltagent" to refresh.

import type { ExternalSkillEntry } from '../external-skill-sources'

export const VOLTAGENT_SKILLS_COUNT = ${entries.length}
export const VOLTAGENT_SKILLS_GENERATED_AT = '${new Date().toISOString()}'

export const voltagentSkills: ExternalSkillEntry[] = ${JSON.stringify(entries, null, 2)}
`
  await fs.writeFile(TS_OUTPUT_PATH, tsContent, 'utf-8')

  console.log(`💾 Written JSON to: ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}`)
  console.log(`💾 Written TS to:   ${path.relative(PROJECT_ROOT, TS_OUTPUT_PATH)}`)
  console.log(`   Size: ${(JSON.stringify(output).length / 1024).toFixed(1)} KB JSON`)

  // Print top providers
  console.log('\n📋 Top providers:')
  for (const { name, count } of output._metadata.providers.slice(0, 10)) {
    console.log(`   ${count.toString().padStart(4)}  ${name}`)
  }

  // Print category breakdown
  console.log('\n📋 Category breakdown:')
  for (const [cat, count] of Object.entries(categories).sort(([, a], [, b]) => b - a)) {
    console.log(`   ${String(count).padStart(4)}  ${cat}`)
  }
}

main().catch(err => {
  console.error('❌ Import failed:', err.message)
  process.exit(1)
})
