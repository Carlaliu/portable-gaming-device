/* Dino Run's sprites: original pixel art built from rectangles, in colour roles so every phosphor theme works. */
import type { ConsoleAPI } from '../types';

let api: ConsoleAPI;
/** Point the sprites at the console's drawing API before drawing. */
export function useApi(a: ConsoleAPI){ api = a; }
const R = (x: number, y: number, w: number, h: number, role: string) => { api.g.fillStyle = api.col(role); api.g.fillRect(Math.round(x), Math.round(y), w, h); };

export function drawDino(bx: number, by: number, duck: boolean, frame: number, air: boolean, dead = false){
  if (duck) {   // low and long, plates flat
    const oy = by - 13;
    R(bx, oy + 5, 4, 3, 'text'); R(bx + 4, oy + 3, 15, 8, 'text');
    R(bx + 7, oy + 1, 3, 2, 'cartShade'); R(bx + 11, oy, 3, 3, 'cartShade'); R(bx + 15, oy + 1, 2, 2, 'cartShade');
    R(bx + 19, oy + 2, 8, 5, 'text'); R(bx + 24, oy + 3, 1, 1, 'bg');
    R(bx + 6, oy + 11, 3, frame ? 2 : 1, 'text'); R(bx + 13, oy + 11, 3, frame ? 1 : 2, 'text');
    return;
  }
  const oy = by - 22;
  R(bx, oy + 10, 4, 3, 'text'); R(bx + 3, oy + 9, 3, 4, 'text');               // tail
  R(bx + 5, oy + 7, 12, 9, 'text'); R(bx + 6, oy + 15, 10, 2, 'text');          // body
  R(bx + 6, oy + 4, 3, 3, 'cartShade'); R(bx + 9, oy + 2, 3, 5, 'cartShade');   // back plates
  R(bx + 12, oy + 3, 3, 4, 'cartShade'); R(bx + 15, oy + 5, 2, 2, 'cartShade');
  R(bx + 16, oy + 5, 3, 6, 'text'); R(bx + 17, oy + 1, 7, 6, 'text');           // neck and head
  R(bx + 18, oy + 11, 2, 2, 'text');                                            // arm
  if (dead) { R(bx + 20, oy + 2, 3, 3, 'bg'); R(bx + 21, oy + 3, 1, 1, 'text'); }
  else R(bx + 21, oy + 2, 1, 2, 'bg');                                          // eye
  const [a, b] = air ? [5, 5] : frame ? [6, 4] : [4, 6];
  R(bx + 7, oy + 16, 3, a, 'text'); R(bx + 13, oy + 16, 3, b, 'text');          // legs
}
export function drawCactus(x: number, gy: number, tall: boolean){
  const h = tall ? 22 : 15, top = gy - h;
  if (tall) { R(x + 3, top, 3, h, 'gem'); R(x, top + 6, 2, 6, 'gem'); R(x, top + 11, 3, 2, 'gem'); R(x + 7, top + 3, 2, 7, 'gem'); R(x + 6, top + 9, 2, 2, 'gem'); }
  else { R(x + 2, top, 3, h, 'gem'); R(x, top + 4, 1, 5, 'gem'); R(x, top + 8, 2, 1, 'gem'); R(x + 6, top + 2, 1, 6, 'gem'); R(x + 5, top + 7, 2, 1, 'gem'); }
}
export function drawRock(x: number, gy: number){
  R(x + 3, gy - 8, 7, 1, 'bag'); R(x + 1, gy - 7, 11, 2, 'bag'); R(x, gy - 5, 13, 5, 'bag'); R(x + 3, gy - 6, 3, 1, 'goldHi');
}
export function drawPtero(x: number, bottom: number, flap: boolean){
  const oy = bottom - 10;
  R(x + 3, oy + 5, 3, 1, 'borer'); R(x + 6, oy + 4, 8, 3, 'borer'); R(x + 14, oy + 3, 3, 3, 'borer'); R(x + 17, oy + 4, 2, 1, 'borer');
  R(x + 15, oy + 3, 1, 1, 'bg');
  if (flap) { R(x + 7, oy, 2, 4, 'borer'); R(x + 9, oy + 1, 3, 3, 'borer'); }
  else { R(x + 7, oy + 7, 2, 3, 'borer'); R(x + 9, oy + 7, 3, 2, 'borer'); }
}
export function drawCloud(x: number, y: number){
  R(x + 4, y, 7, 1, 'textDim'); R(x + 2, y + 1, 2, 1, 'textDim'); R(x + 11, y + 1, 3, 1, 'textDim'); R(x, y + 2, 16, 1, 'textDim');
}
export function drawGround(gy: number, off: number){
  R(0, gy, api.LW, 1, 'hud');
  for (let i = 0; i < 26; i++) {   // pebbles and scrub sliding past
    const span = api.LW + 40, px = ((i * 53.7 + (i % 3) * 17 - off) % span + span) % span - 20, py = gy + 3 + (i * 7) % 5;
    R(px, py, 1 + (i % 3), 1, i % 4 ? 'textDim' : 'hud');
  }
}
