import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { useSession } from '@/entities/session'
import { ApiError } from '@/shared/api/errors'
import '@/features/register-form/ui/RegisterForm.scss'

export function RegisterForm() {
  const { register } = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setPending(true)
    try {
      await register(username, password)
      setSuccess('Аккаунт создан. Пожалуйста, дождитесь подтверждения администратором.')
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Не удалось зарегистрироваться.'
      setError(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="register-form" onSubmit={onSubmit}>
      <div className="register-form__fields">
        <TextField
          name="username"
          label="Имя пользователя"
          hint="Минимум 3 символа"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          required
        />
        <TextField
          name="password"
          type="password"
          label="Пароль"
          hint="Минимум 8 символов"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>

      {error ? (
        <p className="register-form__error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="register-form__success" role="status">
          {success}
        </p>
      ) : null}

      <div className="register-form__footer">
        <Button type="submit" fullWidth disabled={pending}>
          {pending ? 'Регистрация…' : 'Создать аккаунт'}
        </Button>
        <p className="register-form__hint">
          Уже есть аккаунт?{' '}
          <Link className="register-form__link" to="/login">
            Войти
          </Link>
        </p>
      </div>
    </form>
  )
}
