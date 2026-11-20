import { test, expect } from './workspace-fixture'
import AxeBuilder from '@axe-core/playwright'

test('loading cancels without losing input; sample error retries and replaces the file', async ({
  page,
}) => {
  const writes = []
  page.on('request', (request) => {
    if (['POST', 'PATCH', 'DELETE'].includes(request.method()))
      writes.push(request.url())
  })
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/work/input?fixture=read-error')
  await page.getByLabel('작업 이름', { exact: true }).fill('오후 입고 확인')
  await page.getByLabel('실제로 입고된 수량', { exact: true }).fill('24')
  await page
    .getByRole('button', { name: '예시 전표로 확인', exact: true })
    .click()
  await page.getByRole('button', { name: '초안 만들기', exact: true }).click()
  const loading = page.getByRole('dialog', {
    name: '검토할 초안을 만들고 있어요',
    exact: true,
  })
  await expect(loading).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/status-loading.png',
    fullPage: true,
  })
  await loading
    .getByRole('button', { name: '자료 입력으로', exact: true })
    .click()
  await expect(loading).not.toBeVisible()
  await expect(page.getByLabel('작업 이름', { exact: true })).toHaveValue(
    '오후 입고 확인',
  )
  await expect(
    page.getByLabel('실제로 입고된 수량', { exact: true }),
  ).toHaveValue('24')
  // Waiting past the previous request establishes cancellation, not only dismissal.
  await page.waitForTimeout(1900)
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await page.getByRole('button', { name: '초안 만들기', exact: true }).click()
  const error = page.getByRole('dialog', {
    name: '전표 파일을 읽지 못했어요',
    exact: true,
  })
  await expect(error).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/status-file-error.png',
    fullPage: true,
  })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await error.getByRole('button', { name: '다시 시도', exact: true }).click()
  await expect(loading).toBeVisible()
  await expect(error).toBeVisible()
  await error
    .getByRole('button', { name: '파일 다시 선택', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: '파일을 선택하거나 여기에 놓으세요' }),
  ).toBeFocused()
  await expect(page.getByLabel('작업 이름', { exact: true })).toHaveValue(
    '오후 입고 확인',
  )
  expect(writes).toEqual([])
})

test('actual file never appears to have been read or uploaded', async ({
  page,
}) => {
  await page.goto('/work/input?fixture=read-error')
  await page.locator('input[type=file]').setInputFiles({
    name: 'my-private.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('content not read'),
  })
  await page.getByRole('button', { name: '초안 만들기', exact: true }).click()
  const notice = page.getByRole('dialog', {
    name: '파일 읽기 연결을 준비하고 있어요',
    exact: true,
  })
  await expect(notice).toBeVisible()
  await expect(notice.getByRole('alert')).toContainText(
    '선택한 파일을 보내거나 읽지 않았어요',
  )
  await expect(
    notice.getByRole('button', { name: '다시 시도', exact: true }),
  ).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(
    page
      .getByRole('list', { name: '선택한 파일', exact: true })
      .getByText('my-private.txt', { exact: false }),
  ).toBeVisible()
})

test('missing manual highlights the upload area and preserves existing file and name', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/work/new')
  await page
    .getByRole('button', { name: '예시 자료 채우기', exact: true })
    .click()
  await page
    .getByRole('button', {
      name: '새 재고 시스템 매뉴얼.pdf 삭제',
      exact: true,
    })
    .click()
  await expect(page.getByRole('alert')).toContainText(
    '새 시스템 매뉴얼이 빠졌어요',
  )
  await expect(
    page.getByText('기존 입고 양식.xlsx', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '매뉴얼 선택하기', exact: true }),
  ).toBeVisible()
  await expect(page.getByLabel('업무 이름', { exact: false })).toHaveValue(
    '재고 입고 기록',
  )
  await page.screenshot({
    path: 'docs/screenshots/status-missing-manual.png',
    fullPage: true,
  })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.locator('dialog input[type=file]').setInputFiles({
    name: 'manual.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('manual'),
  })
  await expect(
    page.getByText('새 시스템 매뉴얼이 빠졌어요', { exact: true }),
  ).toHaveCount(0)
})

test('empty collections use specific actions, responsive layout and meaningful status', async ({
  page,
}) => {
  for (const [url, title, action, screenshot] of [
    [
      '/work-cards?empty=1',
      '저장한 업무 카드가 없어요',
      '업무 선택하기',
      'status-empty-cards',
    ],
    [
      '/history?empty=1',
      '아직 시작한 작업이 없어요',
      '업무 시작하기',
      'status-empty-history',
    ],
  ]) {
    await page.setViewportSize({ width: 1440, height: 1080 })
    await page.goto(url)
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible()
    await page.screenshot({
      path: `docs/screenshots/${screenshot}.png`,
      fullPage: true,
    })
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 900 })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true)
    }
    await page.getByRole('button', { name: action, exact: true }).click()
    await expect(page).toHaveURL('/')
  }
})

test('no search results clears the term, keeps focus, and fits mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/')
  const input = page.getByRole('combobox', { name: '업무와 카드 검색' })
  await input.fill('주문')
  await expect(
    page.getByText('검색 결과가 없어요', { exact: true }),
  ).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/status-empty-search.png',
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: 'docs/screenshots/status-mobile-search.png',
    fullPage: true,
  })
  expect(
    await page
      .locator('.home-search__dropdown')
      .evaluate((el) => el.getBoundingClientRect().right <= innerWidth),
  ).toBe(true)
  await page
    .locator('.home-search__empty')
    .getByRole('button', { name: '검색어 지우기', exact: true })
    .click()
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await expect(page.getByText('추천 검색어', { exact: true })).toBeVisible()
  await page.goto('/work/input?fixture=read-error')
  await page
    .getByRole('button', { name: '예시 전표로 확인', exact: true })
    .click()
  await page.getByRole('button', { name: '초안 만들기', exact: true }).click()
  await expect(
    page.getByRole('dialog', {
      name: '전표 파일을 읽지 못했어요',
      exact: true,
    }),
  ).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/status-mobile-error.png',
    fullPage: true,
  })
  expect(
    await page
      .locator('dialog[open]')
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true)
})
