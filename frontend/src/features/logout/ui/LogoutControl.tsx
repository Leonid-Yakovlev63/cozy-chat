import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { useSession } from '@/entities/session'
import '@/features/logout/ui/LogoutControl.scss'

export function LogoutControl() {
  const navigate = useNavigate()
  const { logout } = useSession()

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="logout-control">
      <Button type="button" variant="ghost" onClick={onLogout}>
        Выйти
      </Button>
    </div>
  )
}
