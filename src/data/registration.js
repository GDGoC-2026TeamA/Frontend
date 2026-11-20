// Display fixtures from Figma 112:553. Never derived from user files.
export const registrationExample = {
  name: '재고 입고 기록',
  description: '입고 품목과 수량을 시스템에 등록해요.',
  materials: [
    {
      name: '기존 입고 양식.xlsx',
      kind: '기존 업무 자료',
      detail: '입고 항목과 기록 방법',
    },
    {
      name: '새 재고 시스템 매뉴얼.pdf',
      kind: '새 시스템 매뉴얼',
      detail: '입고 등록과 수량 불일치 처리',
    },
  ],
  rows: [
    {
      title: '01 / 품목 확인',
      before: '양식에 품목명을 직접 적어요.',
      after: '시스템에서 품목 코드로 검색해 선택해요.',
    },
    {
      title: '02 / 입고 수량 기록',
      before: '전표의 수량을 양식에 옮겨 적어요.',
      after: '실제 입고 수량을 입력하고 전표와 대조해요.',
    },
  ],
  procedure: '실제 입고 수량을 입력하고 차이 사유를 기록해요.',
  question: '수량 차이가 나면 누가 승인하나요?',
}
