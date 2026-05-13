import { parseMessageCodeFences } from '@/shared/lib/parseMessageCodeFences'
import { isSingleEmojiMessage } from '@/shared/lib/isSingleEmojiMessage'
import { CodeBlock } from '@/shared/ui/code-block/CodeBlock'
import '@/shared/ui/message-rich-text/MessageRichText.scss'

type MessageRichTextProps = {
  content: string
  className?: string
}

export function MessageRichText({ content, className }: MessageRichTextProps) {
  const segments = parseMessageCodeFences(content)
  const hasCode = segments.some((s) => s.type === 'code')

  if (!hasCode) {
    const only = segments[0]
    const text = only?.type === 'text' ? only.value : content
    const loneEmoji = isSingleEmojiMessage(text)
    const textClass = [className, loneEmoji ? 'message-bubble__text--lone-emoji' : ''].filter(Boolean).join(' ')
    return <p className={textClass}>{text}</p>
  }

  return (
    <div className={['message-rich-text', className].filter(Boolean).join(' ')}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          if (!seg.value) return null
          return (
            <div key={i} className="message-rich-text__text">
              {seg.value}
            </div>
          )
        }
        return <CodeBlock key={i} code={seg.code} language={seg.language} />
      })}
    </div>
  )
}
