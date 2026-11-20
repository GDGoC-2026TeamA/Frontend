// Transport for the API tracker. Screens remain in demo mode until connected.
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
  const base = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  const isForm = body instanceof FormData
  const headers = {
    Accept: responseType === 'response' ? '*/*' : 'application/json',
  }
  if (body !== undefined && !isForm)
    headers['Content-Type'] = 'application/json'
  const response = await fetch(
    `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
    {
      method,
      signal,
      headers,
      // The browser must add the multipart boundary for FormData.
      body: body === undefined || isForm ? body : JSON.stringify(body),
    },
  )
  if (!response.ok)
    throw new ApiError(
      '요청을 마치지 못했어요. 잠시 후 다시 시도해 주세요.',
      response.status,
    )
  if (responseType === 'response') return response
  if (response.status === 204) return null
  return response.json()
}
