# AGENTS.md: Game Guy

Notes for anyone (human or agent) working in this repo. Read this before changing anything.

## What this is

**Game Guy 3000 Deluxe** (Game Guy for short) is a browser game console: one old CRT monitor that boots, shows a game loader, and runs several games. It starts as a copy of [Tunnel Raider](https://github.com/wiiiimm/tunnel-raider), which is still its own repo and site (`tunnel-raider.wiiiimm.codes`); changes made here do not flow back to it.

Requirements 1 to 7 below are built: the console boots into a disk menu with two games, Tunnel Raider and Dino Run.

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

- The page header and every bit of branding on the CRT set change from Tunnel Raider to the console's name: **Game Guy 3000 Deluxe** (chosen by the owner). Any shortened form must still say "Game Guy", and the look stays nerdy and retro.
- Today's spots to change:
  - **Page header:** wordmark and `TR-83` badge (`.mk-model`), and the tagline beside it.
  - **Nameplate on the set:** `TUNNEL RAIDER` with the `TR-83 · <phosphor>` line (`.nameplate`, set by `setMode()`).
  - **Embossed model line:** `TR-83 · 12″ PHOSPHOR MONITOR` (`.emboss`).
  - **BIOS banner:** `TR-83 PERSONAL COMPUTER   BIOS 1.0` (`drawBoot()`).
  - **Instructions:** the `model` string in `I18N` for all three languages.
  - **App identity:** `<title>`, `apple-mobile-web-app-title`, share tags and image, `manifest.webmanifest` name and short name, icons, README.
- Model code: replace `TR-83` with `GG-3000 DX`. Game names (Tunnel Raider and the rest) appear only inside their own game: its loading screen, instructions and title.

### 7. A SELECT button beside RESET

- Add a **SELECT** button next to RESET on the set, labelled `SELECT` in the same style as the RESET label.
- **Colours:** SELECT takes RESET's current look (the dark graphite key, `.resetbtn`). RESET becomes **dark wine red**, so it reads as the dangerous one.
- **What it does:** pressing SELECT leaves the current game and goes back to the game loader, replaying the boot-up and disk loading sounds on the way (the same kind as `playBoot()`), much as RESET replays the cold boot today.
- It does nothing with the set switched off, like RESET.
- It needs a place in every layout (`desk`, `console`, tall console, `phone-portrait`, `tablet-portrait`), sitting with RESET beside POWER.
- **RESET vs SELECT:** RESET reboots the whole console (BIOS, then the loader); SELECT just swaps the game, through the loader.
- Add a keyboard shortcut for it, and an analytics event (for example `select` with the game left and its level).

### 8. Dino Run, with its own high-score table

- The loader's second game: an original endless desert runner in the spirit of Google Chrome's offline dinosaur game. Jump cacti and boulders, duck pterosaurs. The dinosaur, obstacles, art, sound and code are original; never copy Chrome's sprites.
- It has its own top-ten table and name entry, like Tunnel Raider.

## Stack (decided)

**Vite + TypeScript, plain Canvas 2D, no UI framework or game engine.** The picture comes from the console's own four-colour quantiser and phosphor pass, which an engine's renderer would fight, and the DOM around the canvas is small.

- **Offline:** `vite-plugin-pwa` (Workbox, `generateSW`, `registerType: 'prompt'`). Every build precaches files by content hash; no hand-written service worker or version numbers.
- **Analytics:** `@vercel/analytics` (`inject()` in `main.ts`, `track()` through the console's `track` helper).
- **Tests:** Vitest for logic (`tests/unit`), Playwright scripts for the screens (`tests/*.cjs`, run against `npm run preview`).
- **Deploy:** Vercel's Vite preset, `npm run build` → `dist`.
- **Types:** TypeScript is loose for now (`strict: false`) because the ported console code is untyped. New code should be typed; tighten module by module.

## Where things are now

| Path | What it is |
| --- | --- |
| `index.html` | Markup for the set, the leaflet and the inline layout detector |
| `src/main.ts` | Entry point |
| `src/styles/console.css` | The set, its layouts and the leaflet |
| `src/console/core.ts` | CRT picture pipeline, input, sound, switches, languages, scores, name entry, game loop |
| `src/console/loader.ts` | Boot screens, disk menu, loading screens and drive sounds, SELECT |
| `src/console/strings.ts` | The console's own strings (en, zh-hant, zh-hans) |
| `src/console/pwa.ts` | Install button, offline-ready and update prompts |
| `src/games/types.ts` | The `GameDisk` interface every game implements |
| `src/games/index.ts` | The disks, in loader order |
| `src/games/tunnel-raider/` | Tunnel Raider (`game.ts`) and its disk (`disk.ts`: loading screen, instructions) |
| `src/games/dino-run/` | Dino Run (`game.ts`) and its strings |
| `public/` | Icons, favicon, share image |

Useful places:

- **Modes:** `S.mode` is one of `off`, `boot`, `menu`, `load`, `ready`, `play`, `dying`, `clear`, `paused`, `entry`, `over`. The console runs `boot`, `menu`, `load`, `entry` and `over`; the loaded game's `update()` runs `ready`, `play`, `dying` and `clear`.
- **Flow:** `startConsole('cold' | 'warm')` → `enterMenu()` → `loadGame(i)` → `startGame()` → game → `finishGame()` → name entry or the attract loop. POWER and RESET cold-boot; SELECT (`pressSelect`, key <kbd>G</kbd>) warm-boots.
- **The loaded game:** `game` in `core.ts`, set by `setGame()`. That also loads the game's scores, relabels FIRE and BOOST (`fireKey`, `boostKey`) and switches the instructions.
- **Drive sounds:** `playDisk(start, dur)` in `loader.ts`; a load plays it for exactly `loadSecs`.
- **Instructions:** built from each disk's `manual` sections by `renderManual()`; the console's own are `CONSOLE_MANUAL` in `core.ts`. Tunnel Raider's strings still live in the base `I18N` table in `core.ts`; new games bring theirs in `strings`.
- **Scores:** `gg-best-<id>` and `gg-board-<id>` in localStorage (Tunnel Raider falls back to the standalone game's `eb-best` and `tr-board`); the last name typed is `gg-name`.
- **Module rule:** the game modules and the console import each other. A game module must not use console imports at its top level, only inside functions.

## How the console should keep behaving

- **One monitor, many games.** The CRT set, the phosphor dial, the SOUND / GLOW / HOLD / FULL switches, POWER and RESET belong to the console and work the same in every game.
- **Retro and original.** Games are tributes at most: original names, characters, art, sound and code. Never copy another game's assets or trademarks.
- **Four colours.** Everything on the tube goes through the palette quantiser and colour roles, so it looks right on green, amber, white and CGA.
- **Every screen size.** The layout detector picks `desk`, `phone-portrait`, `tablet-portrait` or `console`, and the playfield grid adapts to the tube's shape. The loader and every loading screen have to fit all of them, including the iPhone 17 Pro and Pro Max, an opened foldable, iPad mini and iPad Pro, in portrait and landscape.
- **Offline.** The console and every game must play with no connection once cached. Anything in `public/` or imported by the code is precached by the build; files fetched some other way need a `runtimeCaching` rule in `vite.config.ts`.
- **Languages.** The page chrome and instructions come in English, Traditional Chinese and Simplified Chinese (`I18N`, chosen by `#en`, `#zh-hant` or `#zh-hans`). On-tube text stays English in the pixel font.
- **High scores.** Local only, per device, one table per game (`gg-board-<id>`).
- **Analytics.** Vercel Web Analytics custom events through `track(name, data)`. The account is on Vercel Pro, which allows **at most two properties per event**, and values must be strings, numbers, booleans or null. When there are several games, put the game id in the event properties and drop a less useful one to stay within two. Keep the README's event table up to date.

## Working conventions

- **Spelling:** Australian / British English in copy, docs and commit messages.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:` …), committed to `main` and pushed straight away, unless the owner asks to preview first. When he does, show the change and wait for approval before pushing.
- **Test before pushing:** `npm run build` and `npm test`, then the Playwright scripts against `npm run preview` at desktop and phone sizes, checking for errors and looking at screenshots of anything visual.
- **Keep the README current** with controls, games and the analytics event list.

## Open questions

- The site address for the console. Then set absolute share-tag URLs and a canonical link in `index.html`.
- Which games join next.
