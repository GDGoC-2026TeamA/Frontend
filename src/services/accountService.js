import { useSyncExternalStore } from 'react'
import { clearDemoTasks } from './demo/taskWorkspace'
import { clearDemoWork } from './demo/workWorkspace'
import { clearLearningSessions } from './learningSessions'
import {
  DEMO_SESSION_KEY,
  DEMO_SESSION_TTL,
  readExampleSession,
  writeExampleSession,
} from './demoSession'

export const demoAccounts =
  (import.meta.env.VITE_DATA_MODE || 'demo') === 'demo'
let restored = null
try {
  if (demoAccounts) restored = readExampleSession(window.sessionStorage)
} catch {
  /* storage unavailable */
}
if (demoAccounts && !restored?.exampleWorkspace) clearPrivateWorkspace()
let account = {
  user: restored?.user || null,
  expiresAt: restored?.expiresAt || null,
  status: demoAccounts
    ? restored
      ? 'authenticated'
      : 'anonymous'
    : 'unchecked',
  signedOut: false,
  error: '',
}
const listeners = new Set()
const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export const useAccount = () => useSyncExternalStore(subscribe, () => account)
const setAccount = (next) => {
  account = next
  listeners.forEach((listener) => listener())
}
const removeExampleSession = () => {
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY)
  } catch {
    /* storage unavailable */
  }
}
export function clearPrivateWorkspace() {
  clearDemoTasks()
  clearDemoWork()
  clearLearningSessions()
}
export function expireAccount() {
  sessionGeneration += 1
  removeExampleSession()
  clearPrivateWorkspace()
  setAccount({
    user: null,
    status: 'anonymous',
    expiresAt: null,
    signedOut: true,
    error: '',
  })
}
export function startExampleAccount({
  name = '이서연',
  email = 'name@example.com',
} = {}) {
  if (!demoAccounts)
    throw new Error('예시 계정은 예시 모드에서만 열 수 있어요.')
  const user = { id: crypto.randomUUID(), name, email }
  const expiresAt = Date.now() + DEMO_SESSION_TTL
  try {
    writeExampleSession(sessionStorage, user, expiresAt)
  } catch {
    throw new Error(
      '세션을 보관할 수 없어요. 브라우저의 사이트 저장소 설정을 확인해 주세요.',
    )
  }
  clearPrivateWorkspace()
  setAccount({
    user,
    expiresAt,
    status: 'authenticated',
    signedOut: false,
    error: '',
  })
}
export function safeReturnPath(value) {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    ![...value].some((char) => char.charCodeAt(0) <= 32) &&
    !/^\/(login|signup|auth)(\/|\?|$)/.test(value)
    ? value
    : '/'
}
const paths = {
  login: import.meta.env.VITE_AUTH_LOGIN_PATH,
  signup: import.meta.env.VITE_AUTH_SIGNUP_PATH,
  resetRequest: import.meta.env.VITE_AUTH_RESET_REQUEST_PATH,
  resetPassword: import.meta.env.VITE_AUTH_RESET_PASSWORD_PATH,
  session: import.meta.env.VITE_AUTH_SESSION_PATH,
  profile: import.meta.env.VITE_AUTH_PROFILE_PATH,
  email: import.meta.env.VITE_AUTH_EMAIL_PATH,
  logout: import.meta.env.VITE_AUTH_LOGOUT_PATH,
}
export const hasAccountEndpoint = (action) =>
  Boolean(
    paths[action] && (!['login', 'signup'].includes(action) || paths.session),
  )
