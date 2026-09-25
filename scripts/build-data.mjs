#!/usr/bin/env node
// data/floors/*.json 을 앱에서 쓸 수 있게 src/data/generated.ts 로 묶는다.
// 사용법: node scripts/build-data.mjs   (npm run dev·build 가 먼저 실행한다)
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const dir = 'data/floors';
const out = 'src/data/generated.ts';

const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
const floors = files.map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));

// 도면 이미지 크기는 PNG 헤더에서 읽는다 (평면도 좌표 = 이미지 픽셀)
const images = new Map();
for (const d of floors) {
  if (!d.image || images.has(d.image)) continue;
  if (!existsSync(d.image)) {
    console.error(`도면 이미지가 없습니다: ${d.image} (${d.building}-${d.floor})`);
    process.exit(1);
  }
  const b = readFileSync(d.image);
  if (b.toString('ascii', 1, 4) !== 'PNG') {
    console.error(`PNG 이미지만 지원합니다: ${d.image}`);
    process.exit(1);
  }
  images.set(d.image, { width: b.readUInt32BE(16), height: b.readUInt32BE(20) });
}

const text = [
  '// 자동 생성 파일 — scripts/build-data.mjs 가 data/floors/*.json 으로 만든다. 직접 고치지 않는다.',
  "import type { FloorFile } from '../routing/types.ts';",
  "import type { PlanImage } from './types.ts';",
  '',
  `export const floors: FloorFile[] = ${JSON.stringify(floors, null, 2)};`,
  '',
  'export const planImages: Record<string, PlanImage> = {',
  ...[...images].map(
    ([p, { width, height }]) => `  ${JSON.stringify(p)}: { source: new URL('../../${p}', import.meta.url).href, width: ${width}, height: ${height} },`,
  ),
  '};',
  '',
].join('\n');

// 내용이 같으면 다시 쓰지 않는다 (Vite 불필요한 새로고침 방지)
if (!existsSync(out) || readFileSync(out, 'utf8') !== text) writeFileSync(out, text);
console.log(`층 파일 ${floors.length}개 · 도면 이미지 ${images.size}개 → ${out}${floors.length ? '' : ' (데이터 없음: 앱은 데모 모드로 실행)'}`);
