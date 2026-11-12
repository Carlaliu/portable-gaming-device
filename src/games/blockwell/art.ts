/* Blockwell's cells. Four colours, so pieces are told apart by a hole, a bar or a solid face. */
import type { ConsoleAPI } from '../types';

const ROLE = ['text', 'gem', 'gold', 'cart', 'dirt', 'spark', 'hud'] as const;

export function drawCell(api: ConsoleAPI, x: number, y: number, size: number, kind: number) {
  const g = api.g;
  const role = ROLE[kind] ?? 'text';
  g.fillStyle = api.col(role);
  g.fillRect(x, y, size, size);
  g.fillStyle = api.col('bg');
  g.fillRect(x, y, size, 1);
  if (kind === 1 || kind === 5) g.fillRect(x + 2, y + 2, Math.max(1, size - 4), Math.max(1, size - 4));
  else if (kind === 6) g.fillRect(x + 1, y + Math.floor(size / 2), size - 2, 1);
}
