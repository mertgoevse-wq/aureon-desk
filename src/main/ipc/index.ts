import { registerChatIPC } from './chat.ipc'
import { registerProviderIPC } from './provider.ipc'
import { registerPromptIPC } from './prompt.ipc'
import { registerPromptLibraryIPC } from './promptLibrary.ipc'
import { registerSettingsIPC } from './settings.ipc'
import { registerCredentialsIPC } from './credentials.ipc'
import { registerRoutingIPC } from './routing.ipc'
import { logger } from '../utils/logger'

export function registerAllIPC(): void {
  logger.info('Registering IPC handlers...')

  registerChatIPC()
  registerProviderIPC()
  registerPromptIPC()
  registerPromptLibraryIPC()
  registerSettingsIPC()
  registerCredentialsIPC()
  registerRoutingIPC()

  logger.info('All IPC handlers registered')
}
