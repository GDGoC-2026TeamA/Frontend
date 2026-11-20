import { useId } from 'react'

function Field({
  multiline = false,
  label,
  hint,
  error,
  id,
  className = '',
  ...props
}) {
  const generatedId = useId()
  const fieldId = id || generatedId
  const helpId = `${fieldId}-help`
  const Control = multiline ? 'textarea' : 'input'
  return (
    <div className={`field ${className}`}>
      <label htmlFor={fieldId} className="field__label">
        {label}
        {props.required && <span className="field__required"> (필수)</span>}
      </label>
      <Control
        {...props}
        id={fieldId}
        className={`field__control ${error ? 'is-error' : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [props['aria-describedby'], (error || hint) && helpId]
            .filter(Boolean)
            .join(' ') || undefined
        }
      />
      {(error || hint) && (
        <p id={helpId} className={`field__hint ${error ? 'is-error' : ''}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
}
export function Input(props) {
  return <Field {...props} />
}
export function Textarea(props) {
  return <Field {...props} multiline />
}

export function Checkbox({ label, hint, error, id, className = '', ...props }) {
  const generatedId = useId()
  const fieldId = id || generatedId
  return (
    <div className={`checkbox ${className}`}>
      <label htmlFor={fieldId} className="checkbox__label">
        <input
          {...props}
          id={fieldId}
          type="checkbox"
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${fieldId}-help` : undefined}
        />
        <span>{label}</span>
      </label>
      {(error || hint) && (
        <p
          id={`${fieldId}-help`}
          className={`field__hint ${error ? 'is-error' : ''}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}
