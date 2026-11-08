/* Dino Run: an endless desert runner, a tribute to the offline dinosaur game in Google Chrome.
   The dinosaur, obstacles, art, sound and code here are original.
   Everything is in low-res screen pixels; heights are measured up from the ground line. */
import {
  S, g, col, txt, banner, LW, LH, HUD, tone, held, stickDir, fireQueued, fireHeld, boostHeld,
  tapQueued, tapHeld, clearFireQueued, clearBoostQueued, clearTap, best, setBest, finishGame, fitGrid, sfx,
} from '../../console/core';
import { diskInfo } from '../../console/loader';
import type { GameDisk } from '../types';
import { strings } from './strings';

const GRAV = 1100, JUMP_V = 330, HOLD_GRAV = 560, HOLD_MAX = 0.2, FAST_FALL = 2.6;
const BASE_SPEED = 140, MAX_SPEED = 330, ACCEL = 0.011;   // px/s, and px/s gained per px run
const PX_PER_POINT = 11, PTERO_FROM = 250;
const DX = 26;                                             // the dinosaur's left edge

type Obs = { kind: 'cactus' | 'tall' | 'rock' | 'ptero'; x: number; w: number; h: number; y: number; vx: number };
const D = {
  y: 0, vy: 0, air: false, duck: false, hold: 0, legT: 0, dist: 0, speed: BASE_SPEED,
  obs: [] as Obs[], clouds: [] as { x: number; y: number }[], gap: 0, chime: 100, flash: 0, dead: false,
};

const groundY = () => Math.min(LH - 22, HUD + Math.round((LH - HUD) * 0.7));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function start(){
  fitGrid();
  Object.assign(D, { y: 0, vy: 0, air: false, duck: false, hold: 0, legT: 0, dist: 0, speed: BASE_SPEED, obs: [], gap: LW * 0.8, chime: 100, flash: 0, dead: false });
  D.clouds = [0, 1, 2].map(i => ({ x: LW * (0.2 + i * 0.35) + rnd(-20, 20), y: HUD + 14 + rnd(0, Math.max(10, groundY() - HUD - 70)) }));
  S.score = 0; S.level = 1; S.lives = 1; S.charge = 1; S.boost = 1; S.boostT = 0;
}

function spawn(){
  const x = LW + 10, ptero = S.score >= PTERO_FROM && Math.random() < 0.3;
  let span = 0;
  if (ptero) {
    const y = [3, 17, 34][Math.floor(Math.random() * 3)];   // low: jump · middle: duck · high: run under
    D.obs.push({ kind: 'ptero', x, w: 18, h: 10, y, vx: 25 }); span = 18;
  } else {
    const r = Math.random();
    if (r < 0.18) { D.obs.push({ kind: 'rock', x, w: 13, h: 8, y: 0, vx: 0 }); span = 13; }
    else {
      const tall = r > 0.62, n = 1 + Math.floor(Math.random() * (tall ? 2 : 3)), w = tall ? 9 : 7, h = tall ? 22 : 15;
      for (let i = 0; i < n; i++) D.obs.push({ kind: tall ? 'tall' : 'cactus', x: x + i * (w + 2), w, h, y: 0, vx: 0 });
      span = n * (w + 2);
    }
  }
  D.gap = D.speed * rnd(0.62, 1.15) + 70 + span;   // always room to land between
}

function hits(o: Obs){
  const [x0, x1, h] = D.duck ? [DX + 1, DX + 26, 12] : [DX + 4, DX + 20, 21];
  const b0 = D.y + 1, b1 = D.y + h;
  return x1 > o.x + 1 && x0 < o.x + o.w - 1 && b1 > o.y + 1 && b0 < o.y + o.h - 1;
}

function update(dt: number){
  D.legT += dt * (D.speed / 60);
  if (S.mode === 'ready') { if ((S.modeT -= dt) <= 0) S.mode = 'play'; clearFireQueued(); clearTap(); return; }
  if (S.mode === 'dying') { if ((S.modeT -= dt) <= 0) finishGame(); return; }
  if (S.mode !== 'play') return;
  const up = held.includes('up') || stickDir === 'up';
  const jump = fireQueued || tapQueued || up, holding = fireHeld || tapHeld || up;
  const duck = held.includes('down') || stickDir === 'down' || boostHeld;
  clearFireQueued(); clearTap(); clearBoostQueued();
  if (!D.air && jump && !duck) { D.vy = JUMP_V; D.air = true; D.hold = 0; tone(392, 0.07, 0.04, 420); }
  if (D.air) {
    let gr = GRAV;
    if (holding && D.vy > 0 && D.hold < HOLD_MAX) { gr = HOLD_GRAV; D.hold += dt; }
    if (duck) gr *= FAST_FALL;
    D.vy -= gr * dt; D.y += D.vy * dt;
    if (D.y <= 0) { D.y = 0; D.vy = 0; D.air = false; }
  }
  D.duck = duck && !D.air;
  // the desert speeds up as you go
  D.speed = Math.min(MAX_SPEED, BASE_SPEED + D.dist * ACCEL);
  const step = D.speed * dt;
  D.dist += step;
  S.score = Math.floor(D.dist / PX_PER_POINT);
  S.level = 1 + Math.floor(S.score / 250);
  if (S.score > best) setBest(S.score);
  if (S.score >= D.chime) { D.chime += 100; D.flash = 0.9; tone(1047, 0.05, 0.035); tone(1568, 0.08, 0.035, 0, 0.06); }
  if (D.flash > 0) D.flash -= dt;
  for (const c of D.clouds) { c.x -= step * 0.2; if (c.x < -20) { c.x = LW + rnd(10, 60); c.y = HUD + 14 + rnd(0, Math.max(10, groundY() - HUD - 70)); } }
  for (const o of D.obs) o.x -= step + o.vx * dt;
  D.obs = D.obs.filter(o => o.x + o.w > -4);
  if ((D.gap -= step) <= 0) spawn();
  if (D.obs.some(hits)) {
    D.dead = true; S.mode = 'dying'; S.modeT = 1.1;
    tone(110, 0.18, 0.06, -40); sfx.die();
  }
}

