import { NavLink } from 'react-router-dom'
import { LogoutControl } from '@/features/logout'
import { ThemeSwitch } from '@/features/theme-switch'
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
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            ['app-header__nav-link', isActive ? 'app-header__nav-link--active' : ''].filter(Boolean).join(' ')
          }
        >
          Профиль
        </NavLink>
        <ThemeSwitch />
        <div className="app-header__user">
          <span className="app-header__user-label">Вы вошли как</span>
          <span className="app-header__user-name">{username ?? '…'}</span>
        </div>
        <LogoutControl />
      </div>
    </header>
  )
}
