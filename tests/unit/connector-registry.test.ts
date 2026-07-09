import { describe, it, expect } from 'vitest'
import {
  CONNECTOR_REGISTRY, GMAIL_ACTIONS, GMAIL_SCOPES, GMAIL_OAUTH_CONFIG,
  getConnector, getAllConnectors, getConnectorsByCategory,
  getDangerousActions, getActionsRequiringConfirmation, getOAuthScopes,
} from '../../src/shared/connectors'
import type { ConnectorType } from '../../src/shared/types/studio-core'

// ---- Connector Registry Tests ----

describe('Connector Registry', () => {
  it('should define all 12 connectors', () => {
    const all = getAllConnectors()
    expect(all.length).toBe(12)
  })

  it('should have unique connector IDs', () => {
    const ids = getAllConnectors().map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should return a connector by ID', () => {
    const c = getConnector('openai')
    expect(c).toBeDefined()
    expect(c.displayName).toBe('OpenAI / ChatGPT API')
    expect(c.authType).toBe('api_key')
  })

  it('should categorize connectors correctly', () => {
    const aiProviders = getConnectorsByCategory('ai_provider')
    expect(aiProviders.length).toBeGreaterThanOrEqual(3) // openai, google_gemini, google_ai_studio, openrouter

    const locals = getConnectorsByCategory('local')
    expect(locals.map(c => c.id)).toEqual(expect.arrayContaining(['ollama', 'lm_studio']))

    const future = getConnectorsByCategory('future')
    expect(future.map(c => c.id)).toEqual(['phone_companion'])
  })

  it('should have actions for all connectors', () => {
    for (const c of getAllConnectors()) {
      expect(c.actions.length).toBeGreaterThan(0)
      // Each action should have a unique ID within the connector
      const actionIds = c.actions.map(a => a.id)
      expect(new Set(actionIds).size).toBe(actionIds.length)
    }
  })

  it('should have capabilities for most connectors', () => {
    const connectorsWithCaps = getAllConnectors().filter(c => c.capabilities.length > 0)
    expect(connectorsWithCaps.length).toBeGreaterThanOrEqual(10) // phone_companion has 0
  })
})

// ---- Gmail Action Safety Tests ----

describe('Gmail Action Safety', () => {
  it('should define Gmail OAuth scopes', () => {
    expect(GMAIL_SCOPES.length).toBe(4)
    // All scopes should be optional (user chooses)
    for (const scope of GMAIL_SCOPES) {
      expect(scope.required).toBe(false)
    }
  })

  it('should have OAuth config with proper storage strategy', () => {
    expect(GMAIL_OAUTH_CONFIG.storageStrategy).toBe('safeStorage')
    expect(GMAIL_OAUTH_CONFIG.provider).toBe('google')
    expect(GMAIL_OAUTH_CONFIG.scopes.length).toBe(4)
  })

  it('should mark send_draft as requiring double confirmation', () => {
    const sendAction = GMAIL_ACTIONS.find(a => a.id === 'gmail.send_draft')!
    expect(sendAction.requiresConfirmation).toBe(true)
    expect(sendAction.requiresDoubleConfirmation).toBe(true)
    expect(sendAction.risk).toBe('account')
  })

  it('should mark trash as requiring double confirmation', () => {
    const trashAction = GMAIL_ACTIONS.find(a => a.id === 'gmail.trash')!
    expect(trashAction.requiresConfirmation).toBe(true)
    expect(trashAction.requiresDoubleConfirmation).toBe(true)
    expect(trashAction.risk).toBe('destructive')
  })

  it('should NOT auto-send — send_draft requires confirmation', () => {
    const sendAction = GMAIL_ACTIONS.find(a => a.id === 'gmail.send_draft')!
    expect(sendAction.requiresConfirmation).toBe(true)
  })

  it('should allow reading inbox without confirmation', () => {
    const readAction = GMAIL_ACTIONS.find(a => a.id === 'gmail.read_inbox')!
    expect(readAction.requiresConfirmation).toBe(false)
    expect(readAction.risk).toBe('read')
  })

  it('should have confirmation messages for all actions that require confirmation', () => {
    const confirmingActions = GMAIL_ACTIONS.filter(a => a.requiresConfirmation)
    for (const action of confirmingActions) {
      expect(action.confirmationMessage).toBeTruthy()
    }
    expect(confirmingActions.length).toBeGreaterThanOrEqual(4) // create_draft, update_draft, send_draft, label, trash
  })

  it('should have all Gmail actions defined', () => {
    expect(GMAIL_ACTIONS.length).toBe(7)
    const actionIds = GMAIL_ACTIONS.map(a => a.id)
    expect(actionIds).toEqual(expect.arrayContaining([
      'gmail.read_inbox',
      'gmail.search',
      'gmail.create_draft',
      'gmail.update_draft',
      'gmail.send_draft',
      'gmail.label',
      'gmail.trash',
    ]))
  })

  it('should have the Gmail connector in the registry with the correct actions', () => {
    const gmail = getConnector('gmail')
    expect(gmail.actions.length).toBe(7)
    expect(gmail.authType).toBe('oauth')
    expect(gmail.scopes.length).toBe(4)
    expect(gmail.riskLevel).toBe('account')
  })
})

