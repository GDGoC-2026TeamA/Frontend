import { LoaderCircle } from 'lucide-react'

export function Button({
  children,
  variant = 'primary',
  loading = false,
  loadingLabel = '처리 중',
  disabled,
  icon,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      className={`button button--${variant} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <LoaderCircle size={18} className="spinner" aria-hidden="true" />
      ) : (
        icon
      )}
      {loading ? loadingLabel : children}
    </button>
  )
}
