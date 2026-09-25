---
name: digitize-floor
description: 5호관 평면도 한 장(floorplans/{관}-{층}.png)을 data/floors/{관}-{층}.json으로 옮긴다. "5S-2F 데이터화", "평면도 넣어줘", "층 데이터 만들어줘" 같은 요청에 사용.
---

# 층 데이터화

인자: `{관}-{층}` (예: `5S-2F`). 없으면 `floorplans/`에서 아직 `data/floors/`에 없는 파일을 찾아 보여 주고 고르게 한다.

1. `floorplans/{관}-{층}.*`가 있는지 확인한다. 없으면 멈추고 사용자에게 도면을 요청한다.
2. **floorplan-digitizer** 에이전트에 맡긴다. 전달할 것: 도면 경로, 대상 파일 이름, 이미 있는 이웃 층·관 파일 목록(관 사이·층 사이 연결 확인용).
3. 에이전트가 끝나면 직접 확인한다.
   - `node scripts/validate-graph.mjs`가 통과하는지(데이터 수정 시 훅이 자동으로 돌리지만 한 번 더 돌린다)
   - `unknown` 목록을 사용자에게 그대로 보여 준다
4. 대표 경로 1~2개를 `node scripts/route.ts`로 돌려 결과를 보여 준다.
5. docs/TASKS.md에서 해당 항목을 체크하고 커밋한다: `git add data/floors docs/TASKS.md && git commit -m "data: {관}-{층} 데이터화"`
   (한 관의 모든 층이 끝났을 때만 관 항목을 체크한다.)
