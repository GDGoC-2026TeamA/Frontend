# 공통 UI 사용

컴포넌트는 `ui/index.js`에서 가져옵니다. 이벤트와 상태는 각 페이지에서 관리합니다.

```jsx
import { useState } from 'react'
import { Button, Input, Modal, FileUpload } from './ui'

function Example() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [files, setFiles] = useState([])

  return (
    <>
      <Button onClick={() => setOpen(true)}>내용 확인</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="내용 확인">
        <Input
          label="업무명"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FileUpload label="기존 양식" files={files} onChange={setFiles} />
      </Modal>
    </>
  )
}
```

| 컴포넌트        | 핵심 props                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Button          | `variant` (`primary`, `secondary`, `ghost`), `loading`, `loadingLabel`, `disabled`, `icon`, `onClick`, `type`              |
| Input, Textarea | `label`, `hint`, `error`, `value`, `onChange`, `defaultValue`, `required`, `disabled`, `readOnly`                          |
| Checkbox        | `label`, `hint`, `error`, `checked`, `onChange`, `defaultChecked`, `disabled`                                              |
| Badge           | `tone` (`neutral`, `changed`, `warning`, `edited`, `success`, `error`), `children`                                         |
| Card            | `title`, `description`, `action`, `footer`, `children`                                                                     |
| Tabs            | `items` (`id`, `label`, `disabled`), `value`, `onChange`, `label`, `children` 함수                                         |
| Stepper         | `steps`, `currentStep` (0부터 시작), `label`                                                                               |
| Modal, Drawer   | `open`, `onClose`, `title`, `description`, `footer`, `children`                                                            |
| FileUpload      | `label`, `files`, `onChange`, `accept`, `maxSizeMB`, `multiple`, `loading`, `disabled`, `error`, `hint`                    |
| StatePanel      | `type` (`empty`, `loading`, `error`, `insufficient`, `success`), `title`, `description`, `actionLabel`, `onAction`, `icon` |
| EvidenceCard    | `source`, `location`, `quote`, `label`, `note`, `onOpen`                                                                   |

FileUpload는 선택한 파일 목록을 부모에 넘깁니다. 기본은 단일 파일이며 선택을 바꾸면 기존 목록을 대체합니다. `multiple`을 켜도 새 선택이 기존 목록을 대체합니다. 파일을 서버로 보내거나 내용을 읽지 않습니다.

`Modal`과 `Drawer`는 모달이므로 열린 동안 배경을 조작할 수 없습니다. `onClose`에서 반드시 `open`을 false로 바꿔 주세요. 여러 모달을 동시에 열지 마세요. 업무 화면의 고정 AI 패널은 모달 대신 `AppLayout`의 `assistant` prop을 쓰면 됩니다.

`EvidenceCard.onOpen`은 나중에 원문 위치를 여는 함수입니다. 함수가 없으면 연결되지 않은 원문 버튼을 표시하지 않습니다. 같은 원칙으로 준비되지 않은 동작을 성공 처리하지 않습니다.

## 홈과 업무 화면의 틀

AppLayout은 `/`에서 `home` 구조를 쓰고 다른 주소에서는 업무 화면 구조를 씁니다. 메뉴 항목과 이동 주소는 같습니다. Sidebar의 `variant="home"`은 208px 메뉴의 도움말과 작업 공간 표시를 바꾸고, Header의 `variant="home"`은 제목과 검색을 본문 안에 배치합니다. PageHeader의 `variant="home"`은 홈 제목 토큰을 씁니다.

AppLayout의 `homeAside`에 내용을 넘기면 HomeQuickPanel의 오른쪽 368px 영역을 채웁니다. 현재는 다음 차수에 채울 영역 안내만 있습니다. 이 영역은 업무 화면의 360px AI 패널과 다른 슬롯입니다. 홈의 파스텔 업무 카드와 작업 목록은 아직 만들지 않았습니다.