/* ---------- drawing: original pixel art built from rectangles ---------- */
const R = (x: number, y: number, w: number, h: number, role: string) => { g.fillStyle = col(role); g.fillRect(Math.round(x), Math.round(y), w, h); };

export function drawDino(bx: number, by: number, duck: boolean, frame: number, air: boolean, dead = false){
  if (duck) {   // low and long, plates flat
    const oy = by - 13;
    R(bx, oy + 5, 4, 3, 'text'); R(bx + 4, oy + 3, 15, 8, 'text');
    R(bx + 7, oy + 1, 3, 2, 'cartShade'); R(bx + 11, oy, 3, 3, 'cartShade'); R(bx + 15, oy + 1, 2, 2, 'cartShade');
    R(bx + 19, oy + 2, 8, 5, 'text'); R(bx + 24, oy + 3, 1, 1, 'bg');
    R(bx + 6, oy + 11, 3, frame ? 2 : 1, 'text'); R(bx + 13, oy + 11, 3, frame ? 1 : 2, 'text');
    return;
  }
  const oy = by - 22;
  R(bx, oy + 10, 4, 3, 'text'); R(bx + 3, oy + 9, 3, 4, 'text');               // tail
  R(bx + 5, oy + 7, 12, 9, 'text'); R(bx + 6, oy + 15, 10, 2, 'text');          // body
  R(bx + 6, oy + 4, 3, 3, 'cartShade'); R(bx + 9, oy + 2, 3, 5, 'cartShade');   // back plates
  R(bx + 12, oy + 3, 3, 4, 'cartShade'); R(bx + 15, oy + 5, 2, 2, 'cartShade');
  R(bx + 16, oy + 5, 3, 6, 'text'); R(bx + 17, oy + 1, 7, 6, 'text');           // neck and head
  R(bx + 18, oy + 11, 2, 2, 'text');                                            // arm
  if (dead) { R(bx + 20, oy + 2, 3, 3, 'bg'); R(bx + 21, oy + 3, 1, 1, 'text'); }
  else R(bx + 21, oy + 2, 1, 2, 'bg');                                          // eye
  const [a, b] = air ? [5, 5] : frame ? [6, 4] : [4, 6];
  R(bx + 7, oy + 16, 3, a, 'text'); R(bx + 13, oy + 16, 3, b, 'text');          // legs
}
export function drawCactus(x: number, gy: number, tall: boolean){
  const h = tall ? 22 : 15, top = gy - h;
  if (tall) { R(x + 3, top, 3, h, 'gem'); R(x, top + 6, 2, 6, 'gem'); R(x, top + 11, 3, 2, 'gem'); R(x + 7, top + 3, 2, 7, 'gem'); R(x + 6, top + 9, 2, 2, 'gem'); }
  else { R(x + 2, top, 3, h, 'gem'); R(x, top + 4, 1, 5, 'gem'); R(x, top + 8, 2, 1, 'gem'); R(x + 6, top + 2, 1, 6, 'gem'); R(x + 5, top + 7, 2, 1, 'gem'); }
}
function drawRock(x: number, gy: number){
  R(x + 3, gy - 8, 7, 1, 'bag'); R(x + 1, gy - 7, 11, 2, 'bag'); R(x, gy - 5, 13, 5, 'bag'); R(x + 3, gy - 6, 3, 1, 'goldHi');
}
function drawPtero(x: number, bottom: number, flap: boolean){
  const oy = bottom - 10;
  R(x + 3, oy + 5, 3, 1, 'borer'); R(x + 6, oy + 4, 8, 3, 'borer'); R(x + 14, oy + 3, 3, 3, 'borer'); R(x + 17, oy + 4, 2, 1, 'borer');
  R(x + 15, oy + 3, 1, 1, 'bg');
  if (flap) { R(x + 7, oy, 2, 4, 'borer'); R(x + 9, oy + 1, 3, 3, 'borer'); }
  else { R(x + 7, oy + 7, 2, 3, 'borer'); R(x + 9, oy + 7, 3, 2, 'borer'); }
}
function drawCloud(x: number, y: number){
  R(x + 4, y, 7, 1, 'textDim'); R(x + 2, y + 1, 2, 1, 'textDim'); R(x + 11, y + 1, 3, 1, 'textDim'); R(x, y + 2, 16, 1, 'textDim');
}
function drawGround(gy: number, off: number){
  R(0, gy, LW, 1, 'hud');
  for (let i = 0; i < 26; i++) {   // pebbles and scrub sliding past
    const span = LW + 40, px = ((i * 53.7 + (i % 3) * 17 - off) % span + span) % span - 20, py = gy + 3 + (i * 7) % 5;
    R(px, py, 1 + (i % 3), 1, i % 4 ? 'textDim' : 'hud');
  }
}
function hud(){
  g.fillStyle = col('bg'); g.fillRect(0, 0, LW, HUD);
  if (!(D.flash > 0 && Math.floor(D.flash * 8) % 2)) txt(String(S.score).padStart(6, '0'), 6, 6, 'text');
  if (LW >= 300) txt('HI ' + String(best).padStart(6, '0'), 80, 6, 'hud');
  txt('DINO RUN', LW - 6, 6, 'hud', 'right');
  g.fillStyle = col('hud'); for (let x = 0; x < LW; x += 4) g.fillRect(x, HUD - 2, 2, 1);
}
function draw(){
  const gy = groundY();
  for (const c of D.clouds) drawCloud(c.x, c.y);
  drawGround(gy, D.dist);
  for (const o of D.obs) {
    if (o.kind === 'ptero') drawPtero(o.x, gy - o.y, Math.floor(S.time * 6) % 2 === 0);
    else if (o.kind === 'rock') drawRock(o.x, gy);
    else drawCactus(o.x, gy, o.kind === 'tall');
  }
  drawDino(DX, gy - Math.round(D.y), D.duck, Math.floor(D.legT * 2) % 2, D.air, D.dead);
  hud();
  if (S.mode === 'ready') banner('DINO RUN', 'FIRE TO JUMP · BOOST TO DUCK');
}

