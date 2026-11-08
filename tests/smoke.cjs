// Smoke test: boots the built console in Chromium at a few sizes, plays, and checks for errors.
// Uses the machine's Playwright (run with NODE_PATH=$(npm root -g)).
const { chromium, devices } = require('playwright');
(async () => {
const BASE = process.env.BASE || 'http://localhost:4173/';
const out = process.env.OUT || '/tmp/shots';
const b = await chromium.launch(); const errs = [];
async function page(tag, opts){ const p = await (await b.newContext(opts)).newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message)); p.on('response', r => { if (r.status() >= 400 && !r.url().includes('/_vercel/')) errs.push(tag + ' ' + r.status() + ' ' + r.url()); }); await p.goto(BASE + '?test'); await p.waitForTimeout(500); return p; }
const d = await page('desk', { viewport: { width: 1280, height: 860 } });
await d.click('#powerBtn'); await d.waitForTimeout(6000);
console.log('desk mode after boot:', await d.evaluate(() => __gg.S.mode));
await d.keyboard.down('ArrowRight'); await d.waitForTimeout(700); await d.keyboard.up('ArrowRight');
await d.screenshot({ path: out + '/desk-play.png' });
await d.evaluate(() => { const S = __gg.S; S.score = 4321; S.lives = 1; __gg.killPlayer('grub'); });
await d.waitForFunction(() => __gg.S.mode === 'entry', null, { timeout: 15000 });
await d.keyboard.type('TEST'); await d.keyboard.press('Enter'); await d.waitForTimeout(500);
console.log('board:', await d.evaluate(() => JSON.stringify(__gg.board)));
const ph = await page('phone', { ...devices['iPhone 15 Pro'] });
await ph.tap('#powerBtn'); await ph.waitForTimeout(6000);
console.log('phone mode:', await ph.evaluate(() => __gg.S.mode));
await ph.screenshot({ path: out + '/phone-play.png' });
console.log(errs.join('\n') || 'no errors'); await b.close();
})();
