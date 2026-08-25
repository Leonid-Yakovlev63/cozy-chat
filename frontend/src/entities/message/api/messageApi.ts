import { apiFetch } from '@/shared/api/client'
import type { ChatMessage } from '@/entities/message/model/types'
import { normalizeChatMessages } from '@/entities/message/lib/normalizeChatMessages'

export const MESSAGES_PAGE_SIZE = 100

export type FetchMessagesOptions = {
  limit?: number
  offset?: number
}

export async function fetchMessagesWithUser(
  token: string,
  peerUsername: string,
  options: FetchMessagesOptions = {},
): Promise<ChatMessage[]> {
  const encoded = encodeURIComponent(peerUsername)
  const params = new URLSearchParams()
  params.set('limit', String(options.limit ?? MESSAGES_PAGE_SIZE))
  params.set('offset', String(options.offset ?? 0))
  const raw = await apiFetch<unknown>(`/api/messages/${encoded}?${params.toString()}`, { token })
  return normalizeChatMessages(raw)
}

export type SendMessagePayload = {
  toUser: string
  content: string
}

export async function sendMessageRequest(
  token: string,
  payload: SendMessagePayload,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/messages', {
    method: 'POST',
    body: payload,
    token,
  })
}
