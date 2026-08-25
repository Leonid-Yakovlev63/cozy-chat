const AVATAR_URL_RE = /^https?:\/\/\S+$/
export const AVATAR_URL_MAX = 2048

export function isAvatarUrl(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= AVATAR_URL_MAX && AVATAR_URL_RE.test(trimmed)
}
