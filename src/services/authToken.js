// Railway uses Bearer authentication. Explicit session paths keep the cookie adapter.
export const bearerAccounts =
  import.meta.env.VITE_DATA_MODE === 'api' &&
  !import.meta.env.VITE_AUTH_SESSION_PATH
export const accountApiBase = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://gdgoc2026a.up.railway.app/api/v1'
).replace(/\/$/, '')
const key = 'workbridge.server.session.v1'

function validSocialUser(user) {
  return (
    Number.isSafeInteger(user?.id) &&
    user.id > 0 &&
    typeof user.name === 'string' &&
    user.name.trim() &&
    typeof user.email === 'string'
  )
}

export function readServerToken() {
  if (!bearerAccounts) return null
  try {
    const saved = JSON.parse(sessionStorage.getItem(key))
    if (
      saved?.base === accountApiBase &&
      typeof saved.token === 'string' &&
      /^[A-Za-z0-9_-]{32,}$/.test(saved.token) &&
      (validSocialUser(saved.user) ||
        (typeof saved.loginId === 'string' &&
          /^[A-Za-z0-9_.-]{1,64}$/.test(saved.loginId)))
    )
      return saved
  } catch {
    /* Missing or unavailable storage never authenticates a user. */
  }
  return null
}

export function saveServerToken(token, loginId) {
  persistSession(token, { loginId })
}

export function saveSocialSession(token, user) {
  if (!validSocialUser(user))
    throw new Error('소셜 계정 정보를 확인할 수 없어요.')
  persistSession(token, {
    user: { id: user.id, name: user.name, email: user.email },
  })
}

function persistSession(token, display) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{32,}$/.test(token))
    throw new Error('로그인 응답을 확인할 수 없어요. 다시 시도해 주세요.')
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ base: accountApiBase, token, ...display }),
    )
  } catch {
    throw new Error(
      '로그인 상태를 보관할 수 없어요. 사이트 저장소 설정을 확인해 주세요.',
    )
  }
}

export function clearServerToken() {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* Storage may be unavailable. */
  }
}
