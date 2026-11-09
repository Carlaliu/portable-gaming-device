/* Finds the games: every src/games/<id>/disk.ts is a disk in the box, sorted by `order`.
   The game code (game.ts) is only fetched when its disk is loaded. */
import type { GameDisk, CreateGame } from './types';

const diskModules = import.meta.glob<{ disk: GameDisk }>('./*/disk.ts', { eager: true });
const gameModules = import.meta.glob<{ default: CreateGame }>('./*/game.ts');

export const DISKS: GameDisk[] = Object.values(diskModules).map(m => m.disk).sort((a, b) => a.order - b.order);

/** Fetch a game's code (once; later calls reuse the module). */
export async function loadGameCode(id: string): Promise<CreateGame> {
  const entry = Object.entries(gameModules).find(([path]) => path === `./${dirOf(id)}/game.ts`);
  if (!entry) throw new Error(`No game.ts for disk "${id}"`);
  return (await entry[1]()).default;
}

/* a disk's folder: the one whose disk.ts declared this id */
function dirOf(id: string){
  const hit = Object.entries(diskModules).find(([, m]) => m.disk.id === id);
  if (!hit) throw new Error(`Unknown disk "${id}"`);
  return hit[0].split('/')[1];
}
