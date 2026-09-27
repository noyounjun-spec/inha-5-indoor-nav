#!/usr/bin/env node
// GitHub Pages 배포: 빌드한 dist/index.html을 gh-pages 브랜치에 올린다.
// 사용법: npm run deploy  (먼저 npm run build를 실행한다)
// gh-pages 브랜치는 배포 결과만 담는 브랜치라 매번 새로 만들어 덮어쓴다.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

if (!existsSync('dist/index.html')) {
  console.error('dist/index.html이 없습니다. 먼저 npm run build를 실행하세요.');
  process.exit(1);
}

const git = (args, cwd) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();
const remote = git(['remote', 'get-url', 'origin'], '.');
const head = git(['rev-parse', '--short', 'HEAD'], '.');

const dir = mkdtempSync(join(tmpdir(), 'pages-'));
try {
  cpSync('dist', dir, { recursive: true });
  // Jekyll 처리를 끈다 (파일을 그대로 내보낸다)
  writeFileSync(join(dir, '.nojekyll'), '');
  git(['init', '-q', '-b', 'gh-pages'], dir);
  git(['add', '-A'], dir);
  git(['-c', 'user.name=deploy', '-c', 'user.email=deploy@localhost', 'commit', '-q', '-m', `배포: ${head}`], dir);
  git(['push', '-q', '--force', remote, 'gh-pages'], dir);
  console.log(`gh-pages 브랜치에 배포했습니다 (${head}). 1~2분 뒤 GitHub Pages 주소에 반영됩니다.`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
