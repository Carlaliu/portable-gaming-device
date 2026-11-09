/* I Invade: the fixed-screen alien shooter turned round. You are the fleet; the tanks below are the defenders.
   Steer the formation, drop bombs from its bomb bay, and call in the UFO for a strike from above.
   The fleet, tanks, art, sound and code here are original. Everything is in low-res screen pixels. */
import type { ConsoleAPI, CreateGame } from '../types';
import { useApi, sprite, CROWN, PUFFER, POD, TANK, UFO, BLAST } from './art';

let api: ConsoleAPI;

const SX = 16, SY = 12, AW = 11, AH = 8;                 // formation spacing; alien size
const ROWS = 4, FLEET_SPEED = 48, BOMB_SPEED = 150, SHOT_SPEED = 170;
const TW = 13, TH = 7;                                    // tank size
const UFO_SPEED = 72, UFO_RECHARGE = 14, EXTRA_EVERY = 2000;
const SPRITES = [CROWN, PUFFER, PUFFER, POD];
const ROLES = ['rockjaw', 'borer', 'borer', 'grub'];
const BW = 18, BH = 10;

type Alien = { c: number; r: number; alive: boolean };
type Tank = { x: number; dir: number; goal: number; goalT: number; cool: number; out: boolean; dodge: boolean };
type Shot = { x: number; y: number };
type Bunker = { x: number; y: number; px: Uint8Array };

const F = {
  aliens: [] as Alien[], cols: 9, ox: 0, oy: 0, dropT: 0, beatT: 0, frame: 0, note: 0,
  bomb: null as null | Shot,
  tanks: [] as Tank[], shots: [] as Shot[], bunkers: [] as Bunker[],
  ufo: null as null | { x: number; dir: number; dropped: boolean }, heavy: null as null | Shot,
  bursts: [] as { x: number; y: number; t: number; text?: string }[],
  extra: EXTRA_EVERY, landed: false, wiped: false,
};

const groundY = () => api.LH - 5;
const tankY = () => api.LH - 14;
const bunkerY = () => tankY() - 26;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const tone: ConsoleAPI['tone'] = (...a) => api.tone(...a);
const alive = () => F.aliens.filter(a => a.alive);
const tankPts = () => 100 + 50 * (api.S.level - 1);

/* ---------- the fleet ---------- */
function newFleet(){
  const { LW, HUD } = api;
  F.cols = Math.max(5, Math.min(9, Math.floor((LW - 60) / SX)));
  F.aliens = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < F.cols; c++) F.aliens.push({ c, r, alive: true });
  F.ox = Math.round((LW - (F.cols - 1) * SX - AW) / 2);
  F.oy = HUD + 20;
  F.dropT = dropEvery(); F.beatT = 0; F.bomb = null; F.shots = []; F.wiped = false;
}
/* the fleet sinks a step every few seconds, sooner each wave */
const dropEvery = () => Math.max(1.6, 3.2 - 0.25 * (api.S.level - 1));
/* the columns still flying, the bomb bay (the column nearest the middle) and where it is */
function span(){
  const al = alive(); if (!al.length) return null;
  const cs = al.map(a => a.c), minC = Math.min(...cs), maxC = Math.max(...cs);
  const mid = F.ox + (minC + maxC) * SX / 2 + AW / 2;
  const cols = [...new Set(cs)];
  const bay = cols.reduce((b, c) => Math.abs(F.ox + c * SX + 5 - mid) < Math.abs(F.ox + b * SX + 5 - mid) ? c : b, cols[0]);
  const low = al.filter(a => a.c === bay).reduce((p, q) => (q.r > p.r ? q : p));
  const bottom = F.oy + Math.max(...al.map(a => a.r)) * SY + AH;
  return { minC, maxC, mid, bay, bayX: F.ox + bay * SX + 5, bayY: F.oy + low.r * SY + AH, bottom, cols };
}

