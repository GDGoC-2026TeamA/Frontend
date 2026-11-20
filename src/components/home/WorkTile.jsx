import { Badge, Button } from '../ui'
import { TaskMenu } from './TaskMenu'
import inventory from '../../assets/home/inventory.svg?no-inline'
import reservation from '../../assets/home/reservation.svg?no-inline'
import blue from '../../assets/home/status-blue.svg?no-inline'
import success from '../../assets/home/status-success.svg?no-inline'

export function WorkTile({ task, onAction }) {
  const artwork =
    task.artwork ||
    (/예약/.test(task.name)
      ? 'reservation'
      : /재고|입고/.test(task.name)
        ? 'inventory'
        : null)
  const completed = task.learningStatus === '학습 완료'
  return (
    <article className="work-tile">
      <div
        className={
          'work-tile__artwork work-tile__artwork--' + (artwork || 'none')
        }
      >
        {artwork && (
          <img src={artwork === 'inventory' ? inventory : reservation} alt="" />
        )}
      </div>
      <TaskMenu task={task} onAction={onAction} />
      <div className="work-tile__content">
        <div className="work-tile__heading">
          <h3>{task.name}</h3>
          <Badge
            tone={completed ? 'success' : 'changed'}
            dotIcon={completed ? success : blue}
          >
            {task.learningStatus || '학습 상태 미확인'}
          </Badge>
        </div>
        <p>
          {task.description || '기준 자료를 확인하고 이 업무를 시작하세요.'}
        </p>
        <div className="work-tile__actions">
          <Button onClick={() => onAction(task, '업무 처리하기')}>
            업무 처리하기
          </Button>
          <Button
            variant="secondary"
            onClick={() => onAction(task, '새 방식 익히기')}
          >
            새 방식 익히기
          </Button>
        </div>
      </div>
    </article>
  )
}
