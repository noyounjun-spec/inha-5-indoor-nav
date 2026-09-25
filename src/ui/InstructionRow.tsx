// 단계별 안내 한 줄 (docs/UI_GUIDE.md "단계별 안내")
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Instruction, InstructionType } from '../routing/index.ts';
import { formatSteps } from '../lib/format.ts';
import { Icon, type IconName } from './common.tsx';
import { fontSize, TOUCH, useTheme } from './theme.ts';

export const INSTRUCTION_ICON: Record<InstructionType, IconName> = {
  outdoor: 'walk',
  straight: 'arrow-up',
  left: 'arrow-left-top',
  right: 'arrow-right-top',
  'stair-up': 'stairs-up',
  'stair-down': 'stairs-down',
  elevator: 'elevator-passenger',
  arrive: 'map-marker',
};

const isVertical = (i: Instruction) => i.type === 'stair-up' || i.type === 'stair-down' || i.type === 'elevator';

export function InstructionRow({ ins, active, onPress }: { ins: Instruction; active?: boolean; onPress?: () => void }) {
  const t = useTheme();
  const color = ins.type === 'arrive' ? t.end : isVertical(ins) ? t.accent : t.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, active && { backgroundColor: t.bg }]}
    >
      <View style={[styles.icon, { borderColor: color }]}>
        <Icon name={INSTRUCTION_ICON[ins.type]} color={color} size={20} />
      </View>
      <Text style={{ color: t.text, fontSize: fontSize.body, flex: 1 }}>{ins.text}</Text>
      {ins.steps > 0 && <Text style={{ color: t.subtext, fontSize: fontSize.small }}>{formatSteps(ins.steps)}</Text>}
    </Pressable>
  );
}

/** 층이 바뀌는 곳에 넣는 구분선 */
export function FloorDivider({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={styles.divider}>
      <View style={[styles.badge, { backgroundColor: t.primary }]}>
        <Text style={{ color: t.onPrimary, fontSize: fontSize.tiny, fontWeight: '700' }}>{label}</Text>
      </View>
      <View style={[styles.line, { backgroundColor: t.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: TOUCH + 8, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  icon: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
