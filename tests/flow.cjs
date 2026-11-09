// Console flow: boot → disk menu → load each game → play → game over → SELECT back to the menu.
const { chromium, devices } = require('playwright');
(async () => {
const BASE = process.env.BASE || 'http://localhost:4173/', out = process.env.OUT || '/tmp/shots';
const b = await chromium.launch(); const errs = [];
async function page(tag, opts){ const p = await (await b.newContext(opts)).newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message)); p.on('response', r => { if (r.status() >= 400 && !r.url().includes('/_vercel/')) errs.push(tag + ' ' + r.status() + ' ' + r.url()); }); await p.goto(BASE + '?test'); await p.waitForTimeout(500); return p; }
const mode = p => p.evaluate(() => __gg.S.mode);
for (const [tag, opts] of [['desk', { viewport: { width: 1280, height: 860 } }], ['phone', { ...devices['iPhone 15 Pro'] }], ['land', { ...devices['iPhone 15 Pro landscape'] }]]) {
  const p = await page(tag, opts);
  await p.click('#powerBtn'); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/${tag}-boot.png` });
  await p.waitForFunction(() => __gg.S.mode === 'menu', null, { timeout: 8000 });
  await p.waitForTimeout(300); await p.screenshot({ path: `${out}/${tag}-menu.png` });
  // tunnel raider via FIRE
  const t0 = Date.now(); await p.click('#fireBtn');
  await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/${tag}-load-tunnel.png` });
  await p.waitForFunction(() => __gg.S.mode === 'ready' || __gg.S.mode === 'play', null, { timeout: 8000 });
  const tl = (Date.now() - t0) / 1000;
  await p.waitForTimeout(1600); await p.screenshot({ path: `${out}/${tag}-tunnel.png` });
  // SELECT back to the menu, pick Dino Run
  await p.keyboard.press('g'); await p.waitForTimeout(400);   // SELECT's key (the button is hidden for now)
  const afterSel = await mode(p);
  await p.waitForFunction(() => __gg.S.mode === 'menu', null, { timeout: 6000 });
  if (tag === 'desk') { await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); } else { await p.evaluate(() => __gg.loadGame(1)); }
  const t1 = Date.now(); await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${tag}-load-dino.png` });
  await p.waitForFunction(() => __gg.S.mode === 'ready' || __gg.S.mode === 'play', null, { timeout: 8000 });
  const dl = (Date.now() - t1) / 1000 + 0.9;
  await p.waitForTimeout(1500);
  if (tag === 'desk') { for (let i = 0; i < 6; i++) { await p.keyboard.press('Space'); await p.waitForTimeout(450); } }
  else { const c = await p.locator('#cv').boundingBox(); for (let i = 0; i < 6; i++) { await p.mouse.click(c.x + c.width / 2, c.y + c.height / 2); await p.waitForTimeout(450); } }
  await p.screenshot({ path: `${out}/${tag}-dino.png` });
  const st = await p.evaluate(() => ({ mode: __gg.S.mode, score: __gg.S.score, game: __gg.game.id }));
  // force a qualifying game over and enter a name
  await p.evaluate(() => { if (__gg.S.mode === 'play') { __gg.S.score = 777; __gg.finishGame(); } });
  await p.waitForTimeout(300);
  const m2 = await mode(p);
  if (m2 === 'entry') { await p.keyboard.type('DINO'); await p.keyboard.press('Enter'); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/${tag}-dino-board.png` }); }
  const boards = await p.evaluate(() => ({ dino: localStorage.getItem('gg-board-dino'), tunnel: localStorage.getItem('gg-board-tunnel') }));
  console.log(tag, { tunnelLoad: tl.toFixed(1), afterSelect: afterSel, dinoLoad: dl.toFixed(1), dino: st, endMode: m2, boards });
}
console.log(errs.join('\n') || 'no errors'); await b.close();
})();
