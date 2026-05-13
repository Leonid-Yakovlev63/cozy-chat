import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { fetchPeers, type ChatPeer } from '@/entities/peer'
import { ApiError } from '@/shared/api/errors'
import '@/widgets/peer-panel/ui/PeerPanel.scss'

function formatPeerTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const dateFmt: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
  }
  if (d.getFullYear() !== now.getFullYear()) {
    dateFmt.year = 'numeric'
  }
  let datePart = new Intl.DateTimeFormat('ru-RU', dateFmt).format(d)
  datePart = datePart.replace(/\s*г\.?\s*$/i, '').trim()
  const timePart = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(d)
  return `${datePart} ${timePart}`.replace(/\s+/g, ' ').trim()
}

function peerInitial(username: string): string {
  const t = username.trim()
  if (!t) return '?'
  return t.slice(0, 1).toUpperCase()
}

type PeerPanelProps = {
  token: string
  selfUsername: string | null
  activePeer: string | null
  onOpenPeer: (username: string) => void
  peerListVersion?: number
  onManualPeerOpened?: () => void
}

export function PeerPanel({
  token,
  selfUsername,
  activePeer,
  onOpenPeer,
  peerListVersion = 0,
  onManualPeerOpened,
}: PeerPanelProps) {
  const [peers, setPeers] = useState<ChatPeer[]>([])
  const [listBusy, setListBusy] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const loadPeers = useCallback(async () => {
    setListError(null)
    setListBusy(true)
    try {
      const data = await fetchPeers(token)
      const self = selfUsername?.trim().toLowerCase() ?? ''
      const filtered = self ? data.filter((p) => p.username.trim().toLowerCase() !== self) : data
      setPeers(filtered)
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Не удалось загрузить список чатов.'
      setListError(message)
      setPeers([])
    } finally {
      setListBusy(false)
    }
  }, [token, selfUsername])

  useEffect(() => {
    void loadPeers()
  }, [loadPeers, peerListVersion])

  function onSubmitManual(event: FormEvent) {
    event.preventDefault()
    const next = draft.trim()
    if (!next) {
      setLocalError('Введите имя пользователя')
      return
    }
    setLocalError(null)
    onOpenPeer(next)
    onManualPeerOpened?.()
  }

  return (
    <aside className="peer-panel">
      <div className="peer-panel__header">
        <h2 className="peer-panel__title">Чаты</h2>
        <Button type="button" variant="ghost" className="peer-panel__refresh" onClick={() => void loadPeers()} disabled={listBusy}>
          Обновить
        </Button>
      </div>

      <div className="peer-panel__list-wrap">
        {listBusy && peers.length === 0 ? (
          <p className="peer-panel__hint">Загрузка…</p>
        ) : listError ? (
          <div className="peer-panel__error-box">
            <p className="peer-panel__error">{listError}</p>
            <Button type="button" variant="ghost" onClick={() => void loadPeers()}>
              Повторить
            </Button>
          </div>
        ) : peers.length === 0 ? (
          <p className="peer-panel__hint">Пока нет диалогов. Напишите пользователю по username ниже.</p>
        ) : (
          <ul className="peer-list" role="list">
            {peers.map((p) => {
              const active = activePeer !== null && p.username === activePeer
              const rowClass = ['peer-list__row', active ? 'peer-list__row--active' : ''].filter(Boolean).join(' ')
              return (
                <li className="peer-list__item" key={p.username}>
                  <button type="button" className={rowClass} onClick={() => onOpenPeer(p.username)}>
                    <span className="peer-list__avatar" aria-hidden>
                      {peerInitial(p.username)}
                    </span>
                    <span className="peer-list__body">
                      <span className="peer-list__top">
                        <span className="peer-list__name">{p.username}</span>
                        <time className="peer-list__time" dateTime={p.lastMessageAt}>
                          {formatPeerTime(p.lastMessageAt)}
                        </time>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="peer-panel__manual">
        <p className="peer-panel__manual-title">Новый контакт</p>
        <form className="peer-panel__form" onSubmit={onSubmitManual}>
          <TextField
            name="peer"
            label="Username"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="логин пользователя"
            autoComplete="off"
          />
          {localError ? (
            <p className="peer-panel__error" role="alert">
              {localError}
            </p>
          ) : null}
          <div className="peer-panel__actions">
            <Button type="submit" fullWidth>
              Открыть чат
            </Button>
          </div>
        </form>
      </div>
    </aside>
  )
}
