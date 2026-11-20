import { homeExample } from '../../data/home'

export async function getDemoHome({ signal } = {}) {
  await new Promise((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException('Aborted', 'AbortError'))
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, 180)
    signal?.addEventListener('abort', abort, { once: true })
  })
  return structuredClone(homeExample)
}
