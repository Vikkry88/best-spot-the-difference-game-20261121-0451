# Twin Harbor — Spot the Difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Vikkry88/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Vikkry88/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

Two pictures side by side look identical — but they are not. Find all **8 differences** in each of three hand-drawn scenes, click either picture to mark them, and beat the clock.

## How to play

- **Click** a difference in either picture. A green ring marks it on **both** pictures and the header counter drops: *Found 3 of 8 · 5 remain*.
- **Wrong clicks** flash a red ✕, shake the screen, and add **+5 seconds**.
- **Hints:** 3 per scene (button or `H`) — a pulsing amber ring shows one hidden difference, for −30 points.
- **Score:** +100 per find, plus a time bonus of up to +600 per scene. Best score is kept in your browser.
- **Keys:** `Space`/`Enter` start & continue · `H` hint · `P` pause · `R` restart scene · `M` mute.
- **Sound:** synthesized WebAudio chimes, buzzes and jingles — no audio files.

## The scenes

1. **Harbor Dawn** — sunrise, fishing boats, a lighthouse, seagulls and crates.
2. **Market Noon** — market stalls, fruit piles, lanterns, a wandering cat.
3. **Night Fair** — a turning ferris wheel, string lights, balloons and a carousel horse.

Differences are fair and varied: colours swapped, objects added, removed, or moved. All art is drawn with canvas shapes in `game/src/scenes.js` — original, no images, no network requests, works fully offline from static files.

## Run it

```bash
node serve.ts        # then open http://localhost:8080
```

Build the submission dossier:

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/index.html` — the page (one canvas).
- `game/src/main.js` — boot, game loop, input wiring, `?shot=` screenshot staging, `window.__spot` playtest hook.
- `game/src/scenes.js` — the three scenes and their 8 differences each.
- `game/src/world.js` — rules and state (no DOM).
- `game/src/render.js` — all drawing: panels, rings, counter, overlays.
- `game/src/audio.js` — WebAudio sound effects. `game/src/input.js` — mouse/keyboard. `game/src/config.js`, `game/src/random.js`, `game/src/shots.js` — constants, seeded RNG, screenshot scenes.
- `main.ts` — copies `game/` + `screenshots/` to `/output` and writes `dossier.json` via `vendor/makefun-game.ts`.
- `screenshots/` — 1280×720 renders: mid-hunt gameplay, the second scene, the win screen, the title.
