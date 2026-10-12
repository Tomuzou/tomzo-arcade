import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ハブは公開ルート（/tomzo-arcade/）に置く。各ゲームはその下の /tomzo-arcade/<id>/ に並ぶ
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/tomzo-arcade/' : '/',
  plugins: [react()],
}));
