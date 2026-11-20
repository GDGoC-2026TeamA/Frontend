import { useState } from 'react'
import { Button, Input, Textarea, Modal } from '../ui'
import { deleteDemoTask, editDemoTask } from '../../services/demo/taskWorkspace'

export function TaskManagementDialog({
  task,
  action,
  apiMode,
  onClose,
  onReview,
  onSaved,
}) {
  const [name, setName] = useState(task.name)
  const [description, setDescription] = useState(task.description || '')
  const [error, setError] = useState('')
  const editing = action === '이름과 설명 수정'
  const sharing = action === '공유 설정'
  const allowed = task.scope === 'owned'
  const apply = () => {
    if (!allowed) {
      setError('내가 등록한 업무만 수정할 수 있어요.')
      return
    }
    if (apiMode) {
      setError(
        '업무 관리 API가 아직 연결되지 않았어요. 업무는 바뀌지 않았어요.',
      )
      return
    }
    try {
      if (editing) editDemoTask(task.id, { name, description })
      else deleteDemoTask(task.id)
      onSaved(
        editing
          ? '업무 이름과 설명을 이 탭에 저장했어요.'
          : '등록된 업무를 목록에서 삭제했어요. 기존 개인 카드와 작업 기록은 남아 있어요.',
      )
      onClose()
      if (!editing)
        requestAnimationFrame(() =>
          document.getElementById('registered-work-title')?.focus(),
        )
    } catch (cause) {
      setError(cause.message)
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={
        editing
          ? '이름과 설명 수정'
          : sharing
            ? '공유 설정'
            : `${task.name}를 삭제할까요?`
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={
              sharing
                ? () => {
                    if (!allowed) {
                      setError('공유받은 업무는 다시 공유할 수 없어요.')
                      return
                    }
                    onReview(task)
                  }
                : apply
            }
          >
            {editing ? '저장' : sharing ? '검토 후 공유하기' : '업무 삭제'}
          </Button>
        </>
      }
    >
      {editing ? (
        <form
          id="task-metadata-form"
          onSubmit={(event) => {
            event.preventDefault()
            apply()
          }}
        >
          <Input
            label="업무 이름"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={80}
            hint="업무 목록에 표시할 이름이에요."
          />
          <Textarea
            label="설명"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={300}
            hint="어떤 일을 처리하는지 짧게 적어 주세요."
          />
        </form>
      ) : sharing ? (
        <>
          <h3>{task.name}</h3>
          <p>
            자료를 검토한 뒤 공유합니다. 공유받은 사람에게는 기준 자료와 검토한
            절차만 보입니다.
          </p>
          <p>작업 자료와 결과, 질문과 개인 카드는 내 기록으로 남습니다.</p>
        </>
      ) : (
        <p>
          등록한 업무가 목록에서 사라집니다. 삭제하기 전에 필요한 자료를 확인해
          주세요. 기존 개인 카드와 작업 기록은 남습니다.
        </p>
      )}
      {error && (
        <p role="alert" className="account-error">
          {error}
        </p>
      )}
    </Modal>
  )
}
