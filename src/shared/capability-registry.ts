// === Aureon Studio Core — Capability Registry ===
// Defines every capability the system can offer, its requirements, and risk profile.

import type { CapabilityDefinition, CapabilityId, RiskTier, TaskCategory } from './types/studio-core'

export const CAPABILITY_REGISTRY: Record<CapabilityId, CapabilityDefinition> = {
  text_generation: {
    id: 'text_generation',
    displayName: 'Text Generation',
    description: 'Generate written content — articles, code comments, documentation, emails, creative writing.',
    icon: 'FileText',
    requiredConnector: null, // any text-capable provider
    riskTier: 'safe',
    permissionRequired: false,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'generate_text',
  },
  code_generation: {
    id: 'code_generation',
    displayName: 'Code Generation',
    description: 'Generate, complete, and refactor source code in any language.',
    icon: 'Code2',
    requiredConnector: null,
    riskTier: 'write_local',
    permissionRequired: true,
    mayUploadRemotely: false,
    recommendedTaskCategory: 'code_program',
  },
  app_building: {
    id: 'app_building',
    displayName: 'App Building',
    description: 'Plan, scaffold, and build full applications with project structure and configuration.',
    icon: 'LayoutDashboard',
    requiredConnector: null,
    riskTier: 'write_local',
    permissionRequired: true,
    mayUploadRemotely: false,
    recommendedTaskCategory: 'build_app',
  },
  image_generation: {
    id: 'image_generation',
    displayName: 'Image Generation',
    description: 'Create images, logos, illustrations, and visual assets from text descriptions.',
    icon: 'Image',
    requiredConnector: 'openai', // DALL-E or similar
    riskTier: 'write_remote',
    permissionRequired: true,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'generate_image',
  },
  image_understanding: {
    id: 'image_understanding',
    displayName: 'Image Understanding',
    description: 'Analyze and describe images — screenshots, photos, diagrams, charts.',
    icon: 'ScanEye',
    requiredConnector: null, // any vision-capable provider
    riskTier: 'read_only',
    permissionRequired: false,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'analyze_screen_video',
  },
  video_generation: {
    id: 'video_generation',
    displayName: 'Video Generation',
    description: 'Generate videos, animations, and motion content from descriptions.',
    icon: 'Video',
    requiredConnector: 'google_gemini', // Veo or similar
    riskTier: 'write_remote',
    permissionRequired: true,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'generate_video',
  },
  video_understanding: {
    id: 'video_understanding',
    displayName: 'Video Understanding',
    description: 'Analyze video content — understand scenes, actions, and extract information.',
    icon: 'MonitorPlay',
    requiredConnector: 'google_gemini', // Gemini with video
    riskTier: 'read_only',
    permissionRequired: false,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'analyze_screen_video',
  },
  music_generation: {
    id: 'music_generation',
    displayName: 'Music Generation',
    description: 'Generate music tracks, melodies, and sound effects from descriptions.',
    icon: 'Music',
    requiredConnector: null, // future: Suno, Udio, etc.
    riskTier: 'write_remote',
    permissionRequired: true,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'generate_music',
  },
  audio_understanding: {
    id: 'audio_understanding',
    displayName: 'Audio Understanding',
    description: 'Transcribe and understand audio — meetings, voice notes, podcasts.',
    icon: 'Mic',
    requiredConnector: null, // any audio-capable provider
    riskTier: 'read_only',
    permissionRequired: false,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'analyze_file',
  },
  speech_to_text: {
    id: 'speech_to_text',
    displayName: 'Speech to Text',
    description: 'Convert spoken audio to written text with high accuracy.',
    icon: 'AudioLines',
    requiredConnector: 'openai', // Whisper
    riskTier: 'read_only',
    permissionRequired: false,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'analyze_file',
  },
  text_to_speech: {
    id: 'text_to_speech',
    displayName: 'Text to Speech',
    description: 'Convert written text to natural-sounding speech audio.',
    icon: 'Volume2',
    requiredConnector: 'openai', // TTS
    riskTier: 'write_remote',
    permissionRequired: true,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'generate_text',
  },
  gmail_read: {
    id: 'gmail_read',
    displayName: 'Gmail — Read',
    description: 'Read inbox summary, search emails, and view message content.',
    icon: 'Mail',
    requiredConnector: 'gmail',
    riskTier: 'read_only',
    permissionRequired: true,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'connect_apps',
  },
  gmail_draft: {
    id: 'gmail_draft',
    displayName: 'Gmail — Draft',
    description: 'Create email drafts. Drafts are never sent without explicit approval.',
    icon: 'MailPlus',
    requiredConnector: 'gmail',
    riskTier: 'write_local',
    permissionRequired: true,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'connect_apps',
  },
  gmail_send: {
    id: 'gmail_send',
    displayName: 'Gmail — Send',
    description: 'Send emails. Every send requires explicit user confirmation.',
    icon: 'Send',
    requiredConnector: 'gmail',
    riskTier: 'account_action',
    permissionRequired: true,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'connect_apps',
  },
  google_drive: {
    id: 'google_drive',
    displayName: 'Google Drive',
    description: 'Read, create, and manage files in Google Drive.',
    icon: 'HardDrive',
    requiredConnector: 'google_drive',
    riskTier: 'account_action',
    permissionRequired: true,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'connect_apps',
  },
  google_calendar: {
    id: 'google_calendar',
    displayName: 'Google Calendar',
    description: 'View, create, and manage calendar events.',
    icon: 'Calendar',
    requiredConnector: 'google_calendar',
    riskTier: 'account_action',
    permissionRequired: true,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'connect_apps',
  },
  github: {
    id: 'github',
    displayName: 'GitHub',
    description: 'Read repos, create PRs, manage issues, and interact with GitHub.',
    icon: 'Github',
    requiredConnector: 'github',
    riskTier: 'account_action',
    permissionRequired: true,
    mayUploadRemotely: true,
    recommendedTaskCategory: 'connect_apps',
  },
  mcp_tools: {
    id: 'mcp_tools',
    displayName: 'MCP Tools',
    description: 'Execute Model Context Protocol tools — file search, git status, project summaries.',
    icon: 'Wrench',
    requiredConnector: 'mcp_server',
    riskTier: 'destructive',
    permissionRequired: true,
    mayUploadRemotely: false,
    recommendedTaskCategory: 'automate_workflow',
  },
  live_preview: {
    id: 'live_preview',
    displayName: 'Live Preview',
    description: 'Preview web apps and HTML content in real-time within Aureon Desk.',
    icon: 'Play',
    requiredConnector: null,
    riskTier: 'safe',
    permissionRequired: false,
    mayUploadRemotely: false,
    recommendedTaskCategory: 'build_app',
  },
  local_files: {
    id: 'local_files',
    displayName: 'Local Files',
    description: 'Read, write, and manage files on your local machine.',
    icon: 'FolderOpen',
    requiredConnector: null,
    riskTier: 'write_local',
    permissionRequired: true,
    mayUploadRemotely: false,
    recommendedTaskCategory: 'code_program',
  },
  shell_commands: {
    id: 'shell_commands',
    displayName: 'Shell Commands',
    description: 'Execute terminal commands. Every destructive command requires confirmation.',
    icon: 'Terminal',
    requiredConnector: null,
    riskTier: 'destructive',
    permissionRequired: true,
    mayUploadRemotely: false,
    recommendedTaskCategory: 'automate_workflow',
  },
}

/** Get a capability by ID */
export function getCapability(id: CapabilityId): CapabilityDefinition | undefined {
  return CAPABILITY_REGISTRY[id]
}

/** Get all capabilities */
export function getAllCapabilities(): CapabilityDefinition[] {
  return Object.values(CAPABILITY_REGISTRY)
}

/** Get capabilities by risk tier */
export function getCapabilitiesByRiskTier(tiers: RiskTier[]): CapabilityDefinition[] {
  return Object.values(CAPABILITY_REGISTRY).filter(c => tiers.includes(c.riskTier))
}

/** Get capabilities that require a specific connector */
export function getCapabilitiesByConnector(connectorType: string): CapabilityDefinition[] {
  return Object.values(CAPABILITY_REGISTRY).filter(c => c.requiredConnector === connectorType)
}

/** Get capabilities by task category */
export function getCapabilitiesByTaskCategory(category: TaskCategory): CapabilityDefinition[] {
  return Object.values(CAPABILITY_REGISTRY).filter(c => c.recommendedTaskCategory === category)
}
