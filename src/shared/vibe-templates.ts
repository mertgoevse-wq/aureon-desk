/**
 * Vibe Coding — Prompt Template Registry
 *
 * Beginner-friendly prompt templates for guided app building.
 * Templates are safe: they describe what to do, never auto-execute.
 */

export interface VibeTemplate {
  id: string
  label: string
  icon: string // lucide icon name
  description: string
  category: 'build' | 'fix' | 'improve' | 'learn' | 'setup' | 'deploy'
  prompt: string
  /** If true, opens Code mode instead of chat */
  openInCode?: boolean
}

export interface GuidedStep {
  id: string
  label: string
  description: string
  options: GuidedOption[]
}

export interface GuidedOption {
  id: string
  label: string
  icon?: string
  description: string
  /** Optional: which template to suggest after this choice */
  suggestTemplate?: string
}

export const ONBOARDING_CARDS: VibeTemplate[] = [
  {
    id: 'start-building',
    label: 'Start building',
    icon: 'Hammer',
    description: 'Describe what you want to build and Aureon will help you plan and create it step by step.',
    category: 'build',
    prompt: 'I want to build something new. First, ask me what I want to build (website, app, game, tool, or other). Then help me plan the features, choose the right tech, and generate the starter code. Keep it simple and explain each step.'
  },
  {
    id: 'fix-error',
    label: 'Fix an error',
    icon: 'Wrench',
    description: 'Paste your error message and Aureon will explain what went wrong and how to fix it.',
    category: 'fix',
    prompt: "I'm getting this error. Can you explain what it means in simple terms and show me how to fix it step by step?\n\n```\n[paste your error here]\n```"
  },
  {
    id: 'improve-ui',
    label: 'Improve UI',
    icon: 'Palette',
    description: 'Make your app look more professional with better colors, spacing, and layout.',
    category: 'improve',
    prompt: 'Help me improve the visual design of my app. Make it look more professional with better colors, spacing, typography, and layout. Keep it calm and clean — no neon colors or cyberpunk.'
  },
  {
    id: 'add-feature',
    label: 'Add a feature',
    icon: 'Plus',
    description: 'Describe a new feature you want and get a plan with code to add it.',
    category: 'build',
    prompt: 'I want to add a new feature to my project. First, ask me what the feature should do and what the current project looks like. Then propose a plan with the code changes needed.'
  },
  {
    id: 'explain-code',
    label: 'Explain my code',
    icon: 'BookOpen',
    description: 'Paste any code and Aureon will explain what it does in plain English.',
    category: 'learn',
    prompt: 'Please explain this code to me like I\'m a beginner. What does each part do? How does it work together?\n\n```\n[paste your code here]\n```'
  },
  {
    id: 'create-preview',
    label: 'Create Live Preview',
    icon: 'Monitor',
    description: 'Build a small app and see it running live in the preview panel.',
    category: 'build',
    prompt: 'Build a small self-contained app for me to preview live. Keep it simple — a single page with clean UI. Use warm ivory colors and rounded corners.',
    openInCode: true
  },
  {
    id: 'connect-provider',
    label: 'Connect AI provider',
    icon: 'KeyRound',
    description: 'Set up your first AI provider (API key) so Aureon can start helping you.',
    category: 'setup',
    prompt: 'Help me set up my first AI provider in Aureon Desk. I need guidance on getting an API key and configuring it. Recommend OpenRouter for beginners (it gives access to many models with one key).'
  },
  {
    id: 'import-github',
    label: 'Import GitHub project',
    icon: 'Github',
    description: 'Bring in code from a GitHub repository and start working on it.',
    category: 'setup',
    prompt: 'Help me import a project from GitHub into Aureon Desk. Guide me through the steps and ask for the repository URL.'
  }
]

export const GUIDED_BUILDER_STEPS: GuidedStep[] = [
  {
    id: 'what-to-build',
    label: 'What do you want to build?',
    description: 'Choose the type of project you want to create.',
    options: [
      { id: 'website', label: 'Website', icon: 'Globe', description: 'A web page or site with HTML, CSS, and JavaScript' },
      { id: 'desktop-app', label: 'Desktop app', icon: 'Monitor', description: 'An Electron desktop application like Aureon itself' },
      { id: 'mini-game', label: 'Mini-game', icon: 'Gamepad2', description: 'A small browser game (puzzle, clicker, quiz)' },
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', description: 'A data dashboard with charts and stats' },
      { id: 'ai-tool', label: 'AI tool', icon: 'Sparkles', description: 'An app that uses AI (chatbot, analyzer, generator)' },
      { id: 'learning-app', label: 'Learning app', icon: 'GraduationCap', description: 'Flashcards, quizzes, or educational content' },
      { id: 'other', label: 'Other / I\'ll describe', icon: 'Lightbulb', description: 'Something else — describe it in your own words' }
    ]
  },
  {
    id: 'starting-point',
    label: 'Choose a starting point',
    description: 'How would you like to start your project?',
    options: [
      { id: 'blank', label: 'New blank project', icon: 'FilePlus', description: 'Start fresh with a new project folder' },
      { id: 'existing', label: 'Existing folder', icon: 'FolderOpen', description: 'Open a folder you already have on your computer' },
      { id: 'github', label: 'Import from GitHub', icon: 'Github', description: 'Clone a repository from GitHub' },
      { id: 'demo', label: 'Demo sandbox', icon: 'Play', description: 'Try things out in a temporary sandbox (safe, disposable)' }
    ]
  },
  {
    id: 'action',
    label: 'What do you want to do?',
    description: 'Pick the first action you want Aureon to help with.',
    options: [
      { id: 'plan', label: 'Plan', icon: 'Map', description: 'Create a step-by-step plan for your project' },
      { id: 'generate', label: 'Generate files', icon: 'FileCode', description: 'Generate the starter code and files' },
      { id: 'preview', label: 'Preview', icon: 'Eye', description: 'See your app running live in the preview panel' },
      { id: 'debug', label: 'Debug', icon: 'Bug', description: 'Find and fix problems in your code' },
      { id: 'polish', label: 'Polish UI', icon: 'Palette', description: 'Improve the visual design and layout' },
      { id: 'package', label: 'Package', icon: 'Package', description: 'Prepare your app for sharing or distribution' }
    ]
  }
]

/**
 * Generates a prompt from the guided builder selections.
 */
export function buildGuidedPrompt(selections: Record<string, string>): string {
  const whatToBuild = selections['what-to-build'] || 'a project'
  const startingPoint = selections['starting-point'] || 'a new project'
  const action = selections['action'] || 'plan'

  const parts: string[] = [
    `I want to build ${whatToBuild}.`,
    `Starting point: ${startingPoint}.`,
    `First, help me ${action} this project.`,
    '',
    'Please keep it beginner-friendly:',
    '- Explain technical terms in simple language',
    '- Show me step by step what to do',
    '- Give me code I can copy and paste',
    '- Tell me if any step needs extra setup (like installing Node.js)',
    '- Keep files small and focused'
  ]

  return parts.join('\n')
}
