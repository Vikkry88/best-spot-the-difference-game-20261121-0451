// Drawing only: world state in, pixels out. The 1280x720 logical view is letterboxed
// to the window. Both scene panels are drawn from scenes.js — the left plain, the right
// with every difference applied — then found-difference rings are painted on BOTH
// panels, with the found/remaining counter, score and clock in the header.

import {
  PANEL_H,
  PANEL_LEFT_X,
  PANEL_RIGHT_X,
  PANEL_W,
  PANEL_Y,
  SCREEN_CLEAR,
  SCREEN_COMPLETE,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  VIEW_H,
  VIEW_W,
} from './config.js';
import { LEVELS, drawScene } from './scenes.js';
import { createRandom } from './random.js';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const HINT_BTN = { id: 'hint', x: 1046, y: 86, w: 186, h: 44 };
export const START_BTN = { id: 'start', x: 490, y: 500, w: 300, h: 64 };
export const NEXT_BTN = { id: 'next', x: 490, y: 470, w: 300, h: 64 };
export const AGAIN_BTN = { id: 'again', x: 490, y: 500, w: 300, h: 64 };

export function buttonsFor(state) {
  if (state.screen === SCREEN_PLAY) return [HINT_BTN];
  if (state.screen === SCREEN_TITLE) return [START_BTN];
  if (state.screen === SCREEN_CLEAR) return [NEXT_BTN];
  if (state.screen === SCREEN_COMPLETE) return [AGAIN_BTN];
  return [];
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const decorRng = createRandom(20261121);

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view.scale = Math.min(canvas.width / VIEW_W, canvas.height / VIEW_H);
    view.x = (canvas.width - VIEW_W * view.scale) / 2;
    view.y = (canvas.height - VIEW_H * view.scale) / 2;
  }

  function text(value, x, y, size, color, align = 'left', weight = '600') {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  function drawButton(btn, label, enabled = true) {
    roundRect(btn.x, btn.y, btn.w, btn.h, 12, enabled ? '#f59e0b' : '#475569');
    ctx.strokeStyle = enabled ? '#fde68a' : '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 12);
    ctx.stroke();
    text(label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1, btn.h > 50 ? 26 : 20, '#1c1005', 'center', '800');
  }

  function drawPanel(state, panelX, changed, nowMs) {
    ctx.save();
    ctx.translate(panelX, PANEL_Y);
    // Fresh decor RNG per panel so both pictures share identical decoration.
    drawScene(ctx, state.levelIndex, changed, createRandom(20261121), nowMs);
    ctx.restore();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(panelX, PANEL_Y, PANEL_W, PANEL_H);

    const diffs = LEVELS[state.levelIndex].diffs;
    for (const diff of diffs) {
      const cx = panelX + diff.x;
      const cy = PANEL_Y + diff.y;
      if (state.found.has(diff.id)) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, diff.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(34,197,94,0.35)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, diff.r + 4, 0, Math.PI * 2);
        ctx.stroke();
        // check badge
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(cx + diff.r * 0.72, cy - diff.r * 0.72, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + diff.r * 0.72 - 5, cy - diff.r * 0.72);
        ctx.lineTo(cx + diff.r * 0.72 - 1, cy - diff.r * 0.72 + 4);
        ctx.lineTo(cx + diff.r * 0.72 + 5, cy - diff.r * 0.72 - 4);
        ctx.stroke();
      } else if (state.hintId === diff.id && nowMs < state.hintUntil) {
        const phase = (nowMs % 520) / 520;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, diff.r * (0.55 + phase * 0.6), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (state.wrongFlash && nowMs < state.wrongFlash.until) {
      const panel = panelX === PANEL_LEFT_X ? 0 : 1;
      if (state.wrongFlash.panel === panel) {
        const fx = panelX + state.wrongFlash.x;
        const fy = PANEL_Y + state.wrongFlash.y;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(fx - 13, fy - 13);
        ctx.lineTo(fx + 13, fy + 13);
        ctx.moveTo(fx + 13, fy - 13);
        ctx.lineTo(fx - 13, fy + 13);
        ctx.stroke();
      }
    }
  }

  function drawHeader(state, muted) {
    const level = LEVELS[state.levelIndex];
    const total = level.diffs.length;
    const found = state.found.size;
    const remain = total - found;

    roundRect(24, 16, VIEW_W - 48, 118, 16, '#16213c');
    text('TWIN HARBOR', 48, 44, 30, '#fde68a', 'left', '900');
    text(`Level ${state.levelIndex + 1} of ${LEVELS.length} · ${level.name}`, 48, 78, 19, '#cbd5e1', 'left');
    text(level.tagline, 48, 104, 16, '#94a3b8', 'left', '400');

    // The counter the whole game turns on: found vs remaining, impossible to miss.
    roundRect(430, 30, 420, 58, 14, '#0b1220');
    text(`Found ${found} of ${total}  ·  ${remain} remain`, 640, 60, 27, '#ffffff', 'center', '900');
    for (let i = 0; i < total; i++) {
      ctx.fillStyle = i < found ? '#22c55e' : '#334155';
      ctx.beginPath();
      ctx.arc(640 - ((total - 1) * 22) / 2 + i * 22, 104, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    text(`Score ${state.score}`, 1010, 44, 24, '#ffffff', 'right', '800');
    text(`Time ${fmtTime(state.elapsed)}`, 1010, 76, 20, '#cbd5e1', 'right');
    text(muted ? 'Sound: OFF (M)' : 'Sound: ON (M)', 1010, 104, 15, '#94a3b8', 'right', '400');
    if (state.screen === SCREEN_PLAY) {
      drawButton(HINT_BTN, `HINT (${state.hintsLeft})`, state.hintsLeft > 0);
    }
  }

  function drawOverlayPanel(title, lines, btn, btnLabel) {
    ctx.fillStyle = 'rgba(5,10,24,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    roundRect(330, 150, 620, 420, 20, '#16213c');
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(330, 150, 620, 420, 20);
    ctx.stroke();
    text(title, 640, 215, 44, '#fde68a', 'center', '900');
    lines.forEach((line, i) => {
      text(line, 640, 272 + i * 36, 21, '#e2e8f0', 'center', i === 0 ? '700' : '400');
    });
    if (btn) drawButton(btn, btnLabel);
  }

  function draw(state, best, muted, nowMs) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    let shakeX = 0;
    if (nowMs < state.shakeUntil) shakeX = Math.sin(nowMs / 18) * 6;
    ctx.translate(shakeX, 0);

    drawHeader(state, muted);
    const allDiffs = new Set(LEVELS[state.levelIndex].diffs.map((diff) => diff.id));
    drawPanel(state, PANEL_LEFT_X, new Set(), nowMs);
    drawPanel(state, PANEL_RIGHT_X, allDiffs, nowMs);
    text('ORIGINAL', PANEL_LEFT_X + PANEL_W / 2, PANEL_Y - 14, 17, '#94a3b8', 'center', '800');
    text('SPOT THE CHANGES', PANEL_RIGHT_X + PANEL_W / 2, PANEL_Y - 14, 17, '#fde68a', 'center', '800');

    if (state.lastFoundLabel && state.screen === SCREEN_PLAY) {
      text(`✓ ${state.lastFoundLabel}`, 640, PANEL_Y + PANEL_H + 34, 20, '#4ade80', 'center', '700');
    }
    if (state.crosshair && state.screen === SCREEN_PLAY) {
      const { x, y } = state.crosshair;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 24, y);
      ctx.lineTo(x - 8, y);
      ctx.moveTo(x + 8, y);
      ctx.lineTo(x + 24, y);
      ctx.moveTo(x, y - 24);
      ctx.lineTo(x, y - 8);
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x, y + 24);
      ctx.stroke();
    }
    text('Click a difference in either picture · Arrows + Enter also work · H = hint · P = pause · M = mute · Wrong click: +5s', 640, VIEW_H - 26, 16, '#64748b', 'center', '400');

    if (state.screen === SCREEN_TITLE) {
      drawOverlayPanel(
        'TWIN HARBOR',
        [
          'Spot the Difference',
          'Two pictures look the same — but they are not.',
          'Find all 8 differences in each scene. Click either picture.',
          'Wrong clicks add 5 seconds. Hints cost 30 points.',
          '3 scenes: Harbor Dawn · Market Noon · Night Fair',
          best > 0 ? `Best score: ${best}` : 'No best score yet — set one!',
        ],
        START_BTN,
        '▶  START',
      );
    } else if (state.screen === SCREEN_CLEAR) {
      drawOverlayPanel(
        'LEVEL COMPLETE!',
        [
          `${LEVELS[state.levelIndex].name} — all differences found`,
          `Time bonus: +${state.levelBonus}`,
          `Score so far: ${state.score}`,
          `Time so far: ${fmtTime(state.elapsed)} · Mistakes: ${state.mistakes}`,
          `Next: ${LEVELS[state.levelIndex + 1].name}`,
        ],
        NEXT_BTN,
        'NEXT SCENE →',
      );
    } else if (state.screen === SCREEN_COMPLETE) {
      drawOverlayPanel(
        '🏆 YOU FOUND THEM ALL!',
        [
          'Every difference in all 3 scenes — sharp eyes!',
          `Final score: ${state.score}`,
          `Total time: ${fmtTime(state.elapsed)} · Mistakes: ${state.mistakes}`,
          best > 0 ? `Best score: ${best}` : '',
          'Thanks for playing Twin Harbor.',
        ],
        AGAIN_BTN,
        '↻  PLAY AGAIN',
      );
    } else if (state.screen === SCREEN_PAUSED) {
      drawOverlayPanel('PAUSED', ['Take your time.', 'Press P or click to keep hunting.'], null, '');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  void decorRng;
  return { draw };
}
