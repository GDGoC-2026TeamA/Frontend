import { test, expect } from '@playwright/test'
import { spawn } from 'node:child_process'

const port = String(Number(process.env.PLAYWRIGHT_API_PORT || 5174) + 1)
const apiURL = `http://127.0.0.1:${port}`
const headers = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'Content-Type',
}
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
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null)
      throw new Error('Learning API test server did not start')
    try {
      if ((await fetch(apiURL, { signal: AbortSignal.timeout(500) })).ok) return
    } catch {
      /* server startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Learning API test server timed out')
}, 30000)
test.afterAll(() => server?.kill())

const task = {
  id: 1,
  name: '서버 업무',
  materials: [{ id: 11, filename: 'server-guide.pdf' }],
  version: 3,
  analysisId: 90,
  scope: 'shared',
}

test('API questions use the documented request and sources, retain failed input and never invent quotes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  const bodies = []
  let status = 500
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers })
    if (req.method() === 'GET' && req.url().endsWith('/tasks/1'))
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(task),
      })
    if (req.method() === 'POST' && req.url().endsWith('/tasks/1/questions')) {
      bodies.push(req.postDataJSON())
      return route.fulfill({
        status,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(
          status === 200
            ? {
                answer: '서버가 알려준 처리 기준이에요.',
                sources: [{ materialId: 11, page: 5 }],
                needsReview: true,
              }
            : { message: 'unavailable' },
        ),
      })
    }
    return route.abort()
  })
  await page.goto(`${apiURL}/learn/1`)
  await expect(
    page.getByRole('heading', {
      name: '서버 연습 연결을 확인해 주세요',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: '먼저 익히면 좋은 내용', exact: true }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: '업무 질문하기', exact: true }).click()
  const input = page.getByLabel('질문', { exact: true })
  await input.fill('서버에서 처리 기준을 확인해 주세요')
  await page.getByRole('button', { name: '질문하기', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('HTTP 500')
  await expect(input).toHaveValue('서버에서 처리 기준을 확인해 주세요')
  await expect(page.getByRole('article', { name: 'AI 답변' })).toHaveCount(0)
  status = 200
  await page.getByRole('button', { name: '질문하기', exact: true }).click()
  const answer = page.getByRole('article', { name: 'AI 답변' })
  await expect(answer).toContainText('서버가 알려준 처리 기준이에요.')
  await expect(answer).toContainText('server-guide.pdf')
  await expect(answer).toContainText('확인 필요')
  await answer.getByRole('button', { name: '근거 보기', exact: true }).click()
  const panel = page.getByRole('complementary', { name: '학습 노트와 AI 질문' })
  await expect(panel).toContainText('위치 5')
  await expect(panel).toContainText('서버 응답에는 인용문이 없어요')
  await expect(panel).not.toContainText('전표 수량과 실제 입고 수량이 다르면')
  await expect(panel).not.toContainText('예시 답변입니다')
  expect(bodies).toEqual([
    { question: '서버에서 처리 기준을 확인해 주세요' },
    { question: '서버에서 처리 기준을 확인해 주세요' },
  ])
  await page.screenshot({
    path: 'docs/screenshots/phase3-api-evidence.png',
    fullPage: true,
  })
})

test('API loading failure retries without fixtures; cancelling drops late responses and malformed answers stay errors', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  let taskStatus = 404
  let pendingMode = 'hold'
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  let handled
  let arrived
  const started = new Promise((resolve) => {
    arrived = resolve
  })
  const finished = new Promise((resolve) => {
    handled = resolve
  })
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers })
    if (req.method() === 'GET' && req.url().endsWith('/tasks/1'))
      return route.fulfill({
        status: taskStatus,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(
          taskStatus === 200 ? task : { message: 'missing' },
        ),
      })
    if (req.method() === 'POST' && req.url().endsWith('/tasks/1/questions')) {
      if (pendingMode === 'hold') {
        arrived()
        await gate
        try {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers,
            body: JSON.stringify({
              answer: '취소된 늦은 답변',
              sources: [],
              needsReview: true,
            }),
          })
        } catch {
          /* fetch was aborted */
        } finally {
          handled()
        }
        return
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({
          answer: '형식이 맞지 않은 응답',
          sources: null,
          needsReview: false,
        }),
      })
    }
    return route.abort()
  })
  await page.goto(`${apiURL}/learn/1`)
  await expect(page.getByRole('alert')).toContainText('HTTP 404')
  await expect(
    page.getByRole('heading', { name: '먼저 익히면 좋은 내용', exact: true }),
  ).toHaveCount(0)
  taskStatus = 200
  await page.getByRole('button', { name: '다시 시도', exact: true }).click()
  await page.getByRole('button', { name: '업무 질문하기', exact: true }).click()
  const input = page.getByLabel('질문', { exact: true })
  await input.fill('취소 후에도 남겨 둘 질문')
  await page.getByRole('button', { name: '질문하기', exact: true }).click()
  await started
  await page.getByRole('button', { name: '질문 취소', exact: true }).click()
  await expect(input).toHaveValue('취소 후에도 남겨 둘 질문')
  release()
  await finished
  await expect(page.getByRole('article', { name: 'AI 답변' })).toHaveCount(0)
  pendingMode = 'malformed'
  await page.getByRole('button', { name: '질문하기', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText(
    '답변을 불러오지 못했어요',
  )
  await expect(input).toHaveValue('취소 후에도 남겨 둘 질문')
  await expect(page.getByRole('article', { name: 'AI 답변' })).toHaveCount(0)
})
