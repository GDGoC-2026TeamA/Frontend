import { MessageCircle } from 'lucide-react'
import { Badge, Button, EvidenceCard } from '../ui'

// Slot-ready shell. The owning page supplies business context and future chat UI.
export function AssistantPanel({ workName, evidence, children, onClose }) {
  return (
    <aside className="assistant-panel" aria-label="업무 도우미">
      <header className="assistant-panel__header">
        <MessageCircle size={22} aria-hidden="true" />
        <h2>업무 도우미</h2>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
        )}
      </header>
      <p className="text-muted">
        {workName
          ? `${workName}에 등록된 자료를 확인해요.`
          : '업무를 선택하면 등록된 자료를 확인할 수 있어요.'}
      </p>
      <div className="assistant-panel__notice">
        <Badge>화면 구조 예시</Badge>
        <p>
          질문과 답변은 다음 작업에서 연결됩니다. 답변에는 자료명, 위치와 관련
          문장이 함께 표시됩니다.
        </p>
      </div>
      {children}
      {evidence && <EvidenceCard {...evidence} />}
    </aside>
  )
}
