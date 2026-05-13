import type { ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { loginRequest, registerRequest } from '@/entities/session/api/authApi'
import { clearStoredToken, readStoredToken, writeStoredToken } from '@/entities/session/lib/storage'
import { readJwtSubject } from '@/shared/lib/jwt'
import { SessionContext, type SessionContextValue } from '@/entities/session/model/session-context'

function resolveUsername(token: string | null): string | null {
  if (!token) return null
  return readJwtSubject(token)
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken())

  const username = useMemo(() => resolveUsername(token), [token])

  const login = useCallback(async (rawUsername: string, password: string) => {
    const { token: next } = await loginRequest(rawUsername.trim(), password)
    writeStoredToken(next)
    setToken(next)
  }, [])

  const register = useCallback(async (rawUsername: string, password: string) => {
    await registerRequest(rawUsername.trim(), password)
  }, [])

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      token,
      username,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [login, logout, register, token, username],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
