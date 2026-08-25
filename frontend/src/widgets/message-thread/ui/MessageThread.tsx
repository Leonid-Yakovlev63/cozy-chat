import { useEffect, useRef } from 'react'
import { SendMessageForm } from '@/features/send-message'
import { Button } from '@/shared/ui/button'
import { parseMessageTextSegments } from '@/shared/lib/parseMessageTextSegments'
import { MessageRichText } from '@/shared/ui/message-rich-text/MessageRichText'
import type { ChatMessage } from '@/entities/message'
import '@/widgets/message-thread/ui/MessageThread.scss'

function isImageOnlyContent(content: string): boolean {
  const segments = parseMessageTextSegments(content)
  return segments.length === 1 && segments[0].type === 'image-link'
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(d)
}

type MessageBubbleProps = {
  message: ChatMessage
  selfUsername: string
}

function MessageBubble({ message, selfUsername }: MessageBubbleProps) {
  const outgoing = message.fromUser === selfUsername
  const imageOnly = isImageOnlyContent(message.content)
  const bubbleClass = [
    'message-bubble',
    outgoing ? 'message-bubble--outgoing' : 'message-bubble--incoming',
    imageOnly ? 'message-bubble--image-only' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const statusClass = [
    'message-bubble__status',
    message.isRead ? 'message-bubble__status--read' : 'message-bubble__status--unread',
  ].join(' ')

  return (
    <article className={bubbleClass}>
      <div className="message-bubble__meta">
        <span className="message-bubble__author">{message.fromUser}</span>
        <time className="message-bubble__time" dateTime={message.createdAt}>
          {formatTime(message.createdAt)}
        </time>
      </div>
      <MessageRichText content={message.content} className="message-bubble__text" />
      <span className={statusClass} role="status">
        {message.isRead ? 'Прочитано' : 'Не прочитано'}
      </span>
    </article>
  )
}

type MessageThreadProps = {
  token: string
  selfUsername: string
  peerUsername: string | null
  messages: ChatMessage[]
  loading: boolean
  loadingOlder?: boolean
  hasMoreHistory?: boolean
  error: string | null
  onLoadOlder?: () => void
  onRefreshQuiet: () => void
  onRefreshFull: () => void
  onPeerListInvalidated?: () => void
  /** Узкий экран: открыть выездной список чатов слева */
  onOpenPeerList?: () => void
  peerListDrawerOpen?: boolean
}

export function MessageThread({
  token,
  selfUsername,
  peerUsername,
  messages,
  loading,
  loadingOlder = false,
  hasMoreHistory = false,
  error,
  onLoadOlder,
  onRefreshQuiet,
  onRefreshFull,
  onPeerListInvalidated,
  onOpenPeerList,
  peerListDrawerOpen,
}: MessageThreadProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const pendingScrollHeightRef = useRef(0)
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  useEffect(() => {
    const el = bodyRef.current
    const pending = pendingScrollHeightRef.current
    if (!el || pending <= 0) return

    const delta = el.scrollHeight - pending
    if (delta > 0) {
      el.scrollTop += delta
    }
    pendingScrollHeightRef.current = 0
  }, [sorted.length])

  function handleLoadOlder() {
    const el = bodyRef.current
    if (el) {
      pendingScrollHeightRef.current = el.scrollHeight
    }
    onLoadOlder?.()
  }

  return (
    <section className="message-thread">
      <div className="message-thread__toolbar">
        <div className="message-thread__toolbar-start">
          {onOpenPeerList ? (
            <button
              type="button"
              className="message-thread__peer-list-toggle"
              aria-label="Открыть список чатов"
              aria-expanded={Boolean(peerListDrawerOpen)}
              aria-controls="chat-peer-drawer"
              onClick={onOpenPeerList}
            >
              <svg className="message-thread__peer-list-icon" viewBox="0 0 24 24" width={22} height={22} aria-hidden>
                <path fill="currentColor" d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="message-thread__toolbar-main">
          <p className="message-thread__peer">
            {peerUsername ? (
              <span className="message-thread__peer-line">
                <span className="message-thread__peer-label">Диалог с</span>
                <span className="message-thread__peer-name">{peerUsername}</span>
              </span>
            ) : (
              'Диалог не выбран'
            )}
          </p>
        </div>
        {peerUsername ? (
          <div className="message-thread__actions">
            <Button type="button" variant="ghost" onClick={onRefreshFull} disabled={loading}>
              {loading ? 'Обновление…' : 'Обновить'}
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="message-thread__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="message-thread__body" ref={bodyRef}>
        {!peerUsername ? (
          <p className="message-thread__empty">
            {onOpenPeerList
              ? 'Нажмите кнопку меню вверху слева, чтобы открыть список чатов и выбрать диалог.'
              : 'Выберите username слева и нажмите «Открыть чат», чтобы загрузить историю.'}
          </p>
        ) : loading && sorted.length === 0 ? (
          <p className="message-thread__loading">Загрузка…</p>
        ) : sorted.length === 0 ? (
          <p className="message-thread__empty">Пока нет сообщений. Напишите первое — оно появится здесь.</p>
        ) : (
          <>
            {hasMoreHistory ? (
              <div className="message-thread__history">
                <Button
                  type="button"
                  variant="ghost"
                  className="message-thread__history-btn"
                  disabled={loadingOlder}
                  onClick={handleLoadOlder}
                >
                  {loadingOlder ? 'Загрузка…' : 'Загрузить предыдущие сообщения'}
                </Button>
              </div>
            ) : null}
            {sorted.map((m, index) => (
              <MessageBubble
                key={m.id ? m.id : `${m.createdAt}-${m.fromUser}-${index}`}
                message={m}
                selfUsername={selfUsername}
              />
            ))}
          </>
        )}
      </div>

      {peerUsername ? (
        <div className="message-thread__composer">
          <SendMessageForm
            token={token}
            peerUsername={peerUsername}
            onSent={() => {
              onRefreshQuiet()
              onPeerListInvalidated?.()
            }}
          />
        </div>
      ) : null}
    </section>
  )
}
