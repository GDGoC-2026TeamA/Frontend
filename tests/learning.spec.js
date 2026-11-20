import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function chooseBoth(page) {
  await page.getByRole('button', { name: '직접 선택하기', exact: true }).click()
  await page
    .getByRole('checkbox', {
      name: '품목 검색, 처리 순서와 입력 항목',
      exact: true,
    })
    .check()
  await page
    .getByRole('checkbox', { name: '수량이 다를 때 처리하기', exact: true })
    .check()
  await page.getByRole('button', { name: '선택한 항목 2개 연습하기' }).click()
}
async function correctOrder(page) {
  await page
    .getByRole('radio', {
      name: '품목 코드 검색 → 실제 수량 입력 → 전표와 대조',
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: '다음 문제', exact: true }).click()
}
async function correctFields(page, extra = false) {
  await page
    .getByRole('checkbox', { name: '품목 코드 WB-102', exact: true })
    .check()
  await page
    .getByRole('checkbox', { name: '실제로 입고된 수량', exact: true })
    .check()
  if (extra)
    await page
      .getByRole('checkbox', { name: '전표를 작성한 사람의 이름', exact: true })
      .check()
  await page.getByRole('button', { name: '다음 문제', exact: true }).click()
}

test('home opens the selected baseline; topic selection controls questions and back preserves answers', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .locator('.work-tile')
    .filter({ hasText: '재고 입고 기록' })
    .getByRole('button', { name: '새 방식 익히기' })
    .click()
  await expect(page).toHaveURL(/\/learn\/1$/)
  await expect(
    page.getByRole('button', { name: '항목을 선택해 주세요' }),
  ).toBeDisabled()
  await page.screenshot({
    path: 'docs/screenshots/phase3-select.png',
    fullPage: true,
  })
  await page
    .getByRole('checkbox', { name: '이 항목을 연습할게요', exact: true })
    .check()
  await page.getByRole('button', { name: '선택한 항목 1개 연습하기' }).click()
  await expect(
    page.getByRole('heading', { name: '예외 상황 판단하기', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '결과 확인' })).toBeDisabled()
  await page.getByRole('button', { name: '학습으로 돌아가기' }).click()
  await page
    .getByRole('checkbox', { name: '이 항목을 연습할게요', exact: true })
    .uncheck()
  await page
    .getByRole('checkbox', {
      name: '품목 검색, 처리 순서와 입력 항목',
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: '선택한 항목 1개 연습하기' }).click()
  const choice = page.getByRole('radio', {
    name: '실제 수량 입력 → 전표와 대조 → 품목 코드 검색',
    exact: true,
  })
  await choice.check()
  await page.getByRole('button', { name: '다음 문제', exact: true }).click()
  await page
    .getByRole('checkbox', { name: '품목 코드 WB-102', exact: true })
    .check()
  await page.getByRole('button', { name: '이전 문제', exact: true }).click()
  await expect(choice).toBeChecked()
  await page.getByRole('button', { name: '다음 문제', exact: true }).click()
  await expect(
    page.getByRole('checkbox', { name: '품목 코드 WB-102', exact: true }),
  ).toBeChecked()
})

test('results grade real answers, show evidence, reset retry and link to work without inventing approval', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/learn/inventory')
  await chooseBoth(page)
  await page.screenshot({
    path: 'docs/screenshots/phase3-order.png',
    fullPage: true,
  })
  await correctOrder(page)
  await page.screenshot({
    path: 'docs/screenshots/phase3-fields.png',
    fullPage: true,
  })
  await correctFields(page, true)
  await page
    .getByRole('radio', {
      name: '실제 18개를 입력하고 차이 사유를 남겨요.',
      exact: true,
    })
    .check()
  await page.screenshot({
    path: 'docs/screenshots/phase3-exception.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: '결과 확인', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '3문제 중 2문제 정답', exact: true }),
  ).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/phase3-result.png',
    fullPage: true,
  })
  await page
    .getByRole('main')
    .getByRole('button', { name: '매뉴얼 근거 보기', exact: true })
    .first()
    .click()
  const panel = page.getByRole('complementary', { name: '학습 노트와 AI 질문' })
  await expect(panel).toContainText(
    '입고 메뉴에서 품목 코드로 품목을 찾습니다.',
  )
  await expect(panel).toContainText('승인 담당자와 별도 승인 절차')
  await page.screenshot({
    path: 'docs/screenshots/phase3-result-evidence.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: '다시 연습하기', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '다음 문제', exact: true }),
  ).toBeDisabled()
  await expect(page.getByRole('radio').first()).not.toBeChecked()
  await correctOrder(page)
  await correctFields(page)
  await page
    .getByRole('radio', {
      name: '실제 18개를 입력하고 차이 사유를 남겨요.',
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: '결과 확인', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '3문제 중 3문제 정답', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: '업무 처리하기', exact: true }).click()
  await expect(page).toHaveURL(/\/work\/input$/)
})

