# CLAW MACHINE 3D — CLAUDE.md

> このゲームは **TOMZO ARCADE** の `games/claw-machine/`（公開URL `/tomzo-arcade/claw-machine/`）。アーケード共通のルール（構成・ビルド・公開）はリポジトリ直下の `CLAUDE.md`。
> 旧リポジトリ `Tomuzou/claw-machine-app`（ce352f5 まで）から 2026-10-12 に移した。それ以前の履歴はそちらに残っている。今後の開発はここで行う。

Three.js + cannon-es + Vite + TypeScript の 3D クレーンゲーム。遊び方・ディレクトリ構成・ロードマップは `README.md`。

## コマンド

```bash
npm run dev      # 開発サーバー（リポジトリ直下なら npm run dev:claw-machine）
npm run build    # 本番ビルド（tsc 型チェック → vite build、base は /tomzo-arcade/claw-machine/）
npm run lint     # ESLint
npm run format   # Prettier（設定は .prettierrc：シングルクォート・セミコロンあり・幅100）
```

- このゲームだけ Vite 8・TypeScript 6・three 0.185 を使う（npm workspaces が `games/claw-machine/node_modules` に別バージョンを入れる）。Vite 8 は rolldown なので `manualChunks` は関数形式

## 設計の要点

- 物理は `world.step(1/120, dt, 8)` の細かい刻み（すり抜け対策）。爪には物理コライダー（`physics/clawBody.ts`）があり、景品を押しのける
- 把持は「グリップ品質」制：爪と景品の重なり・重さ・大きさで決まり、低いと掴み損ねや運搬中の落下が起きる
- 景品は `config/prize-catalog.json` のデータ駆動。`model` 指定があれば `public/models/*.glb` を `BASE_URL` 基準で読み込み、無ければプリミティブで造形する
- 爪の大きさはステージの景品サイズ帯に合わせて自動調整（`stage.clawScale`）

## アーケードとしての約束

- ハブへ戻るリンクはモード選択画面左上の `← ARCADE`（`game/modeSelect.ts`、`hubUrl(import.meta.env.BASE_URL)`。開発サーバーでは出ない）
- 3Dモデルを足すときは README の「3Dモデルのクレジット」に追記し、CC-BY ならモード選択画面のクレジット（`modeSelect.ts`）にも足す
- localStorage はアーケードの全ゲームで共有なので、保存するときはキーを `claw-machine.` で始める
