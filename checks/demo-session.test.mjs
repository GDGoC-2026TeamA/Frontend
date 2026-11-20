import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEMO_SESSION_KEY,
  DEMO_SESSION_TTL,
  readExampleSession,
  writeExampleSession,
} from '../src/services/demoSession.js'
const storage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}
test('example session has an expiry and serializes only the account display fields', () => {
  const store = storage(),
    now = 1000
  writeExampleSession(
    store,
    {
      id: '1',
      name: '예시',
      email: 'demo@example.com',
      password: 'never-store',
      token: 'never-store',
    },
    now + DEMO_SESSION_TTL,
  )
  const raw = store.getItem(DEMO_SESSION_KEY)
  assert.ok(!raw.includes('never-store'))
  assert.equal(readExampleSession(store, now).user.id, '1')
  assert.equal(readExampleSession(store, now + DEMO_SESSION_TTL), null)
  assert.equal(store.getItem(DEMO_SESSION_KEY), null)
})
test('malformed and implausible sessions are removed rather than authenticated', () => {
  const store = storage()
  for (const value of [
    'broken',
    JSON.stringify({
      version: 1,
      user: { id: '1', name: '例', email: 'x@example.com' },
      expiresAt: DEMO_SESSION_TTL * 2,
    }),
  ]) {
    store.setItem(DEMO_SESSION_KEY, value)
    assert.equal(readExampleSession(store, 0), null)
    assert.equal(store.getItem(DEMO_SESSION_KEY), null)
  }
})
