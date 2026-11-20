import {
  CircleAlert,
  FileText,
  History,
  Layers,
  LoaderCircle,
  Search,
} from 'lucide-react'

const icons = {
  loading: LoaderCircle,
  error: CircleAlert,
  file: FileText,
  cards: Layers,
  history: History,
  search: Search,
}

export function StatusIcon({ type = 'file' }) {
  const Icon = icons[type] || FileText
  return (
    <span className={`status-icon status-icon--${type}`} aria-hidden="true">
      <Icon size={32} className={type === 'loading' ? 'spinner' : undefined} />
    </span>
  )
}
