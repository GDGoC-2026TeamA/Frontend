import { getFoundationPreview as getDemoPreview } from './demo/foundation'
import { dataMode } from './config'

export async function getFoundationPreview(options) {
  const mode = dataMode
  if (mode !== 'demo')
    throw new Error(
      '실제 API는 아직 연결되지 않았어요. VITE_DATA_MODE=demo로 실행해 주세요.',
    )
  return getDemoPreview(options)
}
