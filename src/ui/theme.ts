// 색 토큰. 값의 기준은 docs/UI_GUIDE.md "색" 표. 화면 코드에 색 값을 직접 쓰지 않는다.
import { useColorScheme } from 'react-native';

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

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const fontSize = { time: 22, title: 17, body: 15, small: 13, tiny: 11 };

/** 최소 터치 영역 (docs/UI_GUIDE.md 접근성) */
export const TOUCH = 44;
