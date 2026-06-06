import { apiFetch } from '@/shared/api/client'
import type { CurrentUser, UnverifiedUser } from '@/entities/user/model/types'

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

export async function fetchUnverifiedUsers(token: string): Promise<UnverifiedUser[]> {
  return apiFetch<UnverifiedUser[]>('/api/admin/users/unverified', { token })
}

export async function verifyUser(token: string, username: string): Promise<void> {
  await apiFetch<{ message?: string }>(`/api/admin/users/${encodeURIComponent(username)}/verify`, {
    method: 'POST',
    token,
  })
}

export async function blockUser(token: string, username: string): Promise<void> {
  await apiFetch<{ message?: string }>(`/api/admin/users/${encodeURIComponent(username)}/block`, {
    method: 'POST',
    token,
  })
}
