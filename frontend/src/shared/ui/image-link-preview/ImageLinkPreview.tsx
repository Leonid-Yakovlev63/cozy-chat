import { useCallback, useMemo, useState } from 'react'
import { resolveImageUrl } from '@/shared/lib/isImageUrl'
import '@/shared/ui/image-link-preview/ImageLinkPreview.scss'

type ImageLinkPreviewProps = {
  url: string
  size?: 'chat' | 'article'
}

export function ImageLinkPreview({ url, size = 'chat' }: ImageLinkPreviewProps) {
  const displayUrl = useMemo(() => resolveImageUrl(url) ?? url, [url])
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [url])

  if (failed) {
    return (
      <a className="image-link-preview__fallback" href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    )
  }

  const rootClass = ['image-link-preview', size === 'article' ? 'image-link-preview--article' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <figure className={rootClass}>
      <img
        className="image-link-preview__img"
        src={displayUrl}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
      <figcaption className="image-link-preview__overlay">
        <button type="button" className="image-link-preview__copy" onClick={() => void onCopy()}>
          {copied ? 'Скопировано' : 'Скопировать ссылку'}
        </button>
      </figcaption>
    </figure>
  )
}
