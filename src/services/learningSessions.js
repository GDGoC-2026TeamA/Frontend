import { createLearningSnapshot } from './learningModel'

// Private in-memory records. Never added to the task publication model or localStorage.
const sessions = new Map()
export function beginLearningSession(task, id = crypto.randomUUID()) {
  if (sessions.has(id)) return sessions.get(id)
  const snapshot = createLearningSnapshot(task)
  if (!snapshot) return null
  return beginSnapshotSession(snapshot, id)
}
export function beginSnapshotSession(snapshot, id) {
  if (sessions.has(id)) return sessions.get(id)
  const session = {
    id,
    snapshot,
    selected: [],
    answers: {},
    activeQuestion: 0,
    stage: 'select',
    results: null,
    chat: [],
    draftQuestion: '',
  }
  sessions.set(id, session)
  return session
}
export function getLearningSession(id) {
  return sessions.get(id) || null
}
export function updateLearningSession(id, state) {
  const session = sessions.get(id)
  if (session) sessions.set(id, { ...session, ...structuredClone(state) })
}
