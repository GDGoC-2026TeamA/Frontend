import { test, expect } from '@playwright/test'
import { spawn } from 'node:child_process'

const apiPort = process.env.PLAYWRIGHT_API_PORT || '5174'
const apiURL = `http://127.0.0.1:${apiPort}`

let server
test.beforeAll(async () => {
  server = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      apiPort,
      '--strictPort',
    ],
    {
      cwd: process.cwd(),
      windowsHide: true,
      env: {
        ...process.env,
        VITE_DATA_MODE: 'api',
        VITE_API_BASE_URL: 'https://gdgoc2026a.up.railway.app/api/v1',
      },
      stdio: 'ignore',
    },
  )
  let started = false
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null)
      throw new Error('API mode test server did not start')
    try {
      const response = await fetch(apiURL)
      if (response.ok) {
        started = true
        break
      }
    } catch {
      /* server starts asynchronously */
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (!started) throw new Error('API mode test server timed out')
})
test.afterAll(() => {
  server?.kill()
})

test('API home shows loading, 404, retry, empty and server data without demo fallback', async ({
  page,
}) => {
  let status = 404
  let tasks = []
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  await page.route(
    'https://gdgoc2026a.up.railway.app/api/v1/**',
    async (route) => {
      await gate
      const home = new URL(route.request().url()).pathname.endsWith('/home')
      await route.fulfill(
        status === 404
          ? { status: 404, json: { detail: 'Not Found' } }
          : {
              json: home
                ? { tasks, resumeJobs: [], recentCards: [] }
                : { items: [] },
            },
      )
    },
  )
  await page.goto(apiURL)
  await expect(
    page.getByRole('status').getByText('업무를 불러오고 있어요'),
  ).toBeVisible()
  release()
  await expect(page.getByRole('alert')).toContainText('HTTP 404')
  await expect(page.locator('.work-tile')).toHaveCount(0)
  await page
    .getByRole('button', { name: '사용 방법 보기', exact: true })
    .click()
  await expect(
    page.getByRole('dialog', { name: '사용 방법', exact: true }),
  ).toContainText('업무를 불러온 뒤')
  await page.keyboard.press('Escape')
  status = 200
  await page.getByRole('button', { name: '다시 시도', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '등록된 업무가 없어요', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('서버에서 조회한 업무와 기록이에요.'),
  ).toBeVisible()
  tasks = [{ id: 202, name: '서버 업무' }]
  await page.reload()
  await expect(page.locator('.work-tile')).toHaveCount(1)
  await expect(page.locator('.work-tile')).toContainText('서버 업무')
  await expect(page.locator('.work-tile')).toContainText('학습 상태 미확인')
  await expect(page.getByText('재고 입고 기록', { exact: true })).toHaveCount(0)
  await expect(page.locator('.home-recent__row')).toHaveCount(0)
})

test('collection API distinguishes failed, empty and populated responses', async ({
  page,
}) => {
  let status = 503
  let items = []
  await page.route('**/api/v1/cards', (route) =>
    route.fulfill({
      status,
      json: status === 200 ? { items } : { detail: 'unavailable' },
    }),
  )
  await page.goto(apiURL + '/work-cards')
  await expect(page.getByRole('alert')).toContainText(
    '목록을 불러오지 못했어요',
  )
  await expect(
    page.getByRole('heading', {
      name: '저장한 업무 카드가 없어요',
      exact: true,
    }),
  ).toHaveCount(0)
  status = 200
  await page.getByRole('button', { name: '다시 시도', exact: true }).click()
  await expect(
    page.getByRole('heading', {
      name: '저장한 업무 카드가 없어요',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByText('예시 모드의 빈 목록이에요.', { exact: false }),
  ).toHaveCount(0)
  items = [{ id: 345, title: '서버에서 받은 절차' }]
  await page.reload()
  await expect(
    page.getByRole('heading', { name: '서버에서 받은 절차', exact: true }),
  ).toBeVisible()
  await page.route('**/api/v1/jobs', (route) =>
    route.fulfill({ status: 200, json: { items: [] } }),
  )
  await page.goto(apiURL + '/history')
  await expect(
    page.getByRole('heading', {
      name: '아직 시작한 작업이 없어요',
      exact: true,
    }),
  ).toBeVisible()
})
