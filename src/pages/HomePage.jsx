import { useNavigate } from 'react-router-dom'
import { Plus, Layers } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button, Card, Badge, StatePanel } from '../components/ui'

export default function HomePage() {
  const navigate = useNavigate()
  return (
    <div className="page-stack">
      <PageHeader
        title="내 업무"
        description="배우던 업무와 처리하던 작업을 이어서 확인하세요."
        action={
          <Button
            icon={<Plus size={18} aria-hidden="true" />}
            onClick={() => navigate('/work/new')}
          >
            새 업무 등록
          </Button>
        }
      />
      <Card className="foundation-card" action={<Badge>화면 준비 중</Badge>}>
        <StatePanel
          icon={Layers}
          title="내 업무를 한곳에서"
          description="기존 자료와 새 매뉴얼을 비교하고, 익힌 절차로 오늘의 업무를 처리해요. 업무 목록과 이어서 할 작업이 이곳에 표시될 예정이에요."
        />
      </Card>
      <p className="page-note">
        현재는 공통 화면과 메뉴를 확인할 수 있어요. 업무 등록과 처리는 아직
        연결되지 않았어요.
      </p>
    </div>
  )
}
