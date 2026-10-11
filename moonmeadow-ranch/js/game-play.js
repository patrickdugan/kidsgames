// Moonmeadow Ranch — the farmer, tools, unicorn behaviour, effects and the frame loop.
'use strict';

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const player = { x: 0, y: 0, dir: 'down', moving: false, anim: 0, actT: 0, actItem: null };
const input = { up: false, down: false, left: false, right: false };
const Game = { running: false, last: 0, t: 0, fade: 0, fadeDir: 0, onFadeDone: null, cam: { x: 0, y: 0 }, view: { w: 320, h: 200, s: 3 },
  mouse: { over: false, sx: 0, sy: 0, t: 0 } };
const particles = [];
const weatherFx = [];

function spawnPlayer() {
  player.x = LAYOUT.house.door[0] * TILE + 8;
  player.y = (LAYOUT.house.door[1] + 1) * TILE + 12;
  player.dir = 'down';
}

function placeUnicorns() {
  for (const u of state.unicorns) {
    const t = freePastureTile() || [35, 16];
    u._x = t[0] * TILE + 8; u._y = t[1] * TILE + 12;
    u._dir = Math.random() < 0.5 ? 'l' : 'r'; u._st = 'idle'; u._t = 500 + Math.random() * 3000; u._anim = 0;
  }
}

/* ---------- helpers ---------- */

function playerTile() { return [Math.floor(player.x / TILE), Math.floor((player.y - 3) / TILE)]; }
function targetTile() {
  const [x, y] = playerTile(), d = DIRS[player.dir];
  return [x + d[0], y + d[1]];
}
function targetUnicorn() {
  const d = DIRS[player.dir];
  const fx = player.x + d[0] * 13, fy = player.y - 3 + d[1] * 13;
  let best = null, bd = 15;
  for (const u of state.unicorns) {
    const dist = Math.hypot(u._x - fx, u._y - 4 - fy);
    if (dist < bd) { bd = dist; best = u; }
  }
  return best;
}

/* ---------- reach and aiming ---------- */

// Reach is the farmer's own tile plus the eight around it.
const UNICORN_REACH = 34;
function inReach(tx, ty) {
  const [px, py] = playerTile();
  return Math.abs(tx - px) <= 1 && Math.abs(ty - py) <= 1;
}
const unicornInReach = (u) => Math.hypot(u._x - player.x, u._y - player.y) <= UNICORN_REACH;
function nearestUnicorn() {
  let best = null, bd = UNICORN_REACH;
  for (const u of state.unicorns) {
    const d = Math.hypot(u._x - player.x, u._y - player.y);
    if (d <= bd) { bd = d; best = u; }
  }
  return best;
}
const isUnicornItem = (h) => !!h && (h.id === 'brush' || h.id === 'pail' || h.id === 'charm' || ITEMS[h.id].kind === 'treat');

function faceToward(wx, wy) {
  const dx = wx - player.x, dy = wy - (player.y - 6);
  if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
  player.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}

// Something worth pressing E on: a building, stardust, a weed or a crop.
function tileHasInteraction(tx, ty) {
  if (!inMap(tx, ty)) return false;
  const i = idx(tx, ty), o = state.objs[i], s = state.soil[i];
  return world.interact.has(i) || o === 'stardust' || o === 'weed' || !!(s && s.crop && !s.crop.dead);
}