/* themed loading screen: the dinosaur runs the length of the load, hopping the cacti on the way */
function drawLoad(p: number, t: number){
  const top = HUD + Math.max(6, Math.round((LH - HUD - 150) / 3));
  txt('DINO RUN', LW / 2, top, 'text', 'center', 16);
  txt('JUMP · DUCK · RUN', LW / 2, top + 20, 'hud', 'center');
  const x0 = 14, bw = LW - 28, gy = top + 76;
  for (const c of [0.18, 0.5, 0.78]) drawCloud(x0 + bw * c - 8, top + 38 + (c * 40) % 12);
  R(x0, gy, bw, 1, 'hud');
  const cacti = [0.3, 0.55, 0.82].map(f => x0 + bw * f);
  cacti.forEach((cx, i) => drawCactus(cx, gy, i === 1));
  const dx = x0 + p * (bw - 26);
  for (let fx = x0 + 2; fx < dx - 2; fx += 6) R(fx, gy + 3, 2, 1, 'textDim');   // footprints behind it
  let hop = 0;
  for (const cx of cacti) { const d = cx + 4 - (dx + 13); if (d > -18 && d < 18) hop = Math.max(hop, 26 * (1 - (d / 18) ** 2)); }
  drawDino(dx, gy - Math.round(hop), false, Math.floor(t * 10) % 2, hop > 0);
  diskInfo(gy + 16, p, t, dinoRun);
}

const MANUAL: GameDisk['manual'] = [
  { h: 'howH', p: 'dHow' },
  { h: 'secScore', list: [{ k: 'dr1', v: 'dr1v' }, { k: 'dr2', v: 'dr2v' }, { k: 'dr3', v: 'dr3v' }] },
  { h: 'ctlH', keys: true, list: [{ k: 'dk1', v: 'dk1v' }, { k: 'dk2', v: 'dk2v' }, { k: 'k3', v: 'k3v' }, { k: 'c3', v: 'c3v' }] },
  { h: 'aboutH', p: 'dCred' },
];

export const dinoRun: GameDisk = {
  id: 'dino', title: 'DINO RUN', nameKey: 'dName', file: 'DINORUN.COM', size: 9216, loadSecs: 1.8,
  steps: [[0, 0], [0.12, 0.18], [0.22, 0.2], [0.42, 0.52], [0.55, 0.56], [0.78, 0.9], [0.88, 0.92], [1, 1]],
  blurb: 'JUMP · DUCK · RUN', verb: 'RUN', fireKey: 'jump', boostKey: 'duck', overKey: 'dOver', againKey: 'dAgain',
  manual: MANUAL, strings, start, update, draw, drawLoad,
};
