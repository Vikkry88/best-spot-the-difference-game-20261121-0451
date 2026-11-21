// The three hand-drawn scenes. Each scene is drawn twice: once plain (the original,
// left panel) and once with every difference applied (right panel). A difference is a
// small, fair change — a colour swapped, an object added, removed or moved — with a
// circular click zone in scene coordinates (560x440). All art is canvas shapes drawn
// here; there are no image files and no network requests.
//
// drawScene(ctx, level, changed, rng, timeMs): `changed` is a Set of difference ids
// to apply (empty for the original). `timeMs` animates water, lights and the wheel.

import { PANEL_H, PANEL_W } from './config.js';

export const LEVELS = [
  {
    name: 'Harbor Dawn',
    tagline: 'Sunrise over the fishing boats',
    diffs: [
      { id: 'sun', x: 78, y: 62, r: 38, label: 'The sun lost its rays' },
      { id: 'lighthouse', x: 452, y: 185, r: 58, label: 'Lighthouse stripes changed colour' },
      { id: 'sail', x: 232, y: 272, r: 42, label: 'The sail changed colour' },
      { id: 'gull', x: 322, y: 78, r: 30, label: 'An extra seagull appeared' },
      { id: 'roof', x: 143, y: 180, r: 40, label: 'A roof changed colour' },
      { id: 'flag', x: 376, y: 248, r: 28, label: 'The mast flag vanished' },
      { id: 'buoy', x: 492, y: 332, r: 30, label: 'The buoy changed colour' },
      { id: 'crate', x: 68, y: 334, r: 30, label: 'An extra crate appeared' },
    ],
  },
  {
    name: 'Market Noon',
    tagline: 'A busy square at lunchtime',
    diffs: [
      { id: 'awning', x: 140, y: 150, r: 44, label: 'The awning stripes changed colour' },
      { id: 'barrel', x: 490, y: 332, r: 36, label: 'A barrel went missing' },
      { id: 'apples', x: 282, y: 292, r: 36, label: 'The apples changed colour' },
      { id: 'lantern', x: 402, y: 108, r: 30, label: 'An extra lantern appeared' },
      { id: 'cat', x: 122, y: 372, r: 62, label: 'The cat moved' },
      { id: 'sign', x: 322, y: 172, r: 36, label: 'The shop sign changed' },
      { id: 'umbrella', x: 498, y: 182, r: 38, label: 'The umbrella changed colour' },
      { id: 'basket', x: 202, y: 382, r: 32, label: 'The basket vanished' },
    ],
  },
  {
    name: 'Night Fair',
    tagline: 'Lights, rides and candyfloss',
    diffs: [
      { id: 'moon', x: 80, y: 62, r: 36, label: 'The moon became full' },
      { id: 'cabin', x: 282, y: 86, r: 34, label: 'A ferris cabin changed colour' },
      { id: 'tentflag', x: 130, y: 182, r: 30, label: 'The tent flag vanished' },
      { id: 'balloon', x: 462, y: 92, r: 30, label: 'An extra balloon appeared' },
      { id: 'bulb', x: 202, y: 302, r: 32, label: 'A fairground bulb changed colour' },
      { id: 'horse', x: 382, y: 322, r: 38, label: 'The carousel horse changed colour' },
      { id: 'star', x: 502, y: 58, r: 28, label: 'A bright star vanished' },
      { id: 'boothsign', x: 302, y: 242, r: 36, label: 'The booth sign changed' },
    ],
  },
];

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function tri(ctx, x1, y1, x2, y2, x3, y3, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function cloud(ctx, x, y, s, fill) {
  circle(ctx, x, y, 18 * s, fill);
  circle(ctx, x + 20 * s, y + 3 * s, 14 * s, fill);
  circle(ctx, x - 20 * s, y + 4 * s, 13 * s, fill);
  rect(ctx, x - 30 * s, y, 60 * s, 12 * s, fill);
}

function gull(ctx, x, y, s) {
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.4 * s;
  ctx.beginPath();
  ctx.arc(x - 9 * s, y, 9 * s, Math.PI * 1.15, Math.PI * 1.95);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 9 * s, y, 9 * s, Math.PI * 1.05, Math.PI * 1.85);
  ctx.stroke();
}

