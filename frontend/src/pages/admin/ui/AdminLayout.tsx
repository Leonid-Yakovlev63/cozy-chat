import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { AppHeader } from '@/widgets/app-header'
import { useSession } from '@/entities/session'
import { fetchMyProfile } from '@/entities/user'
import '@/pages/admin/ui/AdminLayout.scss'

export function AdminLayout() {
  const { token, username } = useSession()
  const [accessDenied, setAccessDenied] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!token) {
      setAccessDenied(true)
      setChecking(false)
      return
    }
    let cancelled = false
    fetchMyProfile(token)
      .then((profile) => {
        if (!cancelled) {
          setAccessDenied(profile.role !== 'admin')
          setChecking(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccessDenied(true)
          setChecking(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="admin-shell">
      <AppHeader username={username} />
      <div className="admin-shell__body">
        <nav className="admin-sidebar" aria-label="Разделы администрирования">
          <p className="admin-sidebar__eyebrow">Администрирование</p>
          <ul className="admin-sidebar__list">
            <li>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  ['admin-sidebar__link', isActive ? 'admin-sidebar__link--active' : ''].filter(Boolean).join(' ')
                }
              >
                Ожидают подтверждения
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/news"
                className={({ isActive }) =>
                  ['admin-sidebar__link', isActive ? 'admin-sidebar__link--active' : ''].filter(Boolean).join(' ')
                }
              >
                Новости
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="admin-shell__content">
          {checking ? (
            <p className="admin-shell__muted">Загрузка…</p>
          ) : accessDenied ? (
            <p className="admin-shell__error" role="alert">
              Доступ только для администраторов.
            </p>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  )
}
