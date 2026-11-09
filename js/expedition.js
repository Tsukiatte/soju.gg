/* The Expedition tab (3 Nov, owner: "change defense to expedite or something"): replaces defense.js. The map, the stage
   board you see before a fight, what a win pays and the wheel, and every window a stop on the map opens. The tab's id stays
   "defense" so the lobby's wiring didn't have to move. epic_map.js draws the map, epic_battle.js the fights.
   (3 Nov, owner: "theres way too much text, do icons and stuff"): pictures and numbers on screen, words only in tooltips. */
(function () {
const AF = window.AF, G = AF.G, EP = AF.EP, EM = AF.EM, EB = AF.EB, Bd = AF.Board, sfx = AF.sfx, EI = AF.EI, I = AF.EI.i;
const D = AF.Defense = { match: null };
const ui = () => AF.ui;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const big = n => (n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n)));
const yen = n => `<span class="ep-y">${I('coin')}<b>${big(n)}</b></span>`;
const caps = n => `<span class="ep-y">${I('cap')}<b>${n}</b></span>`;
const ANIMALS = () => Object.keys(EP.HEROES);
const heroName = a => { const u = G.towerOf(a); return (u && u.nick) || AF.CREW[a].name; };
const TIER_C = ['#c9955a', '#b8c0c8', '#d8884a', '#9aa6b8', '#e8eef6', '#7fe0a0', '#ffd93a', '#c9a8ff'];
const PERK = { chop: ['target', '15%'], skewer: ['bolt', '30%'], ladle: ['stars', '5%'], tray: ['shield', '5%'], sign: ['sword', '5%'], mitt: ['plus', '10%'] };
const chip = (ic, txt) => `<span class="ec">${I(ic)}${txt ? `<b>${txt}</b>` : ''}</span>`;
const dieI = n => I('die' + n);
const spotsHtml = n => `<span class="ep-spots">${[1, 2, 3].map(i => `<i class="${i <= (n || 0) ? 'on' : ''}"></i>`).join('')}</span>`;
const itemText = EP.itemText;
const prize = list => list.map(it => `<span class="ep-prize" title="${esc(itemText(it))}">${EI.of(it)}${it.n && it.kind !== 'recipe' ? `<b>${big(it.n)}</b>` : ''}</span>`).join('');
// what it takes, against what you have
const costLine = c => Object.keys(c.mats).map(m => { const has = EP.S().mats[m] || 0; return `<span class="ep-cost${has >= c.mats[m] ? '' : ' no'}" title="${esc(`${EP.MATS[m].n}: you have ${has}, this takes ${c.mats[m]}`)}">${EI.mat(m)}<b>${has}/${c.mats[m]}</b></span>`; }).join('') + (c.yen ? `<span class="ep-cost${G.S.yen >= c.yen ? '' : ' no'}" title="Yen">${I('coin')}<b>${c.yen}</b></span>` : '');
// a window: a small picture beside its title
function win(box, title, icon, cls, o = {}) {
  const close = ui().modal(box, Object.assign({ title, cls: 'ep-win ' + (cls || '') }, o));
  const h = box.closest('.modal')?.querySelector('.modal-head h2');
  if (h && icon) h.insertAdjacentHTML('afterbegin', icon);
  return close;
}

// ---------------- the layers ----------------
let host = null;
function ensureHost() { if (!host) { host = document.createElement('div'); host.className = 'ep-host'; document.body.appendChild(host); } return host; }
const inFight = () => !!(EB && EB.on);
const mapHooks = () => ({ pick: onPick, tick: onMapTick, find: onFind });
D.frame = dt => { if (inFight()) Bd.frame(dt); else if (EM.on) EM.frame(dt); };
D.background = () => {};
D.key = e => (inFight() ? EB.key(e) : false);
D.onTab = () => {
  const on = AF.UI.tab === 'defense';
  document.body.classList.toggle('ep-on', on);
  if (on && !inFight()) {
    ensureHost().style.display = '';
    if (!EM.on) EM.mount(host, mapHooks());
    EM.refresh(); paintHud();
    if (AF.tutorial) AF.tutorial.pump && AF.tutorial.pump();
  } else if (!on) {
    if (EM.on) EM.unmount();
    if (host) host.style.display = 'none';
  }
};

// ---------------- the old Defense names the lobby still calls ----------------
D.tags = null;
D.teamUnits = () => EP.partyList().map(a => G.towerOf(a)).filter(Boolean);
D.setTeam = list => { EP.setParty(list.map(u => AF.UNIT[u.k].animal)); if (EM.on) EM.refresh(); };
D.syncPads = () => {};
D.setWorld = () => {};
D.choose = () => {};
D.start = () => {};
D.leave = () => {};

