/* Aura Farm Defense: the Endless tower (29 Oct, the package Chris approved: "Endless Defense tower (Starlight per new
   best floor, shards every 5 floors, weekly twist each Monday)"; built 30 Oct, "yea build it").
   One endless match: every wave is a floor, each tougher than the last (18% on Hollowbrook up to 36% on Starfall), a
   boss every 10th. It runs on any
   world (30 Oct, "Endless is every map, once you complete hard mode it's unlocked and you can play whichever one you
   want. The weekly twist is on every map"): a world's Endless opens once that world is cleared on Hard, and every world
   has the week's twist (it changes Monday 00:00 UTC). It ends when the lives run out (or you leave); what each floor
   pays is paid as it's cleared (defense.js TD.TOWER.onFloor). Reasoned from the worlds' measured curves; see
   tools/towersim (scratchpad) for the floors a team reaches. */
(function () {
const AF = window.AF, TD = AF.TD;
const WEEK = 604800000, MONDAY0 = Date.UTC(1970, 0, 5); // the first Monday of 1970

const T = TD.TOWER = {
  // the reference curve (one world's floors before 30 Oct): floor 1 about a mid wave of Hollowbrook, floor 20
  // Gloomhollow Hard's last, floor 28 Starfall Nightmare's. Starlight and the shard cap are measured on it (T.eq)
  hp: n => 4 * Math.pow(1.32, n - 1),
  // (30 Oct, "hollowbrook my team could get to like wave 50 and the space level I could only get to like 15"): each
  // world's own curve starts at its enemy health (hpK) and grows from G0 a floor on the first world to G1 on the last
  G0: 1.18, G1: 1.36, SK: 0.5, // tuned in the sim: tools/patch_endless_curves3.py // SK: a world's curve starts at its hpK to this power
  bossK: 0.45,     // a boss on its floor's health (it's 50 times a walker's base, so about 22 walkers)
  bossEvery: 10,
  cash: 2,         // kill and wave cash, as a world's cashK
  lives: 20,
  startCash: 1500, // times cash (2), so $3,000 to start
};
// the twist for the week: each only ever makes the climb harder, so a best floor set in a hard week stands out
T.TWISTS = [
  { id: "swift",  name: "Swift Feet",     desc: "Enemies move 25% faster.", speed: 1.25 },
  { id: "plated", name: "Plated",         desc: "Every enemy has 15% more armor.", armor: 0.15 },
  { id: "skies",  name: "Crowded Skies",  desc: "Twice as many flyers on every floor.", flyers: 2 },
  { id: "lean",   name: "Lean Times",     desc: "Kills and floors pay 30% less cash.", cash: 0.7 },
  { id: "titans", name: "Titans",         desc: "Brutes have double the health.", brute: 2 },
  { id: "thin",   name: "Thin Walls",     desc: "10 lives instead of 20.", lives: 10 },
  { id: "bosses", name: "Boss Rush",      desc: "A boss every 5 floors instead of every 10.", bossEvery: 5 },
  { id: "swarm",  name: "Swarm",          desc: "Half again as many enemies, each with 30% less health.", count: 1.5, hp: 0.7 },
];
T.week = (now = Date.now()) => Math.floor((now - MONDAY0) / WEEK);
T.nextWeekAt = (now = Date.now()) => MONDAY0 + (T.week(now) + 1) * WEEK;
T.worldOf = w => TD.MAPS[((w % TD.MAPS.length) + TD.MAPS.length) % TD.MAPS.length];
T.twistOf = w => T.TWISTS[(((w * 3 + 1) % T.TWISTS.length) + T.TWISTS.length) % T.TWISTS.length]; // a different order, so pairs change
T.open = (mapId, cleared) => !!cleared(mapId + ":hard"); // Hard or Nightmare (game.js G.tdClear)
T.isBoss = (n, tw) => n % ((tw && tw.bossEvery) || T.bossEvery) === 0;
// a world's curve: its start (hpK) and its step a floor
T.curve = mapId => {
  const i = Math.max(0, TD.MAPS.findIndex(m => m.id === mapId)), m = TD.MAPS[i];
  return { s: Math.pow(m.hpK || 1, T.SK), g: T.G0 + (T.G1 - T.G0) * i / Math.max(1, TD.MAPS.length - 1) };
};
T.hpOf = (mapId, n) => { const c = T.curve(mapId); return 4 * c.s * Math.pow(c.g, n - 1); };
// the floor of the reference curve whose enemies are as tough as floor n of this world's
T.eq = (mapId, n) => 1 + Math.log(T.hpOf(mapId, n) / 4) / Math.log(1.32);

// a world's walker, flyer, brute and boss, read from its own waves
function kinds(map) {
  const out = { walker: null, flyer: null, brute: null, boss: map.boss || null };
  for (let n = 1; n <= (map.waves || 15); n++) for (const [k] of map.wave(n)) {
    const d = TD.ENEMIES[k];
    if (!d) continue;
    if (d.boss) out.boss = out.boss || k; else if (d.air) out.flyer = out.flyer || k; else if (!out.walker) out.walker = k; else if (k !== out.walker) out.brute = out.brute || k;
  }
  return out;
}
T.kinds = kinds;
// floor n's crowd: more of everything as it climbs (each kind levels off), the twist's counts on top
T.floor = (K, tw) => n => {
  const c = (tw && tw.count) || 1, g = [[K.walker, Math.round((6 + Math.min(16, n)) * c), 0.6 / c]];
  if (n >= 2 && K.flyer) g.push([K.flyer, Math.round((3 + Math.min(12, Math.floor(n * 0.5))) * c * ((tw && tw.flyers) || 1)), 0.4 / c]);
  if (n >= 3 && K.brute) g.push([K.brute, Math.round((1 + Math.min(7, Math.floor(n / 3))) * c), 1.3 / c]);
  if (T.isBoss(n, tw) && K.boss) g.push([K.boss, 1, 0], [K.brute || K.walker, 3, 0.9]);
  return g;
};
// a world's Endless this week as a match's map and difficulty (the tower's own health curve: hpK 1 on every world)
T.build = (mapId, now = Date.now()) => {
  const w = T.week(now), base = TD.prep(TD.MAP[mapId] || TD.MAPS[0]), tw = T.twistOf(w), K = kinds(base);
  const map = Object.assign({}, base, {
    // (30 Oct) the world's own cash too; (1 Nov) start cash, lives and floors were inside this note since then
    waves: Infinity, hpK: 1, cashK: T.cash * (base.cashK || 1) * (tw.cash || 1),
    cash: T.startCash, lives: tw.lives || T.lives, wave: T.floor(K, tw),
    tower: { week: w, twist: tw, world: base.id, kinds: K, defs: {} },
  });
  const diff = { id: "tower", name: "Endless", hp: 1, speed: tw.speed || 1, cash: 1, reward: [0, 0] };
  return { map, diff };
};
// an enemy as the twist has it (its own copy per match, so the world's stays as it is)
T.def = (M, type) => {
  const tw = M.map.tower, d0 = TD.ENEMIES[type];
  return tw.defs[type] || (tw.defs[type] = Object.assign({}, d0, {
    armor: Math.min(0.6, (d0.armor || 0) + (tw.twist.armor || 0)),
    hpT: (type === tw.kinds.brute ? tw.twist.brute || 1 : 1) * (tw.twist.hp || 1),
  }));
};
T.waveHp = (M, d) => T.hpOf(M.map.tower.world, M.wave) * (d.boss ? T.bossK : 1) * (d.hpT || 1);
// shards for reaching floor n of a world (every 5th), from the same scale as the worlds' wins: 3% of a first clear of a
// world as hard as that floor (a world's last waves are about 29 times its base health)
T.shards = (mapId, n) => n % 5 ? 0 : Math.max(5, Math.round(TD.reward({ hpK: T.hpOf(mapId, n) / 29 }, { hp: 1 }, true) * 0.03 / 5) * 5);
// Starlight for each step of the reference curve past your toughest climb (T.eq): 1, and 5 more on every 10th
T.starlight = n => 1 + (n % 10 === 0 ? 5 : 0);
})();
