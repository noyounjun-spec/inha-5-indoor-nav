// 화면에 보여 줄 숫자 형식. 계산은 하지 않고 src/routing 결과를 글자로만 바꾼다.

export function formatDuration(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatSteps(steps: number): string {
  return `${String(Math.round(steps)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}걸음`;
}
