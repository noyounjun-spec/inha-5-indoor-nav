import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (dir: string) => spawnSync(process.execPath, ['scripts/validate-graph.mjs', dir], { encoding: 'utf8' });

test('가상 데이터는 검사를 통과한다', () => {
  assert.equal(run('tests/fixtures/mini').status, 0);
});

test('끊긴 방과 잘못된 ID는 오류', () => {
  const dir = mkdtempSync(join(tmpdir(), 'floors-'));
  const d = JSON.parse(readFileSync('tests/fixtures/mini/5S-1F.json', 'utf8'));
  d.edges = d.edges.filter((e: { to: string }) => e.to !== '5S-1F-N06');
  d.rooms.push({ id: '5S-2F-999', name: '다른 층 방', doors: ['5S-1F-N02'] });
  writeFileSync(join(dir, '5S-1F.json'), JSON.stringify(d));
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /5S-1F-101: 입구에서 도달할 수 없음/);
  assert.match(r.stdout, /방 ID 형식 오류/);
});
