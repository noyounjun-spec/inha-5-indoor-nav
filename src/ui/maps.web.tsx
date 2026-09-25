// 웹 전용 react-native-maps 대체 모듈 (metro.config.cjs에서 웹 번들일 때만 연결)
// react-native-maps는 웹을 지원하지 않으므로 OpenStreetMap 임베드 지도로 대신 보여 준다.
// 앱에서 쓰는 API(MapView·Marker·Polyline·animateToRegion)만 흉내 낸다.
import { Children, createElement, forwardRef, isValidElement, useImperativeHandle, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
interface LatLng {
  latitude: number;
  longitude: number;
}

interface MapViewProps {
  style?: StyleProp<ViewStyle>;
  initialRegion?: Region;
  children?: ReactNode;
  // 웹에서는 쓰지 않는 네이티브 전용 속성
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
}

// 지도 위 표식은 임베드 지도가 한 개만 지원하므로, 자식 중 첫 Marker만 표시한다
export function Marker(_: { coordinate: LatLng; title?: string; pinColor?: string }) {
  return null;
}
export function Polyline(_: { coordinates: LatLng[]; strokeColor?: string; strokeWidth?: number; lineDashPattern?: number[] }) {
  return null;
}

function firstMarker(children: ReactNode): LatLng | undefined {
  let found: LatLng | undefined;
  Children.forEach(children, (c) => {
    if (!found && isValidElement<{ coordinate: LatLng }>(c) && c.type === Marker) found = c.props.coordinate;
  });
  return found;
}

const MapView = forwardRef<{ animateToRegion: (r: Region) => void }, MapViewProps>(function MapView({ style, initialRegion, children }, ref) {
  const [region, setRegion] = useState(initialRegion);
  useImperativeHandle(ref, () => ({ animateToRegion: (r: Region) => setRegion(r) }), []);

  if (!region) return <View style={style} />;
  const { latitude: lat, longitude: lng, latitudeDelta: dLat, longitudeDelta: dLng } = region;
  const bbox = [lng - dLng / 2, lat - dLat / 2, lng + dLng / 2, lat + dLat / 2].map((v) => v.toFixed(6)).join(',');
  const m = firstMarker(children);
  const marker = m ? `&marker=${m.latitude.toFixed(6)},${m.longitude.toFixed(6)}` : '';
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`;

  return (
    <View style={[styles.wrap, style]}>
      {createElement('iframe', { key: src, src, title: '실외 지도', style: { border: 0, width: '100%', height: '100%' } })}
    </View>
  );
});

const styles = StyleSheet.create({ wrap: { overflow: 'hidden' } });

export default MapView;
