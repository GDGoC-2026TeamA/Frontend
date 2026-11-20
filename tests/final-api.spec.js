import { test, expect } from '@playwright/test'
import { spawn } from 'node:child_process'

const port = String(Number(process.env.PLAYWRIGHT_API_PORT || 5174) + 3)
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
      port,
      '--strictPort',
    ],
    {
      windowsHide: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        VITE_DATA_MODE: 'api',
        VITE_API_BASE_URL: `${base}/api/v1`,
        VITE_AUTH_LOGIN_PATH: 'account/login',
        VITE_AUTH_SIGNUP_PATH: 'account/signup',
        VITE_AUTH_SESSION_PATH: 'account/session',
        VITE_AUTH_PROFILE_PATH: 'account/profile',
        VITE_AUTH_EMAIL_PATH: 'account/email',
        VITE_AUTH_LOGOUT_PATH: 'account/logout',
        VITE_AUTH_RESET_REQUEST_PATH: 'account/reset-request',
        VITE_AUTH_RESET_PASSWORD_PATH: 'account/reset-password',
      },
    },
  )
  const deadline = Date.now() + 25000
  while (Date.now() < deadline) {
    if (server.exitCode !== null)
      throw new Error('Account fixture server failed')
    try {
      if ((await fetch(base, { signal: AbortSignal.timeout(500) })).ok) return
    } catch {
      /* starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Account fixture server timed out')
}, 30000)
test.afterAll(() => server?.kill())
const user = {
  id: 'server-user',
  name: '서버 사용자',
  email: 'server@example.com',
}
const json = (route, body, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
async function emptyHome(page) {
  await page.route('**/api/v1/home', (route) =>
    json(route, { tasks: [], resumeJobs: [], recentCards: [] }),
  )
  await page.route('**/api/v1/jobs', (route) => json(route, []))
}

test('configured login rejects 401, preserves fields and accepts only a validated server session', async ({
  page,
}) => {
  await emptyHome(page)
  let succeed = false
  const requests = []
  await page.route('**/api/v1/account/login', async (route) => {
    requests.push(route.request().postDataJSON())
    await new Promise((resolve) => setTimeout(resolve, 150))
    await json(route, succeed ? { user } : {}, succeed ? 200 : 401)
  })
  await page.goto(`${base}/login`)
  await page.getByLabel('이메일', { exact: false }).fill(user.email)
  await page
    .getByLabel('비밀번호 (필수)', { exact: true })
    .fill('test-password')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText(
    '이메일과 비밀번호를 다시 확인',
  )
  await expect(page.getByLabel('이메일', { exact: false })).toHaveValue(
    user.email,
  )
  await expect(page.getByLabel('비밀번호 (필수)', { exact: true })).toHaveValue(
    'test-password',
  )
  await page.screenshot({
    path: 'docs/screenshots/final-login-error.png',
    fullPage: true,
  })
  succeed = true
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await expect(page).toHaveURL(`${base}/`)
  expect(requests).toEqual([
    { email: user.email, password: 'test-password' },
    { email: user.email, password: 'test-password' },
  ])
})

