import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import PlaceholderPage from './pages/PlaceholderPage'
import ComponentPreviewPage from './pages/ComponentPreviewPage'

const previewEnabled =
  import.meta.env.DEV ||
  import.meta.env.VITE_ENABLE_COMPONENT_PREVIEW === 'true'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="work/new" element={<HomePage />} />
      <Route element={<AppLayout />}>
        <Route
          path="work-cards"
          element={
            <PlaceholderPage
              title="개인 업무 카드"
              description="다음 업무에서 다시 볼 처리 절차를 모아 두세요."
              emptyTitle="확인한 절차를 카드로 남겨요"
              emptyDescription="학습하며 저장한 개인 업무 카드가 이곳에 표시될 예정이에요. 카드 저장과 조회는 아직 연결되지 않았어요."
            />
          }
        />
        <Route
          path="history"
          element={
            <PlaceholderPage
              title="작업 내역"
              description="이번 작업에서 검토하고 수정한 결과를 확인하세요."
              emptyTitle="검토한 작업 결과를 모아 봐요"
              emptyDescription="저장한 작업 결과가 이곳에 표시될 예정이에요. 결과 저장과 조회는 아직 연결되지 않았어요."
            />
          }
        />
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
