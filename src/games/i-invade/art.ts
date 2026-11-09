/* I Invade's sprites: original pixel art, drawn in colour roles so every phosphor theme works.
   '#' is the sprite's colour; anything else is see-through. The fleet's sprites have two frames for the march. */
import type { ConsoleAPI, Role } from '../types';

let api: ConsoleAPI;
/** Point the sprites at the console's drawing API before drawing. */
export function useApi(a: ConsoleAPI){ api = a; }

export type Sprite = string[];

/** Top row: the commander, a crowned eye on stalks. */
export const CROWN: Sprite[] = [[
  '.#...#...#.',
  '.##.###.##.',
  '..#######..',
  '.###...###.',
  '.##.###.##.',
  '..#######..',
  '..#..#..#..',
  '.#...#...#.',
], [
  '.#...#...#.',
  '.##.###.##.',
  '..#######..',
  '.###...###.',
  '.##.###.##.',
  '..#######..',
  '...#.#.#...',
  '..#..#..#..',
]];
/** Middle rows: a horned puffer, fins beating. */
export const PUFFER: Sprite[] = [[
  '#.........#',
  '.#.#####.#.',
  '..#######..',
  '.##.###.##.',
  '###########',
  '.#########.',
  '#..#...#..#',
  '...........',
], [
  '.#.......#.',
  '.#.#####.#.',
  '..#######..',
  '.##.###.##.',
  '###########',
  '.#########.',
  '.#.#...#.#.',
  '...........',
]];
/** Bottom rows: a pod with a hatch, the fleet's bombers. */
export const POD: Sprite[] = [[
  '...#####...',
  '.#########.',
  '##.#.#.#.##',
  '###########',
  '.##.....##.',
  '..#.###.#..',
  '.#.......#.',
  '...........',
], [
  '...#####...',
  '.#########.',
  '##.#.#.#.##',
  '###########',
  '.##.....##.',
  '..#.###.#..',
  '..#.....#..',
  '...........',
]];
/** The defenders' tank: a boxy hull on road wheels, gun pointing up at you. */
export const TANK: Sprite = [
  '......#......',
  '......#......',
  '....#####....',
  '..#########..',
  '#############',
  '##.##.##.##.#',
  '.###########.',
];
/** Your UFO, called in on BOOST. */
export const UFO: Sprite = [
  '.....######.....',
  '...##########...',
  '.##.##.##.##.##.',
  '################',
  '..#..#....#..#..',
];
/** A blast: rubble flying. */
export const BLAST: Sprite = [
  '..#...#...#..',
  '#...#...#...#',
  '..##.....##..',
  '.#..#.#.#..#.',
  '..##.....##..',
  '#...#...#...#',
  '..#...#...#..',
];

export function sprite(s: Sprite, x: number, y: number, role: Role){
  const g = api.g; g.fillStyle = api.col(role);
  const x0 = Math.round(x), y0 = Math.round(y);
  for (let r = 0; r < s.length; r++) {
    const row = s[r];
    for (let c = 0; c < row.length; c++) if (row[c] === '#') g.fillRect(x0 + c, y0 + r, 1, 1);
  }
}
