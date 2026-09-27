// S4 경로 상세: 지도/평면도 + 경로선, 단계별 안내 시트, 안내 시작 (docs/SPEC.md)
import { Fragment, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import type { FloorCode } from '../routing/index.ts';
import { useBack } from '../lib/nav.ts';
import { routeFloors } from '../lib/routeSummary.ts';
import { useTrip } from '../state/trip.ts';
import { BottomSheet } from '../ui/BottomSheet.tsx';
import { Chip, DemoBanner, FloatingButton, PrimaryButton } from '../ui/common.tsx';
import { FloorPlan } from '../ui/FloorPlan.tsx';
import { FloorDivider, InstructionRow } from '../ui/InstructionRow.tsx';
import { OutdoorMap } from '../ui/OutdoorMap.tsx';
import { FloorBar, RouteSummaryLine, VerticalBadge } from '../ui/RouteCard.tsx';

type View = 'outdoor' | FloorCode;

export default function RouteDetail() {
  const navigate = useNavigate();
  const back = useBack();
  const { routes, selected, startGeo } = useTrip();
  const route = routes[selected];
  const [view, setView] = useState<View | null>(null);
  /** 단계별 안내에서 누른 단계. 도면을 그 구간에 맞춘다 */
  const [focus, setFocus] = useState<number | null>(null);

  if (!route) return <Navigate to="/" replace />;
  const hasOutdoor = route.instructions.some((i) => i.type === 'outdoor');
  const tabs: View[] = [...(hasOutdoor ? (['outdoor'] as const) : []), ...routeFloors(route)];
  const shown = view ?? tabs[0];
  const outdoorIns = route.instructions.find((i) => i.type === 'outdoor');

  return (
    <div className="screen">
      <div className="fill">
        {shown === 'outdoor' ? (
          <OutdoorMap me={startGeo} entranceIds={outdoorIns ? [outdoorIns.nodeIds[0]] : []} showPath />
        ) : (
          <FloorPlan
            floor={shown}
            route={route}
            focusNodeIds={focus !== null ? route.instructions[focus]?.nodeIds : undefined}
            inset={{ top: 64, bottom: window.innerHeight * 0.48 }}
          />
        )}
      </div>

      <div className="detail-top">
        <FloatingButton icon="chevron-left" label="뒤로" onPress={back} />
        <div className="tabs" role="tablist">
          {tabs.map((v) => (
            <button key={v} type="button" role="tab" aria-selected={v === shown} onClick={() => (setView(v), setFocus(null))} className={`tab${v === shown ? ' on' : ''}`}>
              {v === 'outdoor' ? '실외' : v}
            </button>
          ))}
        </div>
      </div>

      <BottomSheet
        header={
          <div className="sheet-header">
            <div className="line1">
              <RouteSummaryLine route={route} />
              <span style={{ flex: 1 }} />
              <VerticalBadge route={route} />
            </div>
            <div className="chips">
              {route.labels.map((l, i) => (
                <Chip key={l} label={l} active={i === 0} />
              ))}
            </div>
            <FloorBar route={route} />
            <PrimaryButton title="안내 시작" icon="navigation-variant" onPress={() => navigate('/navigate')} />
            <DemoBanner />
          </div>
        }
      >
        {route.instructions.map((ins, i) => {
          const prev = route.instructions[i - 1];
          const newFloor = ins.type !== 'outdoor' && (!prev || prev.type === 'outdoor' || prev.toFloor !== ins.floor);
          return (
            <Fragment key={i}>
              {newFloor && <FloorDivider label={ins.floor} />}
              <InstructionRow
                ins={ins}
                active={i === focus}
                onPress={() => {
                  setView(ins.type === 'outdoor' ? 'outdoor' : ins.floor);
                  setFocus(i);
                }}
              />
            </Fragment>
          );
        })}
      </BottomSheet>
    </div>
  );
}
