import { ipcMain } from 'electron'
import { providerService } from '../services/provider.service'
import { PROVIDER_ADAPTERS } from '../../shared/constants'
import { logger } from '../utils/logger'

export function registerProviderIPC(): void {
  ipcMain.handle('provider:list', () => {
    return providerService.listProviders()
  })

  ipcMain.handle('provider:get', (_event, id: string) => {
    const provider = providerService.getProvider(id)
    if (!provider) return null

    // Return provider with masked API key instead of raw key
    const maskedKey = providerService.getMaskedApiKey(id)

    return {
      ...provider,
      api_key_enc: maskedKey ? `masked:${maskedKey}` : null
    }
  })

  ipcMain.handle('provider:adapters', () => {
    return PROVIDER_ADAPTERS
  })

  ipcMain.handle('provider:setApiKey', (_event, providerId: string, apiKey: string) => {
    providerService.setApiKey(providerId, apiKey)
    return true
  })

  ipcMain.handle('provider:deleteApiKey', (_event, providerId: string) => {
    providerService.deleteApiKey(providerId)
    return true
  })

  ipcMain.handle('provider:hasApiKey', (_event, providerId: string) => {
    const masked = providerService.getMaskedApiKey(providerId)
    return masked !== null
  })

  ipcMain.handle('provider:toggleEnabled', (_event, providerId: string, enabled: boolean) => {
    providerService.setProviderEnabled(providerId, enabled)
    return true
  })

  ipcMain.handle('provider:setBaseUrl', (_event, providerId: string, baseUrl: string) => {
    providerService.setBaseUrl(providerId, baseUrl)
    return true
  })

  ipcMain.handle('provider:models', (_event, providerId: string) => {
    return providerService.getModels(providerId)
  })

  ipcMain.handle('model:allEnabled', () => {
    return providerService.getAllEnabledModels()
  })

  ipcMain.handle('model:toggleEnabled', (_event, modelId: string, enabled: boolean) => {
    providerService.setModelEnabled(modelId, enabled)
    return true
  })

  logger.info('Provider IPC handlers registered')
}
