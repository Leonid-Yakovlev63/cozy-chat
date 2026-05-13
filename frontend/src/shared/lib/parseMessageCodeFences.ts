export type MessageCodeSegment =
  | { type: 'text'; value: string }
  | { type: 'code'; language: string; code: string }

/** Разбирает текст сообщения на фрагменты и fenced-блоки ```lang … ``` */
export function parseMessageCodeFences(input: string): MessageCodeSegment[] {
  const segments: MessageCodeSegment[] = []
  const re = /```([\w+#.-]*)\s*\n?([\s\S]*?)```/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: 'text', value: input.slice(lastIndex, m.index) })
    }
    segments.push({ type: 'code', language: (m[1] ?? '').trim(), code: m[2] ?? '' })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < input.length) {
    segments.push({ type: 'text', value: input.slice(lastIndex) })
  }
  return segments.length > 0 ? segments : [{ type: 'text', value: input }]
}
