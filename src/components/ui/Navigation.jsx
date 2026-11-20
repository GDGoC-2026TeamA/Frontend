import { useId, useRef } from 'react'
import { Check } from 'lucide-react'

export function Tabs({
  items,
  value,
  onChange,
  label = '내용 선택',
  children,
}) {
  const id = useId()
  const refs = useRef([])
  const active =
    items.find((item) => item.id === value && !item.disabled) ||
    items.find((item) => !item.disabled)
  const selectWithKey = (event, index) => {
    const enabled = items
      .map((item, i) => (!item.disabled ? i : -1))
      .filter((i) => i >= 0)
    const position = enabled.indexOf(index)
    let next
    if (event.key === 'ArrowRight')
      next = enabled[(position + 1) % enabled.length]
    if (event.key === 'ArrowLeft')
      next = enabled[(position - 1 + enabled.length) % enabled.length]
    if (event.key === 'Home') next = enabled[0]
    if (event.key === 'End') next = enabled.at(-1)
    if (next !== undefined) {
      event.preventDefault()
      onChange(items[next].id)
      refs.current[next]?.focus()
    }
  }
  return (
    <div className="tabs">
      <div role="tablist" aria-label={label} className="tabs__list">
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[i] = node
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${item.id}`}
            aria-controls={`${id}-panel-${item.id}`}
            aria-selected={active?.id === item.id}
            tabIndex={active?.id === item.id ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => selectWithKey(e, i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${id}-panel-${item.id}`}
          aria-labelledby={`${id}-tab-${item.id}`}
          hidden={item.id !== active?.id}
          tabIndex={0}
          className="tabs__panel"
        >
          {item.id === active?.id &&
            (typeof children === 'function' ? children(item.id) : children)}
        </div>
      ))}
    </div>
  )
}

export function Stepper({ steps, currentStep = 0, label = '작업 단계' }) {
  return (
    <ol className="stepper" aria-label={label}>
      {steps.map((step, i) => (
        <li
          key={step.id || step.label || step}
          className={`stepper__step ${i <= currentStep ? 'is-active' : ''}`}
          aria-current={i === currentStep ? 'step' : undefined}
        >
          <span className="stepper__number" aria-hidden="true">
            {i < currentStep ? <Check size={16} /> : i + 1}
          </span>
          <span>
            {step.label || step}
            <span className="sr-only">
              {i < currentStep
                ? ' 완료'
                : i === currentStep
                  ? ' 현재 단계'
                  : ' 다음 단계'}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}
