# FREE KICK LAB — CLAUDE.md

> このゲームは **TOMZO ARCADE** の `games/free-kick/`（公開URL `/tomzo-arcade/free-kick/`）。アーケード共通のルール（構成・ビルド・公開・ゲームの追加）はリポジトリ直下の `CLAUDE.md`。
> 旧リポジトリ `Tomuzou/soccer-app` から移行した。それ以前の開発履歴はそちらに残っている。

共通仕様はこのファイルで管理する。Codex 用の `AGENTS.md` はこのファイルを読むための入口。

ブラウザで動作する3Dフリーキックゲーム。Three.js で3Dシーンを描画し、Cannon-es で物理シミュレーションを行う。

## バージョン

版名は `ver.<大>.<小>.<作者>`（作者 c = Claude Code、g = Codex）。

| URL（`/tomzo-arcade/free-kick/` 以下） | 版 | 中身 |
|---|---|---|
| `/` | **ver.4.1.c（最新・開発中）** | `src/` をビルド。ver.4.0.c から継続改良 |
| `ver.4.0.c/` | Claude 版・スキルボール | 凍結（ソースは git 履歴：コミット 5d8208d の `c4/`） |
| `ver.3.1.g/` | Codex 版・10球ラッシュ・星評価 | 凍結（ソースは git 履歴：コミット 5d8208d の `src/`、保存キー `free-kick-lab.g1`） |
| `ver.3.0.c/` | リアル物理・風（旧 ver.c.3、soccer-app 5d2df35） | 凍結。ソースなし |
| `ver.2.0.c/` | 球数制限まで（旧 ver.c.2 / v2、74785ea） | 凍結。ソースなし |
| `ver.1.0.c/` | 初期版（旧 ver.c.1 / v1、2cd2cbe） | 凍結。ソースなし |

- 凍結版は `public/ver.*/`（`index.html` と `assets/`）に置き、vite が `dist/` 直下へそのままコピーする。**中身を書き換えない**
- 旧名（`v1` `v2` `ver.c.1〜4` `ver.g.1` と入れ子の `v2/v1` `ver.c.3/v1` `ver.c.3/v2`）は `vite.config.ts` の `LEGACY_REDIRECTS` がビルド時に転送ページを出す。soccer-app の転送やブックマークが旧名を指しているので消さない
- 版名は `src/version.ts` の `VERSION`（タイトル画面・スタジアムの広告ボード）と `index.html` の `<title>` に書く
- 他版へのリンクは `App.tsx` の `ARCHIVES`。`ROOT`（`BASE_URL` から末尾の `ver.*/` を除いたもの）を基準にするので、凍結版として別の base でビルドしてもリンクは壊れない。自分自身は一覧から除き、凍結版として開かれたときだけ「最新版」を出す
- ハブへ戻るリンクはタイトル画面左上の `← ARCADE`（`hubUrl(ROOT)`、開発サーバーでは出ない）

### 今の最新版を凍結して次の版へ進むとき（例：ver.4.1.c を凍結して ver.4.2.c へ）

1. `src/version.ts` と `index.html` の版名はそのまま（ver.4.1.c）で、凍結用にビルド：
   `MSYS_NO_PATHCONV=1 npx vite build --base=/tomzo-arcade/free-kick/ver.4.1.c/ --outDir <作業用フォルダ>`（Git Bash では `MSYS_NO_PATHCONV` が必要）
2. 出力の `index.html` と `assets/` だけを `public/ver.4.1.c/` へコピー（出力には `public/` の既存の版も入るのでそれはコピーしない）
3. `App.tsx` の `ARCHIVES`、`scripts/verify-archives.mjs`、`tests/browser/archives.spec.ts`、ハブの `hub/src/games.ts` に ver.4.1.c を足す
4. `version.ts` と `index.html` を次の版名にする
5. `npm run build && npm run verify && npm run verify:archives -w @tomzo-arcade/free-kick`

## 技術スタック

- **フレームワーク**: React 18 + Vite 5
- **言語**: TypeScript
- **3D**: Three.js / **物理**: Cannon-es
- **スタイル**: プレーンCSS（`App.css` / `index.css`）
- **テスト**: `node --test`（保存データ）＋ Playwright（実ブラウザ）

## ディレクトリ構成

```
src/
  game/
    Game.ts      # ゲーム本体（Three.js 描画 + Cannon-es 物理 + 入力 + モード/ステージ制御）
    scenery.ts   # 見た目（空・照明・芝・ボール・ゴール・スタンド・広告ボード・選手）の生成
    stages.ts    # ステージ定義（α=STAGES_A / β=STAGES_B / γ=STAGES_C / δ=STAGES_D、各10ステージ）
    items.ts     # スキルボールの定義
    records.ts   # 保存データの読み書き（保存キー free-kick-3d.c4）
    sfx.ts       # 効果音（WebAudio 合成。音源ファイル不使用）
  types/index.ts # GameState / GamePhase / StageDefinition / StageSet などの型
  version.ts     # 画面に出す版名
  App.tsx        # UI（タイトル、ステージ選択、HUD、スキルバー、クリア画面、バージョンコレクション）
  App.css / index.css / main.tsx
tests/
  records.test.mjs          # 保存データ（npm test、CI でも実行）
  browser/archives.spec.ts  # 全バージョンの表示・相互リンク・旧名の転送（npm run test:browser、要 ARCHIVE_CHECK）
scripts/
  verify-archives.mjs       # ビルド後 dist に全版と旧名の転送ページが揃っているか
public/ver.*/               # 凍結した過去版（上記）
```

