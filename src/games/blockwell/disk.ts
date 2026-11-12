/* Blockwell's disk: the label, the loading screen and the instructions. */
import type { ConsoleAPI, GameDisk } from '../types';
import { strings } from './strings';

function drawLoad(a: ConsoleAPI, p: number, t: number) {
  const { g, LW, LH, HUD, txt } = a;
  const top = HUD + Math.max(8, Math.round((LH - HUD - 120) / 3));
  txt('BLOCKWELL', LW / 2, top, 'text', 'center', 16);
  txt('DROP · TURN · CLEAR', LW / 2, top + 20, 'hud', 'center');
  const cell = 8, cols = 10, rows = 6;
  const x0 = Math.round(LW / 2 - (cols * cell) / 2), y0 = top + 36;
  g.fillStyle = a.col('hud');
  g.fillRect(x0 - 2, y0, 2, rows * cell);
  g.fillRect(x0 + cols * cell, y0, 2, rows * cell);
  g.fillRect(x0 - 2, y0 + rows * cell, cols * cell + 4, 2);
  const filled = Math.round(p * rows * cols * 0.45);
  for (let i = 0; i < filled; i++) {
    const c = i % cols, r = rows - 1 - Math.floor(i / cols);
    g.fillStyle = a.col(i % 3 === 0 ? 'gem' : i % 3 === 1 ? 'gold' : 'text');
    const x = x0 + c * cell, y = y0 + r * cell;
    g.fillRect(x + 1, y + 1, cell - 2, cell - 2);
  }
  const bob = Math.round(Math.sin(t * 3) * 4);
  g.fillStyle = a.col('spark');
  g.fillRect(x0 + 3 * cell + 1, y0 - 14 + bob, cell - 2, cell - 2);
  g.fillRect(x0 + 4 * cell + 1, y0 - 14 + bob, cell - 2, cell - 2);
  g.fillRect(x0 + 5 * cell + 1, y0 - 14 + bob, cell - 2, cell - 2);
  g.fillRect(x0 + 4 * cell + 1, y0 - 14 - cell + bob, cell - 2, cell - 2);
  a.diskInfo(y0 + rows * cell + 10, p, t, disk);
}

const MANUAL: GameDisk['manual'] = [
  { h: 'howH', p: 'bwHow' },
  { h: 'secScore', list: [
    { k: 'bwS1', v: 'bwS1v' }, { k: 'bwS2', v: 'bwS2v' }, { k: 'bwS3', v: 'bwS3v' },
    { k: 'bwS4', v: 'bwS4v' }, { k: 'bwS5', v: 'bwS5v' }, { k: 'bwS6', v: 'bwS6v' },
  ] },
  { h: 'ctlH', keys: true, list: [
    { k: 'bwK1', v: 'bwK1v' }, { k: 'bwK2', v: 'bwK2v' }, { k: 'bwK3', v: 'bwK3v' }, { k: 'bwK4', v: 'bwK4v' },
    { k: 'k3', v: 'k3v' }, { k: 'c3', v: 'c3v' },
  ] },
  { h: 'aboutH', p: 'bwCred' },
];

export const disk: GameDisk = {
  contract: 1, version: 1, rating: '4+',
  id: 'well', order: 7, slug: 'blockwell', genre: 'PUZZLE', players: 1,
  page: {
    title: 'Blockwell',
    description: 'Drop blocks into a ten-wide well, turn them, and clear full rows before the pile reaches the top, on the PGD-01 Portable Gaming Device: a 1983-style console in your browser.',
  },
  title: 'BLOCKWELL', nameKey: 'bwName', file: 'WELL.COM', size: 12288, loadSecs: 1.5,
  steps: [[0, 0], [0.12, 0.05], [0.28, 0.22], [0.4, 0.24], [0.55, 0.5], [0.7, 0.58], [0.84, 0.86], [1, 1]],
  blurb: 'DROP · TURN · CLEAR', verb: 'DROP', tap: true,
  buttons: { fire: { label: 'bwTurn' }, boost: { label: 'bwDrop' } },
  overKey: 'bwOver', againKey: 'bwAgain',
  manual: MANUAL, strings, drawLoad,
};
