# 明日Claude Codeに貼る最初のプロンプト

事前準備(手動):
```bash
mkdir bowling-game && cd bowling-game
# SPEC.md と CLAUDE.md をこのフォルダに置く
claude
```

そして以下を貼る:

---

SPEC.md と CLAUDE.md を読んで、Phase 1(物理プロトタイプ)を実装して。

やること:
1. Vite + TypeScript + Three.js + cannon-es のプロジェクトセットアップ(SPEC.md §8 のディレクトリ構成に従う)
2. 直線レーン・ボール・標準10ピン配置を物理付きで実装
3. スペースキーで固定パワーの投球ができ、ピンが物理演算で倒れる
4. カメラはレーン後方からの固定視点でOK

Phase 1のゴールは「投げたらピンがリアルに倒れる」こと。UIや入力システムはまだ作らなくていい。
完了したら npm run dev で動作確認の手順を教えて。

---

## Phase 1 が動いたら次に貼るプロンプト例

- 「ピンの倒れ方が不自然。質量と摩擦係数を constants.ts で調整できるようにして、リアルな倒れ方にチューニングして」
- 「Phase 2 に進んで。SPEC.md §3 の3段階入力(位置→角度→パワー&スピン)を実装して」
