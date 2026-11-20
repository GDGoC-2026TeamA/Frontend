import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../ui'
import { IconSearch, Home, BookOpen } from '../ui/DesignIcons'
import { StatusIcon } from '../ui/StatusIcon'
import clearIcon from '../../assets/home/search-clear.svg?no-inline'
import chevronIcon from '../../assets/home/search-chevron.svg?no-inline'

export function HomeSearch({ data, onSelect }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const root = useRef(null)
  const input = useRef(null)
  const id = useId()
  const keyword = query.trim().normalize('NFKC').toLocaleLowerCase('ko')
  const results = [
    ...(data?.tasks || []).map((task) => ({
      ...task,
      title: task.name,
      type: 'task',
      label: '등록된 업무',
    })),
    ...(data?.recentCards || []).map((card) => ({
      ...card,
      type: 'card',
      label: '개인 업무 카드',
    })),
  ].filter((item) =>
    item.title?.normalize('NFKC').toLocaleLowerCase('ko').includes(keyword),
  )
  useEffect(() => {
    const close = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])
  const update = (value) => {
    setQuery(value)
    setActive(-1)
    setOpen(true)
  }
  const select = (item) => {
    setOpen(false)
    setActive(-1)
    onSelect(item)
  }
  return (
    <div
      ref={root}
      className="home-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <div className="header__search header__search--home">
        <IconSearch size={17} aria-hidden="true" />
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-label="업무와 카드 검색"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            open && keyword && active >= 0 ? id + '-' + active : undefined
          }
          value={query}
          placeholder="업무와 카드를 찾아보세요"
          onFocus={() => setOpen(true)}
          onChange={(event) => update(event.target.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return
            if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
              setActive(-1)
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              setActive((index) => {
                if (!results.length) return -1
                if (index < 0)
                  return event.key === 'ArrowDown' ? 0 : results.length - 1
                return (
                  (index +
                    (event.key === 'ArrowDown' ? 1 : -1) +
                    results.length) %
                  results.length
                )
              })
            }
            if (event.key === 'Enter' && open && keyword && results.length) {
              event.preventDefault()
              select(results[active < 0 ? 0 : active])
            }
          }}
        />
        {query && (
          <button
            className="search-clear"
            type="button"
            aria-label="검색어 지우기"
            onClick={() => {
              update('')
              input.current.focus()
            }}
          >
            <img src={clearIcon} alt="" />
          </button>
        )}
      </div>
      {open && (
        <div className="home-search__dropdown">
          {!keyword ? (
            <>
              <p className="field__label">추천 검색어</p>
              <div className="row">
                {['입고', '예약'].map((word) => (
                  <Button
                    key={word}
                    variant="secondary"
                    onClick={() => {
                      update(word)
                      input.current.focus()
                    }}
                  >
                    {word}
                  </Button>
                ))}
              </div>
              <ul
                id={id}
                role="listbox"
                aria-label="검색 결과"
                className="sr-only"
              />
            </>
          ) : (
            <>
              <div className="home-search__summary">
                <p>“{query.trim()}” 검색 결과</p>
                <span role="status">{results.length}개</span>
              </div>
              <ul
                id={id}
                role="listbox"
                aria-label="검색 결과"
                className="home-search__results"
              >
                {results.map((item, index) => (
                  <li key={item.type + item.id} role="presentation">
                    <button
                      id={id + '-' + index}
                      type="button"
                      role="option"
                      aria-selected={active === index}
                      onClick={() => select(item)}
                    >
                      <span
                        className={
                          'home-search__icon home-search__icon--' + item.type
                        }
                      >
                        {item.type === 'task' ? (
                          <Home size={20} aria-hidden="true" />
                        ) : (
                          <BookOpen size={20} aria-hidden="true" />
                        )}
                      </span>
                      <span className="home-search__name">
                        <strong>{item.title}</strong>
                        <small>{item.label}</small>
                      </span>
                      <img src={chevronIcon} alt="" />
                    </button>
                  </li>
                ))}
              </ul>
              {!results.length && (
                <div className="home-search__empty" role="status">
                  <StatusIcon type="search" />
                  <p>검색 결과가 없어요</p>
                  <small>다른 업무 이름이나 카드 제목으로 검색해 보세요.</small>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      update('')
                      input.current.focus()
                    }}
                  >
                    검색어 지우기
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
