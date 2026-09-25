// 출발/도착 입력 패널 (docs/UI_GUIDE.md "위쪽 출발/도착 패널")
import { IconButton } from './common.tsx';
import { useTheme } from './theme.ts';

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
    <button type="button" aria-label={`${a11y}: ${label}`} onClick={onPress} className="place-row">
      <span className="dot" style={{ background: dot }} />
      <span className="ellipsis">{label}</span>
    </button>
  );
  return (
    <div className="place-fields safe-top">
      <IconButton icon="chevron-left" label="뒤로" onPress={onBack} />
      <div className="fields">
        {row(t.start, fromLabel, onPressFrom, '출발')}
        {row(t.end, toLabel, onPressTo, '도착')}
      </div>
      <IconButton icon="swap-vertical" label="출발지와 도착지 바꾸기" onPress={onSwap} disabled={!canSwap} />
    </div>
  );
}
