// Figma 97:533 display fixtures, separate from any uploaded or server data.
export const homeExample = {
  tasks: [
    {
      id: 1,
      name: '재고 입고 기록',
      category: '재고 관리',
      artwork: 'inventory',
      description: '입고 자료를 정리하고 새 시스템에 맞게 확인해요.',
      learningStatus: '학습 완료',
    },
    {
      id: 2,
      name: '예약 접수',
      category: '예약 접수',
      artwork: 'reservation',
      description: '예약 정보를 확인하고 변경 요청을 처리해요.',
      learningStatus: '학습 중',
    },
  ],
  resumeJobs: [
    {
      id: 61,
      taskId: 1,
      name: '11월 20일 입고 내역',
      status: '검토 중',
      pendingCount: 2,
    },
  ],
  recentJobs: [
    {
      id: 61,
      taskId: 1,
      name: '11월 20일 입고 내역',
      category: '재고 관리',
      status: '검토 중',
      displayDate: '오늘 14:20',
    },
    {
      id: 62,
      taskId: 2,
      name: '예약 변경 요청 정리',
      category: '예약 접수',
      status: '결과 저장됨',
      displayDate: '오늘 10:05',
    },
  ],
  recentCards: [
    {
      id: 51,
      taskId: 1,
      title: '입고 내역 확인 절차',
      category: '재고 관리',
      stepCount: 4,
    },
    {
      id: 52,
      taskId: 2,
      title: '예약 변경 처리 절차',
      category: '예약 접수',
      stepCount: 5,
    },
  ],
}
