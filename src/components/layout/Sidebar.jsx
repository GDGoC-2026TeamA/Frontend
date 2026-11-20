import { NavLink, Link } from 'react-router-dom'
import homeIcon from '../../assets/icons/home-outline.svg'
import bookIcon from '../../assets/icons/book-open.png'
import cardIcon from '../../assets/icons/work-card.svg'
import clockIcon from '../../assets/icons/history-outline.svg'

const items = [
  { to: '/', label: '홈', icon: homeIcon, iconClass: 'sidebar__icon--home' },
  {
    to: '/work-cards',
    label: '개인 업무 카드',
    icon: cardIcon,
    iconClass: 'sidebar__icon--card',
  },
  {
    to: '/history',
    label: '작업 내역',
    icon: clockIcon,
    iconClass: 'sidebar__icon--history',
  },
]

export function Sidebar({
  onHelp,
  onNavigate,
  mobile = false,
  variant = 'work',
}) {
  const home = variant === 'home'
  return (
    <div
      className={`sidebar__content ${home ? 'sidebar__content--home' : ''} ${mobile ? 'sidebar__content--mobile' : ''}`}
    >
      <Link
        to="/"
        className="brand"
        onClick={onNavigate}
        aria-label="WORK BRIDGE 홈"
      >
        <span className="brand__mark" aria-hidden="true">
          W
        </span>
        <span>WORK BRIDGE</span>
      </Link>
      <nav aria-label="주요 메뉴">
        <p className="sidebar__label">워크스페이스</p>
        <div className="sidebar__nav">
          {items.map(({ to, label, icon, iconClass }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'is-active' : ''}`
              }
            >
              <span className={`sidebar__icon ${iconClass}`} aria-hidden="true">
                <img src={icon} alt="" />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="sidebar__bottom">
        <div className="sidebar__help">
          {!home && <img src={bookIcon} width="24" height="24" alt="" />}
          <p className="field__label">새 업무, 익숙해질 때까지</p>
          <p>
            {home ? (
              '자료를 비교하고, 연습한 절차를 업무에 써 보세요.'
            ) : (
              <>
                자료를 비교하고 연습한 뒤<br />
                실제 업무에 적용해 보세요.
              </>
            )}
          </p>
          <button type="button" onClick={onHelp} className="text-button">
            사용 방법 보기
          </button>
        </div>
        <div className="sidebar__identity">
          <span className="sidebar__avatar" aria-hidden="true">
            내
          </span>
          <div>
            <p>{home ? '작업 공간' : '내 작업 공간'}</p>
            <small>개인 워크스페이스</small>
          </div>
        </div>
      </div>
    </div>
  )
}
