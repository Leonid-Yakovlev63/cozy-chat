import type { ReactNode } from 'react'
import '@/widgets/auth-card/ui/AuthCard.scss'

type AuthCardProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <section className="auth-card">
      <header className="auth-card__header">
        <h1 className="auth-card__title">{title}</h1>
        {subtitle ? <p className="auth-card__subtitle">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  )
}
