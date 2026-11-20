import { test, expect } from './workspace-fixture'

test('a saved private card is visible to its owner and absent after switching accounts', async ({
  page,
}) => {
  await page.goto('/work-cards/52')
  const title = '첫 계정 전용 예약 확인 카드'
  await page.getByLabel('카드 이름', { exact: true }).fill(title)
  await page.getByRole('button', { name: '카드 이름 저장' }).click()
  await page.getByRole('link', { name: '카드 목록 보기' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  const sidebar = page.locator('.sidebar')
  await sidebar.getByRole('button', { name: '개인 작업 공간' }).click()
  await sidebar.getByRole('button', { name: '로그아웃' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '로그아웃', exact: true })
    .click()
  await expect(page).toHaveURL('/login')
  await page.getByLabel('이메일', { exact: false }).fill('second@example.com')
  await page
    .getByLabel('비밀번호 (필수)', { exact: true })
    .fill('example-password')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '첫 업무를 등록해 보세요' }),
  ).toBeVisible()
  await sidebar.getByRole('link', { name: '개인 업무 카드' }).click()
  await expect(
    page.getByRole('heading', { name: '저장한 업무 카드가 없어요' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: title })).toHaveCount(0)
})

test('registration keeps selected documents in their roles and blocks unsupported analysis', async ({
  page,
}) => {
  await page.goto('/work/new')
  const dialog = page.getByRole('dialog', { name: '새 업무 등록' })
  const analyze = dialog.getByRole('button', { name: '자료 분석하기' })
  await dialog.getByLabel('업무 이름').fill('자료 구분 점검')
  await expect(analyze).toBeDisabled()
  await dialog.getByLabel('기존 업무 자료', { exact: true }).setInputFiles([
    {
      name: 'stock.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('item,count\nA,5'),
    },
    {
      name: 'stock-notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Review count'),
    },
  ])
  await expect(analyze).toBeDisabled()
  await dialog.getByLabel('새 시스템 매뉴얼', { exact: true }).setInputFiles({
    name: 'manual.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Confirm count'),
  })
  for (const filename of ['stock.csv', 'stock-notes.txt', 'manual.txt'])
    await expect(dialog.getByText(filename, { exact: true })).toBeVisible()
  await analyze.click()
  await expect(dialog.getByRole('alert')).toContainText(
    '문서 분석은 아직 연결되지 않았어요',
  )
})

test('a learning session can reopen an earlier question and its answer', async ({
  page,
}) => {
  await page.goto('/learn/inventory')
  await page.getByRole('button', { name: '재고 업무 질문하기' }).click()
  const panel = page.getByRole('complementary', { name: '학습 노트와 AI 질문' })
  const input = panel.getByLabel('질문', { exact: true })
  const ask = panel.getByRole('button', { name: '질문하기', exact: true })
  const question = '전표와 실제 수량이 다르면?'
  await input.fill(question)
  await ask.click()
  await expect(panel.getByRole('article', { name: 'AI 답변' })).toContainText(
    '실제 입고 수량을 입력해요',
  )
  await input.fill('승인 담당자는 누구인가요?')
  await ask.click()
  await expect(panel.getByRole('article', { name: 'AI 답변' })).toContainText(
    '답할 수 없어요',
  )
  await panel.getByText('이전 질문 1개', { exact: true }).click()
  const earlier = panel
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: question, exact: true }) })
  await expect(earlier).toContainText('실제 입고 수량을 입력해요')
})

test('opening work from task detail keeps unconfirmed inventory out of saved results', async ({
  page,
}) => {
  await page.goto('/tasks/1')
  await page.getByRole('button', { name: '업무 처리하기' }).click()
  await expect(page).toHaveURL('/work/input')
  await page.getByLabel('작업 이름', { exact: true }).fill('미확인 수량 검토')
  await page.getByRole('button', { name: '예시 전표로 확인' }).click()
  await page.getByRole('button', { name: '초안 만들기' }).click()
  await page.getByRole('button', { name: '초안 수정' }).click()
  await page.getByRole('button', { name: '수정 내용 확인' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '작업 결과 저장' }),
  ).toHaveCount(0)
  await page.getByRole('link', { name: '작업 내역', exact: true }).click()
  const record = page
    .getByRole('article')
    .filter({ hasText: '미확인 수량 검토' })
  await expect(
    record.getByRole('link', { name: '검토 이어하기' }),
  ).toBeVisible()
  await expect(record.getByRole('link', { name: '결과 보기' })).toHaveCount(0)
})
