// Moonmeadow Ranch — panels: market, bag, stable, day summary, naming, Sparkle Show, menu, title, Art Book.
'use strict';

const WEATHER_NAMES = { sun: 'Sunny', rain: 'Rain', snow: 'Snow', rainbow: 'Rainbow' };
const heartRow = (u) => {
  const h = hearts(u);
  let out = '<span class="hearts" aria-label="' + h + ' of 10 hearts">';
  for (let i = 0; i < 10; i++) out += `<img class="px" src="${ART.url(i < h ? ART.heart() : ART.heartEmpty())}" alt="">`;
  return out + '</span>';
};
const uniImg = (u, big) => `<img class="px uni${big ? ' big' : ''}" src="${ART.url(ART.unicorn(u.coat, u.mane, u.adult === false ? 'foal' : 'adult', 0, 'r'))}" alt="">`;
const goldTag = () => `<span class="gold-tag"><img class="px" src="${UI.iconUrl('coin')}" alt="">${state.gold.toLocaleString()}g</span>`;

function unicornChips(u) {
  const chips = [];
  if (!u.adult) chips.push(['info', `Foal · grown in ${Math.max(1, FOAL_DAYS - u.age)}d`]);
  chips.push(u.hungry ? ['bad', 'Hungry'] : ['good', 'Fed']);
  chips.push(u.pet ? ['good', 'Petted'] : ['todo', 'Not petted']);
  chips.push(u.brushed ? ['good', 'Brushed'] : ['todo', 'Not brushed']);
  if (u.adult && u.milk) chips.push(['ready', 'Moonmilk ready']);
  if (maneReady(u)) chips.push(['ready', 'Mane ready']);
  if (u.treat) chips.push(['good', 'Had a treat']);
  if (u.pregnant) chips.push(['info', `Foal due in ${u.pregnant}d`]);
  return chips.map(([k, t]) => `<span class="chip ${k}">${t}</span>`).join('');
}

function unicornRow(u) {
  return `<div class="uni-row">
    ${uniImg(u)}
    <div class="uni-info">
      <div class="uni-name">${esc(u.name)} <span class="muted">${COATS[u.coat].name} coat · ${MANES[u.mane].name} mane</span></div>
      ${heartRow(u)}
      <div class="chips">${unicornChips(u)}</div>
    </div>
  </div>`;
}

/* ---------- market ---------- */

