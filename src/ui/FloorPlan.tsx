// 층 평면도 2D (react-native-svg). 도면 이미지가 있으면 바탕에 깔고, 없으면 복도 그래프를 선으로 그린다.
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Image as SvgImage, Line, Polyline, Text as SvgText } from 'react-native-svg';
import type { FloorCode, Route } from '../routing/index.ts';
import { floorFiles, graph, planImageFor } from '../data/index.ts';
import { useTheme } from './theme.ts';

interface Props {
  floor: FloorCode;
  route?: Route;
  /** 내비 중 현재 단계 (이전 단계 경로는 흐리게) */
  activeStep?: number;
  /** 내 위치로 표시할 노드 */
  meNodeId?: string;
}

const isWalk = (type: string) => type === 'straight' || type === 'left' || type === 'right';

export function FloorPlan({ floor, route, activeStep, meNodeId }: Props) {
  const t = useTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const files = floorFiles(floor);
  const plan = planImageFor(floor);
  const nodes = files.flatMap((f) => f.nodes);
  const onFloor = (id: string) => graph.nodes.get(id)?.floor === floor;

  // 보여 줄 범위: 도면 이미지 전체, 없으면 노드를 감싸는 상자
  let box = { x: 0, y: 0, w: 1, h: 1 };
  if (plan) box = { x: 0, y: 0, w: plan.width, h: plan.height };
  else if (nodes.length) {
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const pad = Math.max(maxX - minX, maxY - minY, 1) * 0.12;
    box = { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }
  // 화면 1pt에 해당하는 도면 단위 (선 굵기·글자 크기를 화면 기준으로 맞춘다)
  const scale = size.w && size.h ? Math.min(size.w / box.w, size.h / box.h) : 1;
  const u = 1 / scale;

  const pts = (ids: string[]) =>
    ids
      .map((id) => graph.nodes.get(id)!)
      .map((n) => `${n.x},${n.y}`)
      .join(' ');

  // 경로 중 이 층에 있는 걷기 구간
  const segments: { ids: string[]; done: boolean }[] = [];
  const verticalNodes = new Set<string>();
  route?.instructions.forEach((ins, idx) => {
    if (isWalk(ins.type)) {
      const ids = ins.nodeIds.filter(onFloor);
      if (ids.length >= 2) segments.push({ ids, done: activeStep !== undefined && idx < activeStep });
    } else if (ins.type !== 'outdoor' && ins.type !== 'arrive') {
      ins.nodeIds.filter(onFloor).forEach((id) => verticalNodes.add(id));
    }
  });
  const endId = route?.nodeIds[route.nodeIds.length - 1];
  const startId = route?.instructions.find((i) => i.type !== 'outdoor')?.nodeIds[0];

  const corridorEdges = plan
    ? []
    : files.flatMap((f) => f.edges).filter((e) => onFloor(e.from) && onFloor(e.to));

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.floorBg }]} onLayout={(e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Svg width="100%" height="100%" viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} preserveAspectRatio="xMidYMid meet">
        {plan && <SvgImage href={plan.source} x={0} y={0} width={plan.width} height={plan.height} />}

        {corridorEdges.map((e) => {
          const a = graph.nodes.get(e.from)!;
          const b = graph.nodes.get(e.to)!;
          return <Line key={`${e.from}-${e.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={t.wall} strokeWidth={14 * u} strokeLinecap="round" />;
        })}

        {!plan &&
          files
            .flatMap((f) => f.rooms)
            .map((r) => {
              const d = graph.nodes.get(r.doors[0]);
              return d ? (
                <SvgText key={r.id} x={d.x} y={d.y - 14 * u} fontSize={11 * u} fill={t.subtext} textAnchor="middle">
                  {r.name}
                </SvgText>
              ) : null;
            })}

        {segments.map((s, i) => (
          <Polyline
            key={i}
            points={pts(s.ids)}
            fill="none"
            stroke={s.done ? t.primaryDim : t.primary}
            strokeWidth={6 * u}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {[...verticalNodes].map((id) => {
          const n = graph.nodes.get(id)!;
          return (
            <G key={id}>
              <Circle cx={n.x} cy={n.y} r={9 * u} fill={t.accent} stroke={t.surface} strokeWidth={2 * u} />
              <SvgText x={n.x} y={n.y + 3.5 * u} fontSize={10 * u} fontWeight="bold" fill={t.onPrimary} textAnchor="middle">
                {n.type === 'elevator' ? 'E' : '계'}
              </SvgText>
            </G>
          );
        })}

        {startId && onFloor(startId) && (() => {
          const n = graph.nodes.get(startId)!;
          return <Circle cx={n.x} cy={n.y} r={7 * u} fill={t.start} stroke={t.surface} strokeWidth={2 * u} />;
        })()}

        {endId && onFloor(endId) && (() => {
          const n = graph.nodes.get(endId)!;
          return (
            <G>
              <Line x1={n.x} y1={n.y} x2={n.x} y2={n.y - 18 * u} stroke={t.end} strokeWidth={3 * u} />
              <Circle cx={n.x} cy={n.y - 22 * u} r={8 * u} fill={t.end} stroke={t.surface} strokeWidth={2 * u} />
            </G>
          );
        })()}

        {meNodeId && onFloor(meNodeId) && (() => {
          const n = graph.nodes.get(meNodeId)!;
          return (
            <G>
              <Circle cx={n.x} cy={n.y} r={16 * u} fill={t.primary} opacity={0.18} />
              <Circle cx={n.x} cy={n.y} r={8 * u} fill={t.primary} stroke={t.surface} strokeWidth={3 * u} />
            </G>
          );
        })()}
      </Svg>
    </View>
  );
}
