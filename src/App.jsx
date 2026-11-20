import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import WorkspacePage from './pages/WorkspacePage'
import HomePage from './pages/HomePage'
import PlaceholderPage from './pages/PlaceholderPage'
import CollectionPage from './pages/CollectionPage'
import WorkInputPage from './pages/WorkInputPage'
import ComponentPreviewPage from './pages/ComponentPreviewPage'

const previewEnabled =
  import.meta.env.DEV ||
  import.meta.env.VITE_ENABLE_COMPONENT_PREVIEW === 'true'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          import.meta.env.VITE_DATA_MODE === 'api' ? (
            <WorkspacePage />
          ) : (
            <HomePage />
          )
        }
      />
      <Route path="/spaces" element={<WorkspacePage />} />
      <Route path="work/new" element={<HomePage />} />
      <Route
        path="work-cards"
        element={<CollectionPage key="cards" kind="cards" />}
      />
      <Route
        path="history"
        element={<CollectionPage key="jobs" kind="jobs" />}
      />
      <Route path="work/input" element={<WorkInputPage />} />
      <Route element={<AppLayout />}>
        {previewEnabled && (
          <Route path="dev/components" element={<ComponentPreviewPage />} />
        )}
        <Route
          path="*"
          element={
            <PlaceholderPage
              title="페이지를 찾을 수 없어요"
              description="주소를 확인하거나 홈으로 돌아가 주세요."
              emptyTitle="이 주소에 연결된 화면이 없어요"
              emptyDescription="왼쪽 메뉴에서 원하는 화면을 선택해 주세요."
            />
          }
        />
      </Route>
    </Routes>
  )
}