UI.openShop = function (tab = 'seeds') {
  const draw = () => {
    const tabs = [['seeds', 'Seeds'], ['supplies', 'Supplies'], ['unicorns', 'Unicorns'], ['upgrades', 'Upgrades']];
    let list = '';
    if (tab === 'seeds') {
      const ids = Object.keys(CROPS).filter(id => CROPS[id].seasons.includes(state.season));
      if (!ids.length) list = '<p class="empty">Nothing grows in winter. Wren will have seeds again in spring. Look after your unicorns until then.</p>';
      ids.forEach(id => {
        const c = CROPS[id], seed = 'seed_' + id;
        list += `<div class="shop-row">
          <img class="px icon" src="${UI.iconUrl(seed)}" alt="">
          <div class="shop-info"><div class="shop-name">${c.name} Seeds</div><div class="shop-desc">${ITEMS[seed].desc}${c.item ? ` Sells for ${ITEMS[c.item].sell}g.` : ' Mow into hay for the silo.'}</div></div>
          <div class="shop-buy"><span class="price">${c.seed}g</span>
          <button class="btn sm" type="button" data-buy="seed:${id}:1">Buy 1</button>
          <button class="btn sm" type="button" data-buy="seed:${id}:5">Buy 5</button></div></div>`;
      });
    } else if (tab === 'supplies') {
      list += `<p class="shop-note">Silo: ${state.hay} hay</p>`;
      SUPPLIES.forEach(s => {
        list += `<div class="shop-row"><img class="px icon" src="${UI.iconUrl(s.icon)}" alt="">
          <div class="shop-info"><div class="shop-name">${s.name}</div><div class="shop-desc">${s.desc}</div></div>
          <div class="shop-buy"><span class="price">${s.price}g</span><button class="btn sm" type="button" data-buy="sup:${s.id}">Buy</button></div></div>`;
      });
    } else if (tab === 'unicorns') {
      const full = stableFull();
      list += `<p class="shop-note">Stable: ${state.unicorns.length} of ${state.stableCap} stalls used${full ? '. Full: a Stable Extension adds four more stalls.' : '.'}</p>`;
      state.offers.forEach((o, i) => {
        const u = { coat: o.coat, mane: o.mane, adult: true };
        list += `<div class="shop-row uni-offer">${uniImg(u, true)}
          <div class="shop-info"><div class="shop-name">${COATS[o.coat].name} with ${MANES[o.mane].name} mane${COATS[o.coat].rare ? ' <span class="chip ready">Rare</span>' : ''}</div>
          <div class="shop-desc">A grown unicorn from the hill herds. New faces arrive every morning.</div></div>
          <div class="shop-buy"><span class="price">${o.price.toLocaleString()}g</span>
          <button class="btn sm" type="button" data-buy="uni:${i}" ${o.sold || full ? 'disabled' : ''}>${o.sold ? 'Gone home' : 'Adopt'}</button></div></div>`;
      });
    } else {
      UPGRADES.forEach(u => {
        const owned = (u.id === 'bigcan' && state.waterMax >= 40) || (u.id === 'stable' && state.stableCap >= 8) || (u.id === 'goldbrush' && state.goldBrush);
        list += `<div class="shop-row"><img class="px icon" src="${UI.iconUrl(u.icon)}" alt="">
          <div class="shop-info"><div class="shop-name">${u.name}</div><div class="shop-desc">${u.desc}</div></div>
          <div class="shop-buy"><span class="price">${u.price.toLocaleString()}g</span><button class="btn sm" type="button" data-buy="up:${u.id}" ${owned ? 'disabled' : ''}>${owned ? 'Owned' : 'Buy'}</button></div></div>`;
      });
    }
    const card = this.openModal('shop', `
      <header class="panel-head"><div><h2>Wren's Market</h2><p class="muted">Open 9 AM to 5 PM. Sell things in the bin by your house.</p></div>${goldTag()}</header>
      <div class="tabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" class="tab${k === tab ? ' on' : ''}" aria-selected="${k === tab}" data-tab="${k}">${n}</button>`).join('')}</div>
      <div class="shop-list">${list}</div>
      <div class="row-btns"><button class="btn" type="button" data-close>Leave</button></div>`, { wide: true });
    card.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; SFX.play('ui'); draw(); }));
    card.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => buy(b.dataset.buy)));
  };
  const pay = (price) => {
    if (state.gold < price) { UI.toast(`You need ${(price - state.gold).toLocaleString()}g more.`); SFX.play('nope'); return false; }
    state.gold -= price; SFX.play('buy'); return true;
  };
  const buy = (code) => {
    const [kind, id, n] = code.split(':');
    if (kind === 'seed') {
      const k = Number(n), seed = 'seed_' + id;
      if (!canFit(seed, k)) { UI.toast('Your bag is full.'); return; }
      if (!pay(CROPS[id].seed * k)) return;
      addItem(seed, k); UI.toast(`Bought ${k} ${CROPS[id].name} Seeds.`);
    } else if (kind === 'sup') {
      const s = SUPPLIES.find(x => x.id === id);
      if (s.item && !canFit(s.item)) { UI.toast('Your bag is full.'); return; }
      if (!pay(s.price)) return;
      if (s.hay) { state.hay += s.hay; UI.toast(`${s.hay} hay delivered to the silo (${state.hay} total).`); }
      else { addItem(s.item); UI.toast(`Bought a ${s.name}.`); }
    } else if (kind === 'uni') {
      const o = state.offers[Number(id)];
      if (o.sold || stableFull()) return;
      if (!pay(o.price)) return;
      o.sold = true;
      const u = makeUnicorn({ coat: o.coat, mane: o.mane, aff: 50 });
      this.closeModal();
      this.askName(u, `Your new ${COATS[o.coat].name} unicorn needs a name.`, () => {
        state.unicorns.push(u);
        const t = freePastureTile() || [32, 17];
        u._x = t[0] * TILE + 8; u._y = t[1] * TILE + 12; u._dir = 'r'; u._st = 'idle'; u._t = 2000; u._anim = 0;
        UI.toast(`${u.name} trotted into the pasture.`);
        SFX.play('wish');
      });
      return;
    } else if (kind === 'up') {
      const up = UPGRADES.find(x => x.id === id);
      if (!pay(up.price)) return;
      if (id === 'bigcan') {
        const i = state.inv.findIndex(s => s && s.id === 'can');
        if (i >= 0) state.inv[i] = { id: 'bigcan', n: 1 }; else addItem('bigcan');
        state.waterMax = 40; state.water = 40;
      } else if (id === 'stable') state.stableCap = 8;
      else if (id === 'goldbrush') state.goldBrush = true;
      UI.toast(`${up.name} is yours.`);
    }
    this.dirty = true;
    draw();
  };
  draw();
};

/* ---------- bag ---------- */

UI.openBag = function () {
  let picked = null;
  const draw = () => {
    let grid = '';
    for (let i = 0; i < INV_SIZE; i++) {
      const s = state.inv[i];
      if (i === HOTBAR) grid += '<div class="bag-divider">Backpack</div>';
      grid += `<button type="button" class="slot bag-slot${i === picked ? ' picked' : ''}${i === state.sel ? ' sel' : ''}" data-slot="${i}" aria-label="${s ? ITEMS[s.id].name : 'Empty slot'}">
        ${s ? `<img class="px" src="${UI.iconUrl(s.id)}" alt="">${s.n > 1 ? `<span class="n">${s.n}</span>` : ''}` : ''}</button>`;
    }
    const s = picked != null ? state.inv[picked] : null;
    const info = s ? `<div class="bag-info"><img class="px icon" src="${UI.iconUrl(s.id)}" alt="">
        <div><div class="shop-name">${ITEMS[s.id].name}${s.n > 1 ? ' ×' + s.n : ''}</div><div class="shop-desc">${ITEMS[s.id].desc || ''}</div>
        <div class="muted">${ITEMS[s.id].sell ? `Ships for ${ITEMS[s.id].sell}g each` : ITEMS[s.id].kind === 'tool' ? 'Tool' : 'Not for sale'}${ITEMS[s.id].energy ? ` · Restores ${ITEMS[s.id].energy} energy` : ''}</div>
        <div class="row-btns left">${picked < HOTBAR ? `<button class="btn sm" type="button" id="b-hold">Hold</button>` : ''}${ITEMS[s.id].energy ? '<button class="btn sm" type="button" id="b-eat">Eat one</button>' : ''}</div></div></div>`
      : '<p class="muted bag-hint">Pick an item to read about it. Pick a second slot to swap the two. The top row is your hotbar.</p>';
    const card = this.openModal('bag', `
      <header class="panel-head"><div><h2>Bag</h2><p class="muted">Silo ${state.hay} hay · Trough ${state.trough}/${state.stableCap} · Water ${state.water}/${state.waterMax}</p></div>${goldTag()}</header>
      <div class="bag-grid">${grid}</div>${info}
      <div class="row-btns"><button class="btn" type="button" data-close>Close</button></div>`, { wide: true });
    card.querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => {
      const i = Number(b.dataset.slot);
      SFX.play('ui');
      if (picked == null) picked = state.inv[i] ? i : null;
      else if (picked === i) picked = null;
      else { const t = state.inv[i]; state.inv[i] = state.inv[picked]; state.inv[picked] = t; picked = null; }
      draw();
    }));
    const hold = card.querySelector('#b-hold');
    if (hold) hold.addEventListener('click', () => { state.sel = picked; this.closeModal(); });
    const eat = card.querySelector('#b-eat');
    if (eat) eat.addEventListener('click', () => { const keep = state.sel; state.sel = picked; eatHeld(); state.sel = keep; if (!state.inv[picked]) picked = null; draw(); });
  };
  draw();
};

/* ---------- stable ---------- */

UI.openRoster = function () {
  const rows = state.unicorns.map(unicornRow).join('') || '<p class="empty">No unicorns yet. Wren sells them at the market.</p>';
  this.openModal('roster', `
    <header class="panel-head"><div><h2>Stable</h2><p class="muted">${state.unicorns.length} of ${state.stableCap} stalls · Silo ${state.hay} hay · Trough ${state.trough}/${state.stableCap}</p></div></header>
    <div class="roster">${rows}</div>
    <p class="muted small">Each unicorn eats one hay from the trough overnight. Pet and brush daily for hearts. More hearts mean richer Moonmilk.</p>
    <div class="row-btns"><button class="btn" type="button" data-close>Close</button></div>`, { wide: true });
};

UI.unicornCard = function (u) {
  const card = this.openModal('unicorn', `${unicornRow(u)}
    <p class="muted small">Age ${u.age} days · ${hearts(u)} hearts${u.adult ? ` · Moonmilk grade now: ${ITEMS[milkTier(u)].name}` : ''}</p>
    <div class="row-btns"><button class="btn" type="button" id="u-rename">Rename</button><button class="btn primary" type="button" data-close>Done</button></div>`);
  card.querySelector('#u-rename').addEventListener('click', () => { this.closeModal(); this.askName(u, 'A new name for ' + u.name, () => UI.toast(`Say hello to ${u.name}.`)); });
};

/* ---------- naming ---------- */

UI.askName = function (u, prompt, done) {
  const card = this.openModal('name', `
    <div class="name-box">${uniImg(u, true)}
      <h2>${esc(prompt)}</h2>
      <label for="name-input" class="muted">Name (up to 14 letters)</label>
      <div class="name-row"><input id="name-input" maxlength="14" autocomplete="off" value="${esc(u.name === 'Foal' ? pick(UNICORN_NAMES) : u.name)}" autofocus>
      <button class="btn sm" type="button" id="n-roll" aria-label="Suggest another name">Another</button></div>
      <div class="row-btns"><button class="btn primary" type="button" id="n-ok">That's the one</button></div></div>`, { closable: false });
  const inp = card.querySelector('#name-input');
  setTimeout(() => { inp.focus(); inp.select(); }, 40);
  card.querySelector('#n-roll').addEventListener('click', () => { inp.value = pick(UNICORN_NAMES); inp.focus(); });
  const ok = () => {
    const v = inp.value.trim().slice(0, 14);
    if (!v) { inp.focus(); return; }
    u.name = v; this.closeModal(); done && done();
  };
  card.querySelector('#n-ok').addEventListener('click', ok);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok(); } });
};

