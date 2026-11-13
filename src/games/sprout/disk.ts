/* Sprout's disk: its label, loading screen and instructions. */
import type { ConsoleAPI, GameDisk } from '../types';
import { drawNook, drawSprout, idlePose, useApi } from './art';
import { strings } from './strings';

function drawPet(a: ConsoleAPI, x: number, y: number, w: number, h: number, t: number) {
  useApi(a);
  const foot = y + h - 8;
  if (w >= 70 && h >= 56) drawNook(x, y, w, foot - y + 2);
  const hop = Math.abs(Math.sin(t * 3)) * 3;
  drawSprout(x + w / 2, foot, idlePose(hop, t));
}

/* Themed loading screen: Sprout bobs in its pot while the drive reads. */
function drawLoad(a: ConsoleAPI, p: number, t: number) {
  const { LW, LH, HUD, txt } = a;
  const titleY = HUD + 2;
  txt('SPROUT', LW / 2, titleY, 'text', 'center', 16);
  const infoY = LH - 58;
  if (infoY - titleY > 78) txt('FEED · PLAY · WASH', LW / 2, titleY + 18, 'hud', 'center');
  const top = HUD;
  drawPet(a, 0, top, LW, Math.max(40, infoY - top - 4), t);
  a.diskInfo(infoY, p, t, disk);
}

/** Hand-drawn launcher card, so the carousel shows Sprout on every phosphor. */
function drawCover(a: ConsoleAPI, x: number, y: number, w: number, h: number, t: number) {
  a.g.save();
  a.g.beginPath();
  a.g.rect(x, y, w, h);
  a.g.clip();
  a.g.fillStyle = a.col('bg');
  a.g.fillRect(x, y, w, h);
  drawPet(a, x, y, w, h, t);
  a.g.restore();
}

const MANUAL: GameDisk['manual'] = [
  { h: 'howH', p: 'spHow' },
  { h: 'ctlH', keys: true, list: [{ k: 'spKFeed', v: 'spKFeedV' }, { k: 'spKPlay', v: 'spKPlayV' }, { k: 'spKWash', v: 'spKWashV' }] },
  { h: 'secScore', list: [{ k: 'spSCare', v: 'spSCareV' }, { k: 'spSKeep', v: 'spSKeepV' }] },
  { h: 'spNeedsH', p: 'spNeeds' },
  { h: 'aboutH', p: 'spAbout' },
];

export const disk: GameDisk = {
  contract: 1, version: 1, rating: '4+',
  id: 'sprout', order: 7, slug: 'sprout', genre: 'PET', players: 1,
  page: {
    title: 'Sprout',
    description: 'Look after Sprout, a pocket desk pet, on the PGD-01 Portable Gaming Device. Feed it, play with it and wash it. It grows hungry, bored and dusty while you play and while the set is switched off, and it remembers you the next time you visit.',
  },
  title: 'SPROUT', nameKey: 'spName', file: 'SPROUT.COM', size: 7680, loadSecs: 1.5,
  steps: [[0, 0], [0.16, 0.06], [0.28, 0.34], [0.4, 0.38], [0.62, 0.7], [0.78, 0.74], [0.9, 0.92], [1, 1]],
  blurb: 'FEED · PLAY · WASH', verb: 'VISIT',
  buttons: { fire: { label: 'spFeed' }, boost: { label: 'spWash' } },
  overKey: 'spOver', againKey: 'spAgain',
  manual: MANUAL, strings, drawLoad, drawCover,
};
