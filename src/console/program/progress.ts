/* One JSON progress value per disk, on this device, beside the high-score table.

   The key is `gg-save-<id>`, using the disk `loadScores` last selected (the game that is loaded).
   The text is at most SAVE_LIMIT UTF-8 bytes. A missing, broken or oversized value reads as null,
   and a value the store cannot keep is refused. Nothing here throws into the game.

   The clock is the host's Unix time in seconds (`platform.unix`). Boots and loads keep the monotonic
   `platform.now` (milliseconds). `S.time` is seconds since the page started, and it starts again on
   a reload; `now()` is the device clock, so a save can measure real time away. */
import { host } from './host';
import { scores } from './scores';
import { SAVE_LIMIT, decodeSave, encodeSave } from './save-json.mjs';

export { SAVE_LIMIT, decodeSave, encodeSave };

export const saveKey = (id: string) => 'gg-save-' + id;

/** This disk's progress, or null when there is none or it cannot be read. */
export function loadSave(): unknown {
  try {
    const id = scores.id;
    if (!id) return null;
    return decodeSave(host.platform.store.get(saveKey(id)));
  } catch (_) { return null; }
}

/** Store plain JSON for this disk. False when it is refused; the previous value stays. */
export function saveProgress(data: unknown): boolean {
  try {
    const id = scores.id;
    if (!id) return false;
    const text = encodeSave(data);
    if (text === null) return false;
    host.platform.store.set(saveKey(id), text);
    return true;
  } catch (_) { return false; }
}

/** Remove this disk's progress. Scores are left where they are. */
export function clearSave(): void {
  try {
    const id = scores.id;
    if (!id) return;
    host.platform.store.remove(saveKey(id));
  } catch (_) { /* a full or locked store must not stop the game */ }
}

/** Unix seconds from the host. Always finite: a missing or broken clock reads as 0. */
export function now(): number {
  try {
    const t = host.platform.unix();
    return Number.isFinite(t) ? t : 0;
  } catch (_) { return 0; }
}
