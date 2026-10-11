// Moonmeadow Ranch — the farm map, collision and world rendering.
'use strict';

const MAP_W = 48, MAP_H = 36;
const G_GRASS = 0, G_PATH = 1, G_WATER = 2, G_FIELD = 3;

const LAYOUT = {
  house:   { x: 4, y: 3, w: 5, h: 3, door: [6, 5] },
  stable:  { x: 34, y: 8, w: 6, h: 3, door: [[36, 10], [37, 10]] },
  silo:    { x: 31, y: 9, w: 2, h: 2 },
  trough:  { x: 31, y: 13, w: 2, h: 1 },
  bin:     { x: 10, y: 6 },
  stall:   { x: 26, y: 27, w: 4, h: 2 },
  sign:    { x: 22, y: 28 },
  field:   { x: 3, y: 10, w: 17, h: 13 },
  pasture: { x: 29, y: 11, w: 16, h: 14, gate: [[29, 17], [29, 18]], doorGap: [[36, 11], [37, 11]] },
  lamps: [[3, 6], [23, 30], [28, 15]],
};
// The fenced area unicorns may roam (inside the fence).
const PASTURE_INNER = { x0: 30, y0: 12, x1: 43, y1: 23 };

const world = {
  ground: new Uint8Array(MAP_W * MAP_H),
  solid: new Uint8Array(MAP_W * MAP_H),
  fence: new Uint8Array(MAP_W * MAP_H),
  variant: new Uint8Array(MAP_W * MAP_H),
  flowers: new Uint8Array(MAP_W * MAP_H),
  statics: [],
  interact: new Map(), // tile index -> interaction name
};

const idx = (x, y) => y * MAP_W + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;

