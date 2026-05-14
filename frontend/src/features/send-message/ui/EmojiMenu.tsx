import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EMOJI_PALETTE } from '@/features/send-message/lib/emojiPalette'
import '@/features/send-message/ui/EmojiMenu.scss'

type EmojiMenuProps = {
  onPick: (emoji: string) => void
  /** Последний отправленный одиночный смайлик (или дефолт 🙂) */
  triggerEmoji?: string
  disabled?: boolean
}

type Placement = 'above' | 'below'

export function EmojiMenu({ onPick, triggerEmoji = '🙂', disabled }: EmojiMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const placementLockedRef = useRef(false)
  const placementRef = useRef<Placement>('above')
  const rafRef = useRef(0)

  const layoutPopover = useCallback(() => {
    const trigger = triggerRef.current
    const pop = popoverRef.current
    if (!trigger || !pop) return

    const rect = trigger.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 10
    const gap = 8
    const width = Math.min(296, vw - margin * 2)
    let left = rect.right - width
    left = Math.max(margin, Math.min(left, vw - width - margin))

    const spaceAbove = rect.top - margin - gap
    const spaceBelow = vh - rect.bottom - margin - gap
    const minComfort = 100

    if (!placementLockedRef.current) {
      placementRef.current =
        spaceAbove >= minComfort || spaceAbove >= spaceBelow ? 'above' : 'below'
      placementLockedRef.current = true
    }

    const placement = placementRef.current
    const maxH =
      placement === 'above'
        ? Math.min(280, Math.max(72, spaceAbove))
        : Math.min(280, Math.max(72, spaceBelow))

    pop.style.position = 'fixed'
    pop.style.left = `${left}px`
    pop.style.width = `${width}px`
    pop.style.right = 'auto'
    pop.style.bottom = 'auto'
    pop.style.maxHeight = `${maxH}px`
    pop.style.visibility = 'hidden'

    void pop.offsetHeight
    const h = Math.min(pop.offsetHeight, maxH) || Math.min(160, maxH)

    let top: number
    if (placement === 'above') {
      top = rect.top - gap - h
      if (top < margin) top = margin
    } else {
      top = rect.bottom + gap
      if (top + h > vh - margin) top = Math.max(margin, vh - margin - h)
    }

    pop.style.top = `${top}px`
    pop.style.visibility = 'visible'
  }, [])

  const scheduleLayout = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      layoutPopover()
    })
  }, [layoutPopover])

  useLayoutEffect(() => {
    if (!open) {
      placementLockedRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    layoutPopover()

    function onScroll(event: Event) {
      const pop = popoverRef.current
      const t = event.target
      if (pop && t instanceof Node && pop.contains(t)) return
      scheduleLayout()
    }

    window.addEventListener('resize', scheduleLayout)
    window.addEventListener('scroll', onScroll, true)

    return () => {
      window.removeEventListener('resize', scheduleLayout)
      window.removeEventListener('scroll', onScroll, true)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      placementLockedRef.current = false
    }
  }, [open, layoutPopover, scheduleLayout])

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(event: MouseEvent) {
      const t = event.target as Node
      if (rootRef.current?.contains(t)) return
      if (popoverRef.current?.contains(t)) return
      setOpen(false)
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

  const popover =
    open && typeof document !== 'undefined' ? (
      <div
        id={menuId}
        ref={popoverRef}
        className="emoji-menu__popover emoji-menu__popover--portal"
        role="menu"
        aria-label="Выбор смайлика"
      >
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
    ) : null

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
      {popover ? createPortal(popover, document.body) : null}
    </div>
  )
}
