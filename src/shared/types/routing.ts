// --- Intent Classification ---

export type IntentType =
  | 'coding'
  | 'debugging'
  | 'writing'
  | 'planning'
  | 'research'
  | 'data_analysis'
  | 'file_operation'
  | 'github_operation'
  | 'terminal_operation'
  | 'design_request'
  | 'general_chat'
  | 'security_review'

export type RiskLevel = 'low' | 'medium' | 'high' | 'destructive'

// --- Agent Definitions ---

export interface AgentDefinition {
  id: string
  name: string
  description: string
  category: IntentType[]
  requiredSkills: string[]
  suggestedTools: string[]
  systemPromptProfile?: string  // ID of a recommended system prompt profile
  priority: number               // Higher = preferred when multiple agents match
  isDestructive: boolean          // Whether this agent can perform destructive operations
}

// --- Skill Definitions ---

export interface SkillDefinition {
  id: string
  name: string
  description: string
  tags: string[]
  requiredPermissions: PermissionType[]
  allowedFilePatterns: string[]
  version: string
  source: 'builtin' | 'local' | 'imported'
  sourcePath?: string
  isEnabled: boolean
}

export type PermissionType =
  | 'file_read'
  | 'file_write'
  | 'file_delete'
  | 'terminal_read'
  | 'terminal_write'
  | 'network_outbound'
  | 'git_read'
  | 'git_write'
  | 'git_push'
  | 'db_read'
  | 'db_write'
  | 'os_settings'

// --- Context Detection ---

export interface RequiredContext {
  files: boolean
  repo: boolean
  projectInstructions: boolean
  webAccess: boolean
  skills: string[]          // Skill IDs that would help
  systemPromptProfile: boolean
}

// --- Prompt Analysis ---

export interface PromptAnalysis {
  intent: IntentType
  confidence: number              // 0-1
  alternativeIntents: IntentType[]
  riskLevel: RiskLevel
  requiresTools: boolean
  requiredPermissions: PermissionType[]
  requiredContext: RequiredContext
  detectedKeywords: string[]
  detectedPatterns: string[]      // e.g. "code_block", "file_path", "git_command"
}

// --- Routing Result ---

export interface RoutingResult {
  analysis: PromptAnalysis
  primaryAgent: AgentDefinition
  supportingAgents: AgentDefinition[]
  selectedSkills: SkillDefinition[]
  suggestedSystemPromptId: string | null
  requiredTools: string[]
  subagentPlan: SubagentPlan | null
  riskWarnings: string[]
  requiresConfirmation: boolean
}

export interface SubagentPlan {
  summary: string
  steps: SubagentStep[]
  estimatedComplexity: 'simple' | 'moderate' | 'complex' | 'multi_agent'
}

export interface SubagentStep {
  order: number
  agentId: string
  agentName: string
  description: string
  skills: string[]
  tools: string[]
  riskLevel: RiskLevel
  requiresConfirmation: boolean
}

// --- IPC Input/Output ---

export interface AnalyzePromptInput {
  content: string
  chatId?: string
  projectId?: string
  availableSkills?: string[]   // IDs of locally-installed skills
}

export interface AnalyzePromptOutput {
  analysis: PromptAnalysis
  routing: RoutingResult
  timestamp: string
}
