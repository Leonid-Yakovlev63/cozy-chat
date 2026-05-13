import { useContext } from 'react'
import { SessionContext, type SessionContextValue } from '@/entities/session/model/session-context'

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession должен вызываться внутри SessionProvider')
  }
  return ctx
}
