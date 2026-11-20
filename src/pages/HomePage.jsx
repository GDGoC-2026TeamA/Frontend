import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { Header } from '../components/layout/Header'
import { HomeSearch } from '../components/home/HomeSearch'
import { HomeQuickContent } from '../components/home/HomeQuickContent'
import { HomeOnboarding } from '../components/home/HomeOnboarding'
import { WorkTile } from '../components/home/WorkTile'
import { FileText, ArrowRight } from '../components/ui/DesignIcons'
import { Badge, Button, Modal, StatePanel } from '../components/ui'
import { getHomeDashboard } from '../services/homeService'
import { WorkRegistration } from '../components/home/WorkRegistration'
import warningDot from '../assets/home/status-warning.svg?no-inline'
import successDot from '../assets/home/status-success.svg?no-inline'

export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [retry, setRetry] = useState(0)
  const [tour, setTour] = useState(false)
  const [action, setAction] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    getHomeDashboard({ signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason)
      })
    return () => controller.abort()
  }, [retry])
  const openAction = (item, label) =>
    setAction({
      title: label,
      name: item?.name || item?.title,
    })
  const searchSelect = (item) => {
    if (item.type === 'task') openAction(item, '업무 상세')
    else openAction(item, '절차 보기')
  }
  return (
    <AppLayout
      homeAside={<HomeQuickContent data={data} onAction={openAction} />}
      onHomeHelp={() => {
        if (!data) {
          setAction({
            title: '사용 방법',
            description:
              '업무를 불러온 뒤 홈의 위치 안내를 볼 수 있어요. 서버 오류가 있다면 먼저 다시 시도해 주세요.',
          })
          return
        }
        window.scrollTo({ top: 0 })
        setTour(true)
      }}
    >
      {({ openMenu }) => (
        <div className="page-stack home-page">
          <Header
            variant="home"
            onMenu={openMenu}
            title="내 업무"
            description="배우던 업무와 처리하던 작업을 이어서 확인하세요."
            search={<HomeSearch data={data} onSelect={searchSelect} />}
          />
          {!data && !error && (
            <StatePanel type="loading" title="업무를 불러오고 있어요" />
          )}
          {error && (
            <StatePanel
              type="error"
              title="업무를 불러오지 못했어요"
              description={
                '서버 연결을 확인해 주세요.' +
                (error.status ? ' (HTTP ' + error.status + ')' : '')
              }
              actionLabel="다시 시도"
              onAction={() => {
                setError(null)
                setRetry((count) => count + 1)
              }}
            />
          )}
          {data && (
            <>
              <section
                className="home-foundation"
                id="home-registered"
                aria-labelledby="registered-work-title"
              >
                <div className="home-section-heading">
                  <h2 id="registered-work-title">등록된 업무</h2>
                  <div className="row">
                    <Button
                      variant="ghost"
                      onClick={() => openAction(null, '업무 관리')}
                    >
                      업무 관리
                    </Button>
                    <Button onClick={() => navigate('/work/new')}>
                      새 업무 등록
                    </Button>
                  </div>
                </div>
                <div className="home-work-grid">
                  {data.tasks.map((task) => (
                    <WorkTile key={task.id} task={task} onAction={openAction} />
                  ))}
                </div>
                {!data.tasks.length && (
                  <StatePanel
                    title="등록된 업무가 없어요"
                    description="새 업무를 등록하고 기준 자료를 연결하세요."
                  />
                )}
              </section>
              <section
                className="home-recent"
                aria-labelledby="recent-work-title"
              >
                <div className="home-section-heading">
                  <h2 id="recent-work-title">최근 작업</h2>
                  <Link to="/history">전체 보기</Link>
                </div>
                <div className="home-recent__list">
                  {data.recentJobs.map((job) => (
                    <button
                      type="button"
                      className="home-recent__row"
                      key={job.id}
                      onClick={() =>
                        openAction(
                          job,
                          job.status === '결과 저장됨'
                            ? '작업 결과'
                            : '검토 이어하기',
                        )
                      }
                    >
                      <span className="home-small-icon">
                        <FileText size={18} aria-hidden="true" />
                      </span>
                      <span className="home-recent__name">
                        <strong>{job.name}</strong>
                        <small>
                          {job.category ||
                            data.tasks.find((task) => task.id === job.taskId)
                              ?.name ||
                            '등록 업무'}
                        </small>
                      </span>
                      <Badge
                        tone={
                          job.status === '결과 저장됨' ? 'success' : 'warning'
                        }
                        dotIcon={
                          job.status === '결과 저장됨' ? successDot : warningDot
                        }
                      >
                        {job.status || '상태 미확인'}
                      </Badge>
                      <span className="home-recent__date">
                        {job.displayDate || job.date || '날짜 미확인'}
                      </span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </button>
                  ))}
                  {!data.recentJobs.length && (
                    <p className="home-empty">최근 작업이 없어요.</p>
                  )}
                </div>
              </section>
            </>
          )}
          {location.pathname === '/work/new' && (
            <WorkRegistration onClose={() => navigate('/')} />
          )}
          <HomeOnboarding open={tour} onClose={() => setTour(false)} />
          <Modal
            open={!!action}
            onClose={() => setAction(null)}
            title={action?.title || '화면 안내'}
            footer={<Button onClick={() => setAction(null)}>확인</Button>}
          >
            <div className="stack">
              {action?.name && <h3>{action.name}</h3>}
              <p>
                {action?.description ||
                  '이 화면은 다음 차수에 연결할 예정이에요. 지금은 홈, 사용 방법과 검색을 확인할 수 있어요.'}
              </p>
              <p className="text-muted">
                작업이나 카드가 새로 저장되지는 않아요. 서비스 안에서 결과를
                저장해도 외부 재고 시스템 등록이나 예약 확정은 끝나지 않아요.
              </p>
            </div>
          </Modal>
        </div>
      )}
    </AppLayout>
  )
}
