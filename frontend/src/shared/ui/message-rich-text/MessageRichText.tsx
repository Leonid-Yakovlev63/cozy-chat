import { parseMessageCodeFences } from '@/shared/lib/parseMessageCodeFences'
import { CodeBlock } from '@/shared/ui/code-block/CodeBlock'
import { MessageTextContent } from '@/shared/ui/message-rich-text/MessageTextContent'
import '@/shared/ui/message-rich-text/MessageRichText.scss'

type MessageRichTextProps = {
  content: string
  className?: string
  imageSize?: 'chat' | 'article'
}

export function MessageRichText({ content, className, imageSize = 'chat' }: MessageRichTextProps) {
  const segments = parseMessageCodeFences(content)
  const hasCode = segments.some((segment) => segment.type === 'code')

  if (!hasCode) {
    const only = segments[0]
    const text = only?.type === 'text' ? only.value : content
    return <MessageTextContent text={text} className={className} imageSize={imageSize} />
  }

  return (
    <div className={['message-rich-text', className].filter(Boolean).join(' ')}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          if (!segment.value) return null
          return <MessageTextContent key={index} text={segment.value} imageSize={imageSize} />
        }
        return <CodeBlock key={index} code={segment.code} language={segment.language} />
      })}
    </div>
  )
}
