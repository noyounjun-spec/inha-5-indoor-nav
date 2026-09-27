// 끌어 올리는 아래 시트. 높이는 접힘·중간·펼침 세 단계 (docs/UI_GUIDE.md)
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

interface Props {
  /** 화면 높이 대비 시트 높이 (작은 것부터) */
  snaps?: [number, number, number];
  initial?: 0 | 1 | 2;
  header?: ReactNode;
  children: ReactNode;
}

export function BottomSheet({ snaps = [0.22, 0.48, 0.88], initial = 1, header, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [snap, setSnap] = useState<number>(initial);
  const [dragY, setDragY] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startTop: number; lastY: number; lastT: number; v: number } | null>(null);

  // 시트는 부모(화면) 높이를 기준으로 자리를 잡는다
  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    setHeight(parent.clientHeight);
    const ro = new ResizeObserver(() => setHeight(parent.clientHeight));
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  const tops = snaps.map((s) => height * (1 - s));
  const top = dragY ?? tops[snap];

  const onDown = (e: PointerEvent) => {
    // 머리 안의 버튼(안내 시작 등)은 누름을 그대로 받게 둔다
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startTop: tops[snap], lastY: e.clientY, lastT: e.timeStamp, v: 0 };
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (e.timeStamp > d.lastT) d.v = (e.clientY - d.lastY) / (e.timeStamp - d.lastT);
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    setDragY(Math.min(tops[0], Math.max(tops[2], d.startTop + e.clientY - d.startY)));
  };
  const onUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const moved = e.clientY - d.startY;
    // 거의 안 움직였으면 손잡이 탭: 다음 단계로 넓힌다 (펼침이면 중간으로)
    if (Math.abs(moved) < 6) setSnap(snap === 2 ? 1 : snap + 1);
    else {
      const aim = d.startTop + moved + d.v * 150;
      setSnap(tops.reduce((best, p, i) => (Math.abs(p - aim) < Math.abs(tops[best] - aim) ? i : best), 0));
    }
    setDragY(null);
  };

  return (
    <div
      ref={ref}
      className={`sheet${dragY === null ? ' animate' : ''}`}
      style={{ height, transform: `translateY(${top}px)`, visibility: height ? 'visible' : 'hidden' }}
    >
      <div className="sheet-drag" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div className="sheet-handle" role="button" aria-label="시트 크기 조절">
          <i />
        </div>
        {header}
      </div>
      {/* 시트가 접혀 있어도 마지막 항목까지 스크롤할 수 있도록 아래 여백을 둔다 */}
      <div className="sheet-body" style={{ paddingBottom: top }}>
        {children}
      </div>
    </div>
  );
}
