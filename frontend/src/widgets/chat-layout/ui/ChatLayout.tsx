import type { ReactNode } from 'react'
import '@/widgets/chat-layout/ui/ChatLayout.scss'

type ChatLayoutProps = {
  sidebar: ReactNode
  main: ReactNode
}

export function ChatLayout({ sidebar, main }: ChatLayoutProps) {
  return (
    <div className="chat-layout">
      <div className="chat-layout__sidebar">{sidebar}</div>
      <div className="chat-layout__main">{main}</div>
    </div>
  )
}
