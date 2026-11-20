import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { Header } from '../components/layout/Header'
import { HomeSearch } from '../components/home/HomeSearch'
import { HomeOverview } from '../components/home/HomeOverview'
import { HomeOnboarding } from '../components/home/HomeOnboarding'
import { useAccount } from '../services/accountService'
import { GuideDialog } from '../components/ui/GuideDialog'
import { TaskManagementDialog } from '../components/home/TaskManagementDialog'
import { WorkTile } from '../components/home/WorkTile'
import { WorkRegistration } from '../components/home/WorkRegistration'
import { FileText, ArrowRight } from '../components/ui/DesignIcons'
import { Badge, Button, Modal, StatePanel, SaveToast } from '../components/ui'
import { getHomeDashboard } from '../services/homeService'
import { beginLearningSession } from '../services/learningSessions'
import { useDemoWork } from '../services/demo/workWorkspace'
import {
  useDemoTasks,
  saveDemoTask,
  sharedTaskView,
} from '../services/demo/taskWorkspace'
import warningDot from '../assets/home/status-warning.svg?no-inline'
import successDot from '../assets/home/status-success.svg?no-inline'

const filters = [
  ['all', '최근 등록'],
  ['owned', '내가 등록한 업무'],
  ['shared', '공유받은 업무'],
]

