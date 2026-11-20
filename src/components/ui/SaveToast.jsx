export function SaveToast({ children }) {
  return (
    <div className="save-toast" role="status" aria-atomic="true">
      {children}
    </div>
  )
}
