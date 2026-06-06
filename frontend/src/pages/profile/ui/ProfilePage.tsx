import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { AppHeader } from '@/widgets/app-header'
import { Button } from '@/shared/ui/button'
import { TextAreaField } from '@/shared/ui/text-field'
import { useSession } from '@/entities/session'
import { deleteMyStatus, fetchMyProfile, updateMyStatus, type CurrentUser } from '@/entities/user'
import { ApiError } from '@/shared/api/errors'
import '@/pages/profile/ui/ProfilePage.scss'

const STATUS_MAX = 500

function PencilIcon() {
  return (
    <svg className="profile-page__pencil-icon" viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
      />
    </svg>
  )
}

function avatarLetter(username: string): string {
  const t = username.trim()
  if (!t) return '?'
  const ch = t.codePointAt(0)
  if (ch === undefined) return '?'
  return String.fromCodePoint(ch).toUpperCase()
}

function formatJoined(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(d)
}

export function ProfilePage() {
  const { token, username } = useSession()
  const [profile, setProfile] = useState<CurrentUser | null>(null)
  const [statusDraft, setStatusDraft] = useState('')
  const [editingStatus, setEditingStatus] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedHint, setSavedHint] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const u = await fetchMyProfile(token)
      setProfile(u)
      setStatusDraft(u.status)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось загрузить профиль.'
      setError(msg)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  function startEditStatus() {
    if (!profile) return
    setEditingStatus(true)
    setStatusDraft(profile.status)
    setError(null)
    setSavedHint(false)
  }

  function cancelEditStatus() {
    if (!profile) return
    setEditingStatus(false)
    setStatusDraft(profile.status)
    setError(null)
  }

  async function removeStatus() {
    if (!token || !profile || saving || deleting) return
    setError(null)
    setSavedHint(false)
    setDeleting(true)
    try {
      await deleteMyStatus(token)
      setSavedHint(true)
      window.setTimeout(() => setSavedHint(false), 3500)
      setEditingStatus(false)
      await load()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось удалить статус.'
      setError(msg)
    } finally {
      setDeleting(false)
    }
  }

  async function saveStatus(event: FormEvent) {
    event.preventDefault()
    if (!token || !profile || saving || deleting) return
    setError(null)
    setSavedHint(false)
    const trimmed = statusDraft.trim()
    if (trimmed.length < 1 || trimmed.length > STATUS_MAX) {
      setError(`Статус: от 1 до ${STATUS_MAX} символов.`)
      return
    }
    setSaving(true)
    try {
      await updateMyStatus(token, trimmed)
      setSavedHint(true)
      window.setTimeout(() => setSavedHint(false), 3500)
      setEditingStatus(false)
      await load()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось сохранить статус.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const name = profile?.username ?? username ?? ''
  const displayStatus = profile?.status?.trim() ? profile.status : ''

  return (
    <div className="profile-page">
      <AppHeader username={username} />
      <main className="profile-page__main">
        <div className="profile-page__shell">
          <article className="profile-page__card">
            {loading ? (
              <p className="profile-page__lead profile-page__lead--muted">Загрузка…</p>
            ) : profile ? (
              <>
                <div className="profile-page__card-head">
                  <p className="profile-page__eyebrow">Личная страница</p>
                </div>

                <header className="profile-page__hero">
                  <div className="profile-page__avatar" aria-hidden>
                    {avatarLetter(name)}
                  </div>
                  <h1 className="profile-page__name">{name}</h1>
                  {profile.createdAt ? (
                    <p className="profile-page__joined">В Cozy Chat с {formatJoined(profile.createdAt)}</p>
                  ) : null}
                </header>

                <section className="profile-page__section" aria-labelledby="profile-about-heading">
                  <div className="profile-page__section-head">
                    <h2 id="profile-about-heading" className="profile-page__section-title">
                      О себе
                    </h2>
                    {!editingStatus ? (
                      <button
                        type="button"
                        className="profile-page__edit-trigger"
                        aria-label="Редактировать статус"
                        onClick={startEditStatus}
                      >
                        <PencilIcon />
                      </button>
                    ) : null}
                  </div>

                  {editingStatus ? (
                    <form className="profile-page__edit-form" onSubmit={saveStatus}>
                      <TextAreaField
                        name="status"
                        label="Текст статуса"
                        value={statusDraft}
                        onChange={(e) => setStatusDraft(e.target.value)}
                        maxLength={STATUS_MAX}
                        rows={5}
                        hint={`До ${STATUS_MAX} символов.`}
                      />
                      {error ? (
                        <p className="profile-page__error" role="alert">
                          {error}
                        </p>
                      ) : null}
                      <div className="profile-page__edit-actions">
                        <Button
                          type="button"
                          variant="danger"
                          disabled={saving || deleting}
                          onClick={() => void removeStatus()}
                        >
                          {deleting ? 'Удаление…' : 'Удалить'}
                        </Button>
                        <span className="profile-page__edit-actions-gap" aria-hidden />
                        <Button type="submit" disabled={saving || deleting}>
                          {saving ? 'Сохранение…' : 'Сохранить'}
                        </Button>
                        <Button type="button" variant="ghost" disabled={saving || deleting} onClick={cancelEditStatus}>
                          Отмена
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="profile-page__about-body">
                      {displayStatus ? <p className="profile-page__status-text">{displayStatus}</p> : null}
                      {savedHint ? (
                        <p className="profile-page__success" role="status">
                          Изменения сохранены
                        </p>
                      ) : null}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <p className="profile-page__error profile-page__error--block" role="alert">
                {error ?? 'Профиль недоступен.'}
              </p>
            )}
          </article>
        </div>
      </main>
    </div>
  )
}
