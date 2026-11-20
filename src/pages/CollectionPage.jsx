import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { Header } from '../components/layout/Header'
import { Button, Input, StatePanel } from '../components/ui'
import { StatusIcon } from '../components/ui/StatusIcon'
import { getCollection } from '../services/collectionService'

const copy = {
  cards: {
    title: '개인 업무 카드',
    description: '업무 중 다시 볼 절차를 한곳에 모아 두세요.',
    empty: '저장한 업무 카드가 없어요',
    help: '업무를 처리한 뒤 확인한 절차를 카드로 저장해 보세요.',
    action: '업무 선택하기',
    aside: '카드 사용 방법',
    note: '절차 다시 보기',
    detail:
      '저장하면 새로운 작업을 할 때 필요한 순서와 매뉴얼 근거를 다시 볼 수 있어요.',
    icon: 'cards',
  },
  jobs: {
    title: '작업 내역',
    description: '시작한 작업과 저장한 결과를 확인해요.',
    empty: '아직 시작한 작업이 없어요',
    help: '등록한 업무에서 작업을 시작하면 여기서 다시 확인할 수 있어요.',
    action: '업무 시작하기',
    aside: '작업 기록',
    note: '기록되는 작업',
    detail: '검토 중인 초안과 저장한 결과를 다시 열 수 있어요.',
    icon: 'history',
  },
}

export default function CollectionPage({ kind }) {
  const content = copy[kind]
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [retry, setRetry] = useState(0)
  const [searchParams] = useSearchParams()
  const emptyDemo = searchParams.get('empty') === '1'
  const [query, setQuery] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    getCollection(kind, { signal: controller.signal, emptyDemo })
      .then((value) => {
        if (!controller.signal.aborted) setResult(value)
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason)
      })
    return () => controller.abort()
  }, [kind, retry, emptyDemo])
  return (
    <AppLayout
      variant="home"
      homeAside={
        <section className="collection-aside">
          <h2>{content.aside}</h2>
          <div>
            <h3>{content.note}</h3>
            <p>{content.detail}</p>
          </div>
        </section>
      }
    >
      {({ openMenu }) => (
        <div className="page-stack collection-page">
          <Link to="/" className="collection-back">
            ‹ 홈
          </Link>
          <Header
            variant="home"
            showSearch={false}
            title={content.title}
            description={content.description}
            onMenu={openMenu}
          />
          {error ? (
            <StatePanel
              type="error"
              title="목록을 불러오지 못했어요"
              description="서버 연결을 확인한 뒤 다시 시도해 주세요. 빈 목록으로 처리하지 않았어요."
              actionLabel="다시 시도"
              onAction={() => {
                setError(null)
                setResult(null)
                setRetry((n) => n + 1)
              }}
            />
          ) : !result ? (
            <StatePanel type="loading" title="목록을 불러오고 있어요" />
          ) : !result.items.length ? (
            <section className="collection-empty" aria-label={content.empty}>
              <StatusIcon type={content.icon} />
              <h2>{content.empty}</h2>
              <p>{content.help}</p>
              <Button onClick={() => navigate('/')}>{content.action}</Button>
            </section>
          ) : (
            <section className="collection-records" aria-label={content.title}>
              <Input
                label={kind === 'cards' ? '카드 검색' : '작업 검색'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
              />
              {result.items
                .filter((item) =>
                  (item.title || item.name || '')
                    .toLocaleLowerCase()
                    .includes(query.trim().toLocaleLowerCase()),
                )
                .map((item, index) => (
                  <article key={item.id ?? index}>
                    <h2>{item.title || item.name || '이름 미확인'}</h2>
                    {item.status && <p>{item.status}</p>}
                    <Link
                      to={
                        kind === 'cards'
                          ? `/work-cards/${encodeURIComponent(item.id)}`
                          : `/jobs/${encodeURIComponent(item.id)}`
                      }
                    >
                      {kind === 'cards'
                        ? '절차 보기'
                        : item.status === '결과 저장됨'
                          ? '결과 보기'
                          : '검토 이어하기'}
                    </Link>
                  </article>
                ))}
              {!result.items.some((item) =>
                (item.title || item.name || '')
                  .toLocaleLowerCase()
                  .includes(query.trim().toLocaleLowerCase()),
              ) && (
                <StatePanel
                  title="검색 결과가 없어요"
                  actionLabel="검색어 지우기"
                  onAction={() => setQuery('')}
                />
              )}
            </section>
          )}
          {result?.source === 'demo' && (
            <p className="collection-demo">
              예시 목록과 이 탭에서 저장한 기록이에요. 실제 서버의 저장 내역이
              아니며 새로고침하면 예시 목록으로 돌아가요.
            </p>
          )}
        </div>
      )}
    </AppLayout>
  )
}
