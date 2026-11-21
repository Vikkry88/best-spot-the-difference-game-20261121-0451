// Twin Harbor — Spot the Difference: shared constants.
// The whole game is drawn on one 1280x720 logical canvas, letterboxed to the window.
// Each scene panel is PANEL_W x PANEL_H in scene coordinates; differences are placed
// in those coordinates and hit-tested against them, so clicks work at any window size.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const PANEL_W = 560;
export const PANEL_H = 440;
export const PANEL_Y = 150;
export const PANEL_LEFT_X = 48;
export const PANEL_RIGHT_X = 672;

export const POINTS_PER_FIND = 100;
export const WRONG_TIME_PENALTY = 5; // seconds added to the clock on a wrong click
export const HINTS_PER_LEVEL = 3;
export const HINT_SCORE_COST = 30;
export const HINT_PULSE_MS = 1600;

export const BEST_KEY = 'twin-harbor-best-v1';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_COMPLETE = 'complete';
