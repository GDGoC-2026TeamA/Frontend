import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import {
  Badge,
  Button,
  LearningChoice,
  LearningRecommendation,
  Modal,
  StatePanel,
  Stepper,
  Textarea,
} from '../components/ui'
import { LearningPanel } from '../components/learning/LearningPanel'
import {
  getDemoLearningTask,
  markDemoLearningComplete,
} from '../services/demo/taskWorkspace'
import {
  beginLearningSession,
  beginSnapshotSession,
  getLearningSession,
  updateLearningSession,
} from '../services/learningSessions'
import {
  gradeLearning,
  learningEvidence,
  learningTopics,
  questionsForTopics,
} from '../services/learningModel'
import { loadApiLearningTask } from '../services/learningService'

const steps = ['바뀐 절차', '상황별 연습', '학습 결과']

export default function LearningRoute() {
  const { taskId } = useParams()
  const location = useLocation()
  return (
    <LearningLoader
      key={`${taskId}:${location.key}`}
      taskId={taskId}
      sessionId={location.state?.learningSessionId || `route-${location.key}`}
      search={location.search}
    />
  )
}

function LearningLoader({ taskId, sessionId, search }) {
  const mode = import.meta.env.VITE_DATA_MODE || 'demo'
  const [retry, setRetry] = useState(0)
  const [loaded, setLoaded] = useState(() => {
    const existing = getLearningSession(sessionId)
    if (existing) return { session: existing }
    if (mode === 'demo')
      return {
        session: beginLearningSession(getDemoLearningTask(taskId), sessionId),
        insufficient: true,
      }
    return {
      loading: mode === 'api',
      error: mode === 'api' ? null : '지원하지 않는 데이터 모드예요.',
    }
  })
  const readySession = loaded.session
  useEffect(() => {
    if (mode !== 'api' || readySession) return
    const controller = new AbortController()
    loadApiLearningTask(taskId, { signal: controller.signal })
      .then((snapshot) => {
        if (!controller.signal.aborted)
          setLoaded({ session: beginSnapshotSession(snapshot, sessionId) })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setLoaded({
            error: `${error.message}${error.status ? ` (HTTP ${error.status})` : ''}`,
          })
      })
    return () => controller.abort()
  }, [mode, readySession, taskId, sessionId, retry])
  if (readySession)
    return (
      <LearningPage
        session={readySession}
        recommendationUnavailable={
          mode === 'demo' &&
          new URLSearchParams(search).get('recommendation') === 'unavailable'
        }
      />
    )
  return (
    <AppLayout variant="home" className="learning-layout">
      <Link to="/">‹ 홈</Link>
      <h1 id="page-title" tabIndex={-1}>
        새 방식 익히기
      </h1>
      {loaded.loading ? (
        <StatePanel type="loading" title="학습 기준을 불러오고 있어요" />
      ) : loaded.error ? (
        <StatePanel
          type="error"
          title="학습 기준을 불러오지 못했어요"
          description={loaded.error}
          actionLabel="다시 시도"
          onAction={() => {
            setLoaded({ loading: true })
            setRetry((value) => value + 1)
          }}
        />
      ) : (
        <StatePanel
          type="insufficient"
          title="학습할 기준 자료가 없어요"
          description="비교할 자료를 등록하고 확인한 업무에서 다시 시작해 주세요."
        />
      )}
      <p>
        <Link to="/tasks">업무 목록으로 돌아가기</Link>
      </p>
    </AppLayout>
  )
}

