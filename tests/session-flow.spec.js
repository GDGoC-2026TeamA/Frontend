import { test, expect } from '@playwright/test'
const key = 'workbridge.demo.session.v1'
async function signup(page) {
  await page.getByLabel('이름', { exact: false }).fill('새 사용자')
  await page.getByLabel('이메일', { exact: false }).fill('new@example.com')
  await page
    .getByLabel('비밀번호 (필수)', { exact: true })
    .fill('example-password')
  await page
    .getByLabel('비밀번호 확인', { exact: false })
    .fill('example-password')
  await page.getByRole('button', { name: '가입하기', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '홈', exact: true }),
  ).toBeVisible()
}
test('a fresh visit and all private deep links open signup before rendering or requesting workspace data', async ({
  page,
}) => {
  const requests = []
  page.on('request', (request) => {
    if (/\/api\/v1\/(home|jobs|tasks|cards)/.test(request.url()))
      requests.push(request.url())
  })
  for (const path of [
    '/',
    '/tasks/2',
    '/profile',
    '/settings',
    '/history',
    '/work/input?taskId=2',
  ]) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/signup$/)
    await expect(
      page.getByRole('heading', { name: '회원가입', exact: true }),
    ).toBeVisible()
    await expect(page.locator('.work-tile')).toHaveCount(0)
  }
  await page.screenshot({
    path: 'docs/screenshots/auth-fix-first-signup.png',
    fullPage: true,
  })
  await page.getByRole('link', { name: '로그인으로 돌아가기' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('link', { name: '처음 오셨나요? 회원가입' }).click()
  await expect(page).toHaveURL(/\/signup$/)
  expect(requests).toEqual([])
})
test('example session restores across reload without storing the password or borrowing seeded records', async ({
  page,
}) => {
  await page.goto('/')
  await signup(page)
  const stored = await page.evaluate((key) => sessionStorage.getItem(key), key)
  expect(stored).toContain('new@example.com')
  expect(stored).not.toContain('example-password')
  await page.reload()
  await expect(page).toHaveURL(/\/$/)
  await expect(
    page.getByRole('heading', { name: '첫 업무를 등록해 보세요' }),
  ).toBeVisible()
  await expect(page.locator('.work-tile')).toHaveCount(0)
  await page.goto('/profile')
  await expect(page.getByLabel('이름', { exact: false })).toHaveValue(
    '새 사용자',
  )
  await page.getByLabel('이름', { exact: false }).fill('수정한 이름')
  await page
    .getByRole('button', { name: '변경 사항 저장', exact: true })
    .click()
  await page.reload()
  await expect(page.getByLabel('이름', { exact: false })).toHaveValue(
    '수정한 이름',
  )
})
test('expired or malformed stored sessions never open private screens', async ({
  page,
}) => {
  await page.goto('/signup')
  for (const value of [
    'malformed',
    JSON.stringify({
      version: 1,
      user: { id: 'old', name: 'old', email: 'old@example.com' },
      expiresAt: Date.now() - 1000,
    }),
  ]) {
    await page.evaluate(
      ({ key, value }) => sessionStorage.setItem(key, value),
      { key, value },
    )
    await page.goto('/tasks')
    await expect(page).toHaveURL(/\/signup$/)
    expect(
      await page.evaluate((key) => sessionStorage.getItem(key), key),
    ).toBeNull()
  }
})
test('logout removes the stored session and navigating back cannot expose the home', async ({
  page,
}) => {
  await page.goto('/signup')
  await signup(page)
  await page.goto('/profile')
  await page
    .locator('.sidebar')
    .getByRole('button', { name: '개인 작업 공간' })
    .click()
  await page
    .locator('.sidebar')
    .getByRole('button', { name: '로그아웃', exact: true })
    .click()
  await page
    .getByRole('dialog', { name: '로그아웃할까요?' })
    .getByRole('button', { name: '로그아웃', exact: true })
    .click()
  await expect(page).toHaveURL(/\/login$/)
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), key),
  ).toBeNull()
  await page.goBack()
  await expect(page.locator('.home-foundation')).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: /로그인|회원가입/, exact: true }),
  ).toBeVisible()
})
