// 출발지·도착지, 계산한 경로, 최근 검색을 화면끼리 나눠 쓰는 작은 저장소
import { useSyncExternalStore } from 'react';
import type { Geo, Route } from '../routing/index.ts';
import { ME } from '../lib/places.ts';

export interface TripState {
  /** 'me' | 'entrances' | 방 ID | 노드 ID */
  from: string;
  to: string | null;
  routes: Route[];
  selected: number;
  /** GPS로 출발할 때 출발 좌표 (실외 지도에 표시) */
  startGeo: Geo | null;
  recent: string[];
}

let state: TripState = { from: ME, to: null, routes: [], selected: 0, startGeo: null, recent: [] };
const listeners = new Set<() => void>();

export function setTrip(patch: Partial<TripState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function addRecent(id: string) {
  setTrip({ recent: [id, ...state.recent.filter((r) => r !== id)].slice(0, 8) });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useTrip(): TripState {
  return useSyncExternalStore(subscribe, () => state);
}
