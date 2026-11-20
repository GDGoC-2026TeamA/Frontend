import { previewEvidence } from '../../data/foundation'

// Only the internal preview uses this response. It performs no analysis or upload.
export async function getFoundationPreview({
  outcome = 'success',
  signal,
} = {}) {
  await new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, 600)
    signal?.addEventListener('abort', abort, { once: true })
  })
  if (outcome === 'error')
    throw new Error('예시 응답 오류입니다. 실제 서버 요청은 보내지 않았어요.')
  return {
    mode: 'demo',
    evidence: outcome === 'insufficient' ? null : { ...previewEvidence },
  }
}
