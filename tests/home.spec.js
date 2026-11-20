import { test, expect } from './workspace-fixture'
import AxeBuilder from '@axe-core/playwright'

test('home matches design slots, uses local original artwork, and keeps actions honest', async ({
  page,
}, testInfo) => {
  const writes = []
  page.on('request', (request) => {
    if (['POST', 'PATCH', 'DELETE'].includes(request.method()))
      writes.push(request.url())
  })
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/')
  await expect(page.locator('.work-tile')).toHaveCount(2)
  await expect(
    page.getByText('화면의 업무와 기록은 예시 데이터예요.'),
  ).toBeVisible()
  await expect(page.locator('.home-recent__row')).toHaveCount(2)
  await expect(page.locator('.home-saved-card')).toHaveCount(2)
  const art = await page
    .locator('.work-tile__artwork > img')
    .evaluateAll((images) =>
      images.map((img) => {
        const r = img.getBoundingClientRect()
        return {
          loaded: img.complete && img.naturalWidth > 0,
          width: r.width,
          height: r.height,
          source: img.getAttribute('src'),
        }
      }),
    )
  expect(art).toHaveLength(2)
  for (const item of art) {
    expect(item.loaded).toBe(true)
    expect(item.width).toBe(344)
    expect(item.height).toBe(194)
    expect(item.source).toMatch(/\/src\/assets\/home\//)
  }
  const localImages = await page
    .locator('.home-workspace img')
    .evaluateAll((images) =>
      images.map((img) => ({
        loaded: img.complete && img.naturalWidth > 0,
        src: img.getAttribute('src'),
        width: img.getBoundingClientRect().width,
        height: img.getBoundingClientRect().height,
      })),
    )
  const dimensions = {
    'inventory.svg': [344, 194],
    'reservation.svg': [344, 194],
    'home.svg': [19.25, 19.48],
    'history.svg': [22, 22],
    'work-card.svg': [24, 24],
    'plus.svg': [15, 15],
    'chevron.svg': [16, 16],
    'status-blue.svg': [5, 5],
    'status-warning.svg': [5, 5],
    'status-success.svg': [5, 5],
  }
  for (const image of localImages) {
    expect(image.loaded).toBe(true)
    const expected = dimensions[image.src.split('?')[0].split('/').at(-1)]
    expect(expected).toBeDefined()
    expect(image.width).toBeCloseTo(expected[0], 1)
    expect(image.height).toBeCloseTo(expected[1], 1)
  }
  await page.screenshot({
    path: testInfo.outputPath('home-desktop.png'),
    fullPage: true,
  })
  await page
    .getByRole('button', { name: '업무 처리하기', exact: true })
    .first()
    .click()
  await expect(page).toHaveURL(/\/work\/input$/)
  await expect(
    page.getByRole('heading', { name: '업무 자료 입력', exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: '‹ 홈', exact: true }).click()
  await page.getByRole('link', { name: '전체 보기', exact: true }).click()
  await expect(page).toHaveURL(/\/history$/)
  expect(writes).toEqual([])
})

test('home guide uses one backdrop, highlights real areas and restores focus', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/')
  await expect(page.locator('.work-tile')).toHaveCount(2)
  const help = page.getByRole('button', { name: '가이드 보기', exact: true })
  await help.click()
  const tour = page.getByRole('dialog', { name: '홈에서 어디로 가면 되나요?' })
  await expect(tour).toBeVisible()
  await expect(tour.locator('.guide-dialog__highlight')).toHaveCount(3)
  const confirm = tour.getByRole('button', { name: '확인했어요' })
  await expect(confirm).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(confirm).toBeFocused()
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
  await page.screenshot({
    path: testInfo.outputPath('home-onboarding.png'),
    fullPage: true,
  })
  await confirm.click()
  await expect(tour).not.toBeVisible()
  await expect(help).toBeFocused()
  await help.click()
  await page.keyboard.press('Escape')
  await expect(tour).not.toBeVisible()
})

test('in-place search supports recommendations, keyboard results, clear, empty and outside close', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/')
  await expect(page.locator('.work-tile')).toHaveCount(2)
  const input = page.getByRole('combobox', { name: '업무와 카드 검색' })
  await input.focus()
  await expect(page.getByText('추천 검색어', { exact: true })).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('home-search-open.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: '입고', exact: true }).click()
  await expect(input).toHaveValue('입고')
  const list = page.getByRole('listbox', { name: '검색 결과' })
  await expect(list.getByRole('option')).toHaveCount(2)
  await expect(page).toHaveURL(/\/$/)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
  await page.mouse.move(300, 170)
  await page.screenshot({
    path: testInfo.outputPath('home-search-results.png'),
    fullPage: true,
  })
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(
    page.getByRole('dialog', { name: '공유 업무 확인', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await input.focus()
  await page.getByRole('button', { name: '검색어 지우기' }).click()
  await expect(input).toHaveValue('')
  await input.fill('없는업무')
  await expect(page.getByText('검색 결과가 없어요')).toBeVisible()
  await page
    .locator('.home-search__empty')
    .getByRole('button', { name: '검색어 지우기' })
    .click()
  await expect(input).toHaveValue('')
  await input.press('Escape')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
  await input.focus()
  await page.getByRole('heading', { name: '등록된 업무', exact: true }).click()
  await expect(page.getByText('추천 검색어', { exact: true })).not.toBeVisible()
})

test('API mode calls Railway home/jobs and never fills missing server data with demo records', async ({
  page,
}) => {
  const requested = []
  await page.route(
    'https://gdgoc2026a.up.railway.app/api/v1/**',
    async (route) => {
      requested.push(route.request().url())
      const path = new URL(route.request().url()).pathname
      await route.fulfill({
        json: path.endsWith('/home')
          ? { tasks: [], resumeJobs: [], recentCards: [] }
          : { items: [] },
      })
    },
  )
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { getHomeDashboard } = await import('/src/services/homeService.js')
    return getHomeDashboard({ mode: 'api' })
  })
  expect(result).toEqual({
    source: 'api',
    tasks: [],
    resumeJobs: [],
    recentCards: [],
    recentJobs: [],
  })
  expect(requested).toHaveLength(2)
  await page.route('https://gdgoc2026a.up.railway.app/api/v1/home', (route) =>
    route.fulfill({ status: 404, json: { detail: 'Not Found' } }),
  )
  const failed = await page.evaluate(async () => {
    const { getHomeDashboard } = await import('/src/services/homeService.js')
    try {
      await getHomeDashboard({ mode: 'api' })
      return { ok: true }
    } catch (error) {
      return { ok: false, status: error.status }
    }
  })
  expect(failed).toEqual({ ok: false, status: 404 })
})

test('mobile search and tour fit viewport; small widths do not overflow after data arrives', async ({
  page,
}, testInfo) => {
  for (const width of [320, 390, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.work-tile')).toHaveCount(2)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  const input = page.getByRole('combobox', { name: '업무와 카드 검색' })
  await input.fill('입고')
  const rect = await page.locator('.home-search__dropdown').boundingBox()
  expect(rect.x).toBeGreaterThanOrEqual(0)
  expect(rect.x + rect.width).toBeLessThanOrEqual(390)
  await input.press('Escape')
  await page.getByRole('button', { name: '메뉴 열기', exact: true }).click()
  await page
    .getByRole('dialog', { name: '워크스페이스 메뉴', exact: true })
    .getByRole('button', { name: '가이드 보기', exact: true })
    .click()
  const tour = page.getByRole('dialog', { name: '홈에서 어디로 가면 되나요?' })
  await expect(tour).toBeVisible()
  const callout = await page.locator('.home-onboarding__callout').boundingBox()
  expect(callout.x).toBeGreaterThanOrEqual(0)
  expect(callout.y).toBeGreaterThanOrEqual(0)
  expect(callout.x + callout.width).toBeLessThanOrEqual(390)
  await page.screenshot({
    path: testInfo.outputPath('home-mobile-tour.png'),
    fullPage: true,
  })
  await tour.getByRole('button', { name: '확인했어요' }).click()
  await page.screenshot({
    path: testInfo.outputPath('home-mobile.png'),
    fullPage: true,
  })
})
