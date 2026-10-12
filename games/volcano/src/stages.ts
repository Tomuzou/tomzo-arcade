export interface Point { x: number; z: number }
export interface Hole extends Point { radius: number }
export interface Hill extends Point { height: number; width: number }
export interface Wall extends Point { width: number; depth: number }
export interface Stage {
  name: string;
  subtitle: string;
  hint: string;
  start: Point;
  goal: Point;
  checkpoint: Point;
  holes: Hole[];
  hills: Hill[];
  walls: Wall[];
  color: string;
}

// 台は x=-4.5〜4.5、z=-6〜6。画面上が -z。全コースを最初から選べる。
export const STAGES: Stage[] = [
  {
    name: 'はじめの一粒', subtitle: 'FIRST ROLL', color: '#70dfca',
    hint: '矢印で玉を転がそう。穴のそばではブレーキを長押し。',
    start: { x: 0, z: 4.7 }, goal: { x: 0, z: -4.7 }, checkpoint: { x: 0, z: 0 },
    holes: [{ x: -1.5, z: 2, radius: 0.6 }, { x: 1.5, z: -2, radius: 0.6 }],
    hills: [], walls: [],
  },
  {
    name: '穴のあいだを', subtitle: 'MIND THE GAP', color: '#f7c66b',
    hint: '左右へゆっくり切り返そう。青い輪が中継地点。',
    start: { x: -2.8, z: 4.7 }, goal: { x: 2.8, z: -4.7 }, checkpoint: { x: 0, z: 0 },
    holes: [
      { x: -0.6, z: 3.1, radius: 0.72 }, { x: -2.7, z: 0.9, radius: 0.8 },
      { x: 2.5, z: -0.9, radius: 0.85 }, { x: -0.2, z: -3.2, radius: 0.8 },
    ], hills: [], walls: [{ x: 1.5, z: 2.1, width: 2.2, depth: 0.28 }],
  },
  {
    name: '坂を越えて', subtitle: 'UP & OVER', color: '#98b4ff',
    hint: '坂は勢いをつけて登る。下りに入ったらブレーキ。',
    start: { x: 0, z: 4.7 }, goal: { x: 0, z: -4.7 }, checkpoint: { x: 2.7, z: -0.7 },
    holes: [{ x: -2.3, z: 1.2, radius: 0.75 }, { x: 0, z: -3, radius: 0.75 }],
    hills: [{ x: 0, z: 0.8, height: 0.85, width: 2.5 }],
    walls: [{ x: -3, z: -1.2, width: 2.2, depth: 0.28 }],
  },
  {
    name: 'ジグザグ回廊', subtitle: 'SWITCHBACK', color: '#e3a2ff',
    hint: '壁の切れ目を交互に通る。玉の勢いを抑えて曲がろう。',
    start: { x: -2.8, z: 4.7 }, goal: { x: 2.8, z: -4.7 }, checkpoint: { x: -2.9, z: -0.5 },
    holes: [{ x: 3.1, z: 3, radius: 0.7 }, { x: -2.8, z: -2.6, radius: 0.65 }],
    hills: [{ x: 0.8, z: -3.5, height: 0.65, width: 1.8 }],
    walls: [
      { x: -1, z: 2, width: 7, depth: 0.32 },
      { x: 1, z: -0.1, width: 7, depth: 0.32 },
      { x: -1, z: -2.1, width: 7, depth: 0.32 },
    ],
  },
  {
    name: 'ボルケーノ', subtitle: 'THE SUMMIT', color: '#ff9970',
    hint: '火山のまわりの穴を避け、頂上の金色の輪を目指そう！',
    start: { x: 0, z: 4.8 }, goal: { x: 0, z: -1.5 }, checkpoint: { x: 2.8, z: 0.8 },
    holes: [
      { x: -1.35, z: 2.2, radius: 0.75 }, { x: 1.35, z: 2.2, radius: 0.75 },
      { x: -2.1, z: -0.9, radius: 0.7 }, { x: 2.1, z: -2.6, radius: 0.7 },
      { x: 0, z: -4, radius: 0.7 },
    ],
    hills: [{ x: 0, z: -1.5, height: 1.25, width: 2.25 }], walls: [],
  },
];
