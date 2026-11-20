import { useEffect, useState } from 'react'
import { Modal, Button } from '../components/ui'
import './workspace.css'

const base = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://gdgoc2026a.up.railway.app/api/v1'
).replace(/\/$/, '')
async function request(path, token, method = 'GET', body) {
  const headers = token ? { Authorization: 'Bearer ' + token } : {}
  if (body && !(body instanceof FormData))
    headers['Content-Type'] = 'application/json'
  const res = await fetch(base + path, {
    method,
    headers,
    body: body instanceof FormData ? body : JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))).detail
    throw Error(
      typeof detail === 'string' ? detail : '입력값과 연결 상태를 확인하세요.',
    )
  }
  return res.status === 204 ? null : res.json()
}

export default function WorkspacePage() {
  const [token, setToken] = useState('')
  const [signup, setSignup] = useState(false)
  const [spaces, setSpaces] = useState([])
  const [space, setSpace] = useState(0)
  const [filter, setFilter] = useState('all')
  const [tasks, setTasks] = useState([])
  const [revision, refresh] = useState(0)
  const [dialog, setDialog] = useState('')
  const [invite, setInvite] = useState('')
  const [task, setTask] = useState(null)
  const [review, setReview] = useState(null)
  const [guide, setGuide] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [result, setResult] = useState(null)
  const [selected, setSelected] = useState([])
  const [answers, setAnswers] = useState({})
  const [personal, setPersonal] = useState(null)
  const [questionResult, setQuestionResult] = useState(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const api = (p, method, body) => request(p, token, method, body)
  const current = spaces.find((s) => s.id === space)
  const run = async (fn) => {
    setBusy(true)
    setNotice('')
    try {
      await fn()
    } catch (e) {
      setNotice(e.message)
    } finally {
      setBusy(false)
    }
  }
  const reset = () => {
    setPersonal(null)
    setQuestionResult(null)
    setTask(null)
    setReview(null)
    setGuide(null)
    setQuiz(null)
    setResult(null)
    setAnswers({})
    setSelected([])
    setInvite('')
    setNotice('')
  }
  const switchSpace = (id) => {
    reset()
    setTasks([])
    setSpace(Number(id))
    setFilter('all')
  }
  const loadSpaces = async (session, target) => {
    const rows = await request('/workspaces', session)
    setSpaces(rows)
    switchSpace(target || rows[0]?.id || 0)
  }
  useEffect(() => {
    let active = true
    if (token && space)
      request('/home?workspaceId=' + space + '&filter=' + filter, token)
        .then((data) => {
          if (active) setTasks(data.tasks)
        })
        .catch((e) => {
          if (active) setNotice(e.message)
        })
    return () => {
      active = false
    }
  }, [token, space, filter, revision])
  const form = (fn) => (e) => {
    e.preventDefault()
    const values = new FormData(e.currentTarget)
    run(() => fn(values))
  }
  const notify = <p role="status">{busy ? '처리 중…' : notice}</p>
  if (!token)
    return (
      <main className="wb-space">
        <h1>WORK BRIDGE</h1>
        <form
          onSubmit={form(async (f) => {
            const values = Object.fromEntries(f)
            if (signup) await request('/accounts', '', 'POST', values)
            const { token: session } = await request(
              '/sessions',
              '',
              'POST',
              values,
            )
            await loadSpaces(session)
            setToken(session)
          })}
        >
          <h2>{signup ? '회원가입' : '로그인'}</h2>
          {signup && (
            <>
              <label>
                이름
                <input name="name" required />
              </label>
              <label>
                이메일
                <input type="email" name="email" required />
              </label>
            </>
          )}
          <label>
            아이디
            <input name="login_id" required />
          </label>
          <label>
            비밀번호
            <input type="password" name="password" required />
          </label>
          <button disabled={busy}>{signup ? '가입하고 시작' : '로그인'}</button>
        </form>
        <button onClick={() => setSignup(!signup)}>
          {signup ? '로그인으로' : '회원가입'}
        </button>
        {notify}
      </main>
    )
  const openGuide = async (t) => {
    reset()
    setTask(t)
    setGuide(await api('/tasks/' + t.id + '/learning-guide'))
  }
  const saveReview = async (share) => {
    await api('/tasks/' + task.id + '/reviews', 'POST', { ...review, share })
    reset()
    refresh((x) => x + 1)
    setNotice(
      share ? '등록자가 검토한 업무를 공유했습니다.' : '검토본을 저장했습니다.',
    )
  }
  return (
    <div className="wb-shell">
      <aside>
        <strong>WORK BRIDGE</strong>
        <div className="wb-switch">
          <label>
            작업 공간
            <select
              disabled={busy}
              value={space}
              onChange={(e) => switchSpace(e.target.value)}
            >
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button disabled={busy} onClick={() => setDialog('회사 공간 만들기')}>
            회사 공간 만들기
          </button>
          <button disabled={busy} onClick={() => setDialog('코드로 참여')}>
            코드로 참여
          </button>
          {current?.kind === 'company' &&
            (current.is_owner ? (
              <button
                onClick={() =>
                  run(async () =>
                    setInvite(
                      (await api('/workspaces/' + space + '/invite')).code,
                    ),
                  )
                }
              >
                초대 코드 보기
              </button>
            ) : (
              <button disabled={busy} onClick={() => setDialog('공간 나가기')}>
                공간 나가기
              </button>
            ))}
          {invite && (
            <>
              <code>{invite}</code>
              <button
                onClick={() => run(() => navigator.clipboard.writeText(invite))}
              >
                코드 복사
              </button>
            </>
          )}
          <button
            onClick={() => {
              reset()
              setToken('')
              setTasks([])
              setSpaces([])
            }}
            disabled={busy}
          >
            로그아웃
          </button>
        </div>
      </aside>
      <main className="wb-space" aria-busy={busy}>
        <h1>{current?.name}</h1>
        {notify}
        <fieldset disabled={busy}>
          <legend>업무 목록</legend>
          <div>
            {[
              ['/me/learning-history', '내 학습·질문 기록'],
              ['/cards', '개인 업무 카드'],
              ['/jobs', '내 작업'],
            ].map(([path, label]) => (
              <button
                key={path}
                onClick={() =>
                  run(async () => {
                    reset()
                    setPersonal({ label, rows: await api(path) })
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
          {personal && (
            <section>
              <h3>{personal.label}</h3>
              {!personal.rows.length && <p>아직 기록이 없습니다.</p>}
              {personal.rows.map((row) => (
                <p key={row.id}>
                  {row.title ||
                    row.name ||
                    (row.kind === 'practice'
                      ? '상황별 연습'
                      : '업무 질문')}{' '}
                  ·{' '}
                  {new Date(row.created_at || row.updated_at).toLocaleString()}
                </p>
              ))}
            </section>
          )}
          <select
            aria-label="업무 필터"
            value={filter}
            onChange={(e) => {
              reset()
              setTasks([])
              setFilter(e.target.value)
            }}
          >
            {[
              ['all', '전체 업무'],
              ['mine', '내가 등록한 업무'],
              ['shared', '공유받은 업무'],
            ].map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
          <button onClick={() => setDialog('새 업무 등록')}>
            새 업무 등록
          </button>
          {tasks.map((t) => (
            <article key={t.id}>
              <h3>{t.name}</h3>
              <p>
                {t.creatorName} · {new Date(t.updatedAt).toLocaleString()}{' '}
                {t.sharedAnalysisId && ' · 등록자 검토 후 공유'}
              </p>
              <button onClick={() => run(() => openGuide(t))}>
                새 방식 익히기
              </button>
              {t.isMine && (
                <>
                  <button
                    onClick={() => {
                      reset()
                      setTask(t)
                      setDialog('자료 분석')
                    }}
                  >
                    자료 분석·검토
                  </button>
                  {t.sharedAnalysisId && (
                    <button
                      onClick={() =>
                        run(async () => {
                          await api('/tasks/' + t.id + '/share', 'DELETE')
                          reset()
                          refresh((x) => x + 1)
                        })
                      }
                    >
                      공유 해제
                    </button>
                  )}
                </>
              )}
            </article>
          ))}
        </fieldset>
        {review && (
          <fieldset disabled={busy}>
            <legend>{task.name} · 분석 확인</legend>
            {review.steps.map((s, i) => {
              const edit = (k, v) =>
                setReview({
                  ...review,
                  steps: review.steps.map((r, n) =>
                    n === i ? { ...r, [k]: v } : r,
                  ),
                })
              return (
                <article key={s.itemId}>
                  <p>
                    {i + 1}. 기존 절차 · {s.before}
                  </p>
                  <label>
                    새 절차
                    <textarea
                      value={s.after}
                      onChange={(e) => edit('after', e.target.value)}
                    />
                  </label>
                  <label>
                    구분
                    <select
                      value={s.change}
                      onChange={(e) => edit('change', e.target.value)}
                    >
                      {['유지', '변경', '신규 확인', '미확인'].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <p>{s.sources.map((x) => x.location).join(' · ')}</p>
                  <label>
                    <input
                      type="checkbox"
                      checked={s.confirmed}
                      onChange={(e) => edit('confirmed', e.target.checked)}
                    />
                    근거 확인
                  </label>
                </article>
              )
            })}
            <button onClick={() => run(() => saveReview(false))}>
              검토본 저장
            </button>
            {current?.kind === 'company' && (
              <button onClick={() => run(() => saveReview(true))}>
                검토 후 공유하기
              </button>
            )}
          </fieldset>
        )}
        {guide && (
          <fieldset disabled={busy}>
            <legend>{task.name} · 새 방식 익히기</legend>
            {current?.kind === 'company' &&
              task.isMine &&
              task.sharedAnalysisId !== guide.analysisId && (
                <button
                  onClick={() =>
                    run(async () => {
                      await api('/tasks/' + task.id + '/share', 'POST', {
                        analysisId: guide.analysisId,
                      })
                      setTask({ ...task, sharedAnalysisId: guide.analysisId })
                      refresh((x) => x + 1)
                      setNotice('검토본을 공유했습니다.')
                    })
                  }
                >
                  이 검토본 공유
                </button>
              )}
            <form
              onSubmit={form(async (f) =>
                setQuestionResult(
                  await api('/tasks/' + task.id + '/questions', 'POST', {
                    question: f.get('question'),
                  }),
                ),
              )}
            >
              <label>
                업무 질문
                <input name="question" required />
              </label>
              <button>질문하기</button>
            </form>
            {questionResult && (
              <p>
                {questionResult.answer}{' '}
                {questionResult.sources.map((s) => s.location).join(' · ')}
              </p>
            )}
            <h3>먼저 익히면 좋은 내용</h3>
            {guide.recommendations.length === 0 && (
              <p>아래 확인된 절차에서 직접 선택하세요.</p>
            )}
            {guide.recommendations.map((r) => (
              <article key={r.itemId}>
                <button
                  onClick={() =>
                    setSelected([...new Set([...selected, r.itemId])])
                  }
                >
                  {guide.steps.find((s) => s.itemId === r.itemId)?.after} 선택
                </button>
                <p>{r.reason}</p>
                <small>{r.sources.map((s) => s.location).join(' · ')}</small>
              </article>
            ))}
            <h3>처리 순서</h3>
            {guide.steps.map((s, i) => (
              <article key={s.itemId}>
                <label>
                  <input
                    type="checkbox"
                    disabled={!s.confirmed}
                    checked={selected.includes(s.itemId)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, s.itemId]
                          : selected.filter((k) => k !== s.itemId),
                      )
                    }
                  />
                  {i + 1}. {s.before} → {s.after}
                </label>
                <p>
                  {s.confirmed ? s.change : '확인 필요'} ·{' '}
                  {s.requiredFields?.join(', ')} {s.caution}
                </p>
                {s.sources?.map((src, j) => (
                  <button
                    key={j}
                    onClick={() =>
                      run(async () => {
                        const { url } = await api(
                          '/tasks/' +
                            task.id +
                            '/materials/' +
                            src.fileId +
                            '/download',
                        )
                        window.open(url, '_blank', 'noopener,noreferrer')
                      })
                    }
                  >
                    {src.location}
                  </button>
                ))}
              </article>
            ))}
            <button
              disabled={!selected.length}
              onClick={() =>
                run(async () => {
                  setQuiz(
                    await api('/tasks/' + task.id + '/practices', 'POST', {
                      analysisId: guide.analysisId,
                      selectedItemIds: selected,
                    }),
                  )
                  setResult(null)
                  setAnswers({})
                })
              }
            >
              선택한 항목 연습
            </button>
            <button onClick={() => setDialog('실제 업무 시작')}>
              실제 업무 시작
            </button>
          </fieldset>
        )}
        {quiz && (
          <fieldset disabled={busy}>
            <legend>상황별 연습</legend>
            <p>{quiz.situation}</p>
            {quiz.questions.map((q, i) => (
              <article key={i}>
                <h3>{q.prompt}</h3>
                {q.choices.map((v, j) => (
                  <label key={j}>
                    <input
                      type="radio"
                      name={'q' + i}
                      checked={answers[i] === j}
                      onChange={() => setAnswers({ ...answers, [i]: j })}
                    />
                    {v}
                  </label>
                ))}
              </article>
            ))}
            <button
              disabled={Object.keys(answers).length !== quiz.questions.length}
              onClick={() =>
                run(async () =>
                  setResult(
                    await api('/practices/' + quiz.id + '/answers', 'POST', {
                      answers: quiz.questions.map((_, i) => answers[i]),
                    }),
                  ),
                )
              }
            >
              결과 확인
            </button>
          </fieldset>
        )}
        {result && (
          <section>
            <h2>학습 결과</h2>
            {result.questions.map((q, i) => (
              <p key={i}>
                {q.choices[q.correct_index]} · {q.explanation} · {q.evidence}
              </p>
            ))}
            {selected.map((id) => (
              <button
                key={id}
                onClick={() =>
                  run(async () => {
                    const title = guide.steps.find((s) => s.itemId === id).after
                    await api('/tasks/' + task.id + '/cards', 'POST', {
                      itemId: id,
                      title,
                      analysisId: guide.analysisId,
                    })
                    setNotice('개인 업무 카드를 저장했습니다.')
                  })
                }
              >
                {guide.steps.find((s) => s.itemId === id).after} 카드 저장
              </button>
            ))}
          </section>
        )}
        {dialog && (
          <Modal open title={dialog} onClose={() => !busy && setDialog('')}>
            <form
              onSubmit={form(async (f) => {
                if (dialog === '회사 공간 만들기' || dialog === '코드로 참여') {
                  const row =
                    dialog === '코드로 참여'
                      ? await api('/workspaces/join', 'POST', {
                          code: f.get('code'),
                        })
                      : await api('/workspaces', 'POST', {
                          name: f.get('name'),
                        })
                  await loadSpaces(token, row.id)
                } else if (dialog === '공간 나가기') {
                  await api('/workspaces/' + space + '/membership', 'DELETE')
                  await loadSpaces(token)
                } else if (dialog === '새 업무 등록') {
                  const target = Number(f.get('space'))
                  await api('/tasks', 'POST', {
                    workspaceId: target,
                    name: f.get('name'),
                  })
                  switchSpace(target)
                  refresh((x) => x + 1)
                } else if (dialog === '실제 업무 시작') {
                  const job = await api('/tasks/' + task.id + '/jobs', 'POST', {
                    analysisId: guide.analysisId,
                    name: f.get('name'),
                  })
                  setNotice('개인 작업 #' + job.id + '을 시작했습니다.')
                } else if (dialog === '자료 분석') {
                  for (const kind of ['previous_form', 'manual']) {
                    const file = f.get(kind)
                    if (file?.size) {
                      const body = new FormData()
                      body.append('kind', kind)
                      body.append('file', file)
                      await api(
                        '/tasks/' + task.id + '/materials',
                        'POST',
                        body,
                      )
                    }
                  }
                  setReview(
                    await api('/tasks/' + task.id + '/analyses', 'POST'),
                  )
                }
                setDialog('')
              })}
            >
              {dialog === '새 업무 등록' && (
                <label>
                  등록할 공간
                  <select name="space" defaultValue={space}>
                    {spaces.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {['새 업무 등록', '실제 업무 시작', '회사 공간 만들기'].includes(
                dialog,
              ) && (
                <label>
                  이름
                  <input name="name" required />
                </label>
              )}
              {dialog === '코드로 참여' && (
                <label>
                  초대 코드
                  <input name="code" required />
                </label>
              )}
              {dialog === '자료 분석' && (
                <>
                  <label>
                    기존 자료
                    <input
                      type="file"
                      name="previous_form"
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                  </label>
                  <label>
                    새 매뉴얼
                    <input
                      type="file"
                      name="manual"
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                  </label>
                </>
              )}
              {dialog === '공간 나가기' && (
                <p>이 회사의 공유 업무를 더 이상 열 수 없습니다.</p>
              )}
              {notify}
              <Button disabled={busy} type="submit">
                {dialog === '자료 분석' ? '분석하기' : dialog}
              </Button>
            </form>
          </Modal>
        )}
      </main>
    </div>
  )
}
