// 실외 구간 지도: 내 위치 → 들어갈 입구
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import type { Geo } from '../routing/index.ts';
import { graph, MAP_FALLBACK_CENTER } from '../data/index.ts';
import { placeLabel } from '../lib/places.ts';
import { useTheme } from './theme.ts';

const ll = (g: Geo) => ({ latitude: g.lat, longitude: g.lng });

export function OutdoorMap({ start, entranceId }: { start: Geo | null; entranceId?: string }) {
  const t = useTheme();
  const end = entranceId ? graph.nodes.get(entranceId)?.geo : undefined;
  const pts = [start, end].filter((p): p is Geo => !!p);
  const c = pts.length ? { lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length, lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length } : MAP_FALLBACK_CENTER;
  const span = pts.length === 2 ? Math.max(Math.abs(pts[0].lat - pts[1].lat), Math.abs(pts[0].lng - pts[1].lng)) * 2.4 + 0.001 : 0.005;
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={{ latitude: c.lat, longitude: c.lng, latitudeDelta: span, longitudeDelta: span }}
      showsUserLocation
    >
      {start && end && <Polyline coordinates={[ll(start), ll(end)]} strokeColor={t.primary} strokeWidth={6} lineDashPattern={[2, 8]} />}
      {end && entranceId && <Marker coordinate={ll(end)} title={placeLabel(graph, entranceId)} pinColor={t.end} />}
    </MapView>
  );
}
