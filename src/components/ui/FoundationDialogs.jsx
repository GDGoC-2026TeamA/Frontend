import { Modal } from './Overlay'
import { Input, Textarea } from './Fields'
import { Button } from './Button'

export function TaskEditDialog({
  open,
  onClose,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  saving = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="이름과 설명 수정"
      className="foundation-dialog"
    >
      <form className="foundation-stack" onSubmit={onSubmit}>
        <Input
          label="업무 이름"
          value={name}
          onChange={onNameChange}
          required
        />
        <Textarea
          label="설명"
          value={description}
          onChange={onDescriptionChange}
        />
        <div className="foundation-inline foundation-actions">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button type="submit" loading={saving}>
            저장
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function SharingSettingsDialog({
  open,
  onClose,
  onConfirm,
  taskName,
  reviewed = false,
  saving = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="공유 설정"
      className="foundation-dialog"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={onConfirm} disabled={!reviewed} loading={saving}>
            공유하기
          </Button>
        </>
      }
    >
      <div className="foundation-stack">
        <strong>{taskName}</strong>
        <p>
          자료를 검토한 뒤 공유합니다. 공유받은 사람에게는 기준 자료와 검토한
          절차만 보입니다.
        </p>
        <p>작업 자료와 결과, 질문과 개인 카드는 내 기록으로 남습니다.</p>
        {!reviewed && (
          <p className="text-secondary">
            자료 검토를 마친 뒤 공유할 수 있어요.
          </p>
        )}
      </div>
    </Modal>
  )
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  kind = 'logout',
  taskName,
  pending = false,
}) {
  const logout = kind === 'logout'
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="foundation-dialog"
      title={logout ? '로그아웃할까요?' : `${taskName}를 삭제할까요?`}
      description={
        logout
          ? '다시 로그인하면 내 업무와 기록을 볼 수 있어요.'
          : '등록한 업무가 목록에서 사라집니다. 삭제하기 전에 필요한 자료를 확인해 주세요.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            취소
          </Button>
          <Button onClick={onConfirm} loading={pending}>
            {logout ? '로그아웃' : '삭제하기'}
          </Button>
        </>
      }
    />
  )
}
