import { apiFetch } from '@/shared/api/client'
import type { ChatPeer } from '@/entities/peer/model/types'

export async function fetchPeers(token: string): Promise<ChatPeer[]> {
  const data = await apiFetch<ChatPeer[]>('/api/peers', { token })
  return Array.isArray(data) ? data : []
}
