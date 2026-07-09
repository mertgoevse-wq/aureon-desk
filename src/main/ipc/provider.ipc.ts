import { ipcMain } from 'electron'
import { providerService } from '../services/provider.service'
import { modelRouterService } from '../services/model-router.service'
import { PROVIDER_ADAPTERS } from '../../shared/constants'
import type { ModelTask } from '../../shared/model-selector'
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

  ipcMain.handle('provider:createFromAdapter', (_event, adapterSlug: string) => {
    const adapter = PROVIDER_ADAPTERS.find(a => a.slug === adapterSlug)
    if (!adapter) throw new Error(`Adapter ${adapterSlug} not found`)
    return providerService.createFromAdapter(adapter)
  })

  ipcMain.handle('provider:createCustom', (_event, input: { name: string; slug: string; baseUrl: string; apiKey?: string }) => {
    return providerService.createCustomProvider(input)
  })

  ipcMain.handle('provider:delete', (_event, providerId: string) => {
    return providerService.deleteProvider(providerId)
  })

  ipcMain.handle('provider:testConnection', async (_event, providerId: string) => {
    return await providerService.testConnection(providerId)
  })

  ipcMain.handle('provider:setDefaultModel', (_event, providerId: string, modelId: string) => {
    providerService.setDefaultModel(providerId, modelId)
    return true
  })

  ipcMain.handle('model:allEnabled', () => {
    return providerService.getAllEnabledModels()
  })

  ipcMain.handle('model:toggleEnabled', (_event, modelId: string, enabled: boolean) => {
    providerService.setModelEnabled(modelId, enabled)
    return true
  })

  ipcMain.handle('provider:syncOllamaModels', async () => {
    return await providerService.syncOllamaModels()
  })

  ipcMain.handle('provider:syncLMStudioModels', async () => {
    return await providerService.syncLMStudioModels()
  })

  ipcMain.handle('provider:syncOpenRouterModels', async () => {
    return await providerService.syncOpenRouterModels()
  })

  ipcMain.handle('provider:fetchOllamaModels', async (_event, baseUrl?: string) => {
    return await providerService.fetchOllamaModels(baseUrl)
  })

  // ---- Model Router (smart selection + token exhaustion) ----

  ipcMain.handle('model-router:selectForPrompt', (_event, prompt: string) => {
    return modelRouterService.selectModelForPrompt(prompt)
  })

  ipcMain.handle('model-router:handleExhaustion', (_event, exhaustedModelId: string, task: string, reason?: string) => {
    return modelRouterService.handleExhaustion(exhaustedModelId, task as ModelTask, reason)
  })

  ipcMain.handle('model-router:getExhausted', () => {
    return modelRouterService.getExhausted()
  })

  ipcMain.handle('model-router:clearExhaustion', (_event, modelId?: string) => {
    if (modelId) {
      modelRouterService.clearExhaustion(modelId)
    } else {
      modelRouterService.clearAllExhaustion()
    }
    return true
  })

  ipcMain.handle('model-router:getAllScores', () => {
    return modelRouterService.getAllScores()
  })

  ipcMain.handle('model-router:resolveBestForBuild', (_event, prompt: string) => {
    return modelRouterService.resolveBestModelForBuild(prompt)
  })

  ipcMain.handle('model-router:recordUsage', (_event, modelId: string) => {
    modelRouterService.recordUsage(modelId)
    return true
  })

  ipcMain.handle('model-router:getUsage', () => {
    return modelRouterService.getUsage()
  })

  ipcMain.handle('model-router:clearUsage', () => {
    modelRouterService.clearAllUsage()
    return true
  })

  logger.info('Provider IPC handlers registered')
}