export async function accountRequest(action, body, { signal } = {}) {
  const path = paths[action]
  if (!hasAccountEndpoint(action))
    throw Object.assign(
      new Error(
        '아직 계정 서버가 연결되지 않았어요. 담당자에게 연결 상태를 확인해 주세요.',
      ),
      { code: 'AUTH_NOT_CONFIGURED' },
    )
  const base = import.meta.env.VITE_API_BASE_URL || window.location.origin
  const url = new URL(path, base.endsWith('/') ? base : base + '/')
  if (url.origin !== new URL(base).origin)
    throw new Error('계정 API는 설정한 서버에서만 호출할 수 있어요.')
  const response = await fetch(url, {
    method:
      action === 'session'
        ? 'GET'
        : action === 'profile' || action === 'email'
          ? 'PATCH'
          : 'POST',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })
  if (!response.ok) {
    if (
      response.status === 401 &&
      ['profile', 'email', 'logout'].includes(action)
    )
      window.dispatchEvent(new Event('workbridge:session-expired'))
    throw Object.assign(
      new Error(
        response.status === 401
          ? '이메일과 비밀번호를 다시 확인해 주세요.'
          : response.status === 403
            ? '이 작업을 할 권한이 없어요.'
            : '요청을 마치지 못했어요. 잠시 후 다시 시도해 주세요.',
      ),
      { status: response.status },
    )
  }
  if (response.status === 204) return null
  const result = await response.json()
  signal?.throwIfAborted()
  return result
}
export function acceptServerAccount(result) {
  if (
    !result?.user?.id ||
    typeof result.user.name !== 'string' ||
    typeof result.user.email !== 'string'
  )
    throw new Error('계정 응답을 확인할 수 없어요. 다시 로그인해 주세요.')
  sessionGeneration += 1
  clearPrivateWorkspace()
  setAccount({
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    },
    signedOut: false,
    status: 'authenticated',
    expiresAt: null,
    error: '',
  })
}
let sessionCheck = null
let sessionGeneration = 0
export function restoreServerSession() {
  if (demoAccounts) return Promise.resolve()
  if (sessionCheck) return sessionCheck
  const generation = sessionGeneration
  setAccount({ ...account, status: 'checking', error: '' })
  sessionCheck = accountRequest('session', undefined, {
    signal: AbortSignal.timeout(15000),
  })
    .then((result) => {
      if (generation === sessionGeneration) acceptServerAccount(result)
    })
    .catch((cause) => {
      if (generation !== sessionGeneration) return
      if (cause.status === 401 || cause.code === 'AUTH_NOT_CONFIGURED')
        setAccount({
          user: null,
          status: 'anonymous',
          signedOut: false,
          expiresAt: null,
          error: '',
        })
      else
        setAccount({
          user: null,
          status: 'error',
          signedOut: false,
          expiresAt: null,
          error: cause.message,
        })
    })
    .finally(() => {
      sessionCheck = null
    })
  return sessionCheck
}
export async function saveAccount(action, value, options) {
  if (!account.user) throw new Error('먼저 로그인해 주세요.')
  const accountId = account.user.id
  const result = demoAccounts
    ? { user: { ...account.user, ...value } }
    : await accountRequest(action, value, options)
  options?.signal?.throwIfAborted()
  if (account.user?.id !== accountId)
    throw new DOMException('Account changed', 'AbortError')
  if (
    !result?.user?.id ||
    typeof result.user.name !== 'string' ||
    typeof result.user.email !== 'string'
  )
    throw new Error('저장 결과를 확인할 수 없어요.')
  if (demoAccounts)
    writeExampleSession(sessionStorage, result.user, account.expiresAt)
  setAccount({
    ...account,
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    },
  })
}
export async function signOut(options) {
  if (!demoAccounts) await accountRequest('logout', undefined, options)
  expireAccount()
}
export function socialStartUrl(provider) {
  const value =
    provider === 'kakao'
      ? import.meta.env.VITE_AUTH_KAKAO_START_URL
      : provider === 'google'
        ? import.meta.env.VITE_AUTH_GOOGLE_START_URL
        : ''
  if (!value) return null
  const url = new URL(value)
  if (
    url.protocol !== 'https:' &&
    !(
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname)
    )
  )
    throw new Error('소셜 로그인 연결 주소를 확인해 주세요.')
  return url.href
}