/* ---------- a wave: a fresh fleet, a row of tanks and the walls they hide behind ---------- */
function newWave(){
  const { LW, S } = api;
  newFleet();
  const n = Math.min(5, 1 + S.level);
  F.tanks = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round((LW - TW) * (i + 0.5) / n);
    F.tanks.push({ x, dir: i % 2 ? -1 : 1, goal: x, goalT: rnd(0.5, 1.5), cool: rnd(1.2, 2.4), out: false, dodge: false });
  }
  const nb = LW >= 300 ? 4 : 3, gap = (LW - nb * BW) / (nb + 1);
  F.bunkers = [];
  for (let i = 0; i < nb; i++) {
    const px = new Uint8Array(BW * BH);
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const roof = y === 0 ? x > 2 && x < BW - 3 : y === 1 ? x > 0 && x < BW - 1 : true;   // a rounded pillbox
      const slit = y === 3 && x >= 7 && x < 11;
      px[y * BW + x] = roof && !slit ? 1 : 0;
    }
    F.bunkers.push({ x: Math.round(gap + i * (BW + gap)), y: bunkerY(), px });
  }
  F.ufo = null; F.heavy = null; F.bursts = []; F.landed = false;
}

function start(){
  api.fitGrid();
  const S = api.S;
  S.score = 0; S.level = 1; S.lives = 3; S.charge = 1; S.boost = 1; S.boostT = 0;
  F.extra = EXTRA_EVERY;
  newWave();
}

function addScore(n: number, x?: number, y?: number){
  const S = api.S;
  S.score += n;
  if (S.score > api.best) api.best = S.score;
  if (S.score >= F.extra) { F.extra += EXTRA_EVERY; S.lives++; [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.08, 0.05, 0, i * 0.07)); }
  if (x != null) F.bursts.push({ x, y: y!, t: 0.8, text: String(n) });
}

function bunkerHit(x: number, y: number, radius = 2){
  for (const b of F.bunkers) {
    const lx = Math.floor(x - b.x), ly = Math.floor(y - b.y);
    if (lx < 0 || ly < 0 || lx >= BW || ly >= BH || !b.px[ly * BW + lx]) continue;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const xx = lx + dx, yy = ly + dy;
      if (xx < 0 || yy < 0 || xx >= BW || yy >= BH) continue;
      if (dx * dx + dy * dy <= radius * radius + 1 && Math.random() < 0.75) b.px[yy * BW + xx] = 0;
    }
    return true;
  }
  return false;
}

function hitTank(x: number, y: number){
  const ty = tankY();
  if (y < ty - 1 || y > ty + TH) return null;
  return F.tanks.find(t => !t.out && x >= t.x - 1 && x <= t.x + TW) || null;
}
function blowUp(t: Tank){
  t.out = true;
  addScore(tankPts(), t.x, tankY() - 10);
  F.bursts.push({ x: t.x, y: tankY(), t: 0.5 });
  tone(140, 0.3, 0.06, -90); tone(70, 0.4, 0.05, -30, 0.05);
}

