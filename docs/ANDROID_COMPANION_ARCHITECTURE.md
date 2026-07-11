# Vibeforge Android/Phone Companion Architecture

> Status: Local Beta — UI + types only. No real TCP/network layer in this release.

---

## 1. Overview

The **Phone Companion** is a planned local-network control surface for Vibeforge Desktop. In the current local-beta build, it is UI + shared types only: no phone can connect to, sync with, or control the desktop app yet.

This document describes the prototype UI, intended security model, and planned network layer.

---

## 2. Goals

- Let users start builds and send prompts from their phone without switching windows.
- Keep all sensitive actions behind explicit desktop approval.
- Avoid exposing the desktop to the public internet.
- Provide a safe, local-only pairing mechanism.

---

## 3. Architecture

```
┌─────────────────────┐         same local network          ┌─────────────────────┐
│   Vibeforge Desktop │  ◄──────────────────────────────►  │   Phone / Tablet    │
│   (Electron + React)│                                      │   (Browser / PWA)   │
│                     │                                      │                     │
│  ┌───────────────┐  │                                      │  ┌───────────────┐  │
│  │ Companion IPC │  │   HTTP/WebSocket (planned)         │  │ Companion     │  │
│  │   Service     │  │◄────────────────────────────────────►│  │ Mobile View   │  │
│  └───────────────┘  │                                      │  └───────────────┘  │
│         ▲           │                                      │         ▲           │
│         │           │                                      │         │           │
│  ┌───────────────┐  │                                      │  ┌───────────────┐  │
│  │  Settings UI  │  │                                      │  │ Pairing code  │  │
│  │  (Companion   │  │                                      │  │ input         │  │
│  │   Page)       │  │                                      │                 │  │
│  └───────────────┘  │                                      └─────────────────────┘
└─────────────────────┘
```

### Current Pass (Local Beta)

- Type definitions live in `src/shared/companion.ts`.
- Settings UI lives in `src/renderer/src/pages/settings/CompanionPage.tsx`.
- Mobile view lives in `src/renderer/src/pages/CompanionMobileView.tsx`.
- Routes wired in `src/renderer/src/App.tsx`.
- No active network server, pairing authentication, sync channel, or remote command execution yet.

---

## 4. Data Model

### `CompanionDevice`

```ts
interface CompanionDevice {
  id: string
  name: string
  platform: 'android' | 'ios' | 'web' | 'unknown'
  pairedAt: number
  lastSeen: number
  permissionLevel: PermissionLevel
}
```

### `PairingSession`

```ts
interface PairingSession {
  sessionId: string
  pairingCode: string      // 6-digit numeric
  qrDataUri: string        // planned
  expiresAt: number        // now + 5 min
  status: PairingStatus
}
```

### `CompanionCommand`

```ts
interface CompanionCommand {
  id: string
  type: CompanionCommandType
  payload: CompanionCommandPayload
  status: CommandStatus
  deviceId: string
  createdAt: number
  resolvedAt?: number
  note?: string
}
```

---

## 5. Security Model

Hard limits enforced in the UI and planned for the IPC layer:

| Rule | Enforcement |
|------|-------------|
| No remote shell without desktop approval | Commands queued for approval |
| No file deletion from phone | Blocked at command validation |
| No API key / provider changes from phone | Blocked at command validation |
| Pairing codes expire after 5 minutes | `expiresAt` checked on confirm |
| One paired device at a time (MVP) | Existing device must be revoked |
| Local network only | Bind to `127.0.0.1` / LAN interface, no public tunnel |

---

## 6. Command Types

| Command | Description | Approval |
|---------|-------------|----------|
| `sendPrompt` | Send text prompt to chat/studio | None |
| `startBuild` | Trigger a build in Studio | Desktop approval |
| `requestPreview` | Request a preview screenshot | None |
| `approveAction` | Approve a pending desktop action | Already an approval |
| `rejectAction` | Reject a pending desktop action | Already an approval |
| `getStatus` | Get current app status | None |
| `openProject` | Request desktop to open a project | Desktop approval |

---

## 7. Future Network Layer (Planned)

1. **Discovery**: mDNS/Bonjour broadcast from desktop; phone discovers via local service.
2. **Transport**: WebSocket over local HTTP server (Electron main process).
3. **Pairing**: 6-digit code + QR code; ECDH key exchange for encrypted channel.
4. **Approval UI**: Pending commands shown in desktop toast + dedicated approval panel.
5. **PWA**: Companion mobile view installable as a progressive web app.

---

## 8. Files

| File | Purpose |
|------|---------|
| `src/shared/companion.ts` | Shared types, helpers, and default config |
| `src/renderer/src/pages/settings/CompanionPage.tsx` | Desktop settings UI |
| `src/renderer/src/pages/CompanionMobileView.tsx` | Mobile browser UI |
| `src/renderer/src/App.tsx` | Route registration |
| `src/renderer/src/layouts/SettingsLayout.tsx` | Settings navigation item |
| `docs/ANDROID_COMPANION_ARCHITECTURE.md` | This document |

---

## 9. Open Questions

- Should the local HTTP server run on a fixed or dynamic port?
- Do we need per-command PIN confirmation for high-risk actions?
- Should the companion support iOS Shortcuts or Android intents?

---

*Last updated: 2026-07-10*