UI.namePending = function () {
  if (!state.pendingNames.length) return;
  const uid = state.pendingNames[0];
  const foal = state.unicorns.find(u => u.uid === uid);
  if (!foal) { state.pendingNames.shift(); return this.namePending(); }
  this.askName(foal, 'A foal was born! What will you call them?', () => {
    state.pendingNames.shift(); saveGame();
    setTimeout(() => this.namePending(), 50);
  });
};

/* ---------- the night's summary ---------- */

UI.summary = function (r, done) {
  const shipped = r.shipped.length ? r.shipped.map(s => `<li><img class="px" src="${UI.iconUrl(s.id)}" alt=""><span>${ITEMS[s.id].name} ×${s.n}</span><b>${s.gold.toLocaleString()}g</b></li>`).join('')
    + `<li class="total"><span>Total</span><b>${r.income.toLocaleString()}g</b></li>` : '<li class="muted">Nothing shipped today.</li>';
  const notes = r.notes.map(n => `<li class="note ${n.kind}">${esc(n.text)}</li>`).join('');
  const card = this.openModal('summary', `
    <header class="panel-head"><div><h2>${r.passedOut ? 'You collapsed' : 'Lights out'}</h2><p class="muted">${r.date} is over.${r.passedOut ? ' You wake with half your energy.' : ''}</p></div>${goldTag()}</header>
    <h3>Shipped</h3><ul class="ledger">${shipped}</ul>
    ${notes ? `<h3>Overnight</h3><ul class="notes">${notes}</ul>` : ''}
    <div class="forecast"><img class="px" src="${ART.url(ART.weather(r.weather))}" alt=""><span>${dateLabel()} · ${WEATHER_NAMES[r.weather]}${isShowDay() ? ' · Sparkle Show at the market today!' : ''}</span></div>
    <div class="row-btns"><button class="btn primary" type="button" id="s-wake">Wake up</button></div>`, { closable: false });
  card.querySelector('#s-wake').addEventListener('click', () => { this.closeModal(); done && done(); });
};

