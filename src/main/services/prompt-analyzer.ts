import type { IntentType, RiskLevel, RequiredContext, PermissionType, PromptAnalysis } from '../../shared/types/routing'

/**
 * PromptAnalyzer — rule-based intent classifier, context detector, and risk assessor.
 * Determines what the user is asking for, what context they need, and how risky their request is.
 * No LLM calls — purely deterministic keyword + pattern matching.
 */

// Intent classification rules: [keyword/phrase, intent, weight]
const INTENT_RULES: Array<{ patterns: RegExp[]; intent: IntentType; weight: number }> = [
  {
    patterns: [
      /\b(code|implement|build|create|write|add|component|function|class|module|api|endpoint|route|hook)\b/i,
      /\b(program|script|algorithm|data structure)\b/i,
    ],
    intent: 'coding',
    weight: 1.0
  },
  {
    patterns: [
      /\b(fix|debug|bug|error|crash|break|broken|not working|issue|problem|wrong|incorrect|fail)\b/i,
      /\b(stack trace|traceback|exception|typeerror|syntaxerror|referenceerror)\b/i,
      /\bwhy (is|does|isn't|doesn't).*(not|fail|error|crash|break|stale|incorrect|wrong)\b/i,
      /\b(not updating|stale state|unexpected|doesn't work|isn't working|no longer works)\b/i,
    ],
    intent: 'debugging',
    weight: 1.0
  },
  {      patterns: [
        /\b(write|draft|compose|author)\s+(document|documentation|readme|changelog|blog|article|essay|prose|guide|tutorial)\b/i,
        /\b(documentation|readme|changelog|blog|article|essay|prose|guide|tutorial)\b/i,
        /\b(explain|describe|summarize|elaborate)\b/i,
      ],
      intent: 'writing',
      weight: 1.0
  },
  {
    patterns: [
      /\b(plan|planning|roadmap|milestone|sprint|architecture|design|system design|how would you|approach|strategy)\b/i,
      /\b(what (is|are) the steps|step by step|break down|outline)\b/i,
    ],
    intent: 'planning',
    weight: 0.9
  },
  {
    patterns: [
      /\b(research|find|look up|search|discover|compare|alternatives|options|recommend)\b/i,
      /\b(best practice|state of the art|latest|trending)\b/i,
    ],
    intent: 'research',
    weight: 0.75
  },
  {
    patterns: [
      /\b(data|analyze|analysis|analytics|visualize|chart|graph|plot|statistics|metrics|query|aggregate)\b/i,
      /\b(sql|table|column|row|dataset|csv|json.*data|parse.*data)\b/i,
      /\b(insights|trends|correlation|distribution)\b/i,
    ],
    intent: 'data_analysis',
    weight: 0.9
  },
  {
    patterns: [
      /\b(open|read|write|save|create|delete|remove|rename|move|copy).*file\b/i,
      /\b(file|folder|directory|path|extension)\b/i,
      /[~\\/.]\w+\.\w{2,4}\b/,  // file-like paths
    ],
    intent: 'file_operation',
    weight: 0.85
  },
  {
    patterns: [
      /\b(git|github|commit|push|pull|merge|branch|clone|fork|repo|pull request|PR)\b/i,
      /\b(commit message)\b/i,
    ],
    intent: 'github_operation',
    weight: 0.95
  },
  {
    patterns: [
      /\b(run|execute|terminal|shell|bash|cmd|command line|cli)\b/i,
      /\b(npm|yarn|pnpm|pip|cargo|brew|choco).*(install|run|build|test)\b/i,
      /\b\$ |sudo |apt |yum |docker |kubectl |systemctl |service \b/i,
    ],
    intent: 'terminal_operation',
    weight: 0.9
  },
  {
    patterns: [
      /\b(design|ui|ux|interface|layout|style|css|color|theme|component library|wireframe|mockup)\b/i,
      /\b(make it (look|pretty|nice|beautiful|professional))\b/i,
      /\b(user experience|accessibility|a11y|responsive|mobile)\b/i,
    ],
    intent: 'design_request',
    weight: 0.85
  },
  {      patterns: [
        /\b(security|vulnerable|vulnerability|CVE|injection|XSS|CSRF|auth|authentication|authorization|encrypt|decrypt|hash|salt)\b/i,
        /\b(secure|audit|penetration|threat\s*model|attack\s*vector)\b/i,
        /\b(sanitize|validate.*input|escape|SQL injection|inject)\b/i,
        /\breview.*(code|security|vulnerab)\b/i,
      ],
      intent: 'security_review',
      weight: 1.0
  },
  {
    patterns: [
      /\b(hi|hello|hey|thanks|thank you|bye|goodbye|help|what can you do)\b/i,
    ],
    intent: 'general_chat',
    weight: 0.5
  },
]

