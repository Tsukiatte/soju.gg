/* Soju rules on top of the Aura Farm base. Loaded after every rules file and before the interface.
   (2 Nov, owner: "keep the progression system same tho i dont want the incremental stuff",
   "all units should be balanced but it should be the skins that are rare and have exclusivity",
   "take attack patterns from btd6 ... monkey ace, helipad", "skins should give unique attack looks ... unique sounds too",
   "do like range, attack, spa cooldown do like anime adventures traits")
   - The crew is free and balanced. Each animal is one attack pattern, and nobody gets stronger by playing longer.
   - Everything the gates give is a skin for one animal: its own look, attack effects and sounds, the same numbers.
   - Yen comes from winning Defense and is spent on gates and trait rolls. No idle income, levels, stars, Ascend or Rebirth.
   - Traits roll range, attack and cooldown. They are the one lasting stat source, and they are small on purpose. */
(function () {
const AF = window.AF, G = AF.G, TD = AF.TD, E = AF.ECON;

// ---------------- the crew: one animal, one attack pattern, one price ----------------
const CREW = {
  pip:     { key: 'crew_pip',     name: 'Pip',     species: 'Bunny',    kind: 'pierce', cost: 120, attack: 'Carrot Darts',  el: 'light',  c: [0xff9d3c, 0xffd08a, 0xffffff], blurb: 'Throws a dart straight through a line.' },
  bao:     { key: 'crew_bao',     name: 'Bao',     species: 'Bear',     kind: 'slam',   cost: 140, attack: 'Belly Slam',    el: 'dust',   c: [0xd9a662, 0xf0d8a8, 0xffffff], blurb: 'Slams the ground and stuns what is close.' },
  mochi:   { key: 'crew_mochi',   name: 'Mochi',   species: 'Cat',      kind: 'snipe',  cost: 200, attack: 'Yarn Sniper',   el: 'light',  c: [0xff7aa8, 0xffc0d4, 0xffffff], blurb: 'Hits anything from almost anywhere, slowly.', p: { rng: 12 } },
  dot:     { key: 'crew_dot',     name: 'Dot',     species: 'Duck',     kind: 'tack',   cost: 300, attack: 'Sky Loop',      el: 'light',  c: [0x8fdcff, 0xd8f4ff, 0xffffff], blurb: 'Flies a figure eight, firing all round itself.', fly: 'ace' },
  fig:     { key: 'crew_fig',     name: 'Fig',     species: 'Frog',     kind: 'rapid',  cost: 280, attack: 'Hover Chase',   el: 'tech',   c: [0x9ae05e, 0xd8ffa8, 0xffffff], blurb: 'Hovers after the enemy in front, firing bursts.', fly: 'heli' },
  hazel:   { key: 'crew_hazel',   name: 'Hazel',   species: 'Hedgehog', kind: 'field',  cost: 170, attack: 'Spike Drop',    el: 'dust',   c: [0xead9b8, 0xa98561, 0xffffff], blurb: 'Lays spikes on the road that hurt whatever walks over them.' },
  owl:     { key: 'crew_owl',     name: 'Olive',   species: 'Owl',      kind: 'mortar', cost: 220, attack: 'Acorn Mortar',  el: 'dust',   c: [0xc98f4e, 0xf0d8a8, 0xffffff], blurb: 'Lobs a blast from far away after a short delay.' },
  fox:     { key: 'crew_fox',     name: 'Rusty',   species: 'Fox',      kind: 'boomer', cost: 150, attack: 'Boomerang',     el: 'light',  c: [0xff8a4c, 0xffc89a, 0xffffff], blurb: 'Throws a boomerang that hits on the way out and back.' },
  pig:     { key: 'crew_pig',     name: 'Truffle', species: 'Pig',      kind: 'farm',   cost: 0,   attack: 'Snack Farm',    el: 'light',  c: [0xffd23a, 0xfff2a0, 0xffffff], blurb: 'Does not fight. Pays cash every wave.' },
  penguin: { key: 'crew_penguin', name: 'Pebble',  species: 'Penguin',  kind: 'stop',   cost: 190, attack: 'Frost Slide',   el: 'light',  c: [0xbfe8ff, 0xe8f8ff, 0xffffff], blurb: 'Freezes everything round it for a moment.' },
};
const ANIMALS = Object.keys(CREW);
AF.CREW = CREW;
AF.soju.ANIMALS = ANIMALS;

// A skin keeps the feel of the attack it was first made for, so it goes to the animal closest to that.
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
  const A = rawAttackOf(AF.UNIT[RELEASES(key)] || def);
  def.animal = KIND_TO_ANIMAL[A && A.kind] || ANIMALS[AF.soju.hash(RELEASES(key)) % ANIMALS.length];
}
for (const [animal, C] of Object.entries(CREW)) {
  const def = { key: C.key, name: C.name, rarity: 'common', base: 0, gate: 'crew', animal, crew: true, look: {}, pose: {}, acc: [] };
  AF.UNITS.push(def);
  AF.UNIT[C.key] = def;
  AF.ATTACKS[C.key] = { name: C.attack, kind: C.kind, el: C.el, shape: 'spark', c: C.c, p: C.p };
}
AF.UNITS.forEach((d, i) => { d.idx = i; });

const crewOf = def => CREW[def.animal] || CREW.pip;
AF.crewOf = crewOf;
// (2 Nov, owner: "make sure their species is shown on their info cards") What animal it is, wherever a unit's details show.
AF.speciesOf = def => crewOf(def).species;
AF.speciesTag = def => `<span class="sp-tag">${crewOf(def).species}</span>`;
AF.skinLine = def => { const C = crewOf(def); return `${C.species}, ${C.attack}`; };

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
  sturdy1: { atk: 1.05 }, sturdy2: { atk: 1.08 }, sturdy3: { atk: 1.12 },
  swift1: { spa: 1.05 }, swift2: { spa: 1.08 }, swift3: { spa: 1.12 },
  keen1: { rng: 1.05 }, keen2: { rng: 1.08 }, keen3: { rng: 1.12 },
  gilded: { atk: 1.15 }, tempest: { spa: 1.2 }, solar: { atk: 1.25 },
  inferno: { atk: 1.2, spa: 1.1 }, eclipse: { rng: 1.25, atk: 1.1 }, nebula: { spa: 1.2, rng: 1.15 },
  astral: { atk: 1.3, rng: 1.15 }, zenith: { atk: 1.2, spa: 1.2, rng: 1.1 }, singular: { atk: 1.4, spa: 1.25 },
  infinity: { atk: 1.6, spa: 1.2, rng: 1.15 },
};
const NAMES = { atk: 'ATK', spa: 'SPA', rng: 'RNG' };
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
  const st = Object.assign({}, TD.KINDS[kind], C.p || {}), t = TD.traitTd(tr);
  let even = 1;
  if (st.slow) even *= 1 - st.slow[0] * 0.5;
  if (st.stun && kind !== 'stop' && kind !== 'slam') even *= 0.9;
  return {
    style: st.style, kind, reach: TD.reachOf(def), cfg: st, sig: A.sig ? A.sig.every : 0, name: A.name, fly: C.fly || null,
    atk: TD.BASE_ATK * TD.POWER * st.atk * even * (t.atk || 1), spa: st.spa / (t.spa || 1), rng: st.rng * (t.rng || 1), cost: C.cost, cap: 0, gate: null,
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
G.tick = dt => { ensureCrew(); tick0(dt); };

// You always have the whole crew, ready to use, and they can never be sold.
function ensureCrew() {
  const S = G.S;
  if (!S) return;
  for (const C of Object.values(CREW)) {
    if (!S.units.some(u => u.k === C.key)) {
      const u = G.add(C.key);
      u.isNew = false; u.lock = true; u.vr = 1;
    }
  }
  const team = S.td.team;
  if (!team.length) S.td.team = S.units.filter(u => AF.UNIT[u.k].crew).slice(0, 6).map(u => u.uid);
  if (S.slots < E.slotsStart) S.slots = E.slotsStart;
}
const load0 = G.load, reset0 = G.reset;
G.load = () => { const r = load0(); ensureCrew(); return r; };
G.reset = () => { const r = reset0(); ensureCrew(); return r; };

// ---------------- gates sell skins, and open by winning ----------------
const COSTS = [100, 150, 200, 260, 320, 400, 500, 600, 700, 800, 900, 1000];
AF.GATES.forEach((g, i) => {
  g.cost = COSTS[Math.min(i, COSTS.length - 1)];
  g.unlock = 0; g.asc = 0; g.reb = 0;
  g.td = i > 0 ? `${TD.MAPS[Math.min(i - 1, TD.MAPS.length - 1)].id}:normal` : null;
});
G.gateOpen = g => !g.td || G.tdClear(g.td);
G.summonCost = (gid, n) => AF.GATE[gid].cost * n;
// A skin you already own turns into a little yen. It never builds toward anything rarer.
const REFUND = [4, 8, 15, 30, 60, 100, 150, 200, 260, 320, 400];
G.releaseValue = u => REFUND[AF.RAR[AF.UNIT[u.k].rarity].order] || 4;
// (3 Nov, owner: "why is it autoselling stuff when i have autosell off") copies stay unless the player picked that rarity in Auto sell

// ---------------- traits and pay ----------------
G.rerollCost = () => 25;
// Harder worlds pay more, and the first win pays double.
TD.reward = (map, diff, first) => {
  const i = Math.max(0, TD.MAPS.indexOf(map));
  const k = { normal: 1, hard: 1.5, nightmare: 2.2 }[diff.id] || 1;
  return Math.round(((60 + i * 12) * k * (first ? 2 : 1)) / 5) * 5;
};
TD.TOWER.shards = (mapId, n) => (n % 5 ? 0 : Math.min(120, 15 + n * 2));

// Enemy health was tuned against a x57 rarity curve. With a balanced crew each world is a smaller, steady step.
TD.MAPS.forEach((m, i) => { m.hpK = 1 + 0.1 * i; m.cashK = 1 + 0.08 * i; });
TD.POWER = 12; // everyone fights at one level, tuned by tools/soju_smoke.mjs
Object.assign(TD.DIFF.hard, { hp: 1.45, cash: 1.15 });
Object.assign(TD.DIFF.nightmare, { hp: 1.95, speed: 1.08, cash: 1.3 });

// ---------------- a match is about 3 minutes ----------------
// (2 Nov, owner: "Shorten to 3 minutes") Eight waves picked from the world's fifteen, so the variety and the boss stay, on a
// steady clock: the next wave comes every WAVE_EVERY seconds whether or not the last one is cleared. Calling early still works.
// The Endless tower keeps its own pace.
const WAVES = 8, WAVE_EVERY = 18, SPAWN_FOR = 13, FIRST_WAVE_AT = 8;
TD.MAPS.forEach(m => {
  const authored = m.wave;
  m.waves = WAVES;
  m.cash = Math.round(m.cash * 1.8);
  m.wave = n => {
    const groups = authored(n >= WAVES ? 15 : 1 + (n - 1) * 2);
    let span = 0;
    for (const [, count, gap] of groups) span += count * gap + 1.2;
    const k = Math.min(1, SPAWN_FOR / Math.max(span, 0.01));
    return groups.map(([type, count, gap]) => [type, count, gap * k]);
  };
});
TD.DIFF.normal.speed = 1.5;
TD.DIFF.hard.speed = 1.5;
TD.DIFF.nightmare.speed = 1.62;
TD.UP.fightK = 1.6;
const callWave0 = TD.callWave, stepForClock = TD.step;
TD.callWave = M => { const ok = callWave0(M); if (ok) M.forceAt = M.t + WAVE_EVERY; return ok; };
TD.step = (M, dt) => {
  if (!M.map.tower && M.state !== 'won' && M.state !== 'lost' && M.wave < M.map.waves && M.t >= (M.forceAt ?? FIRST_WAVE_AT)) {
    // Stragglers still waiting to spawn join the new wave rather than holding up the clock.
    const held = M.queue.splice(0);
    TD.callWave(M);
    for (const q of held) M.queue.push({ type: q.type, at: M.t + 0.2 });
    M.queue.sort((x, y) => x.at - y.at);
  }
  return stepForClock(M, dt);
};

// Goals about income, levels, stars, Ascend, Rebirth, relics and evolution no longer mean anything.
// (2 Nov, owner: "theres a bug with journal theres nothing to claim") They must go from AF.QUEST as well as the visible list: the
// counter reads AF.QUEST, so a finished hidden goal showed as ready with nothing to press.
const GONE = new Set(['earned', 'maxRate', 'maxLevel', 'maxStars', 'slotsMax', 'asc', 'reb', 'smap', 'relics', 'bestRelic', 'evolved', 'surges']);
for (const group of AF.QUESTS) {
  group[1] = group[1].filter(q => { if (GONE.has(q.stat)) { delete AF.QUEST[q.id]; return false; } return true; });
  for (const q of group[1]) {
    q.shards *= 10; // pays in yen now
    // trait goals were written against the old multipliers; point each at the same trait's new number
    if (q.stat === 'bestMult') { const t = AF.TRAITS.find(x => x.oldMult === q.goal); if (t) q.goal = t.mult; }
  }
}
for (let i = AF.QUESTS.length - 1; i >= 0; i--) if (!AF.QUESTS[i][1].length) AF.QUESTS.splice(i, 1);
})();
