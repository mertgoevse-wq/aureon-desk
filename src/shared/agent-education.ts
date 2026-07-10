/**
 * Aureon Desk — Agent Education Center
 *
 * Beginner-friendly explanations for all Aureon agents.
 * Maps to agent IDs in src/main/services/agent-registry.ts.
 * Each agent has a simple explanation, icon, example prompt, and "when to use" guide.
 */

import type { SkillEducation } from './skill-education'

export type AgentCategory =
  | 'builder'
  | 'preview'
  | 'design'
  | 'debugging'
  | 'providers'
  | 'social'
  | 'tutorial'
  | 'security'
  | 'performance'
  | 'cleanup'
  | 'research'
  | 'docs'
  | 'general'

export interface AgentEducation {
  id: string
  name: string
  icon: string // Lucide icon name
  category: AgentCategory[]
  beginnerExplanation: string
  whenToUse: string
  skillsUsed: string[]
  permissions: string[]
  examplePrompt: string
  isDestructive: boolean
}

export const AGENT_EDUCATION: AgentEducation[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    icon: 'MessageSquare',
    category: ['general'],
    beginnerExplanation: 'Your friendly helper for everyday questions, explanations, and conversations. Think of it as a knowledgeable friend who can read files and answer questions about anything in your project.',
    whenToUse: 'When you have a general question, need something explained, or want help with files and folders.',
    skillsUsed: ['communication', 'explanation'],
    permissions: ['file_read'],
    examplePrompt: 'Explain what this project does and how the files are organized.',
    isDestructive: false,
  },
  {
    id: 'code-architect',
    name: 'Builder Agent',
    icon: 'Hammer',
    category: ['builder'],
    beginnerExplanation: 'Your code builder. Designs and writes complete software features — from planning the architecture to writing every file. Like having a senior developer who can build anything.',
    whenToUse: 'When you want to create a new feature, app, component, or API. Tell it what you want to build and it plans + writes the code.',
    skillsUsed: ['code-generation', 'architecture', 'typescript', 'react', 'nodejs'],
    permissions: ['file_read', 'file_write'],
    examplePrompt: 'Build a todo app with React and TypeScript. Add dark mode support.',
    isDestructive: false,
  },
  {
    id: 'debugger',
    name: 'Debugger Agent',
    icon: 'Bug',
    category: ['debugging'],
    beginnerExplanation: 'Your bug hunter. Reads error messages, stack traces, and log files to find and fix problems in your code. Explains what went wrong in plain English.',
    whenToUse: 'When you see an error, crash, or unexpected behavior. Paste the error message and it finds the root cause.',
    skillsUsed: ['debugging', 'code-analysis', 'logging'],
    permissions: ['file_read', 'terminal_read'],
    examplePrompt: "I'm getting 'Cannot read property of undefined' in my React component. Help me fix it.",
    isDestructive: false,
  },
  {
    id: 'refactor-engineer',
    name: 'Cleanup Agent',
    icon: 'Paintbrush',
    category: ['cleanup'],
    beginnerExplanation: 'Your code tidier. Improves code structure without changing what it does. Makes messy code readable, removes dead code, and optimizes performance.',
    whenToUse: 'When your code works but looks messy, or when you want to remove unused files and old code.',
    skillsUsed: ['refactoring', 'code-quality', 'testing'],
    permissions: ['file_read', 'file_write'],
    examplePrompt: 'Clean up this project — remove dead code, fix naming, and improve readability.',
    isDestructive: false,
  },
  {
    id: 'test-engineer',
    name: 'Test Engineer',
    icon: 'TestTube',
    category: ['builder'],
    beginnerExplanation: 'Your quality checker. Writes tests to make sure your code works correctly — unit tests, integration tests, and end-to-end tests.',
    whenToUse: 'When you want to add tests to existing code or write test-first code. Ensures nothing breaks when you make changes.',
    skillsUsed: ['testing', 'code-analysis'],
    permissions: ['file_read', 'file_write'],
    examplePrompt: 'Write comprehensive tests for my user authentication flow.',
    isDestructive: false,
  },
  {
    id: 'documentation-writer',
    name: 'Docs Writer Agent',
    icon: 'BookOpen',
    category: ['docs'],
    beginnerExplanation: 'Your documentation writer. Creates clear READMEs, API docs, changelogs, and guides. Makes your project understandable for others.',
    whenToUse: 'When you need documentation — a README, API reference, or user guide. Explains things clearly.',
    skillsUsed: ['writing', 'explanation', 'markdown'],
    permissions: ['file_write'],
    examplePrompt: 'Write a professional README for this project with setup instructions and API docs.',
    isDestructive: false,
  },
  {
    id: 'git-assistant',
    name: 'Git Assistant',
    icon: 'GitBranch',
    category: ['builder', 'cleanup'],
    beginnerExplanation: 'Your version control helper. Manages git commits, branches, merges, and pull requests. Helps you keep your code history organized.',
    whenToUse: 'When you need to commit changes, create branches, merge code, or understand git status.',
    skillsUsed: ['git', 'version-control'],
    permissions: ['git_read', 'git_write'],
    examplePrompt: 'Create a branch for the new feature, commit the changes, and push to GitHub.',
    isDestructive: true,
  },
  {
    id: 'prompt-engineer',
    name: 'Prompt Engineer',
    icon: 'Wand',
    category: ['general'],
    beginnerExplanation: 'Your AI instruction crafter. Creates effective system prompts and templates. Helps you get better results from AI providers.',
    whenToUse: 'When you want to create or improve a system prompt, or need help phrasing your request for better AI results.',
    skillsUsed: ['prompt-engineering', 'writing'],
    permissions: [],
    examplePrompt: 'Create a system prompt for an AI that helps beginners learn to code.',
    isDestructive: false,
  },
  {
    id: 'research-synthesizer',
    name: 'Research Agent',
    icon: 'Search',
    category: ['research'],
    beginnerExplanation: 'Your researcher. Finds information online, reads documentation, and combines findings into clear summaries with sources.',
    whenToUse: 'When you need to research a topic, understand a new technology, or find answers from multiple sources.',
    skillsUsed: ['research', 'synthesis', 'writing'],
    permissions: ['network_outbound'],
    examplePrompt: 'Research the best ways to deploy an Electron app for Windows and summarize the options.',
    isDestructive: false,
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    icon: 'BarChart',
    category: ['research'],
    beginnerExplanation: 'Your data expert. Analyzes datasets, writes database queries, and creates visualizations to help you understand your data.',
    whenToUse: 'When you have data to analyze — CSV files, databases, or JSON — and want insights or charts.',
    skillsUsed: ['data-analysis', 'sql', 'visualization'],
    permissions: ['file_read', 'db_read'],
    examplePrompt: 'Analyze this sales data CSV and show me monthly trends.',
    isDestructive: false,
  },
  {
    id: 'security-reviewer',
    name: 'Security Reviewer',
    icon: 'Shield',
    category: ['security'],
    beginnerExplanation: 'Your security guard. Scans your code for vulnerabilities, checks for exposed secrets, and recommends security improvements.',
    whenToUse: 'When you want to make sure your app is secure — no exposed API keys, safe authentication, and protected data.',
    skillsUsed: ['security', 'code-analysis', 'auditing'],
    permissions: ['file_read'],
    examplePrompt: 'Review my authentication code for security vulnerabilities.',
    isDestructive: false,
  },
  {
    id: 'ux-product-designer',
    name: 'UI Designer Agent',
    icon: 'Palette',
    category: ['design'],
    beginnerExplanation: 'Your designer. Creates beautiful interfaces, layouts, and visual styles. Knows the Aureon calm ivory design system inside out.',
    whenToUse: 'When you want to improve the look of your app, design a new page, or create a consistent visual style.',
    skillsUsed: ['design', 'ui-ux', 'css', 'accessibility'],
    permissions: ['file_write'],
    examplePrompt: 'Design a beautiful landing page with the Aureon calm ivory theme.',
    isDestructive: false,
  },
  {
    id: 'live-preview',
    name: 'LivePreview Agent',
    icon: 'Monitor',
    category: ['preview'],
    beginnerExplanation: 'Your live preview runner. Starts a local server and shows your app running in real-time. See your changes instantly.',
    whenToUse: 'When you build something and want to see it working in a live browser preview.',
    skillsUsed: ['code-generation', 'design'],
    permissions: ['file_read', 'file_write', 'terminal_write'],
    examplePrompt: 'Start a live preview of my React app and show it running.',
    isDestructive: false,
  },
  {
    id: 'provider-doctor',
    name: 'Provider Doctor',
    icon: 'Stethoscope',
    category: ['providers'],
    beginnerExplanation: 'Your AI provider troubleshooter. Tests connections to AI providers, diagnoses API key issues, and helps you set up new models.',
    whenToUse: 'When your AI provider is not working, you get API errors, or you want to add a new provider.',
    skillsUsed: ['debugging', 'code-analysis'],
    permissions: ['network_outbound'],
    examplePrompt: 'OpenRouter is giving me an error. Help me fix the API connection.',
    isDestructive: false,
  },
  {
    id: 'social-draft',
    name: 'Social Draft Agent',
    icon: 'Share2',
    category: ['social'],
    beginnerExplanation: 'Your social media helper. Drafts posts, descriptions, and content for social platforms. Creates content that fits each platform.',
    whenToUse: 'When you need to create social media content — posts, video descriptions, or announcements.',
    skillsUsed: ['writing', 'prompt-engineering'],
    permissions: [],
    examplePrompt: 'Write a YouTube video description for my coding tutorial about React hooks.',
    isDestructive: false,
  },
  {
    id: 'tutorial-agent',
    name: 'Tutorial Agent',
    icon: 'GraduationCap',
    category: ['tutorial'],
    beginnerExplanation: 'Your teacher. Creates step-by-step tutorials, guides, and learning materials. Breaks down complex topics into simple lessons.',
    whenToUse: 'When you want to learn something new or create educational content for others.',
    skillsUsed: ['writing', 'explanation', 'markdown'],
    permissions: ['file_write'],
    examplePrompt: 'Create a beginner tutorial for building a React counter app from scratch.',
    isDestructive: false,
  },
]

