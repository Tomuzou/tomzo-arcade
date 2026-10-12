# 引継ぎ：次の Claude Code / Codex に貼る最初のプロンプト

事前準備（手動）:
```bash
cd c:/Users/tomuz/TomzoLab/03_hobby/tomzo-arcade
claude        # Codex なら codex
```

そして以下を貼る:

---

CLAUDE.md と games/free-kick/CLAUDE.md を読んで、TOMZO ARCADE の現状を把握して。読み終えたら、下の「現状」と実際のリポジトリ（git log・git status・npm run build && npm run verify の結果）が合っているかを確認し、ずれがあれば報告して。作業はまだ始めず、次に何をするか私の指示を待って。

現状（2026-10-12 時点）:
- このリポジトリ（Tomuzou/tomzo-arcade、ブランチ main）はブラウザのミニゲーム集。公開URLは https://tomuzou.github.io/tomzo-arcade/ 。main に push すると GitHub Actions がテスト・ビルド・検証して GitHub Pages に公開する
- 構成は npm workspaces：hub/（ゲーム一覧・PWA）、packages/core/（共通処理）、games/<id>/（各ゲーム）。ゲームの追加手順は CLAUDE.md の「ゲームを追加する手順」
- 収録ゲームは games/free-kick/（FREE KICK LAB）の1本。最新版は Codex 版 ver.g.1。Claude 版 ver.c.1〜4 と旧 v1/v2 は public/ の凍結ビルド
- FREE KICK LAB は旧リポジトリ Tomuzou/soccer-app から移した。旧URL /soccer-app/… は soccer-app 側の転送ページで /tomzo-arcade/free-kick/… へ飛ぶ。開発履歴は soccer-app に残っている
- ver.c.4 のソースは games/free-kick/c4/ にある（2026-10-12 に soccer-app の claude-c4 ブランチから移した）。直したら games/free-kick/ で npm run build:c4 を実行すると public/ver.c.4/ が作り直される（仕様は games/free-kick/c4/CLAUDE.md）
- ブラウザテスト（Playwright）はソフトウェア描画で遅く、全部で20分以上かかる。CI では回していない
- Git Bash で /で始まる引数（--base=/… など）を渡すときは MSYS_NO_PATHCONV=1 を付ける

---

## 残っている課題（次に貼るプロンプト例）

- **動きのもっさり対策**（未着手。どのバージョン・どの場面で重いかをユーザーにまだ聞けていない）
  「FREE KICK LAB の動きが重い。まず ver.g.1 と ver.c.4 の描画負荷（解像度・影・材質・再描画）を比べて原因を絞って。そのうえで packages/core に全ゲーム共通の画質設定（高／標準／軽量）を作り、まず ver.g.1 に入れて」
- **2本目・3本目のゲーム追加**（候補：../bowling-app、../claw-machine-app。まだ中身を確認していない）
  「../bowling-app の中身を確認して、CLAUDE.md の手順どおり games/bowling/ としてアーケードに追加して。ハブのカードとサムネイルも作って」
- **ハブの拡充**（必要になったら）：最近遊んだゲーム、ゲームごとの自己ベスト表示、カテゴリ分けなど

## 関連フォルダ

| フォルダ | 役割 |
|---|---|
| `tomzo-arcade/` | ここ。今後の開発はすべてここで行う |
| `soccer-app/` | 旧リポジトリ。転送ページの公開と履歴の保管だけ。ここでゲームを直しても反映されない |