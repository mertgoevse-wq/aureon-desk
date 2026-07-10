# Vibeforge — Connectors Plan

## Overview

The Connectors system allows Vibeforge to integrate with external services while maintaining strict security boundaries. Every connector has defined permission scopes, risk notes, and never auto-executes dangerous actions.

## Connector Architecture

### Status Model

| Status | Meaning |
|--------|---------|
| `connected` | Fully configured and ready to use |
| `not_connected` | API key or OAuth needed |
| `needs_setup` | Requires additional configuration |
| `error` | Connection failed or credential expired |
| `planned` | Not yet implemented; future feature |

### Connector Categories

1. **AI Provider Connectors** — For model access
   - OpenAI / ChatGPT API (api_key)
   - Google Gemini (api_key)
   - Google AI Studio (api_key)
   - OpenRouter (api_key)
   - Ollama (local)
   - LM Studio (local)

2. **Google Service Connectors** — OAuth 2.0 based
   - Gmail (read, draft, send)
   - Google Drive (read, create, manage)
   - Google Calendar (read, create, manage)

3. **Developer Connectors**
   - GitHub (import, PR, issues)
   - MCP Servers (tools and protocols)

4. **Future Connectors**
   - Phone Companion (local network, planned)

## Gmail Connector Design

### Scope Model (OAuth 2.0)
- `gmail.readonly` — Read inbox summary, search emails
- `gmail.compose` — Create drafts (never auto-send)
- `gmail.send` — Send emails (confirmation required)
- `gmail.modify` — Label/archive (confirmation required)

### Security Rules
- No Gmail action without connected account
- No Gmail action without explicit user approval
- Draft-only mode available (safer)
- Tokens stored via Electron `safeStorage`
- Minimal scopes requested
- Revoke/disconnect clears all local tokens
- No token logging or display in UI

### Actions (Design)
| Action | Requires Confirmation | Status |
|--------|----------------------|--------|
| Read inbox summary | No | Planned |
| Search emails | No | Planned |
| Create draft | Yes | Planned |
| Send draft | Yes | Planned |
| Label/archive | Yes | Planned |

## OpenAI Connector Design

### Model
- API key stored via Electron `safeStorage` (Base64 encrypted)
- No scraping of ChatGPT website
- OpenAI-compatible API format

### Capabilities (model-dependent)
- Text generation (all GPT models)
- Code generation (GPT-4o, o1, o3)
- Vision/image understanding (GPT-4o)
- Speech-to-text (Whisper)
- Text-to-speech (TTS)
- Image generation (DALL-E)

### Future
- Assistants API / Apps SDK placeholder
- MCP server compatibility

## Google Gemini Connector Design

### Model
- API key stored via Electron `safeStorage`
- Direct API access (not browser automation)

### Capabilities
- Text generation (all Gemini models)
- Code generation (Gemini 2.5 Pro)
- Vision/image understanding (Gemini 2.5 Flash/Pro)
- Video understanding (Gemini 2.5 Flash/Pro)
- Audio understanding

### Future
- Live API for realtime audio/video
- Image/video generation (Veo/Imagen) when available

## Phone Companion Design (Planned)

### Architecture
- Local network pairing only (WebSocket)
- No cloud relay
- Pairing code displayed in Vibeforge
- User enters code on phone

### Permissions
- Notifications display
- Camera photo upload (manual trigger)
- Screen mirror placeholder
- File transfer placeholder

### Status: Planned (not yet implemented)
- No remote control
- No background access
- All data stays on local network

## Security Principles

1. **Minimal Scopes** — Request only what's needed
2. **Confirmation Gates** — Destructive/account actions always confirmed
3. **Encrypted Storage** — All credentials via Electron safeStorage
4. **Revocable** — Every connector can be disconnected with one click
5. **Transparent** — Risk notes visible on every connector card
