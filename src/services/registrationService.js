import { registrationExample } from '../data/registration'

// Only the explicit Figma example can produce a comparison in this iteration.
export function analyzeRegistrationExample({ signal } = {}) {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('분석이 취소됐어요.', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve(structuredClone(registrationExample))
    }, 1400)
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
  })
}
