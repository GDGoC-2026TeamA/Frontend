import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { WorkFrame } from '../components/layout/WorkFrame'
import { WorkRegistration } from '../components/home/WorkRegistration'
import { Button, Input, Textarea, StatePanel, Modal } from '../components/ui'
import { loadWorkTask, workMode } from '../services/workService'
import { saveDemoTask } from '../services/demo/taskWorkspace'
import { beginLearningSession } from '../services/learningSessions'
import { scenarioForTask, workScenarios } from '../data/work'

export default function TaskDetailPage() {
  const { taskId } = useParams(),
    [task, setTask] = useState(null),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    loadWorkTask(taskId, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) {
          if (value) setTask(value)
          else setError('업무를 찾을 수 없어요.')
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause.status === 403
              ? '이 업무를 열 수 없어요. 현재 작업 공간의 참여 상태와 업무의 공유 여부를 확인해 주세요.'
              : '업무를 불러오지 못했어요.',
          )
      })
    return () => controller.abort()
  }, [taskId, retry])
  if (!task || String(task.id) !== String(taskId))
    return (
      <WorkFrame title="업무 상세">
        <StatePanel
          type={error ? 'error' : 'loading'}
          title={error || '업무를 불러오고 있어요'}
          actionLabel={error ? '다시 시도' : undefined}
          onAction={() => {
            setError('')
            setRetry((n) => n + 1)
          }}
        />
        <Link to="/tasks">업무 목록 보기</Link>
      </WorkFrame>
    )
  return <TaskEditor key={task.id} task={task} setTask={setTask} />
}
function TaskEditor({ task, setTask }) {
  const navigate = useNavigate(),
    [name, setName] = useState(task.name),
    [description, setDescription] = useState(task.description || ''),
    [message, setMessage] = useState(''),
    [review, setReview] = useState(false)
  const api = workMode() === 'api',
    readOnly = api || task.scope === 'shared',
    scenario = scenarioForTask(task)
  const learn = (record = task) => {
    const session = !api ? beginLearningSession(record) : null
    navigate(`/learn/${encodeURIComponent(record.id)}`, {
      state: { learningSessionId: session?.id },
    })
  }
  const save = () => {
    if (!name.trim()) {
      setMessage('업무 이름을 입력해 주세요.')
      return
    }
    const record = saveDemoTask({
      ...task,
      name: name.trim(),
      description: description.trim(),
    })
    setTask(record)
    setMessage('변경 사항을 저장했어요. 이 탭에서만 유지돼요.')
  }
  return (
    <WorkFrame
      title={task.name}
      description="업무 이름과 설명을 수정하고, 기준 자료를 확인하세요."
    >
      <Link to="/tasks">업무 목록으로</Link>
      <div className="workflow-detail-grid">
        <section className="workflow-card">
          <h2>업무 정보</h2>
          <Input
            label="업무 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={readOnly}
            maxLength={100}
          />
          <Textarea
            label="설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            readOnly={readOnly}
            maxLength={1000}
          />
          <section className="workflow-inset">
            <h3>기준 자료</h3>
            {api
              ? task.materials.map((item, index) => (
                  <p key={item.id || index}>{item.filename}</p>
                ))
              : task.comparison?.materials?.map((item) => (
                  <p key={item.name}>{item.name}</p>
                )) || (
                  <p>
                    {workScenarios[scenario]?.manual || '연결된 기준 자료 없음'}
                  </p>
                )}
            <Button variant="secondary" onClick={() => setReview(true)}>
              기준 자료 다시 검토
            </Button>
          </section>
          {readOnly ? (
            <p>
              {api
                ? '업무 정보 수정 API가 트래커에 없어 서버 저장은 아직 연결하지 않았어요.'
                : '공유받은 기준은 읽기 전용이에요. 등록자가 수정한 자료를 검토한 뒤 공유해야 해요.'}
            </p>
          ) : (
            <div className="workflow-actions">
              <Button
                variant="ghost"
                onClick={() => {
                  setName(task.name)
                  setDescription(task.description || '')
                  setMessage('변경을 취소했어요.')
                }}
              >
                취소
              </Button>
              <Button onClick={save}>변경 사항 저장</Button>
            </div>
          )}
          {message && <p role="status">{message}</p>}
        </section>
        <div className="workflow-detail-actions">
          <section className="workflow-card">
            <h2>실제 업무 시작</h2>
            <p>오늘 처리할 자료를 선택하고 결과를 검토해요.</p>
            <Button
              variant="secondary"
              onClick={() =>
                navigate('/work/input', { state: { taskId: task.id } })
              }
            >
              업무 처리하기
            </Button>
          </section>
          <section className="workflow-card">
            <h2>절차 먼저 익히기</h2>
            <p>바뀐 절차를 확인하고 연습해요.</p>
            <Button variant="secondary" onClick={() => learn()}>
              새 방식 익히기
            </Button>
          </section>
        </div>
      </div>
      {review && !api && task.comparison ? (
        <WorkRegistration
          task={task}
          onClose={() => setReview(false)}
          onLearn={learn}
          onSave={(record) => {
            const saved = saveDemoTask(record)
            setTask(saved)
            return saved
          }}
        />
      ) : (
        <Modal
          open={review}
          onClose={() => setReview(false)}
          title="기준 자료 확인"
          footer={<Button onClick={() => setReview(false)}>돌아가기</Button>}
        >
          <p>
            이 업무의 비교 편집 화면은 아직 연결되지 않았어요. 표시된 업무 기준
            자료를 확인해 주세요.
          </p>
          {api ? (
            task.materials.map((item, index) => (
              <p key={item.id || index}>{item.filename}</p>
            ))
          ) : (
            <p>{workScenarios[scenario]?.manual || '연결된 기준 자료 없음'}</p>
          )}
        </Modal>
      )}
    </WorkFrame>
  )
}
