# 화면 자산 출처

- `icons/home-outline.svg`: 수정된 홈 프레임 `47:3523`의 `45:4738`, akar-icons Home 벡터. 23px 영역 안에서 원본 19.25×19.48px로 표시합니다.
- `icons/work-card.svg`: 같은 홈의 `45:4756`, boxicons Card view 벡터. 원본 24×24px로 표시합니다.
- `icons/history-outline.svg`: 같은 홈의 `45:4765`, icon-park Time 벡터. 24px 영역 안에서 원본 22×22px로 표시합니다.
- `icons/book-open.png`: 같은 파일의 `10:399`, 업무 화면 도움말의 Book open 아이콘을 그대로 내보낸 PNG. 도움말에서 24px로 표시합니다. 리디자인 홈 도움말에는 아이콘이 없습니다.
- 원본 파일 키: `wX9g6gKuJztvTMWGIhtr9j`. 내보낸 파일에 임시 다운로드 URL을 남기지 않았습니다.
- 다른 조작 아이콘: `lucide-react` 패키지. npm 설치로 포함하며 별도 원격 요청은 없습니다.
- Noto Sans KR: `@fontsource-variable/noto-sans-kr` 패키지. 글꼴 라이선스는 해당 패키지의 LICENSE를 따릅니다.

화면 전체 캡처를 구현 자산으로 쓰지 않습니다. 메뉴 로고와 업무 화면은 React와 CSS로 만듭니다.

## 홈 섹션 97:532 원본 자산

`home/`의 SVG는 프레임 `97:533`과 검색 결과 `97:827`의 디자인 컨텍스트에서 내려받았습니다.

| 파일                                                    | 디자인 슬롯                             | 표시 크기                   |
| ------------------------------------------------------- | --------------------------------------- | --------------------------- |
| inventory.svg                                           | 재고 업무 카드의 입고 일러스트 (46:150) | 원본 344×194                |
| reservation.svg                                         | 예약 업무 카드의 예약 일러스트 (46:180) | 원본 344×194                |
| home.svg                                                | 메뉴의 Home 벡터                        | 원본 19.25×19.48, 23px 슬롯 |
| history.svg                                             | 메뉴의 Time 벡터                        | 원본 22×22, 24px 슬롯       |
| work-card.svg                                           | 메뉴와 저장 카드의 Card view            | 원본 24×24                  |
| status-blue.svg, status-warning.svg, status-success.svg | 홈 업무와 최근 작업의 상태 점           | 원본 5×5                    |
| plus.svg                                                | 개인 업무 카드 전체 보기                | 원본 15×15                  |
| chevron.svg                                             | 절차 보기 링크                          | 원본 16×16                  |
| search-clear.svg, search-chevron.svg                    | 검색 지우기와 결과 열기                 | 원본 16×16                  |

일러스트는 원본 크기 그대로 가운데에 놓고 좁은 카드에서는 가장자리를 잘라 표시합니다. SVG 내용을 다시 그리거나 전체 화면 이미지를 쓰지 않았습니다.

Code Connect의 `icons` import와 Simple Design System 아이콘 패키지는 현재 의존성에 없습니다. 해당 아이콘 호출 위치에는 기존 lucide-react의 Search, Home, BookOpen, ArrowRight, FileText, MessageCircle을 `DesignIcons.jsx`에서 연결했습니다. 임시 피그마 URL은 실행 코드에 남기지 않았습니다.
