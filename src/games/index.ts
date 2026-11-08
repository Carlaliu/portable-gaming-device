/* The disks in the drive box, in loader order. Add a game: write its module, then list it here. */
import type { GameDisk } from './types';
import { tunnelRaider } from './tunnel-raider/disk';
import { dinoRun } from './dino-run/game';

export const GAMES: GameDisk[] = [tunnelRaider, dinoRun];
export type { GameDisk } from './types';