// Risk level detection patterns
const RISK_PATTERNS: Array<{ pattern: RegExp; level: RiskLevel; reason: string }> = [
  { pattern: /\b(delete|remove|drop|truncate|purge|wipe|destroy|unlink|rm -rf|format)\b/i, level: 'destructive', reason: 'Destructive operation detected' },
  { pattern: /\b(git push|push.*origin|--force|force push)\b/i, level: 'high', reason: 'Force push can rewrite history' },
  { pattern: /\b(sudo|root|admin|chmod 777|chown)\b/i, level: 'high', reason: 'Privileged system operation' },
  { pattern: /\b(production|prod|live|deploy to prod|release)\b/i, level: 'high', reason: 'Production environment mentioned' },
  { pattern: /\b(encrypt|decrypt|credential|api[-_ ]?key|token|secret|password)\b/i, level: 'medium', reason: 'Security-sensitive content' },
  { pattern: /\b(install|uninstall|upgrade|update.*all|npm (install|uninstall)|pip install)\b/i, level: 'medium', reason: 'Package installation/modification' },
  { pattern: /\b(migrate|migration|schema.*change|alter.*table)\b/i, level: 'medium', reason: 'Database schema change' },
  { pattern: /\b(reboot|restart|shutdown|kill|stop service)\b/i, level: 'high', reason: 'System control operation' },
]

// Permission detection
const PERMISSION_PATTERNS: Array<{ pattern: RegExp; permission: PermissionType }> = [
  { pattern: /\b(open|read|load|view).*file\b/i, permission: 'file_read' },
  { pattern:    /\b(write|save|create|edit|modify|update).*(?:file|config)\b/i, permission: 'file_write' },
  { pattern: /\b(delete|remove).*file\b/i, permission: 'file_delete' },
  { pattern: /\b(run|execute|npm|yarn|pnpm|git\b(?!hub)|docker|kubectl|ls|cat|grep|find)\b/i, permission: 'terminal_write' },
  { pattern: /\b(git log|git status|git diff|git show|git branch)\b/i, permission: 'git_read' },
  { pattern: /\b(git commit|git push|git pull|git merge|git rebase)\b/i, permission: 'git_write' },
  { pattern: /\b(fetch|curl|api call|http|request|download|upload)\b/i, permission: 'network_outbound' },
  { pattern: /\b(sql|query|select|insert|update|delete.*from)\b/i, permission: 'db_write' },
]

// Code block / pattern detection
const PATTERN_DETECTORS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /```[\s\S]*?```/g, name: 'code_block' },
  { pattern: /\b([A-Za-z]:\\[^\s]*|\/[^\s]*\/[^\s]*)\b/, name: 'file_path' },
  { pattern: /\bgit\s+(push|pull|commit|merge|rebase|checkout|branch|clone)\b/i, name: 'git_command' },
  { pattern: /\b(npm|yarn|pnpm)\s+(install|run|build|test|start|dev)\b/i, name: 'package_manager' },

]

