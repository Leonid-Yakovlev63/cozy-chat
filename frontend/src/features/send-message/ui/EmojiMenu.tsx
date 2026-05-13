import { useEffect, useId, useRef, useState } from 'react'
import { EMOJI_PALETTE } from '@/features/send-message/lib/emojiPalette'
import '@/features/send-message/ui/EmojiMenu.scss'

type EmojiMenuProps = {
  onPick: (emoji: string) => void
  /** Последний отправленный одиночный смайлик (или дефолт 🙂) */
  triggerEmoji?: string
  disabled?: boolean
}

export function EmojiMenu({ onPick, triggerEmoji = '🙂', disabled }: EmojiMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function handlePick(emoji: string) {
    onPick(emoji)
    setOpen(false)
  }

  return (
    <div className="emoji-menu" ref={rootRef}>
      <button
        type="button"
        className="emoji-menu__trigger"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? menuId : undefined}
        aria-label="Смайлики"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="emoji-menu__trigger-icon" aria-hidden>
          {triggerEmoji}
        </span>
      </button>
      {open ? (
        <div id={menuId} className="emoji-menu__popover" role="menu" aria-label="Выбор смайлика">
          {EMOJI_PALETTE.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              className="emoji-menu__cell"
              role="menuitem"
              aria-label={`Вставить ${emoji}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handlePick(emoji)}
            >
              <span className="emoji-menu__glyph" aria-hidden>
                {emoji}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
