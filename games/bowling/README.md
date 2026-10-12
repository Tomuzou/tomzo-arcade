# 🎳 GIMMICK BOWLING

3Dボーリングゲーム。ステージが進むごとに障害物・カーブレーン・坂道・100ピンなどの特殊ギミックが登場する(予定)。

> TOMZO ARCADE の1タイトルです。[アーケードのトップ](https://tomuzou.github.io/tomzo-arcade/) から他のゲームも遊べます。移行前の履歴は旧リポジトリ [Tomuzou/bowling-app](https://github.com/Tomuzou/bowling-app) にあります。

**▶ ブラウザですぐ遊べます: https://tomuzou.github.io/tomzo-arcade/bowling/**

## 遊び方(Phase 1 時点)

| キー | 画面ボタン(スマホ対応) | 操作 |
|------|------|------|
| `←` `→` | ◀ ▶(長押しで連続入力) | 立ち位置を移動(バンクモードでは投球角度) |
| `Space` | 🎳 投球 | 投球(固定パワー) |
| `R` | ↺ | ボール・ピンをリセット |
| `M` | 🔄 | モード切替 |

### ノーマルモード
普通のボーリング。ど真ん中より少しずらして1番ピンと3番ピンの間「ポケット」を狙うとストライクが出やすい — 本物と同じです。

### バンクボウリングモード(VS嵐風)
広いフィールドの左右が**反発壁**になっていて、矢印で角度を決めてバンクショットで狙います。ダイヤ型バンパーの奥や、正面がガード壁でふさがれた中央のピンは、壁の跳ね返りを使わないと倒せません。

## 技術スタック

- [Three.js](https://threejs.org/) — 3D描画
- [cannon-es](https://github.com/pmndrs/cannon-es) — 物理エンジン
- Vite + TypeScript

物理(cannon-es)と描画(Three.js)は分離し、各エンティティが `body`(物理)と `mesh`(描画)を持って毎フレーム同期する設計。詳細は [SPEC.md](SPEC.md) と [CLAUDE.md](CLAUDE.md) を参照。

## 開発

```bash
npm install      # リポジトリ直下で実行(全ゲームの依存をまとめて入れる)
npm run dev      # 開発サーバー起動(ブラウザが自動で開く)
npm run build    # 本番ビルド
npm run preview  # ビルド確認
```

## 開発ロードマップ

- [x] **Phase 1: 物理プロトタイプ** — 直線レーン・10ピン・固定パワー投球
- [ ] Phase 2: 投球システム(位置→角度→パワー&スピンの3段階入力)
- [ ] Phase 3: ゲームルール(スコア計算・クリア判定)
- [ ] Phase 4: ギミック(カーブレーン・坂道・障害物・100ピン)
- [ ] Phase 5: UI & 仕上げ

## デプロイ

TOMZO ARCADE の `main` ブランチへの push で、リポジトリ直下の GitHub Actions がアーケード全体をビルドし、GitHub Pages に公開します。