// ---- MCP Connector Tests ----

describe('MCP Connector Safety', () => {
  it('should have MCP connector with destructive risk level', () => {
    const mcp = getConnector('mcp_server')
    expect(mcp.riskLevel).toBe('destructive')
    expect(mcp.authType).toBe('mcp')
  })

  it('should mark destructive MCP actions with double confirmation', () => {
    const destructiveAction = getConnector('mcp_server').actions.find(a => a.id === 'mcp.destructive')!
    expect(destructiveAction.requiresConfirmation).toBe(true)
    expect(destructiveAction.requiresDoubleConfirmation).toBe(true)
  })

  it('should have read-only MCP actions that do NOT require confirmation', () => {
    const readActions = getConnector('mcp_server').actions.filter(a => a.risk === 'read')
    for (const action of readActions) {
      expect(action.requiresConfirmation).toBe(false)
    }
    expect(readActions.length).toBeGreaterThanOrEqual(2) // search, git, summary
  })
})

// ---- Helper Function Tests ----

describe('Connector Helper Functions', () => {
  it('getDangerousActions should find destructive and account actions', () => {
    const gmailDangerous = getDangerousActions('gmail')
    expect(gmailDangerous.length).toBeGreaterThanOrEqual(1)
    expect(gmailDangerous.map(a => a.id)).toContain('gmail.send_draft')
    expect(gmailDangerous.map(a => a.id)).toContain('gmail.trash')
  })

  it('getActionsRequiringConfirmation should find all confirm-required actions', () => {
    const gmailConfirming = getActionsRequiringConfirmation('gmail')
    expect(gmailConfirming.length).toBeGreaterThanOrEqual(4)
  })

  it('getOAuthScopes should return scopes for OAuth connectors', () => {
    const gmailScopes = getOAuthScopes('gmail')
    expect(gmailScopes.length).toBe(4)

    // API key connectors should have empty scopes
    const openaiScopes = getOAuthScopes('openai')
    expect(openaiScopes.length).toBe(0)
  })
})

// ---- Token & Secret Safety Tests ----

describe('Token & Secret Safety', () => {
  it('should use safeStorage for OAuth connectors', () => {
    expect(GMAIL_OAUTH_CONFIG.storageStrategy).toBe('safeStorage')
  })

  it('should not have raw token paths in OAuth config', () => {
    const config = GMAIL_OAUTH_CONFIG
    // No file paths for token storage — uses safeStorage API
    expect(config.tokenUrl).not.toContain('file://')
    expect(config.tokenUrl).not.toContain('C:\\')
  })

  it('should have scopes that are opt-in, not required', () => {
    for (const scope of GMAIL_SCOPES) {
      expect(scope.required).toBe(false)
    }
  })
})

// ---- Phone Companion Placeholder Tests ----

describe('Phone Companion Placeholder', () => {
  it('should have planned status', () => {
    const phone = getConnector('phone_companion')
    expect(phone.status).toBe('planned')
    expect(phone.setupStatus).toBe('planned')
    expect(phone.category).toBe('future')
  })

  it('should have no capabilities yet', () => {
    const phone = getConnector('phone_companion')
    expect(phone.capabilities.length).toBe(0)
  })

  it('should not support test connection', () => {
    const phone = getConnector('phone_companion')
    expect(phone.supportsTestConnection).toBe(false)
  })

  it('should have planned actions with local-only risk notes', () => {
    const phone = getConnector('phone_companion')
    expect(phone.actions.length).toBeGreaterThan(0)
    expect(phone.riskNotes).toContain('local network')
    expect(phone.riskNotes).toContain('no cloud relay')
  })
})

describe('Connector Cards — Expand & Detail Contracts', () => {
  it('should have setup guidance for all non-connected connectors', () => {
    const notConnected = getAllConnectors().filter(c => c.status === 'not_connected' || c.status === 'needs_setup')
    expect(notConnected.length).toBeGreaterThanOrEqual(4) // openai, google, gmail, drive, calendar, github, etc.
    for (const c of notConnected) {
      expect(c.setupStatus).toBeTruthy()
    }
  })

  it('should have docs URL for all non-planned connectors', () => {
    const nonPlanned = getAllConnectors().filter(c => c.status !== 'planned')
    expect(nonPlanned.length).toBeGreaterThanOrEqual(10)
    for (const c of nonPlanned) {
      expect(c.docsUrl).toBeTruthy()
    }
  })

  it('should not have fake vendor logos — uses iconKey only', () => {
    for (const c of getAllConnectors()) {
      expect(c.iconKey).toBeTruthy()
      expect(typeof c.iconKey).toBe('string')
      // No vendor logo path should exist
      expect(c.iconKey).not.toContain('.png')
      expect(c.iconKey).not.toContain('.svg')
      expect(c.iconKey).not.toContain('brand')
    }
  })

  it('should have unique displayNames across all connectors', () => {
    const names = getAllConnectors().map(c => c.displayName)
    expect(new Set(names).size).toBe(names.length)
  })
})
