import { apiRequest } from './api/client'
import { demoLearningAnswer } from './learningModel'

export async function loadApiLearningTask(taskId, { signal } = {}) {
  if (!/^\d+$/.test(String(taskId)))
    throw new Error('서버의 업무 ID로 열어 주세요.')
  const task = await apiRequest(`tasks/${encodeURIComponent(taskId)}`, {
    signal,
  })
  if (
    !task ||
    String(task.id) !== String(taskId) ||
    typeof task.name !== 'string' ||
    !task.name.trim() ||
    !Array.isArray(task.materials) ||
    task.materials.some(
      (material) =>
        !material ||
        typeof material !== 'object' ||
        (material.id != null &&
          !['string', 'number'].includes(typeof material.id)) ||
        (material.filename != null && typeof material.filename !== 'string'),
    ) ||
    (task.version != null &&
      !['string', 'number'].includes(typeof task.version)) ||
    (task.analysisId != null &&
      !['string', 'number'].includes(typeof task.analysisId))
  )
    throw new Error('업무 응답 형식을 확인해 주세요.')
  return {
    mode: 'api',
    taskId,
    taskName: task.name,
    materials: task.materials,
    version: task.version ?? null,
    analysisId: task.analysisId ?? null,
    scope: ['shared', 'personal'].includes(task.scope) ? task.scope : 'unknown',
    confirmedTopicIds: [],
  }
}

export async function askLearningQuestion(snapshot, question, { signal } = {}) {
  if (snapshot.mode === 'demo') {
    await new Promise((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer)
        reject(new DOMException('질문을 취소했어요.', 'AbortError'))
      }
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', abort)
        resolve()
      }, 500)
      if (signal?.aborted) abort()
      else signal?.addEventListener('abort', abort, { once: true })
    })
    return { ...demoLearningAnswer(snapshot, question), example: true }
  }
  const response = await apiRequest(
    `tasks/${encodeURIComponent(snapshot.taskId)}/questions`,
    { method: 'POST', body: { question }, signal },
  )
  if (
    typeof response?.answer !== 'string' ||
    !response.answer.trim() ||
    !Array.isArray(response.sources) ||
    typeof response.needsReview !== 'boolean'
  )
    throw new Error('질문 응답 형식을 확인해 주세요.')
  if (
    response.sources.some(
      (source) =>
        !source ||
        source.materialId == null ||
        !['string', 'number'].includes(typeof source.materialId) ||
        (source.page != null &&
          !['string', 'number'].includes(typeof source.page)),
    )
  )
    throw new Error('질문 근거 형식을 확인해 주세요.')
  const sources = response.sources.map((source) => ({
    source:
      snapshot.materials.find(
        (material) => String(material.id) === String(source.materialId),
      )?.filename || `자료 #${source.materialId ?? '미확인'}`,
    location: source.page == null ? '위치 정보 없음' : `위치 ${source.page}`,
    quote: null,
    materialId: source.materialId,
  }))
  return {
    answer: response.answer,
    sources,
    needsReview: response.needsReview || sources.length === 0,
    example: false,
  }
}
