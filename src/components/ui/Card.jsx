import { useId } from 'react'

export function Card({
  title,
  description,
  action,
  children,
  footer,
  className = '',
  ...props
}) {
  const titleId = useId()
  return (
    <section
      {...props}
      className={`card ${className}`}
      aria-labelledby={title ? titleId : props['aria-labelledby']}
    >
      {(title || action || description) && (
        <header className="card__header">
          <div className="card__heading">
            {title && <h2 id={titleId}>{title}</h2>}
            {description && <p className="text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
      {footer && <footer className="card__footer">{footer}</footer>}
    </section>
  )
}
