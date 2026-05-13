import type { ButtonHTMLAttributes, ReactNode } from 'react'
import '@/shared/ui/button/Button.scss'

type ButtonVariant = 'primary' | 'ghost' | 'danger'

type ButtonProps = {
  variant?: ButtonVariant
  fullWidth?: boolean
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  variant = 'primary',
  fullWidth,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'ui-button',
    `ui-button--${variant}`,
    fullWidth ? 'ui-button--full-width' : '',
    disabled ? 'ui-button--disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled} {...rest}>
      <span className="ui-button__label">{children}</span>
    </button>
  )
}
