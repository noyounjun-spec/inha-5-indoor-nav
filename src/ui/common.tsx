// 여러 화면에서 쓰는 작은 부품
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isDemo } from '../data/index.ts';
import { fontSize, TOUCH, useTheme } from './theme.ts';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export function IconButton({
  icon,
  onPress,
  label,
  style,
  color,
  disabled,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  style?: StyleProp<ViewStyle>;
  color?: string;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [styles.iconButton, { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 }, style]}
    >
      <Icon name={icon} color={color ?? t.text} />
    </Pressable>
  );
}

/** 떠 있는 둥근 버튼 (지도 위 내 위치 버튼 등) */
export function FloatingButton({ icon, onPress, label, style }: { icon: IconName; onPress: () => void; label: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <IconButton
      icon={icon}
      onPress={onPress}
      label={label}
      style={[styles.floating, { backgroundColor: t.surface, borderColor: t.border }, style]}
    />
  );
}

export function PrimaryButton({ title, icon, onPress, style }: { title: string; icon?: IconName; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primary, { backgroundColor: t.primary, opacity: pressed ? 0.85 : 1 }, style]}
    >
      {icon && <Icon name={icon} color={t.onPrimary} size={20} />}
      <Text style={[styles.primaryText, { color: t.onPrimary }]}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress, style, disabled }: { title: string; onPress: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Text style={[styles.primaryText, { color: t.text }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active }: { label: string; active?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: active ? t.primary : t.bg }]}>
      <Text style={{ color: active ? t.onPrimary : t.subtext, fontSize: fontSize.tiny, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

/** 데모 데이터일 때 항상 보이는 표시 */
export function DemoBanner({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  if (!isDemo) return null;
  return (
    <View style={[styles.demo, { backgroundColor: t.demoBg }, style]}>
      <Icon name="flask-outline" size={16} color={t.demoText} />
      <Text style={{ color: t.demoText, fontSize: fontSize.small, fontWeight: '600', flexShrink: 1 }}>
        데모 데이터 — 실제 5호관 도면이 아닙니다
      </Text>
    </View>
  );
}

export function Notice({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[styles.demo, { backgroundColor: t.bg }, style]}>
      <Icon name="information-outline" size={16} color={t.subtext} />
      <Text style={{ color: t.subtext, fontSize: fontSize.small, flexShrink: 1 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: TOUCH / 2 },
  floating: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  primary: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  primaryText: { fontSize: fontSize.body, fontWeight: '700' },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
});
