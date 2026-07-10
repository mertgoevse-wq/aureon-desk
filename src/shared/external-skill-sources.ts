/**
 * Vibeforge — External Skill Source Catalog
 *
 * Types for importing and tracking metadata from external skill repositories
 * like VoltAgent/awesome-agent-skills. Skills are imported as metadata only —
 * original source content is NEVER copied. Adaptations create original Vibeforge skills.
 */

// ---- Enums ----

export type LicenseStatus = 'known-open' | 'known-proprietary' | 'unknown' | 'needs-review'

export type ImportStatus = 'pending' | 'imported' | 'skipped' | 'error'

export type AdaptationStatus = 'none' | 'planned' | 'in-progress' | 'adapted' | 'replaced'

export type SkillRiskLevel = 'safe' | 'caution' | 'destructive'

export type SkillCategory =
  | 'web-app-builder'
  | 'frontend-design'
  | 'webapp-testing'
  | 'mcp-builder'
  | 'mobile-testing'
  | 'api-testing'
  | 'cicd-pipeline'
  | 'security-review'
  | 'brand-guidelines'
  | 'theme-factory'
  | 'documentation'
  | 'spreadsheet-pdf'
  | 'ai-development'
  | 'cloud-deploy'
  | 'database'
  | 'authentication'
  | 'browser-automation'
  | 'code-quality'
  | 'agent-orchestration'
  | 'other'

// ---- Core Types ----

export interface ExternalSkillSource {
  /** Source identifier (e.g., "voltagent-awesome") */
  id: string
  /** Human-readable source name */
  name: string
  /** Source repository URL */
  url: string
  /** When the source index was last fetched */
  lastFetched?: string
  /** Total skills available from this source */
  totalCount: number
  /** Skills imported from this source */
  entries: ExternalSkillEntry[]
}

export interface ExternalSkillEntry {
  /** Unique ID within the source (org/skill-name) */
  id: string
  /** Display name */
  name: string
  /** Skill category */
  category: SkillCategory
  /** Provider / organization / team */
  provider: string
  /** Short description from the source */
  description: string
  /** URL to the skill source (GitHub repo or docs) */
  url: string
  /** The source repository this came from */
  sourceRepo: string
  /** License declared in the source repo, if any */
  sourceLicense?: string
  /** Our assessment of the license status */
  licenseStatus: LicenseStatus
  /** Tags extracted or inferred from the description */
  tags: string[]
  /** Tools this skill supports or uses */
  supportedTools: string[]
  /** Risk assessment */
  riskLevel: SkillRiskLevel
  /** Import status */
  importStatus: ImportStatus
  /** Whether and how this skill has been adapted into an Vibeforge skill */
  adaptationStatus: AdaptationStatus
  /** Free-form notes about the skill */
  notes?: string
  /** When the metadata was imported */
  importedAt: string
}

export interface ExternalSkillCategory {
  id: string
  label: string
  description: string
  icon: string
}

/** All skill categories with labels and descriptions */
export const SKILL_CATEGORIES: ExternalSkillCategory[] = [
  { id: 'web-app-builder', label: 'Web App Builder', description: 'Build complete web applications with frontend and backend', icon: 'Globe' },
  { id: 'frontend-design', label: 'Frontend Design', description: 'UI/UX design, components, layouts, and visual styling', icon: 'Palette' },
  { id: 'webapp-testing', label: 'Web App Testing', description: 'E2E, component, and visual regression testing for web apps', icon: 'TestTube' },
  { id: 'mcp-builder', label: 'MCP Builder', description: 'Build Model Context Protocol servers and integrations', icon: 'Plug' },
  { id: 'mobile-testing', label: 'Mobile Testing', description: 'Android and iOS app testing frameworks and automation', icon: 'Smartphone' },
  { id: 'api-testing', label: 'API Testing', description: 'REST, GraphQL, and gRPC API testing and mocking', icon: 'Webhook' },
  { id: 'cicd-pipeline', label: 'CI/CD Pipeline', description: 'Continuous integration and deployment pipeline configs', icon: 'GitBranch' },
  { id: 'security-review', label: 'Security Review', description: 'Vulnerability scanning, security audits, and best practices', icon: 'Shield' },
  { id: 'brand-guidelines', label: 'Brand Guidelines', description: 'Apply consistent brand colors, typography, and visual identity', icon: 'Paintbrush' },
  { id: 'theme-factory', label: 'Theme Factory', description: 'Create and apply professional themes to artifacts and outputs', icon: 'SwatchBook' },
  { id: 'documentation', label: 'Documentation', description: 'Write, format, and maintain technical documentation', icon: 'FileText' },
  { id: 'spreadsheet-pdf', label: 'Spreadsheets & PDFs', description: 'Create, edit, and analyze spreadsheets and PDFs', icon: 'Table' },
  { id: 'ai-development', label: 'AI Development', description: 'Build AI-powered applications, agents, and integrations', icon: 'Brain' },
  { id: 'cloud-deploy', label: 'Cloud Deploy', description: 'Deploy applications to cloud platforms and manage infrastructure', icon: 'Cloud' },
  { id: 'database', label: 'Database', description: 'Database design, queries, migrations, and optimization', icon: 'Database' },
  { id: 'authentication', label: 'Authentication', description: 'Auth flows, OAuth, SSO, and identity management', icon: 'Key' },
  { id: 'browser-automation', label: 'Browser Automation', description: 'Automate browser interactions, scraping, and testing', icon: 'Monitor' },
  { id: 'code-quality', label: 'Code Quality', description: 'Linting, formatting, static analysis, and code review', icon: 'CheckCircle' },
  { id: 'agent-orchestration', label: 'Agent Orchestration', description: 'Multi-agent coordination, workflows, and agent frameworks', icon: 'Network' },
  { id: 'other', label: 'Other', description: 'Miscellaneous skills and utilities', icon: 'MoreHorizontal' },
]