// ---------------- the map's HUD ----------------
let lastWorld = -1;
const DOCK = [['emParty', 'party', 'Party', () => openParty()], ['emForge', 'anvil', 'Workshop', () => openCraft('g')], ['emPot', 'pot', 'Soup Pot', () => openCraft('p')], ['emMach', 'luckyb', 'Lucky Bottle', () => openMachine()], ['emDaily', 'sun', 'Daily Dive', () => openDaily()], ['emBag', 'bag', 'Pantry', () => openBag()]];
AF.pageDefense = () => {
  const p = $('#p-defense'); if (!p) return;
  if (!$('#emHud', p)) {
    p.innerHTML = `
      <div id="emHud" class="em-hud">
        <div class="em-team" title="Team level"><b id="emLv">1</b><div class="em-xp"><i id="emXp"></i></div></div>
        <div class="em-coins"><span title="Gold Caps">${I('cap')}<b id="emCaps">0</b></span><span title="Cheers">${I('cheers')}<b id="emCheers">0</b></span><span id="emEnT" title="Energy: auto-play uses 3 a fight">${I('bolt')}<b id="emEn">0</b></span></div>
      </div>
      <div class="em-world" id="emWorld"></div>
      <button class="em-goal" id="emGoal" title="Next stop"></button>
      <div class="em-zoom"><button id="emZi" title="Zoom in">${I('zoomIn')}</button><button id="emZo" title="Zoom out">${I('zoomOut')}</button></div>
      <div class="em-dock" id="emDock">${DOCK.map(([id, ic, name]) => `<button class="em-dockb" id="${id}" title="${name}">${I(ic)}</button>`).join('')}</div>`;
    for (const [id, , , f] of DOCK) $('#' + id, p).onclick = () => { sfx('click'); f(); };
    $('#emGoal', p).onclick = () => { sfx('click'); const n = EP.goal(); EM.home(); EM.focusOn(n.id); onPick(n); };
    $('#emZi', p).onclick = () => { sfx('click'); EM.zoomBy(0.62); };
    $('#emZo', p).onclick = () => { sfx('click'); EM.zoomBy(1.7); };
  }
  paintHud();
};
function paintHud() {
  const e = EP.S(), p = $('#p-defense'); if (!p || !$('#emHud', p)) return;
  $('#emLv', p).textContent = e.lv; { const tm = $('.em-team', p), cap = EP.levelCap(); if (tm) tm.title = e.lv >= cap ? `Team level ${e.lv}: the most for now. Beat this world's castle to grow, and forge gear` : `Team level. Up to ${cap} until you beat this world's castle`; }
  $('#emXp', p).style.width = (e.lv >= EP.LEVEL_MAX ? 100 : Math.min(100, (e.xp / EP.xpNeed(e.lv)) * 100)).toFixed(1) + '%';
  $('#emCaps', p).textContent = e.caps; { const en = $('#emEn'); if (en) { en.textContent = EP.energy(); const left = EP.energyIn(), tt = $('#emEnT'); if (tt) tt.title = left ? `Energy: auto-play uses 3 a fight. +1 in ${Math.ceil(left / 60)} min` : 'Energy: auto-play uses 3 a fight. Full'; } }
  $('#emCheers', p).textContent = e.cheers;
  const n = EP.goal(), arrow = n.kind === 'stage' || n.kind === 'castle' ? EP.arrow(n).id : 'yellow';
  $('#emGoal', p).innerHTML = `${I('pin')}<span class="ep-arrow mini ${arrow}"><i>${I(ARROW_I[arrow])}</i></span>`;
  $('#emDaily', p).classList.toggle('new', EP.dailyOpen());
}
function onMapTick(w) {
  if (w === lastWorld) return;
  lastWorld = w;
  const el = $('#emWorld'); if (!el) return;
  const open = EP.reachNode().world >= w;
  el.innerHTML = open ? `${EI.world(w)}<b>${esc(EP.WORLDS[w].name)}</b>` : I('lock');
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}
function onFind(id) {
  const it = EP.find(id); if (!it) return null;
  sfx('reveal', { i: 2 }); AF.ui.refresh(); paintHud();
  return `${EI.of(it)}<b>+${it.n}</b>`;
}
function onPick(n) {
  const e = EP.S();
  if (e.golden === n.id) { sfx('coin', { i: 8 }); EM.walkTo(n.id); openGolden(); return; }
  if (!EP.isOpen(n)) { sfx('error'); ui().toast('Locked'); return; }
  sfx('click');
  EM.walkTo(n.id);
  if (n.kind === 'stage' || n.kind === 'castle') openStage(n);
  else if (n.kind === 'hat') openHat(n);
  else if (n.kind === 'hut') openHut(n);
  else if (n.kind === 'gate') openGate(n);
  else if (n.kind === 'chest') openChest(n);
  else if (n.kind === 'landmark') openLandmark(n);
}

