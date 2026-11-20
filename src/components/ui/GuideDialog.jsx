import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

export function GuideDialog({ open, onClose, variant = 'home', targets = [] }) {
  const ref = useRef(null)
  const snapshots = useRef(null)
  const titleId = useId()
  // Use inert visual copies above one full-screen backdrop. The original page stays inert.
  const targetKey = targets.join(',')
  useEffect(() => {
    if (!open) return
    const dialog = ref.current
    const focused = document.activeElement
    const overflow = document.body.style.overflow
    const draw = () => {
      const host = snapshots.current
      host.replaceChildren()
      if (innerWidth < 1200) return
      for (const id of targetKey.split(',').filter(Boolean)) {
        const source = document.getElementById(id)
        if (!source) continue
        const rect = source.getBoundingClientRect()
        const clone = source.cloneNode(true)
        clone.removeAttribute('id')
        clone
          .querySelectorAll('[id]')
          .forEach((node) => node.removeAttribute('id'))
        clone.inert = true
        clone.classList.add('guide-dialog__highlight')
        Object.assign(clone.style, {
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          margin: '0',
        })
        host.append(clone)
      }
    }
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    draw()
    window.addEventListener('resize', draw)
    return () => {
      window.removeEventListener('resize', draw)
      dialog.close()
      document.body.style.overflow = overflow
      if (focused instanceof HTMLElement && focused.isConnected) focused.focus()
    }
  }, [open, targetKey])
  if (!open) return null
  const home = variant === 'home'
  return createPortal(
    <dialog
      ref={ref}
      className={`guide-dialog guide-dialog--${variant}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Tab') {
          event.preventDefault()
          ref.current.querySelector('.guide-dialog__card button')?.focus()
        }
      }}
    >
      <div
        ref={snapshots}
        aria-hidden="true"
        className="guide-dialog__snapshots"
      />
      <div className="guide-dialog__card home-onboarding__callout">
        <h2 id={titleId}>
          {home ? '홈에서 어디로 가면 되나요?' : '등록한 업무에서 시작하세요'}
        </h2>
        {home ? (
          <ol>
            {[
              [
                '등록된 업무',
                '새 업무를 등록하거나 기존 업무를 처리하고 새 방식을 익혀요.',
              ],
              [
                '이어서 할 일',
                '검토하던 작업을 다시 열어 남은 항목을 확인해요.',
              ],
              ['개인 업무 카드', '저장해 둔 절차를 필요할 때 다시 열어 봐요.'],
            ].map(([title, description], index) => (
              <li key={title}>
                <span aria-hidden="true">{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p>
            바뀐 절차를 확인하려면 ‘새 방식 익히기’를, 자료를 바로 검토하려면
            ‘업무 처리하기’를 선택하세요.
          </p>
        )}
        <footer>
          <Button autoFocus onClick={onClose}>
            확인했어요
          </Button>
        </footer>
      </div>
    </dialog>,
    document.body,
  )
}
