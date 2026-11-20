import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../ui'

const steps = [
  [
    '등록된 업무',
    '새 업무를 등록하거나 기존 업무를 처리하고 새 방식을 익혀요.',
  ],
  ['이어서 할 일', '검토하던 작업을 다시 열어 남은 항목을 확인해요.'],
  ['개인 업무 카드', '저장해 둔 절차를 필요할 때 다시 열어 봐요.'],
]
const targets = ['home-registered', 'home-continue', 'home-saved']

// Transparent native dialog keeps underlying controls inert while actual DOM
// bounds are measured for the three highlighted areas (also after resize).
export function HomeOnboarding({ open, onClose }) {
  const dialogRef = useRef(null)
  const [geometry, setGeometry] = useState(null)
  const maskId = useId()
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    const focused = document.activeElement
    const previousOverflow = document.body.style.overflow
    const measure = () => {
      const workspace = document
        .querySelector('.home-workspace')
        ?.getBoundingClientRect()
      if (!workspace) return
      const rects = targets
        .map((id) => {
          const r = document.getElementById(id)?.getBoundingClientRect()
          return r
            ? {
                x: r.x - 8,
                y: r.y - 8,
                width: r.width + 16,
                height: r.height + 16,
              }
            : null
        })
        .filter(Boolean)
      const first = rects[0]
      const mobile = window.innerWidth < 1200
      setGeometry({
        workspace: {
          x: workspace.x,
          y: workspace.y,
          width: workspace.width,
          height: workspace.height,
        },
        rects,
        left: mobile ? 16 : first?.x + 8,
        top: mobile
          ? undefined
          : Math.min(first?.y + first?.height + 14, window.innerHeight - 324),
      })
    }
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(measure)
    const observer = new ResizeObserver(measure)
    for (const id of targets) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (focused instanceof HTMLElement && focused.isConnected) focused.focus()
    }
  }, [open])
  if (!open) return null
  return createPortal(
    <dialog
      ref={dialogRef}
      className="home-onboarding"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (
          event.target === event.currentTarget ||
          event.target.tagName === 'svg'
        )
          onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Tab') {
          event.preventDefault()
          dialogRef.current.querySelector('button')?.focus()
        }
      }}
    >
      {geometry && (
        <>
          <svg
            className="home-onboarding__mask"
            aria-hidden="true"
            onClick={onClose}
          >
            <defs>
              <mask id={maskId}>
                <rect width="100%" height="100%" fill="white" />
                {geometry.rects.map((r, i) => (
                  <rect key={i} {...r} rx="14" fill="black" />
                ))}
              </mask>
            </defs>
            <rect
              {...geometry.workspace}
              rx="24"
              fill="var(--wb-color-tour-overlay)"
              mask={'url(#' + maskId + ')'}
            />
            {geometry.rects.map((r, i) => (
              <g key={i}>
                <rect
                  {...r}
                  rx="14"
                  fill="none"
                  stroke="var(--wb-color-primary)"
                  strokeWidth="2"
                />
                <circle
                  cx={r.x + 27}
                  cy={r.y}
                  r="15"
                  fill="var(--wb-color-primary)"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={r.x + 27}
                  y={r.y + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="15"
                >
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
          <div
            className="home-onboarding__callout"
            style={{ left: geometry.left, top: geometry.top }}
          >
            <h2 id={titleId}>홈에서 어디로 가면 되나요?</h2>
            <ol>
              {steps.map(([title, description], i) => (
                <li key={title}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <footer>
              <Button autoFocus onClick={onClose}>
                확인했어요
              </Button>
            </footer>
          </div>
        </>
      )}
    </dialog>,
    document.body,
  )
}
