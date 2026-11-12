import { describe, expect, it } from 'vitest';
import {
  COLS, KINDS, blocks, clearLines, dropInterval, fitTurn, hits, lineScore, place, shuffleBag, turned,
} from '../../src/games/blockwell/rules';

const well = (rows = 8) => new Uint8Array(COLS * rows);

describe('Blockwell pieces', () => {
  it('keeps the square still and stands the bar on its end', () => {
    const square = blocks(1, 0).map(p => `${p.x},${p.y}`).sort();
    expect(blocks(1, 2).map(p => `${p.x},${p.y}`).sort()).toEqual(square);
    const stood = blocks(0, 1);
    expect(new Set(stood.map(p => p.x)).size).toBe(1);
    expect(new Set(stood.map(p => p.y)).size).toBe(4);
    expect(turned(1, 0, 1)).toBe(0);
    expect(turned(0, 0, 1)).toBe(1);
    expect(turned(0, 0, -1)).toBe(3);
  });

  it('deals a bag with one of each piece', () => {
    let n = 0;
    const rnd = () => { n += 0.37; return n % 1; };
    const bag = shuffleBag(rnd);
    expect(bag.slice().sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(KINDS).toBe(7);
  });

  it('refuses a piece in the wall and allows one above the rim', () => {
    const grid = well();
    const bar = blocks(0, 0);
    expect(hits(grid, COLS, 8, bar, -1, 0)).toBe(true);
    expect(hits(grid, COLS, 8, bar, 8, 0)).toBe(true);
    expect(hits(grid, COLS, 8, bar, 3, -1)).toBe(false);
    place(grid, COLS, bar, 3, 6, 1);
    expect(hits(grid, COLS, 8, bar, 3, 6)).toBe(true);
  });

  it('clears a full row and lets the pile fall', () => {
    const rows = 4;
    const grid = well(rows);
    for (let x = 0; x < COLS; x++) grid[3 * COLS + x] = 1;
    grid[2 * COLS + 4] = 2;
    expect(clearLines(grid, COLS, rows)).toBe(1);
    expect(grid[3 * COLS + 4]).toBe(2);
    expect(grid[2 * COLS + 4]).toBe(0);
  });

  it('scores a four-row clear above a single row, and speeds up', () => {
    expect(lineScore(1, 1)).toBe(100);
    expect(lineScore(4, 1)).toBe(800);
    expect(lineScore(2, 3)).toBe(900);
    expect(dropInterval(1)).toBeGreaterThan(dropInterval(5));
    expect(dropInterval(40)).toBe(0.05);
  });

  it('kicks a turn off the right wall', () => {
    const grid = well();
    const stood = fitTurn(grid, COLS, 8, 0, 1, 8, 4);
    expect(stood).not.toBeNull();
    expect(hits(grid, COLS, 8, blocks(0, stood!.rot), stood!.x, stood!.y)).toBe(false);
  });
});
