import { useId, useRef, useState } from 'react'
import { FileText, Upload, X, LoaderCircle } from 'lucide-react'
import { Button } from './Button'

function acceptsFile(file, accept) {
  if (!accept) return true
  return accept.split(',').some((item) => {
    const rule = item.trim().toLowerCase()
    if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule)
    if (rule.endsWith('/*')) return file.type.startsWith(rule.slice(0, -1))
    return file.type === rule
  })
}

export function FileUpload({
  label = '업무 기준 자료',
  files = [],
  onChange,
  accept = '.pdf,.xlsx,.csv,.docx,.txt',
  maxSizeMB = 10,
  multiple = false,
  disabled = false,
  loading = false,
  buttonLabel,
  error,
  hint = '파일은 이 화면에서만 선택됩니다. 서버로 전송하거나 내용을 분석하지 않아요.',
}) {
  const id = useId()
  const inputRef = useRef(null)
  const [validation, setValidation] = useState('')
  const [dragging, setDragging] = useState(false)
  const blocked = disabled || loading
  const message = error || validation
  const select = (incoming) => {
    if (blocked) return
    const selected = Array.from(incoming || [])
    if (!selected.length) return
    if (!multiple && selected.length > 1) {
      setValidation('파일은 한 번에 하나만 선택해 주세요.')
      return
    }
    if (selected.some((file) => !acceptsFile(file, accept))) {
      setValidation(
        '선택할 수 없는 파일 형식이에요. 안내된 형식을 확인해 주세요.',
      )
      return
    }
    if (selected.some((file) => file.size > maxSizeMB * 1024 * 1024)) {
      setValidation(`파일 하나의 크기는 ${maxSizeMB}MB 이하여야 해요.`)
      return
    }
    setValidation('')
    onChange?.(selected)
  }
  return (
    <div className="file-upload">
      <p id={`${id}-label`} className="field__label">
        {label}
      </p>
      <div
        className={`file-upload__zone ${dragging ? 'is-dragging' : ''} ${message ? 'is-error' : ''} ${blocked ? 'is-disabled' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          if (!blocked) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          select(event.dataTransfer.files)
        }}
      >
        {loading ? (
          <LoaderCircle size={24} className="spinner" aria-hidden="true" />
        ) : (
          <Upload size={24} aria-hidden="true" />
        )}
        <Button
          variant="ghost"
          onClick={() => inputRef.current?.click()}
          disabled={blocked}
          aria-describedby={`${id}-help ${id}-formats`}
        >
          {loading
            ? '파일 선택을 준비하고 있어요'
            : buttonLabel || '파일을 선택하거나 여기에 놓으세요'}
        </Button>
        <input
          ref={inputRef}
          id={id}
          className="sr-only"
          type="file"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-help ${id}-formats`}
          aria-invalid={!!message}
          accept={accept}
          multiple={multiple}
          disabled={blocked}
          onChange={(event) => {
            select(event.target.files)
            event.target.value = ''
          }}
        />
        <p id={`${id}-formats`} className="text-muted">
          {accept || '모든 형식'} / 파일당 최대 {maxSizeMB}MB
        </p>
      </div>
      {files.length > 0 && (
        <ul className="file-upload__list" aria-label="선택한 파일">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`}>
              <FileText size={20} aria-hidden="true" />
              <span className="file-upload__name">
                {file.name}
                <small>{(file.size / 1024).toFixed(1)}KB · 선택됨</small>
              </span>
              <Button
                variant="ghost"
                className="icon-button"
                disabled={blocked}
                aria-label={`${file.name} 삭제`}
                onClick={() => {
                  setValidation('')
                  onChange?.(files.filter((_, i) => i !== index))
                }}
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p
        id={`${id}-help`}
        className={`field__hint ${message ? 'is-error' : ''}`}
        role={message ? 'alert' : undefined}
      >
        {message || hint}
      </p>
      {loading && (
        <span role="status" className="sr-only">
          파일 선택 준비 중
        </span>
      )}
    </div>
  )
}
