/* Sprout's needs: in-session drift, time away, and a clock that has gone backwards. */
import { describe, expect, it } from 'vitest';
import {
  HUNGER_PER_S, DULL_PER_S, GRIME_PER_S, FEED_RELIEF,
  care, catchUp, decay, drift, freshPet, moodOf, parseSave, toJson,
  type SproutSave,
} from '../../src/games/sprout/rules';

const utf8 = (save: SproutSave) => Buffer.byteLength(JSON.stringify(toJson(save)), 'utf8');

describe('Sprout needs', () => {
  it('drifts hunger, boredom and dust with frame time and holds the stamp', () => {
    const pet = freshPet(1_000);
    const next = drift(pet, 10);
    expect(next.hunger).toBeCloseTo(pet.hunger + 10 * HUNGER_PER_S, 6);
    expect(next.dull).toBeCloseTo(pet.dull + 10 * DULL_PER_S, 6);
    expect(next.grime).toBeCloseTo(pet.grime + 10 * GRIME_PER_S, 6);
    expect(next.at).toBe(pet.at);
  });

  it('ignores a zero or negative frame and never passes 1', () => {
    const full = { ...freshPet(0), hunger: 1, dull: 1, grime: 1 };
    expect(decay(full, 50)).toEqual({ hunger: 1, dull: 1, grime: 1 });
    expect(decay(freshPet(0), 0).hunger).toBeCloseTo(0.28, 6);
    expect(decay(freshPet(0), -8).hunger).toBeCloseTo(0.28, 6);
  });

  it('catches up across a reload once, and a backwards clock adds nothing', () => {
    let pet = freshPet(1_000);
    pet = drift(pet, 10);
    const saved = toJson({ ...pet, at: 1_010 });
    const loaded = catchUp(parseSave(saved)!, 1_070);
    expect(loaded.hunger).toBeCloseTo(freshPet(0).hunger + 70 * HUNGER_PER_S, 4);
    expect(loaded.at).toBe(1_070);
    const back = catchUp(loaded, 1_000);
    expect(back.hunger).toBeCloseTo(loaded.hunger, 6);
    expect(back.dull).toBeCloseTo(loaded.dull, 6);
    expect(back.grime).toBeCloseTo(loaded.grime, 6);
    expect(back.at).toBe(1_000);
  });

  it('does not apply the same stretch twice when the stamp moved with the drift', () => {
    const start = freshPet(5_000);
    const played = drift(start, 25);
    const saved = toJson({ ...played, at: 5_025 });
    const again = catchUp(parseSave(JSON.parse(JSON.stringify(saved)))!, 5_025);
    expect(again.hunger).toBeCloseTo(saved.hunger, 4);
  });

  it('feeds, plays and washes only the need you chose', () => {
    const pet = { ...freshPet(10), hunger: 0.8, dull: 0.6, grime: 0.5 };
    const fed = care(pet, 'feed');
    expect(fed.helped).toBe(true);
    expect(fed.save.hunger).toBeCloseTo(pet.hunger - FEED_RELIEF, 6);
    expect(fed.save.dull).toBe(pet.dull);
    expect(fed.save.grime).toBe(pet.grime);
    expect(fed.save.care).toBe(1);
    const full = care({ ...pet, hunger: 0 }, 'feed');
    expect(full.helped).toBe(false);
    expect(full.save.care).toBe(0);
    expect(full.save.hunger).toBe(0);
    const washed = care(pet, 'wash');
    expect(washed.save.grime).toBeLessThan(pet.grime);
    expect(washed.save.hunger).toBe(pet.hunger);
  });

  it('reads a save back and refuses anything that is not one', () => {
    const saved = toJson(catchUp(freshPet(20), 80));
    expect(parseSave(JSON.parse(JSON.stringify(saved)))).toEqual(saved);
    expect(parseSave(null)).toBeNull();
    expect(parseSave([])).toBeNull();
    expect(parseSave({ v: 2, at: 1, hunger: 0, dull: 0, grime: 0, care: 0 })).toBeNull();
    expect(parseSave({ v: 1, at: 1, hunger: 0, dull: 0, grime: Number.NaN, care: 0 })).toBeNull();
    expect(parseSave({ ...saved, care: 3.9 })!.care).toBe(3);
  });

  it('keeps the JSON under the 4096-byte cap', () => {
    const fat = toJson({ ...freshPet(1_700_000_000.123456), care: 1_000_000, hunger: 1, dull: 1, grime: 1 });
    expect(utf8(fat)).toBeLessThanOrEqual(4096);
    expect(utf8(fat)).toBeLessThan(200);
    expect(moodOf(fat)).toBe(0);
    expect(moodOf(freshPet(0))).toBeGreaterThan(0.7);
  });
});
