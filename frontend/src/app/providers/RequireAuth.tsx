import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@/entities/session'

export function RequireAuth() {
  const { isAuthenticated } = useSession()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
