// S6 도착
import { Navigate, useNavigate } from 'react-router';
import { graph } from '../data/index.ts';
import { formatDistance, formatDuration, formatSteps } from '../lib/format.ts';
import { placeLabel } from '../lib/places.ts';
import { setTrip, useTrip } from '../state/trip.ts';
import { Icon, PrimaryButton } from '../ui/common.tsx';
import { useTheme } from '../ui/theme.ts';

export default function Arrive() {
  const t = useTheme();
  const navigate = useNavigate();
  const { routes, selected, to } = useTrip();
  const route = routes[selected];
  if (!route || !to) return <Navigate to="/" replace />;

  return (
    <div className="screen arrive">
      <div className="center">
        <div className="badge">
          <Icon name="flag-checkered" size={48} color={t.end} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>
          {placeLabel(graph, to)}에
          <br />
          도착했어요
        </div>
        <div className="t-body sub">
          {formatSteps(route.steps)} · {formatDuration(route.seconds)} · {formatDistance(route.meters)}
        </div>
      </div>
      <PrimaryButton title="처음으로" onPress={() => {
        // 도착한 방이 이제 지금 위치다. 다음 길찾기는 여기서 출발한다
        setTrip({ from: to, to: null, routes: [], selected: 0 });
        navigate('/', { replace: true });
      }} style={{ margin: '0 16px' }} />
    </div>
  );
}
