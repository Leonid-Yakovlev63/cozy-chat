import { apiFetch } from '@/shared/api/client'
import type { CreateNewsPayload, NewsItem } from '@/entities/news/model/types'

export async function fetchNews(token: string): Promise<NewsItem[]> {
  return apiFetch<NewsItem[]>('/api/news', { token })
}

export async function createNews(token: string, payload: CreateNewsPayload): Promise<NewsItem> {
  return apiFetch<NewsItem>('/api/admin/news', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function deleteNews(token: string, id: string): Promise<void> {
  await apiFetch<void>(`/api/admin/news/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
}
