# Tunnel Raider

![Tunnel Raider on a green-phosphor CRT monitor](og-image.png)

A tunnelling arcade game for the browser, played on a 1983-style CRT monitor. Dig for emeralds, drop sacks of gold on the grubs and outwit monsters that get smarter every level.

It is one self-contained `index.html` with a small service worker for offline play: no build step and no dependencies beyond Google Fonts.

## Play

Open `index.html` in a browser, or serve the folder with any static host (see [Deploy](#deploy)). The set starts switched off: flip **POWER** (or press <kbd>Enter</kbd>) to boot it.

| Action | Keyboard | On the set |
| --- | --- | --- |
| Move and dig | Arrow keys or <kbd>WASD</kbd> | Joystick (drag) |
| Throw a spark | <kbd>Space</kbd> or <kbd>Z</kbd> | FIRE |
| Speed boost | <kbd>Shift</kbd> or <kbd>B</kbd> | BOOST (refills in about 7 s) |
| Pause | <kbd>P</kbd> or <kbd>Esc</kbd> | HOLD switch |
| Sound on / off | <kbd>M</kbd> | SOUND switch |
| Change monitor | <kbd>C</kbd> | PHOSPHOR dial |
| Full screen | <kbd>F</kbd> | FULL switch |
| Power / reboot | <kbd>Enter</kbd> to power on | POWER switch, RESET button |

### Scoring

| | Points |
| --- | --- |
| Emerald | 25 |
| Eight emeralds in quick succession | +250 |
| Gold from a sack that fell two or more cells | 500 |
| Grub crushed by a sack or hit by a spark | 250 |
| Rockjaw (from level 4) | 500 |
| Sunstone | 1,000 |
| Grubs rammed while the sunstone glows | 200 · 400 · 800 · 1,600 |
| Spare drill cart | every 20,000 |

### How it gets harder

- Everything starts slow. The cart begins at 72% of full speed and the grubs at about a fifth of that, arriving several seconds apart. Both quicken every level, but grubs always stay below the cart's open-tunnel speed.
- Grubs wander less, turn into tunnelling borers sooner and stay borers longer.
- From level 3, borers shove sacks sideways and line them up over your cart.
- From level 4, rockjaws dig their own tunnels and take two hits (three from level 7).

## The monitor

- **Phosphor dial:** green (P1), long-afterglow green (P39), amber (P3), paper white (P4) and the two four-colour CGA palettes. Each phosphor fades at its own rate.
- **Tube effects:** scanlines, bloom, afterglow trails, a colour stripe mask, magnetised patches that creep back after each degauss, burn-in, dust, picture tears. The GLOW switch turns them all off.
- **Cold boot:** BIOS memory test, POST beep and a floppy load with drive sounds, all synthesised with the Web Audio API.

## Screens

A small detector picks a layout from the real viewport and input type, so it fits any phone, tablet or desktop:

| Layout | When | What you get |
| --- | --- | --- |
| Console | Touch screen held sideways | Gamepad style: joystick left, tube centre, dial and switches top right, FIRE and BOOST bottom right |
| Phone portrait | Upright phone, or a tall narrow window | The set fills the screen, with a tall playfield and handheld-style controls: joystick left, FIRE and BOOST right |
| Tablet portrait | Upright tablet | Large tube, controls underneath |
| Desk | Mouse or trackpad | The full set with the guide below |

The playfield grid is chosen per game to match the tube's shape: about 15 × 10 on a wide screen, 10 or 11 columns by 14 to 16 rows on an upright phone.

## Play offline and install

Served over HTTPS (GitHub Pages included), Tunnel Raider is an installable web app:

- **Offline:** the first visit caches the whole game, its icons and fonts with a service worker (`sw.js`). After that it opens instantly and plays with no connection.
- **Updates:** whenever the game opens, comes back online, or every 30 minutes while it's visible, it checks `sw.js` for a new version. A new version downloads in the background, then a "new version ready · RESTART" prompt appears, so a game is never cut off mid-level. Installed apps on Chromium browsers can also check in the background.
- **Install:** browsers that support it show an **Install app** button beside the language switch. On iPhone and iPad, use Share → Add to Home Screen. The app opens full screen with the CRT icon.

High scores and settings stay on the device; there is no server.

### Building

`index.html`, `sw.js` and the icons are generated from the artifact source. The service worker's version is a hash of everything it caches, so any change to the page or icons ships as an update automatically.

## Languages

English (default), Traditional Chinese and Simplified Chinese. The language travels in the link, so you can share it:

- `…/#en`
- `…/#zh-hant` (also `#zh-hk`, `#zh-tw`)
- `…/#zh-hans` (also `#zh-cn`, `#zh-sg`)

## Deploy

The page's share tags assume GitHub Pages at `https://wiiiimm.github.io/tunnel-raider/`. To publish there, open **Settings → Pages**, choose **Deploy from a branch**, and select `main` / root. If you host it elsewhere, update the `og:url`, `og:image`, `twitter:image` and `canonical` URLs at the top of `index.html`.

## Credits

A tribute to Windmill Software's *Digger* (1983). The characters, artwork, sound and code here are original.
