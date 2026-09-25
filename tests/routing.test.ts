import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph, findRoutes, stairTreads, DEFAULT_TREADS_PER_LEVEL } from '../src/routing/index.ts';
import { loadFloors } from '../scripts/load-floors.ts';

// tests/fixtures/mini 는 가상 데이터다 (실제 5호관 아님)
const g = buildGraph(loadFloors('tests/fixtures/mini'));
const entrance = { kind: 'node', id: '5S-1F-N01' } as const;

test('최소 걸음은 엘리베이터, 계단 이용은 계단 경로', () => {
  const routes = findRoutes(g, entrance, { kind: 'room', id: '5S-2F-201' });
  assert.equal(routes.length, 2);
  const [minSteps, stairs] = routes;
  assert.deepEqual(minSteps.profiles, ['min-steps', 'no-stairs']);
  assert.ok(minSteps.edges.some((e) => e.kind === 'elevator'));
  assert.equal(minSteps.steps, 65); // 평지 45.83m / 0.7
  assert.deepEqual(stairs.profiles, ['fastest', 'stairs-only']);
  assert.equal(stairs.steps, 85); // 45.83m / 0.7 + 20계단
  assert.ok(stairs.seconds < minSteps.seconds);
});

test('계단 칸 수를 모르면 기본값 × 높이 차 (반 층이면 절반)', () => {
  const lo = { ...g.nodes.get('5S-1F-N04')!, treadsToNextUp: undefined };
  const half = { ...g.nodes.get('5S-2F-N01')!, level: 1.5 };
  assert.equal(stairTreads(lo, half), DEFAULT_TREADS_PER_LEVEL * 0.5);
});

test('단계별 안내: 회전 방향과 층 이동', () => {
  const [, stairs] = findRoutes(g, entrance, { kind: 'room', id: '5S-2F-201' });
  assert.deepEqual(
    stairs.instructions.map((i) => i.type),
    ['straight', 'right', 'stair-up', 'straight', 'left', 'arrive'],
  );
  const up = stairs.instructions[2];
  assert.equal(up.text, '계단으로 1F→2F 올라가기 (20계단)');
  assert.equal(stairs.instructions[3].floor, '2F');
});

test('GPS 출발은 입구까지 실외 구간을 붙인다', () => {
  const [r] = findRoutes(g, { kind: 'geo', geo: { lat: 37.4501, lng: 126.6571 } }, { kind: 'room', id: '5S-2F-202' });
  assert.equal(r.edges[0].kind, 'outdoor');
  assert.equal(r.instructions[0].text, '5남관 입구(1F)까지 이동');
});

test('방에서 방으로, 없는 방은 오류', () => {
  const routes = findRoutes(g, { kind: 'room', id: '5S-1F-101' }, { kind: 'room', id: '5S-2F-202' });
  assert.ok(routes.length >= 1);
  assert.throws(() => findRoutes(g, entrance, { kind: 'room', id: '5S-9F-999' }));
});
