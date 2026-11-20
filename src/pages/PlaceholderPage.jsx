import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button, Card, StatePanel, Badge } from '../components/ui'

export default function PlaceholderPage({
  title,
  description,
  emptyTitle,
  emptyDescription,
}) {
  const navigate = useNavigate()
  return (
    <div className="page-stack">
      <PageHeader
        title={title}
        description={description}
        action={
          <Button variant="secondary" onClick={() => navigate('/')}>
            홈으로
          </Button>
        }
      />
      <Card action={<Badge>화면 준비 중</Badge>}>
        <StatePanel title={emptyTitle} description={emptyDescription} />
      </Card>
    </div>
  )
}
