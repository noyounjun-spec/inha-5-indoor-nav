---
name: digitize-floor
description: 5호관 층 평면도 한 장(floorplans/{층}.png, 네 관이 모두 들어 있음)을 관별 data/floors/{관}-{층}.json 파일로 옮긴다. "2F 데이터화", "평면도 넣어줘", "층 데이터 만들어줘" 같은 요청에 사용.
---

# 층 데이터화

인자: 층 코드(`B1`, `1F`, `2F`, `3F`, `4F`). 없으면 `floorplans/`에서 아직 데이터화하지 않은 층을 찾아 보여 주고 고르게 한다.

1. `floorplans/{층}.*`가 있는지 확인한다. 없으면 멈추고 사용자에게 도면을 요청한다.
2. **floorplan-digitizer** 에이전트에 맡긴다. 전달할 것:
   - 도면 경로와 층 코드
   - 만들 파일: `data/floors/{5N,5W,5S,5E}-{층}.json` (그 층에 실제로 있는 관만)
   - 이미 만든 다른 층 파일 목록(계단·엘리베이터 group 이름을 맞추기 위해)
3. 에이전트가 끝나면 직접 확인한다.
   - `node scripts/validate-graph.mjs`가 통과하는지(데이터를 고치면 훅이 자동으로 돌리지만 한 번 더 돌린다)
   - 관 경계를 어떻게 나눴는지, `unknown` 목록이 무엇인지 사용자에게 그대로 보여 준다
4. 대표 경로 1~2개를 `node scripts/route.ts`로 돌려 결과를 보여 준다.
5. docs/TASKS.md에서 해당 층을 체크하고 커밋한다: `git add data/floors docs/TASKS.md && git commit -m "data: {층} 데이터화"`
