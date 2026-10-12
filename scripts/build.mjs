// アーケード全体のビルド：ハブと各ゲームを個別にビルドし、公開用の dist/ に組み立てる。
//   hub/dist/          → dist/
//   games/<id>/dist/   → dist/<id>/
// 各ゲームの vite.config.ts の base は /tomzo-arcade/<id>/ にしておくこと。
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = path.join(root, "dist");

function build(dir) {
  console.log(`\n▶ build ${path.relative(root, dir)}`);
  const result = spawnSync("npm", ["run", "build"], { cwd: dir, stdio: "inherit", shell: true });
  if (result.status !== 0) throw new Error(`Build failed: ${dir}`);
  return path.join(dir, "dist");
}

const games = fs
  .readdirSync(path.join(root, "games"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, "games", entry.name, "package.json")))
  .map((entry) => entry.name);

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(build(path.join(root, "hub")), out, { recursive: true });
for (const id of games) {
  if (fs.existsSync(path.join(out, id))) throw new Error(`Game id collides with a hub file: ${id}`);
  fs.cpSync(build(path.join(root, "games", id)), path.join(out, id), { recursive: true });
}
console.log(`\nArcade assembled in dist/ (hub + ${games.join(", ")})`);
