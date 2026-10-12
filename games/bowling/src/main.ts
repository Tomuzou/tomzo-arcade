import { hubUrl } from "@tomzo-arcade/core";
import { Game } from "./core/Game";

const container = document.getElementById("app");
if (!container) {
  throw new Error("#app 要素が見つかりません");
}

// アーケードのハブへ戻るリンク(開発サーバーではハブが無いので出さない)
const hub = hubUrl(import.meta.env.BASE_URL);
const arcadeLink = document.getElementById("arcade-link");
if (hub && arcadeLink instanceof HTMLAnchorElement) {
  arcadeLink.href = hub;
  arcadeLink.hidden = false;
}

const game = new Game(container);
game.start();
