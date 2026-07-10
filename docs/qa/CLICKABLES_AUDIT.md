# Clickable UI Elements Audit — Vibeforge

This document compiles the visual audit of all clickable controls, button handlers, dynamic list cards, forms, and triggers across the codebase to ensure zero no-op/silent buttons.

---

## 1. Main Shell & Navigation

| Component | Clickable Label / Control | Current Behavior | Fix/Repairs Needed | Status |
| :--- | :--- | :--- | :--- | :---: |
| [AppShell.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/layouts/AppShell.tsx) | Workspace mode tabs (Studio/Chat/Cowork/Code) | Navigates to corresponding hash route path. | None. Dynamic ARIA selections stringified. | **PASS** |
| [AppShell.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/layouts/AppShell.tsx) | Back/Forward history chevrons | Navigates Electron window web history forward/back. | None. Disabled when history stack is empty. | **PASS** |
| [AppShell.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/layouts/AppShell.tsx) | Search button (Ctrl+K) | Opens command palette overlay dialogue. | None. Fully functional. | **PASS** |
| [Sidebar.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/layouts/Sidebar.tsx) | Sidebar Expand/Collapse handle | Collapses sidebar width to 56px or expands to 232px. | None. Fully functional. | **PASS** |
| [Sidebar.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/layouts/Sidebar.tsx) | Nav links (Prompts, Settings, etc.) | Routes to the target workspace page. | None. Fully functional. | **PASS** |

---

## 2. Vibeforge Studio

| Component | Clickable Label / Control | Current Behavior | Fix/Repairs Needed | Status |
| :--- | :--- | :--- | :--- | :---: |
| [Studio.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/Studio.tsx) | 10 Task Category Cards (Build App, etc.) | Triggers orchestration API and opens side drawer. | Prompt textarea edits must update state; wizard selectors need integration. | **FIXING** |
| [Studio.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/Studio.tsx) | Target Platform buttons (in Build App drawer) | Visual buttons, click is a no-op. | Bind selection click to state, save target path options, highlight selection. | **FIXING** |
| [Studio.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/Studio.tsx) | Autonomy Level Buttons (1 to 4) | Updates the active task execution autonomy state. | None. Fully functional. | **PASS** |
| [Studio.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/Studio.tsx) | "Start Task Flow" Button | Navigates to workspace and dispatches prompt. | Must pass custom edited prompt + auto-trigger LivePreview when compiling. | **FIXING** |

---

## 3. Code Mode & LivePreview

| Component | Clickable Label / Control | Current Behavior | Fix/Repairs Needed | Status |
| :--- | :--- | :--- | :--- | :---: |
| [LivePreview.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/LivePreview.tsx) | "Run Coding Demo App" button | Creates demo counter sandbox, starts compile server. | None. Fully functional. | **PASS** |
| [LivePreview.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/LivePreview.tsx) | "Start Server" / "Stop" button | Triggers background sandbox compiler lifecycle. | None. Fully functional (E2E click guard added). | **PASS** |
| [LivePreview.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/LivePreview.tsx) | Copy URL and Open Externally chevrons | Copies URL port host to clipboard / opens standard browser. | None. Fully functional. | **PASS** |
| [LivePreview.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/LivePreview.tsx) | Project Selector Dropdown | Toggles active project context. | None. Fully functional. | **PASS** |

---

## 4. Chat Workspace

| Component | Clickable Label / Control | Current Behavior | Fix/Repairs Needed | Status |
| :--- | :--- | :--- | :--- | :---: |
| [ChatWorkspace.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/ChatWorkspace.tsx) | "New Chat" button | Dispatches thread creation context. | None. Fully functional. | **PASS** |
| [ChatWorkspace.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/ChatWorkspace.tsx) | Model Selector dropdown | Lists available models, updates context on selection. | None. Fully functional. | **PASS** |
| [ChatWorkspace.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/ChatWorkspace.tsx) | Composer "Send" trigger button | Dispatches message to active provider execution thread. | None. Disabled when empty, enabled with content. | **PASS** |

---

## 5. Settings, Providers, & MCP Tools

| Component | Clickable Label / Control | Current Behavior | Fix/Repairs Needed | Status |
| :--- | :--- | :--- | :--- | :---: |
| [ProvidersPage.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/settings/ProvidersPage.tsx) | Provider API-key input & Save | Submits and encrypts credentials via safeStorage. | None. Fully functional. | **PASS** |
| [ProvidersPage.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/settings/ProvidersPage.tsx) | "Test Connection" button | Initiates model ping check, displays verification badge. | None. Fully functional. | **PASS** |
| [ToolsPage.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/settings/ToolsPage.tsx) | "Add MCP Server" button | Opens configuration modal. | None. Fully functional. | **PASS** |
| [ToolsPage.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/settings/ToolsPage.tsx) | Tool setting switches (Enable/Trust) | Dispatches state flags configuration changes. | None. Fully functional. | **PASS** |
| [ConnectorsPage.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/settings/ConnectorsPage.tsx) | Connect / Disconnect Buttons | Simulates OAuth and checks safeStorage credentials. | None. Fully functional. | **PASS** |

---

## 6. Vibe Coding Templates

| Component | Clickable Label / Control | Current Behavior | Fix/Repairs Needed | Status |
| :--- | :--- | :--- | :--- | :---: |
| [VibeCoding.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/VibeCoding.tsx) | Project Template Cards | Routes to Chat/Code mode and presets prompt details. | None. Fully functional. | **PASS** |
| [VibeCoding.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/VibeCoding.tsx) | Quick Start / Guided tabs | Switch views. | None. Fully functional. | **PASS** |
| [VibeCoding.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/pages/VibeCoding.tsx) | Guided Builder selections | Multi-step prompt compilation wizard. | None. Fully functional. | **PASS** |