function buildWorld() {
  const rnd = ART.rng(20261011);
  const { ground, solid, fence, variant, flowers } = world;
  ground.fill(G_GRASS); solid.fill(0); fence.fill(0); flowers.fill(0);
  world.statics = []; world.interact.clear();
  for (let i = 0; i < variant.length; i++) variant[i] = Math.floor(rnd() * 4);

  const setG = (x, y, g) => { if (inMap(x, y)) ground[idx(x, y)] = g; };
  const fillG = (x0, y0, w, h, g) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) setG(x, y, g); };
  const block = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (inMap(x, y)) solid[idx(x, y)] = 1; };
  const tag = (x, y, name) => world.interact.set(idx(x, y), name);

  // Paths
  fillG(6, 6, 1, 2, G_PATH);
  fillG(2, 7, 32, 1, G_PATH);
  fillG(24, 7, 2, 29, G_PATH);
  fillG(26, 17, 3, 2, G_PATH);
  fillG(22, 29, 10, 3, G_PATH);
  fillG(10, 7, 1, 1, G_PATH);

  // Pond
  fillG(14, 2, 4, 1, G_WATER); fillG(13, 3, 6, 2, G_WATER); fillG(14, 5, 4, 1, G_WATER);
  // Field
  const F = LAYOUT.field;
  fillG(F.x, F.y, F.w, F.h, G_FIELD);

  // Border woods
  for (let x = 0; x < MAP_W; x++) for (let y = 0; y < MAP_H; y++) {
    if (x < 2 || x >= MAP_W - 2 || y < 2 || y >= MAP_H - 2) solid[idx(x, y)] = 1;
  }
  const treeAt = (x, y, kind) => {
    world.statics.push({ type: 'tree', tx: x, ty: y, kind, sortY: (y + 1) * TILE });
    if (inMap(x, y)) solid[idx(x, y)] = 1;
  };
  for (let x = 0; x < MAP_W; x += 2) {
    treeAt(x + (x % 4 ? 1 : 0), 1, rnd() < 0.3 ? 'blossom' : 'oak');
    treeAt(x, 0, 'oak');
    if (x !== 24) treeAt(x + 1, MAP_H - 1, rnd() < 0.3 ? 'blossom' : 'oak');
    if (x < 22 || x > 26) treeAt(x, MAP_H - 2, rnd() < 0.3 ? 'blossom' : 'oak');
  }
  for (let y = 3; y < MAP_H - 2; y += 2) {
    treeAt(0, y, 'oak'); treeAt(1, y + 1, rnd() < 0.3 ? 'blossom' : 'oak');
    treeAt(MAP_W - 1, y, 'oak'); treeAt(MAP_W - 2, y + 1, rnd() < 0.3 ? 'blossom' : 'oak');
  }
  // Decorative trees and bushes
  [[21, 11, 'blossom'], [22, 21, 'oak'], [11, 26, 'oak'], [5, 28, 'blossom'], [17, 30, 'oak'], [35, 29, 'blossom'],
   [41, 30, 'oak'], [20, 26, 'blossom'], [8, 32, 'oak'], [42, 22, 'blossom'], [21, 3, 'oak'], [27, 3, 'blossom'],
   [41, 4, 'oak'], [45, 27, 'oak'], [31, 32, 'oak']].forEach(([x, y, k]) => treeAt(x, y, k));
  [[12, 9], [20, 9], [27, 10], [44, 6], [3, 25], [14, 32], [29, 33], [43, 32], [20, 5], [11, 3], [33, 3], [38, 26]].forEach(([x, y]) => {
    world.statics.push({ type: 'bush', tx: x, ty: y, sortY: (y + 1) * TILE }); solid[idx(x, y)] = 1;
  });

  // House
  // Buildings: solid footprint, every footprint tile interactive, and a click area matching the drawn sprite.
  const building = (type, x, y, w, h, name, spriteW, spriteH, offX = 0) => {
    block(x, y, w, h);
    const tiles = [];
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { tiles.push([xx, yy]); tag(xx, yy, name); }
    const rect = [x * TILE + offX, (y + h) * TILE - spriteH, spriteW, spriteH];
    world.statics.push({ type, tx: x, ty: y, sortY: (y + h) * TILE, tiles, rect });
  };
  const Hs = LAYOUT.house, S = LAYOUT.stable, Si = LAYOUT.silo, T = LAYOUT.trough, B = LAYOUT.bin, M = LAYOUT.stall, Sg = LAYOUT.sign;
  building('house', Hs.x, Hs.y, Hs.w, Hs.h, 'door', 80, 74);
  building('stable', S.x, S.y, S.w, S.h, 'stable', 96, 84);
  building('silo', Si.x, Si.y, Si.w, Si.h, 'silo', 32, 62);
  building('trough', T.x, T.y, T.w, T.h, 'trough', 32, 16);
  building('bin', B.x, B.y, 1, 1, 'bin', 16, 16);
  building('stall', M.x, M.y, M.w, M.h, 'shop', 66, 72, -1);
  building('sign', Sg.x, Sg.y, 1, 1, 'sign', 18, 20, -1);
  // Lamps
  LAYOUT.lamps.forEach(([x, y]) => {
    block(x, y, 1, 1);
    world.statics.push({ type: 'lamp', tx: x, ty: y, sortY: (y + 1) * TILE });
  });

  // Pasture fence
  const P = LAYOUT.pasture;
  const gaps = new Set([...P.gate, ...P.doorGap].map(([x, y]) => idx(x, y)));
  for (let x = P.x; x < P.x + P.w; x++) for (let y = P.y; y < P.y + P.h; y++) {
    const edge = x === P.x || x === P.x + P.w - 1 || y === P.y || y === P.y + P.h - 1;
    if (!edge || gaps.has(idx(x, y))) continue;
    fence[idx(x, y)] = 1; solid[idx(x, y)] = 1;
  }
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (!fence[idx(x, y)]) continue;
    world.statics.push({ type: 'fence', tx: x, ty: y, sortY: (y + 1) * TILE - 4 });
  }

  // Water is solid; flowers sprinkle the grass.
  for (let i = 0; i < ground.length; i++) {
    if (ground[i] === G_WATER) solid[i] = 1;
    if (ground[i] === G_GRASS && !solid[i] && rnd() < 0.1) flowers[i] = 1 + Math.floor(rnd() * 3);
  }
}

// Dynamic obstacles (stones and weeds) live in the save state.
function objAt(x, y) { return state.objs[idx(x, y)]; }
function soilAt(x, y) { return state.soil[idx(x, y)]; }

function tileBlocked(x, y) {
  if (!inMap(x, y)) return true;
  const i = idx(x, y);
  if (world.solid[i]) return true;
  const o = state.objs[i];
  return o === 'rock' || o === 'weed';
}

