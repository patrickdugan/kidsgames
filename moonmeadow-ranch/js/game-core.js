// Moonmeadow Ranch — game state, inventory, calendar, saving and the overnight simulation.
'use strict';

const SAVE_KEY = 'moonmeadow-ranch-save-v1';
const INV_SIZE = 24, HOTBAR = 12, STACK = 99;
const FOAL_DAYS = 8, PREGNANCY_DAYS = 5;
const MIN_PER_MS = 2 / 1000; // two game minutes per real second

let state = null;

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function makeUnicorn(opts = {}) {
  return {
    uid: state ? state.nextUid++ : 1,
    name: opts.name || pick(UNICORN_NAMES),
    coat: opts.coat || pick(COMMON_COATS),
    mane: opts.mane || pick(COMMON_MANES),
    adult: opts.adult !== false,
    age: opts.age || (opts.adult === false ? 0 : 30),
    aff: opts.aff || 0,
    pet: false, brushed: false, treat: false, milk: false, maneDays: 1,
    hungry: false, pregnant: 0,
  };
}

function newState() {
  state = null;
  const s = {
    v: 1, year: 1, season: 0, day: 1, time: DAY_START,
    weather: 'sun', tomorrow: 'sun',
    gold: 500, energy: 100, maxEnergy: 100,
    inv: Array(INV_SIZE).fill(null), sel: 0,
    water: 20, waterMax: 20, canKind: 'can', goldBrush: false,
    hay: 12, trough: 0, stableCap: 4,
    soil: {}, objs: {}, unicorns: [], shipped: [], offers: [],
    showDone: false, nextUid: 2, pendingNames: [], talkedWren: false,
    stats: { earned: 0, foals: 0, ribbons: 0, milk: 0 },
  };
  state = s;
  [['hoe', 1], ['can', 1], ['sickle', 1], ['brush', 1], ['pail', 1], ['seed_carrot', 9], ['seed_clover', 6], ['sugar', 3]]
    .forEach(([id, n]) => addItem(id, n));
  const first = makeUnicorn({ name: 'Biscuit', coat: 'pearl', mane: 'cotton', aff: 150 });
  first.uid = 1;
  s.unicorns.push(first);

  // A neglected field: weeds and stones to clear.
  const F = LAYOUT.field;
  for (let y = F.y; y < F.y + F.h; y++) for (let x = F.x; x < F.x + F.w; x++) {
    const r = Math.random();
    if (r < 0.06) s.objs[idx(x, y)] = 'rock';
    else if (r < 0.26) s.objs[idx(x, y)] = 'weed';
  }
  for (let y = 2; y < MAP_H - 2; y++) for (let x = 2; x < MAP_W - 2; x++) {
    const i = idx(x, y);
    if (world.ground[i] !== G_GRASS || world.solid[i] || inPasture(x, y) || s.objs[i]) continue;
    if (Math.random() < 0.035) s.objs[i] = Math.random() < 0.3 ? 'rock' : 'weed';
  }
  // Keep the paths beside buildings clear.
  [[10, 7], [6, 6], [6, 7], [36, 12], [37, 12], [31, 8], [32, 8]].forEach(([x, y]) => delete s.objs[idx(x, y)]);
  dropStardust(2);
  rollOffers();
  s.tomorrow = rollWeather(0, 2, 'sun');
  return s;
}

/* ---------- inventory ---------- */

function stackMax(id) { return ITEMS[id] && ITEMS[id].kind === 'tool' ? 1 : STACK; }

function addItem(id, n = 1) {
  const inv = state.inv;
  for (let i = 0; i < INV_SIZE && n > 0; i++) {
    const s = inv[i];
    if (s && s.id === id && s.n < stackMax(id)) { const k = Math.min(n, stackMax(id) - s.n); s.n += k; n -= k; }
  }
  for (let i = 0; i < INV_SIZE && n > 0; i++) {
    if (!inv[i]) { const k = Math.min(n, stackMax(id)); inv[i] = { id, n: k }; n -= k; }
  }
  if (typeof UI !== 'undefined') UI.dirty = true;
  return n; // leftover that did not fit
}

function canFit(id, n = 1) {
  let room = 0;
  for (const s of state.inv) {
    if (!s) room += stackMax(id);
    else if (s.id === id) room += stackMax(id) - s.n;
  }
  return room >= n;
}

