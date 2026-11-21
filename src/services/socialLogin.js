import { apiRequest } from './api/client'
import { accountApiBase } from './authToken'

const pendingKey = 'workbridge.social.pending.v1'

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

export async function beginSocialLogin(provider, configuredUrl, returnTo) {
  if (!['google', 'kakao'].includes(provider))
    throw new Error('지원하지 않는 로그인 방식이에요.')
  const url = new URL(
    configuredUrl || accountApiBase + '/sessions/social/' + provider + '/start',
    window.location.origin,
  )
  if (url.origin !== new URL(accountApiBase, window.location.origin).origin)
    throw new Error('소셜 로그인 시작 주소는 백엔드 주소를 사용해 주세요.')
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
  const challenge = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  )
  url.searchParams.set('challenge', base64url(new Uint8Array(challenge)))
  sessionStorage.setItem(
    pendingKey,
    JSON.stringify({ verifier, returnTo, base: accountApiBase }),
  )
  window.location.assign(url.href)
}

export async function finishSocialLogin(fragment) {
  const params = new URLSearchParams(fragment.slice(1))
  const code = params.get('code')
  const raw = sessionStorage.getItem(pendingKey)
  sessionStorage.removeItem(pendingKey)
  if (params.has('error') || !raw || !/^[\w-]{43}$/.test(code || ''))
    throw new Error(
      '소셜 로그인 요청을 확인할 수 없어요. 다시 로그인해 주세요.',
    )
  const pending = JSON.parse(raw)
  if (
    pending.base !== accountApiBase ||
    !/^[\w-]{43}$/.test(pending.verifier || '')
  )
    throw new Error('소셜 로그인을 다시 시작해 주세요.')
  const result = await apiRequest('sessions/social/exchange', {
    method: 'POST',
    body: { code, verifier: pending.verifier },
    signal: AbortSignal.timeout(15000),
  })
  return { result, returnTo: pending.returnTo }
}
