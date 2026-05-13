import type { ChatMessage } from '@/entities/message/model/types'

function coerceToArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (typeof payload === 'string') {
    const t = payload.trim()
    if (!t) return []
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(t)
        if (Array.isArray(parsed)) return parsed
      } catch {
        /* не JSON */
      }
    }
  }
  return []
}

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Оставляет только сообщения с непустым текстом и участниками.
 * Отсекает «пустые» документы/объекты, которые иначе дают пузыри только с бейджем «не прочитано».
 */
export function normalizeChatMessages(payload: unknown): ChatMessage[] {
  const list = coerceToArray(payload)
  const seen = new Set<string>()
  const out: ChatMessage[] = []

  for (const item of list) {
    const message = coerceChatMessage(item)
    if (!message) continue
    if (seen.has(message.id)) continue
    seen.add(message.id)
    out.push(message)
  }

  return out
}

function coerceChatMessage(item: unknown): ChatMessage | null {
  if (!item || typeof item !== 'object') return null
  const o = item as Record<string, unknown>

  const id = toTrimmedString(o.id)
  const fromUser = toTrimmedString(o.fromUser)
  const toUser = toTrimmedString(o.toUser)
  const content = toTrimmedString(o.content)

  if (!fromUser || !toUser || !content) return null
  if (!id) return null

  const createdRaw = o.createdAt
  const createdAt =
    typeof createdRaw === 'string' && createdRaw.trim()
      ? createdRaw.trim()
      : typeof createdRaw === 'number'
        ? new Date(createdRaw).toISOString()
        : new Date(0).toISOString()

  return {
    id,
    fromUser,
    toUser,
    content,
    createdAt,
    isRead: Boolean(o.isRead),
    isEdited: Boolean(o.isEdited),
  }
}
