/** The most JSON text one disk may store, in UTF-8 bytes. */
export const SAVE_LIMIT: number;
/** UTF-8 size of `s`. Stops once the count passes `limit`. */
export function utf8Bytes(s: string, limit?: number): number;
/** JSON text for `data`, or null when it is not plain JSON or the text is over the cap. */
export function encodeSave(data: unknown): string | null;
/** `raw` back into a value, or null when it is missing, broken or over the cap. */
export function decodeSave(raw: string | null): unknown;