/**
 * Simulates auto-selection routing for the LearnPage education tab.
 * Returns the best agent + skill for a given prompt using keyword matching.
 * This is an educational simulation — real routing uses src/main/services/routing-policy.ts.
 *
 * Shared between LearnPage.tsx and tests/unit/agent-skill-education.test.ts
 * to avoid duplication.
 */
export function simulateAutoSelect(
  prompt: string,
  skills: SkillEducation[],
): { agent: AgentEducation; skill: SkillEducation } {
  const lower = prompt.toLowerCase()

  let agent = AGENT_EDUCATION.find(a => a.id === 'code-architect')!
  let skill = skills.find(s => s.id === 'create-todo-app')!

  if (/landing page|hero|homepage/i.test(lower)) {
    agent = AGENT_EDUCATION.find(a => a.id === 'ux-product-designer')!
    skill = skills.find(s => s.id === 'create-landing-page')!
  } else if (/debug|error|bug|fix|crash/i.test(lower)) {
    agent = AGENT_EDUCATION.find(a => a.id === 'debugger')!
    skill = skills.find(s => s.id === 'explain-error')!
  } else if (/preview|live|start server/i.test(lower)) {
    agent = AGENT_EDUCATION.find(a => a.id === 'live-preview')!
    skill = skills.find(s => s.id === 'start-live-preview')!
  } else if (/test provider|api key|connection/i.test(lower)) {
    agent = AGENT_EDUCATION.find(a => a.id === 'provider-doctor')!
    skill = skills.find(s => s.id === 'test-provider')!
  } else if (/social|post|tweet|youtube|linkedin/i.test(lower)) {
    agent = AGENT_EDUCATION.find(a => a.id === 'social-draft')!
    skill = skills.find(s => s.id === 'draft-social-post')!
  } else if (/design|ui|style|theme|color/i.test(lower)) {
    agent = AGENT_EDUCATION.find(a => a.id === 'ux-product-designer')!
    skill = skills.find(s => s.id === 'improve-ui-theme')!
  } else if (/docs|documentation|readme|write/i.test(lower)) {
    agent = AGENT_EDUCATION.find(a => a.id === 'documentation-writer')!
    skill = skills.find(s => s.id === 'create-tutorial')!
  } else if (/clean|remove dead|unused|refactor/i.test(lower)) {
    agent = AGENT_EDUCATION.find(a => a.id === 'refactor-engineer')!
    skill = skills.find(s => s.id === 'clean-dead-code')!
  } else if (/counter|increment/i.test(lower)) {
    skill = skills.find(s => s.id === 'create-counter-app')!
  }

  return { agent, skill }
}
