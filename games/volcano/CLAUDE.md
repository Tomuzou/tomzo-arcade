# VOLCANO ROLL — 開発ガイド

TOMZO ARCADE の玉転がしゲーム。共通ルールはリポジトリ直下の `CLAUDE.md`。
ユーザーの「ターゲットマシン ボルケーノのように、玉を転がして穴や坂を避けながらゴールを目指す」という案から作ったオリジナルの盤面。

- Three.js + TypeScript + Vite。独立したページ `/tomzo-arcade/volcano/`。
- `src/stages.ts`：5コースのデータ。穴・壁・ガウス型の坂・中継地点・ゴール。
- `src/physics.ts`：1/120秒の固定刻み、坂の勾配、転がり・減衰・ブレーキ、壁衝突、穴／ゴールの線分スイープ判定。物理は描画から分離。
- `src/scene.ts`：台のメッシュ・穴・坂・玉。台の視覚的な傾きは演出。物理上の入力が転がる力を決める。
- `src/main.ts`：画面、入力、状態遷移、記録保存。矢印/WASD、Spaceでブレーキ、Rで最初から、Escで一時停止。スマホは長押しの画面ボタン。
- 保存キー `volcano-roll.records.v1`。コース別の最短タイムだけを保存。失敗後の再挑戦はそれまでの時間を引き継ぎ、停止／メニュー／非表示中は時計を止める。
- 画面上部の「メニュー」「← ゲーム選択」は全状態で表示し、キーボードでもアクセスできるようにする。メニューはプレイを停止してコース一覧を表示。
- ハブへのリンクは `hubUrl(import.meta.env.BASE_URL)`。開発時はローカル全体プレビュー `http://127.0.0.1:4180/tomzo-arcade/` へ戻す（直下で `node scripts/desktop.mjs --serve-only` を起動）。

コマンド：`npm run dev` / `npm run build` / `npm test`。ビルド後に `npm run test:browser` で Chrome の操作・保存・一時停止・スマホ表示を確認（CIでは実行しない）。全体の確認はリポジトリ直下で `npm test`、`npm run build`、`npm run verify`。
物理を変えたら穴のすり抜け・壁衝突・坂・ブレーキのテストと実プレイを確認する。
