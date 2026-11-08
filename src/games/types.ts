/* What every game disk gives the console.
   Game modules must not touch console imports at the top level (the modules import each other);
   only inside these functions, which the console calls after everything has loaded. */

/** A section of the game's Operating Instructions. Strings are I18N keys; `v` is a key or, with `lit`, literal HTML. */
export type ManualSection =
  | { h: string; p: string }
  | { h: string; list: { k: string; v: string; lit?: boolean }[]; keys?: boolean };

export type Strings = Record<'en' | 'zh-hant' | 'zh-hans', Record<string, any>>;

export interface GameDisk {
  /** Short id, used for storage keys (`gg-board-<id>`) and analytics. */
  id: string;
  /** Title in the pixel font, on the loader and the loading screen. */
  title: string;
  /** I18N key for the title in the instructions. */
  nameKey: string;
  /** The file the drive "reads", and its size in bytes, shown while loading. */
  file: string;
  size: number;
  /** How long the disk takes to load, in seconds. Never more than 5. */
  loadSecs: number;
  /** The load's progress curve: [fraction of the time, fraction loaded] pairs, uneven like sectors off a disk. */
  steps: [number, number][];
  /** One line under the title on the loader, in the pixel font. */
  blurb: string;
  /** Verb for "PRESS FIRE TO …" on the high-score table. */
  verb: string;
  /** I18N keys for the FIRE and BOOST button labels in this game. */
  fireKey: string;
  boostKey: string;
  /** I18N keys for the game-over card's title and button. */
  overKey: string;
  againKey: string;
  /** This game's Operating Instructions. */
  manual: ManualSection[];
  /** Extra I18N strings this game brings. */
  strings?: Partial<Strings>;
  /** A new game: reset the field and score. The console then counts down `ready` and switches to `play`. */
  start(): void;
  /** Called every step while this game is in `ready`, `play`, `dying` or `clear`. */
  update(dt: number): void;
  /** Draw the playfield and HUD into the low-res buffer. */
  draw(): void;
  /** Draw the themed loading screen; p is 0..1 loaded, t the seconds since the drive started. */
  drawLoad(p: number, t: number): void;
  /** Optional: the palette changed. */
  onPalette?(): void;
}
