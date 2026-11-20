import { test, expect } from './workspace-fixture'
import { spawn } from 'node:child_process'
const port = String(Number(process.env.PLAYWRIGHT_API_PORT || 5174) + 2)
const apiURL = `http://127.0.0.1:${port}`
const headers = {
  'access-control-expose-headers': 'Content-Disposition',
  'access-control-allow-origin': apiURL,
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
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
      env: {
        ...process.env,
        VITE_DATA_MODE: 'api',
        VITE_AUTH_SESSION_PATH: '/__test/session',
      },
      windowsHide: true,
      stdio: 'ignore',
    },
  )
  const deadline = Date.now() + 25000
  while (Date.now() < deadline) {
    if (server.exitCode !== null)
      throw new Error('Work API test server did not start')
    try {
      if ((await fetch(apiURL, { signal: AbortSignal.timeout(500) })).ok) return
    } catch {
      /* startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Work API test server timed out')
}, 30000)
test.afterAll(() => server?.kill())
const task = {
  id: 1,
  name: '서버 입고 업무',
  materials: [{ id: 11, filename: 'server-manual.pdf' }],
}
const json = (route, body, status = 200) =>
  route.fulfill({
    status,
    headers,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
test('API draft retries reuse job and uploaded IDs; review PATCH and body-free save use tracker contracts', async ({
  page,
}) => {
  let created = 0,
    uploads = 0,
    drafts = 0,
    saves = 0,
    fields
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      method = request.method()
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (method === 'GET' && url.pathname.endsWith('/tasks/1'))
      return json(route, task)
    if (method === 'POST' && url.pathname.endsWith('/tasks/1/jobs')) {
      created++
      expect(request.postDataJSON()).toEqual({
        name: '서버 검증 작업',
        description: '',
      })
      return json(route, {
        id: 61,
        taskId: 1,
        name: '서버 검증 작업',
        status: '검토 중',
      })
    }
    if (method === 'POST' && url.pathname.endsWith('/jobs/61/files')) {
      uploads++
      expect(request.headers()['content-type']).toContain(
        'multipart/form-data; boundary=',
      )
      expect(request.postDataBuffer().toString()).toContain('original bytes')
      return json(route, { id: 71, filename: 'source.txt' })
    }
    if (method === 'POST' && url.pathname.endsWith('/jobs/61/draft')) {
      drafts++
      expect(request.postDataJSON()).toEqual({ fileIds: [71] })
      return drafts === 1
        ? json(route, { message: 'retry' }, 503)
        : json(route, {
            jobId: 61,
            fields: [{ key: 'quantity', value: 10, checked: false }],
            missing: ['lotNumber'],
            source: { materialId: 11, page: 2 },
          })
    }
    if (method === 'PATCH' && url.pathname.endsWith('/jobs/61/draft')) {
      const body = request.postDataJSON()
      expect(body).toEqual({
        fields: [
          { key: 'quantity', value: 17, checked: true },
          { key: 'lotNumber', value: 'LOT-99', checked: true },
        ],
        lastField: 'lotNumber',
      })
      fields = body.fields
      return json(route, {
        jobId: 61,
        status: '검토 중',
        fields,
        lastField: 'lotNumber',
      })
    }
    if (method === 'POST' && url.pathname.endsWith('/jobs/61/result')) {
      saves++
      expect(request.postData()).toBeNull()
      expect(request.headers()['content-type']).toBeUndefined()
      return json(route, {
        jobId: 61,
        status: '결과 저장됨',
        fields,
        pending: [],
      })
    }
    if (method === 'GET' && url.pathname.endsWith('/jobs/61/result/download'))
      return route.fulfill({
        status: 200,
        headers: {
          ...headers,
          'Content-Disposition': 'attachment; filename="server.csv"',
        },
        contentType: 'text/csv',
        body: 'confirmed result',
      })
    return json(route, { message: 'unexpected' }, 404)
  })
  await page.goto(apiURL + '/work/input?taskId=1')
  await page.getByLabel('작업 이름', { exact: true }).fill('서버 검증 작업')
  await page.locator('input[type=file]').setInputFiles({
    name: 'source.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('original bytes'),
  })
  await page.getByRole('button', { name: '초안 만들기', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('다시 시도')
  await page.getByRole('button', { name: '초안 만들기', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '초안 검토', exact: true }),
  ).toBeVisible()
  expect(created).toBe(1)
  expect(uploads).toBe(1)
  expect(drafts).toBe(2)
  await expect(page.getByRole('main')).not.toContainText('WB-102')
  await page.getByRole('button', { name: '초안 수정', exact: true }).click()
  await page.getByLabel('quantity', { exact: true }).fill('17')
  await page.getByLabel('lotNumber', { exact: true }).fill('LOT-99')
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText('확인해 주세요')
  await page
    .getByRole('checkbox', {
      name: '실제로 입고된 수량을 확인했어요',
      exact: true,
    })
    .check()
  await page
    .getByRole('checkbox', { name: 'lotNumber을 확인했어요', exact: true })
    .check()
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
  await page
    .getByRole('button', { name: '작업 결과 저장', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: '작업 결과', exact: true }),
  ).toBeVisible()
  expect(saves).toBe(1)
  await expect(
    page.getByRole('button', { name: '절차를 카드로 저장', exact: true }),
  ).toBeDisabled()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '결과 다운로드', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('server.csv')
  await page.screenshot({
    path: 'docs/screenshots/phase4-api-result.png',
    fullPage: true,
  })
})
test('API errors never use fixtures and cancellation drops a late draft', async ({
  page,
}) => {
  let taskStatus = 404,
    mode = 'malformed',
    release,
    started,
    finished
  const gate = new Promise((resolve) => {
      release = resolve
    }),
    arrived = new Promise((resolve) => {
      started = resolve
    }),
    handled = new Promise((resolve) => {
      finished = resolve
    })
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url())
    if (req.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers })
    if (url.pathname.endsWith('/tasks/1')) return json(route, task, taskStatus)
    if (url.pathname.endsWith('/tasks/1/jobs'))
      return json(route, { id: 61, taskId: 1 })
    if (url.pathname.endsWith('/jobs/61/files'))
      return json(route, { id: 71, filename: 'source.txt' })
    if (url.pathname.endsWith('/jobs/61/draft')) {
      if (mode === 'malformed')
        return json(route, { jobId: 61, fields: null, missing: [] })
      started()
      await gate
      try {
        await json(route, {
          jobId: 61,
          fields: [{ key: 'quantity', value: 1, checked: false }],
          missing: [],
        })
      } catch {
        /* aborted request */
      } finally {
        finished()
      }
      return
    }
    return json(route, {}, 404)
  })
  await page.goto(apiURL + '/work/input?taskId=1')
  await expect(
    page.getByRole('heading', {
      name: '업무나 작업을 불러오지 못했어요',
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByText('WB-102', { exact: true })).toHaveCount(0)
  taskStatus = 200
  await page.getByRole('button', { name: '다시 시도', exact: true }).click()
  await page.getByLabel('작업 이름', { exact: true }).fill('남겨 둘 작업')
  await page.locator('input[type=file]').setInputFiles({
    name: 'source.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('original bytes'),
  })
  await page.getByRole('button', { name: '초안 만들기', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('초안 응답 형식')
  mode = 'hold'
  await page.getByRole('button', { name: '초안 만들기', exact: true }).click()
  await arrived
  await page.getByRole('button', { name: '자료 입력으로', exact: true }).click()
  release()
  await handled
  await expect(page.getByLabel('작업 이름', { exact: true })).toHaveValue(
    '남겨 둘 작업',
  )
  await expect(
    page.getByRole('heading', { name: '초안 검토', exact: true }),
  ).toHaveCount(0)
})
test('API card detail and title edits keep server procedure text and missing cards remain errors', async ({
  page,
}) => {
  await page.route('**/api/v1/**', (route) => {
    const req = route.request(),
      url = new URL(req.url())
    if (req.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers })
    if (url.pathname.endsWith('/cards/51')) {
      if (req.method() === 'PATCH') {
        expect(req.postDataJSON()).toEqual({ title: '서버 카드 수정' })
        return json(route, { id: 51, taskId: 1, title: '서버 카드 수정' })
      }
      return json(route, {
        id: 51,
        taskId: 1,
        title: '서버 절차 카드',
        steps: ['서버가 돌려준 확인 순서'],
        cautions: ['단위 확인'],
        exceptions: [],
        pending: [],
        source: { materialId: 11, page: 2 },
      })
    }
    return json(route, {}, 404)
  })
  await page.goto(apiURL + '/work-cards/51')
  await expect(page.locator('.workflow-steps')).toContainText(
    '서버가 돌려준 확인 순서',
  )
  await expect(page.getByRole('main')).not.toContainText('WB-102')
  await page.getByLabel('카드 이름', { exact: true }).fill('서버 카드 수정')
  await page
    .getByRole('button', { name: '카드 이름 저장', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: '서버 카드 수정', exact: true }),
  ).toBeVisible()
  await page.goto(apiURL + '/work-cards/999')
  await expect(page.getByRole('alert')).toContainText(
    '카드를 불러오지 못했어요',
  )
})
