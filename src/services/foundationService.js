import { getFoundationPreview as getDemoPreview } from './demo/foundation'

export async function getFoundationPreview(options) {
  const mode = import.meta.env.VITE_DATA_MODE || 'demo'
  if (mode !== 'demo')
    throw new Error(
      '실제 API는 아직 연결되지 않았어요. VITE_DATA_MODE=demo로 실행해 주세요.',
    )
  return getDemoPreview(options)
}
