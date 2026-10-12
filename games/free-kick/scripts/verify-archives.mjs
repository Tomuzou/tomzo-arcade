// ビルド後の dist/ に、最新版と凍結した全バージョン、旧名の転送ページが揃っているかを確かめる。
// 参照先（js/css・転送先）の実在はリポジトリ直下の verify.mjs が全ページ分を確かめる。
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const versions = ["", "ver.1.0.c", "ver.2.0.c", "ver.3.0.c", "ver.3.1.g", "ver.4.0.c"];
const legacy = ["v1", "v2", "v2/v1", "ver.c.1", "ver.c.2", "ver.c.3", "ver.c.3/v1", "ver.c.3/v2", "ver.c.4", "ver.g.1"];

const read = (dir) => {
  const file = path.join("dist", dir, "index.html");
  assert.ok(fs.existsSync(file), `Missing page: ${dir || "(latest)"}`);
  return fs.readFileSync(file, "utf8");
};
for (const dir of versions) {
  const html = read(dir);
  assert.ok(!html.includes('http-equiv="refresh"'), `Should be a playable page: ${dir}`);
  const assets = [...html.matchAll(/(?:src|href)="\/tomzo-arcade\/free-kick\/([^"\s]+\.(?:js|css))"/g)].map((m) => m[1]);
  assert.ok(assets.length > 0, `No application assets: ${dir}`);
  for (const asset of assets) assert.ok(fs.existsSync(path.join("dist", asset)), `Broken asset: ${asset}`);
  console.log(`${dir || "(latest)"}: ${assets.length} assets verified`);
}
for (const dir of legacy) {
  const target = read(dir).match(/content="0;url=\/tomzo-arcade\/free-kick\/([^";]+)\/"/)?.[1];
  assert.ok(target && versions.includes(target), `Legacy URL must redirect to a current version: ${dir}`);
}
console.log("All playable versions and legacy redirects verified.");
