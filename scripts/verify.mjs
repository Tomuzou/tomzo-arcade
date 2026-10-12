// 組み立て後の dist/ を検証する：全ページの js/css/画像の参照先と、リダイレクトの転送先が実在するか。
// ゲームを足してもこのスクリプトは変更不要（dist 内の全 HTML を走査する）。
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const BASE = "/tomzo-arcade/";
const dist = path.resolve("dist");
assert.ok(fs.existsSync(path.join(dist, "index.html")), "Run npm run build first");

const htmlFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "index.html") htmlFiles.push(full);
  }
};
walk(dist);

const exists = (url) => fs.existsSync(path.join(dist, url.slice(BASE.length)));
let pages = 0;
let redirects = 0;
for (const file of htmlFiles) {
  const rel = path.relative(dist, file).replaceAll("\\", "/");
  const html = fs.readFileSync(file, "utf8");
  const redirect = html.match(/http-equiv="refresh" content="0;url=([^"]+)"/)?.[1];
  if (redirect) {
    assert.ok(redirect.startsWith(BASE) && exists(path.posix.join(redirect, "index.html")), `Broken redirect: ${rel} → ${redirect}`);
    redirects++;
    continue;
  }
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => u.startsWith(BASE) && /\.(?:js|css|png|svg|jpg|webmanifest)$/.test(u));
  assert.ok(refs.some((u) => u.endsWith(".js")), `No script in ${rel}`);
  for (const url of refs) assert.ok(exists(url), `Broken asset in ${rel}: ${url}`);
  pages++;
}
for (const file of ["manifest.webmanifest", "sw.js", "icons/icon-192.png", "icons/icon-512.png"]) {
  assert.ok(fs.existsSync(path.join(dist, file)), `Missing PWA file: ${file}`);
}
console.log(`Verified ${pages} pages and ${redirects} redirects under ${BASE}`);
