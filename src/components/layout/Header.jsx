import { Menu, Search } from 'lucide-react'
import { Badge, Button } from '../ui'

export function Header({ locationLabel, onMenu }) {
  return (
    <header className="header">
      <Button
        variant="ghost"
        className="icon-button header__menu"
        aria-label="메뉴 열기"
        onClick={onMenu}
      >
        <Menu size={22} aria-hidden="true" />
      </Button>
      <p className="header__breadcrumb">
        <span>워크스페이스</span>
        <span aria-hidden="true"> / </span>
        <span>{locationLabel}</span>
      </p>
      <div
        className="header__search"
        title="업무 검색은 다음 화면 작업에서 연결됩니다."
      >
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          aria-label="업무와 카드 검색 (준비 중)"
          placeholder="업무와 카드를 찾아보세요"
          disabled
        />
      </div>
      <Badge>예시 데이터</Badge>
    </header>
  )
}
