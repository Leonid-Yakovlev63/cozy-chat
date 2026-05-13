export type { ChatMessage } from '@/entities/message/model/types'
export { normalizeChatMessages } from '@/entities/message/lib/normalizeChatMessages'
export { fetchMessagesWithUser, sendMessageRequest } from '@/entities/message/api/messageApi'
