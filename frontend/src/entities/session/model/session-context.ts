import { createContext } from 'react'

export type SessionContextValue = {
  token: string | null
  username: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)
