import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MessageCircle, LoaderCircle } from 'lucide-react'
import { Button, Input, StatePanel } from '../components/ui'
import {
  accountRequest,
  acceptServerAccount,
  demoAccounts,
  safeReturnPath,
  socialStartUrl,
  startExampleAccount,
  useAccount,
  hasAccountEndpoint,
} from '../services/accountService'
import inventory from '../assets/home/inventory.svg?no-inline'

const titles = {
  '/login': '로그인',
  '/signup': '회원가입',
  '/forgot-password': '비밀번호 재설정',
  '/reset-sent': '이메일을 확인해 주세요',
  '/reset-password': '새 비밀번호 설정',
  '/verify-email': '이메일을 확인해 주세요',
  '/auth/callback': '로그인하는 중이에요',
  '/auth/welcome': '시작할 준비가 됐어요',
}
export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const account = useAccount()
  const route = location.pathname
  const signup = route === '/signup'
  const login = route === '/login'
  const reset = route === '/reset-password'
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [provider, setProvider] = useState('')
  const active = useRef(null)
  const locked = useRef(false)
  const heading = useRef(null)
  useEffect(() => {
    document.title = `${titles[route] || '로그인'} | WORK BRIDGE`
    heading.current?.focus()
    return () => active.current?.abort()
  }, [route])
  useEffect(() => {
    if (route !== '/auth/callback') return
    const controller = new AbortController()
    // The server verifies OAuth state, authorization code and its session cookie.
    // Query-string success/user/token values are never accepted as authentication.
    accountRequest('session', undefined, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        acceptServerAccount(result)
        navigate(result.firstVisit ? '/auth/welcome' : '/', { replace: true })
      })
      .catch((cause) => {
        if (cause.name !== 'AbortError') setError(cause.message)
      })
    return () => controller.abort()
  }, [route, navigate])
  const update = (key) => (event) =>
    setValues({ ...values, [key]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    if (locked.current) return
    const next = {}
    if (signup && !values.name.trim()) next.name = '이름을 입력해 주세요.'
    if (!reset && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = '이메일 형식을 확인해 주세요.'
    if ((login || signup || reset) && !values.password)
      next.password = '비밀번호를 입력해 주세요.'
    if ((signup || reset) && values.password.length < 8)
      next.password = '비밀번호를 8자 이상 입력해 주세요.'
    if ((signup || reset) && values.confirm !== values.password)
      next.confirm = '비밀번호가 일치하지 않아요.'
    setErrors(next)
    setError('')
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        document.querySelector('[aria-invalid="true"]')?.focus(),
      )
      return
    }
    locked.current = true
    setBusy(true)
    const controller = new AbortController()
    active.current = controller
    try {
      if (demoAccounts && (login || signup)) {
        startExampleAccount({
          name: signup ? values.name.trim() : '이서연',
          email: values.email.trim(),
        })
        navigate(signup ? '/' : safeReturnPath(location.state?.returnTo), {
          replace: true,
          state: { firstVisit: true },
        })
      } else if (login || signup) {
        const result = await accountRequest(
          signup ? 'signup' : 'login',
          {
            ...(signup ? { name: values.name.trim() } : {}),
            email: values.email.trim(),
            password: values.password,
          },
          { signal: controller.signal },
        )
        if (signup && result?.verificationRequired === true)
          navigate('/verify-email', { state: { email: values.email.trim() } })
        else {
          acceptServerAccount(result)
          navigate(safeReturnPath(location.state?.returnTo), { replace: true })
        }
      } else if (reset) {
        const token = new URLSearchParams(location.search).get('token')
        if (!token)
          throw new Error(
            '재설정 링크가 없거나 만료됐어요. 새 링크를 요청해 주세요.',
          )
        await accountRequest(
          'resetPassword',
          { token, password: values.password },
          { signal: controller.signal },
        )
        navigate('/login', { replace: true, state: { passwordChanged: true } })
      } else {
        await accountRequest(
          'resetRequest',
          { email: values.email.trim() },
          { signal: controller.signal },
        )
        navigate('/reset-sent', { replace: true })
      }
    } catch (cause) {
      if (cause.name !== 'AbortError') setError(cause.message)
    } finally {
      locked.current = false
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  const social = (name) => {
    setProvider(name)
    setError('')
    try {
      const url = socialStartUrl(name)
      if (!url) {
        setProvider(name)
        setError(
          '아직 소셜 로그인 서버가 연결되지 않았어요. 다른 로그인 방법을 선택해 주세요.',
        )
        return
      }
      setBusy(true)
      window.location.assign(url)
    } catch (cause) {
      setError(cause.message)
      setBusy(false)
    }
  }
  const connecting = busy && provider
  const statusOnly =
    connecting ||
    [
      '/reset-sent',
      '/verify-email',
      '/auth/callback',
      '/auth/welcome',
    ].includes(route)
  const description = signup
    ? '내 작업 공간에서 새 업무를 익히고 기록하세요.'
    : reset
      ? '앞으로 로그인할 때 쓸 비밀번호를 입력해 주세요.'
      : route === '/forgot-password'
        ? '가입할 때 입력한 이메일을 적어 주세요.'
        : location.state?.passwordChanged
          ? '변경한 비밀번호로 다시 로그인해 주세요.'
          : '소셜 계정이나 이메일로 내 작업 공간을 열어요.'
  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="auth-title">
        <aside className="auth-story">
          <Link className="auth-brand" to="/">
            <b>W</b> WORK BRIDGE
          </Link>
          <h2>
            달라진 업무를
            <br />내 일에 맞게
          </h2>
          <p>
            자료를 비교하고, 연습한 절차를 업무에 써 보세요.
            <br />내 작업 기록은 내 공간에 남아요.
          </p>
          <img src={inventory} alt="업무 자료와 새 절차를 살펴보는 모습" />
        </aside>
        <div className="auth-content">
          <h1 id="auth-title" ref={heading} tabIndex={-1}>
            {connecting
              ? '로그인하는 중이에요'
              : route === '/auth/welcome' && !account.user
                ? '계정을 확인해 주세요'
                : error && route === '/auth/callback'
                  ? '로그인에 실패했어요'
                  : titles[route] || '로그인'}
          </h1>
          {!statusOnly && <p className="auth-description">{description}</p>}
          {!demoAccounts &&
            (login || signup) &&
            !hasAccountEndpoint(signup ? 'signup' : 'login') && (
              <p className="account-demo-note" role="status">
                회원가입과 로그인은 계정 서버 연결 후 쓸 수 있어요. 현재는
                화면을 확인할 수 있어요.
              </p>
            )}
          {demoAccounts && !statusOnly && (
            <p className="account-demo-note">
              예시 화면이에요. 입력한 비밀번호를 저장하거나 서버에 보내지
              않아요. 실제 계정의 비밀번호는 입력하지 마세요.
            </p>
          )}
          {error && (
            <p className="account-error" role="alert">
              {error}
            </p>
          )}
          {(login || signup) && (
            <>
              <div className="auth-social">
                <Button
                  className="auth-kakao"
                  disabled={busy}
                  onClick={() => social('kakao')}
                >
                  <MessageCircle
                    size={19}
                    fill="currentColor"
                    aria-hidden="true"
                  />
                  카카오로 {signup ? '시작하기' : '로그인'}
                </Button>
                <Button
                  className="auth-google"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => social('google')}
                >
                  <span aria-hidden="true" className="google-mark">
                    G
                  </span>
                  Google로 {signup ? '시작하기' : '로그인'}
                </Button>
              </div>
              <div className="auth-divider">또는 이메일로 계속하기</div>
            </>
          )}
          {!statusOnly && (
            <form onSubmit={submit} noValidate aria-busy={busy}>
              {signup && (
                <Input
                  label="이름"
                  autoComplete="name"
                  maxLength={40}
                  value={values.name}
                  onChange={update('name')}
                  error={errors.name}
                  required
                />
              )}
              {!reset && (
                <Input
                  label="이메일"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  maxLength={254}
                  value={values.email}
                  onChange={update('email')}
                  error={errors.email}
                  required
                />
              )}
              {(login || signup || reset) && (
                <Input
                  label={reset ? '새 비밀번호' : '비밀번호'}
                  type="password"
                  autoComplete={login ? 'current-password' : 'new-password'}
                  maxLength={128}
                  value={values.password}
                  onChange={update('password')}
                  error={errors.password}
                  required
                />
              )}
              {(signup || reset) && (
                <Input
                  label={reset ? '새 비밀번호 확인' : '비밀번호 확인'}
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  value={values.confirm}
                  onChange={update('confirm')}
                  error={errors.confirm}
                  required
                />
              )}
              <div className="auth-actions">
                <Button type="submit" loading={busy} loadingLabel="요청 중">
                  {signup
                    ? '가입하기'
                    : login
                      ? '로그인'
                      : reset
                        ? '비밀번호 바꾸기'
                        : '재설정 링크 보내기'}
                </Button>
                {login && (
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/signup')}
                  >
                    회원가입
                  </Button>
                )}
              </div>
            </form>
          )}
          {route === '/reset-sent' && (
            <StatePanel
              type="success"
              title="이메일 확인"
              description="등록된 이메일이면 비밀번호 재설정 링크를 보내요. 받은 편지함에서 메일을 찾을 수 없다면 스팸함도 확인해 주세요."
            />
          )}
          {route === '/verify-email' && (
            <StatePanel
              title="인증 대기"
              description={
                location.state?.email
                  ? `${location.state.email} 주소로 받은 인증 링크를 열어 주세요.`
                  : '가입 이메일의 인증 링크를 확인해 주세요. 아직 인증 완료를 확인하지 않았어요.'
              }
            />
          )}
          {route === '/auth/callback' && !error && (
            <div className="auth-connecting" role="status">
              <LoaderCircle className="spinner" aria-hidden="true" />
              계정 연결 결과를 기다리고 있어요.
            </div>
          )}
          {route === '/auth/welcome' && account.user && (
            <StatePanel
              type="success"
              title="계정 연결 완료"
              description="첫 업무를 등록하면 달라진 절차를 확인하고, 내 업무에서 써 볼 수 있어요."
              actionLabel="내 작업 공간 열기"
              onAction={() => navigate('/')}
            />
          )}
          {route === '/auth/welcome' && !account.user && (
            <StatePanel
              title="로그인이 필요해요"
              description="연결한 계정을 확인한 뒤 내 작업 공간을 열 수 있어요."
              actionLabel="로그인"
              onAction={() => navigate('/login')}
            />
          )}
          {connecting && (
            <div className="auth-connecting" role="status">
              <LoaderCircle className="spinner" aria-hidden="true" />
              {provider === 'kakao' ? '카카오' : 'Google'} 계정으로 WORK
              BRIDGE에 연결하고 있어요.
            </div>
          )}
          {provider && demoAccounts && (
            <Button
              variant="secondary"
              onClick={() => {
                startExampleAccount()
                navigate('/auth/welcome')
              }}
            >
              첫 사용 예시 보기
            </Button>
          )}
          {login ? (
            <>
              <Link className="auth-back" to="/signup">
                처음 오셨나요? 회원가입
              </Link>
              <Link className="auth-back" to="/forgot-password">
                비밀번호를 잊으셨나요?
              </Link>
            </>
          ) : (
            <Link className="auth-back" to="/login">
              로그인으로 돌아가기
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
