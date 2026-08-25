import { isImageUrl } from '@/shared/lib/isImageUrl'

export type MessageTextSegment =
  | { type: 'text'; value: string }
  | { type: 'image-link'; url: string }

const URL_RE = /https?:\/\/[^\s<>"'\]]+/gi

function trimTrailingPunctuation(url: string): string {
  let trimmed = url
  while (/[),.;!?]$/.test(trimmed)) {
    trimmed = trimmed.slice(0, -1)
  }
  return trimmed
}

/** Разбирает текст на фрагменты и ссылки на изображения */
export function parseMessageTextSegments(input: string): MessageTextSegment[] {
  const segments: MessageTextSegment[] = []
  const re = new RegExp(URL_RE.source, URL_RE.flags)
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: input.slice(lastIndex, match.index) })
    }

    const raw = match[0]
    const url = trimTrailingPunctuation(raw)
    if (isImageUrl(url)) {
      segments.push({ type: 'image-link', url })
    } else {
      segments.push({ type: 'text', value: raw })
    }

    lastIndex = match.index + raw.length
  }

  if (lastIndex < input.length) {
    segments.push({ type: 'text', value: input.slice(lastIndex) })
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: input }]
}
