// 실제 층 데이터가 없을 때 앱을 띄워 보기 위한 가상 데이터 (tests/fixtures/mini).
// 실제 5호관 도면이 아니므로 화면에 항상 데모 표시를 띄운다.
import type { FloorFile } from '../routing/types.ts';
import f1 from '../../tests/fixtures/mini/5S-1F.json';
import f2 from '../../tests/fixtures/mini/5S-2F.json';

export const demoFloors = [f1, f2] as FloorFile[];
