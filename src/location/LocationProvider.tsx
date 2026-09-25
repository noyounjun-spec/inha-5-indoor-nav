// 현재 GPS 위치 (docs/LOCATION.md "실외 모드"). 브라우저 Geolocation API를 쓴다.
// 브라우저에서는 걸음·기압 센서를 쓸 수 없어서 실내 진행은 내비 화면의 버튼으로 한다.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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

  const refresh = useCallback(() => {
    // Geolocation은 HTTPS(또는 localhost)에서만 동작한다
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      setStatus('unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setStatus('granted');
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      (e) => setStatus(e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ status, coords, refresh }), [status, coords, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLocation = () => useContext(Ctx);
