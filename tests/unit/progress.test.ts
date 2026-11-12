/* Per-disk progress and the host clock. Scores stay on their own keys. Disks still cannot touch Date or localStorage. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { bindHost, type ConsoleHost } from '../../src/console/program/host';
import type { Platform, PlatformStore } from '../../src/console/program/platform';
import { scores, loadScores, saveBest, readBest, forgetScores } from '../../src/console/program/scores';
import { SAVE_LIMIT, clearSave, loadSave, now, saveKey, saveProgress } from '../../src/console/program/progress';
import { encodeSave, utf8Bytes } from '../../src/console/program/save-json.mjs';
import { makeWebPlatform, webStore } from '../../src/console/web/platform';
import { isScoreKey } from '../../src/console/settings';
import { contractViolations } from './kit/contract-check';
import { fakeApi } from './kit/fake-api';

afterEach(() => { vi.unstubAllGlobals(); });

function memoryStore() {
  const stored: Record<string, string> = {};
  const store: PlatformStore = {
    get: k => stored[k] ?? null,
    set: (k, v) => { stored[k] = v; },
    remove: k => { delete stored[k]; },
    keys: () => Object.keys(stored),
  };
  return { stored, store };
}

function bind(store: PlatformStore, unix: () => number) {
  bindHost({
    platform: { unix, store } as Platform,
    S: {},
  } as unknown as ConsoleHost);
}

describe('disk progress', () => {
  it('saves a JSON value and loads the same value back', () => {
    const { stored, store } = memoryStore();
    bind(store, () => 1_700_000_000);
    loadScores('pet');
    const data = { hunger: 0.25, name: 'PIP', fedAt: 1_700_000_000, flags: [true, false], note: null };
    expect(saveProgress(data)).toBe(true);
    expect(loadSave()).toEqual(data);
    expect(stored[saveKey('pet')]).toBe(JSON.stringify(data));
    expect(saveProgress([1, 'a', false, null])).toBe(true);
    expect(loadSave()).toEqual([1, 'a', false, null]);
    expect(saveProgress('seed')).toBe(true);
    expect(loadSave()).toBe('seed');
    expect(saveProgress(3)).toBe(true);
    expect(loadSave()).toBe(3);
    expect(saveProgress(false)).toBe(true);
    expect(loadSave()).toBe(false);
  });

  it('keeps each disk\'s progress apart', () => {
    const { store } = memoryStore();
    bind(store, () => 1_700_000_000);
    loadScores('pet');
    expect(saveProgress({ who: 'pet' })).toBe(true);
    loadScores('dino');
    expect(loadSave()).toBeNull();
    expect(saveProgress({ who: 'dino' })).toBe(true);
    loadScores('pet');
    expect(loadSave()).toEqual({ who: 'pet' });
    clearSave();
    expect(loadSave()).toBeNull();
    loadScores('dino');
    expect(loadSave()).toEqual({ who: 'dino' });
  });

  it('clears only the progress slot', () => {
    const { stored, store } = memoryStore();
    bind(store, () => 1_700_000_000);
    stored['gg-best-pet'] = '40';
    stored['gg-board-pet'] = JSON.stringify([{ n: 'PIP', s: 40, l: 2 }]);
    forgetScores();
    loadScores('pet');
    expect(scores.best).toBe(40);
    expect(saveProgress({ hunger: 2 })).toBe(true);
    clearSave();
    expect(loadSave()).toBeNull();
    expect(stored[saveKey('pet')]).toBeUndefined();
    expect(stored['gg-best-pet']).toBe('40');
    expect(stored['gg-board-pet']).toContain('PIP');
    expect(scores.best).toBe(40);
    expect(readBest('pet')).toBe(40);
  });

  it('leaves the best and the table alone when progress is written', () => {
    const { stored, store } = memoryStore();
    bind(store, () => 1_700_000_000);
    stored['gg-best-pet'] = '40';
    stored['gg-board-pet'] = JSON.stringify([{ n: 'PIP', s: 40, l: 2 }]);
    forgetScores();
    loadScores('pet');
    expect(scores.best).toBe(40);
    expect(saveProgress({ hunger: 1 })).toBe(true);
    expect(stored['gg-best-pet']).toBe('40');
    expect(JSON.parse(stored['gg-board-pet'])).toEqual([{ n: 'PIP', s: 40, l: 2 }]);
    scores.best = 55;
    saveBest();
    expect(stored['gg-best-pet']).toBe('55');
    expect(loadSave()).toEqual({ hunger: 1 });
    expect(isScoreKey(saveKey('pet'))).toBe(false);
    expect(isScoreKey('gg-best-pet')).toBe(true);
    expect(isScoreKey('gg-board-pet')).toBe(true);
  });

  it('reads missing, broken and oversized text as null and does not throw', () => {
    const { stored, store } = memoryStore();
    bind(store, () => 1_700_000_000);
    loadScores('pet');
    expect(loadSave()).toBeNull();
    for (const raw of ['{', 'not json', '', '[] trailing', '{"a":']) {
      stored[saveKey('pet')] = raw;
      expect(() => loadSave()).not.toThrow();
      expect(loadSave()).toBeNull();
    }
    stored[saveKey('pet')] = '"' + 'a'.repeat(SAVE_LIMIT) + '"';
    expect(loadSave()).toBeNull();
    stored[saveKey('pet')] = '{"__proto__":{"polluted":true},"hunger":1}';
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    expect(loadSave()).toMatchObject({ hunger: 1 });
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it('refuses a value that is not plain JSON and keeps the previous save', () => {
    const { store } = memoryStore();
    bind(store, () => 1_700_000_000);
    loadScores('pet');
    expect(saveProgress({ hunger: 1 })).toBe(true);
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    const hole = [1, , 2];
    class Pet {}
    for (const bad of [undefined, cycle, new Date(), () => 1, 1n, NaN, Infinity, { n: NaN }, { gone: undefined }, new Pet(), hole]) {
      expect(() => saveProgress(bad)).not.toThrow();
      expect(saveProgress(bad)).toBe(false);
      expect(loadSave()).toEqual({ hunger: 1 });
    }
  });

  it('enforces the byte cap and keeps the previous save when a value is too big', () => {
    const { store } = memoryStore();
    bind(store, () => 1_700_000_000);
    loadScores('pet');
    const fit = 'a'.repeat(SAVE_LIMIT - 2);
    expect(utf8Bytes(JSON.stringify(fit))).toBe(SAVE_LIMIT);
    expect(saveProgress(fit)).toBe(true);
    expect(loadSave()).toBe(fit);
    expect(saveProgress('a'.repeat(SAVE_LIMIT - 1))).toBe(false);
    expect(loadSave()).toBe(fit);

    const mark = '你';
    expect(utf8Bytes(mark)).toBe(3);
    expect(new TextEncoder().encode(mark).length).toBe(3);
    const count = Math.floor((SAVE_LIMIT - 2) / 3);
    expect(encodeSave(mark.repeat(count))).not.toBeNull();
    expect(encodeSave(mark.repeat(count + 1))).toBeNull();
    expect(saveProgress(mark.repeat(count + 1))).toBe(false);
    expect(loadSave()).toBe(fit);
  });

  it('does nothing when no disk is loaded, and survives a store that throws', () => {
    const { store } = memoryStore();
    bind(store, () => 1_700_000_000);
    scores.id = '';
    expect(saveProgress({ a: 1 })).toBe(false);
    expect(loadSave()).toBeNull();
    expect(() => clearSave()).not.toThrow();

    loadScores('pet');
    store.set = () => { throw new Error('full'); };
    expect(saveProgress({ a: 1 })).toBe(false);
    expect(loadSave()).toBeNull();
    store.get = () => { throw new Error('denied'); };
    expect(loadSave()).toBeNull();
    store.remove = () => { throw new Error('locked'); };
    expect(() => clearSave()).not.toThrow();
  });

  it('reads a finite host clock that can measure time away', () => {
    let wall = 1_700_000_100.5;
    const { store } = memoryStore();
    bind(store, () => wall);
    loadScores('pet');
    const t0 = now();
    expect(Number.isFinite(t0)).toBe(true);
    expect(now()).toBe(t0);
    expect(saveProgress({ fedAt: t0 })).toBe(true);
    wall = t0 + 90.25;
    const saved = loadSave() as { fedAt: number };
    expect(now() - saved.fedAt).toBeCloseTo(90.25);

    bind(store, () => Number.POSITIVE_INFINITY);
    expect(now()).toBe(0);
    bind(store, () => { throw new Error('no clock'); });
    expect(now()).toBe(0);
  });
});

describe('progress on each host', () => {
  it('round-trips through the web store, and the web clock moves forward', () => {
    const bag = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => bag.get(k) ?? null,
      setItem: (k: string, v: string) => { bag.set(k, String(v)); },
      removeItem: (k: string) => { bag.delete(k); },
    });
    bind(webStore, () => 1_700_000_000);
    loadScores('pet');
    expect(saveProgress({ tum: 1 })).toBe(true);
    expect(bag.get('gg-save-pet')).toBe(JSON.stringify({ tum: 1 }));
    expect(loadSave()).toEqual({ tum: 1 });
    expect(bag.has('gg-best-pet')).toBe(false);
    clearSave();
    expect(bag.has('gg-save-pet')).toBe(false);
    expect(loadSave()).toBeNull();

    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
      removeItem: () => { throw new Error('denied'); },
    });
    expect(saveProgress({ tum: 2 })).toBe(true);
    expect(loadSave()).toBeNull();
    expect(() => clearSave()).not.toThrow();

    vi.stubGlobal('location', { search: '' });
    const platform = makeWebPlatform({
      track() {}, layoutName: () => 'desk', reducedMotion: false,
      overlay: {} as HTMLElement, showOverCard() {},
    });
    const t0 = platform.unix();
    expect(Number.isFinite(t0)).toBe(true);
    expect(t0).toBeGreaterThan(1_700_000_000);
    expect(platform.unix()).toBeGreaterThanOrEqual(t0);
    expect(platform.now()).not.toBe(platform.unix());
  });

  it('saves inside the headless host without writing the clock into the stream', () => {
    const root = fileURLToPath(new URL('../..', import.meta.url));
    const result = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { makeHost, parseScript } from './tools/conformance/host.mjs';
      import { SAVE_LIMIT } from './src/console/program/save-json.mjs';
      const palette = { pal: ['#000000', '#111111', '#222222', '#333333'], roles: { bg: 0 } };
      const { api, step, takeCommands } = makeHost({
        disk: { id: 'pet', buttons: {} },
        script: parseScript({ frames: 2 }),
        palette,
        measurePixelText: () => ({ width: 0 }),
      });
      if (api.g.save === api.saveProgress) throw new Error('g.save collided with saveProgress');
      api.g.save(); api.g.restore();
      const t0 = api.now();
      if (t0 !== 1700000000) throw new Error('epoch ' + t0);
      if (api.loadSave() !== null) throw new Error('empty load');
      if (!api.saveProgress({ fedAt: t0 })) throw new Error('save failed');
      if (api.loadSave().fedAt !== t0) throw new Error('round trip');
      if (api.saveProgress('a'.repeat(SAVE_LIMIT))) throw new Error('cap not enforced');
      if (api.loadSave().fedAt !== t0) throw new Error('cap wiped the save');
      const cycle = {}; cycle.self = cycle;
      if (api.saveProgress(cycle)) throw new Error('cycle accepted');
      api.clearSave();
      if (api.loadSave() !== null) throw new Error('clear failed');
      step({ update() {}, draw() {} });
      const gap = api.now() - t0;
      if (Math.abs(gap - 1 / 60) > 1e-6) throw new Error('clock ' + gap);
      const names = takeCommands().map(command => command[0]);
      for (const name of ['saveProgress', 'loadSave', 'now']) if (names.includes(name)) throw new Error('recorded ' + name);
      process.stdout.write('ok');
    `], { cwd: root, encoding: 'utf8' });
    expect(result).toBe('ok');
  });

  it('offers the same slot on the kit\'s stand-in API', () => {
    const f = fakeApi();
    expect(f.api.loadSave()).toBeNull();
    expect(f.api.saveProgress({ a: 1 })).toBe(true);
    expect(f.api.loadSave()).toEqual({ a: 1 });
    expect(f.api.saveProgress(undefined)).toBe(false);
    expect(f.api.loadSave()).toEqual({ a: 1 });
    f.api.clearSave();
    expect(f.api.loadSave()).toBeNull();
    const t0 = f.api.now();
    expect(Number.isFinite(t0)).toBe(true);
    expect(f.api.now()).toBe(t0);
  });

  it('still rejects Date and localStorage in disk code', () => {
    const root = fileURLToPath(new URL('../..', import.meta.url));
    const fileName = fileURLToPath(new URL('./kit/progress-ban.ts', import.meta.url));
    const text = 'import type { ConsoleAPI } from \'../../../src/games/types\';\ndeclare const api: ConsoleAPI;\nvoid Date;\nvoid localStorage;\napi.now();\napi.loadSave();\nexport {};\n';
    const config = ts.readConfigFile(fileURLToPath(new URL('../../tsconfig.json', import.meta.url)), ts.sys.readFile);
    const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const compiler = ts.createCompilerHost(options);
    const read = compiler.readFile.bind(compiler), exists = compiler.fileExists.bind(compiler);
    compiler.readFile = path => path === fileName ? text : read(path);
    compiler.fileExists = path => path === fileName || exists(path);
    const program = ts.createProgram([fileName], options, compiler);
    const source = program.getSourceFile(fileName);
    expect(source).toBeTruthy();
    const failures = contractViolations(source!, program.getTypeChecker()).join('\n');
    expect(failures).toContain('banned global Date');
    expect(failures).toContain('banned global localStorage');
    expect(failures).not.toContain('now');
    expect(failures).not.toContain('loadSave');
  });

  it('documents the cap and the calls in the developer guide', () => {
    const guide = readFileSync(fileURLToPath(new URL('../../docs/developer-guide.md', import.meta.url)), 'utf8');
    expect(guide).toContain('`loadSave()`');
    expect(guide).toContain('`saveProgress(data)`');
    expect(guide).toContain('`clearSave()`');
    expect(guide).toContain('`now()`');
    expect(guide).toContain('gg-save-<id>');
    expect(guide).toContain(String(SAVE_LIMIT));
    expect(SAVE_LIMIT).toBe(4096);
  });
});
