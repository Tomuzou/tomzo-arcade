import type { Plateau, Point, Stage } from './stages';

export const BALL_RADIUS = 0.22;
export const BOARD_X = 4.5;
export const BOARD_Z = 6;
export const STEP = 1 / 120;
export const GRAVITY = 9;
export const JUMP_SPEED = 4.4;
export const JUMP_TRIGGER = 0.38;
export const WARP_TRIGGER = 0.38;
export type BallEvent = 'jump' | 'land' | 'warp' | 'bumper';
/**
 * y・vy は玉の接地点の高さと上下速度（未設定なら地面に置く）。air は空中。
 * impact はその刻みで壁・外枠に当たった速さ、event はその刻みに起きた出来事（効果音・演出用）。
 * trap は玉を飲み込んだ穴などの中心、warpLock は出たばかりのワープ（離れるまで再突入しない）。
 */
export interface Ball extends Point {
  vx: number; vz: number;
  y?: number; vy?: number; air?: boolean;
  impact?: number; event?: BallEvent; trap?: Point; warpLock?: number;
}
export interface Input extends Point { brake: boolean }
export type Outcome = 'rolling' | 'fall' | 'pit' | 'blackhole' | 'goal';

const smoothstep = (u: number) => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);

/** 角を滑らかにした台地。縁の幅 edge で坂になり、edge を広げるとスロープになる。 */
function plateauHeight(p: Plateau, x: number, z: number): number {
  const ex = p.edgeX ?? p.edge, ez = p.edgeZ ?? p.edge;
  return p.height
    * smoothstep((p.width / 2 + ex / 2 - Math.abs(x - p.x)) / ex)
    * smoothstep((p.depth / 2 + ez / 2 - Math.abs(z - p.z)) / ez);
}

/** 地形の高さ。坂（ガウス型）の合計 + 台地の最大値 − 蟻地獄のくぼみ。 */
export function surface(stage: Stage, x: number, z: number): number {
  let h = 0;
  for (const hill of stage.hills) {
    h += hill.height * Math.exp(-((x - hill.x) ** 2 + (z - hill.z) ** 2) / hill.width ** 2);
  }
  let top = 0;
  for (const plateau of stage.plateaus ?? []) top = Math.max(top, plateauHeight(plateau, x, z));
  h += top;
  for (const pit of stage.pits ?? []) {
    const r = Math.hypot(x - pit.x, z - pit.z);
    if (r < pit.radius) h -= pit.depth * (1 - r / pit.radius) ** 2;
  }
  return h;
}

/** 地形の勾配（中心差分）。台地の最大値や蟻地獄も同じ式で扱える。 */
export function slope(stage: Stage, x: number, z: number): Point {
  const e = 1e-4;
  return {
    x: (surface(stage, x + e, z) - surface(stage, x - e, z)) / (2 * e),
    z: (surface(stage, x, z + e) - surface(stage, x, z - e)) / (2 * e),
  };
}

/** 線分スイープで穴・ゴールの通過も拾う（高速移動時のすり抜けを防ぐ）。 */
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dz = b.z - a.z;
  const length = dx * dx + dz * dz;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / length));
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}

