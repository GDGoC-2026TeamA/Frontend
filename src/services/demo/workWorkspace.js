import { useSyncExternalStore } from 'react'
import { workScenarios, validateWorkFields } from '../../data/work.js'

const clone = (value) => structuredClone(value)
const baseline = (scenario, taskId) => ({
  taskId,
  name: workScenarios[scenario].title,
  scenario,
  version: 1,
  manual: workScenarios[scenario].manual,
  location: workScenarios[scenario].location,
  quote: workScenarios[scenario].quote,
})
let records = {
  jobs: [
    {
      id: 61,
      taskId: 1,
      name: workScenarios.inventory.name,
      scenario: 'inventory',
      stage: 'review',
      status: '검토 중',
      pendingCount: 2,
      category: '재고 관리',
      displayDate: '예시 작업',
      fields: clone(workScenarios.inventory.fields),
      baseline: baseline('inventory', 1),
      files: [{ name: workScenarios.inventory.file, example: true }],
      availability: false,
    },
    {
      id: 62,
      taskId: 2,
      name: workScenarios.reservation.name,
      scenario: 'reservation',
      stage: 'result',
      status: '결과 저장됨',
      pendingCount: 0,
      category: '예약 접수',
      displayDate: '예시 작업',
      fields: workScenarios.reservation.fields.map((field) => ({
        ...field,
        checked: true,
      })),
      baseline: baseline('reservation', 2),
      files: [{ name: workScenarios.reservation.file, example: true }],
      availability: true,
    },
  ],
  cards: Object.entries(workScenarios).map(([scenario, value], index) => ({
    id: 51 + index,
    taskId: index + 1,
    title: value.cardTitle,
    steps: clone(value.steps),
    baseline: baseline(scenario, index + 1),
    source: 'demo',
    stepCount: value.steps.length,
    category: value.title,
  })),
}
const listeners = new Set()
export const useDemoWork = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => records,
  )
export const readDemoCollection = (kind) => clone(records[kind])
export const readDemoRecord = (kind, id) =>
  clone(records[kind].find((item) => String(item.id) === String(id)) || null)
export function putDemoJob(job) {
  if (
    job.stage === 'result' &&
    validateWorkFields(job.fields, job.scenario, job.availability).length
  )
    throw new Error('미확인 항목을 모두 검토해 주세요.')
  const record = clone({ ...job, id: job.id || `job-${crypto.randomUUID()}` })
  record.pendingCount = record.fields.filter(
    (field) => !field.readonly && !field.checked,
  ).length
  record.category =
    workScenarios[record.scenario]?.title || record.baseline.name
  record.displayDate = '이 탭의 작업'
  records = {
    ...records,
    jobs: records.jobs.some((item) => item.id === record.id)
      ? records.jobs.map((item) => (item.id === record.id ? record : item))
      : [record, ...records.jobs],
  }
  listeners.forEach((listener) => listener())
  return clone(record)
}
export function saveDemoWorkCard(job) {
  if (job.stage !== 'result') throw new Error('작업 결과를 먼저 저장해 주세요.')
  const existing = records.cards.find((card) => card.jobId === job.id)
  if (existing) return clone(existing)
  const example = workScenarios[job.scenario]
  if (!example) throw new Error('확인된 절차가 없어요.')
  const card = {
    id: `card-${crypto.randomUUID()}`,
    taskId: job.taskId,
    jobId: job.id,
    title: example.cardTitle,
    steps: clone(example.steps),
    baseline: clone(job.baseline),
    source: 'demo',
    stepCount: example.steps.length,
    category: job.baseline.name,
  }
  records = { ...records, cards: [card, ...records.cards] }
  listeners.forEach((listener) => listener())
  return clone(card)
}
export function renameDemoCard(id, title) {
  if (!title.trim()) throw new Error('카드 이름을 입력해 주세요.')
  const card = readDemoRecord('cards', id)
  if (!card) throw new Error('카드가 없어요.')
  records = {
    ...records,
    cards: records.cards.map((item) =>
      String(item.id) === String(id) ? { ...item, title: title.trim() } : item,
    ),
  }
  listeners.forEach((listener) => listener())
  return readDemoRecord('cards', id)
}
