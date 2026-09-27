# 작업 목록

한 단계를 끝내면 `[x]`로 체크하고 git commit 한다. 순서대로 진행하는 것을 기본으로 한다.

## 0. 프로젝트 준비
- [x] CLAUDE.md, docs/ 문서, .claude 에이전트·스킬·훅
- [x] 데이터 검사기 `scripts/validate-graph.mjs`
- [x] 경로 엔진 핵심(`src/routing/`) + 가상 데이터 테스트

## 1. 도면 수집 (사용자)
- [x] 층 평면도 5장을 `floorplans/`에 `B1F.png` `1F.png` `2F.png` `3F.png` `4F.png`로 넣기 (floorplans/README.md)
- [x] 관별로 실제 있는 층 목록 확정 → docs/DATA_MODEL.md에 기록 (도면 기준, 현장 확인 전)
- [ ] 네이버 지도 참고 스크린샷을 `docs/reference/`에 넣기

## 2. 층 데이터화 (`/digitize-floor`, floorplan-digitizer 에이전트)
- [x] 1F (입구가 있는 층부터)
- [x] 2F
- [x] 3F
- [x] 4F
- [x] B1 (계단·EV가 1F와 짝지어지지 않아 지하 출구로만 들어감)
- [x] 층 사이 계단·엘리베이터 group 이름 맞추기 (같은 칸 줄로 분명한 것만)
- [ ] 축척 실측 (지금은 임시값: 복도 폭 2.7m 가정, 1F~4F 0.06, B1 0.045 m/px)
- [ ] 각 파일 unknown 목록 현장 확인 (모두 136개)
- [ ] 관 사이 연결 복도 확인
- [ ] 5남관 가운데 계단의 반 층 구조를 확인하고 DATA_MODEL.md 표 채우기
- [ ] 입구 위경도(`geo`) 입력

## 3. 경로 검증 (route-auditor 에이전트, `/check-route`)
- [ ] 관마다 대표 경로 5개 이상을 사람이 보고 확인
- [ ] 연결이 끊긴 곳이나 이상한 우회가 있으면 데이터 수정

## 4. 앱 기본
- [x] Expo(TypeScript) 앱 초기화, 기존 `src/routing` 연결, `npm test` 유지
- [x] 웹 앱으로 전환 (Vite + React, Leaflet 실외 지도, react-router)
- [x] 층 데이터 묶음 생성 스크립트(`scripts/build-data.mjs` → `src/data/generated.ts`)
- [x] 방 검색(호수·관·이름·별칭)
- [x] 데이터가 없을 때 데모 모드(가상 데이터 + 화면에 데모 표시)

## 5. 화면 (docs/UI_GUIDE.md, ui-reviewer 에이전트)
- [x] S1 홈 (실외 지도 + 검색창)
- [x] S2 검색
- [x] S3 경로 목록 (카드 여러 장)
- [x] S4 경로 상세 (경로선 + 단계별 안내)
- [x] S5 내비 (평면도 2D, 층 선택, 배너, 단계별 층 자동 전환)
- [x] S6 도착
- [ ] 휴대폰 브라우저에서 화면 확인 (사용자)
- [ ] 평면도 두 손가락 확대·이동 (포인터 이벤트)
- [ ] 실제 도면 이미지 위에 경로선이 맞게 그려지는지 확인 (층 데이터화 후)
- [ ] HTTPS 정적 호스팅에 배포 (GitHub Pages·Netlify 등, `npm run build` 결과 `dist/`)

## 6. 위치 (docs/LOCATION.md)
- [ ] GPS 출발지 자동 입력
- [ ] 입구 도착 시 실내 모드 전환
- [ ] 단계 수동 진행 다듬기 ("3F에 도착했나요?" 확인 버튼)
- [ ] (선택) DeviceMotion 가속도로 걸음 추정해 경로 진행
- [ ] 경로 이탈 감지와 다시 탐색

## 7. 현장 테스트·보정
- [ ] 계단 칸 수, 층 높이, 보폭 실제 측정 → ROUTING.md·LOCATION.md 갱신
- [ ] 휴대폰 브라우저(Android Chrome·iOS Safari)에서 처음부터 끝까지 안내 테스트
