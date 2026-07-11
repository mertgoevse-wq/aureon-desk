# Vibeforge Guided Builder UX Plan

This document details the transition of Vibeforge from a technical AI desktop dashboard into a guided no-code builder designed for non-programmers.

## Current Problem
The landing page and workflow tools in Vibeforge are geared towards technical concepts:
- Autonomy levels, main process IPC details, platform selections (Vite, React, HTML).
- Code workspaces, MCP tool managers, standard provider lists.
- Overloaded technical menus and configuration wizards.

## Desired Guided Flow
1. **Goal Discovery:** "What do you want to build?"
2. **Project Type Selection:** Choose from Website, Web App, Android App Prototype, Desktop App, Landing Page, Dashboard, Tool.
3. **Purpose/Goal Specification:** State the purpose or key requirements of the build.
4. **Style Picker:** Select the visual design theme (Calming Ivory, Soft Teal, Warm Charcoal, etc.).
5. **Brief Generation:** Vibeforge turns these inputs into a structured build brief automatically behind the scenes.
6. **Execution:** User clicks the primary "Build with Preview" action.
7. **Interactive Workspace:** The plan, files, diff, and live preview iframe appear automatically.
8. **Iterative Feedback:** Vibeforge suggests next improvements below the preview.

## Information Architecture

### Primary Screens (No-Code Focus)
- **Guided Builder Home (`/`):** The primary landing view. Prompts the user step-by-step to define their goal, type, style, and compiles it into a preview build.
- **Interactive Preview (`/preview`):** The workspace showing the simplified LivePreview canvas. Default tab is the interactive preview. Includes Files, Diff, Code, Logs, and Diagnostics tabs.

### Advanced Screens (Moved behind toggles/Drawers)
- **Provider API Credentials:** Moved behind Advanced Settings or setup drawers.
- **MCP / Connectors Registry:** Hidden behind settings developer options.
- **System Prompts / Custom Models:** Moved to Advanced settings.

## User Journeys

### Beginner User Journey
1. Open Vibeforge.
2. See simple question: "What do you want to build?"
3. Choose "Website" or another option.
4. Fill in: "A simple portfolio with a gallery".
5. Choose style: "Calming Ivory".
6. Click "Build with Preview".
7. See the preview render automatically.
8. Iterate step-by-step using suggestions.

### Advanced User Journey
1. Open Vibeforge.
2. Toggle "Advanced Mode" in the top bar or settings.
3. Select specific models and providers.
4. Open the developer tools in the preview workspace to inspect stdio logs, custom endpoints, or raw diagnostics.
5. Manually configure third-party MCP servers.
