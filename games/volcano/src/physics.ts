import type { Point, Stage } from './stages';

export const BALL_RADIUS = 0.22;
export const BOARD_X = 4.5;
export const BOARD_Z = 6;
export const STEP = 1 / 120;
export interface Ball extends Point { vx: number; vz: number }
export interface Input extends Point { brake: boolean }
export type Outcome = 'rolling' | 'fall' | 'goal';

export function surface(stage: Stage, x: number, z: number): number {
  return stage.hills.reduce((h, hill) => h + hill.height * Math.exp(
    -((x - hill.x) ** 2 + (z - hill.z) ** 2) / hill.width ** 2,
  ), 0);
}

export function slope(stage: Stage, x: number, z: number): Point {
  let sx = 0, sz = 0;
  for (const hill of stage.hills) {
    const h = hill.height * Math.exp(-((x - hill.x) ** 2 + (z - hill.z) ** 2) / hill.width ** 2);
    sx += -2 * (x - hill.x) * h / hill.width ** 2;
    sz += -2 * (z - hill.z) * h / hill.width ** 2;
  }
  return { x: sx, z: sz };
}

/** 線分スイープで穴・ゴールの通過も拾う（高速移動時のすり抜けを防ぐ）。 */
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dz = b.z - a.z;
  const length = dx * dx + dz * dz;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / length));
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}

export function advance(ball: Ball, input: Input, stage: Stage, dt = STEP): Outcome {
  const before = { x: ball.x, z: ball.z };
  const gradient = slope(stage, ball.x, ball.z);
  const length = Math.max(1, Math.hypot(input.x, input.z));
  const damping = Math.exp(-(input.brake ? 8 : 0.9) * dt);
  const power = input.brake ? 2.8 : 6.5;
  // 球の転がりを近似。坂の勾配が重力として進行方向に働く。
  ball.vx = (ball.vx + (input.x / length * power - gradient.x * 9) * dt) * damping;
  ball.vz = (ball.vz + (input.z / length * power - gradient.z * 9) * dt) * damping;
  const speed = Math.hypot(ball.vx, ball.vz);
  if (speed > 4.5) { ball.vx *= 4.5 / speed; ball.vz *= 4.5 / speed; }
  ball.x += ball.vx * dt;
  ball.z += ball.vz * dt;
  const limitX = BOARD_X - BALL_RADIUS, limitZ = BOARD_Z - BALL_RADIUS;
  if (Math.abs(ball.x) > limitX) {
    ball.x = Math.sign(ball.x) * limitX; ball.vx *= -0.35;
  }
  if (Math.abs(ball.z) > limitZ) {
    ball.z = Math.sign(ball.z) * limitZ; ball.vz *= -0.35;
  }
  for (const wall of stage.walls) {
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
    if (dot < 0) { ball.vx -= 1.35 * dot * nx; ball.vz -= 1.35 * dot * nz; }
  }
  for (const hole of stage.holes) {
    if (distanceToSegment(hole, before, ball) < hole.radius - BALL_RADIUS * 0.35) return 'fall';
  }
  if (distanceToSegment(stage.goal, before, ball) < 0.48) return 'goal';
  return 'rolling';
}
