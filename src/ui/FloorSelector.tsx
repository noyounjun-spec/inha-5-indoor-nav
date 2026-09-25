// 세로 층 선택 버튼 (docs/UI_GUIDE.md "내비": 현재 층은 채움, 경로가 지나는 층은 점)
import type { FloorCode } from '../routing/index.ts';
import { availableFloors } from '../data/index.ts';

interface Props {
  current: FloorCode | null;
  routeFloors: FloorCode[];
  onSelect: (f: FloorCode) => void;
}

export function FloorSelector({ current, routeFloors, onSelect }: Props) {
  return (
    <div className="floor-sel">
      {availableFloors.map((f) => {
        const on = f === current;
        const onRoute = routeFloors.includes(f);
        return (
          <button
            key={f}
            type="button"
            aria-pressed={on}
            aria-label={`${f} 보기${onRoute ? ', 경로가 지나는 층' : ''}`}
            onClick={() => onSelect(f)}
            className={on ? 'on' : ''}
          >
            {f}
            {onRoute && <i />}
          </button>
        );
      })}
    </div>
  );
}
