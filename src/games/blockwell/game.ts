/* Blockwell: one well, one falling block, rows that clear. */
import type { ConsoleAPI, CreateGame } from '../types';
import { drawHud } from '../../kit/play';
import { drawCell } from './art';
import {
  COLS, blocks, clearLines, dropInterval, fitTurn, hits, lineScore, place, shuffleBag,
} from './rules';
import type { Pt } from './rules';

let api: ConsoleAPI;
let rows = 16;
let cell = 8;
let ox = 0;
let oy = 0;
let grid = new Uint8Array(0);
let bag: number[] = [];
let kind = 0;
let rot = 0;
let px = 3;
let py = 0;
let next = 0;
let fall = 0;
let lock = 0;
let lines = 0;
let over = false;
let left = { v: false, t: 0 };
let right = { v: false, t: 0 };
let upWas = false;

function layout() {
  const side = 36;
  const roomW = api.LW - side - 12;
  const roomH = api.LH - api.HUD - 8;
  cell = Math.max(4, Math.min(12, Math.floor(roomW / COLS), Math.floor(roomH / 14)));
  rows = Math.max(14, Math.min(20, Math.floor(roomH / cell)));
  const wellW = COLS * cell;
  ox = Math.max(2, Math.round((api.LW - wellW - side) / 2));
  oy = api.LH - 4 - rows * cell;
  grid = new Uint8Array(COLS * rows);
}

function take() {
  if (!bag.length) bag = shuffleBag(Math.random);
  return bag.shift() ?? 0;
}

function cells() {
  return blocks(kind, rot);
}

function blocked(cells: Pt[], x: number, y: number) {
  return hits(grid, COLS, rows, cells, x, y);
}

function spawn() {
  kind = next;
  rot = 0;
  px = 3;
  py = -1;
  fall = 0;
  lock = 0;
  next = take();
  if (blocked(cells(), px, py)) end();
}

function noteBest() {
  if (api.S.score > api.best) api.best = api.S.score;
}

function end() {
  if (over) return;
  over = true;
  api.S.mode = 'dying';
  api.S.modeT = 0.9;
  api.tone(120, 0.28, 0.06, -50);
  api.buzz('lose');
}

function settle() {
  place(grid, COLS, cells(), px, py, kind + 1);
  const n = clearLines(grid, COLS, rows);
  if (n) {
    lines += n;
    api.S.score += lineScore(n, api.S.level);
    api.S.level = 1 + Math.floor(lines / 10);
    api.tone(n >= 4 ? 880 : 520, 0.08, 0.05);
    api.buzz('pickup');
  } else api.tone(180, 0.04, 0.04);
  noteBest();
  spawn();
}

function tryShift(dx: number, dy: number) {
  if (blocked(cells(), px + dx, py + dy)) return false;
  px += dx;
  py += dy;
  return true;
}

function turn() {
  const fit = fitTurn(grid, COLS, rows, kind, (rot + 1) & 3, px, py);
  if (!fit) return;
  rot = fit.rot;
  px = fit.x;
  py = fit.y;
  lock = 0;
  api.tone(640, 0.03, 0.035);
}

function hard() {
  let n = 0;
  while (tryShift(0, 1)) n++;
  api.S.score += n * 2;
  noteBest();
  api.tone(240, 0.05, 0.05, -80);
  settle();
}

function nudge(now: boolean, held: { v: boolean; t: number }, dir: number, dt: number) {
  if (!now) { held.v = false; held.t = 0; return; }
  if (!held.v) { if (tryShift(dir, 0)) lock = 0; held.v = true; held.t = 0; return; }
  held.t += dt;
  if (held.t >= 0.09) { if (tryShift(dir, 0)) lock = 0; held.t = 0; }
}

function holding(name: 'left' | 'right' | 'down' | 'up') {
  return api.held.includes(name) || api.stickDir === name;
}

function paint(cells: Pt[], x: number, y: number, kind: number, ghost = false) {
  for (const c of cells) {
    const cy = y + c.y;
    if (cy < 0) continue;
    const px0 = ox + (x + c.x) * cell;
    const py0 = oy + cy * cell;
    if (ghost) {
      api.g.fillStyle = api.col('textDim');
      api.g.fillRect(px0 + 1, py0 + 1, cell - 2, 1);
      api.g.fillRect(px0 + 1, py0 + cell - 2, cell - 2, 1);
    } else drawCell(api, px0, py0, cell, kind);
  }
}

function ghostY() {
  let y = py;
  while (!blocked(cells(), px, y + 1)) y++;
  return y;
}

const create: CreateGame = a => {
  api = a;
  return {
    start() {
      api.fitGrid();
      api.S.score = 0;
      api.S.level = 1;
      api.S.lives = 1;
      lines = 0;
      over = false;
      left = { v: false, t: 0 };
      right = { v: false, t: 0 };
      upWas = false;
      bag = [];
      layout();
      next = take();
      spawn();
    },
    update(dt) {
      if (api.S.mode === 'ready') {
        if ((api.S.modeT -= dt) <= 0) api.S.mode = 'play';
        api.clearFire(); api.clearBoost(); api.clearTap();
        return;
      }
      if (api.S.mode === 'dying') {
        if ((api.S.modeT -= dt) <= 0) api.finishGame();
        return;
      }
      if (api.S.mode !== 'play' || over) return;
      const up = holding('up');
      nudge(holding('left') && !holding('right'), left, -1, dt);
      nudge(holding('right') && !holding('left'), right, 1, dt);
      if (api.fireQueued || api.tapQueued || (up && !upWas)) turn();
      upWas = up;
      api.clearFire();
      api.clearTap();
      if (api.boostQueued) { api.clearBoost(); hard(); return; }
      const step = holding('down') ? 0.04 : dropInterval(api.S.level);
      fall += dt;
      while (fall >= step && !over) {
        fall -= step;
        if (tryShift(0, 1)) {
          lock = 0;
          if (holding('down')) { api.S.score += 1; noteBest(); }
        } else {
          lock += step;
          if (lock >= 0.5) { settle(); break; }
        }
      }
    },
    draw() {
      drawHud(api, { right: 'LV ' + api.S.level });
      const g = api.g;
      g.fillStyle = api.col('hud');
      g.fillRect(ox - 2, oy, 2, rows * cell);
      g.fillRect(ox + COLS * cell, oy, 2, rows * cell);
      g.fillRect(ox - 2, oy + rows * cell, COLS * cell + 4, 2);
      for (let y = 0; y < rows; y++) for (let x = 0; x < COLS; x++) {
        const v = grid[y * COLS + x];
        if (v) drawCell(api, ox + x * cell, oy + y * cell, cell, v - 1);
      }
      if (!over) {
        const gy = ghostY();
        if (gy !== py) paint(cells(), px, gy, kind, true);
        paint(cells(), px, py, kind);
      }
      const nx = ox + COLS * cell + 8, ny = oy + 8;
      api.txt('NEXT', nx, ny, 'hud');
      paintAt(blocks(next, 0), nx, ny + 12, next);
      if (api.S.mode === 'ready') api.banner('BLOCKWELL', 'TURN WITH FIRE');
      if (api.S.mode === 'dying') api.banner('WELL FULL', '');
    },
    debug: {
      state: () => ({ kind, rot, x: px, y: py, lines, rows, over, next }),
    },
  };

  function paintAt(cells: Pt[], x: number, y: number, k: number) {
    const s = Math.max(3, Math.min(6, cell - 2));
    for (const c of cells) drawCell(api, x + c.x * s, y + c.y * s, s, k);
  }
};

export default create;
