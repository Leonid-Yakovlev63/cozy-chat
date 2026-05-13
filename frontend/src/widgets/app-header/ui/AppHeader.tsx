import { LogoutControl } from '@/features/logout'
import '@/widgets/app-header/ui/AppHeader.scss'

type AppHeaderProps = {
  username: string | null
}

export function AppHeader({ username }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <h1 className="app-header__title">Cozy Chat</h1>
      </div>
      <div className="app-header__actions">
        <div className="app-header__user">
          <span className="app-header__user-label">Вы вошли как</span>
          <span className="app-header__user-name">{username ?? '…'}</span>
        </div>
        <LogoutControl />
      </div>
    </header>
  )
}
