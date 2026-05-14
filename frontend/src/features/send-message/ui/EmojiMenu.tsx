import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
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
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const layoutPopover = useCallback(() => {
    const trigger = triggerRef.current
    const pop = popoverRef.current
    if (!trigger || !pop) return

    const rect = trigger.getBoundingClientRect()
    const vv = window.visualViewport
    const vw = vv?.width ?? window.innerWidth
    const vh = vv?.height ?? window.innerHeight
    const insetTop = vv?.offsetTop ?? 0
    const margin = 10
    const gap = 8
    const maxW = 296
    const width = Math.min(maxW, vw - margin * 2)
    let left = rect.right - width
    left = Math.max(margin, Math.min(left, vw - width - margin))
    const spaceAbove = rect.top - insetTop - margin
    const maxHeight = Math.min(280, Math.max(56, spaceAbove - gap))

    pop.style.position = 'fixed'
    pop.style.left = `${left}px`
    pop.style.width = `${width}px`
    pop.style.right = 'auto'
    pop.style.bottom = `${vh - rect.top + gap}px`
    pop.style.top = 'auto'
    pop.style.maxHeight = `${maxHeight}px`
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    layoutPopover()
    const vv = window.visualViewport
    window.addEventListener('resize', layoutPopover)
    window.addEventListener('scroll', layoutPopover, true)
    vv?.addEventListener('resize', layoutPopover)
    vv?.addEventListener('scroll', layoutPopover)
    return () => {
      window.removeEventListener('resize', layoutPopover)
      window.removeEventListener('scroll', layoutPopover, true)
      vv?.removeEventListener('resize', layoutPopover)
      vv?.removeEventListener('scroll', layoutPopover)
    }
  }, [open, layoutPopover])

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
        ref={triggerRef}
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
        <div id={menuId} ref={popoverRef} className="emoji-menu__popover" role="menu" aria-label="Выбор смайлика">
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