// Keyboard aim: the tile being faced, or the closest useful thing within reach if that tile has nothing.
// Field tools (hoe, can, seeds, sickle) stay on the faced tile so planting rows stays predictable.
function autoAim(mode) {
  const [tx, ty] = targetTile();
  const facingU = targetUnicorn();
  if (facingU) return { tx, ty, u: facingU };
  const h = held();
  if (mode === 'use' && h && !isUnicornItem(h)) return { tx, ty, u: null };
  if (mode === 'use' && isUnicornItem(h)) {
    const u = nearestUnicorn();
    if (u) faceToward(u._x, u._y - 6);
    return { tx, ty, u };
  }
  if (tileHasInteraction(tx, ty)) return { tx, ty, u: null };
  const u = nearestUnicorn();
  if (u) { faceToward(u._x, u._y - 6); return { tx, ty, u }; }
  const [px, py] = playerTile();
  let best = null, bd = Infinity;
  for (let y = py - 1; y <= py + 1; y++) for (let x = px - 1; x <= px + 1; x++) {
    if (!tileHasInteraction(x, y)) continue;
    const d = Math.hypot(x - tx, y - ty);
    if (d < bd) { bd = d; best = [x, y]; }
  }
  if (best) { faceToward(best[0] * TILE + 8, best[1] * TILE + 8); return { tx: best[0], ty: best[1], u: null }; }
  return { tx, ty, u: null };
}

// Mouse and touch: what sits under a point in the world.
function unicornAtPoint(wx, wy) {
  let best = null;
  for (const u of state.unicorns) {
    const w = u.adult ? 24 : 17, h = u.adult ? 20 : 15;
    if (wx >= u._x - w / 2 - 2 && wx <= u._x + w / 2 + 2 && wy >= u._y - h - 3 && wy <= u._y + 2 && (!best || u._y > best._y)) best = u;
  }
  return best;
}
function buildingAtPoint(wx, wy) {
  let best = null;
  for (const st of world.statics) {
    if (!st.rect) continue;
    const [x, y, w, h] = st.rect;
    if (wx >= x && wx < x + w && wy >= y && wy < y + h && (!best || st.sortY > best.sortY)) best = st;
  }
  return best;
}
function resolvePoint(wx, wy) {
  const u = unicornAtPoint(wx, wy);
  if (u) return { kind: 'unicorn', u, reach: unicornInReach(u) };
  const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
  const b = buildingAtPoint(wx, wy);
  if (b) {
    const onTile = b.tiles.some(([x, y]) => x === tx && y === ty) && inReach(tx, ty);
    const t = onTile ? [tx, ty] : b.tiles.find(([x, y]) => inReach(x, y));
    return { kind: 'building', b, tx: t ? t[0] : tx, ty: t ? t[1] : ty, reach: !!t };
  }
  return { kind: 'tile', tx, ty, reach: inMap(tx, ty) && inReach(tx, ty) };
}

// A click does the sensible thing: use the held item when it applies, otherwise talk, pet, harvest or pick up.
// mode 'act' (right-click) never uses the held item.
function clickAt(wx, wy, mode) {
  if (UI.blocking() || player.actT > 0 || Game.fadeDir) return;
  const hit = resolvePoint(wx, wy);
  if (!hit.reach) {
    if (performance.now() - (Game.farToast || 0) > 1500) { Game.farToast = performance.now(); UI.toast('Too far away. Walk a little closer.'); }
    return;
  }
  if (hit.kind === 'unicorn') {
    faceToward(hit.u._x, hit.u._y - 6);
    const aim = { tx: 0, ty: 0, u: hit.u };
    return mode !== 'act' && isUnicornItem(held()) ? useHeld(aim) : interact(aim);
  }
  faceToward(hit.tx * TILE + 8, hit.ty * TILE + 8);
  const aim = { tx: hit.tx, ty: hit.ty, u: null };
  if (mode === 'act' || hit.kind === 'building') return interact(aim);
  const i = idx(hit.tx, hit.ty), o = state.objs[i], s = state.soil[i], h = held();
  const ripe = s && s.crop && !s.crop.dead && s.crop.age >= CROPS[s.crop.id].days;
  if (o === 'stardust' || ripe) return interact(aim);
  if (o === 'weed' && !(h && (h.id === 'hoe' || h.id === 'sickle'))) return interact(aim);
  return useHeld(aim);
}

