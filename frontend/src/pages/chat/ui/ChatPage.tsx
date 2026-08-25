import { Navigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { AppHeader } from '@/widgets/app-header'
import { ChatLayout } from '@/widgets/chat-layout'
import { MessageThread } from '@/widgets/message-thread'
import { PeerPanel } from '@/widgets/peer-panel'
import {
  fetchMessagesWithUser,
  mergeChatMessages,
  MESSAGES_PAGE_SIZE,
  type ChatMessage,
} from '@/entities/message'
import { useSession } from '@/entities/session'
import { ApiError } from '@/shared/api/errors'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import '@/pages/chat/ui/ChatPage.scss'

const MOBILE_CHAT_LAYOUT = '(max-width: 960px)'

/** REST без push: опрос, чтобы у получателя появлялись новые сообщения без перезагрузки страницы. */
const MESSAGES_POLL_INTERVAL_MS = 8_000

function formatChatLoadError(raw: string): string {
  const n = raw.trim().toLowerCase()
  if (
    (n.includes('yourself') || n.includes('с собой')) &&
    (n.includes('cannot') || n.includes("can't") || n.includes('read') || n.includes('message'))
  ) {
    return 'Нельзя открыть чат с собой — выберите другого пользователя.'
  }
  return raw
}

export function ChatPage() {
  const { token, username } = useSession()
  const isMobileChatLayout = useMediaQuery(MOBILE_CHAT_LAYOUT)
  const [mobilePeerDrawerOpen, setMobilePeerDrawerOpen] = useState(false)
  const [peer, setPeer] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [historyOffset, setHistoryOffset] = useState(0)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [peerListVersion, setPeerListVersion] = useState(0)
  const invalidatePeerList = useCallback(() => {
    setPeerListVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    if (!isMobileChatLayout) setMobilePeerDrawerOpen(false)
  }, [isMobileChatLayout])

  useEffect(() => {
    if (!mobilePeerDrawerOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobilePeerDrawerOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobilePeerDrawerOpen])

  const openPeer = useCallback((next: string) => {
    setPeer(next)
    setMobilePeerDrawerOpen(false)
  }, [])

  const applyInitialPage = useCallback((data: ChatMessage[]) => {
    setMessages(data)
    setHistoryOffset(data.length)
    setHasMoreHistory(data.length >= MESSAGES_PAGE_SIZE)
  }, [])

  const loadInitialMessages = useCallback(async () => {
    if (!token || !peer) {
      setMessages([])
      setHistoryOffset(0)
      setHasMoreHistory(false)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchMessagesWithUser(token, peer, { limit: MESSAGES_PAGE_SIZE, offset: 0 })
      applyInitialPage(data)
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Не удалось загрузить сообщения.'
      setError(formatChatLoadError(message))
      setMessages([])
      setHistoryOffset(0)
      setHasMoreHistory(false)
    } finally {
      setLoading(false)
    }
  }, [applyInitialPage, peer, token])

  const refreshLatestMessages = useCallback(async () => {
    if (!token || !peer) return

    try {
      const latest = await fetchMessagesWithUser(token, peer, { limit: MESSAGES_PAGE_SIZE, offset: 0 })
      setMessages((prev) => mergeChatMessages(prev, latest))
    } catch {
      /* тихий опрос / после отправки */
    }
  }, [peer, token])

  const loadOlderMessages = useCallback(async () => {
    if (!token || !peer || !hasMoreHistory || loadingOlder) return

    setLoadingOlder(true)
    setError(null)
    try {
      const older = await fetchMessagesWithUser(token, peer, {
        limit: MESSAGES_PAGE_SIZE,
        offset: historyOffset,
      })
      setMessages((prev) => mergeChatMessages(prev, older))
      setHistoryOffset((prev) => prev + older.length)
      setHasMoreHistory(older.length >= MESSAGES_PAGE_SIZE)
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Не удалось загрузить предыдущие сообщения.'
      setError(formatChatLoadError(message))
    } finally {
      setLoadingOlder(false)
    }
  }, [hasMoreHistory, historyOffset, loadingOlder, peer, token])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      await loadInitialMessages()
    })()

    return () => {
      cancelled = true
    }
  }, [loadInitialMessages])

  useEffect(() => {
    if (!peer || !token) return

    const id = window.setInterval(() => {
      void refreshLatestMessages()
    }, MESSAGES_POLL_INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [peer, token, refreshLatestMessages])

  useEffect(() => {
    if (!peer || !token) return

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        void refreshLatestMessages()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [peer, token, refreshLatestMessages])

  if (!token) return <Navigate to="/login" replace />

  const self = username ?? ''

  return (
    <div className="chat-page">
      <AppHeader username={username} />
      <div className="chat-page__workspace">
        <ChatLayout
          mobileDrawer={isMobileChatLayout}
          mobileDrawerOpen={mobilePeerDrawerOpen}
          onMobileDrawerClose={() => setMobilePeerDrawerOpen(false)}
          sidebar={
            <PeerPanel
              token={token}
              selfUsername={username}
              activePeer={peer}
              onOpenPeer={openPeer}
              peerListVersion={peerListVersion}
              onManualPeerOpened={invalidatePeerList}
              onRequestClose={isMobileChatLayout ? () => setMobilePeerDrawerOpen(false) : undefined}
            />
          }
          main={
            <MessageThread
              token={token}
              selfUsername={self}
              peerUsername={peer}
              messages={messages}
              loading={loading}
              loadingOlder={loadingOlder}
              hasMoreHistory={hasMoreHistory}
              error={error}
              onLoadOlder={() => void loadOlderMessages()}
              onRefreshQuiet={() => void refreshLatestMessages()}
              onRefreshFull={() => void refreshLatestMessages()}
              onPeerListInvalidated={invalidatePeerList}
              onOpenPeerList={isMobileChatLayout ? () => setMobilePeerDrawerOpen(true) : undefined}
              peerListDrawerOpen={isMobileChatLayout ? mobilePeerDrawerOpen : undefined}
            />
          }
        />
      </div>
    </div>
  )
}
