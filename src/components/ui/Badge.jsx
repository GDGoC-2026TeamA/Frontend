const labels = {
  neutral: '예시 데이터',
  changed: '변경됨',
  warning: '확인 필요',
  edited: '사용자 수정',
  success: '확인 완료',
  error: '오류',
}
export function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span className={`badge badge--${tone} ${className}`}>
      <span className="badge__dot" aria-hidden="true" />
      {children || labels[tone]}
    </span>
  )
}
