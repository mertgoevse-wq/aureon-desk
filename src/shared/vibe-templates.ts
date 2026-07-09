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
  suggestTemplate?: string
}

export interface TutorialCard {
  id: string
  icon: string
  question: string
  answer: string
}

export const ONBOARDING_CARDS: VibeTemplate[] = [
  {
    id: 'build-desktop-app',
    label: 'Build a desktop app',
    icon: 'Monitor',
    description: 'Create an Electron desktop application with React and Tailwind CSS.',
    category: 'build',
    prompt: 'I want to build a desktop app. Help me set up an Electron + React project. Start by asking what the app should do, then plan the features and generate the starter code. Keep it simple and explain each step.\n\nDesign rules: Use calm ivory tones, no neon colors, clean sans-serif typography. After generating code, run typecheck, tests, and build to verify everything works.'
  },
  {
    id: 'build-website',
    label: 'Build a website',
    icon: 'Globe',
    description: 'Create a web page or site with HTML, CSS, and JavaScript.',
    category: 'build',
    prompt: 'I want to build a website. Help me create a clean, responsive web page. Start by asking what the site is for, then plan the sections and generate the code. Use warm colors and clean typography.'
  },
  {
    id: 'build-android-app',
    label: 'Build an Android app',
    icon: 'Smartphone',
    description: 'Create a simple Android app — Aureon helps plan and generate the code.',
    category: 'build',
    prompt: 'I want to build a simple Android app. Help me plan the features and generate the starter code. I\'m a beginner, so explain each file and what it does. Recommend the simplest setup possible.\n\nKeep it offline-first — no server required. Use clean Material Design with warm neutral colors (no neon). After generating, explain how to test it.'
  },
  {
    id: 'build-mini-game',
    label: 'Build a mini-game',
    icon: 'Gamepad2',
    description: 'Create a small browser game — puzzle, clicker, quiz, or platformer.',
    category: 'build',
    prompt: 'I want to build a small browser game. Help me choose a simple game idea (like a quiz, clicker, or puzzle) and generate the code. Keep it in a single HTML file so I can preview it immediately in Live Preview.'
  },
  {
    id: 'fix-error',
    label: 'Fix an error',
    icon: 'Wrench',
    description: 'Paste your error message and Aureon will explain what went wrong and how to fix it.',
    category: 'fix',
    prompt: 'I\'m getting this error. Can you explain what it means in simple terms and show me how to fix it step by step?\n\n```\n[paste your error here]\n```\n\nAfter fixing: run typecheck, tests, and build to verify. Do not hardcode any secrets or API keys.'
  },
  {
    id: 'improve-ui',
    label: 'Improve UI',
    icon: 'Palette',
    description: 'Make your app look more professional with better colors, spacing, and layout.',
    category: 'improve',
    prompt: 'Help me improve the visual design of my app. Make it look more professional with better colors, spacing, typography, and layout.\n\nDesign rules:\n- Use calm ivory/warm neutral color palette (no neon, no dark mode unless requested)\n- Clean sans-serif typography with proper hierarchy\n- Rounded corners, subtle shadows, comfortable whitespace\n- Premium desktop feel — not a flashy website\n\nAfter changes, run typecheck, tests, and build to verify nothing is broken.'
  },
  {
    id: 'add-feature',
    label: 'Add a feature',
    icon: 'Plus',
    description: 'Describe a new feature you want and get a plan with code to add it.',
    category: 'build',
    prompt: 'I want to add a new feature to my project. First, ask me what the feature should do and what the current project looks like. Then propose a plan with the code changes needed. After implementing, run tests to verify.'
  },
  {
    id: 'explain-code',
    label: 'Explain this code',
    icon: 'BookOpen',
    description: 'Paste any code and Aureon will explain what it does in plain English.',
    category: 'learn',
    prompt: 'Please explain this code to me like I\'m a beginner. What does each part do? How does it work together?\n\n```\n[paste your code here]\n```'
  },
  {
    id: 'create-preview',
    label: 'Create Live Preview',
    icon: 'Eye',
    description: 'Build a small app and see it running live in the preview panel.',
    category: 'build',
    prompt: 'Build a small self-contained app for me to preview live. Keep it simple — a single HTML page with clean UI. Use warm ivory colors and rounded corners. Include working buttons, not just a static page. The app should do something useful (counter, timer, form, list, etc.). After generating, verify it renders correctly in Live Preview.',
    openInCode: true
  },
  {
    id: 'connect-provider',
    label: 'Connect an AI provider',
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
  },
  {
    id: 'package-windows',
    label: 'Package for Windows',
    icon: 'Package',
    description: 'Package your desktop app into a Windows installer (.exe).',
    category: 'deploy',
    prompt: 'I want to package my desktop app for Windows. Help me set up electron-builder, create an installer, and test the build. Do not hardcode any secrets or API keys in the build config. Run the build to verify it completes successfully.'
  },
  {
    id: 'write-tests',
    label: 'Write tests',
    icon: 'Shield',
    description: 'Add unit tests to your project to catch bugs before they happen.',
    category: 'improve',
    prompt: 'Help me write tests for my project. First, ask what kind of tests I need (unit tests, integration tests, E2E). Then show me how to write them and run them. After adding tests, run them to verify they pass.'
  },
  {
    id: 'cleanup-project',
    label: 'Clean up project',
    icon: 'Trash2',
    description: 'Remove duplicate files, dead code, and stale artifacts from your project.',
    category: 'improve',
    prompt: 'Help me clean up my project. Look for duplicate files, unused imports, dead code, and stale artifacts. Show me what can be safely removed. After cleanup, run typecheck, tests, and build to verify nothing is broken.'
  },
  {
    id: 'start-building',
    label: 'Start from scratch',
    icon: 'Lightbulb',
    description: 'Not sure where to start? Aureon will guide you through the process.',
    category: 'build',
    prompt: 'I want to build something new but I\'m not sure where to start. First, ask me about my interests and skill level. Then suggest a simple project I can build and help me create it step by step. Keep it beginner-friendly.'
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
      { id: 'android-app', label: 'Android app', icon: 'Smartphone', description: 'A simple Android application' },
      { id: 'mini-game', label: 'Mini-game', icon: 'Gamepad2', description: 'A small browser game (puzzle, clicker, quiz)' },
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', description: 'A data dashboard with charts and stats' },
      { id: 'ai-tool', label: 'AI tool', icon: 'Sparkles', description: 'An app that uses AI (chatbot, analyzer, generator)' },
      { id: 'other', label: 'Something else', icon: 'Lightbulb', description: 'Describe it in your own words' }
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

export const TUTORIAL_CARDS: TutorialCard[] = [
  {
    id: 'what-is-provider',
    icon: 'KeyRound',
    question: 'What is a provider?',
    answer: 'A provider is the company or service that runs the AI model. Examples: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), or OpenRouter (access to many models). You need an API key from a provider to use Aureon Desk.'
  },
  {
    id: 'what-is-model',
    icon: 'Cpu',
    question: 'What is a model?',
    answer: 'A model is the actual AI brain that responds to your prompts. Different models have different strengths: some are fast, some are smart, some are free. You select a model before starting a chat.'
  },
  {
    id: 'what-is-project',
    icon: 'FolderOpen',
    question: 'What is a project?',
    answer: 'A project is a folder on your computer that contains your code. Aureon can read files from your project to understand context and help you better. Files are only sent to the AI when you explicitly use them in a chat.'
  },
  {
    id: 'what-is-live-preview',
    icon: 'Monitor',
    question: 'What is LivePreview?',
    answer: 'LivePreview lets you see your app running in real time inside Aureon Desk. You can build HTML pages, React apps, or run the Coding Demo. It runs on your computer only — not accessible from the internet.'
  },
  {
    id: 'what-is-safe-folder',
    icon: 'ShieldCheck',
    question: 'What is a safe local folder?',
    answer: 'A safe local folder is a project folder on your computer that Aureon can read from. Sensitive files like .env (API keys), .git folders, and node_modules are automatically excluded. Never put passwords or real API keys in project files — use the secure credential vault in Settings instead.'
  },
  {
    id: 'never-paste',
    icon: 'Shield',
    question: 'What should I never paste into chat?',
    answer: 'Never paste real passwords, API keys, credit card numbers, or private credentials into chat. These are sent to the AI provider. Use the secure credential vault in Settings > Providers for API keys. Aureon automatically redacts detected secrets, but you should still be careful.'
  },
  {
    id: 'test-before-push',
    icon: 'CheckCircle',
    question: 'How do I test before pushing?',
    answer: 'Before pushing code to GitHub: (1) run typecheck to catch errors, (2) run tests to verify nothing is broken, (3) run build to make sure the app compiles, (4) check for secrets with git grep. Aureon can help you with all of these — just ask!'
  },
  {
    id: 'what-is-build',
    icon: 'Package',
    question: 'What does "build" mean?',
    answer: 'Building turns your code into a runnable app. For web apps, it means creating the HTML/CSS/JS files. For desktop apps, it means packaging them into an installer (.exe). Aureon can help generate and preview code instantly, and guide you through the build process.'
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
    '- Keep files small and focused',
    '',
    'After generating code:',
    '- Run typecheck, tests, and build to verify',
    '- Do not hardcode any secrets or API keys',
    '- Document changes for Git commit'
  ]

  return parts.join('\n')
}

/**
 * PROMPT_TEMPLATES — flat registry of reusable prompt templates.
 * These are the "named templates" the user can reference by ID.
 */
export const PROMPT_TEMPLATES: Record<string, VibeTemplate> = Object.fromEntries(
  ONBOARDING_CARDS.map(card => [card.id, card])
)