function spend(n) {
  const before = state.energy;
  state.energy = Math.max(0, state.energy - n);
  if (before > 0 && state.energy <= 0) setTimeout(() => passOut('You worked yourself to exhaustion and collapsed.'), 300);
  else if (before >= 20 && state.energy < 20) UI.toast('You\'re getting tired. Eat something or call it a day.');
}
function swing(item) { player.actT = 260; player.actItem = item; }

function burst(kind, x, y, n = 6, opts = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = (opts.speed || 30) * (0.4 + Math.random() * 0.8);
    particles.push({ kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.lift || 20), life: 0, max: opts.life || 700, col: opts.col });
  }
}
function floatText(text, x, y, col = '#ffffff') { particles.push({ kind: 'text', text, x, y, vx: 0, vy: -16, life: 0, max: 1200, col }); }
function heartPop(u) { particles.push({ kind: 'heart', x: u._x, y: u._y - 22, vx: 0, vy: -14, life: 0, max: 1100 }); }

/* ---------- actions ---------- */

function useHeld(aim) {
  if (UI.blocking() || player.actT > 0) return;
  aim = aim || autoAim('use');
  const h = held();
  if (!h) return interact(aim);
  const { tx, ty, u } = aim;
  const i = idx(tx, ty);
  const it = ITEMS[h.id];
  const soil = inMap(tx, ty) ? state.soil[i] : null;
  const obj = inMap(tx, ty) ? state.objs[i] : null;
  const cx = tx * TILE + 8, cy = ty * TILE + 8;

  if (h.id === 'hoe') {
    if (!inMap(tx, ty)) return;
    swing('hoe');
    if (obj === 'rock') { delete state.objs[i]; spend(4); burst('dust', cx, cy, 8, { col: '#a59dbb' }); SFX.play('rock'); return; }
    if (obj === 'weed') { delete state.objs[i]; spend(2); burst('dust', cx, cy, 6, { col: '#6fbf5a' }); SFX.play('till'); return; }
    if (soil && soil.crop && soil.crop.dead) { soil.crop = null; spend(1); burst('dust', cx, cy, 5, { col: '#8a6a4a' }); SFX.play('till'); return; }
    if (soil) { if (!soil.crop) UI.toast('This soil is already tilled. Plant some seeds!'); return; }
    if (world.ground[i] === G_FIELD && !world.solid[i] && !obj) {
      state.soil[i] = { wet: state.weather === 'rain', fert: false, crop: null };
      spend(2); burst('dust', cx, cy, 6, { col: '#a0694a' }); SFX.play('till');
    } else UI.toast('Only the brown field earth can be tilled.');
    return;
  }

  if (h.id === 'can' || h.id === 'bigcan') {
    if (inMap(tx, ty) && world.ground[i] === G_WATER) {
      state.water = state.waterMax; swing(h.id); SFX.play('refill');
      burst('drop', cx, cy, 8, { col: '#9fe0ff', lift: 40 });
      UI.toast(`Watering can refilled (${state.water}/${state.waterMax}).`);
      return;
    }
    if (state.water <= 0) { UI.toast('Your can is empty. Refill it at the pond.'); SFX.play('nope'); return; }
    const tiles = [[tx, ty]];
    if (h.id === 'bigcan') {
      const d = DIRS[player.dir];
      tiles.push([tx + d[1], ty + d[0]], [tx - d[1], ty - d[0]]);
    }
    swing(h.id);
    let watered = 0;
    for (const [x, y] of tiles) {
      const s = inMap(x, y) && state.soil[idx(x, y)];
      if (s) { s.wet = true; watered++; burst('drop', x * TILE + 8, y * TILE + 6, 5, { col: '#7fc8ff', lift: 30 }); }
    }
    if (watered) { state.water--; spend(1); SFX.play('water'); }
    return;
  }

  if (h.id === 'sickle') {
    if (!inMap(tx, ty)) return;
    swing('sickle');
    if (obj === 'weed') {
      delete state.objs[i]; spend(1); burst('dust', cx, cy, 6, { col: '#86cf63' }); SFX.play('cut');
      if (Math.random() < 0.2) { state.hay++; floatText('+1 hay', cx, cy - 6, '#ffe9a3'); }
      return;
    }
    if (soil && soil.crop) {
      const c = soil.crop;
      if (c.dead) { soil.crop = null; spend(1); SFX.play('cut'); burst('dust', cx, cy, 5, { col: '#9c7b55' }); return; }
      if (c.id === 'clover' && c.age >= CROPS.clover.days) { harvestCrop(tx, ty, soil); spend(1); return; }
    }
    return;
  }

  if (h.id === 'brush') { swing('brush'); if (u) brushUnicorn(u); else UI.toast('Stand next to a unicorn to brush it.'); return; }
  if (h.id === 'pail') { swing('pail'); if (u) milkUnicorn(u); else UI.toast('Stand next to an adult unicorn to collect Moonmilk.'); return; }

  if (it.kind === 'seed') {
    if (!soil || soil.crop || obj) { UI.toast('Plant seeds on empty tilled soil.'); return; }
    const crop = CROPS[it.crop];
    if (!crop.seasons.includes(state.season)) { UI.toast(`${crop.name} won't grow in ${SEASON_NAMES[state.season]}.`); SFX.play('nope'); return; }
    soil.crop = { id: it.crop, age: 0 };
    takeFromSlot(state.sel); SFX.play('plant'); burst('dust', cx, cy, 4, { col: '#e8d3a8', speed: 15 });
    return;
  }

  if (h.id === 'stardust') {
    if (u) { UI.toast('That came out of a unicorn. Sprinkle it on the soil instead.'); return; }
    if (!soil) { UI.toast('Sprinkle Stardust on tilled soil to help crops grow.'); return; }
    if (soil.fert) { UI.toast('This soil is already sparkling.'); return; }
    soil.fert = true; takeFromSlot(state.sel); SFX.play('sparkle');
    burst('sparkle', cx, cy, 7, { col: '#e3d0ff' });
    return;
  }

  if (it.kind === 'treat' && u) return giveTreat(u, h);
  if (h.id === 'charm' && u) return giveCharm(u);
  return interact(aim);
}

