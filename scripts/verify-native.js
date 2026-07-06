/**
 * Verifies that the better-sqlite3 native binary exists and is loadable.
 * Run with: npm run verify:native  or  node scripts/verify-native.js
 */
const path = require('path')
const fs = require('fs')

const ROOT = path.resolve(__dirname, '..')
const BINARY_PATHS = [
  path.join(ROOT, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'),
  path.join(ROOT, 'node_modules', 'better-sqlite3', 'build', 'Debug', 'better_sqlite3.node'),
]

let found = false

for (const binPath of BINARY_PATHS) {
  if (fs.existsSync(binPath)) {
    console.log(`✅ Native binary found: ${binPath}`)
    found = true
    break
  }
}

if (!found) {
  console.error('')
  console.error('❌ ERROR: better_sqlite3 native binary not found!')
  console.error('')
  console.error('The better-sqlite3 package requires a compiled native addon (better_sqlite3.node).')
  console.error('')
  console.error('To fix this on Windows:')
  console.error('  1. Install Visual Studio Build Tools:')
  console.error('     https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022')
  console.error('  2. Select "Desktop development with C++" during installation')
  console.error('  3. Run: npm run rebuild:native')
  console.error('     (or: npx electron-builder install-app-deps)')
  console.error('')
  console.error('If VS Build Tools are already installed, try:')
  console.error('  npm run rebuild:native')
  console.error('')
  console.error('If the issue persists, delete node_modules and reinstall:')
  console.error('  rm -rf node_modules && npm install')
  console.error('')
  process.exit(1)
}

// Try to actually load it
try {
  require('better-sqlite3')
  console.log('✅ Native module loads successfully in Node.js')
  console.log('')
  console.log('Note: The module must also be compatible with Electron (Node ABI).')
  console.log('If npm start fails, run: npm run rebuild:native')
  process.exit(0)
} catch (err) {
  console.error('')
  console.error('❌ ERROR: better_sqlite3 module found but cannot be loaded:')
  console.error(`   ${err.message}`)
  console.error('')
  console.error('This usually means the binary was compiled for a different Node.js version.')
  console.error('Run: npm run rebuild:native')
  console.error('')
  process.exit(1)
}
