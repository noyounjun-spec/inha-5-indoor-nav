// 방·입구 검색. 호수(234), 관+호수(5남 234, 5S-234), 방 이름, 별칭으로 찾는다.
import { BUILDING_NAMES, type BuildingCode, type FloorCode, type Graph } from '../routing/index.ts';
import { placeLabel } from './places.ts';

export interface SearchItem {
  id: string;
  kind: 'room' | 'entrance';
  title: string;
  subtitle: string;
  building: BuildingCode;
  floor: FloorCode;
  /** 호수 (방만) */
  number?: string;
  names: string[];
}

const BUILDING_HINTS: [BuildingCode, string[]][] = [
  ['5N', ['5북관', '5북', '북관', '5n']],
  ['5W', ['5서관', '5서', '서관', '5w']],
  ['5S', ['5남관', '5남', '남관', '5s']],
  ['5E', ['5동관', '5동', '동관', '5e']],
];
const BUILDING_ORDER: BuildingCode[] = ['5N', '5W', '5S', '5E'];
const FLOOR_RANK: Record<FloorCode, number> = { B1: 0, '1F': 1, '2F': 2, '3F': 3, '4F': 4 };

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');

export function buildSearchIndex(g: Graph): SearchItem[] {
  const items: SearchItem[] = [];
  for (const r of g.rooms.values()) {
    const number = r.id.split('-')[2];
    items.push({
      id: r.id,
      kind: 'room',
      title: r.name,
      subtitle: `${BUILDING_NAMES[r.building]} · ${r.floor}`,
      building: r.building,
      floor: r.floor,
      number,
      names: [r.name, ...(r.aliases ?? [])].map(norm),
    });
  }
  for (const n of g.nodes.values()) {
    if (n.type !== 'entrance') continue;
    const title = placeLabel(g, n.id);
    items.push({
      id: n.id,
      kind: 'entrance',
      title,
      subtitle: `${BUILDING_NAMES[n.building]} · ${n.floor} · 출입구`,
      building: n.building,
      floor: n.floor,
      names: [norm(title), '입구', '출입구'],
    });
  }
  return items;
}

export function search(items: SearchItem[], query: string): SearchItem[] {
  let q = norm(query);
  let building: BuildingCode | null = null;
  for (const [code, hints] of BUILDING_HINTS) {
    const hit = hints.find((h) => q.startsWith(h));
    if (hit) {
      building = code;
      q = q.slice(hit.length);
      break;
    }
  }
  q = q.replace(/^[-_.·]+/, '').replace(/호$/, '');
  if (!q && !building) return [];

  const scored: [number, SearchItem][] = [];
  for (const item of items) {
    if (building && item.building !== building) continue;
    let score = 0;
    if (!q) score = 1;
    else if (item.number && item.number.toLowerCase() === q) score = 4;
    else if (item.number && item.number.toLowerCase().startsWith(q)) score = 3;
    else if (item.names.some((n) => n.startsWith(q))) score = 2;
    else if (item.names.some((n) => n.includes(q))) score = 1;
    if (score) scored.push([score, item]);
  }
  return scored
    .sort(
      ([sa, a], [sb, b]) =>
        sb - sa ||
        BUILDING_ORDER.indexOf(a.building) - BUILDING_ORDER.indexOf(b.building) ||
        FLOOR_RANK[a.floor] - FLOOR_RANK[b.floor] ||
        a.id.localeCompare(b.id),
    )
    .map(([, item]) => item);
}