function interact(aim) {
  if (UI.blocking() || player.actT > 0) return;
  aim = aim || autoAim('act');
  const { tx, ty, u } = aim;
  if (u) return petUnicorn(u);
  if (!inMap(tx, ty)) return;
  const i = idx(tx, ty);
  const tag = world.interact.get(i);
  const obj = state.objs[i];
  const soil = state.soil[i];
  const cx = tx * TILE + 8, cy = ty * TILE + 8;

  if (tag === 'door') {
    UI.confirm(state.time < 18 * 60 ? 'It\'s still daytime. Go to bed and end the day early?' : 'Go to bed and end the day?', 'Sleep', () => sleep(false));
    return;
  }
  if (tag === 'stable') return UI.openRoster();
  if (tag === 'silo') { UI.toast(`The silo holds ${state.hay} hay. Fill the trough in the pasture each day.`); return; }
  if (tag === 'trough') return fillTrough();
  if (tag === 'bin') return shipHeld();
  if (tag === 'shop') return visitStall();
  if (tag === 'sign') { UI.say('Sign', 'MOONMEADOW RANCH. Market stall open 9 AM to 5 PM. Please do not feed the unicorns after midnight.'); return; }

  if (obj === 'stardust') {
    if (!canFit('stardust')) { UI.toast('Your bag is full.'); return; }
    delete state.objs[i]; addItem('stardust'); SFX.play('pickup');
    burst('sparkle', cx, cy, 5, { col: '#ffe066' });
    return;
  }
  if (obj === 'weed') { delete state.objs[i]; spend(1); swing(null); burst('dust', cx, cy, 5, { col: '#86cf63' }); SFX.play('cut'); return; }
  if (obj === 'rock') { UI.toast('Too heavy to lift. Break it with the hoe.'); return; }
  if (soil && soil.crop && !soil.crop.dead && soil.crop.age >= CROPS[soil.crop.id].days) return harvestCrop(tx, ty, soil);
  if (soil && soil.crop && !soil.crop.dead) {
    const c = soil.crop, left = CROPS[c.id].days - c.age;
    UI.toast(`${CROPS[c.id].name}: ripe in ${left} day${left === 1 ? '' : 's'}${soil.wet ? '' : '. Needs water today'}.`);
    return;
  }
  if (world.ground[i] === G_WATER) {
    const can = state.inv.find(s => s && (s.id === 'can' || s.id === 'bigcan'));
    if (can) { state.water = state.waterMax; SFX.play('refill'); UI.toast(`Watering can refilled (${state.water}/${state.waterMax}).`); }
  }
}

