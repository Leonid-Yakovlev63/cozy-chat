import { useEffect, useId, useRef, useState } from 'react'
import { useTheme } from '@/entities/theme'
import { THEMES, type ThemeId } from '@/shared/config/theme'
import '@/features/theme-switch/ui/ThemeSwitch.scss'

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = THEMES.find((t) => t.id === theme)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(next: ThemeId) {
    setTheme(next)
    setOpen(false)
  }

  return (
    <div className="theme-switch" ref={rootRef}>
      <span className="theme-switch__label" id={`${listId}-label`}>
        Тема
      </span>
      <button
        type="button"
        className="theme-switch__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-labelledby={`${listId}-label`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="theme-switch__trigger-text">{current?.label ?? theme}</span>
        <span className="theme-switch__chevron" aria-hidden>
          ▼
        </span>
      </button>
      {open ? (
        <ul id={listId} className="theme-switch__list" role="listbox" aria-label="Выбор темы">
          {THEMES.map((t) => {
            const active = t.id === theme
            const optClass = ['theme-switch__option', active ? 'theme-switch__option--current' : ''].filter(Boolean).join(' ')
            return (
              <li key={t.id} className="theme-switch__item" role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={optClass}
                  onClick={() => pick(t.id)}
                >
                  {t.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
