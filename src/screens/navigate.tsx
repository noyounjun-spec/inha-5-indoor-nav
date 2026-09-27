// S5 내비: 다음 안내 배너, 현재 층 평면도, 층 선택, 남은 걸음·시간 (docs/SPEC.md, docs/LOCATION.md)
// 브라우저에서는 걸음·기압 센서를 쓸 수 없어서 '다음'을 눌러 단계를 넘긴다.
import { useEffect, useRef, useState } from 'react';
import { Navigate as Redirect, useNavigate } from 'react-router';
import type { FloorCode } from '../routing/index.ts';
import { formatDuration, formatSteps } from '../lib/format.ts';
import { useBack } from '../lib/nav.ts';
import { remaining, routeFloors } from '../lib/routeSummary.ts';
import { useTrip } from '../state/trip.ts';
import { DemoBanner, FloatingButton, Icon, IconButton, PrimaryButton, SecondaryButton } from '../ui/common.tsx';
import { FloorPlan } from '../ui/FloorPlan.tsx';
import { FloorSelector } from '../ui/FloorSelector.tsx';
import { INSTRUCTION_ICON } from '../ui/InstructionRow.tsx';
import { OutdoorMap } from '../ui/OutdoorMap.tsx';
import { useTheme } from '../ui/theme.ts';

type View = 'outdoor' | FloorCode;

export default function Navigate() {
  const t = useTheme();
  const navigate = useNavigate();
  const back = useBack();
  const { routes, selected, startGeo } = useTrip();
  const route = routes[selected];
  const [step, setStep] = useState(0);
  const ins = route?.instructions[step];
  // 단계가 바뀌면 그 단계의 층으로 도면을 자동 전환한다 (사용자가 다른 층을 보고 있어도)
  const stepView: View | null = ins ? (ins.type === 'outdoor' ? 'outdoor' : ins.floor) : null;
  const [view, setView] = useState<View | null>(stepView);
  const [toast, setToast] = useState<string | null>(null);
  const prevStepView = useRef(stepView);

  useEffect(() => {
    setView(stepView);
    if (prevStepView.current && stepView && prevStepView.current !== stepView) {
      setToast(stepView === 'outdoor' ? '실외 지도로 바꿨어요' : `${stepView}에 도착 — 도면을 ${stepView}로 바꿨어요`);
      const timer = setTimeout(() => setToast(null), 1800);
      prevStepView.current = stepView;
      return () => clearTimeout(timer);
    }
    prevStepView.current = stepView;
  }, [stepView]);

  if (!route || !ins) return <Redirect to="/" replace />;

  const last = route.instructions.length - 1;
  const next = route.instructions[step + 1];
  const rest = remaining(route, step);
  const shown = view ?? stepView!;
  const outdoorIns = route.instructions.find((i) => i.type === 'outdoor');

  const goNext = () => {
    if (step + 1 >= last) navigate('/arrive', { replace: true });
    else setStep(step + 1);
  };

  return (
    <div className="screen">
      <div className="fill">
        {shown === 'outdoor' ? (
          <OutdoorMap me={startGeo} entranceIds={outdoorIns ? [outdoorIns.nodeIds[0]] : []} showPath />
        ) : (
          <FloorPlan
            floor={shown}
            route={route}
            activeStep={step}
            // 지금 단계의 층을 볼 때만 내 위치와 지금 구간에 맞춘다 (다른 층을 볼 때는 그 층의 경로 전체)
            meNodeId={shown === stepView ? ins.nodeIds[0] : undefined}
            focusNodeIds={shown === stepView ? ins.nodeIds : undefined}
            inset={{ top: 120, bottom: 190 }}
          />
        )}
      </div>

      <div className="nav-banner" aria-live="polite">
        <Icon name={INSTRUCTION_ICON[ins.type]} size={40} color={t.onPrimary} />
        <div style={{ flex: 1 }}>
          <div className="text">{ins.text}</div>
          {next && <div className="next">다음: {next.text}</div>}
        </div>
        {/* 길을 잃었으면 근처 호실을 다시 입력해 그 자리에서 다시 찾는다 */}
        <IconButton icon="map-marker" label="근처 호실로 위치 다시 입력" color={t.onPrimary} onPress={() => navigate('/search?field=from')} />
        <IconButton icon="close" label="안내 종료" color={t.onPrimary} onPress={back} />
      </div>

      <div className="nav-side">
        <FloorSelector current={shown === 'outdoor' ? null : shown} routeFloors={routeFloors(route)} onSelect={setView} />
        {shown !== stepView && <FloatingButton icon="crosshairs-gps" label="현재 단계 층으로" onPress={() => setView(stepView)} />}
      </div>

      <div className={`toast${toast ? ' show' : ''}`} role="status">
        {toast}
      </div>

      <div className="nav-bottom">
        <DemoBanner />
        <div className="t-title">
          남은 {formatSteps(rest.steps)} · {formatDuration(rest.seconds)}
        </div>
        <div className="t-small sub">
          단계마다 ‘다음’을 눌러 진행합니다 ({step + 1}/{last}단계)
        </div>
        <div className="nav-buttons">
          <SecondaryButton title="이전" onPress={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{ flex: 1 }} />
          <PrimaryButton title={step + 1 >= last ? '도착' : '다음'} onPress={goNext} style={{ flex: 2 }} />
        </div>
      </div>
    </div>
  );
}