function harvestCrop(tx, ty, soil) {
  const c = soil.crop, crop = CROPS[c.id];
  const cx = tx * TILE + 8, cy = ty * TILE + 4;
  if (c.id === 'clover') {
    const n = soil.fert ? 2 : 1;
    state.hay += n;
    floatText(`+${n} hay`, cx, cy, '#ffe9a3');
  } else {
    if (!canFit(crop.item)) { UI.toast('Your bag is full. Ship or store something first.'); SFX.play('nope'); return; }
    addItem(crop.item);
    floatText(`+1 ${ITEMS[crop.item].name}`, cx, cy, '#ffffff');
  }
  burst('sparkle', cx, cy, 6, { col: '#fff3a8' });
  SFX.play('harvest');
  if (crop.regrow) c.age = crop.days - crop.regrow; else soil.crop = null;
}

function shipHeld() {
  const h = held();
  if (!h || ITEMS[h.id].kind === 'tool' || !ITEMS[h.id].sell) {
    const pending = state.shipped.reduce((a, s) => a + ITEMS[s.id].sell * s.n, 0);
    UI.toast(pending ? `Shipping bin: ${pending}g of goods will be collected tonight.` : 'Hold a crop or unicorn product and use the bin to ship it. Wren collects overnight.');
    return;
  }
  state.shipped.push({ id: h.id, n: h.n });
  const gold = ITEMS[h.id].sell * h.n;
  UI.toast(`Shipped ${h.n} ${ITEMS[h.id].name} (${gold}g tonight).`);
  floatText(`+${gold}g`, LAYOUT.bin.x * TILE + 8, LAYOUT.bin.y * TILE, '#ffd36b');
  state.inv[state.sel] = null; UI.dirty = true;
  SFX.play('coin');
}

function fillTrough() {
  const need = state.stableCap - state.trough;
  if (need <= 0) { UI.toast('The trough is already full.'); return; }
  if (state.hay <= 0) { UI.toast('The silo is empty. Mow ripe clover with the sickle, or buy hay from Wren.'); SFX.play('nope'); return; }
  const n = Math.min(need, state.hay);
  state.hay -= n; state.trough += n;
  SFX.play('plant');
  UI.toast(`Put ${n} hay in the trough. Silo: ${state.hay} left.`);
}

/* ---------- unicorn care ---------- */

function faceUnicorn(u) { u._dir = player.x < u._x ? 'l' : 'r'; u._st = 'idle'; u._t = 2500; }

function petUnicorn(u) {
  faceUnicorn(u);
  if (u.pet) { UI.unicornCard(u); return; }
  u.pet = true; u.aff = clamp(u.aff + 15, 0, 1000);
  heartPop(u); SFX.play('heart');
  const lines = u.hungry ? [`${u.name} nudges you toward the trough.`] :
    [`${u.name} nuzzles your shoulder.`, `${u.name} flicks a sparkle off their mane at you.`, `${u.name} whinnies happily.`, `${u.name} leans into the scratch.`];
  UI.toast(pick(lines));
}

