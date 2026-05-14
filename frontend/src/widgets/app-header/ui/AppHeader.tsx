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
        <div className="app-header__actions-start">
          <ThemeSwitch />
        </div>
        <div className="app-header__actions-end">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              ['app-header__profile-link', isActive ? 'app-header__profile-link--active' : ''].filter(Boolean).join(' ')
            }
          >
            <span className="app-header__profile-name">{username ?? '…'}</span>
          </NavLink>
          <LogoutControl />
        </div>
      </div>
    </header>
  )
}
