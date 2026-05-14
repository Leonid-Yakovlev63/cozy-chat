import type { ReactNode } from 'react'
import '@/widgets/chat-layout/ui/ChatLayout.scss'

type ChatLayoutProps = {
  sidebar: ReactNode
  main: ReactNode
  /** Узкий экран: выезд списка чатов слева */
  mobileDrawer?: boolean
  mobileDrawerOpen?: boolean
  onMobileDrawerClose?: () => void
}

export function ChatLayout({
  sidebar,
  main,
  mobileDrawer = false,
  mobileDrawerOpen = false,
  onMobileDrawerClose,
}: ChatLayoutProps) {
  return (
    <div
      className={[
        'chat-layout',
        mobileDrawer ? 'chat-layout--mobile-drawer' : '',
        mobileDrawer && mobileDrawerOpen ? 'chat-layout--mobile-drawer-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {mobileDrawer && onMobileDrawerClose ? (
        <button
          type="button"
          className="chat-layout__drawer-scrim"
          aria-label="Закрыть список чатов"
          tabIndex={mobileDrawerOpen ? 0 : -1}
          onClick={onMobileDrawerClose}
        />
      ) : null}
      <div id="chat-peer-drawer" className="chat-layout__sidebar">{sidebar}</div>
      <div className="chat-layout__main">{main}</div>
    </div>
  )
}
