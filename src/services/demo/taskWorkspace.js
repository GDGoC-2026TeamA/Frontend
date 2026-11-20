import { useSyncExternalStore } from 'react'
import { homeExample } from '../../data/home'
import { registrationExample } from '../../data/registration'

// Session-only fixtures. Nothing here authenticates a user or writes to the API.
let tasks = homeExample.tasks.map((task, index) => ({
  ...task,
  scope: index === 0 ? 'shared' : 'owned',
  owner: index === 0 ? '김민수' : '이서연',
  publication: index === 0 ? 'published' : 'draft',
  version: 1,
  analysisId: 20 + index,
  comparison: index === 0 ? structuredClone(registrationExample) : null,
  publishedSnapshot:
    index === 0
      ? {
          version: 1,
          analysisId: 20,
          comparison: structuredClone(registrationExample),
          procedure: registrationExample.procedure,
          question: registrationExample.question,
        }
      : null,
}))
const listeners = new Set()
const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const snapshot = () => tasks
export function useDemoTasks() {
  return useSyncExternalStore(subscribe, snapshot)
}
export function getDemoLearningTask(taskId) {
  const key = taskId === 'inventory' ? '1' : String(taskId)
  const task = tasks.find((item) => String(item.id) === key)
  return task ? structuredClone(task) : null
}
export function markDemoLearningComplete(taskId, version) {
  const task = tasks.find((item) => String(item.id) === String(taskId))
  if (!task || (task.publishedSnapshot?.version || task.version) !== version)
    return
  tasks = tasks.map((item) =>
    item.id === task.id ? { ...item, learningStatus: '학습 완료' } : item,
  )
  listeners.forEach((listener) => listener())
}
export function saveDemoTask(task) {
  if (task.scope === 'shared')
    throw new Error('공유받은 업무는 수정할 수 없어요.')
  const record = {
    ...task,
    id: task.id ?? `demo-${crypto.randomUUID()}`,
    scope: 'owned',
    owner: '이서연',
  }
  tasks = tasks.some((item) => item.id === record.id)
    ? tasks.map((item) => (item.id === record.id ? record : item))
    : [record, ...tasks]
  listeners.forEach((listener) => listener())
  return record
}
export function sharedTaskView(task) {
  if (!task.publishedSnapshot) throw new Error('아직 공유된 기준이 없어요.')
  // Only reviewed baseline fields cross into the recipient preview.
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    owner: task.owner,
    version: task.publishedSnapshot.version,
    publication: 'published',
    scope: 'shared',
    analysisId: task.publishedSnapshot.analysisId,
    comparison: structuredClone(
      task.publishedSnapshot.comparison || task.comparison,
    ),
    saved: {
      procedure: task.publishedSnapshot.procedure,
      question: task.publishedSnapshot.question,
    },
  }
}
