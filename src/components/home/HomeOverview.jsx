import { Link } from 'react-router-dom'
import { Button } from '../ui'
import cardIcon from '../../assets/home/work-card.svg?no-inline'
import plus from '../../assets/home/plus.svg?no-inline'
import chevron from '../../assets/home/chevron.svg?no-inline'

export function HomeOverview({ data, onAction }) {
  const job = data.resumeJobs[0]
  return (
    <div className="home-overview">
      <section id="home-continue" aria-labelledby="home-continue-title">
        <h2 id="home-continue-title">이어서 할 일</h2>
        {job ? (
          <div className="home-resume">
            <div>
              <h3>{job.name}</h3>
              <p>
                {Number.isInteger(job.pendingCount)
                  ? `확인할 항목 ${job.pendingCount}개가 남아 있어요.`
                  : '검토하던 내용을 이어서 확인하세요.'}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => onAction(job, '검토 이어하기')}
            >
              이어하기 <img src={chevron} alt="" />
            </Button>
          </div>
        ) : (
          <div className="home-resume">
            <div>
              <h3>아직 진행 중인 작업이 없어요</h3>
              <p>업무 처리 중 나가면 이곳에서 다시 열 수 있어요.</p>
            </div>
          </div>
        )}
      </section>
      <section id="home-saved" aria-labelledby="home-cards-title">
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
        <div className="home-overview__cards">
          {data.recentCards.length ? (
            data.recentCards.map((card) => (
              <article className="home-saved-card" key={card.id}>
                <div className="home-saved-card__heading">
                  <span className="home-small-icon">
                    <img src={cardIcon} alt="" />
                  </span>
                  <div>
                    <h3>{card.title}</h3>
                    <p>
                      {card.category ? `${card.category} / ` : ''}
                      {card.stepCount
                        ? `확인할 순서 ${card.stepCount}단계`
                        : '저장한 처리 절차'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-button home-saved-card__link"
                  onClick={() => onAction(card, '절차 보기')}
                >
                  절차 보기 <img src={chevron} alt="" />
                </button>
              </article>
            ))
          ) : (
            <p className="home-empty">
              저장한 카드가 없어요. 확인한 절차를 카드로 저장하면 이곳에서 다시
              볼 수 있어요.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
