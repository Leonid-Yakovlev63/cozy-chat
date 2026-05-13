const TOKEN_KEY = 'cozy_chat_token'

export function readStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function writeStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
