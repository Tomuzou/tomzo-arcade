import {chromium} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.on('pageerror',error=>console.log('PAGE ERROR',error.message));
await page.goto('http://127.0.0.1:5179/');
await page.waitForTimeout(1800);
await page.screenshot({path:'test-results/desktop.png'});
console.log(await page.locator('#app').getAttribute('data-phase'));
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(500);
await page.screenshot({path:'test-results/mobile.png',fullPage:true});
if(process.argv.includes('--thumbnail')) {
await page.setViewportSize({width:960,height:540});
await page.addStyleTag({content:
  '.shell{width:960px;height:540px;padding:0;background:#173a40;position:relative;overflow:hidden}'
  +'.header{position:absolute;left:40px;top:160px;height:auto;z-index:3;border:0;color:#fff1d2}'
  +'.brand small{font-size:8px;color:#9dc5b7;letter-spacing:1.1px}.brand h1{font-size:65px;line-height:.95;margin-top:17px}.brand em{display:block;color:#f3bc68}'
  +'.header::after{content:"曲げる。戻る。倒す。";position:absolute;top:180px;font-size:16px;color:#b3cfc0}'
  +'.brand-icon,.edition,.header-actions,.sidebar,.course-heading,.controls,.hint,.scoreboard,.arena-caption,.arena-bottom,#throw-overlay{display:none!important}'
  +'.workspace{display:block;padding:0}.arena-wrap{position:absolute;left:220px;top:0;width:740px;height:540px;border-radius:0;box-shadow:none}'
  +'.arena-wrap::before,.arena-wrap::after{display:none}'
});
await page.waitForTimeout(500);
await page.screenshot({path:fileURLToPath(new URL('../../../hub/public/thumbs/bowling.jpg',import.meta.url)),type:'jpeg',quality:92});
}
} finally {await browser.close();}
