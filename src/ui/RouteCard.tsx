// 경로 카드 (docs/UI_GUIDE.md "경로 카드")
import type { Route } from '../routing/index.ts';
import { graph } from '../data/index.ts';
import { formatDistance, formatDuration, formatSteps } from '../lib/format.ts';
import { entranceLabel, floorChangeText, routeSegments, verticalMode, type Segment } from '../lib/routeSummary.ts';
import { Chip, Icon } from './common.tsx';
import { useTheme, type Theme } from './theme.ts';

const segColor = (t: Theme, s: Segment) =>
  s.kind === 'outdoor' ? t.outdoor : s.kind === 'floor' ? t.primary : t.accent;

/** 층 이동 막대: 구간 길이는 걸음 비율 (계단·엘리베이터는 최소 폭) */
export function FloorBar({ route }: { route: Route }) {
  const t = useTheme();
  return (
    <div className="floor-bar">
      {routeSegments(route).map((s, i) => (
        <div key={i} className="seg" style={{ flex: Math.max(s.steps, 12) }}>
          <i style={{ background: segColor(t, s) }} />
          <span className="t-tiny sub ellipsis">{s.kind === 'stair' ? '계단' : s.kind === 'elevator' ? 'EV' : s.label}</span>
        </div>
      ))}
    </div>
  );
}

/** 층 이동 방법 표시: 엘리베이터 이용 / 계단만 이용 / 엘리베이터+계단 / 같은 층 */
export function VerticalBadge({ route }: { route: Route }) {
  const t = useTheme();
  const { mode, label } = verticalMode(route);
  const color = mode === 'elevator' ? t.primary : mode === 'none' ? t.subtext : t.accent;
  return (
    <span className="mode-badge" style={{ color, borderColor: color }}>
      <Icon name={mode === 'elevator' || mode === 'mixed' ? 'elevator-passenger' : mode === 'stairs' ? 'stairs' : 'walk'} size={14} color={color} />
      {label}
    </span>
  );
}

/** 시간 · 걸음 · 거리 한 줄 */
export function RouteSummaryLine({ route }: { route: Route }) {
  return (
    <>
      <span className="t-time">{formatDuration(route.seconds)}</span>
      <span className="t-body bold">{formatSteps(route.steps)}</span>
      <span className="t-small sub">{formatDistance(route.meters)}</span>
    </>
  );
}

export function RouteCard({ route, onPress }: { route: Route; onPress: () => void }) {
  const t = useTheme();
  const entrance = entranceLabel(graph, route);
  return (
    <button
      type="button"
      aria-label={`${route.labels.join(', ')} 경로, ${verticalMode(route).label}, ${formatDuration(route.seconds)}, ${formatSteps(route.steps)}`}
      onClick={onPress}
      className="card"
    >
      <div className="line1" style={{ width: '100%' }}>
        <RouteSummaryLine route={route} />
        <span style={{ flex: 1 }} />
        <VerticalBadge route={route} />
        <Icon name="chevron-right" color={t.subtext} />
      </div>
      <div className="chips">
        {route.labels.map((l, i) => (
          <Chip key={l} label={l} active={i === 0} />
        ))}
      </div>
      <div style={{ width: '100%' }}>
        <FloorBar route={route} />
      </div>
      <div className="meta">
        <Icon name="stairs" size={16} color={t.accent} />
        {floorChangeText(route)}
      </div>
      {entrance && (
        <div className="meta">
          <Icon name="door-open" size={16} />
          {entrance}로 들어감
        </div>
      )}
    </button>
  );
}
