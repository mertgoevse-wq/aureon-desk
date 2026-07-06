import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export function getAppDataPath(): string {
  const basePath = app.getPath('userData')
  return basePath
}

export function getDbPath(): string {
  const dataDir = getAppDataPath()
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  return path.join(dataDir, 'ivory.db')
}

export function getImportsPath(): string {
  const dataDir = getAppDataPath()
  const importsDir = path.join(dataDir, 'imports')
  if (!fs.existsSync(importsDir)) {
    fs.mkdirSync(importsDir, { recursive: true })
  }
  return importsDir
}

export function getLogsPath(): string {
  const dataDir = getAppDataPath()
  const logsDir = path.join(dataDir, 'logs')
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }
  return path.join(logsDir, 'app.log')
}
