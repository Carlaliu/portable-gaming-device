/* Invader Force: hold the line against a marching alien formation.
   A tribute to the fixed-screen alien shooters of the late 1970s (Taito's Space Invaders, 1978).
   The aliens, cannon, art, sound and code here are original. Everything is in low-res screen pixels. */
import type { ConsoleAPI, CreateGame } from '../types';
import { useApi, sprite, JELLY, BEETLE, DRONE, CANNON, SAUCER, BURST } from './art';

let api: ConsoleAPI;

const SX = 16, SY = 12, AW = 11, AH = 8;              // formation spacing; alien size
const ROWS = 5, CANNON_SPEED = 72, SHOT_SPEED = 240;
const SHIELD_TIME = 1.6, SHIELD_RECHARGE = 9, EXTRA_EVERY = 1500;
const POINTS = [30, 20, 10];                            // jelly, beetle, drone
const ROLES = ['rockjaw', 'borer', 'grub'];
const SPRITES = [JELLY, BEETLE, DRONE];
const typeOf = (r: number) => (r === 0 ? 0 : r < 3 ? 1 : 2);

type Alien = { c: number; r: number; t: number; alive: boolean };
type Bunker = { x: number; y: number; px: Uint8Array };
const BW = 18, BH = 12;

const F = {
  aliens: [] as Alien[], cols: 11, total: 0, ox: 0, oy: 0, dir: 1, stepT: 0, frame: 0, note: 0,
  px: 0, shot: null as null | { x: number; y: number },
  bombs: [] as { x: number; y: number; v: number; k: number }[],
  bunkers: [] as Bunker[],
  ufo: null as null | { x: number; dir: number; pts: number; sirenT: number }, ufoT: 20,
  bursts: [] as { x: number; y: number; t: number; text?: string }[],
  extra: EXTRA_EVERY, invaded: false,
};

const cannonY = () => api.LH - 14;
const bunkerY = () => cannonY() - 28;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const tone: ConsoleAPI['tone'] = (...a) => api.tone(...a);

/* ---------- a wave ---------- */
function newWave(){
  const { LW, HUD, S } = api;
  const wave = S.level;
  F.cols = Math.max(6, Math.min(11, Math.floor((LW - 40) / SX)));
  F.aliens = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < F.cols; c++) F.aliens.push({ c, r, t: typeOf(r), alive: true });
  F.total = F.aliens.length;
  F.ox = Math.round((LW - (F.cols - 1) * SX - AW) / 2);
  F.oy = HUD + 22 + Math.min(4, wave - 1) * 6;           // each wave starts a little lower
  F.dir = 1; F.stepT = 0.6; F.frame = 0;
  F.shot = null; F.bombs = []; F.ufo = null; F.ufoT = rnd(16, 24); F.bursts = []; F.invaded = false;
  // bunkers: castle walls with a gate, rebuilt every wave
  const n = LW >= 300 ? 4 : 3, gap = (LW - n * BW) / (n + 1);
  F.bunkers = [];
  for (let i = 0; i < n; i++) {
    const px = new Uint8Array(BW * BH);
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const merlon = y < 2 ? x % 4 < 2 : true;
      const gate = y >= BH - 3 && x >= 6 && x < 12;
      px[y * BW + x] = merlon && !gate ? 1 : 0;
    }
    F.bunkers.push({ x: Math.round(gap + i * (BW + gap)), y: bunkerY(), px });
  }
}
function stepInterval(){
  const alive = F.aliens.filter(a => a.alive).length;
  const base = Math.max(0.2, 0.62 * Math.pow(0.9, api.S.level - 1));
  return 0.016 + base * Math.pow(alive / F.total, 1.15);  // the fewer left, the faster they march
}

function start(){
  api.fitGrid();
  const S = api.S;
  S.score = 0; S.level = 1; S.lives = 3; S.charge = 1; S.boost = 1; S.boostT = 0;
  F.extra = EXTRA_EVERY;
  F.px = Math.round(api.LW / 2 - 6);
  newWave();
}

