import { useState } from 'react'
import '@/shared/ui/user-avatar/UserAvatar.scss'

type UserAvatarProps = {
  username: string
  avatarUrl?: string | null
  size?: 'sm' | 'lg'
  className?: string
}

function avatarLetter(username: string): string {
  const t = username.trim()
  if (!t) return '?'
  const ch = t.codePointAt(0)
  if (ch === undefined) return '?'
  return String.fromCodePoint(ch).toUpperCase()
}

export function UserAvatar({ username, avatarUrl, size = 'sm', className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false)
  const trimmedUrl = avatarUrl?.trim() ?? ''
  const showImage = trimmedUrl.length > 0 && !failed

  const rootClass = ['user-avatar', `user-avatar--${size}`, className].filter(Boolean).join(' ')

  return (
    <span className={rootClass} aria-hidden>
      {showImage ? (
        <img
          className="user-avatar__img"
          src={trimmedUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="user-avatar__letter">{avatarLetter(username)}</span>
      )}
    </span>
  )
}
