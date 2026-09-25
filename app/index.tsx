// S1 홈: 실외 지도 + 검색창 (docs/SPEC.md)
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { entrancesWithGeo, graph, MAP_FALLBACK_CENTER } from '../src/data/index.ts';
import { useLocation } from '../src/location/LocationProvider.tsx';
import { placeLabel } from '../src/lib/places.ts';
import { DemoBanner, FloatingButton, Icon, SecondaryButton } from '../src/ui/common.tsx';
import { fontSize, useTheme } from '../src/ui/theme.ts';

export default function Home() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { coords, status, refresh } = useLocation();
  const map = useRef<MapView>(null);
  const entrances = entrancesWithGeo();
  const center = coords ?? entrances[0]?.geo ?? MAP_FALLBACK_CENTER;

  const recenter = () => {
    refresh();
    if (coords) map.current?.animateToRegion({ latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.004, longitudeDelta: 0.004 });
  };

  return (
    <View style={styles.fill}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: center.lat, longitude: center.lng, latitudeDelta: 0.006, longitudeDelta: 0.006 }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {entrances.map((n) => (
          <Marker key={n.id} coordinate={{ latitude: n.geo!.lat, longitude: n.geo!.lng }} title={placeLabel(graph, n.id)} pinColor={t.primary} />
        ))}
      </MapView>

      <View style={[styles.top, { top: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="5호관 강의실·연구실 검색"
          onPress={() => router.push({ pathname: '/search', params: { field: 'to' } })}
          style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}
        >
          <Icon name="magnify" color={t.primary} />
          <Text style={{ color: t.subtext, fontSize: fontSize.body }}>5호관 강의실·연구실 검색</Text>
        </Pressable>
        <DemoBanner />
      </View>

      <FloatingButton icon="crosshairs-gps" label="현재 위치로" onPress={recenter} style={[styles.gps, { bottom: insets.bottom + 24 }]} />

      {(status === 'denied' || status === 'unavailable') && (
        <View style={[styles.notice, { backgroundColor: t.surface, bottom: insets.bottom + 84 }]}>
          <Text style={{ color: t.text, fontSize: fontSize.small, flex: 1 }}>
            {status === 'denied' ? '위치 권한이 꺼져 있어요. 입구에서 출발하는 경로로 안내합니다.' : '현재 위치를 가져오지 못했어요.'}
          </Text>
          <SecondaryButton title="다시 시도" onPress={refresh} style={{ minHeight: 40 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { position: 'absolute', left: 16, right: 16, gap: 8 },
  search: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  gps: { position: 'absolute', right: 16 },
  notice: { position: 'absolute', left: 16, right: 16, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 4 },
});
