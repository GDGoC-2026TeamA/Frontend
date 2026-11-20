import { useId } from 'react'
import { Badge } from './Badge'
import { Button } from './Button'

export function LearningChoice({
  children,
  type = 'radio',
  className = '',
  ...props
}) {
  return (
    <label className={`learning-choice ${className}`}>
      <input {...props} type={type} />
      <span>{children}</span>
    </label>
  )
}

export function LearningRecommendation({
  title,
  reason,
  evidence,
  selected = false,
  onChange,
  unavailable = false,
  onChooseManually,
  name = 'learning-topic',
  value,
  confirmed = true,
}) {
  const id = useId()
  const canPractice = confirmed && Boolean(evidence)
  if (unavailable)
    return (
      <section className="learning-recommendation" aria-label="학습 추천">
        <Badge tone="warning">추천을 불러오지 못했어요</Badge>
        <p>확인된 절차를 직접 선택해 연습할 수 있어요.</p>
        <Button variant="secondary" onClick={onChooseManually}>
          직접 선택하기
        </Button>
      </section>
    )
  return (
    <section
      className={`learning-recommendation ${selected && canPractice ? 'is-selected' : ''}`}
      aria-labelledby={id}
    >
      <div className="foundation-inline">
        <h3 id={id}>{title}</h3>
        <Badge tone={confirmed ? 'blue' : 'warning'}>
          {confirmed ? '먼저 익히기' : '확인 필요'}
        </Badge>
      </div>
      <p>추천 이유 / {reason}</p>
      <p>근거 / {evidence || '자료에서 확인되지 않았어요.'}</p>
      <LearningChoice
        name={name}
        value={value}
        checked={selected && canPractice}
        disabled={!canPractice}
        onChange={onChange}
      >
        이 항목을 연습할게요
      </LearningChoice>
    </section>
  )
}
