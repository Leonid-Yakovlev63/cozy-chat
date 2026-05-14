import { API_BASE_URL } from '@/shared/config'
import { ApiError } from '@/shared/api/errors'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  if (!text) return response.statusText
  try {
    const data = JSON.parse(text) as { error?: string }
    if (typeof data.error === 'string') return data.error
  } catch {
    /* текст не JSON */
  }
  return text
}

export type ApiFetchOptions = {
  method?: HttpMethod
  body?: unknown
  token?: string | null
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentLength = response.headers.get('content-length')
  if (contentLength === '0') {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  return (await response.text()) as T
}
