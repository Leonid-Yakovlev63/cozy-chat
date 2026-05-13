import { Navigate } from 'react-router-dom'
import { LoginForm } from '@/features/login-form'
import { AuthCard } from '@/widgets/auth-card'
import { useSession } from '@/entities/session'
import '@/pages/login/ui/LoginPage.scss'

export function LoginPage() {
  const { isAuthenticated } = useSession()
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="auth-page">
      <div className="auth-page__shell">
        <div className="auth-page__brand" aria-hidden="true">
          <div className="auth-page__logo" />
          <div className="auth-page__brand-text">
            <p className="auth-page__brand-title">Cozy Chat</p>
            <p className="auth-page__brand-subtitle">Frontend</p>
          </div>
        </div>

        <AuthCard title="Вход" subtitle="Введите учётные данные, чтобы получить JWT и открыть переписки.">
          <LoginForm />
        </AuthCard>
      </div>
    </div>
  )
}
