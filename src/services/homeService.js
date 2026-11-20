import { apiRequest } from './api/client'
import { getDemoHome } from './demo/home'

// These API shapes follow the tracker examples; missing values are not demo-filled.
export async function getHomeDashboard({
  signal,
  mode = import.meta.env.VITE_DATA_MODE || 'demo',
} = {}) {
  if (mode === 'demo')
    return { ...(await getDemoHome({ signal })), source: 'demo' }
  if (mode !== 'api') throw new Error('지원하지 않는 데이터 모드예요.')
  const [home, jobs] = await Promise.all([
    apiRequest('home', { signal }),
    apiRequest('jobs', { signal }),
  ])
  if (
    !home ||
    !Array.isArray(home.tasks) ||
    !Array.isArray(home.resumeJobs) ||
    !Array.isArray(home.recentCards) ||
    !Array.isArray(jobs?.items)
  )
    throw new Error('서버 응답 형식을 확인해 주세요.')
  return {
    source: 'api',
    tasks: home.tasks,
    resumeJobs: home.resumeJobs,
    recentCards: home.recentCards,
    recentJobs: jobs.items,
  }
}
