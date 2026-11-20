import { useEffect, useRef, useState } from 'react'
import { Badge, Button, EvidenceCard, Textarea } from '../ui'
import { askLearningQuestion } from '../../services/learningService'
import {
  learningEvidence,
  unconfirmedLearningNotice,
} from '../../data/learning'

export function LearningPanel({
  snapshot,
  stage,
  question,
  selectedTopics,
  panel,
  setPanel,
  chat,
  setChat,
  draft,
  setDraft,
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const request = useRef(null)
  const sequence = useRef(0)
  const input = useRef(null)
  const region = useRef(null)
  useEffect(
    () => () => {
      sequence.current++
      request.current?.abort()
    },
    [],
  )
  useEffect(() => {
    if (panel.mode === 'ai') input.current?.focus({ preventScroll: true })
  }, [panel.mode])
  const ask = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || pending) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const current = ++sequence.current
    setPending(true)
    setError('')
    try {
      const answer = await askLearningQuestion(snapshot, text, {
        signal: controller.signal,
      })
      if (controller.signal.aborted || sequence.current !== current) return
      setChat((previous) => [
        ...previous,
        { id: crypto.randomUUID(), question: text, ...answer },
      ])
      setDraft('')
    } catch (reason) {
      if (reason.name !== 'AbortError')
        setError(
          `답변을 불러오지 못했어요. 질문은 남겨 두었어요.${reason.status ? ` (HTTP ${reason.status})` : ''}`,
        )
    } finally {
      if (sequence.current === current) setPending(false)
    }
  }
  const cancel = () => {
    sequence.current++
    request.current?.abort()
    setPending(false)
    setError('질문을 취소했어요. 입력한 내용은 남아 있어요.')
  }
  const askButton = (
    <Button
      variant="secondary"
      onClick={() => {
        setPanel({ mode: 'ai' })
        requestAnimationFrame(() =>
          region.current?.scrollIntoView({ block: 'nearest' }),
        )
      }}
    >
      {snapshot.taskName.includes('재고')
        ? '재고 업무 질문하기'
        : '업무 질문하기'}
    </Button>
  )
  const context = (
    <section className="record-context" aria-label="학습 기준과 기록 범위">
      <Badge
        tone={
          snapshot.scope === 'shared' && stage !== 'result' ? 'blue' : 'neutral'
        }
      >
        {snapshot.scope === 'unknown'
          ? '범위 확인 필요'
          : snapshot.scope === 'shared' && stage !== 'result'
            ? '공유 기준 자료'
            : '나만 보는 기록'}
      </Badge>
      <p>
        {snapshot.scope === 'unknown'
          ? '서버에서 업무 범위 정보를 받지 못했어요.'
          : snapshot.scope === 'shared'
            ? '공유받은 업무 / 등록자가 검토한 자료'
            : `개인 작업 공간 / ${snapshot.taskName}`}
      </p>
      <small>
        {snapshot.version == null
          ? '기준 버전 정보 없음'
          : `기준 v${snapshot.version}`}{' '}
        / {stage === 'result' ? '내 연습 기록' : '업무별 자료로 학습'}
      </small>
      <small>분석 {snapshot.analysisId ?? '정보 없음'}</small>
      <p>
        {snapshot.mode === 'demo'
          ? '질문과 학습 기록은 이 탭에서만 유지돼요.'
          : '이 화면에는 현재 업무의 질문만 표시해요.'}
      </p>
    </section>
  )
  const latest = chat.at(-1)
  return (
    <aside
      className="learning-panel"
      ref={region}
      aria-label="학습 노트와 AI 질문"
    >
      {panel.mode === 'evidence' ? (
        <>
          <Button
            variant="ghost"
            onClick={() => setPanel({ mode: panel.from || 'guide' })}
          >
            {panel.from === 'ai' ? '‹ AI 답변으로' : '‹ 학습 결과로'}
          </Button>
          <h2>매뉴얼 근거</h2>
          {panel.sources.map((source, index) => (
            <EvidenceCard
              missingMessage={
                snapshot.mode === 'api'
                  ? '서버 응답에는 인용문이 없어요. 위 자료와 위치를 확인해 주세요.'
                  : undefined
              }
              key={`${source.id || source.materialId || 'source'}-${index}`}
              {...source}
              note={
                snapshot.mode === 'demo'
                  ? '피그마 예시 자료의 문장이에요.'
                  : '서버가 보낸 자료 ID와 위치예요. 원문 인용문은 응답에 없어요.'
              }
            />
          ))}
          <section className="learning-pending">
            <h3>자료에서 확인할 수 없는 내용</h3>
            <p>
              {snapshot.mode === 'demo'
                ? unconfirmedLearningNotice
                : '인용문과 원본 이동 방식은 추가 연결이 필요해요.'}
            </p>
            {snapshot.pendingQuestion && (
              <p>확인할 질문 {snapshot.pendingQuestion}</p>
            )}
          </section>
        </>
      ) : panel.mode === 'ai' ? (
        <>
          <div className="learning-panel__header">
            <h2>AI 업무 도우미</h2>
            <Button
              variant="ghost"
              onClick={() => {
                if (pending) cancel()
                setPanel({ mode: 'guide' })
              }}
            >
              닫기
            </Button>
          </div>
          <Badge tone="blue">{snapshot.taskName}</Badge>
          {snapshot.mode === 'demo' && (
            <p className="learning-mode-note">
              예시 답변입니다. 실제 AI를 호출하지 않아요.
            </p>
          )}
          {!chat.length && (
            <>
              <h3>무엇을 확인할까요?</h3>
              <p>
                등록한 자료를 바탕으로 답하고, 읽어 볼 매뉴얼 위치를 표시해요.
              </p>
            </>
          )}
          {chat.length > 1 && (
            <details>
              <summary>이전 질문 {chat.length - 1}개</summary>
              {chat.slice(0, -1).map((item) => (
                <article key={item.id} className="learning-answer">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                  {item.needsReview && <Badge tone="warning">확인 필요</Badge>}
                </article>
              ))}
            </details>
          )}
          {latest && (
            <>
              <p className="learning-situation">{latest.question}</p>
              <article className="learning-answer" aria-label="AI 답변">
                <p>{latest.answer}</p>
                {latest.needsReview && <Badge tone="warning">확인 필요</Badge>}
                {latest.sources.length ? (
                  <>
                    <small>
                      출처 /{' '}
                      {latest.sources
                        .map((source) => `${source.source} ${source.location}`)
                        .join(', ')}
                    </small>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setPanel({
                          mode: 'evidence',
                          from: 'ai',
                          sources: latest.sources,
                        })
                      }
                    >
                      근거 보기
                    </Button>
                  </>
                ) : (
                  <p>등록된 자료에서 답변 근거를 찾지 못했어요.</p>
                )}
              </article>
            </>
          )}
          <form className="learning-question-form" onSubmit={ask}>
            <Textarea
              ref={input}
              id="learning-question"
              label="질문"
              placeholder="확인하고 싶은 내용을 적어 주세요"
              value={draft}
              maxLength={2000}
              rows={3}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button
              variant="ghost"
              onClick={() => {
                setDraft('전표와 실제 수량이 다르면?')
                document.getElementById('learning-question')?.focus()
              }}
            >
              전표와 실제 수량이 다르면?
            </Button>
            <Button type="submit" disabled={!draft.trim() || pending}>
              {pending ? '답변을 불러오고 있어요' : '질문하기'}
            </Button>
            {pending && (
              <Button variant="secondary" onClick={cancel}>
                질문 취소
              </Button>
            )}
            {pending && <p role="status">답변을 불러오고 있어요.</p>}
            {error && <p role="alert">{error}</p>}
          </form>
        </>
      ) : (
        <>
          <h2>
            {stage === 'result'
              ? '결과의 근거'
              : stage === 'quiz'
                ? '연습 안내'
                : '학습 도우미'}
          </h2>
          {snapshot.mode === 'api' ? (
            <section className="record-context">
              <h3>{snapshot.taskName}</h3>
              <p>서버에서 조회한 업무 자료 {snapshot.materials.length}개</p>
              {snapshot.materials.map((material, index) => (
                <p key={material.id ?? index}>
                  {material.filename || `자료 #${material.id ?? '미확인'}`}
                </p>
              ))}
            </section>
          ) : stage === 'quiz' && question ? (
            <>
              <div className="learning-situation">
                <Badge tone="blue">
                  상황 {question.index}/{question.total}
                </Badge>
                <h3>입고 등록 연습</h3>
                <p>{question.situation}</p>
              </div>
              <section className="record-context">
                <h3>연습 자료</h3>
                <p>예시 입고 전표와 새 재고 시스템 매뉴얼</p>
              </section>
              <section className="record-context">
                <h3>확인할 내용</h3>
                <p>{question.focus}</p>
              </section>
            </>
          ) : (
            <>
              {stage !== 'result' && (
                <section className="learning-situation">
                  <Badge tone="blue">{snapshot.taskName}</Badge>
                  <h3>이 단계에서 배우는 것</h3>
                  <p>
                    품목 검색, 실제 수량 입력, 수량 차이 기록을 차례로 익혀요.
                  </p>
                </section>
              )}
              <section className="record-context">
                <h3>
                  {stage === 'result'
                    ? '새 재고 시스템 매뉴얼'
                    : '참고한 매뉴얼'}
                </h3>
                <p>
                  {snapshot.mode === 'demo'
                    ? '새 재고 시스템 매뉴얼 / 2장 입고 등록, 3장 수량 불일치 처리'
                    : '서버가 보낸 자료에서 근거 위치를 확인하세요.'}
                </p>
              </section>
              {stage === 'result' && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setPanel({
                      mode: 'evidence',
                      from: 'guide',
                      sources: [
                        ...new Set(
                          selectedTopics.map((id) =>
                            id === 'entry' ? 'entry' : 'exception',
                          ),
                        ),
                      ].map((id) => learningEvidence[id]),
                    })
                  }
                >
                  매뉴얼 근거 보기
                </Button>
              )}
            </>
          )}
          {askButton}
        </>
      )}
      {context}
    </aside>
  )
}
