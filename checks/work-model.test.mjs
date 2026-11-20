import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateWorkFields,
  workScenarios,
  scenarioForTask,
} from '../src/data/work.js'
import {
  putDemoJob,
  readDemoRecord,
  saveDemoWorkCard,
  readDemoCollection,
} from '../src/services/demo/workWorkspace.js'

test('unconfirmed quantities and reservation availability prevent saving', () => {
  const inventory = structuredClone(workScenarios.inventory.fields)
  assert.ok(validateWorkFields(inventory, 'inventory').length)
  inventory.find((field) => field.key === 'quantity').value = -1
  for (const field of inventory) field.checked = true
  inventory.find((field) => field.key === 'reason').value = '차이 사유'
  assert.ok(
    validateWorkFields(inventory, 'inventory').some((error) =>
      error.includes('0 이상의 정수'),
    ),
  )
  const reservation = workScenarios.reservation.fields.map((field) => ({
    ...field,
    checked: true,
  }))
  assert.ok(validateWorkFields(reservation, 'reservation', false).length)
  assert.deepEqual(validateWorkFields(reservation, 'reservation', true), [])
  assert.throws(() =>
    putDemoJob({ stage: 'result', scenario: 'inventory', fields: inventory }),
  )
})
test('saved work keeps its own fields and baseline; saving a card twice is idempotent', () => {
  const fields = workScenarios.inventory.fields.map((field) => ({
    ...field,
    checked: true,
    value:
      field.key === 'reason'
        ? '2개 미입고'
        : field.key === 'quantity'
          ? 18
          : field.value,
  }))
  const job = putDemoJob({
    taskId: 1,
    name: '검증 작업',
    stage: 'result',
    scenario: 'inventory',
    fields,
    baseline: { version: 1, name: '재고 입고 기록' },
    availability: false,
  })
  job.fields[2].value = 99
  job.baseline.version = 2
  const saved = readDemoRecord('jobs', job.id)
  assert.equal(saved.fields[2].value, 18)
  assert.equal(saved.baseline.version, 1)
  const count = readDemoCollection('cards').length
  const card = saveDemoWorkCard(saved)
  assert.equal(saveDemoWorkCard(saved).id, card.id)
  assert.equal(readDemoCollection('cards').length, count + 1)
  assert.equal(card.baseline.version, 1)
})
test('unknown jobs do not borrow an inventory scenario and the two procedures stay separate', () => {
  assert.equal(scenarioForTask({ id: 99, name: '기타 업무' }), null)
  assert.equal(scenarioForTask({ id: 1 }), 'inventory')
  assert.equal(scenarioForTask({ id: 2 }), 'reservation')
  assert.equal(readDemoRecord('cards', 51).steps.length, 4)
  assert.equal(readDemoRecord('cards', 52).steps.length, 5)
  assert.equal(
    readDemoRecord('cards', 52).baseline.manual,
    '예약 시스템 매뉴얼.pdf',
  )
})
