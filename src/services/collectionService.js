import { apiRequest } from './api/client'

export async function getCollection(
  kind,
  { signal, mode = import.meta.env.VITE_DATA_MODE || 'demo' } = {},
) {
  if (!['cards', 'jobs'].includes(kind))
    throw new Error('목록 종류를 확인해 주세요.')
  if (mode === 'demo') return { items: [], source: 'demo' }
  if (mode !== 'api') throw new Error('지원하지 않는 데이터 모드예요.')
  const result = await apiRequest(kind, { signal })
  if (!Array.isArray(result?.items))
    throw new Error('서버 응답 형식을 확인해 주세요.')
  if (
    result.items.some(
      (item) =>
        !item ||
        typeof item !== 'object' ||
        ['title', 'name', 'status'].some(
          (key) => item[key] != null && typeof item[key] !== 'string',
        ),
    )
  )
    throw new Error('서버 목록 항목을 확인해 주세요.')
  return { items: result.items, source: 'api' }
}
