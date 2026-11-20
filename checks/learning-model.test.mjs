import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registrationExample } from '../src/data/registration.js'
import {
  createLearningSnapshot,
  questionsForTopics,
  gradeLearning,
  demoLearningAnswer,
} from '../src/services/learningModel.js'

function task() {
  return {
    id: 1,
    name: '재고 입고 기록',
    scope: 'shared',
    version: 1,
    comparison: structuredClone(registrationExample),
    publishedSnapshot: {
      version: 1,
      analysisId: 20,
      comparison: structuredClone(registrationExample),
      procedure: registrationExample.procedure,
      question: registrationExample.question,
    },
  }
}

test('selected confirmed topics determine questions and multiple choice requires the exact set', () => {
  const snapshot = createLearningSnapshot(task())
  assert.equal(questionsForTopics(snapshot, []).length, 0)
  assert.deepEqual(
    questionsForTopics(snapshot, ['exception']).map((item) => item.id),
    ['exception'],
  )
  const entry = questionsForTopics(snapshot, ['entry', 'approval'])
  assert.deepEqual(
    entry.map((item) => item.id),
    ['order', 'fields'],
  )
  assert.equal(
    gradeLearning(entry, {
      order: { values: ['find-first'] },
      fields: { values: ['code'] },
    })[1].correct,
    false,
  )
  assert.equal(
    gradeLearning(entry, { fields: { values: ['quantity', 'code'] } })[1]
      .correct,
    true,
  )
  assert.equal(
    gradeLearning(entry, {
      fields: { values: ['quantity', 'code', 'writer'] },
    })[1].correct,
    false,
  )
})

test('learning keeps the original version and evidence when the current task changes', () => {
  const current = task()
  const snapshot = createLearningSnapshot(current)
  current.publishedSnapshot.version = 2
  current.publishedSnapshot.comparison.rows[0].after = '새 버전에서 달라진 순서'
  assert.equal(snapshot.version, 1)
  assert.equal(snapshot.analysisId, 20)
  assert.equal(
    snapshot.comparison.rows[0].after,
    registrationExample.rows[0].after,
  )
  assert.equal(createLearningSnapshot(current), null)
})

test('unverified edits are not graded as facts and unsupported questions remain unconfirmed', () => {
  const current = task()
  current.publishedSnapshot.procedure = '담당자 승인을 먼저 받아요.'
  const snapshot = createLearningSnapshot(current)
  assert.deepEqual(questionsForTopics(snapshot, ['exception']), [])
  const answer = demoLearningAnswer(snapshot, '승인 담당자 이름을 알려 주세요')
  assert.equal(answer.needsReview, true)
  assert.deepEqual(answer.sources, [])
  assert.match(answer.answer, /답할 수 없어요/)
  assert.equal(
    createLearningSnapshot({
      id: 2,
      name: '다른 업무',
      comparison: { rows: [], materials: [] },
    }),
    null,
  )
})