function update(dt: number){
  const S = api.S, LW = api.LW;
  for (const b of F.bursts) b.t -= dt;
  F.bursts = F.bursts.filter(b => b.t > 0);
  if (S.mode === 'ready') { if ((S.modeT -= dt) <= 0) S.mode = 'play'; api.clearFire(); api.clearTap(); api.clearBoost(); return; }
  if (S.mode === 'clear') { if ((S.modeT -= dt) <= 0) { S.level++; newWave(); S.mode = 'ready'; S.modeT = 1.2; } return; }
  if (S.mode === 'dying') {
    if ((S.modeT -= dt) > 0) return;
    if (S.lives > 0) { newFleet(); S.mode = 'ready'; S.modeT = 0.9; }
    else api.finishGame();
    return;
  }
  if (S.mode !== 'play') return;
  const sp = span();
  if (!sp) return;

  /* you steer the fleet left and right; FIRE drops a bomb from the bomb bay, one in the air at a time */
  const sd = api.stickDir, keys = api.held.filter(d => d === 'left' || d === 'right');
  const dir = sd === 'left' || sd === 'right' ? sd : keys[keys.length - 1];
  if (dir) {
    const lo = 4 - sp.minC * SX, hi = LW - 4 - AW - sp.maxC * SX;
    F.ox = Math.max(lo, Math.min(hi, F.ox + (dir === 'left' ? -1 : 1) * FLEET_SPEED * dt));
  }
  if ((api.fireQueued || api.tapQueued) && !F.bomb) {
    F.bomb = { x: Math.round(sp.bayX), y: sp.bayY };
    tone(330, 0.12, 0.035, -200);
    const chance = Math.min(0.75, 0.2 + 0.1 * S.level);   // the defenders get better at spotting bombs
    for (const t of F.tanks) t.dodge = Math.random() < chance;
  }
  api.clearFire(); api.clearTap();
  S.charge = F.bomb ? 0 : 1;

  /* BOOST calls in the UFO: it crosses the sky and drops one heavy bomb on the first tank it passes over */
  if (api.boostQueued && S.boost >= 1 && !F.ufo) {
    const from = sp.mid < LW / 2 ? 1 : -1;
    F.ufo = { x: from > 0 ? -16 : LW, dir: from, dropped: false };
    S.boost = 0; tone(520, 0.3, 0.04, 400);
  }
  api.clearBoost();
  if (F.ufo) {
    S.boostT = 1;
    F.ufo.x += F.ufo.dir * UFO_SPEED * dt;
    if (Math.floor(S.time * 8) % 2 === 0) tone(F.ufo.dropped ? 440 : 600, 0.03, 0.012);
    if (!F.ufo.dropped && F.tanks.some(t => !t.out && Math.abs(t.x + TW / 2 - (F.ufo!.x + 8)) < 3)) {
      F.ufo.dropped = true; F.heavy = { x: Math.round(F.ufo.x + 8), y: api.HUD + 10 }; tone(220, 0.4, 0.04, -150);
    }
    if (F.ufo.x < -20 || F.ufo.x > LW + 4) F.ufo = null;
  } else { S.boostT = 0; S.boost = Math.min(1, S.boost + dt / UFO_RECHARGE); }

  /* your bomb */
  if (F.bomb) {
    const b = F.bomb; b.y += BOMB_SPEED * dt;
    const t = hitTank(b.x, b.y + 3);
    if (t) { blowUp(t); F.bomb = null; }
    else if (bunkerHit(b.x, b.y + 3, 2)) { F.bomb = null; tone(180, 0.06, 0.03); }
    else if (b.y + 3 >= groundY()) { F.bomb = null; F.bursts.push({ x: b.x - 6, y: groundY() - 6, t: 0.2 }); tone(90, 0.08, 0.03); }
  }
  /* the UFO's heavy bomb smashes through the walls */
  if (F.heavy) {
    const h = F.heavy; h.y += BOMB_SPEED * 1.2 * dt;
    bunkerHit(h.x, h.y + 4, 3);
    const t = hitTank(h.x, h.y + 4);
    if (t) { blowUp(t); F.heavy = null; }
    else if (h.y + 4 >= groundY()) F.heavy = null;
  }

  /* the fleet sinks; the beat quickens as it gets lower */
  const depth = Math.max(0, Math.min(1, (sp.bottom - api.HUD - 20 - ROWS * SY) / Math.max(1, tankY() - api.HUD - 20 - ROWS * SY)));
  if ((F.beatT -= dt) <= 0) {
    F.beatT = 0.6 - depth * 0.4; F.frame ^= 1;
    tone([110, 98, 87, 82][F.note = (F.note + 1) % 4], 0.07, 0.06);
  }
  if ((F.dropT -= dt) <= 0) {
    F.dropT = dropEvery(); F.oy += 6;
    for (const a of alive()) {   // the fleet chews through walls it sinks into
      const ax = F.ox + a.c * SX, ay = F.oy + a.r * SY;
      if (ay + AH >= bunkerY()) for (let x = ax; x < ax + AW; x += 2) for (let y = ay; y < ay + AH; y += 2) bunkerHit(x, y, 1);
    }
  }
  /* touchdown: the fleet reaches the tanks' row, and the planet is yours */
  if (sp.bottom + 6 >= tankY()) {
    const left = alive().length;
    F.landed = true; addScore(left * 20);
    for (const t of F.tanks) if (!t.out) { t.out = true; F.bursts.push({ x: t.x, y: tankY(), t: 0.6 }); }
    S.mode = 'clear'; S.modeT = 2.2;
    [262, 330, 392, 523, 392, 523, 659].forEach((f, i) => tone(f, 0.12, 0.045, 0, i * 0.1));
    api.track('touchdown', { level: S.level, aliens: left });
    return;
  }

  /* the tanks: patrol under the fleet, shoot up at it, and dodge bombs they spot */
  const lvl = S.level, tSpeed = Math.min(64, 30 + 5 * lvl);
  for (const t of F.tanks) {
    if (t.out) continue;
    const cx = t.x + TW / 2;
    const threat = [F.bomb, F.heavy].find(b => b && Math.abs(b.x - cx) < TW && b.y > api.LH * 0.35);
    let want = 0;
    if (threat && (t.dodge || threat === F.heavy)) want = threat.x < cx ? 1 : -1;
    else {
      if ((t.goalT -= dt) <= 0) { const c = sp.cols[Math.floor(Math.random() * sp.cols.length)]; t.goal = F.ox + c * SX + 5 - TW / 2; t.goalT = rnd(0.8, 2.2); }
      if (Math.abs(t.goal - t.x) > 1.5) want = t.goal > t.x ? 1 : -1;
    }
    if (want) t.x = Math.max(2, Math.min(LW - 2 - TW, t.x + want * tSpeed * (threat ? 1.4 : 1) * dt));
    // shoot when lined up under a column
    t.cool -= dt;
    const lined = sp.cols.some(c => Math.abs(F.ox + c * SX + 5 - cx) < 4);
    if (t.cool <= 0 && lined && !threat) {
      F.shots.push({ x: Math.round(cx), y: tankY() - 3 });
      t.cool = Math.max(0.9, 2.7 - 0.25 * lvl) + rnd(0, 0.8);
      tone(900, 0.05, 0.025, -500);
    }
  }
  // tanks keep their distance from each other
  const live = F.tanks.filter(t => !t.out).sort((a, b) => a.x - b.x);
  for (let i = 1; i < live.length; i++) if (live[i].x - live[i - 1].x < TW + 2) { const m = (live[i].x + live[i - 1].x) / 2; live[i - 1].x = Math.max(2, m - (TW + 2) / 2); live[i].x = Math.min(LW - 2 - TW, m + (TW + 2) / 2); }

  /* tank shots: through the gaps, into your fleet */
  for (const s of F.shots) {
    s.y -= SHOT_SPEED * dt;
    if (F.bomb && Math.abs(F.bomb.x - s.x) <= 1 && Math.abs(F.bomb.y - s.y) < 4) { F.bomb = null; s.y = -99; tone(1200, 0.04, 0.02); continue; }   // shot meets bomb
    if (bunkerHit(s.x, s.y, 1)) { s.y = -99; continue; }
    if (F.ufo && s.y < api.HUD + 9 && s.x >= F.ufo.x && s.x < F.ufo.x + 16) { F.bursts.push({ x: F.ufo.x, y: api.HUD + 2, t: 0.4 }); F.ufo = null; s.y = -99; tone(700, 0.3, 0.04, -600); continue; }
    for (const a of F.aliens) {
      if (!a.alive) continue;
      const ax = F.ox + a.c * SX, ay = F.oy + a.r * SY;
      if (s.x >= ax && s.x < ax + AW && s.y <= ay + AH && s.y + 3 >= ay) {
        a.alive = false; s.y = -99; F.bursts.push({ x: ax - 1, y: ay, t: 0.2 }); tone(240, 0.12, 0.04, -160);
        break;
      }
    }
  }
  F.shots = F.shots.filter(s => s.y > api.HUD);

  /* every alien gone: that fleet is lost */
  if (!alive().length) {
    F.wiped = true; S.lives--; S.mode = 'dying'; S.modeT = 1.6; F.bomb = null; F.shots = [];
    [392, 330, 262, 196, 147].forEach((f, i) => tone(f, 0.16, 0.045, -20, i * 0.15));
    return;
  }
  /* every tank gone: wave won */
  if (F.tanks.every(t => t.out)) {
    S.mode = 'clear'; S.modeT = 1.8; F.shots = [];
    [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, 0.04, 0, i * 0.09));
  }
}

