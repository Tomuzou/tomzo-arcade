# TOMZO ARCADE — CLAUDE.md

ブラウザで遊べるミニゲーム集。トップのハブからゲームを選んで遊ぶ。共通ルールはこのファイル、各ゲーム固有の仕様は `games/<id>/CLAUDE.md`。Codex 用の `AGENTS.md` はこれらを読むための入口。

公開URL：`https://tomuzou.github.io/tomzo-arcade/`（ハブ）、`/tomzo-arcade/<id>/`（各ゲーム）

## 構成（npm workspaces）

```
hub/                 # ゲーム一覧のトップ（React + Vite）。PWA（manifest・Service Worker・アイコン）もここ
  src/games.ts       # 並べるゲームの一覧（タイトル・説明・サムネ・パス・過去バージョン）
  public/            # manifest.webmanifest / sw.js / icons/ / thumbs/
packages/core/       # 全ゲーム共有のユーティリティ（TS のまま各 Vite が直接読む）
games/<id>/          # 各ゲーム。独立した Vite アプリ（依存ライブラリやバージョンはゲームごとに自由）
  free-kick/         # FREE KICK LAB（全バージョンのアーカイブ込み）
  bowling/           # GIMMICK BOWLING（旧 Tomuzou/bowling-app）
scripts/
  build.mjs          # hub と全 games を個別ビルド → dist/（hub）と dist/<id>/ に組み立て
  verify.mjs         # dist 内の全 HTML の js/css/画像参照とリダイレクト先、PWA ファイルの実在を検証
  desktop.mjs / launch-desktop.ps1  # ローカル専用ウィンドウ（Play-Local.cmd）
.github/workflows/deploy.yml  # main push → npm ci → test → build → verify → GitHub Pages
```

## コマンド（リポジトリ直下）

```bash
npm install                # 全ワークスペースの依存をまとめて入れる
npm run dev                # ハブの開発サーバー
npm run dev:free-kick      # 各ゲームの開発サーバー（ゲームごとに dev:<id> を足す）
npm test                   # 全ワークスペースのユニットテスト
npm run build              # アーケード全体を dist/ に組み立て
npm run verify             # 組み立て結果のリンク検証
npm run test:browser       # 各ゲームの Playwright（ゲームのフォルダで個別実行も可）
npm run play:desktop       # 本番ビルドして専用ウィンドウでハブを開く（--page=free-kick/ 等で開くページ指定）
```

- Git Bash で `--base=/...` などスラッシュ始まりの引数を渡すときは `MSYS_NO_PATHCONV=1` を付ける（付けないと `C:/Program Files/Git/...` に化ける）

## ゲームを追加する手順

1. `games/<id>/` に Vite アプリを作る。`package.json` の name は `@tomzo-arcade/<id>`、`scripts.build` を用意する
2. `vite.config.ts` の base を本番 `/tomzo-arcade/<id>/`、開発 `/` にする
3. ハブへ戻るリンクは `@tomzo-arcade/core` の `hubUrl(import.meta.env.BASE_URL)` で作る（開発時は null）
4. `hub/src/games.ts` に1件追加し、サムネイル（16:9 の jpg）を `hub/public/thumbs/` に置く
5. ルートの `package.json` に `dev:<id>` を足す。`npm run build && npm run verify` が通ることを確認
- `<id>` はハブの公開ファイル（`assets` `icons` `thumbs` など）と重ならない名前にする（build.mjs が衝突を検出する）

## 方針

- 各ゲームは別ページ。ゲームを切り替えるとページごと切り替わり、WebGL などの資源が確実に解放される。1つの SPA に全ゲームを詰め込まない
- 共通化するのは「全ゲームで同じになるもの」だけ（保存の安全な読み書き、ハブへのリンク等）。ゲームの中身は各ゲームに閉じる
- 保存キーはゲームごとに名前空間を分ける（例 `free-kick-3d.c4`、`gimmick-bowling.*`）。同じオリジンの localStorage を全ゲームで共有しているため
- Service Worker（`hub/public/sw.js`）は `/tomzo-arcade/` 全体が範囲。ネットワーク優先・失敗時だけキャッシュなので、デプロイした更新はそのまま届く。挙動を変えたらキャッシュ名（`tomzo-arcade-vN`）を上げる
- ブラウザテストはソフトウェア描画（swiftshader）で遅いので CI では回さない

## 旧リポジトリ

- `Tomuzou/soccer-app` は FREE KICK LAB の開発元。移行前の開発履歴はそちらに残っている。ver.4.0.c（旧 ver.c.4）のソースは `claude-c4` ブランチから移し、今の最新版 ver.4.1.c の `src/` になっている
- 旧URL `/soccer-app/…` は、soccer-app 側の GitHub Pages から `/tomzo-arcade/free-kick/…` へ転送する
