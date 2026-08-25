import { isSingleEmojiMessage } from '@/shared/lib/isSingleEmojiMessage'
import { parseMessageTextSegments } from '@/shared/lib/parseMessageTextSegments'
import { ImageLinkPreview } from '@/shared/ui/image-link-preview/ImageLinkPreview'

type MessageTextContentProps = {
  text: string
  className?: string
  imageSize?: 'chat' | 'article'
}

export function MessageTextContent({ text, className, imageSize = 'chat' }: MessageTextContentProps) {
  const segments = parseMessageTextSegments(text)
  const hasImages = segments.some((segment) => segment.type === 'image-link')

  if (!hasImages) {
    const loneEmoji = isSingleEmojiMessage(text)
    const textClass = [className, loneEmoji ? 'message-rich-text__lone-emoji' : ''].filter(Boolean).join(' ')
    return <p className={textClass}>{text}</p>
  }

  if (segments.length === 1 && segments[0].type === 'image-link') {
    return (
      <div className={['message-rich-text__media', className].filter(Boolean).join(' ')}>
        <ImageLinkPreview url={segments[0].url} size={imageSize} />
      </div>
    )
  }

  return (
    <div className={['message-rich-text__body', className].filter(Boolean).join(' ')}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          if (!segment.value) return null
          return (
            <span key={index} className="message-rich-text__text">
              {segment.value}
            </span>
          )
        }
        return <ImageLinkPreview key={index} url={segment.url} size={imageSize} />
      })}
    </div>
  )
}
