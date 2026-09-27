// 출발지·도착지, 계산한 경로, 최근 검색을 화면끼리 나눠 쓰는 작은 저장소
// 최근 검색만 브라우저(localStorage)에 남긴다. 저장소를 못 쓰면 메모리에만 둔다.
import { useSyncExternalStore } from 'react';
import type { Geo, Route } from '../routing/index.ts';
import { hasEntranceGeo } from '../data/index.ts';
import { ENTRANCES, ME } from '../lib/places.ts';

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

const RECENT_KEY = 'inha5nav.recent';

function loadRecent(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

// 입구 위경도가 없으면 GPS 출발을 쓸 수 없으므로 "5호관 입구"에서 출발한다
let state: TripState = { from: hasEntranceGeo ? ME : ENTRANCES, to: null, routes: [], selected: 0, startGeo: null, recent: loadRecent() };
const listeners = new Set<() => void>();

export function setTrip(patch: Partial<TripState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function addRecent(id: string) {
  const recent = [id, ...state.recent.filter((r) => r !== id)].slice(0, 8);
  setTrip({ recent });
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    // 저장 못 해도 이번 방문 동안은 메모리에 남는다
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useTrip(): TripState {
  return useSyncExternalStore(subscribe, () => state);
}
