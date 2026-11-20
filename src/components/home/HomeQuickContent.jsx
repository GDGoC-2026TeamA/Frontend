import { Link } from 'react-router-dom'
import { Badge, Button } from '../ui'
import { MessageCircle } from '../ui/DesignIcons'
import cardIcon from '../../assets/home/work-card.svg?no-inline'
import plus from '../../assets/home/plus.svg?no-inline'
import chevron from '../../assets/home/chevron.svg?no-inline'

export function HomeQuickContent({ data, onAction }) {
  const cards = data?.recentCards || []
  const job = data?.resumeJobs?.[0]
  if (!data)
    return (
      <p className="home-quick-panel__placeholder">
        업무 정보를 불러온 뒤 참고 항목을 표시해요.
      </p>
    )
  return (
    <>
      <section
        className="home-quick-panel__section"
        id="home-continue"
        aria-labelledby="home-continue-title"
      >
        <h2 id="home-continue-title">이어서 할 일</h2>
        {job ? (
          <div className="home-resume">
            <h3>{job.name}</h3>
            <p>
              {Number.isInteger(job.pendingCount)
                ? '확인할 항목 ' + job.pendingCount + '개가 남아 있어요.'
                : '검토하던 내용을 이어서 확인하세요.'}
            </p>
            <Button onClick={() => onAction(job, '검토 이어하기')}>
              검토 이어하기
            </Button>
          </div>
        ) : (
          <p className="home-quick-panel__placeholder">
            이어서 할 작업이 없어요.
          </p>
        )}
      </section>
      <section
        className="home-quick-panel__section home-saved"
        id="home-saved"
        aria-labelledby="home-cards-title"
      >
        <div className="home-section-heading">
          <h2 id="home-cards-title">개인 업무 카드</h2>
          <Link
            to="/work-cards"
            className="home-add-card"
            aria-label="개인 업무 카드 전체 보기"
          >
            <img src={plus} alt="" />
          </Link>
        </div>
        {cards.map((card) => (
          <article className="home-saved-card" key={card.id}>
            <div className="home-saved-card__heading">
              <span className="home-small-icon">
                <img src={cardIcon} alt="" />
              </span>
              <div>
                <h3>{card.title}</h3>
                <p>
                  {card.category ? card.category + ' / ' : ''}
                  {card.stepCount
                    ? '확인할 순서 ' + card.stepCount + '단계'
                    : '저장한 처리 절차'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="text-button home-saved-card__link"
              onClick={() => onAction(card, '절차 보기')}
            >
              절차 보기
              <img src={chevron} alt="" />
            </button>
          </article>
        ))}
        {!cards.length && (
          <p className="home-quick-panel__placeholder">
            저장한 업무 카드가 없어요.
          </p>
        )}
      </section>
      <section
        className="home-quick-panel__assistant"
        aria-labelledby="home-assistant-title"
      >
        <div className="home-assistant-heading">
          <span>
            <MessageCircle size={19} aria-hidden="true" />
          </span>
          <h3 id="home-assistant-title">업무 도우미</h3>
        </div>
        <p>등록한 업무 자료를 바탕으로 답해요.</p>
        <Button
          variant="secondary"
          onClick={() => onAction(data?.tasks?.[0], '업무 질문하기')}
          disabled={!data?.tasks?.length}
        >
          {data?.source === 'demo' ? '재고 업무 질문하기' : '업무 질문하기'}
        </Button>
      </section>
      <div className="home-card-tip">
        <p>확인한 절차는 카드로 남겨요</p>
        <small>다음 업무에서 필요한 순간에 바로 꺼내 볼 수 있어요.</small>
      </div>
      <p className="home-data-notice">
        <Badge>{data?.source === 'api' ? '서버 데이터' : '예시 데이터'}</Badge>
        <span>
          {data?.source === 'api'
            ? '서버에서 조회한 업무와 기록이에요.'
            : '화면의 업무와 기록은 예시 데이터예요.'}
        </span>
      </p>
    </>
  )
}
