# Aureon Desk Continuation Notes

Last updated: 2026-07-08

This file exists so a new Codex chat can continue the same work without needing the full previous context window.

## One-message resume prompt

Paste this into a new chat from the repository root:

```text
Bitte lies CONTINUATION_NOTES.md, README.md, CHANGELOG.md, SECURITY_NOTES.md und den aktuellen git status. Fuehre Aureon Desk ab dem Abschnitt "Next work" weiter, ohne bestehende uncommitted/user changes zurueckzusetzen.
```

## User goal from the exported ChatGPT ZIP

The attached ZIP (`C:\Users\mertg\Downloads\aureon_codex_export.zip`) described Aureon Desk as a Windows-first desktop AI workspace:

- Multi-provider chat for OpenAI, Anthropic, Gemini, OpenRouter, Groq, Mistral, DeepSeek, Ollama, LM Studio, and custom OpenAI-compatible endpoints.
- Secure local credential handling with Electron `safeStorage`/DPAPI, no plaintext API-key storage, and redacted logs.
- User-editable system prompts, prompt library, slash commands, projects/local folder context, GitHub imports, MCP-style tools/safety gates, logs/debug tooling, Playwright QA, LivePreview, and Windows packaging.
- UI direction: calm, premium, warm, smooth, original Aureon identity; inspired by the comfort level of Claude Desktop but not copying Anthropic/Claude assets, branding, private behavior, fonts, or layout.

Prompt priority recovered from the ZIP:

- Prompt 3: Provider UX finalization.
- Prompt 4: Real chat completion QA.
- Prompt 5: Provider Test Center.
- Prompt 6: LivePreview stabilization.
- Prompt 7: full Playwright QA.
- Prompt 8: final premium UX audit.
- Prompt 9: repository hygiene.

## Safety boundary from this chat

The user asked for Aureon Desk to have no guardrails, including allowing harmful-code generation and custom system prompts. The safe implementation boundary is:

- Do support legitimate local-first coding workflows, custom system prompts, provider choice, transparent settings, and user-controlled confirmations.
- Do not implement malware enablement, destructive-code facilitation, credential theft, evasion, or bypass features.
- Keep safeguards simple, visible, and non-deceptive: redaction, confirmations for destructive actions, local sandboxing, and auditability.

## Work completed in this continuation

Input and copy/paste fix:

- Fixed the renderer keyboard shortcut order so input/textarea/contentEditable fields receive normal typing and Ctrl+C/Ctrl+V/Ctrl+A behavior.
- Added a native Electron Edit menu with undo, redo, cut, copy, paste, and select-all roles.
- Hardened shared `Input` handling by forwarding `onInput` to the public change handler.
- Added regression coverage for provider API-key input typing and paste.

Provider and database stabilization:

- Ensured default provider rows exist before provider listing/model loading.
- Fixed Drizzle seed lookups to use explicit `eq(...)` predicates.
- Kept provider API keys encrypted and never committed real keys.

Prompt 5 Provider Test Center:

- Added a Provider Test Center to `Settings -> Providers`.
- Each provider now shows enabled/disabled state, key/local status, provider status badge, sanitized result message, latency, last checked time, and a per-provider Test button.
- Added a sequential Test All action for all configured providers.
- Sanitized common `sk-*`, `AIza*`, Bearer, and API-key header patterns before test messages render.

UI polish:

- Found the main raw-HTML-looking UI cause: a global `* { margin: 0; padding: 0; }` reset in `tokens.css` was overriding Tailwind utility classes.
- Removed that global padding/margin reset and added Tailwind `@source` hints for renderer/shared files.
- Refined shared buttons, cards, badges, inputs, typography, sidebar brand text, chat empty state, and settings surfaces.
- Reserved display serif styling for brand/display text and kept normal UI text sans-serif.
- Limited the right inspector to the chat workspace so settings and preview pages have more room.

Prompt 8 premium UX follow-up:

