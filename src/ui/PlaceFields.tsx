// 출발/도착 입력 패널 (docs/UI_GUIDE.md "위쪽 출발/도착 패널")
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconButton } from './common.tsx';
import { fontSize, TOUCH, useTheme } from './theme.ts';

interface Props {
  fromLabel: string;
  toLabel: string;
  onPressFrom: () => void;
  onPressTo: () => void;
  onSwap: () => void;
  canSwap: boolean;
  onBack: () => void;
}

export function PlaceFields({ fromLabel, toLabel, onPressFrom, onPressTo, onSwap, canSwap, onBack }: Props) {
  const t = useTheme();
  const row = (dot: string, label: string, onPress: () => void, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${a11y}: ${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: t.bg, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text numberOfLines={1} style={{ color: t.text, fontSize: fontSize.body, flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
  return (
    <View style={[styles.wrap, { backgroundColor: t.surface, borderColor: t.border }]}>
      <IconButton icon="chevron-left" label="뒤로" onPress={onBack} />
      <View style={styles.fields}>
        {row(t.start, fromLabel, onPressFrom, '출발')}
        {row(t.end, toLabel, onPressTo, '도착')}
      </View>
      <IconButton icon="swap-vertical" label="출발지와 도착지 바꾸기" onPress={onSwap} disabled={!canSwap} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingRight: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  fields: { flex: 1, gap: 6 },
  row: { minHeight: TOUCH, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
