export type SocialAuthType = 'oauth' | 'apiKey' | 'manual' | 'planned'
export type SocialRiskLevel = 'low' | 'medium' | 'high'
export type SocialActionRisk = 'safe' | 'write' | 'destructive'

export interface SocialActionContract {
  id: string
  label: string
  description: string
  risk: SocialActionRisk
  requiresConfirmation: boolean
  mustShowExactContent: boolean
  supportsCancel: boolean
}

export interface SocialConnectorPreset {
  id: string
  displayName: string
  category: 'meta' | 'video' | 'social' | 'messaging'
  neutralIcon: string
  authType: SocialAuthType
  officialDocsUrl: string
  requiredScopes: string[]
  capabilities: string[]
  limitations: string[]
  riskLevel: SocialRiskLevel
  setupSteps: string[]
  testConnectionAction: string
  safeActions: SocialActionContract[]
  destructiveActions: SocialActionContract[]
  accountRequirement?: string
}

const SAFE_SOCIAL_ACTIONS: SocialActionContract[] = [
  {
    id: 'comments.summarize',
    label: 'Summarize recent comments',
    description: 'Read available comments and produce a summary.',
    risk: 'safe',
    requiresConfirmation: false,
    mustShowExactContent: false,
    supportsCancel: true,
  },
  {
    id: 'post.draft',
    label: 'Draft a post',
    description: 'Create local draft copy without posting.',
    risk: 'safe',
    requiresConfirmation: false,
    mustShowExactContent: true,
    supportsCancel: true,
  },
  {
    id: 'reply.draft',
    label: 'Draft a reply',
    description: 'Create a local reply draft without sending.',
    risk: 'safe',
    requiresConfirmation: false,
    mustShowExactContent: true,
    supportsCancel: true,
  },
  {
    id: 'stats.analyze',
    label: 'Analyze channel/video/account stats',
    description: 'Summarize analytics that the official API exposes.',
    risk: 'safe',
    requiresConfirmation: false,
    mustShowExactContent: false,
    supportsCancel: true,
  },
  {
    id: 'video.description',
    label: 'Generate video description',
    description: 'Draft title, description, tags, and thumbnail prompt locally.',
    risk: 'safe',
    requiresConfirmation: false,
    mustShowExactContent: true,
    supportsCancel: true,
  },
  {
    id: 'hashtags.generate',
    label: 'Generate hashtags',
    description: 'Generate local hashtag suggestions.',
    risk: 'safe',
    requiresConfirmation: false,
    mustShowExactContent: true,
    supportsCancel: true,
  },
  {
    id: 'upload.checklist',
    label: 'Create upload checklist',
    description: 'Create a local upload readiness checklist.',
    risk: 'safe',
    requiresConfirmation: false,
    mustShowExactContent: true,
    supportsCancel: true,
  },
  {
    id: 'schedule.placeholder',
    label: 'Schedule draft placeholder',
    description: 'Create a local schedule plan. Does not publish.',
    risk: 'safe',
    requiresConfirmation: false,
    mustShowExactContent: true,
    supportsCancel: true,
  },
]

const DESTRUCTIVE_SOCIAL_ACTIONS: SocialActionContract[] = [
  {
    id: 'post.publish',
    label: 'Post or publish content',
    description: 'Publish a post, video, story, or update to a platform.',
    risk: 'write',
    requiresConfirmation: true,
    mustShowExactContent: true,
    supportsCancel: true,
  },
  {
    id: 'reply.send',
    label: 'Send a reply/comment',
    description: 'Send a reply or comment to a live social account.',
    risk: 'write',
    requiresConfirmation: true,
    mustShowExactContent: true,
    supportsCancel: true,
  },
  {
    id: 'content.delete',
    label: 'Delete content',
    description: 'Delete a post, comment, video, or media object.',
    risk: 'destructive',
    requiresConfirmation: true,
    mustShowExactContent: true,
    supportsCancel: true,
  },
  {
    id: 'video.upload',
    label: 'Upload media',
    description: 'Upload a video or media asset to a platform.',
    risk: 'write',
    requiresConfirmation: true,
    mustShowExactContent: true,
    supportsCancel: true,
  },
]

