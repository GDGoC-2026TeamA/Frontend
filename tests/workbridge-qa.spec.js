// 파일명: tests/workbridge-qa.spec.js
// 실행 명령어 (프론트엔드 개발자용): npx playwright test

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('WORK BRIDGE 프론트엔드 전수 검증 QA (1~22번)', () => {

  // 1. 계정 로그인 · 데이터 격리 · 이전 대화 내역 유지 (QA 15~16번)
  test('[QA 15-16] 로그인, 계정별 데이터 격리 및 이전 대화 내역 유지', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'test1@workbridge.kr');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);

    // 새로고침 후 이전 AI 대화 내역 유지 확인
    await page.reload();
    await expect(page.locator('[data-testid="chat-history-list"]')).toBeVisible();

    // 로그아웃 후 계정 2 로그인 -> 계정 1의 개인 업무 카드 미노출 확인
    await page.click('[data-testid="logout-btn"]');
    await page.fill('input[name="email"]', 'test2@workbridge.kr');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');

    await page.click('[data-testid="saved-cards-tab"]');
    await expect(page.locator('text=스텐 텀블러(A-101)')).toHaveCount(0);
  });

  // 2. 홈 분기 · 기준 자료 다중 등록 · 타입별 묶음 · 충돌/누락 감지 (QA 1~4, 14, 17번)
  test('[QA 1-4, 14, 17] 기준 자료 업로드, 타입별 묶음 및 충돌·누락 미확인 감지', async ({ page }) => {
    await page.goto(`${BASE_URL}/home`);

    // 재고 기록 선택 후 홈 모드 분기 확인
    await page.click('text=재고 기록');
    await expect(page.locator('button:has-text("새 방식 익히기")')).toBeVisible();
    await expect(page.locator('button:has-text("업무 처리하기")')).toBeVisible();

    await page.click('button:has-text("새 방식 익히기")');

    // 필수 자료 미첨부 시 코드 검사 차단 확인 (QA 14번)
    await page.click('button:has-text("분석 시작")');
    await expect(page.locator('text=필수 자료를 등록해 주세요')).toBeVisible();

    // PDF + PNG 다중 파일 업로드 및 타입별 묶음 확인 (QA 2, 17번)
    const fileInput = page.locator('input[type="file"][data-testid="reference-files"]');
    await fileInput.setInputFiles([
      'samples/1_기준_기존재고기록.pdf',
      'samples/2_기준_신규ERP재고기록.pdf',
      'samples/2_기준_신규ERP화면.png',
    ]);

    await expect(page.locator('[data-testid="file-group-pdf"]')).toContainText('2개');
    await expect(page.locator('[data-testid="file-group-image"]')).toContainText('1개');

    // 분석 실행 후 기준 충돌(10개 vs 5개) 및 누락(유통기한) 미확인 감지 (QA 3번)
    await page.click('button:has-text("분석 시작")');
    const unconfirmedSection = page.locator('[data-testid="unconfirmed-items"]');
    await expect(unconfirmedSection).toContainText('미확인');
    await expect(unconfirmedSection).toContainText('안전재고');
    await expect(unconfirmedSection).toContainText('유통기한');

    // 담당자 분석 수정 및 보충 저장 (QA 4번)
    await page.fill('[data-testid="supplement-input-0"]', '유통기한 3일 이내 상품은 폐기보류로 별도 등록');
    await page.click('button:has-text("기준 보충 저장")');
    await expect(page.locator('text=저장되었습니다')).toBeVisible();
  });

  // 3. 새 방식 익히기: 분리 조회 · 추천 · 동적 출제 · 피드백 · 업무 카드 (QA 5~7, 18~22번)
  test('[QA 5-7, 18-22] 학습 분리 조회, 먼저 익힐 내용 추천, 확정 절차 기반 출제', async ({ page }) => {
    await page.goto(`${BASE_URL}/learn/inventory`);

    // 확정된 절차 vs 미확인 항목 분리 표시 확인 (QA 19번)
    await expect(page.locator('[data-testid="confirmed-procedures"]')).toBeVisible();
    await expect(page.locator('[data-testid="unconfirmed-procedures"]')).toBeVisible();

    // 먼저 익힐 내용 추천 항목, 추천 이유, 자료 근거 표시 및 선택 (QA 20번)
    const recommendCard = page.locator('[data-testid="recommended-topic"]').first();
    await expect(recommendCard).toContainText('추천 이유');
    await expect(recommendCard).toContainText('근거');
    await recommendCard.click();

    // 미확인 항목(안전재고 5개 충돌·유통기한) 문제 출제 제외 확인 (QA 21번)
    const quizQuestion = page.locator('[data-testid="quiz-question"]');
    await expect(quizQuestion).not.toContainText('안전재고 5개');

    // 오답 선택 시 매뉴얼 근거 기반 피드백 출력 확인 (QA 5, 18번)
    await page.click('[data-testid="quiz-option-wrong"]');
    await page.click('button:has-text("정답 확인")');
    await expect(page.locator('[data-testid="quiz-feedback"]')).toContainText('근거');

    // 개인 업무 카드 저장 및 보관함 재조회 확인 (QA 7번)
    await page.click('button:has-text("개인 업무 카드로 저장")');
    await page.goto(`${BASE_URL}/storage`);
    await page.click('button:has-text("개인 업무 카드")');
    await expect(page.locator('[data-testid="card-list"]')).toContainText('재고 기록');
  });

  // 4. 업무 처리하기: 작업 자료 입력 · AI 초안 수정 · 결과 저장/다운로드 (QA 8~14번)
  test('[QA 8-14] 오늘 작업 자료 초안 생성, 미확인 수정, 결과 저장 및 범위 준수', async ({ page }) => {
    await page.goto(`${BASE_URL}/process/inventory`);

    // 오늘 처리할 작업 자료(TXT) 업로드 (QA 8번)
    const workFileInput = page.locator('input[type="file"][data-testid="work-file"]');
    await workFileInput.setInputFiles('samples/3_작업자료_오늘재고내역.txt');
    await page.click('button:has-text("AI 초안 생성")');

    // 6개 컬럼 양식 및 미확인 분류 확인 (QA 9~10번)
    const draftTable = page.locator('[data-testid="ai-draft-table"]');
    for (const col of ['처리구분', '품목코드', '품목명', '수량', '처리상태', '근거/비고']) {
      await expect(draftTable).toContainText(col);
    }
    await expect(draftTable.locator('tr:has-text("C-301")')).toContainText('미확인(담당자검토)');
    await expect(draftTable.locator('tr:has-text("D-401")')).toContainText('미확인(담당자검토)');

    // 초안 직접 수정 (QA 11번)
    const statusCell = draftTable.locator('tr:has-text("D-401") [data-testid="edit-status"]');
    await statusCell.fill('폐기보류');

    // 외부 시스템 자동 실행 버튼 제외 범위 준수 확인 (QA 14번)
    await expect(page.locator('button:has-text("ERP 자동 등록")')).toHaveCount(0);
    await expect(page.locator('button:has-text("예약 자동 확정")')).toHaveCount(0);

    // 작업 결과 저장 및 내려받기(다운로드) 확인 (QA 12~13번)
    await page.click('button:has-text("작업 결과 저장")');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("내려받기")'),
    ]);
    expect(download.suggestedFilename()).toBeTruthy();

    await page.goto(`${BASE_URL}/storage`);
    await page.click('button:has-text("작업 결과")');
    await expect(page.locator('[data-testid="work-result-list"]')).toContainText('폐기보류');
  });
});
