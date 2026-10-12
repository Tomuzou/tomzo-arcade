/**
 * TOMZO ARCADE の全ゲームで共有する小さなユーティリティ。
 * ビルドせず TypeScript のまま各ゲームの Vite から直接読み込む。
 */

/**
 * ゲームの BASE_URL（例 "/tomzo-arcade/free-kick/"）からハブのURL（"/tomzo-arcade/"）を求める。
 * 開発サーバー（BASE_URL="/"）ではハブが無いので null を返す。
 */
export function hubUrl(gameBase: string): string | null {
  if (gameBase === '/') return null;
  return gameBase.replace(/[^/]+\/$/, '');
}

/** localStorage の JSON 読み込み。使えない環境・壊れたデータでは fallback を返す */
export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** localStorage への JSON 保存。保存できない環境ではゲームを止めずに諦める */
export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* プライベートモード等では保存しない */
  }
}
