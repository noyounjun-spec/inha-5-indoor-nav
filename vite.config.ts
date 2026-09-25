// Vite 설정
// - 빌드 결과는 dist/index.html 한 파일에 JS·CSS·도면 이미지를 모두 넣는다.
//   그래서 서버 없이 파일을 더블클릭해도 열리고, 어느 정적 호스팅에 올려도 된다 (라우팅은 HashRouter).
// - 개발 서버는 같은 Wi‑Fi의 휴대폰에서도 열 수 있게 네트워크 주소를 연다.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  server: { host: true, open: true },
  preview: { host: true, open: true },
});