function takeFromSlot(i, n = 1) {
  const s = state.inv[i];
  if (!s) return;
  s.n -= n;
  if (s.n <= 0) state.inv[i] = null;
  if (typeof UI !== 'undefined') UI.dirty = true;
}

function countItem(id) { return state.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0); }
function held() { return state.inv[state.sel]; }
function hasItem(id) { return countItem(id) > 0; }

/* ---------- calendar ---------- */

function weekday() { return WEEKDAYS[((state.season * DAYS_PER_SEASON) + state.day - 1) % 7]; }
function seasonKey() { return SEASONS[state.season]; }
function dateLabel() { return `${SEASON_NAMES[state.season]} ${state.day}`; }
function clockLabel(t = state.time) {
  const m = Math.floor(t / 10) * 10;
  let h = Math.floor(m / 60) % 24; const mm = m % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  return `${h}:${String(mm).padStart(2, '0')} ${ampm}`;
}
function shopOpen() { return state && state.time >= SHOP_OPEN && state.time < SHOP_CLOSE; }
function isShowDay() { return state.day === SHOW_DAY && state.season < 3; }

function rollWeather(season, day, today) {
  if (day === 1 && season === 0) return 'sun';
  if (day === SHOW_DAY && season < 3) return 'sun';
  if (season === 3) return Math.random() < 0.35 ? 'snow' : 'sun';
  if (today === 'rain' && Math.random() < 0.45) return 'rainbow';
  const p = [0.25, 0.18, 0.22][season];
  return Math.random() < p ? 'rain' : 'sun';
}

/* ---------- unicorns ---------- */

const hearts = (u) => Math.floor(clamp(u.aff, 0, 1000) / HEART);
function milkTier(u) {
  let t = hearts(u) >= 10 ? 3 : hearts(u) >= 7 ? 2 : hearts(u) >= 4 ? 1 : 0;
  if (state.weather === 'rainbow') t = Math.min(3, t + 1);
  return ['milk_s', 'milk_m', 'milk_l', 'milk_g'][t];
}
const maneReady = (u) => u.adult && u.maneDays >= (state.goldBrush ? 2 : 3);
const stableFull = () => state.unicorns.length + state.unicorns.filter(u => u.pregnant > 0).length >= state.stableCap;

function rollOffers() {
  const offers = [];
  for (let i = 0; i < 2; i++) {
    let coat = pick(COMMON_COATS), mane = pick(COMMON_MANES), price = 1400 + rand(6) * 100;
    if (coat === 'midnight') price += 700;
    if (Math.random() < 0.06) { coat = 'celestial'; mane = 'galaxy'; price = 6500; }
    offers.push({ coat, mane, price, sold: false });
  }
  state.offers = offers;
}

function freePastureTile() {
  for (let tries = 0; tries < 60; tries++) {
    const x = PASTURE_INNER.x0 + rand(PASTURE_INNER.x1 - PASTURE_INNER.x0 + 1);
    const y = PASTURE_INNER.y0 + 1 + rand(PASTURE_INNER.y1 - PASTURE_INNER.y0);
    if (!tileBlocked(x, y) && !state.objs[idx(x, y)]) return [x, y];
  }
  return null;
}

function dropStardust(n) {
  for (let i = 0; i < n; i++) {
    const t = freePastureTile();
    if (t) state.objs[idx(t[0], t[1])] = 'stardust';
  }
}

function inheritFoal(mother) {
  const r = Math.random();
  const coat = r < 0.05 ? 'celestial' : r < 0.68 ? mother.coat : pick(COMMON_COATS);
  const m = Math.random();
  const mane = m < 0.05 ? 'galaxy' : m < 0.55 ? mother.mane : pick(COMMON_MANES);
  return makeUnicorn({ coat, mane, adult: false, aff: 120, name: 'Foal' });
}

/* ---------- the night ---------- */

