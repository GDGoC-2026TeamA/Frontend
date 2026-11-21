import { bearerAccounts, readServerToken } from '../authToken'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Pass resource-relative paths, e.g. 'tasks/1/materials'; base includes /api/v1.
// responseType: 'response' preserves binary downloads and Content-Disposition.
export async function apiRequest(
  path,
  { method = 'GET', body, signal, responseType = 'json' } = {},
) {
  if (!['json', 'response'].includes(responseType))
    throw new TypeError('지원하지 않는 응답 형식입니다.')
  const base =
    import.meta.env.VITE_API_BASE_URL ||
    'https://gdgoc2026a.up.railway.app/api/v1'
  const isForm = body instanceof FormData
  const headers = {
    Accept: responseType === 'response' ? '*/*' : 'application/json',
  }
  if (body !== undefined && !isForm)
    headers['Content-Type'] = 'application/json'
  const token = readServerToken()?.token
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(
    `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
    {
      method,
      ...(bearerAccounts
        ? { credentials: 'omit' }
        : import.meta.env.VITE_AUTH_SESSION_PATH
          ? { credentials: 'include' }
          : {}),
      signal,
      headers,
      // The browser must add the multipart boundary for FormData.
      body: body === undefined || isForm ? body : JSON.stringify(body),
    },
  )
  if (!response.ok) {
    if (
      response.status === 401 &&
      (token || import.meta.env.VITE_AUTH_SESSION_PATH)
    )
      window.dispatchEvent(new Event('workbridge:session-expired'))
    throw new ApiError(
      response.status === 401 && path === 'sessions'
        ? '아이디와 비밀번호를 다시 확인해 주세요.'
        : response.status === 409 && path === 'accounts'
          ? '이미 등록된 계정이에요. 아이디와 이메일을 확인해 주세요.'
          : response.status === 422
            ? '입력한 정보의 형식을 확인해 주세요.'
            : '요청을 마치지 못했어요. 잠시 후 다시 시도해 주세요.',
      response.status,
    )
  }
  if (responseType === 'response') return response
  if (response.status === 204) return null
  const result = await response.json()
  signal?.throwIfAborted()
  return result
}
