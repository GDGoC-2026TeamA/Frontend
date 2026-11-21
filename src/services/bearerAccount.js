import { apiRequest } from './api/client'
import { readServerToken, saveServerToken } from './authToken'

// The server currently returns a token, not a profile. Display the login ID only.
const identity = (loginId) => ({
  user: { id: `login:${loginId.toLowerCase()}`, name: loginId, email: '' },
})

export async function bearerAccountRequest(action, body, { signal } = {}) {
  if (action === 'signup') {
    const result = await apiRequest('accounts', {
      method: 'POST',
      body,
      signal,
    })
    if (!Number.isInteger(result?.id))
      throw new Error('가입 결과를 확인할 수 없어요. 다시 시도해 주세요.')
    return { accountCreated: true }
  }
  if (action === 'login') {
    const result = await apiRequest('sessions', {
      method: 'POST',
      body,
      signal,
    })
    signal?.throwIfAborted()
    saveServerToken(result?.token, body.login_id)
    return identity(body.login_id)
  }
  if (action === 'session') {
    const saved = readServerToken()
    if (!saved)
      throw Object.assign(new Error('먼저 로그인해 주세요.'), { status: 401 })
    // A protected read verifies the opaque token; local display data is not proof.
    const spaces = await apiRequest('workspaces', { signal })
    if (!Array.isArray(spaces))
      throw new Error('로그인 상태를 확인할 수 없어요. 다시 시도해 주세요.')
    return saved.user ? { user: saved.user } : identity(saved.loginId)
  }
  throw Object.assign(
    new Error('아직 이 계정 기능은 서버에 연결되지 않았어요.'),
    {
      code: 'AUTH_NOT_CONFIGURED',
    },
  )
}
