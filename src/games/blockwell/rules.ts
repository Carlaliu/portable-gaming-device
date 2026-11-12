/* Blockwell's well: seven pieces, a ten-wide pile, and rows that clear.
   The shapes, the turns and the kicks are written here. Nothing is taken from another game's code. */

export type Pt = { x: number; y: number };

/** Cells of each piece in a 4×4 box, before it turns. 0 I, 1 O, 2 T, 3 J, 4 L, 5 S, 6 Z. */
const MINO: Pt[][] = [
  [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
  [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
];

export const KINDS = MINO.length;
export const COLS = 10;

/** A quarter-turn that failed can try these shifts, in order, before it is refused. */
export const KICKS: Pt[] = [
  { x: 0, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 2, y: 0 },
  { x: 0, y: -1 }, { x: -1, y: -1 }, { x: 1, y: -1 },
];

const LINE_SCORE = [0, 100, 300, 500, 800];

function spin(p: Pt, times: number): Pt {
  let x = p.x, y = p.y;
  for (let i = 0; i < times; i++) { const nx = 3 - y; y = x; x = nx; }
  return { x, y };
}

/** The square does not turn. Every other piece turns inside its 4×4 box. */
export function turned(kind: number, rot: number, dir: 1 | -1 = 1) {
  if (kind === 1) return 0;
  return (rot + dir + 4) & 3;
}

export function blocks(kind: number, rot: number): Pt[] {
  const n = kind === 1 ? 0 : ((rot % 4) + 4) % 4;
  return MINO[kind].map(p => spin(p, n));
}

/** True when a cell sits outside the well, or on a block already in it. Cells above the rim are free. */
export function hits(grid: Uint8Array, cols: number, rows: number, cells: Pt[], x: number, y: number) {
  for (const c of cells) {
    const cx = x + c.x, cy = y + c.y;
    if (cx < 0 || cx >= cols || cy >= rows) return true;
    if (cy >= 0 && grid[cy * cols + cx] !== 0) return true;
  }
  return false;
}

/** Write a piece into the well. `value` is the kind plus one, so an empty cell stays 0. */
export function place(grid: Uint8Array, cols: number, cells: Pt[], x: number, y: number, value: number) {
  for (const c of cells) {
    const cy = y + c.y;
    if (cy >= 0) grid[cy * cols + (x + c.x)] = value;
  }
}

/** Drop full rows out of the well. Returns how many went. */
export function clearLines(grid: Uint8Array, cols: number, rows: number) {
  let n = 0;
  for (let y = rows - 1; y >= 0; y--) {
    let full = true;
    for (let x = 0; x < cols; x++) if (grid[y * cols + x] === 0) { full = false; break; }
    if (!full) continue;
    grid.copyWithin(cols, 0, y * cols);
    grid.fill(0, 0, cols);
    n++;
    y++;
  }
  return n;
}

/** Points for clearing `n` rows at this level. Level 1 is the first. */
export function lineScore(n: number, level: number) {
  return (LINE_SCORE[n] ?? 0) * Math.max(1, level);
}

/** Seconds between automatic drops. Level 1 is the slowest. */
export function dropInterval(level: number) {
  return Math.max(0.05, 0.8 * Math.pow(0.82, Math.max(0, level - 1)));
}

/** One of each piece, in a random order. */
export function shuffleBag(rnd: () => number) {
  const bag = Array.from({ length: KINDS }, (_, i) => i);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const swap = bag[i]; bag[i] = bag[j]; bag[j] = swap;
  }
  return bag;
}

/** The first kick that lands, or null when the turn does not fit. */
export function fitTurn(grid: Uint8Array, cols: number, rows: number, kind: number, rot: number, x: number, y: number) {
  const cells = blocks(kind, rot);
  for (const k of KICKS) {
    if (!hits(grid, cols, rows, cells, x + k.x, y + k.y)) return { x: x + k.x, y: y + k.y, rot };
  }
  return null;
}
