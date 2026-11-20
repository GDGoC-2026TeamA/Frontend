import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const capture = async (page, name) =>
  page.screenshot({
    path: `docs/screenshots/phase4-${name}.png`,
    fullPage: true,
  })
async function inventoryEdit(page, quantity = '18') {
  await page.getByRole('button', { name: '초안 수정', exact: true }).click()
  await page.getByLabel('실제 입고 수량', { exact: true }).fill(quantity)
  await page.getByLabel('차이 사유', { exact: true }).fill('2개 미입고')
  await page
    .getByRole('checkbox', {
      name: '실제로 입고된 수량을 확인했어요',
      exact: true,
    })
    .check()
  await page
    .getByRole('checkbox', { name: '수량 차이 사유를 기록했어요', exact: true })
    .check()
}
test('registered tasks open details before job input and owned metadata edits stay local', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1240 })
  await page.goto('/tasks')
  await expect(page.locator('.work-tile')).toHaveCount(2)
  await capture(page, 'tasks')
  await page
    .getByRole('button', { name: '재고 입고 기록', exact: true })
    .click()
  await expect(page).toHaveURL(/\/tasks\/1$/)
  await expect(page.getByLabel('업무 이름', { exact: true })).not.toBeEditable()
  await expect(
    page.getByText('공유받은 기준은 읽기 전용이에요.', { exact: false }),
  ).toBeVisible()
  await page.getByRole('link', { name: '업무 목록으로', exact: true }).click()
  await page.getByRole('button', { name: '예약 접수', exact: true }).click()
  await capture(page, 'task-detail')
  await page.getByLabel('업무 이름', { exact: true }).fill('예약 접수 수정')
  await page.getByRole('button', { name: '취소', exact: true }).click()
  await expect(page.getByLabel('업무 이름', { exact: true })).toHaveValue(
    '예약 접수',
  )
  await page.getByLabel('업무 이름', { exact: true }).fill('예약 접수 수정')
  await page
    .getByRole('button', { name: '변경 사항 저장', exact: true })
    .click()
  await page.getByRole('link', { name: '업무 목록으로', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '예약 접수 수정', exact: true }),
  ).toBeVisible()
})
test('inventory correction persists through result history and a personal procedure card', async ({
  page,
}) => {
  const writes = []
  page.on('request', (req) => {
    if (['POST', 'PATCH', 'DELETE'].includes(req.method()))
      writes.push(req.url())
  })
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/work/input')
  await page.getByLabel('작업 이름', { exact: true }).fill('검증 입고 작업')
  await page
    .getByRole('button', { name: '예시 전표로 확인', exact: true })
    .click()
  await capture(page, 'input')
  await page.getByRole('button', { name: '초안 만들기', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '초안 검토', exact: true }),
  ).toBeVisible()
  await capture(page, 'review')
  await inventoryEdit(page)
  await capture(page, 'edit')
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
  await capture(page, 'revised')
  await page
    .getByRole('button', { name: '작업 결과 저장', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: '작업 결과', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('main')).toContainText('18')
  await expect(page.getByRole('main')).toContainText('2개 미입고')
  await capture(page, 'result')
  await page
    .getByRole('button', { name: '절차를 카드로 저장', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: '카드 저장됨', exact: true }),
  ).toBeDisabled()
  await page
    .getByRole('link', { name: '저장한 카드 보기', exact: true })
    .click()
  await expect(page.locator('.workflow-steps li')).toHaveCount(4)
  await capture(page, 'card')
  await page.getByRole('link', { name: '작업 내역', exact: true }).click()
  const record = page
    .locator('.collection-records article')
    .filter({ hasText: '검증 입고 작업' })
  await expect(record).toContainText('결과 저장됨')
  await capture(page, 'history')
  await record.getByRole('link', { name: '결과 보기', exact: true }).click()
  await expect(page.getByRole('main')).toContainText('2개 미입고')
  expect(writes).toEqual([])
})
test('reservation preserves the requested time and requires availability confirmation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/work/input?taskId=2')
  await page.getByLabel('변경 시간', { exact: true }).fill('오후 4:30')
  await page
    .getByRole('button', { name: '예시 요청으로 확인', exact: true })
    .click()
  await capture(page, 'reservation-input')
  await page
    .getByRole('button', { name: '변경 내용 검토', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: '예약 변경 내용 검토', exact: true }),
  ).toBeVisible()
  await capture(page, 'reservation-review')
  await expect(page.getByRole('main')).not.toContainText('WB-102')
  await page.getByRole('button', { name: '초안 수정', exact: true }).click()
  await page
    .getByRole('checkbox', { name: '변경 시간을 확인했어요', exact: true })
    .check()
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText('예약 가능 여부')
  await page
    .getByRole('checkbox', {
      name: '변경 시간에 예약할 수 있는지 확인했어요',
      exact: true,
    })
    .check()
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
  await page
    .getByRole('button', { name: '변경 내용 저장', exact: true })
    .click()
  await expect(page.getByRole('main')).toContainText('오후 4:30')
  await capture(page, 'reservation-result')
})
test('cancelled draft edits are discarded while confirmed edits resume from history', async ({
  page,
}) => {
  await page.goto('/jobs/61')
  await inventoryEdit(page, '17')
  await page.getByRole('button', { name: '취소', exact: true }).click()
  await expect(page.getByRole('main')).not.toContainText('2개 미입고')
  await inventoryEdit(page)
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
  await page.getByRole('link', { name: '작업 내역', exact: true }).click()
  await page
    .locator('.collection-records article')
    .filter({ hasText: '11월 20일 입고 내역' })
    .getByRole('link', { name: '검토 이어하기', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: '수정한 초안 확인', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('main')).toContainText('2개 미입고')
})
test('card edits and searches use the actual collection and missing records do not borrow fixtures', async ({
  page,
}) => {
  await page.goto('/work-cards/52')
  await expect(page.locator('.workflow-steps li')).toHaveCount(5)
  await expect(page.getByRole('main')).not.toContainText('WB-102')
  await page
    .getByLabel('카드 이름', { exact: true })
    .fill('시간 변경 확인 순서')
  await page
    .getByRole('button', { name: '카드 이름 저장', exact: true })
    .click()
  await page.getByRole('link', { name: '카드 목록 보기', exact: true }).click()
  await page.getByLabel('카드 검색', { exact: true }).fill('시간 변경')
  await expect(page.locator('.collection-records article')).toHaveCount(1)
  await capture(page, 'cards')
  await page.getByLabel('카드 검색', { exact: true }).fill('없는 카드')
  await expect(
    page.getByRole('heading', { name: '검색 결과가 없어요', exact: true }),
  ).toBeVisible()
  await page.goto('/jobs/missing')
  await expect(
    page.getByRole('heading', {
      name: '업무나 작업을 불러오지 못했어요',
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByText('WB-102', { exact: true })).toHaveCount(0)
})
test('workflow and detail layouts fit narrow widths and keep accessible controls', async ({
  page,
}) => {
  await page.goto('/jobs/61')
  await expect(
    page.getByRole('heading', { name: '초안 검토', exact: true }),
  ).toBeVisible()
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1080 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.setViewportSize({ width: 390, height: 844 })
  await capture(page, 'mobile')
  await page.goto('/tasks/2')
  await expect(page.getByLabel('업무 이름', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([])
})
