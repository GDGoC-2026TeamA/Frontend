# 1차 공통 구현과 Figma V0.4

기준 파일: https://www.figma.com/design/wX9g6gKuJztvTMWGIhtr9j

`01 · Design System`과 `03 · Components`를 2026-11-21에 확인했습니다. 이번 변경은 1차의 토큰, 공통 레이아웃과 재사용 컴포넌트입니다.

## 기존 구현에서 바꾼 부분

| Figma 기준                                                 | 코드                                   | 변경                                                                                                     |
| ---------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Color, Typography                                          | tokens.css                             | 기본 색과 Noto Sans KR 유지, 완료 배경을 #ECFDF5로 수정                                                  |
| Layout                                                     | tokens.css, foundation.css             | 업무 화면 공통 메뉴 240 → 208px, 학습 노트/공통 보조 패널 360 → 308px, 메뉴 안쪽 여백 40/20/32px         |
| WB/Onboarding/Home guide                                   | GuideDialog, HomeOnboarding            | SVG 구멍 마스크를 없애고 전체 화면 딤 한 장과 560px 안내 사용. 강조 대상은 딤 위의 inert 복사본으로 표시 |
| WB/Onboarding/First task guide                             | GuideDialog                            | 420px 안내, 24px 모서리, 좁은 화면과 긴 문구에서는 높이를 늘리고 내부 스크롤                             |
| WB/Home/Account trigger, WB/Account/Dropdown               | AccountMenu                            | 168px 계정 버튼, 288px 메뉴, 프로필/설정/로그아웃 콜백, Escape와 바깥 클릭 닫기                          |
| WB/Account/Profile form, Email form, Password action       | AccountForms                           | 이름 편집, 프로필 이메일 읽기 전용, 이메일 입력과 재설정 콜백                                            |
| WB/Feedback/Save toast                                     | SaveToast                              | 완료 메시지의 status 알림. 실제 저장 성공 뒤 메시지를 넘기는 방식                                        |
| WB/Home/Task filters                                       | TaskFilters                            | 전체, 등록 업무, 공유 업무를 선택하는 공통 버튼 그룹                                                     |
| WB/Sharing/Registration                                    | RegistrationScope                      | 내 업무로 등록 및 검토 후 공유 안내                                                                      |
| WB/Sharing/Publication, Context                            | PublicationStatus, RecordContext       | 나만 보기/공유됨/새 버전 검토 중, 등록자/버전/분석 연결과 확인 필요를 따로 표시                          |
| WB/Learning/Choice, Recommendation                         | LearningChoice, LearningRecommendation | 라디오/체크박스, 추천 이유와 근거, 직접 선택. 미확인 또는 근거 없는 항목은 선택 차단                     |
| WB/Dialog/Task edit, Sharing settings, Task delete, Logout | FoundationDialogs                      | 기존 Modal의 포커스/취소 동작을 재사용. 공유는 검토 완료가 필요하고 삭제/로그아웃은 확인 콜백만 호출     |

기존 버튼, 입력란, 체크박스, 업로드, 배지, 단계, 피드백은 기존 공통 구현을 그대로 씁니다. 재고/예약 일러스트 SVG와 화면 내용은 그대로 남깁니다.

## 확인 화면과 연결 범위

`npm.cmd run dev` 후 `/dev/components`의 **V0.4 공통 컴포넌트**에서 계정, 상태, 추천과 팝업을 조작할 수 있습니다. 이 화면은 개발 모드에서만 기본으로 열립니다. 계정 메뉴와 계정 폼은 재사용 UI이며, 현재 홈에 실제 로그인이나 계정 화면을 새로 연결한 것은 아닙니다. 예시 안내에는 서버 저장/이메일 발송을 하지 않았다고 표시합니다.

홈 전체의 한 단 재배치, 업무 목록 메뉴와 실제 계정 페이지 연결, 공유 권한/API, 추천 생성과 학습 화면 연결은 해당 차수에서 구현합니다. 1차 컴포넌트의 콜백을 해당 화면과 서버에 연결해야 합니다. UI의 reviewed/confirmed 값은 서버의 권한 검사를 대신하지 않습니다. 공유 완료여도 확인 필요 항목을 지우지 않습니다.

## 검사

검증 상태: 코드 검사와 배포 빌드는 통과했습니다. 에이전트 환경에서 브라우저 검사는 로컬 서버 연결 제한 때문에 완료하지 못했습니다. 사용자 터미널에서 아래 UI 회귀 검사를 실행한 뒤 결과를 갱신합니다.

```powershell
npm.cmd run lint
npm.cmd run build
npx.cmd playwright test tests/api-client.spec.js tests/foundation.spec.js tests/home.spec.js tests/home-api.spec.js tests/registration.spec.js tests/status-screens.spec.js tests/foundation-v04.spec.js
```

기존 25개와 V0.4 4개 UI 검사를 실행합니다. 에이전트에서 29개 검사 목록을 확인했지만 실행 통과를 뜻하지 않습니다. 에이전트에서 29개 검사 목록을 확인했지만 실행 통과를 뜻하지 않습니다. 새 검사는 계정 메뉴 키보드/초점 복귀, 서버 전송 없는 편집, 공유 상태와 확인 필요의 공존, 근거 없는 학습 선택 차단, 직접 선택, 미검토 공유 차단, 안내 반응형과 접근성을 확인합니다.

main의 `tests/workbridge-qa.spec.js`는 팀원이 추가한 서버 통합 QA입니다. 별도 로그인/API, 계정 두 개와 samples 자료, `/home`, `/learn/inventory`, `/process/inventory`, `/storage` 화면이 필요하며 기본 주소는 `localhost:3000`입니다. 이번 UI 검사에서 이 파일을 실행하거나 통과했다고 기록하지 않습니다. 원본 파일도 바꾸지 않습니다. 서버 통합 준비 후 `BASE_URL`을 지정해 별도로 실행해야 합니다.

## GitHub 전달

새 기능 이슈에 담당자와 완료 조건을 적고, 최신 main에서 `feat/#이슈번호` 브랜치를 만듭니다. 기능, 디자인, 테스트, 문서는 목적별 태그 커밋으로 나눕니다. main 대상 PR 제목은 `[feat/#번호] 디자인 시스템 V0.4와 1차 공통 컴포넌트 동기화`이며 변경 이유, 리뷰 사항, UI 캡처와 `close #번호`를 넣습니다. 기존/새 절차 비교 캡처도 함께 둡니다. 업로드 보조 파일은 저장소에 넣지 않습니다. 리뷰와 승인, 병합은 팀원이 확인한 뒤 합니다.
