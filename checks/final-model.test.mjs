import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getDemoLearningTask,
  saveDemoTask,
  editDemoTask,
  deleteDemoTask,
  clearDemoTasks,
} from '../src/services/demo/taskWorkspace.js'
import {
  readDemoCollection,
  clearDemoWork,
} from '../src/services/demo/workWorkspace.js'

test('recipient scope cannot be forged to edit, publish or delete someone else task', () => {
  const shared = getDemoLearningTask(1)
  assert.throws(() =>
    saveDemoTask({ ...shared, scope: 'owned', name: 'forged' }),
  )
  assert.throws(() => editDemoTask(1, { name: 'forged', description: '' }))
  assert.throws(() => deleteDemoTask(1))
  assert.equal(getDemoLearningTask(1).name, shared.name)
})
test('metadata changes retain reviewed baseline and deletion keeps private record snapshots', () => {
  const source = getDemoLearningTask(1)
  const record = saveDemoTask({ ...source, id: 'owned-test', scope: 'owned' })
  const originalSnapshot = structuredClone(record.publishedSnapshot)
  editDemoTask(record.id, { name: '이름만 변경', description: '설명만 변경' })
  assert.deepEqual(
    getDemoLearningTask(record.id).publishedSnapshot,
    originalSnapshot,
  )
  assert.throws(() => editDemoTask(record.id, { name: ' ', description: '' }))
  const jobs = readDemoCollection('jobs')
  const cards = readDemoCollection('cards')
  deleteDemoTask(record.id)
  assert.equal(getDemoLearningTask(record.id), null)
  assert.deepEqual(readDemoCollection('jobs'), jobs)
  assert.deepEqual(readDemoCollection('cards'), cards)
})
test('clearing a private workspace removes registered tasks, jobs and personal cards', () => {
  clearDemoTasks()
  clearDemoWork()
  assert.equal(getDemoLearningTask(1), null)
  assert.equal(getDemoLearningTask(2), null)
  assert.deepEqual(readDemoCollection('jobs'), [])
  assert.deepEqual(readDemoCollection('cards'), [])
})
