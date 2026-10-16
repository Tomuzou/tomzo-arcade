export interface Point { x: number; z: number }
export interface Hole extends Point { radius: number }
export interface Hill extends Point { height: number; width: number }
export interface Wall extends Point { width: number; depth: number }
/** 段差のある台地。edgeX / edgeZ を広げるとその方向がなだらかなスロープになる。 */
export interface Plateau extends Point { width: number; depth: number; height: number; edge: number; edgeX?: number; edgeZ?: number }
/** 蟻地獄：すり鉢状の砂地。砂で減速し、中心に落ちると食べられる。 */
export interface Pit extends Point { radius: number; depth: number }
/** ブラックホール：range の内側で渦を巻きながら引き寄せ、中心で吸い込む。 */
export interface BlackHole extends Point { range: number; strength: number }
/** ジャンプ台：踏むと (dx, dz) の向きへ跳ぶ。lift は上向きの初速。 */
export interface JumpPad extends Point { dx: number; dz: number; lift?: number }
/** ワープ：a と b がつながっていて、どちらからでも入れる。 */
export interface Warp { a: Point; b: Point }
export interface Bumper extends Point { radius: number }
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
  plateaus?: Plateau[];
  pits?: Pit[];
  blackHoles?: BlackHole[];
  jumps?: JumpPad[];
  warps?: Warp[];
  bumpers?: Bumper[];
  color: string;
  /** ゴール時の見出し（省略時は「ゴール！」）。 */
  clear?: string;
}

