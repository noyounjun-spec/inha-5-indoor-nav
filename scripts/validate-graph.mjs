#!/usr/bin/env node
// 층 데이터 검사기. 규칙은 docs/DATA_MODEL.md 참고.
// 사용법: node scripts/validate-graph.mjs [데이터폴더]   (기본: data/floors)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const dir = process.argv[2] ?? 'data/floors';
const BUILDINGS = ['5N', '5W', '5S', '5E'];
const FLOORS = ['B1', '1F', '2F', '3F', '4F'];
const NODE_TYPES = ['corridor', 'junction', 'door', 'entrance', 'stair', 'elevator'];
const ROOM_RE = /^5[NWSE]-(B1|[1-4]F)-[0-9A-Za-z_]+$/;
const NODE_RE = /^5[NWSE]-(B1|[1-4]F)-N[0-9]+$/;

const errors = [];
const warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
if (files.length === 0) {
  console.log(`검사할 층 파일이 없습니다 (${dir})`);
  process.exit(0);
}

const nodes = new Map(); // id -> { f, d, n, level }
// 같은 층 도면을 관별로 나눈 파일끼리는 좌표를 그대로 비교할 수 있다
const sameFrame = (a, b) => a === b || (a.image && a.image === b.image && a.metersPerUnit === b.metersPerUnit);
const roomIds = new Set();
const floors = [];

// 1단계: 파일 형식과 노드
for (const f of files) {
  let d;
  try {
    d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  } catch (e) {
    err(f, `JSON 파싱 실패: ${e.message}`);
    continue;
  }
  floors.push([f, d]);
  const prefix = `${d.building}-${d.floor}`;
  if (!BUILDINGS.includes(d.building)) err(f, `building 값이 잘못됨: ${d.building}`);
  if (!FLOORS.includes(d.floor)) err(f, `floor 값이 잘못됨: ${d.floor}`);
  if (basename(f, '.json') !== prefix) err(f, `파일 이름은 ${prefix}.json 이어야 함`);
  if (typeof d.level !== 'number') err(f, 'level(숫자)이 없음');
  if (!(d.metersPerUnit > 0)) err(f, 'metersPerUnit은 0보다 커야 함');
  if (!d.scaleSource) warn(f, 'scaleSource(축척 근거)가 없음');
  for (const k of ['nodes', 'rooms', 'edges', 'unknown']) {
    if (!Array.isArray(d[k])) {
      err(f, `"${k}" 배열이 없음`);
      d[k] = [];
    }
  }
  for (const n of d.nodes) {
    if (!NODE_RE.test(n.id ?? '') || !n.id.startsWith(prefix + '-')) err(f, `노드 ID 형식 오류(${prefix}-N번호): ${n.id}`);
    if (nodes.has(n.id)) err(f, `노드 ID 중복: ${n.id}`);
    if (!NODE_TYPES.includes(n.type)) err(f, `${n.id}: 알 수 없는 type ${n.type}`);
    if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) err(f, `${n.id}: x, y 좌표가 숫자가 아님`);
    if ((n.type === 'stair' || n.type === 'elevator') && !n.group) err(f, `${n.id}: 계단/엘리베이터 노드는 group 필요`);
    if (n.type === 'entrance' && !n.geo) warn(f, `${n.id}: 입구에 geo(위경도)가 없어 GPS 출발 경로에 쓸 수 없음`);
    nodes.set(n.id, { f, d, n, level: n.level ?? d.level });
  }
  for (const u of d.unknown) {
    if (typeof u?.what !== 'string') err(f, `unknown 항목에 what(문자열)이 없음: ${JSON.stringify(u)}`);
  }
}