export const SOCIAL_CONNECTOR_PRESETS: SocialConnectorPreset[] = [
  {
    id: 'facebook_graph_api',
    displayName: 'Facebook Graph API',
    category: 'meta',
    neutralIcon: 'Globe',
    authType: 'oauth',
    officialDocsUrl: 'https://developers.facebook.com/docs/graph-api',
    requiredScopes: ['pages_read_engagement', 'pages_manage_posts', 'pages_manage_metadata'],
    capabilities: ['draft post', 'draft reply', 'comment summary placeholder', 'content calendar placeholder', 'page insights placeholder'],
    limitations: ['Official Meta API only.', 'Business/Page permissions are required for publishing workflows.', 'No browser scraping or account bypass automation is implemented.'],
    riskLevel: 'high',
    setupSteps: ['Create a Meta developer app.', 'Request only the Page scopes you need.', 'Connect a Page or Business account through OAuth.', 'Review exact content before any publish/reply action.'],
    testConnectionAction: 'Placeholder OAuth token and Page access validation.',
    safeActions: SAFE_SOCIAL_ACTIONS,
    destructiveActions: DESTRUCTIVE_SOCIAL_ACTIONS,
    accountRequirement: 'Facebook Page or Business account permissions are required for most write actions.',
  },
  {
    id: 'instagram_graph_api',
    displayName: 'Instagram Graph API',
    category: 'meta',
    neutralIcon: 'Sparkles',
    authType: 'oauth',
    officialDocsUrl: 'https://developers.facebook.com/docs/instagram-api',
    requiredScopes: ['instagram_basic', 'instagram_manage_comments', 'instagram_content_publish', 'pages_show_list'],
    capabilities: ['draft caption', 'draft reply', 'comment summary placeholder', 'content calendar placeholder', 'creator/business account insights placeholder'],
    limitations: ['Official Instagram Graph API only.', 'Requires eligible Business or Creator account for most workflows.', 'No browser scraping or personal-account bypass automation is implemented.'],
    riskLevel: 'high',
    setupSteps: ['Create a Meta developer app.', 'Connect an eligible Instagram Business or Creator account.', 'Request only required Instagram scopes.', 'Confirm exact captions/replies before publishing.'],
    testConnectionAction: 'Placeholder OAuth and connected account validation.',
    safeActions: SAFE_SOCIAL_ACTIONS,
    destructiveActions: DESTRUCTIVE_SOCIAL_ACTIONS,
    accountRequirement: 'Instagram Business or Creator account is required for publishing and insights APIs.',
  },
  {
    id: 'youtube_data_api',
    displayName: 'YouTube Data API',
    category: 'video',
    neutralIcon: 'Monitor',
    authType: 'oauth',
    officialDocsUrl: 'https://developers.google.com/youtube/v3',
    requiredScopes: ['youtube.readonly', 'youtube.force-ssl', 'yt-analytics.readonly'],
    capabilities: ['generate title', 'generate description', 'generate thumbnail prompt', 'generate tags', 'summarize comments placeholder', 'analytics placeholder'],
    limitations: ['Official YouTube APIs only.', 'Analytics and comment access depend on OAuth scopes and channel ownership.', 'No upload is performed by this preset.'],
    riskLevel: 'medium',
    setupSteps: ['Create a Google Cloud OAuth client.', 'Enable YouTube Data API.', 'Start with read-only scopes.', 'Review any generated metadata before use.'],
    testConnectionAction: 'Placeholder channel identity and scope validation.',
    safeActions: SAFE_SOCIAL_ACTIONS,
    destructiveActions: DESTRUCTIVE_SOCIAL_ACTIONS,
  },
  {
    id: 'youtube_upload_placeholder',
    displayName: 'YouTube Upload',
    category: 'video',
    neutralIcon: 'Server',
    authType: 'planned',
    officialDocsUrl: 'https://developers.google.com/youtube/v3/guides/uploading_a_video',
    requiredScopes: ['youtube.upload'],
    capabilities: ['create upload checklist', 'generate title', 'generate description', 'generate tags', 'upload placeholder with OAuth warning'],
    limitations: ['Official YouTube API only.', 'Upload is a placeholder only.', 'OAuth warning must be shown before upload setup.', 'Uploading requires exact content review and explicit confirmation.'],
    riskLevel: 'high',
    setupSteps: ['Prepare OAuth with youtube.upload only when needed.', 'Generate title/description/tags locally first.', 'Show the exact file, title, description, tags, visibility, and channel before upload.', 'Allow cancel before any upload starts.'],
    testConnectionAction: 'Mock-only upload readiness check.',
    safeActions: SAFE_SOCIAL_ACTIONS,
    destructiveActions: DESTRUCTIVE_SOCIAL_ACTIONS,
  },
  {
    id: 'tiktok_placeholder',
    displayName: 'TikTok',
    category: 'social',
    neutralIcon: 'MessageCircle',
    authType: 'planned',
    officialDocsUrl: 'https://developers.tiktok.com',
    requiredScopes: ['video.list', 'video.upload'],
    capabilities: ['draft caption', 'generate hashtags', 'upload checklist placeholder'],
    limitations: ['Placeholder only.', 'Official TikTok APIs only.', 'No browser scraping or account bypass automation is implemented.'],
    riskLevel: 'high',
    setupSteps: ['Review TikTok developer requirements.', 'Use official OAuth/API permissions only.', 'Confirm exact content before any future publish/upload action.'],
    testConnectionAction: 'Mock-only API readiness check.',
    safeActions: SAFE_SOCIAL_ACTIONS,
    destructiveActions: DESTRUCTIVE_SOCIAL_ACTIONS,
  },
  {
    id: 'x_twitter_placeholder',
    displayName: 'X / Twitter',
    category: 'social',
    neutralIcon: 'MessageSquare',
    authType: 'planned',
    officialDocsUrl: 'https://developer.x.com',
    requiredScopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    capabilities: ['draft post', 'draft reply', 'generate hashtags', 'account stats placeholder'],
    limitations: ['Placeholder only.', 'Official X API only.', 'No browser scraping or personal-account bypass automation is implemented.'],
    riskLevel: 'high',
    setupSteps: ['Create an X developer app.', 'Request least-privilege OAuth scopes.', 'Confirm exact text before any future post/reply action.'],
    testConnectionAction: 'Mock-only OAuth readiness check.',
    safeActions: SAFE_SOCIAL_ACTIONS,
    destructiveActions: DESTRUCTIVE_SOCIAL_ACTIONS,
  },
  {
    id: 'linkedin_placeholder',
    displayName: 'LinkedIn',
    category: 'social',
    neutralIcon: 'Inbox',
    authType: 'planned',
    officialDocsUrl: 'https://learn.microsoft.com/linkedin',
    requiredScopes: ['openid', 'profile', 'w_member_social'],
    capabilities: ['draft post', 'draft reply', 'content calendar placeholder', 'account stats placeholder'],
    limitations: ['Placeholder only.', 'Official LinkedIn API only.', 'No browser scraping or account bypass automation is implemented.'],
    riskLevel: 'high',
    setupSteps: ['Create a LinkedIn developer app.', 'Request approved member or organization scopes.', 'Confirm exact content before any future post/reply action.'],
    testConnectionAction: 'Mock-only OAuth readiness check.',
    safeActions: SAFE_SOCIAL_ACTIONS,
    destructiveActions: DESTRUCTIVE_SOCIAL_ACTIONS,
  },
  {
    id: 'whatsapp_business_api_social',
    displayName: 'WhatsApp Business API',
    category: 'messaging',
    neutralIcon: 'MessageCircle',
    authType: 'planned',
    officialDocsUrl: 'https://developers.facebook.com/docs/whatsapp',
    requiredScopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
    capabilities: ['template message planning', 'draft reply placeholder', 'conversation summary placeholder'],
    limitations: ['Official WhatsApp Business API only.', 'No WhatsApp Web, phone-screen, or personal-account automation.', 'No live messaging in this build.'],
    riskLevel: 'high',
    setupSteps: ['Use the official WhatsApp Business Platform.', 'Verify business and phone number permissions outside Vibeforge.', 'Show exact recipient/template/content before any future send action.'],
    testConnectionAction: 'Mock-only Business API readiness check.',
    safeActions: SAFE_SOCIAL_ACTIONS,
    destructiveActions: DESTRUCTIVE_SOCIAL_ACTIONS,
  },
]

export function getSocialConnector(id: string): SocialConnectorPreset | undefined {
  return SOCIAL_CONNECTOR_PRESETS.find((connector) => connector.id === id)
}

export function validateSocialConnector(connector: SocialConnectorPreset): string[] {
  const issues: string[] = []
  if (!connector.displayName) issues.push('displayName is required')
  if (!connector.officialDocsUrl.startsWith('https://')) issues.push('officialDocsUrl must be HTTPS')
  if (!connector.requiredScopes.length) issues.push('requiredScopes are required')
  if (!connector.capabilities.length) issues.push('capabilities are required')
  if (!connector.setupSteps.length) issues.push('setupSteps are required')
  if (!connector.safeActions.length) issues.push('safeActions are required')
  for (const action of connector.destructiveActions) {
    if (!action.requiresConfirmation) issues.push(`${action.id} must require confirmation`)
    if (!action.mustShowExactContent) issues.push(`${action.id} must show exact content`)
    if (!action.supportsCancel) issues.push(`${action.id} must support cancel`)
  }
  if (!connector.limitations.some((item) => /official/i.test(item))) issues.push('official API limitation is required')
  return issues
}
