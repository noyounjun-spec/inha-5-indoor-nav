// 경로 카드 (docs/UI_GUIDE.md "경로 카드")
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Route } from '../routing/index.ts';
import { graph } from '../data/index.ts';
import { formatDistance, formatDuration, formatSteps } from '../lib/format.ts';
import { entranceLabel, floorChangeText, routeSegments, type Segment } from '../lib/routeSummary.ts';
import { Chip, Icon } from './common.tsx';
import { fontSize, useTheme, type Theme } from './theme.ts';

const segColor = (t: Theme, s: Segment) =>
  s.kind === 'outdoor' ? t.outdoor : s.kind === 'floor' ? t.primary : t.accent;

/** 층 이동 막대: 구간 길이는 걸음 비율 (계단·엘리베이터는 최소 폭) */
export function FloorBar({ route }: { route: Route }) {
  const t = useTheme();
  const segs = routeSegments(route);
  return (
    <View style={styles.bar}>
      {segs.map((s, i) => (
        <View key={i} style={{ flex: Math.max(s.steps, 12), gap: 3 }}>
          <View style={[styles.barSeg, { backgroundColor: segColor(t, s) }]} />
          <Text numberOfLines={1} style={{ color: t.subtext, fontSize: fontSize.tiny }}>
            {s.kind === 'stair' ? '계단' : s.kind === 'elevator' ? 'EV' : s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function RouteCard({ route, onPress }: { route: Route; onPress: () => void }) {
  const t = useTheme();
  const entrance = entranceLabel(graph, route);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${route.labels.join(', ')} 경로, ${formatDuration(route.seconds)}, ${formatSteps(route.steps)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={styles.line1}>
        <Text style={{ color: t.text, fontSize: fontSize.time, fontWeight: '800' }}>{formatDuration(route.seconds)}</Text>
        <Text style={{ color: t.text, fontSize: fontSize.body, fontWeight: '600' }}>{formatSteps(route.steps)}</Text>
        <Text style={{ color: t.subtext, fontSize: fontSize.small }}>{formatDistance(route.meters)}</Text>
        <View style={{ flex: 1 }} />
        <Icon name="chevron-right" color={t.subtext} />
      </View>
      <View style={styles.chips}>
        {route.labels.map((l, i) => (
          <Chip key={l} label={l} active={i === 0} />
        ))}
      </View>
      <FloorBar route={route} />
      <View style={styles.meta}>
        <Icon name="stairs" size={16} color={t.accent} />
        <Text style={{ color: t.subtext, fontSize: fontSize.small }}>{floorChangeText(route)}</Text>
      </View>
      {entrance && (
        <View style={styles.meta}>
          <Icon name="door-open" size={16} color={t.subtext} />
          <Text style={{ color: t.subtext, fontSize: fontSize.small }}>{entrance}로 들어감</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 10 },
  line1: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  bar: { flexDirection: 'row', gap: 3 },
  barSeg: { height: 6, borderRadius: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
