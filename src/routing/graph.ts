import type { BuildingCode, FloorCode, FloorFile, FloorNode, Room } from './types.ts';
import {
  DEFAULT_TREADS_PER_LEVEL,
  ELEVATOR_S_PER_LEVEL,
  ELEVATOR_WAIT_S,
  SECONDS_PER_TREAD,
  STRIDE_M,
  WALK_SPEED_MPS,
} from './constants.ts';

export type EdgeKind = 'walk' | 'outdoor' | 'stair' | 'elevator';

export interface GraphNode extends FloorNode {
  building: BuildingCode;
  floor: FloorCode;
  level: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  meters: number;
  treads: number;
  levelDelta: number;
  steps: number;
  seconds: number;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  adj: Map<string, GraphEdge[]>;
  rooms: Map<string, Room & { building: BuildingCode; floor: FloorCode }>;
}

// docs/ROUTING.md "edge별 비용" 표
export function makeEdge(from: string, to: string, kind: EdgeKind, meters: number, treads = 0, levelDelta = 0): GraphEdge {
  let steps = 0;
  let seconds = 0;
  if (kind === 'walk' || kind === 'outdoor') {
    steps = meters / STRIDE_M;
    seconds = meters / WALK_SPEED_MPS;
  } else if (kind === 'stair') {
    steps = treads;
    seconds = treads * SECONDS_PER_TREAD;
  } else {
    seconds = ELEVATOR_WAIT_S + ELEVATOR_S_PER_LEVEL * Math.abs(levelDelta);
  }
  return { from, to, kind, meters, treads, levelDelta, steps, seconds };
}

export function stairTreads(lower: GraphNode, upper: GraphNode): number {
  return lower.treadsToNextUp ?? DEFAULT_TREADS_PER_LEVEL * (upper.level - lower.level);
}

export function buildGraph(files: FloorFile[]): Graph {
  const nodes = new Map<string, GraphNode>();
  const fileOf = new Map<string, FloorFile>();
  const adj = new Map<string, GraphEdge[]>();
  const rooms: Graph['rooms'] = new Map();

  for (const file of files) {
    for (const n of file.nodes) {
      nodes.set(n.id, { ...n, building: file.building, floor: file.floor, level: n.level ?? file.level });
      fileOf.set(n.id, file);
      adj.set(n.id, []);
    }
    for (const r of file.rooms) rooms.set(r.id, { ...r, building: file.building, floor: file.floor });
  }

  const add = (e: GraphEdge) => {
    adj.get(e.from)!.push(e);
    adj.get(e.to)!.push({ ...e, from: e.to, to: e.from, levelDelta: -e.levelDelta });
  };

  for (const file of files) {
    for (const e of file.edges) {
      const a = nodes.get(e.from);
      const b = nodes.get(e.to);
      if (!a || !b) throw new Error(`없는 노드를 잇는 edge: ${e.from} - ${e.to}`);
      let meters = e.lengthM;
      if (meters === undefined) {
        if (fileOf.get(e.to) !== file) throw new Error(`다른 파일과 잇는 edge에 lengthM 없음: ${e.from} - ${e.to}`);
        meters = Math.hypot(b.x - a.x, b.y - a.y) * file.metersPerUnit;
      }
      add(makeEdge(e.from, e.to, 'walk', meters));
    }
  }

  const groups = new Map<string, GraphNode[]>();
  for (const n of nodes.values()) {
    if (!n.group) continue;
    if (!groups.has(n.group)) groups.set(n.group, []);
    groups.get(n.group)!.push(n);
  }
  for (const members of groups.values()) {
    members.sort((a, b) => a.level - b.level);
    if (members[0].type === 'stair') {
      for (let i = 0; i + 1 < members.length; i++) {
        const lo = members[i];
        const hi = members[i + 1];
        add(makeEdge(lo.id, hi.id, 'stair', 0, stairTreads(lo, hi), hi.level - lo.level));
      }
    } else {
      for (let i = 0; i < members.length; i++)
        for (let j = i + 1; j < members.length; j++)
          add(makeEdge(members[i].id, members[j].id, 'elevator', 0, 0, members[j].level - members[i].level));
    }
  }

  return { nodes, adj, rooms };
}
