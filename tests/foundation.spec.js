import { test, expect } from './workspace-fixture'
import AxeBuilder from '@axe-core/playwright'

test('main navigation, unfinished routes, and help modal', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: '홈', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('combobox', { name: '업무와 카드 검색' }),
  ).toBeEnabled()
  const nav = page.getByRole('navigation', { name: '주요 메뉴', exact: true })
  await expect(nav.getByRole('link')).toHaveCount(4)
  await nav.getByRole('link', { name: '개인 업무 카드', exact: true }).click()
  await expect(page).toHaveURL(/work-cards$/)
  await expect(
    nav.getByRole('link', { name: '개인 업무 카드' }),
  ).toHaveAttribute('aria-current', 'page')
  await nav.getByRole('link', { name: '작업 내역', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '작업 내역', exact: true }),
  ).toBeVisible()
  await nav.getByRole('link', { name: '홈', exact: true }).click()
  await page.getByRole('button', { name: '새 업무 등록', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '새 업무 등록', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await nav.getByRole('link', { name: '개인 업무 카드', exact: true }).click()
  const help = page.getByRole('button', { name: '가이드 보기', exact: true })
  await help.click()
  const dialog = page.getByRole('dialog', { name: 'WORK BRIDGE 사용 방법' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/외부 재고 시스템 등록/)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(help).toBeFocused()
  await help.click()
  await dialog.getByRole('button', { name: '확인했어요' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(help).toBeFocused()
  await page.goto('/not-a-page')
  await expect(
    page.getByRole('heading', { name: '페이지를 찾을 수 없어요' }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test('component input, checkbox, keyboard tabs, and steps', async ({
  page,
}) => {
  await page.goto('/dev/components')
  await page.getByLabel('업무명', { exact: true }).fill('재고 입고 기록 테스트')
  await expect(page.getByLabel('업무명', { exact: true })).toHaveValue(
    '재고 입고 기록 테스트',
  )
  const checked = page.getByRole('checkbox', {
    name: '원본 자료와 대조했어요',
    exact: true,
  })
  await checked.check()
  await expect(checked).toBeChecked()
  await expect(
    page.getByLabel('읽기 전용 업무명', { exact: true }),
  ).toHaveAttribute('readonly', '')
  await expect(page.getByLabel('비활성 입력란', { exact: true })).toBeDisabled()
  await expect(
    page.getByLabel('필수 입력 오류', { exact: false }),
  ).toHaveAttribute('aria-invalid', 'true')
  const firstTab = page.getByRole('tab', { name: '업무 기준 자료' })
  await firstTab.focus()
  await page.keyboard.press('ArrowRight')
  await expect(
    page.getByRole('tab', { name: '작업 자료', exact: true }),
  ).toBeFocused()
  await expect(page.getByRole('tabpanel')).toContainText('오늘 받은 입고 내역')
  await page.keyboard.press('ArrowRight')
  await expect(firstTab).toBeFocused()
  await page.getByRole('button', { name: '다음 단계 예시' }).click()
  await expect(page.locator('[aria-current="step"]')).toContainText('결과 저장')
  await expect(
    page.getByRole('button', { name: '다음 단계 예시' }),
  ).toBeDisabled()
  await expect(page.locator('button[aria-busy="true"]')).toHaveCount(3)
})

test('file selection, deletion, validation, and dropping never upload content', async ({
  page,
}) => {
  const writes = []
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method()))
      writes.push(request.url())
  })
  await page.goto('/dev/components')
  const upload = page
    .locator('.file-upload')
    .filter({ has: page.getByText('기존 양식 선택', { exact: true }) })
  await upload.locator('input[type=file]').setInputFiles({
    name: 'inventory.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('item,quantity\nA,3'),
  })
  await expect(
    upload.getByText('inventory.csv', { exact: false }),
  ).toBeVisible()
  await upload.getByRole('button', { name: 'inventory.csv 삭제' }).click()
  await expect(upload.getByRole('list')).toHaveCount(0)
  await upload.locator('input[type=file]').setInputFiles({
    name: 'invalid.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('demo'),
  })
  await expect(upload.getByRole('alert')).toContainText('파일 형식')
  const dataTransfer = await page.evaluateHandle(() => {
    const dt = new DataTransfer()
    dt.items.add(
      new File(['item,quantity\nA,3'], 'drop.csv', { type: 'text/csv' }),
    )
    return dt
  })
  await upload
    .locator('.file-upload__zone')
    .dispatchEvent('drop', { dataTransfer })
  await expect(upload.getByText('drop.csv', { exact: false })).toBeVisible()
  await upload.locator('input[type=file]').setInputFiles({
    name: 'too-big.csv',
    mimeType: 'text/csv',
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  })
  await expect(upload.getByRole('alert')).toContainText('10MB')
  await expect(upload.getByText('drop.csv', { exact: false })).toBeVisible()
  await page.reload()
  await expect(upload.getByRole('list')).toHaveCount(0)
  expect(writes).toEqual([])
})

test('modal and drawer contain focus, close, and restore focus', async ({
  page,
}) => {
  await page.goto('/dev/components')
  const openModal = page.getByRole('button', {
    name: '확인 모달 열기',
    exact: true,
  })
  await openModal.click()
  const dialog = page.getByRole('dialog', {
    name: '공통 모달 확인',
    exact: true,
  })
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    expect(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true)
  }
  await dialog.getByRole('button', { name: '취소', exact: true }).click()
  await expect(openModal).toBeFocused()
  await openModal.click()
  await dialog.getByRole('button', { name: '확인', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: '데이터는 저장하지' }),
  ).toBeVisible()
  await openModal.click()
  await page.mouse.click(10, 10)
  await expect(dialog).not.toBeVisible()
  const openDrawer = page.getByRole('button', {
    name: 'AI 패널 구조 보기',
    exact: true,
  })
  await openDrawer.click()
  const drawer = page.getByRole('dialog', {
    name: 'AI 질문과 자료 근거',
    exact: true,
  })
  await expect(drawer).toBeVisible()
  await expect(
    drawer.getByRole('heading', { name: '새 재고 시스템 매뉴얼' }),
  ).toBeVisible()
  await expect(drawer).toContainText('12쪽')
  await page.keyboard.press('Escape')
  await expect(drawer).not.toBeVisible()
  await expect(openDrawer).toBeFocused()
})

test('demo response states and error recovery', async ({ page }) => {
  await page.goto('/dev/components')
  const responses = page.locator('#responses')
  await responses
    .getByRole('button', { name: '오류 응답 예시', exact: true })
    .click()
  await expect(
    responses.getByRole('heading', { name: '예시 내용을 불러오고 있어요' }),
  ).toBeVisible()
  await expect(responses.getByRole('alert')).toContainText(
    '실제 서버 요청은 보내지',
  )
  await responses.getByRole('button', { name: '예시 다시 불러오기' }).click()
  await expect(
    responses.getByRole('heading', { name: '새 재고 시스템 매뉴얼' }),
  ).toBeVisible()
  await responses
    .getByRole('button', { name: '자료 부족 예시', exact: true })
    .click()
  await expect(
    responses.getByRole('heading', { name: '확인할 자료가 더 필요해요' }),
  ).toBeVisible()
  await responses
    .getByRole('button', { name: '정상 응답 예시', exact: true })
    .click()
  await expect(
    responses.getByRole('heading', { name: '새 재고 시스템 매뉴얼' }),
  ).toBeVisible()
})

test('desktop and mobile layouts and accessibility', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.sidebar')).toHaveCSS('width', '208px')
  await expect(page.locator('.page-header--home h1')).toHaveCSS(
    'font-size',
    '42px',
  )
  await expect(page.locator('.header__search--home')).toHaveCSS(
    'width',
    '226px',
  )
  await expect(page.locator('.header__search--home')).toHaveCSS(
    'height',
    '42px',
  )
  await expect(
    page.getByRole('complementary', { name: '빠른 확인' }),
  ).toHaveCount(0)
  await expect(page.locator('.home-overview')).toBeVisible()
  const frame = await page.locator('.home-workspace').boundingBox()
  expect(frame).toMatchObject({ x: 36, y: 58, width: 1368 })
  expect(frame.height).toBeGreaterThanOrEqual(1124)
  await expect(
    page.locator('.home-workspace > .app-layout__workspace'),
  ).toHaveCSS('width', '1160px')
  await expect(page.locator('.header')).toHaveCount(0)
  await page.screenshot({
    path: testInfo.outputPath('home-desktop.png'),
    fullPage: true,
  })
  for (const path of ['/', '/dev/components']) {
    await page.goto(path)
    if (path !== '/') {
      await expect(page.locator('.sidebar')).toHaveCSS('width', '208px')
      await expect(page.locator('.header')).toHaveCSS('height', '72px')
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
  }
  await page.screenshot({
    path: testInfo.outputPath('components-desktop.png'),
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.sidebar')).not.toBeVisible()
  await page.getByRole('button', { name: '메뉴 열기', exact: true }).click()
  const menu = page.getByRole('dialog', {
    name: '워크스페이스 메뉴',
    exact: true,
  })
  await menu.getByRole('link', { name: '작업 내역', exact: true }).click()
  await expect(menu).not.toBeVisible()
  await expect(
    page.getByRole('heading', { name: '작업 내역', exact: true }),
  ).toBeVisible()
  for (const path of ['/', '/dev/components']) {
    await page.goto(path)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
  }
  await page.screenshot({
    path: testInfo.outputPath('components-mobile.png'),
    fullPage: true,
  })
  await page.goto('/')
  await page.screenshot({
    path: testInfo.outputPath('home-mobile.png'),
    fullPage: true,
  })
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dev/components')
  await page
    .getByRole('button', { name: 'AI 패널 구조 보기', exact: true })
    .click()
  const drawer = page.getByRole('dialog', {
    name: 'AI 질문과 자료 근거',
    exact: true,
  })
  const rect = await drawer.boundingBox()
  expect(rect.width).toBeLessThanOrEqual(390)
  expect(rect.x).toBeGreaterThanOrEqual(0)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
