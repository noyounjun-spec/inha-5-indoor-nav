// 단계별 안내 한 줄 (docs/UI_GUIDE.md "단계별 안내")
import type { Instruction, InstructionType } from '../routing/index.ts';
import { formatSteps } from '../lib/format.ts';
import { Icon, type IconName } from './common.tsx';
import { useTheme } from './theme.ts';

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
    <button type="button" onClick={onPress} className={`ins${active ? ' on' : ''}`}>
      <span className="ins-icon" style={{ borderColor: color }}>
        <Icon name={INSTRUCTION_ICON[ins.type]} color={color} size={20} />
      </span>
      <span className="t-body" style={{ flex: 1 }}>{ins.text}</span>
      {ins.steps > 0 && <span className="t-small sub">{formatSteps(ins.steps)}</span>}
    </button>
  );
}

/** 층이 바뀌는 곳에 넣는 구분선 */
export function FloorDivider({ label }: { label: string }) {
  return (
    <div className="divider">
      <b>{label}</b>
      <i />
    </div>
  );
}
