export const workScenarios = {
  inventory: {
    title: '재고 입고 기록',
    name: '11월 20일 입고 내역',
    file: '11월 20일 입고 전표.pdf',
    manual: '새 재고 시스템 매뉴얼.pdf',
    location: '3장 수량 불일치 처리',
    quote: '전표와 수량이 다르면 실제 수량을 기록하고 차이 사유를 남겨요.',
    cardTitle: '입고 내역 확인 절차',
    steps: [
      '전표에 적힌 품목 코드로 입고할 품목을 찾아요.',
      '전표 수량과 실제 입고 수량을 대조해요.',
      '차이가 나면 실제 수량을 입력해요.',
      '차이 사유를 기록하고 입고 내역을 저장해요.',
    ],
    fields: [
      { key: 'itemCode', label: '품목 코드', value: 'WB-102', readonly: true },
      {
        key: 'documentQuantity',
        label: '전표 수량',
        value: 20,
        readonly: true,
      },
      { key: 'quantity', label: '실제 입고 수량', value: 20, checked: false },
      { key: 'reason', label: '차이 사유', value: '', checked: false },
    ],
  },
  reservation: {
    title: '예약 접수',
    name: '예약 변경 요청 정리',
    file: '예약 변경 요청.txt',
    manual: '예약 시스템 매뉴얼.pdf',
    location: '예약 조회와 변경 절차',
    quote:
      '바꿀 시간에 예약할 수 있는지 확인한 뒤 변경 사항을 저장하고 고객에게 안내해요.',
    cardTitle: '예약 변경 처리 절차',
    steps: [
      '예약 번호로 기존 예약을 찾아요.',
      '고객이 요청한 날짜, 시간, 인원을 확인해요.',
      '바꿀 시간에 예약할 수 있는지 확인해요.',
      '가능한 시간과 인원을 확인한 뒤 변경 사항을 저장해요.',
      '고객에게 변경한 날짜와 시간을 안내해요.',
    ],
    fields: [
      {
        key: 'reservationNumber',
        label: '예약 번호',
        value: 'RS-204',
        readonly: true,
      },
      {
        key: 'oldTime',
        label: '기존 시간',
        value: '오후 2:00',
        readonly: true,
      },
      {
        key: 'newTime',
        label: '변경 시간',
        value: '오후 3:00',
        checked: false,
      },
    ],
  },
}

export function scenarioForTask(task) {
  if (!task) return null
  if (task.artwork === 'reservation' || String(task.id) === '2')
    return 'reservation'
  if (
    task.artwork === 'inventory' ||
    String(task.id) === '1' ||
    task.comparison?.materials?.some(
      (item) => item.name === '새 재고 시스템 매뉴얼.pdf',
    )
  )
    return 'inventory'
  return null
}

export function validateWorkFields(fields, scenario, availability = false) {
  const errors = []
  for (const field of fields) {
    if (field.readonly) continue
    if (String(field.value ?? '').trim() === '')
      errors.push(`${field.label || field.key}을 입력해 주세요.`)
    if (
      field.key === 'quantity' &&
      (!Number.isInteger(Number(field.value)) || Number(field.value) < 0)
    )
      errors.push('실제 입고 수량은 0 이상의 정수로 입력해 주세요.')
    if (!field.checked)
      errors.push(`${field.label || field.key}을 확인해 주세요.`)
  }
  if (scenario === 'reservation' && !availability)
    errors.push('변경 시간의 예약 가능 여부를 확인해 주세요.')
  return errors
}
