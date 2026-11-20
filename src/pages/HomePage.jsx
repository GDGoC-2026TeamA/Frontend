import { useNavigate, useOutletContext } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button, Card, Badge, StatePanel } from '../components/ui'

export default function HomePage() {
  const navigate = useNavigate()
  const { openMenu } = useOutletContext() || {}
  return (
    <div className="page-stack home-page">
      <Header
        variant="home"
        onMenu={openMenu}
        title="내 업무"
        description="배우던 업무와 처리하던 작업을 이어서 확인하세요."
      />
      <section
        className="home-foundation"
        aria-labelledby="registered-work-title"
      >
        <div className="home-foundation__heading">
          <h2 id="registered-work-title">등록된 업무</h2>
          <Button onClick={() => navigate('/work/new')}>새 업무 등록</Button>
        </div>
        <Card className="foundation-card" action={<Badge>예시 데이터</Badge>}>
          <StatePanel
            icon={Layers}
            title="내 업무를 한곳에서"
            description="기존 자료와 새 매뉴얼을 비교하고, 익힌 절차로 오늘의 업무를 처리해요. 업무 목록과 이어서 할 작업이 이곳에 표시될 예정이에요."
          />
        </Card>
      </section>
      <p className="page-note">
        현재는 공통 화면과 메뉴를 확인할 수 있어요. 업무 등록과 처리는 아직
        연결되지 않았어요.
      </p>
    </div>
  )
}
