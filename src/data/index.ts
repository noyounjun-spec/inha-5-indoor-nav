// 앱에서 쓰는 층 데이터와 그래프. 실제 데이터(data/floors)가 없으면 데모 데이터를 쓴다.
import { buildGraph, type FloorCode, type FloorFile, type Geo } from '../routing/index.ts';
import { floors as realFloors, planImages } from './generated.ts';
import { demoFloors } from './demo.ts';
import type { PlanImage } from './types.ts';

export const isDemo = realFloors.length === 0;
export const floors: FloorFile[] = isDemo ? demoFloors : realFloors;
export const graph = buildGraph(floors);

/** 층 선택 버튼 순서 (위층이 위) */
export const FLOOR_ORDER: FloorCode[] = ['4F', '3F', '2F', '1F', 'B1'];
export const availableFloors = FLOOR_ORDER.filter((f) => floors.some((d) => d.floor === f));

export function floorFiles(floor: FloorCode): FloorFile[] {
  return floors.filter((d) => d.floor === floor);
}

export function planImageFor(floor: FloorCode): PlanImage | undefined {
  const image = floorFiles(floor).find((d) => d.image)?.image;
  return image ? planImages[image] : undefined;
}

/** 지도 첫 화면 중심. 입구 위경도가 없을 때만 쓰는 대략적인 인하대 위치 */
export const MAP_FALLBACK_CENTER: Geo = { lat: 37.4505, lng: 126.6535 };

export function entrancesWithGeo() {
  return [...graph.nodes.values()].filter((n) => n.type === 'entrance' && n.geo);
}

/** 입구 위경도가 하나라도 있어야 GPS "내 위치" 출발을 쓸 수 있다. 없으면 출발지는 "5호관 입구"가 기본값이다 */
export const hasEntranceGeo = entrancesWithGeo().length > 0;
