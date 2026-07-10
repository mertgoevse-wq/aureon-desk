# Aureon Desk — Human-Visible QA Harness

> **Last updated:** 2026-07-09
> **Spec:** `tests/e2e/aureon-human-visible.spec.ts`
> **Artifacts:** `tests/e2e/artifacts/human-visible/`

The human-visible QA harness launches the real **Aureon Desk** Electron app
in headed mode (visible window) and walks through 20 user-facing steps,
saving a numbered PNG screenshot at every major step. It is intended for
manual watch, demo recordings, and human-style regression review.

---

## How to run

```bash
# Recommended: visible window, every step screenshotted
npm run test:human:headed

# Optional slow-motion variant for recordings (bash; uses inline env var)
# On Windows PowerShell: $env:AUREON_SLOW_MO_MS='500'; npm run test:human:headed
npm run test:human:headed:slow

# Playwright UI mode for interactive re-running of individual steps
npm run test:human:ui
```

`workers=1` is forced. `test.use({ trace: 'retain-on-failure' })` ensures
Playwright produces a debuggable trace when any step throws. The harness
also tolerates Electron launch flakes via the existing retry logic in
`tests/e2e/helpers/electronApp.ts`.

### Slow-motion env var

The `AUREON_SLOW_MO_MS` env var (read by `tests/e2e/helpers/electronApp.ts`)
adds an inter-keystroke delay to `electron.launch({ slowMo })`. **It is
opt-in** — when the env var is unset, every other E2E spec runs at full
speed and there is no global impact.

---

## What the harness tests

| #  | Step                                                                | Notable selectors |
|----|---------------------------------------------------------------------|-------------------|
| 1  | App launches (headed)                                               | (handled by `electron.launch`) |
| 2  | Main window shell mounted                                           | `data-testid="app-shell"` |
| 3  | Hero / Studio home visible with "Build calmly with Aureon" heading  | `data-testid="studio-page"`, `data-testid="hero-heading"` |
| 4  | Start Building button reachable                                     | `data-testid="hero-start-building-btn"` |
| 5  | Types the exact prompt: *"Build a tiny counter app with ivory theme, increment button, reset button, and live preview."* | `data-testid="hero-prompt-input"` |
| 6  | Press Enter triggers the build pipeline                             | (native `Enter` keyboard event) |
| 7  | Code Mode / LivePreview opens                                       | `data-testid="live-preview-panel"` |
| 8  | Pipeline tabs appear (Code, Files, Diff, Plan)                      | `data-testid="build-tab-{code,files,diff,plan}"` |
| 9  | Code / Files / Diff / Plan tabs render content                      | same |
| 10 | LivePreview already opened (asserted in step 7)                     | `data-testid="live-preview-panel"` |
| 11 | Preview status shows running/idle (never error) + iframe renders    | `data-testid="preview-status"` + `iframe` |
| 12 | Click Increment / Reset inside the preview iframe                  | `frameLocator('iframe')` |
| 13 | Provider Settings opens                                             | `data-testid="nav-settings"`, `settings-nav-providers-models` |
| 14 | Type fake key `sk-test-not-real` into first API key input           | `input[type="password"]` |
| 15 | Save + Test connection shows sanitized error or mock result         | `Test connection`, `Test All` buttons |
| 16 | Tools & MCP page opens                                              | `data-testid="settings-nav-tools-mcp"` |
| 17 | Risky MCP actions require confirmation (safety gate present)        | Modal text + button count |
| 18 | Dropdowns + modals (custom provider, navigation round-trip)         | `Add Custom Provider`, studio return |
| 19 | Screenshots taken at every step                                     | `tests/e2e/artifacts/human-visible/*.png` |
| 20 | Artifacts saved under `tests/e2e/artifacts/human-visible/`          | (filesystem) |

After step 20, the spec prints a one-line summary including pageErrors,
consoleErrors, and the artifact directory.

---

## Screenshots produced

Numbered PNGs are written to `tests/e2e/artifacts/human-visible/`:

