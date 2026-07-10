/**
 * Aureon Desk — Curated Internal Skill Starter Set
 *
 * These are original Aureon skills inspired by external skill categories.
 * Each skill is a starting point — users can Adapt external skills into
 * custom Aureon versions using the Skill Explorer UI.
 *
 * These are NOT copies of external content. They are original definitions
 * that describe what an Aureon implementation of each category would provide.
 */

import type { SkillCategory } from './external-skill-sources'

export interface CuratedSkill {
  id: string
  name: string
  category: SkillCategory
  description: string
  capabilities: string[]
  inspiredBy: string
  inspiredByUrl: string
  status: 'active' | 'planned' | 'placeholder'
}

export const CURATED_SKILLS: CuratedSkill[] = [
  {
    id: 'aureon-web-app-builder',
    name: 'Web App Builder',
    category: 'web-app-builder',
    description: 'Build complete, modern web applications with React, TypeScript, and Tailwind CSS. Generates project scaffolding, component architecture, routing, state management, and deployment configs following Aureon premium design principles.',
    capabilities: [
      'Generate Vite + React + TypeScript project scaffolds',
      'Design component trees with props contracts',
      'Wire Tailwind CSS v4 with Aureon calm ivory theme',
      'Set up React Router with hash-based routing',
      'Generate responsive layouts with sidebar + content patterns',
    ],
    inspiredBy: 'Various scaffold/build skills in awesome-agent-skills',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
  },
  {
    id: 'aureon-frontend-design',
    name: 'Frontend Design',
    category: 'frontend-design',
    description: 'Create beautiful, production-grade UI designs with calm ivory/graphite/bronze aesthetics. Covers typography, spacing, color systems, responsive layouts, component styling, and micro-interactions.',
    capabilities: [
      'Apply Aureon calm ivory palette to any UI',
      'Design responsive component layouts',
      'Create micro-interactions and transitions',
      'Build accessible components (WCAG AA)',
      'Generate design tokens and CSS variables',
    ],
    inspiredBy: 'anthropics/frontend-design, anthropics/canvas-design',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
  },
  {
    id: 'aureon-webapp-testing',
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
    inspiredBy: 'testmu-ai/playwright-skill, anthropics/webapp-testing',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
  },
  {
    id: 'aureon-mcp-builder',
    name: 'MCP Builder',
    category: 'mcp-builder',
    description: 'Build Model Context Protocol servers to integrate external APIs and services with Aureon Desk. Covers tool definitions, transport setup, error handling, and security best practices.',
    capabilities: [
      'Scaffold MCP server in TypeScript',
      'Define typed tool schemas',
      'Implement stdio and SSE transports',
      'Add authentication and rate limiting',
      'Write MCP server tests',
    ],
    inspiredBy: 'anthropics/mcp-builder',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'planned',
  },
  {
    id: 'aureon-android-testing',
    name: 'Android Prototype Testing',
    category: 'mobile-testing',
    description: 'Test Android applications with Espresso and Appium. Covers UI testing, device configuration, test fixtures, and CI integration for Android test suites.',
    capabilities: [
      'Generate Espresso UI tests in Kotlin',
      'Write Appium cross-platform test scripts',
      'Configure Android emulator for CI',
      'Set up test data fixtures',
      'Integrate with TestMu AI cloud devices',
    ],
    inspiredBy: 'testmu-ai/espresso-skill, testmu-ai/appium-skill',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'planned',
  },
  {
    id: 'aureon-api-testing',
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
    inspiredBy: 'testmu-ai/api-skill',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'planned',
  },
  {
    id: 'aureon-cicd-pipeline',
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
    inspiredBy: 'testmu-ai/cicd-pipeline-skill',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'planned',
  },
  {
    id: 'aureon-security-review',
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
    inspiredBy: 'Trail of Bits security skills',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'planned',
  },
  {
    id: 'aureon-brand-guidelines',
    name: 'Brand Guidelines',
    category: 'brand-guidelines',
    description: 'Apply consistent brand colors, typography, and visual identity to any output. Uses the Aureon calm ivory palette by default, customizable for any brand.',
    capabilities: [
      'Apply brand colors to all UI artifacts',
      'Configure typography scale and font pairing',
      'Generate brand-compliant color variants',
      'Create brand asset references',
      'Ensure dark/light mode brand consistency',
    ],
    inspiredBy: 'anthropics/brand-guidelines',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
  },
  {
    id: 'aureon-theme-factory',
    name: 'Theme Factory',
    category: 'theme-factory',
    description: 'Create and apply professional themes to artifacts, documents, and UI outputs. Ships with 10 preset themes (Calm Ivory, Premium Dark, Ocean, Forest, Sunset, Monochrome, Pastel, Neon, Vintage, Corporate).',
    capabilities: [
      'Apply 10 preset themes to any artifact',
      'Generate custom themes from reference',
      'Extract theme tokens from existing designs',
      'Create theme variations (light/dark/high-contrast)',
      'Export themes as CSS variables or JSON tokens',
    ],
    inspiredBy: 'anthropics/theme-factory',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
  },
  {
    id: 'aureon-documentation-writer',
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
    inspiredBy: 'anthropics/internal-comms, various doc skills',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'active',
  },
  {
    id: 'aureon-spreadsheet-pdf',
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
    inspiredBy: 'anthropics/xlsx, anthropics/pdf',
    inspiredByUrl: 'https://github.com/VoltAgent/awesome-agent-skills',
    status: 'placeholder',
  },
]