export function advance(ball: Ball, input: Input, stage: Stage, dt = STEP): Outcome {
  let before = { x: ball.x, z: ball.z };
  let impact = 0;
  ball.event = undefined;
  if (ball.y === undefined) { ball.y = surface(stage, ball.x, ball.z); ball.vy = 0; ball.air = false; }
  const air = !!ball.air;
  const length = Math.max(1, Math.hypot(input.x, input.z));
  // 空中では少しだけ向きを変えられる。
  const power = (input.brake ? 2.8 : 6.5) * (air ? 0.3 : 1);
  let ax = input.x / length * power, az = input.z / length * power;
  if (!air) {
    // 球の転がりを近似。坂の勾配が重力として進行方向に働く。
    const gradient = slope(stage, ball.x, ball.z);
    ax -= gradient.x * GRAVITY; az -= gradient.z * GRAVITY;
  }
  // ブラックホールは渦を巻きながら引き寄せる。近いほど強く、範囲の外では働かない。
  for (const hole of stage.blackHoles ?? []) {
    const dx = hole.x - ball.x, dz = hole.z - ball.z, d = Math.hypot(dx, dz);
    if (d >= hole.range || d < 1e-6) continue;
    const pull = hole.strength * (1 - d / hole.range) ** 2 / Math.max(d, 0.4);
    ax += (dx + dz * 0.3) / d * pull; az += (dz - dx * 0.3) / d * pull;
  }
  const sand = !air && (stage.pits ?? []).some(pit => Math.hypot(ball.x - pit.x, ball.z - pit.z) < pit.radius);
  const drag = air ? 0.15 : (input.brake ? 8 : 0.9) + (sand ? 2.2 : 0);
  const damping = Math.exp(-drag * dt);
  ball.vx = (ball.vx + ax * dt) * damping;
  ball.vz = (ball.vz + az * dt) * damping;
  const speed = Math.hypot(ball.vx, ball.vz);
  if (speed > 4.5) { ball.vx *= 4.5 / speed; ball.vz *= 4.5 / speed; }
  ball.x += ball.vx * dt;
  ball.z += ball.vz * dt;
  const limitX = BOARD_X - BALL_RADIUS, limitZ = BOARD_Z - BALL_RADIUS;
  if (Math.abs(ball.x) > limitX) {
    impact = Math.max(impact, Math.abs(ball.vx));
    ball.x = Math.sign(ball.x) * limitX; ball.vx *= -0.35;
  }
  if (Math.abs(ball.z) > limitZ) {
    impact = Math.max(impact, Math.abs(ball.vz));
    ball.z = Math.sign(ball.z) * limitZ; ball.vz *= -0.35;
  }
  for (const wall of stage.walls) {
    // 空中で壁より高ければ越えていく。
    if (ball.y > surface(stage, wall.x, wall.z) + 0.45) continue;
    const nearX = Math.max(wall.x - wall.width / 2, Math.min(wall.x + wall.width / 2, ball.x));
    const nearZ = Math.max(wall.z - wall.depth / 2, Math.min(wall.z + wall.depth / 2, ball.z));
    const dx = ball.x - nearX, dz = ball.z - nearZ;
    const distance = Math.hypot(dx, dz);
    if (distance >= BALL_RADIUS) continue;
    let nx: number, nz: number, overlap: number;
    if (distance > 0.00001) {
      nx = dx / distance; nz = dz / distance; overlap = BALL_RADIUS - distance;
    } else {
      const escapeX = wall.width / 2 + BALL_RADIUS - Math.abs(ball.x - wall.x);
      const escapeZ = wall.depth / 2 + BALL_RADIUS - Math.abs(ball.z - wall.z);
      nx = escapeX < escapeZ ? Math.sign(ball.x - wall.x) || 1 : 0;
      nz = escapeX < escapeZ ? 0 : Math.sign(ball.z - wall.z) || 1;
      overlap = Math.min(escapeX, escapeZ);
    }
    ball.x += nx * overlap; ball.z += nz * overlap;
    const dot = ball.vx * nx + ball.vz * nz;
    if (dot < 0) { impact = Math.max(impact, -dot); ball.vx -= 1.35 * dot * nx; ball.vz -= 1.35 * dot * nz; }
  }
  // バンパーは当たった勢いに関係なく一定以上の速さで弾き返す。
  for (const bumper of stage.bumpers ?? []) {
    if (ball.y > surface(stage, bumper.x, bumper.z) + 0.4) continue;
    const dx = ball.x - bumper.x, dz = ball.z - bumper.z, d = Math.hypot(dx, dz);
    const reach = bumper.radius + BALL_RADIUS;
    if (d >= reach) continue;
    const nx = d > 1e-6 ? dx / d : 0, nz = d > 1e-6 ? dz / d : 1;
    ball.x = bumper.x + nx * reach; ball.z = bumper.z + nz * reach;
    const dot = ball.vx * nx + ball.vz * nz;
    const out = Math.max(-dot * 0.9, 3.4);
    ball.vx += (out - dot) * nx; ball.vz += (out - dot) * nz;
    ball.event = 'bumper';
  }
  ball.impact = impact;

  // 上下の動き。接地中は地形に沿い、地形が重力より速く落ち込む所（崖の縁など）では飛び出す。
  let ground = surface(stage, ball.x, ball.z);
  if (ball.air) {
    ball.vy! -= GRAVITY * dt;
    ball.y += ball.vy! * dt;
    if (ground > ball.y + 0.25) {
      // 空中で崖の側面にぶつかったら跳ね返る。
      impact = Math.max(impact, Math.hypot(ball.vx, ball.vz));
      ball.impact = impact;
      ball.x = before.x; ball.z = before.z; ball.vx *= -0.3; ball.vz *= -0.3;
      ground = surface(stage, ball.x, ball.z);
    }
    if (ball.y <= ground) {
      ball.y = ground;
      ball.event = 'land';
      if (ball.vy! < -3) ball.vy = -ball.vy! * 0.3;
      else { ball.air = false; ball.vy = 0; }
    }
  } else {
    const vy = (ground - ball.y) / dt;
    if ((vy - ball.vy!) / dt < -GRAVITY * 1.15) {
      // 急斜面を登る途中で浮いても崖を飛び越えないよう、上向きの勢いは水平の速さの半分までにする。
      ball.air = true;
      ball.vy = Math.min(ball.vy!, Math.hypot(ball.vx, ball.vz) * 0.5);
      ball.vy! -= GRAVITY * dt;
      ball.y += ball.vy! * dt;
      if (ball.y <= ground) { ball.y = ground; ball.air = false; ball.vy = vy; }
    } else {
      ball.y = ground; ball.vy = vy;
    }
  }

  if (!ball.air) {
    for (const pad of stage.jumps ?? []) {
      if (Math.hypot(ball.x - pad.x, ball.z - pad.z) >= JUMP_TRIGGER) continue;
      const l = Math.hypot(pad.dx, pad.dz) || 1;
      ball.vx = pad.dx / l * JUMP_SPEED; ball.vz = pad.dz / l * JUMP_SPEED;
      ball.vy = pad.lift ?? 4; ball.air = true; ball.event = 'jump';
      break;
    }
  }
  const warps = stage.warps ?? [];
  if (ball.warpLock !== undefined) {
    const pair = warps[ball.warpLock];
    if (!pair || [pair.a, pair.b].every(p => Math.hypot(ball.x - p.x, ball.z - p.z) > 0.65)) ball.warpLock = undefined;
  }
  if (!ball.air && ball.warpLock === undefined) {
    for (const [i, pair] of warps.entries()) {
      const from = Math.hypot(ball.x - pair.a.x, ball.z - pair.a.z) < WARP_TRIGGER ? pair.a
        : Math.hypot(ball.x - pair.b.x, ball.z - pair.b.z) < WARP_TRIGGER ? pair.b : null;
      if (!from) continue;
      const to = from === pair.a ? pair.b : pair.a;
      ball.x = to.x; ball.z = to.z; ball.y = surface(stage, to.x, to.z); ball.vy = 0;
      ball.warpLock = i; ball.event = 'warp';
      // 移動した線分で穴を判定しないよう、出口から数え直す。
      before = { x: ball.x, z: ball.z };
      break;
    }
  }

  for (const hole of stage.blackHoles ?? []) {
    if (Math.hypot(ball.x - hole.x, ball.z - hole.z) < 0.3) { ball.trap = { x: hole.x, z: hole.z }; return 'blackhole'; }
  }
  if (ball.air) return 'rolling';
  for (const hole of stage.holes) {
    if (distanceToSegment(hole, before, ball) < hole.radius - BALL_RADIUS * 0.35) { ball.trap = { x: hole.x, z: hole.z }; return 'fall'; }
  }
  for (const pit of stage.pits ?? []) {
    if (Math.hypot(ball.x - pit.x, ball.z - pit.z) < 0.32) { ball.trap = { x: pit.x, z: pit.z }; return 'pit'; }
  }
  if (distanceToSegment(stage.goal, before, ball) < 0.48) return 'goal';
  return 'rolling';
}
