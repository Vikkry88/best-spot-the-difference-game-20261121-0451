// Game rules and state — no drawing, no DOM. The renderer reads `state`; main.js feeds
// it clicks and keys. A click is tested against the current level's difference zones in
// scene coordinates, so it works identically on the left (original) and right (changed)
// panel: finding a difference marks it on both pictures.

import {
  HINT_PULSE_MS,
  HINT_SCORE_COST,
  HINTS_PER_LEVEL,
  POINTS_PER_FIND,
  SCREEN_CLEAR,
  SCREEN_COMPLETE,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  WRONG_TIME_PENALTY,
} from './config.js';
import { LEVELS } from './scenes.js';

export function createWorld() {
  const state = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    found: new Set(),
    score: 0,
    elapsed: 0, // seconds, whole run (wrong clicks add penalty seconds)
    levelElapsed: 0, // seconds on the current level
    mistakes: 0,
    hintsLeft: HINTS_PER_LEVEL,
    hintId: null,
    hintUntil: 0, // ms timestamp (performance.now clock, passed in)
    wrongFlash: null, // {panel, x, y, until}
    shakeUntil: 0,
    lastFoundLabel: '',
    levelBonus: 0,
    totalFound: 0,
    crosshair: null, // {x, y} in logical coords when playing by keyboard, else null
  };

  function level() {
    return LEVELS[state.levelIndex];
  }

  function startLevel(index) {
    state.levelIndex = index;
    state.found = new Set();
    state.levelElapsed = 0;
    state.hintsLeft = HINTS_PER_LEVEL;
    state.hintId = null;
    state.wrongFlash = null;
    state.levelBonus = 0;
    state.screen = SCREEN_PLAY;
  }

  function startGame() {
    state.score = 0;
    state.elapsed = 0;
    state.mistakes = 0;
    state.totalFound = 0;
    startLevel(0);
  }

  function tick(dtSeconds) {
    if (state.screen !== SCREEN_PLAY) return;
    state.elapsed += dtSeconds;
    state.levelElapsed += dtSeconds;
  }

  // panel: 0 = left/original, 1 = right/changed. sx, sy in scene coordinates.
  // Returns 'found' | 'already' | 'wrong'.
  function clickScene(panel, sx, sy, nowMs) {
    if (state.screen !== SCREEN_PLAY) return 'wrong';
    for (const diff of level().diffs) {
      const dx = sx - diff.x;
      const dy = sy - diff.y;
      if (dx * dx + dy * dy <= diff.r * diff.r) {
        if (state.found.has(diff.id)) return 'already';
        state.found.add(diff.id);
        state.totalFound += 1;
        state.score += POINTS_PER_FIND;
        state.lastFoundLabel = diff.label;
        if (state.hintId === diff.id) state.hintId = null;
        if (state.found.size >= level().diffs.length) {
          state.levelBonus = Math.max(0, 300 - Math.floor(state.levelElapsed)) * 2;
          state.score += state.levelBonus;
          state.screen = state.levelIndex >= LEVELS.length - 1 ? SCREEN_COMPLETE : SCREEN_CLEAR;
        }
        return 'found';
      }
    }
    state.mistakes += 1;
    state.elapsed += WRONG_TIME_PENALTY;
    state.levelElapsed += WRONG_TIME_PENALTY;
    state.wrongFlash = { panel, x: sx, y: sy, until: nowMs + 650 };
    state.shakeUntil = nowMs + 320;
    return 'wrong';
  }

  function useHint(nowMs) {
    if (state.screen !== SCREEN_PLAY || state.hintsLeft <= 0) return null;
    const remaining = level().diffs.filter((diff) => !state.found.has(diff.id));
    if (remaining.length === 0) return null;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - HINT_SCORE_COST);
    state.hintId = pick.id;
    state.hintUntil = nowMs + HINT_PULSE_MS;
    return pick;
  }

  function nextLevel() {
    if (state.levelIndex < LEVELS.length - 1) startLevel(state.levelIndex + 1);
  }

  function togglePause() {
    if (state.screen === SCREEN_PLAY) state.screen = SCREEN_PAUSED;
    else if (state.screen === SCREEN_PAUSED) state.screen = SCREEN_PLAY;
  }

  function remaining() {
    return level().diffs.length - state.found.size;
  }

  return { state, level, startGame, startLevel, tick, clickScene, useHint, nextLevel, togglePause, remaining };
}
