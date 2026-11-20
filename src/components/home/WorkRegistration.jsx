import { useEffect, useRef, useState } from 'react'
import { FileText, LoaderCircle, CircleAlert } from 'lucide-react'
import {
  Badge,
  Button,
  FileUpload,
  Input,
  Modal,
  Stepper,
  Textarea,
  Checkbox,
} from '../ui'
import { StatusIcon } from '../ui/StatusIcon'
import { registrationExample as example } from '../../data/registration'
import { analyzeRegistrationExample } from '../../services/registrationService'
import { dataMode } from '../../services/config'

const steps = ['업무 등록', '자료 분석', '비교 내용 확인']
const descriptions = {
  register: '기존 자료와 새 시스템 매뉴얼을 올려 바뀐 절차를 비교해요.',
  analyzing:
    '기존 양식과 새 매뉴얼에서 같은 업무에 해당하는 절차를 찾고 있어요.',
  compare: '자료에서 찾은 변경 사항을 읽고 확인이 필요한 항목을 정리해요.',
  edit: '자료로 확인한 내용과 담당자에게 물어볼 내용을 나눠 적어요.',
  revised: '수정한 절차와 현장에서 확인할 항목을 다시 확인해요.',
}

export function WorkRegistration({
  onClose,
  task,
  onSave,
  onShowShared,
  onLearn,
}) {
  const readOnly = task?.scope === 'shared'
  const [personalOnly, setPersonalOnly] = useState(task?.personalOnly || false)
  const [record, setRecord] = useState(task || null)
  const [revision, setRevision] = useState(
    Boolean(task?.startRevision || task?.draft),
  )
  const [shareOpen, setShareOpen] = useState(false)
  const [shared, setShared] = useState(
    Boolean(
      task?.publication === 'published' &&
      !task?.draft &&
      !task?.startRevision &&
      !readOnly,
    ),
  )
  const baselineVersion = record?.version || 1
  const revisionVersion = baselineVersion + 1
  const currentVersion = revision ? revisionVersion : baselineVersion
  const [stage, setStage] = useState(
    task?.comparison
      ? task.startRevision
        ? 'edit'
        : task.saved && !readOnly
          ? 'revised'
          : 'compare'
      : 'register',
  )
  const [name, setName] = useState(task?.name || '')
  const [description, setDescription] = useState(task?.description || '')
  const [files, setFiles] = useState([[], []])
  const [sample, setSample] = useState(Boolean(task?.comparison))
  const [result, setResult] = useState(task?.comparison || null)
  const [error, setError] = useState('')
  const [procedure, setProcedure] = useState(
    task?.draft?.procedure || task?.saved?.procedure || example.procedure,
  )
  const [question, setQuestion] = useState(
    task?.draft?.question || task?.saved?.question || example.question,
  )
  const [saved, setSaved] = useState(task?.draft || task?.saved || null)
  const controller = useRef(null)
  const heading = useRef(null)
  const apiMode = dataMode !== 'demo'
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [stage])
  const changeStage = (next) => {
    controller.current?.abort()
    setError('')
    setStage(next)
  }
  const fillExample = () => {
    controller.current?.abort()
    if (!task?.comparison) setRecord(null)
    setShared(false)
    setName(example.name)
    setDescription(example.description)
    setFiles(
      example.materials.map((material) => [
        { ...material, size: 0, example: true },
      ]),
    )
    setSample(true)
    setResult(null)
    setSaved(null)
    setProcedure(example.procedure)
    setQuestion(example.question)
    setError('')
  }
  const selectFiles = (index, selected) => {
    setFiles((previous) =>
      previous.map((group, i) => (i === index ? selected : group)),
    )
    setSample(false)
    setResult(null)
    setSaved(null)
    setError('')
  }
  const analyze = async () => {
    if (!name.trim() || !files.every((group) => group.length)) {
      setError(
        '업무 이름과 기존 업무 자료, 새 시스템 매뉴얼을 모두 입력해 주세요.',
      )
      return
    }
    if (!sample) {
      setError(
        '선택한 파일의 문서 분석은 아직 연결되지 않았어요. 예시 자료 채우기로 비교 흐름을 확인해 주세요.',
      )
      return
    }
    setError('')
    setStage('analyzing')
    const request = new AbortController()
    controller.current = request
    try {
      const data = await analyzeRegistrationExample({ signal: request.signal })
      if (!request.signal.aborted) {
        setResult(data)
        setStage('compare')
      }
    } catch (reason) {
      if (reason.name !== 'AbortError') {
        setError('예시를 불러오지 못했어요. 다시 시도해 주세요.')
        setStage('register')
      }
    }
  }
  const buildRecord = (changes = {}) => ({
    ...record,
    name: name.trim(),
    description: description.trim(),
    scope: 'owned',
    owner: '이서연',
    personalOnly,
    publication: record?.publication || 'draft',
    version: baselineVersion,
    artwork: record?.artwork || 'inventory',
    learningStatus: record?.learningStatus || '학습 전',
    comparison: result,
    saved,
    ...changes,
  })
  const savePrivate = () => {
    if (readOnly || apiMode || !onSave) return
    const next = onSave(
      buildRecord({ personalOnly: true, publication: 'draft' }),
    )
    setRecord(next)
    onClose()
  }
  const startEdit = () => {
    if (readOnly) return
    setShared(false)
    if (record?.publication === 'published') setRevision(true)
    changeStage('edit')
  }
  const publish = () => {
    if (readOnly || apiMode || !saved || !onSave) return
    const next = onSave(
      buildRecord({
        version: currentVersion,
        publication: 'published',
        personalOnly: false,
        publishedSnapshot: {
          version: currentVersion,
          comparison: structuredClone(result),
          analysisId: `demo-analysis-${currentVersion}`,
          ...saved,
        },
        draft: null,
        history: [
          ...(record?.history || []),
          ...(record?.publishedSnapshot
            ? [structuredClone(record.publishedSnapshot)]
            : []),
        ],
      }),
    )
    setRecord(next)
    setRevision(false)
    setShared(true)
    setShareOpen(false)
  }
  const saveEdit = () => {
    if (readOnly) return
    if (!procedure.trim() || !question.trim()) {
      setError('확인한 절차와 추가로 확인할 내용을 모두 적어 주세요.')
      return
    }
    const next = { procedure: procedure.trim(), question: question.trim() }
    setSaved(next)
    if (onSave && !apiMode && !personalOnly) {
      const updated = onSave(
        buildRecord(revision ? { draft: next } : { saved: next }),
      )
      setRecord(updated)
    }
    changeStage('revised')
  }
  const missingManual =
    stage === 'register' && files[0].length > 0 && !files[1].length
  const wide = ['compare', 'edit', 'revised'].includes(stage)
  const warning = (
    <div className="registration-warning">
      <Badge tone="warning">현장 확인 필요 1개</Badge>
      <strong>수량 차이 승인 담당자가 자료에 없어요.</strong>
      <p>
        승인 담당자에 관한 질문을 남겨 두세요. 아래 항목은 수정 뒤에도 확인이
        필요해요.
      </p>
    </div>
  )
  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={readOnly ? '공유 업무 확인' : '새 업무 등록'}
        closeLabel="닫기"
        className={`registration-modal ${wide ? 'registration-modal--wide' : ''}`}
        footer={
          <>
            {stage === 'register' && (
              <>
                <Button
                  variant="ghost"
                  onClick={sample ? onClose : fillExample}
                  disabled={apiMode}
                >
                  {sample ? '취소' : '예시 자료 채우기'}
                </Button>
                <Button
                  onClick={analyze}
                  disabled={
                    apiMode ||
                    !name.trim() ||
                    !files.every((group) => group.length)
                  }
                >
                  자료 분석하기
                </Button>
              </>
            )}
            {stage === 'analyzing' && (
              <>
                <Button variant="ghost" onClick={() => changeStage('register')}>
                  등록 화면으로
                </Button>
                <Button disabled loading loadingLabel="분석 중">
                  비교 예시 보기
                </Button>
              </>
            )}
            {stage === 'compare' && (
              <>
                {!readOnly ? (
                  <Button
                    variant="ghost"
                    onClick={() => changeStage('register')}
                  >
                    자료 다시 올리기
                  </Button>
                ) : (
                  <span>기준 v{currentVersion} / 읽기 전용</span>
                )}
                <Button
                  onClick={() => onLearn?.(readOnly ? task : buildRecord())}
                >
                  새 방식 익히기
                </Button>
              </>
            )}
            {stage === 'edit' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => changeStage(saved ? 'revised' : 'compare')}
                >
                  비교로 돌아가기
                </Button>
                <Button onClick={saveEdit}>수정 내용 확인</Button>
              </>
            )}
            {stage === 'revised' && (
              <>
                <Button variant="ghost" onClick={startEdit}>
                  내용 다시 수정
                </Button>
                <Button
                  onClick={() => onLearn?.(readOnly ? task : buildRecord())}
                >
                  새 방식 익히기
                </Button>
              </>
            )}
            {stage === 'revised' &&
              !readOnly &&
              (shared ? (
                <Button
                  variant="secondary"
                  onClick={() => onShowShared?.(record)}
                >
                  공유받은 업무 보기
                </Button>
              ) : personalOnly ? (
                <Button variant="secondary" onClick={savePrivate}>
                  개인 업무 저장하기
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setShareOpen(true)}>
                  {revision ? '수정본 공유하기' : '검토 후 공유하기'}
                </Button>
              ))}
          </>
        }
      >
        <div className="registration-stack">
          <p ref={heading} tabIndex={-1} className="registration-description">
            {readOnly
              ? `${task.owner}가 검토한 기준 v${currentVersion}을 읽고, 나의 학습이나 작업을 시작하세요.`
              : shared
                ? `기준 v${currentVersion}을 공유했어요. 미확인 항목은 확인 필요 상태로 남아 있어요.`
                : descriptions[stage]}
          </p>
          <Stepper
            steps={steps}
            currentStep={
              stage === 'register' ? 0 : stage === 'analyzing' ? 1 : 2
            }
          />
          {apiMode ? (
            <p role="status" className="registration-warning">
              실제 업무 등록과 파일 분석은 아직 연결되지 않았어요. 예시 흐름은
              예시 모드를 선택한 뒤 확인해 주세요.
            </p>
          ) : (
            <p className="registration-demo">
              예시 모드: 파일을 서버로 보내지 않아요. 분석 결과는 피그마
              예시이며, 저장한 예시 업무는 이 탭에서만 유지되며 새로고침하면
              사라져요.
            </p>
          )}
          {error && (
            <p role="alert" className="registration-error">
              {error}
            </p>
          )}
          {stage === 'register' && (
            <>
              <div className="registration-scope">
                <div>
                  <strong>
                    {personalOnly ? '개인 작업 공간에 등록' : '내 업무로 등록'}
                  </strong>
                  <p>
                    {personalOnly
                      ? '내가 등록한 자료와 절차를 나만 확인해요.'
                      : '자료를 검토한 뒤 공유할 수 있어요.'}
                  </p>
                  <Checkbox
                    label="개인 작업 공간에만 보관"
                    disabled={record?.publication === 'published'}
                    checked={personalOnly}
                    onChange={(event) => setPersonalOnly(event.target.checked)}
                  />
                </div>
              </div>
              <section className="registration-stack">
                <h3>업무 정보</h3>
                <div className="registration-fields">
                  <Input
                    label="업무 이름"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 재고 입고 기록"
                    hint="홈에서 쉽게 찾을 수 있는 이름을 적어요."
                  />
                  <Input
                    label="업무 설명"
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="어떤 업무인지 적어 주세요."
                    hint="어떤 자료로 무엇을 처리하는지 짧게 적어 주세요."
                  />
                </div>
              </section>
              <section className="registration-stack">
                <h3>비교할 자료</h3>
                <div
                  className={
                    files.every((group) => group.length)
                      ? 'registration-stack'
                      : 'registration-fields'
                  }
                >
                  {example.materials.map((material, index) => (
                    <div
                      key={material.kind}
                      className={
                        index === 1 && missingManual
                          ? 'registration-missing'
                          : undefined
                      }
                    >
                      {files[index].length ? (
                        <>
                          <h4>{material.kind}</h4>
                          {files[index].map((file, i) => (
                            <div
                              className="registration-file"
                              key={file.name + i}
                            >
                              <FileText size={24} aria-hidden="true" />
                              <span>
                                <strong>{file.name}</strong>
                                <small>
                                  {file.example
                                    ? '비교 예시 자료'
                                    : '선택됨 / 서버 전송 전'}
                                </small>
                              </span>
                              <Button
                                variant="ghost"
                                aria-label={`${file.name} 삭제`}
                                onClick={() =>
                                  selectFiles(
                                    index,
                                    files[index].filter((_, n) => n !== i),
                                  )
                                }
                              >
                                삭제
                              </Button>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          {index === 1 && missingManual && (
                            <div
                              className="registration-missing__notice"
                              role="alert"
                            >
                              <StatusIcon type="file" />
                              <h4>새 시스템 매뉴얼이 빠졌어요</h4>
                              <p>
                                기존 양식과 비교할 새 매뉴얼을 추가해 주세요.
                              </p>
                            </div>
                          )}
                          <FileUpload
                            label={material.kind}
                            files={files[index]}
                            onChange={(selected) =>
                              selectFiles(index, selected)
                            }
                            buttonLabel={
                              index === 1 && missingManual
                                ? '매뉴얼 선택하기'
                                : undefined
                            }
                            multiple
                            accept=".pdf,.xlsx,.csv,.docx,.txt,.png,.jpg,.jpeg"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
          {stage === 'analyzing' && (
            <>
              <div className="registration-loading" role="status">
                <LoaderCircle
                  size={44}
                  className="spinner"
                  aria-hidden="true"
                />
                <h3>업무 절차를 비교하고 있어요</h3>
                <p>분석이 끝나면 변경 사항을 확인할 수 있어요.</p>
                <Badge>예시 분석 중</Badge>
              </div>
              <section className="registration-note">
                <h3>분석에서 확인하는 내용</h3>
                <p>기존 자료의 입력 항목과 새 시스템에서 필요한 항목</p>
                <p>달라진 처리 순서와 두 자료만으로 확인하기 어려운 항목</p>
              </section>
            </>
          )}
          {wide && result && (
            <div className="registration-comparison">
              <div className="registration-stack">
                {readOnly && saved && (
                  <section className="registration-note">
                    <h3>검토한 절차</h3>
                    <p>{saved.procedure}</p>
                    <Badge tone="warning">확인 필요</Badge>
                    <p>확인할 질문 {saved.question}</p>
                  </section>
                )}
                {stage !== 'edit' && (
                  <div className="registration-summary">
                    <h3>{name}</h3>
                    <Badge tone={stage === 'revised' ? 'success' : 'warning'}>
                      {stage === 'revised' ? '수정 반영' : '확인 필요 1개'}
                    </Badge>
                  </div>
                )}
                {stage === 'edit' && (
                  <>
                    {warning}
                    <section className="registration-card registration-stack">
                      <h3>전표와 실제 수량이 다를 때</h3>
                      <div className="registration-confirmed">
                        <Textarea
                          label="확인한 절차"
                          value={procedure}
                          maxLength={2000}
                          rows={2}
                          onChange={(e) => setProcedure(e.target.value)}
                          hint="근거 문서에서 확인한 절차를 적어요."
                        />
                      </div>
                      <div className="registration-warning">
                        <Badge tone="warning">확인 필요</Badge>
                        <Textarea
                          label="추가로 확인할 내용"
                          value={question}
                          maxLength={2000}
                          rows={2}
                          onChange={(e) => setQuestion(e.target.value)}
                          hint="자료에 없는 내용은 확인할 질문으로 남겨요."
                        />
                      </div>
                    </section>
                  </>
                )}
                {stage === 'revised' && (
                  <section className="registration-warning registration-stack">
                    <Badge tone="warning">현장 확인 필요 1개</Badge>
                    <h3>전표와 실제 수량이 다를 때</h3>
                    <div className="registration-confirmed">
                      <Badge tone="success">수정 반영</Badge>
                      <p>{saved.procedure}</p>
                    </div>
                    <div className="registration-pending">
                      <strong>승인 담당자는 아직 확인이 필요해요.</strong>
                      <p>확인할 질문 {saved.question}</p>
                      <p>
                        수정한 질문을 남겨 두었어요. 현장 담당자에게 확인해
                        주세요.
                      </p>
                    </div>
                  </section>
                )}
                {stage !== 'edit' &&
                  result.rows.map((row) => (
                    <section className="registration-card" key={row.title}>
                      <h4>{row.title}</h4>
                      <div className="registration-fields">
                        <div>
                          <small>기존 방식</small>
                          <p>{row.before}</p>
                        </div>
                        <div>
                          <small>새 방식</small>
                          <p>{row.after}</p>
                        </div>
                      </div>
                    </section>
                  ))}
                {stage === 'compare' && (
                  <section className="registration-warning registration-unknown">
                    <CircleAlert size={22} aria-hidden="true" />
                    <div>
                      <h4>전표와 실제 수량이 다를 때</h4>
                      <p>
                        매뉴얼에서 불일치 기록 방법은 확인했어요. 승인 담당자는
                        자료에 적혀 있지 않아요.
                      </p>
                    </div>
                    {!readOnly ? (
                      <Button variant="ghost" onClick={startEdit}>
                        내용 수정
                      </Button>
                    ) : (
                      <Badge>등록자만 수정</Badge>
                    )}
                  </section>
                )}
              </div>
              <aside className="registration-stack" aria-label="근거 자료">
                <section
                  className={`publication-status publication-status--${shared || (record?.publication === 'published' && !revision) ? 'published' : 'draft'}`}
                  aria-label="업무 공유 상태"
                >
                  <Badge
                    tone={
                      shared ||
                      (record?.publication === 'published' && !revision)
                        ? 'success'
                        : personalOnly
                          ? 'neutral'
                          : 'blue'
                    }
                  >
                    {revision
                      ? '새 버전 검토 중'
                      : shared || record?.publication === 'published'
                        ? '공유됨'
                        : personalOnly
                          ? '나만 보는 기록'
                          : '나만 보기'}
                  </Badge>
                  <p>
                    {revision
                      ? `공개본 v${baselineVersion} / 검토 중 v${revisionVersion}`
                      : personalOnly
                        ? `개인 작업 공간 / ${name}`
                        : '등록자만 수정할 수 있어요'}
                  </p>
                  <small>
                    {revision
                      ? '공개본은 계속 사용할 수 있어요. 기록은 당시 기준 버전으로 유지돼요.'
                      : `등록자 ${task?.owner || '이서연'} / 기준 v${currentVersion}`}
                  </small>
                  {revision && (
                    <Button
                      variant="ghost"
                      onClick={() => onShowShared?.(record)}
                    >
                      공개본 보기
                    </Button>
                  )}
                </section>
                <h3>{stage === 'edit' ? '수정 근거' : '근거 자료'}</h3>
                {stage === 'edit' ? (
                  <>
                    <div className="registration-evidence">
                      <Badge>새 매뉴얼 3장</Badge>
                      <h3>수량 불일치 처리</h3>
                      <p>
                        전표 수량과 실제 수량이 다르면 실제 수량과 차이가 난
                        이유를 기록해요.
                      </p>
                    </div>
                    <div className="registration-note">
                      <h4>승인 담당자</h4>
                      <p>등록한 자료에서 승인 담당자를 확인할 수 없어요.</p>
                    </div>
                  </>
                ) : (
                  <>
                    {result.materials.map((material) => (
                      <div
                        className="registration-evidence"
                        key={material.name}
                      >
                        <h4>{material.name}</h4>
                        <p>
                          {material.kind} / {material.detail}
                        </p>
                      </div>
                    ))}
                    {stage === 'compare' && (
                      <div className="registration-note">
                        <h4>비교 기준</h4>
                        <p>새 매뉴얼 2장 입고 등록, 3장 수량 불일치 처리</p>
                      </div>
                    )}
                  </>
                )}
                <small className="text-muted">
                  피그마 예시 자료의 근거예요.
                </small>
              </aside>
            </div>
          )}
        </div>
      </Modal>
      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={revision ? '수정본 공유하기' : '검토 후 공유하기'}
        closeLabel="닫기"
        className="review-share-dialog"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShareOpen(false)}>
              검토로 돌아가기
            </Button>
            <Button onClick={publish}>검토한 내용 공유</Button>
          </>
        }
      >
        <div className="registration-stack">
          <h3>검토한 기준 자료를 공유해요</h3>
          <p>확인된 절차와 기준 자료를 구성원이 함께 써요.</p>
          <section className="registration-warning">
            <Badge tone="warning">현장 확인 필요 1개</Badge>
            <p>수량 차이 승인 담당자는 자료에서 확인되지 않았어요.</p>
            <p>{saved?.question}</p>
            <p>확인 필요 상태로 공유되고 연습 정답에서 제외돼요.</p>
          </section>
          <p className="text-muted">
            예시 공유입니다. 작업 자료와 결과, 질문과 개인 카드는 공유하지
            않으며 서버에는 저장하지 않아요.
          </p>
        </div>
      </Modal>
    </>
  )
}
