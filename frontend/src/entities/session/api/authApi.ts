import { apiFetch } from '@/shared/api/client'

export async function loginRequest(username: string, password: string): Promise<{ token: string }> {
  return apiFetch<{ token: string }>('/api/login', {
    method: 'POST',
    body: { username, password },
  })
}

export async function registerRequest(username: string, password: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/register', {
    method: 'POST',
    body: { username, password },
  })
}
