// Vite 설정. base를 './'로 두어 어느 경로에 올려도 동작하게 한다 (라우팅은 HashRouter)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
});
