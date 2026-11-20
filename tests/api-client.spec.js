import { test, expect } from './workspace-fixture'

// Test the transport module in an inert document so Vite's application dependency
// optimization and HMR cannot navigate away during page.evaluate().
test.beforeEach(async ({ page }) => {
  await page.route('**/__transport-test', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><head><title>Transport test</title></head><body></body></html>',
    }),
  )
})

test('API prefix, JSON request, and body-free result save', async ({
  page,
}) => {
  const requests = []
  await page.route('**/api/v1/**', async (route) => {
    requests.push({
      url: route.request().url(),
      headers: route.request().headers(),
      body: route.request().postData(),
    })
    await route.fulfill({ json: { jobId: 61, status: '결과 저장됨' } })
  })
  await page.goto('/__transport-test')
  const result = await page.evaluate(async () => {
    const { apiRequest } = await import('/src/services/api/client.js')
    await apiRequest('jobs/61/draft', {
      method: 'PATCH',
      body: {
        fields: [{ key: 'quantity', value: 10, checked: true }],
        lastField: 'quantity',
      },
    })
    return apiRequest('/jobs/61/result', { method: 'POST' })
  })
  expect(result.jobId).toBe(61)
  expect(requests[0].url).toMatch(/\/api\/v1\/jobs\/61\/draft$/)
  expect(requests[0].headers['content-type']).toBe('application/json')
  expect(JSON.parse(requests[0].body).lastField).toBe('quantity')
  expect(requests[1].body).toBeNull()
  expect(requests[1].headers['content-type']).toBeUndefined()
})

test('multipart sends file bytes and browser boundary for both material types', async ({
  page,
}) => {
  const requests = []
  await page.route('**/api/v1/**', async (route) => {
    requests.push({
      url: route.request().url(),
      headers: route.request().headers(),
      body: route.request().postDataBuffer().toString('utf8'),
    })
    await route.fulfill({ json: { id: 11 } })
  })
  await page.goto('/__transport-test')
  await page.evaluate(async () => {
    const { apiRequest } = await import('/src/services/api/client.js')
    for (const [path, kind] of [
      ['tasks/1/materials', 'manual'],
      ['jobs/61/files', null],
    ]) {
      const form = new FormData()
      if (kind) form.append('kind', kind)
      form.append(
        'file',
        new File(['demo file bytes'], 'inventory.pdf', {
          type: 'application/pdf',
        }),
      )
      await apiRequest(path, { method: 'POST', body: form })
    }
  })
  expect(requests).toHaveLength(2)
  for (const request of requests) {
    expect(request.headers['content-type']).toMatch(
      /^multipart\/form-data; boundary=/,
    )
    expect(request.body).toContain('name="file"; filename="inventory.pdf"')
    expect(request.body).toContain('demo file bytes')
  }
  expect(requests[0].body).toContain('name="kind"')
  expect(requests[0].body).toContain('manual')
  expect(requests[1].body).not.toContain('name="kind"')
})

test('download preserves bytes and filename header; DELETE 204 returns null', async ({
  page,
}) => {
  await page.route('**/api/v1/jobs/61/result/download', (route) =>
    route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment; filename="result.csv"',
        'access-control-expose-headers': 'Content-Disposition',
      },
      body: Buffer.from([0, 128, 255, 10]),
    }),
  )
  await page.route('**/api/v1/job-files/71', (route) =>
    route.fulfill({ status: 204 }),
  )
  await page.goto('/__transport-test')
  const result = await page.evaluate(async () => {
    const { apiRequest } = await import('/src/services/api/client.js')
    const response = await apiRequest('jobs/61/result/download', {
      responseType: 'response',
    })
    return {
      bytes: [...new Uint8Array(await response.arrayBuffer())],
      filename: response.headers.get('Content-Disposition'),
      removed: await apiRequest('job-files/71', { method: 'DELETE' }),
    }
  })
  expect(result.bytes).toEqual([0, 128, 255, 10])
  expect(result.filename).toBe('attachment; filename="result.csv"')
  expect(result.removed).toBeNull()
})

test('HTTP errors and cancellation stay failures without demo fallback', async ({
  page,
}) => {
  await page.route('**/api/v1/analyses/20', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  )
  await page.goto('/__transport-test')
  const result = await page.evaluate(async () => {
    const { apiRequest } = await import('/src/services/api/client.js')
    let failed, cancelled
    try {
      await apiRequest('analyses/20')
    } catch (error) {
      failed = { name: error.name, status: error.status }
    }
    const controller = new AbortController()
    controller.abort()
    try {
      await apiRequest('home', { signal: controller.signal })
    } catch (error) {
      cancelled = error.name
    }
    return { failed, cancelled }
  })
  expect(result.failed).toEqual({ name: 'ApiError', status: 503 })
  expect(result.cancelled).toBe('AbortError')
})