/* ---------- drawing ---------- */
const MINI = ['.#####.', '###.###', '#######', '.#.#.#.'];   // a spare fleet in the HUD
function hud(){
  const { g, LW, HUD, S, txt } = api;
  g.fillStyle = api.col('bg'); g.fillRect(0, 0, LW, HUD);
  txt(String(S.score).padStart(6, '0'), 6, 6, 'text');
  if (LW >= 300) txt('HI ' + String(api.best).padStart(6, '0'), 80, 6, 'hud');
  const wave = 'WAVE ' + S.level;
  txt(wave, LW - 6, 6, 'hud', 'right');
  const lives = Math.max(0, Math.min(5, S.lives - (S.mode === 'dying' ? 0 : 1)));
  let x = LW - 12 - wave.length * 6 - lives * 10;
  for (let i = 0; i < lives; i++, x += 10) sprite(MINI, x, 6, 'grub');
  g.fillStyle = api.col('hud'); for (let i = 0; i < LW; i += 4) g.fillRect(i, HUD - 2, 2, 1);
}
function draw(){
  const { g, LW, S } = api;
  g.fillStyle = api.col('gem');
  for (const b of F.bunkers) for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) if (b.px[y * BW + x]) g.fillRect(b.x + x, b.y + y, 1, 1);
  // your fleet, with the bomb bay lit while a bomb is ready
  for (const a of F.aliens) if (a.alive) sprite(SPRITES[a.r][F.frame], F.ox + a.c * SX, F.oy + a.r * SY, ROLES[a.r]);
  const sp = span();
  if (sp && !F.bomb && S.mode === 'play' && Math.floor(S.time * 4) % 2 === 0) { g.fillStyle = api.col('spark'); g.fillRect(Math.round(sp.bayX) - 1, sp.bayY + 1, 3, 1); }
  if (F.ufo) sprite(UFO, F.ufo.x, api.HUD + 3, 'sun');
  // bombs and shots
  g.fillStyle = api.col('gold');
  if (F.bomb) { const y = Math.round(F.bomb.y); g.fillRect(F.bomb.x - 1, y, 3, 3); g.fillRect(F.bomb.x, y + 3, 1, 1); }
  if (F.heavy) { const y = Math.round(F.heavy.y); g.fillRect(F.heavy.x - 2, y, 5, 4); g.fillRect(F.heavy.x - 1, y + 4, 3, 1); }
  g.fillStyle = api.col('spark');
  for (const s of F.shots) g.fillRect(s.x, Math.round(s.y), 1, 3);
  for (const t of F.tanks) if (!t.out) sprite(TANK, t.x, tankY(), 'cart');
  g.fillStyle = api.col('hud'); g.fillRect(0, groundY(), LW, 1);
  for (const b of F.bursts) {
    if (b.text) api.txt(b.text, b.x, b.y, 'gold');
    else sprite(BLAST, b.x, b.y, Math.floor(b.t * 12) % 2 ? 'spark' : 'gold');
  }
  hud();
  if (S.mode === 'ready') api.banner('WAVE ' + S.level, 'FIRE TO BOMB · BOOST FOR UFO');
  if (S.mode === 'clear') api.banner(F.landed ? 'TOUCHDOWN' : 'TANKS DESTROYED', F.landed ? 'THE PLANET IS YOURS' : '');
  if (S.mode === 'dying' && F.wiped) api.banner('FLEET LOST');
}

const create: CreateGame = a => {
  api = a; useApi(a);
  return { start, update, draw, debug: { state: () => F } };
};
export default create;