// ---------------- the stage board ----------------
const ARROW_I = { green: 'arrowG', yellow: 'arrowY', red: 'arrowR' };
const ARROW = { green: 'Easy: a walkover, pays a bit less', yellow: 'A fair fight', red: 'Tough: this will probably beat you' };
function waveCards(node) {
  return node.waves.map(w => `<div class="ep-wave">${w.map(q => {
    const K = EP.KITS[q.kit] || EP.KITS.brawl, type = q.type || (node.roster && node.roster[q.who]), base = AF.TD.ENEMIES[type], nm = q.name || (base && base.name) || 'Raider', pic = EI.foePic(type) || I('skull');
    return `<span class="ep-foe ${q.who === 'B' ? 'boss' : ''}" title="${esc(`${nm}. ${K.n}: ${K.d}`)}">${pic}${q.who === 'B' ? `<em>${I('crown')}</em>` : q.kit !== 'brawl' ? `<em>${EI.kit(q.kit)}</em>` : ''}</span>`;
  }).join('')}</div>`).join('');
}
// (owner: "only some strategies will work for some maps"): what this stage's world does, and which hero types answer it
function ruleRow(node) {
  const list = node.ruleByWave ? node.ruleByWave.filter((r, i, l) => l.findIndex(q => q.id === r.id) === i) : node.rules || [];
  if (!list.length) return '';
  return `<div class="ep-rules">${list.map(r => { const R = EP.RULES[r.id]; return `<span class="ep-rulec" title="${esc(R.n + '. ' + R.d)}">${I(R.ic)}<b>${esc(R.n)}</b><em title="Good here">${R.good.map(g => EI.role(g)).join('')}</em></span>`; }).join('')}</div>`;
}
// (5 Nov, owner: "a different combination is required for some of the rooms"): what stands in the way here, and who opens it. Green: you brought one. Plain flyers and casters are everywhere, so they only come up in a hold card
function lockRow(node) {
  const list = (node.waves ? EP.locksOf(node) : []).filter(id => id !== 'aloft' && id !== 'caster'), party = EP.partyList();
  if (!list.length) return '';
  return `<div class="ep-locks">${list.map(id => { const L = EP.LOCKS[id]; return `<span class="ep-lock${L.keys.some(a => party.includes(a)) ? ' have' : ''}" title="${esc(`${L.n}. ${L.d} Opened by ${L.keys.map(heroName).join(', ')}.`)}">${I(L.ic)}<b>${esc(L.n)}</b><em>${L.keys.map(a => `<span class="ep-lockh" data-card="${a}">${EI.role(EP.HEROES[a].role)}</span>`).join('')}</em></span>`; }).join('')}</div>`;
}
const starsHtml = n => `<span class="ep-stars">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
function classChip(a) {
  const h = EP.hero(a), C = EP.classOf(a, h.cls), many = h.owned.length > 1;
  return `<button class="ep-cls${many ? ' many' : ''}" data-ep="cycle:${a}" title="${esc(C.n)}">${EI.hat(C.hat)}<b>${esc(C.n)}</b>${many ? I('swap') : ''}</button>`;
}
function partyHtml() {
  const list = EP.partyList(), slots = [0, 1, 2].map(i => {
    const a = list[i];
    if (!a) return `<div class="ep-slot empty">${I('plus')}</div>`;
    const H = EP.HEROES[a], u = EP.heroUnit(a);
    return `<div class="ep-slot r-${H.role}"><button class="ep-fig" data-ep="hero:${a}" data-card="${a}" title="${esc(heroName(a))}. Right click to bench"></button><span class="ep-rolei" title="${EP.ROLE[H.role].n}">${EI.role(H.role)}</span>${classChip(a)}<span class="ep-stat">${chip('heart', big(u.max))}${chip('sword', big(u.atk))}</span></div>`;
  }).join('');
  const bench = ANIMALS().filter(a => EP.owned(a)).filter(a => !list.includes(a)), locked = ANIMALS().filter(a => !EP.owned(a));
  return `<div class="ep-slots">${slots}</div>
    ${bench.length || locked.length ? `<div class="ep-bench">${bench.map(a => `<button class="ep-benchb" data-ep="swap:${a}" title="${esc(heroName(a))}: ${EP.ROLE[EP.HEROES[a].role].n}"><span data-card="${a}"></span>${EI.role(EP.HEROES[a].role)}</button>`).join('')}${locked.length ? `<button class="ep-benchb lock" data-ep="hire" title="Hire more on the Heroes tab">${I('lock')}<b>${locked.length}</b></button>` : ''}</div>` : ''}`;
}
function paintFigs(root) {
  for (const b of $$('[data-card]', root)) {
    const u = G.towerOf(b.dataset.card); if (!u) continue;
    b.innerHTML = '<canvas></canvas>';
    if (b.classList.contains('ep-fig') || b.closest('.ep-joined')) AF.R3.view(b.firstChild, AF.formKey(u), { tier: AF.traitVis(G.trait(u)) });
    else AF.R3.view(b.firstChild, AF.formKey(u), { fx: false });
  }
}
let boardClose = null, boardDraw = null;
function openStage(node) { openBoard(node, EP.fightOf(node), {}); }
function openBoard(node, fight, o = {}) {
  const box = document.createElement('div'); box.className = 'ep-board';
  const draw = () => {
    const best = node.id ? EP.best(node.id) : 0, ar = node.id ? EP.arrow(node).id : 'yellow', cleared = node.id && EP.S().runs[node.id];
    const first = o.prize || (node.id && !cleared ? EP.prizeOf(node) : null);
    box.innerHTML = `
      <div class="ep-b-top"><div class="ep-arrow ${ar}" title="${ARROW[ar]}"><i>${I(ARROW_I[ar])}</i></div>${node.id ? starsHtml(best) : ''}</div>
      ${ruleRow(node)}${lockRow(node)}
      <div class="ep-waves">${waveCards(node)}</div>
      <div class="ep-b-prize">${first ? prize(first) : `<span class="ep-prize" title="Yen">${I('coin')}</span><span class="ep-prize" title="Team XP">${I('xp')}</span><span class="ep-prize" title="A spin of the wheel">${I('wheel')}</span>`}</div>
      ${partyHtml()}
      <div class="ep-b-go"><button class="btn prim ep-gobtn" id="epGo" title="Start">${I('play')}</button></div>`;
    paintFigs(box);
    $('#epGo', box).onclick = () => {
      if (!EP.partyList().length) { sfx('error'); return; }
      sfx('click'); if (boardClose) boardClose(); startFight(node, fight, o);
    };
  };
  draw();
  boardDraw = draw;
  const wi = node.world != null ? EI.world(node.world) : '';
  boardClose = win(box, node.name, wi, '', { onClose: () => { boardDraw = null; } });
}
function openParty() {
  const box = document.createElement('div'); box.className = 'ep-board';
  const draw = () => { box.innerHTML = partyHtml(); paintFigs(box); };
  draw(); boardDraw = draw;
  win(box, 'Party', I('party'), '', { onClose: () => { boardDraw = null; if (EM.on) EM.refresh(); } });
}
function swapIn(a) {
  const list = EP.partyList();
  if (list.length < 3) list.push(a); else list[list.length - 1] = a;
  EP.setParty(list); if (boardDraw) boardDraw(); if (EM.on) EM.refresh();
  sfx('equip');
}
// (4 Nov, owner: "make right click to unequip and equip"): in the party it benches a hero, on the bench or the Heroes list it brings one in. One always stays.
D.toggleMember = a => {
  const list = EP.partyList();
  if (list.includes(a)) {
    if (list.length <= 1) { sfx('error'); ui().toast('Keep one hero in your party'); return false; }
    EP.setParty(list.filter(x => x !== a)); if (boardDraw) boardDraw(); if (EM.on) EM.refresh();
    sfx('equip');
    return true;
  }
  if (!EP.owned(a)) return false;
  swapIn(a);
  return true;
};
document.addEventListener('contextmenu', e => {
  if (!e.target.closest) return;
  const slot = e.target.closest('.ep-slot'), t = (slot && slot.querySelector('[data-ep^="hero:"]')) || e.target.closest('[data-ep^="swap:"]');
  if (!t) return;
  e.preventDefault();
  D.toggleMember(t.dataset.ep.split(':')[1]);
});
// clicks in hero windows and boards, wherever they are
document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-ep]'); if (!t) return;
  const [cmd, a, b] = t.dataset.ep.split(':');
  if (cmd === 'swap') swapIn(a);
  else if (cmd === 'hire') { sfx('click'); while (AF.UI.modalClose) AF.UI.modalClose(); AF.ui.go('units'); }
  else if (cmd === 'cycle') { const h = EP.hero(a), i = h.owned.indexOf(h.cls); if (h.owned.length > 1) { h.cls = h.owned[(i + 1) % h.owned.length]; G.save(); sfx('equip'); if (boardDraw) boardDraw(); } }
  else if (cmd === 'hero') { const u = G.towerOf(a); if (u) { sfx('click'); ui().openUnit(u, {}); } }
  else if (cmd === 'class') { if (EP.setClass(a, b)) { sfx('equip'); repaintHero(); if (boardDraw) boardDraw(); } else { sfx('error'); ui().toast('Hat Stall'); } }
  else if (cmd === 'gear') { sfx('click'); openGear(a, b); }
});

// ---------------- a hero: stats, class, skills, gear (also on the Heroes tab) ----------------
function gearSlot(a, slot) {
  const h = EP.hero(a), it = h[slot] ? EP.itemById(h[slot]) : null, stat = slot === 'w' ? 'sword' : 'heart';
  return `<button class="ep-gear${it ? '' : ' none'}" data-ep="gear:${a}:${slot}" title="${it ? esc(EP.itemName(it) + '. ' + EP.itemPerk(it)) : slot === 'w' ? 'Weapon' : 'Off-hand'}">${it ? `<span class="ep-gi" style="--t:${TIER_C[it.tier - 1]}">${EI.item(it)}</span>${chip(stat, '+' + Math.round(EP.itemValue(it) * 100) + '%')}${spotsHtml(it.spots)}` : `<span class="ep-gi empty">${I(stat)}</span>${I('plus')}`}</button>`;
}
const skillRow = (ic, sk, cls) => `<div class="ep-skill ${cls}" title="${esc(sk.d)}"><i>${I(ic)}</i><span><b>${esc(sk.n)}</b>${EI.chips(sk)}</span></div>`;
function heroBlockFor(a) {
  const H = EP.HEROES[a], R = EP.ROLE[H.role], h = EP.hero(a), C = EP.classOf(a, h.cls), u = EP.heroUnit(a), tier = h.tiers[C.id] || 0;
  return `<div class="ep-hero" data-hero="${a}">
    <div class="ep-h-stats">${chip('heart', big(u.max))}${chip('sword', big(u.atk))}<span class="ec ep-rolew" title="${R.n}: ${R.d}">${EI.role(H.role)}<b>${R.n}</b></span><span class="ec" title="Team level">${I('xp')}<b>${EP.S().lv}</b></span>${tier ? `<span class="ec" title="Trained">${I('st_power')}<b>${tier}</b></span>` : ''}</div>
    <div class="ep-h-cls">${H.classes.map(c => { const own = h.owned.includes(c.id), on = c.id === h.cls; return `<button class="ep-cl${on ? ' on' : ''}${own ? '' : ' no'}" data-ep="class:${a}:${c.id}" title="${esc(c.n)}">${EI.hat(c.hat)}${own ? '' : `<u>${I('lock')}</u>`}</button>`; }).join('')}</div>
    ${skillRow(EP.SIG[a].ic, EP.SIG[a], 'sig')}${skillRow('sword', C.a, 'atk')}${skillRow('t_ally', C.s, 'sup')}${skillRow('bottle', H.rage, 'rage')}
    <div class="ep-h-gear">${gearSlot(a, 'w')}${gearSlot(a, 'o')}</div>
  </div>`;
}
D.heroBlock = u => { const a = AF.UNIT[u.k].animal; return EP.HEROES[a] ? heroBlockFor(a) : ''; };
D.heroTip = u => { const a = AF.UNIT[u.k].animal, H = EP.HEROES[a]; if (!H) return ''; const C = EP.classOf(a, EP.hero(a).cls), v = EP.heroUnit(a); return `<div class="ep-tip"><span class="ecs">${chip('heart', big(v.max))}${chip('sword', big(v.atk))}<span class="ec">${EI.role(H.role)}</span><span class="ec">${EI.hat(C.hat)}</span></span>${skillRow(EP.SIG[a].ic, EP.SIG[a], 'sig')}${skillRow('sword', C.a, 'atk')}${skillRow('t_ally', C.s, 'sup')}</div>`; };
function repaintHero() { for (const el of $$('.ep-hero[data-hero]')) el.outerHTML = heroBlockFor(el.dataset.hero); }
function openGear(a, slot) {
  const box = document.createElement('div'); box.className = 'ep-board';
  let close = null;
  const e = EP.S(), list = e.gear.filter(it => it.slot === slot).sort((x, y) => EP.itemValue(y) - EP.itemValue(x)), h = EP.hero(a), stat = slot === 'w' ? 'sword' : 'heart';
  box.innerHTML = list.length ? `<div class="ep-tiles">${list.map(it => { const w = EP.wornBy(it.uid), mine = h[slot] === it.uid; return `<button class="ep-tile${mine ? ' on' : ''}" data-it="${it.uid}" title="${esc(EP.itemName(it) + '. ' + EP.itemPerk(it))}" style="--t:${it.set ? EI.setC(it.set) : TIER_C[it.tier - 1]}"><span class="ep-ti">${EI.item(it)}</span>${chip(stat, '+' + Math.round(EP.itemValue(it) * 100) + '%')}${it.base ? chip(PERK[it.base][0], PERK[it.base][1]) : ''}${spotsHtml(it.spots)}${w ? `<em data-card="${w}"></em>` : ''}</button>`; }).join('')}</div>` : `<div class="ep-empty">${I('anvil')}</div>`;
  paintFigs(box);
  for (const b of $$('[data-it]', box)) b.onclick = () => { const id = +b.dataset.it; EP.equip(a, slot, h[slot] === id ? 0 : id); sfx('equip'); repaintHero(); if (boardDraw) boardDraw(); close(); };
  close = win(box, heroName(a), I(stat), 'ep-narrow');
}

// ---------------- the fight ----------------
function startFight(node, fight, o) {
  const go = () => {
    const units = EP.partyUnits();
    if (EM.on) EM.unmount();
    ensureHost().style.display = '';
    document.body.classList.add('ep-fight');
    EB.start(host, fight, units, { autoLocked: !EP.autoOk(node), onEnd: B => endFight(B, node, fight, o), onQuit: () => backToMap(null, node) });
    AF.ui.sync3d();
  };
  cross(fight, go);
}
function cross(fight, swap) {
  if (!AF.clouds || matchMedia('(prefers-reduced-motion: reduce)').matches || D.noClouds) { swap(); return; }
  const th = fight && AF.WORLDS && AF.WORLDS[fight.theme];
  D.crossing = true;
  AF.clouds.swap({ tint: th ? '#' + new THREE.Color(th.fog).getHexString() : null, cover: () => { D.crossing = false; swap(); }, push: () => {}, settle: () => {} });
}
// (5 Nov, owner: "after rounds, send them back to where the node is not the highest one"): back on the map at the stop just fought, the camera on it. A fight with no stop of its own (the Daily Dive) leaves the party where it stood
function backToMap(after, node) {
  cross(null, () => {
    EB.leave();
    document.body.classList.remove('ep-fight');
    const ov = $('.ep-over'); if (ov) ov.remove();
    const at = node && (node.id || node.at);
    if (at && EM.posOf(at)) EM.placeAt(at);
    if (AF.UI.tab === 'defense') { EM.mount(host, mapHooks()); EM.refresh(); paintHud(); }
    AF.ui.refresh();
    if (after) after();
  });
}
function endFight(B, node, fight, o) {
  if (B.state === 'won') {
    const r = EP.finish(B, node);
    if (node.daily) EP.dailyDone();
    if (node.golden) EP.goldenGone();
    AF.ui.refresh();
    showWin(B, node, fight, r, o);
  } else {
    if (node.golden) EP.goldenGone();
    showLoss(B, node, fight, o);
  }
}
function overlay(html, cls) {
  const ov = document.createElement('div'); ov.className = 'ep-over ' + (cls || ''); ov.innerHTML = html;
  document.body.appendChild(ov);
  return ov;
}
function showWin(B, node, fight, r, o) {
  sfx('win'); if (r.ups) setTimeout(() => sfx('levelup'), 1100); if (r.hero) setTimeout(() => sfx('reveal', { i: 3 }), 500);
  const left = Math.round(B.heroes.reduce((a, u) => a + Math.max(0, u.hp) / u.max, 0) / B.heroes.length * 100), par = EP.parOf(B.stage);
  const ov = overlay(`<div class="ep-over-in">
    <div class="ep-bigstars">${[1, 2, 3].map(i => `<i class="${i <= r.stars ? 'on' : ''}" style="--d:${i * 0.18}s"></i>`).join('')}</div>
    <div class="ep-why"><span class="ec${B.stats.turns <= par + 1 ? ' good' : ' bad'}" title="Turns, and par">${I('hourglass')}<b>${B.stats.turns}/${par}</b></span><span class="ec${left >= 45 ? ' good' : ' bad'}" title="Team health left">${I('heart')}<b>${left}%</b></span></div>
    <div class="ep-pays"><span title="Yen">${I('coin')}<b>${r.yen}</b></span><span title="Team XP">${I('xp')}<b>${r.xp}</b></span>${r.ups ? `<span class="up" title="Team level">${I('st_power')}<b>${r.level}</b>${I('cap')}<b>${r.ups}</b></span>` : ''}${r.cheers ? `<span title="Cheers, for 3 stars">${I('cheers')}<b>1</b></span>` : ''}${r.prize.map(it => `<span title="${esc(itemText(it))}">${EI.of(it)}<b>${it.n}</b></span>`).join('')}</div>
    ${r.hero ? `<div class="ep-joined"><b class="ep-j-new">New hero!</b><span data-card="${r.hero}"></span><b class="ep-j-name">${esc(heroName(r.hero))}</b>${AF.roleTag(r.hero)}${EP.partyList().includes(r.hero) ? `<em title="In your party">${I('party')}</em>` : ''}</div>` : ''}
    <div class="ep-over-b"><button class="ep-big" id="epWheel" title="Spin the wheel">${I('wheel')}</button></div></div>`);
  paintFigs(ov);
  $('#epWheel', ov).onclick = () => { sfx('click'); ov.remove(); showWheel(node, fight, r, o); };
}
function showLoss(B, node, fight, o) {
  sfx('lose');
  const ov = overlay(`<div class="ep-over-in lost"><div class="ep-lostart">${I('skull')}</div>
    <div class="ep-over-b"><button class="ep-big" id="epAgain" title="Try again">${I('retry')}</button><button class="ep-big" id="epMap" title="Back to the map">${I('map')}</button></div></div>`);
  $('#epAgain', ov).onclick = () => { sfx('click'); ov.remove(); startFight(node, fight, o); };
  $('#epMap', ov).onclick = () => { sfx('click'); ov.remove(); backToMap(null, node); };
}

// ---------------- the wheel ----------------
function wheelSvg(L) {
  const R = 150, n = L.length, seg = (Math.PI * 2) / n, cols = ['#2f8f5a', '#3aa56a'];
  const pic = it => (it.kind === 'mat' ? 'mat_' + it.id : it.kind === 'yen' ? 'coin' : it.kind === 'caps' ? 'cap' : it.kind === 'cheers' ? 'cheers' : 'pot_' + it.id);
  let s = '';
  L.forEach((it, i) => {
    const a0 = i * seg - seg / 2 - Math.PI / 2, a1 = a0 + seg, x0 = 160 + R * Math.cos(a0), y0 = 160 + R * Math.sin(a0), x1 = 160 + R * Math.cos(a1), y1 = 160 + R * Math.sin(a1), am = i * seg - Math.PI / 2, lx = 160 + 106 * Math.cos(am), ly = 160 + 106 * Math.sin(am), deg = i * (360 / n);
    s += `<path class="ep-wedge" data-i="${i}" d="M160 160 L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${cols[i % 2]}" stroke="#123" stroke-width="2"/>
      <g transform="translate(${lx.toFixed(1)} ${ly.toFixed(1)}) rotate(${deg})">${EI.nest(pic(it), -21, -26, 42, 42)}<text text-anchor="middle" y="28" font-size="15" font-weight="800" fill="#fff" stroke="#123" stroke-width="3" paint-order="stroke">${it.n > 1 ? it.n : ''}</text></g>`;
  });
  // a rim with pegs, and the bottle cap in the middle
  for (let k = 0; k < n; k++) { const a = k * seg - seg / 2 - Math.PI / 2; s += `<circle cx="${(160 + 152 * Math.cos(a)).toFixed(1)}" cy="${(160 + 152 * Math.sin(a)).toFixed(1)}" r="4.5" fill="#ffd93a" stroke="#123" stroke-width="1.5"/>`; }
  return `<svg viewBox="0 0 320 320" class="ep-wheel-s"><circle cx="160" cy="160" r="156" fill="none" stroke="#123" stroke-width="9"/><circle cx="160" cy="160" r="156" fill="none" stroke="#c9981a" stroke-width="5"/><g class="ep-wheel-r">${s}${EI.nest('cap', 124, 124, 72, 72)}</g></svg>`;
}
function showWheel(node, fight, r, o) {
  const L = EP.wheelOf(node), stars = r.stars;
  const ov = overlay(`<div class="ep-over-in wheel">
    <div class="ep-wheel">${wheelSvg(L)}${[0, 1, 2].map(i => `<i class="ep-ptr p${i}${i < stars ? '' : ' off'}">${I('ptr')}</i>`).join('')}</div>
    <div class="ep-won" id="epWon"></div>
    <div class="ep-over-b"><button class="ep-big" id="epRespin" disabled title="Spin again for 1 Cheers"></button><button class="ep-big go" id="epCollect" disabled title="Collect">${I('check')}</button></div></div>`);
  const rot = $('.ep-wheel-r', ov), won = $('#epWon', ov), re = $('#epRespin', ov), col = $('#epCollect', ov), seg = 360 / L.length;
  let angle = 0, got = null;
  const hits = on => { for (const w of $$('.ep-wedge', ov)) { const i = +w.dataset.i; w.classList.toggle('won', !!on && EP.POINTERS.slice(0, stars).some(p => (got.at + p) % L.length === i)); } };
  // (3 Nov, owner: "at the end of the runs, the wheel doesnt spin"): it used to set its end angle in the same moment the wheel
  // appeared, so the browser had nothing to animate from and it jumped straight there. Now every frame turns it, by the clock
  const spin = () => {
    col.disabled = true; re.disabled = true; won.innerHTML = ''; hits(false);
    got = EP.spin(L, stars);
    const start = angle, end = -got.at * seg - 360 * (5 + Math.floor(Math.random() * 2)) + Math.ceil(start / 360) * 360, dur = D.fastWheel ? 60 : 3000, t0 = performance.now();
    let lastTick = Math.floor(start / seg);
    sfx('whoosh');
    const frame = now => {
      if (!ov.isConnected) return;
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3.4);
      angle = start + (end - start) * e;
      rot.setAttribute('transform', `rotate(${angle.toFixed(2)} 160 160)`);
      const tick = Math.floor(angle / seg);
      if (tick !== lastTick) { lastTick = tick; sfx('tick', { i: 4 }); for (const p of $$('.ep-ptr', ov)) { p.classList.remove('tk'); void p.getBoundingClientRect(); p.classList.add('tk'); } }
      if (k < 1) { requestAnimationFrame(frame); return; }
      angle = end;
      rot.dataset.at = String(got.at);
      sfx('collect', { i: 4 });
      hits(true);
      won.innerHTML = prize(got.items);
      col.disabled = false;
      re.disabled = EP.S().cheers < 1;
      re.innerHTML = `${I('retry')}${I('cheers')}<b>${EP.S().cheers}</b>`;
    };
    requestAnimationFrame(frame);
  };
  re.innerHTML = `${I('retry')}${I('cheers')}<b>${EP.S().cheers}</b>`;
  re.onclick = () => { if (EP.respin()) { sfx('click'); spin(); } };
  col.onclick = () => {
    sfx('collect', { i: 6 });
    EP.give(got.items); G.save();
    ov.remove();
    backToMap(null, node);
  };
  // the window pops in first, so you see it start
  setTimeout(() => { if (ov.isConnected) spin(); }, D.fastWheel ? 0 : 380);
}

// ---------------- stops on the map ----------------
function openHat(n) {
  const box = document.createElement('div'); box.className = 'ep-board';
  const draw = () => {
    const owned = ANIMALS().filter(a => EP.owned(a)), w = n.world;
    box.innerHTML = `<div class="ep-hats">${owned.map(a => {
      const H = EP.HEROES[a], h = EP.hero(a);
      return `<div class="ep-hatrow"><span class="ep-hatfig" title="${esc(heroName(a))}"><span data-card="${a}"></span>${EI.role(H.role)}</span><div class="ep-tiles">${H.classes.map((c, i) => {
        const own = h.owned.includes(c.id), t = h.tiers[c.id] || 0, opens = EP.classOpens(i), p = i ? EP.classPrice(a, i) : null, sold = w >= opens;
        const act = own ? (t < EP.TIER_MAX ? `<button class="ep-buy" data-train="${a}:${c.id}" title="Train: 10% stronger">${I('st_power')}${yen(EP.tierPrice(t))}</button>` : `<span class="ep-buy done">${I('check')}</span>`) : sold ? `<button class="ep-buy go" data-buy="${a}:${c.id}" title="Buy">${p.yen ? yen(p.yen) : caps(p.caps)}</button>` : `<span class="ep-buy done" title="${esc(EP.WORLDS[opens].name)}">${I('lock')}${EI.world(opens)}</span>`;
        return `<div class="ep-tile${own ? ' own' : ''}" title="${esc(c.n)}"><span class="ep-ti">${EI.hat(c.hat)}${t ? `<u>${t}</u>` : ''}</span><b>${esc(c.n)}</b><div class="ep-tchips" title="${esc(c.a.n + ': ' + c.a.d)}">${EI.chips(c.a)}</div><div class="ep-tchips" title="${esc(c.s.n + ': ' + c.s.d)}">${EI.chips(c.s)}</div>${act}</div>`;
      }).join('')}</div></div>`;
    }).join('')}</div>`;
    paintFigs(box);
    for (const b of $$('[data-buy]', box)) b.onclick = () => { const [a, id] = b.dataset.buy.split(':'); if (EP.buyClass(a, id)) { sfx('unlock'); ui().refresh(); draw(); paintHud(); } else { sfx('error'); FXno(b); } };
    for (const b of $$('[data-train]', box)) b.onclick = () => { const [a, id] = b.dataset.train.split(':'); if (EP.trainClass(a, id)) { sfx('unlock'); ui().refresh(); draw(); paintHud(); } else { sfx('error'); FXno(b); } };
  };
  draw();
  win(box, 'Hat Stall', I('tent'));
}
const FXno = b => { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); };
const recipeIcon = id => { const [k, a, t] = id.split(':'); return k === 'p' ? `<span class="ep-ti">${EI.pot(a)}</span>` : `<span class="ep-ti" style="--t:${TIER_C[+t - 1]}">${EI.gear(a)}<u>${t}</u></span>`; };
const recipeChips = id => {
  const [k, a, t] = id.split(':');
  if (k === 'p') return { heal1: chip('heart', '25%'), heal2: chip('heart', '50%'), heal3: chip('heart', '75%'), rage1: chip('bottle', '25%'), rage2: chip('bottle', '50%'), rage3: chip('bottle', '75%'), group: chip('t_team', '30%'), xp2: chip('xp', '×2') }[a] || '';
  const W = EP.WEAPONS[a], v = Math.round(EP.itemValue({ tier: +t, spots: 0 }) * 100);
  return chip(W ? 'sword' : 'heart', '+' + v + '%') + chip(PERK[a][0], PERK[a][1]);
};
function openHut(n) {
  const box = document.createElement('div'); box.className = 'ep-board';
  const draw = () => {
    const e = EP.S(), list = EP.recipesAt(n.world);
    box.innerHTML = `<div class="ep-tiles">${list.map(r => { const k = e.recipes.includes(r.id), c = EP.recipeCost(r.id); return `<div class="ep-tile${k ? ' own' : ''}" title="${esc(EP.recipeName(r.id))}">${recipeIcon(r.id)}<div class="ep-tchips">${recipeChips(r.id)}</div><div class="ep-costs">${Object.keys(c.mats).map(m => `<span class="ep-cost" title="${esc(EP.MATS[m].n)}">${EI.mat(m)}<b>${c.mats[m]}</b></span>`).join('')}</div>${k ? `<span class="ep-buy done">${I('check')}</span>` : `<button class="ep-buy go" data-r="${r.id}" data-p="${r.price}" title="Buy recipe">${yen(r.price)}</button>`}</div>`; }).join('')}</div>`;
    for (const b of $$('[data-r]', box)) b.onclick = () => { if (EP.buyRecipe(b.dataset.r, +b.dataset.p)) { sfx('unlock'); ui().refresh(); draw(); } else { sfx('error'); FXno(b); } };
  };
  draw();
  win(box, 'Recipe Hut', I('scroll'), 'ep-narrow');
}
function openGate(n) {
  const w = n.world, box = document.createElement('div'); box.className = 'ep-board';
  const draw = () => {
    const e = EP.S(), open = EP.gateOpen(w), left = EP.gateLeft(w);
    box.innerHTML = open ? `<div class="ep-empty">${I('check')}</div>` : `
      <div class="ep-gateart" title="Three harder fights and a chest">${I('gate')}${I('sword')}${I('sword')}${I('sword')}${I('chest')}</div>
      <div class="ep-gate"><button class="ep-big go" id="epGP"${e.caps < EP.GATE_COST ? ' disabled' : ''} title="Pay to open">${caps(EP.GATE_COST)}</button>
      ${left > 0 ? `<button class="ep-big" disabled>${I('hourglass')}<b>${Math.ceil(left / 3600000)}h</b></button>` : `<button class="ep-big" id="epGK" title="Knock and wait">${I('hourglass')}<b>8h</b></button>`}</div>`;
    const p = $('#epGP', box), k = $('#epGK', box);
    if (p) p.onclick = () => { if (EP.gatePay(w)) { sfx('unlock'); EM.refresh(); paintHud(); draw(); } };
    if (k) k.onclick = () => { EP.gateKnock(w); sfx('click'); draw(); };
  };
  draw();
  win(box, 'Buddy Gate', I('gate'), 'ep-narrow');
}
function openChest(n) {
  const got = EP.openChest(n.world, n.ckey);
  if (got) { sfx('treasure'); AF.ui.refresh(); paintHud(); EM.refresh(); }
  const box = document.createElement('div'); box.className = 'ep-board';
  box.innerHTML = got ? `<div class="ep-loot">${prize(got)}</div>` : `<div class="ep-empty">${I('check')}</div>`;
  win(box, 'Chest', I('chest'), 'ep-narrow');
}
// (4 Nov, owner: "make them have a special node"): a landmark's postcard stop. A picture of it, taken from where you are standing; the picnic; and this world's three postcards
function openLandmark(n) {
  const key = n.lm, L = EP.lmBy(key), first = EP.lmStamp(key);
  if (first) { sfx('treasure'); AF.ui.refresh(); paintHud(); }
  const box = document.createElement('div'); box.className = 'ep-board lm-win';
  const hrs = ms => { const m = Math.ceil(ms / 60000); return m >= 60 ? `${Math.ceil(m / 60)}h` : `${m}m`; };
  const draw = (justRested) => {
    const left = EP.lmRestIn(key), full = EP.energy() >= EP.ENERGY_MAX, can = EP.lmCanRest(key);
    box.innerHTML = `
      <div class="lm-card"><canvas id="lmPic" width="480" height="320"></canvas>${first ? `<i class="lm-stamp">${I('check')}</i>` : ''}</div>
      ${first ? `<div class="ep-loot lm-loot">${prize(first.got)}</div>` : ''}
      <button class="ep-big${can ? ' go' : ''}" id="lmRest"${can ? '' : ' disabled'} title="${left ? 'Picnic again later' : full ? 'Energy is already full' : 'Picnic here: refills auto-play energy'}">${left ? `${I('hourglass')}<b>${hrs(left)}</b>` : `${I('bolt')}<b>${justRested ? '+' + justRested : '+' + EP.lmEnergy(key)}</b>`}<span class="lm-now">${I('bolt')}<b>${EP.energy()}/${EP.ENERGY_MAX}</b></span></button>
      <div class="lm-set" title="Postcards from this world">${EP.LANDMARKS[L.w].map(q => `<span class="lm-mini${EP.lmHas(q.key) ? '' : ' off'}${q.key === key ? ' here' : ''}" title="${esc(EP.lmHas(q.key) ? q.name : '???')}">${EP.lmHas(q.key) ? `<canvas data-k="${q.key}" width="96" height="64"></canvas>` : I('lock')}</span>`).join('')}<b class="lm-all" title="Every postcard on the island">${EP.lmCount()}/24</b></div>`;
    const pic = EM.postcard(key); if (pic) $('#lmPic', box).getContext('2d').drawImage(pic, 0, 0, 480, 320);
    box.querySelectorAll('canvas[data-k]').forEach(c => { const p = EM.postcard(c.dataset.k); if (p) c.getContext('2d').drawImage(p, 0, 0, 96, 64); });
    const b = $('#lmRest', box); if (can) b.onclick = () => { const got = EP.lmDoRest(key); if (got) { sfx('heal'); paintHud(); EM.refresh(); draw(got); } };
  };
  draw();
  EM.refresh();
  win(box, L.name, I('pin'), 'ep-narrow');
}
// the workshop and the soup pot: a recipe, materials, and a roll of the die
function openCraft(kind) {
  const box = document.createElement('div'); box.className = 'ep-board';
  let least = 0;
  const draw = () => {
    const e = EP.S(), list = e.recipes.filter(r => r[0] === kind).sort((a, b) => a.localeCompare(b));
    const dice = `<div class="ep-dicepick">${[[0, dieI(0), ''], [2, dieI(2), caps(EP.DIE_COST[2])], [3, dieI(3), caps(EP.DIE_COST[3])]].map(([v, ic, c]) => `<button class="ep-diceb${least === v ? ' on' : ''}" data-least="${v}"${v && e.caps < EP.DIE_COST[v] ? ' disabled' : ''} title="${v ? `At least ${v} spots` : 'Plain roll'}">${ic}${c}</button>`).join('')}</div>`;
    // everything these recipes use, and what you are holding
    const used = [...new Set(list.flatMap(id => Object.keys(EP.recipeCost(id).mats)))], purse = `<div class="ep-have" title="What you have">${used.map(m => `<span title="${esc(EP.MATS[m].n)}">${EI.mat(m)}<b>${big(e.mats[m] || 0)}</b></span>`).join('')}<span title="Yen">${I('coin')}<b>${big(G.S.yen)}</b></span></div>`;
    box.innerHTML = `${purse}${dice}<div class="ep-tiles">${list.map(id => { const c = EP.recipeCost(id), ok = EP.canCraft(id); return `<div class="ep-tile${ok ? '' : ' dim'}" title="${esc(EP.recipeName(id))}">${recipeIcon(id)}<div class="ep-tchips">${recipeChips(id)}</div><div class="ep-costs">${costLine(c)}</div><button class="ep-buy go" data-c="${id}"${ok ? '' : ' disabled'} title="${kind === 'g' ? 'Forge' : 'Cook'}">${I(kind === 'g' ? 'hammer' : 'pot')}</button></div>`; }).join('') || `<div class="ep-empty">${I('scroll')}</div>`}
      ${kind === 'p' ? `<div class="ep-tile" title="${esc(EP.POTIONS.lastcall.n + ': ' + EP.POTIONS.lastcall.d)}"><span class="ep-ti">${EI.pot('lastcall')}</span><div class="ep-tchips">${chip('t_foes', '')}${chip('x', '')}</div><button class="ep-buy go" id="epLC"${e.caps < 30 ? ' disabled' : ''}>${caps(30)}</button></div>` : ''}</div>
      <div class="ep-dieroll" id="epRoll"></div>`;
    for (const b of $$('[data-least]', box)) b.onclick = () => { least = +b.dataset.least; sfx('click'); draw(); };
    const lc = $('#epLC', box); if (lc) lc.onclick = () => { if (EP.lastCall()) { sfx('unlock'); paintHud(); draw(); } };
    for (const b of $$('[data-c]', box)) b.onclick = () => {
      const r = EP.craft(b.dataset.c, least);
      if (!r) { sfx('error'); return; }
      sfx('tdBoom'); AF.ui.refresh(); paintHud(); draw();
      showRoll(box, r);
    };
  };
  draw();
  win(box, kind === 'g' ? 'Workshop' : 'Soup Pot', I(kind === 'g' ? 'anvil' : 'pot'), 'ep-narrow');
}
function showRoll(box, r) {
  const el = $('#epRoll', box), name = r.result.kind === 'item' ? EP.itemName(r.result.item) : itemText(r.result);
  el.innerHTML = `<span class="ep-die-big">${dieI(r.spots)}</span>${r.result.kind === 'item' ? `<span class="ep-ti" title="${esc(name)}">${EI.item(r.result.item)}</span>` : `<span class="ep-prize" title="${esc(name)}">${EI.of(r.result)}<b>${r.result.n}</b></span>`}`;
  el.dataset.name = name;
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  sfx('chime', { i: r.spots * 3 });
}
function openMachine() {
  const box = document.createElement('div'); box.className = 'ep-board';
  const draw = last => {
    const e = EP.S(), M = EP.MACHINE, got = last && last.got;
    box.innerHTML = `<div class="ep-bar-big" title="A full bar is always a set piece"><i style="width:${Math.min(100, e.bar / M.bar * 100)}%"></i><b>${e.bar}/${M.bar}</b></div>
      <div class="ep-gate"><button class="ep-big" id="epM1"${e.caps < M.small ? ' disabled' : ''} title="Small pull">${I('luckyb')}${caps(M.small)}</button><button class="ep-big go" id="epM2"${e.caps < M.big ? ' disabled' : ''} title="Big pull: mostly sets">${I('luckyb')}${I('luckyb')}${caps(M.big)}</button></div>
      <div class="ep-dieroll${last ? ' pop' : ''}" id="epGot">${got ? (got.kind === 'item' ? `<span class="ep-ti" title="${esc(EP.itemName(got.item) + '. ' + EP.itemPerk(got.item))}" style="--t:${got.item.set ? EI.setC(got.item.set) : TIER_C[got.item.tier - 1]}">${EI.item(got.item)}</span>` : `<span class="ep-prize" title="${esc(itemText(got))}">${EI.of(got)}<b>${got.n}</b></span>`) : ''}</div>
      <div class="ep-sets">${Object.keys(EP.GEARSETS).map(id => { const s = EP.GEARSETS[id]; return `<span class="ep-ti" style="--t:${EI.setC(id)}" title="${esc(`${s.n} (${s.w} + ${s.o}): ${s.d}`)}">${EI.setIcon(id)}</span>`; }).join('')}</div>`;
    const pull = k => () => { const r = EP.machine(k); if (r) { sfx('reveal', { i: r.got.kind === 'item' ? 4 : 1 }); paintHud(); draw(r); } };
    $('#epM1', box).onclick = pull('small'); $('#epM2', box).onclick = pull('big');
  };
  draw();
  win(box, 'Lucky Bottle', I('luckyb'), 'ep-narrow');
}
function openDaily() {
  if (!EP.dailyOpen()) { sfx('error'); ui().toast('Tomorrow'); return; }
  const n = EP.dailyStage();
  openBoard(n, n, { prize: [{ kind: 'yen', n: Math.round((12 + n.num * 1.6) * 4) }] });
  const h = $('.modal.ep-win .modal-head h2'); if (h) h.innerHTML = `${I('sun')}${esc(EP.WORLDS[n.world].name)}`;
}
function openGolden() {
  const n = EP.goldenStage(); if (!n) return;
  const box = document.createElement('div'); box.className = 'ep-board';
  box.innerHTML = `<div class="ep-gateart" title="Pays yen on every hit, and leaves after 3 turns">${I('coin')}${I('sword')}${I('sword')}${I('sword')}${I('hourglass')}<b>3</b></div>${partyHtml()}<div class="ep-b-go"><button class="btn prim ep-gobtn" id="epGo" title="Start">${I('play')}</button></div>`;
  paintFigs(box);
  let close = null;
  $('#epGo', box).onclick = () => { sfx('click'); close(); startFight(n, n, {}); };
  close = win(box, n.name, I('coin'), 'ep-narrow');
}
function openBag() {
  const e = EP.S(), mats = Object.keys(EP.MATS), pots = Object.keys(EP.POTIONS).filter(p => e.pots[p] > 0);
  const box = document.createElement('div'); box.className = 'ep-board';
  box.innerHTML = `<div class="ep-matgrid">${mats.map(m => `<span title="${esc(EP.MATS[m].n)}">${EI.mat(m)}<b>${e.mats[m] || 0}</b></span>`).join('')}</div>
    ${pots.length ? `<div class="ep-matgrid">${pots.map(p => `<span title="${esc(EP.POTIONS[p].n + ': ' + EP.POTIONS[p].d)}">${EI.pot(p)}<b>${e.pots[p]}</b></span>`).join('')}</div>` : ''}
    ${e.gear.length ? `<div class="ep-matgrid">${e.gear.map(it => { const w = EP.wornBy(it.uid); return `<span class="gear" title="${esc(EP.itemName(it) + '. ' + EP.itemPerk(it))}" style="--t:${it.set ? EI.setC(it.set) : TIER_C[it.tier - 1]}">${EI.item(it)}${spotsHtml(it.spots)}${w ? `<em data-card="${w}"></em>` : ''}</span>`; }).join('')}</div>` : ''}`;
  paintFigs(box);
  win(box, 'Pantry', I('bag'), 'ep-narrow');
}
D.openStage = openStage;
D.pickNode = onPick;
D.openCraft = openCraft;
D.startFor = id => { const n = EP.BY[id]; startFight(n, EP.fightOf(n), {}); };
})();
