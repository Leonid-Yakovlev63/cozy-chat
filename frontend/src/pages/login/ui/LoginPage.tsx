import { Navigate } from 'react-router-dom'
import { LoginForm } from '@/features/login-form'
import { AuthCard } from '@/widgets/auth-card'
import { AuthTopBar } from '@/widgets/auth-top-bar'
import { useSession } from '@/entities/session'
import '@/pages/login/ui/LoginPage.scss'

export function LoginPage() {
  const { isAuthenticated } = useSession()
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="auth-page">
      <AuthTopBar />
      <div className="auth-page__body">
        <div className="auth-page__shell">
          <AuthCard title="Вход" subtitle="Введите логин и пароль.">
            <LoginForm />
          </AuthCard>
        </div>
      </div>
    </div>
  )
}
