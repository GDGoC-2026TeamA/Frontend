# 프론트 기능 연동 점검

프론트 main 689c680과 백엔드 develop d8c9fa9의 API 모드를 기준으로 화면의 서비스 호출과 서버 계약을 대조했다. 데모 데이터와 모의 HTTP 응답을 사용하는 테스트만으로 운영 연동을 판정할 수 없는 항목도 포함한다.

| 화면 | 확인한 동작 | 남은 작업 |
|---|---|---|
| 로그인·계정 | 아이디 로그인과 가입은 Bearer 어댑터를 사용한다. 이번 변경은 Google·카카오를 연결한다. | 이메일 로그인 API는 있지만 기본 폼은 login_id만 받는다. Bearer 모드의 프로필·이메일 변경과 비밀번호 재설정은 미연결이다. 로그아웃은 탭의 토큰을 제거하며 서버 세션을 폐기하는 API는 없다. |
| 홈·업무 공간 | 홈은 개인 workspaceId로 데이터를 조회한다. 검색은 받아온 업무와 최근 카드 범위에서 수행한다. | 회사 공간 선택·생성·초대·가입 화면이 없다. |
| 업무 등록·공유 | 자료 선택, 예시 비교, 수정·공유 미리보기가 있다. | 실제 파일 등록·분석·검토·공유 호출을 연결해야 한다. WorkRegistration의 저장·공유는 API 모드에서 차단하고 TaskManagementDialog도 서버 수정·삭제를 수행하지 않는다. |
| 학습 | 업무 상세와 AI 질문을 호출한다. | learning-guide·practices·answers·result 및 학습 이력 API를 화면에 연결해야 한다. API 스냅샷의 confirmedTopicIds는 빈 배열이다. 질문 출처도 프론트의 materialId/page와 서버의 fileId/location 사이 변환이 필요하다. |
| 실제 작업 | 작업 생성·첨부·초안·검토·저장·다운로드 서비스 함수가 있다. | 작업 생성 시 서버 필수 analysisId가 누락된다. 서버 저장 상태 saved와 프론트의 ‘결과 저장됨’ 비교도 일치시켜야 한다. 현재는 맨 처음 작업 생성에서 422가 발생할 수 있다. |
| 카드·이력 | 목록·카드 상세·이름 수정 화면이 있다. | getCollection은 {items}를 기대하지만 서버는 배열을 반환한다. 카드 상세는 taskId·steps를 요구하지만 서버는 analysis_id·item_id·overrides를 반환한다. 카드 생성은 데모 전용이고 삭제 API도 화면에 연결되지 않았다. |

## 소셜 로그인 연결

운영 프론트는 VITE_DATA_MODE=api, VITE_API_BASE_URL=<백엔드 HTTPS 주소>/api/v1을 사용한다. Bearer 모드에서는 VITE_AUTH_SESSION_PATH를 비워 둔다. 두 소셜 시작 주소는 기본적으로 API 기준 경로 아래에서 계산한다. 공급자 키와 비밀값은 백엔드에만 설정한다.

백엔드는 SOCIAL_FRONTEND_CALLBACK_URL에 등록한 정확한 프론트 주소(예: https://frontend.example.com/auth/callback)로 브라우저를 돌려보낸다. 프론트는 2분짜리 일회용 코드와 시작 탭에 보관한 검증값을 POST /sessions/social/exchange로 보내 세션을 받는다. 프론트 호스팅에서 /auth/callback 직접 접근이 SPA로 연결되어야 한다.
