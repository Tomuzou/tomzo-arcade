# FREE KICK LAB — ver.4.1.c

> TOMZO ARCADE の1タイトルです。[アーケードのトップ](https://tomuzou.github.io/tomzo-arcade/) から他のゲームも遊べます。移行前の開発履歴は旧リポジトリ [Tomuzou/soccer-app](https://github.com/Tomuzou/soccer-app) にあります。

ブラウザで遊べる3Dフリーキックゲーム。React・Three.js・Cannon-esで、狙い、カーブ、空気抵抗、風、キーパーとの駆け引きを楽しめます。

**[最新版で遊ぶ](https://tomuzou.github.io/tomzo-arcade/free-kick/)**

## ver.4.1.c

ver.4.0.c（Claude Code版）を引き継いで改良を続けている最新版です。

- **フリープレイ**：連続ゴールの最高記録を保存。
- **40ステージ**：α=基本、β=高難度、γ=球数制限、δ=風。最初から全ステージを選べます。ステージごとに最少球数と👑（スキルボールを使わずにクリア）を記録。
- **スキルボール**：蹴る前に球質を選びます。照準中だけ変更でき、モードを始めるとノーマルに戻ります。

| スキルボール | 効果 |
|---|---|
| 🌀 ナックル | 無回転で、飛行中に不規則に揺れる |
| ⤵️ ドライブ | 強いトップスピンで急に落ちる |
| 🔥 キャノン | 初速が速く、曲がりにくい |
| 🪃 ブーメラン | 序盤はまっすぐ、後半に大きく曲がる |
| 👻 ゴースト | 固定の壁をすり抜ける（キーパーはすり抜けない） |

- スタジアムは観客入りのスタンド・照明塔・広告ボード、壁は選手の列、キーパーは人型。キック後に球速（km/h）を表示します。
- 記録と音・弾道表示の設定は、このブラウザの localStorage に保存されます（ver.4.0.c と共通）。

## 遊び方

ピッチの上を手前にドラッグし、離すとキック。左右の引きでコース、引く量で高さとパワーが変わります。カーブはスライダーで設定します。

PCのショートカット：`←` / `→` でカーブ、`1`〜`6` で球質、`R` で蹴り直し、`M` で音、`T` で弾道表示、`Esc` で戻る。

壁やキーパーに当たっても、ゴールに入れば成功です。γの制限球数で達成不能になった場合は、ステージ最初から再挑戦します。

## バージョンコレクション

版名は `ver.<大>.<小>.<作者>`（c = Claude Code、g = Codex）です。過去の版はすべて当時のまま遊べます。

| バージョン | 内容 | プレイ |
|---|---|---|
| ver.4.1.c | 最新版（ver.4.0.c から継続改良） | [遊ぶ](https://tomuzou.github.io/tomzo-arcade/free-kick/) |
| ver.4.0.c | Claude Code版。スキルボール、リアルなスタジアム、👑記録、球速表示 | [遊ぶ](https://tomuzou.github.io/tomzo-arcade/free-kick/ver.4.0.c/) |
| ver.3.1.g | Codex版。新しいロビー、10球ラッシュ、星評価、精密照準、アイテム | [遊ぶ](https://tomuzou.github.io/tomzo-arcade/free-kick/ver.3.1.g/) |
| ver.3.0.c | リアル物理、風、効果音 | [遊ぶ](https://tomuzou.github.io/tomzo-arcade/free-kick/ver.3.0.c/) |
| ver.2.0.c | 球数制限まで | [遊ぶ](https://tomuzou.github.io/tomzo-arcade/free-kick/ver.2.0.c/) |
| ver.1.0.c | 初期のフリーキックゲーム | [遊ぶ](https://tomuzou.github.io/tomzo-arcade/free-kick/ver.1.0.c/) |

旧名のURL（`/v1/` `/v2/` `/ver.c.1/`〜`/ver.c.4/` `/ver.g.1/`）は新しい名前へ転送します。

## 開発

### ローカルで専用ウィンドウを開く（Windows）

リポジトリ直下の `Play-Local.cmd`（アーケードが開きます）か、直下で `npm run play:desktop -- --page=free-kick/` を実行します。過去版は `--page=free-kick/ver.4.0.c/` のように指定します。毎回起動時に現行ソースを本番ビルドし、タブ・アドレスバーのないChrome（未インストールの場合はEdge）の専用ウィンドウで開きます。開発サーバーの自動更新処理は動きません。起動にはNode.jsと`npm ci`で導入した依存パッケージが必要です。

内部ではブラウザの描画エンジンと、このPC内だけで待ち受けるローカルサーバー（127.0.0.1:4180）を使用します。独立したexeへの変換ではなく、描画の速さはGPUや画面サイズによって変わります。ウィンドウを閉じるとサーバーも終了します。記録は通常のブラウザとは別の`.desktop/profile`に保存されます。起動に失敗した場合のログは`.desktop/launcher-error.log`です。

Node.js 20以上とnpmを利用します。

```sh
npm ci
npm run dev
npm test
npm run build
npm run verify:archives
```

ブラウザテスト：`npm run build` のあと `ARCHIVE_CHECK=1 npm run test:browser`。本番ビルドを preview して全バージョンの表示・相互リンク・旧名の転送を確認します。ローカルではインストール済みChromeを使用します。CI環境で実行する場合は`npx playwright install --with-deps chromium`を先に実行してください。

`src/game/Game.ts`が3D・物理・入力・判定、`scenery.ts`が見た目、`stages.ts`がミッション定義、`items.ts`がスキルボール、`sfx.ts`が合成音、`records.ts`が保存データ、`App.tsx`がUIを担当します。共通の開発ルールは`CLAUDE.md`に集約し、`AGENTS.md`から参照します。

## 公開

`main`へのpushで、リポジトリ直下のGitHub Actionsがアーケード全体のテスト・本番ビルド・リンク検証を行い、GitHub Pagesに公開します。本番のbaseは`/tomzo-arcade/free-kick/`です。

`public/ver.*`は凍結済みの過去版です。書き換えないでください。最新版を凍結して次の版へ進む手順は`CLAUDE.md`の「バージョン」にあります。