## 開発コマンド

```bash
npm run dev              # 開発サーバー（localhost:5173）
npm run build            # 本番ビルド（tsc 型チェック → vite build）
npm test                 # 保存データのユニットテスト
npm run verify:archives  # build 後に全版・旧名転送を検証
npm run build && ARCHIVE_CHECK=1 npm run test:browser   # 本番ビルドを preview して全版をブラウザで確認
# 専用ウィンドウ起動はリポジトリ直下：npm run play:desktop -- --page=free-kick/ （過去版は --page=free-kick/ver.4.0.c/ など）
```

- lint スクリプトは未導入（`npm run build` の tsc が型チェックを兼ねる）
- `test-results/` は git 管理外

## 設計方針

- Three.js のシーン管理はカスタムクラス（`Game`）で行い、React のレンダリングと分離する。UI オーバーレイは React 側
- 入力は役割を分離：キャンバスのドラッグ＝コース＋パワー、カーブは専用スライダー（`Game.setCurve`）
- 音と弾道表示は `setMuted` / `setTrail`。AudioContext は初回キックで遅延生成。衝突音は `getImpactVelocityAlongNormal` の強度で音量・省略を決める
- カメラは注視点（`camLook`）を damp で動かし、キック後はボールを追い、次のキックで正面へ戻す
- 描画は DPR 最大2、太陽光の影 2048px（`Game.ts` のコンストラクタ）
- **キー操作**：←→ カーブ / 1-6 球質 / R 蹴り直し / M 音 / T 弾道 / Esc 戻る

### 見た目（`src/game/scenery.ts`）

ACES トーンマッピング＋sRGB テクスチャ、空ドーム（シェーダー）と半球光・太陽光（影はプレー範囲に絞る）、10m タイルの刈り込み芝、32パネル（五角形12・六角形20）を球面で塗り分けたボール＋縫い目バンプ＋クリアコート、細目ネット、金属ポスト、観客入りの段々スタンド3面・屋根・照明塔・発光広告ボード、壁は選手の列・キーパーは人型（当たり判定は箱のまま）。テクスチャはすべてその場で Canvas 描画する

### 物理モデル（実測値ベース）

- **固定サブステップ**：`simulate` で 1/120 秒。毎ステップ `applyBallForces`（抗力・マグヌス・ナックル・転がり）→ `world.step` → ポスト／ゴール面判定（`checkGoalCrossing`）
- **空気抵抗**：二次抗力 `F = -DRAG_K・|v_rel|・v_rel`。`v_rel` は風を差し引いた対気速度。係数は実球の断面積（0.11m）と `DRAG_COEF`=0.22 から算出。`linearDamping` はほぼ0（`FLIGHT_LINEAR_DAMPING`）
- **マグヌス力**：`F = MAGNUS_COEF・(ω × v_rel)`。実際のFKの曲がり幅（〜2.5m）に合わせた係数。スピンはほぼ減衰させない（`FLIGHT_ANGULAR_DAMPING`=0.08）
- **カーブの符号**：正のカーブが右へ曲がるよう、`shoot` でスピンの符号を反転している（ver.3.0.c では左だった）
- **風**（δ）：`StageDefinition.wind` が対気速度に入り、抗力・マグヌス両方に効く。空力は `phase==='shooting'` 中のみ
- **バウンド・転がり**：ボール×芝 restitution 0.65 / friction 0.4、`ROLL_RESIST`、ポストは金属反発 0.8、壁・キーパーは 0.45
- ボールは半径0.11m・質量0.43kg。ゴールは実寸 7.32×2.44m、キック距離約18m
- 調整ノブ：曲がり＝`MAGNUS_COEF`/`MAX_CURVE_SPIN`、飛距離感＝`DRAG_COEF`、風の効き＝ステージ側の風速値

### スキルボール（`src/game/items.ts`、`Game.setItem`）

倍率ではなく球質を変える。照準中のみ選択可、モード開始・メニュー復帰でノーマルに戻る。

- 🌀ナックル：無回転（カーブ無効）＋2周波の揺れ加速度（`KNUCKLE_ACC_X/Y`、ショットごとにランダム位相、速度と高さでフェード）
- ⤵️ドライブ：進行方向に直交する水平軸のトップスピン（`DRIVE_TOPSPIN`）でマグヌス力を下向きに
- 🔥キャノン：初速1.45倍・抗力0.75倍・カーブ0.35倍
- 🪃ブーメラン：カーブ3.2倍。マグヌス力を飛行0.6秒かけて0.25→1.5倍へ強め（`BOOMERANG_*`）、序盤はまっすぐ・後半に急激に曲がる。カーブ0で選ぶと0.6を初期設定
- 👻ゴースト：固定の壁（`wallBodies`＝move/track なしの障害物）だけ `collisionResponse=false`。`resetBall` で戻す

