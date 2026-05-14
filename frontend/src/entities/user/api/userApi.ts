import { apiFetch } from '@/shared/api/client'
import type { CurrentUser } from '@/entities/user/model/types'

export async function fetchMyProfile(token: string): Promise<CurrentUser> {
  return apiFetch<CurrentUser>('/api/users/me', { token })
}

export async function updateMyStatus(token: string, status: string): Promise<void> {
  await apiFetch<{ message?: string }>('/api/users/status', {
    method: 'PATCH',
    token,
    body: { status },
  })
}

export async function deleteMyStatus(token: string): Promise<void> {
  await apiFetch<{ message?: string }>('/api/users/status', {
    method: 'DELETE',
    token,
  })
}
