import { test, expect } from '@playwright/test'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'

const port = 5180
const base = `http://127.0.0.1:${port}`
const token = 'server_token_for_test_12345678901234567890'
const sessionKey = 'workbridge.server.session.v1'
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
      stdio: 'ignore',
      env: {
        ...process.env,
        VITE_DATA_MODE: 'api',
        VITE_AUTH_SESSION_PATH: '',
        VITE_API_BASE_URL: base + '/api/v1',
      },
    },
  )
  await expect
    .poll(
      async () => {
        try {
          return (await fetch(base)).ok
        } catch {
          return false
        }
      },
      { timeout: 25000 },
    )
    .toBe(true)
})
test.afterAll(() => server?.kill())

async function workspace(page) {
  await page.route('**/api/v1/workspaces', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${token}`)
    await route.fulfill({
      json: [{ id: 17, name: '개인 공간', kind: 'personal' }],
    })
  })
  await page.route('**/api/v1/home?workspaceId=17', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${token}`)
    await route.fulfill({
      json: { tasks: [], continueJobs: [], recentCards: [] },
    })
  })
  await page.route('**/api/v1/jobs', (route) => route.fulfill({ json: [] }))
}

for (const [provider, label] of [
  ['google', 'Google'],
  ['kakao', '카카오'],
]) {
  test(
    provider +
      ' starts at the backend, exchanges once and restores the session',
    async ({ page }) => {
      await workspace(page)
      const code = 'c'.repeat(43)
      let challenge
      let exchanges = 0
      await page.route(
        '**/sessions/social/' + provider + '/start?*',
        (route) => {
          challenge = new URL(route.request().url()).searchParams.get(
            'challenge',
          )
          return route.fulfill({
            status: 303,
            headers: { location: base + '/auth/callback#code=' + code },
          })
        },
      )
      await page.route('**/sessions/social/exchange', async (route) => {
        const body = route.request().postDataJSON()
        expect(body.code).toBe(code)
        expect(
          createHash('sha256').update(body.verifier).digest('base64url'),
        ).toBe(challenge)
        exchanges++
        await route.fulfill({
          json: { token, user: { id: 12, name: '소셜 사용자', email: '' } },
        })
      })
      await page.goto(base + '/login')
      await page.getByRole('button', { name: label + '로 로그인' }).click()
      await expect(page).toHaveURL(base + '/')
      await expect(
        page.getByRole('heading', { name: '등록된 업무가 없어요' }),
      ).toBeVisible()
      await page.reload()
      await expect(
        page.getByRole('heading', { name: '등록된 업무가 없어요' }),
      ).toBeVisible()
      expect(exchanges).toBe(1)
    },
  )
}

test('unsolicited social callback does not create a session', async ({
  page,
}) => {
  await page.goto(base + '/auth/callback#code=' + 'c'.repeat(43))
  await expect(page.getByRole('alert')).toContainText('다시 로그인')
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), sessionKey),
  ).toBeNull()
  await expect(page).toHaveURL(base + '/auth/callback')
})

async function login(page) {
  await page.getByLabel('아이디 (필수)', { exact: true }).fill('test.user')
  await page
    .getByLabel('비밀번호 (필수)', { exact: true })
    .fill('test-password')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
}

test('signup sends login_id, then login accepts a token, opens home and revalidates after reload', async ({
  page,
}) => {
  await workspace(page)
  await page.route('**/api/v1/accounts', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      name: '가입 사용자',
      login_id: 'test.user',
      email: 'new@example.com',
      password: 'test-password',
    })
    await route.fulfill({ status: 201, json: { id: 42 } })
  })
  await page.route('**/api/v1/sessions', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      login_id: 'test.user',
      password: 'test-password',
    })
    await route.fulfill({ json: { token } })
  })
  await page.goto(base + '/signup')
  await page.getByLabel('이름', { exact: false }).fill('가입 사용자')
  await page.getByLabel('아이디 (필수)', { exact: true }).fill('test.user')
  await page.getByLabel('이메일', { exact: false }).fill('new@example.com')
  await page
    .getByLabel('비밀번호 (필수)', { exact: true })
    .fill('test-password')
  await page.getByLabel('비밀번호 확인', { exact: false }).fill('test-password')
  await page.getByRole('button', { name: '가입하기', exact: true }).click()
  await expect(page).toHaveURL(base + '/login')
  await expect(page.getByRole('status')).toContainText('회원가입을 마쳤어요')
  await expect(page.getByLabel('아이디 (필수)', { exact: true })).toHaveValue(
    'test.user',
  )
  await expect(page.getByLabel('비밀번호 (필수)', { exact: true })).toHaveValue(
    '',
  )
  await login(page)
  await expect(page).toHaveURL(base + '/')
  await expect(
    page.getByRole('heading', { name: '등록된 업무가 없어요' }),
  ).toBeVisible()
  const saved = await page.evaluate(
    (key) => sessionStorage.getItem(key),
    sessionKey,
  )
  expect(saved).not.toContain('test-password')
  await page.reload()
  await expect(
    page.getByRole('heading', { name: '홈', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.screenshot({
    path: 'test-results/bearer-login-home.png',
    fullPage: true,
  })
  await page.goto(base + '/settings')
  await expect(page.getByLabel('아이디', { exact: false })).toHaveValue(
    'test.user',
  )
  await page
    .locator('.account-card')
    .getByRole('button', { name: '로그아웃', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '로그아웃', exact: true })
    .click()
  await expect(page).toHaveURL(base + '/login')
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), sessionKey),
  ).toBeNull()
})

test('failed login preserves input, never stores a token, and a retry succeeds', async ({
  page,
}) => {
  await workspace(page)
  let succeed = false
  await page.route('**/api/v1/sessions', (route) =>
    route.fulfill({
      status: succeed ? 200 : 401,
      json: succeed ? { token } : { detail: '로그인 정보를 확인하세요.' },
    }),
  )
  await page.goto(base + '/login')
  await login(page)
  await expect(page.getByRole('alert')).toContainText(
    '아이디와 비밀번호를 다시 확인',
  )
  await expect(page.getByLabel('아이디 (필수)', { exact: true })).toHaveValue(
    'test.user',
  )
  await expect(page.getByLabel('비밀번호 (필수)', { exact: true })).toHaveValue(
    'test-password',
  )
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), sessionKey),
  ).toBeNull()
  await page.screenshot({
    path: 'test-results/bearer-login-error.png',
    fullPage: true,
  })
  succeed = true
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await expect(page).toHaveURL(base + '/')
})

test('forged or expired token cannot restore an account; server failures allow retry', async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, base, token }) =>
      sessionStorage.setItem(
        key,
        JSON.stringify({ base: base + '/api/v1', token, loginId: 'test.user' }),
      ),
    { key: sessionKey, base, token },
  )
  let status = 503
  await page.route('**/api/v1/workspaces', (route) =>
    route.fulfill({ status, json: {} }),
  )
  await page.goto(base + '/profile')
  await expect(page.getByRole('alert')).toContainText(
    '계정을 불러오지 못했어요',
  )
  status = 401
  await page.getByRole('button', { name: '다시 시도', exact: true }).click()
  await expect(
    page.getByRole('dialog', { name: '다시 로그인해 주세요' }),
  ).toBeVisible()
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), sessionKey),
  ).toBeNull()
  await expect(page.locator('.account-card')).toHaveCount(0)
})
