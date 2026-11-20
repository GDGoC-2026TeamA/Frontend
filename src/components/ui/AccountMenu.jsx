import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, UserRound } from 'lucide-react'

// A disclosure with ordinary buttons: Tab follows document order; Escape restores focus.
export function AccountMenu({ onProfile, onSettings, onLogout }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  return (
    <div
      className="account-menu"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          event.stopPropagation()
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <button
        className="account-menu__trigger"
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <UserRound size={19} aria-hidden="true" />
        <span>개인 작업 공간</span>
        <ChevronDown size={20} aria-hidden="true" />
      </button>
      {open && (
        <div className="account-menu__panel" id={id}>
          <p>내 계정</p>
          <hr />
          {[
            ['프로필', onProfile],
            ['설정', onSettings],
            ['로그아웃', onLogout],
          ].map(([label, callback]) => (
            <button
              type="button"
              key={label}
              onClick={() => {
                setOpen(false)
                trigger.current?.focus()
                callback?.()
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