## ゲームモード／ステージ

- モードは `GameState.mode`（`null`=タイトル / `'free'` / `'stage'`）で管理し、`App.tsx` が画面を出し分ける
- 遷移は `Game` の公開メソッド：`startFreePlay()` / `startStage(set, index)` / `nextStage()` / `retryShot()` / `returnToMenu()`
- ステージは4セット：α / β / γ / δ（`GameState.stageSet` = `'a'`〜`'d'`）。定義は `stages.ts` にデータとして持つ。全40ステージを最初から選択可能、無制限リトライ
- ミッション条件は `StageDefinition` のフラグ：`requireGoal`（枠内）/ `hitBar` / `hitPostL`・`hitPostR` / `target`（的・サイドネットのゾーン通過）/ `obstacles`
- 障害物：固定壁 / `move`（sin 往復キーパー）/ `track`（ボールのXを追うAIキーパー、`track.speed` で難度）。**物理的に弾くだけで接触自体は失敗にしない**（当たって入ってもゴール）
- 障害物・的ゾーンは `buildStageObjects` で生成、`clearStageObjects` で破棄
- ポスト当てミッションでは `updatePostHighlight` で対象ポストを強調色（`POST_HIGHLIGHT`）にする
- 成功判定は `finishStageShot` に集約。バー/ポスト接触は `onBallCollide` で記録し、細いポストは `checkPostHits`（前ステップ→現在の線分スイープ）で補完
- 蹴り直し：`retryShot()` は飛行中なら `finishShot(false,false)` で失敗確定してからリセット（常に1失敗としてカウント）
- クリア中は `stageCleared` を立て、自動リセットせず次操作を待つ

### γ（球数制限チャレンジ／`STAGES_C`）

- 各ステージに **`shotLimit`** と **`goal`（累積達成ルール）**。未達のまま達成不能（球切れ or 数学的に挽回不可）になった瞬間にステージ最初からやり直し
- `goal` の4型（`StageGoal` 判別ユニオン）：`quota`（need回ゴール）/ `combo`（need回連続）/ `bingo`（複数ゾーンを順不同で全制覇）/ `score`（得点ゾーンで合計need点。同時複数ヒットは最高点）
- 1球の「成功」は枠内通過。`stage.target` 併用時はその的の通過も必須（quota/combo）。bingo/score は `goal.zones` を通過点(x,y)で個別判定
- 判定は `finishStageShot` →（`goal`があれば）`finishGoalShot`。進捗は `goalProgress` と `bingoHit[]`、HUD 文言は `updateProgressText`
- 達成不能判定は `minShotsNeeded(goal) > shotsLeft`。失敗時は `stageFailPending` を立て、結果表示後に `loadStage(現index)` で先頭へ
- bingo/score のゾーンは色分け生成（`markBingoZone` / `makeScoreLabel`）、`clearStageObjects` で `goalZoneMeshes`・`scoreLabels` を破棄
- 蹴り直しも1球消費。HUD は「残り N / M 球」と進捗（残り1球で赤点滅）

### δ（風チャレンジ／`STAGES_D`）

- `wind`（m/s）。`x`: 正=左からの横風（ボールは右へ）/ 負=右から、`z`: 正=向かい風 / 負=追い風
- `Game.setWind` で `loadStage` 時に設定し、フリープレイ・メニュー復帰でゼロクリア。専用の「風力」は加えない
- 効き目安：横風 w m/s で約 0.09×w m 流れる（w=8 → 約0.7m）。ステージの風速は5〜10
- HUD 表示は `GameState.windX/windZ` と `App.tsx` の `windLabel`
- γ のメカニクスと直交しており併用可（δ7=ビンゴ＋風、δ9=スコア＋向かい風）

## 記録の保存（`src/game/records.ts`）

- 保存キー `free-kick-3d.c4`（localStorage）。ver.4.0.c と共有しているので**キーを変えない**（変えると今までの記録が消える）
- 保存内容：ステージごとの最少球数と👑（スキルボールを一度も使わずにクリア＝`GameState.stageItemUsed` が false）、フリープレイの最高連続ゴール、ミュート・弾道表示。ステージの途中進捗は保存しない
- `loadRecords` は壊れた／不正な値を捨てて初期値にフォールバックし、保存できない環境でもゲームを継続する

## デプロイ

- main への push で、リポジトリ直下の GitHub Actions がアーケード全体の `npm test` → `npm run build` → `npm run verify` と、このゲームの `verify:archives` を行い GitHub Pages へ公開（ブラウザテストは CI では回さない）
- 本番 base は `vite.config.ts` で `/tomzo-arcade/free-kick/`（dev は `/`）。GitHub Pages は SPA フォールバックしない
