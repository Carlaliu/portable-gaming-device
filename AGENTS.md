# AGENTS.md: Game Guy

Notes for anyone (human or agent) working in this repo. Read this before changing anything.

## What this is

**Game Guy** is a browser game console: one old CRT monitor that boots, shows a game loader, and runs several games. It starts as a copy of [Tunnel Raider](https://github.com/wiiiimm/tunnel-raider), which is still its own repo and site (`tunnel-raider.wiiiimm.codes`); changes made here do not flow back to it.

Right now the repo is still Tunnel Raider as it was copied, with the same page title, share tags, canonical URL and README. Rebrand those as the console takes shape.

## Requirements (from the owner)

### 1. Boot into a game loader

- Switching the set on (POWER) or pressing RESET runs the cold boot (BIOS memory test, POST beep, floppy drive) and then lands in a **game loader interface**, not straight into a game.
- The loader is the console's home screen. It lists the games and lets the player pick one to load.
- It must work with every existing control: joystick, arrow keys and WASD, FIRE / <kbd>Space</kbd> / <kbd>Enter</kbd>, and tapping the screen.

### 2. Every game gets its own themed loading screen

- Loading a game from the loader shows a **loading screen themed to that game**: its own title art, wording, colours within the phosphor palette, and progress style. Tunnel Raider's current `LOADING TUNNEL.EXE` sector bar is the model for one of them.

### 3. Loading sounds

- Every game load plays **disk loading sounds**: drive motor spin-up, head recalibrating, track-by-track head clicks, head parking. Reuse and extend the synthesised floppy sounds in `playBoot()`, `noise()` and `headClick()` (Web Audio, no audio files).
- The sound has to match the length of that game's load, so the drive stops when the bar finishes.

### 4. Load times differ per game, up to 5 seconds

- Each game has its own load duration. **No load may take longer than 5 seconds.**
- Durations differ between games (for example a small game loads in about 1.5 s, a big one in close to 5 s), and the bar fills in fits and starts like sectors coming off a disk rather than smoothly.

### 5. Every game has its own instruction menu

- Each game ships its own **Operating Instructions**: how to play, controls, scoring and how it gets harder, in English, Traditional Chinese and Simplified Chinese.
- The instructions shown match the game that is loaded. In the loader they cover the console itself (picking and loading a game, POWER, RESET, the switches and dial).
- Tunnel Raider's current manual (the `#manual` leaflet with its `I18N` strings) becomes that game's instructions; each new game adds its own in the same style.

### 6. Rebrand the console as Game Guy

- The page header and every bit of branding on the CRT set change from Tunnel Raider to the console's name. **It must include "Game Guy"** and should feel nerdy and retro, along the lines of **Game Guy 3000** (the working name until the owner settles it).
- Today's spots to change:
  - **Page header:** wordmark and `TR-83` badge (`.mk-model`), and the tagline beside it.
  - **Nameplate on the set:** `TUNNEL RAIDER` with the `TR-83 · <phosphor>` line (`.nameplate`, set by `setMode()`).
  - **Embossed model line:** `TR-83 · 12″ PHOSPHOR MONITOR` (`.emboss`).
  - **BIOS banner:** `TR-83 PERSONAL COMPUTER   BIOS 1.0` (`drawBoot()`).
  - **Instructions:** the `model` string in `I18N` for all three languages.
  - **App identity:** `<title>`, `apple-mobile-web-app-title`, share tags and image, `manifest.webmanifest` name and short name, icons, README.
- Model code: replace `TR-83` with a console model code to match, such as `GG-3000`. Game names (Tunnel Raider and the rest) appear only inside their own game: its loading screen, instructions and title.

### 7. A SELECT button beside RESET

- Add a **SELECT** button next to RESET on the set, labelled `SELECT` in the same style as the RESET label.
- **Colours:** SELECT takes RESET's current look (the dark graphite key, `.resetbtn`). RESET becomes **dark wine red**, so it reads as the dangerous one.
- **What it does:** pressing SELECT leaves the current game and goes back to the game loader, replaying the boot-up and disk loading sounds on the way (the same kind as `playBoot()`), much as RESET replays the cold boot today.
- It does nothing with the set switched off, like RESET.
- It needs a place in every layout (`desk`, `console`, tall console, `phone-portrait`, `tablet-portrait`), sitting with RESET beside POWER.
- **RESET vs SELECT:** RESET reboots the whole console (BIOS, then the loader); SELECT just swaps the game, through the loader.
- Add a keyboard shortcut for it, and an analytics event (for example `select` with the game left and its level).

## Where things are now

| File | What it is |
| --- | --- |
| `index.html` | The whole console and Tunnel Raider: HTML, CSS and JS in one file, no build step and no dependencies beyond Google Fonts |
| `sw.js` | Service worker that caches the app shell for offline play |
| `manifest.webmanifest`, `icons/`, `favicon.*` | Install manifest and icons |
| `og-image.png` | Share image (1200 × 630) |

Useful places in `index.html`:

- **Cold boot:** `BOOT_LEN`, `playBoot()` (sounds), `drawBoot()` (BIOS text and the TUNNEL.EXE loader bar).
- **Game state:** the `S` object and its `S.mode` values (`off`, `boot`, `ready`, `play`, `dying`, `clear`, `paused`, `entry`, `over`).
- **Power and reset:** `powerOn()`, `powerOff()` and the `#resetBtn` handler. Today they all call `startGame()` directly; the loader goes in between.
- **Picture pipeline:** each frame draws into a low-resolution buffer (`g`, `LW` × `LH`). `renderFrame()` then snaps it to the theme's four colours, and the CRT pass adds glow, afterglow, scanlines, mask, burn-in and so on. Draw text with `txt()` and colours with `col(role)` so every phosphor theme works.
- **Input:** the `keydown` handler, the floating joystick (`stickDir`), the FIRE and BOOST buttons, and `menuFire()`, which already routes FIRE to menu screens (high-score entry and the attract loop).
- **High scores:** `board`, `tr-board` in localStorage, name entry (`startEntry`, `drawEntry`) and the table (`drawBoard`).

## How the console should keep behaving

- **One monitor, many games.** The CRT set, the phosphor dial, the SOUND / GLOW / HOLD / FULL switches, POWER and RESET belong to the console and work the same in every game.
- **Retro and original.** Games are tributes at most: original names, characters, art, sound and code. Never copy another game's assets or trademarks.
- **Four colours.** Everything on the tube goes through the palette quantiser and colour roles, so it looks right on green, amber, white and CGA.
- **Every screen size.** The layout detector picks `desk`, `phone-portrait`, `tablet-portrait` or `console`, and the playfield grid adapts to the tube's shape. The loader and every loading screen have to fit all of them, including the iPhone 17 Pro and Pro Max, an opened foldable, iPad mini and iPad Pro, in portrait and landscape.
- **Offline.** The console and every game must play with no connection once cached. When you add files, add them to `ASSETS` in `sw.js` and change `VERSION` (any new value; a short hash of the assets is the convention), or players won't get the update.
- **Languages.** The page chrome and instructions come in English, Traditional Chinese and Simplified Chinese (`I18N`, chosen by `#en`, `#zh-hant` or `#zh-hans`). On-tube text stays English in the pixel font.
- **High scores.** Local only, per device. Give each game its own table (for example `gg-board-<game>`) rather than sharing one.
- **Analytics.** Vercel Web Analytics custom events through `track(name, data)`. The account is on Vercel Pro, which allows **at most two properties per event**, and values must be strings, numbers, booleans or null. When there are several games, put the game id in the event properties and drop a less useful one to stay within two. Keep the README's event table up to date.

## Working conventions

- **Spelling:** Australian / British English in copy, docs and commit messages.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:` …), committed to `main` and pushed straight away, unless the owner asks to preview first. When he does, show the change and wait for approval before pushing.
- **Test before pushing:** run the page in a headless browser (Playwright) at desktop and phone sizes, check for console errors, and look at screenshots of anything visual.
- **Keep the README current** with controls, games and the analytics event list.

## Open questions

- Which games join Tunnel Raider, and in what order.
- The final console name (working name Game Guy 3000) and model code, and the site address.
- Whether games stay inside one `index.html` or move to one file or folder per game (for example `games/<id>/`) loaded by the console.
