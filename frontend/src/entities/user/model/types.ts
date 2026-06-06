export type UserRole = 'user' | 'admin'

/** Ответ GET /api/users/me (без пароля) */
export type CurrentUser = {
  id: string
  username: string
  status: string
  verified: boolean
  role: UserRole
  createdAt: string
  updatedAt: string
}

/** Элемент списка неверифицированных пользователей (GET /api/admin/users/unverified) */
export type UnverifiedUser = {
  id: string
  username: string
  status: string
  verified: boolean
  role: UserRole
  createdAt: string
  updatedAt: string
}