/* ---------- scoring ---------- */
function addScore(n: number, x?: number, y?: number){
  const S = api.S;
  S.score += n;
  if (S.score > api.best) api.best = S.score;
  if (S.score >= F.extra) { F.extra += EXTRA_EVERY; S.lives++; [1047, 1319, 1568].forEach((f, i) => tone(f, 0.09, 0.05, 0, i * 0.08)); }
  if (x != null) F.bursts.push({ x, y: y!, t: 0.8, text: String(n) });
}

/* ---------- bunkers ---------- */
function bunkerHit(x: number, y: number, radius = 2){
  for (const b of F.bunkers) {
    const lx = Math.floor(x - b.x), ly = Math.floor(y - b.y);
    if (lx < 0 || ly < 0 || lx >= BW || ly >= BH || !b.px[ly * BW + lx]) continue;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const xx = lx + dx, yy = ly + dy;
      if (xx < 0 || yy < 0 || xx >= BW || yy >= BH) continue;
      if (dx * dx + dy * dy <= radius * radius + 1 && Math.random() < 0.75) b.px[yy * BW + xx] = 0;   // ragged bites
    }
    return true;
  }
  return false;
}

/* ---------- the player is hit, or the line falls ---------- */
function loseLife(invaded = false){
  const S = api.S;
  F.invaded = invaded;
  S.lives = invaded ? 0 : S.lives - 1;
  S.mode = 'dying'; S.modeT = 1.4;
  F.shot = null;
  [440, 392, 330, 262, 196].forEach((f, i) => tone(f, 0.16, 0.045, -20, i * 0.15));
  F.bursts.push({ x: F.px + 1, y: cannonY(), t: 1.2 });
}