// 2단계: 방, edge (다른 파일 노드를 참조할 수 있으므로 노드를 다 모은 뒤)
const adj = new Map([...nodes.keys()].map((id) => [id, new Set()]));
const link = (a, b) => {
  adj.get(a).add(b);
  adj.get(b).add(a);
};
const seenEdges = new Set();
for (const [f, d] of floors) {
  const prefix = `${d.building}-${d.floor}`;
  for (const r of d.rooms) {
    if (!ROOM_RE.test(r.id ?? '') || !r.id.startsWith(prefix + '-')) err(f, `방 ID 형식 오류(${prefix}-호수): ${r.id}`);
    if (roomIds.has(r.id)) err(f, `방 ID 중복: ${r.id}`);
    if (nodes.has(r.id)) err(f, `방 ID가 노드 ID와 같음: ${r.id}`);
    roomIds.add(r.id);
    if (!r.name) warn(f, `${r.id}: name이 없음`);
    if (!Array.isArray(r.doors) || r.doors.length === 0) err(f, `${r.id}: doors가 비어 있음`);
    for (const dn of r.doors ?? []) {
      if (!nodes.has(dn)) err(f, `${r.id}: 없는 문 노드 ${dn}`);
      else if (!['door', 'entrance'].includes(nodes.get(dn).n.type)) warn(f, `${r.id}: 문 노드 ${dn}의 type이 door가 아님`);
    }
  }
  for (const e of d.edges) {
    const a = nodes.get(e.from);
    const b = nodes.get(e.to);
    if (!a) err(f, `edge의 from 노드 없음: ${e.from}`);
    if (!b) err(f, `edge의 to 노드 없음: ${e.to}`);
    if (!a || !b) continue;
    if (a.f !== f) err(f, `edge의 from(${e.from})은 이 파일의 노드여야 함`);
    if (e.from === e.to) err(f, `자기 자신으로 가는 edge: ${e.from}`);
    const key = [e.from, e.to].sort().join('|');
    if (seenEdges.has(key)) err(f, `edge 중복: ${e.from} - ${e.to}`);
    seenEdges.add(key);
    if (!sameFrame(a.d, b.d) && !(e.lengthM > 0)) err(f, `좌표 체계가 다른 파일과 잇는 edge는 lengthM 필요: ${e.from} - ${e.to}`);
    if (e.lengthM !== undefined && !(e.lengthM > 0)) err(f, `lengthM은 0보다 커야 함: ${e.from} - ${e.to}`);
    link(e.from, e.to);
  }
}

// 3단계: 계단·엘리베이터 그룹
const groups = new Map();
for (const { n, level } of nodes.values()) {
  if (!n.group) continue;
  if (!groups.has(n.group)) groups.set(n.group, []);
  groups.get(n.group).push({ n, level });
}
for (const [g, members] of groups) {
  const types = new Set(members.map((m) => m.n.type));
  if (types.size > 1) err(g, `한 group에 여러 type이 섞임: ${[...types].join(', ')}`);
  const levels = members.map((m) => m.level);
  if (new Set(levels).size !== levels.length) err(g, `같은 높이(level)에 정차 지점이 두 개 이상`);
  if (members.length < 2) warn(g, `정차 지점이 1개뿐이라 층 이동에 쓰이지 않음`);
  for (const a of members) for (const b of members) if (a !== b) link(a.n.id, b.n.id);
}

// 4단계: 입구에서 모든 방까지 연결되는지
const entrances = [...nodes.values()].filter(({ n }) => n.type === 'entrance').map(({ n }) => n.id);
if (entrances.length === 0) {
  warn('전체', '입구(entrance)가 없어 연결성 검사를 건너뜀');
} else {
  const seen = new Set(entrances);
  const queue = [...entrances];
  while (queue.length) for (const next of adj.get(queue.pop())) if (!seen.has(next)) (seen.add(next), queue.push(next));
  for (const [f, d] of floors) {
    for (const r of d.rooms) if (!(r.doors ?? []).some((dn) => seen.has(dn))) err(f, `${r.id}: 입구에서 도달할 수 없음`);
    for (const n of d.nodes) if (!seen.has(n.id)) warn(f, `${n.id}: 입구에서 도달할 수 없는 노드`);
  }
}

const unknownCount = floors.reduce((s, [, d]) => s + d.unknown.length, 0);
for (const w of warnings) console.log(`경고  ${w}`);
for (const e of errors) console.log(`오류  ${e}`);
console.log(
  `\n파일 ${floors.length}개 · 노드 ${nodes.size}개 · 방 ${roomIds.size}개 · 계단/엘리베이터 ${groups.size}개 · unknown ${unknownCount}개`,
);
console.log(errors.length ? `✗ 오류 ${errors.length}개, 경고 ${warnings.length}개` : `✓ 통과 (경고 ${warnings.length}개)`);
process.exit(errors.length ? 1 : 0);
