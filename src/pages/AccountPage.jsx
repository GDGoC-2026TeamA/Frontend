import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { bearerAccounts } from '../services/authToken'
import { Button, Input, SaveToast, StatePanel } from '../components/ui'
import {
  accountRequest,
  acceptServerAccount,
  demoAccounts,
  saveAccount,
  useAccount,
} from '../services/accountService'

export default function AccountPage({ settings = false }) {
  const { user } = useAccount()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(!demoAccounts && !user)
  const [retry, setRetry] = useState(0)
  const locked = useRef(false)
  const controller = useRef(null)
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (demoAccounts || user) return
    const request = new AbortController()
    accountRequest('session', undefined, { signal: request.signal })
      .then((result) => {
        if (request.signal.aborted) return
        acceptServerAccount(result)
        setName(result.user.name)
        setEmail(result.user.email)
      })
      .catch((cause) => {
        if (cause.name !== 'AbortError') setError(cause.message)
      })
      .finally(() => {
        if (!request.signal.aborted) setLoading(false)
      })
    return () => request.abort()
  }, [user, retry])
  const submit = async (event) => {
    event.preventDefault()
    if (locked.current) return
    setError('')
    setNotice('')
    if (!settings && !name.trim()) {
      setError('이름을 입력해 주세요.')
      return
    }
    if (settings && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('이메일 형식을 확인해 주세요.')
      return
    }
    locked.current = true
    setBusy(true)
    controller.current = new AbortController()
    try {
      await saveAccount(
        settings ? 'email' : 'profile',
        settings ? { email: email.trim() } : { name: name.trim() },
        { signal: controller.current.signal },
      )
      setNotice(
        demoAccounts
          ? '이 탭의 예시 계정에 저장했어요. 서버에는 저장하지 않았어요.'
          : '변경 사항을 저장했어요.',
      )
    } catch (cause) {
      if (cause.name !== 'AbortError') setError(cause.message)
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  const cancel = () => {
    controller.current?.abort()
    setName(user?.name || '')
    setEmail(user?.email || '')
    setError('')
    setNotice('')
  }
  return (
    <AppLayout variant="home">
      {({ openMenu }) => (
        <div className="account-page">
          <Button
            variant="ghost"
            className="account-mobile-menu"
            aria-label="메뉴 열기"
            onClick={openMenu}
          >
            메뉴
          </Button>
          <h1 id="page-title" tabIndex={-1}>
            {settings ? '계정 설정' : '내 프로필'}
          </h1>
          <p className="account-subtitle">
            {bearerAccounts
              ? '로그인한 아이디를 확인하세요.'
              : settings
                ? '로그인 이메일과 비밀번호를 관리하세요.'
                : '이름을 수정하고 계정 정보를 확인하세요.'}
          </p>
          {demoAccounts && (
            <p className="account-demo-note">
              예시 계정이에요. 이름과 이메일은 이 탭의 예시 세션에 남아요. 실제
              서버 계정은 바뀌지 않아요.
            </p>
          )}
          {!user ? (
            <StatePanel
              type={loading ? 'loading' : error ? 'error' : 'empty'}
              title={
                loading
                  ? '계정 정보를 불러오고 있어요'
                  : error
                    ? '계정을 불러오지 못했어요'
                    : '계정을 확인해 주세요'
              }
              description={
                error || '계정 정보를 바꾸려면 먼저 로그인해 주세요.'
              }
              actionLabel={loading ? undefined : error ? '다시 시도' : '로그인'}
              onAction={() => {
                if (error) {
                  setError('')
                  setLoading(true)
                  setRetry((count) => count + 1)
                } else navigate('/login')
              }}
            />
          ) : bearerAccounts ? (
            <section className="account-card">
              <h2>로그인 정보</h2>
              <Input label="아이디" value={user.name} readOnly />
              <p>이름과 이메일 조회, 변경은 아직 서버에 연결되지 않았어요.</p>
              <p>로그아웃하면 이 탭의 로그인 정보가 지워져요.</p>
              <Button
                variant="secondary"
                onClick={() =>
                  window.dispatchEvent(new Event('workbridge:logout'))
                }
              >
                로그아웃
              </Button>
            </section>
          ) : (
            <>
              <section className="account-card">
                <h2>{settings ? '로그인 이메일' : '프로필 정보'}</h2>
                <form onSubmit={submit} noValidate aria-busy={busy}>
                  {!settings && (
                    <Input
                      label="이름"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      maxLength={40}
                      hint="업무를 공유할 때 표시할 이름이에요."
                    />
                  )}
                  <Input
                    label="이메일"
                    type="email"
                    value={settings ? email : user.email}
                    onChange={
                      settings
                        ? (event) => setEmail(event.target.value)
                        : undefined
                    }
                    readOnly={!settings}
                    maxLength={254}
                    hint={
                      settings
                        ? '로그인할 때 쓰는 이메일을 입력하세요.'
                        : '이메일은 계정 설정에서 수정할 수 있어요.'
                    }
                  />
                  {error && (
                    <p role="alert" className="account-error">
                      {error}
                    </p>
                  )}
                  <div className="account-actions">
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={cancel}
                    >
                      취소
                    </Button>
                    <Button type="submit" loading={busy}>
                      {settings ? '이메일 변경 사항 저장' : '변경 사항 저장'}
                    </Button>
                  </div>
                </form>
              </section>
              {settings && (
                <>
                  <section className="account-card">
                    <h2>비밀번호</h2>
                    <p>재설정 이메일을 받아 비밀번호를 바꿀 수 있어요.</p>
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/forgot-password')}
                    >
                      비밀번호 재설정
                    </Button>
                  </section>
                  <section className="account-card">
                    <h2>로그아웃</h2>
                    <p>다른 계정으로 로그인하려면 먼저 로그아웃하세요.</p>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        window.dispatchEvent(new Event('workbridge:logout'))
                      }
                    >
                      로그아웃
                    </Button>
                  </section>
                </>
              )}
            </>
          )}
          <SaveToast>{notice}</SaveToast>
        </div>
      )}
    </AppLayout>
  )
}