function update(dt: number){
  const S = api.S, LW = api.LW;
  for (const b of F.bursts) b.t -= dt;
  F.bursts = F.bursts.filter(b => b.t > 0);
  if (S.mode === 'ready') { if ((S.modeT -= dt) <= 0) S.mode = 'play'; api.clearFire(); api.clearTap(); return; }
  if (S.mode === 'clear') { if ((S.modeT -= dt) <= 0) { S.level++; newWave(); S.mode = 'ready'; S.modeT = 1.2; } return; }
  if (S.mode === 'dying') {
    if ((S.modeT -= dt) > 0) return;
    if (S.lives > 0) { F.bombs = []; F.px = Math.round(LW / 2 - 6); S.mode = 'ready'; S.modeT = 0.9; }
    else api.finishGame();
    return;
  }
  if (S.mode !== 'play') return;

  /* your cannon: left and right, one shot in the air at a time, and a short shield */
  const sd = api.stickDir, keys = api.held.filter(d => d === 'left' || d === 'right');
  const dir = sd === 'left' || sd === 'right' ? sd : keys[keys.length - 1];
  if (dir) F.px = Math.max(4, Math.min(LW - 4 - 13, F.px + (dir === 'left' ? -1 : 1) * CANNON_SPEED * dt));
  if ((api.fireQueued || api.tapQueued) && !F.shot) { F.shot = { x: Math.round(F.px) + 6, y: cannonY() - 2 }; tone(880, 0.06, 0.03, -500); }
  api.clearFire(); api.clearTap();
  S.charge = F.shot ? 0 : 1;
  if (api.boostQueued && S.boost >= 1) { S.boostT = SHIELD_TIME; S.boost = 0; tone(400, 0.25, 0.04, 600); }
  api.clearBoost();
  if (S.boostT > 0) S.boostT -= dt; else S.boost = Math.min(1, S.boost + dt / SHIELD_RECHARGE);

  /* your shot */
  if (F.shot) {
    F.shot.y -= SHOT_SPEED * dt;
    const { x, y } = F.shot;
    let hit = false;
    if (F.ufo && y < api.HUD + 12 && x >= F.ufo.x && x < F.ufo.x + 16) {
      addScore(F.ufo.pts, F.ufo.x + 2, api.HUD + 4); F.ufo = null; hit = true; tone(1200, 0.25, 0.045, -900);
    }
    for (const a of F.aliens) {
      if (hit || !a.alive) continue;
      const ax = F.ox + a.c * SX, ay = F.oy + a.r * SY;
      if (x >= ax && x < ax + AW && y + 3 >= ay && y < ay + AH) {
        a.alive = false; hit = true; addScore(POINTS[a.t]);
        F.bursts.push({ x: ax, y: ay, t: 0.18 }); tone(260, 0.12, 0.04, -180);
      }
    }
    if (!hit) for (const b of F.bombs) if (Math.abs(b.x - x) <= 1 && Math.abs(b.y - y) < 4) { b.y = 9999; hit = true; break; }   // shots meet
    if (!hit && bunkerHit(x, y, 1)) hit = true;
    if (hit || y < api.HUD + 2) F.shot = null;
  }

  /* the formation marches; at an edge it drops a row and turns */
  const alive = F.aliens.filter(a => a.alive);
  if (!alive.length) { S.mode = 'clear'; S.modeT = 1.8; [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, 0.04, 0, i * 0.09)); return; }
  if ((F.stepT -= dt) <= 0) {
    F.stepT = stepInterval();
    const minC = Math.min(...alive.map(a => a.c)), maxC = Math.max(...alive.map(a => a.c));
    const dx = alive.length === 1 ? 3 : 2;
    const left = F.ox + minC * SX + F.dir * dx, right = F.ox + maxC * SX + AW + F.dir * dx;
    if (left < 4 || right > LW - 4) { F.oy += 6; F.dir = -F.dir; } else F.ox += F.dir * dx;
    F.frame ^= 1;
    tone([98, 87, 78, 73][F.note = (F.note + 1) % 4], 0.07, 0.06);
    // the bottom alien of a column drops a bomb, often the one nearest you
    const maxBombs = Math.min(5, 2 + Math.floor(S.level / 2));
    if (F.bombs.length < maxBombs && Math.random() < 0.35 + 0.05 * S.level) {
      const cols = [...new Set(alive.map(a => a.c))];
      const near = cols.reduce((b, c) => Math.abs(F.ox + c * SX + 5 - F.px) < Math.abs(F.ox + b * SX + 5 - F.px) ? c : b, cols[0]);
      const c = Math.random() < 0.4 ? near : cols[Math.floor(Math.random() * cols.length)];
      const a = alive.filter(q => q.c === c).reduce((p, q) => (q.r > p.r ? q : p));
      F.bombs.push({ x: F.ox + a.c * SX + 5, y: F.oy + a.r * SY + AH, v: Math.min(130, 70 + S.level * 6), k: Math.floor(Math.random() * 2) });
    }
    // aliens chew through the walls they reach; if they reach your row, the line has fallen
    const bottom = F.oy + Math.max(...alive.map(a => a.r)) * SY + AH;
    for (const a of alive) {
      const ax = F.ox + a.c * SX, ay = F.oy + a.r * SY;
      if (ay + AH >= bunkerY()) for (let x = ax; x < ax + AW; x += 2) for (let y = ay; y < ay + AH; y += 2) bunkerHit(x, y, 1);
    }
    if (bottom >= cannonY()) { loseLife(true); return; }
  }

  /* bombs */
  for (const b of F.bombs) {
    b.y += b.v * dt;
    if (bunkerHit(b.x, b.y + 3, 2)) { b.y = 9999; continue; }
    const cy = cannonY();
    if (b.y + 4 >= cy && b.y < cy + 7 && b.x >= F.px && b.x < F.px + 13) {
      b.y = 9999;
      if (S.boostT > 0) { tone(1500, 0.05, 0.03); continue; }   // the shield takes it
      loseLife(); return;
    }
  }
  F.bombs = F.bombs.filter(b => b.y < api.LH - 6);

  /* the mystery saucer */
  if (!F.ufo && (F.ufoT -= dt) <= 0 && alive.length > 6) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    F.ufo = { x: dir > 0 ? -16 : LW, dir, pts: [50, 100, 150, 300][Math.floor(Math.random() * 4)], sirenT: 0 };
    F.ufoT = rnd(18, 28);
  }
  if (F.ufo) {
    F.ufo.x += F.ufo.dir * 45 * dt;
    if ((F.ufo.sirenT -= dt) <= 0) { F.ufo.sirenT = 0.22; tone(Math.floor(api.S.time * 9) % 2 ? 660 : 520, 0.09, 0.018); }
    if (F.ufo.x < -20 || F.ufo.x > LW + 4) F.ufo = null;
  }
}