- Re-read the ZIP handoff and applied the requested calm desktop direction while keeping Aureon original and not copying Claude/Anthropic assets, branding, exact layout, fonts, colors, or private behavior.
- Reworked the empty-chat start surface with compact starter prompts that insert text directly into the composer.
- Added a `composer-insert` browser event so prompt chips and future workspace actions can draft text without bypassing normal user send behavior.
- Polished the composer into a larger elevated rounded surface with a quiet toolbar, prompt-library trigger, and rounded send button.
- Reworked message rhythm: user prompts are right-aligned soft bubbles; assistant answers are left-aligned reading blocks with Aureon identity and copy controls.
- Added a dedicated `--shadow-composer` token and regression checks for the starter-prompt insertion path.

LivePreview:

- Made the Preview idle/no-sandbox state expose status, URL, logs, Stop Server, and Open in Browser controls.
- Re-ran the LivePreview E2E suite successfully after the fix.
- Added an in-process Electron main-process HTTP static server for HTML/Coding Demo previews.
- Kept Vite+React on the npm/Vite runner path with `shell: true` on Windows and clearer stderr-based error propagation.
- Added Copy URL, Restart, and sandbox directory visibility to the LivePreview UI.
- Added canonical path containment checks for static preview requests.

Provider/model and input continuation:

- Added provider model sync hooks for LM Studio and OpenRouter, and auto-sync behavior after successful local/OpenRouter provider tests.
- Restored robust shared `Input` paste handling so Provider API key fields update React state correctly on paste.

Documentation:

- Updated `CHANGELOG.md`, `README.md`, `SECURITY_NOTES.md`, `ARCHITECTURE.md`, `AI_QA_REPORT.md`, and `docs/UX_DECISIONS.md`.
- Added this `CONTINUATION_NOTES.md`.

## Validation already run before this note

Known passing checks after the 2026-07-08 continuation:

- `npm run verify:native`
- `npm run typecheck`
- `npm test` (278 tests)
- `npm run build`
- `npm run test:e2e` (79/79 pass)
- Targeted provider API-key paste E2E after the fix
- `npm run test:openrouter` reached OpenRouter successfully; the free model response was non-deterministic and did not exactly echo `AUREON_OK`.

## Current important files

- `src/renderer/src/pages/settings/ProvidersPage.tsx`
- `src/renderer/src/theme/tokens.css`
- `src/renderer/src/theme/typography.css`
- `src/renderer/src/components/shared/Input.tsx`
- `src/renderer/src/components/shared/Button.tsx`
- `src/renderer/src/components/shared/Card.tsx`
- `src/renderer/src/components/shared/Badge.tsx`
- `src/renderer/src/layouts/AppShell.tsx`
- `src/renderer/src/pages/LivePreview.tsx`
- `src/renderer/src/components/chat/ChatPanel.tsx`
- `src/renderer/src/components/chat/MessageInput.tsx`
- `src/renderer/src/components/chat/MessageBubble.tsx`
- `src/renderer/src/components/shared/Input.tsx`
- `src/main/services/live-preview.service.ts`
- `src/main/services/provider.service.ts`
- `src/main/ipc/provider.ipc.ts`
- `tests/e2e/03-aureon-settings.spec.ts`
- `tests/e2e/09-aureon-live-preview.spec.ts`
- `tests/unit/input-handling.test.ts`
- `tests/unit/provider-security.test.ts`
- `tests/unit/live-preview.test.ts`
- `README.md`
- `CHANGELOG.md`
- `SECURITY_NOTES.md`
- `AI_QA_REPORT.md`
- `ARCHITECTURE.md`
- `docs/UX_DECISIONS.md`

## Next work

1. Implement the top-level `Chat / Cowork / Code` mode switch from the pasted continuation prompt.
2. Redesign the chat home screen into an Aureon-original Claude/Codex-like start surface with large composer, model/profile/project controls, tool badges, and suggestion chips.
3. Redesign Settings into a three-column structure: app sidebar, settings category column, detail panel.
4. Refine the right inspector into quieter collapsible sections for intent, agent, risk, skills, tools, and keywords.
5. Align Code mode with LivePreview: project selector, preview status, demo runner, logs, and external preview actions.
6. Add E2E tests for mode switch, home composer, settings three-column layout, Code mode entry points, and no horizontal overflow at 1366x768.
7. Keep the current safety boundary: no autonomous computer/mouse/keyboard control until explicitly implemented behind confirmations and documented permissions.
