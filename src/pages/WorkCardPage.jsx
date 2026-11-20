import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { WorkFrame, WorkEvidence } from '../components/layout/WorkFrame'
import { Input, Button, StatePanel } from '../components/ui'
import { loadWorkRecord, renameWorkCard } from '../services/workService'

export default function WorkCardPage() {
  const { cardId } = useParams(),
    navigate = useNavigate(),
    [loadedCard, setCard] = useState(null),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0),
    [title, setTitle] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('')
  const card =
    loadedCard && String(loadedCard.id) === String(cardId) ? loadedCard : null
  useEffect(() => {
    const controller = new AbortController()
    loadWorkRecord('cards', cardId, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) {
          if (value) {
            setCard(value)
            setTitle(value.title)
          } else setError('카드가 없어요.')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('카드를 불러오지 못했어요.')
      })
    return () => controller.abort()
  }, [cardId, retry])
  const save = async () => {
    if (!title.trim()) {
      setError('카드 이름을 입력해 주세요.')
      return
    }
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const value = await renameWorkCard(cardId, title.trim())
      setCard({ ...card, ...value })
      setNotice('카드 이름을 저장했어요.')
    } catch (reason) {
      setError(reason.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <WorkFrame
      title={card?.title || '개인 업무 카드'}
      description="이전 작업에서 확인한 절차와 근거예요."
      aside={
        card && (
          <WorkEvidence
            baseline={card.baseline}
            source={
              card.source && typeof card.source === 'object'
                ? card.source
                : null
            }
          />
        )
      }
    >
      {!card ? (
        <StatePanel
          type={error ? 'error' : 'loading'}
          title={error || '카드를 불러오고 있어요'}
          actionLabel={error ? '다시 시도' : undefined}
          onAction={() => {
            setError('')
            setRetry((n) => n + 1)
          }}
        />
      ) : (
        <>
          <section className="workflow-card">
            <h2>확인 순서</h2>
            <ol className="workflow-steps">
              {card.steps.map((step, index) => (
                <li key={index}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            {['cautions', 'exceptions', 'pending'].map((key) =>
              card[key]?.length ? (
                <section key={key}>
                  <h3>
                    {
                      {
                        cautions: '주의할 점',
                        exceptions: '예외 처리',
                        pending: '확인 필요',
                      }[key]
                    }
                  </h3>
                  {card[key].map((text, index) => (
                    <p key={index}>{text}</p>
                  ))}
                </section>
              ) : null,
            )}
          </section>
          <section className="workflow-card">
            <h2>카드 이름 수정</h2>
            <Input
              label="카드 이름"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Button variant="secondary" disabled={busy} onClick={save}>
              카드 이름 저장
            </Button>
          </section>
          <div className="workflow-actions">
            <Link to="/work-cards">카드 목록 보기</Link>
            <Button
              onClick={() =>
                navigate('/work/input', { state: { taskId: card.taskId } })
              }
            >
              업무 처리하기
            </Button>
          </div>
          {error && <p role="alert">{error}</p>}
          {notice && <p role="status">{notice}</p>}
        </>
      )}
    </WorkFrame>
  )
}
