// 끌어 올리는 아래 시트. 높이는 접힘·중간·펼침 세 단계 (docs/UI_GUIDE.md)
import { useMemo, useRef, type ReactNode } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTheme } from './theme.ts';

interface Props {
  /** 화면 높이 대비 시트 높이 (작은 것부터) */
  snaps?: [number, number, number];
  initial?: 0 | 1 | 2;
  header?: ReactNode;
  children: ReactNode;
}

export function BottomSheet({ snaps = [0.22, 0.48, 0.88], initial = 1, header, children }: Props) {
  const t = useTheme();
  const { height } = useWindowDimensions();
  const tops = snaps.map((s) => height * (1 - s));
  const y = useRef(new Animated.Value(tops[initial])).current;
  const cur = useRef(tops[initial]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
        onPanResponderMove: (_, g) => y.setValue(Math.min(tops[0], Math.max(tops[2], cur.current + g.dy))),
        onPanResponderRelease: (_, g) => {
          const aim = cur.current + g.dy + g.vy * 150;
          const target = tops.reduce((best, p) => (Math.abs(p - aim) < Math.abs(best - aim) ? p : best), tops[0]);
          cur.current = target;
          Animated.spring(y, { toValue: target, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [height],
  );

  return (
    <Animated.View style={[styles.sheet, { height, backgroundColor: t.surface, transform: [{ translateY: y }] }]}>
      <View {...pan.panHandlers}>
        <View style={styles.handleArea} accessibilityLabel="시트 크기 조절">
          <View style={[styles.handle, { backgroundColor: t.border }]} />
        </View>
        {header}
      </View>
      {/* 시트가 접혀 있어도 마지막 항목까지 스크롤할 수 있도록 아래 여백을 둔다 */}
      <ScrollView contentContainerStyle={{ paddingBottom: height * (1 - snaps[0]) }}>{children}</ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
  },
  handleArea: { alignItems: 'center', paddingVertical: 10 },
  handle: { width: 40, height: 5, borderRadius: 3 },
});
