import { Menu, Search } from 'lucide-react'
import { Badge, Button } from '../ui'
import { PageHeader } from './PageHeader'

function SearchField({ variant = 'work' }) {
  return (
    <div
      className={`header__search ${variant === 'home' ? 'header__search--home' : ''}`}
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
  )
}

export function Header({
  locationLabel,
  onMenu,
  variant = 'work',
  title,
  description,
  search,
  showSearch = true,
}) {
  if (variant === 'home')
    return (
      <header className="home-header">
        <div className="home-header__top">
          <Button
            variant="ghost"
            className="icon-button header__menu"
            aria-label="메뉴 열기"
            onClick={onMenu}
          >
            <Menu size={22} aria-hidden="true" />
          </Button>
          <PageHeader title={title} variant="home" />
          {showSearch && (search || <SearchField variant="home" />)}
        </div>
        {description && <p className="text-secondary">{description}</p>}
      </header>
    )
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
      <SearchField />
      <Badge>예시 데이터</Badge>
    </header>
  )
}
