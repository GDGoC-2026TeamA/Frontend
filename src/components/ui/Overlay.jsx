import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from './Button'

// Native dialog makes the background inert. Explicit Tab cycling keeps focus inside.
// Modal and Drawer share the same behavior; all content is supplied by props.
function Overlay({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  drawer = false,
  className = '',
}) {
  const ref = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  useEffect(() => {
    const dialog = ref.current
    if (!open) {
      dialog.close()
      return
    }
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus()
    }
  }, [open])
  return createPortal(
    <dialog
      ref={ref}
      className={`overlay ${drawer ? 'overlay--drawer' : 'overlay--modal'} ${className}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const focusable = Array.from(
          event.currentTarget.querySelectorAll(
            'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter(
          (node) => node.tabIndex >= 0 && node.getClientRects().length > 0,
        )
        const first = focusable[0]
        const last = focusable.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        closeRef.current()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          closeRef.current()
      }}
    >
      <div className="overlay__inner">
        <header className="overlay__header">
          <h2 id={titleId}>{title}</h2>
          <Button
            variant="ghost"
            className="icon-button"
            aria-label={`${title} 닫기`}
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </Button>
        </header>
        {description && (
          <p id={descriptionId} className="text-secondary">
            {description}
          </p>
        )}
        <div className="overlay__body">{children}</div>
        {footer && <footer className="overlay__footer">{footer}</footer>}
      </div>
    </dialog>,
    document.body,
  )
}
export function Modal(props) {
  return <Overlay {...props} />
}
export function Drawer(props) {
  return <Overlay {...props} drawer />
}
