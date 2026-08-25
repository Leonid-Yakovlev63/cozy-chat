import { useCallback, useEffect, useState } from 'react'
import { AppHeader } from '@/widgets/app-header'
import { MessageRichText } from '@/shared/ui/message-rich-text/MessageRichText'
import { useSession } from '@/entities/session'
import { fetchNews, type NewsItem } from '@/entities/news'
import { ApiError } from '@/shared/api/errors'
import '@/pages/news/ui/NewsPage.scss'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' }).format(d)
}

export function NewsPage() {
  const { token, username } = useSession()
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      const list = await fetchNews(token)
      setItems(list)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось загрузить новости.'
      setError(msg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="news-page">
      <AppHeader username={username} />
      <main className="news-page__main">
        <header className="news-page__head">
          <h1 className="news-page__title">Новости</h1>
          <p className="news-page__lead">Новости сайта</p>
        </header>

        {loading ? (
          <p className="news-page__muted">Загрузка…</p>
        ) : error ? (
          <p className="news-page__error" role="alert">
            {error}
          </p>
        ) : items.length === 0 ? (
          <p className="news-page__muted">Новостей пока нет.</p>
        ) : (
          <ul className="news-page__list">
            {items.map((item) => (
              <li key={item.id} className="news-page__item">
                <article>
                  <h2 className="news-page__item-title">{item.title}</h2>
                  <p className="news-page__item-meta">
                    {item.authorUsername} · {formatDate(item.createdAt)}
                  </p>
                  <MessageRichText content={item.content} className="news-page__item-content" imageSize="article" />
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
