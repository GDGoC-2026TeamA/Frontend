export function PageHeader({ title, description, action, eyebrow }) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
        <h1 tabIndex={-1} id="page-title">
          {title}
        </h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-header__action">{action}</div>}
    </div>
  )
}
