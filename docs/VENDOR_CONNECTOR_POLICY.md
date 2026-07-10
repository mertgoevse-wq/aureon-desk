# Vendor Connector Policy

Last updated: 2026-07-09

## Rule

Vibeforge does not invent, copy, imitate, or ship fake vendor logos for connector cards.

## Allowed

- Neutral Lucide icons with text labels.
- Official vendor assets only when all of these are true:
  - The asset is stored under `assets/vendor/`.
  - Attribution/license notes are present in `assets/vendor/README.md`.
  - The UI has a fallback neutral icon.
  - The asset does not imply partnership, endorsement, or certification.

## Not Allowed

- Lookalike logos.
- Generated pseudo-logos for Facebook, Instagram, YouTube, TikTok, X/Twitter, LinkedIn, WhatsApp, OpenAI, Google, Anthropic, GitHub, or other vendors.
- Unattributed copied brand assets.
- UI copy that implies Vibeforge is affiliated with a vendor.

## Social Connectors

Social connector cards use neutral icons only. Official API/OAuth setup docs may be linked, but live write actions remain confirmation-gated:

- Posting requires exact content preview and explicit confirmation.
- Replying requires exact content preview and explicit confirmation.
- Deleting requires exact target preview and explicit confirmation.
- Uploading requires exact file/account/channel/metadata preview and explicit confirmation.
- Every such action must support cancel.

## WhatsApp

WhatsApp support is limited to official WhatsApp Business API placeholders. Vibeforge does not automate WhatsApp Web, personal accounts, phone screens, or browser sessions in this build.
