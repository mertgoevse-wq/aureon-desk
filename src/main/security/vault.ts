import { safeStorage } from 'electron'

/**
 * Security vault using Electron's safeStorage API.
 * On Windows, this uses DPAPI (Data Protection API) - user-scoped encryption.
 * Keys are bound to the current Windows user account and cannot be decrypted
 * on other machines or by other users.
 */
export class Vault {
  private initialized = false

  init(): void {
    this.initialized = true
  }

  isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  encrypt(plaintext: string): Buffer | null {
    if (!this.isAvailable()) {
      throw new Error('Encryption is not available on this system')
    }
    return safeStorage.encryptString(plaintext)
  }

  decrypt(encrypted: Buffer): string | null {
    if (!this.isAvailable()) {
      throw new Error('Decryption is not available on this system')
    }
    return safeStorage.decryptString(encrypted)
  }

  encryptToBase64(plaintext: string): string {
    const buf = this.encrypt(plaintext)
    if (!buf) throw new Error('Encryption failed')
    return buf.toString('base64')
  }

  decryptFromBase64(encryptedBase64: string): string {
    const buf = Buffer.from(encryptedBase64, 'base64')
    const result = this.decrypt(buf)
    if (result === null) throw new Error('Decryption failed - key may be corrupted or from different machine')
    return result
  }

  maskKey(key: string): string {
    if (key.length <= 8) return '****'
    return key.slice(0, 8) + '...' + key.slice(-4)
  }
}

export const vault = new Vault()