/* ---------- Sparkle Show ---------- */

UI.sparkleShow = function () {
  const adults = state.unicorns.filter(u => u.adult);
  if (!adults.length) { this.say('Wren', 'It\'s the Sparkle Show today, but you need a grown unicorn to enter. There\'s always next season!', () => this.openShop()); return; }
  const best = adults.reduce((a, b) => (b.aff > a.aff ? b : a));
  const h = hearts(best);
  const place = h >= 8 ? 1 : h >= 5 ? 2 : 3;
  const prize = [0, 1500, 600, 150][place];
  const card = this.openModal('show', `
    <div class="show"><h2>The ${SEASON_NAMES[state.season]} Sparkle Show</h2>
    <p class="muted">You lead ${esc(best.name)} into the ring. The judges lean forward.</p>
    ${uniImg(best, true)}${heartRow(best)}
    <p class="show-result" id="show-result">Judging…</p>
    <div class="row-btns"><button class="btn primary" type="button" id="show-ok" disabled>Collect prize</button></div></div>`, { closable: false });
  setTimeout(() => {
    SFX.play(place === 1 ? 'fanfare' : 'harvest');
    card.querySelector('#show-result').innerHTML = place === 1
      ? `<b>First place!</b> ${esc(best.name)}'s mane caught every light in the tent. You win ${prize}g and a Show Ribbon.`
      : place === 2 ? `<b>Second place.</b> A lovely showing. You win ${prize}g. Eight hearts would take first.`
      : `<b>Third place.</b> ${esc(best.name)} was a little shy. You win ${prize}g. Five hearts would place higher.`;
    card.querySelector('#show-ok').disabled = false;
  }, 1600);
  card.querySelector('#show-ok').addEventListener('click', () => {
    state.gold += prize; state.showDone = true; best.aff = clamp(best.aff + 30, 0, 1000);
    if (place === 1) { addItem('ribbon'); state.stats.ribbons++; }
    this.closeModal();
  });
};

