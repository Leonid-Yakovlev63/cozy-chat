export type { ChatMessage } from '@/entities/message/model/types'
export { normalizeChatMessages } from '@/entities/message/lib/normalizeChatMessages'
export { mergeChatMessages } from '@/entities/message/lib/mergeChatMessages'
export { fetchMessagesWithUser, sendMessageRequest, MESSAGES_PAGE_SIZE, type SendMessagePayload } from '@/entities/message/api/messageApi'