function inPasture(x, y) {
  return x >= PASTURE_INNER.x0 && x <= PASTURE_INNER.x1 && y >= PASTURE_INNER.y0 && y <= PASTURE_INNER.y1;
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

function fenceMask(x, y) {
  const f = (a, b) => inMap(a, b) && world.fence[idx(a, b)];
  return (f(x, y - 1) ? 1 : 0) | (f(x + 1, y) ? 2 : 0) | (f(x, y + 1) ? 4 : 0) | (f(x - 1, y) ? 8 : 0);
}

function drawGround(ctx, x0, y0, x1, y1, season, t) {
  const waterFrame = Math.floor(t / 600) % 4;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!inMap(x, y)) continue;
    const i = idx(x, y), g = world.ground[i], v = world.variant[i];
    const px = x * TILE, py = y * TILE;
    if (g === G_PATH) ctx.drawImage(ART.path(season, v), px, py);
    else if (g === G_FIELD) ctx.drawImage(ART.field(v), px, py);
    else if (g === G_WATER) {
      ctx.drawImage(ART.water(waterFrame), px, py);
      const land = (a, b) => inMap(a, b) && world.ground[idx(a, b)] !== G_WATER;
      const L = land(x - 1, y), R = land(x + 1, y), U = land(x, y - 1), D = land(x, y + 1);
      const grassCol = SEASON_PAL[season].g, bank = '#3f8fc4';
      ctx.fillStyle = bank;
      if (U) { ctx.fillRect(px, py, 16, 2); ctx.fillStyle = '#d8f3ff'; ctx.fillRect(px, py + 2, 16, 1); ctx.fillStyle = bank; }
      if (D) ctx.fillRect(px, py + 15, 16, 1);
      if (L) ctx.fillRect(px, py, 1, 16);
      if (R) ctx.fillRect(px + 15, py, 1, 16);
      // Round off outside corners so the pond reads as a pond, not a plus sign.
      const corner = (cx, cy, sx, sy) => {
        ctx.fillStyle = grassCol;
        [[0, 0, 5], [0, 1, 3], [0, 2, 2], [0, 3, 1], [0, 4, 1]].forEach(([ox, oy, w]) => ctx.fillRect(sx > 0 ? cx : cx - w + 1, cy + oy * sy, w, 1));
        ctx.fillStyle = bank;
        [[5, 0], [3, 1], [4, 1], [2, 2], [1, 3], [1, 4]].forEach(([ox, oy]) => ctx.fillRect(cx + ox * sx, cy + oy * sy, 1, 1));
      };
      if (U && L) corner(px, py, 1, 1);
      if (U && R) corner(px + 15, py, -1, 1);
      if (D && L) corner(px, py + 15, 1, -1);
      if (D && R) corner(px + 15, py + 15, -1, -1);
      if (v === 0 && !U && !L) {
        ctx.fillStyle = '#5aae50'; ctx.fillRect(px + 4, py + 6, 6, 3); ctx.fillRect(px + 5, py + 5, 4, 5);
        ctx.fillStyle = '#86cc6a'; ctx.fillRect(px + 5, py + 6, 2, 1);
        if (season !== 'winter') { ctx.fillStyle = '#ffb3dd'; ctx.fillRect(px + 8, py + 5, 2, 2); }
      }
    } else {
      ctx.drawImage(ART.grass(season, v), px, py);
      if (world.flowers[i]) ctx.drawImage(ART.flowers(season, world.flowers[i]), px, py);
    }
    const s = state.soil[i];
    if (s) {
      ctx.drawImage(ART.soil(s.wet ? 1 : 0), px, py);
      if (s.fert) { ctx.fillStyle = '#e3d0ff'; ctx.fillRect(px + 3, py + 13, 1, 1); ctx.fillRect(px + 12, py + 4, 1, 1); ctx.fillRect(px + 9, py + 10, 1, 1); }
    }
  }
}

function cropStage(c) {
  if (c.dead) return 4;
  const crop = CROPS[c.id];
  if (c.age >= crop.days) return 3;
  if (c.age === 0) return 0;
  return c.age < crop.days / 2 ? 1 : 2;
}

