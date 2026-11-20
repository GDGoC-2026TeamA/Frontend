import { useSyncExternalStore } from 'react'
import { clearDemoTasks } from './demo/taskWorkspace'
import { clearDemoWork } from './demo/workWorkspace'
import { clearLearningSessions } from './learningSessions'
import { apiBaseUrl, dataMode } from './config'

export const demoAccounts = dataMode === 'demo'
let account = {
  user: demoAccounts
    ? { id: 'example', name: '이서연', email: 'name@example.com' }
    : null,
  signedOut: false,
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
export function clearPrivateWorkspace() {
  clearDemoTasks()
  clearDemoWork()
  clearLearningSessions()
}
export function expireAccount() {
  clearPrivateWorkspace()
  setAccount({ user: null, signedOut: false })
}
export function startExampleAccount({
  name = '이서연',
  email = 'name@example.com',
} = {}) {
  clearPrivateWorkspace()
  setAccount({
    user: { id: crypto.randomUUID(), name, email },
    signedOut: false,
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
export async function accountRequest(action, body, { signal } = {}) {
  const path = paths[action]
  if (!path)
    throw new Error(
      '아직 계정 서버가 연결되지 않았어요. 담당자에게 연결 상태를 확인해 주세요.',
    )
  const base = apiBaseUrl
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
    throw new Error(
      response.status === 401
        ? '이메일과 비밀번호를 다시 확인해 주세요.'
        : response.status === 403
          ? '이 작업을 할 권한이 없어요.'
          : '요청을 마치지 못했어요. 잠시 후 다시 시도해 주세요.',
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
  clearPrivateWorkspace()
  setAccount({
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    },
    signedOut: false,
  })
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
  clearPrivateWorkspace()
  setAccount({ user: null, signedOut: true })
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