function brushUnicorn(u) {
  faceUnicorn(u);
  let did = false;
  if (maneReady(u)) {
    if (!canFit('mane')) { UI.toast('Your bag is full.'); return; }
    addItem('mane'); u.maneDays = 0; did = true;
    floatText('+1 Rainbow Strand', u._x, u._y - 26, '#ffd1ec');
  }
  if (!u.brushed) {
    u.brushed = true; u.aff = clamp(u.aff + (state.goldBrush ? 30 : 20), 0, 1000);
    did = true; heartPop(u);
  }
  if (!did) { UI.toast(`${u.name} is already brushed and gleaming.`); return; }
  burst('sparkle', u._x, u._y - 12, 8, { col: MANES[u.mane].c[0] });
  SFX.play('sparkle');
}

function milkUnicorn(u) {
  faceUnicorn(u);
  if (!u.adult) { UI.toast('Foals don\'t give Moonmilk yet.'); return; }
  if (!u.milk) { UI.toast(u.hungry ? `${u.name} was too hungry last night to make Moonmilk.` : `${u.name} has no Moonmilk until tomorrow morning.`); return; }
  const id = milkTier(u);
  if (!canFit(id)) { UI.toast('Your bag is full.'); return; }
  addItem(id); u.milk = false; u.aff = clamp(u.aff + 5, 0, 1000); state.stats.milk++;
  floatText(`+1 ${ITEMS[id].name}`, u._x, u._y - 26, '#e8f4ff');
  SFX.play('pickup');
}

function giveTreat(u, h) {
  faceUnicorn(u);
  if (u.treat) { UI.toast(`${u.name} has had a treat today already.`); return; }
  u.treat = true; u.aff = clamp(u.aff + ITEMS[h.id].affection, 0, 1000);
  takeFromSlot(state.sel);
  heartPop(u); setTimeout(() => heartPop(u), 250);
  UI.toast(`${u.name} crunches the ${ITEMS[h.id].name.toLowerCase()} happily.`);
  SFX.play('heart');
}

function giveCharm(u) {
  faceUnicorn(u);
  if (!u.adult) { UI.toast('Only adult unicorns can make a wish.'); return; }
  if (u.pregnant) { UI.toast(`${u.name} is already expecting a foal.`); return; }
  if (hearts(u) < 4) { UI.toast(`${u.name} needs 4 hearts before they trust you with a wish.`); return; }
  if (stableFull()) { UI.toast('The stable has no room for a foal. Wren sells a Stable Extension.'); return; }
  u.pregnant = PREGNANCY_DAYS; takeFromSlot(state.sel);
  burst('sparkle', u._x, u._y - 14, 14, { col: '#ffd1ec', speed: 45 });
  SFX.play('wish');
  UI.say(u.name, `The charm glows and melts into ${u.name}'s mane. A foal will arrive in ${PREGNANCY_DAYS} days.`);
}

function visitStall() {
  if (!shopOpen()) { UI.toast('The stall is closed. Wren is here from 9 AM to 5 PM.'); return; }
  if (isShowDay() && !state.showDone) return UI.sparkleShow();
  if (!state.talkedWren) {
    state.talkedWren = true;
    UI.say('Wren', pick(WREN_LINES), () => UI.openShop());
    return;
  }
  UI.openShop();
}

function eatHeld() {
  const h = held();
  if (!h || !ITEMS[h.id].energy) { UI.toast('You can only eat crops, treats and Moonmilk.'); return; }
  if (state.energy >= state.maxEnergy) { UI.toast('You\'re not hungry right now.'); return; }
  state.energy = Math.min(state.maxEnergy, state.energy + ITEMS[h.id].energy);
  UI.toast(`You ate the ${ITEMS[h.id].name}. +${ITEMS[h.id].energy} energy.`);
  takeFromSlot(state.sel); SFX.play('pickup');
}

