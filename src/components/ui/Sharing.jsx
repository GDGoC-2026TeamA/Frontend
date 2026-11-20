import { UserRound } from 'lucide-react'
import { Badge } from './Badge'

const publication = {
  draft: ['나만 보기', 'blue'],
  published: ['공유됨', 'success'],
  revision: ['새 버전 검토 중', 'blue'],
}

export function RegistrationScope() {
  return (
    <div className="registration-scope">
      <UserRound size={20} aria-hidden="true" />
      <div>
        <strong>내 업무로 등록</strong>
        <p>자료를 검토한 뒤 공유할 수 있어요.</p>
      </div>
    </div>
  )
}

// Presentation only: permission checks and publication belong to the API consumer.
export function PublicationStatus({
  status = 'draft',
  owner,
  version,
  needsReview = false,
}) {
  const [label, tone] = publication[status] || publication.draft
  return (
    <section
      className={`publication-status publication-status--${status}`}
      aria-label="업무 공유 상태"
    >
      <div className="foundation-inline">
        <Badge tone={tone}>{label}</Badge>
        {needsReview && <Badge tone="warning">확인 필요</Badge>}
      </div>
      <p>등록자만 수정할 수 있어요</p>
      <small>
        등록자 {owner || '정보 없음'} / 기준 {version || '정보 없음'}
      </small>
    </section>
  )
}

export function RecordContext({
  scope = 'personal',
  children,
  version,
  analysisId,
}) {
  return (
    <section className="record-context" aria-label="기록 범위">
      <Badge tone={scope === 'shared' ? 'blue' : 'neutral'}>
        {scope === 'shared' ? '공유 기준 자료' : '나만 보는 기록'}
      </Badge>
      <p>{children}</p>
      <small>
        기준 {version || '정보 없음'} / 분석{' '}
        {analysisId ? `#${analysisId}` : '정보 없음'}
      </small>
    </section>
  )
}
