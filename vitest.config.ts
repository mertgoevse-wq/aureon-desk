import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Only run unit tests - e2e tests use Playwright
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**']
  }
})
