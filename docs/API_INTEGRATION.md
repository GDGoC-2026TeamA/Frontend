# API 연결 기준

기준: [팀 Notion API 작업 트래커](https://app.notion.com/p/8b73a23d4c0e838381e301aabcbcf9e5), 2026-11-20 한국 시간 확인.

트래커의 30개 메서드, 경로와 요청·성공 응답 **예시**를 반영했습니다. 확인 당시 모두 ‘시작 전’이므로 서버 구현이나 최종 계약이 완료됐다는 뜻은 아닙니다. 기존의 임의 요청 구조는 아래 예시로 바꿨습니다. 필수 필드, 허용 값 전체, 인증과 오류 응답은 백엔드와 확인해야 합니다.

## 현재 실행 경로

`ComponentPreviewPage → foundationService.getFoundationPreview() → services/demo/foundation.js → data/foundation.js`

화면에서는 HTTP 요청을 보내지 않습니다. `VITE_DATA_MODE=demo`만 지원하며 다른 모드는 미연결 오류를 표시합니다. API client 개선만으로 실제 업로드나 분석이 켜지지 않습니다.

## 공통 전송 코드

업무별 서비스에서 `src/services/api/client.js`의 `apiRequest()`를 호출합니다. 기본 URL은 `/api/v1`이며 `VITE_API_BASE_URL`로 바꿉니다. 예: `https://backend.example.com/api/v1`. 서비스에서는 `home`, `tasks/1/materials`처럼 **접두사를 뺀 리소스 경로**를 넘깁니다. 표의 전체 경로를 그대로 넘겨 /api/v1이 중복되지 않게 하세요. 현재 개발 서버에는 API 프록시가 없습니다. 실제 연결에는 서버 주소 또는 DevOps의 프록시와 CORS 설정이 필요합니다.

- 기본은 JSON 전송입니다. body를 생략하면 요청 본문과 Content-Type을 보내지 않습니다.
- FormData는 그대로 보냅니다. multipart boundary가 필요하므로 Content-Type은 브라우저가 정합니다.
- 204 No Content는 null을 반환합니다.
- 다운로드는 `responseType: 'response'`로 원본 Response를 받아 blob()과 Content-Type, Content-Disposition을 읽습니다. 성공한 바이너리를 JSON으로 읽지 않습니다. 다른 출처의 다운로드 헤더를 읽으려면 서버가 Content-Disposition을 CORS에 노출해야 합니다.
- HTTP 실패는 ApiError.status와 공통 안내 문구로 전달합니다. 오류 JSON 계약은 아직 반영하지 않았습니다. 네트워크 실패와 취소는 fetch 오류 그대로 전달합니다.
- signal로 AbortSignal을 넘깁니다. 인증 방식과 쿠키 정책은 미확정이며 임의 토큰을 넣지 않았습니다.

아래는 이후 서비스에서 쓸 호출 예시입니다. 현재 화면에는 연결하지 않았습니다.

```js
const form = new FormData()
form.append('kind', 'manual')
form.append('file', selectedFile)
await apiRequest(`tasks/${taskId}/materials`, { method: 'POST', body: form })

// 이번 작업의 파일은 별도 경로, kind 없이 file을 전송하는 예시입니다.
const jobForm = new FormData()
jobForm.append('file', selectedFile)
await apiRequest(`jobs/${jobId}/files`, { method: 'POST', body: jobForm })

const response = await apiRequest(`jobs/${jobId}/result/download`, {
  responseType: 'response',
})
const blob = await response.blob()
const disposition = response.headers.get('Content-Disposition')
// 이후 내려받기 UI에서 헤더의 파일명/형식과 파일명 안전 처리를 적용합니다.
```

## 트래커의 요청·응답 예시

경로의 {id}는 해당 리소스의 ID입니다. tasks는 taskId, analyses는 analysisId, analysis-items는 itemId, practices는 practiceId, cards는 cardId, jobs는 jobId입니다. materials와 job-files도 별도 파일 ID입니다. 서로 대신 쓰지 않습니다. 응답 열은 예시의 최상위 키 요약이며 필수/선택 여부를 확정한 스키마가 아닙니다.

### 홈과 기준 자료

| 작업                                                                           | 메서드와 경로                           | 요청 예시                                                        | 성공 응답 예시 키                                 |
| ------------------------------------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| [홈 대시보드 조회](https://app.notion.com/41d3a23d4c0e83d0ab8f8118925af81d)    | `GET /api/v1/home`                      | 요청 본문 없음.                                                  | `resumeJobs, tasks, recentCards`                  |
| [업무 등록](https://app.notion.com/f0a3a23d4c0e82fb8a220122291e7ed2)           | `POST /api/v1/tasks`                    | `{"name":"재고 관리","description":"입고 절차 변경 학습"}`       | `id, name`                                        |
| [업무 상세 조회](https://app.notion.com/e523a23d4c0e8307becc012fc1e1168a)      | `GET /api/v1/tasks/1`                   | 요청 본문 없음.                                                  | `id, name, materials, learningStatus, recentJobs` |
| [업무 자료 업로드](https://app.notion.com/0713a23d4c0e82c7839c01da24c4487e)    | `POST /api/v1/tasks/1/materials`        | multipart/form-data / kind=manual, file=입고.pdf (파일 바이너리) | `id, kind, filename, status`                      |
| [업무 자료 목록 조회](https://app.notion.com/a1c3a23d4c0e831b984e010b50c7805b) | `GET /api/v1/tasks/1/materials`         | 요청 본문 없음.                                                  | `items`                                           |
| [업무 자료 삭제](https://app.notion.com/3883a23d4c0e82f28f5b0101b5f84ee2)      | `DELETE /api/v1/materials/11`           | 요청 본문 없음.                                                  | 204 / 본문 없음                                   |
| [예시 자료 불러오기](https://app.notion.com/30a3a23d4c0e8298878d01f56aa37001)  | `POST /api/v1/tasks/1/sample-materials` | `{"scenario":"inventory"}`                                       | `materials`                                       |

### 분석과 학습

| 작업                                                                         | 메서드와 경로                       | 요청 예시                                                             | 성공 응답 예시 키                                                    |
| ---------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [업무 절차 분석](https://app.notion.com/50a3a23d4c0e835fb292814b325c9027)    | `POST /api/v1/tasks/1/analyses`     | `{"materialIds":[10,11]}`                                             | `analysisId, items`                                                  |
| [절차 비교표 조회](https://app.notion.com/eb03a23d4c0e837c9e32815a07cb2a0d)  | `GET /api/v1/analyses/20`           | 요청 본문 없음.                                                       | `analysisId, items`                                                  |
| [비교 항목 수정](https://app.notion.com/40e3a23d4c0e82e2b18a81a784c6a829)    | `PATCH /api/v1/analysis-items/21`   | `{"after":"수량 입력 후 대조","confirmed":true}`                      | `id, step, before, after, change, requiredFields, source, confirmed` |
| [분석 검토 완료](https://app.notion.com/fe13a23d4c0e822eba2a8181d34e7d92)    | `POST /api/v1/analyses/20/confirm`  | `{"confirmedItemIds":[21]}`                                           | `analysisId, confirmedItemIds, unconfirmedItemIds`                   |
| [업무 연습 시작](https://app.notion.com/9403a23d4c0e828d868c81e7a3394d05)    | `POST /api/v1/tasks/1/practices`    | `{"analysisId":20}`                                                   | `practiceId, questions`                                              |
| [연습 답안 제출](https://app.notion.com/5f93a23d4c0e83f6b9a3010d52df8744)    | `POST /api/v1/practices/30/answers` | `{"questionId":31,"optionId":1,"reason":"원본 수량과 대조하기 위해"}` | `questionId, recorded, followUp`                                     |
| [학습 결과 조회](https://app.notion.com/3f83a23d4c0e83928b9501a314e64475)    | `GET /api/v1/practices/30/result`   | 요청 본문 없음.                                                       | `practiceId, answers`                                                |
| [AI 업무 질문](https://app.notion.com/8163a23d4c0e8389abcc01e48441c344)      | `POST /api/v1/tasks/1/questions`    | `{"question":"입고 시 무엇을 먼저 확인해?"}`                          | `answer, sources, needsReview`                                       |
| [내 학습 기록 조회](https://app.notion.com/6143a23d4c0e82aaa22d0144dbb596f9) | `GET /api/v1/me/learning-history`   | 요청 본문 없음.                                                       | `practices, questions, cardIds`                                      |

### 개인 업무 카드

| 작업                                                                           | 메서드와 경로                       | 요청 예시                                                   | 성공 응답 예시 키                                                            |
| ------------------------------------------------------------------------------ | ----------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [업무 카드 생성](https://app.notion.com/7a43a23d4c0e82efbc7b01c744611c23)      | `POST /api/v1/cards`                | `{"taskId":1,"title":"입고 수량 확인","analysisItemId":21}` | `id, taskId, title, analysisItemId`                                          |
| [업무 카드 목록·검색](https://app.notion.com/2ee3a23d4c0e83d1b70801aed7f36ec3) | `GET /api/v1/cards?taskId=1&q=입고` | 요청 본문 없음.                                             | `items`                                                                      |
| [업무 카드 상세 조회](https://app.notion.com/1f33a23d4c0e82f093f70113c8032f57) | `GET /api/v1/cards/51`              | 요청 본문 없음.                                             | `id, taskId, title, situation, steps, cautions, exceptions, pending, source` |
| [업무 카드 수정](https://app.notion.com/1fb3a23d4c0e8335a07101f18d938428)      | `PATCH /api/v1/cards/51`            | `{"title":"입고 수량 대조"}`                                | `id, taskId, title`                                                          |
| [업무 카드 삭제](https://app.notion.com/a383a23d4c0e8275bbb2817c14ea0936)      | `DELETE /api/v1/cards/51`           | 요청 본문 없음.                                             | 204 / 본문 없음                                                              |

### 이번 작업

| 작업                                                                               | 메서드와 경로                                | 요청 예시                                                                          | 성공 응답 예시 키                                             |
| ---------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [작업 시작](https://app.notion.com/0aa3a23d4c0e83debcb00157cd4344c4)               | `POST /api/v1/tasks/1/jobs`                  | `{"name":"오늘 입고","description":"오전 입고분"}`                                 | `id, taskId, name, status`                                    |
| [작업 자료 업로드](https://app.notion.com/3f43a23d4c0e835a85bb0184a7a30f5a)        | `POST /api/v1/jobs/61/files`                 | multipart/form-data / file=입고표.pdf (파일 바이너리)                              | `id, filename`                                                |
| [작업 자료 삭제](https://app.notion.com/db03a23d4c0e822fb7f3019b8e62dcd8)          | `DELETE /api/v1/job-files/71`                | 요청 본문 없음.                                                                    | 204 / 본문 없음                                               |
| [AI 처리 초안 생성](https://app.notion.com/8903a23d4c0e828cb6140169c9090d96)       | `POST /api/v1/jobs/61/draft`                 | `{"fileIds":[71]}`                                                                 | `jobId, fields, missing, source`                              |
| [작업 상세 조회·이어하기](https://app.notion.com/da93a23d4c0e82ff9b2d81b5e0dca679) | `GET /api/v1/jobs/61`                        | 요청 본문 없음.                                                                    | `id, taskId, name, status, files, fields, pending, lastField` |
| [초안 검토 내용 저장](https://app.notion.com/8433a23d4c0e83559d5081c8c4c27f86)     | `PATCH /api/v1/jobs/61/draft`                | `{"fields":[{"key":"quantity","value":10,"checked":true}],"lastField":"quantity"}` | `jobId, status, fields, lastField`                            |
| [작업 결과 저장](https://app.notion.com/6983a23d4c0e8210a879013e33c5d1fc)          | `POST /api/v1/jobs/61/result`                | 요청 본문 없음.                                                                    | `jobId, status, fields, pending`                              |
| [작업 내역 목록 조회](https://app.notion.com/df73a23d4c0e835c880481e5978ef7cb)     | `GET /api/v1/jobs?taskId=1&status=reviewing` | 요청 본문 없음.                                                                    | `items`                                                       |
| [작업 결과 다운로드](https://app.notion.com/fe13a23d4c0e83f789bd01c3c7f08cb0)      | `GET /api/v1/jobs/61/result/download`        | 요청 본문 없음.                                                                    | 파일 바이너리 / Content-Disposition                           |

## 기존 함수 제안과 달라진 점

함수명은 프런트엔드 제안입니다. 아래는 다음 화면을 만들 때의 연결 순서이며, 쓰지 않는 빈 함수는 추가하지 않았습니다.

- analyzeMaterials(taskId, { materialIds }): 업무명으로 등록하는 함수가 아닙니다. 먼저 업무 등록으로 받은 taskId에 자료를 업로드합니다. 분석 응답의 analysisId와 각 items[].id를 따로 보관합니다.
- updateComparison(itemId, { after, confirmed }): 비교 항목별 PATCH입니다. 검토 완료는 별도 analyses/{analysisId}/confirm 요청입니다.
- 기존 getPractice() 제안은 새 연습을 만드는 POST이므로 startPractice(taskId, { analysisId })로 구분합니다. 답안은 questionId, optionId, reason을 보내며 결과 조회는 별도 GET입니다. 선택 이유 재제출은 같은 questionId를 씁니다.
- askQuestion(taskId, { question }): 현재 예시에 conversationId가 없습니다. 답변의 sources와 needsReview를 UI로 옮깁니다.
- saveWorkCard({ taskId, title, analysisItemId }): 임의 steps/evidenceId 요청 대신 생성 예시를 따릅니다. 카드 상세의 steps, cautions, exceptions, pending, source는 조회 응답입니다.
- createWorkDraft(jobId, { fileIds }): 먼저 tasks/{taskId}/jobs로 작업을 만들고 jobs/{jobId}/files에 작업 자료를 보냅니다. 기준 자료의 materialId와 작업 자료의 fileId를 섞지 않습니다.
- 수정 값과 확인 표시는 jobs/{jobId}/draft에 PATCH하고 lastField를 보관합니다. saveWorkResult(jobId)는 **요청 본문 없이** 결과 저장 POST를 보냅니다.
- getWorkHistory()는 jobs 목록이며 me/learning-history의 학습 기록과 다릅니다. 카드 검색은 taskId/q, 작업 내역은 taskId/status 예시입니다. 검색 쿼리는 URLSearchParams로 인코딩합니다.

## 근거와 상태의 UI 연결

분석 예시의 `source: { materialId, page }`, AI 질문의 `sources: [{ materialId, page }]`와 needsReview를 기준으로 연결합니다. 현재 EvidenceCard의 source(자료명), location(위치 문구), quote(문장), verifiedByUser는 **데모 UI 전용 모델**이며 서버 응답 형식이 아닙니다.

- materialId는 자료 목록의 id와 대조해 filename을 표시합니다. page는 확인된 범위에서 위치로 표시합니다.
- 현재 예시에는 인용문 필드가 없습니다. quote를 임의 생성하거나 데모 문장을 실제 근거로 붙이지 않습니다. 관련 문장과 원본 이동 방식은 추가 합의가 필요합니다.
- confirmed는 사용자 확인 상태이며 AI 정확성 보증이 아닙니다. 사용자 수정 표시는 원래 결과와의 비교 또는 별도 수정 메타데이터가 필요합니다.
- change 예시 값은 ‘변경’입니다. 유지, 신규 확인, 미확인 등 전체 값과 UI 배지 대응은 추가 확인합니다.
- 초안 생성은 missing, 상세와 저장 결과는 pending을 씁니다. 응답 키를 하나라고 가정하지 않습니다.
- 상태 조회 예시는 한글 ‘검토 중’, 필터 예시는 reviewing이므로 같은 문자열로 재사용하지 않습니다.
- 같은 업무를 다시 처리할 때 기준 자료를 재등록하지 않습니다. 개인 업무 카드와 이번 작업 결과를 구분합니다.
- ‘결과 저장됨’은 서비스 안의 저장 상태입니다. 외부 재고 시스템 등록이나 예약 확정을 뜻하지 않습니다.

## 추가로 확인할 계약

인증과 접근 권한, 실제 호스트/CORS, 공통 오류 구조, 자료 kind 전체 값과 업로드 제한, 페이지네이션, 필드 필수/선택 여부, 상태 전체 값, AI 비동기 처리와 재시도, 근거 인용문과 원본 위치, 다운로드 파일명 인코딩을 합의해야 합니다. 성공 응답 예시만으로 완료 상태나 분석 정확성을 보장하지 않습니다. 실제 연결 실패를 예시 성공으로 바꾸지 않습니다.
