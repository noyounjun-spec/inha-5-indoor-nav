// 경로 프로필과 탐색. 기준은 docs/ROUTING.md.
import type { Geo } from './types.ts';
import { makeEdge, type Graph, type GraphEdge } from './graph.ts';
import { OUTDOOR_DETOUR_FACTOR } from './constants.ts';
import { buildInstructions, type Instruction } from './instructions.ts';

export type Place = { kind: 'room'; id: string } | { kind: 'node'; id: string } | { kind: 'geo'; geo: Geo };

export type ProfileId = 'min-steps' | 'fastest' | 'stairs-only' | 'no-stairs';

interface Profile {
  id: ProfileId;
  label: string;
  allow: (e: GraphEdge) => boolean;
  weight: (e: GraphEdge) => number;
}

// 순서 = 경로 카드 표시 순서
export const PROFILES: Profile[] = [
  { id: 'min-steps', label: '최소 걸음', allow: () => true, weight: (e) => e.steps + e.seconds * 1e-6 },
  { id: 'fastest', label: '최단 시간', allow: () => true, weight: (e) => e.seconds + e.steps * 1e-6 },
  { id: 'stairs-only', label: '계단 이용', allow: (e) => e.kind !== 'elevator', weight: (e) => e.steps + e.seconds * 1e-6 },
  { id: 'no-stairs', label: '계단 없이', allow: (e) => e.kind !== 'stair', weight: (e) => e.steps + e.seconds * 1e-6 },
];

export interface Route {
  profiles: ProfileId[];
  labels: string[];
  nodeIds: string[];
  edges: GraphEdge[];
  steps: number;
  seconds: number;
  meters: number;
  instructions: Instruction[];
}

export const START_ID = '__start__';

export function haversineM(a: Geo, b: Geo): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function startEdges(g: Graph, from: Place): GraphEdge[] {
  if (from.kind === 'geo') {
    const out: GraphEdge[] = [];
    for (const n of g.nodes.values())
      if (n.type === 'entrance' && n.geo)
        out.push(makeEdge(START_ID, n.id, 'outdoor', haversineM(from.geo, n.geo) * OUTDOOR_DETOUR_FACTOR));
    return out;
  }
  return placeNodes(g, from).map((id) => makeEdge(START_ID, id, 'walk', 0));
}

function placeNodes(g: Graph, p: Place): string[] {
  if (p.kind === 'room') {
    const room = g.rooms.get(p.id);
    if (!room) throw new Error(`없는 방: ${p.id}`);
    return room.doors;
  }
  if (p.kind === 'node') {
    if (!g.nodes.has(p.id)) throw new Error(`없는 노드: ${p.id}`);
    return [p.id];
  }
  throw new Error('GPS 위치는 도착지로 쓸 수 없음');
}

function shortestPath(g: Graph, start: GraphEdge[], targets: Set<string>, profile: Profile): GraphEdge[] | null {
  const dist = new Map<string, number>([[START_ID, 0]]);
  const prev = new Map<string, GraphEdge>();
  const heap = new MinHeap();
  heap.push(0, START_ID);
  while (heap.size) {
    const [d, id] = heap.pop();
    if (d > (dist.get(id) ?? Infinity)) continue;
    if (targets.has(id)) {
      const path: GraphEdge[] = [];
      for (let cur = id; cur !== START_ID; cur = prev.get(cur)!.from) path.push(prev.get(cur)!);
      return path.reverse();
    }
    for (const e of id === START_ID ? start : g.adj.get(id)!) {
      if (!profile.allow(e)) continue;
      const nd = d + profile.weight(e);
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, e);
        heap.push(nd, e.to);
      }
    }
  }
  return null;
}

export function findRoutes(g: Graph, from: Place, to: Place): Route[] {
  const start = startEdges(g, from);
  const targets = new Set(placeNodes(g, to));
  const routes: Route[] = [];
  for (const profile of PROFILES) {
    const edges = shortestPath(g, start, targets, profile);
    if (!edges) continue;
    const nodeIds = edges.map((e) => e.to);
    const key = nodeIds.join('>');
    const same = routes.find((r) => r.nodeIds.join('>') === key);
    if (same) {
      same.profiles.push(profile.id);
      same.labels.push(profile.label);
      continue;
    }
    const real = edges.filter((e) => !(e.from === START_ID && e.meters === 0 && e.kind === 'walk'));
    routes.push({
      profiles: [profile.id],
      labels: [profile.label],
      nodeIds,
      edges: real,
      steps: Math.round(real.reduce((s, e) => s + e.steps, 0)),
      seconds: Math.round(real.reduce((s, e) => s + e.seconds, 0)),
      meters: Math.round(real.reduce((s, e) => s + e.meters, 0)),
      instructions: buildInstructions(g, real, to.kind === 'room' ? g.rooms.get(to.id)!.name : to.id),
    });
  }
  return routes;
}

class MinHeap {
  private items: [number, string][] = [];
  get size() {
    return this.items.length;
  }
  push(key: number, value: string) {
    const a = this.items;
    a.push([key, value]);
    for (let i = a.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): [number, string] {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}
