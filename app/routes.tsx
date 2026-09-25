// S3 경로 목록: 출발/도착 패널 + 경로 카드 여러 장 (docs/SPEC.md, docs/ROUTING.md 프로필)
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findRoutes, type Route } from '../src/routing/index.ts';
import { graph } from '../src/data/index.ts';
import { useLocation } from '../src/location/LocationProvider.tsx';
import { ENTRANCES, ME, placeLabel, resolvePlace } from '../src/lib/places.ts';
import { setTrip, useTrip } from '../src/state/trip.ts';
import { DemoBanner, Notice } from '../src/ui/common.tsx';
import { PlaceFields } from '../src/ui/PlaceFields.tsx';
import { RouteCard } from '../src/ui/RouteCard.tsx';
import { fontSize, useTheme } from '../src/ui/theme.ts';

export default function Routes() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
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

  if (!to || !result) return <Redirect href="/search" />;

  const special = from === ME || from === ENTRANCES;
  const open = (i: number) => {
    setTrip({ routes: result.routes, selected: i, startGeo: result.startGeo });
    router.push('/route-detail');
  };

  return (
    <View style={[styles.fill, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <PlaceFields
        fromLabel={placeLabel(graph, from)}
        toLabel={placeLabel(graph, to)}
        onPressFrom={() => router.push({ pathname: '/search', params: { field: 'from', back: '1' } })}
        onPressTo={() => router.push({ pathname: '/search', params: { field: 'to', back: '1' } })}
        onSwap={() => setTrip({ from: to, to: from })}
        canSwap={!special}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}>
        <DemoBanner />
        {result.notice && <Notice text={result.notice} />}
        <Text style={{ color: t.subtext, fontSize: fontSize.small }}>도보 · 실내 경로 {result.routes.length}개</Text>
        {result.routes.map((r, i) => (
          <RouteCard key={r.nodeIds.join('>')} route={r} onPress={() => open(i)} />
        ))}
        {result.routes.length === 0 && (
          <Text style={[styles.empty, { color: t.subtext }]}>{result.error ?? '갈 수 있는 경로를 찾지 못했어요.'}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { padding: 16, gap: 12 },
  empty: { textAlign: 'center', padding: 32, fontSize: fontSize.body },
});