function house(ctx, x, y, w, h, wall, roof) {
  rect(ctx, x, y, w, h, wall);
  tri(ctx, x - 6, y, x + w / 2, y - 26, x + w + 6, y, roof);
  rect(ctx, x + w / 2 - 8, y + h - 30, 16, 30, '#5b3a29');
  rect(ctx, x + 10, y + 14, 14, 14, '#ffe08a');
  rect(ctx, x + w - 24, y + 14, 14, 14, '#ffe08a');
}

function drawHarbor(ctx, d, rng, timeMs) {
  const sky = ctx.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, '#7dd3fc');
  sky.addColorStop(0.6, '#bae6fd');
  sky.addColorStop(1, '#fef3c7');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_W, 300);

  // Sun (difference: rays + colour)
  if (!d.has('sun')) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4;
      ctx.beginPath();
      ctx.moveTo(78 + Math.cos(a) * 30, 62 + Math.sin(a) * 30);
      ctx.lineTo(78 + Math.cos(a) * 44, 62 + Math.sin(a) * 44);
      ctx.stroke();
    }
    circle(ctx, 78, 62, 26, '#fde047');
  } else {
    circle(ctx, 78, 62, 26, '#fb923c');
  }

  cloud(ctx, 200, 52, 1, '#ffffff');
  cloud(ctx, 380, 38, 0.8, '#ffffff');
  cloud(ctx, 500, 66, 0.7, '#f8fafc');

  // Seagulls (difference: one extra)
  gull(ctx, 250, 92, 1);
  gull(ctx, 292, 70, 0.8);
  if (d.has('gull')) gull(ctx, 322, 78, 0.9);

  // Hills + houses row
  ctx.fillStyle = '#86c06c';
  ctx.beginPath();
  ctx.ellipse(120, 300, 220, 60, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#74b35e';
  ctx.beginPath();
  ctx.ellipse(430, 305, 240, 66, 0, Math.PI, 0);
  ctx.fill();
  house(ctx, 36, 196, 64, 62, '#fef3c7', '#b45309');
  house(ctx, 108, 188, 70, 70, '#fee2e2', d.has('roof') ? '#7c3aed' : '#c2410c');
  house(ctx, 188, 200, 58, 58, '#dbeafe', '#92400e');
  house(ctx, 258, 192, 62, 66, '#dcfce7', '#b45309');

  // Lighthouse (difference: stripe colour)
  const stripe = d.has('lighthouse') ? '#2563eb' : '#dc2626';
  rect(ctx, 430, 108, 44, 150, '#f8fafc');
  rect(ctx, 430, 130, 44, 22, stripe);
  rect(ctx, 430, 174, 44, 22, stripe);
  rect(ctx, 430, 218, 44, 22, stripe);
  rect(ctx, 424, 96, 56, 14, '#334155');
  circle(ctx, 452, 88, 12, '#fde047');
  tri(ctx, 424, 96, 452, 72, 480, 96, '#334155');
  rect(ctx, 444, 150, 16, 20, '#334155');

  // Sea
  const sea = ctx.createLinearGradient(0, 300, 0, PANEL_H);
  sea.addColorStop(0, '#38bdf8');
  sea.addColorStop(1, '#0369a1');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 300, PANEL_W, PANEL_H - 300);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const y = 318 + i * 17;
    const off = Math.sin(timeMs / 700 + i) * 6;
    ctx.beginPath();
    for (let x = 0; x <= PANEL_W; x += 28) {
      ctx.lineTo(x, y + Math.sin((x + off * 4) / 26) * 2.5);
    }
    ctx.stroke();
  }

  // Big boat with sail (difference: sail colour) + mast flag (difference: flag)
  rect(ctx, 150, 306, 130, 18, '#92400e');
  tri(ctx, 150, 306, 132, 306, 150, 324, '#78350f');
  tri(ctx, 280, 306, 300, 306, 280, 324, '#78350f');
  rect(ctx, 208, 224, 6, 84, '#5b3a29');
  tri(ctx, 214, 230, 214, 300, 268, 300, d.has('sail') ? '#14b8a6' : '#f8fafc');
  tri(ctx, 208, 236, 208, 300, 168, 300, '#e2e8f0');
  // Small boat with flag mast
  rect(ctx, 330, 322, 86, 14, '#0f766e');
  rect(ctx, 366, 240, 5, 84, '#5b3a29');
  tri(ctx, 371, 246, 371, 316, 410, 316, '#fef08a');
  if (!d.has('flag')) tri(ctx, 371, 240, 371, 256, 392, 248, '#ef4444');

  // Buoy (difference: colour)
  circle(ctx, 492, 332, 15, d.has('buoy') ? '#22c55e' : '#ef4444');
  rect(ctx, 488, 306, 8, 14, '#334155');
  circle(ctx, 492, 302, 5, '#fde047');

  // Dock + crates (difference: one extra crate)
  rect(ctx, 0, 386, 190, 16, '#a16207');
  rect(ctx, 12, 402, 12, 30, '#854d0e');
  rect(ctx, 150, 402, 12, 30, '#854d0e');
  rect(ctx, 30, 350, 36, 36, '#d97706');
  rect(ctx, 30, 350, 36, 8, '#92400e');
  rect(ctx, 70, 350, 36, 36, '#f59e0b');
  rect(ctx, 70, 350, 36, 8, '#92400e');
  if (d.has('crate')) {
    rect(ctx, 50, 316, 36, 36, '#b45309');
    rect(ctx, 50, 316, 36, 8, '#78350f');
  }
  // Barrels on dock (decoration)
  circle(ctx, 140, 368, 16, '#0ea5e9');
  circle(ctx, 170, 372, 13, '#f43f5e');
  void rng;
}

