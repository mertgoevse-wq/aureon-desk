# Connector Presets

Last updated: 2026-07-09

## Purpose

Vibeforge now has a safe connector preset catalog for future integrations. Presets define setup fields, auth type, scopes, permissions, risk, supported actions, test behavior, and limitations.

The catalog is intentionally conservative: setup drawers preview configuration contracts but do not persist tokens. Live secrets must use encrypted provider storage or a future connector vault.

## General Presets

- OpenAI API
- Google Gemini API
- OpenRouter
- Anthropic
- Gmail OAuth
- Google Drive OAuth
- Google Calendar OAuth
- GitHub
- MCP Server Custom
- Local Ollama
- LM Studio
- Phone Companion
- WhatsApp Business API
- Email SMTP/IMAP
- Browser Search MCP

Source: `src/shared/connector-presets.ts`

## Social Presets

- Facebook Graph API
- Instagram Graph API
- YouTube Data API
- YouTube Upload placeholder
- TikTok placeholder
- X/Twitter placeholder
- LinkedIn placeholder
- WhatsApp Business API placeholder

Source: `src/shared/social-connectors.ts`

## Safety Rules

- Gmail actions require OAuth scopes and user approval for send/modify operations.
- WhatsApp is official WhatsApp Business API only. No WhatsApp Web, phone-screen, or personal-account automation is implemented.
- Phone Companion is planned only until a companion app, local pairing, and explicit permissions exist.
- Social publish, reply, delete, and upload actions require exact content preview, explicit confirmation, and cancel support.
- MCP servers are manual setup and stay safety-gated.
- No fake vendor logos are used.

## UI

Settings -> Connectors includes:

- Search/filter over connector presets
- Configure drawer with required fields and limitations
- Scopes and permission explanations
- Mock/test connection behavior
- Social Connectors section with platform-specific capabilities
- Social draft action confirmation preview

## Current Limitations

- OAuth flows are not implemented for Gmail, Google Drive, Google Calendar, or social platforms.
- Social platform cards are setup contracts and placeholders, not live API clients.
- Connector drawer fields are intentionally not persisted.
- WhatsApp, Phone Companion, SMTP/IMAP, Browser Search MCP, TikTok, X/Twitter, LinkedIn, and YouTube Upload are mock/planned only.

## Verification

- `tests/unit/connector-presets.test.ts`
- `tests/unit/social-connectors.test.ts`
- `tests/e2e/18-Vibeforge-studio-vibe-flow.spec.ts`
