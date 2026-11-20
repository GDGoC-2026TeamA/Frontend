import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { webcrypto } from 'node:crypto'

const storage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}
const user = {
  id: 'server-user',
  name: '서버 사용자',
  email: 'server@example.com',
}
async function service({
  mode = 'demo',
  store = storage(),
  fetcher = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ user }),
  }),
  configured = true,
} = {}) {
  const context = vm.createContext({
    sessionStorage: store,
    window: {
      sessionStorage: store,
      location: { origin: 'https://frontend.example' },
      dispatchEvent() {},
    },
    fetch: fetcher,
    URL,
    AbortSignal,
    DOMException,
    crypto: webcrypto,
    Event,
  })
  const dependencies = {}
  const mock = (name, exports) =>
    new vm.SyntheticModule(
      Object.keys(exports),
      function () {
        for (const [key, value] of Object.entries(exports))
          this.setExport(key, value)
      },
      { context, identifier: name },
    )
  dependencies.react = mock('react', {
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
  })
  for (const [name, method] of [
    ['./demo/taskWorkspace', 'clearDemoTasks'],
    ['./demo/workWorkspace', 'clearDemoWork'],
    ['./learningSessions', 'clearLearningSessions'],
  ])
    dependencies[name] = mock(name, { [method]: () => {} })
  dependencies['./demoSession'] = new vm.SourceTextModule(
    await readFile(
      new URL('../src/services/demoSession.js', import.meta.url),
      'utf8',
    ),
    { context },
  )
  const source = new vm.SourceTextModule(
    await readFile(
      new URL('../src/services/accountService.js', import.meta.url),
      'utf8',
    ),
    {
      context,
      initializeImportMeta(meta) {
        meta.env = {
          VITE_DATA_MODE: mode,
          ...(configured
            ? {
                VITE_AUTH_SESSION_PATH: 'session',
                VITE_AUTH_LOGOUT_PATH: 'logout',
              }
            : {}),
        }
      },
    },
  )
  await source.link((specifier) => dependencies[specifier])
  await source.evaluate()
  return { api: source.namespace, store }
}
test('fresh demo is anonymous; login persists display fields and reload restores; logout removes the session', async () => {
  const first = await service()
  assert.equal(first.api.useAccount().user, null)
  first.api.startExampleAccount({
    name: '새 사용자',
    email: 'new@example.com',
    password: 'never-store',
  })
  assert.equal(first.api.useAccount().status, 'authenticated')
  assert.ok(
    !first.store.getItem('workbridge.demo.session.v1').includes('never-store'),
  )
  const reloaded = await service({ store: first.store })
  assert.equal(reloaded.api.useAccount().user.name, '새 사용자')
  await reloaded.api.signOut()
  assert.equal(first.store.getItem('workbridge.demo.session.v1'), null)
  assert.equal(reloaded.api.useAccount().user, null)
})
test('API session ignores demo storage and concurrent restoration shares a single server check', async () => {
  const store = storage()
  store.setItem(
    'workbridge.demo.session.v1',
    JSON.stringify({
      version: 1,
      user: { id: 'forged', name: 'fake', email: 'fake@example.com' },
      expiresAt: Date.now() + 60000,
    }),
  )
  let calls = 0,
    release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const { api } = await service({
    mode: 'api',
    store,
    fetcher: async () => {
      calls++
      await gate
      return { ok: true, status: 200, json: async () => ({ user }) }
    },
  })
  assert.equal(api.useAccount().user, null)
  assert.throws(() => api.startExampleAccount())
  const first = api.restoreServerSession(),
    second = api.restoreServerSession()
  assert.equal(first, second)
  assert.equal(api.useAccount().status, 'checking')
  release()
  await first
  assert.equal(calls, 1)
  assert.equal(api.useAccount().user.id, user.id)
})
test('401 is anonymous, server failures require retry and a failed logout does not destroy the session', async () => {
  let status = 401
  const { api } = await service({
    mode: 'api',
    fetcher: async () => ({
      ok: status === 200,
      status,
      json: async () => ({ user }),
    }),
  })
  await api.restoreServerSession()
  assert.equal(api.useAccount().status, 'anonymous')
  status = 503
  await api.restoreServerSession()
  assert.equal(api.useAccount().status, 'error')
  status = 200
  await api.restoreServerSession()
  assert.equal(api.useAccount().user.id, user.id)
  status = 503
  await assert.rejects(api.signOut())
  assert.equal(api.useAccount().user.id, user.id)
})
test('missing configuration never sends invented requests and a late session response cannot undo expiry', async () => {
  let calls = 0
  const missing = await service({
    mode: 'api',
    configured: false,
    fetcher: async () => {
      calls++
      throw new Error('unexpected')
    },
  })
  await missing.api.restoreServerSession()
  assert.equal(missing.api.useAccount().status, 'anonymous')
  assert.equal(calls, 0)
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const pending = await service({
    mode: 'api',
    fetcher: async () => {
      await gate
      return { ok: true, status: 200, json: async () => ({ user }) }
    },
  })
  const request = pending.api.restoreServerSession()
  pending.api.expireAccount()
  release()
  await request
  assert.equal(pending.api.useAccount().user, null)
  let releaseLogin
  const loginGate = new Promise((resolve) => {
    releaseLogin = resolve
  })
  const loggingIn = await service({
    mode: 'api',
    fetcher: async () => {
      await loginGate
      return { ok: true, status: 200, json: async () => ({ user }) }
    },
  })
  const oldCheck = loggingIn.api.restoreServerSession()
  loggingIn.api.acceptServerAccount({ user: { ...user, id: 'new-login' } })
  releaseLogin()
  await oldCheck
  assert.equal(loggingIn.api.useAccount().user.id, 'new-login')
})
