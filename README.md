# TOMZO ARCADE

ブラウザですぐ遊べるミニゲーム集。

**[アーケードで遊ぶ](https://tomuzou.github.io/tomzo-arcade/)**

Chrome / Edge では「アプリとしてインストール」ボタン（またはアドレスバーのインストールアイコン）から、スマホではホーム画面に追加すると、アプリのように単独のウィンドウで起動できます。一度遊んだゲームはオフラインでも起動できます。

## ゲーム

| ゲーム | 内容 |
|---|---|
| [FREE KICK LAB](https://tomuzou.github.io/tomzo-arcade/free-kick/) | 壁とキーパーを越える3Dフリーキック。40ステージ、10球ラッシュ、アイテム。Claude Code版（ver.c.1〜4）とCodex版（ver.g.1）の全バージョンを収録 |

## 開発

Node.js 20以上。npm workspaces で、ハブ（`hub/`）・共通パッケージ（`packages/`）・各ゲーム（`games/`）を1つのリポジトリで管理しています。

```sh
npm install
npm run dev            # ハブ
npm run dev:free-kick  # FREE KICK LAB
npm test
npm run build          # dist/ にアーケード全体を組み立て
npm run verify
```

Windows では `Play-Local.cmd` をダブルクリックすると、本番ビルドしたアーケードを専用ウィンドウで開けます。

`main` へ push すると GitHub Actions がテスト・ビルド・検証を行い、GitHub Pages に公開します。ゲームの追加手順と共通ルールは [CLAUDE.md](CLAUDE.md) にあります。
