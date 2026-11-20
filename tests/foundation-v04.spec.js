import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('account disclosure closes outside and Escape restores focus; forms stay local', async ({
  page,
}) => {
  const writes = []
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()))
      writes.push(request.url())
  })
  await page.goto('/dev/components')
  const scope = page.getByRole('region', { name: 'V0.4 공통 컴포넌트' })
  const trigger = scope.getByRole('button', { name: '개인 작업 공간' })
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Tab')
  await expect(
    scope.getByRole('button', { name: '프로필', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await trigger.click()
  await scope.getByRole('button', { name: '설정', exact: true }).click()
  await scope.getByLabel('이메일', { exact: true }).fill('edited@example.com')
  await scope.getByRole('button', { name: '이메일 저장' }).click()
  await expect(scope.getByRole('status')).toContainText(
    '서버에는 저장하지 않았어요',
  )
  await trigger.click()
  await scope.getByRole('button', { name: '로그아웃', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '로그아웃할까요?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '취소' }).click()
  await expect(trigger).toBeFocused()
  expect(writes).toEqual([])
})

test('publication does not clear outstanding checks; recommendation keeps direct choice available', async ({
  page,
}) => {
  await page.goto('/dev/components')
  const scope = page.getByRole('region', { name: 'V0.4 공통 컴포넌트' })
  for (const status of await scope
    .getByRole('region', { name: '업무 공유 상태' })
    .all()) {
    await expect(status).toContainText('확인 필요')
    await expect(status).toContainText('기준 v1')
  }
  const choice = scope.getByRole('radio', { name: '이 항목을 연습할게요' })
  await expect(choice.nth(1)).toBeDisabled()
  await choice.first().check()
  await expect(choice.first()).toBeChecked()
  await scope
    .getByRole('button', { name: '직접 선택하기', exact: true })
    .click()
  const manual = scope.getByRole('radio', { name: '확인된 절차 직접 선택' })
  await expect(manual).toBeFocused()
  await page.keyboard.press('Space')
  await expect(manual).toBeChecked()
  await expect(choice.first()).not.toBeChecked()
  await scope.getByRole('button', { name: '공유 설정', exact: true }).click()
  await expect(
    page
      .getByRole('dialog', { name: '공유 설정' })
      .getByRole('button', { name: '공유하기' }),
  ).toBeDisabled()
})

test('guide is one backdrop and remains inside narrow viewports with focus restored', async ({
  page,
}) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/dev/components')
    const button = page.getByRole('button', {
      name: '첫 업무 안내',
      exact: true,
    })
    await button.click()
    const dialog = page.getByRole('dialog', {
      name: '등록한 업무에서 시작하세요',
    })
    await expect(dialog).toBeVisible()
    const card = await dialog.locator('.guide-dialog__card').boundingBox()
    expect(card.x).toBeGreaterThanOrEqual(0)
    expect(card.x + card.width).toBeLessThanOrEqual(width)
    expect(card.y + card.height).toBeLessThanOrEqual(900)
    await expect(dialog.locator('svg')).toHaveCount(0)
    await page.keyboard.press('Tab')
    await expect(
      dialog.getByRole('button', { name: '확인했어요' }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(button).toBeFocused()
  }
})

test('V0.4 primitives fit mobile, pass accessibility checks and capture review examples', async ({
  page,
}, testInfo) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1080 })
    await page.goto('/dev/components')
    const scope = page.getByRole('region', { name: 'V0.4 공통 컴포넌트' })
    await expect(scope).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    const results = await new AxeBuilder({ page })
      .include('#foundation-v04')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
    if (width === 1440) {
      await scope.screenshot({
        path: testInfo.outputPath('foundation-v04-desktop.png'),
      })
      await page.getByRole('button', { name: '홈 안내', exact: true }).click()
      await page.screenshot({
        path: testInfo.outputPath('foundation-v04-guide.png'),
      })
    }
    if (width === 390)
      await scope.screenshot({
        path: testInfo.outputPath('foundation-v04-mobile.png'),
      })
  }
})
