/* Plain JSON for one disk's progress. Shared by the console program and the headless hosts.

   The stored text is at most SAVE_LIMIT UTF-8 bytes. A missing, broken or oversized value reads as
   null. Encoding refuses anything that is not plain JSON, so a later load returns the same value.
   This file stays free of the clock, the store and every browser global: the program's rules scan it. */

export const SAVE_LIMIT = 4096;

/** UTF-8 size of `s`. Stops once the count passes `limit`, so a huge stored string is refused quickly. */
export function utf8Bytes(s, limit = Infinity) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xD800 && c <= 0xDBFF) { n += 4; i += 1; }
    else n += 3;
    if (n > limit) return n;
  }
  return n;
}

/** True for values JSON keeps as themselves: null, booleans, strings, finite numbers, arrays and plain objects. */
function plain(v, seen) {
  if (v === null || typeof v === 'boolean' || typeof v === 'string') return true;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v !== 'object') return false;
  if (seen.has(v)) return false;
  seen.add(v);
  if (Array.isArray(v)) {
    if (Object.getPrototypeOf(v) !== Array.prototype) return false;
    if (Object.keys(v).length !== v.length) return false;
    for (let i = 0; i < v.length; i++) if (!plain(v[i], seen)) return false;
    return true;
  }
  const proto = Object.getPrototypeOf(v);
  if (proto !== Object.prototype && proto !== null) return false;
  for (const key of Object.keys(v)) if (!plain(v[key], seen)) return false;
  return true;
}

/** JSON text for `data`, or null when it is not plain JSON or the text is over the cap. */
export function encodeSave(data) {
  try {
    if (!plain(data, new WeakSet())) return null;
    const text = JSON.stringify(data);
    if (typeof text !== 'string' || utf8Bytes(text, SAVE_LIMIT) > SAVE_LIMIT) return null;
    return text;
  } catch (_) { return null; }
}

/** `raw` back into a value, or null when it is missing, not a string, broken or over the cap. */
export function decodeSave(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  try {
    if (utf8Bytes(raw, SAVE_LIMIT) > SAVE_LIMIT) return null;
    return JSON.parse(raw);
  } catch (_) { return null; }
}
