import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/game/records.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { loadRecords, saveRecords, withClear } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

const KEY = "free-kick-3d.c4";
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
const empty = { stages: {}, bestStreak: 0, muted: false, trail: true };
beforeEach(() => store.clear());

test("save key stays the ver.c.4-era key so existing records carry over", () => {
  store.set(KEY, JSON.stringify({ stages: { a0: { best: 2, pure: true } }, bestStreak: 5 }));
  assert.deepEqual(loadRecords(), { ...empty, stages: { a0: { best: 2, pure: true } }, bestStreak: 5 });
});

test("broken or invalid storage never blocks opening the game", () => {
  for (const raw of ["{broken", "null", "42", "[]"]) {
    store.set(KEY, raw);
    assert.deepEqual(loadRecords(), empty);
  }
  store.set(KEY, JSON.stringify({ stages: { a0: { best: 0 }, e1: { best: 1 }, b3: { best: 1.5 }, c9: { best: 3 } }, bestStreak: -1, muted: "yes" }));
  assert.deepEqual(loadRecords(), { ...empty, stages: { c9: { best: 3, pure: false } } });
});

test("storage failures are swallowed", () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: () => { throw new Error("denied"); },
    setItem: () => { throw new Error("denied"); },
  };
  try {
    assert.deepEqual(loadRecords(), empty);
    assert.doesNotThrow(() => saveRecords(empty));
  } finally {
    globalThis.localStorage = original;
  }
});

test("a clear keeps the fewest shots and the crown once earned", () => {
  let r = withClear(empty, "a", 0, 3, false);
  assert.deepEqual(r.stages.a0, { best: 3, pure: false });
  r = withClear(r, "a", 0, 5, true);
  assert.deepEqual(r.stages.a0, { best: 3, pure: true });
  r = withClear(r, "a", 0, 1, false);
  assert.deepEqual(r.stages.a0, { best: 1, pure: true });
  assert.equal(withClear(r, "a", 0, 4, false), r, "unchanged records keep identity");
});
