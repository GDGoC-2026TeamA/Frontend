import { FileText, CircleHelp, LoaderCircle, Check } from 'lucide-react'
import { Button } from './Button'

const defaults = {
  empty: {
    title: '등록된 업무가 없어요',
    description: '기존 자료와 새 매뉴얼을 등록하고 시작해 보세요.',
    icon: FileText,
  },
  loading: {
    title: '예시 내용을 불러오고 있어요',
    description: '잠시만 기다려 주세요.',
    icon: LoaderCircle,
  },
  error: {
    title: '내용을 불러오지 못했어요',
    description: '잠시 후 다시 시도해 주세요.',
    icon: CircleHelp,
  },
  insufficient: {
    title: '확인할 자료가 더 필요해요',
    description: '등록된 자료에서 관련 기준을 찾지 못했어요.',
    icon: FileText,
  },
  success: {
    title: '내용을 확인했어요',
    description:
      '사용자가 확인한 상태입니다. AI 결과의 정확성을 보증하지 않아요.',
    icon: Check,
  },
}
export function StatePanel({
  type = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}) {
  const state = defaults[type] || defaults.empty
  const Icon = icon || state.icon
  return (
    <div
      className={`state-panel state-panel--${type} ${className}`}
      role={
        type === 'error' ? 'alert' : type === 'loading' ? 'status' : undefined
      }
      aria-busy={type === 'loading' || undefined}
    >
      <div className="state-panel__icon">
        <Icon
          size={26}
          aria-hidden="true"
          className={type === 'loading' ? 'spinner' : ''}
        />
      </div>
      <h3>{title || state.title}</h3>
      <p className="text-secondary">{description || state.description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} disabled={type === 'loading'}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
