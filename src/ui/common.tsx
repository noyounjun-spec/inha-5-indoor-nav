// 여러 화면에서 쓰는 작은 부품
import type { CSSProperties } from 'react';
import {
  mdiArrowLeftTop,
  mdiArrowRightTop,
  mdiArrowUp,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClose,
  mdiCrosshairsGps,
  mdiDoor,
  mdiDoorOpen,
  mdiElevatorPassenger,
  mdiFlagCheckered,
  mdiFlaskOutline,
  mdiHistory,
  mdiInformationOutline,
  mdiMagnify,
  mdiMapMarker,
  mdiNavigationVariant,
  mdiStairs,
  mdiStairsDown,
  mdiStairsUp,
  mdiSwapVertical,
  mdiWalk,
} from '@mdi/js';
import { isDemo } from '../data/index.ts';
import { useTheme } from './theme.ts';

// Material Design Icons (MaterialCommunityIcons와 같은 아이콘 모음). 쓰는 것만 등록한다.
const ICONS = {
  'arrow-left-top': mdiArrowLeftTop,
  'arrow-right-top': mdiArrowRightTop,
  'arrow-up': mdiArrowUp,
  'chevron-left': mdiChevronLeft,
  'chevron-right': mdiChevronRight,
  close: mdiClose,
  'crosshairs-gps': mdiCrosshairsGps,
  door: mdiDoor,
  'door-open': mdiDoorOpen,
  'elevator-passenger': mdiElevatorPassenger,
  'flag-checkered': mdiFlagCheckered,
  'flask-outline': mdiFlaskOutline,
  history: mdiHistory,
  'information-outline': mdiInformationOutline,
  magnify: mdiMagnify,
  'map-marker': mdiMapMarker,
  'navigation-variant': mdiNavigationVariant,
  stairs: mdiStairs,
  'stairs-down': mdiStairsDown,
  'stairs-up': mdiStairsUp,
  'swap-vertical': mdiSwapVertical,
  walk: mdiWalk,
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color = 'currentColor' }: { name: IconName; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
      <path d={ICONS[name]} fill={color} />
    </svg>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  className = '',
  color,
  disabled,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  className?: string;
  color?: string;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <button type="button" aria-label={label} title={label} onClick={onPress} disabled={disabled} className={`icon-btn ${className}`}>
      <Icon name={icon} color={color ?? t.text} />
    </button>
  );
}

/** 떠 있는 둥근 버튼 (지도 위 내 위치 버튼 등) */
export function FloatingButton({ icon, onPress, label, className = '' }: { icon: IconName; onPress: () => void; label: string; className?: string }) {
  return <IconButton icon={icon} onPress={onPress} label={label} className={`floating ${className}`} />;
}

export function PrimaryButton({ title, icon, onPress, style }: { title: string; icon?: IconName; onPress: () => void; style?: CSSProperties }) {
  return (
    <button type="button" onClick={onPress} className="btn btn-primary" style={style}>
      {icon && <Icon name={icon} size={20} />}
      {title}
    </button>
  );
}

export function SecondaryButton({ title, onPress, style, disabled }: { title: string; onPress: () => void; style?: CSSProperties; disabled?: boolean }) {
  return (
    <button type="button" onClick={onPress} disabled={disabled} className="btn btn-secondary" style={style}>
      {title}
    </button>
  );
}

export function Chip({ label, active }: { label: string; active?: boolean }) {
  return <span className={`chip${active ? ' on' : ''}`}>{label}</span>;
}

/** 데모 데이터일 때 항상 보이는 표시 */
export function DemoBanner({ style }: { style?: CSSProperties }) {
  if (!isDemo) return null;
  return (
    <div className="banner-note demo" style={style}>
      <Icon name="flask-outline" size={16} />
      <span>데모 데이터 — 실제 5호관 도면이 아닙니다</span>
    </div>
  );
}

export function Notice({ text }: { text: string }) {
  return (
    <div className="banner-note notice">
      <Icon name="information-outline" size={16} />
      <span>{text}</span>
    </div>
  );
}
