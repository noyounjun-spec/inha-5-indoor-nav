import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph, findRoutes, type FloorFile } from '../src/routing/index.ts';
import { formatDistance, formatDuration, formatSteps } from '../src/lib/format.ts';
import { resolvePlace, placeLabel, MAX_GPS_START_M } from '../src/lib/places.ts';
import { buildSearchIndex, search } from '../src/lib/search.ts';
import { routeSegments, floorChangeText, routeFloors, entranceLabel, remaining } from '../src/lib/routeSummary.ts';
import { loadFloors } from '../scripts/load-floors.ts';

// tests/fixtures/mini 는 가상 데이터다 (실제 5호관 아님)
const mini = buildGraph(loadFloors('tests/fixtures/mini'));

// 같은 호수가 여러 관에 있는 상황 (가상)
const floor = (building: FloorFile['building'], rooms: FloorFile['rooms']): FloorFile => ({
  building,
  floor: '1F',
  level: 1,
  metersPerUnit: 1,
  nodes: rooms.map((r, i) => ({ id: r.doors[0], type: 'door' as const, x: i, y: 0 })),
  rooms,
  edges: [],
  unknown: [],
});
const multi = buildGraph([
  floor('5N', [{ id: '5N-1F-137', name: '137호', doors: ['5N-1F-N1'] }]),
  floor('5S', [
    { id: '5S-1F-137', name: '137호', doors: ['5S-1F-N1'] },
    { id: '5S-1F-1370', name: '1370호', doors: ['5S-1F-N2'] },
    { id: '5S-1F-006', name: '선형수조실험실', aliases: ['수조실'], doors: ['5S-1F-N3'] },
  ]),
]);

test('숫자 형식', () => {
  assert.equal(formatDuration(20), '1분');
  assert.equal(formatDuration(245), '4분');
  assert.equal(formatDuration(3900), '1시간 5분');
  assert.equal(formatDistance(220.4), '220m');
  assert.equal(formatDistance(1530), '1.5km');
  assert.equal(formatSteps(1312), '1,312걸음');
});

test('검색: 호수, 관+호수, 이름·별칭', () => {
  const idx = buildSearchIndex(multi);
  assert.deepEqual(search(idx, '137').map((i) => i.id).slice(0, 2), ['5N-1F-137', '5S-1F-137']);
  assert.deepEqual(search(idx, '5남 137호').map((i) => i.id), ['5S-1F-137', '5S-1F-1370']);
  assert.deepEqual(search(idx, '5S-137').map((i) => i.id)[0], '5S-1F-137');
  assert.deepEqual(search(idx, '수조').map((i) => i.id), ['5S-1F-006']);
  assert.deepEqual(search(idx, '  '), []);
});

test('내 위치: 가까우면 GPS 출발, 멀거나 없으면 입구 출발 + 안내', () => {
  const near = resolvePlace(mini, 'me', { lat: 37.4501, lng: 126.6571 });
  assert.equal(near.place.kind, 'geo');
  assert.equal(near.notice, undefined);
  const far = resolvePlace(mini, 'me', { lat: 37.5665, lng: 126.978 }); // 서울시청
  assert.equal(far.place.kind, 'entrances');
  assert.match(far.notice!, /km 떨어져/);
  assert.ok(MAX_GPS_START_M < 20000);
  assert.equal(resolvePlace(mini, 'me', null).place.kind, 'entrances');
  assert.equal(resolvePlace(mini, '5S-2F-201', null).place.kind, 'room');
  assert.equal(placeLabel(mini, '5S-2F-201'), '5남관 201호');
  assert.equal(placeLabel(mini, '5S-1F-N01'), '5남관 입구 (1F)');
});

test('입구 출발 경로와 요약 정보', () => {
  const routes = findRoutes(mini, { kind: 'entrances' }, { kind: 'room', id: '5S-2F-201' });
  const stairs = routes.find((r) => r.profiles.includes('stairs-only'))!;
  assert.deepEqual(
    routeSegments(stairs).map((s) => s.label),
    ['1F', '계단', '2F'],
  );
  assert.equal(floorChangeText(stairs), '계단 1F→2F');
  assert.deepEqual(routeFloors(stairs), ['1F', '2F']);
  assert.equal(entranceLabel(mini, stairs), '5남관 입구 (1F)');
  assert.equal(remaining(stairs, 0).steps, stairs.instructions.reduce((s, i) => s + i.steps, 0));

  const gps = findRoutes(mini, { kind: 'geo', geo: { lat: 37.4501, lng: 126.6571 } }, { kind: 'room', id: '5S-2F-202' })[0];
  assert.equal(routeSegments(gps)[0].label, '실외');
});
