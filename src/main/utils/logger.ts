import fs from 'fs'
import path from 'path'
import { getLogsPath } from './paths'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private logPath: string | null = null
  private buffer: string[] = []

  init(): void {
    this.logPath = getLogsPath()
    const dir = path.dirname(this.logPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    // Flush buffer
    for (const entry of this.buffer) {
      this.writeToFile(entry)
    }
    this.buffer = []
  }

  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString()
    const metaStr = meta !== undefined ? ` ${JSON.stringify(meta)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`
  }

  private writeToFile(entry: string): void {
    if (this.logPath) {
      fs.appendFileSync(this.logPath, entry + '\n')
    } else {
      this.buffer.push(entry)
    }
  }

  private log(level: LogLevel, message: string, meta?: unknown): void {
    const entry = this.formatMessage(level, message, meta)
    this.writeToFile(entry)

    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    consoleFn(entry)
  }

  debug(message: string, meta?: unknown): void { this.log('debug', message, meta) }
  info(message: string, meta?: unknown): void { this.log('info', message, meta) }
  warn(message: string, meta?: unknown): void { this.log('warn', message, meta) }
  error(message: string, meta?: unknown): void { this.log('error', message, meta) }
}

export const logger = new Logger()

export function readRecentLogs(lines: number = 200): string {
  const logPath = getLogsPath()
  if (!fs.existsSync(logPath)) return ''

  const content = fs.readFileSync(logPath, 'utf-8')
  const allLines = content.split('\n').filter(Boolean)
  return allLines.slice(-lines).join('\n')
}

export function clearLogs(): void {
  const logPath = getLogsPath()
  if (fs.existsSync(logPath)) {
    fs.unlinkSync(logPath)
  }
}
