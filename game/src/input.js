// Mouse + keyboard input. Mouse positions are converted from window pixels into the
// game's 1280x720 logical coordinates using the same letterbox transform the renderer
// uses, so a click lands exactly where the player sees the picture.

import { VIEW_H, VIEW_W } from './config.js';

export function viewTransform(canvas) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
  const offsetX = (rect.width - VIEW_W * scale) / 2;
  const offsetY = (rect.height - VIEW_H * scale) / 2;
  return { rect, scale, offsetX, offsetY };
}

export function toLogical(canvas, clientX, clientY) {
  const { rect, scale, offsetX, offsetY } = viewTransform(canvas);
  return {
    x: (clientX - rect.left - offsetX) / scale,
    y: (clientY - rect.top - offsetY) / scale,
  };
}

export function createInput(canvas) {
  const clicks = [];
  const keys = [];

  canvas.addEventListener('pointerdown', (event) => {
    const p = toLogical(canvas, event.clientX, event.clientY);
    clicks.push(p);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.push(event.key.toLowerCase());
    if (event.key === ' ') event.preventDefault();
  });

  return {
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    takeKeys() {
      return keys.splice(0, keys.length);
    },
  };
}
