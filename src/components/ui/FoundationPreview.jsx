import { useState } from 'react'
import { AccountMenu } from './AccountMenu'
import { ProfileForm, EmailForm, PasswordAction } from './AccountForms'
import { GuideDialog } from './GuideDialog'
import { PublicationStatus, RecordContext, RegistrationScope } from './Sharing'
import { LearningChoice, LearningRecommendation } from './LearningChoice'
import { TaskFilters } from './TaskFilters'
import { SaveToast } from './SaveToast'
import {
  TaskEditDialog,
  SharingSettingsDialog,
  ConfirmationDialog,
} from './FoundationDialogs'
import { Button } from './Button'
import { Card } from './Card'

export function FoundationPreview() {
  const [selected, setSelected] = useState(false)
  const [filter, setFilter] = useState('all')
  const [dialog, setDialog] = useState(null)
  const [name, setName] = useState('이서연')
  const [email, setEmail] = useState('sample@example.com')
  const [task, setTask] = useState('예약 접수')
  const [description, setDescription] = useState(
    '예약 자료와 새 절차를 비교합니다.',
  )
  const [notice, setNotice] = useState('')
  const [profile, setProfile] = useState('profile')
  const close = () => setDialog(null)
  const example = (event) => {
    event?.preventDefault()
    setNotice('예시 동작을 확인했어요. 서버에는 저장하지 않았어요.')
    close()
  }
  return (
    <section
      className="foundation-stack"
      aria-label="V0.4 공통 컴포넌트"
      id="foundation-v04"
    >
      <h2>V0.4 공통 컴포넌트</h2>
      <p>
        계정과 공유 예시는 서버에 저장하지 않습니다. 실제 계정 이동과 인증은
        연결할 화면에서 처리합니다.
      </p>
      <Card title="계정 메뉴와 편집" className="foundation-stack">
        <AccountMenu
          onProfile={() => setProfile('profile')}
          onSettings={() => setProfile('settings')}
          onLogout={() => setDialog('logout')}
        />
        {profile === 'profile' ? (
          <ProfileForm
            name={name}
            email={email}
            onNameChange={(event) => setName(event.target.value)}
            onSubmit={example}
            onCancel={() => {
              setName('이서연')
              setNotice('예시 편집을 취소했어요.')
            }}
          />
        ) : (
          <>
            <EmailForm
              email={email}
              onChange={(event) => setEmail(event.target.value)}
              onSubmit={example}
            />
            <PasswordAction
              onReset={() =>
                setNotice('재설정 이메일 예시입니다. 이메일은 보내지 않았어요.')
              }
            />
          </>
        )}
        <SaveToast>{notice}</SaveToast>
      </Card>
      <Card title="업무 범위와 공유 상태" className="foundation-stack">
        <TaskFilters value={filter} onChange={setFilter} />
        <p>
          선택한 범위:{' '}
          {
            { all: '전체', mine: '내가 등록한 업무', shared: '공유받은 업무' }[
              filter
            ]
          }
        </p>
        <RegistrationScope />
        <div className="foundation-grid">
          {['draft', 'published', 'revision'].map((status) => (
            <PublicationStatus
              key={status}
              status={status}
              owner="이서연"
              version="v1"
              needsReview
            />
          ))}
          <RecordContext version="v1" analysisId="20">
            학습과 작업 결과는 내 계정에 저장돼요.
          </RecordContext>
          <RecordContext scope="shared" version="v1" analysisId="20">
            재고 입고 기록
          </RecordContext>
        </div>
      </Card>
      <Card title="학습 선택과 근거" className="foundation-stack">
        <LearningRecommendation
          title="수량이 다를 때 처리하기"
          reason="새 매뉴얼에 수량 차이 기록 단계가 추가됐어요."
          evidence="새 재고 시스템 매뉴얼 3장"
          selected={selected}
          onChange={() => setSelected(true)}
          value="quantity"
        />
        <LearningRecommendation
          title="담당자 승인 기준"
          reason="담당자 확인이 필요해요."
          confirmed={false}
        />
        <LearningRecommendation
          unavailable
          onChooseManually={() => {
            document.getElementById('manual-choice')?.focus()
          }}
        />
        <LearningChoice
          id="manual-choice"
          name="learning-topic"
          value="manual"
          checked={!selected}
          onChange={() => setSelected(false)}
        >
          확인된 절차 직접 선택
        </LearningChoice>
        <LearningChoice type="checkbox">이 절차를 다시 연습하기</LearningChoice>
      </Card>
      <Card title="안내와 공통 팝업" className="foundation-stack">
        <div className="foundation-inline">
          {[
            ['home', '홈 안내'],
            ['first-task', '첫 업무 안내'],
            ['edit', '이름과 설명 수정'],
            ['sharing', '공유 설정'],
            ['delete', '업무 삭제'],
          ].map(([key, label]) => (
            <Button
              key={key}
              variant="secondary"
              onClick={() => setDialog(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>
      <GuideDialog
        open={dialog === 'home' || dialog === 'first-task'}
        variant={dialog === 'home' ? 'home' : 'first-task'}
        onClose={close}
      />
      <TaskEditDialog
        open={dialog === 'edit'}
        onClose={close}
        name={task}
        description={description}
        onNameChange={(event) => setTask(event.target.value)}
        onDescriptionChange={(event) => setDescription(event.target.value)}
        onSubmit={example}
      />
      <SharingSettingsDialog
        open={dialog === 'sharing'}
        onClose={close}
        onConfirm={example}
        taskName={task}
      />
      <ConfirmationDialog
        open={dialog === 'delete' || dialog === 'logout'}
        onClose={close}
        onConfirm={example}
        kind={dialog === 'delete' ? 'delete' : 'logout'}
        taskName={task}
      />
    </section>
  )
}
