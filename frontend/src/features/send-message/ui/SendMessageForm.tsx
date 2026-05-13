import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from 'react'
import { Button } from '@/shared/ui/button'
import { TextAreaField } from '@/shared/ui/text-field'
import { sendMessageRequest } from '@/entities/message'
import { ApiError } from '@/shared/api/errors'
import { isSingleEmojiMessage } from '@/shared/lib/isSingleEmojiMessage'
import { EmojiMenu } from '@/features/send-message/ui/EmojiMenu'
import '@/features/send-message/ui/SendMessageForm.scss'

const LAST_SENT_EMOJI_KEY = 'cozyChat:lastSentEmoji'

function readLastSentEmojiFromStorage(): string {
  if (typeof window === 'undefined') return '🙂'
  try {
    const v = window.localStorage.getItem(LAST_SENT_EMOJI_KEY)
    if (v && isSingleEmojiMessage(v)) return v
    return '🙂'
  } catch {
    return '🙂'
  }
}

type SendMessageFormProps = {
  token: string
  peerUsername: string
  onSent?: () => void
}

export function SendMessageForm({ token, peerUsername, onSent }: SendMessageFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const selectionRef = useRef({ start: 0, end: 0 })
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [lastSentEmoji, setLastSentEmoji] = useState(readLastSentEmojiFromStorage)

  const disabled = !peerUsername.trim()

  const rememberSelection = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    selectionRef.current = {
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    }
  }, [])

  const insertAtSelection = useCallback((insert: string) => {
    const el = contentRef.current
    let { start, end } = selectionRef.current
    if (el && document.activeElement === el) {
      start = el.selectionStart ?? start
      end = el.selectionEnd ?? end
    }
    const pos = start + insert.length
    setContent((prev) => prev.slice(0, start) + insert + prev.slice(end))
    selectionRef.current = { start: pos, end: pos }
    window.setTimeout(() => {
      el?.focus()
      el?.setSelectionRange(pos, pos)
    }, 0)
  }, [])

  function onContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value)
    queueMicrotask(() => rememberSelection())
  }

  function onContentKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault()
      insertAtSelection('\t')
      return
    }

    if (event.key !== 'Enter') return
    if (event.shiftKey) return
    if (event.nativeEvent.isComposing) return
    event.preventDefault()
    if (disabled || pending || !content.trim()) return
    formRef.current?.requestSubmit()
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (disabled) return
    setError(null)
    setPending(true)
    try {
      const trimmed = content.trim()
      await sendMessageRequest(token, { toUser: peerUsername.trim(), content: trimmed })
      if (isSingleEmojiMessage(trimmed)) {
        setLastSentEmoji(trimmed)
        try {
          window.localStorage.setItem(LAST_SENT_EMOJI_KEY, trimmed)
        } catch {
          /* quota / private mode */
        }
      }
      setContent('')
      onSent?.()
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Сообщение не отправлено.'
      setError(message)
    } finally {
      setPending(false)
    }
  }

  const rootClass = ['send-message-form', disabled ? 'send-message-form--disabled' : ''].filter(Boolean).join(' ')

  return (
    <form ref={formRef} className={rootClass} onSubmit={onSubmit}>
      {error ? (
        <p className="send-message-form__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="send-message-form__row">
        <div className="send-message-form__field">
          <TextAreaField
            ref={contentRef}
            className="send-message-form__text-field"
            name="content"
            label="Сообщение"
            labelSrOnly
            value={content}
            onChange={onContentChange}
            onSelect={rememberSelection}
            onMouseUp={rememberSelection}
            onKeyUp={rememberSelection}
            onKeyDown={onContentKeyDown}
            placeholder="Сообщение…"
            autoComplete="off"
            rows={1}
            required
          />
        </div>
        <div className="send-message-form__actions">
          <EmojiMenu triggerEmoji={lastSentEmoji} onPick={insertAtSelection} disabled={disabled || pending} />
          <Button type="submit" disabled={disabled || pending || !content.trim()}>
            {pending ? '…' : 'Отправить'}
          </Button>
        </div>
      </div>
    </form>
  )
}
