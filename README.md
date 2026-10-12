# TOMZO ARCADE

ブラウザですぐ遊べるミニゲーム集。

**[アーケードで遊ぶ](https://tomuzou.github.io/tomzo-arcade/)**

Chrome / Edge では「アプリとしてインストール」ボタン（またはアドレスバーのインストールアイコン）から、スマホではホーム画面に追加すると、アプリのように単独のウィンドウで起動できます。一度遊んだゲームはオフラインでも起動できます。

## ゲーム

| ゲーム | 内容 |
|---|---|
| [FREE KICK LAB](https://tomuzou.github.io/tomzo-arcade/free-kick/) | 壁とキーパーを越える3Dフリーキック。40ステージ、風、球質を変えるスキルボール。最新版 ver.4.1.c と過去の全バージョン（ver.1.0.c〜4.0.c、Codex版 ver.3.1.g）を収録 |
| [GIMMICK BOWLING](https://tomuzou.github.io/tomzo-arcade/bowling/) | 3Dボウリング。普通のレーンと、反発壁・バンパーを使うバンクボウリングモード |
| [CLAW MACHINE 3D](https://tomuzou.github.io/tomzo-arcade/claw-machine/) | 3Dクレーンゲーム。ランダムモードと、狙う景品を選べるセレクトモード |

## 開発

Node.js 20以上。npm workspaces で、ハブ（`hub/`）・共通パッケージ（`packages/`）・各ゲーム（`games/`）を1つのリポジトリで管理しています。

```sh
npm install
npm run dev            # ハブ
npm run dev:free-kick  # FREE KICK LAB
npm run dev:bowling    # GIMMICK BOWLING
npm run dev:claw-machine  # CLAW MACHINE 3D
npm test
npm run build          # dist/ にアーケード全体を組み立て
npm run verify
```

Windows では `Play-Local.cmd` をダブルクリックすると、本番ビルドしたアーケードを専用ウィンドウで開けます。

`main` へ push すると GitHub Actions がテスト・ビルド・検証を行い、GitHub Pages に公開します。ゲームの追加手順と共通ルールは [CLAUDE.md](CLAUDE.md) にあります。
