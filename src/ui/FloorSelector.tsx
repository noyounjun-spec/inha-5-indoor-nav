// 세로 층 선택 버튼 (docs/UI_GUIDE.md "내비": 현재 층은 채움, 경로가 지나는 층은 점)
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FloorCode } from '../routing/index.ts';
import { availableFloors } from '../data/index.ts';
import { fontSize, TOUCH, useTheme } from './theme.ts';

interface Props {
  current: FloorCode | null;
  routeFloors: FloorCode[];
  onSelect: (f: FloorCode) => void;
}

export function FloorSelector({ current, routeFloors, onSelect }: Props) {
  const t = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: t.surface, borderColor: t.border }]}>
      {availableFloors.map((f) => {
        const on = f === current;
        return (
          <Pressable
            key={f}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${f} 보기${routeFloors.includes(f) ? ', 경로가 지나는 층' : ''}`}
            onPress={() => onSelect(f)}
            style={[styles.btn, on && { backgroundColor: t.primary }]}
          >
            <Text style={{ color: on ? t.onPrimary : t.text, fontSize: fontSize.small, fontWeight: '700' }}>{f}</Text>
            {routeFloors.includes(f) && <View style={[styles.dot, { backgroundColor: on ? t.onPrimary : t.primary }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', elevation: 3 },
  btn: { width: TOUCH + 4, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 6 },
});
