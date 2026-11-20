import { test as anonymousTest } from '@playwright/test'
import { test, expect } from './workspace-fixture'
import AxeBuilder from '@axe-core/playwright'

const capture = (page, name) =>
  page.screenshot({
    path: `docs/screenshots/final-${name}.png`,
    fullPage: true,
  })
const menu = async (page, action) => {
  await page
    .getByRole('button', { name: '예약 접수 더 보기', exact: true })
    .click()
  await page.getByRole('button', { name: action, exact: true }).click()
}
const accountMenu = async (page, action) => {
  await page
    .locator('.sidebar')
    .getByRole('button', { name: '개인 작업 공간' })
    .click()
  await page
    .locator('.sidebar')
    .getByRole('button', { name: action, exact: true })
    .click()
}

test('signup validates fields and first workspace has actions instead of someone else records', async ({
  page,
}) => {
  const writes = []
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url())
  })
  await page.goto('/signup')
  await page.getByRole('button', { name: '가입하기', exact: true }).click()
  await expect(page.getByLabel('이름', { exact: false })).toBeFocused()
  await expect(
    page.getByText('이메일 형식을 확인해 주세요.', { exact: true }),
  ).toBeVisible()
  await capture(page, 'signup-validation')
  await page.getByLabel('이름', { exact: false }).fill('첫 방문자')
  await page.getByLabel('이메일', { exact: false }).fill('first@example.com')
  await page
    .getByLabel('비밀번호 (필수)', { exact: true })
    .fill('example-password')
  await page.getByLabel('비밀번호 확인', { exact: false }).fill('mismatch')
  await page.getByRole('button', { name: '가입하기', exact: true }).click()
  await expect(
    page.getByText('비밀번호가 일치하지 않아요.', { exact: true }),
  ).toBeVisible()
  await page
    .getByLabel('비밀번호 확인', { exact: false })
    .fill('example-password')
  await page.getByRole('button', { name: '가입하기', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '첫 업무를 등록해 보세요' }),
  ).toBeVisible()
  await expect(page.locator('.work-tile')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: '첫 업무 등록하기', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('main')).not.toContainText('WB-102')
  await capture(page, 'first-workspace')
  await page
    .getByRole('button', { name: '첫 업무 등록하기', exact: true })
    .click()
  await page.getByRole('checkbox', { name: '개인 작업 공간에만 보관' }).check()
  await page.getByRole('button', { name: '예시 자료 채우기' }).click()
  await page.getByRole('button', { name: '자료 분석하기', exact: true }).click()
  await page.getByRole('button', { name: '내용 수정', exact: true }).click()
  await page
    .getByLabel('확인한 절차', { exact: true })
    .fill('첫 업무의 확인한 절차')
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
  await page.getByRole('button', { name: '개인 업무 저장하기' }).click()
  const guide = page.getByRole('dialog', { name: '등록한 업무에서 시작하세요' })
  await expect(guide).toBeVisible()
  await capture(page, 'first-task-guide')
  await guide.getByRole('button', { name: '확인했어요' }).click()
  await expect(page.locator('.work-tile')).toHaveCount(1)
  await accountMenu(page, '프로필')
  await expect(page.getByLabel('이름', { exact: false })).toHaveValue(
    '첫 방문자',
  )
  expect(writes).toEqual([])
})

anonymousTest(
  'unconfigured social login keeps the user on the login screen',
  async ({ page }) => {
    await page.goto('/login')
    await capture(page, 'login')
    await page.getByRole('button', { name: '카카오로 로그인' }).click()
    await expect(page.getByRole('alert')).toContainText(
      '소셜 로그인 서버가 연결되지 않았어요',
    )
    await page.getByRole('button', { name: 'Google로 로그인' }).click()
    await expect(page.getByRole('alert')).toContainText(
      '소셜 로그인 서버가 연결되지 않았어요',
    )
    await expect(page).toHaveURL(/\/login$/)
  },
)

anonymousTest(
  'unconfigured password reset stays on the form and sends no request',
  async ({ page }) => {
    const posts = []
    await page.route('**/*', async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      posts.push(route.request().url())
      await route.abort()
    })
    await page.goto('/login')
    await page.getByRole('link', { name: '비밀번호를 잊으셨나요?' }).click()
    await expect(page).toHaveURL(/\/forgot-password$/)
    await page.getByLabel('이메일', { exact: false }).fill('first@example.com')
    await page.getByRole('button', { name: '재설정 링크 보내기' }).click()
    await expect(page.getByRole('alert')).toContainText(
      '계정 서버가 연결되지 않았어요',
    )
    await expect(page).toHaveURL(/\/forgot-password$/)
    expect(posts).toEqual([])
    await capture(page, 'reset-unconnected')
  },
)

