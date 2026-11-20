import { FileText } from 'lucide-react'
import { Badge } from './Badge'

export function EvidenceCard({
  source,
  location,
  quote,
  label = '매뉴얼',
  note,
  onOpen,
  missingMessage = '등록된 자료에서 근거를 찾지 못했어요. 확인되지 않은 내용입니다.',
}) {
  return (
    <article className="evidence-card">
      <div className="row">
        <FileText size={20} aria-hidden="true" />
        <span className="field__label">자료 근거</span>
        <Badge tone="changed">{label}</Badge>
      </div>
      <h3>{source}</h3>
      <p className="text-muted">{location}</p>
      {quote ? (
        <blockquote>{quote}</blockquote>
      ) : (
        <p className="evidence-card__missing">{missingMessage}</p>
      )}
      {onOpen && (
        <button className="text-button" type="button" onClick={onOpen}>
          원문 위치 확인
        </button>
      )}
      {note && <p className="text-muted">{note}</p>}
    </article>
  )
}
