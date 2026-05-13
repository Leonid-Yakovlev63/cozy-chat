import { SendMessageForm } from '@/features/send-message'
import { Button } from '@/shared/ui/button'
import type { ChatMessage } from '@/entities/message'
import '@/widgets/message-thread/ui/MessageThread.scss'

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
  const bubbleClass = ['message-bubble', outgoing ? 'message-bubble--outgoing' : 'message-bubble--incoming'].join(' ')
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
      <p className="message-bubble__text">{message.content}</p>
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
  error: string | null
  onRefreshQuiet: () => void
  onRefreshFull: () => void
  onPeerListInvalidated?: () => void
}

export function MessageThread({
  token,
  selfUsername,
  peerUsername,
  messages,
  loading,
  error,
  onRefreshQuiet,
  onRefreshFull,
  onPeerListInvalidated,
}: MessageThreadProps) {
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return (
    <section className="message-thread">
      <div className="message-thread__toolbar">
        <div className="message-thread__toolbar-main">
          <p className="message-thread__peer">{peerUsername ? `Диалог с ${peerUsername}` : 'Диалог не выбран'}</p>
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

      <div className="message-thread__body">
        {!peerUsername ? (
          <p className="message-thread__empty">Выберите username слева и нажмите «Открыть чат», чтобы загрузить историю.</p>
        ) : loading ? (
          <p className="message-thread__loading">Загрузка…</p>
        ) : sorted.length === 0 ? (
          <p className="message-thread__empty">Пока нет сообщений. Напишите первое — оно появится здесь.</p>
        ) : (
          sorted.map((m, index) => (
            <MessageBubble
              key={m.id ? m.id : `${m.createdAt}-${m.fromUser}-${index}`}
              message={m}
              selfUsername={selfUsername}
            />
          ))
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
