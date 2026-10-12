import { defineConfig } from "vite";

// 本番ビルド時のみ TOMZO ARCADE の公開パスを base にする。開発サーバー(dev)は '/'。
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/tomzo-arcade/bowling/" : "/",
  server: {
    open: true,
  },
}));
