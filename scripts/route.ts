// 경로 확인용 CLI
// 사용법: node scripts/route.ts <출발> <도착> [데이터폴더]
//   출발/도착: 방 ID(5S-2F-234) · 노드 ID(5S-1F-N001) · geo:위도,경도(출발만)
import { buildGraph, findRoutes, type Place } from '../src/routing/index.ts';
import { loadFloors } from './load-floors.ts';

const [fromArg, toArg, dir = 'data/floors'] = process.argv.slice(2);
if (!fromArg || !toArg) {
  console.log('사용법: node scripts/route.ts <출발> <도착> [데이터폴더]');
  process.exit(1);
}
const g = buildGraph(loadFloors(dir));
const parse = (s: string): Place => {
  if (s.startsWith('geo:')) {
    const [lat, lng] = s.slice(4).split(',').map(Number);
    return { kind: 'geo', geo: { lat, lng } };
  }
  return g.rooms.has(s) ? { kind: 'room', id: s } : { kind: 'node', id: s };
};

const routes = findRoutes(g, parse(fromArg), parse(toArg));
if (routes.length === 0) console.log('경로 없음');
for (const [i, r] of routes.entries()) {
  const min = Math.floor(r.seconds / 60);
  console.log(`\n[${i + 1}] ${r.labels.join(' · ')}  —  ${r.steps}걸음 · ${min}분 ${r.seconds % 60}초 · ${r.meters}m`);
  for (const ins of r.instructions) console.log(`    ${ins.building}-${ins.floor}  ${ins.text}`);
}
