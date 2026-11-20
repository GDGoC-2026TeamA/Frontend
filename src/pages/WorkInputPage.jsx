import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { WorkFrame, WorkEvidence } from '../components/layout/WorkFrame'
import {
  Button,
  Badge,
  Checkbox,
  FileUpload,
  Input,
  Textarea,
  Stepper,
  StatePanel,
  Modal,
} from '../components/ui'
import { ProcessingDialog } from '../components/ui/ProcessingDialog'
import {
  scenarioForTask,
  validateWorkFields,
  workScenarios,
} from '../data/work'
import {
  loadWorkTask,
  loadWorkRecord,
  createApiDraft,
  saveApiDraft,
  saveApiResult,
  downloadWorkResult,
  workMode,
} from '../services/workService'
import { putDemoJob, saveDemoWorkCard } from '../services/demo/workWorkspace'

export default function WorkInputRoute() {
  const location = useLocation(),
    { jobId } = useParams()
  return (
    <WorkLoader
      key={`${jobId || 'new'}:${location.key}`}
      jobId={jobId}
      location={location}
    />
  )
}
function WorkLoader({ jobId, location }) {
  const mode = workMode()
  const taskId =
    new URLSearchParams(location.search).get('taskId') ||
    location.state?.taskId ||
    location.state?.learningContext?.taskId ||
    (mode === 'demo' ? '1' : null)
  const [loaded, setLoaded] = useState(null),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const request = jobId
      ? loadWorkRecord('jobs', jobId, { signal: controller.signal }).then(
          (job) =>
            job && { job, task: { id: job.taskId, name: job.baseline.name } },
        )
      : taskId
        ? loadWorkTask(taskId, { signal: controller.signal }).then(
            (task) => task && { task },
          )
        : Promise.resolve(null)
    request
      .then((value) => {
        if (!controller.signal.aborted) {
          if (value) setLoaded(value)
          else setError('업무나 작업이 없어요.')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError('업무나 작업을 불러오지 못했어요.')
      })
    return () => controller.abort()
  }, [jobId, taskId, retry])
  if (!loaded)
    return (
      <WorkFrame title="업무 자료 입력">
        <StatePanel
          type={error ? 'error' : 'loading'}
          title={
            error ? '업무나 작업을 불러오지 못했어요' : '업무를 불러오고 있어요'
          }
          description="업무 목록에서 자료를 선택해 주세요. 다른 업무의 예시로 채우지 않아요."
          actionLabel={error ? '다시 시도' : undefined}
          onAction={() => {
            setError('')
            setRetry((n) => n + 1)
          }}
        />
        <Link to="/tasks">업무 목록 보기</Link>
      </WorkFrame>
    )
  return (
    <WorkEditor
      task={loaded.task}
      initialJob={loaded.job}
      fixtureError={
        mode === 'demo' &&
        new URLSearchParams(location.search).get('fixture') === 'read-error'
      }
    />
  )
}
function WorkEditor({ task, initialJob, fixtureError }) {
  const navigate = useNavigate(),
    apiMode = workMode() === 'api'
  const scenario =
      initialJob?.scenario || (!apiMode ? scenarioForTask(task) : null),
    example = workScenarios[scenario]
  const [job, setJob] = useState(initialJob || null),
    [stage, setStage] = useState(initialJob?.stage || 'input')
  const [name, setName] = useState(initialJob?.name || example?.name || ''),
    [quantity, setQuantity] = useState('18'),
    [newTime, setNewTime] = useState('오후 3:00')
  const [files, setFiles] = useState([]),
    [sample, setSample] = useState(false),
    [phase, setPhase] = useState('idle'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const [editFields, setEditFields] = useState(initialJob?.fields || []),
    [availability, setAvailability] = useState(
      initialJob?.availability || false,
    ),
    [sourceOpen, setSourceOpen] = useState(false),
    [card, setCard] = useState(null)
  const controller = useRef(null),
    sequence = useRef(0),
    timer = useRef(null),
    progress = useRef({ jobId: null, uploads: new Map() }),
    inFlight = useRef(false),
    lastEdited = useRef(initialJob?.lastField || ''),
    upload = useRef(null)
  useEffect(
    () => () => {
      sequence.current++
      controller.current?.abort()
      clearTimeout(timer.current)
    },
    [],
  )
  useEffect(() => {
    const target =
      stage === 'edit'
        ? document.getElementById(`work-field-${lastEdited.current}`)
        : null
    ;(target || document.getElementById('page-title'))?.focus({
      preventScroll: true,
    })
  }, [stage])
  const baseline =
    job?.baseline ||
    (example
      ? {
          taskId: task.id,
          name: task.name,
          scenario,
          version: task.publishedSnapshot?.version || task.version || 1,
          manual: example.manual,
          quote: example.quote,
          location: example.location,
          comparison: structuredClone(
            task.publishedSnapshot?.comparison || task.comparison || null,
          ),
          procedure:
            task.publishedSnapshot?.procedure ||
            task.saved?.procedure ||
            task.comparison?.procedure,
          pendingQuestion:
            task.publishedSnapshot?.question ||
            task.saved?.question ||
            task.comparison?.question,
        }
      : { taskId: task.id, name: task.name, materials: task.materials })
  const stop = () => {
    sequence.current++
    controller.current?.abort()
    clearTimeout(timer.current)
    setPhase('idle')
    setBusy(false)
    inFlight.current = false
  }
  const replace = () => {
    stop()
    setFiles([])
    setSample(false)
    requestAnimationFrame(() =>
      upload.current?.querySelector('button')?.focus(),
    )
  }
  const chooseSample = () => {
    setFiles([{ name: example.file, example: true }])
    setSample(true)
    setError('')
  }
  const start = async () => {
    if (inFlight.current) return
    if (
      !name.trim() ||
      !files.length ||
      (scenario === 'inventory' &&
        (!quantity.trim() ||
          !Number.isInteger(Number(quantity)) ||
          Number(quantity) < 0))
    ) {
      setError('작업 이름과 전표, 0 이상의 정수 수량을 모두 입력해 주세요.')
      return
    }
    setError('')
    if (!apiMode && !sample) {
      setPhase('error')
      return
    }
    inFlight.current = true
    setBusy(true)
    setPhase('loading')
    const current = ++sequence.current
    controller.current = new AbortController()
    try {
      let next
      if (apiMode)
        next = await createApiDraft(
          task,
          name.trim(),
          task.description || '',
          files,
          progress.current,
          controller.current.signal,
        )
      else {
        await new Promise((resolve) => {
          timer.current = setTimeout(resolve, 1800)
        })
        if (current !== sequence.current) return
        if (fixtureError) {
          setPhase('error')
          return
        }
        const fields = structuredClone(example.fields)
        if (scenario === 'reservation')
          fields.find((field) => field.key === 'newTime').value = newTime
        next = putDemoJob({
          taskId: task.id,
          name: name.trim(),
          scenario,
          fields,
          stage: 'review',
          status: '검토 중',
          baseline: structuredClone(baseline),
          files: structuredClone(files),
          availability: false,
          inputQuantity: quantity,
        })
      }
      if (current !== sequence.current) return
      setJob(next)
      setEditFields(structuredClone(next.fields))
      setStage('review')
      setPhase('idle')
    } catch (reason) {
      if (current === sequence.current && !controller.current.signal.aborted) {
        setPhase('idle')
        setError(
          `${reason.message} 다시 시도하면 이미 받은 작업과 파일 ID를 이어서 써요.`,
        )
      }
    } finally {
      if (current === sequence.current) {
        inFlight.current = false
        setBusy(false)
      }
    }
  }
  const updateField = (key, updates) => {
    lastEdited.current = key
    setEditFields((items) =>
      items.map((field) =>
        field.key === key ? { ...field, ...updates } : field,
      ),
    )
  }
  const confirmEdit = async () => {
    if (inFlight.current) return
    const errors = validateWorkFields(editFields, scenario, availability)
    if (errors.length) {
      setError(errors.join(' '))
      return
    }
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      let next = {
        ...job,
        fields: structuredClone(editFields),
        availability,
        lastField: lastEdited.current,
        stage: 'revised',
        status: '검토 중',
      }
      next = apiMode
        ? { ...(await saveApiDraft(next)), stage: 'revised' }
        : putDemoJob(next)
      if (validateWorkFields(next.fields, scenario, availability).length)
        throw new Error(
          '서버에서 미확인 항목이 돌아왔어요. 다시 확인해 주세요.',
        )
      setJob(next)
      setEditFields(structuredClone(next.fields))
      setStage('revised')
    } catch (reason) {
      setError(reason.message)
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  const save = async () => {
    if (inFlight.current) return
    const errors = validateWorkFields(job.fields, scenario, availability)
    if (errors.length) {
      setError(errors.join(' '))
      return
    }
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const next = apiMode
        ? await saveApiResult(job)
        : putDemoJob({
            ...job,
            stage: 'result',
            status: '결과 저장됨',
            availability,
          })
      setJob(next)
      setStage('result')
    } catch (reason) {
      setError(reason.message)
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  const title =
    stage === 'input'
      ? scenario === 'reservation'
        ? '예약 변경 요청 입력'
        : '업무 자료 입력'
      : stage === 'edit'
        ? '초안 수정'
        : stage === 'revised'
          ? '수정한 초안 확인'
          : stage === 'result'
            ? '작업 결과'
            : scenario === 'reservation'
              ? '예약 변경 내용 검토'
              : '초안 검토'
  const summaryFields = stage === 'edit' ? editFields : job?.fields || []
  if (!apiMode && !example)
    return (
      <WorkFrame title="업무 자료 입력">
        <StatePanel
          type="insufficient"
          title="이 업무의 예시 절차가 없어요"
          description="확인된 업무 기준을 먼저 등록해 주세요. 재고나 예약 자료를 대신 넣지 않아요."
        />
        <Link to="/tasks">업무 목록 보기</Link>
      </WorkFrame>
    )
  return (
    <WorkFrame
      title={title}
      description={
        stage === 'result'
          ? '검토한 결과를 작업 내역에 저장했어요.'
          : stage === 'input'
            ? `${task.name} / 오늘 처리할 자료를 입력해요.`
            : '실제 자료와 초안이 맞는지 확인하고 수정해 주세요.'
      }
      reservation={scenario === 'reservation'}
      aside={
        <WorkEvidence
          baseline={baseline}
          files={job?.files || files}
          source={job?.source}
          result={stage === 'result'}
        />
      }
    >
      <Stepper
        steps={['업무 자료 입력', '초안 검토', '작업 결과']}
        currentStep={stage === 'input' ? 0 : stage === 'result' ? 2 : 1}
      />
      {stage === 'input' ? (
        <>
          <section className="workflow-card">
            <h2>작업 정보</h2>
            <Input
              label="작업 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              hint="작업 내역에 표시될 이름이에요."
            />
          </section>
          <section className="workflow-card">
            <h2>
              {scenario === 'reservation'
                ? '변경할 예약 정보'
                : '오늘 처리할 업무 자료'}
            </h2>
            {scenario === 'reservation' && (
              <>
                <Input label="예약 번호" value="RS-204" readOnly />
                <Input label="기존 시간" value="오후 2:00" readOnly />
                <Input
                  label="변경 시간"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  maxLength={100}
                />
              </>
            )}
            {sample ? (
              <div className="workflow-file">
                <strong>{files[0]?.name}</strong>
                <small>
                  예시 자료{scenario === 'inventory' ? ' / 전표 수량 20개' : ''}
                </small>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFiles([])
                    setSample(false)
                  }}
                >
                  삭제
                </Button>
              </div>
            ) : (
              <div ref={upload}>
                <FileUpload
                  label={scenario === 'inventory' ? '입고 전표' : '작업 자료'}
                  files={files}
                  onChange={(value) => {
                    setFiles(value)
                    setSample(false)
                    setError('')
                  }}
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                />
              </div>
            )}
            {scenario === 'inventory' && (
              <Input
                label="실제로 입고된 수량"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                hint="현장에서 확인한 수량을 입력해요."
              />
            )}
          </section>
          <div className="workflow-actions">
            <Button variant="ghost" onClick={() => navigate('/tasks')}>
              취소
            </Button>
            <span className="workflow-actions__end">
              {!apiMode && (
                <Button variant="secondary" onClick={chooseSample}>
                  {scenario === 'reservation'
                    ? '예시 요청으로 확인'
                    : '예시 전표로 확인'}
                </Button>
              )}
              <Button onClick={start} disabled={busy}>
                {scenario === 'reservation' ? '변경 내용 검토' : '초안 만들기'}
              </Button>
            </span>
          </div>
        </>
      ) : (
        <>
          <section
            className={`workflow-summary ${stage === 'review' ? 'workflow-summary--warning' : ''}`}
          >
            <h2>{job.name}</h2>
            <Badge
              tone={
                stage === 'result'
                  ? 'success'
                  : stage === 'revised'
                    ? 'blue'
                    : 'warning'
              }
            >
              {stage === 'result'
                ? '결과 저장됨'
                : stage === 'revised'
                  ? '검토 완료'
                  : `확인 필요 ${job.fields.filter((field) => !field.readonly && !field.checked).length}개`}
            </Badge>
            <p>
              {stage === 'result'
                ? '저장한 값을 다시 확인할 수 있어요. 외부 시스템 처리는 별도로 확인해 주세요.'
                : '초안을 원본 자료와 대조해 주세요.'}
            </p>
          </section>
          <section className="workflow-card">
            <h2>
              {stage === 'edit'
                ? '실제 업무 내역'
                : stage === 'result'
                  ? '저장한 내역'
                  : scenario === 'reservation'
                    ? '저장할 변경 내용'
                    : '입고 초안'}
            </h2>
            {stage === 'edit' ? (
              summaryFields.map((field) => (
                <div key={field.key}>
                  {field.readonly ? (
                    <Input
                      label={field.label || field.key}
                      value={field.value}
                      readOnly
                    />
                  ) : field.key === 'reason' ? (
                    <Textarea
                      id={`work-field-${field.key}`}
                      label="차이 사유"
                      value={field.value}
                      onChange={(e) =>
                        updateField(field.key, {
                          value: e.target.value,
                          checked: false,
                        })
                      }
                      maxLength={1000}
                    />
                  ) : (
                    <Input
                      label={field.label || field.key}
                      id={`work-field-${field.key}`}
                      value={field.value}
                      type={field.key === 'quantity' ? 'number' : 'text'}
                      onChange={(e) =>
                        updateField(field.key, {
                          value:
                            (field.key === 'quantity' ||
                              field.valueType === 'number' ||
                              typeof field.value === 'number') &&
                            e.target.value !== ''
                              ? Number(e.target.value)
                              : e.target.value,
                          checked: false,
                        })
                      }
                      maxLength={1000}
                    />
                  )}
                </div>
              ))
            ) : (
              <dl className="workflow-values">
                {summaryFields.map((field) => (
                  <div key={field.key}>
                    <dt>{field.label || field.key}</dt>
                    <dd>
                      {String(field.value) || '미입력'}
                      {scenario === 'inventory' &&
                      ['quantity', 'documentQuantity'].includes(field.key) &&
                      String(field.value) !== ''
                        ? '개'
                        : ''}
                      {!field.readonly && !field.checked && ' / 확인 필요'}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
          {stage !== 'result' && (
            <section className="workflow-card">
              <h2>검토 항목</h2>
              {(stage === 'edit' ? editFields : job.fields)
                .filter((field) => !field.readonly)
                .map((field) => (
                  <Checkbox
                    key={field.key}
                    label={
                      field.key === 'quantity'
                        ? '실제로 입고된 수량을 확인했어요'
                        : field.key === 'reason'
                          ? '수량 차이 사유를 기록했어요'
                          : `${field.label || field.key}을 확인했어요`
                    }
                    checked={field.checked}
                    disabled={stage !== 'edit'}
                    onChange={(e) =>
                      updateField(field.key, { checked: e.target.checked })
                    }
                  />
                ))}
              {scenario === 'reservation' && (
                <Checkbox
                  label="변경 시간에 예약할 수 있는지 확인했어요"
                  checked={availability}
                  disabled={stage !== 'edit'}
                  onChange={(e) => setAvailability(e.target.checked)}
                />
              )}
            </section>
          )}
          <div className="workflow-actions">
            {stage === 'review' ? (
              <>
                <Button variant="ghost" onClick={() => setSourceOpen(true)}>
                  업무 자료 보기
                </Button>
                <Button
                  onClick={() => {
                    setEditFields(structuredClone(job.fields))
                    setStage('edit')
                    setError('')
                  }}
                >
                  초안 수정
                </Button>
              </>
            ) : stage === 'edit' ? (
              <>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setEditFields(structuredClone(job.fields))
                    setAvailability(job.availability)
                    setStage('review')
                    setError('')
                  }}
                >
                  취소
                </Button>
                <Button disabled={busy} onClick={confirmEdit}>
                  수정 내용 확인
                </Button>
              </>
            ) : stage === 'revised' ? (
              <>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setStage('edit')}
                >
                  수정 화면으로
                </Button>
                <Button disabled={busy} onClick={save}>
                  {scenario === 'reservation'
                    ? '변경 내용 저장'
                    : '작업 결과 저장'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/history')}
                >
                  작업 내역 보기
                </Button>
                <span className="workflow-actions__end">
                  {apiMode && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true)
                        try {
                          await downloadWorkResult(job.id)
                        } catch (reason) {
                          setError(reason.message)
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      결과 다운로드
                    </Button>
                  )}
                  <Button
                    disabled={!!card || apiMode}
                    onClick={() => {
                      try {
                        setCard(saveDemoWorkCard(job))
                      } catch (reason) {
                        setError(reason.message)
                      }
                    }}
                  >
                    {card ? '카드 저장됨' : '절차를 카드로 저장'}
                  </Button>
                </span>
              </>
            )}
          </div>
          {card && (
            <p role="status">
              개인 업무 카드에 저장했어요.{' '}
              <Link to={`/work-cards/${card.id}`}>저장한 카드 보기</Link>
            </p>
          )}
          {stage === 'result' && apiMode && (
            <p>
              카드 생성에 필요한 analysisItemId가 현재 작업 응답에 없어 카드
              저장은 연결하지 않았어요.
            </p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="registration-error">
          {error}
        </p>
      )}
      <p className="workflow-disclaimer">
        {apiMode
          ? '서버 응답으로 표시해요. 요청을 취소해도 이미 서버에 저장된 작업과 첨부는 남을 수 있어요.'
          : '예시 작업입니다. 실제 파일을 읽거나 전송하지 않아요. 기록은 이 탭에서만 유지돼요.'}{' '}
        결과 저장은 외부 재고 시스템 등록이나 예약 확정이 아니에요.
      </p>
      <ProcessingDialog
        phase={phase}
        filename={files[0]?.name}
        isExample={sample && !apiMode}
        loadingDescription={
          apiMode
            ? '서버에 초안 생성을 요청하고 있어요.'
            : '예시 자료로 검토 흐름을 확인하고 있어요.'
        }
        onCancel={stop}
        onRetry={start}
        onReplace={replace}
      />
      <Modal
        open={sourceOpen}
        onClose={() => setSourceOpen(false)}
        title="오늘 처리할 업무 자료"
        footer={
          <Button onClick={() => setSourceOpen(false)}>검토로 돌아가기</Button>
        }
      >
        <WorkEvidence
          baseline={baseline}
          files={job?.files}
          source={job?.source}
        />
      </Modal>
    </WorkFrame>
  )
}
