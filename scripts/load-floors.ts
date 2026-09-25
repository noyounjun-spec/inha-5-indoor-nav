// Node 스크립트·테스트용 층 파일 로더 (앱에서는 쓰지 않는다)
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FloorFile } from '../src/routing/types.ts';

export function loadFloors(dir = 'data/floors'): FloorFile[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as FloorFile);
}
