import hljs from 'highlight.js/lib/common'

export function highlightChatCodeToHtml(code: string, language: string): string {
  const normalized = code.replace(/\r\n/g, '\n')
  const lang = language.trim().toLowerCase()
  try {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(normalized, { language: lang, ignoreIllegals: true }).value
    }
  } catch {
    /* падаем на plaintext */
  }
  return hljs.highlight(normalized, { language: 'plaintext', ignoreIllegals: true }).value
}
