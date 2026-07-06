import { ipcMain } from 'electron'
import { vault } from '../security/vault'
import { logger } from '../utils/logger'

export function registerCredentialsIPC(): void {
  ipcMain.handle('credentials:isAvailable', () => {
    return vault.isAvailable()
  })

  ipcMain.handle('credentials:encrypt', (_event, plaintext: string) => {
    try {
      return vault.encryptToBase64(plaintext)
    } catch (err) {
      logger.error('Credentials encryption failed', err)
      throw new Error('Encryption failed')
    }
  })

  ipcMain.handle('credentials:decrypt', (_event, encryptedBase64: string) => {
    try {
      return vault.decryptFromBase64(encryptedBase64)
    } catch (err) {
      logger.error('Credentials decryption failed', err)
      throw new Error('Decryption failed')
    }
  })

  ipcMain.handle('credentials:maskKey', (_event, key: string) => {
    return vault.maskKey(key)
  })

  logger.info('Credentials IPC handlers registered')
}
