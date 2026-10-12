// game/modeSelect.ts — ゲーム開始前のモード選択画面
// ランダムモード: おまかせで景品が並ぶ / セレクトモード: 狙いたい景品を自分で選ぶ
import {
  PRIZE_CATALOG,
  MAX_SELECTED_PRIZES,
  buildRandomStage,
  buildSelectedStage,
} from '../config';
import type { StageConfig } from '../types';
import { hubUrl } from '@tomzo-arcade/core';

/** アーケードのハブ(開発サーバーでは null) */
const HUB_URL = hubUrl(import.meta.env.BASE_URL);

export function showModeSelect(root: HTMLElement, onStart: (stage: StageConfig) => void): void {
  const overlay = document.createElement('div');
  overlay.id = 'mode-select';

  const start = (stage: StageConfig): void => {
    overlay.remove();
    onStart(stage);
  };

  const showModeButtons = (): void => {
    overlay.innerHTML = '';

    const title = document.createElement('h1');
    title.textContent = '🧸 3D クレーンゲーム';
    overlay.appendChild(title);

    const lead = document.createElement('p');
    lead.className = 'mode-lead';
    lead.textContent = 'モードを選んでください';
    overlay.appendChild(lead);

    const buttons = document.createElement('div');
    buttons.className = 'mode-buttons';

    const randomBtn = document.createElement('button');
    randomBtn.type = 'button';
    randomBtn.className = 'mode-btn';
    randomBtn.innerHTML = '<strong>🎲 ランダムモード</strong><span>いろんな景品がおまかせで並ぶ</span>';
    randomBtn.addEventListener('click', () => start(buildRandomStage()));
    buttons.appendChild(randomBtn);

    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = 'mode-btn';
    selectBtn.innerHTML = '<strong>🎯 セレクトモード</strong><span>狙いたい景品を自分で選ぶ</span>';
    selectBtn.addEventListener('click', showCatalog);
    buttons.appendChild(selectBtn);

    overlay.appendChild(buttons);

    if (HUB_URL) {
      const arcadeLink = document.createElement('a');
      arcadeLink.className = 'arcade-link';
      arcadeLink.href = HUB_URL;
      arcadeLink.textContent = '← ARCADE';
      overlay.appendChild(arcadeLink);
    }

    // CC-BY のモデルを含むので、遊ぶ画面にもクレジットを出す(一覧は README)
    const credits = document.createElement('p');
    credits.className = 'mode-credits';
    credits.innerHTML =
      '3Dモデル: <a href="https://poly.pizza/" target="_blank" rel="noopener">Poly Pizza</a> — Quaternius / jeremy / Poly by Google (CC0)、' +
      '<a href="https://poly.pizza/m/3Eb9oLfZYIc" target="_blank" rel="noopener">Bear</a> by jiang liu・' +
      '<a href="https://poly.pizza/m/9Ift-39Akov" target="_blank" rel="noopener">Penguin</a> by jeremy (CC-BY)';
    overlay.appendChild(credits);
  };

  const showCatalog = (): void => {
    overlay.innerHTML = '';
    const selected = new Set<string>();

    const title = document.createElement('h1');
    title.textContent = '🎯 景品を選ぶ';
    overlay.appendChild(title);

    const lead = document.createElement('p');
    lead.className = 'mode-lead';
    overlay.appendChild(lead);

    const grid = document.createElement('div');
    grid.className = 'prize-grid';
    overlay.appendChild(grid);

    const footer = document.createElement('div');
    footer.className = 'mode-buttons';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'mode-btn sub';
    backBtn.textContent = '← もどる';
    backBtn.addEventListener('click', showModeButtons);
    footer.appendChild(backBtn);

    const startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.className = 'mode-btn';
    startBtn.addEventListener('click', () => {
      if (selected.size > 0) start(buildSelectedStage([...selected]));
    });
    footer.appendChild(startBtn);
    overlay.appendChild(footer);

    const refresh = (): void => {
      lead.textContent = `狙いたい景品を選んでください(${selected.size} / ${MAX_SELECTED_PRIZES})`;
      startBtn.textContent = selected.size > 0 ? `この ${selected.size} 個で始める` : '景品を選んでね';
      startBtn.disabled = selected.size === 0;
    };

    for (const entry of PRIZE_CATALOG) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'prize-card';

      const dot = document.createElement('span');
      dot.className = 'prize-dot';
      dot.style.background = entry.colors.primary;
      card.appendChild(dot);

      const name = document.createElement('span');
      name.className = 'prize-name';
      name.textContent = entry.name;
      card.appendChild(name);

      const meta = document.createElement('span');
      meta.className = 'prize-meta';
      meta.textContent = `${entry.category}・${entry.score}点`;
      card.appendChild(meta);

      card.addEventListener('click', () => {
        if (selected.has(entry.type)) {
          selected.delete(entry.type);
          card.classList.remove('selected');
        } else if (selected.size < MAX_SELECTED_PRIZES) {
          selected.add(entry.type);
          card.classList.add('selected');
        }
        refresh();
      });
      grid.appendChild(card);
    }

    refresh();
  };

  showModeButtons();
  root.appendChild(overlay);
}
