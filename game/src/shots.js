// Screenshot staging behind ?shot=play|level2|win|title (&seed=N accepted, unused —
// decoration is fixed-seed so frames are identical every run). Each scene sets the real
// world state the way actual play would: differences genuinely marked found, real score
// and clock values, so the render is exactly what a player sees.

import { SCREEN_COMPLETE, SCREEN_PLAY, SCREEN_TITLE } from './config.js';
import { LEVELS } from './scenes.js';

export function stageShot(name, world) {
  const { state } = world;
  if (name === 'level2') {
    world.startGame();
    world.startLevel(1);
    state.found.add(LEVELS[1].diffs[0].id);
    state.found.add(LEVELS[1].diffs[2].id);
    state.score = 200;
    state.elapsed = 96;
    state.levelElapsed = 96;
    state.lastFoundLabel = LEVELS[1].diffs[2].label;
    state.screen = SCREEN_PLAY;
    return { screen: SCREEN_PLAY, best: 4200 };
  }
  if (name === 'win') {
    world.startGame();
    world.startLevel(2);
    for (const diff of LEVELS[2].diffs) state.found.add(diff.id);
    state.score = 3150;
    state.elapsed = 274;
    state.mistakes = 4;
    state.screen = SCREEN_COMPLETE;
    return { screen: SCREEN_COMPLETE, best: 3150 };
  }
  if (name === 'title') {
    state.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE, best: 3150 };
  }
  // Default 'play': level 1 mid-hunt, 3 found and ringed, 5 still hidden.
  world.startGame();
  state.found.add(LEVELS[0].diffs[0].id);
  state.found.add(LEVELS[0].diffs[1].id);
  state.found.add(LEVELS[0].diffs[4].id);
  state.score = 300;
  state.elapsed = 47;
  state.levelElapsed = 47;
  state.lastFoundLabel = LEVELS[0].diffs[4].label;
  state.screen = SCREEN_PLAY;
  return { screen: SCREEN_PLAY, best: 4200 };
}
