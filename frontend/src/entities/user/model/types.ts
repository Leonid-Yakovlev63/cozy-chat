/** Ответ GET /api/users/me (без пароля) */
export type CurrentUser = {
  id: string
  username: string
  status: string
  createdAt: string
  updatedAt: string
}
