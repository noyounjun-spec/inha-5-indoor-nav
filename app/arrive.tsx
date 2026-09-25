// S6 도착
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graph } from '../src/data/index.ts';
import { formatDistance, formatDuration, formatSteps } from '../src/lib/format.ts';
import { placeLabel } from '../src/lib/places.ts';
import { useTrip } from '../src/state/trip.ts';
import { Icon, PrimaryButton } from '../src/ui/common.tsx';
import { fontSize, useTheme } from '../src/ui/theme.ts';

export default function Arrive() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { routes, selected, to } = useTrip();
  const route = routes[selected];
  if (!route || !to) return <Redirect href="/" />;

  return (
    <View style={[styles.fill, { backgroundColor: t.surface, paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.center}>
        <View style={[styles.badge, { backgroundColor: t.bg }]}>
          <Icon name="flag-checkered" size={48} color={t.end} />
        </View>
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', textAlign: 'center' }}>{placeLabel(graph, to)}에{'\n'}도착했어요</Text>
        <Text style={{ color: t.subtext, fontSize: fontSize.body }}>
          {formatSteps(route.steps)} · {formatDuration(route.seconds)} · {formatDistance(route.meters)}
        </Text>
      </View>
      <PrimaryButton title="처음으로" onPress={() => (router.dismissAll(), router.replace('/'))} style={{ marginHorizontal: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  badge: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
});
