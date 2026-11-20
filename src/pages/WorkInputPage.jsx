import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { Header } from '../components/layout/Header'
import { Button, FileUpload, Input, Stepper } from '../components/ui'
import { ProcessingDialog } from '../components/ui/ProcessingDialog'

export default function WorkInputPage() {
  const [name, setName] = useState('11월 20일 입고 내역')
  const [quantity, setQuantity] = useState('18')
  const [files, setFiles] = useState([])
  const [sample, setSample] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [validation, setValidation] = useState('')
  const timer = useRef(null)
  const upload = useRef(null)
  const apiMode = import.meta.env.VITE_DATA_MODE === 'api'
  useEffect(() => () => clearTimeout(timer.current), [])
  const cancel = () => {
    clearTimeout(timer.current)
    setPhase('idle')
  }
  const start = () => {
    if (
      !name.trim() ||
      !files.length ||
      !quantity.trim() ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 0
    ) {
      setValidation(
        '작업 이름과 전표, 0 이상의 정수 수량을 모두 입력해 주세요.',
      )
      return
    }
    setValidation('')
    if (!sample || apiMode) {
      setPhase('error')
      return
    }
    setPhase('loading')
    clearTimeout(timer.current)
    // Explicit error fixture. Never reads user files or produces a fabricated draft.
    timer.current = setTimeout(() => setPhase('error'), 1800)
  }
  const chooseSample = () => {
    setFiles([{ name: '11월 20일 입고 전표.pdf', example: true }])
    setSample(true)
    setValidation('')
  }
  const replace = () => {
    cancel()
    setFiles([])
    setSample(false)
    requestAnimationFrame(() =>
      upload.current?.querySelector('button')?.focus(),
    )
  }
  return (
    <AppLayout
      variant="home"
      homeAside={
        <section className="collection-aside">
          <h2>업무 안내</h2>
          <div className="work-input-summary">
            <small>재고 입고 기록</small>
            <h3>{name || '작업 이름'}</h3>
            <p>입고 전표와 실물을 대조해 새 시스템에 입력할 내용을 정리해요.</p>
          </div>
          <div>
            <h3>기준 매뉴얼</h3>
            <p>새 재고 시스템 매뉴얼 / 2장 입고 등록, 3장 수량 불일치 처리</p>
            <small>피그마의 예시 기준이에요.</small>
          </div>
        </section>
      }
    >
      {({ openMenu }) => (
        <div className="page-stack work-input-page">
          <Link to="/" className="collection-back">
            ‹ 홈
          </Link>
          <Header
            variant="home"
            showSearch={false}
            title="업무 자료 입력"
            description="재고 입고 기록 / 오늘 처리할 입고 전표와 실제 수량을 입력해요."
            onMenu={openMenu}
          />
          <Stepper steps={['업무 자료 입력', '초안 검토', '작업 결과']} />
          <section className="work-input-card">
            <h2>작업 정보</h2>
            <Input
              label="작업 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              hint="작업 내역에 표시될 이름이에요."
            />
          </section>
          <section className="work-input-card">
            <h2>오늘 처리할 업무 자료</h2>
            {sample ? (
              <div className="work-input-sample">
                <FileText aria-hidden="true" />
                <span>
                  <strong>{files[0].name}</strong>
                  <small>PDF / 전표 수량 20개 / 예시 자료</small>
                </span>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFiles([])
                    setSample(false)
                  }}
                >
                  삭제
                </Button>
              </div>
            ) : null}
            <div ref={upload}>
              {!sample && (
                <FileUpload
                  label="입고 전표"
                  files={sample ? [] : files}
                  onChange={(value) => {
                    setFiles(value)
                    setSample(false)
                    setValidation('')
                  }}
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                />
              )}
            </div>
            <Input
              label="실제로 입고된 수량"
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              hint="현장에서 확인한 수량을 입력해요."
            />
          </section>
          <p className="collection-demo">
            {apiMode
              ? '실제 파일 읽기와 초안 생성은 아직 연결되지 않았어요.'
              : '예시 전표는 로딩 뒤 읽기 오류를 보여줘요. 실제 파일 전송과 초안 생성은 하지 않아요.'}
          </p>
          {validation && (
            <p role="alert" className="registration-error">
              {validation}
            </p>
          )}
          <div className="work-input-actions">
            <Button variant="ghost" onClick={chooseSample} disabled={apiMode}>
              예시 전표로 확인
            </Button>
            <Button onClick={start}>초안 만들기</Button>
          </div>
          <ProcessingDialog
            phase={phase}
            filename={files[0]?.name}
            isExample={sample && !apiMode}
            onCancel={cancel}
            onRetry={start}
            onReplace={replace}
          />
        </div>
      )}
    </AppLayout>
  )
}