| Filename                             | Captures |
|--------------------------------------|----------|
| `01_app_window_shell.png`            | First window, `app-shell` mounted |
| `03_hero_home.png`                   | Studio hero landing |
| `05_prompt_typed.png`                | Hero composer with the prompt filled |
| `06_enter_pressed.png`               | Composer immediately after Enter |
| `07_code_mode_open.png`              | Code mode / LivePreview mounts |
| `08_pipeline_tabs_visible.png`       | Build pipeline tabs (Code/Files/Diff/Plan) |
| `08_build_files_tab.png`             | Pipeline Files tab content |
| `09_build_code_tab.png`              | Pipeline Code tab content |
| `09_build_diff_tab.png`              | Pipeline Diff tab (if visible) |
| `09_build_plan_tab.png`              | Pipeline Plan tab (if visible) |
| `08_pipeline_panel_skipped.png`      | If pipeline completed before panel mounted |
| `11_livepreview_running.png`         | LivePreview running state |
| `12a_preview_counter_clicked.png`    | After clicking Increment in iframe |
| `12b_preview_after_reset.png`        | After clicking Reset in iframe |
| `12_preview_no_iframe.png`           | If no iframe present (deterministic demo skipped) |
| `13_settings_general.png`            | Settings → General |
| `13_settings_providers_list.png`     | Settings → Providers & Models |
| `14_settings_provider_key_typed.png` | Fake API key typed in |
| `14_settings_provider_no_key_input.png` | If no password inputs were rendered |
| `15a_settings_provider_key_saved.png`| After Save Key click |
| `15b_settings_provider_test_result.png`| After Test connection |
| `16_mcp_tools_home.png`              | Tools & MCP landing |
| `17a_add_mcp_modal_open.png`         | Add MCP Server modal open |
| `17b_add_mcp_modal_closed.png`       | Modal closed via ESC |
| `17_add_mcp_button_missing.png`      | If Add MCP button not visible |
| `18a_add_custom_provider_modal.png` | Add Custom Provider modal |
| `18b_custom_provider_closed.png`     | Modal closed |
| `18c_final_studio_return.png`        | Final return to Studio hero |

---

## How selectors are picked

The spec uses a strict **stable-selector priority** to keep this resilient
against UI drift:

1. `data-testid` attributes already present in the renderer
   (`hero-prompt-input`, `build-pipeline-panel`, etc.).
2. `getByRole` for buttons + headings (`Settings & Models`,
   `Add MCP Server`, `Test connection`).
3. `aria-modal` / `[role="dialog"]` for modals.
4. CSS fallbacks only when role / testid selectors can't disambiguate
   (e.g. the OpenRouter card uses `xpath=ancestor::*[contains(@class, "rounded-")]`
   so the title heading scopes properly).

No select-by-text-not-aria strategies are used — they fail in headed i18n runs.

---

## Known limitations

- **Console errors are logged but non-fatal.** The harness logs the count
  of `console.error` events (2 typical in dev for IPC retries, etc.)
  but only **fails** on `pageerror` (React crashes). This matches the
  convention already used in `tests/e2e/99-human-click-qa.spec.ts`.

- **Video on failure is not enabled.** Playwright `video` is configured
  at the project level in `playwright.config.ts`; turning it on increases
  test runtime globally. The harness provides rich PNG screenshots at
  every step instead, which has equivalent debug value for this flow.

- **Step 14 is defensive.** If the providers list hasn't finished loading
  on first launch, the harness records the empty state instead of failing.
  This is intentional — the headed run is meant for visual review, not
  to be a gating CI signal. CI should continue to use the deterministic
  smoke/pipeline specs.

- **Step 8 may capture "skipped" state.** If the deterministic demo
  finishes before the panel mounts, the harness records
  `08_pipeline_panel_skipped.png` and continues to the iframe check.

- **Step 12 uses a CSS fallback chain** to find Increment/Reset buttons
  inside the iframe because the deterministic counter demo's selectors
  are not yet versioned. Files that need stable in-iframe selectors
  should add `data-testid` to the demo counter app.

- **The bash `AUREON_SLOW_MO_MS=500` script only works in bash.** PowerShell
  users should run `$env:AUREON_SLOW_MO_MS='500'; npm run test:human:headed:slow`.

- **PowerShell / cmd users** can set the env var via:
  ```powershell
  $env:AUREON_SLOW_MO_MS = '500'
  npm run test:human:headed
  ```

---

## Last verified run

- **Branch:** `main`
- **Date:** 2026-07-10
- **Verification captured:** `npm run typecheck` ✅ PASS · `npm test` ✅ 768 tests PASS · `npm run build` ✅ PASS
- **Headed run:** ✅ PASS through Steps 1–20. The full run completed in
  34.5 s on a 1440×900 desktop window, produced 18 screenshots, had
  0 page errors, and 2 harmless console errors (logged but non-fatal,
  matching the existing `99-human-click-qa.spec.ts` convention).

---

## Related files

- `tests/e2e/aureon-human-visible.spec.ts` — the spec
- `tests/e2e/helpers/electronApp.ts` — extended with `AUREON_SLOW_MO_MS`
- `playwright.config.ts` — `workers=1`, `timeout=60s` (overridden per-test)
- `package.json` — `test:human:headed` / `test:human:headed:slow` / `test:human:ui`
