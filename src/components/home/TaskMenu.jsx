import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

export function TaskMenu({ task, onAction }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const button = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  const actions =
    task.scope !== 'owned'
      ? ['업무 정보 보기']
      : [
          '이름과 설명 수정',
          '자료 교체와 비교 내용 재검토',
          '공유 설정',
          '업무 삭제',
        ]
  return (
    <div
      className="task-menu"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          setOpen(false)
          button.current?.focus()
        }
      }}
    >
      <button
        type="button"
        className="task-menu__trigger"
        ref={button}
        aria-label={`${task.name} 더 보기`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>
      {open && (
        <div className="task-menu__panel">
          <h4>{task.scope === 'owned' ? task.name : '공유받은 업무'}</h4>
          {task.scope !== 'owned' && (
            <p>
              등록자 {task.owner || '확인 필요'} / 기준 v
              {task.publishedSnapshot?.version || task.version || '확인 필요'}
            </p>
          )}
          {actions.map((label) => (
            <button
              type="button"
              key={label}
              onClick={() => {
                setOpen(false)
                button.current?.focus()
                onAction(task, label)
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
