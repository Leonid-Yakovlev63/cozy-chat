export type ThemeId = 'light' | 'dark' | 'coffee' | 'lunar' | 'sunny' | 'mars'

export const THEME_STORAGE_KEY = 'cozy_chat_theme'

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
  { id: 'coffee', label: 'Кофе' },
  { id: 'lunar', label: 'Лунная' },
  { id: 'sunny', label: 'Солнечная' },
  { id: 'mars', label: 'Марс' },
]

export const DEFAULT_THEME: ThemeId = 'coffee'

export function isThemeId(value: string | null): value is ThemeId {
  return (
    value === 'light' ||
    value === 'dark' ||
    value === 'coffee' ||
    value === 'lunar' ||
    value === 'sunny' ||
    value === 'mars'
  )
}

export function readStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (raw && isThemeId(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME
}

export function writeStoredTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}
