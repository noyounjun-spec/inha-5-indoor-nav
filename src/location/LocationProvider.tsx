// 현재 GPS 위치 (docs/LOCATION.md "실외 모드"). 실내 추정(걸음·기압)은 6단계에서 붙인다.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as Location from 'expo-location';
import type { Geo } from '../routing/index.ts';

type Status = 'loading' | 'granted' | 'denied' | 'unavailable';

interface LocationState {
  status: Status;
  coords: Geo | null;
  refresh: () => void;
}

const Ctx = createContext<LocationState>({ status: 'loading', coords: null, refresh: () => {} });

export function LocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [coords, setCoords] = useState<Geo | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setStatus('denied');
        return;
      }
      setStatus('granted');
      const last = await Location.getLastKnownPositionAsync();
      if (last) setCoords({ lat: last.coords.latitude, lng: last.coords.longitude });
      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: cur.coords.latitude, lng: cur.coords.longitude });
    } catch {
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ status, coords, refresh }), [status, coords, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLocation = () => useContext(Ctx);
