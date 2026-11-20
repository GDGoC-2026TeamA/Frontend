import { test, expect } from './workspace-fixture'
import AxeBuilder from '@axe-core/playwright'

async function revisedExample(
  page,
  { personal = false, text = '실제 수량과 차이 사유를 함께 기록해요.' } = {},
) {
  await page.goto('/work/new')
  if (personal)
    await page
      .getByRole('checkbox', { name: '개인 작업 공간에만 보관' })
      .check()
  await expect(
    page.getByRole('button', { name: '자료 분석하기', exact: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: '예시 자료 채우기' }).click()
  await page.getByRole('button', { name: '자료 분석하기', exact: true }).click()
  await page.getByRole('button', { name: '내용 수정', exact: true }).click()
  await page.getByLabel('확인한 절차', { exact: true }).fill(text)
  await page
    .getByLabel('추가로 확인할 내용', { exact: true })
    .fill('담당자 승인 기준은 무엇인가요?')
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
}

test('one-column home, four menu destinations, owner filters and local artwork match V0.4', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1240 })
  await page.goto('/')
  await expect(page.locator('.work-tile')).toHaveCount(2)
  await expect(
    page.getByRole('heading', { name: '홈', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.home-workspace')).toHaveCSS(
    'grid-template-columns',
    '208px 1160px',
  )
  const [quick, registered] = await Promise.all([
    page.locator('.home-overview').boundingBox(),
    page.locator('#home-registered').boundingBox(),
  ])
  expect(quick.y + quick.height).toBeLessThanOrEqual(registered.y)
  await expect(
    page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link'),
  ).toHaveCount(4)
  await page.screenshot({
    path: 'docs/screenshots/phase2-v04-home.png',
    fullPage: true,
  })
  await page
    .getByRole('button', { name: '내가 등록한 업무', exact: true })
    .click()
  await expect(page.locator('.work-tile')).toHaveCount(1)
  await expect(page.locator('.work-tile')).toContainText('예약 접수')
  await page.getByRole('button', { name: '공유받은 업무', exact: true }).click()
  await expect(page.locator('.work-tile')).toHaveCount(1)
  await expect(page.locator('.work-tile')).toContainText('재고 입고 기록')
  await page.getByRole('link', { name: '업무 목록', exact: true }).click()
  await expect(page).toHaveURL(/\/tasks$/)
  await expect(
    page.getByRole('heading', { name: '업무 목록', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.home-overview')).toHaveCount(0)
})

test('recipient baseline is read-only and retains outstanding questions and references', async ({
  page,
}) => {
  await page.goto('/')
  const more = page.getByRole('button', { name: '재고 입고 기록 더 보기' })
  await more.click()
  await page
    .getByRole('button', { name: '업무 정보 보기', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: '공유 업무 확인' })
  await expect(dialog).toContainText('김민수')
  await expect(dialog).toContainText('기준 v1 / 읽기 전용')
  await expect(
    dialog.getByRole('button', { name: '내용 수정', exact: true }),
  ).toHaveCount(0)
  await expect(dialog.getByRole('textbox')).toHaveCount(0)
  await expect(dialog).toContainText('승인 담당자는 자료에 적혀 있지 않아요')
  await expect(dialog).toContainText('새 재고 시스템 매뉴얼.pdf')
  await page.screenshot({
    path: 'docs/screenshots/phase2-v04-shared.png',
    fullPage: true,
  })
  await page.keyboard.press('Escape')
  await expect(more).toBeFocused()
})

test('private task saves only in the demo tab, reopens edited text and never offers publication', async ({
  page,
}) => {
  const writes = []
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()))
      writes.push(request.url())
  })
  await revisedExample(page, { personal: true })
  await expect(
    page.getByRole('button', { name: '검토 후 공유하기' }),
  ).toHaveCount(0)
  await page.screenshot({
    path: 'docs/screenshots/phase2-v04-personal.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: '개인 업무 저장하기' }).click()
  await expect(page).toHaveURL('/')
  await page
    .getByRole('button', { name: '내가 등록한 업무', exact: true })
    .click()
  await page.getByRole('button', { name: '재고 입고 기록 더 보기' }).click()
  await page
    .getByRole('button', { name: '자료 교체와 비교 내용 재검토', exact: true })
    .click()
  await expect(
    page.getByRole('dialog', { name: '새 업무 등록' }),
  ).toContainText('실제 수량과 차이 사유를 함께 기록해요.')
  await expect(
    page.getByRole('dialog', { name: '새 업무 등록' }),
  ).toContainText('현장 확인 필요 1개')
  await page.keyboard.press('Escape')
  await page.reload()
  await expect(page.locator('.work-tile')).toHaveCount(2)
  expect(writes).toEqual([])
})

test('publication confirmation preserves pending checks and v1 remains available until v2 is shared', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1240 })
  await revisedExample(page, { text: '첫 기준에서는 실제 수량을 기록해요.' })
  await page
    .getByRole('button', { name: '검토 후 공유하기', exact: true })
    .click()
  const confirm = page.getByRole('dialog', {
    name: '검토 후 공유하기',
    exact: true,
  })
  await expect(confirm).toContainText(
    '확인 필요 상태로 공유되고 연습 정답에서 제외돼요.',
  )
  await page.screenshot({
    path: 'docs/screenshots/phase2-v04-publish-confirm.png',
    fullPage: true,
  })
  await confirm.getByRole('button', { name: '검토로 돌아가기' }).click()
  await expect(page.getByRole('dialog', { name: '새 업무 등록' })).toBeVisible()
  await page
    .getByRole('button', { name: '검토 후 공유하기', exact: true })
    .click()
  await page
    .getByRole('dialog', { name: '검토 후 공유하기', exact: true })
    .getByRole('button', { name: '검토한 내용 공유' })
    .click()
  await expect(
    page.getByRole('dialog', { name: '새 업무 등록' }),
  ).toContainText('기준 v1을 공유했어요')
  await page
    .getByRole('button', { name: '내용 다시 수정', exact: true })
    .click()
  await page
    .getByLabel('확인한 절차', { exact: true })
    .fill('수정본에서는 실제 수량과 차이 사유를 함께 기록해요.')
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
  await expect(
    page.getByRole('dialog', { name: '새 업무 등록' }),
  ).toContainText('공개본 v1 / 검토 중 v2')
  await page.screenshot({
    path: 'docs/screenshots/phase2-v04-revision.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: '공개본 보기', exact: true }).click()
  const recipient = page.getByRole('dialog', { name: '공유 업무 확인' })
  await expect(recipient).toContainText('기준 v1 / 읽기 전용')
  await expect(recipient).toContainText('첫 기준에서는 실제 수량을 기록해요.')
  await expect(recipient).not.toContainText('수정본에서는 실제 수량')
  await page.keyboard.press('Escape')
  await page
    .getByRole('button', { name: '내가 등록한 업무', exact: true })
    .click()
  await page.getByRole('button', { name: '재고 입고 기록 더 보기' }).click()
  await page
    .getByRole('button', { name: '자료 교체와 비교 내용 재검토', exact: true })
    .click()
  await expect(page.getByLabel('확인한 절차', { exact: true })).toHaveValue(
    '수정본에서는 실제 수량과 차이 사유를 함께 기록해요.',
  )
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
  await page
    .getByRole('button', { name: '수정본 공유하기', exact: true })
    .click()
  await page
    .getByRole('dialog', { name: '수정본 공유하기', exact: true })
    .getByRole('button', { name: '검토한 내용 공유' })
    .click()
  await expect(
    page.getByRole('dialog', { name: '새 업무 등록' }),
  ).toContainText('기준 v2을 공유했어요')
  await page
    .getByRole('button', { name: '공유받은 업무 보기', exact: true })
    .click()
  await expect(
    page.getByRole('dialog', { name: '공유 업무 확인' }),
  ).toContainText('기준 v2 / 읽기 전용')
  await expect(
    page.getByRole('dialog', { name: '공유 업무 확인' }),
  ).toContainText('수정본에서는 실제 수량')
  await page.screenshot({
    path: 'docs/screenshots/phase2-v04-published-v2.png',
    fullPage: true,
  })
})

test('updated home and registration fit narrow screens and remain accessible', async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    await expect(page.locator('.work-tile')).toHaveCount(2)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: 'docs/screenshots/phase2-v04-mobile.png',
    fullPage: true,
  })
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await revisedExample(page)
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page
    .getByRole('button', { name: '검토 후 공유하기', exact: true })
    .click()
  const confirm = page.getByRole('dialog', {
    name: '검토 후 공유하기',
    exact: true,
  })
  expect(
    await confirm.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true)
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: '검토 후 공유하기', exact: true }),
  ).toBeFocused()
})
