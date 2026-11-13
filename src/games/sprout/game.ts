/* Sprout: a pocket desk pet. Feed it, play with it, wash it, and it remembers.

   Needs drift with frame time while the game runs. Across a reload they catch up from the
   device clock (`api.now()`), stamped into the disk's one JSON save. A backwards clock adds
   no gap. POWER, RESET and SELECT do not write this save; the game does, on each visit and
   whenever Sprout is fed, played with or washed, and when a need has drifted a visible step.
   Clearing the high-score table does not clear it. */
import type { ConsoleAPI, CreateGame } from '../types';
import { drawNook, drawSprout, useApi, type SproutPose } from './art';
import {
  care, catchUp, drift, freshPet, moodOf, parseSave, toJson,
  type Care, type SproutSave,
} from './rules';

const POINTS = 25;
/** A need has to move this far before a drift, on its own, is worth writing down. */
const DRIFT_SAVE = 0.03;
const COOL = 0.42;

const LINES: Record<Care, [string, string]> = {
  feed: ['MUNCH', 'FULL'],
  play: ['WHEE', 'ZIPPY'],
  wash: ['SPLASH', 'FRESH'],
};

function moodWord(mood: number) {
  if (mood >= 0.75) return 'GLAD';
  if (mood >= 0.5) return 'CALM';
  if (mood >= 0.28) return 'LOW';
  return 'WILT';
}

