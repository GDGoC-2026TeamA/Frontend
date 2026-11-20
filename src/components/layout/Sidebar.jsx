import { NavLink, Link } from 'react-router-dom'
import homeIcon from '../../assets/icons/home.png'
import bookIcon from '../../assets/icons/book-open.png'
import clockIcon from '../../assets/icons/clock.svg'

const items = [
  { to: '/', label: '홈', icon: homeIcon },
  { to: '/work-cards', label: '개인 업무 카드', icon: bookIcon },
  { to: '/history', label: '작업 내역', icon: clockIcon },
]

export function Sidebar({ onHelp, onNavigate, mobile = false }) {
  return (
    <div
      className={`sidebar__content ${mobile ? 'sidebar__content--mobile' : ''}`}
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
          {items.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'is-active' : ''}`
              }
            >
              <img src={icon} width="20" height="20" alt="" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="sidebar__bottom">
        <div className="sidebar__help">
          <img src={bookIcon} width="24" height="24" alt="" />
          <p className="field__label">새 업무, 익숙해질 때까지</p>
          <p>
            자료를 비교하고 연습한 뒤<br />
            실제 업무에 적용해 보세요.
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
            <p>내 작업 공간</p>
            <small>개인 워크스페이스</small>
          </div>
        </div>
      </div>
    </div>
  )
}
