import { ipcMain } from 'electron'
import { chatService } from '../services/chat.service'
import { providerService } from '../services/provider.service'
import { promptService } from '../services/prompt.service'
import { chatCompletionService } from '../services/chat-completion.service'
import { logger } from '../utils/logger'
import type { ChatSendResult } from '../services/chat-completion.service'

export function registerChatIPC(): void {
  ipcMain.handle('chat:list', (_event, includeArchived?: boolean) => {
    return chatService.listChats(includeArchived)
  })

  ipcMain.handle('chat:get', (_event, id: string) => {
    return chatService.getChat(id)
  })

  ipcMain.handle('chat:create', (_event, input: { title?: string; model_id?: string; system_prompt_id?: string; project_id?: string }) => {
    return chatService.createChat(input)
  })

  ipcMain.handle('chat:update', (_event, id: string, updates: Record<string, unknown>) => {
    return chatService.updateChat(id, updates as Parameters<typeof chatService.updateChat>[1])
  })

  ipcMain.handle('chat:delete', (_event, id: string) => {
    return chatService.deleteChat(id)
  })

  ipcMain.handle('chat:archive', (_event, id: string) => {
    return chatService.archiveChat(id)
  })

  ipcMain.handle('chat:send', async (_event, input: { chatId: string }): Promise<ChatSendResult> => {
    return chatCompletionService.send(input)
  })

  ipcMain.handle('message:list', (_event, chatId: string) => {
    return chatService.getMessages(chatId)
  })

  ipcMain.handle('message:add', (_event, input: { chat_id: string; role: string; content: string; tool_calls?: string; tool_call_id?: string; token_count?: number }) => {
    return chatService.addMessage({
      chat_id: input.chat_id,
      role: input.role as 'system' | 'user' | 'assistant' | 'tool',
      content: input.content,
      tool_calls: input.tool_calls,
      tool_call_id: input.tool_call_id,
      token_count: input.token_count
    })
  })

  ipcMain.handle('message:update', (_event, id: string, content: string) => {
    return chatService.updateMessage(id, content)
  })

  ipcMain.handle('message:delete', (_event, id: string) => {
    return chatService.deleteMessage(id)
  })

  ipcMain.handle('message:clear', (_event, chatId: string) => {
    chatService.clearMessages(chatId)
    return true
  })

  logger.info('Chat IPC handlers registered')
}
