# 5호관 실내 길찾기 앱

인하대 5호관(5북·5서·5남·5동, B1~4F) 안에서 최소 걸음 수로 길을 안내하는 앱.
UI 구성은 네이버 지도 도보 길찾기를 참고하되, 로고·아이콘·브랜드 색은 복제하지 않는다.

## 기술
- 웹 앱: Vite + React + TypeScript. 층 지도는 SVG, 실외 지도는 Leaflet(OpenStreetMap), 화면 이동은 react-router(HashRouter)
- 실행: `npm run dev` (브라우저에서 http://localhost:5173) · 배포용 빌드: `npm run build` → `dist/` (정적 호스팅에 그대로 올린다) · 타입 검사: `npm run typecheck`
- 휴대폰에서 GPS를 쓰려면 HTTPS 주소여야 한다(localhost는 예외)
- 테스트: `npm test` / 그래프 검사: `node scripts/validate-graph.mjs`
- 층 데이터를 바꾸면 `npm run data`로 `src/data/generated.ts`를 다시 만든다 (`npm run dev`·`npm run build`가 자동 실행). 데이터가 없으면 앱은 데모 모드
- 경로 확인: `node scripts/route.ts <출발> <도착>` (방 ID·노드 ID·`geo:위도,경도`)
- 관 코드: 5N=5북, 5W=5서, 5S=5남, 5E=5동

## 반드시 지킬 규칙
- 호수는 관마다 따로 매긴다. 방 ID는 항상 "관-층-호수" 형식 (예: 5S-2F-234)
- 도면에 없는 방·복도는 추측해서 만들지 말고 data/floors/*.json의 "unknown" 목록에 넣는다
- 길찾기 비용의 단위는 "걸음". 계산식은 docs/ROUTING.md만 따른다
- 5남관 가운데 계단은 반 층 어긋난 구조다(docs/DATA_MODEL.md 참고)
- 데이터(json)를 고치면 반드시 validate-graph를 실행한다
- 한 단계를 끝내면 docs/TASKS.md에 체크하고 git commit

## 폴더
- `floorplans/` 평면도 원본(층마다 1장: B1F·1F·2F·3F·4F.png) · `data/floors/` 층 그래프(json, 관별로 나눔) · `tests/fixtures/` 테스트용 가상 데이터(실제 도면 아님)
- `src/routing/` 경로 엔진(걸음·시간 계산은 여기서만) · `scripts/` 검사기와 CLI
- `index.html`·`src/main.tsx` 시작점과 라우트 · `src/screens/` 화면(home=S1, search=S2, routes=S3, route-detail=S4, navigate=S5, arrive=S6) · `src/ui/` 부품, 색 토큰(theme.ts), 스타일(styles.css) · `src/lib/` 검색·형식·요약 · `src/data/` 앱용 데이터

## Claude 도구 (.claude/)
- 스킬: `/next-task` 다음 작업 진행 · `/digitize-floor 2F` 도면 데이터화 · `/check-route` 경로 확인
- 에이전트: `floorplan-digitizer` 도면→json · `route-auditor` 데이터·경로 검수 · `ui-reviewer` 화면 검수
- 훅: data/floors/*.json을 고치면 validate-graph가 자동 실행된다

## 참고 문서 (필요할 때 읽기)
- 기능: docs/SPEC.md · 데이터: docs/DATA_MODEL.md · 경로: docs/ROUTING.md
- 위치 추정: docs/LOCATION.md · 화면: docs/UI_GUIDE.md · 진행: docs/TASKS.md