/* ---------- days ---------- */

function sleep(passedOut) {
  if (Game.sleeping) return;
  Game.sleeping = true;
  Game.fadeDir = 1;
  Game.onFadeDone = () => {
    const report = endDay(passedOut);
    spawnPlayer(); placeUnicorns(); particles.length = 0;
    Game.passingOut = false;
    UI.summary(report, () => { Game.sleeping = false; Game.fadeDir = -1; UI.namePending(); });
  };
}

function passOut(msg) {
  if (Game.passingOut || Game.sleeping || !Game.running) return;
  if (UI.blocking()) { setTimeout(() => passOut(msg), 500); return; }
  Game.passingOut = true;
  UI.say('', msg, () => sleep(true));
}

/* ---------- unicorn behaviour ---------- */

function updateUnicorns(dt) {
  const night = state.time >= 20 * 60;
  for (const u of state.unicorns) {
    u._anim += dt;
    if (night) { u._st = 'sleep'; continue; }
    if (u._st === 'sleep') { u._st = 'idle'; u._t = 1000; }
    u._t -= dt;
    if (u._st === 'idle' && u._t <= 0) {
      const t = freePastureTile();
      if (t) { u._tx = t[0] * TILE + 8; u._ty = t[1] * TILE + 12; u._st = 'walk'; u._t = 9000; }
      else u._t = 2000;
    }
    if (u._st === 'walk') {
      const dx = u._tx - u._x, dy = u._ty - u._y, d = Math.hypot(dx, dy);
      const sp = (u.adult ? 16 : 22) * dt / 1000;
      if (d < 2 || u._t <= 0) { u._st = 'idle'; u._t = 1500 + Math.random() * 5000; continue; }
      const nx = u._x + dx / d * sp, ny = u._y + dy / d * sp;
      const ntx = Math.floor(nx / TILE), nty = Math.floor((ny - 2) / TILE);
      if (!inPasture(ntx, nty) || tileBlocked(ntx, nty)) { u._st = 'idle'; u._t = 800; continue; }
      if (Math.abs(dx) > 0.5) u._dir = dx < 0 ? 'l' : 'r';
      u._x = nx; u._y = ny;
    }
    if (u._st === 'idle' && hearts(u) >= 6 && Math.random() < dt / 30000) heartPop(u);
  }
}

/* ---------- frame loop ---------- */

function update(dt) {
  Game.t += dt;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.max) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000;
    if (p.kind === 'drop' || p.kind === 'dust') p.vy += 120 * dt / 1000;
  }
  updateWeatherFx(dt);

  if (Game.fadeDir) {
    Game.fade = clamp(Game.fade + Game.fadeDir * dt / 600, 0, 1);
    if (Game.fadeDir > 0 && Game.fade >= 1) { Game.fadeDir = 0; const f = Game.onFadeDone; Game.onFadeDone = null; f && f(); }
    else if (Game.fadeDir < 0 && Game.fade <= 0) Game.fadeDir = 0;
    return;
  }
  if (UI.blocking()) return;

  state.time += dt * MIN_PER_MS;
  if (state.time >= 24 * 60 && !Game.warnedLate) { Game.warnedLate = true; UI.toast('It\'s past midnight. You should get to bed.'); }
  if (state.time < 24 * 60) Game.warnedLate = false;
  if (state.time >= DAY_END) { state.time = DAY_END; passOut('It\'s 2 AM. You fell asleep on your feet and someone carried you home.'); return; }

  updateUnicorns(dt);

  if (player.actT > 0) { player.actT -= dt; player.moving = false; return; }
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0), my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  player.moving = !!(mx || my);
  if (player.moving) {
    if (mx && my) { mx *= 0.7071; my *= 0.7071; }
    if (Math.abs(mx) > Math.abs(my)) player.dir = mx > 0 ? 'right' : 'left';
    else if (my) player.dir = my > 0 ? 'down' : 'up';
    const sp = (state.energy < 20 ? 52 : 74) * dt / 1000;
    tryMove(mx * sp, 0); tryMove(0, my * sp);
    player.anim += dt;
  } else player.anim = 0;
}

