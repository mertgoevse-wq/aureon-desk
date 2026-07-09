import { describe, expect, it } from 'vitest'
import {
  CONNECTOR_PRESETS,
  getConnectorPreset,
  getConnectorPresetsByStatus,
  validateConnectorPreset,
} from '../../src/shared/connector-presets'

describe('Connector Preset Registry', () => {
  it('defines every requested preset with unique IDs', () => {
    expect(CONNECTOR_PRESETS).toHaveLength(15)
    const ids = CONNECTOR_PRESETS.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(expect.arrayContaining([
      'openai_api',
      'google_gemini_api',
      'openrouter',
      'anthropic',
      'gmail_oauth',
      'google_drive_oauth',
      'google_calendar_oauth',
      'github',
      'mcp_server_custom',
      'local_ollama',
      'lm_studio',
      'phone_companion',
      'whatsapp_business_api',
      'email_smtp_imap',
      'browser_search_mcp',
    ]))
  })

  it('validates all preset contracts', () => {
    for (const preset of CONNECTOR_PRESETS) {
      expect(validateConnectorPreset(preset)).toEqual([])
      expect(preset.requiredFields.every((field) => field.id && field.label)).toBe(true)
      expect(preset.testConnectionBehavior).toBeTruthy()
      expect(preset.neutralIcon).not.toContain('.png')
      expect(preset.neutralIcon).not.toContain('.svg')
      expect(preset.neutralIcon).not.toContain('brand')
    }
  })

  it('renders Gmail OAuth scopes and requires approval semantics', () => {
    const gmail = getConnectorPreset('gmail_oauth')
    expect(gmail).toBeDefined()
    expect(gmail!.authType).toBe('oauth')
    expect(gmail!.scopes).toEqual(expect.arrayContaining([
      'gmail.readonly',
      'gmail.compose',
      'gmail.send',
      'gmail.modify',
    ]))
    expect(gmail!.permissions.join(' ')).toMatch(/approval/i)
    expect(gmail!.limitations.join(' ')).toMatch(/No email is sent automatically/i)
  })

  it('marks WhatsApp as official Business API placeholder only', () => {
    const whatsapp = getConnectorPreset('whatsapp_business_api')
    expect(whatsapp).toBeDefined()
    expect(whatsapp!.status).toBe('planned')
    expect(whatsapp!.mockMode).toBe(true)
    expect(whatsapp!.displayName).toBe('WhatsApp Business API')
    expect(whatsapp!.limitations.join(' ')).toMatch(/No unauthorized WhatsApp Web\/mobile automation/i)
    expect(whatsapp!.limitations.join(' ')).toMatch(/No personal-account automation/i)
  })

  it('marks Phone Companion planned with no active phone control', () => {
    const phone = getConnectorPreset('phone_companion')
    expect(phone).toBeDefined()
    expect(phone!.status).toBe('planned')
    expect(phone!.mockMode).toBe(true)
    expect(phone!.permissions.join(' ')).toMatch(/No cloud relay/i)
    expect(phone!.limitations.join(' ')).toMatch(/No companion app exists/i)
  })

  it('groups available, planned, and manual presets', () => {
    expect(getConnectorPresetsByStatus('available').map((preset) => preset.id)).toEqual(expect.arrayContaining([
      'openai_api',
      'google_gemini_api',
      'openrouter',
      'anthropic',
      'local_ollama',
      'lm_studio',
    ]))
    expect(getConnectorPresetsByStatus('planned').map((preset) => preset.id)).toEqual(expect.arrayContaining([
      'gmail_oauth',
      'whatsapp_business_api',
      'phone_companion',
    ]))
    expect(getConnectorPresetsByStatus('manual').map((preset) => preset.id)).toEqual(expect.arrayContaining([
      'github',
      'mcp_server_custom',
    ]))
  })
})
