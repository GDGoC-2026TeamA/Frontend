import { test, expect } from './workspace-fixture'
import AxeBuilder from '@axe-core/playwright'

async function exampleComparison(page) {
  await page.goto('/work/new')
  await page
    .getByRole('button', { name: '예시 자료 채우기', exact: true })
    .click()
  await page.getByRole('button', { name: '자료 분석하기', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '업무 절차를 비교하고 있어요' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '내용 수정', exact: true }),
  ).toBeVisible()
}

test('registration validates missing and real files without fabricating analysis', async ({
  page,
}) => {
  const writes = []
  page.on('request', (request) => {
    if (['POST', 'PATCH', 'DELETE'].includes(request.method()))
      writes.push(request.url())
  })
  await page.goto('/')
  await page.getByRole('button', { name: '새 업무 등록', exact: true }).click()
  await expect(
    page.getByRole('dialog', { name: '새 업무 등록', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '자료 분석하기', exact: true }),
  ).toBeDisabled()
  await page.getByLabel('업무 이름', { exact: false }).fill('실제 자료 점검')
  const inputs = page.locator('dialog input[type=file]')
  await inputs.nth(0).setInputFiles({
    name: 'old.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('old'),
  })
  await page.locator('dialog input[type=file]').setInputFiles({
    name: 'new.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('new'),
  })
  await page.getByRole('button', { name: '자료 분석하기', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText(
    '문서 분석은 아직 연결되지 않았어요',
  )
  expect(writes).toEqual([])
  await page.getByRole('button', { name: '새 업무 등록 닫기' }).click()
  await expect(page).toHaveURL('/')
})

test('comparison edit persists user text and keeps outstanding question visible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await exampleComparison(page)
  await page.screenshot({
    path: 'docs/screenshots/registration-compare.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: '내용 수정', exact: true }).click()
  await page
    .getByLabel('확인한 절차', { exact: true })
    .fill('실제 수량과 차이 사유를 함께 기록해요.')
  await page
    .getByLabel('추가로 확인할 내용', { exact: true })
    .fill('물류팀 승인 담당자는 누구인가요?')
  await page.screenshot({
    path: 'docs/screenshots/registration-edit.png',
    fullPage: true,
  })
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
  await expect(
    page.getByText('승인 담당자는 아직 확인이 필요해요.', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('실제 수량과 차이 사유를 함께 기록해요.', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('확인할 질문 물류팀 승인 담당자는 누구인가요?'),
  ).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/registration-revised.png',
    fullPage: true,
  })
  const scan = await new AxeBuilder({ page }).analyze()
  expect(scan.violations).toEqual([])
  await page
    .getByRole('button', { name: '내용 다시 수정', exact: true })
    .click()
  await expect(
    page.getByLabel('추가로 확인할 내용', { exact: true }),
  ).toHaveValue('물류팀 승인 담당자는 누구인가요?')
  await page
    .getByRole('button', { name: '비교로 돌아가기', exact: true })
    .click()
  await page
    .getByRole('dialog', { name: '새 업무 등록', exact: true })
    .getByRole('button', { name: '새 방식 익히기', exact: true })
    .click()
  await expect(page).toHaveURL(/\/learn\//)
  await expect(
    page.getByRole('heading', { name: '새 방식 익히기', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '비교 내용 보기', exact: true }),
  ).toBeVisible()
})

test('cancel analysis, focus trap, close, reopen and mobile layouts', async ({
  page,
}) => {
  await page.goto('/work/new')
  await page.screenshot({
    path: 'docs/screenshots/registration-empty.png',
    fullPage: true,
  })
  await page
    .getByRole('button', { name: '예시 자료 채우기', exact: true })
    .click()
  await page.getByRole('button', { name: '자료 분석하기', exact: true }).click()
  await page.getByRole('button', { name: '등록 화면으로', exact: true }).click()
  await page.waitForTimeout(1500)
  await expect(
    page.getByRole('button', { name: '자료 분석하기', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL('/')
  await page.getByRole('button', { name: '새 업무 등록', exact: true }).click()
  await expect(page.getByLabel('업무 이름', { exact: false })).toHaveValue('')
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 })
    const dialog = page.getByRole('dialog', {
      name: '새 업무 등록',
      exact: true,
    })
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true)
    await page.keyboard.press('Tab')
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true)
  }
  await exampleComparison(page)
  await page.getByRole('button', { name: '내용 수정', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByLabel('확인한 절차', { exact: true })).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/registration-mobile.png',
    fullPage: true,
  })
  expect(
    await page
      .locator('dialog[open]')
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true)
})