// ジャンプ台コースの、穴を並べてふさいだ堀。
const trench = [-3.9, -2.6, -1.3, 0, 1.3, 2.6, 3.9].map(x => ({ x, z: 0, radius: 0.75 }));

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
    name: 'ボルケーノ', subtitle: 'THE SUMMIT', color: '#ff9970', clear: '頂上に到着！',
    hint: '火山のまわりの穴を避け、頂上の金色の輪を目指そう！',
    start: { x: 0, z: 4.8 }, goal: { x: 0, z: -1.5 }, checkpoint: { x: 2.8, z: 0.8 },
    holes: [
      { x: -1.35, z: 2.2, radius: 0.75 }, { x: 1.35, z: 2.2, radius: 0.75 },
      { x: -2.1, z: -0.9, radius: 0.7 }, { x: 2.1, z: -2.6, radius: 0.7 },
      { x: 0, z: -4, radius: 0.7 },
    ],
    hills: [{ x: 0, z: -1.5, height: 1.25, width: 2.25 }], walls: [],
  },
  // ここからギミックコース。
  {
    name: 'ジャンプ台', subtitle: 'JUMP PAD', color: '#7dff8a',
    hint: '緑の矢印に乗ると跳べる。空中なら穴の上も越えられる。',
    start: { x: 0, z: 4.8 }, goal: { x: 3.1, z: -4.9 }, checkpoint: { x: -3.5, z: -2.5 },
    holes: [
      ...trench,
      ...[-1.3, -2.6, -3.9, -5.2].map(z => ({ x: 0, z, radius: 0.75 })),
      { x: 1.9, z: 3.1, radius: 0.6 }, { x: -1.4, z: -5.1, radius: 0.5 }, { x: 2.7, z: -2.3, radius: 0.55 },
    ],
    hills: [], walls: [],
    jumps: [{ x: -2.6, z: 2.0, dx: 0, dz: -1 }, { x: -2.1, z: -3.6, dx: 1, dz: 0 }],
  },
  {
    name: '蟻地獄', subtitle: 'ANTLION PIT', color: '#e0a35c',
    hint: 'すり鉢の砂地は玉が重くなる。縁をなぞって、中心には近づかないで。',
    start: { x: 0, z: 4.8 }, goal: { x: 0, z: -4.8 }, checkpoint: { x: -3.5, z: -0.6 },
    holes: [{ x: 3.5, z: 1.8, radius: 0.5 }],
    hills: [], walls: [],
    pits: [
      { x: 0, z: 0.6, radius: 2.7, depth: 1.2 },
      { x: -2.8, z: -3.2, radius: 1.6, depth: 0.8 },
      { x: 2.7, z: -2.8, radius: 1.5, depth: 0.8 },
    ],
  },
  {
    name: 'ブラックホール', subtitle: 'EVENT HORIZON', color: '#9d7bff',
    hint: '紫の渦は遠くからでも玉を引き寄せる。近づきすぎたら戻れない。',
    start: { x: -2.6, z: 4.8 }, goal: { x: 2.6, z: -4.8 }, checkpoint: { x: -3.6, z: 0.3 },
    holes: [{ x: 3.7, z: -1.4, radius: 0.55 }, { x: 0.4, z: 4.6, radius: 0.5 }],
    hills: [], walls: [],
    blackHoles: [
      { x: 0, z: 0.3, range: 4.2, strength: 7 },
      { x: -2.4, z: -3.6, range: 2.2, strength: 4 },
      { x: 2.8, z: 2.9, range: 2.0, strength: 4 },
    ],
  },
  {
    name: 'ワープとバンパー', subtitle: 'WARP ZONE', color: '#4fe3ff',
    hint: '仕切りの向こうへは光る輪からワープ。赤いバンパーは強く弾く。',
    start: { x: -3, z: 4.8 }, goal: { x: 3.2, z: -5 }, checkpoint: { x: -2.6, z: -1.3 },
    holes: [
      { x: -0.8, z: 0.4, radius: 0.55 }, { x: 1.3, z: -1.0, radius: 0.55 },
      { x: 2.3, z: -3.5, radius: 0.55 },
    ],
    hills: [],
    walls: [{ x: 0, z: 1.5, width: 9, depth: 0.3 }, { x: 0, z: -2.2, width: 9, depth: 0.3 }],
    warps: [
      { a: { x: 3.3, z: 3.0 }, b: { x: -3.4, z: 0.4 } },
      { a: { x: 3.5, z: -1.3 }, b: { x: -3.4, z: -3.2 } },
    ],
    bumpers: [
      { x: 0, z: 3.3, radius: 0.4 }, { x: 1.7, z: 4.4, radius: 0.35 },
      { x: 0.3, z: -0.5, radius: 0.35 }, { x: 2.3, z: 0.5, radius: 0.35 },
      { x: -1.1, z: -4.1, radius: 0.4 }, { x: 0.9, z: -3.2, radius: 0.4 }, { x: 0.9, z: -5.2, radius: 0.4 },
    ],
  },
  {
    name: '天空の段々畑', subtitle: 'SKY TERRACE', color: '#ffd36e',
    hint: '右のスロープで中段へ。いちばん上の台地へはジャンプ台で飛び移ろう。',
    start: { x: -2.5, z: 4.8 }, goal: { x: -3, z: -4.8 }, checkpoint: { x: 3.4, z: -0.2 },
    holes: [
      { x: 0.9, z: 3.6, radius: 0.6 },
      { x: 0, z: -0.6, radius: 0.7 }, { x: -2.6, z: -0.1, radius: 0.7 },
      { x: -2.2, z: -3.2, radius: 0.55 }, { x: -1.2, z: -5.1, radius: 0.55 },
    ],
    hills: [], walls: [],
    plateaus: [
      { x: 0, z: -5.4, width: 12, depth: 13.2, height: 0.8, edge: 0.35 },
      { x: 3.2, z: -1.65, width: 1.8, depth: 8.7, height: 0.8, edge: 0.3, edgeZ: 3 },
      { x: -2.7, z: -7.1, width: 6.6, depth: 9.8, height: 1.7, edge: 0.35 },
    ],
    jumps: [{ x: 2.4, z: -1.2, dx: -1, dz: -1, lift: 5 }],
    clear: '天空に到着！',
  },
];
