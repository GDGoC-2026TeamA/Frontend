import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Plus, PanelRightOpen } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { AssistantPanel } from '../components/layout/AssistantPanel'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Drawer,
  EvidenceCard,
  FileUpload,
  Input,
  Modal,
  StatePanel,
  Stepper,
  Tabs,
  Textarea,
} from '../components/ui'
import { previewEvidence, previewSteps } from '../data/foundation'
import { getFoundationPreview } from '../services/foundationService'

const swatches = [
  ['주요 색상', 'primary', '#2563EB'],
  ['호버', 'primary-hover', '#1D4ED8'],
  ['선택 배경', 'primary-soft', '#EFF6FF'],
  ['전체 배경', 'canvas', '#F5F7FA'],
  ['카드', 'surface', '#FFFFFF'],
  ['기본 글자', 'text', '#1D2939'],
  ['보조 글자', 'secondary', '#475467'],
  ['약한 글자', 'muted', '#667085'],
  ['구분선', 'border', '#E4E7EC'],
  ['입력란 테두리', 'input-border', '#858E9B'],
]
const sections = [
  ['tokens', '색상과 글자'],
  ['buttons', '버튼'],
  ['fields', '입력과 선택'],
  ['navigation', '탭과 단계'],
  ['upload', '파일 선택'],
  ['overlays', '모달과 패널'],
  ['states', '안내 상태'],
  ['responses', '예시 응답'],
]
const sampleFile = { name: '입고내역_예시.xlsx', size: 20480 }

