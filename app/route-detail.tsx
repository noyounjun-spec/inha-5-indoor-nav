// S4 경로 상세: 지도/평면도 + 경로선, 단계별 안내 시트, 안내 시작 (docs/SPEC.md)
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FloorCode } from '../src/routing/index.ts';
import { formatDistance, formatDuration, formatSteps } from '../src/lib/format.ts';
import { routeFloors } from '../src/lib/routeSummary.ts';
import { useTrip } from '../src/state/trip.ts';
import { BottomSheet } from '../src/ui/BottomSheet.tsx';
import { Chip, DemoBanner, FloatingButton, PrimaryButton } from '../src/ui/common.tsx';
import { FloorPlan } from '../src/ui/FloorPlan.tsx';
import { FloorDivider, InstructionRow } from '../src/ui/InstructionRow.tsx';
import { OutdoorMap } from '../src/ui/OutdoorMap.tsx';
import { FloorBar } from '../src/ui/RouteCard.tsx';
import { fontSize, TOUCH, useTheme } from '../src/ui/theme.ts';

type View_ = 'outdoor' | FloorCode;

export default function RouteDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { routes, selected, startGeo } = useTrip();
  const route = routes[selected];
  const hasOutdoor = !!route?.instructions.some((i) => i.type === 'outdoor');
  const floors = route ? routeFloors(route) : [];
  const tabs: View_[] = [...(hasOutdoor ? (['outdoor'] as const) : []), ...floors];
  const [view, setView] = useState<View_ | null>(null);

  if (!route) return <Redirect href="/" />;
  const shown = view ?? tabs[0];
  const outdoorIns = route.instructions.find((i) => i.type === 'outdoor');

  return (
    <View style={styles.fill}>
      <View style={styles.fill}>
        {shown === 'outdoor' ? (
          <OutdoorMap start={startGeo} entranceId={outdoorIns?.nodeIds[0]} />
        ) : (
          <FloorPlan floor={shown} route={route} />
        )}
      </View>

      <View style={[styles.top, { top: insets.top + 8 }]}>
        <FloatingButton icon="chevron-left" label="뒤로" onPress={() => router.back()} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((v) => {
            const on = v === shown;
            return (
              <Pressable
                key={v}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setView(v)}
                style={[styles.tab, { backgroundColor: on ? t.primary : t.surface, borderColor: t.border }]}
              >
                <Text style={{ color: on ? t.onPrimary : t.text, fontWeight: '700', fontSize: fontSize.small }}>
                  {v === 'outdoor' ? '실외' : v}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <BottomSheet
        header={
          <View style={styles.header}>
            <View style={styles.summary}>
              <Text style={{ color: t.text, fontSize: fontSize.time, fontWeight: '800' }}>{formatDuration(route.seconds)}</Text>
              <Text style={{ color: t.text, fontSize: fontSize.body, fontWeight: '600' }}>{formatSteps(route.steps)}</Text>
              <Text style={{ color: t.subtext, fontSize: fontSize.small }}>{formatDistance(route.meters)}</Text>
            </View>
            <View style={styles.chips}>
              {route.labels.map((l, i) => (
                <Chip key={l} label={l} active={i === 0} />
              ))}
            </View>
            <FloorBar route={route} />
            <PrimaryButton title="안내 시작" icon="navigation-variant" onPress={() => router.push('/navigate')} />
            <DemoBanner />
          </View>
        }
      >
        {route.instructions.map((ins, i) => {
          const prev = route.instructions[i - 1];
          const newFloor = ins.type !== 'outdoor' && (!prev || prev.type === 'outdoor' || prev.toFloor !== ins.floor);
          return (
            <Fragment key={i}>
              {newFloor && <FloorDivider label={ins.floor} />}
              <InstructionRow ins={ins} onPress={() => setView(ins.type === 'outdoor' ? 'outdoor' : ins.floor)} />
            </Fragment>
          );
        })}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tabs: { gap: 6, paddingRight: 12 },
  tab: { minHeight: TOUCH - 8, minWidth: TOUCH, paddingHorizontal: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  summary: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  chips: { flexDirection: 'row', gap: 6 },
});
