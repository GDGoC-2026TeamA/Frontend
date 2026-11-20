import { test, expect } from '@playwright/test'
import { spawn } from 'node:child_process'
const port = Number(process.env.PLAYWRIGHT_API_PORT || 5174) + 4
const base = `http://127.0.0.1:${port}`
let server
test.beforeAll(async () => {
  server = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    {
      windowsHide: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        VITE_DATA_MODE: 'api',
        VITE_API_BASE_URL: base + '/api/v1',
        VITE_AUTH_SESSION_PATH: 'account/session',
        VITE_AUTH_LOGIN_PATH: 'account/login',
      },
    },
  )
  const deadline = Date.now() + 25000
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error('Session test server failed')
    try {
      if ((await fetch(base)).ok) return
    } catch {
      /* starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Session test server timed out')
}, 30000)
test.afterAll(() => server?.kill())
const user = {
  id: 'real-session',
  name: '서버 사용자',
  email: 'server@example.com',
}
test('server session is checked before protected fetches and 401 redirects to signup even with forged demo storage', async ({
  page,
}) => {
  const workspace = []
  page.on('request', (request) => {
    if (/\/api\/v1\/(home|jobs)$/.test(new URL(request.url()).pathname))
      workspace.push(request.url())
  })
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'workbridge.demo.session.v1',
      JSON.stringify({
        version: 1,
        user: { id: 'forged', name: 'fake', email: 'fake@example.com' },
        expiresAt: Date.now() + 60000,
      }),
    ),
  )
  await page.route('**/api/v1/account/session', (route) =>
    route.fulfill({ status: 401, json: {} }),
  )
  await page.goto(base + '/')
  await expect(page).toHaveURL(base + '/signup')
  expect(workspace).toEqual([])
})
test('server errors keep private routes blocked and retry restores verified session after reload', async ({
  page,
}) => {
  let status = 503
  await page.route('**/api/v1/account/session', (route) =>
    route.fulfill({ status, json: status === 200 ? { user } : {} }),
  )
  await page.goto(base + '/profile')
  await expect(page.getByRole('alert')).toContainText('요청을 마치지 못했어요')
  await expect(page.getByLabel('이름', { exact: false })).toHaveCount(0)
  status = 200
  await page.getByRole('button', { name: '다시 시도', exact: true }).click()
  await expect(page.getByLabel('이름', { exact: false })).toHaveValue(user.name)
  await page.reload()
  await expect(page.getByLabel('이름', { exact: false })).toHaveValue(user.name)
  await page.screenshot({
    path: 'docs/screenshots/auth-fix-restored-profile.png',
    fullPage: true,
  })
})
