// S5 내비: 다음 안내 배너, 현재 층 평면도, 층 선택, 남은 걸음·시간 (docs/SPEC.md, docs/LOCATION.md)
// 위치 센서(걸음·기압)는 6단계에서 붙인다. 지금은 '다음'을 눌러 단계를 넘긴다.
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FloorCode } from '../src/routing/index.ts';
import { formatDuration, formatSteps } from '../src/lib/format.ts';
import { remaining, routeFloors } from '../src/lib/routeSummary.ts';
import { useTrip } from '../src/state/trip.ts';
import { DemoBanner, FloatingButton, Icon, IconButton, PrimaryButton, SecondaryButton } from '../src/ui/common.tsx';
import { FloorPlan } from '../src/ui/FloorPlan.tsx';
import { FloorSelector } from '../src/ui/FloorSelector.tsx';
import { INSTRUCTION_ICON } from '../src/ui/InstructionRow.tsx';
import { OutdoorMap } from '../src/ui/OutdoorMap.tsx';
import { fontSize, useTheme } from '../src/ui/theme.ts';

type View_ = 'outdoor' | FloorCode;

export default function Navigate() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { routes, selected, startGeo } = useTrip();
  const route = routes[selected];
  const [step, setStep] = useState(0);
  const ins = route?.instructions[step];
  // 단계가 바뀌면 그 단계의 층으로 도면을 자동 전환한다 (사용자가 다른 층을 보고 있어도)
  const stepView: View_ | null = ins ? (ins.type === 'outdoor' ? 'outdoor' : ins.floor) : null;
  const [view, setView] = useState<View_ | null>(stepView);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const prevStepView = useRef(stepView);

  useEffect(() => {
    setView(stepView);
    if (prevStepView.current && stepView && prevStepView.current !== stepView) {
      setToast(stepView === 'outdoor' ? '실외 지도로 바꿨어요' : `${stepView}에 도착 — 도면을 ${stepView}로 바꿨어요`);
      Animated.sequence([
        Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.delay(1600),
        Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
    prevStepView.current = stepView;
  }, [stepView, toastOpacity]);

  if (!route || !ins) return <Redirect href="/" />;

  const last = route.instructions.length - 1;
  const next = route.instructions[step + 1];
  const rest = remaining(route, step);
  const shown = view ?? stepView!;
  const outdoorIns = route.instructions.find((i) => i.type === 'outdoor');

  const goNext = () => {
    if (step + 1 >= last) router.replace('/arrive');
    else setStep(step + 1);
  };

  return (
    <View style={styles.fill}>
      <View style={styles.fill}>
        {shown === 'outdoor' ? (
          <OutdoorMap start={startGeo} entranceId={outdoorIns?.nodeIds[0]} />
        ) : (
          <FloorPlan floor={shown} route={route} activeStep={step} meNodeId={ins.nodeIds[0]} />
        )}
      </View>

      <View style={[styles.banner, { backgroundColor: t.primary, paddingTop: insets.top + 12 }]}>
        <View style={styles.bannerRow}>
          <Icon name={INSTRUCTION_ICON[ins.type]} size={40} color={t.onPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.onPrimary, fontSize: 20, fontWeight: '800' }}>{ins.text}</Text>
            {next && <Text style={{ color: t.onPrimary, opacity: 0.85, fontSize: fontSize.small }}>다음: {next.text}</Text>}
          </View>
          <IconButton icon="close" label="안내 종료" color={t.onPrimary} onPress={() => router.back()} />
        </View>
      </View>

      <View style={[styles.side, { top: insets.top + 130 }]}>
        <FloorSelector current={shown === 'outdoor' ? null : shown} routeFloors={routeFloors(route)} onSelect={setView} />
        {shown !== stepView && <FloatingButton icon="crosshairs-gps" label="현재 단계 층으로" onPress={() => setView(stepView)} />}
      </View>

      <Animated.View pointerEvents="none" style={[styles.toast, { opacity: toastOpacity, backgroundColor: t.text, top: insets.top + 130 }]}>
        <Text style={{ color: t.surface, fontSize: fontSize.small, fontWeight: '600' }}>{toast}</Text>
      </Animated.View>

      <View style={[styles.bottom, { backgroundColor: t.surface, paddingBottom: insets.bottom + 12 }]}>
        <DemoBanner />
        <Text style={{ color: t.text, fontSize: fontSize.title, fontWeight: '700' }}>
          남은 {formatSteps(rest.steps)} · {formatDuration(rest.seconds)}
        </Text>
        <Text style={{ color: t.subtext, fontSize: fontSize.small }}>
          위치 센서 연결 전이라 단계마다 ‘다음’을 눌러 진행합니다 ({step + 1}/{last}단계)
        </Text>
        <View style={styles.buttons}>
          <SecondaryButton title="이전" onPress={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{ flex: 1 }} />
          <PrimaryButton title={step + 1 >= last ? '도착' : '다음'} onPress={goNext} style={{ flex: 2 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  banner: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 16, paddingBottom: 14 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  side: { position: 'absolute', right: 12, gap: 10, alignItems: 'center' },
  toast: { position: 'absolute', alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, gap: 8, borderTopLeftRadius: 18, borderTopRightRadius: 18, elevation: 12 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
