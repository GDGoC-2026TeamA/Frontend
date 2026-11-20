import { apiRequest } from './api/client'
import { getDemoLearningTask } from './demo/taskWorkspace'
import { readDemoRecord, renameDemoCard } from './demo/workWorkspace'

export const workMode = () => import.meta.env.VITE_DATA_MODE || 'demo'
const validId = (value) =>
  typeof value === 'string' || typeof value === 'number'
export function normalizeWorkFields(fields, missing = []) {
  if (!Array.isArray(fields) || !Array.isArray(missing))
    throw new Error('초안 응답 형식을 확인해 주세요.')
  const keys = new Set()
  const normalized = fields.map((field) => {
    if (
      !field ||
      typeof field.key !== 'string' ||
      !field.key ||
      keys.has(field.key) ||
      !['string', 'number'].includes(typeof field.value) ||
      typeof field.checked !== 'boolean'
    )
      throw new Error('초안 항목 형식을 확인해 주세요.')
    keys.add(field.key)
    return {
      key: field.key,
      label: field.key,
      value: field.value,
      checked: field.checked,
      valueType: typeof field.value,
    }
  })
  for (const key of missing) {
    if (typeof key !== 'string' || !key)
      throw new Error('누락 항목 형식을 확인해 주세요.')
    if (!keys.has(key)) {
      keys.add(key)
      normalized.push({ key, label: key, value: '', checked: false })
    }
  }
  return normalized
}
export async function loadWorkTask(id, { signal } = {}) {
  if (workMode() === 'demo') return getDemoLearningTask(id)
  if (workMode() !== 'api') throw new Error('지원하지 않는 데이터 모드예요.')
  if (!/^\d+$/.test(String(id)))
    throw new Error('업무 목록에서 서버 업무를 선택해 주세요.')
  const task = await apiRequest(`tasks/${id}`, { signal })
  if (
    !task ||
    String(task.id) !== String(id) ||
    typeof task.name !== 'string' ||
    !Array.isArray(task.materials) ||
    task.materials.some((item) => !item || typeof item.filename !== 'string')
  )
    throw new Error('업무 응답 형식을 확인해 주세요.')
  return task
}
export async function loadWorkRecord(kind, id, { signal } = {}) {
  if (workMode() === 'demo') return readDemoRecord(kind, id)
  if (workMode() !== 'api' || !/^\d+$/.test(String(id)))
    throw new Error('서버 기록 ID를 확인해 주세요.')
  const item = await apiRequest(`${kind}/${id}`, { signal })
  if (!item || String(item.id) !== String(id) || !validId(item.taskId))
    throw new Error('기록 응답 형식을 확인해 주세요.')
  if (kind === 'jobs')
    return {
      ...item,
      fields: normalizeWorkFields(item.fields, item.pending || []),
      stage: item.status === '결과 저장됨' ? 'result' : 'review',
      scenario: null,
      baseline: { taskId: item.taskId, name: '서버 업무', version: null },
      files: item.files || [],
      availability: false,
    }
  if (
    typeof item.title !== 'string' ||
    !Array.isArray(item.steps) ||
    item.steps.some((step) => typeof step !== 'string')
  )
    throw new Error('카드 응답 형식을 확인해 주세요.')
  return item
}
export async function createApiDraft(
  task,
  name,
  description,
  files,
  progress,
  signal,
) {
  if (!progress.jobId) {
    const job = await apiRequest(`tasks/${task.id}/jobs`, {
      method: 'POST',
      body: { name, description },
      signal,
    })
    if (!validId(job?.id) || String(job.taskId) !== String(task.id))
      throw new Error('작업 생성 응답을 확인해 주세요.')
    progress.jobId = job.id
  }
  for (const file of files) {
    if (progress.uploads.has(file)) continue
    const body = new FormData()
    body.append('file', file)
    const uploaded = await apiRequest(`jobs/${progress.jobId}/files`, {
      method: 'POST',
      body,
      signal,
    })
    if (!validId(uploaded?.id) || typeof uploaded.filename !== 'string')
      throw new Error('첨부 응답을 확인해 주세요.')
    progress.uploads.set(file, uploaded)
  }
  const draft = await apiRequest(`jobs/${progress.jobId}/draft`, {
    method: 'POST',
    body: { fileIds: files.map((file) => progress.uploads.get(file).id) },
    signal,
  })
  if (String(draft?.jobId) !== String(progress.jobId))
    throw new Error('초안 작업 ID가 달라요.')
  return {
    id: progress.jobId,
    taskId: task.id,
    name,
    stage: 'review',
    status: '검토 중',
    fields: normalizeWorkFields(draft.fields, draft.missing || []),
    source: draft.source,
    files: files.map((file) => progress.uploads.get(file)),
    scenario: null,
    baseline: {
      taskId: task.id,
      name: task.name,
      materials: task.materials,
      version: null,
    },
    availability: false,
  }
}
export async function saveApiDraft(job) {
  const fields = job.fields.map(({ key, value, checked }) => ({
    key,
    value,
    checked,
  }))
  const lastField = job.lastField || fields.at(-1)?.key || ''
  const response = await apiRequest(`jobs/${job.id}/draft`, {
    method: 'PATCH',
    body: { fields, lastField },
  })
  if (String(response?.jobId) !== String(job.id))
    throw new Error('초안 저장 응답을 확인해 주세요.')
  const saved = normalizeWorkFields(response.fields)
  if (
    fields.some(
      (field) =>
        !saved.some(
          (item) =>
            item.key === field.key &&
            item.value === field.value &&
            item.checked === field.checked,
        ),
    )
  )
    throw new Error('수정한 값이나 확인 상태가 서버 응답과 달라요.')
  return { ...job, fields: saved, lastField: response.lastField }
}
export async function saveApiResult(job) {
  const response = await apiRequest(`jobs/${job.id}/result`, { method: 'POST' })
  if (
    String(response?.jobId) !== String(job.id) ||
    response.status !== '결과 저장됨' ||
    !Array.isArray(response.pending) ||
    response.pending.length
  )
    throw new Error('결과가 저장되지 않았거나 미확인 항목이 남아 있어요.')
  const fields = normalizeWorkFields(response.fields)
  if (fields.some((field) => !field.checked))
    throw new Error('서버 결과에 확인되지 않은 항목이 남아 있어요.')
  return { ...job, fields, stage: 'result', status: response.status }
}
export async function renameWorkCard(id, title) {
  if (workMode() === 'demo') return renameDemoCard(id, title)
  const result = await apiRequest(`cards/${id}`, {
    method: 'PATCH',
    body: { title },
  })
  if (String(result?.id) !== String(id) || typeof result.title !== 'string')
    throw new Error('카드 수정 응답을 확인해 주세요.')
  return result
}
export async function downloadWorkResult(id) {
  const response = await apiRequest(`jobs/${id}/result/download`, {
    responseType: 'response',
  })
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const disposition = response.headers.get('Content-Disposition') || ''
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  let filename =
    disposition.match(/filename="?([^";]+)"?/i)?.[1] || `work-result-${id}`
  if (encoded) {
    try {
      filename = decodeURIComponent(encoded)
    } catch {
      /* retain ordinary filename */
    }
  }
  const link = document.createElement('a')
  link.href = url
  link.download = filename.replace(/[\\/:*?"<>|]/g, '_')
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