function drawStatic(ctx, s, season, night, t) {
  const px = s.tx * TILE, py = s.ty * TILE;
  switch (s.type) {
    case 'tree': ctx.drawImage(ART.tree(s.kind, season), px - 8, py + TILE - 40); break;
    case 'bush': ctx.drawImage(ART.bush(season), px, py); break;
    case 'fence': ctx.drawImage(ART.fence(fenceMask(s.tx, s.ty)), px, py); break;
    case 'house': ctx.drawImage(ART.house(season, night), px, (s.ty + 3) * TILE - 74); break;
    case 'stable': ctx.drawImage(ART.stable(season, night), px, (s.ty + 3) * TILE - 84); break;
    case 'silo': ctx.drawImage(ART.silo(season), px, (s.ty + 2) * TILE - 62); break;
    case 'bin': ctx.drawImage(ART.bin(), px, py); break;
    case 'sign': ctx.drawImage(ART.sign(), px - 1, py - 4); break;
    case 'lamp': ctx.drawImage(ART.lamp(night), px + 3, py + TILE - 30); break;
    case 'trough': {
      ctx.drawImage(ART.trough(), px, py);
      const slots = state.stableCap, filled = state.trough;
      const w = 26 / slots;
      for (let i = 0; i < slots; i++) {
        if (i >= filled) continue;
        const hx = px + 3 + i * w;
        ctx.fillStyle = '#f2d27a'; ctx.fillRect(hx, py + 3, Math.max(2, w - 1), 4);
        ctx.fillStyle = '#ffe9a3'; ctx.fillRect(hx + 1, py + 2, Math.max(1, w - 3), 1);
      }
      break;
    }
    case 'stall': {
      const top = (s.ty + 2) * TILE - 72;
      ctx.drawImage(ART.stallBack(), px - 1, top);
      const open = shopOpen();
      if (open) {
        const blink = (t % 4000) < 150;
        ctx.drawImage(ART.wren(blink), px + 25, top + 37 + Math.round(Math.sin(t / 500)));
      } else {
        ctx.fillStyle = '#7a4a2c'; ctx.fillRect(px + 20, top + 30, 24, 10);
        ctx.fillStyle = '#fff6ee'; ctx.fillRect(px + 22, top + 32, 20, 6);
        ctx.fillStyle = '#c94f4f'; ctx.fillRect(px + 24, top + 34, 16, 2);
      }
      ctx.drawImage(ART.stallFront(), px - 1, top + 50);
      break;
    }
  }
}

function drawCrop(ctx, x, y, s, t) {
  const c = s.crop, stage = cropStage(c);
  const img = ART.crop(c.id, stage);
  const sway = stage === 3 ? Math.round(Math.sin(t / 700 + x * 1.3 + y) * 0.6) : 0;
  ctx.drawImage(img, x * TILE + sway, y * TILE - (stage >= 2 ? 3 : 0));
  if (stage === 3 && Math.floor(t / 900 + x + y) % 5 === 0) {
    ctx.drawImage(ART.sparkle('#fff3a8'), x * TILE + 11, y * TILE - 2);
  }
}

function drawObj(ctx, x, y, o, season, t) {
  if (o === 'rock') ctx.drawImage(ART.rock(), x * TILE, y * TILE);
  else if (o === 'weed') ctx.drawImage(ART.weed(season), x * TILE, y * TILE);
  else if (o === 'stardust') {
    const bob = Math.round(Math.sin(t / 300 + x) * 1);
    ctx.drawImage(ART.icon('stardust'), x * TILE, y * TILE + bob);
  }
}

// Darkness 0..1 by clock time.
function darkness(time, weather) {
  let d = 0;
  if (time < 6.75 * 60) d = 0.24 * (1 - (time - DAY_START) / 45);
  else if (time > 17.5 * 60) d = Math.min(0.62, (time - 17.5 * 60) / 150 * 0.62);
  if (weather === 'rain') d = Math.max(d, 0.12) + 0.06;
  return Math.max(0, Math.min(0.7, d));
}

function lightSources() {
  const L = [];
  const H = LAYOUT.house, S = LAYOUT.stable;
  L.push([H.x * TILE + 18, (H.y + 3) * TILE - 22, 34], [H.x * TILE + 62, (H.y + 3) * TILE - 22, 34], [H.x * TILE + 40, (H.y + 3) * TILE - 18, 26]);
  L.push([S.x * TILE + 18, (S.y + 3) * TILE - 27, 26], [S.x * TILE + 78, (S.y + 3) * TILE - 27, 26], [S.x * TILE + 48, (S.y + 3) * TILE - 55, 24]);
  LAYOUT.lamps.forEach(([x, y]) => L.push([x * TILE + 8, y * TILE - 6, 46]));
  return L;
}
