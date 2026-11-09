/* Expedition progress (3 Nov, owner: "do a map like angry birds epic, and do levels"): the stages along the map, team
   level, classes, gear, crafting, potions, the wheel after a win, the machine, gates, chests and the daily dive. No page
   here either. Saved under S.ep. epic_rules.js is the fighting; expedition.js and epic_map.js are the screens. */
(function () {
const AF = window.AF, G = AF.G, TD = AF.TD, EP = AF.EP;

// ---------------- a seeded hand, so a stage always has the same raiders ----------------
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const seeded = s => { let x = hash(s) || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; };

// ---------------- materials ----------------
// one main material per world, in the order you meet them, plus corks from everywhere
const MATS = EP.MATS = {
  rice: { n: 'Rice', c: '#f4efe0' }, barley: { n: 'Barley', c: '#e0b85a' }, lemon: { n: 'Lemon', c: '#ffe14a' }, ice: { n: 'Clear Ice', c: '#a8e4ff' },
  charcoal: { n: 'Charcoal', c: '#6a6a78' }, peach: { n: 'Peach', c: '#ffae8a' }, grape: { n: 'Green Grape', c: '#a6e05a' }, star: { n: 'Stardust', c: '#c9a8ff' },
  cork: { n: 'Cork', c: '#c9955a' },
};
const MAT_OF_WORLD = EP.MAT_OF_WORLD = ['rice', 'barley', 'lemon', 'ice', 'charcoal', 'peach', 'grape', 'star'];

// ---------------- the map's stages ----------------
const REGIONS = [
  ['Picnic Green', 'Brook Bend', 'Old Scarecrow Hill'], ['Pier Row', 'Salt Flats', 'Tidecaller Point'], ['Dune Market', 'Glass Road', 'Sphinx Steps'],
  ['Frost Stalls', 'Pine Pass', 'Giant\'s Shelf'], ['Lantern Yard', 'Hollow Walk', 'Lich Gate'], ['Ash Ovens', 'Slag Bridge', 'Wyrm Crater'],
  ['Neon Alley', 'Riot Square', 'Overseer Tower'], ['Moon Dock', 'Comet Field', 'The Devourer'],
];
// (5 Nov, owner: "more mechanics more unique to each hero so that like a different combination is required for some of the rooms ... the bosses shold be hard and only with strategy shold they be able to win and not by brute force")
// Every boss is a puzzle first and a health bar second. cap: the most one hit can take off it, so a mountain of attack can't skip the fight. lethal: a Finisher takes this share of a hero's own health, so a mountain of health can't either. phases: at a share of its health it stops, and turns the next corner on its own turn. Each one asks for different heroes: EP.SIG, EP.LOCKS
const BOSSES = EP.BOSSES = [
  { hpK: 1, moves: ['hit', 'all', 'charge', 'big'] }, // the first castle: read the wind-up, and that is all
  { hpK: 1.6, cap: 0.1, lethal: 0.7, moves: ['hit', 'call', 'all', 'charge', 'big'], phases: [{ at: 0.5, do: ['call'] }] }, // regrows under High Tide: keep it Burning or poisoned
  { hpK: 1.9, cap: 0.09, lethal: 0.75, moves: ['doom', 'hit', 'all', 'charge', 'big', 'hit'], phases: [{ at: 0.5, do: ['doom'] }] }, // Doom after Doom, in the sun: Pig lifts it, or Fig stops it
  { hpK: 1.7, cap: 0.08, lethal: 0.8, armor: 5, moves: ['hit', 'charge', 'big', 'all'], phases: [{ at: 0.66, do: ['armor:5'] }, { at: 0.33, do: ['armor:3', 'frenzy'] }] }, // plates that come back: Pip, then Pebble to freeze the frenzy
  { hpK: 1.6, cap: 0.09, lethal: 0.8, ward: 1, moves: ['raise', 'hit', 'doom', 'all', 'hit', 'charge', 'big'], phases: [{ at: 0.5, do: ['raise'] }] }, // can't be touched while its dead stand: hit everyone, and lift the Doom
  { hpK: 1.7, cap: 0.08, lethal: 0.7, aloft: 1, moves: ['all', 'charge', 'breath', 'hit', 'drain'], phases: [{ at: 0.5, do: ['frenzy'] }] }, // up out of reach, and its breath hits everyone: Dot, and Bao to catch it
  { hpK: 1.7, cap: 0.08, lethal: 0.75, moves: ['bubble', 'hit', 'drones', 'hit', 'drain', 'charge', 'big'], phases: [{ at: 0.66, do: ['drones'] }, { at: 0.33, do: ['drones', 'bubble'] }] }, // Pylons and bubbles: Hazel and Mochi
  { hpK: 1.9, atkK: 1.35, cap: 0.08, lethal: 0.7, moves: ['hex', 'all', 'doom', 'charge', 'big', 'drain', 'hit'], phases: [{ at: 0.75, do: ['hidden:4'] }, { at: 0.5, do: ['armor:4:4'] }, { at: 0.25, do: ['doom'] }] }, // everything, one corner at a time
];
// the rooms' own locks: which turn up in which world, and from the fourth on, an old one now and then. A wave's raiders put them on the fight; the board warns you
const LOCK_POOL = [[], ['air'], ['curse'], ['armor'], ['hidden'], ['frenzy'], ['guard', 'bubble'], ['air', 'curse', 'armor', 'hidden', 'frenzy', 'guard', 'bubble']];
function lockWave(wave, id, n) {
  for (const q of wave.filter(x => x.kit !== 'boss' && !x.onlyHits).slice(0, n)) {
    if (id === 'air') q.who = 'f';
    else if (id === 'curse') q.kit = 'curse';
    else if (id === 'armor') q.armor = n > 1 ? 5 : 3;
    else if (id === 'hidden') q.aff = ['hidden'];
    else if (id === 'frenzy') { q.aff = ['frenzy']; q.atkK = (q.atkK || 1) * 0.8; }
    else if (id === 'guard') q.kit = 'bodyguard';
    else if (id === 'bubble') q.kit = 'bubble';
  }
}
function lockWaves(out, id, w, gate, extra) {
  if (w < 1) return;
  const r = seeded('lock' + id), pool = LOCK_POOL[w], older = [].concat(...LOCK_POOL.slice(1, w));
  for (const wave of out) {
    // from the fifth world a good roll on a trait starts one-shotting ordinary raiders, so they get tougher. A puzzle room's get tougher still: there you can't out-hit the lock
    for (const q of wave) { const k = (gate ? 1 + 0.1 * w : 1) * (w >= 5 ? 1 + 0.06 * (w - 4) : 1); q.hpK = (q.hpK || 1) * k; if (gate) q.atkK = (q.atkK || 1) * 1.08; }
    if (r() >= (gate ? 1 : extra ? 0.7 : 0.2 + 0.06 * w)) continue;
    const from = w >= 3 && r() < 0.3 ? older : pool;
    lockWave(wave, from[Math.floor(r() * from.length)], gate ? 2 : 1);
  }
}
// when each raider's kit first turns up, by stage number along the main path, so they come in one at a time
const KIT_AT = {
  w: [['brawl', 0], ['pack', 3], ['bleed', 6], ['poison', 13], ['stun', 20], ['drain', 28], ['summon', 38]],
  f: [['sniper', 1], ['poison', 9], ['weaken', 16], ['smoke', 24], ['drain', 34]],
  b: [['brawl', 4], ['charger', 6], ['healer', 11], ['bubble', 18], ['ironclad', 26], ['revive', 36], ['summon', 44]],
};
EP.R_STEP = 0.6;
// (4 Nov, owner: "make it so they should have to get equipment to be stronger too"): raiders grow with the road by more than a team level can keep up with. The rest has to come from gear: a world's last stops expect you in that world's tier
EP.gearAt = R => { const i = (R - 1) / EP.R_STEP; return 0.15 * Math.min(8, (i + 1) / 12) * 1.05; };
// (5 Nov, owner: "more mechanics more unique to each hero so that like a different combination is required for some of the rooms ... the bosses shold be hard and only with strategy shold they be able to win and not by brute force"): from the fifth world raiders also grow past what gear alone answers. The rest comes from traits: a good roll on your hitters, and on whoever holds the line
EP.traitAt = R => { const i = (R - 1) / EP.R_STEP; return 0.2 * Math.max(0, Math.min(1, (i - 47) / 48)); };
const powerOf = R => EP.LV(R) * (1 + EP.gearAt(R)) * (1 + EP.traitAt(R));
// each world bends the fight its own way, harder as it goes. A side road also carries the last world's rule
const RULE_OF = [null, 'tide', 'sun', 'shell', 'restless', 'furnace', 'grid'];
const rulesOf = (w, reg, extra) => {
  const id = RULE_OF[w], s = 1 + 0.25 * (reg || 0); if (!id) return [];
  const out = [{ id, s }];
  if (extra && RULE_OF[w - 1]) out.push({ id: RULE_OF[w - 1], s: 1 });
  return out;
};
// the last world asks you everything: a different rule each wave
const ECLIPSE = ['tide', 'sun', 'shell', 'restless', 'furnace', 'grid'];
const eclipseOf = (id, reg, n) => { const r = seeded('rule' + id), l = ECLIPSE.slice(); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return Array.from({ length: n }, (_, k) => ({ id: l[k % l.length], s: 1 + 0.25 * reg })); };
EP.ROADRULES = (n, w, reg, extra) => { if (w === 7) n.ruleByWave = eclipseOf(n.id, reg, n.waves.length); else n.rules = rulesOf(w, reg, extra); return n; };
function genWaves(id, i, w, boss, gate, extra) {
  const r = seeded(id), kits = who => KIT_AT[who].filter(k => k[1] <= i).map(k => k[0]);
  const raider = who => { const l = kits(who); return { who, kit: l.length ? l[Math.floor(r() * l.length)] : 'brawl' }; };
  const slot = () => { const x = r(); return i >= 4 && x < 0.2 ? 'b' : i >= 1 && x < 0.48 ? 'f' : 'w'; };
  const N = i < 1 ? 1 : i < 4 ? 2 : i < 30 ? 2 + (r() < 0.5 ? 1 : 0) : 3 + (r() < 0.35 ? 1 : 0);
  const size = () => (i < 1 ? 1 : i < 3 ? 1 + (r() < 0.5 ? 1 : 0) : i < 6 ? 2 : i < 60 ? 2 + (r() < 0.6 ? 1 : 0) : 3);
  const out = [];
  // a castle's run-up: short, late on, so the fight is with the boss. It keeps its old length to the fourth world
  for (let n = 0, last = boss && w >= 5 ? 1 : N - (boss || gate ? 1 : 0); n < last; n++) {
    const q = [], s = size() + (extra || 0);
    for (let k = 0; k < s; k++) { const who = slot(); if (who === 'b' && q.some(x => x.who === 'b')) q.push(raider('w')); else q.push(raider(who)); }
    if (!q.some(x => x.who === 'w') && q.length > 1 && i < 12) q[0] = raider('w');
    out.push(q);
  }
  if (gate) out.push([Object.assign(raider('b'), { hpK: 1.7, atkK: 1.15, name: 'Gatekeeper' })].concat(i >= 3 ? [raider('w')] : []));
  // the last castle's run-up stays plain: everything it has to teach is in the boss
  lockWaves(out, id, w === 7 && boss ? 0 : w, gate, extra);
  if (boss) out.push([Object.assign({ who: 'B', kit: 'boss' }, BOSSES[w])]);
  return out;
}
// (4 Nov, owner: "add more landmarks ... make them progressively more impressive"): three a world, growing all the way round the island. fp is how far it spreads on the ground and h how tall it stands; js/epic_landmarks.js draws them, and js/epic_map.js finds them a place. trail: which of the world's trails ends at it
const LANDMARKS = EP.LANDMARKS = [
  [{ key: 'bigpicnic', name: 'The Big Picnic', fp: 7.5, h: 6, trail: 0 }, { key: 'windmill', name: 'Old Windmill', fp: 7, h: 11, trail: 1 }, { key: 'oak', name: 'Treehouse Oak', fp: 5, h: 12, trail: 2 }],
  [{ key: 'wreck', name: 'The Wreck', fp: 9.5, h: 10, trail: 0 }, { key: 'lighthouse', name: 'Great Light', fp: 5.5, h: 17, trail: 1 }, { key: 'whale', name: 'Whale Bones', fp: 11, h: 7, trail: 2 }],
  [{ key: 'colossus', name: 'Buried Colossus', fp: 8, h: 13, trail: 0 }, { key: 'pyramids', name: 'Sun Steps', fp: 13.5, h: 22, trail: 1 }, { key: 'oasis', name: 'Hidden Oasis', fp: 9.5, h: 5, trail: 2 }],
  [{ key: 'sword', name: 'Frozen Blade', fp: 6, h: 17, trail: 0 }, { key: 'palace', name: 'Ice Palace', fp: 12, h: 25, trail: 1 }, { key: 'icearch', name: 'Glacier Arch', fp: 9, h: 9, trail: 2 }],
  [{ key: 'manor', name: 'Lantern Manor', fp: 10.5, h: 15, trail: 0 }, { key: 'deadtree', name: 'The Hanging Tree', fp: 11, h: 26, trail: 1 }, { key: 'stonering', name: 'Whisper Stones', fp: 8, h: 9, trail: 2 }],
  [{ key: 'dragon', name: 'Dragon Bones', fp: 15, h: 12, trail: 0 }, { key: 'citadel', name: 'Forge Citadel', fp: 12, h: 30, trail: 1 }, { key: 'geyser', name: 'Fire Spout', fp: 5, h: 13, trail: 2 }],
  [{ key: 'neonwheel', name: 'Neon Wheel', fp: 8.5, h: 19, trail: 0 }, { key: 'spire', name: 'Arcology Spire', fp: 12, h: 33, trail: 1 }, { key: 'skytrain', name: 'Sky Loop', fp: 10, h: 9, trail: 2 }],
  [{ key: 'telescope', name: 'Star Watch', fp: 10.5, h: 24, trail: 0 }, { key: 'stargate', name: 'The Star Gate', fp: 14.5, h: 42, trail: 1 }, { key: 'fallenstar', name: 'The Fallen Star', fp: 8, h: 30, trail: 2 }],
];
const TRAILS = EP.TRAILS = [];
const NODES = EP.NODES = [], BY = EP.BY = {};
const add = n => { NODES.push(n); BY[n.id] = n; return n; };
(function build() {
  let i = 0, main = 0;
  TD.MAPS.slice(0, 8).forEach((m, w) => {
    for (let reg = 0; reg < 3; reg++) {
      for (let l = 0; l < 4; l++) {
        const boss = reg === 2 && l === 3, gate = l === 3 && !boss, id = `${w}-${reg}-${l}`, R = 1 + i * EP.R_STEP;
        // the first two fights are Pip alone
        EP.ROADRULES(add({ id, kind: boss ? 'castle' : 'stage', main: main++, world: w, map: m.id, theme: m.theme || m.id, reg, l, num: i, R, power: powerOf(R, w) * (i < 2 ? (i ? 0.58 : 0.7) : 1), boss, gate, // (5 Nov) the second, Pip alone against two waves, a little softer: Pip hits less hard than before, and a new player should not lose it
          name: boss ? `${REGIONS[w][2]}` : `${REGIONS[w][reg]} ${l + 1}`, roster: m.roster, waves: genWaves(id, i, w, boss, gate) }), w, reg);
        i++;
      }
      if (reg === 0) add({ id: `hat-${w}`, kind: 'hat', main: main++, world: w, map: m.id, theme: m.theme || m.id, name: 'Hat Stall' });
      if (reg === 1) {
        add({ id: `hut-${w}`, kind: 'hut', main: main++, world: w, map: m.id, theme: m.theme || m.id, name: 'Recipe Hut' });
        // the side road: a gate, three harder fights, a chest
        const gid = `gate-${w}`, base = 1 + i * EP.R_STEP + 3;
        add({ id: gid, kind: 'gate', branchOf: main - 1, world: w, map: m.id, theme: m.theme || m.id, name: 'Buddy Gate' });
        for (let s = 0; s < 3; s++) {
          const id2 = `side-${w}-${s}`, R = base + s;
          EP.ROADRULES(add({ id: id2, kind: 'stage', side: w, sideI: s, world: w, map: m.id, theme: m.theme || m.id, reg: 1, num: i + s, R, power: powerOf(R, w), name: `Back Alley ${s + 1}`, roster: m.roster, waves: genWaves(id2, i + 3, w, false, s === 2, 0) }), w, 1, true);
        }
        add({ id: `chest-${w}`, kind: 'chest', side: w, world: w, map: m.id, theme: m.theme || m.id, name: 'Back Alley Chest' });
      }
    }
    // (4 Nov, owner: "add more off branch stages"): two free trails a world, each climbing to one of its landmarks with a chest at the foot of it. No gate: beat the stop they leave from and they are open
    // (4 Nov, owner: "make them have a special node"): every trail ends at its landmark's postcard stop. The third trail is only a short spur to one, with no fights on it
    LANDMARKS[w].forEach(L => {
      const j = L.trail, hub = BY[`${w}-${[0, 2, 1][j]}-1`], many = [2, 3, 0][j], ids = [], base = 1 + hub.num * EP.R_STEP + 2;
      for (let s = 0; s < many; s++) {
        const id2 = `trail-${w}-${j}-${s}`, R = base + s; ids.push(id2);
        EP.ROADRULES(add({ id: id2, kind: 'stage', trail: j, trailI: s, branchOf: hub.main, world: w, map: m.id, theme: m.theme || m.id, reg: hub.reg, num: hub.num + s, R, power: powerOf(R, w), name: `${L.name} ${s + 1}`, roster: m.roster, waves: genWaves(id2, hub.num + 2, w, false, s === many - 1, 0) }), w, hub.reg, j === 1);
      }
      if (many) {
        const cid = `tchest-${w}-${j}`; ids.push(cid);
        add({ id: cid, kind: 'chest', trail: j, trailI: many, branchOf: hub.main, ckey: `t${w}-${j}`, world: w, map: m.id, theme: m.theme || m.id, name: `${L.name} Chest` });
      }
      const lid = `lm-${L.key}`; ids.push(lid);
      add({ id: lid, kind: 'landmark', lm: L.key, trail: j, branchOf: hub.main, needs: many ? `trail-${w}-${j}-${many - 1}` : null, world: w, map: m.id, theme: m.theme || m.id, name: L.name });
      (TRAILS[w] = TRAILS[w] || [])[j] = { hub: hub.id, ids, lm: L.key };
    });
  });
})();
// what the lobby says about each hero
for (const a of Object.keys(EP.HEROES)) { AF.CREW[a].blurb = EP.HEROES[a].blurb; AF.CREW[a].attack = EP.ROLE[EP.HEROES[a].role].n; }
EP.WORLDS = TD.MAPS.slice(0, 8).map((m, w) => ({ id: m.id, name: m.name, theme: m.theme || m.id, roster: m.roster, mat: MAT_OF_WORLD[w], boss: TD.ENEMIES[m.roster.B] }));

// ---------------- the save ----------------
// (4 Nov, owner: "add a new energy system that restores some energy every time period and so then they can use that to auto play"): auto-play costs 1 energy a fight. Playing by hand is always free
EP.ENERGY_MAX = 16; /* (4 Nov, owner: "cap auto play at 16") */ EP.ENERGY_EVERY = 180; EP.ENERGY_COST = 3; // (owner: "make autoplay use like 3 a fight")
EP.energy = () => {
  const e = S(), now = Date.now();
  if (e.energy == null) { e.energy = EP.ENERGY_MAX; e.energyT = now; }
  if (e.energy > EP.ENERGY_MAX) e.energy = EP.ENERGY_MAX; // a save from when the most was higher
  if (e.energy >= EP.ENERGY_MAX) e.energyT = now;
  else { const got = Math.floor((now - (e.energyT || now)) / (EP.ENERGY_EVERY * 1000)); if (got > 0) { e.energy = Math.min(EP.ENERGY_MAX, e.energy + got); e.energyT = e.energy >= EP.ENERGY_MAX ? now : e.energyT + got * EP.ENERGY_EVERY * 1000; } }
  return e.energy;
};
EP.energyIn = () => { const e = S(); EP.energy(); return e.energy >= EP.ENERGY_MAX ? 0 : Math.ceil((e.energyT + EP.ENERGY_EVERY * 1000 - Date.now()) / 1000); };
// (5 Nov, owner: "make it so they can use auto play after they complete the level once first"). A fight with no stage of its own has nothing to complete first
EP.autoOk = node => !node || !node.id || (S().runs[node.id] || 0) > 0;
EP.spendEnergy = () => { if (EP.freeEnergy) return true; if (EP.energy() < EP.ENERGY_COST) return false; const e = S(); if (e.energy >= EP.ENERGY_MAX) e.energyT = Date.now(); e.energy -= EP.ENERGY_COST; G.save(); return true; };
const EMPTY = () => ({ v: 1, finds: {}, lv: 1, xp: 0, caps: 3, cheers: 3, party: ['pip'], reach: 0, stars: {}, runs: {}, heroes: {}, gear: [], mats: {}, pots: { heal1: 2 }, recipes: ['g:chop:1', 'g:tray:1', 'p:heal1'], gates: {}, chests: {}, daily: { day: -1, done: false }, golden: null, sinceGolden: 0, bar: 0, nextGear: 1, stats: { wins: 0, bosses: 0, stars3: 0, hits: 0 }, at: null, firstWin: false });
const S = EP.S = () => {
  const s = G.S;
  if (!s.ep || !s.ep.v) {
    s.ep = EMPTY();
    // a save from before the Expedition: whoever you already own forms the first party
    const owned = ['pip', 'bao', 'pig', 'fox', 'penguin', 'owl', 'hazel', 'fig', 'dot', 'mochi'].filter(a => G.towerOf(a));
    if (owned.length) s.ep.party = owned.slice(0, 3);
  }
  return s.ep;
};
EP.hero = animal => {
  const e = S(), h = e.heroes[animal] || (e.heroes[animal] = { cls: EP.HEROES[animal].classes[0].id, owned: [EP.HEROES[animal].classes[0].id], tiers: {}, w: 0, o: 0 });
  return h;
};
EP.owned = animal => !!G.towerOf(animal);
EP.partyList = () => S().party.filter(a => EP.HEROES[a] && EP.owned(a));
EP.setParty = list => { S().party = list.filter(a => EP.HEROES[a] && EP.owned(a)).slice(0, 3); G.save(); };
EP.setClass = (animal, id) => { const h = EP.hero(animal); if (h.owned.includes(id)) { h.cls = id; G.save(); return true; } return false; };

// ---------------- gear ----------------
const WEAPONS = EP.WEAPONS = {
  chop: { n: 'Chopsticks', perk: '15% chance to crit for +50%', on: u => { u.critP = Math.max(u.critP || 0, 0.15); u.critD = Math.max(u.critD || 0, 0.5); } },
  skewer: { n: 'Skewer', perk: '30% chance to also poke another raider for 20%', on: u => { u.chainP = 0.3; } },
  ladle: { n: 'Ladle', perk: '5% chance to stun', on: u => { u.stunP = 0.05; } },
};
const OFFS = EP.OFFS = {
  tray: { n: 'Serving Tray', perk: 'Takes 5% less damage', on: u => { u.gearLess = (u.gearLess || 0) + 0.05; } },
  sign: { n: 'Menu Board', perk: 'Deals 5% more damage', on: u => { u.atk *= 1.05; } },
  mitt: { n: 'Oven Mitt', perk: 'Heals 10% harder', on: u => { u.healK = (u.healK || 1) * 1.1; } },
};
const TIERS = EP.TIERS = ['Bamboo', 'Tin', 'Copper', 'Steel', 'Silver', 'Jade', 'Gold', 'Star'];
const SETS = EP.GEARSETS = {
  night: { n: 'Night Shift', w: 'Night Tongs', o: 'Night Apron', d: 'Wearer takes 10% less damage.', on: u => { u.gearLess = (u.gearLess || 0) + 0.1; } },
  lucky: { n: 'Lucky Round', w: 'Lucky Dice', o: 'Lucky Coaster', d: '25% chance a hit lands 50% harder.', on: u => { u.luckP = 0.25; } },
  again: { n: 'One More Round', w: 'Second Skewer', o: 'Refill Cup', d: '10% chance of an extra action.', on: u => { u.extraP = 0.1; } },
  last: { n: 'Last Orders', w: 'Closing Bell', o: 'Bar Towel', d: 'Gets back up once per fight.', on: u => { u.reviveOnce = true; } },
  happy: { n: 'Happy Hour', w: 'Pour Spout', o: 'Bottle Opener', d: 'The bottle fills 20% faster.', on: u => { u.rageK = (u.rageK || 1) * 1.2; } },
  mom: { n: 'Mom\'s Recipe', w: 'Big Spoon', o: 'Lunchbox Lid', d: 'Heals 25% harder.', on: u => { u.healK = (u.healK || 1) * 1.25; } },
  pick: { n: 'Pickpocket', w: 'Sticky Gloves', o: 'Deep Pockets', d: '25% more yen from every win.', on: u => { u.yenK = 1.25; } },
};
// (4 Nov, owner: "they should have to get equipment"): worth having, at every tier
const tierValue = (tier, spots, k = 1) => 0.15 * tier * (1 + 0.15 * (spots || 0)) * k;
EP.itemName = it => (it.set ? SETS[it.set][it.slot] : `${TIERS[it.tier - 1]} ${(it.slot === 'w' ? WEAPONS : OFFS)[it.base].n}`);
EP.itemValue = it => tierValue(it.tier, it.spots, it.set ? 1.1 : 1);
EP.itemPerk = it => (it.set ? `${SETS[it.set].n} set: ${SETS[it.set].d}` : (it.slot === 'w' ? WEAPONS : OFFS)[it.base].perk);
EP.itemById = id => S().gear.find(x => x.uid === id) || null;
const newItem = o => { const e = S(), it = Object.assign({ uid: e.nextGear++, spots: 0 }, o); e.gear.push(it); return it; };
EP.equip = (animal, slot, uid) => {
  const e = S(), h = EP.hero(animal);
  // one piece can only be in one hero's hands
  if (uid) for (const a in e.heroes) if (e.heroes[a][slot] === uid) e.heroes[a][slot] = 0;
  h[slot] = uid || 0; G.save();
};
EP.wornBy = uid => { const e = S(); for (const a in e.heroes) if (e.heroes[a].w === uid || e.heroes[a].o === uid) return a; return null; };

// ---------------- a hero, ready to fight ----------------
EP.heroUnit = (animal, o = {}) => {
  const H = EP.HEROES[animal], R = EP.ROLE[H.role], e = S(), L = o.lv || e.lv, lv = EP.LV(L), h = o.bare ? { cls: o.cls, tiers: {}, w: 0, o: 0 } : EP.hero(animal);
  const cl = EP.classOf(animal, o.cls || h.cls), u = G.towerOf(animal), tb = o.trait || (!o.bare && u && AF.traitOf && AF.TD.traitTd ? AF.TD.traitTd(AF.traitOf(u)) : {});
  const w = !o.bare && h.w ? EP.itemById(h.w) : null, off = !o.bare && h.o ? EP.itemById(h.o) : null;
  const unit = {
    animal, name: AF.CREW[animal].name, cls: cl, tierK: 1 + 0.1 * (h.tiers[cl.id] || 0), role: H.role, style: H.style,
    atk: R.atk * lv * (1 + (w ? EP.itemValue(w) : o.gear || 0)) * (tb.atk || 1),
    max: Math.round(R.hp * lv * (1 + (off ? EP.itemValue(off) : o.gear || 0)) * (tb.spa || 1)),
    rageK: tb.rng || 1,
  };
  if (w && !w.set) WEAPONS[w.base].on(unit);
  if (off && !off.set) OFFS[off.base].on(unit);
  if (w && off && w.set && w.set === off.set) SETS[w.set].on(unit);
  unit.hp = unit.max;
  return unit;
};
EP.partyUnits = () => EP.partyList().map(a => EP.heroUnit(a));
// how the team measures up to a stage: 1 is a fair fight with a full team
EP.teamPower = () => {
  const list = EP.partyList(), e = S();
  if (!list.length) return 0;
  const gear = list.reduce((a, an) => { const h = EP.hero(an), w = h.w && EP.itemById(h.w), o = h.o && EP.itemById(h.o); return a + (w ? EP.itemValue(w) : 0) + (o ? EP.itemValue(o) : 0); }, 0) / list.length / 2;
  // a trait counts on the arrow too: the mean of attack and health, across the team
  const trait = list.reduce((a, an) => { const u = G.towerOf(an), t = u && AF.traitOf && AF.TD.traitTd ? AF.TD.traitTd(AF.traitOf(u)) : {}; return a + ((t.atk || 1) + (t.spa || 1)) / 2; }, 0) / list.length;
  return EP.LV(e.lv) * (1 + gear) * trait * (list.length / 3);
};
// the arrow on the stage board: green is a walkover and pays less, yellow is fair, red will probably beat you.
// the first few stages expect a smaller team
EP.arrow = node => {
  const need = (node.num < 2 ? 1 / 3 / 0.7 : node.num < 4 ? 2 / 3 : 1) * node.power, r = EP.teamPower() / need;
  return { id: r >= 1.25 ? 'green' : r >= 0.88 ? 'yellow' : 'red', r };
};

// ---------------- team level ----------------
EP.xpNeed = L => 25 + 12 * L;
// a team can't out-level the road: the most it can reach grows with the castles it has beaten, so gear has to carry the rest
EP.levelCap = () => { const w = MAIN.length ? EP.reachNode().world : 0; return Math.min(EP.LEVEL_MAX, Math.ceil(1 + (12 * w + 11) * EP.R_STEP) + 1); };
const addXp = n => {
  const e = S(); let ups = 0;
  e.xp += Math.round(n);
  const cap = EP.levelCap();
  if (e.lv >= cap) { e.xp = Math.min(e.xp, EP.xpNeed(e.lv) - 1); return 0; }
  while (e.lv < cap && e.xp >= EP.xpNeed(e.lv)) { e.xp -= EP.xpNeed(e.lv); e.lv++; e.caps++; ups++; EP.energy(); e.energy = Math.min(EP.ENERGY_MAX, e.energy + 2); } // (owner: "energy not being spent?"): early on a team levels nearly every other fight, and +5 a level paid for Auto outright
  if (e.lv >= EP.LEVEL_MAX) e.xp = 0;
  return ups;
};

// ---------------- opening the road ----------------
const MAIN = NODES.filter(n => n.main != null).sort((a, b) => a.main - b.main);
EP.MAIN = MAIN;
EP.reachNode = () => MAIN[Math.min(S().reach, MAIN.length - 1)];
// a stall or a hut never blocks the road
const walkOn = () => { const e = S(); while (e.reach < MAIN.length - 1 && MAIN[e.reach].kind !== 'stage' && MAIN[e.reach].kind !== 'castle') e.reach++; };
EP.isOpen = n => {
  const e = S();
  if (n.main != null) return n.main <= e.reach;
  if (n.kind === 'landmark') return e.reach > n.branchOf && (!n.needs || (e.runs[n.needs] || 0) > 0);
  if (n.trail != null) { if (e.reach <= n.branchOf) return false; return n.trailI === 0 || (e.runs[`trail-${n.world}-${n.trail}-${n.trailI - 1}`] || 0) > 0; }
  if (n.kind === 'gate') return e.reach > n.branchOf;
  if (!EP.gateOpen(n.world)) return false;
  if (n.kind === 'chest') return (e.runs[`side-${n.world}-2`] || 0) > 0;
  return n.sideI === 0 || (e.runs[`side-${n.world}-${n.sideI - 1}`] || 0) > 0;
};
EP.isDone = n => (n.kind === 'landmark' ? !!(S().lm || {})[n.lm] : n.kind === 'stage' || n.kind === 'castle' ? (S().runs[n.id] || 0) > 0 : n.kind === 'chest' ? !!S().chests[n.ckey != null ? n.ckey : n.world] : n.kind === 'gate' ? EP.gateOpen(n.world) : EP.isOpen(n));
EP.goal = () => { walkOn(); const n = EP.reachNode(); return n; };
EP.worldDone = id => { const w = EP.WORLDS.findIndex(x => x.id === id), n = BY[`${w}-2-3`]; return !!(n && S().runs[n.id]); };
EP.worldIndex = () => EP.reachNode().world;
EP.best = id => S().stars[id] || 0;

// gates: pay caps, or knock and wait
EP.GATE_COST = 25;
EP.GATE_WAIT = 8 * 3600 * 1000;
EP.gateOpen = w => { const g = S().gates[w]; return !!g && (g.open || (g.at && Date.now() >= g.at)); };
EP.gateLeft = w => { const g = S().gates[w]; return g && g.at && !g.open ? Math.max(0, g.at - Date.now()) : 0; };
EP.gatePay = w => { const e = S(); if (EP.gateOpen(w)) return true; if (e.caps < EP.GATE_COST) return false; e.caps -= EP.GATE_COST; e.gates[w] = { open: true }; G.save(); return true; };
EP.gateKnock = w => { const e = S(); if (!e.gates[w]) { e.gates[w] = { at: Date.now() + EP.GATE_WAIT }; G.save(); } };

// a chest at the end of a side road
EP.openChest = (w, ckey) => {
  const e = S();
  // a trail's chest, at the foot of its landmark: less than a Buddy Gate's, which you paid to reach, and a soup or two for the road
  if (ckey != null) {
    if (e.chests[ckey]) return null;
    e.chests[ckey] = true;
    const got = [{ kind: 'caps', n: 3 + w }, { kind: 'yen', n: 80 + w * 40 }, { kind: 'mat', id: MAT_OF_WORLD[w], n: 3 }, { kind: 'pot', id: w > 3 ? 'heal2' : 'heal1', n: 1 }].filter(it => it.kind !== 'pot' || EP.POTIONS[it.id]);
    give(got); G.save();
    return got;
  }
  if (e.chests[w]) return null;
  e.chests[w] = true;
  const out = [{ kind: 'caps', n: 8 + w * 2 }, { kind: 'yen', n: 120 + w * 60 }, { kind: 'mat', id: MAT_OF_WORLD[w], n: 6 }];
  const rec = recipesAt(w).filter(r => !e.recipes.includes(r.id));
  if (rec.length) { const r = rec[Math.floor(Math.random() * rec.length)]; out.push({ kind: 'recipe', id: r.id }); }
  give(out); G.save();
  return out;
};

// ---------------- a landmark's postcard stop ----------------
// (4 Nov, owner: "make them have a special node or something figure out what that node will do idk"). It adds no power: heroes grow by team level and gear alone.
// The first time you reach one you collect its postcard, which pays caps and cheers. A world's three, and all twenty-four, pay more. And it is a picnic spot: a rest there refills auto-play energy, more the further round the island it is, once every 8 hours
EP.LM_REST = 8 * 3600 * 1000;
EP.lmBy = key => { for (let w = 0; w < 8; w++) { const L = LANDMARKS[w].find(q => q.key === key); if (L) return Object.assign({ w }, L); } return null; };
EP.lmState = () => { const e = S(); if (!e.lm) e.lm = {}; return e.lm; };
EP.lmCount = () => Object.keys(EP.lmState()).length;
EP.lmHas = key => !!EP.lmState()[key];
EP.lmEnergy = key => 3 + EP.lmBy(key).w;
EP.lmStamp = key => {
  const st = EP.lmState(); if (st[key]) return null;
  st[key] = { rest: 0 };
  const w = EP.lmBy(key).w, got = [{ kind: 'caps', n: 2 + w }, { kind: 'cheers', n: 1 }];
  const set = LANDMARKS[w].every(q => st[q.key]), all = EP.lmCount() === 24;
  if (set) got.push({ kind: 'caps', n: 6 + w * 2 }, { kind: 'mat', id: MAT_OF_WORLD[w], n: 6 });
  if (all) got.push({ kind: 'caps', n: 50 }, { kind: 'cheers', n: 10 });
  give(got); G.save();
  return { got, set, all };
};
EP.lmRestIn = key => { const r = EP.lmState()[key]; return r && r.rest ? Math.max(0, r.rest + EP.LM_REST - Date.now()) : 0; };
EP.lmCanRest = key => EP.lmHas(key) && !EP.lmRestIn(key) && EP.energy() < EP.ENERGY_MAX;
EP.lmDoRest = key => { if (!EP.lmCanRest(key)) return 0; const e = S(), had = EP.energy(); e.energy = Math.min(EP.ENERGY_MAX, had + EP.lmEnergy(key)); if (e.energy >= EP.ENERGY_MAX) e.energyT = Date.now(); EP.lmState()[key].rest = Date.now(); G.save(); return e.energy - had; };

// ---------------- what a win pays ----------------
const give = items => {
  const e = S();
  for (const it of items) {
    if (it.kind === 'yen') G.S.yen += it.n;
    else if (it.kind === 'caps') e.caps += it.n;
    else if (it.kind === 'cheers') e.cheers += it.n;
    else if (it.kind === 'mat') e.mats[it.id] = (e.mats[it.id] || 0) + it.n;
    else if (it.kind === 'pot') e.pots[it.id] = (e.pots[it.id] || 0) + (it.n || 1);
    else if (it.kind === 'recipe' && !e.recipes.includes(it.id)) e.recipes.push(it.id);
  }
};
EP.give = give;
const STORY_HEROES = { '0-0-1': 'bao', '0-0-3': 'pig' };
EP.storyHero = id => STORY_HEROES[id] || null;
// a stage's guaranteed first-clear prize, for the board
EP.prizeOf = n => {
  const mat = MAT_OF_WORLD[n.world];
  if (n.boss) return [{ kind: 'caps', n: 6 + n.world * 2 }, { kind: 'mat', id: mat, n: 6 }];
  if (n.side != null || n.trail != null) return [{ kind: 'mat', id: mat, n: 4 }];
  if (n.gate) return [{ kind: 'mat', id: mat, n: 4 }, { kind: 'pot', id: 'heal1', n: 1 }];
  return [{ kind: 'mat', id: mat, n: 2 }];
};
EP.finish = (B, node) => {
  const e = S(), first = node.id && !e.runs[node.id], stars = EP.starsOf(B), arrow = node.id ? EP.arrow(node).id : 'yellow';
  const yenK = (arrow === 'green' ? 0.55 : 1) * (first ? 2 : 1) * (B.heroes.some(h => h.yenK) ? 1.25 : 1);
  const num = node.num != null ? node.num : Math.max(0, e.lv / EP.R_STEP);
  const yen = Math.round((12 + num * 1.6) * yenK * (node.yenK || 1)) + (B.stats.coins || 0);
  const xp = Math.round((10 + 5 * (node.R || e.lv)) * (first ? 1.5 : 1) * (arrow === 'green' ? 0.6 : 1) * (B.xpK || 1) * (node.yenK ? 1.5 : 1));
  G.S.yen += yen;
  const ups = addXp(xp);
  const out = { yen, xp, ups, stars, first, was: e.stars[node.id] || 0, prize: [], hero: null, level: e.lv };
  if (node.id) {
    e.runs[node.id] = (e.runs[node.id] || 0) + 1;
    e.stars[node.id] = Math.max(e.stars[node.id] || 0, stars);
    if (stars === 3 && out.was < 3) { e.cheers++; out.cheers = 1; }
    if (first) { out.prize = EP.prizeOf(node); give(out.prize); }
    if (node.main != null && e.reach <= node.main) { e.reach = node.main + 1; walkOn(); }
    if (first && STORY_HEROES[node.id] && AF.G.freeTower) { const a = STORY_HEROES[node.id]; if (AF.G.freeTower(a)) { out.hero = a; if (e.party.length < 3 && !e.party.includes(a)) e.party.push(a); } }
    if (first && node.boss) e.stats.bosses++;
  }
  e.stats.wins++;
  if (stars === 3) e.stats.stars3++;
  G.S.stats.tdWins = (G.S.stats.tdWins || 0) + 1;
  rollGolden();
  G.save();
  return out;
};
EP.totalStars = () => Object.values(S().stars).reduce((a, b) => a + b, 0);

// ---------------- the wheel ----------------
// twelve wedges of what this world grows; each star you earned is one pointer. Costs a Cheers token to spin again
const POINTERS = [0, 4, 8];
EP.POINTERS = POINTERS;
EP.wheelOf = node => {
  const w = node.world != null ? node.world : EP.worldIndex(), mat = MAT_OF_WORLD[w], prev = MAT_OF_WORLD[Math.max(0, w - 1)], r = seeded((node.id || 'x') + ':' + Date.now());
  const yen = Math.round(10 + (node.num || 0) * 0.9);
  const heal = w >= 4 ? 'heal2' : 'heal1';
  const L = [
    { kind: 'mat', id: mat, n: 3 }, { kind: 'mat', id: 'cork', n: 2 }, { kind: 'yen', n: yen }, { kind: 'mat', id: mat, n: 1 }, { kind: 'pot', id: heal, n: 1 }, { kind: 'mat', id: prev, n: 2 },
    { kind: 'yen', n: yen * 2 }, { kind: 'mat', id: mat, n: 2 }, { kind: 'mat', id: 'cork', n: 3 }, { kind: 'cheers', n: 1 }, { kind: 'mat', id: prev, n: 1 }, r() < 0.18 ? { kind: 'caps', n: 1 } : { kind: 'pot', id: 'rage1', n: 1 },
  ];
  // shuffled, so the jackpots don't always sit in the same place
  for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; }
  return L;
};
EP.spin = (wheel, stars) => { const at = Math.floor(Math.random() * wheel.length); return { at, items: POINTERS.slice(0, stars).map(p => wheel[(at + p) % wheel.length]) }; };
EP.respin = () => { const e = S(); if (e.cheers < 1) return false; e.cheers--; G.save(); return true; };
EP.itemText = it => {
  if (it.kind === 'yen') return `${it.n} yen`;
  if (it.kind === 'caps') return `${it.n} Gold Cap${it.n === 1 ? '' : 's'}`;
  if (it.kind === 'cheers') return `${it.n} Cheers`;
  if (it.kind === 'mat') return `${it.n} ${MATS[it.id].n}`;
  if (it.kind === 'pot') return `${it.n > 1 ? it.n + ' ' : ''}${EP.POTIONS[it.id].n}`;
  if (it.kind === 'recipe') return `Recipe: ${EP.recipeName(it.id)}`;
  if (it.kind === 'item') return EP.itemName(it.item);
  return '';
};

// ---------------- recipes and crafting ----------------
const POT_RECIPES = EP.POT_RECIPES = {
  heal1: { world: 0, mats: { rice: 2, cork: 1 } }, rage1: { world: 0, mats: { barley: 1, rice: 2, cork: 1 } }, group: { world: 1, mats: { rice: 3, barley: 3, cork: 2 } }, heal2: { world: 1, mats: { barley: 3, cork: 2 } },
  rage2: { world: 2, mats: { lemon: 3, barley: 2, cork: 2 } }, xp2: { world: 3, mats: { ice: 3, lemon: 2, cork: 2 } }, heal3: { world: 4, mats: { charcoal: 3, ice: 2, cork: 2 } }, rage3: { world: 5, mats: { peach: 3, charcoal: 2, cork: 3 } },
};
EP.recipeName = id => {
  const [k, a, t] = id.split(':');
  if (k === 'p') return EP.POTIONS[a].n;
  return `${TIERS[+t - 1]} ${(WEAPONS[a] || OFFS[a]).n}`;
};
EP.recipeCost = id => {
  const [k, a, t] = id.split(':');
  if (k === 'p') return { mats: POT_RECIPES[a].mats, yen: 8 + POT_RECIPES[a].world * 8 };
  const T = +t, main = MAT_OF_WORLD[T - 1], prev = MAT_OF_WORLD[Math.max(0, T - 2)], mats = { cork: 2 + T };
  mats[main] = (mats[main] || 0) + 3 + T;
  mats[prev] = (mats[prev] || 0) + 2 + T;
  return { mats, yen: 15 * T };
};
const recipesAt = EP.recipesAt = w => {
  const out = [], T = w + 1;
  for (const b of Object.keys(WEAPONS)) out.push({ id: `g:${b}:${T}`, price: 30 + 40 * T });
  for (const b of Object.keys(OFFS)) out.push({ id: `g:${b}:${T}`, price: 30 + 40 * T });
  for (const p in POT_RECIPES) if (POT_RECIPES[p].world === w) out.push({ id: `p:${p}`, price: 25 + 25 * T });
  return out.filter(r => r.id !== 'p:heal1');
};
EP.buyRecipe = (id, price) => { const e = S(); if (e.recipes.includes(id) || G.S.yen < price) return false; G.S.yen -= price; e.recipes.push(id); G.save(); return true; };
EP.canCraft = id => { const { mats, yen } = EP.recipeCost(id), e = S(); return G.S.yen >= yen && Object.keys(mats).every(m => (e.mats[m] || 0) >= mats[m]); };
// the die: 0 to 3 spots. Each spot is a better item, or one more potion. Gold caps buy a surer roll
const DIE = [0, 0, 1, 1, 2, 3];
EP.DIE_COST = { 2: 5, 3: 15 };
EP.craft = (id, least = 0) => {
  if (!EP.canCraft(id)) return null;
  const e = S(), { mats, yen } = EP.recipeCost(id), [k, a, t] = id.split(':'), extra = EP.DIE_COST[least] || 0;
  if (e.caps < extra) return null;
  e.caps -= extra; G.S.yen -= yen;
  for (const m in mats) e.mats[m] -= mats[m];
  const spots = Math.max(least, DIE[Math.floor(Math.random() * 6)]);
  let result;
  if (k === 'p') { e.pots[a] = (e.pots[a] || 0) + 1 + spots; result = { kind: 'pot', id: a, n: 1 + spots }; }
  else { const slot = WEAPONS[a] ? 'w' : 'o', item = newItem({ base: a, slot, tier: +t, spots }); result = { kind: 'item', item }; }
  G.save();
  return { spots, result };
};

// ---------------- the classes: bought at a stall, trained at its yard ----------------
EP.classPrice = (animal, idx) => (idx === 1 ? { yen: 120 } : { caps: 20 });
EP.classOpens = idx => (idx === 1 ? 0 : 2); // the world whose stall first sells it
EP.buyClass = (animal, id) => {
  const H = EP.HEROES[animal], idx = H.classes.findIndex(c => c.id === id), h = EP.hero(animal), e = S(), p = EP.classPrice(animal, idx);
  if (h.owned.includes(id)) return true;
  if (p.yen && G.S.yen < p.yen) return false;
  if (p.caps && e.caps < p.caps) return false;
  if (p.yen) G.S.yen -= p.yen;
  if (p.caps) e.caps -= p.caps;
  h.owned.push(id); h.cls = id; G.save();
  return true;
};
EP.TIER_MAX = 2;
EP.tierPrice = t => (t === 0 ? 150 : 500);
EP.trainClass = (animal, id) => {
  const h = EP.hero(animal), t = h.tiers[id] || 0;
  if (t >= EP.TIER_MAX || G.S.yen < EP.tierPrice(t)) return false;
  G.S.yen -= EP.tierPrice(t); h.tiers[id] = t + 1; G.save();
  return true;
};

// ---------------- the Lucky Bottle Machine ----------------
EP.MACHINE = { small: 3, big: 20, bar: 100 };
const setPiece = () => { const ids = Object.keys(SETS), id = ids[Math.floor(Math.random() * ids.length)], slot = Math.random() < 0.5 ? 'w' : 'o'; return newItem({ set: id, slot, tier: Math.min(8, EP.worldIndex() + 2), spots: 1 }); };
EP.machine = kind => {
  const e = S(), cost = EP.MACHINE[kind];
  if (e.caps < cost) return null;
  e.caps -= cost; e.bar += cost;
  const guaranteed = e.bar >= EP.MACHINE.bar;
  if (guaranteed) e.bar -= EP.MACHINE.bar;
  const w = EP.worldIndex(), r = Math.random();
  let got;
  if (guaranteed || (kind === 'big' && r < 0.65) || (kind === 'small' && r < 0.05)) got = { kind: 'item', item: setPiece(), rare: true };
  else if (kind === 'big') { const pool = Object.keys(WEAPONS).concat(Object.keys(OFFS)), b = pool[Math.floor(Math.random() * pool.length)]; got = { kind: 'item', item: newItem({ base: b, slot: WEAPONS[b] ? 'w' : 'o', tier: Math.min(8, w + 2), spots: 3 }) }; }
  else if (r < 0.3) { got = { kind: 'pot', id: ['rage1', 'heal1', 'group', 'heal2'][Math.floor(Math.random() * 4)], n: 1 }; give([got]); }
  else { got = { kind: 'mat', id: MAT_OF_WORLD[w], n: 5 }; give([got]); }
  G.save();
  return { got, guaranteed };
};
EP.lastCall = () => { const e = S(); if (e.caps < 30) return false; e.caps -= 30; e.pots.lastcall = (e.pots.lastcall || 0) + 1; G.save(); return true; };

// ---------------- the daily dive ----------------
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
EP.dailyOpen = () => S().daily.day !== today();
EP.dailyStage = () => {
  const e = S(), d = today(), w = d % Math.max(1, EP.worldIndex() + 1), m = EP.WORLDS[w], id = `daily-${d}`, i = Math.max(4, Math.round((e.lv - 1) / EP.R_STEP));
  return { id: null, daily: true, kind: 'daily', name: `Daily Dive: ${m.name}`, world: w, map: m.id, theme: m.theme, num: i, R: e.lv, power: powerOf(e.lv, w) * 0.95, roster: m.roster, yenK: 4, waves: genWaves(id, i, w, false, true, 0) };
};
EP.dailyDone = () => { S().daily = { day: today(), done: true }; G.save(); };

// ---------------- the golden raider: a visitor on an old stage ----------------
function rollGolden() {
  const e = S();
  e.sinceGolden = (e.sinceGolden || 0) + 1;
  if (e.golden || e.sinceGolden < 3 || Math.random() > 0.3) return;
  const done = MAIN.filter(n => n.kind === 'stage' && e.runs[n.id]);
  if (done.length < 3) return;
  e.golden = done[Math.floor(Math.random() * done.length)].id;
  e.sinceGolden = 0;
}
EP.goldenStage = () => {
  const e = S(), n = BY[e.golden]; if (!n) return null;
  return { id: null, golden: true, kind: 'golden', name: 'Golden Raider', world: n.world, map: n.map, theme: n.theme, num: n.num, R: n.R, power: n.power, roster: n.roster, at: n.id,
    waves: [[{ who: 'w', kit: 'golden', hpK: 1, name: 'Golden Raider', coin: Math.round(4 + n.num * 0.5), onlyHits: true, hits: 80 }]] };
};
EP.goldenGone = () => { S().golden = null; G.save(); };

// ---------------- hidden finds on the map ----------------
// (3 Nov, owner: "make it explorable kind of") a few sparkles off the road in every world, each paying once
EP.FINDS_PER_WORLD = 4;
EP.find = id => {
  const e = S(); e.finds = e.finds || {};
  if (e.finds[id]) return null;
  e.finds[id] = 1;
  const w = +id.split('-')[0], r = Math.random();
  const it = r < 0.45 ? { kind: 'mat', id: MAT_OF_WORLD[w], n: 3 } : r < 0.75 ? { kind: 'yen', n: 25 + w * 20 } : r < 0.92 ? { kind: 'pot', id: w >= 4 ? 'heal2' : 'heal1', n: 1 } : { kind: 'caps', n: 2 };
  give([it]); G.save();
  return it;
};

// ---------------- the stage for a fight, with the map's own arena settings ----------------
EP.fightOf = node => ({ id: node.id, name: node.name, waves: AF.tutorial && AF.tutorial.longFirst && AF.tutorial.longFirst(node) ? node.waves.map(w => w.map(q => Object.assign({}, q, { hpK: 4 }))) : node.waves, power: node.power, roster: node.roster, boss: !!node.boss, theme: node.theme, map: node.map, num: node.num, world: node.world, R: node.R, rules: node.rules, ruleByWave: node.ruleByWave });
EP.reset = () => { G.S.ep = EMPTY(); };

// a hero you hire walks into the party if there is room
const unlock0 = G.unlockTower;
G.unlockTower = animal => { const r = unlock0(animal); if (r && !r.err && S().party.length < 3 && !S().party.includes(animal)) { S().party.push(animal); G.save(); } return r; };

// ---------------- the lobby's goals and gates, now about the road ----------------
// the old "clear this world on Normal" keys still name gates; beating a world's castle is what counts now
const worldOfKey = key => key.split(':')[0];
G.tdClear = key => EP.worldDone(worldOfKey(key));
G.tdWon = key => EP.worldDone(worldOfKey(key));
G.tdClears = () => EP.WORLDS.filter(w => EP.worldDone(w.id)).length;
const qstat0 = G.qstat;
G.qstat = q => {
  if (q.stat.startsWith('ep:')) {
    const e = S(), k = q.stat.slice(3);
    if (k === 'stages') return Object.values(e.runs).filter(n => n > 0).length;
    if (k === 'stars') return EP.totalStars();
    if (k === 'stars3') return Object.values(e.stars).filter(n => n >= 3).length;
    if (k === 'level') return e.lv;
    if (k === 'crafted') return e.gear.length;
    if (k === 'heroes') return G.S.units.length;
    if (k === 'classes') return Object.values(e.heroes).reduce((a, h) => a + h.owned.length - 1, 0);
    if (k === 'chests') return Object.keys(e.chests).length;
    if (k.startsWith('world:')) return EP.worldDone(k.slice(6)) ? 1 : 0;
    return 0;
  }
  return qstat0(q);
};
{
  const Q = (id, name, stat, goal, yenPay) => ({ id, name, stat, goal, shards: yenPay, bool: false });
  const list = [
    Q('ep1', 'Clear your first stage', 'ep:stages', 1, 30), Q('ep2', 'Clear 10 stages', 'ep:stages', 10, 80), Q('ep3', 'Clear 40 stages', 'ep:stages', 40, 300), Q('ep4', 'Clear 100 stages', 'ep:stages', 100, 1000),
    Q('ep5', 'Reach team level 5', 'ep:level', 5, 50), Q('ep6', 'Reach team level 20', 'ep:level', 20, 300), Q('ep7', 'Reach team level 40', 'ep:level', 40, 800), Q('ep8', 'Reach team level 60', 'ep:level', 60, 2000),
    Q('ep9', 'Earn 10 stars', 'ep:stars', 10, 60), Q('ep10', 'Earn 100 stars', 'ep:stars', 100, 500), Q('ep11', 'Get 3 stars on 20 stages', 'ep:stars3', 20, 300),
    Q('ep12', 'Forge a piece of gear', 'ep:crafted', 1, 60), Q('ep13', 'Own 10 pieces of gear', 'ep:crafted', 10, 300), Q('ep14', 'Buy a new class', 'ep:classes', 1, 80), Q('ep15', 'Open a chest', 'ep:chests', 1, 100),
    Q('ep16', 'Have 5 heroes', 'ep:heroes', 5, 200), Q('ep17', 'Hire all 10 heroes', 'ep:heroes', 10, 800),
  ];
  EP.WORLDS.forEach((w, i) => list.push(Q('epw' + i, `Beat ${w.name}`, 'ep:world:' + w.id, 1, 150 + i * 150)));
  const g = AF.QUESTS.find(x => x[0] === 'Defense');
  if (g) {
    for (const q of g[1]) delete AF.QUEST[q.id];
    g[0] = 'Expedition'; g[1] = list;
    for (const q of list) AF.QUEST[q.id] = q;
  }
}
EP.grant = (kind, n, id) => give([{ kind, n, id }]);
})();
