// 실외 지도 (Leaflet + OpenStreetMap). 홈 화면의 입구 표시와 실외 구간(내 위치 → 입구) 표시에 쓴다.
import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Geo } from '../routing/index.ts';
import { graph, MAP_FALLBACK_CENTER } from '../data/index.ts';
import { placeLabel } from '../lib/places.ts';
import { useTheme } from './theme.ts';

const ll = (g: Geo): [number, number] => [g.lat, g.lng];

/** 표시할 점들이 모두 보이게 지도를 맞춘다. focus가 바뀌면 그곳으로 옮긴다. */
function FitView({ points, focus }: { points: Geo[]; focus?: Geo | null }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join('|');
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(points.map(ll), { padding: [48, 48], maxZoom: 18 });
    else if (points.length === 1) map.setView(ll(points[0]), 17);
    // points는 key가 같으면 같은 내용이다
  }, [map, key]);
  // 지도 칸 크기가 바뀌면(시트·창 크기 변경) Leaflet이 크기를 다시 재도록 한다
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  useEffect(() => {
    if (focus) map.flyTo(ll(focus), 18, { duration: 0.6 });
  }, [map, focus]);
  return null;
}

interface Props {
  /** 내 위치 */
  me?: Geo | null;
  /** 표시할 입구 노드 ID */
  entranceIds?: string[];
  /** 내 위치 → 첫 입구를 점선으로 잇는다 (실외 구간) */
  showPath?: boolean;
  /** 이 좌표로 지도를 옮긴다 ("현재 위치로" 버튼) */
  focus?: Geo | null;
}

export function OutdoorMap({ me, entranceIds = [], showPath, focus }: Props) {
  const t = useTheme();
  const entrances = entranceIds
    .map((id) => ({ id, geo: graph.nodes.get(id)?.geo }))
    .filter((e): e is { id: string; geo: Geo } => !!e.geo);
  const points = [...(showPath && me ? [me] : []), ...entrances.map((e) => e.geo)];
  const center = points[0] ?? me ?? MAP_FALLBACK_CENTER;

  return (
    <MapContainer center={ll(center)} zoom={17} zoomControl={false} attributionControl className="fill" style={{ background: t.bg }}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
      <FitView points={points} focus={focus} />
      {showPath && me && entrances[0] && (
        <Polyline positions={[ll(me), ll(entrances[0].geo)]} pathOptions={{ color: t.primary, weight: 6, dashArray: '2 10', lineCap: 'round' }} />
      )}
      {entrances.map((e) => (
        <CircleMarker key={e.id} center={ll(e.geo)} radius={9} pathOptions={{ color: t.surface, weight: 3, fillColor: showPath ? t.end : t.primary, fillOpacity: 1 }}>
          <Tooltip direction="top" offset={[0, -8]}>{placeLabel(graph, e.id)}</Tooltip>
        </CircleMarker>
      ))}
      {me && (
        <CircleMarker center={ll(me)} radius={8} pathOptions={{ color: t.surface, weight: 3, fillColor: t.primary, fillOpacity: 1 }}>
          <Tooltip direction="top" offset={[0, -8]}>내 위치</Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
