/**
 * Vibeforge — Curated Skill Starter Set
 *
 * Concept Definitions (visible in Skills & Agents page):
 *   Agent      = Role      — a focused AI persona with a specific job
 *   Skill      = Workflow  — a repeatable set of steps producing a specific output
 *   Tool       = Action    — a single API call, command, or file operation
 *   MCP        = External tool connection — lets Vibeforge call external services
 *   Prompt Profile = Model behavior — a system prompt shaping how the model responds
 *
 * This file contains TWO groups:
 *   1. CANONICAL_SKILLS  — the 10 default Vibeforge skills shown in the Beginner tab
 *   2. CURATED_SKILLS    — extended set (includes old library skills) shown in Advanced
 *
 * None of these are copies of external content. They are original Vibeforge definitions.
 */

import type { SkillCategory } from './external-skill-sources'

export interface CuratedSkill {
  id: string
  name: string
  category: SkillCategory
  description: string
  capabilities: string[]
  /** Short example prompt shown in "Copy prompt" and "Use this" buttons */
  examplePrompt: string
  inspiredBy: string
  inspiredByUrl: string
  status: 'active' | 'planned' | 'placeholder'
  /** 'beginner' = shown in Beginner tab; 'advanced' = shown in Advanced tab only */
  tier: 'beginner' | 'advanced'
}

// ─── 10 Canonical Vibeforge Skills (Beginner tab) ────────────────────────────

