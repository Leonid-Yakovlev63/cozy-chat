import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { useSession } from '@/entities/session'
import {
  blockUser,
  fetchUnverifiedUsers,
  verifyUser,
  type UnverifiedUser,
} from '@/entities/user'
import { ApiError } from '@/shared/api/errors'
import '@/pages/admin/users/ui/AdminUsersPage.scss'

function formatJoined(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' }).format(d)
}

export function AdminUsersPage() {
  const { token } = useSession()
  const [users, setUsers] = useState<UnverifiedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ username: string; type: 'verify' | 'block' } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) return
    setError(null)
    if (options?.silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const list = await fetchUnverifiedUsers(token)
      setUsers(list)
    } catch (e) {
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
    <section className="admin-users-page">
      <header className="admin-users-page__head">
        <div className="admin-users-page__head-row">
          <h1 className="admin-users-page__title">Ожидают подтверждения</h1>
          {!loading ? (
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
        <p className="admin-users-page__lead">
          Пользователи, зарегистрировавшиеся и ожидающие верификации администратором.
        </p>
      </header>

      {loading ? (
        <p className="admin-users-page__muted">Загрузка…</p>
      ) : (
        <>
          {error ? (
            <p className="admin-users-page__error" role="alert">
              {error}
            </p>
          ) : null}

          {users.length === 0 ? (
            <p className="admin-users-page__muted">Нет пользователей, ожидающих подтверждения.</p>
          ) : (
            <div className="admin-users-page__table-wrap">
              <table className="admin-users-page__table">
                <thead>
                  <tr>
                    <th scope="col">Пользователь</th>
                    <th scope="col">Дата регистрации</th>
                    <th scope="col" className="admin-users-page__col-action">
                      Действие
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="admin-users-page__cell-username">{user.username}</td>
                      <td className="admin-users-page__cell-date">
                        {user.createdAt ? formatJoined(user.createdAt) : '—'}
                      </td>
                      <td className="admin-users-page__cell-action">
                        <div className="admin-users-page__actions">
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
    </section>
  )
}
