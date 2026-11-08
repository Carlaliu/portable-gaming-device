/* Dino Run's words for the page (the pixel font on the tube stays English). */
import type { Strings } from '../types';

const kb = (k: string) => `<kbd>${k}</kbd>`;

export const strings: Strings = {
  en: {
    dName: 'Dino Run',
    dHow: "Your dinosaur runs on its own and the desert keeps coming. Jump the cacti and boulders, duck under the low-flying pterosaurs, and don't touch anything: one knock and it's extinction. Hold jump for a higher leap; duck in mid-air to drop back down fast. The ground speeds up as your score climbs, and from 250 points pterosaurs join in at three heights. Jump the low ones, duck the middle ones and simply run under the high ones.",
    dr1: 'Running', dr1v: 'about 13 a second',
    dr2: 'Every 100 points', dr2v: 'a chime and a flash of the score',
    dr3: 'Pterosaurs', dr3v: 'from 250 points',
    dk1: 'Jump (hold to jump higher)', dk1v: `${kb('↑')} ${kb('Space')} or FIRE, or tap the screen`,
    dk2: 'Duck', dk2v: `${kb('↓')} ${kb('Shift')} or BOOST`,
    dCred: "A tribute to the offline dinosaur game built into Google Chrome (2014). The dinosaur, obstacles, art, sound and code here are original.",
    dOver: 'EXTINCT', dAgain: 'RUN AGAIN',
    jump: 'JUMP', duck: 'DUCK',
  },
  'zh-hant': {
    dName: 'Dino Run 恐龍快跑',
    dHow: '你的恐龍會自己往前跑，沙漠永遠跑不完。跳過仙人掌和大石，蹲低避開低飛的翼龍，甚麼都不要碰到：一撞就絕種。按住跳躍可以跳得更高；在半空按蹲下可以快速落地。分數越高，地面越快；到 250 分起，翼龍會在三種高度出現：低的要跳過，中間的要蹲低，高的直接跑過去就可以。',
    dr1: '奔跑距離', dr1v: '每秒約 13 分，越快越多',
    dr2: '每 100 分', dr2v: '響一聲並閃動分數',
    dr3: '翼龍', dr3v: '250 分起出現',
    dk1: '跳躍（按住跳得更高）', dk1v: `${kb('↑')}、${kb('空白鍵')}或 FIRE，或輕觸畫面`,
    dk2: '蹲下', dk2v: `${kb('↓')}、${kb('Shift')} 或 BOOST`,
    dCred: '向 Google Chrome 內置的離線恐龍遊戲（2014）致敬；恐龍、障礙物、美術、聲音和程式碼均為原創。',
    dOver: '絕種了', dAgain: '再跑一次',
    jump: '跳躍', duck: '蹲下',
  },
  'zh-hans': {
    dName: 'Dino Run 恐龙快跑',
    dHow: '你的恐龙会自己往前跑，沙漠永远跑不完。跳过仙人掌和大石，蹲低避开低飞的翼龙，什么都不要碰到：一撞就灭绝。按住跳跃可以跳得更高；在半空按蹲下可以快速落地。分数越高，地面越快；到 250 分起，翼龙会在三种高度出现：低的要跳过，中间的要蹲低，高的直接跑过去就可以。',
    dr1: '奔跑距离', dr1v: '每秒约 13 分，越快越多',
    dr2: '每 100 分', dr2v: '响一声并闪动分数',
    dr3: '翼龙', dr3v: '250 分起出现',
    dk1: '跳跃（按住跳得更高）', dk1v: `${kb('↑')}、${kb('空格键')}或 FIRE，或轻触画面`,
    dk2: '蹲下', dk2v: `${kb('↓')}、${kb('Shift')} 或 BOOST`,
    dCred: '向 Google Chrome 内置的离线恐龙游戏（2014）致敬；恐龙、障碍物、美术、声音和代码均为原创。',
    dOver: '灭绝了', dAgain: '再跑一次',
    jump: '跳跃', duck: '蹲下',
  },
};
