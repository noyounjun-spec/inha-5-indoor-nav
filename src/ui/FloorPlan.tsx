// 층 평면도 2D (SVG). 도면 이미지가 있으면 바탕에 깔고, 없으면 복도 그래프를 선으로 그린다.
// 한 손가락(마우스) 끌기로 이동, 두 손가락 벌리기·휠로 확대한다 (docs/UI_GUIDE.md "평면도 그리기").
// 안내 중에는 내 위치를 따라가고, 사용자가 화면을 움직이면 "현재 위치로" 버튼을 보여 준다.
import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import type { FloorCode, Route } from '../routing/index.ts';
import { floorFiles, graph, planImageFor } from '../data/index.ts';
import { FloatingButton } from './common.tsx';
import { useTheme } from './theme.ts';

interface Props {
  floor: FloorCode;
  route?: Route;
  /** 내비 중 현재 단계 (이전 단계 경로는 흐리게) */
  activeStep?: number;
  /** 내 위치로 표시할 노드. 있으면 화면이 이 점을 따라간다 */
  meNodeId?: string;
  /** 위·아래를 가리는 패널 높이(px). 처음 화면을 맞출 때 이만큼 비워 둔다 */
  inset?: { top: number; bottom: number };
}

type Box = { x: number; y: number; w: number; h: number };
/** 화면 상태: 가운데 좌표(도면 단위)와 화면 1px당 도면 단위 */
type View = { cx: number; cy: number; s: number };

const isWalk = (type: string) => type === 'straight' || type === 'left' || type === 'right';
const MAX_ZOOM_IN = 10;