/* ---------- menu and help ---------- */

const HELP_HTML = `
  <div class="help-grid">
    <div><h3>Controls</h3><dl class="keys">
      <dt>WASD / Arrows</dt><dd>Walk</dd>
      <dt>Click</dt><dd>Anything within one tile of you: uses the held item, or pets, harvests, picks up and opens</dd>
      <dt>Right-click</dt><dd>Pet, talk or open without using the held item</dd>
      <dt>Space</dt><dd>Use the held tool on the tile you face, or on the nearest unicorn</dd>
      <dt>E</dt><dd>Talk, pet, harvest or open whatever is nearest</dd>
      <dt>1–9, 0, −, =</dt><dd>Choose a hotbar slot (also Q / R or the mouse wheel)</dd>
      <dt>Tab</dt><dd>Open your bag</dd>
      <dt>F</dt><dd>Eat the held food</dd>
      <dt>M</dt><dd>Music on or off</dd>
      <dt>Esc</dt><dd>This menu</dd></dl></div>
    <div><h3>A day on the ranch</h3><ol class="steps">
      <li>Fill the trough in the pasture. It takes hay from the silo.</li>
      <li>Pet each unicorn (E) and brush them (Space with the Mane Brush).</li>
      <li>Collect Moonmilk from fed adults with the Moon Pail.</li>
      <li>Till, plant and water the field. Mow ripe Rainbow Clover with the sickle for hay.</li>
      <li>Ship goods in the bin by the house, then sleep before 2 AM.</li></ol>
      <p class="muted small">More hearts mean better Moonmilk. Brushing a full mane every few days gives a Rainbow Strand. At 4 hearts, a Wishing Charm brings a foal. The Sparkle Show is held on day 14 of spring, summer and fall.</p></div>
  </div>`;

