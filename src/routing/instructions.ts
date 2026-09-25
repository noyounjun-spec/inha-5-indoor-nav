// 단계별 안내 만들기. 규칙은 docs/ROUTING.md "단계별 안내 만들기".
import type { Graph, GraphEdge } from './graph.ts';
import { BUILDING_NAMES, type BuildingCode, type FloorCode } from './types.ts';
import { TURN_THRESHOLD_DEG } from './constants.ts';

export type InstructionType = 'outdoor' | 'straight' | 'left' | 'right' | 'stair-up' | 'stair-down' | 'elevator' | 'arrive';

export interface Instruction {
  type: InstructionType;
  text: string;
  steps: number;
  seconds: number;
  building: BuildingCode;
  /** 이 단계가 시작되는 층 (실외 단계는 들어갈 입구의 층) */
  floor: FloorCode;
  /** 이 단계가 끝나는 층 (계단·엘리베이터에서 floor와 다름) */
  toFloor: FloorCode;
  nodeIds: string[];
}

export function buildInstructions(g: Graph, edges: GraphEdge[], destName: string, endId: string): Instruction[] {
  const out: Instruction[] = [];
  const floorOf = (id: string) => g.nodes.get(id)!;
  let prevDir: [number, number] | null = null;
  let cur: { type: InstructionType; edges: GraphEdge[] } | null = null;

  const flush = () => {
    if (!cur) return;
    const first = cur.edges[0];
    const last = cur.edges[cur.edges.length - 1];
    // 출발 가상 노드(__start__)는 그래프에 없으므로 첫 실제 노드를 쓴다
    const fromN = g.nodes.get(first.from) ?? floorOf(first.to);
    const toN = floorOf(last.to);
    const at = cur.type === 'outdoor' ? toN : fromN;
    const steps = Math.round(cur.edges.reduce((s, e) => s + e.steps, 0));
    const seconds = Math.round(cur.edges.reduce((s, e) => s + e.seconds, 0));
    const nodeIds = [first.from, ...cur.edges.map((e) => e.to)].filter((id) => g.nodes.has(id));
    let text: string;
    switch (cur.type) {
      case 'outdoor':
        text = `${BUILDING_NAMES[toN.building]} 입구(${toN.floor})까지 이동`;
        break;
      case 'straight':
        text = `직진 ${steps}걸음`;
        break;
      case 'left':
        text = `좌회전 후 ${steps}걸음`;
        break;
      case 'right':
        text = `우회전 후 ${steps}걸음`;
        break;
      case 'stair-up':
      case 'stair-down':
        text = `계단으로 ${fromN.floor}→${toN.floor} ${cur.type === 'stair-up' ? '올라가기' : '내려가기'} (${steps}계단)`;
        break;
      default:
        text = `엘리베이터로 ${fromN.floor}→${toN.floor}`;
    }
    out.push({ type: cur.type, text, steps, seconds, building: at.building, floor: at.floor, toFloor: toN.floor, nodeIds });
    cur = null;
  };

  for (const e of edges) {
    if (e.kind === 'outdoor') {
      flush();
      cur = { type: 'outdoor', edges: [e] };
      prevDir = null;
      continue;
    }
    if (e.kind === 'stair' || e.kind === 'elevator') {
      const type: InstructionType = e.kind === 'elevator' ? 'elevator' : e.levelDelta > 0 ? 'stair-up' : 'stair-down';
      if (!(cur && cur.type === type && type !== 'elevator')) {
        flush();
        cur = { type, edges: [] };
      }
      cur.edges.push(e);
      prevDir = null;
      continue;
    }
    // walk
    const a = g.nodes.get(e.from);
    const b = g.nodes.get(e.to)!;
    const sameFloor = a && a.building === b.building && a.floor === b.floor;
    const dir: [number, number] | null = sameFloor && e.meters > 0 ? [b.x - a.x, b.y - a.y] : null;
    let turn: InstructionType | null = null;
    if (dir && prevDir) {
      const cross = prevDir[0] * dir[1] - prevDir[1] * dir[0];
      const dot = prevDir[0] * dir[0] + prevDir[1] * dir[1];
      const deg = Math.abs((Math.atan2(cross, dot) * 180) / Math.PI);
      if (deg > TURN_THRESHOLD_DEG) turn = cross > 0 ? 'right' : 'left';
    }
    if (e.meters === 0) continue;
    if (turn || !cur || !['straight', 'left', 'right'].includes(cur.type)) {
      flush();
      cur = { type: turn ?? 'straight', edges: [] };
    }
    cur.edges.push(e);
    if (dir) prevDir = dir;
  }
  flush();

  const end = floorOf(endId);
  out.push({
    type: 'arrive',
    text: `${destName} 도착`,
    steps: 0,
    seconds: 0,
    building: end.building,
    floor: end.floor,
    toFloor: end.floor,
    nodeIds: [endId],
  });
  return out;
}
