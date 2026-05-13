import type { InputHTMLAttributes } from 'react'
import '@/shared/ui/text-field/TextField.scss'

type TextFieldProps = {
  label: string
  hint?: string
  error?: string
} & InputHTMLAttributes<HTMLInputElement>

export function TextField({ label, hint, error, id, className, ...rest }: TextFieldProps) {
  const inputId = id ?? rest.name
  const invalid = Boolean(error)
  const rootClass = ['text-field', invalid ? 'text-field--invalid' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      {inputId ? (
        <label className="text-field__label" htmlFor={inputId}>
          {label}
        </label>
      ) : (
        <span className="text-field__label">{label}</span>
      )}
      <div className="text-field__control">
        <input id={inputId} className="text-field__input" aria-invalid={invalid} {...rest} />
      </div>
      {error ? (
        <p className="text-field__error" role="status">
          {error}
        </p>
      ) : hint ? (
        <p className="text-field__hint">{hint}</p>
      ) : null}
    </div>
  )
}
