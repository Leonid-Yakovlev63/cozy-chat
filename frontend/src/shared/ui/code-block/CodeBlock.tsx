import { useCallback, useMemo, useState } from 'react'
import { highlightChatCodeToHtml } from '@/shared/lib/highlightChatCode'
import '@/shared/ui/code-block/CodeBlock.scss'

type CodeBlockProps = {
  code: string
  language: string
}

function displayLanguage(language: string): string {
  const t = language.trim()
  return t.length > 0 ? t : 'text'
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const label = displayLanguage(language)
  const html = useMemo(() => highlightChatCodeToHtml(code, language), [code, language])

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [code])

  return (
    <div className="code-block">
      <div className="code-block__header">
        <span className="code-block__lang">{label}</span>
        <button type="button" className="code-block__copy" onClick={onCopy}>
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
      <pre className="code-block__pre">
        {/* highlight.js отдаёт экранированную разметку span.hljs-* */}
        <code
          className="code-block__code hljs"
          // eslint-disable-next-line react/no-danger -- разметка только от highlight.js
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  )
}