export const CANONICAL_SKILLS: CuratedSkill[] = [
  {
    id: 'vb-build-with-preview',
    name: 'Build with Preview',
    category: 'web-app-builder',
    description: 'Build any web app and instantly see it running in the LivePreview panel. One prompt → generated files → live preview. The core Vibeforge workflow.',
    capabilities: [
      'Generate complete HTML/CSS/JS project from a single prompt',
      'Auto-start LivePreview server after build',
      'Show file tree and diff for every generated file',
      'Support Vite + React or plain HTML/CSS sandboxes',
    ],
    examplePrompt: 'Build a tiny counter app with ivory theme, increment button, reset button, and live preview.',
    inspiredBy: 'Vibeforge Build Pipeline',
    inspiredByUrl: 'https://github.com/mertgoevse-wq/Vibeforge-desk',
    status: 'active',
    tier: 'beginner',
  },
  {
    id: 'vb-fix-live-preview',
    name: 'Fix LivePreview',
    category: 'web-app-builder',
    description: 'Diagnose and repair a broken or blank LivePreview. Checks port conflicts, CSP issues, iframe loading, and preview server status automatically.',
    capabilities: [
      'Diagnose port conflict and binding errors',
      'Detect blank iframe / CSP blocking issues',
      'Restart preview server with corrected config',
      'Show diagnostics panel with live URL and error details',
    ],
    examplePrompt: 'My LivePreview is blank. Diagnose and fix the preview server.',
    inspiredBy: 'Vibeforge LivePreview Reliability Pass',
    inspiredByUrl: 'https://github.com/mertgoevse-wq/Vibeforge-desk',
    status: 'active',
    tier: 'beginner',
  },
  {
    id: 'vb-create-landing-page',
    name: 'Create Landing Page',
    category: 'frontend-design',
    description: 'Build a beautiful, responsive landing page with hero section, features list, and call-to-action. Uses Vibeforge calm ivory theme by default.',
    capabilities: [
      'Hero section with headline, sub-headline, and CTA',
      'Features grid with icons and descriptions',
      'Testimonials or social proof section',
      'Mobile-responsive layout out of the box',
    ],
    examplePrompt: 'Create a landing page for a developer productivity tool with a hero, features, and sign-up CTA.',
    inspiredBy: 'frontend-design skill category',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
    tier: 'beginner',
  },
  {
    id: 'vb-create-android-prototype',
    name: 'Create Android Prototype',
    category: 'mobile-testing',
    description: 'Generate an Android-style UI prototype using Material Design components. Creates interactive mockups that look and feel like real Android apps.',
    capabilities: [
      'Bottom navigation bar with 4–5 tabs',
      'Material Design cards, lists, and buttons',
      'Floating action button and app bar',
      'Touch-friendly interactive prototype',
    ],
    examplePrompt: 'Create an Android prototype for a fitness tracker app with step counter, workout history, and profile screen.',
    inspiredBy: 'mobile-testing skill category',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
    tier: 'beginner',
  },
  {
    id: 'vb-refactor-ui',
    name: 'Refactor UI',
    category: 'frontend-design',
    description: 'Improve an existing UI: remove dead buttons, consolidate duplicate controls, fix visual hierarchy, and apply Vibeforge design tokens consistently.',
    capabilities: [
      'Identify and remove duplicate or dead controls',
      'Standardise spacing, typography, and color tokens',
      'Improve component naming and file structure',
      'Generate before/after diff for every change',
    ],
    examplePrompt: 'Refactor this page UI — remove duplicate buttons, fix the layout, and apply the Vibeforge calm ivory theme consistently.',
    inspiredBy: 'frontend-design + code-quality',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
    tier: 'beginner',
  },
  {
    id: 'vb-test-provider',
    name: 'Test Provider',
    category: 'ai-development',
    description: 'Test a connected AI provider by sending a simple ping and verifying the response. Diagnoses API key problems, rate limits, and model availability.',
    capabilities: [
      'Send test completion request to provider',
      'Report HTTP status, latency, and model label',
      'Detect expired or invalid API keys',
      'Suggest fixes for common provider errors',
    ],
    examplePrompt: 'Test my OpenRouter provider connection and tell me if the API key is valid.',
    inspiredBy: 'Vibeforge Provider Doctor',
    inspiredByUrl: 'https://github.com/mertgoevse-wq/Vibeforge-desk',
    status: 'active',
    tier: 'beginner',
  },
  {
    id: 'vb-setup-mcp',
    name: 'Setup MCP',
    category: 'mcp-builder',
    description: 'Configure a Model Context Protocol server to connect an external service (API, database, terminal) to Vibeforge. Generate typed tool definitions and transport config.',
    capabilities: [
      'Scaffold MCP server in TypeScript',
      'Define typed tool schemas with input validation',
      'Choose stdio or SSE transport',
      'Add authentication and rate limiting stubs',
    ],
    examplePrompt: 'Set up an MCP server that connects Vibeforge to my local PostgreSQL database.',
    inspiredBy: 'anthropics/mcp-builder',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'planned',
    tier: 'beginner',
  },
  {
    id: 'vb-generate-docs',
    name: 'Generate Docs',
    category: 'documentation',
    description: 'Write clear, structured technical documentation: READMEs, API references, changelogs, and user guides in Markdown.',
    capabilities: [
      'Generate a professional README from codebase scan',
      'Write API reference documentation',
      'Create architecture decision records (ADRs)',
      'Format changelogs with Keep a Changelog',
    ],
    examplePrompt: 'Generate a complete README for this project with setup instructions, feature overview, and API docs.',
    inspiredBy: 'documentation skill category',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
    tier: 'beginner',
  },
  {
    id: 'vb-build-beta',
    name: 'Build Beta',
    category: 'cicd-pipeline',
    description: 'Run the full pre-release gate: verify native modules, typecheck, unit tests, production build, and package installer. Reports pass/fail for every gate.',
    capabilities: [
      'Run verify:native, typecheck, vitest run',
      'Execute electron-vite production build',
      'Package installer with electron-builder',
      'Report build artifacts and file sizes',
    ],
    examplePrompt: 'Build a beta installer for Vibeforge, run all tests, and report the results.',
    inspiredBy: 'Vibeforge Beta Gate Protocol',
    inspiredByUrl: 'https://github.com/mertgoevse-wq/Vibeforge-desk',
    status: 'active',
    tier: 'beginner',
  },
  {
    id: 'vb-run-human-qa',
    name: 'Run Human QA',
    category: 'webapp-testing',
    description: 'Execute the headed Playwright human-serious QA suite: opens a real browser, clicks through every major screen, and captures screenshots of the results.',
    capabilities: [
      'Launch headed Playwright browser with slow-motion',
      'Walk through all major app screens',
      'Capture screenshots at each step',
      'Generate human-readable QA report',
    ],
    examplePrompt: 'Run the full human QA suite on Vibeforge and give me a screenshot report.',
    inspiredBy: 'Vibeforge Human QA Protocol',
    inspiredByUrl: 'https://github.com/mertgoevse-wq/Vibeforge-desk',
    status: 'active',
    tier: 'beginner',
  },
]

// ─── Extended Skill Library (Advanced tab) ────────────────────────────────────
// These are the original 12 skills from the skill library.
// Kept for reference and advanced users. IDs updated from Vibeforge- to vb- prefix.