function LearningPage({ session, recommendationUnavailable }) {
  const { snapshot } = session
  const navigate = useNavigate()
  const [selected, setSelected] = useState(session.selected)
  const [manual, setManual] = useState(session.manual || false)
  const [stage, setStage] = useState(session.stage)
  const [activeQuestion, setActiveQuestion] = useState(session.activeQuestion)
  const [answers, setAnswers] = useState(session.answers)
  const [results, setResults] = useState(session.results)
  const [chat, setChat] = useState(session.chat)
  const [draftQuestion, setDraftQuestion] = useState(session.draftQuestion)
  const [panel, setPanel] = useState({ mode: 'guide' })
  const [compare, setCompare] = useState(false)
  const heading = useRef(null)
  const questions = questionsForTopics(snapshot, selected)
  const question = questions[activeQuestion]
  const score = results?.filter((item) => item.correct).length || 0
  const title =
    stage === 'quiz'
      ? question.title
      : stage === 'result'
        ? '학습 결과'
        : '새 방식 익히기'
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [stage, activeQuestion])
  useEffect(() => {
    updateLearningSession(session.id, {
      selected,
      manual,
      stage,
      activeQuestion,
      answers,
      results,
      chat,
      draftQuestion,
    })
  }, [
    session.id,
    selected,
    manual,
    stage,
    activeQuestion,
    answers,
    results,
    chat,
    draftQuestion,
  ])
  const toggleTopic = (id) =>
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    )
  const choose = (id, type, value) =>
    setAnswers((previous) => {
      const current = previous[id] || { values: [], reason: '' }
      const values =
        type === 'radio'
          ? [value]
          : current.values.includes(value)
            ? current.values.filter((item) => item !== value)
            : [...current.values, value]
      return { ...previous, [id]: { ...current, values } }
    })
  const advance = () => {
    if (!answers[question.id]?.values.length) return
    if (activeQuestion < questions.length - 1)
      setActiveQuestion(activeQuestion + 1)
    else {
      const graded = gradeLearning(questions, answers)
      setResults(graded)
      setStage('result')
      setPanel({ mode: 'guide' })
      if (graded.every((item) => item.correct))
        markDemoLearningComplete(snapshot.taskId, snapshot.version)
    }
  }
  const openEvidence = (evidenceId) =>
    setPanel({
      mode: 'evidence',
      from: 'guide',
      sources: [learningEvidence[evidenceId]],
    })
  const topicChoice = (topic) => (
    <div key={topic.id} className="learning-topic">
      <LearningChoice
        type="checkbox"
        name="learning-topics"
        value={topic.id}
        checked={selected.includes(topic.id)}
        disabled={!snapshot.confirmedTopicIds.includes(topic.id)}
        onChange={() => toggleTopic(topic.id)}
      >
        {topic.title}
      </LearningChoice>
      <button
        type="button"
        className="text-button"
        onClick={() => openEvidence(topic.evidenceId)}
      >
        근거 / 새 재고 시스템 매뉴얼 {topic.id === 'entry' ? '2장' : '3장'}
      </button>
    </div>
  )
  return (
    <AppLayout
      variant="home"
      className="learning-layout"
      assistant={
        <LearningPanel
          snapshot={snapshot}
          stage={stage}
          question={
            question && {
              ...question,
              index: activeQuestion + 1,
              total: questions.length,
            }
          }
          selectedTopics={selected}
          panel={panel}
          setPanel={setPanel}
          chat={chat}
          setChat={setChat}
          draft={draftQuestion}
          setDraft={setDraftQuestion}
        />
      }
    >
      {({ openMenu }) => (
        <div className={`learning-page learning-page--${stage}`}>
          <div className="learning-toolbar">
            <Button
              variant="ghost"
              className="header__menu icon-button"
              aria-label="메뉴 열기"
              onClick={openMenu}
            >
              <Menu size={22} aria-hidden="true" />
            </Button>
            <Link to="/">‹ 홈</Link>
            <Button
              variant="ghost"
              className="learning-mobile-question"
              onClick={() => {
                setPanel({ mode: 'ai' })
                requestAnimationFrame(() =>
                  document.getElementById('learning-question')?.focus(),
                )
              }}
            >
              업무 질문하기
            </Button>
          </div>
          <header>
            <h1 ref={heading} id="page-title" tabIndex={-1}>
              {title}
            </h1>
            <p>
              {stage === 'quiz'
                ? `${snapshot.taskName} / 상황별 연습 ${activeQuestion + 1}/${questions.length}`
                : stage === 'result'
                  ? `${snapshot.taskName} / 답을 고른 이유와 매뉴얼 내용을 확인해요.`
                  : snapshot.mode === 'api'
                    ? '등록한 서버 자료로 업무 질문을 확인해요.'
                    : `${snapshot.taskName}에서 바뀐 순서를 익히고 예시 상황으로 연습해요.`}
            </p>
          </header>
          <Stepper
            steps={steps}
            currentStep={stage === 'select' ? 0 : stage === 'quiz' ? 1 : 2}
          />
          {snapshot.mode === 'api' ? (
            <StatePanel
              type="insufficient"
              title="서버 연습 연결을 확인해 주세요"
              description="복수 선택과 확인된 절차의 출제 계약이 확정되면 연습을 연결할 수 있어요. 업무 질문은 서버에 요청할 수 있어요."
            />
          ) : stage === 'select' ? (
            <>
              {manual ? (
                <section className="learning-practice-card">
                  <h2>익힐 내용을 직접 선택하세요</h2>
                  <p>
                    자료에서 확인된 항목을 골라 주세요. 관련 근거를 읽고 연습을
                    시작할 수 있어요.
                  </p>
                  {[...learningTopics].reverse().map(topicChoice)}
                  <p className="learning-pending-text">
                    미확인 / 수량 차이 승인 담당자. 연습 정답에서 제외돼요.
                  </p>
                </section>
              ) : (
                <>
                  <h2>먼저 익히면 좋은 내용</h2>
                  {recommendationUnavailable ? (
                    <LearningRecommendation
                      unavailable
                      onChooseManually={() => setManual(true)}
                    />
                  ) : snapshot.confirmedTopicIds.includes('exception') ? (
                    <LearningRecommendation
                      title={learningTopics[0].title}
                      reason={learningTopics[0].reason}
                      evidence="새 재고 시스템 매뉴얼 3장"
                      selected={selected.includes('exception')}
                      onChange={() => toggleTopic('exception')}
                      choiceType="checkbox"
                      value="exception"
                    />
                  ) : (
                    <StatePanel
                      type="insufficient"
                      title="수정한 절차는 근거 대조가 필요해요"
                      description="입력한 문구를 자동으로 정답으로 만들지 않아요. 자료에서 확인된 다른 절차를 직접 선택해 주세요."
                      actionLabel="직접 선택하기"
                      onAction={() => setManual(true)}
                    />
                  )}
                  <p>다른 확인된 절차도 선택할 수 있어요.</p>
                  {topicChoice(learningTopics[1])}
                  {!recommendationUnavailable &&
                    snapshot.confirmedTopicIds.includes('exception') && (
                      <Button variant="ghost" onClick={() => setManual(true)}>
                        직접 선택하기
                      </Button>
                    )}
                </>
              )}
              <div className="learning-actions">
                <Button variant="ghost" onClick={() => setCompare(true)}>
                  비교 내용 보기
                </Button>
                <Button
                  disabled={!questions.length}
                  onClick={() => {
                    setStage('quiz')
                    setActiveQuestion(0)
                    setResults(null)
                    setPanel({ mode: 'guide' })
                  }}
                >
                  {questions.length
                    ? `선택한 항목 ${selected.length}개 연습하기`
                    : '항목을 선택해 주세요'}
                </Button>
              </div>
            </>
          ) : stage === 'quiz' ? (
            <>
              <section className="learning-practice-card">
                <fieldset>
                  <legend>{question.question}</legend>
                  {question.options.map((option) => (
                    <LearningChoice
                      key={option.id}
                      type={question.type}
                      name={`question-${question.id}`}
                      value={option.id}
                      checked={(answers[question.id]?.values || []).includes(
                        option.id,
                      )}
                      onChange={() =>
                        choose(question.id, question.type, option.id)
                      }
                    >
                      {option.label}
                    </LearningChoice>
                  ))}
                </fieldset>
                <details>
                  <summary>선택한 이유 남기기 (선택)</summary>
                  <Textarea
                    label="선택한 이유"
                    rows={2}
                    maxLength={1000}
                    value={answers[question.id]?.reason || ''}
                    onChange={(event) =>
                      setAnswers((previous) => ({
                        ...previous,
                        [question.id]: {
                          ...previous[question.id],
                          values: previous[question.id]?.values || [],
                          reason: event.target.value,
                        },
                      }))
                    }
                  />
                </details>
              </section>
              <div className="learning-actions">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (activeQuestion > 0)
                      setActiveQuestion(activeQuestion - 1)
                    else setStage('select')
                  }}
                >
                  {activeQuestion ? '이전 문제' : '학습으로 돌아가기'}
                </Button>
                <Button
                  disabled={!answers[question.id]?.values.length}
                  onClick={advance}
                >
                  {activeQuestion === questions.length - 1
                    ? '결과 확인'
                    : '다음 문제'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <section className="learning-result-summary" role="status">
                <div className="foundation-inline">
                  <h2>
                    {questions.length}문제 중 {score}문제 정답
                  </h2>
                  <Badge
                    tone={score === questions.length ? 'success' : 'warning'}
                  >
                    {score === questions.length ? '학습 완료' : '다시 확인'}
                  </Badge>
                </div>
                <p>
                  실제 업무에서도 품목 코드부터 확인하고 전표와 실제 수량을
                  대조해요.
                </p>
                <p className="learning-pending-text">
                  승인 담당자는 아직 확인이 필요해요. 학습 정답에서 제외했어요.
                </p>
              </section>
              {results.map((result, index) => (
                <section
                  key={result.questionId}
                  className="learning-practice-card"
                >
                  <div className="foundation-inline">
                    <h2>
                      {String(index + 1).padStart(2, '0')} /{' '}
                      {questions[index].title}
                    </h2>
                    <Badge tone={result.correct ? 'success' : 'warning'}>
                      {result.correct ? '정답' : '다시 확인'}
                    </Badge>
                  </div>
                  <p>
                    선택한 답 /{' '}
                    {questions[index].options
                      .filter((option) => result.values.includes(option.id))
                      .map((option) => option.label)
                      .join(', ')}
                  </p>
                  {result.reason && <p>선택한 이유 / {result.reason}</p>}
                  <p>{result.explanation}</p>
                  <Button
                    variant="ghost"
                    onClick={() => openEvidence(result.evidenceId)}
                  >
                    매뉴얼 근거 보기
                  </Button>
                </section>
              ))}
              <div className="learning-actions">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAnswers({})
                    setResults(null)
                    setActiveQuestion(0)
                    setStage('quiz')
                    setPanel({ mode: 'guide' })
                  }}
                >
                  다시 연습하기
                </Button>
                <Button
                  onClick={() =>
                    navigate('/work/input', {
                      state: { learningContext: snapshot },
                    })
                  }
                >
                  업무 처리하기
                </Button>
              </div>
            </>
          )}
          <p className="learning-mode-note">
            {snapshot.mode === 'demo'
              ? '예시 학습입니다. 선택한 항목만 출제하며, 답안과 대화는 이 탭에서만 유지되고 새로고침하면 사라져요.'
              : '서버 데이터입니다. 질문 오류를 예시 답변으로 바꾸지 않아요.'}
          </p>
          <Modal
            open={compare}
            onClose={() => setCompare(false)}
            title="사용한 기준 자료 비교"
            className="registration-modal registration-modal--wide"
            footer={
              <Button onClick={() => setCompare(false)}>
                학습으로 돌아가기
              </Button>
            }
          >
            <div className="registration-stack">
              <Badge>기준 v{snapshot.version}</Badge>
              {snapshot.comparison?.rows.map((row) => (
                <section className="registration-card" key={row.title}>
                  <h3>{row.title}</h3>
                  <div className="registration-fields">
                    <div>
                      <h4>기존 방식</h4>
                      <p>{row.before}</p>
                    </div>
                    <div>
                      <h4>새 방식</h4>
                      <p>{row.after}</p>
                    </div>
                  </div>
                </section>
              ))}
              <div className="registration-warning">
                <Badge tone="warning">확인 필요</Badge>
                <p>{snapshot.pendingQuestion}</p>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </AppLayout>
  )
}