test('profile and email edits save only locally while cancellation restores saved values', async ({
  page,
}) => {
  await page.goto('/')
  await accountMenu(page, '프로필')
  await expect(
    page.getByRole('heading', { name: '내 프로필', exact: true }),
  ).toBeVisible()
  await page.getByLabel('이름', { exact: false }).fill('수정한 이름')
  await page
    .getByRole('button', { name: '변경 사항 저장', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText(
    '서버에는 저장하지 않았어요',
  )
  await page.getByLabel('이름', { exact: false }).fill('취소할 이름')
  await page.getByRole('button', { name: '취소', exact: true }).click()
  await expect(page.getByLabel('이름', { exact: false })).toHaveValue(
    '수정한 이름',
  )
  await capture(page, 'profile')
  await accountMenu(page, '설정')
  await page.getByLabel('이메일', { exact: false }).fill('bad')
  await page.getByRole('button', { name: '이메일 변경 사항 저장' }).click()
  await expect(page.getByRole('alert')).toContainText('이메일 형식')
  await page.getByLabel('이메일', { exact: false }).fill('edited@example.com')
  await page.getByRole('button', { name: '이메일 변경 사항 저장' }).click()
  await expect(page.getByRole('status')).toContainText('예시 계정에 저장')
  await capture(page, 'settings')
})

test('logout requires confirmation and deletes private example state before next sign in', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('.work-tile')).toHaveCount(2)
  await accountMenu(page, '로그아웃')
  const dialog = page.getByRole('dialog', { name: '로그아웃할까요?' })
  await capture(page, 'logout')
  await dialog.getByRole('button', { name: '취소', exact: true }).click()
  await expect(page.locator('.work-tile')).toHaveCount(2)
  await accountMenu(page, '로그아웃')
  await dialog.getByRole('button', { name: '로그아웃', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('이메일', { exact: false }).fill('next@example.com')
  await page
    .getByLabel('비밀번호 (필수)', { exact: true })
    .fill('example-password')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await expect(page.locator('.work-tile')).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: '첫 업무를 등록해 보세요' }),
  ).toBeVisible()
})

test('task metadata preserves comparison content and cancelling an edit changes nothing', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByRole('button', { name: '예약 접수 더 보기', exact: true })
    .click()
  await expect(
    page.locator('.task-menu__panel').getByRole('button'),
  ).toHaveCount(4)
  await capture(page, 'owned-menu')
  await page
    .getByRole('button', { name: '이름과 설명 수정', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: '이름과 설명 수정' })
  await capture(page, 'task-edit')
  await dialog.getByLabel('업무 이름', { exact: false }).fill('')
  await dialog.getByRole('button', { name: '저장', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('업무 이름을 입력')
  await dialog.getByLabel('업무 이름', { exact: false }).fill('예약 접수 수정')
  await dialog
    .getByLabel('설명', { exact: true })
    .fill('예약 변경 요청을 확인해요.')
  await dialog.getByRole('button', { name: '저장', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '예약 접수 수정', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: '예약 접수 수정 더 보기' }).click()
  await page
    .getByRole('button', { name: '이름과 설명 수정', exact: true })
    .click()
  await dialog.getByLabel('업무 이름', { exact: false }).fill('취소한 업무')
  await dialog.getByRole('button', { name: '취소', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '예약 접수 수정', exact: true }),
  ).toBeVisible()
})

test('delete confirmation removes only owned task and preserves personal history and cards', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '재고 입고 기록 더 보기' }).click()
  await expect(
    page.locator('.task-menu__panel').getByRole('button'),
  ).toHaveCount(1)
  await capture(page, 'shared-menu')
  await page.keyboard.press('Escape')
  await menu(page, '업무 삭제')
  const dialog = page.getByRole('dialog', { name: '예약 접수를 삭제할까요?' })
  await capture(page, 'task-delete')
  await dialog.getByRole('button', { name: '취소', exact: true }).click()
  await expect(page.locator('.work-tile')).toHaveCount(2)
  await menu(page, '업무 삭제')
  await dialog.getByRole('button', { name: '업무 삭제', exact: true }).click()
  await expect(page.locator('.work-tile')).toHaveCount(1)
  await expect(
    page.getByRole('heading', { name: '예약 접수', exact: true }),
  ).toHaveCount(0)
  await page
    .getByRole('link', { name: '작업 내역', exact: true })
    .first()
    .click()
  await expect(page.getByRole('main')).toContainText('예약')
  await page
    .getByRole('link', { name: '개인 업무 카드', exact: true })
    .first()
    .click()
  await expect(page.getByRole('main')).toContainText('예약')
})

test('sharing routes to baseline review and never publishes from the management popup', async ({
  page,
}) => {
  await page.goto('/')
  await menu(page, '공유 설정')
  const dialog = page.getByRole('dialog', { name: '공유 설정', exact: true })
  await expect(dialog).toContainText('질문과 개인 카드는 내 기록')
  await capture(page, 'task-share')
  await dialog.getByRole('button', { name: '검토 후 공유하기' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await expect(
    page.getByRole('dialog').getByLabel('업무 이름', { exact: false }),
  ).toHaveValue('예약 접수')
  await expect(page.getByText('공유했어요', { exact: false })).toHaveCount(0)
})

test('account screens fit mobile widths and have named controls without serious accessibility violations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/login', '/signup', '/profile', '/settings']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    const audit = await new AxeBuilder({ page }).analyze()
    expect(
      audit.violations.filter((issue) =>
        ['serious', 'critical'].includes(issue.impact),
      ),
    ).toEqual([])
  }
  await capture(page, 'settings-mobile')
  await page.getByRole('button', { name: '메뉴 열기' }).click()
  const drawer = page.getByRole('dialog')
  await drawer.getByRole('button', { name: '개인 작업 공간' }).click()
  await drawer.getByRole('button', { name: '프로필', exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('session expiry preserves return path and callback query strings cannot authenticate', async ({
  page,
}) => {
  await page.goto('/tasks')
  await page.evaluate(() =>
    window.dispatchEvent(new Event('workbridge:session-expired')),
  )
  await page
    .getByRole('dialog', { name: '다시 로그인해 주세요' })
    .getByRole('button', { name: '다시 로그인', exact: true })
    .click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/auth/callback?success=true&user=admin&token=fake')
  await expect(
    page.getByRole('heading', { name: '로그인에 실패했어요' }),
  ).toBeVisible()
  await expect(page.getByRole('alert')).toContainText(
    '계정 서버가 연결되지 않았어요',
  )
})
