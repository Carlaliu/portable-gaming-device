/* Sprout's words for the leaflet. The pixel font on the tube stays English. */
import type { Strings } from '../types';

const kb = (k: string) => `<kbd>${k}</kbd>`;

export const strings: Strings = {
  en: {
    spName: 'Sprout',
    spHow: 'Sprout lives on this set. It is a small desk pet. It grows hungry, bored and dusty while you play, and it keeps on while the set is switched off. Feed it, play with it and wash it, and it cheers up. Leave it, and it wilts until you visit again. Clearing the high scores does not forget Sprout: its day is stored on its own.',
    spKFeed: 'Feed', spKFeedV: `${kb('Space')} or FIRE`,
    spKPlay: 'Play', spKPlayV: 'Stick or arrow keys',
    spKWash: 'Wash', spKWashV: `${kb('Shift')} or BOOST`,
    spSCare: 'Each feed, play or wash that helped', spSCareV: '25 points',
    spSKeep: "Sprout's needs", spSKeepV: 'Kept on this device, apart from the high scores',
    spNeedsH: 'While you are away',
    spNeeds: 'Hunger, boredom and dust move on while the game is running, and the next visit catches up with the time you were away. Setting the clock back does not age Sprout. A feed, a play or a wash that Sprout actually needed is remembered straight away.',
    spAbout: 'Sprout, its pictures, its sounds and its code are original.',
    spOver: 'TUCKED IN', spAgain: 'VISIT AGAIN',
    spFeed: 'FEED', spWash: 'WASH',
  },
  'zh-hant': {
    spName: 'Sprout 芽芽',
    spHow: '芽芽住在這台主機上，是一隻小桌上寵物。你玩的時候它會餓、會悶、會沾灰，關機之後也一樣。餵它、陪它玩、幫它洗，它就會振作；放着不管，它就會蔫，直到你再來。清除高分不會忘記芽芽：它的一天另外保存。',
    spKFeed: '餵食', spKFeedV: `${kb('空白鍵')}或 FIRE`,
    spKPlay: '陪玩', spKPlayV: '搖桿或方向鍵',
    spKWash: '清洗', spKWashV: `${kb('Shift')} 或 BOOST`,
    spSCare: '一次有用的餵食、陪玩或清洗', spSCareV: '25 分',
    spSKeep: '芽芽的需要', spSKeepV: '存在這台裝置上，與高分分開',
    spNeedsH: '你不在的時候',
    spNeeds: '飢餓、無聊和灰塵在遊戲進行時會慢慢增加，下次載入時也會補上你離開的時間。把時鐘往回調不會讓芽芽變老。它真正需要的一次餵食、陪玩或清洗會立刻記住。',
    spAbout: '芽芽的形象、畫面、聲音和程式都是原創。',
    spOver: '蓋好被子了', spAgain: '再去看看',
    spFeed: '餵食', spWash: '清洗',
  },
  'zh-hans': {
    spName: 'Sprout 芽芽',
    spHow: '芽芽住在这台主机上，是一只小桌上宠物。你玩的时候它会饿、会闷、会沾灰，关机之后也一样。喂它、陪它玩、帮它洗，它就会振作；放着不管，它就会蔫，直到你再来。清除高分不会忘记芽芽：它的一天另外保存。',
    spKFeed: '喂食', spKFeedV: `${kb('空格键')}或 FIRE`,
    spKPlay: '陪玩', spKPlayV: '摇杆或方向键',
    spKWash: '清洗', spKWashV: `${kb('Shift')} 或 BOOST`,
    spSCare: '一次有用的喂食、陪玩或清洗', spSCareV: '25 分',
    spSKeep: '芽芽的需要', spSKeepV: '存在这台装置上，与高分分开',
    spNeedsH: '你不在的时候',
    spNeeds: '饥饿、无聊和灰尘在游戏进行时会慢慢增加，下次载入时也会补上你离开的时间。把时钟往回调不会让芽芽变老。它真正需要的一次喂食、陪玩或清洗会立刻记住。',
    spAbout: '芽芽的形象、画面、声音和程序都是原创。',
    spOver: '盖好被子了', spAgain: '再去看看',
    spFeed: '喂食', spWash: '清洗',
  },
};
