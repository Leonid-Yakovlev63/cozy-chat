import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogoutControl } from '@/features/logout'
import { ThemeSwitch } from '@/features/theme-switch'
import { useSession } from '@/entities/session'
import { fetchMyProfile } from '@/entities/user'
import '@/widgets/app-header/ui/AppHeader.scss'

type AppHeaderProps = {
  username: string | null
}

export function AppHeader({ username }: AppHeaderProps) {
  const { token } = useSession()
  const { pathname } = useLocation()
  const [isAdmin, setIsAdmin] = useState(false)
  const onAdminPage = pathname === '/admin'

  useEffect(() => {
    if (!token) {
      setIsAdmin(false)
      return
    }
    let cancelled = false
    fetchMyProfile(token)
      .then((profile) => {
        if (!cancelled) setIsAdmin(profile.role === 'admin')
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

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
          {onAdminPage ? (
            <NavLink to="/" className="app-header__profile-link">
              Чат
            </NavLink>
          ) : null}
          {isAdmin ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                ['app-header__profile-link', isActive ? 'app-header__profile-link--active' : ''].filter(Boolean).join(' ')
              }
            >
              Модерация
            </NavLink>
          ) : null}
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