const RISK_LEVEL_ORDER: RiskLevel[] = ['low', 'medium', 'high', 'destructive']

function calculateRisk(text: string): { level: RiskLevel; warnings: string[] } {
  const warnings: string[] = []
  let maxLevel: RiskLevel = 'low'

  for (const rule of RISK_PATTERNS) {
    if (rule.pattern.test(text)) {
      warnings.push(rule.reason)
      if (RISK_LEVEL_ORDER.indexOf(rule.level) > RISK_LEVEL_ORDER.indexOf(maxLevel)) {
        maxLevel = rule.level
      }
    }
  }

  return { level: maxLevel, warnings }
}

function detectRequiredPermissions(text: string): PermissionType[] {
  const perms = new Set<PermissionType>()
  for (const rule of PERMISSION_PATTERNS) {
    if (rule.pattern.test(text)) {
      perms.add(rule.permission)
    }
  }
  return Array.from(perms)
}

function detectRequiredContext(text: string): RequiredContext {
  return {
    files: /(?:open|read|file|folder|directory|path)\b/i.test(text),
    repo: /\b(git|github|commit|push|pull|repo)\b/i.test(text),
    projectInstructions: /\b(project|workspace|repo|codebase)\b/i.test(text),
    webAccess: /\b(online|internet|fetch|api|download|research|look up|search)\b/i.test(text),
    skills: [],  // Populated by routing policy
    systemPromptProfile: true  // Always recommended
  }
}

function detectPatterns(text: string): string[] {
  const found: string[] = []
  for (const detector of PATTERN_DETECTORS) {
    if (detector.pattern.test(text)) {
      found.push(detector.name)
    }
  }
  return found
}

function extractKeywords(text: string): string[] {
  // Extract meaningful words (3+ chars, filter out stop words)
  const stopWords = new Set([
    'the', 'is', 'are', 'a', 'an', 'in', 'to', 'of', 'and', 'for', 'on', 'with',
    'it', 'that', 'this', 'be', 'or', 'as', 'at', 'by', 'from', 'not', 'but',
    'can', 'has', 'was', 'will', 'would', 'could', 'should', 'have', 'had', 'do',
    'does', 'did', 'get', 'got', 'been', 'i', 'you', 'we', 'they', 'me', 'my', 'please'
  ])
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
  const unique = [...new Set(words.filter(w => !stopWords.has(w)))]
  return unique.slice(0, 20)
}

/** Main analyzer entry point */
export function analyzePrompt(text: string): PromptAnalysis {
  const lower = text.toLowerCase()

  // Classify intent
  let bestIntent: IntentType = 'general_chat'
  let bestScore = 0
  const scores: Array<{ intent: IntentType; score: number }> = []

  for (const rule of INTENT_RULES) {
    let matches = 0
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        matches++
      }
    }
    const score = matches > 0 ? rule.weight * (matches / rule.patterns.length) : 0
    scores.push({ intent: rule.intent, score })

    if (score > bestScore) {
      bestScore = score
      bestIntent = rule.intent
    }
  }

  // If no strong match, check code block presence
  if (bestScore < 0.1 && /```/.test(text)) {
    bestIntent = 'coding'
    bestScore = 0.5
  }

  // Alternative intents (next 2 best)
  const alternatives = scores
    .filter(s => s.intent !== bestIntent && s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(s => s.intent)

  const risk = calculateRisk(text)
  const permissions = detectRequiredPermissions(text)

  return {
    intent: bestIntent,
    confidence: Math.min(bestScore * 2, 1.0),  // Scale up; 0.5 score = 1.0 confidence
    alternativeIntents: alternatives,
    riskLevel: risk.level,
    requiresTools: permissions.length > 0 || risk.level !== 'low',
    requiredPermissions: permissions,
    requiredContext: detectRequiredContext(text),
    detectedKeywords: extractKeywords(text),
    detectedPatterns: detectPatterns(text)
  }
}
