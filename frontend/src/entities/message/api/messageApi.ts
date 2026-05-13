import { apiFetch } from '@/shared/api/client'
import type { ChatMessage } from '@/entities/message/model/types'
import { normalizeChatMessages } from '@/entities/message/lib/normalizeChatMessages'

export async function fetchMessagesWithUser(token: string, peerUsername: string): Promise<ChatMessage[]> {
  const encoded = encodeURIComponent(peerUsername)
  const raw = await apiFetch<unknown>(`/api/messages/${encoded}`, { token })
  return normalizeChatMessages(raw)
}

export async function sendMessageRequest(
  token: string,
  payload: { toUser: string; content: string },
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/messages', {
    method: 'POST',
    body: payload,
    token,
  })
}