export const CURATED_SKILLS: CuratedSkill[] = [
  ...CANONICAL_SKILLS,
  {
    id: 'vb-web-app-builder',
    name: 'Web App Builder',
    category: 'web-app-builder',
    description: 'Build complete, modern web applications with React, TypeScript, and Tailwind CSS. Generates project scaffolding, component architecture, routing, state management, and deployment configs.',
    capabilities: [
      'Generate Vite + React + TypeScript project scaffolds',
      'Design component trees with props contracts',
      'Wire Tailwind CSS v4 with Vibeforge calm ivory theme',
      'Set up React Router with hash-based routing',
      'Generate responsive layouts with sidebar + content patterns',
    ],
    examplePrompt: 'Build a full web app with React and TypeScript — sidebar, main content area, and settings page.',
    inspiredBy: 'Various scaffold/build skills in awesome-agent-skills',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
    tier: 'advanced',
  },
  {
    id: 'vb-frontend-design',
    name: 'Frontend Design System',
    category: 'frontend-design',
    description: 'Create beautiful, production-grade UI designs with calm ivory/graphite/bronze aesthetics. Covers typography, spacing, color systems, responsive layouts, component styling, and micro-interactions.',
    capabilities: [
      'Apply Vibeforge calm ivory palette to any UI',
      'Design responsive component layouts',
      'Create micro-interactions and transitions',
      'Build accessible components (WCAG AA)',
      'Generate design tokens and CSS variables',
    ],
    examplePrompt: 'Design a complete UI design system with tokens, typography, spacing, and component library.',
    inspiredBy: 'anthropics/frontend-design',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
    tier: 'advanced',
  },
  {
    id: 'vb-webapp-testing',
    name: 'Web App Testing',
    category: 'webapp-testing',
    description: 'Write comprehensive test suites for web applications using Playwright and Vitest. Covers unit, integration, E2E, visual regression, and accessibility testing patterns.',
    capabilities: [
      'Generate Playwright E2E test scripts',
      'Write Vitest unit and integration tests',
      'Set up test fixtures and helpers',
      'Configure CI-ready test runners',
      'Create visual regression test configs',
    ],
    examplePrompt: 'Write a complete Playwright E2E test suite for my React app covering login, dashboard, and settings flows.',
    inspiredBy: 'testmu-ai/playwright-skill',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
    tier: 'advanced',
  },
  {
    id: 'vb-mcp-builder',
    name: 'MCP Builder',
    category: 'mcp-builder',
    description: 'Build Model Context Protocol servers to integrate external APIs and services with Vibeforge. Covers tool definitions, transport setup, error handling, and security best practices.',
    capabilities: [
      'Scaffold MCP server in TypeScript',
      'Define typed tool schemas',
      'Implement stdio and SSE transports',
      'Add authentication and rate limiting',
      'Write MCP server tests',
    ],
    examplePrompt: 'Build an MCP server for my REST API with 3 tools: search, create, and delete.',
    inspiredBy: 'anthropics/mcp-builder',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'planned',
    tier: 'advanced',
  },
  {
    id: 'vb-android-testing',
    name: 'Android Test Suite',
    category: 'mobile-testing',
    description: 'Test Android applications with Espresso and Appium. Covers UI testing, device configuration, test fixtures, and CI integration.',
    capabilities: [
      'Generate Espresso UI tests in Kotlin',
      'Write Appium cross-platform test scripts',
      'Configure Android emulator for CI',
      'Set up test data fixtures',
      'Integrate with TestMu AI cloud devices',
    ],
    examplePrompt: 'Write Espresso UI tests for my Android app covering the login screen and main dashboard.',
    inspiredBy: 'testmu-ai/espresso-skill',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'planned',
    tier: 'advanced',
  },
  {
    id: 'vb-api-testing',
    name: 'API Testing',
    category: 'api-testing',
    description: 'Test REST, GraphQL, and gRPC APIs with comprehensive validation patterns. Covers contract testing, mock servers, performance testing, and security validation.',
    capabilities: [
      'Generate API test suites with Supertest/pytest',
      'Create OpenAPI schema validation tests',
      'Set up mock API servers',
      'Write performance/load test scripts',
      'Add security header and auth validation',
    ],
    examplePrompt: 'Write a complete API test suite for my REST endpoints: GET /users, POST /users, PUT /users/:id.',
    inspiredBy: 'testmu-ai/api-skill',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'planned',
    tier: 'advanced',
  },
  {
    id: 'vb-cicd-pipeline',
    name: 'CI/CD Pipeline',
    category: 'cicd-pipeline',
    description: 'Configure CI/CD pipelines for GitHub Actions, GitLab CI, and Azure DevOps. Covers build, test, deploy stages with caching, secrets management, and environment promotion.',
    capabilities: [
      'Generate GitHub Actions workflow files',
      'Configure multi-stage deployment pipelines',
      'Set up test matrix strategies',
      'Add artifact caching and dependency management',
      'Configure secrets and environment variables',
    ],
    examplePrompt: 'Create a GitHub Actions CI/CD pipeline for my Node.js app: test, build, and deploy to Vercel.',
    inspiredBy: 'testmu-ai/cicd-pipeline-skill',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'planned',
    tier: 'advanced',
  },
  {
    id: 'vb-security-review',
    name: 'Security Review',
    category: 'security-review',
    description: 'Review codebases and configurations for security vulnerabilities, OWASP top 10 issues, secrets exposure, and compliance with security best practices.',
    capabilities: [
      'Scan for hardcoded secrets and API keys',
      'Review dependency trees for known CVEs',
      'Check auth flows for OWASP compliance',
      'Audit file permissions and access patterns',
      'Generate security review reports',
    ],
    examplePrompt: 'Review my authentication code for security vulnerabilities and OWASP compliance.',
    inspiredBy: 'Trail of Bits security skills',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'planned',
    tier: 'advanced',
  },
  {
    id: 'vb-brand-guidelines',
    name: 'Brand Guidelines',
    category: 'brand-guidelines',
    description: 'Apply consistent brand colors, typography, and visual identity to any output. Uses Vibeforge calm ivory palette by default, customizable for any brand.',
    capabilities: [
      'Apply brand colors to all UI artifacts',
      'Configure typography scale and font pairing',
      'Generate brand-compliant color variants',
      'Create brand asset references',
      'Ensure dark/light mode brand consistency',
    ],
    examplePrompt: 'Apply our brand guidelines (primary color #2563EB, Inter font) to this landing page.',
    inspiredBy: 'anthropics/brand-guidelines',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
    tier: 'advanced',
  },
  {
    id: 'vb-theme-factory',
    name: 'Theme Factory',
    category: 'theme-factory',
    description: 'Create and apply professional themes to artifacts and UI outputs. Ships with 10 preset themes including Calm Ivory, Premium Dark, Ocean, Forest, Sunset, Monochrome, and more.',
    capabilities: [
      'Apply 10 preset themes to any artifact',
      'Generate custom themes from reference',
      'Extract theme tokens from existing designs',
      'Create theme variations (light/dark/high-contrast)',
      'Export themes as CSS variables or JSON tokens',
    ],
    examplePrompt: 'Apply the Premium Dark theme to this dashboard UI and export the CSS token file.',
    inspiredBy: 'anthropics/theme-factory',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
    tier: 'advanced',
  },
  {
    id: 'vb-documentation-writer',
    name: 'Documentation Writer',
    category: 'documentation',
    description: 'Write clear, structured technical documentation in Markdown. Covers READMEs, API docs, changelogs, architecture decision records, and user guides.',
    capabilities: [
      'Generate comprehensive README files',
      'Write API reference documentation',
      'Create architecture decision records (ADRs)',
      'Format changelogs with Keep a Changelog',
      'Generate user guides and tutorials',
    ],
    examplePrompt: 'Write a professional README for this project with badges, setup instructions, and API docs.',
    inspiredBy: 'anthropics/internal-comms',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
    tier: 'advanced',
  },
  {
    id: 'vb-spreadsheet-pdf',
    name: 'Spreadsheets & PDFs',
    category: 'spreadsheet-pdf',
    description: 'Create, edit, and analyze spreadsheet and PDF documents programmatically. Covers Excel formulas, data analysis, PDF generation, and form handling.',
    capabilities: [
      'Generate Excel workbooks with formulas',
      'Analyze CSV and spreadsheet data',
      'Create PDF documents from templates',
      'Extract text and data from PDFs',
      'Generate data visualizations in spreadsheets',
    ],
    examplePrompt: 'Generate a monthly expense report Excel file with auto-summing formulas and a chart.',
    inspiredBy: 'anthropics/xlsx, anthropics/pdf',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'placeholder',
    tier: 'advanced',
  },
]
