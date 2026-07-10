#!/usr/bin/env node
/**
 * Aureon Desk — Prerequisite Checker
 *
 * Detects developer tools, system info, and optional dependencies.
 * Outputs a console table and writes a JSON report.
 *
 * Usage: node scripts/check-prerequisites.mjs [--json]
 */

import { execSync } from 'child_process'
import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import os from 'os'

// ── Helpers ─────────────────────────────────────────────────────

function run(cmd) {
  try {
    return { ok: true, value: execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim() }
  } catch {
    return { ok: false, value: null }
  }
}

function checkDir(path) {
  try { return existsSync(path) }
  catch { return false }
}

function versionFromOutput(output, regex) {
  if (!output) return null
  const m = output.match(regex)
  return m ? m[1] : output.split('\n')[0].slice(0, 40)
}

// ── Checks ───────────────────────────────────────────────────────

const checks = {
  system: () => {
    const win = run('ver')
    return {
      windowsVersion: win.ok ? win.value : 'unknown',
      cpuCores: os.cpus().length,
      totalRamGB: Math.round(os.totalmem() / 1024 / 1024 / 1024),
      platform: os.platform(),
      arch: os.arch(),
    }
  },

  node: () => {
    const node = run('node --version')
    const npm = run('npm --version')
    return {
      installed: node.ok,
      version: node.ok ? node.value : null,
      npmVersion: npm.ok ? npm.value : null,
      installCmd: 'winget install OpenJS.NodeJS.LTS',
      downloadUrl: 'https://nodejs.org/en/download',
      license: 'MIT',
      required: true,
    }
  },

  git: () => {
    const git = run('git --version')
    return {
      installed: git.ok,
      version: git.ok ? versionFromOutput(git.value, /(\d+\.\d+\.\d+)/) : null,
      installCmd: 'winget install Git.Git',
      downloadUrl: 'https://git-scm.com/download/win',
      license: 'GPL v2',
      required: true,
    }
  },

  githubCli: () => {
    const gh = run('gh --version')
    return {
      installed: gh.ok,
      version: gh.ok ? versionFromOutput(gh.value, /(\d+\.\d+\.\d+)/) : null,
      installCmd: 'winget install GitHub.cli',
      downloadUrl: 'https://github.com/cli/cli/releases',
      license: 'MIT',
      required: false,
    }
  },

  vsBuildTools: () => {
    const paths = [
      process.env['ProgramFiles(x86)'] + '\\Microsoft Visual Studio\\2022\\BuildTools',
      process.env['ProgramFiles(x86)'] + '\\Microsoft Visual Studio\\2019\\BuildTools',
    ]
    const found = paths.find(p => checkDir(p))
    return {
      installed: !!found,
      path: found || null,
      installCmd: 'Download from https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022',
      downloadUrl: 'https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022',
      license: 'Microsoft EULA',
      workload: 'Desktop development with C++',
      required: true,
    }
  },

  playwright: () => {
    const check = run('npx playwright install --dry-run chromium 2>&1')
    const installed = check.ok && check.value.includes('is already installed')
    return {
      installed,
      browsers: installed ? ['chromium'] : [],
      installCmd: 'npx playwright install chromium',
      required: false,
    }
  },

  ollama: () => {
    const version = run('ollama --version')
    const models = version.ok ? run('ollama list 2>&1') : { ok: false, value: null }
    const modelList = models.ok && models.value
      ? models.value.split('\n').slice(1).filter(Boolean).map(l => l.split(/\s+/)[0])
      : []
    return {
      installed: version.ok,
      version: version.ok ? version.value : null,
      models: modelList,
      installCmd: 'winget install Ollama.Ollama',
      downloadUrl: 'https://ollama.com/download',
      license: 'MIT',
      required: false,
    }
  },

  lmStudio: () => {
    const path = join(process.env.LOCALAPPDATA || '', 'LM-Studio')
    const installed = checkDir(path)
    return {
      installed,
      path: installed ? path : null,
      downloadUrl: 'https://lmstudio.ai',
      required: false,
    }
  },
}