const create: CreateGame = (api) => {
  useApi(api);
  let pet: SproutSave = freshPet(0);
  let clock = 0;
  let cool = 0;
  let msg = '';
  let msgT = 0;
  let anim: { kind: Care | 'idle'; t: number } = { kind: 'idle', t: 0 };
  /** Needs last written, so a slow drift is saved once per visible step, not every frame. */
  let written = { hunger: pet.hunger, dull: pet.dull, grime: pet.grime };

  function score() {
    api.S.score = pet.care * POINTS;
    api.S.level = 1 + Math.floor(pet.care / 8);
    if (api.S.score > api.best) api.best = api.S.score;
  }

  function persist() {
    const stamped = toJson({ ...pet, at: api.now() });
    if (!api.saveProgress(stamped)) return;
    const parsed = parseSave(stamped);
    if (parsed) pet = parsed;
    written = { hunger: pet.hunger, dull: pet.dull, grime: pet.grime };
  }

  function drifted() {
    return Math.abs(pet.hunger - written.hunger) >= DRIFT_SAVE
      || Math.abs(pet.dull - written.dull) >= DRIFT_SAVE
      || Math.abs(pet.grime - written.grime) >= DRIFT_SAVE;
  }

  function chime(kind: Care, helped: boolean) {
    if (kind === 'feed') {
      api.tone(helped ? 262 : 180, 0.08, 0.04, helped ? 90 : -30);
      if (helped) api.tone(392, 0.09, 0.035, 0, 0.08);
    } else if (kind === 'play') {
      api.tone(523, 0.06, 0.04, 30);
      api.tone(659, 0.07, 0.035, 0, 0.07);
      api.tone(784, 0.08, 0.03, 0, 0.14);
    } else {
      api.tone(740, 0.1, 0.035, -180);
      api.tone(620, 0.08, 0.03, -60, 0.09);
    }
    if (helped) api.buzz('pickup');
  }

  function act(kind: Care) {
    const next = care(pet, kind);
    pet = { ...next.save, at: pet.at };
    anim = { kind, t: 0.7 };
    cool = COOL;
    msg = LINES[kind][next.helped ? 0 : 1];
    msgT = 0.95;
    chime(kind, next.helped);
    score();
    persist();
  }

  function start() {
    api.fitGrid();
    clock = 0; cool = 0; anim = { kind: 'idle', t: 0 }; msg = ''; msgT = 0;
    const loaded = parseSave(api.loadSave());
    if (loaded) {
      const gap = Math.max(0, api.now() - loaded.at);
      pet = catchUp(loaded, api.now());
      if (gap >= 20) { msg = 'MISSED YOU'; msgT = 2.4; }
    } else pet = freshPet(api.now());
    score();
    persist();
  }

  function update(dt: number) {
    clock += dt;
    if (msgT > 0) msgT -= dt;
    if (anim.t > 0) anim.t -= dt;
    if (cool > 0) cool -= dt;
    if (api.S.mode === 'ready') {
      if ((api.S.modeT -= dt) <= 0) api.S.mode = 'play';
      api.clearFire(); api.clearBoost(); api.clearTap();
      return;
    }
    if (api.S.mode !== 'play') return;
    pet = drift(pet, dt);
    let kind: Care | null = null;
    if (cool <= 0) {
      if (api.fireQueued) kind = 'feed';
      else if (api.boostQueued) kind = 'wash';
      else if (api.wantDir()) kind = 'play';
    }
    api.clearFire(); api.clearBoost(); api.clearTap();
    if (kind) act(kind);
    else if (drifted()) persist();
  }

  function pose(): SproutPose {
    const mood = moodOf(pet);
    const feeding = anim.kind === 'feed' && anim.t > 0;
    const playing = anim.kind === 'play' && anim.t > 0;
    const washing = anim.kind === 'wash' && anim.t > 0;
    const hop = playing ? Math.abs(Math.sin((0.7 - anim.t) * 14)) * 8 : Math.sin(clock * 2) * 1.1;
    return {
      hop: Math.max(0, hop),
      blink: clock % 3.4 < 0.12,
      mouth: feeding ? 'open' : mood < 0.35 ? 'down' : mood < 0.6 ? 'flat' : 'smile',
      wilt: mood < 0.35,
      grimy: pet.grime > 0.45,
      droop: pet.hunger > 0.55 || mood < 0.35,
      crumb: feeding ? 1 - anim.t / 0.7 : -1,
      bubbles: washing ? 1 - anim.t / 0.7 : 0,
      ball: playing ? (0.7 - anim.t) / 0.7 : -1,
    };
  }

  function bar(x: number, y: number, w: number, label: string, fill: number) {
    api.txt(label, x, y, 'hud');
    api.g.fillStyle = api.col('hud');
    api.g.fillRect(x, y + 10, w, 5);
    api.g.fillStyle = api.col('bg');
    api.g.fillRect(x + 1, y + 11, w - 2, 3);
    const inner = Math.max(0, Math.round((w - 2) * Math.min(1, Math.max(0, fill))));
    if (inner > 0) {
      api.g.fillStyle = api.col(fill < 0.28 ? 'dirt' : 'gem');
      api.g.fillRect(x + 1, y + 11, inner, 3);
    }
  }

  function draw() {
    const { LW, LH, HUD } = api;
    const foot = LH - 40;
    if (LW >= 200 && foot - HUD > 70) drawNook(0, HUD, LW, foot - HUD + 2);
    drawSprout(LW / 2 + (LW >= 280 ? 10 : 0), foot, pose());
    if (msgT > 0) api.txt(msg, LW / 2, Math.max(HUD + 4, foot - 68), 'sun', 'center');
    const gap = 6;
    const bw = Math.min(72, Math.floor((LW - 16 - gap * 2) / 3));
    let x = Math.round((LW - (bw * 3 + gap * 2)) / 2);
    const y = LH - 28;
    bar(x, y, bw, 'FED', 1 - pet.hunger);
    bar(x += bw + gap, y, bw, 'FUN', 1 - pet.dull);
    bar(x + bw + gap, y, bw, 'TID', 1 - pet.grime);
    api.g.fillStyle = api.col('bg');
    api.g.fillRect(0, 0, LW, HUD);
    api.txt('SPROUT', 6, 6, 'text');
    if (LW >= 220) api.txt(moodWord(moodOf(pet)), LW / 2, 6, 'hud', 'center');
    api.txt(String(api.S.score).padStart(4, '0'), LW - 6, 6, 'text', 'right');
    if (api.S.mode === 'ready') api.banner('SPROUT', 'FEED · PLAY · WASH');
  }

  return {
    start, update, draw,
    debug: {
      state: () => ({
        hunger: pet.hunger, dull: pet.dull, grime: pet.grime,
        mood: moodOf(pet), care: pet.care, at: pet.at, msg,
      }),
      saved: () => api.loadSave(),
    },
  };
};

export default create;
