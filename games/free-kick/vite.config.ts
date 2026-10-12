import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const BASE = '/tomzo-arcade/free-kick/';

/**
 * 旧バージョン名の URL → 今の名前（public/ver.*）。旧 soccer-app からの転送やブックマークが
 * 旧名を指しているので、転送ページだけ残す。
 */
const LEGACY_REDIRECTS: Record<string, string> = {
  'v1': 'ver.1.0.c',
  'v2': 'ver.2.0.c',
  'v2/v1': 'ver.1.0.c',
  'ver.c.1': 'ver.1.0.c',
  'ver.c.2': 'ver.2.0.c',
  'ver.c.3': 'ver.3.0.c',
  'ver.c.3/v1': 'ver.1.0.c',
  'ver.c.3/v2': 'ver.2.0.c',
  'ver.c.4': 'ver.4.0.c',
  'ver.g.1': 'ver.3.1.g',
};

/** 本番ビルドに旧名の転送ページ（meta refresh）を出力する */
function legacyRedirects(): Plugin {
  return {
    name: 'free-kick-legacy-redirects',
    apply: 'build',
    generateBundle() {
      for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
        const href = `${BASE}${to}/`;
        this.emitFile({
          type: 'asset',
          fileName: `${from}/index.html`,
          source: `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${to}</title><meta http-equiv="refresh" content="0;url=${href}"><link rel="canonical" href="${href}"></head><body><a href="${href}">${to}で遊ぶ →</a></body></html>\n`,
        });
      }
    },
  };
}

// 本番ビルド時のみ GitHub Pages 用のサブパスを base にする。
// 開発サーバー(dev)では '/' のままにして localhost で素直に開けるようにする。
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? BASE : '/',
  plugins: [react(), legacyRedirects()],
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
