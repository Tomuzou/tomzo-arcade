import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ver.c.4 のソース。本番ビルドは公開中の凍結版と同じ base にし、
// scripts/build-c4.mjs が dist/ を ../public/ver.c.4/ へコピーする。開発サーバー(dev)は '/'。
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/tomzo-arcade/free-kick/ver.c.4/' : '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 大きなライブラリはアプリ本体と分けてキャッシュ効率を上げる
        manualChunks: {
          three: ['three'],
          physics: ['cannon-es'],
        },
      },
    },
  },
}));