test('demo AI cites matching evidence, keeps history and marks unsupported answers for review', async ({
  page,
}) => {
  const writes = []
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()))
      writes.push(request.url())
  })
  await page.setViewportSize({ width: 1440, height: 1080 })
  await page.goto('/learn/inventory')
  await page
    .getByRole('checkbox', {
      name: '품목 검색, 처리 순서와 입력 항목',
      exact: true,
    })
    .check()
  await page
    .getByRole('button', { name: '재고 업무 질문하기', exact: true })
    .click()
  const input = page.getByLabel('질문', { exact: true })
  await expect(input).toBeFocused()
  await input.fill('전표와 실제 수량이 다르면?')
  await page.getByRole('button', { name: '질문하기', exact: true }).click()
  const answer = page.getByRole('article', { name: 'AI 답변' })
  await expect(answer).toContainText('실제 입고 수량을 입력해요.')
  await expect(answer).toContainText('확인 필요')
  await page.screenshot({
    path: 'docs/screenshots/phase3-ai.png',
    fullPage: true,
  })
  await answer.getByRole('button', { name: '근거 보기', exact: true }).click()
  await expect(
    page.getByRole('complementary', { name: '학습 노트와 AI 질문' }),
  ).toContainText('차이가 난 이유를 기록한 뒤 입고 내역을 저장합니다.')
  await page.screenshot({
    path: 'docs/screenshots/phase3-ai-evidence.png',
    fullPage: true,
  })
  await page.getByRole('button', { name: '‹ AI 답변으로', exact: true }).click()
  await input.fill('승인 담당자는 누구인가요?')
  await page.getByRole('button', { name: '질문하기', exact: true }).click()
  await expect(answer).toContainText('답할 수 없어요')
  await expect(
    answer.getByRole('button', { name: '근거 보기', exact: true }),
  ).toHaveCount(0)
  await expect(page.getByText('이전 질문 1개', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '닫기', exact: true }).click()
  await expect(
    page.getByRole('checkbox', {
      name: '품목 검색, 처리 순서와 입력 항목',
      exact: true,
    }),
  ).toBeChecked()
  await page
    .getByRole('button', { name: '재고 업무 질문하기', exact: true })
    .click()
  await expect(answer).toContainText('답할 수 없어요')
  expect(writes).toEqual([])
})

test('personal learning uses its saved baseline and does not inherit another session conversation', async ({
  page,
}) => {
  await page.goto('/learn/inventory')
  await page
    .getByRole('button', { name: '재고 업무 질문하기', exact: true })
    .click()
  await page
    .getByLabel('질문', { exact: true })
    .fill('입고 시 무엇을 먼저 확인해?')
  await page.getByRole('button', { name: '질문하기', exact: true }).click()
  await expect(page.getByRole('article', { name: 'AI 답변' })).toBeVisible()
  await page.getByRole('link', { name: '‹ 홈', exact: true }).click()
  await page.getByRole('button', { name: '새 업무 등록', exact: true }).click()
  await page.getByRole('checkbox', { name: '개인 작업 공간에만 보관' }).check()
  await page
    .getByRole('button', { name: '예시 자료 채우기', exact: true })
    .click()
  await page.getByRole('button', { name: '자료 분석하기', exact: true }).click()
  await page.getByRole('button', { name: '내용 수정', exact: true }).click()
  await page
    .getByRole('button', { name: '수정 내용 확인', exact: true })
    .click()
  await page
    .getByRole('button', { name: '개인 업무 저장하기', exact: true })
    .click()
  await page
    .getByRole('button', { name: '내가 등록한 업무', exact: true })
    .click()
  await page
    .locator('.work-tile')
    .filter({ hasText: '재고 입고 기록' })
    .getByRole('button', { name: '새 방식 익히기' })
    .click()
  await expect(
    page.getByRole('region', { name: '학습 기준과 기록 범위' }),
  ).toContainText('개인 작업 공간 / 재고 입고 기록')
  await page.screenshot({
    path: 'docs/screenshots/phase3-personal.png',
    fullPage: true,
  })
  await page
    .getByRole('button', { name: '재고 업무 질문하기', exact: true })
    .click()
  await expect(page.getByRole('article', { name: 'AI 답변' })).toHaveCount(0)
  await expect(page.getByLabel('질문', { exact: true })).toHaveValue('')
})

test('manual fallback, missing baseline and responsive learning stay accessible', async ({
  page,
}) => {
  await page.goto('/learn/unknown')
  await expect(
    page.getByRole('heading', {
      name: '학습할 기준 자료가 없어요',
      exact: true,
    }),
  ).toBeVisible()
  await page.goto('/learn/inventory?recommendation=unavailable')
  await expect(
    page.getByText('추천을 불러오지 못했어요', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: '직접 선택하기', exact: true }).click()
  await expect(
    page.getByRole('heading', {
      name: '익힐 내용을 직접 선택하세요',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByText('미확인 / 수량 차이 승인 담당자. 연습 정답에서 제외돼요.', {
      exact: true,
    }),
  ).toBeVisible()
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1080 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }
  await expect(
    page.locator('.learning-layout .has-assistant > .main-content'),
  ).toHaveCSS('width', '852px')
  await expect(
    page.locator('.learning-layout .app-layout__assistant'),
  ).toHaveCSS('width', '308px')
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([])
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: 'docs/screenshots/phase3-mobile.png',
    fullPage: true,
  })
  await page
    .getByRole('checkbox', {
      name: '품목 검색, 처리 순서와 입력 항목',
      exact: true,
    })
    .check()
  await page
    .getByRole('button', { name: '선택한 항목 1개 연습하기', exact: true })
    .click()
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([])
})