test('server session hydrates profile, failed saves and failed logout keep account unchanged', async ({
  page,
}) => {
  let sessionFails = true
  await page.route('**/api/v1/account/session', (route) =>
    json(route, sessionFails ? {} : { user }, sessionFails ? 500 : 200),
  )
  let fail = true
  await page.route('**/api/v1/account/profile', (route) =>
    json(
      route,
      fail
        ? {}
        : { user: { ...user, name: route.request().postDataJSON().name } },
      fail ? 500 : 200,
    ),
  )
  await page.route('**/api/v1/account/logout', (route) => json(route, {}, 500))
  await page.goto(`${base}/profile`)
  await expect(page.getByRole('alert')).toContainText('요청을 마치지 못했어요')
  sessionFails = false
  await page.getByRole('button', { name: '다시 시도', exact: true }).click()
  await expect(page.getByLabel('이름', { exact: false })).toHaveValue(user.name)
  await page.getByLabel('이름', { exact: false }).fill('서버 이름 변경')
  await page
    .getByRole('button', { name: '변경 사항 저장', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText('요청을 마치지 못했어요')
  await page.getByRole('button', { name: '취소', exact: true }).click()
  await expect(page.getByLabel('이름', { exact: false })).toHaveValue(user.name)
  fail = false
  await page.getByLabel('이름', { exact: false }).fill('서버 이름 변경')
  await page
    .getByRole('button', { name: '변경 사항 저장', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText('변경 사항을 저장했어요')
  await page
    .locator('.sidebar')
    .getByRole('button', { name: '개인 작업 공간' })
    .click()
  await page
    .locator('.sidebar')
    .getByRole('button', { name: '로그아웃', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: '로그아웃할까요?' })
  await dialog.getByRole('button', { name: '로그아웃', exact: true }).click()
  await expect(dialog.getByRole('alert')).toBeVisible()
  await dialog.getByRole('button', { name: '취소', exact: true }).click()
  await expect(page.getByLabel('이름', { exact: false })).toHaveValue(
    '서버 이름 변경',
  )
})

test('reset request shows neutral email notice only after server success and validates reset token', async ({
  page,
}) => {
  await page.route('**/api/v1/account/reset-request', (route) =>
    route.fulfill({ status: 204 }),
  )
  await page.goto(`${base}/forgot-password`)
  await page.getByLabel('이메일', { exact: false }).fill('unknown@example.com')
  await page.getByRole('button', { name: '재설정 링크 보내기' }).click()
  await expect(
    page.getByRole('heading', { name: '이메일을 확인해 주세요', exact: true }),
  ).toBeVisible()
  await expect(page.getByText(/등록된 이메일이면/)).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/final-reset-sent.png',
    fullPage: true,
  })
  await page.goto(`${base}/reset-password`)
  await page
    .getByLabel('새 비밀번호 (필수)', { exact: true })
    .fill('new-password')
  await page
    .getByLabel('새 비밀번호 확인', { exact: false })
    .fill('new-password')
  await page.getByRole('button', { name: '비밀번호 바꾸기' }).click()
  await expect(page.getByRole('alert')).toContainText(
    '재설정 링크가 없거나 만료',
  )
  let body
  await page.route('**/api/v1/account/reset-password', (route) => {
    body = route.request().postDataJSON()
    return route.fulfill({ status: 204 })
  })
  await page.goto(`${base}/reset-password?token=server-issued-token`)
  await page
    .getByLabel('새 비밀번호 (필수)', { exact: true })
    .fill('new-password')
  await page
    .getByLabel('새 비밀번호 확인', { exact: false })
    .fill('new-password')
  await page.getByRole('button', { name: '비밀번호 바꾸기' }).click()
  await expect(page).toHaveURL(`${base}/login`)
  await expect(
    page.getByText('변경한 비밀번호로 다시 로그인해 주세요.', { exact: true }),
  ).toBeVisible()
  expect(body).toEqual({
    token: 'server-issued-token',
    password: 'new-password',
  })
})

test('OAuth callback ignores forged parameters and permissions are distinct from expired sessions', async ({
  page,
}) => {
  await emptyHome(page)
  await page.route('**/api/v1/account/session', (route) =>
    json(route, { user }),
  )
  await page.goto(`${base}/auth/callback?success=true&user=admin&token=fake`)
  await expect(page).toHaveURL(`${base}/`)
  await page.route('**/api/v1/tasks/1', (route) => json(route, {}, 403))
  await page.goto(`${base}/tasks/1`)
  await expect(page.getByRole('alert')).toContainText('이 업무를 열 수 없어요')
  await expect(
    page.getByRole('dialog', { name: '다시 로그인해 주세요' }),
  ).toHaveCount(0)
  await page.screenshot({
    path: 'docs/screenshots/final-access-denied.png',
    fullPage: true,
  })
  await page.route('**/api/v1/tasks/2', (route) => json(route, {}, 401))
  await page.goto(`${base}/tasks/2`)
  await expect(
    page.getByRole('dialog', { name: '다시 로그인해 주세요' }),
  ).toBeVisible()
})
