/* Sprout's pictures: a round desk pet in a pot, drawn with the console's colour roles. */
import type { ConsoleAPI } from '../types';

let api: ConsoleAPI;

/** Point the sprites at the console's drawing API before drawing. */
export function useApi(a: ConsoleAPI) { api = a; }

const R = (x: number, y: number, w: number, h: number, role: string) => {
  api.g.fillStyle = api.col(role);
  api.g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

export interface SproutPose {
  /** Pixels the body is off the pot. The pot stays put. */
  hop: number;
  blink: boolean;
  mouth: 'smile' | 'flat' | 'open' | 'down';
  wilt: boolean;
  grimy: boolean;
  /** A drooping leaf when Sprout is hungry or miserable. */
  droop: boolean;
  /** 0..1 crumb falling into the mouth, or -1 when there is none. */
  crumb: number;
  /** 0..1 wash bubbles, or 0 when Sprout is dry. */
  bubbles: number;
  /** 0..1 of a bouncing ball, or -1 when the ball is put away. */
  ball: number;
}

/** A still Sprout, with a small hop for the loading screen and the launcher. */
export function idlePose(hop: number, t: number): SproutPose {
  return {
    hop, blink: t % 3.2 < 0.12, mouth: 'smile', wilt: false, grimy: false, droop: false,
    crumb: -1, bubbles: 0, ball: -1,
  };
}

/** The corner of the room: a floor line along the bottom of the rectangle, and a four-pane window. */
export function drawNook(x: number, y: number, w: number, h: number) {
  const floor = y + h - 1;
  R(x, floor, w, 1, 'hud');
  if (w < 64 || h < 48) return;
  const wx = x + 8, wy = y + 6;
  R(wx, wy, 28, 22, 'textDim');
  R(wx + 2, wy + 2, 11, 8, 'bg');
  R(wx + 15, wy + 2, 11, 8, 'bg');
  R(wx + 2, wy + 12, 11, 8, 'bg');
  R(wx + 15, wy + 12, 11, 8, 'bg');
  R(wx - 1, wy + 22, 30, 2, 'hud');
}

/** Sprout itself. `cx` is the middle, `foot` is the bottom of the pot. */
export function drawSprout(cx: number, foot: number, pose: SproutPose) {
  const hop = Math.round(Math.max(0, pose.hop));
  R(cx - 8, foot - 3, 16, 2, 'hud');
  R(cx - 12, foot - 8, 24, 6, 'cart');
  R(cx - 10, foot - 11, 20, 4, 'cartShade');
  const y = foot - hop;
  R(cx - 9, y - 28, 18, 16, 'text');
  R(cx - 7, y - 31, 14, 4, 'text');
  R(cx - 5, y - 20, 10, 6, 'textDim');
  if (pose.droop) {
    R(cx + 2, y - 34, 8, 3, 'gem');
    R(cx + 8, y - 32, 3, 4, 'sun');
  } else {
    R(cx - 2, y - 40, 4, 10, 'gem');
    R(cx - 5, y - 42, 8, 3, 'sun');
  }
  if (pose.blink || pose.wilt) {
    R(cx - 6, y - 25, 3, 1, 'bg');
    R(cx + 2, y - 25, 3, 1, 'bg');
  } else {
    R(cx - 6, y - 27, 3, 3, 'bg');
    R(cx + 2, y - 27, 3, 3, 'bg');
    R(cx - 5, y - 26, 1, 1, 'spark');
    R(cx + 3, y - 26, 1, 1, 'spark');
  }
  if (pose.mouth === 'open') R(cx - 3, y - 20, 6, 3, 'bg');
  else if (pose.mouth === 'down') {
    R(cx - 3, y - 18, 6, 1, 'bg');
    R(cx - 4, y - 19, 1, 1, 'bg');
    R(cx + 3, y - 19, 1, 1, 'bg');
  } else if (pose.mouth === 'smile') {
    R(cx - 3, y - 18, 6, 1, 'bg');
    R(cx - 4, y - 19, 1, 1, 'bg');
    R(cx + 3, y - 19, 1, 1, 'bg');
  } else R(cx - 2, y - 19, 4, 1, 'bg');
  R(cx - 8, y - 14, 4, 3, 'text');
  R(cx + 4, y - 14, 4, 3, 'text');
  if (pose.grimy) {
    R(cx - 7, y - 24, 2, 2, 'dirt');
    R(cx + 5, y - 22, 2, 2, 'dirt');
    R(cx - 1, y - 16, 2, 2, 'dirt');
  }
  if (pose.crumb >= 0) {
    const cy = y - 46 + pose.crumb * 24;
    R(cx - 2, cy, 3, 3, 'gold');
  }
  if (pose.bubbles > 0) {
    const b = pose.bubbles;
    R(cx - 16, y - 20 - b * 18, 3, 3, 'spark');
    R(cx + 13, y - 16 - b * 22, 2, 2, 'spark');
    R(cx - 4, y - 36 - b * 12, 2, 2, 'hud');
  }
  if (pose.ball >= 0) {
    const by = y - 16 - Math.abs(Math.sin(pose.ball * Math.PI * 2)) * 16;
    R(cx + 16, by, 5, 5, 'gem');
    R(cx + 17, by + 1, 2, 2, 'sun');
  }
}
