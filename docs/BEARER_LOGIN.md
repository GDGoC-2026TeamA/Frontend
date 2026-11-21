# Railway 아이디 로그인 연결

## 원인과 변경

2026-11-21에 배포 서버 OpenAPI와 Backend main `2b9bcab4118421ecc409dbc2bbc236915a931a2e`의 인증 코드를 확인했습니다. 이전 프론트엔드는 이메일 로그인과 `{ user }` 쿠키 세션을 기대했지만, 현재 서버는 `login_id`와 Bearer 토큰을 씁니다.

| 동작      | 현재 서버 계약                                                               | 프론트엔드 동작                                                  |
| --------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 가입      | POST `/api/v1/accounts`, `{ name, login_id, email, password }`, 201 `{ id }` | 가입 완료 뒤 아이디를 채운 로그인 화면으로 이동                  |
| 로그인    | POST `/api/v1/sessions`, `{ login_id, password }`, 200 `{ token }`           | 토큰을 탭의 sessionStorage에 보관                                |
| 인증 확인 | GET `/api/v1/workspaces`, `Authorization: Bearer <token>`                    | 새로고침 뒤 보호된 읽기가 성공해야 내부 화면 표시                |
| 홈        | GET `/api/v1/home?workspaceId=...`                                           | 개인 공간 우선 선택, `continueJobs`를 화면의 이어서 할 일에 연결 |
| 로그아웃  | 서버 폐기 API 없음                                                           | 이 탭의 토큰과 계정 및 작업 상태 삭제                            |

가입할 때 정한 **아이디**로 로그인합니다. 이메일로 대신 로그인할 수 없습니다. 서버는 아이디의 대소문자를 구분하지 않습니다. 이름과 이메일을 돌려주는 프로필 조회 API는 없어서 로그인한 아이디만 표시하며, 사용자 ID나 프로필을 서버가 확인한 값처럼 표시하지 않습니다. 프론트엔드 내부 계정 키는 화면 상태용 `login:아이디`이며 서버 사용자 ID로 전송하지 않습니다.

## 설정

실제 서버에 연결할 개발 또는 배포 환경에 아래 값을 넣고 Vite를 다시 시작하거나 다시 빌드합니다. `.env.example` 자체를 수정해도 실행 중인 서버나 배포 결과는 바뀌지 않습니다.

```dotenv
VITE_DATA_MODE=api
VITE_API_BASE_URL=https://gdgoc2026a.up.railway.app/api/v1
VITE_AUTH_SESSION_PATH=
```

`VITE_AUTH_SESSION_PATH`는 비워 둡니다. 이 값이 채워져 있으면 기존 `{ user }` 쿠키 어댑터를 선택합니다. Railway 연결에서는 다른 `VITE_AUTH_*_PATH` 값도 비워 두세요. 기본 demo 모드는 기존 화면 예시이며 실제 서버 계정을 만들지 않습니다. demo에서 입력한 정보로 실제 서버에 로그인할 수 없습니다.

토큰은 서버 주소와 함께 탭의 sessionStorage에 보관하며 비밀번호는 보관하지 않습니다. 브라우저 저장소는 서버 인증을 대신하지 않습니다. 서버가 토큰을 거절하면 내부 화면을 막고 로그인 정보를 지웁니다. 서버 오류는 미인증으로 바꾸지 않고 재시도를 표시합니다. Bearer 요청은 쿠키를 보내지 않으며, 업로드와 다운로드에도 같은 인증 헤더를 붙입니다.

현재 백엔드에는 토큰 폐기 API가 없습니다. 로그아웃은 현재 탭에서만 적용되며 이미 복사되거나 다른 탭에 남은 토큰을 서버에서 폐기하지 못합니다. 서버 코드는 토큰을 발급 후 8시간까지 허용합니다. 프로필 변경, 비밀번호 재설정과 소셜 로그인은 이번 연결 범위에 없습니다.

## 근거

- [배포 서버 OpenAPI](https://gdgoc2026a.up.railway.app/openapi.json)
- [서버 인증 요청 형식](https://github.com/GDGoC-2026TeamA/Backend/blob/2b9bcab4118421ecc409dbc2bbc236915a931a2e/app/schemas/auth.py)
- [토큰 발급과 가입 응답](https://github.com/GDGoC-2026TeamA/Backend/blob/2b9bcab4118421ecc409dbc2bbc236915a931a2e/app/services/auth.py)
- [Bearer 전용 CORS 설정](https://github.com/GDGoC-2026TeamA/Backend/blob/2b9bcab4118421ecc409dbc2bbc236915a931a2e/main.py)

## 검사

- lint와 demo 및 API 빌드 확인
- 모델 검사 18개 통과: 서버 요청 본문, 토큰 전용 응답, Bearer 헤더, 쿠키 제외, 비밀번호 미저장, 잘못된 로그인, 위조 토큰의 서버 확인, 401과 서버 실패, 로그아웃 및 기존 예시/쿠키 회귀 검사
- `tests/bearer-login.spec.js` 추가: 가입부터 로그인, 홈, 새로고침, 로그아웃, 실패 후 재시도와 만료 흐름
- 이 실행 환경에서는 Chromium이 `socket() failed: Operation not permitted`로 시작하지 않아 브라우저 검사 13개가 실행 전 실패했습니다. UI 검사 통과나 실제 계정으로 운영 서버 로그인 성공을 주장하지 않습니다. 운영 서버에 테스트 계정을 만들지 않았습니다.

브라우저가 실행되는 환경에서 다음 검사를 실행하세요.

```bash
npm ci
npm run lint
npm run build
node --experimental-vm-modules --test checks/*.test.mjs
npx playwright test tests/bearer-login.spec.js tests/session-flow.spec.js tests/session-api.spec.js tests/final-api.spec.js
```
