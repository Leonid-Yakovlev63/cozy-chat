import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { useSession } from '@/entities/session'
import { ApiError } from '@/shared/api/errors'
import '@/features/login-form/ui/LoginForm.scss'

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Не удалось войти. Попробуйте ещё раз.'
      setError(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <div className="login-form__fields">
        <TextField
          name="username"
          label="Имя пользователя"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <TextField
          name="password"
          type="password"
          label="Пароль"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error ? (
        <p className="login-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="login-form__footer">
        <Button type="submit" fullWidth disabled={pending}>
          {pending ? 'Вход…' : 'Войти'}
        </Button>
        <p className="login-form__hint">
          Нет аккаунта?{' '}
          <Link className="login-form__link" to="/register">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </form>
  )
}
