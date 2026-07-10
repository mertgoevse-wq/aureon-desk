import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'path'

// Path to the built Electron main process entry point
const MAIN_ENTRY = resolve(__dirname, 'out/main/index.js')

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1,
  workers: 1, // Electron tests must run sequentially
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    // Capture traces on first retry
    trace: 'on-first-retry',
    // Screenshots only on failure
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'electron',
      use: {
        ...devices['Desktop Chrome'],
        // Electron window size
        viewport: { width: 1400, height: 900 },
        // Record video on failure (debugging aid for headed runs).
        // Headed tests still produce the full screenshot set in
        // tests/e2e/artifacts/human-visible/ for the human-visible harness.
        video: 'retain-on-failure'
      }
    }
  ]
})
