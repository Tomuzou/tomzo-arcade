// ローカル開発サーバーの実際の3D盤面を使って、ハブ用16:9サムネイルを撮影。
// node games/volcano/tests/capture-preview.mjs（localhost:5180 の dev が必要）
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5180/');
  await page.locator('[data-course="4"]').click();
  await page.addStyleTag({ content: `
    .shell { width:960px; height:540px; min-height:0; padding:0; position:relative; background:radial-gradient(ellipse at 75% 50%, #30443e, #121a24 75%); }
    .top { position:absolute; left:45px; top:165px; z-index:2; }
    .brand small { font-size:11px; letter-spacing:2px; max-width:220px; line-height:1.7; color:#97bcac; }
    h1 { font-size:56px; line-height:1.02; letter-spacing:0; margin-top:18px; }
    h1 span { display:block; color:#ffcb82; }
    .brand::after { content:'一粒を、頂上へ。'; display:block; font-size:19px; margin-top:23px; color:#c8d8cb; }
    .top-links, .status, .bottom, .field-note, .legend { display:none; }
    .playfield { position:absolute; left:335px; top:0; width:625px; height:540px; border:0; border-radius:0; background:transparent; }
  ` });
  await page.waitForTimeout(400);
  await page.screenshot({ path: fileURLToPath(new URL('../../../hub/public/thumbs/volcano.jpg', import.meta.url)), type: 'jpeg', quality: 90 });
} finally { await browser.close(); }
