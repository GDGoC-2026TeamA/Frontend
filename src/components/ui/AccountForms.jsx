import { Input } from './Fields'
import { Button } from './Button'

// Controlled forms deliberately do not claim a successful server save.
export function ProfileForm({
  name,
  email,
  onNameChange,
  onSubmit,
  onCancel,
  saving = false,
  error,
}) {
  return (
    <form className="account-form" onSubmit={onSubmit}>
      <h2>프로필 정보</h2>
      <Input
        label="이름"
        name="name"
        value={name}
        onChange={onNameChange}
        required
        autoComplete="name"
      />
      <Input
        label="이메일"
        name="email"
        type="email"
        value={email}
        readOnly
        hint="로그인 이메일은 설정에서 바꿀 수 있어요."
      />
      {error && (
        <p role="alert" className="field__hint is-error">
          {error}
        </p>
      )}
      <div className="foundation-inline">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          취소
        </Button>
        <Button type="submit" loading={saving}>
          저장
        </Button>
      </div>
    </form>
  )
}

export function EmailForm({
  email,
  onChange,
  onSubmit,
  saving = false,
  error,
}) {
  return (
    <form className="account-form" onSubmit={onSubmit}>
      <h2>로그인 이메일</h2>
      <Input
        label="이메일"
        name="email"
        type="email"
        value={email}
        onChange={onChange}
        required
        autoComplete="email"
        error={error}
      />
      <Button type="submit" loading={saving}>
        이메일 저장
      </Button>
    </form>
  )
}

export function PasswordAction({ onReset, loading = false }) {
  return (
    <section className="account-form">
      <h2>비밀번호</h2>
      <p>재설정 이메일을 받아 비밀번호를 바꿀 수 있어요.</p>
      <Button variant="secondary" loading={loading} onClick={onReset}>
        비밀번호 재설정
      </Button>
    </section>
  )
}