function hitsSolid(x, y) {
  const pts = [[x - 5, y - 5], [x + 5, y - 5], [x - 5, y - 1], [x + 5, y - 1]];
  return pts.some(([px, py]) => tileBlocked(Math.floor(px / TILE), Math.floor(py / TILE)));
}
function tryMove(dx, dy) {
  if (!dx && !dy) return;
  const nx = player.x + dx, ny = player.y + dy;
  if (!hitsSolid(nx, ny)) { player.x = nx; player.y = ny; return; }
  // Slide around corners a little so walking feels forgiving.
  if (dx) for (const n of [-3, 3]) if (!hitsSolid(nx, ny + n) && !hitsSolid(player.x, player.y + n)) { player.y += Math.sign(n) * Math.min(Math.abs(dx), 1); return; }
  if (dy) for (const n of [-3, 3]) if (!hitsSolid(nx + n, ny) && !hitsSolid(player.x + n, player.y)) { player.x += Math.sign(n) * Math.min(Math.abs(dy), 1); return; }
}

/* ---------- weather ---------- */

function updateWeatherFx(dt) {
  const w = state ? state.weather : 'sun', season = state ? state.season : 0;
  const V = Game.view;
  const want = w === 'rain' ? 140 : w === 'snow' ? 90 : (season === 0 || season === 2) ? 10 : 0;
  while (weatherFx.length < want) weatherFx.push({ x: Math.random() * V.w, y: Math.random() * V.h, s: 0.6 + Math.random() * 0.8, p: Math.random() * 6 });
  if (weatherFx.length > want) weatherFx.length = want;
  const k = dt / 1000;
  for (const f of weatherFx) {
    if (w === 'rain') { f.x -= 40 * k * f.s; f.y += 260 * k * f.s; }
    else if (w === 'snow') { f.p += k; f.x += Math.sin(f.p * 1.5) * 12 * k; f.y += 22 * k * f.s; }
    else { f.p += k; f.x += (18 + Math.sin(f.p) * 14) * k * f.s; f.y += 14 * k * f.s; }
    if (f.y > V.h + 4) { f.y = -4; f.x = Math.random() * (V.w + 40); }
    if (f.x < -6) f.x = V.w + 4; if (f.x > V.w + 6) f.x = -4;
  }
}

function drawWeather(ctx) {
  const w = state.weather, season = state.season;
  for (const f of weatherFx) {
    if (w === 'rain') { ctx.fillStyle = 'rgba(190,225,255,0.55)'; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 4); }
    else if (w === 'snow') { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s > 1.1 ? 2 : 1, f.s > 1.1 ? 2 : 1); }
    else {
      ctx.fillStyle = season === 0 ? '#ffc0e3' : ['#e8743c', '#ffb347', '#c94f4f'][Math.floor(f.p * 10) % 3];
      ctx.fillRect(Math.round(f.x), Math.round(f.y), 2, 1); ctx.fillRect(Math.round(f.x) + 1, Math.round(f.y) + 1, 1, 1);
    }
  }
  if (w === 'rainbow' && state.time < 16 * 60 && Game.view.w > 80) {
    const V = Game.view, cx = V.w * 0.7, cy = V.h * 0.75, R = V.w * 0.6;
    ctx.globalAlpha = 0.14;
    ['#ff7fb0', '#ffb36b', '#ffe066', '#7fe0a8', '#7fc4ff', '#b79cff'].forEach((c, i) => {
      ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R - i * 4, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
}