/* ---------- drawing ---------- */
const MINI = ['...#...', '..###..', '#######', '#.#.#.#'];   // a spare cannon in the HUD
function hud(){
  const { g, LW, HUD, S, txt } = api;
  g.fillStyle = api.col('bg'); g.fillRect(0, 0, LW, HUD);
  txt(String(S.score).padStart(6, '0'), 6, 6, 'text');
  if (LW >= 300) txt('HI ' + String(api.best).padStart(6, '0'), 80, 6, 'hud');
  const wave = 'WAVE ' + S.level;
  txt(wave, LW - 6, 6, 'hud', 'right');
  const lives = Math.max(0, Math.min(5, S.lives - (S.mode === 'dying' ? 0 : 1)));
  let x = LW - 12 - wave.length * 6 - lives * 10;
  for (let i = 0; i < lives; i++, x += 10) sprite(MINI, x, 6, 'cart');
  g.fillStyle = api.col('hud'); for (let i = 0; i < LW; i += 4) g.fillRect(i, HUD - 2, 2, 1);
}
function draw(){
  const { g, LW, LH, S } = api;
  // bunkers
  g.fillStyle = api.col('gem');
  for (const b of F.bunkers) for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) if (b.px[y * BW + x]) g.fillRect(b.x + x, b.y + y, 1, 1);
  // the formation
  for (const a of F.aliens) if (a.alive) sprite(SPRITES[a.t][F.frame], F.ox + a.c * SX, F.oy + a.r * SY, ROLES[a.t]);
  if (F.ufo) sprite(SAUCER, F.ufo.x, api.HUD + 4, 'sun');
  // shots and bombs
  if (F.shot) { g.fillStyle = api.col('spark'); g.fillRect(F.shot.x, Math.round(F.shot.y), 1, 4); }
  g.fillStyle = api.col('gold');
  for (const b of F.bombs) {
    const y = Math.round(b.y), w = Math.floor(S.time * 12 + b.x) % 2;
    if (b.k) { g.fillRect(b.x + w, y, 1, 1); g.fillRect(b.x + 1 - w, y + 1, 1, 1); g.fillRect(b.x + w, y + 2, 1, 1); g.fillRect(b.x + 1 - w, y + 3, 1, 1); }
    else { g.fillRect(b.x, y, 1, 4); g.fillRect(b.x - 1, y + 1 + w * 2, 3, 1); }
  }
  // your cannon (blinking while it respawns), with the shield dome when it's up
  const cy = cannonY();
  const show = S.mode !== 'dying' && !(S.mode === 'ready' && Math.floor(S.modeT * 8) % 2);
  if (show) sprite(CANNON, F.px, cy, 'cart');
  if (S.boostT > 0 && Math.floor(S.time * 20) % 3) {
    g.fillStyle = api.col('gem');
    for (let i = -9; i <= 9; i++) { const x = F.px + 6 + i, y = cy - 2 - Math.round(Math.sqrt(Math.max(0, 81 - i * i)) * 0.7); g.fillRect(x, y, 1, 1); }
  }
  // the ground
  g.fillStyle = api.col('hud'); g.fillRect(0, LH - 5, LW, 1);
  // bursts and points
  for (const b of F.bursts) {
    if (b.text) api.txt(b.text, b.x, b.y, 'gold');
    else sprite(BURST, b.x, b.y, S.mode === 'dying' && b.t > 0.2 && Math.floor(b.t * 10) % 2 ? 'spark' : 'gold');
  }
  hud();
  if (S.mode === 'ready') api.banner('WAVE ' + S.level, 'FIRE TO SHOOT · BOOST FOR SHIELD');
  if (S.mode === 'clear') api.banner('WAVE CLEARED');
  if (S.mode === 'dying' && F.invaded) api.banner('THE LINE HAS FALLEN');
}

const create: CreateGame = a => {
  api = a; useApi(a);
  return { start, update, draw, debug: { state: () => F } };
};
export default create;
