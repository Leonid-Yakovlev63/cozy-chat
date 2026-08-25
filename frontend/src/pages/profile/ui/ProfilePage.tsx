import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '@/widgets/app-header'
import { Button } from '@/shared/ui/button'
import { TextAreaField, TextField } from '@/shared/ui/text-field'
import { useSession } from '@/entities/session'
import {
  deleteMyAccount,
  deleteMyAvatar,
  deleteMyStatus,
  fetchMyProfile,
  updateMyAvatar,
  updateMyStatus,
  type CurrentUser,
} from '@/entities/user'
import { AVATAR_URL_MAX, isAvatarUrl } from '@/shared/lib/isAvatarUrl'
import { UserAvatar } from '@/shared/ui/user-avatar/UserAvatar'
import { ApiError } from '@/shared/api/errors'
import '@/pages/profile/ui/ProfilePage.scss'

const STATUS_MAX = 500

function formatJoined(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(d)
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { token, username, logout } = useSession()
  const [profile, setProfile] = useState<CurrentUser | null>(null)
  const [statusDraft, setStatusDraft] = useState('')
  const [avatarDraft, setAvatarDraft] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingAvatar, setDeletingAvatar] = useState(false)
  const [deletingStatus, setDeletingStatus] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const u = await fetchMyProfile(token)
      setProfile(u)
      setStatusDraft(u.status)
      setAvatarDraft(u.avatarUrl ?? '')
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

  useEffect(() => {
    if (!settingsOpen && !deleteConfirmOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || saving || deletingAvatar || deletingStatus || deletingAccount) return
      if (deleteConfirmOpen) {
        setDeleteConfirmOpen(false)
        return
      }
      closeSettings()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [settingsOpen, deleteConfirmOpen, saving, deletingAvatar, deletingStatus, deletingAccount])

  function openSettings() {
    if (!profile) return
    setStatusDraft(profile.status)
    setAvatarDraft(profile.avatarUrl ?? '')
    setSettingsError(null)
    setSettingsOpen(true)
  }

  function closeSettings() {
    if (saving || deletingAvatar || deletingStatus || deletingAccount) return
    setSettingsOpen(false)
    setDeleteConfirmOpen(false)
    setSettingsError(null)
    if (profile) {
      setStatusDraft(profile.status)
      setAvatarDraft(profile.avatarUrl ?? '')
    }
  }

  async function confirmDeleteAccount() {
    if (!token || deletingAccount) return
    setSettingsError(null)
    setDeletingAccount(true)
    try {
      await deleteMyAccount(token)
      logout()
      navigate('/login', { replace: true })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось удалить аккаунт.'
      setSettingsError(msg)
      setDeleteConfirmOpen(false)
    } finally {
      setDeletingAccount(false)
    }
  }

  async function removeAvatar() {
    if (!token || !profile || saving || deletingAvatar) return
    setSettingsError(null)
    setDeletingAvatar(true)
    try {
      await deleteMyAvatar(token)
      await load()
      setAvatarDraft('')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось удалить аватар.'
      setSettingsError(msg)
    } finally {
      setDeletingAvatar(false)
    }
  }

  async function removeStatus() {
    if (!token || !profile || saving || deletingStatus) return
    setSettingsError(null)
    setDeletingStatus(true)
    try {
      await deleteMyStatus(token)
      await load()
      setStatusDraft('')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось удалить статус.'
      setSettingsError(msg)
    } finally {
      setDeletingStatus(false)
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault()
    if (!token || !profile || saving || deletingAvatar || deletingStatus) return

    setSettingsError(null)

    const trimmedStatus = statusDraft.trim()
    const trimmedAvatar = avatarDraft.trim()
    const statusChanged = trimmedStatus !== (profile.status?.trim() ?? '')
    const avatarChanged = trimmedAvatar !== (profile.avatarUrl?.trim() ?? '')

    if (!statusChanged && !avatarChanged) {
      setSettingsOpen(false)
      return
    }

    if (statusChanged) {
      if (trimmedStatus.length < 1 || trimmedStatus.length > STATUS_MAX) {
        setSettingsError(`Статус: от 1 до ${STATUS_MAX} символов.`)
        return
      }
    }

    if (avatarChanged) {
      if (!isAvatarUrl(trimmedAvatar)) {
        setSettingsError(`Укажите ссылку вида https://… (до ${AVATAR_URL_MAX} символов).`)
        return
      }
    }

    setSaving(true)
    try {
      if (avatarChanged) {
        await updateMyAvatar(token, trimmedAvatar)
      }
      if (statusChanged) {
        await updateMyStatus(token, trimmedStatus)
      }
      await load()
      setSettingsOpen(false)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось сохранить настройки.'
      setSettingsError(msg)
    } finally {
      setSaving(false)
    }
  }

  const name = profile?.username ?? username ?? ''
  const displayStatus = profile?.status?.trim() ? profile.status : ''
  const settingsBusy = saving || deletingAvatar || deletingStatus || deletingAccount

  return (
    <div className="profile-page">
      <AppHeader username={username} />
      <main className={['profile-page__main', settingsOpen ? 'profile-page__main--settings' : ''].filter(Boolean).join(' ')}>
        {settingsOpen && profile ? (
          <section className="profile-page__settings-screen" aria-labelledby="profile-settings-title">
            <header className="profile-page__settings-head">
              <Button type="button" variant="ghost" className="profile-page__settings-back" disabled={settingsBusy} onClick={closeSettings}>
                Назад
              </Button>
              <h2 id="profile-settings-title" className="profile-page__settings-title">
                Настройки
              </h2>
            </header>

            <div className="profile-page__settings-body">
              <form id="profile-settings-form" className="profile-page__settings-form" onSubmit={saveSettings}>
                <div className="profile-page__settings-preview">
                  <UserAvatar username={name} avatarUrl={avatarDraft || profile.avatarUrl} size="sm" />
                  <p className="profile-page__settings-preview-name">{name}</p>
                </div>

                <fieldset className="profile-page__settings-group" disabled={settingsBusy}>
                  <legend className="profile-page__settings-legend">Аватар</legend>
                  <TextField
                    name="avatarUrl"
                    label="Ссылка на картинку"
                    value={avatarDraft}
                    onChange={(e) => setAvatarDraft(e.target.value)}
                    maxLength={AVATAR_URL_MAX}
                    placeholder="https://example.com/avatar.png"
                    hint="Прямая ссылка на изображение в интернете."
                  />
                  {profile.avatarUrl ? (
                    <Button type="button" variant="danger" disabled={settingsBusy} onClick={() => void removeAvatar()}>
                      {deletingAvatar ? 'Удаление…' : 'Удалить аватар'}
                    </Button>
                  ) : null}
                </fieldset>

                <fieldset className="profile-page__settings-group" disabled={settingsBusy}>
                  <legend className="profile-page__settings-legend">О себе</legend>
                  <TextAreaField
                    name="status"
                    label="Текст статуса"
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value)}
                    maxLength={STATUS_MAX}
                    rows={5}
                    hint={`До ${STATUS_MAX} символов.`}
                  />
                  {profile.status?.trim() ? (
                    <Button type="button" variant="danger" disabled={settingsBusy} onClick={() => void removeStatus()}>
                      {deletingStatus ? 'Удаление…' : 'Удалить статус'}
                    </Button>
                  ) : null}
                </fieldset>

                {settingsError ? (
                  <p className="profile-page__error" role="alert">
                    {settingsError}
                  </p>
                ) : null}

                <fieldset className="profile-page__settings-group profile-page__settings-group--danger" disabled={settingsBusy}>
                  <legend className="profile-page__settings-legend">Опасная зона</legend>
                  <p className="profile-page__danger-hint">
                    Удаление аккаунта необратимо: исчезнут профиль и все ваши сообщения в переписках.
                  </p>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={settingsBusy}
                    onClick={() => {
                      setSettingsError(null)
                      setDeleteConfirmOpen(true)
                    }}
                  >
                    Удалить мой аккаунт
                  </Button>
                </fieldset>
              </form>
            </div>

            <footer className="profile-page__settings-foot">
              <div className="profile-page__edit-actions">
                <Button type="submit" form="profile-settings-form" disabled={settingsBusy}>
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </Button>
                <Button type="button" variant="ghost" disabled={settingsBusy} onClick={closeSettings}>
                  Отмена
                </Button>
              </div>
            </footer>
          </section>
        ) : (
          <div className="profile-page__shell">
            <article className="profile-page__card">
              {loading ? (
                <p className="profile-page__lead profile-page__lead--muted">Загрузка…</p>
              ) : profile ? (
                <>
                  <div className="profile-page__card-head">
                    <p className="profile-page__eyebrow">Личная страница</p>
                    <Button type="button" variant="ghost" className="profile-page__settings-btn" onClick={openSettings}>
                      Настройки
                    </Button>
                  </div>

                  <header className="profile-page__hero">
                    <UserAvatar username={name} avatarUrl={profile.avatarUrl} size="lg" />
                    <h1 className="profile-page__name">{name}</h1>
                    {profile.createdAt ? (
                      <p className="profile-page__joined">В Cozy Chat с {formatJoined(profile.createdAt)}</p>
                    ) : null}
                  </header>

                  <section className="profile-page__section" aria-labelledby="profile-about-heading">
                    <h2 id="profile-about-heading" className="profile-page__section-title">
                      О себе
                    </h2>
                    {displayStatus ? (
                      <p className="profile-page__status-text">{displayStatus}</p>
                    ) : (
                      <p className="profile-page__muted-inline">Статус не задан.</p>
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
        )}
      </main>

      {deleteConfirmOpen ? (
        <div className="profile-page__confirm" role="presentation">
          <button
            type="button"
            className="profile-page__modal-backdrop"
            aria-label="Закрыть"
            disabled={deletingAccount}
            onClick={() => setDeleteConfirmOpen(false)}
          />
          <div
            className="profile-page__confirm-panel"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="profile-delete-title"
            aria-describedby="profile-delete-desc"
          >
            <h3 id="profile-delete-title" className="profile-page__confirm-title">
              Удалить аккаунт?
            </h3>
            <p id="profile-delete-desc" className="profile-page__confirm-text">
              Будут безвозвратно удалены ваш профиль и все отправленные и полученные сообщения. Это действие нельзя отменить.
            </p>
            {settingsError ? (
              <p className="profile-page__error" role="alert">
                {settingsError}
              </p>
            ) : null}
            <div className="profile-page__confirm-actions">
              <Button type="button" variant="danger" disabled={deletingAccount} onClick={() => void confirmDeleteAccount()}>
                {deletingAccount ? 'Удаление…' : 'Да, удалить'}
              </Button>
              <Button type="button" variant="ghost" disabled={deletingAccount} onClick={() => setDeleteConfirmOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
