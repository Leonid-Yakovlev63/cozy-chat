import { Navigate } from 'react-router-dom'
import { RegisterForm } from '@/features/register-form'
import { AuthCard } from '@/widgets/auth-card'
import { useSession } from '@/entities/session'
import '@/pages/login/ui/LoginPage.scss'

export function RegisterPage() {
  const { isAuthenticated } = useSession()
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="auth-page">
      <div className="auth-page__shell">
        <div className="auth-page__brand" aria-hidden="true">
          <div className="auth-page__logo" />
          <div className="auth-page__brand-text">
            <p className="auth-page__brand-title">Cozy Chat</p>
            <p className="auth-page__brand-subtitle">Регистрация</p>
          </div>
        </div>

        <AuthCard title="Новый аккаунт" subtitle="Создайте пользователя: username ≥ 3 символов, пароль ≥ 8.">
          <RegisterForm />
        </AuthCard>
      </div>
    </div>
  )
}
