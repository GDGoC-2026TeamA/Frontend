import { Button } from './Button'
import { Modal } from './Overlay'
import { FileText } from 'lucide-react'
import { StatusIcon } from './StatusIcon'
import { useEffect, useRef } from 'react'

export function ProcessingDialog({
  phase,
  filename,
  isExample,
  loadingDescription,
  onCancel,
  onRetry,
  onReplace,
}) {
  const message = useRef(null)
  useEffect(() => {
    if (phase === 'loading' || phase === 'error') message.current?.focus()
  }, [phase])
  const loading = phase === 'loading'
  const title = loading
    ? '검토할 초안을 만들고 있어요'
    : isExample
      ? '전표 파일을 읽지 못했어요'
      : '파일 읽기 연결을 준비하고 있어요'
  return (
    <Modal
      open={phase === 'loading' || phase === 'error'}
      onClose={onCancel}
      title={title}
      className={`processing-dialog processing-dialog--${phase}`}
    >
      <StatusIcon type={loading ? 'loading' : 'error'} />
      <div
        ref={message}
        tabIndex={-1}
        role={loading ? 'status' : 'alert'}
        className="processing-dialog__message"
        aria-busy={loading || undefined}
      >
        <h3>{title}</h3>
        <p>
          {loading
            ? loadingDescription ||
              '입고 전표에서 품목 코드와 수량을 확인하고 있어요.'
            : isExample
              ? '전표를 다시 선택하거나 잠시 후 다시 시도해 주세요.'
              : '선택한 파일을 보내거나 읽지 않았어요. 실제 문서 분석은 아직 연결되지 않았어요.'}
        </p>
      </div>
      <div className="processing-dialog__file">
        <FileText size={22} aria-hidden="true" />
        <span>{filename}</span>
      </div>
      {loading && (
        <p className="processing-dialog__progress">
          처리 중이에요. 잠시만 기다려 주세요.
        </p>
      )}
      <div className="processing-dialog__actions">
        {loading ? (
          <Button variant="ghost" onClick={onCancel}>
            자료 입력으로
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onReplace}>
              파일 다시 선택
            </Button>
            <Button onClick={onRetry} disabled={!isExample}>
              다시 시도
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
