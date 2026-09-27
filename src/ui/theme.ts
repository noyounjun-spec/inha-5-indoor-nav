// 색 토큰. 값의 기준은 docs/UI_GUIDE.md "색" 표. 화면 코드에 색 값을 직접 쓰지 않는다.
// CSS에서는 같은 토큰을 --primary 같은 CSS 변수로 쓴다 (applyThemeVars가 넣어 준다).
import { useSyncExternalStore } from 'react';

const light = {
  primary: '#3563E9',
  primaryDim: '#A9BCF5',
  onPrimary: '#FFFFFF',
  accent: '#F2994A',
  start: '#2BB673',
  end: '#E5484D',
  text: '#1B1D22',
  subtext: '#6B7280',
  surface: '#FFFFFF',
  bg: '#F4F5F7',
  floorBg: '#F4F5F7',
  /** 도면 이미지 바탕색. 다크 모드에서도 도면 이미지와 이어지도록 같은 값을 쓴다 */
  planPaper: '#EEF1EF',
  wall: '#C9CDD4',
  border: '#E3E5E8',
  outdoor: '#9CA3AF',
  demoBg: '#FFF4E5',
  demoText: '#8A4B00',
};

const dark: typeof light = {
  ...light,
  text: '#F2F3F5',
  subtext: '#9CA3AF',
  surface: '#1E2025',
  bg: '#15171B',
  floorBg: '#15171B',
  wall: '#3A3F47',
  border: '#2C3037',
  outdoor: '#6B7280',
  demoBg: '#3A2A12',
  demoText: '#FFD79A',
};

export type Theme = typeof light;

const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const subscribe = (l: () => void) => {
  query?.addEventListener('change', l);
  return () => query?.removeEventListener('change', l);
};
const isDark = () => !!query?.matches;

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, isDark) ? dark : light;
}

/** 토큰을 CSS 변수로 넣는다 (camelCase → --kebab-case). 시스템 다크 모드가 바뀌면 다시 넣는다. */
export function applyThemeVars() {
  const apply = () => {
    const t = isDark() ? dark : light;
    const root = document.documentElement.style;
    for (const [k, v] of Object.entries(t)) root.setProperty(`--${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`, v);
  };
  apply();
  subscribe(apply);
}

/** 글자 크기(px) */
export const fontSize = { time: 22, title: 17, body: 15, small: 13, tiny: 11 };

/** 최소 터치 영역 (docs/UI_GUIDE.md 접근성) */
export const TOUCH = 44;
