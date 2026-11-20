// Figma 112:1214. These passages and questions are explicit demo fixtures.
export const learningEvidence = {
  entry: {
    id: 'entry',
    source: '새 재고 시스템 매뉴얼.pdf',
    location: '2장 입고 등록',
    quote:
      '입고 메뉴에서 품목 코드로 품목을 찾습니다. 실제 입고 수량을 입력한 뒤 전표 수량과 대조합니다.',
  },
  exception: {
    id: 'exception',
    source: '새 재고 시스템 매뉴얼.pdf',
    location: '3장 수량 불일치 처리',
    quote:
      '전표 수량과 실제 입고 수량이 다르면 실제 확인한 수량을 입력합니다. 차이가 난 이유를 기록한 뒤 입고 내역을 저장합니다.',
  },
}

export const learningTopics = [
  {
    id: 'exception',
    title: '수량이 다를 때 처리하기',
    reason: '새 매뉴얼에 수량 차이 기록 단계가 추가됐어요.',
    evidenceId: 'exception',
    questionIds: ['exception'],
  },
  {
    id: 'entry',
    title: '품목 검색, 처리 순서와 입력 항목',
    evidenceId: 'entry',
    questionIds: ['order', 'fields'],
  },
]

export const learningQuestions = [
  {
    id: 'order',
    title: '처리 순서 고르기',
    question: '입고 등록은 어떤 순서로 하나요?',
    type: 'radio',
    topicId: 'entry',
    evidenceId: 'entry',
    situation: '오전 입고분을 시스템에 등록하려고 해요.',
    focus: '품목을 찾은 다음 수량을 입력하고 대조하는 순서를 확인해요.',
    options: [
      {
        id: 'find-first',
        label: '품목 코드 검색 → 실제 수량 입력 → 전표와 대조',
      },
      {
        id: 'quantity-first',
        label: '실제 수량 입력 → 전표와 대조 → 품목 코드 검색',
      },
      {
        id: 'compare-first',
        label: '전표와 대조 → 품목 코드 검색 → 실제 수량 입력',
      },
    ],
    correct: ['find-first'],
    explanation: '품목 검색 → 실제 수량 입력 → 전표와 대조 순서로 처리해요.',
  },
  {
    id: 'fields',
    title: '입력 항목 확인하기',
    question: '새 시스템에 등록할 항목을 모두 골라 주세요.',
    type: 'checkbox',
    topicId: 'entry',
    evidenceId: 'entry',
    situation: '전표에는 품목 코드 WB-102, 수량 20개가 적혀 있어요.',
    focus: '매뉴얼에서 새 시스템에 입력해야 하는 항목을 확인해요.',
    options: [
      { id: 'code', label: '품목 코드 WB-102' },
      { id: 'quantity', label: '실제로 입고된 수량' },
      { id: 'writer', label: '전표를 작성한 사람의 이름' },
    ],
    correct: ['code', 'quantity'],
    explanation: '품목 코드와 실제 입고 수량을 입력해요.',
  },
  {
    id: 'exception',
    title: '예외 상황 판단하기',
    question: '수량이 다를 때 어떻게 처리할까요?',
    type: 'radio',
    topicId: 'exception',
    evidenceId: 'exception',
    situation: '전표에는 20개, 실제 입고 수량은 18개예요.',
    focus: '전표 수량과 실제 수량이 다를 때의 처리 기준을 확인해요.',
    options: [
      { id: 'document', label: '전표에 적힌 20개로 저장해요.' },
      { id: 'actual', label: '실제 18개를 입력하고 차이 사유를 남겨요.' },
      { id: 'blank', label: '수량을 비워 둔 채 등록을 마쳐요.' },
    ],
    correct: ['actual'],
    explanation: '실제 수량을 입력하고 수량이 다른 이유를 기록해요.',
  },
]

export const unconfirmedLearningNotice =
  '수량 차이 승인 담당자와 별도 승인 절차는 이 예시 매뉴얼에 적혀 있지 않아요.'
