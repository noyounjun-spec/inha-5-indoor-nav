// 출발지·도착지 값('me' | 'entrances' | 방 ID | 노드 ID)을 경로 엔진의 Place로 바꾼다.
import { BUILDING_NAMES, haversineM, type Geo, type Graph, type Place } from '../routing/index.ts';
import { formatDistance } from './format.ts';

export const ME = 'me';
export const ENTRANCES = 'entrances';

/** 내 위치가 가장 가까운 입구에서 이보다 멀면 GPS 출발 대신 입구 출발로 보여 준다 */
export const MAX_GPS_START_M = 1500;

export interface Resolved {
  place: Place;
  /** 사용자에게 알릴 내용 (예: GPS를 못 써서 입구에서 출발) */
  notice?: string;
}

export function resolvePlace(g: Graph, value: string, coords: Geo | null): Resolved {
  if (value === ME) {
    const entrances = [...g.nodes.values()].filter((n) => n.type === 'entrance' && n.geo);
    if (!coords) return { place: { kind: 'entrances' }, notice: '현재 위치를 알 수 없어 5호관 입구에서 출발하는 경로를 보여 줍니다.' };
    if (entrances.length === 0)
      return { place: { kind: 'entrances' }, notice: '입구 위치(GPS) 정보가 아직 없어 5호관 입구에서 출발하는 경로를 보여 줍니다.' };
    const nearest = Math.min(...entrances.map((n) => haversineM(coords, n.geo!)));
    if (nearest > MAX_GPS_START_M)
      return {
        place: { kind: 'entrances' },
        notice: `현재 위치가 5호관에서 ${formatDistance(nearest)} 떨어져 있어 입구에서 출발하는 경로를 보여 줍니다.`,
      };
    return { place: { kind: 'geo', geo: coords } };
  }
  if (value === ENTRANCES) return { place: { kind: 'entrances' } };
  if (g.rooms.has(value)) return { place: { kind: 'room', id: value } };
  return { place: { kind: 'node', id: value } };
}

export function placeLabel(g: Graph, value: string): string {
  if (value === ME) return '내 위치';
  if (value === ENTRANCES) return '5호관 입구';
  const room = g.rooms.get(value);
  if (room) return `${BUILDING_NAMES[room.building]} ${room.name}`;
  const node = g.nodes.get(value);
  if (node?.name) return node.name;
  if (node?.type === 'entrance') return `${BUILDING_NAMES[node.building]} 입구 (${node.floor})`;
  return value;
}