export default function ComponentPreviewPage() {
  const [tab, setTab] = useState('materials')
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([sampleFile])
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [notice, setNotice] = useState('')
  const [checked, setChecked] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [requestState, setRequestState] = useState('idle')
  const [response, setResponse] = useState(null)
  const controller = useRef(null)
  useEffect(() => () => controller.current?.abort(), [])

  const runPreview = async (outcome) => {
    controller.current?.abort()
    const requestController = new AbortController()
    controller.current = requestController
    setRequestState('loading')
    setResponse(null)
    try {
      const result = await getFoundationPreview({
        outcome,
        signal: requestController.signal,
      })
      if (requestController.signal.aborted) return
      setResponse(result)
      setRequestState(result.evidence ? 'success' : 'insufficient')
    } catch (error) {
      if (error.name !== 'AbortError') {
        setRequestState('error')
        setResponse({ message: error.message })
      }
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="WORK BRIDGE / UI FOUNDATION"
        title="공통 컴포넌트"
        description="A 시안의 스타일과 화면 상태를 한곳에서 확인합니다."
        action={<Badge>개발용 확인 화면</Badge>}
      />
      <div className="preview-intro">
        <p>
          모든 내용은 예시입니다. 입력한 내용과 선택한 파일은 새로고침하면
          사라집니다.
        </p>
        <Button
          variant="secondary"
          onClick={() => setDrawer(true)}
          icon={<PanelRightOpen size={18} aria-hidden="true" />}
        >
          AI 패널 구조 보기
        </Button>
      </div>
      <nav className="preview-section-index" aria-label="컴포넌트 목차">
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>

      <Card
        id="tokens"
        className="preview-card"
        title="색상과 글자"
        description="공통 CSS 변수를 바꾸면 모든 화면에 같은 값이 적용됩니다."
      >
        <div className="preview-swatches">
          {swatches.map(([name, token, hex]) => (
            <div key={token} className="preview-swatch">
              <div
                className="preview-swatch__color"
                style={{ '--swatch': `var(--wb-color-${token})` }}
              />
              <span>
                {name}
                <br />
                {hex}
              </span>
            </div>
          ))}
        </div>
        <div className="stack">
          {[
            ['page', '페이지 제목', '28 / 40 · Bold'],
            ['section', '영역 제목', '20 / 30 · Bold'],
            ['card', '카드 제목', '18 / 28 · Bold'],
            ['body', '본문은 업무 내용을 편하게 읽도록', '16 / 26 · Regular'],
            ['label', '메뉴와 버튼', '15 / 24 · Medium'],
            ['small', '자료명과 위치를 함께 확인하세요.', '14 / 22 · Regular'],
            ['caption', '상태를 문구로 함께 표시해요.', '12 / 20 · Medium'],
          ].map(([token, text, size]) => (
            <div className="preview-type" key={token}>
              <span style={{ font: `var(--wb-font-${token})` }}>{text}</span>
              <code>{size}</code>
            </div>
          ))}
        </div>
      </Card>

      <Card
        id="buttons"
        className="preview-card"
        title="버튼"
        description="실제 호버와 키보드 포커스가 동작합니다. 표의 호버와 포커스 칸은 고정된 시각 예시입니다."
      >
        <div className="preview-table-scroll">
          <table className="preview-button-table">
            <thead>
              <tr>
                <th scope="col">종류</th>
                <th scope="col">기본</th>
                <th scope="col">호버 예시</th>
                <th scope="col">포커스 예시</th>
                <th scope="col">비활성</th>
                <th scope="col">처리 중</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['primary', '주요'],
                ['secondary', '보조'],
                ['ghost', '텍스트'],
              ].map(([variant, label]) => (
                <tr key={variant}>
                  <th scope="row">{label}</th>
                  <td>
                    <Button
                      variant={variant}
                      onClick={() => setNotice(`${label} 버튼을 눌렀어요.`)}
                    >
                      업무 처리하기
                    </Button>
                  </td>
                  <td>
                    <Button
                      variant={variant}
                      className="preview-hover"
                      onClick={() => setNotice('호버 예시 버튼을 눌렀어요.')}
                    >
                      업무 처리하기
                    </Button>
                  </td>
                  <td>
                    <Button
                      variant={variant}
                      className="preview-focus"
                      onClick={() => setNotice('포커스 예시 버튼을 눌렀어요.')}
                    >
                      업무 처리하기
                    </Button>
                  </td>
                  <td>
                    <Button variant={variant} disabled>
                      업무 처리하기
                    </Button>
                  </td>
                  <td>
                    <Button variant={variant} loading loadingLabel="처리 중">
                      업무 처리하기
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row">
          <Button
            icon={<Plus size={18} aria-hidden="true" />}
            onClick={() => setModal(true)}
          >
            모달 열기
          </Button>
          <Button
            variant="secondary"
            icon={<ArrowRight size={18} aria-hidden="true" />}
            onClick={() => setDrawer(true)}
          >
            자료 패널 열기
          </Button>
        </div>
        <p className="text-muted" role="status">
          {notice || '버튼을 눌러 반응을 확인해 보세요.'}
        </p>
      </Card>

      <Card
        id="fields"
        className="preview-card"
        title="입력과 선택"
        description="라벨, 도움말과 오류 문구를 입력란에 연결했습니다."
      >
        <div className="preview-grid">
          <Input
            label="업무명"
            placeholder="업무명을 입력하세요"
            hint="어떤 일을 처리하는지 짧게 적어 주세요."
          />
          <Input
            label="입력된 업무명"
            defaultValue="재고 입고 기록"
            hint="내용을 바꿔 보세요."
          />
          <Input
            label="필수 입력 오류"
            required
            placeholder="업무명을 입력하세요"
            error="업무명을 입력해 주세요."
          />
          <Input
            label="읽기 전용 업무명"
            defaultValue="재고 입고 기록"
            readOnly
            hint="이 항목은 수정할 수 없어요."
          />
          <Input
            label="비활성 입력란"
            disabled
            placeholder="지금은 입력할 수 없어요"
          />
          <Textarea
            label="업무 설명"
            placeholder="평소 어떤 순서로 처리했나요?"
            hint="기억하고 싶은 내용을 적어 보세요."
          />
          <Textarea
            label="설명 입력 오류"
            error="설명을 확인해 주세요."
            defaultValue="검토가 필요한 내용"
          />
          <Textarea
            label="비활성 설명"
            disabled
            placeholder="지금은 입력할 수 없어요"
          />
        </div>
        <div className="preview-grid">
          <Checkbox
            label="원본 자료와 대조했어요"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            hint="클릭하거나 스페이스 키로 선택해 보세요."
          />
          <Checkbox label="확인한 항목" defaultChecked />
          <Checkbox
            label="선택이 필요한 항목"
            error="자료를 대조한 뒤 선택해 주세요."
          />
          <Checkbox label="비활성 항목" disabled />
        </div>
        <div className="stack">
          <h3>상태 배지</h3>
          <div className="row">
            {[
              'neutral',
              'changed',
              'warning',
              'edited',
              'success',
              'error',
            ].map((tone) => (
              <Badge key={tone} tone={tone} />
            ))}
          </div>
          <p className="text-muted">
            ‘확인 완료’는 사용자가 내용을 확인했다는 뜻입니다. AI 결과의
            정확성을 보증하지 않습니다.
          </p>
        </div>
      </Card>

      <Card
        id="navigation"
        className="preview-card"
        title="탭과 단계"
        description="탭은 방향키, Home, End 키로도 바꿀 수 있습니다."
      >
        <Tabs
          label="자료 구분"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'materials', label: '업무 기준 자료' },
            { id: 'task', label: '작업 자료' },
            { id: 'unavailable', label: '비활성 탭', disabled: true },
          ]}
        >
          {(value) => (
            <p>
              {value === 'materials'
                ? '기존 양식과 새 시스템 매뉴얼입니다. 다음 업무에서도 같은 기준을 참고해요.'
                : '오늘 받은 입고 내역이나 예약 요청입니다. 이번 작업에서 처리할 내용이에요.'}
            </p>
          )}
        </Tabs>
        <Stepper steps={previewSteps} currentStep={currentStep} />
        <div className="row">
          <Button
            variant="secondary"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((step) => step - 1)}
          >
            이전 단계 예시
          </Button>
          <Button
            variant="secondary"
            disabled={currentStep === 2}
            onClick={() => setCurrentStep((step) => step + 1)}
          >
            다음 단계 예시
          </Button>
        </div>
      </Card>

      <Card
        id="upload"
        className="preview-card"
        title="파일 선택"
        description="선택, 교체, 삭제와 끌어놓기를 확인합니다. 파일 내용은 읽지 않습니다."
      >
        <div className="preview-grid">
          <FileUpload
            label="기존 양식 선택"
            files={files}
            onChange={setFiles}
          />
          <FileUpload
            label="선택된 파일 예시"
            files={selectedFiles}
            onChange={setSelectedFiles}
          />
          <FileUpload label="비활성 파일 선택" disabled />
          <FileUpload label="준비 중 상태 예시" loading />
          <FileUpload
            label="오류 상태 예시"
            error="선택할 수 없는 파일 형식이에요. 파일을 다시 선택해 주세요."
            onChange={() => setNotice('오류 상태를 보여 주는 고정 예시입니다.')}
          />
        </div>
      </Card>

      <Card
        id="overlays"
        className="preview-card"
        title="모달과 자료 근거"
        description="Escape, 닫기 버튼과 배경 클릭으로 닫을 수 있습니다. 닫은 뒤에는 열기 버튼으로 포커스가 돌아옵니다."
      >
        <div className="row">
          <Button onClick={() => setModal(true)}>확인 모달 열기</Button>
          <Button variant="secondary" onClick={() => setDrawer(true)}>
            AI 패널 열기
          </Button>
        </div>
        <div className="preview-grid">
          <EvidenceCard {...previewEvidence} />
          <EvidenceCard
            source="확인되지 않은 항목"
            location="등록된 자료에 관련 내용 없음"
            quote=""
            note="근거가 없는 내용은 확인되지 않았다고 표시합니다."
          />
        </div>
      </Card>

      <Card
        id="states"
        className="preview-card"
        title="화면 안내 상태"
        description="화면과 같은 컴포넌트를 쓰며 문구와 동작을 props로 바꿉니다."
      >
        <div className="preview-grid">
          <div className="preview-state-frame">
            <StatePanel
              actionLabel="빈 화면 동작 확인"
              onAction={() => setNotice('빈 화면의 버튼을 눌렀어요.')}
            />
          </div>
          <div className="preview-state-frame">
            <StatePanel type="loading" />
          </div>
          <div className="preview-state-frame">
            <StatePanel
              type="error"
              actionLabel="다시 시도"
              onAction={() => runPreview('success')}
            />
          </div>
          <div className="preview-state-frame">
            <StatePanel
              type="insufficient"
              actionLabel="자료 부족 안내 보기"
              onAction={() => setDrawer(true)}
            />
          </div>
        </div>
      </Card>

      <Card
        id="responses"
        className="preview-card"
        title="예시 응답 상태 전환"
        description="화면, 예시 데이터, 응답 로직과 API 전송 코드를 분리했습니다. 아래 버튼은 고정된 예시만 불러옵니다."
      >
        <div className="row">
          <Button onClick={() => runPreview('success')}>정상 응답 예시</Button>
          <Button variant="secondary" onClick={() => runPreview('error')}>
            오류 응답 예시
          </Button>
          <Button
            variant="secondary"
            onClick={() => runPreview('insufficient')}
          >
            자료 부족 예시
          </Button>
        </div>
        <div aria-live="polite" className="preview-response">
          {requestState === 'idle' && (
            <p className="text-muted">
              버튼을 누르면 로딩 후 해당 상태로 바뀝니다.
            </p>
          )}
          {requestState === 'loading' && <StatePanel type="loading" />}
          {requestState === 'success' && response?.evidence && (
            <EvidenceCard {...response.evidence} />
          )}
          {requestState === 'error' && (
            <StatePanel
              type="error"
              description={response?.message}
              actionLabel="예시 다시 불러오기"
              onAction={() => runPreview('success')}
            />
          )}
          {requestState === 'insufficient' && (
            <StatePanel
              type="insufficient"
              description="예시 응답에 관련 근거가 없어요. 실제 파일 분석 결과가 아닙니다."
            />
          )}
        </div>
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="공통 모달 확인"
        description="입력과 닫기 동작을 확인하는 예시입니다."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                setModal(false)
                setNotice('모달 확인을 마쳤어요. 데이터는 저장하지 않았어요.')
              }}
            >
              확인
            </Button>
          </>
        }
      >
        <Input
          label="예시 카드 제목"
          defaultValue="입고 내역 확인 절차"
          hint="이 확인 화면에서는 카드를 저장하지 않아요."
        />
      </Modal>
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="AI 질문과 자료 근거"
        description="이후 업무 화면에 연결할 패널 구조입니다."
      >
        <AssistantPanel workName="재고 입고 기록" evidence={previewEvidence} />
      </Drawer>
    </div>
  )
}
