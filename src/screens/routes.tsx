// S3 경로 목록: 출발/도착 패널 + 경로 카드 여러 장 (docs/SPEC.md, docs/ROUTING.md 프로필)
import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { findRoutes, type Route } from '../routing/index.ts';
import { graph } from '../data/index.ts';
import { useLocation } from '../location/LocationProvider.tsx';
import { useBack } from '../lib/nav.ts';
import { ENTRANCES, ME, placeLabel, resolvePlace, startLabel } from '../lib/places.ts';
import { setTrip, useTrip } from '../state/trip.ts';
import { DemoBanner, Notice } from '../ui/common.tsx';
import { PlaceFields } from '../ui/PlaceFields.tsx';
import { RouteCard } from '../ui/RouteCard.tsx';

export default function RouteList() {
  const navigate = useNavigate();
  const back = useBack();
  const { from, to } = useTrip();
  const { coords } = useLocation();

  const result = useMemo(() => {
    if (!to) return null;
    const start = resolvePlace(graph, from, coords);
    try {
      const routes = findRoutes(graph, start.place, resolvePlace(graph, to, null).place);
      return { routes, notice: start.notice, startGeo: start.place.kind === 'geo' ? start.place.geo : null, error: null };
    } catch (e) {
      return { routes: [] as Route[], notice: start.notice, startGeo: null, error: (e as Error).message };
    }
  }, [from, to, coords]);

  if (!to || !result) return <Navigate to="/search" replace />;

  const special = from === ME || from === ENTRANCES;
  const open = (i: number) => {
    setTrip({ routes: result.routes, selected: i, startGeo: result.startGeo });
    navigate('/route-detail');
  };

  return (
    <div className="screen" style={{ background: 'var(--bg)' }}>
      <PlaceFields
        fromLabel={startLabel(graph, from)}
        toLabel={placeLabel(graph, to)}
        onPressFrom={() => navigate('/search?field=from&back=1')}
        onPressTo={() => navigate('/search?field=to&back=1')}
        onSwap={() => setTrip({ from: to, to: from })}
        canSwap={!special}
        onBack={back}
      />
      <div className="route-list">
        <DemoBanner />
        {result.notice && <Notice text={result.notice} />}
        <div className="t-small sub">도보 · 실내 경로 {result.routes.length}개</div>
        {result.routes.map((r, i) => (
          <RouteCard key={r.nodeIds.join('>')} route={r} onPress={() => open(i)} />
        ))}
        {result.routes.length === 0 && <div className="empty">{result.error ?? '갈 수 있는 경로를 찾지 못했어요.'}</div>}
      </div>
    </div>
  );
}
