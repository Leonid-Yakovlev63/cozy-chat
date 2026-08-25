const IMAGE_EXTENSION_RE = /\.(avif|bmp|gif|jpe?g|png|svg|webp)(\?[^\s]*)?$/i

const IMAGE_HOST_PATTERNS = [
  /^https?:\/\/(?:i\.)?imgur\.com\/[a-zA-Z0-9]+(?:\.[a-z0-9]+)?(?:\?.*)?$/i,
  /^https?:\/\/i\.redd\.it\/.+/i,
  /^https?:\/\/preview\.redd\.it\/.+/i,
  /^https?:\/\/pbs\.twimg\.com\/media\/.+/i,
  /^https?:\/\/[^\s]+\/image\/upload\/.+/i,
]

function isDirectImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const pathAndQuery = parsed.pathname + parsed.search
    if (IMAGE_EXTENSION_RE.test(pathAndQuery)) return true
    return IMAGE_HOST_PATTERNS.some((pattern) => pattern.test(url))
  } catch {
    return false
  }
}

function unwrapNestedImageUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'reddit.com' && parsed.pathname === '/media') {
      const nested = parsed.searchParams.get('url')
      if (!nested) return null
      const decoded = decodeURIComponent(nested)
      return isDirectImageUrl(decoded) ? decoded : null
    }
  } catch {
    return null
  }

  return null
}

/** Возвращает прямую ссылку на изображение для отображения */
export function resolveImageUrl(url: string): string | null {
  const unwrapped = unwrapNestedImageUrl(url)
  if (unwrapped) return unwrapped
  return isDirectImageUrl(url) ? url : null
}

export function isImageUrl(url: string): boolean {
  return resolveImageUrl(url) !== null
}
