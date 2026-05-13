import { ThemeSwitch } from '@/features/theme-switch'
import '@/widgets/auth-top-bar/ui/AuthTopBar.scss'

export function AuthTopBar() {
  return (
    <header className="auth-top-bar">
      <div className="auth-top-bar__inner">
        <div className="auth-top-bar__brand">
          <div className="auth-top-bar__logo" aria-hidden />
          <span className="auth-top-bar__title">Cozy Chat</span>
        </div>
        <ThemeSwitch />
      </div>
    </header>
  )
}
