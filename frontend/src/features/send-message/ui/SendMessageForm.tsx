import { type FormEvent, type KeyboardEvent, useRef, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { TextAreaField } from '@/shared/ui/text-field'
import { sendMessageRequest } from '@/entities/message'
import { ApiError } from '@/shared/api/errors'
import '@/features/send-message/ui/SendMessageForm.scss'

type SendMessageFormProps = {
  token: string
  peerUsername: string
  onSent?: () => void
}

export function SendMessageForm({ token, peerUsername, onSent }: SendMessageFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const disabled = !peerUsername.trim()

  function onContentKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault()
      const el = event.currentTarget
      const start = el.selectionStart ?? 0
      const end = el.selectionEnd ?? 0
      const tab = '\t'
      const next = content.slice(0, start) + tab + content.slice(end)
      setContent(next)
      const pos = start + tab.length
      window.setTimeout(() => {
        contentRef.current?.focus()
        contentRef.current?.setSelectionRange(pos, pos)
      }, 0)
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
      await sendMessageRequest(token, { toUser: peerUsername.trim(), content: content.trim() })
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
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onContentKeyDown}
            placeholder="Сообщение…"
            autoComplete="off"
            rows={1}
            required
          />
        </div>
        <Button type="submit" disabled={disabled || pending || !content.trim()}>
          {pending ? '…' : 'Отправить'}
        </Button>
      </div>
    </form>
  )
}