export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [remoteData, setRemoteData] = useState(null)
  const [error, setError] = useState(null)
  const [retry, setRetry] = useState(0)
  const [tour, setTour] = useState(false)
  const [action, setAction] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)
  const account = useAccount()
  const firstSaved = useRef(false)
  const [firstGuide, setFirstGuide] = useState(false)
  const [management, setManagement] = useState(null)
  const [notice, setNotice] = useState('')
  const demoTasks = useDemoTasks()
  const demoWork = useDemoWork()
  const data =
    remoteData &&
    (remoteData.source === 'demo'
      ? {
          ...remoteData,
          tasks: demoTasks,
          recentJobs: demoWork.jobs,
          resumeJobs: demoWork.jobs.filter((job) => job.stage !== 'result'),
          recentCards: demoWork.cards,
        }
      : remoteData)
  const listOnly = location.pathname === '/tasks'
  const filteredTasks =
    data?.tasks.filter((task) => filter === 'all' || task.scope === filter) ||
    []
  useEffect(() => {
    const controller = new AbortController()
    getHomeDashboard({ signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setRemoteData(result)
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason)
      })
    return () => controller.abort()
  }, [retry])
  const openAction = (item, label) => {
    if (['이름과 설명 수정', '공유 설정', '업무 삭제'].includes(label)) {
      setManagement({ task: item, action: label })
      return
    }
    if (label === '자료 교체와 비교 내용 재검토')
      label =
        item.publication === 'published' ? '새 버전 검토' : '비교 내용 확인'
    if (label === '업무 정보 보기') label = '공유 업무 확인'
    if (label === '새 방식 익히기') {
      const session =
        data?.source === 'demo' ? beginLearningSession(item) : null
      navigate(
        '/learn/' +
          encodeURIComponent(session?.snapshot.taskId || item?.id || 'missing'),
        { state: { learningSessionId: session?.id } },
      )
      return
    }
    if (label === '업무 처리하기') {
      navigate('/work/input', { state: { taskId: item?.id } })
      return
    }
    if (['작업 결과', '검토 이어하기'].includes(label)) {
      navigate(`/jobs/${encodeURIComponent(item.id)}`)
      return
    }
    if (label === '절차 보기') {
      navigate(`/work-cards/${encodeURIComponent(item.id)}`)
      return
    }
    if (
      [
        '업무 상세',
        '공유 업무 확인',
        '비교 내용 확인',
        '새 버전 검토',
      ].includes(label) &&
      data?.source === 'demo'
    ) {
      setSelectedTask({ ...item, startRevision: label === '새 버전 검토' })
      return
    }
    setAction({
      title: label,
      name: item?.name || item?.title,
      description:
        label === '새 방식 익히기'
          ? '학습과 상황별 연습은 3차 섹션에서 연결합니다. 확인 필요 항목은 연습 정답에 포함하지 않아요.'
          : undefined,
    })
  }
  const closeRegistration = () => {
    if (firstSaved.current) {
      firstSaved.current = false
      setFirstGuide(true)
    }
    setSelectedTask(null)
    if (location.pathname === '/work/new') navigate('/')
  }
  return (
    <AppLayout
      variant="home"
      onHomeHelp={() => {
        if (!data) {
          setAction({
            title: '사용 방법',
            description:
              '업무를 불러온 뒤 홈의 위치 안내를 볼 수 있어요. 서버 오류가 있다면 먼저 다시 시도해 주세요.',
          })
          return
        }
        if (listOnly) navigate('/')
        window.scrollTo({ top: 0 })
        setTour(true)
      }}
    >
      {({ openMenu }) => (
        <div
          className={`page-stack home-page ${listOnly ? 'workflow-task-list' : ''}`}
        >
          <Header
            variant="home"
            onMenu={openMenu}
            title={listOnly ? '업무 목록' : '홈'}
            description={
              listOnly
                ? '등록한 업무를 고르세요. 카드에서 업무 정보를 수정하거나, 학습과 실제 업무를 시작할 수 있어요.'
                : '배우던 업무와 처리하던 작업을 이어서 확인하세요.'
            }
            search={
              <HomeSearch
                data={data}
                onSelect={(item) =>
                  openAction(
                    item,
                    item.type === 'task' ? '업무 상세' : '절차 보기',
                  )
                }
              />
            }
            action={
              <Button onClick={() => navigate('/work/new')}>
                새 업무 등록
              </Button>
            }
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
                (error.status ? ` (HTTP ${error.status})` : '')
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
              {!listOnly && <HomeOverview data={data} onAction={openAction} />}
              <section
                className="home-foundation"
                id="home-registered"
                aria-labelledby="registered-work-title"
              >
                <h2 id="registered-work-title" tabIndex={-1}>
                  {listOnly
                    ? `등록된 업무 ${filteredTasks.length}개`
                    : '등록된 업무'}
                </h2>
                <div className="home-section-heading">
                  <div
                    className="home-task-filters"
                    role="group"
                    aria-label="등록된 업무 범위"
                  >
                    {filters.map(([key, label]) => (
                      <button
                        type="button"
                        key={key}
                        aria-pressed={filter === key}
                        onClick={() => setFilter(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    className="icon-button"
                    aria-label="업무 추가"
                    onClick={() => navigate('/work/new')}
                  >
                    +
                  </Button>
                </div>
                <div className="home-work-grid">
                  {filteredTasks.map((task) => (
                    <WorkTile
                      key={task.id}
                      task={task}
                      onAction={openAction}
                      onOpen={
                        listOnly
                          ? () =>
                              navigate(`/tasks/${encodeURIComponent(task.id)}`)
                          : undefined
                      }
                    />
                  ))}
                </div>
                {!filteredTasks.length && (
                  <StatePanel
                    title={
                      filter === 'shared'
                        ? '공유받은 업무가 없어요'
                        : filter === 'owned'
                          ? '내가 등록한 업무가 없어요'
                          : data.source === 'demo' && !data.tasks.length
                            ? '첫 업무를 등록해 보세요'
                            : '등록된 업무가 없어요'
                    }
                    description="전에 쓰던 양식과 새 시스템 매뉴얼을 올리면, 달라진 절차를 한눈에 볼 수 있어요."
                    actionLabel="첫 업무 등록하기"
                    onAction={() => navigate('/work/new')}
                  />
                )}
              </section>
              {!listOnly && (
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
                            job.status === '결과 저장됨'
                              ? successDot
                              : warningDot
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
              )}
              <p className="home-data-notice">
                <Badge>
                  {data.source === 'api' ? '서버 데이터' : '예시 데이터'}
                </Badge>
                <span>
                  {data.source === 'api'
                    ? '서버에서 조회한 업무와 기록이에요.'
                    : '화면의 업무와 기록은 예시 데이터예요.'}
                </span>
                {data.source === 'demo' && (
                  <span>
                    예시 저장과 공유는 이 탭에서만 유지되며 새로고침하면
                    초기화돼요.
                  </span>
                )}
              </p>
            </>
          )}
          <SaveToast>{notice}</SaveToast>
          {(location.pathname === '/work/new' || selectedTask) && (
            <WorkRegistration
              key={
                selectedTask
                  ? `${selectedTask.id}-${selectedTask.scope}`
                  : 'new'
              }
              task={selectedTask}
              onClose={closeRegistration}
              onLearn={(record) => openAction(record, '새 방식 익히기')}
              onSave={(record) => {
                const saved = saveDemoTask({
                  ...record,
                  owner: record.id
                    ? record.owner
                    : account.user?.name || '이서연',
                })
                if (!data.tasks.length) firstSaved.current = true
                setNotice(
                  '예시 업무를 이 탭에 저장했어요. 서버에는 저장하지 않았어요.',
                )
                return saved
              }}
              onShowShared={(record) => {
                setSelectedTask(sharedTaskView(record))
                setFilter('shared')
              }}
            />
          )}
          <TaskManagementDialogSlot
            management={management}
            apiMode={data?.source === 'api'}
            onClose={() => setManagement(null)}
            onReview={(task) => {
              setManagement(null)
              setSelectedTask(task)
            }}
            onSaved={setNotice}
          />
          <GuideDialog
            variant="first-task"
            open={firstGuide}
            onClose={() => setFirstGuide(false)}
            targets={['home-registered']}
          />
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
                  '이 화면은 다음 차수에 연결할 예정이에요. 현재는 홈, 등록, 비교와 공유 예시를 확인할 수 있어요.'}
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

function TaskManagementDialogSlot({ management, ...props }) {
  return management ? (
    <TaskManagementDialog
      key={`${management.task.id}-${management.action}`}
      {...management}
      {...props}
    />
  ) : null
}
