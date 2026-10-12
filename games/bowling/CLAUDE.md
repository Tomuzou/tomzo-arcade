# CLAUDE.md — GIMMICK BOWLING 開発ガイド

> このゲームは **TOMZO ARCADE** の `games/bowling/`（公開URL `/tomzo-arcade/bowling/`）。アーケード共通のルール（構成・ビルド・公開）はリポジトリ直下の `CLAUDE.md`。
> 旧リポジトリ `Tomuzou/bowling-app`（b027078 まで）から 2026-10-12 に移した。それ以前の履歴はそちらに残っている。今後の開発はここで行う。

このリポジトリは3Dボーリングゲーム(ステージクリア型+フリープレイ)の開発プロジェクト。
詳細仕様は `SPEC.md` を必ず参照すること。

## プロジェクト概要
- Three.js + cannon-es + Vite + TypeScript
- ステージが進むごとに特殊ギミック(障害物・カーブレーン・坂道・100ピン等)が登場
- 現在のフェーズ: **Phase 1(物理プロトタイプ)** ← 進捗に応じてここを更新

## コマンド
```bash
npm run dev      # 開発サーバー起動（リポジトリ直下なら npm run dev:bowling）
npm run build    # 本番ビルド（base は /tomzo-arcade/bowling/）
npm run preview  # ビルド確認
```

## アーケードとしての約束
- ハブへ戻るリンクは右上の `#arcade-link`（`main.ts` で `hubUrl(import.meta.env.BASE_URL)` を設定。開発サーバーでは出ない）。HUD は `max-width` でこのリンクと重ならないようにしている
- localStorage はアーケードの全ゲームで共有なので、保存キーは `gimmick-bowling.` で始める（例 `gimmick-bowling.progress`）

## アーキテクチャ原則
- **物理(cannon-es)と描画(Three.js)は分離する**: 各エンティティが `body`(物理)と `mesh`(描画)を持ち、毎フレーム同期する
- **ステージはJSON駆動**: ギミックをコードにハードコードしない。`src/data/stages/*.json` の定義から `StageManager` が生成する
- **レーンはパラメータ生成**: `Lane.ts` が laneType("straight"/"curve"/"slope")とパラメータから、ジオメトリとコライダー(Box板の連結)を生成する
- 1ファイル1クラス。ファイルは300行を超えたら分割を検討

## コーディング規約
- TypeScript strict モード
- 物理定数(ボール質量、摩擦係数など)は `src/core/constants.ts` に集約(チューニングしやすくするため)
- マジックナンバー禁止

## 実装時の注意(SPEC.md §10 も参照)
- ピンのコライダーはまず円柱1本で簡易化
- 100ピンステージ: InstancedMesh + 物理bodyのsleep活用
- 固定タイムステップ 1/60s で physics step、描画は補間
- スピンによるカーブは簡易モデル(角速度×摩擦で横力)でよい

## 動作確認
- 変更後は `npm run dev` でブラウザ確認を促すこと
- 物理挙動の変更時は「ストレート投球でストライクが取れるか」を基準に確認
