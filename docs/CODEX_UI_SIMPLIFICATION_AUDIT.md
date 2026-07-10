# Vibeforge — Codex UI Simplification Audit

This audit evaluates all active screens in Vibeforge to identify duplicate, confusing, dead, or cluttered controls, recommending changes to transform the workspace into a clean, Codex-style interface.

---

## 1. Screen-by-Screen Audit

### Home / Studio
* **Duplicate Controls:**
  - The hero composer has a "Start building" button, while clicking the "Build App" task card opens a drawer with another "Start Task Flow" button.
  - The composer has an "Open chat" button, which duplicates the sidebar's Chat link.
* **Confusing Controls:**
  - The "Output Format" selection offers "Generate + Preview", "Generate sandbox", and "Plan only". A beginner does not need these separate modes displayed so prominently.
* **Recommendations:**
  - Consolidate composer submission and drawer builder submission to use a single unified label: **"Build with Preview"**.
  - Hide "Plan only" and "Generate sandbox" as secondary items or inside a dropdown list.

### Chat
* **Confusing Controls:**
  - System profile badge and model label are displayed in multiple header locations.
  - The empty state contains grid cards that overlap conceptually with the Studio's task cards.
* **Recommendations:**
  - Clean up the chat header to only display the current model info next to the system profile.
  - Add inline beginner guidance in the empty state explaining how to trigger automated coding tasks.

### Code Mode / LivePreview
* **Duplicate Controls:**
  - Left configuration panel has both "Create & Build" and "Run Coding Demo App" buttons placed sequentially, confusing the primary flow.
* **Recommendations:**
  - Merge these actions. Use **"Build with Preview"** as the primary CTA.
  - Place "Run Coding Demo" as a secondary link or dropdown option.

### Vibe Coding
* **Confusing Controls:**
  - Offers a multi-step onboarding wizard, a "Guided" mode, and a "Learn" tab, which duplicates details found in the Learn page.
* **Recommendations:**
  - Streamline buttons to directly output prompts to either **Chat** or **Preview** mode.

### Settings & Categories
* **Confusing Controls:**
  - Settings side panel has 17 categories listed in a single scrollable list.
* **Recommendations:**
  - Hide advanced settings categories behind an **"Advanced"** toggle to prevent overwhelming new users.
  - Simplify settings lists to match:
    - **Secondary settings:** General, Providers & Models, System Prompts, Appearance, Projects, Learn, Skills.
    - **Advanced settings:** MCP, Connectors, Logs, Developer Setup, Beta/Release.