UI.openMenu = function () {
  const card = this.openModal('menu', `
    <header class="panel-head"><div><h2>Paused</h2><p class="muted">${dateLabel()} · ${clockLabel()} · ${state.unicorns.length} unicorn${state.unicorns.length === 1 ? '' : 's'}</p></div>${goldTag()}</header>
    ${HELP_HTML}
    <div class="row-btns wrap">
      <button class="btn primary" type="button" data-close>Resume</button>
      <button class="btn" type="button" id="m-save">Save now</button>
      <button class="btn" type="button" id="m-music" aria-pressed="${SFX.musicOn}">Music: ${SFX.musicOn ? 'On' : 'Off'}</button>
      <button class="btn" type="button" id="m-sfx" aria-pressed="${SFX.sfxOn}">Sounds: ${SFX.sfxOn ? 'On' : 'Off'}</button>
      <button class="btn" type="button" id="m-art">Art Book</button>
      <button class="btn" type="button" id="m-title">Title screen</button>
    </div>`, { wide: true });
  card.querySelector('#m-save').addEventListener('click', (e) => { e.target.textContent = saveGame() ? 'Saved' : 'Could not save here'; });
  card.querySelector('#m-music').addEventListener('click', (e) => { SFX.setMusic(!SFX.musicOn); e.target.textContent = `Music: ${SFX.musicOn ? 'On' : 'Off'}`; });
  card.querySelector('#m-sfx').addEventListener('click', (e) => { SFX.sfxOn = !SFX.sfxOn; e.target.textContent = `Sounds: ${SFX.sfxOn ? 'On' : 'Off'}`; });
  card.querySelector('#m-art').addEventListener('click', () => this.openArtBook(() => this.openMenu()));
  card.querySelector('#m-title').addEventListener('click', () => {
    saveGame(); this.closeModal(); Game.running = false;
    this.showTitle();
  });
};

/* ---------- title ---------- */

UI.showTitle = function () {
  $('#hud').hidden = true; $('#touch').hidden = true; $('#title').hidden = false;
  const s = hasSave() ? loadGame() : null;
  $('#t-continue').hidden = !s;
  if (s) $('#t-continue').innerHTML = `Continue <span>${SEASON_NAMES[s.season]} ${s.day}, Year ${s.year} · ${s.unicorns.length} unicorn${s.unicorns.length === 1 ? '' : 's'}</span>`;
  // A preview ranch behind the title card: the saved one if there is one, with a few visitors.
  state = loadGame() || newState();
  state.time = 11 * 60;
  if (state.unicorns.length < 3) {
    const extra = [['lavender', 'sunset', true], ['midnight', 'aurora', true], ['rose', 'ocean', false], ['mint', 'berry', true]];
    extra.forEach(([coat, mane, adult]) => {
      const u = makeUnicorn({ coat, mane, adult }); state.unicorns.push(u);
    });
    placeUnicorns();
  }
  setTimeout(() => (s ? $('#t-continue') : $('#t-new')).focus(), 50);
};

$('#t-continue').addEventListener('click', () => {
  const s = loadGame();
  if (!s) return;
  state = s; SFX.init(); startGame(false);
});
$('#t-new').addEventListener('click', () => {
  SFX.init();
  if (hasSave()) {
    UI.confirm('Start a new ranch? Your saved ranch will be replaced when you next save.', 'Start fresh', () => startGame(true));
  } else startGame(true);
});
$('#t-help').addEventListener('click', () => UI.openModal('help', `<header class="panel-head"><h2>How to play</h2></header>${HELP_HTML}<div class="row-btns"><button class="btn primary" type="button" data-close>Got it</button></div>`, { wide: true }));
$('#t-art').addEventListener('click', () => UI.openArtBook());

/* ---------- Art Book: every sprite in the game ---------- */

