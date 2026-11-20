import { Link } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { Button, Badge } from '../ui'
import { Menu } from 'lucide-react'
export function WorkFrame({
  title,
  description,
  children,
  aside,
  reservation = false,
}) {
  return (
    <AppLayout
      variant="home"
      className={`workflow-layout ${reservation ? 'workflow-layout--reservation' : ''}`}
      assistant={aside}
    >
      {({ openMenu }) => (
        <div className="workflow-page page-stack">
          <div className="workflow-toolbar">
            <Button
              variant="ghost"
              className="header__menu"
              aria-label="메뉴 열기"
              onClick={openMenu}
            >
              <Menu size={22} />
            </Button>
            <Link to="/">‹ 홈</Link>
          </div>
          <header>
            <h1 id="page-title" tabIndex={-1}>
              {title}
            </h1>
            {description && <p>{description}</p>}
          </header>
          {children}
        </div>
      )}
    </AppLayout>
  )
}
export function WorkEvidence({ baseline, files = [], source, result = false }) {
  return (
    <aside className="workflow-notes" aria-label="업무 기준과 참고 자료">
      <h2>{result ? '다음 업무에서 다시 쓰기' : '검토할 때 참고한 자료'}</h2>
      {files.map((file, index) => (
        <section key={file.id || index}>
          <h3>{file.filename || file.name}</h3>
          {file.example && <p>예시 작업 자료</p>}
        </section>
      ))}
      {baseline?.manual ? (
        <section>
          <h3>{baseline.manual}</h3>
          <p>{baseline.location}</p>
          <p>{baseline.quote}</p>
          <small>예시 기준 자료 / v{baseline.version}</small>
        </section>
      ) : (
        <section>
          <h3>서버 기준 자료</h3>
          {baseline?.materials?.map((material, index) => (
            <p key={material.id || index}>{material.filename}</p>
          ))}
          <p>
            {source
              ? `자료 ID ${source.materialId} / 위치 ${source.page ?? '정보 없음'}`
              : '근거 위치 정보 없음'}
          </p>
          <small>인용 원문은 서버 응답에 없어요.</small>
        </section>
      )}
      {baseline?.pendingQuestion && (
        <section>
          <Badge tone="warning">확인 필요</Badge>
          <p>{baseline.pendingQuestion}</p>
          <small>결과 저장이 이 질문의 확인 완료를 뜻하지 않아요.</small>
        </section>
      )}
      <section className="workflow-record-note">
        <Badge tone="neutral">나만 보는 기록</Badge>
        <p>업무 기준 자료와 이번 작업 기록은 따로 관리해요.</p>
        <small>
          예시 기록은 탭 메모리에 남고 새로고침하면 사라져요. 서버 기록의 권한은
          서버에서 확인해요.
        </small>
      </section>
    </aside>
  )
}