function endDay(passedOut) {
  const s = state;
  const report = { date: dateLabel(), shipped: [], income: 0, notes: [], passedOut };

  // Shipping bin is collected overnight.
  const merged = {};
  s.shipped.forEach(({ id, n }) => { merged[id] = (merged[id] || 0) + n; });
  for (const [id, n] of Object.entries(merged)) {
    const gold = (ITEMS[id].sell || 0) * n;
    report.shipped.push({ id, n, gold });
    report.income += gold;
  }
  s.gold += report.income; s.stats.earned += report.income; s.shipped = [];

  // Unicorns eat from the trough, in the order they joined the ranch.
  const fedCount = Math.min(s.trough, s.unicorns.length);
  if (fedCount) report.notes.push({ kind: 'info', text: `${fedCount} unicorn${fedCount === 1 ? '' : 's'} ate from the trough. ${Math.max(0, s.trough - s.unicorns.length)} hay left in it, ${s.hay} in the silo.` });
  for (const u of s.unicorns) {
    const ate = s.trough > 0;
    if (ate) s.trough--;
    if (ate) { u.aff += 5; u.hungry = false; if (u.adult) u.milk = true; }
    else { u.aff -= 40; u.hungry = true; u.milk = false; report.notes.push({ kind: 'bad', text: `${u.name} found the trough empty and went to bed hungry.` }); }
    if (!u.pet && !u.brushed) u.aff -= 15;
    u.aff = clamp(u.aff, 0, 1000);
    u.age++;
    u.maneDays++;
    if (!u.adult && u.age >= FOAL_DAYS) { u.adult = true; u.maneDays = 0; report.notes.push({ kind: 'good', text: `${u.name} is all grown up!` }); }
    if (ate && u.adult && Math.random() < 0.45) dropStardust(1);
    u.pet = u.brushed = u.treat = false;
  }
  const born = [];
  for (const u of s.unicorns) {
    if (u.pregnant > 0 && --u.pregnant === 0) {
      const foal = inheritFoal(u);
      born.push(foal);
      s.stats.foals++;
      s.pendingNames.push(foal.uid);
      report.notes.push({ kind: 'good', text: `${u.name} had a foal overnight! A ${COATS[foal.coat].name} coat with a ${MANES[foal.mane].name} mane.` });
    }
  }
  s.unicorns.push(...born);

  // Crops grow when watered.
  for (const [k, soil] of Object.entries(s.soil)) {
    const c = soil.crop;
    if (c && !c.dead && soil.wet) {
      const days = CROPS[c.id].days;
      if (c.age < days) { c.age++; if (soil.fert && c.age < days && Math.random() < 0.4) c.age++; }
    }
    soil.wet = false;
    if (!c && !soil.fert && Math.random() < 0.05) delete s.soil[k];
  }

  // Advance the calendar.
  s.day++;
  if (s.day > DAYS_PER_SEASON) {
    s.day = 1; s.season = (s.season + 1) % 4;
    if (s.season === 0) s.year++;
    let withered = 0;
    for (const soil of Object.values(s.soil)) {
      if (soil.crop && !soil.crop.dead && !CROPS[soil.crop.id].seasons.includes(s.season)) { soil.crop.dead = true; withered++; }
    }
    report.notes.push({ kind: 'info', text: `${SEASON_NAMES[s.season]} has arrived.${withered ? ` ${withered} out-of-season crops withered.` : ''}` });
    s.showDone = false;
  }
  s.weather = s.tomorrow;
  s.tomorrow = rollWeather(s.season, s.day + 1 > DAYS_PER_SEASON ? 1 : s.day + 1, s.weather);
  if (s.weather === 'rain') for (const soil of Object.values(s.soil)) soil.wet = true;
  if (s.weather === 'rainbow') {
    s.unicorns.forEach(u => { u.aff = clamp(u.aff + 20, 0, 1000); });
    report.notes.push({ kind: 'good', text: 'A rainbow arches over the pasture. Your unicorns are glowing with joy.' });
  }

  // Weeds creep back into the field.
  if (s.season !== 3) {
    const F = LAYOUT.field;
    for (let i = 0; i < 3; i++) {
      const x = F.x + rand(F.w), y = F.y + rand(F.h), k = idx(x, y);
      if (!s.objs[k] && !s.soil[k]) s.objs[k] = 'weed';
    }
  }

  s.energy = passedOut ? Math.round(s.maxEnergy * 0.5) : s.time > 24 * 60 ? Math.round(s.maxEnergy * 0.8) : s.maxEnergy;
  s.time = DAY_START;
  s.talkedWren = false;
  rollOffers();
  report.weather = s.weather;
  report.tomorrow = s.tomorrow;
  saveGame();
  return report;
}

/* ---------- saving ---------- */

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state, (k, v) => (k.startsWith('_') ? undefined : v)));
    return true;
  } catch (e) { return false; }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return null;
    return s;
  } catch (e) { return null; }
}

function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}
