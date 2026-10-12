import { defineConfig } from 'vite';

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/tomzo-arcade/volcano/' : '/',
  build: { rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
}));
