import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { HomeQuickPanel } from './HomeQuickPanel'
import { Modal, Drawer, Button } from '../ui'

function locationLabel(pathname) {
  if (pathname === '/') return '홈'
  if (pathname === '/tasks') return '업무 목록'
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
  const isHome =
    variant === 'home' ||
    location.pathname === '/' ||
    location.pathname === '/tasks' ||
    location.pathname === '/work/new'
  const [help, setHelp] = useState(false)
  const [menu, setMenu] = useState(false)
  const [accountAction, setAccountAction] = useState(null)
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
            onAccountAction={setAccountAction}
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
          onAccountAction={setAccountAction}
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
        onClose={() => setAccountAction(null)}
        title={accountAction || '내 계정'}
        footer={
          <Button onClick={() => setAccountAction(null)}>돌아가기</Button>
        }
      >
        <p>
          계정 관리와 로그인은 ‘추가 / 계정과 첫 사용’ 및 ‘최종 / 프로필과 계정
          설정’ 화면을 연결할 때 사용할 수 있어요. 현재 계정은 바뀌지 않았어요.
        </p>
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