// ── Offline Installer Detection ─────────────────────────────────

function checkOfflineInstallers() {
  const vendorDir = join(process.cwd(), 'vendor', 'installers')
  const expected = [
    'node-lts-x64.msi',
    'git-for-windows-x64.exe',
    'github-cli-x64.msi',
    'vs-build-tools.exe',
    'ollama-windows.exe',
  ]
  const found = expected.filter(f => existsSync(join(vendorDir, f)))
  const missing = expected.filter(f => !found.includes(f))
  return {
    vendorPath: vendorDir,
    exists: existsSync(vendorDir),
    found,
    missing,
    total: expected.length,
  }
}

// ── Output ───────────────────────────────────────────────────────

function generateReport() {
  const system = checks.system()
  const node = checks.node()
  const git = checks.git()
  const githubCli = checks.githubCli()
  const vsBuildTools = checks.vsBuildTools()
  const playwright = checks.playwright()
  const ollama = checks.ollama()
  const lmStudio = checks.lmStudio()
  const offline = checkOfflineInstallers()

  const allRequiredInstalled = node.installed && git.installed && vsBuildTools.installed
  const allOptionalInstalled = githubCli.installed && ollama.installed

  return {
    generatedAt: new Date().toISOString(),
    system,
    dependencies: {
      required: { node, git, vsBuildTools },
      recommended: { githubCli, playwright },
      optional: { ollama, lmStudio },
    },
    offline,
    summary: {
      requiredInstalled: allRequiredInstalled,
      recommendedInstalled: allOptionalInstalled,
      totalChecks: 8,
      passed: [node, git, vsBuildTools, githubCli, playwright, ollama, lmStudio].filter(d => d.installed).length,
    },
  }
}

function printTable(report) {
  const { dependencies, system, offline, summary } = report

  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║       Aureon Desk — Prerequisite Checker            ║')
  console.log('╚══════════════════════════════════════════════════════╝\n')

  console.log('System:')
  console.log(`  Windows:    ${system.windowsVersion}`)
  console.log(`  CPU Cores:  ${system.cpuCores}`)
  console.log(`  RAM:        ${system.totalRamGB} GB`)
  console.log(`  Arch:       ${system.arch}\n`)

  console.log('Required Dependencies:')
  for (const [name, dep] of Object.entries(dependencies.required)) {
    const icon = dep.installed ? '✅' : '❌'
    console.log(`  ${icon} ${name.padEnd(18)} ${dep.version || 'NOT FOUND'}`)
  }

  console.log('\nRecommended:')
  for (const [name, dep] of Object.entries(dependencies.recommended)) {
    const icon = dep.installed ? '✅' : '⚠️'
    console.log(`  ${icon} ${name.padEnd(18)} ${dep.version || (dep.browsers && dep.browsers.length > 0 ? dep.browsers.join(', ') : 'not found')}`)
  }

  console.log('\nOptional AI / Local:')
  for (const [name, dep] of Object.entries(dependencies.optional)) {
    const icon = dep.installed ? '✅' : '—'
    console.log(`  ${icon} ${name.padEnd(18)} ${dep.version || (dep.path ? dep.path : 'not found')}`)
  }

  console.log(`\nOffline Installers: ${offline.found.length}/${offline.total} found in vendor/installers/`)
  if (offline.missing.length > 0) {
    console.log(`  Missing: ${offline.missing.join(', ')}`)
  }

  console.log('\n─────────────────────────────────────────────────────────')
  console.log(`  ${summary.passed}/8 checks passed`)
  if (summary.requiredInstalled) {
    console.log('  ✅ All required developer tools installed')
  } else {
    console.log('  ❌ Some required tools missing — see above')
  }
  console.log('─────────────────────────────────────────────────────────\n')
}

// ── Main ─────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const jsonMode = args.includes('--json')
const outputDir = args.includes('--save')

const report = generateReport()
printTable(report)

if (outputDir || jsonMode) {
  const outPath = join(process.cwd(), 'docs', 'prerequisite-check.json')
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(`Report saved to: ${outPath}`)
}
