import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/tilt.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { tiltVector } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('holding angle is neutral, small hand tremors have a dead zone, and input is capped', () => {
  assert.deepEqual(tiltVector(35, 5, 35, 5, 0), { x: 0, z: 0 });
  assert.deepEqual(tiltVector(36, 6, 35, 5, 0), { x: 0, z: 0 });
  assert.deepEqual(tiltVector(80, 60, 35, 5, 0), { x: 1, z: 1 });
  assert.equal(tiltVector(17, 5, 35, 5, 0).z, -1);
});

test('landscape and upside-down screen orientations rotate control axes', () => {
  const right = tiltVector(18, 0, 0, 0, 90);
  assert.equal(right.x, 1);
  assert.ok(Math.abs(right.z) === 0);
  assert.equal(tiltVector(-18, 0, 0, 0, 270).x, 1);
  assert.equal(tiltVector(0, -18, 0, 0, 180).x, 1);
});

test('crossing the beta angle boundary does not create a full-speed jump', () => {
  assert.equal(tiltVector(-179, 0, 179, 0, 0).z, 0);
});
