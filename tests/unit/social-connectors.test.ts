import { describe, expect, it } from 'vitest'
import {
  SOCIAL_CONNECTOR_PRESETS,
  getSocialConnector,
  validateSocialConnector,
} from '../../src/shared/social-connectors'

describe('Social Connector Registry', () => {
  it('defines all requested social connector presets', () => {
    expect(SOCIAL_CONNECTOR_PRESETS).toHaveLength(8)
    const ids = SOCIAL_CONNECTOR_PRESETS.map((preset) => preset.id)
    expect(ids).toEqual(expect.arrayContaining([
      'facebook_graph_api',
      'instagram_graph_api',
      'youtube_data_api',
      'youtube_upload_placeholder',
      'tiktok_placeholder',
      'x_twitter_placeholder',
      'linkedin_placeholder',
      'whatsapp_business_api_social',
    ]))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('validates every social connector contract', () => {
    for (const connector of SOCIAL_CONNECTOR_PRESETS) {
      expect(validateSocialConnector(connector)).toEqual([])
      expect(connector.neutralIcon).not.toContain('.png')
      expect(connector.neutralIcon).not.toContain('.svg')
      expect(connector.neutralIcon).not.toContain('brand')
    }
  })

  it('renders YouTube scopes and workflow capabilities', () => {
    const youtube = getSocialConnector('youtube_data_api')
    expect(youtube).toBeDefined()
    expect(youtube!.requiredScopes).toEqual(expect.arrayContaining([
      'youtube.readonly',
      'youtube.force-ssl',
      'yt-analytics.readonly',
    ]))
    expect(youtube!.capabilities).toEqual(expect.arrayContaining([
      'generate title',
      'generate description',
      'generate thumbnail prompt',
      'generate tags',
      'summarize comments placeholder',
      'analytics placeholder',
    ]))
  })

  it('renders Meta scopes and account requirement notes', () => {
    const facebook = getSocialConnector('facebook_graph_api')
    const instagram = getSocialConnector('instagram_graph_api')
    expect(facebook!.requiredScopes).toEqual(expect.arrayContaining(['pages_read_engagement', 'pages_manage_posts']))
    expect(instagram!.requiredScopes).toEqual(expect.arrayContaining(['instagram_basic', 'instagram_content_publish']))
    expect(instagram!.accountRequirement).toMatch(/Business or Creator/i)
  })

  it('requires confirmation for posting, replying, deleting, and uploading', () => {
    for (const connector of SOCIAL_CONNECTOR_PRESETS) {
      for (const action of connector.destructiveActions) {
        expect(action.requiresConfirmation).toBe(true)
        expect(action.mustShowExactContent).toBe(true)
        expect(action.supportsCancel).toBe(true)
      }
    }
  })

  it('keeps WhatsApp Business API as official placeholder only', () => {
    const whatsapp = getSocialConnector('whatsapp_business_api_social')
    expect(whatsapp).toBeDefined()
    expect(whatsapp!.authType).toBe('planned')
    expect(whatsapp!.limitations.join(' ')).toMatch(/Official WhatsApp Business API only/i)
    expect(whatsapp!.limitations.join(' ')).toMatch(/No WhatsApp Web, phone-screen, or personal-account automation/i)
  })
})
