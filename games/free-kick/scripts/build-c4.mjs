// ver.c.4 をソース（c4/）からビルドし、凍結版 public/ver.c.4/ の index.html と assets/ を置き換える。
// 通常の npm run build は public/ver.c.4/ をそのまま配信するだけなので、ver.c.4 を直したときだけ実行する。
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dist = "c4/dist";
const target = "public/ver.c.4";

execSync("npx tsc -p c4 && npx vite build c4 --emptyOutDir", { stdio: "inherit" });

// core.autocrlf の作業ツリーでは index.html が CRLF になるので LF にそろえる
const html = fs.readFileSync(`${dist}/index.html`, "utf8").replace(/\r\n?/g, "\n");
if (!html.includes("/tomzo-arcade/free-kick/ver.c.4/assets/"))
  throw new Error("c4/dist/index.html does not use the ver.c.4 base");

const assetRoot = path.resolve(target, "assets");
fs.rmSync(assetRoot, { recursive: true, force: true });
fs.mkdirSync(assetRoot, { recursive: true });
for (const name of fs.readdirSync(`${dist}/assets`))
  fs.copyFileSync(path.join(dist, "assets", name), path.join(assetRoot, name));
fs.writeFileSync(`${target}/index.html`, html);
console.log(`ver.c.4 rebuilt into ${target}/`);
