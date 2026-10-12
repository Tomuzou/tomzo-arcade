import './style.css';
import { hubUrl, loadJson, saveJson } from '@tomzo-arcade/core';
import { STAGES } from './stages';
import { advance, STEP, type Ball, type Input } from './physics';
import { BoardScene } from './scene';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <main class="shell">
    <header class="top">
      <div class="brand"><small>TOMZO ARCADE / MARBLE CHALLENGE</small><h1>VOLCANO <span>ROLL</span></h1></div>
      <nav class="top-links" aria-label="戻る・メニュー"><button class="quiet" id="courses">メニュー</button><a id="arcade">← ゲーム選択</a></nav>
    </header>
    <section class="status" aria-label="プレイ状況">
      <div><span class="stage-label" id="stage-label"></span><h2 class="stage-name" id="stage-name"></h2></div>
      <div class="stats"><div><small>TIME</small><strong id="time">0.0</strong></div><div><small>落下</small><strong id="falls">0</strong></div><div><small>BEST</small><strong id="best">—</strong></div></div>
    </section>
    <section class="playfield">
      <div id="viewport"></div><div class="field-note">TILT · ROLL · REACH THE SUMMIT</div>
      <div class="legend">◯ 中継地点 <span>◎ ゴール</span></div>
      <div class="overlay" id="overlay"><div class="dialog" id="dialog" role="dialog" aria-labelledby="dialog-title"></div></div>
    </section>
    <footer class="bottom">
      <div class="help"><p class="hint" id="hint" aria-live="polite"></p><p class="keys">矢印 / WASD：傾ける　Space：ブレーキ　R：最初から　Esc：一時停止</p></div>
      <div class="controls" aria-label="玉の操作">
        <div class="dpad"><button data-direction="up" aria-label="奥へ転がす">▲</button><button data-direction="left" aria-label="左へ転がす">◀</button><button data-direction="down" aria-label="手前へ転がす">▼</button><button data-direction="right" aria-label="右へ転がす">▶</button></div>
        <button class="brake" data-direction="brake">BRAKE<small>長押しで減速</small></button>
      </div>
    </footer>
  </main>`;

const el = (id: string) => document.getElementById(id)!;
const link = hubUrl(import.meta.env.BASE_URL) ?? 'http://127.0.0.1:4180/tomzo-arcade/';
(el('arcade') as HTMLAnchorElement).href = link;
const overlay = el('overlay'), dialog = el('dialog');
const host = el('viewport');
let view: BoardScene;
try {
  view = new BoardScene(host);
} catch {
  dialog.innerHTML = '<h2 id="dialog-title">3D画面を開けませんでした</h2><p>ブラウザのハードウェアアクセラレーションを有効にして、ページを再読み込みしてください。</p>';
  throw new Error('WebGL initialization failed');
}

type Phase = 'menu' | 'rolling' | 'paused' | 'fall' | 'goal';
let phase: Phase = 'menu';
let index = 0;
let ball: Ball = { ...STAGES[0].start, vx: 0, vz: 0 };
let elapsed = 0, falls = 0, checkpoint = false, fallAge = 0, accumulator = 0;
let last = performance.now(), frame = 0, hudAge = 0;
const held = new Set<string>();
const keyDirections: Record<string, string> = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'brake',
};
const touch = new Map<number, string>();
const KEY = 'volcano-roll.records.v1';
const raw = loadJson<unknown>(KEY, {});
const records: Record<string, number> = {};
if (raw && typeof raw === 'object') {
  for (const [key, value] of Object.entries(raw)) {
    if (/^[0-4]$/.test(key) && typeof value === 'number' && Number.isFinite(value) && value > 0) records[key] = value;
  }
}
const format = (seconds: number) => seconds.toFixed(1);

function input(): Input {
  const directions = new Set([...held].map(code => keyDirections[code]));
  touch.forEach(direction => directions.add(direction));
  return {
    x: Number(directions.has('right')) - Number(directions.has('left')),
    z: Number(directions.has('down')) - Number(directions.has('up')),
    brake: directions.has('brake'),
  };
}

function clearInput(): void {
  held.clear(); touch.clear();
  document.querySelectorAll('.held').forEach(button => button.classList.remove('held'));
}

function syncHud(): void {
  el('stage-label').textContent = `COURSE 0${index + 1} / ${STAGES[index].subtitle}`;
  el('stage-name').textContent = STAGES[index].name;
  el('time').textContent = format(elapsed);
  el('falls').textContent = String(falls);
  el('best').textContent = records[index] ? format(records[index]) : '—';
  el('hint').textContent = checkpoint ? '中継地点に到着！ 落ちても青い輪から再挑戦できます。' : STAGES[index].hint;
  el('hint').classList.toggle('toast', checkpoint);
}

function showDialog(html: string): void {
  clearInput();
  dialog.innerHTML = html;
  overlay.hidden = false;
  // ダイアログ表示中は背面の操作をフォーカス対象から外す。
  document.querySelectorAll<HTMLButtonElement>('.controls button').forEach(button => button.disabled = true);
  dialog.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
}

function hideDialog(): void {
  overlay.hidden = true;
  document.querySelectorAll<HTMLButtonElement>('.controls button').forEach(button => button.disabled = false);
  (document.activeElement as HTMLElement | null)?.blur();
  accumulator = 0;
  last = performance.now();
}

function start(course: number): void {
  index = course;
  ball = { ...STAGES[index].start, vx: 0, vz: 0 };
  elapsed = 0; falls = 0; checkpoint = false; fallAge = 0;
  phase = 'rolling';
  clearInput(); hideDialog();
  view.load(STAGES[index]);
  syncHud();
}

function menu(): void {
  if (phase === 'rolling' || phase === 'paused') { pause(); return; }
  phase = 'menu';
  showDialog(`<div class="eyebrow">A LITTLE BALL. A BIG ADVENTURE.</div>
    <h2 id="dialog-title">一粒を、頂上へ。</h2>
    <p>台を傾けて、穴や坂をくぐり抜けよう。<br>金色の輪に入ればゴール。ブレーキが攻略の鍵。</p>
    <div class="course-list">${STAGES.map((stage, i) => `<button data-course="${i}"><b>0${i + 1}</b><span>${stage.name}</span><small>${records[i] ? `${format(records[i])} s` : '挑戦する →'}</small></button>`).join('')}</div>`);
}

function pause(): void {
  phase = 'paused';
  showDialog(`<div class="eyebrow">TAKE A BREATH</div><h2 id="dialog-title">一時停止</h2>
    <p>タイマーは止まっています。<br>続きから遊ぶか、別のコースを選べます。</p>
    <div class="actions"><button class="primary" data-action="resume">続ける</button><button class="quiet" data-action="restart">最初から</button></div>
    <div class="course-list">${STAGES.map((stage, i) => `<button data-course="${i}"><b>0${i + 1}</b><span>${stage.name}</span><small>${records[i] ? `${format(records[i])} s` : '挑戦する →'}</small></button>`).join('')}</div>`);
}

function fell(): void {
  phase = 'fall'; fallAge = 0; falls++;
  syncHud(); clearInput();
}

function fallDialog(): void {
  showDialog(`<div class="eyebrow">ONE MORE ROLL</div><h2 id="dialog-title">穴に落ちちゃった。</h2>
    <p>${checkpoint ? '中継地点から続けられます。' : 'スタート地点からもう一度。'}<br>穴のそばでは、ブレーキを押しながらゆっくり。</p>
    <div class="actions"><button class="primary" data-action="retry">${checkpoint ? '中継地点から' : 'もう一度'}</button><button class="quiet" data-action="restart">最初から</button><button class="quiet" data-action="menu">コース選択</button></div>`);
}

function goal(): void {
  phase = 'goal';
  const best = !records[index] || elapsed < records[index];
  if (best) { records[index] = elapsed; saveJson(KEY, records); }
  syncHud();
  const all = STAGES.every((_, i) => records[i]);
  showDialog(`<div class="eyebrow">${best ? 'NEW BEST!' : 'NICE ROLL!'}</div>
    <h2 id="dialog-title">${index === STAGES.length - 1 ? '頂上に到着！' : 'ゴール！'}</h2>
    <p>${STAGES[index].name} · ${format(elapsed)} 秒 · 落下 ${falls} 回<br>${all ? '全5コース制覇！ 次はベストタイムに挑戦。' : '一粒ぶんの冒険、クリア。'}</p>
    <div class="actions">${index < STAGES.length - 1 ? '<button class="primary" data-action="next">次のコースへ →</button>' : '<button class="primary" data-action="menu">コース選択</button>'}<button class="quiet" data-action="restart">もう一度</button>${index < STAGES.length - 1 ? '<button class="quiet" data-action="menu">コース選択</button>' : ''}</div>`);
}

dialog.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button) return;
  if (button.dataset.course !== undefined) { start(Number(button.dataset.course)); return; }
  switch (button.dataset.action) {
    case 'resume': phase = 'rolling'; clearInput(); hideDialog(); break;
    case 'restart': start(index); break;
    case 'next': start(Math.min(index + 1, STAGES.length - 1)); break;
    case 'menu': phase = 'menu'; menu(); break;
    case 'retry':
      ball = { ...(checkpoint ? STAGES[index].checkpoint : STAGES[index].start), vx: 0, vz: 0 };
      fallAge = 0; phase = 'rolling'; clearInput(); hideDialog(); break;
  }
});
el('courses').addEventListener('click', menu);

window.addEventListener('keydown', event => {
  if (event.code === 'Escape' && !event.repeat) {
    if (phase === 'rolling') pause();
    else if (phase === 'paused') { phase = 'rolling'; clearInput(); hideDialog(); }
  }
  if (phase !== 'rolling') return;
  if (keyDirections[event.code]) { event.preventDefault(); held.add(event.code); }
  if (event.code === 'KeyR' && !event.repeat) start(index);
});
window.addEventListener('keyup', event => held.delete(event.code));
document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach(button => {
  button.addEventListener('pointerdown', event => {
    if (phase !== 'rolling') return;
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    touch.set(event.pointerId, button.dataset.direction!); button.classList.add('held');
  });
  const release = (event: PointerEvent) => {
    touch.delete(event.pointerId);
    if (![...touch.values()].includes(button.dataset.direction!)) button.classList.remove('held');
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('contextmenu', event => event.preventDefault());
});
function suspend(): void { clearInput(); if (phase === 'rolling') pause(); }
window.addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });

function loop(now: number): void {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const controls = phase === 'rolling' ? input() : { x: 0, z: 0, brake: false };
  if (phase === 'rolling') {
    accumulator += dt;
    while (accumulator >= STEP && phase === 'rolling') {
      elapsed += STEP;
      const result = advance(ball, controls, STAGES[index]);
      accumulator -= STEP;
      if (!checkpoint && Math.hypot(ball.x - STAGES[index].checkpoint.x, ball.z - STAGES[index].checkpoint.z) < 0.5) {
        checkpoint = true; syncHud();
      }
      if (result === 'fall') fell();
      else if (result === 'goal') goal();
    }
    hudAge += dt;
    if (hudAge > 0.1) { syncHud(); hudAge = 0; }
  }
  if (phase === 'fall' && fallAge < 0.7) {
    fallAge += dt;
    if (fallAge >= 0.7) fallDialog();
  }
  view.draw(ball, controls, checkpoint, phase === 'fall' ? Math.min(2.5, fallAge ** 2 * 7) : 0, phase === 'rolling' ? dt : 0);
  frame = requestAnimationFrame(loop);
}

view.load(STAGES[0]); syncHud(); menu();
frame = requestAnimationFrame(loop);
window.addEventListener('pagehide', () => { clearInput(); if (phase === 'rolling') pause(); });
// Vite の差し替え時も WebGL 資源と描画ループを解放。
if (import.meta.hot) import.meta.hot.dispose(() => { cancelAnimationFrame(frame); view.dispose(); });
