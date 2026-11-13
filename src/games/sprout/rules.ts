/* Sprout's needs, with no console and no drawing.

   Hunger, boredom and dust move while the game is running (frame time) and while the set is
   off (the gap between a stamped device-clock reading and a later one). A clock that has
   gone backwards contributes nothing. The game stores one plain JSON object through the
   console's progress API; this module only decides what that object means. */

export interface Needs {
  /** 0 is just fed, 1 is famished. */
  hunger: number;
  /** 0 has just played, 1 is bored. */
  dull: number;
  /** 0 is just washed, 1 is dusty. */
  grime: number;
}

export interface SproutSave extends Needs {
  v: 1;
  /** Device-clock seconds the needs were last brought up to date. */
  at: number;
  /** Times a feed, a game or a wash actually helped. */
  care: number;
}

/** How fast each need drifts, per second. The same rates run in a session and away from it. */
export const HUNGER_PER_S = 0.008;
export const DULL_PER_S = 0.0065;
export const GRIME_PER_S = 0.0045;

export const FEED_RELIEF = 0.42;
export const PLAY_RELIEF = 0.48;
export const WASH_RELIEF = 0.55;

export type Care = 'feed' | 'play' | 'wash';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round4 = (n: number) => Math.round(n * 10000) / 10000;

function finite(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** How content Sprout is, from 0 (wilting) to 1 (glad). */
export function moodOf(n: Needs): number {
  return clamp01((3 - n.hunger - n.dull - n.grime) / 3);
}

/** A new pet, a little peckish so there is something to do on the first visit. */
export function freshPet(now: number): SproutSave {
  return { v: 1, at: finite(now), hunger: 0.28, dull: 0.22, grime: 0.16, care: 0 };
}

/** Move the needs forward by `seconds`. Zero and negative spans do nothing. */
export function decay(n: Needs, seconds: number): Needs {
  const s = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  return {
    hunger: clamp01(n.hunger + s * HUNGER_PER_S),
    dull: clamp01(n.dull + s * DULL_PER_S),
    grime: clamp01(n.grime + s * GRIME_PER_S),
  };
}

/**
 * In-session drift. Frame time moves the needs; the stamp stays where the last save left it,
 * so a later catch-up does not count this stretch twice.
 */
export function drift(save: SproutSave, dt: number): SproutSave {
  return { ...save, ...decay(save, dt) };
}

/**
 * Bring a save forward to `now`. Time since `at` is applied once. A backwards clock adds
 * nothing and the stamp moves to `now`, so the next visit measures from the new reading.
 */
export function catchUp(save: SproutSave, now: number): SproutSave {
  const t = finite(now);
  const gap = Math.max(0, t - finite(save.at));
  return { ...save, ...decay(save, gap), v: 1, at: t };
}

/** One care action. It helps only when that need still had something to give. */
export function care(save: SproutSave, kind: Care): { save: SproutSave; helped: boolean } {
  const key = kind === 'feed' ? 'hunger' : kind === 'play' ? 'dull' : 'grime';
  const relief = kind === 'feed' ? FEED_RELIEF : kind === 'play' ? PLAY_RELIEF : WASH_RELIEF;
  const before = save[key];
  const after = clamp01(before - relief);
  const helped = before > 0.02 && after < before;
  return {
    save: { ...save, [key]: after, care: helped ? save.care + 1 : save.care },
    helped,
  };
}

/** The object written to the disk's one JSON slot. Short numbers, so it stays far under the cap. */
export function toJson(save: SproutSave): SproutSave {
  return {
    v: 1,
    at: Math.round(finite(save.at) * 1000) / 1000,
    hunger: round4(clamp01(save.hunger)),
    dull: round4(clamp01(save.dull)),
    grime: round4(clamp01(save.grime)),
    care: Math.max(0, Math.floor(Number.isFinite(save.care) ? save.care : 0)),
  };
}

/** Read a save, or null when it is not this disk's shape. */
export function parseSave(raw: unknown): SproutSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  const hunger = num(o.hunger), dull = num(o.dull), grime = num(o.grime), at = num(o.at), care = num(o.care);
  if (hunger === null || dull === null || grime === null || at === null || care === null) return null;
  return {
    v: 1,
    at,
    hunger: clamp01(hunger),
    dull: clamp01(dull),
    grime: clamp01(grime),
    care: Math.max(0, Math.floor(care)),
  };
}
