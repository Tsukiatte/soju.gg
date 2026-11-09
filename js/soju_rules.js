/* Soju rules on top of the Aura Farm base. Loaded after every rules file and before the interface.
   (2 Nov, owner: "keep the progression system same tho i dont want the incremental stuff",
   "all units should be balanced but it should be the skins that are rare and have exclusivity",
   "take attack patterns from btd6 ... monkey ace, helipad", "skins should give unique attack looks ... unique sounds too",
   "do like range, attack, spa cooldown do like anime adventures traits")
   (3 Nov, owner: "make summon for skins only ... make it to unlock with currency for all the units so that they only ever own one
   copy of every tower like do it the way btd6 does it")
   - The crew is balanced. Each animal is one tower, one attack pattern. You own one of each, unlocked once with yen, Pip for free.
   - Each gate is a themed set of costumes and projectile themes (soju_wear.js). Any tower can wear any of them, and none changes a number.
   - Yen comes from winning Defense and is spent on towers, gates and trait rolls. No idle income, levels, stars, Ascend or Rebirth.
   - Traits roll range, attack and cooldown. They are the one lasting stat source, and they are small on purpose. */
(function () {
const AF = window.AF, G = AF.G, TD = AF.TD, E = AF.ECON;

// ---------------- the crew: one animal, one attack pattern, one price ----------------
const CREW = {
  pip:     { key: 'crew_pip',     name: 'Pip',     species: 'Bunny',    kind: 'pierce', pops: 1, p: { spa: 1.3 }, cost: 120, attack: 'Carrot Darts',  el: 'light',  c: [0xff9d3c, 0xffd08a, 0xffffff], blurb: 'Throws a dart straight through a line.' },
  bao:     { key: 'crew_bao',     name: 'Bao',     species: 'Bear',     kind: 'slam', pops: 2, p: { spa: 2.4 }, cost: 140, attack: 'Belly Slam',    el: 'dust',   c: [0xd9a662, 0xf0d8a8, 0xffffff], blurb: 'Slams the ground and stuns what is close.' },
  mochi:   { key: 'crew_mochi',   name: 'Mochi',   species: 'Cat',      kind: 'snipe', pops: 4, cost: 200, attack: 'Yarn Sniper',   el: 'light',  c: [0xff7aa8, 0xffc0d4, 0xffffff], blurb: 'Hits anything from almost anywhere, slowly.', p: { rng: 12, spa: 3.5 } },
  dot:     { key: 'crew_dot',     name: 'Dot',     species: 'Duck',     kind: 'tack', pops: 1, p: { spa: 2 }, cost: 300, attack: 'Sky Loop',      el: 'light',  c: [0x8fdcff, 0xd8f4ff, 0xffffff], blurb: 'Flies a figure eight, firing all round itself.', fly: 'ace' },
  fig:     { key: 'crew_fig',     name: 'Fig',     species: 'Frog',     kind: 'rapid', pops: 1, p: { spa: 1.8 }, cost: 280, attack: 'Hover Chase',   el: 'tech',   c: [0x9ae05e, 0xd8ffa8, 0xffffff], blurb: 'Hovers after the enemy in front, firing bursts.', fly: 'heli' },
  hazel:   { key: 'crew_hazel',   name: 'Hazel',   species: 'Hedgehog', kind: 'field', pops: 1, p: { tick: 1, dur: 3.2, spa: 3.6 }, cost: 170, attack: 'Spike Drop',    el: 'dust',   c: [0xead9b8, 0xa98561, 0xffffff], blurb: 'Lays spikes on the road that hurt whatever walks over them.' },
  owl:     { key: 'crew_owl',     name: 'Olive',   species: 'Owl',      kind: 'mortar', pops: 2, p: { spa: 3.2 }, cost: 220, attack: 'Acorn Mortar',  el: 'dust',   c: [0xc98f4e, 0xf0d8a8, 0xffffff], blurb: 'Lobs a blast from far away after a short delay.' },
  fox:     { key: 'crew_fox',     name: 'Rusty',   species: 'Fox',      kind: 'boomer', pops: 1, p: { spa: 1.7 }, cost: 150, attack: 'Boomerang',     el: 'light',  c: [0xff8a4c, 0xffc89a, 0xffffff], blurb: 'Throws a boomerang that hits on the way out and back.' },
  pig:     { key: 'crew_pig',     name: 'Truffle', species: 'Pig',      kind: 'farm',   cost: 0,   attack: 'Snack Farm',    el: 'light',  c: [0xffd23a, 0xfff2a0, 0xffffff], blurb: 'Does not fight. Pays cash every wave.' },
  penguin: { key: 'crew_penguin', name: 'Pebble',  species: 'Penguin',  kind: 'stop', pops: 1, p: { spa: 4.2 }, cost: 190, attack: 'Frost Slide',   el: 'light',  c: [0xbfe8ff, 0xe8f8ff, 0xffffff], blurb: 'Freezes everything round it for a moment.' },
};
const ANIMALS = Object.keys(CREW);
AF.CREW = CREW;
AF.soju.ANIMALS = ANIMALS;

// The source's characters are no longer given out; each still has an animal so their old entries keep working.
const KIND_TO_ANIMAL = {
  shot: 'pip', pierce: 'pip', spread: 'pip',
  slash: 'bao', combo: 'bao', slam: 'bao', dash: 'bao', summon: 'bao', runner: 'bao',
  snipe: 'mochi', volley: 'dot', strike: 'dot', rapid: 'fig', seek: 'fig',
  field: 'hazel', hole: 'hazel', tack: 'hazel', lob: 'owl', mortar: 'owl',
  boomer: 'fox', spin: 'fox', orbit: 'fox', farm: 'pig', stop: 'penguin', nova: 'penguin', chain: 'penguin', beam: 'penguin',
};
const rawAttackOf = TD.attackOf;
const RELEASES = key => key.split('@')[0];
for (const [key, def] of Object.entries(AF.UNIT)) {
  if (def.animal) continue; // the Soju Collection is made for its animal
  const A = rawAttackOf(AF.UNIT[RELEASES(key)] || def);
  def.animal = KIND_TO_ANIMAL[A && A.kind] || ANIMALS[AF.soju.hash(RELEASES(key)) % ANIMALS.length];
}
for (const [animal, C] of Object.entries(CREW)) {
  const def = { key: C.key, name: C.name, rarity: 'common', base: 0, gate: 'crew', animal, crew: true, look: {}, pose: {}, acc: [] };
  AF.UNITS.push(def);
  AF.UNIT[C.key] = def;
  const shot = AF.soju.wear.shotOf(animal);
  AF.ATTACKS[C.key] = { name: C.attack, kind: C.kind, el: C.el, shape: shot ? shot.shape : 'spark', spin: shot && shot.spin, themed: !!shot, c: C.c, p: C.p };
}
AF.UNITS.forEach((d, i) => { d.idx = i; });

const crewOf = def => CREW[def.animal] || CREW.pip;
AF.crewOf = crewOf;
// (2 Nov, owner: "make sure their species is shown on their info cards") What animal it is, wherever a unit's details show.
AF.speciesOf = def => crewOf(def).species;
AF.speciesTag = def => `<span class="sp-tag">${crewOf(def).species}</span>`;
// (4 Nov, owner: "show what type a hero is on their info card like attacker, defender, healer")
AF.roleTag = animal => { const H = AF.EP && AF.EP.HEROES[animal]; if (!H) return ''; const R = AF.EP.ROLE[H.role]; return `<span class="role-tag r-${H.role}" style="--rc:${R.c}" title="${R.n}: ${R.d}">${AF.EI.role(H.role)}${R.n}</span>`; };
AF.skinLine = def => {
  if (def.item) return `${def.item === 'costume' ? 'Costume' : 'Projectile'}, any hero`;
  const C = crewOf(def);
  return C.species; // (3 Nov) fewer words on a card
};

// A skin changes how the attack looks and sounds. The pattern and its numbers come from the animal.
const merged = new Map();
TD.attackOf = def => {
  if (merged.has(def.key)) return merged.get(def.key);
  const C = crewOf(def), look = rawAttackOf(def) || {};
  const A = Object.assign({}, look, { kind: C.kind, p: C.p, name: look.name || C.attack, reach: undefined });
  merged.set(def.key, A);
  return A;
};
TD.attackOfU = u => TD.attackOf(AF.UNIT[u.k]); // an evolved form no longer plays differently
const REACH = { dot: 'hybrid', fig: 'hybrid', mochi: 'hybrid', owl: 'ground', hazel: 'ground', bao: 'ground' };
TD.reachOf = def => REACH[def.animal] || 'hybrid';
TD.styleOf = def => TD.KINDS[crewOf(def).kind].style;

// (owner: "do like range, attack, spa cooldown do like anime adventures traits") Small on purpose: a good roll is an edge.
TD.TRAIT_TD = {
  sturdy1: { atk: 1.08 }, swift1: { spa: 1.08 }, keen1: { rng: 1.08 },
  gilded: { atk: 1.15 }, tempest: { spa: 1.2 }, solar: { atk: 1.25 },
  eclipse: { rng: 1.25, atk: 1.1 }, astral: { atk: 1.3, rng: 1.15 }, infinity: { atk: 1.6, spa: 1.2, rng: 1.15 },
};
// (3 Nov) in an Expedition fight: attack, health, and how fast the bottle fills
const NAMES = { atk: 'ATK', spa: 'HP', rng: 'Bottle' };
AF.traitShort = tr => {
  if (!tr) return 'None';
  if (tr.farm) return `Pay x${tr.farm}`;
  const b = TD.traitTd(tr), bits = Object.keys(b).map(k => `${NAMES[k]} +${Math.round((b[k] - 1) * 100)}%`);
  return bits.join(', ') || tr.name;
};
const score = t => { const b = TD.TRAIT_TD[t.id] || {}; return +(((b.atk || 1) * (b.spa || 1) * (b.rng || 1)) || 1).toFixed(3); };
AF.TRAITS.forEach((t, i) => { t.oldMult = t.mult; t.mult = t.farm ? 1.2 + i * 0.001 : score(t) + i * 0.0001; });
for (const t of Object.values(AF.TRAIT_DBL)) t.mult = (AF.TRAIT[t.id].mult - 1) * 2 + 1;

// The same numbers for every skin of an animal, whatever its rarity.
TD.statsOf = u => {
  const def = AF.UNIT[u.k], C = crewOf(def), A = TD.attackOf(def), tr = AF.traitOf(u), kind = C.kind;
  if (kind === 'farm') return { style: 'farm', kind, reach: null, cfg: null, sig: 0, name: A.name, atk: 0, spa: 0, rng: 0, cost: TD.FARM.cost, farm: TD.FARM.pay * TD.farmTrait(tr) };
  // atk is lunchboxes knocked off a hit (soju_stacks.js)
  const st = Object.assign({}, TD.KINDS[kind], C.p || {}), t = TD.traitTd(tr);
  return {
    style: st.style, kind, reach: TD.reachOf(def), cfg: st, sig: A.sig ? A.sig.every : 0, name: A.name, fly: C.fly || null,
    atk: C.pops * (t.atk || 1), spa: st.spa / (t.spa || 1), rng: st.rng * (t.rng || 1), cost: C.cost, cap: 0, gate: null,
  };
};

// ---------------- flying patterns ----------------
const step0 = TD.step, canPlace0 = TD.canPlace;
function fly(M, p, dt) {
  if (p.hx === undefined) { p.hx = p.x; p.hz = p.z; p.ft = 0; }
  p.ft += dt;
  // Low enough that its shots, drawn from about chest height over the ground, still look like they come from it.
  p.alt = p.s.fly === 'ace' ? 1.25 + Math.sin(p.ft * 2) * 0.1 : 1.05 + Math.sin(p.ft * 3) * 0.07;
  if (p.s.fly === 'ace') {
    const w = 0.85 + 0.05 * p.lv, a = p.ft * w, oldX = p.x, oldZ = p.z;
    p.x = p.hx + Math.sin(a) * 3.6;
    p.z = p.hz + Math.sin(a * 2) * 2;
    p.face = Math.atan2(p.x - oldX, p.z - oldZ);
    p.fired = true;
    return;
  }
  let front = null;
  for (const e of M.enemies) if (e.hp > 0 && (!front || e.d > front.d)) front = e;
  const tx = front ? front.x : p.hx, tz = front ? front.z : p.hz;
  const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), keep = front ? 1.4 : 0.05;
  if (d > keep) { const s = Math.min(d - keep, 3.8 * dt); p.x += (dx / d) * s; p.z += (dz / d) * s; }
}
TD.step = (M, dt) => {
  if (M.state !== 'won' && M.state !== 'lost') for (const p of M.units) if (p.s.fly) fly(M, p, dt);
  return step0(M, dt);
};
// A flyer's footprint stays at the spot it was placed, wherever it is flying right now.
TD.canPlace = (M, x, z, skip) => {
  const moved = M.units.filter(p => p.s.fly && p.hx !== undefined).map(p => [p, p.x, p.z]);
  for (const [p] of moved) { p.x = p.hx; p.z = p.hz; }
  const why = canPlace0(M, x, z, skip);
  for (const [p, x0, z0] of moved) { p.x = x0; p.z = z0; }
  return why;
};

// ---------------- no incremental progression ----------------
E.slotsStart = 15;
E.startUnit = CREW.pip.key;
G.income = () => 0;
G.rate = () => 0;
G.maxIncome = u => AF.RAR[AF.UNIT[u.k].rarity].order + 1;
G.upLv = () => 0;
G.has = () => false;
G.star = () => 0;
G.starLv = () => 0;
G.momentum = () => 0;
G.offlineCap = () => 0;
G.luck = () => 1;
G.favor = () => 1;
G.collect = () => 0;
G.catchSurge = () => {};
G.boost = () => 1;
G.tdMult = () => 1;
AF.TD_INCOME = 0;
G.canAscend = () => false;
G.canRebirth = () => false;
G.relicOpen = () => false;
G.ascPath = () => ({});
G.autoLevel = () => {};
G.autoStar = () => {};
const tick0 = G.tick;
G.tick = dt => { ensureTowers(); tick0(dt); };

// ---------------- towers: one of each, unlocked once ----------------
// The first win pays 120, so the second tower is a match or two away and the last takes a good while.
const UNLOCK = { pip: 0, fox: 150, bao: 200, hazel: 250, penguin: 300, pig: 350, mochi: 450, owl: 500, fig: 700, dot: 800 };
for (const a of ANIMALS) CREW[a].unlock = UNLOCK[a];
AF.TOWERS = ANIMALS.slice().sort((a, b) => UNLOCK[a] - UNLOCK[b]);
G.towerOf = animal => G.S.units.find(u => AF.UNIT[u.k].animal === animal) || null;
// (3 Nov) the first heroes join through the story, for nothing
G.freeTower = animal => { if (G.towerOf(animal)) return false; newTower(animal); G.save(); return true; };
const newTower = animal => { const u = G.add(CREW[animal].key); u.isNew = false; u.lock = true; u.vr = 1; return u; };
G.unlockTower = animal => {
  const S = G.S, C = CREW[animal];
  if (!C) return { err: 'none' };
  if (G.towerOf(animal)) return { err: 'owned' };
  if (S.yen < C.unlock) return { err: 'yen', need: C.unlock };
  S.yen -= C.unlock;
  const u = newTower(animal);
  // a new tower is ready to use: in the team if there is room, and on a free plot
  if (S.td.team.length < 6) S.td.team.push(u.uid);
  const free = G.slotsView().findIndex(x => !x);
  if (free >= 0) G.equip(u.uid, free);
  return { ok: true, u };
};

// ---------------- what a tower wears: one costume, one projectile theme, any tower, any item ----------------
// S.skins[key] is set for each item owned. The numbers never change: stats come from the animal.
const W = AF.soju.wear;
G.ownsItem = key => !!(G.S.skins && G.S.skins[key]);
G.giveItem = key => { const fresh = !G.ownsItem(key); G.S.skins[key] = 1; G.S.seen[key] = (G.S.seen[key] || 0) + 1; G._found = null; return fresh; };
G.wearing = u => { const d = AF.UNIT[u.k]; return { costume: d.costume || null, theme: d.theme || null }; };
// (4 Nov, owner: "let indexes give rewards too"): each gate's set pays out as it fills, once each, when you press for it
G.IX_REWARDS = [{ at: 4, yen: 300 }, { at: 8, caps: 3 }, { at: 12, yen: 1000, cheers: 3 }, { at: 17, yen: 3000, caps: 5, cheers: 5 }];
G.ixState = gate => {
  const have = AF.soju.wear.inGate(gate).filter(d => G.ownsItem(d.key)).length, paid = G.S.ixPaid || {};
  return G.IX_REWARDS.map(r => ({ ...r, have, paid: !!paid[gate + ':' + r.at], ready: have >= r.at && !paid[gate + ':' + r.at] }));
};
G.ixReady = () => AF.soju.wear.SETS.reduce((n, st) => n + G.ixState(st.gate).filter(r => r.ready).length, 0);
G.ixClaim = (gate, at) => {
  const r = G.ixState(gate).find(x => x.at === at); if (!r || !r.ready) return null;
  (G.S.ixPaid = G.S.ixPaid || {})[gate + ':' + at] = 1;
  if (r.yen) G.S.yen += r.yen;
  const e = AF.EP && AF.EP.S(); if (e) { if (r.caps) e.caps += r.caps; if (r.cheers) e.cheers += r.cheers; }
  G.save();
  return r;
};
G.itemsOwned = slot => AF.WEAR_ITEMS.filter(d => d.item === slot && G.ownsItem(d.key)).sort((a, b) => AF.RAR[b.rarity].order - AF.RAR[a.rarity].order);
// slot: "costume" or "theme"; id: an item you own, or null to take it off
G.wearItem = (animal, slot, id) => {
  const u = G.towerOf(animal);
  if (!u) return false;
  if (id && !G.ownsItem(slot === 'costume' ? W.costumeKey(id) : W.themeKey(id))) return false;
  // (4 Nov, owner: "1 cosmetic can only be equipped on one hero"): putting it on takes it off whoever has it
  if (id) for (const a of AF.TOWERS) { const t = G.towerOf(a); if (!t || t === u || G.wearing(t)[slot] !== id) continue; const w = G.wearing(t); w[slot] = null; t.k = W.wornKey(a, w.costume, w.theme); }
  const now = G.wearing(u);
  now[slot] = id || null;
  u.k = W.wornKey(animal, now.costume, now.theme);
  return true;
};

// Saves from before this held skins that can no longer be worn. Each pays what a repeat would, once per skin, and each tower keeps the best trait
// any of its animal's old copies had. A tower's place in the team and on its plot carries over.
function migrate(S) {
  const paid = new Set();
  const refund = key => { const d = AF.UNIT[key.split('@')[0]]; if (d ? !d.item && !d.crew && !paid.has(d.key) : !paid.has(key)) { paid.add(d ? d.key : key); S.yen += d ? REFUND[AF.RAR[d.rarity].order] || 10 : 100; } }; // an item that no longer exists pays a flat 100
  // last round's towers named the skin they wore, so they must go back to being themselves first
  const towers = [], old = [];
  for (const u of S.units) {
    const d = AF.UNIT[u.k], a = d.animal;
    if (d.crew && !towers.some(t => AF.UNIT[t.k].animal === a)) towers.push(u);
    else old.push(u);
  }
  if (S.towersV === 1) for (const u of old.slice()) {
    const a = AF.UNIT[u.k].animal;
    if (!towers.some(t => AF.UNIT[t.k].animal === a)) { refund(u.k); u.k = CREW[a].key; u.sh = false; towers.push(u); old.splice(old.indexOf(u), 1); }
  }
  for (const u of old) {
    const def = AF.UNIT[u.k.split('@')[0]], tower = towers.find(t => AF.UNIT[t.k].animal === def.animal);
    refund(u.k);
    if (!tower) continue;
    if (u.tr && (!tower.tr || AF.TRAIT[u.tr].mult > AF.TRAIT[tower.tr].mult)) { tower.tr = u.tr; tower.dbl = u.dbl; tower.tw = u.tw; }
    S.td.team = S.td.team.map(id => (id === u.uid ? tower.uid : id));
    if (u.eq >= 0 && tower.eq < 0) tower.eq = u.eq;
    if (S.opts.lab === u.uid) S.opts.lab = tower.uid;
    if (S.opts.lab2 === u.uid) S.opts.lab2 = null;
  }
  for (const key of Object.keys(S.skins)) if (!AF.UNIT[key] || !AF.UNIT[key].item) { refund(key); delete S.skins[key]; }
  const dropped = new Set(old.map(u => u.uid));
  S.units = towers;
  S.td.team = [...new Set(S.td.team)].filter(id => !dropped.has(id));
}
function ensureTowers(loading) {
  const S = G.S;
  if (!S) return;
  if (!S.skins) S.skins = {};
  if (S.towersV !== 3) { migrate(S); S.towersV = 3; loading = true; }
  if (!AF.GATE[S.gate]) S.gate = AF.GATES[0].id; // a gate since removed
  if (!G.towerOf('pip')) newTower('pip').eq = S.units.some(u => u.eq === 0) ? -1 : 0;
  if (loading) {
    // only ever one copy
    const seen = new Set();
    S.units = S.units.filter(u => { const a = AF.UNIT[u.k].animal; if (seen.has(a)) return false; seen.add(a); return true; });
    S.td.team = S.td.team.filter(id => G.unit(id));
    for (const u of S.units) u.lock = true;
    if (!S.td.team.length) S.td.team = S.units.slice(0, 6).map(u => u.uid);
  }
  if (S.slots < E.slotsStart) S.slots = E.slotsStart;
  // (3 Nov) rounds wait for you now, so Auto next starts on, and pressing it off is remembered
  if (!S.td.autoNextSet) { S.td.autoNextSet = 1; S.td.autoNext = true; }
}
const load0 = G.load, reset0 = G.reset;
G.load = () => { const r = load0(); ensureTowers(true); return r; };
G.reset = () => { const r = reset0(); ensureTowers(true); return r; };

// ---------------- gates sell skins, and open by winning ----------------
// (3 Nov, owner: "remove all those gates lets just have 2 gates for now")
// (5 Nov, owner: "add a selector for regular or event summons"): the event gate isn't one of the old list, and opens from the start
AF.GATES.push(AF.GATE.sanrio = { id: 'sanrio', name: 'Sanrio Gate', cost: 250, unlock: 0, hue: ['#ff6fae', '#ffc2dd'] });
const KEEP_GATES = AF.soju.wear.SETS.map(x => x.gate), COSTS = [100, 250, 250];
for (const g of AF.GATES.splice(0)) { if (KEEP_GATES.includes(g.id)) AF.GATES.push(g); else delete AF.GATE[g.id]; }
AF.GATES.forEach((g, i) => {
  g.cost = COSTS[i];
  g.unlock = 0; g.asc = 0; g.reb = 0;
  g.event = !!AF.soju.wear.SETS.find(x => x.gate === g.id).event;
  g.td = i > 0 && !g.event ? `${TD.MAPS[i - 1].id}:normal` : null;
});
G.gateOpen = g => !g.td || G.tdClear(g.td);
G.summonCost = (gid, n) => AF.GATE[gid].cost * n;
// An item you already own turns straight into yen. It never builds toward anything rarer, and there are no copies to keep or sell.
const REFUND = [10, 20, 40, 80, 150, 250, 400, 600, 800, 1000, 1500];
G.releaseValue = u => REFUND[AF.RAR[AF.UNIT[u.k].rarity].order] || 10;
G.release = () => ({ yen: 0, n: 0 });
G.autoSells = () => false;
G.shinyChance = () => 0;
// (3 Nov) A gate is its set (soju_wear.js): its own name, and the same chance for a rarity everywhere, shared out among what that set has.
// (3 Nov, owner: "make costumes much more rarer than projectile cosmetics") Common and rare are the projectiles, so about 1 pull in 7 is a costume.
const RARITY_WEIGHT = { common: 60, rare: 25, epic: 10, legendary: 3.5, mythic: 1.2, secret: 0.3 };
AF.GATES.forEach(g => {
  const set = W.SETS.find(x => x.gate === g.id), has = new Set(Object.values(set.items));
  g.name = set.name; g.blurb = set.blurb; g.excl = 0;
  const weight = Object.assign({}, RARITY_WEIGHT, set.weights), total = [...has].reduce((n, r) => n + weight[r], 0); // a set can have its own chances
  g.odds = {};
  for (const r of AF.RARITIES) if (has.has(r.id)) g.odds[r.id] = +((weight[r.id] / total) * 100).toFixed(2);
});
const summon0 = G.summon;
G.summon = (gid, n) => {
  const S = G.S, res = summon0(gid, n);
  if (res.err) return res;
  // G.summon made them units; they are only ever items, so they leave the list again
  const pulled = new Set(res.units);
  S.units = S.units.filter(u => !pulled.has(u));
  res.dupYen = 0;
  for (const u of res.units) {
    const fresh = !G.ownsItem(u.k);
    u.isNew = fresh;
    if (fresh) S.skins[u.k] = 1;
    else { u.dupYen = G.releaseValue(u); S.yen += u.dupYen; res.dupYen += u.dupYen; }
  }
  return res;
};

// ---------------- traits and pay ----------------
G.rerollCost = () => 25;
// Harder worlds pay more, and the first win pays double.
TD.reward = (map, diff, first) => {
  const i = Math.max(0, TD.MAPS.indexOf(map));
  const k = { normal: 1, hard: 1.5, nightmare: 2.2 }[diff.id] || 1;
  return Math.round(((60 + i * 12) * k * (first ? 2 : 1)) / 5) * 5;
};
TD.TOWER.shards = (mapId, n) => (n % 5 ? 0 : Math.min(120, 15 + n * 2));

// Each world pays a steady step more. How much it carries is in soju_stacks.js.
TD.MAPS.forEach((m, i) => { m.cashK = 1 + 0.08 * i; });
// (3 Nov, owner: "only ever own one copy of every tower like do it the way btd6 does it") Owning a tower once doesn't mean placing it once.
// The board holds 18 whatever the team, shared out, so a new player's lone Pip can hold a whole road and a full team of six places 3 of each.
const BOARD = 18, newMatch0 = TD.newMatch;
TD.newMatch = (...args) => { const M = newMatch0(...args), each = Math.max(TD.PER_SLOT, Math.floor(BOARD / Math.max(1, M.team.length))); M.team.forEach(t => { t.each = each; }); return M; };
TD.capOf = t => (t.s && t.s.cap) || t.each || TD.PER_SLOT;
Object.assign(TD.DIFF.hard, { hp: 1.45, cash: 1.15 });
Object.assign(TD.DIFF.nightmare, { hp: 1.95, speed: 1.08, cash: 1.3 });

// Goals about income, levels, stars, Ascend, Rebirth, relics and evolution no longer mean anything.
// (2 Nov, owner: "theres a bug with journal theres nothing to claim") They must go from AF.QUEST as well as the visible list: the
// counter reads AF.QUEST, so a finished hidden goal showed as ready with nothing to press.
const GONE = new Set(['earned', 'maxRate', 'maxLevel', 'maxStars', 'slotsMax', 'asc', 'reb', 'smap', 'relics', 'bestRelic', 'evolved', 'surges', 'shinies', 'rift']);
const OUT_OF_REACH = q => GONE.has(q.stat) || /^gate:/.test(q.stat) || (q.stat === 'found' && q.goal > AF.WEAR_ITEMS.length) || (q.stat === 'bestRank' && q.goal > AF.RAR.secret.order);
for (const group of AF.QUESTS) {
  group[1] = group[1].filter(q => { if (OUT_OF_REACH(q)) { delete AF.QUEST[q.id]; return false; } return true; });
  for (const q of group[1]) {
    q.shards *= 10; // pays in yen now
    // trait goals were written against the old multipliers; point each at the same trait's new number
    if (q.stat === 'bestMult') { const t = AF.TRAITS.find(x => x.oldMult === q.goal); if (t) q.goal = t.mult; }
  }
}
for (let i = AF.QUESTS.length - 1; i >= 0; i--) if (!AF.QUESTS[i][1].length) AF.QUESTS.splice(i, 1);
})();
