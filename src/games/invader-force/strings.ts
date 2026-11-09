/* Invader Force's words for the page (the pixel font on the tube stays English). */
import type { Strings } from '../types';

const kb = (k: string) => `<kbd>${k}</kbd>`;

export const strings: Strings = {
  en: {
    ifName: 'Invader Force',
    ifHow: "Five rows of aliens march side to side above you, dropping a row every time they reach an edge, and bombing as they go. Slide your cannon left and right and shoot them down: one shot in the air at a time, so make it count. The walls soak up bombs (and your shots) until they crumble. The fewer aliens are left, the faster they march. If they reach your row, the line has fallen. Clear the formation and the next wave starts lower and faster. Now and then a mystery saucer crosses the top for bonus points, and BOOST raises a short shield that stops bombs, then needs a few seconds to recharge.",
    if1: 'Drone (bottom rows)', if2: 'Beetle (middle rows)', if3: 'Jelly (top row)',
    if4: 'Mystery saucer', if5: 'Extra cannon', if5v: 'every 1,500',
    ik1: 'Move', ik1v: `${kb('←')} ${kb('→')}, ${kb('A')} ${kb('D')} or the stick`,
    ik2: 'Fire', ik2v: `${kb('Space')} or FIRE, or tap the screen`,
    ik3: 'Shield', ik3v: `${kb('Shift')} or SHIELD (recharges in about 9 s)`,
    ifCred: "A tribute to Taito's Space Invaders (1978) and the fixed-screen shooters that followed it. The aliens, cannon, art, sound and code here are original.",
    ifOver: 'INVADED', ifAgain: 'FIGHT AGAIN',
    shield: 'SHIELD',
  },
  'zh-hant': {
    ifName: 'Invader Force 外星侵略軍',
    ifHow: '五排外星人在你頭頂左右行進，每碰到邊緣就向下推進一排，一邊走一邊投彈。左右移動你的砲台把它們擊落：畫面上一次只能有一發子彈，所以要瞄準。城牆可以擋住炸彈（也會擋住你的子彈），直到被打爛為止。外星人越少，行進得越快。它們一旦推進到你那一排，防線就失守。清光整個陣列後，下一波會從更低的位置、以更快的速度出現。偶爾會有神秘飛碟在頂部飛過，擊中可得額外分數；按 BOOST 會升起短暫的護盾擋住炸彈，之後要等幾秒才能再用。',
    if1: '無人機（底部兩排）', if2: '甲蟲（中間兩排）', if3: '水母（頂排）',
    if4: '神秘飛碟', if5: '額外砲台', if5v: '每 1,500 分',
    ik1: '移動', ik1v: `${kb('←')} ${kb('→')}、${kb('A')} ${kb('D')} 或搖桿`,
    ik2: '射擊', ik2v: `${kb('空白鍵')}或 FIRE，或輕觸畫面`,
    ik3: '護盾', ik3v: `${kb('Shift')} 或 SHIELD（約 9 秒回復）`,
    ifCred: '向 Taito 的《太空侵略者》（Space Invaders，1978）以及之後的固定畫面射擊遊戲致敬；外星人、砲台、美術、聲音和程式碼均為原創。',
    ifOver: '失守了', ifAgain: '再戰一次',
    shield: '護盾',
  },
  'zh-hans': {
    ifName: 'Invader Force 外星侵略军',
    ifHow: '五排外星人在你头顶左右行进，每碰到边缘就向下推进一排，一边走一边投弹。左右移动你的炮台把它们击落：画面上一次只能有一发子弹，所以要瞄准。城墙可以挡住炸弹（也会挡住你的子弹），直到被打烂为止。外星人越少，行进得越快。它们一旦推进到你那一排，防线就失守。清光整个阵列后，下一波会从更低的位置、以更快的速度出现。偶尔会有神秘飞碟在顶部飞过，击中可得额外分数；按 BOOST 会升起短暂的护盾挡住炸弹，之后要等几秒才能再用。',
    if1: '无人机（底部两排）', if2: '甲虫（中间两排）', if3: '水母（顶排）',
    if4: '神秘飞碟', if5: '额外炮台', if5v: '每 1,500 分',
    ik1: '移动', ik1v: `${kb('←')} ${kb('→')}、${kb('A')} ${kb('D')} 或摇杆`,
    ik2: '射击', ik2v: `${kb('空格键')}或 FIRE，或轻触画面`,
    ik3: '护盾', ik3v: `${kb('Shift')} 或 SHIELD（约 9 秒恢复）`,
    ifCred: '向 Taito 的《太空侵略者》（Space Invaders，1978）以及之后的固定画面射击游戏致敬；外星人、炮台、美术、声音和代码均为原创。',
    ifOver: '失守了', ifAgain: '再战一次',
    shield: '护盾',
  },
};
