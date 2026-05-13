import { useTheme } from '@/entities/theme'
import { THEMES, type ThemeId } from '@/shared/config/theme'
import '@/features/theme-switch/ui/ThemeSwitch.scss'

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-switch">
      <label className="theme-switch__label" htmlFor="theme-select">
        Тема
      </label>
      <select
        id="theme-select"
        className="theme-switch__select"
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeId)}
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  )
}