function stall(ctx, x, y, awningA, awningB) {
  rect(ctx, x, y + 60, 150, 90, '#b45309');
  rect(ctx, x + 8, y + 70, 134, 16, '#92400e');
  for (let i = 0; i < 6; i++) {
    rect(ctx, x - 6 + i * 27, y, 27, 34, i % 2 === 0 ? awningA : awningB);
  }
  rect(ctx, x + 4, y + 34, 8, 40, '#78350f');
  rect(ctx, x + 138, y + 34, 8, 40, '#78350f');
}

function drawMarket(ctx, d, rng, timeMs) {
  const sky = ctx.createLinearGradient(0, 0, 0, 240);
  sky.addColorStop(0, '#fde68a');
  sky.addColorStop(1, '#fef9c3');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_W, 240);
  circle(ctx, 520, 44, 24, '#facc15');
  cloud(ctx, 90, 44, 0.9, '#ffffff');
  cloud(ctx, 300, 34, 0.7, '#ffffff');

  // Background buildings
  house(ctx, 20, 120, 90, 110, '#fde68a', '#b45309');
  house(ctx, 420, 110, 100, 120, '#fecaca', '#991b1b');
  rect(ctx, 230, 130, 100, 100, '#bfdbfe');
  tri(ctx, 224, 130, 280, 100, 336, 130, '#1e40af');

  // Lantern string (difference: one extra lantern)
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(330, 78);
  ctx.quadraticCurveTo(402, 104, 474, 78);
  ctx.stroke();
  const lantern = (x, y, c) => {
    rect(ctx, x - 10, y, 20, 26, c);
    rect(ctx, x - 12, y - 4, 24, 6, '#78350f');
    rect(ctx, x - 12, y + 26, 24, 5, '#78350f');
  };
  lantern(356, 90, '#f43f5e');
  lantern(448, 90, '#f59e0b');
  if (d.has('lantern')) lantern(402, 98, '#22c55e');

  // Ground
  rect(ctx, 0, 300, PANEL_W, PANEL_H - 300, '#d6b48a');
  ctx.fillStyle = '#c4a276';
  for (let i = 0; i < 5; i++) ctx.fillRect(0, 322 + i * 24, PANEL_W, 3);

  // Main stall (difference: awning colour) + apple pile (difference: apple colour)
  stall(ctx, 66, 150, d.has('awning') ? '#2563eb' : '#dc2626', '#f8fafc');
  const apple = d.has('apples') ? '#84cc16' : '#ef4444';
  for (const [ax, ay] of [[252, 300], [274, 300], [296, 300], [263, 282], [285, 282], [274, 266]]) {
    circle(ctx, ax, ay, 12, apple);
    rect(ctx, ax - 1, ay - 16, 3, 6, '#78350f');
  }
  rect(ctx, 238, 306, 86, 14, '#92400e');
  // Oranges + greens (decoration)
  for (const [ox, oy] of [[96, 292], [118, 292], [107, 276]]) circle(ctx, ox, oy, 11, '#fb923c');
  for (const [gx, gy] of [[160, 292], [182, 292], [171, 276]]) circle(ctx, gx, gy, 11, '#22c55e');

  // Shop sign (difference: fish vs bread)
  rect(ctx, 296, 146, 52, 52, '#fef3c7');
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.strokeRect(296, 146, 52, 52);
  if (!d.has('sign')) {
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(320, 172, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    tri(ctx, 334, 172, 344, 163, 344, 181, '#0284c7');
    circle(ctx, 312, 170, 2.5, '#ffffff');
  } else {
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(322, 174, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(312, 168);
    ctx.lineTo(316, 176);
    ctx.moveTo(320, 166);
    ctx.lineTo(324, 174);
    ctx.moveTo(328, 168);
    ctx.lineTo(332, 176);
    ctx.stroke();
  }

  // Umbrella (difference: colour)
  rect(ctx, 494, 196, 6, 90, '#78350f');
  ctx.fillStyle = d.has('umbrella') ? '#ec4899' : '#eab308';
  ctx.beginPath();
  ctx.arc(497, 196, 46, Math.PI, 0);
  ctx.fill();
  circle(ctx, 497, 146, 5, '#78350f');

  // Barrels (difference: one missing)
  const barrel = (x, y) => {
    rect(ctx, x, y, 34, 44, '#a16207');
    rect(ctx, x, y + 8, 34, 5, '#713f12');
    rect(ctx, x, y + 30, 34, 5, '#713f12');
    ctx.beginPath();
    ctx.ellipse(x + 17, y, 17, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ca8a04';
    ctx.fill();
  };
  barrel(452, 310);
  if (!d.has('barrel')) barrel(490, 310);

  // Cat (difference: moved)
  const catX = d.has('cat') ? 150 : 92;
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.ellipse(catX, 380, 22, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, catX + 20, 368, 11, '#f97316');
  tri(ctx, catX + 12, 362, catX + 15, 352, catX + 19, 362, '#f97316');
  tri(ctx, catX + 22, 362, catX + 26, 352, catX + 29, 362, '#f97316');
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(catX - 20, 378);
  ctx.quadraticCurveTo(catX - 34, 360, catX - 28, 348);
  ctx.stroke();
  circle(ctx, catX + 24, 367, 2, '#111827');

  // Basket (difference: present vs absent)
  if (!d.has('basket')) {
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(180, 378);
    ctx.lineTo(224, 378);
    ctx.lineTo(216, 404);
    ctx.lineTo(188, 404);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(202, 378, 18, Math.PI, 0);
    ctx.stroke();
    circle(ctx, 194, 374, 8, '#a855f7');
    circle(ctx, 210, 374, 8, '#ef4444');
  }
  void rng;
  void timeMs;
}

function drawFair(ctx, d, rng, timeMs) {
  const sky = ctx.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, '#1e1b4b');
  sky.addColorStop(1, '#3730a3');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_W, 300);

  // Stars (seeded decoration; one bright star is a difference)
  const starRng = rng;
  for (let i = 0; i < 46; i++) {
    const sx = starRng.range(6, PANEL_W - 6);
    const sy = starRng.range(6, 220);
    circle(ctx, sx, sy, starRng.range(1, 2.4), 'rgba(255,255,255,0.85)');
  }
  if (!d.has('star')) {
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? 13 : 5.5;
      const px = 502 + Math.cos(a) * rr;
      const py = 58 + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Moon (difference: crescent vs full)
  circle(ctx, 80, 62, 24, '#fef9c3');
  if (!d.has('moon')) circle(ctx, 92, 54, 20, '#1e1b4b');

  // Ferris wheel (difference: top cabin colour); wheel turns slowly
  const cx = 282;
  const cy = 170;
  const R = 92;
  const turn = (timeMs / 9000) % (Math.PI * 2);
  ctx.strokeStyle = '#c7d2fe';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  const cabinColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#14b8a6', '#f43f5e'];
  for (let i = 0; i < 8; i++) {
    const a = turn + (i / 8) * Math.PI * 2;
    const px = cx + Math.cos(a) * R;
    const py = cy + Math.sin(a) * R;
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
    const color = cabinColors[i];
    rect(ctx, px - 11, py - 4, 22, 17, color);
    rect(ctx, px - 13, py - 9, 26, 6, '#e0e7ff');
  }
  // Fixed top cabin marker for the difference zone (drawn at the top of the wheel)
  rect(ctx, cx - 11, cy - R - 6, 22, 17, d.has('cabin') ? '#facc15' : '#ef4444');
  rect(ctx, cx - 13, cy - R - 11, 26, 6, '#e0e7ff');
  circle(ctx, cx, cy, 10, '#fde047');
  tri(ctx, cx - 44, 320, cx, cy, cx + 44, 320, 'rgba(99,102,241,0.35)');

  // Ground
  rect(ctx, 0, 300, PANEL_W, PANEL_H - 300, '#312e81');
  rect(ctx, 0, 300, PANEL_W, 6, '#4f46e5');

  // Tent (difference: flag)
  tri(ctx, 40, 300, 122, 190, 204, 300, '#e11d48');
  tri(ctx, 84, 300, 122, 190, 160, 300, '#f8fafc');
  tri(ctx, 100, 300, 122, 244, 144, 300, '#1e1b4b');
  rect(ctx, 120, 168, 4, 24, '#e2e8f0');
  if (!d.has('tentflag')) tri(ctx, 124, 168, 124, 182, 146, 175, '#facc15');

  // Balloons (difference: one extra)
  const balloon = (x, y, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, y, 14, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y + 17);
    ctx.quadraticCurveTo(x + 5, y + 32, x, y + 46);
    ctx.stroke();
  };
  balloon(428, 96, '#38bdf8');
  balloon(496, 112, '#f43f5e');
  if (d.has('balloon')) balloon(462, 88, '#facc15');

  // String lights (difference: one bulb colour)
  ctx.strokeStyle = '#e0e7ff';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(30, 282);
  ctx.quadraticCurveTo(280, 330, 530, 282);
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const bx = 30 + t * 500;
    const by = 282 + Math.sin(t * Math.PI) * 34 + 6;
    let c = i % 2 === 0 ? '#fde047' : '#f9a8d4';
    if (i === 3) c = d.has('bulb') ? '#22d3ee' : '#fde047';
    circle(ctx, bx, by, 6, c);
  }

  // Booth + sign (difference: star vs heart)
  rect(ctx, 258, 262, 88, 66, '#7c2d12');
  rect(ctx, 250, 250, 104, 16, '#b45309');
  rect(ctx, 284, 210, 36, 36, '#fef3c7');
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.strokeRect(284, 210, 36, 36);
  if (!d.has('boothsign')) {
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? 11 : 4.6;
      const px = 302 + Math.cos(a) * rr;
      const py = 228 + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(302, 238);
    ctx.bezierCurveTo(288, 226, 290, 214, 298, 216);
    ctx.bezierCurveTo(301, 217, 302, 220, 302, 222);
    ctx.bezierCurveTo(302, 220, 303, 217, 306, 216);
    ctx.bezierCurveTo(314, 214, 316, 226, 302, 238);
    ctx.fill();
  }

  // Carousel horse (difference: colour)
  rect(ctx, 352, 268, 6, 84, '#e2e8f0');
  const horse = d.has('horse') ? '#f9a8d4' : '#f8fafc';
  ctx.fillStyle = horse;
  ctx.beginPath();
  ctx.ellipse(384, 324, 30, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(410, 306, 11, 15, -0.5, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, 418, 296, 9, horse);
  rect(ctx, 362, 336, 6, 18, horse);
  rect(ctx, 398, 336, 6, 18, horse);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(356, 318);
  ctx.quadraticCurveTo(344, 330, 348, 344);
  ctx.stroke();
  rect(ctx, 374, 312, 20, 10, '#dc2626');
  circle(ctx, 420, 295, 2, '#111827');
}

const DRAWERS = [drawHarbor, drawMarket, drawFair];

export function drawScene(ctx, levelIndex, changed, rng, timeMs) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, PANEL_W, PANEL_H);
  ctx.clip();
  DRAWERS[levelIndex](ctx, changed, rng, timeMs);
  ctx.restore();
}
