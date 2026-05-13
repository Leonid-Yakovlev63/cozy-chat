function decodeBase64UrlSegment(segment: string): string {
  const base64 = segment.replaceAll('-', '+').replaceAll('_', '/')
  const pad = (4 - (base64.length % 4)) % 4
  const padded = base64 + '='.repeat(pad)
  return atob(padded)
}

/** Читает `sub` из JWT без проверки подписи (только для отображения в UI). */
export function readJwtSubject(token: string): string | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const json = decodeBase64UrlSegment(parts[1])
    const payload = JSON.parse(json) as { sub?: unknown }
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}
