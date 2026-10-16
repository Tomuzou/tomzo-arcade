import {test,expect,type Page} from '@playwright/test';
test.use({hasTouch:true});
async function pullVector(page: Page,power=65) {
  const box=(await page.locator('#ball-handle').boundingBox())!;
  const direction=await page.locator('#gesture-arrow').evaluate(path=>{
    const line=path as unknown as SVGPathElement;
    const start=line.getPointAtLength(0),end=line.getPointAtLength(line.getTotalLength());
    const length=Math.hypot(end.x-start.x,end.y-start.y);
    return {x:(end.x-start.x)/length,y:(end.y-start.y)/length};
  });
  const distance=14+(power-20)/80*106;
  return {x:box.x+box.width/2,y:box.y+box.height/2,dx:-direction.x*distance,dy:-direction.y*distance};
}
async function drag(page: Page,power=65) {
  const p=await pullVector(page,power);
  await page.mouse.move(p.x,p.y);await page.mouse.down();
  await page.mouse.move(p.x+p.dx,p.y+p.dy,{steps:6});
  await expect(page.locator('#throw-overlay')).toHaveAttribute('data-armed','true');
  return p;
}
test('direct drag throws, scores, zooms into the pins, and saves records',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');
  await expect(page.locator('input[type=range]')).toHaveCount(1);
  await expect(page.locator('#pin-count')).toHaveText('0 / 65');
  const canvas=await page.locator('#app').boundingBox();
  expect(canvas!.width).toBeGreaterThan(1350);expect(canvas!.height).toBeGreaterThan(750);
  await drag(page);
  await expect(page.locator('#aim-summary')).toHaveText('8.5° / 65%');
  await page.screenshot({path:'test-results/drag-desktop.png'});
  await page.mouse.up();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','rolling');
  await expect(page.locator('#spin')).toBeDisabled();
  await expect(page.locator('#ball-handle')).not.toBeVisible();
  await page.locator('#btn-throw').click();
  await page.waitForTimeout(3200);
  await page.screenshot({path:'test-results/pin-closeup.png'});
  await expect(page.locator('#result')).toBeVisible({timeout:65000});
  await expect(page.locator('#result-eyebrow')).toHaveText('COURSE CLEAR');
  expect(Number(await page.locator('#result-score').textContent())).toBeGreaterThanOrEqual(115);
  await page.locator('#result-retry').click();
  await expect(page.locator('#score')).toHaveText('0');
  await page.reload();
  await page.locator('#btn-courses').click();
  expect(Number(await page.locator('#best').textContent())).toBeGreaterThanOrEqual(115);
  await expect(page.locator('[data-stage]')).toHaveCount(6);
  for(let i=0;i<6;i++){
    if(!await page.locator('#courses').isVisible())await page.locator('#btn-courses').click();
    await page.locator('[data-stage="'+i+'"]').click();
    await expect(page.locator('#courses')).not.toBeVisible();
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');
  }
  await page.locator('#btn-help').click();await expect(page.locator('#help')).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.locator('#help')).not.toBeVisible();
  await expect(page.locator('#arcade-link')).toHaveAttribute('href','/tomzo-arcade/');
  expect(errors).toEqual([]);
});
test('real touch drag, practice and next ball fit a mobile viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('./');
  await page.locator('#btn-courses').click();await page.locator('#btn-practice').click();await page.locator('#courses-close').click();
  await expect(page.locator('#throw-count')).toHaveText('0 / ∞');
  await page.locator('#spin').fill('1');
  await page.locator('#position-right').click();
  await expect(page.locator('#position-value')).toHaveText('右寄り');
  const p=await pullVector(page,45),session=await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+p.dx,y:p.y+p.dy,id:1}]});
  await expect(page.locator('#throw-overlay')).toHaveAttribute('data-armed','true');
  await expect(page.locator('#aim-summary')).toContainText('45%');
  await page.screenshot({path:'test-results/drag-mobile.png'});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('#app')).toHaveAttribute('data-phase','rolling');
  await page.locator('#btn-throw').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','between',{timeout:65000});
  await page.locator('#btn-throw').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');
  await expect(page.locator('#throw-count')).toHaveText('1 / ∞');
  await page.locator('#btn-throw').click();await page.locator('#btn-reset').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');
  await expect(page.locator('#score')).toHaveText('0');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  const spin=await page.locator('#spin').boundingBox();
  expect(spin!.y+spin!.height).toBeLessThan(844);
  const area=await page.locator('#app').boundingBox();expect(area!.height).toBeGreaterThan(640);
  await page.screenshot({path:'test-results/mobile-verified.png'});
});
test('cancel, return to origin, resize, and keyboard control never cause accidental throws',async({page})=>{
  await page.goto('./');
  await drag(page,90);await page.keyboard.press('Escape');await page.mouse.up();
  await expect(page.locator('#throw-count')).toHaveText('0 / 3');
  await expect(page.locator('#aim-summary')).toHaveText('8.5° / 65%');
  const p=await drag(page,40);
  await page.mouse.move(p.x,p.y);await page.mouse.up();
  await expect(page.locator('#throw-count')).toHaveText('0 / 3');
  await drag(page,80);await page.setViewportSize({width:1000,height:800});await page.mouse.up();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');
  await expect(page.locator('#aim-summary')).toHaveText('8.5° / 65%');
  await page.locator('#ball-handle').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowUp');
  await expect(page.locator('#aim-summary')).toHaveText('9° / 70%');
  await page.keyboard.press('Enter');
  await expect(page.locator('#app')).toHaveAttribute('data-phase','rolling');
  await page.locator('#btn-reset').click();
  await page.locator('#btn-camera').click();await expect(page.locator('#btn-camera')).toHaveText('視点：全体');
  await page.locator('#btn-camera').click();await expect(page.locator('#btn-camera')).toHaveText('視点：ピン拡大');
  await page.screenshot({path:'test-results/pins-view.png'});
});
