// Twin Harbor — Spot the Difference: boot, loop, and wiring.
// ?shot=play|level2|win|title stages a screenshot scene and sets window.__shotReady.
// window.__spot exposes the world plus logical-coordinate helpers for automated playtests.

import { BEST_KEY, PANEL_H, PANEL_LEFT_X, PANEL_RIGHT_X, PANEL_W, PANEL_Y, SCREEN_CLEAR, SCREEN_COMPLETE, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './config.js';
import { createWorld } from './world.js';
import { buttonsFor, createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';
import { LEVELS } from './scenes.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function announce(message) {
  status.textContent = message;
}

function panelAt(x, y) {
  if (y < PANEL_Y || y > PANEL_Y + PANEL_H) return null;
  if (x >= PANEL_LEFT_X && x <= PANEL_LEFT_X + PANEL_W) return { panel: 0, sx: x - PANEL_LEFT_X, sy: y - PANEL_Y };
  if (x >= PANEL_RIGHT_X && x <= PANEL_RIGHT_X + PANEL_W) return { panel: 1, sx: x - PANEL_RIGHT_X, sy: y - PANEL_Y };
  return null;
}

function handleClick(x, y, nowMs) {
  const { state } = world;
  state.crosshair = null; // a mouse click takes over from keyboard play
  for (const btn of buttonsFor(state)) {
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      if (btn.id === 'hint') {
        if (world.useHint(nowMs)) audio.hint();
      } else if (btn.id === 'start' || btn.id === 'again') {
        world.startGame();
        audio.click();
        announce('Playing. Find 8 differences.');
      } else if (btn.id === 'next') {
        world.nextLevel();
        audio.click();
        announce(`Level ${state.levelIndex + 1}. Find 8 differences.`);
      }
      return;
    }
  }
  if (state.screen === SCREEN_PAUSED) {
    world.togglePause();
    return;
  }
  if (state.screen !== SCREEN_PLAY) return;
  const hit = panelAt(x, y);
  if (!hit) return;
  const result = world.clickScene(hit.panel, hit.sx, hit.sy, nowMs);
  if (result === 'found') {
    audio.found();
    announce(`${state.lastFoundLabel}. ${world.remaining()} remain.`);
    if (state.screen === SCREEN_CLEAR) audio.levelClear();
    if (state.screen === SCREEN_COMPLETE) {
      audio.win();
      if (state.score > readBest()) saveBest(state.score);
    }
  } else if (result === 'wrong') {
    audio.wrong();
    announce('Not a difference. Plus 5 seconds.');
  }
}

function handleKey(key) {
  const { state } = world;
  if (key === 'm') {
    audio.toggleMute();
    announce(audio.muted ? 'Sound off.' : 'Sound on.');
    return;
  }
  if (key === 'p' || key === 'escape') {
    world.togglePause();
    return;
  }
  if (key === 'h') {
    if (world.useHint(performance.now())) audio.hint();
    return;
  }
  if (key === 'r' && state.screen === SCREEN_PLAY) {
    world.startLevel(state.levelIndex);
    return;
  }
  // Keyboard-only play: arrows or WASD move a crosshair over the pictures, Enter
  // clicks where it sits. The crosshair appears on the first arrow press, centred
  // on the right picture, and stays until the next mouse click.
  const STEP = 24;
  const moves = {
    arrowup: [0, -STEP], w: [0, -STEP],
    arrowdown: [0, STEP], s: [0, STEP],
    arrowleft: [-STEP, 0], a: [-STEP, 0],
    arrowright: [STEP, 0], d: [STEP, 0],
  };
  if (moves[key] && state.screen === SCREEN_PLAY) {
    if (!state.crosshair) state.crosshair = { x: PANEL_RIGHT_X + PANEL_W / 2, y: PANEL_Y + PANEL_H / 2 };
    state.crosshair.x = Math.max(0, Math.min(1280, state.crosshair.x + moves[key][0]));
    state.crosshair.y = Math.max(0, Math.min(720, state.crosshair.y + moves[key][1]));
    return;
  }
  if (key === 'enter' && state.screen === SCREEN_PLAY && state.crosshair) {
    const { x, y } = state.crosshair;
    handleClick(x, y, performance.now());
    state.crosshair = { x, y }; // handleClick clears it for the mouse; keyboard play keeps it
    return;
  }
  if (key === ' ' || key === 'enter') {
    if (state.screen === SCREEN_TITLE || state.screen === SCREEN_COMPLETE) {
      world.startGame();
      audio.click();
    } else if (state.screen === SCREEN_CLEAR) {
      world.nextLevel();
      audio.click();
    } else if (state.screen === SCREEN_PAUSED) {
      world.togglePause();
    }
  }
}

// Playtest / automation hook: logical (1280x720) coordinates, same space as clicks.
window.__spot = {
  world,
  levels: LEVELS,
  clickLogical(x, y) {
    handleClick(x, y, performance.now());
  },
  diffCenters() {
    return LEVELS[world.state.levelIndex].diffs.map((diff) => ({
      id: diff.id,
      left: { x: PANEL_LEFT_X + diff.x, y: PANEL_Y + diff.y },
      right: { x: PANEL_RIGHT_X + diff.x, y: PANEL_Y + diff.y },
      found: world.state.found.has(diff.id),
    }));
  },
};

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.best, false, 1200);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let best = readBest();
  let last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    for (const click of input.takeClicks()) handleClick(click.x, click.y, now);
    for (const key of input.takeKeys()) handleKey(key);
    world.tick(dt);
    if (world.state.screen === SCREEN_COMPLETE && world.state.score > best) {
      best = world.state.score;
    }
    renderer.draw(world.state, best, audio.muted, now);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && world.state.screen === SCREEN_PLAY) world.togglePause();
  });

  announce('Twin Harbor. Press Space or click Start to play.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
