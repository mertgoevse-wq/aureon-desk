import { registerChatIPC } from './chat.ipc'
import { registerProviderIPC } from './provider.ipc'
import { registerPromptIPC } from './prompt.ipc'
import { registerPromptLibraryIPC } from './promptLibrary.ipc'
import { registerSettingsIPC } from './settings.ipc'
import { registerCredentialsIPC } from './credentials.ipc'
import { registerRoutingIPC } from './routing.ipc'
import { registerGitHubIPC } from './github.ipc'
import { registerToolIPC } from './tool.ipc'
import { registerProjectIPC } from './project.ipc'
import { registerLogIPC } from './log.ipc'
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
  registerGitHubIPC()
  registerToolIPC()
  registerProjectIPC()
  registerLogIPC()

  logger.info('All IPC handlers registered')
}
