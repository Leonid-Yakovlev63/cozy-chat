import { forwardRef, type TextareaHTMLAttributes } from 'react'
import '@/shared/ui/text-field/TextField.scss'

type TextAreaFieldProps = {
  label: string
  /** Подпись только для скринридеров — без строки над полем */
  labelSrOnly?: boolean
  hint?: string
  error?: string
} & TextareaHTMLAttributes<HTMLTextAreaElement>

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, labelSrOnly, hint, error, id, className, ...rest },
  ref,
) {
  const inputId = id ?? rest.name
  const invalid = Boolean(error)
  const rootClass = [
    'text-field',
    labelSrOnly ? 'text-field--label-sr-only' : '',
    invalid ? 'text-field--invalid' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
  const labelClass = ['text-field__label', labelSrOnly ? 'text-field__label--sr-only' : ''].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      {inputId ? (
        <label className={labelClass} htmlFor={inputId}>
          {label}
        </label>
      ) : (
        <span className={labelClass}>{label}</span>
      )}
      <div className="text-field__control">
        <textarea
          ref={ref}
          id={inputId}
          className="text-field__input text-field__input--textarea"
          aria-invalid={invalid}
          {...rest}
        />
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
})
