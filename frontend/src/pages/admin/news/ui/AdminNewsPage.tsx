import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Button } from '@/shared/ui/button'
import { TextAreaField } from '@/shared/ui/text-field'
import { TextField } from '@/shared/ui/text-field'
import { MessageRichText } from '@/shared/ui/message-rich-text/MessageRichText'
import { EmojiMenu } from '@/features/send-message'
import { useSession } from '@/entities/session'
import { createNews, deleteNews, fetchNews, type NewsItem } from '@/entities/news'
import { ApiError } from '@/shared/api/errors'
import '@/pages/admin/news/ui/AdminNewsPage.scss'

const TITLE_MAX = 200
const CONTENT_MAX = 10000

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' }).format(d)
}

export function AdminNewsPage() {
  const { token } = useSession()
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const selectionRef = useRef({ start: 0, end: 0 })
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const rememberSelection = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    selectionRef.current = {
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    }
  }, [])

  const insertAtSelection = useCallback((insert: string, cursorOffset?: number) => {
    const el = contentRef.current
    let { start, end } = selectionRef.current
    if (el && document.activeElement === el) {
      start = el.selectionStart ?? start
      end = el.selectionEnd ?? end
    }
    const pos = start + (cursorOffset ?? insert.length)
    setContent((prev) => prev.slice(0, start) + insert + prev.slice(end))
    selectionRef.current = { start: pos, end: pos }
    window.setTimeout(() => {
      el?.focus()
      el?.setSelectionRange(pos, pos)
    }, 0)
  }, [])

  const insertCodeFence = useCallback(() => {
    insertAtSelection('```\n\n```', 4)
  }, [insertAtSelection])

  const load = useCallback(async () => {
    if (!token) return
    setListError(null)
    setLoading(true)
    try {
      const list = await fetchNews(token)
      setItems(list)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось загрузить новости.'
      setListError(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!formOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !publishing) {
        setFormOpen(false)
        setFormError(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [formOpen, publishing])

  function openForm() {
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    if (publishing) return
    setFormOpen(false)
    setFormError(null)
  }

  function onContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value)
    queueMicrotask(() => rememberSelection())
  }

  function onContentKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault()
      insertAtSelection('\t')
    }
  }

  async function handlePublish(event: FormEvent) {
    event.preventDefault()
    if (!token || publishing) return

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (trimmedTitle.length < 1 || trimmedTitle.length > TITLE_MAX) {
      setFormError(`Заголовок: от 1 до ${TITLE_MAX} символов.`)
      return
    }
    if (trimmedContent.length < 1 || trimmedContent.length > CONTENT_MAX) {
      setFormError(`Текст: от 1 до ${CONTENT_MAX} символов.`)
      return
    }

    setFormError(null)
    setPublishing(true)
    try {
      await createNews(token, { title: trimmedTitle, content: trimmedContent })
      setTitle('')
      setContent('')
      setFormOpen(false)
      await load()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось опубликовать новость.'
      setFormError(msg)
    } finally {
      setPublishing(false)
    }
  }

  async function handleDelete(id: string) {
    if (!token || deletingId) return
    setListError(null)
    setDeletingId(id)
    try {
      await deleteNews(token, id)
      await load()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось удалить новость.'
      setListError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="admin-news-page">
      <header className="admin-news-page__head">
        <h1 className="admin-news-page__title">Новости</h1>
        <p className="admin-news-page__lead">Публикация новостей для пользователей Cozy Chat.</p>
      </header>

      <div className="admin-news-page__body">
        <div className="admin-news-page__toolbar">
          <Button type="button" disabled={publishing || deletingId !== null} onClick={openForm}>
            Новая публикация
          </Button>
        </div>

        <div className="admin-news-page__list-wrap">
          <h2 className="admin-news-page__list-title">Опубликованные</h2>
          {listError ? (
            <p className="admin-news-page__error" role="alert">
              {listError}
            </p>
          ) : null}
          {loading ? (
            <p className="admin-news-page__muted">Загрузка…</p>
          ) : items.length === 0 ? (
            <p className="admin-news-page__muted">Новостей пока нет.</p>
          ) : (
            <ul className="admin-news-page__list">
              {items.map((item) => (
                <li key={item.id} className="admin-news-page__item">
                  <div className="admin-news-page__item-main">
                    <h3 className="admin-news-page__item-title">{item.title}</h3>
                    <p className="admin-news-page__item-meta">
                      {item.authorUsername} · {formatDate(item.createdAt)}
                    </p>
                    <MessageRichText content={item.content} className="admin-news-page__item-preview" />
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={deletingId !== null || publishing}
                    onClick={() => void handleDelete(item.id)}
                  >
                    {deletingId === item.id ? 'Удаление…' : 'Удалить'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {formOpen ? (
        <div className="admin-news-page__modal" role="presentation">
          <button
            type="button"
            className="admin-news-page__modal-backdrop"
            aria-label="Закрыть"
            disabled={publishing}
            onClick={closeForm}
          />
          <div
            className="admin-news-page__modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-news-form-title"
          >
            <form className="admin-news-page__form" onSubmit={handlePublish}>
              <h2 id="admin-news-form-title" className="admin-news-page__form-title">
                Новая публикация
              </h2>
              <TextField
                name="title"
                label="Заголовок"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX}
              />
              <div className="admin-news-page__editor">
                <label className="admin-news-page__editor-label" htmlFor="news-content">
                  Текст новости
                </label>
                <div className="admin-news-page__editor-row">
                  <TextAreaField
                    ref={contentRef}
                    id="news-content"
                    className="admin-news-page__editor-field"
                    name="content"
                    label="Текст новости"
                    labelSrOnly
                    value={content}
                    onChange={onContentChange}
                    onSelect={rememberSelection}
                    onMouseUp={rememberSelection}
                    onKeyUp={rememberSelection}
                    onKeyDown={onContentKeyDown}
                    maxLength={CONTENT_MAX}
                    rows={8}
                    hint={`До ${CONTENT_MAX} символов.`}
                  />
                  <div className="admin-news-page__editor-tools">
                    <EmojiMenu onPick={insertAtSelection} disabled={publishing} />
                    <button
                      type="button"
                      className="admin-news-page__code-trigger"
                      disabled={publishing}
                      aria-label="Вставить блок кода"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={insertCodeFence}
                    >
                      <span aria-hidden>{'</>'}</span>
                    </button>
                  </div>
                </div>
              </div>
              {formError ? (
                <p className="admin-news-page__error" role="alert">
                  {formError}
                </p>
              ) : null}
              <div className="admin-news-page__form-actions">
                <Button type="submit" disabled={publishing}>
                  {publishing ? 'Публикация…' : 'Опубликовать'}
                </Button>
                <Button type="button" variant="ghost" disabled={publishing} onClick={closeForm}>
                  Отмена
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
