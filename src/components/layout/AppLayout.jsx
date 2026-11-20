import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from '../../services/accountService'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { HomeQuickPanel } from './HomeQuickPanel'
import { Modal, Drawer, Button } from '../ui'

function locationLabel(pathname) {
  if (pathname === '/profile') return '내 프로필'
  if (pathname === '/settings') return '계정 설정'
  if (pathname === '/') return '홈'
  if (pathname === '/tasks') return '업무 목록'
  if (pathname.startsWith('/tasks/')) return '업무 상세'
  if (pathname.startsWith('/jobs/')) return '작업 내역'
  if (pathname.startsWith('/work-cards/')) return '개인 업무 카드'
  if (pathname.startsWith('/learn/')) return '새 방식 익히기'
  if (pathname === '/work-cards') return '개인 업무 카드'
  if (pathname === '/history') return '작업 내역'
  if (pathname === '/work/new') return '새 업무 등록'
  if (pathname === '/work/input') return '업무 자료 입력'
  if (pathname === '/dev/components') return '컴포넌트 확인'
  return '페이지 안내'
}

export function AppLayout({
  children,
  assistant,
  homeAside,
  onHomeHelp,
  variant,
  className = '',
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const isHome =
    variant === 'home' ||
    location.pathname === '/' ||
    location.pathname === '/tasks' ||
    location.pathname === '/work/new'
  const [help, setHelp] = useState(false)
  const [menu, setMenu] = useState(false)
  const [accountAction, setAccountAction] = useState(null)
  useEffect(() => {
    const handler = () => {
      setLogoutError('')
      setAccountAction('로그아웃')
    }
    window.addEventListener('workbridge:logout', handler)
    return () => window.removeEventListener('workbridge:logout', handler)
  }, [])
  const openAccount = (action) => {
    setMenu(false)
    if (action === '프로필') navigate('/profile')
    else if (action === '설정') navigate('/settings')
    else {
      setLogoutError('')
      setAccountAction(action)
    }
  }
  useEffect(() => {
    document.title = `${locationLabel(location.pathname)} | WORK BRIDGE`
    document.getElementById('page-title')?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [location.pathname])
  return (
    <div
      className={`app-layout ${isHome ? 'app-layout--home' : ''} ${className}`}
    >
      <a href="#main-content" className="skip-link">
        본문으로 바로가기
      </a>
      <div
        className={
          isHome
            ? `home-workspace ${!homeAside ? 'home-workspace--single' : ''}`
            : 'work-workspace'
        }
      >
        <aside className="sidebar">
          <Sidebar
            onAccountAction={openAccount}
            variant={isHome ? 'home' : 'work'}
            onHelp={onHomeHelp || (() => setHelp(true))}
          />
        </aside>
        <div className="app-layout__workspace">
          {!isHome && (
            <Header
              locationLabel={locationLabel(location.pathname)}
              onMenu={() => setMenu(true)}
            />
          )}
          <div
            className={`app-layout__body ${assistant ? 'has-assistant' : ''}`}
          >
            <main id="main-content" className="main-content" tabIndex={-1}>
              {(typeof children === 'function'
                ? children({ openMenu: () => setMenu(true) })
                : children) || (
                <Outlet context={{ openMenu: () => setMenu(true) }} />
              )}
            </main>
            {assistant && (
              <div className="app-layout__assistant">{assistant}</div>
            )}
          </div>
        </div>
        {isHome && homeAside && <HomeQuickPanel>{homeAside}</HomeQuickPanel>}
      </div>
      <Drawer
        open={menu}
        onClose={() => setMenu(false)}
        title="워크스페이스 메뉴"
        className="mobile-nav"
      >
        <Sidebar
          onAccountAction={openAccount}
          mobile
          variant={isHome ? 'home' : 'work'}
          onNavigate={() => setMenu(false)}
          onHelp={() => {
            setMenu(false)
            if (onHomeHelp) onHomeHelp()
            else setHelp(true)
          }}
        />
      </Drawer>
      <Modal
        open={!!accountAction}
        onClose={() => {
          if (!logoutBusy) setAccountAction(null)
        }}
        title="로그아웃할까요?"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={logoutBusy}
              onClick={() => setAccountAction(null)}
            >
              취소
            </Button>
            <Button
              loading={logoutBusy}
              onClick={async () => {
                if (logoutBusy) return
                setLogoutBusy(true)
                setLogoutError('')
                try {
                  await signOut()
                  setAccountAction(null)
                  navigate('/login', { replace: true })
                } catch (cause) {
                  setLogoutError(cause.message)
                } finally {
                  setLogoutBusy(false)
                }
              }}
            >
              로그아웃
            </Button>
          </>
        }
      >
        <p>다시 로그인하면 내 업무와 기록을 볼 수 있어요.</p>
        <p className="account-demo-note">
          예시 모드에서는 로그아웃하면 이 탭의 예시 기록이 지워져요.
        </p>
        {logoutError && (
          <p role="alert" className="account-error">
            {logoutError}
          </p>
        )}
      </Modal>
      <Modal
        open={help}
        onClose={() => setHelp(false)}
        title="WORK BRIDGE 사용 방법"
        footer={<Button onClick={() => setHelp(false)}>확인했어요</Button>}
      >
        <div className="stack help-content">
          <div>
            <h3>새 방식 익히기</h3>
            <p>
              기존 양식과 새 매뉴얼을 비교하고, 바뀐 절차를 연습해요. 다음에
              참고할 순서는 개인 업무 카드로 남겨요.
            </p>
          </div>
          <div>
            <h3>업무 처리하기</h3>
            <p>
              등록된 업무를 선택하고 오늘 처리할 자료를 입력해요. 초안을 원본과
              대조하고 수정한 뒤 작업 결과를 저장해요.
            </p>
          </div>
          <p className="help-content__note">
            WORK BRIDGE에서 결과를 저장해도 외부 재고 시스템 등록이나 예약
            확정은 끝나지 않아요.
          </p>
          <p className="text-muted">
            현재는 예시 데이터로 화면을 확인하는 단계예요.
          </p>
        </div>
      </Modal>
    </div>
  )
}
