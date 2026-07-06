import type { RepoCategory } from '../../shared/types/github'

/**
 * Classify a repository into one of 8 categories
 * based on URL keywords, README content, and file patterns.
 */

interface ClassificationHint {
  repoName: string
  description?: string
  readmeContent?: string
  fileNames: string[]
}

const CLASSIFICATION_RULES: Array<{
  patterns: RegExp[]
  category: RepoCategory
  source: 'url' | 'readme' | 'files' | 'description'
}> = [
  {
    patterns: [
      /system[-_]?prompt/i,
      /leaked.*prompt/i,
      /prompts?-of/i,
      /awesome.*system/i,
    ],
    category: 'system-prompt-pack',
    source: 'url'
  },
  {
    patterns: [
      /awesome[-_]?prompts?/i,
      /prompt[-_]?engineering/i,
      /prompts?\.chat/i,
      /awesome.*prompts/i,
      /GPTs/i,
    ],
    category: 'prompt-library',
    source: 'url'
  },
  {
    patterns: [
      /langchain/i,
      /autogen/i,
      /swarm/i,
      /crewai/i,
      /agent[-_]?framework/i,
      /agentic/i,
      /autoresearch/i,
      /khoj/i,
      /graphify/i,
      /deer[-_]?flow/i,
      /ruview/i,
    ],
    category: 'agent-framework-reference',
    source: 'url'
  },
  {
    patterns: [
      /awesome[-_]?(claude[-_]?)?skills/i,
      /agent[-_]?skills/i,
      /skills$/i,
      /superpowers/i,
      /caveman/i,
      /ui[-_]?ux[-_]?skill/i,
      /karpathy[-_]?skills/i,
    ],
    category: 'skill-pack',
    source: 'url'
  },
  {
    patterns: [
      /awesome[-_]?mcp/i,
      /mcp[-_]?server/i,
    ],
    category: 'mcp-server-list',
    source: 'url'
  },
  {
    patterns: [
      /vllm/i,
      /local.*(model|llm|inference)/i,
    ],
    category: 'local-model-reference',
    source: 'url'
  },
]

const README_CLASSIFIERS: Array<{
  patterns: RegExp[]
  category: RepoCategory
}> = [
  {
    patterns: [
      /system[-_]?prompts?\s*(collection|list|repository|curated)/i,
      /leaked.*(system[-_]?prompt|llm)/i,
      /collection of.*system[-_]?prompts?/i,
    ],
    category: 'system-prompt-pack'
  },
  {
    patterns: [
      /prompt[-_]?engineering\s*(guide|tips|tricks|resources)/i,
      /awesome.*(?:list|collection).*prompts/i,
      /curated.*prompts/i,
    ],
    category: 'prompt-library'
  },
  {
    patterns: [
      /multi[-_]?agent/i,
      /agent[-_]?(framework|orchestrat|workflow)/i,
      /build.*agent/i,
      /agentic\s*(ai|system|workflow)/i,
    ],
    category: 'agent-framework-reference'
  },
  {
    patterns: [
      /skills?\s*(collection|pack|library|curated)/i,
      /agent\s*(capabilities|skills?)/i,
    ],
    category: 'skill-pack'
  },
]

/**
 * Main entry point: classify a repository based on available info
 */
export function classifyRepo(hints: ClassificationHint): { category: RepoCategory; confidence: number; detectedCategories: string[] } {
  const scores: Map<RepoCategory, number> = new Map()
  const allCategories: RepoCategory[] = [
    'system-prompt-pack', 'prompt-library', 'agent-framework-reference',
    'skill-pack', 'mcp-server-list', 'local-model-reference',
    'research/reference', 'unrelated/reference'
  ]
  for (const c of allCategories) scores.set(c, 0)

  // URL-based classification (highest weight)
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.patterns.some(p => p.test(hints.repoName))) {
      const current = scores.get(rule.category) || 0
      scores.set(rule.category, current + 3)
    }
  }

  // Description-based
  if (hints.description) {
    for (const rule of CLASSIFICATION_RULES) {
      if (rule.patterns.some(p => p.test(hints.description!))) {
        const current = scores.get(rule.category) || 0
        scores.set(rule.category, current + 1)
      }
    }
  }

  // README-based
  if (hints.readmeContent) {
    for (const rule of README_CLASSIFIERS) {
      if (rule.patterns.some(p => p.test(hints.readmeContent!))) {
        const current = scores.get(rule.category) || 0
        scores.set(rule.category, current + 2)
      }
    }
  }

  // File-based detection
  const fileHints = hints.fileNames
  if (fileHints.some(f => /system[-_]?prompt/i.test(f) || /\.system\./i.test(f))) {
    scores.set('system-prompt-pack', (scores.get('system-prompt-pack') || 0) + 2)
  }
  if (fileHints.some(f => /\.prompt\./i.test(f) || /prompts?\.(json|yaml|yml|toml|md)/i.test(f))) {
    scores.set('prompt-library', (scores.get('prompt-library') || 0) + 2)
  }
  if (fileHints.some(f => /\.skill\./i.test(f) || /skills?\.(json|yaml|yml)/i.test(f))) {
    scores.set('skill-pack', (scores.get('skill-pack') || 0) + 2)
  }
  if (fileHints.some(f => /mcp/i.test(f) || /server\.(json|yaml)/.test(f))) {
    scores.set('mcp-server-list', (scores.get('mcp-server-list') || 0) + 2)
  }
  if (fileHints.some(f => /setup\.py/i.test(f) || /requirements\.txt/i.test(f) || /Cargo\.toml/i.test(f) || /go\.mod/i.test(f))) {
    scores.set('research/reference', (scores.get('research/reference') || 0) + 1)
  }

  // Find best category
  let bestCategory: RepoCategory = 'unrelated/reference'
  let bestScore = 0
  for (const [cat, score] of scores) {
    if (score > bestScore) {
      bestScore = score
      bestCategory = cat
    }
  }

  // If no strong signal, default to research/reference
  if (bestScore === 0) {
    bestCategory = 'research/reference'
  }

  // Confidence: max 1.0
  const confidence = Math.min(bestScore / 5, 1.0)

  // Detected categories (all with any score)
  const detectedCategories: string[] = []
  for (const [cat, score] of scores) {
    if (score > 0) detectedCategories.push(cat)
  }

  return { category: bestCategory, confidence, detectedCategories }
}
