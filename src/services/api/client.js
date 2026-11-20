// Proposed transport only; no endpoint has been agreed with the backend team.
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const response = await fetch(
    `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
    {
      method,
      signal,
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  )
  if (!response.ok)
    throw new ApiError(
      '요청을 마치지 못했어요. 잠시 후 다시 시도해 주세요.',
      response.status,
    )
  if (response.status === 204) return null
  return response.json()
}
