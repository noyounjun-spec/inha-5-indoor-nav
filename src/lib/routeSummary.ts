// 경로 카드와 내비 화면에 쓰는 요약 정보 (모두 Route.instructions에서 뽑는다)
import type { FloorCode, Graph, Instruction, Route } from '../routing/index.ts';
import { placeLabel } from './places.ts';

export interface Segment {
  kind: 'outdoor' | 'floor' | 'stair' | 'elevator';
  label: string;
  steps: number;
}

const isWalk = (i: Instruction) => i.type === 'straight' || i.type === 'left' || i.type === 'right';

/** 층 이동 막대: 실외 ─ 1F ─ 계단 ─ 3F */
export function routeSegments(route: Route): Segment[] {
  const out: Segment[] = [];
  for (const ins of route.instructions) {
    if (ins.type === 'arrive') continue;
    let seg: Segment;
    if (ins.type === 'outdoor') seg = { kind: 'outdoor', label: '실외', steps: ins.steps };
    else if (ins.type === 'elevator') seg = { kind: 'elevator', label: 'EV', steps: ins.steps };
    else if (!isWalk(ins)) seg = { kind: 'stair', label: '계단', steps: ins.steps };
    else seg = { kind: 'floor', label: ins.floor, steps: ins.steps };
    const prev = out[out.length - 1];
    if (prev && prev.kind === seg.kind && prev.label === seg.label) prev.steps += seg.steps;
    else out.push(seg);
  }
  return out;
}

/** 예: "계단 1F→3F · 엘리베이터 3F→4F", 층 이동이 없으면 "층 이동 없음" */
export function floorChangeText(route: Route): string {
  const parts = route.instructions
    .filter((i) => i.type === 'stair-up' || i.type === 'stair-down' || i.type === 'elevator')
    .map((i) => `${i.type === 'elevator' ? '엘리베이터' : '계단'} ${i.floor}→${i.toFloor}`);
  return parts.length ? parts.join(' · ') : '층 이동 없음';
}

export type VerticalMode = 'elevator' | 'stairs' | 'mixed' | 'none';

/** 층을 오르내리는 방법: 경로 카드에 "엘리베이터 이용" / "계단만 이용"처럼 보여 준다 */
export function verticalMode(route: Route): { mode: VerticalMode; label: string } {
  const ev = route.instructions.some((i) => i.type === 'elevator');
  const st = route.instructions.some((i) => i.type === 'stair-up' || i.type === 'stair-down');
  if (ev && st) return { mode: 'mixed', label: '엘리베이터+계단' };
  if (ev) return { mode: 'elevator', label: '엘리베이터 이용' };
  if (st) return { mode: 'stairs', label: '계단만 이용' };
  return { mode: 'none', label: '같은 층' };
}

/** 경로가 지나는 층 (처음 나오는 순서) */
export function routeFloors(route: Route): FloorCode[] {
  const out: FloorCode[] = [];
  for (const i of route.instructions) {
    if (i.type === 'outdoor') continue;
    for (const f of [i.floor, i.toFloor]) if (!out.includes(f)) out.push(f);
  }
  return out;
}

/** 경로가 들어가는 입구 이름 (입구를 지나지 않으면 null) */
export function entranceLabel(g: Graph, route: Route): string | null {
  const id = route.nodeIds.find((n) => g.nodes.get(n)?.type === 'entrance');
  return id ? placeLabel(g, id) : null;
}

export function remaining(route: Route, fromStep: number) {
  const rest = route.instructions.slice(fromStep);
  return { steps: rest.reduce((s, i) => s + i.steps, 0), seconds: rest.reduce((s, i) => s + i.seconds, 0) };
}
