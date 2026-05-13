/** Одна визуальная «кластерная» единица и она из набора эмодзи (Unicode EPG) */
export function isSingleEmojiMessage(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  try {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    const segments = [...segmenter.segment(t)]
    if (segments.length !== 1) return false
    return /\p{Extended_Pictographic}/u.test(segments[0].segment)
  } catch {
    return false
  }
}
