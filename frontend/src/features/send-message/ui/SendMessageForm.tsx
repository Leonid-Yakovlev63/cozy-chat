import { type FormEvent, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { sendMessageRequest } from '@/entities/message'
import { ApiError } from '@/shared/api/errors'
import '@/features/send-message/ui/SendMessageForm.scss'

type SendMessageFormProps = {
  token: string
  peerUsername: string
  onSent?: () => void
}

export function SendMessageForm({ token, peerUsername, onSent }: SendMessageFormProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const disabled = !peerUsername.trim()

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
    <form className={rootClass} onSubmit={onSubmit}>
      {error ? (
        <p className="send-message-form__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="send-message-form__row">
        <div className="send-message-form__field">
          <TextField
            name="content"
            label="Сообщение"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Напишите сообщение…"
            autoComplete="off"
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
