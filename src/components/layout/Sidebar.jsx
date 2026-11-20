import { List } from 'lucide-react'
import { AccountMenu } from '../ui/AccountMenu'
import { NavLink, Link, useLocation } from 'react-router-dom'
import homeIcon from '../../assets/home/home.svg?no-inline'
import bookIcon from '../../assets/icons/book-open.png'
import cardIcon from '../../assets/home/work-card.svg?no-inline'
import clockIcon from '../../assets/home/history.svg?no-inline'

const items = [
  { to: '/', label: '홈', icon: homeIcon, iconClass: 'sidebar__icon--home' },
  { to: '/tasks', label: '업무 목록', iconClass: 'sidebar__icon--list' },
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
  onAccountAction,
}) {
  const home = variant === 'home'
  const learning = /^\/(learn\/|work\/input)/.test(useLocation().pathname)
  return (
    <div
      className={`sidebar__content ${home ? 'sidebar__content--home' : ''} ${mobile ? 'sidebar__content--mobile' : ''}`}
    >
      <Link to="/" className="brand" onClick={onNavigate}>
        <span className="brand__mark" aria-hidden="true">
          W
        </span>
        <span>
          WORK BRIDGE<span className="sr-only"> 홈</span>
        </span>
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
                `sidebar__link ${isActive || (learning && to === '/tasks') ? 'is-active' : ''}`
              }
            >
              <span className={`sidebar__icon ${iconClass}`} aria-hidden="true">
                {icon ? <img src={icon} alt="" /> : <List size={24} />}
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
            가이드 보기
          </button>
        </div>
        <AccountMenu
          onProfile={() => onAccountAction?.('프로필')}
          onSettings={() => onAccountAction?.('설정')}
          onLogout={() => onAccountAction?.('로그아웃')}
        />
      </div>
    </div>
  )
}
