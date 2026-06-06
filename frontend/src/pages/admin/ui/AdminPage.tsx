import { useCallback, useEffect, useState } from 'react'
import { AppHeader } from '@/widgets/app-header'
import { Button } from '@/shared/ui/button'
import { useSession } from '@/entities/session'
import {
  blockUser,
  fetchMyProfile,
  fetchUnverifiedUsers,
  verifyUser,
  type UnverifiedUser,
} from '@/entities/user'
import { ApiError } from '@/shared/api/errors'
import '@/pages/admin/ui/AdminPage.scss'

function formatJoined(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' }).format(d)
}

export function AdminPage() {
  const { token, username } = useSession()
  const [users, setUsers] = useState<UnverifiedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ username: string; type: 'verify' | 'block' } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) return
    setError(null)
    if (options?.silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const profile = await fetchMyProfile(token)
      if (profile.role !== 'admin') {
        setAccessDenied(true)
        setUsers([])
        return
      }
      setAccessDenied(false)
      const list = await fetchUnverifiedUsers(token)
      setUsers(list)
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setAccessDenied(true)
        setUsers([])
        return
      }
      const msg = e instanceof ApiError ? e.message : 'Не удалось загрузить список пользователей.'
      setError(msg)
      setUsers([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  async function handleVerify(targetUsername: string) {
    if (!token || pendingAction) return
    setError(null)
    setPendingAction({ username: targetUsername, type: 'verify' })
    try {
      await verifyUser(token, targetUsername)
      await load({ silent: true })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось подтвердить пользователя.'
      setError(msg)
    } finally {
      setPendingAction(null)
    }
  }

  async function handleBlock(targetUsername: string) {
    if (!token || pendingAction) return
    setError(null)
    setPendingAction({ username: targetUsername, type: 'block' })
    try {
      await blockUser(token, targetUsername)
      await load({ silent: true })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось заблокировать пользователя.'
      setError(msg)
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="admin-page">
      <AppHeader username={username} />
      <main className="admin-page__main">
        <header className="admin-page__head">
          <div className="admin-page__head-row">
            <p className="admin-page__eyebrow">Администрирование</p>
            {!loading && !accessDenied ? (
              <Button
                type="button"
                variant="ghost"
                disabled={refreshing || pendingAction !== null}
                onClick={() => void load({ silent: true })}
              >
                {refreshing ? 'Обновление…' : 'Обновить'}
              </Button>
            ) : null}
          </div>
          <h1 className="admin-page__title">Ожидают подтверждения</h1>
          <p className="admin-page__lead">
            Пользователи, зарегистрировавшиеся и ожидающие верификации администратором.
          </p>
        </header>

        {loading ? (
          <p className="admin-page__muted">Загрузка…</p>
        ) : accessDenied ? (
          <p className="admin-page__error admin-page__error--block" role="alert">
            Доступ только для администраторов.
          </p>
        ) : (
          <>
            {error ? (
              <p className="admin-page__error" role="alert">
                {error}
              </p>
            ) : null}

            {users.length === 0 ? (
              <p className="admin-page__muted">Нет пользователей, ожидающих подтверждения.</p>
            ) : (
              <div className="admin-page__table-wrap">
                <table className="admin-page__table">
                  <thead>
                    <tr>
                      <th scope="col">Пользователь</th>
                      <th scope="col">Дата регистрации</th>
                      <th scope="col" className="admin-page__col-action">
                        Действие
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="admin-page__cell-username">{user.username}</td>
                        <td className="admin-page__cell-date">
                          {user.createdAt ? formatJoined(user.createdAt) : '—'}
                        </td>
                        <td className="admin-page__cell-action">
                          <div className="admin-page__actions">
                            <Button
                              type="button"
                              disabled={pendingAction !== null}
                              onClick={() => void handleVerify(user.username)}
                            >
                              {pendingAction?.username === user.username && pendingAction.type === 'verify'
                                ? 'Подтверждение…'
                                : 'Подтвердить'}
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              disabled={pendingAction !== null}
                              onClick={() => void handleBlock(user.username)}
                            >
                              {pendingAction?.username === user.username && pendingAction.type === 'block'
                                ? 'Блокировка…'
                                : 'Заблокировать'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
