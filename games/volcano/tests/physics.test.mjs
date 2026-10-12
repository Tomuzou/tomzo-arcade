import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

async function module(file) {
  const source = fs.readFileSync(new URL(`../src/${file}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { advance, surface, slope, STEP, BALL_RADIUS, BOARD_X } = await module('physics');
const { STAGES } = await module('stages');
const idle = { x: 0, z: 0, brake: false };
const flat = { ...STAGES[0], holes: [], walls: [], hills: [] };

test('brake brings a moving ball nearly to rest within half a second', () => {
  const ball = { x: 0, z: 0, vx: 3, vz: 0 };
  for (let i = 0; i < 60; i++) advance(ball, { ...idle, brake: true }, flat);
  assert.ok(ball.vx < 0.06);
  assert.ok(ball.x < 0.4);
});

test('slope matches terrain derivative and makes a resting ball roll downhill', () => {
  const stage = { ...flat, hills: [{ x: 0, z: 0, height: 1.2, width: 2 }] };
  const gradient = slope(stage, 1, 0);
  const numeric = (surface(stage, 1.001, 0) - surface(stage, 0.999, 0)) / 0.002;
  assert.ok(Math.abs(gradient.x - numeric) < 0.00001);
  const ball = { x: 1, z: 0, vx: 0, vz: 0 };
  advance(ball, idle, stage);
  assert.ok(ball.vx > 0);
});

test('diagonal input does not accelerate faster than straight input', () => {
  const a = { x: 0, z: 0, vx: 0, vz: 0 }, b = { ...a };
  advance(a, { ...idle, x: 1 }, flat);
  advance(b, { ...idle, x: 1, z: 1 }, flat);
  assert.ok(Math.abs(Math.hypot(a.vx, a.vz) - Math.hypot(b.vx, b.vz)) < 1e-10);
});

test('outer rail and interior wall rebound without allowing penetration', () => {
  const ball = { x: BOARD_X - BALL_RADIUS - 0.001, z: 0, vx: 4, vz: 0 };
  advance(ball, idle, flat);
  assert.ok(ball.x <= BOARD_X - BALL_RADIUS && ball.vx < 0);
  const wallStage = { ...flat, walls: [{ x: 0, z: 0, width: 3, depth: 0.3 }] };
  const nearWall = { x: 0, z: 0.38, vx: 0, vz: -3 };
  advance(nearWall, idle, wallStage);
  assert.ok(nearWall.z >= 0.15 + BALL_RADIUS - 1e-10);
  assert.ok(nearWall.vz > 0);
});

test('a swept ball cannot skip over a small hole or goal', () => {
  const ball = { x: -0.025, z: 0, vx: 4.5, vz: 0 };
  const stage = { ...flat, holes: [{ x: 0, z: 0, radius: 0.085 }] };
  assert.equal(advance(ball, idle, stage), 'fall');
  const goalBall = { x: 0, z: -4.23, vx: 0, vz: -4.5 };
  assert.equal(advance(goalBall, idle, flat), 'goal');
});

test('all five courses have a playable route to the goal using ordinary input', () => {
  const routes = [
    [[0, -4.7]],
    [[-2.8, 3], [-1.4, 3], [-1.4, 0], [0, 0], [1.35, -2.4], [2.8, -3.5], [2.8, -4.7]],
    [[2.7, 3], [2.7, -0.7], [2.7, -4.7], [0, -4.7]],
    [[0, 4.2], [4.05, 4.1], [4.05, 1], [-3.8, 1], [-3.8, -1.1], [3.8, -1.1], [3.8, -4.7], [2.8, -4.7]],
    [[0, 0.5], [0, -1.5]],
  ];
  STAGES.forEach((stage, index) => {
    const ball = { ...stage.start, vx: 0, vz: 0 };
    let target = 0, outcome = 'rolling';
    for (let i = 0; i < 24000 && outcome === 'rolling'; i++) {
      const [x, z] = routes[index][target];
      const dx = x - ball.x, dz = z - ball.z;
      if (Math.hypot(dx, dz) < 0.18 && target < routes[index].length - 1) target++;
      // 低速で道筋を追う。坂の重力に逆らう分も入力範囲内で補償。
      const gradient = slope(stage, ball.x, ball.z);
      const controls = {
        x: Math.max(-1, Math.min(1, (dx * 3 - ball.vx * 3 + gradient.x * 9) / 6.5)),
        z: Math.max(-1, Math.min(1, (dz * 3 - ball.vz * 3 + gradient.z * 9) / 6.5)),
        brake: false,
      };
      outcome = advance(ball, controls, stage, STEP);
    }
    assert.equal(outcome, 'goal', `course ${index + 1}: ${JSON.stringify(ball)}`);
  });
});