export function FloorPlan({ floor, route, activeStep, meNodeId, inset = { top: 0, bottom: 0 } }: Props) {
  const t = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    // 처음 한 번은 바로 잰다 (탭이 가려져 있으면 ResizeObserver가 늦게 온다)
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const files = floorFiles(floor);
  const plan = planImageFor(floor);
  const nodes = files.flatMap((f) => f.nodes);
  const onFloor = (id: string) => graph.nodes.get(id)?.floor === floor;

  // 도면 전체 범위: 도면 이미지 전체, 없으면 노드를 감싸는 상자
  let full: Box = { x: 0, y: 0, w: 1, h: 1 };
  if (plan) full = { x: 0, y: 0, w: plan.width, h: plan.height };
  else if (nodes.length) full = padBox(bbox(nodes), 0.12);

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
  const routeOnFloor = (route?.nodeIds ?? []).filter(onFloor).map((id) => graph.nodes.get(id)!);

  // ── 화면 맞추기 ──
  const visH = Math.max(1, size.h - inset.top - inset.bottom);
  const fullS = size.w ? Math.max(full.w / size.w, full.h / visH) : 1;
  const fit = (b: Box): View => {
    const s = Math.min(fullS, Math.max(fullS / MAX_ZOOM_IN, b.w / size.w, b.h / visH));
    // 가려지는 위·아래 패널만큼 가운데를 옮긴다
    return { cx: b.x + b.w / 2, cy: b.y + b.h / 2 + ((inset.bottom - inset.top) / 2) * s, s };
  };
  const initialView = (): View => {
    if (meNodeId && onFloor(meNodeId)) {
      const n = graph.nodes.get(meNodeId)!;
      const v = fit(routeOnFloor.length ? padBox(bbox(routeOnFloor), 0.15) : full);
      return { ...v, ...centerOn(n, v.s) };
    }
    if (routeOnFloor.length) {
      const b = padBox(bbox(routeOnFloor), 0.25);
      // 너무 좁은 구간은 도면의 1/4 폭 정도는 보이게 한다
      return fit(growTo(b, full.w / 4, full.h / 4));
    }
    return fit(full);
  };
  const centerOn = (n: { x: number; y: number }, s: number) => ({ cx: n.x, cy: n.y + ((inset.bottom - inset.top) / 2) * s });

  const [view, setView] = useState<View | null>(null);
  const [moved, setMoved] = useState(false);
  const routeKey = route?.nodeIds.join('>') ?? '';

  // 층·경로·화면 크기가 바뀌면 다시 맞춘다
  useEffect(() => {
    if (!size.w) return;
    setView(initialView());
    setMoved(false);
  }, [floor, routeKey, size.w, size.h]);

  // 내 위치가 바뀌면 따라간다 (사용자가 화면을 움직였으면 멈춘다)
  useEffect(() => {
    if (!meNodeId || moved || !view || !onFloor(meNodeId)) return;
    setView((v) => (v ? { ...v, ...centerOn(graph.nodes.get(meNodeId)!, v.s) } : v));
  }, [meNodeId]);

  const clamp = (v: View): View => {
    const s = Math.min(fullS * 1.5, Math.max(fullS / MAX_ZOOM_IN, v.s));
    return { s, cx: Math.min(full.x + full.w, Math.max(full.x, v.cx)), cy: Math.min(full.y + full.h, Math.max(full.y, v.cy)) };
  };

  // ── 손가락·마우스 조작 ──
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ view: View; mid: { x: number; y: number }; dist: number } | null>(null);
  const local = (e: { clientX: number; clientY: number }) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const startGesture = () => {
    const ps = [...pointers.current.values()];
    if (!view || !ps.length) return (gesture.current = null);
    const mid = { x: ps.reduce((a, p) => a + p.x, 0) / ps.length, y: ps.reduce((a, p) => a + p.y, 0) / ps.length };
    const dist = ps.length >= 2 ? Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) : 0;
    gesture.current = { view, mid, dist };
  };
  const onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    startGesture();
  };
  const onMove = (e: PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, local(e));
    const g = gesture.current;
    const ps = [...pointers.current.values()];
    const mid = { x: ps.reduce((a, p) => a + p.x, 0) / ps.length, y: ps.reduce((a, p) => a + p.y, 0) / ps.length };
    let s = g.view.s;
    if (ps.length >= 2 && g.dist > 0) s = g.view.s * (g.dist / Math.max(1, Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y)));
    // 제스처 시작점(g.mid) 아래의 도면 점이 지금 손가락 가운데(mid) 아래에 오도록
    const ax = g.view.cx + (g.mid.x - size.w / 2) * g.view.s;
    const ay = g.view.cy + (g.mid.y - size.h / 2) * g.view.s;
    const next = clamp({ s, cx: ax - (mid.x - size.w / 2) * s, cy: ay - (mid.y - size.h / 2) * s });
    if (Math.abs(mid.x - g.mid.x) + Math.abs(mid.y - g.mid.y) > 3 || s !== g.view.s) setMoved(true);
    setView(next);
  };
  const onUp = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    startGesture();
  };
  const onWheel = (e: WheelEvent) => {
    if (!view) return;
    const p = local(e);
    const s = clamp({ ...view, s: view.s * Math.exp(e.deltaY * 0.0015) }).s;
    const ax = view.cx + (p.x - size.w / 2) * view.s;
    const ay = view.cy + (p.y - size.h / 2) * view.s;
    setView(clamp({ s, cx: ax - (p.x - size.w / 2) * s, cy: ay - (p.y - size.h / 2) * s }));
    setMoved(true);
  };
  const recenter = () => {
    setView(initialView());
    setMoved(false);
  };

  const v = view ?? { cx: full.x + full.w / 2, cy: full.y + full.h / 2, s: fullS };
  const vb: Box = { x: v.cx - (size.w / 2) * v.s, y: v.cy - (size.h / 2) * v.s, w: Math.max(1, size.w * v.s), h: Math.max(1, size.h * v.s) };
  // 화면 1px에 해당하는 도면 단위 (선 굵기·글자 크기를 화면 기준으로 맞춘다)
  const u = v.s;

  const pts = (ids: string[]) =>
    ids
      .map((id) => graph.nodes.get(id)!)
      .map((n) => `${n.x},${n.y}`)
      .join(' ');

  const corridorEdges = plan ? [] : files.flatMap((f) => f.edges).filter((e) => onFloor(e.from) && onFloor(e.to));

  return (
    <div
      ref={ref}
      className="floor-plan"
      role="img"
      aria-label={`${floor} 평면도`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onWheel={onWheel}
    >
      <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet">
        {plan && <image href={plan.source} x={0} y={0} width={plan.width} height={plan.height} />}

        {corridorEdges.map((e) => {
          const a = graph.nodes.get(e.from)!;
          const b = graph.nodes.get(e.to)!;
          return <line key={`${e.from}-${e.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={t.wall} strokeWidth={14 * u} strokeLinecap="round" />;
        })}

        {!plan &&
          files
            .flatMap((f) => f.rooms)
            .map((r) => {
              const d = graph.nodes.get(r.doors[0]);
              return d ? (
                <text key={r.id} x={d.x} y={d.y - 14 * u} fontSize={11 * u} fill={t.subtext} textAnchor="middle">
                  {r.name}
                </text>
              ) : null;
            })}

        {segments.map((s, i) => (
          <polyline
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
            <g key={id}>
              <circle cx={n.x} cy={n.y} r={9 * u} fill={t.accent} stroke={t.surface} strokeWidth={2 * u} />
              <text x={n.x} y={n.y + 3.5 * u} fontSize={10 * u} fontWeight="bold" fill={t.onPrimary} textAnchor="middle">
                {n.type === 'elevator' ? 'E' : '계'}
              </text>
            </g>
          );
        })}

        {startId && onFloor(startId) && (() => {
          const n = graph.nodes.get(startId)!;
          return <circle cx={n.x} cy={n.y} r={7 * u} fill={t.start} stroke={t.surface} strokeWidth={2 * u} />;
        })()}

        {endId && onFloor(endId) && (() => {
          const n = graph.nodes.get(endId)!;
          return (
            <g>
              <line x1={n.x} y1={n.y} x2={n.x} y2={n.y - 18 * u} stroke={t.end} strokeWidth={3 * u} />
              <circle cx={n.x} cy={n.y - 22 * u} r={8 * u} fill={t.end} stroke={t.surface} strokeWidth={2 * u} />
            </g>
          );
        })()}

        {meNodeId && onFloor(meNodeId) && (() => {
          const n = graph.nodes.get(meNodeId)!;
          return (
            <g>
              <circle cx={n.x} cy={n.y} r={16 * u} fill={t.primary} opacity={0.18} />
              <circle cx={n.x} cy={n.y} r={8 * u} fill={t.primary} stroke={t.surface} strokeWidth={3 * u} />
            </g>
          );
        })()}
      </svg>

      {moved && (
        <FloatingButton
          icon="crosshairs-gps"
          label={meNodeId ? '현재 위치로' : '경로 다시 보기'}
          onPress={recenter}
          className="plan-recenter"
          style={{ bottom: inset.bottom + 16 }}
        />
      )}
    </div>
  );
}

function bbox(ns: { x: number; y: number }[]): Box {
  const xs = ns.map((n) => n.x);
  const ys = ns.map((n) => n.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function padBox(b: Box, ratio: number): Box {
  const pad = Math.max(b.w, b.h, 1) * ratio;
  return { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 };
}

function growTo(b: Box, minW: number, minH: number): Box {
  const w = Math.max(b.w, minW);
  const h = Math.max(b.h, minH);
  return { x: b.x - (w - b.w) / 2, y: b.y - (h - b.h) / 2, w, h };
}
