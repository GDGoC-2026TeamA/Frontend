const options = [
  ['all', '전체'],
  ['mine', '내가 등록한 업무'],
  ['shared', '공유받은 업무'],
]

export function TaskFilters({ value, onChange }) {
  return (
    <div className="task-filters" role="group" aria-label="업무 범위">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
