import type { ChatMessage } from '@/entities/message/model/types'

/** Объединяет сообщения по id; при совпадении приоритет у incoming (актуальный isRead и т.д.). */
export function mergeChatMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>()
  for (const message of existing) {
    map.set(message.id, message)
  }
  for (const message of incoming) {
    map.set(message.id, message)
  }
  return [...map.values()]
}
