// PostToolUse 훅: data/floors/*.json 을 고치면 validate-graph 를 자동 실행한다.
// 오류가 있으면 exit 2 로 Claude 에게 결과를 돌려준다.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let path = '';
  try {
    path = JSON.parse(raw).tool_input?.file_path ?? '';
  } catch {
    process.exit(0);
  }
  if (!/[\\/]data[\\/]floors[\\/][^\\/]+\.json$/.test(path)) process.exit(0);
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const r = spawnSync(process.execPath, [join(root, 'scripts', 'validate-graph.mjs'), join(root, 'data', 'floors')], {
    encoding: 'utf8',
    cwd: root,
  });
  if (r.status !== 0) {
    process.stderr.write(`validate-graph 실패 — 데이터를 고쳐야 합니다:\n${r.stdout}${r.stderr}`);
    process.exit(2);
  }
  process.exit(0);
});
