import { describe, it, expect, vi } from 'vitest';

// The disks import the console only inside functions, so their metadata can be checked on its own.
vi.mock('../../src/console/core', () => ({}));
vi.mock('../../src/console/loader', () => ({ diskInfo: () => 0 }));
vi.mock('../../src/games/tunnel-raider/game', () => ({ genLevel() {}, update() {}, draw() {}, makeDirt() {}, killPlayer() {} }));

const { GAMES } = await import('../../src/games');

describe('game disks', () => {
  it('has unique ids', () => {
    expect(new Set(GAMES.map(d => d.id)).size).toBe(GAMES.length);
  });
  it.each(GAMES.map(d => [d.id, d] as const))('%s loads within five seconds', (_id, d) => {
    expect(d.loadSecs).toBeGreaterThan(0);
    expect(d.loadSecs).toBeLessThanOrEqual(5);
  });
  it('load times differ between games', () => {
    expect(new Set(GAMES.map(d => d.loadSecs)).size).toBe(GAMES.length);
  });
  it.each(GAMES.map(d => [d.id, d] as const))('%s has a load curve from 0 to 1 that never goes backwards', (_id, d) => {
    expect(d.steps[0]).toEqual([0, 0]);
    expect(d.steps[d.steps.length - 1]).toEqual([1, 1]);
    for (let i = 1; i < d.steps.length; i++) {
      expect(d.steps[i][0]).toBeGreaterThan(d.steps[i - 1][0]);
      expect(d.steps[i][1]).toBeGreaterThanOrEqual(d.steps[i - 1][1]);
    }
  });
  it.each(GAMES.map(d => [d.id, d] as const))('%s has instructions in all three languages', (_id, d) => {
    expect(d.manual.length).toBeGreaterThan(0);
    for (const l of ['en', 'zh-hant', 'zh-hans'] as const) expect(d.strings?.[l]?.[d.nameKey]).toBeTruthy();
  });
});