UI.openArtBook = function (back) {
  const fig = (img, label, scale = 3) => `<figure><img class="px" src="${ART.url(img)}" style="width:${img.width * scale}px" alt="${esc(label)}"><figcaption>${esc(label)}</figcaption></figure>`;
  const sec = (title, figs, note) => `<section class="art-sec"><h3>${title}</h3>${note ? `<p class="muted small">${note}</p>` : ''}<div class="art-grid">${figs.join('')}</div></section>`;
  const coats = Object.keys(COATS), manes = Object.keys(MANES);
  const out = [];
  out.push(sec('Ranch folk', [
    ...['down', 'up', 'right', 'left'].map(d => fig(ART.farmer(d, 0), `Farmer ${d}`)),
    fig(ART.farmer('right', 1), 'Walk A'), fig(ART.farmer('right', 2), 'Walk B'), fig(ART.wren(false), 'Wren'),
  ]));
  out.push(sec('Unicorn coats', coats.map((c, i) => fig(ART.unicorn(c, manes[i % manes.length], 'adult', 0, 'r'), COATS[c].name)), 'Coat and mane are inherited separately. Foals usually take after their mother, with a small chance of a rare Celestial coat or Galaxy mane.'));
  out.push(sec('Manes', manes.map(m => fig(ART.unicorn('pearl', m, 'adult', 0, 'r'), MANES[m].name))));
  out.push(sec('Poses', [
    fig(ART.unicorn('rose', 'cotton', 'adult', 0, 'r'), 'Standing'), fig(ART.unicorn('rose', 'cotton', 'adult', 1, 'r'), 'Trotting'),
    fig(ART.unicorn('rose', 'cotton', 'adult', 2, 'r'), 'Asleep'),
    ...['lavender', 'mint', 'sunbeam', 'celestial'].map((c, i) => fig(ART.unicorn(c, manes[(i + 2) % manes.length], 'foal', 0, 'r'), `${COATS[c].name} foal`)),
    fig(ART.unicorn('mint', 'sunset', 'foal', 2, 'r'), 'Foal asleep'),
  ]));
  out.push(sec('Crops', Object.keys(CROPS).flatMap(id => [0, 1, 2, 3].map(st => fig(ART.crop(id, st), st === 3 ? CROPS[id].name : ['Seeds', 'Sprout', 'Growing'][st], 2))).concat([fig(ART.crop('carrot', 4), 'Withered', 2)])));
  out.push(sec('Goods and tools', Object.keys(ITEMS).map(id => fig(itemIcon(id), ITEMS[id].name, 2)).concat([fig(ART.icon('hay'), 'Hay', 2)])));
  out.push(sec('Buildings', [fig(ART.house('spring', false), 'Farmhouse', 2), fig(ART.house('winter', true), 'Farmhouse, winter night', 2),
    fig(ART.stable('summer', false), 'Stable', 2), fig(ART.silo('spring'), 'Silo', 2), fig(ART.stallBack(), 'Market stall', 2),
    fig(ART.bin(), 'Shipping bin', 3), fig(ART.trough(), 'Trough', 2), fig(ART.lamp(true), 'Lamp', 2), fig(ART.sign(), 'Sign', 2)]));
  out.push(sec('Seasons', SEASONS.flatMap(s => [fig(ART.tree('oak', s), `Oak, ${s}`, 2), fig(ART.tree('blossom', s), `Candyblossom, ${s}`, 2), fig(ART.grass(s, 0), `Grass, ${s}`, 3), fig(ART.bush(s), `Bush, ${s}`, 3)])));
  out.push(sec('Terrain', [fig(ART.field(0), 'Field', 3), fig(ART.soil(0), 'Tilled', 3), fig(ART.soil(1), 'Watered', 3), fig(ART.water(0), 'Pond', 3),
    fig(ART.path('spring', 0), 'Path', 3), fig(ART.rock(), 'Stone', 3), fig(ART.weed('spring'), 'Weed', 3), fig(ART.fence(10), 'Fence', 3),
    ...['sun', 'rain', 'snow', 'rainbow'].map(w => fig(ART.weather(w), WEATHER_NAMES[w], 3))]));
  const card = this.openModal('art', `
    <header class="panel-head"><div><h2>Art Book</h2><p class="muted">Every sprite in Moonmeadow Ranch is painted in code when the game loads.</p></div></header>
    <div class="art-book">${out.join('')}</div>
    <div class="row-btns"><button class="btn primary" type="button" id="art-close">Close</button></div>`, { wide: true });
  card.querySelector('#art-close').addEventListener('click', () => { this.closeModal(); if (back) back(); });
};
