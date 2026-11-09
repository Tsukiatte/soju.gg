/* Aura Farm Defense: the worlds after Hollowbrook (29 Oct, request: "you can add however many worlds you were planning
   on with the same style just different theme. The last one should be really insane and probably space themed").
   The rules side: each map's road, where its props stand (laid out by a seeded hand that keeps them off the road and
   leaves room to build), its enemies and waves, how much tougher it is (hpK) and what it pays (cashK, rewardK).
   A world opens once the one before it has been cleared on Normal. board.js and worlds.js draw them. */
(function () {
const AF = window.AF, TD = AF.TD;

// ---- every world's enemies: a walker, a flyer, a brute and a boss, each the village's numbers with its own twist ----
const E = (name, base, o) => Object.assign({ name }, { mudling: { hp: 2200, speed: 1.25, cash: 20, lives: 1, armor: 0, size: 0.85, hb: 1.0 },
  crow: { air: true, hp: 1250, speed: 2.3, cash: 15, lives: 1, armor: 0, size: 0.75, hb: 1.0 },
  golem: { hp: 12000, speed: 0.7, cash: 75, lives: 3, armor: 0.25, size: 1.05, hb: 1.9 },
  scarecrow: { hp: 110000, speed: 0.5, cash: 750, lives: 20, armor: 0.15, size: 1.6, hb: 3.0, boss: true } }[base], o || {});
Object.assign(TD.ENEMIES, {
  crab: E("Shore Crab", "mudling", { speed: 1.1, armor: 0.1, hp: 2400 }), gull: E("Storm Gull", "crow", { speed: 2.6 }),
  barnacle: E("Barnacle Brute", "golem", { armor: 0.3 }), kraken: E("The Tidecaller", "scarecrow", { size: 1.7 }),
  scarab: E("Sand Scarab", "mudling", { speed: 1.5, hp: 1900 }), vulture: E("Dune Vulture", "crow", { hp: 1450 }),
  mummy: E("Wrapped One", "golem", { speed: 0.8 }), sphinx: E("The Sphinx", "scarecrow", { size: 1.8, armor: 0.2 }),
  imp: E("Snow Imp", "mudling", { speed: 1.35 }), wisp: E("Ice Wisp", "crow", { speed: 2.0, hp: 1500 }),
  yeti: E("Yeti", "golem", { hp: 14000, armor: 0.2 }), giant: E("Frost Giant", "scarecrow", { size: 1.9, speed: 0.42 }),
  shambler: E("Shambler", "mudling", { speed: 1.0, hp: 2700 }), wraith: E("Wraith", "crow", { speed: 2.4 }),
  gargoyle: E("Gargoyle", "golem", { armor: 0.35 }), lich: E("The Lich", "scarecrow", { size: 1.7 }),
  slime: E("Magma Slime", "mudling", { hp: 2500 }), firebat: E("Fire Bat", "crow", { speed: 2.7, hp: 1100 }),
  basalt: E("Basalt Brute", "golem", { armor: 0.35, hp: 13000 }), wyrm: E("Lava Wyrm", "scarecrow", { size: 1.8, speed: 0.55 }),
  bot: E("Street Bot", "mudling", { speed: 1.4 }), drone: E("Hunter Drone", "crow", { speed: 2.8, hp: 1200 }),
  mech: E("Riot Mech", "golem", { armor: 0.4 }), overseer: E("The Overseer", "scarecrow", { size: 1.8, armor: 0.25 }),
  mite: E("Void Mite", "mudling", { speed: 1.5, hp: 2300 }), jelly: E("Star Jelly", "crow", { speed: 1.9, hp: 1800 }),
  comet: E("Comet Golem", "golem", { armor: 0.35, hp: 15000 }), devourer: E("The Devourer", "scarecrow", { size: 2.1, speed: 0.45, armor: 0.25 }),
});
// the usual waves, with this world's four
const waves = (walker, flyer, brute, boss, n = 15) => k => {
  const g = [[walker, 5 + k * 2, 0.75]];
  if (k >= 3) g.push([flyer, 2 + k, 0.45]);
  if (k >= 5) g.push([brute, Math.floor((k - 3) / 2), 1.6]);
  if (k === Math.round(n * 2 / 3)) g.push([brute, 4, 1.0]); // was 6 (29 Oct): the rush outdid the waves after it
  if (k === n - 4) g.push([flyer, 10, 0.25]);
  if (k === n) g.push([boss, 1, 0]);
  if (n > 15 && k === n) g.push([brute, 8, 0.8], [flyer, 12, 0.3]);
  return g;
};

// ---- the props of each world and how much room they take (circle radius or box w x d) ----
Object.assign(TD.FOOT, {
  fishhut: ["box", 2.4, 2.0], lighthouse: ["circle", 1.6], netrack: ["box", 1.8, 0.5], boat: ["box", 2.3, 1.1], anchor: ["circle", 0.5],
  pyramid: ["box", 4.2, 4.2], tent: ["box", 2.0, 1.8], obelisk: ["circle", 0.5], ruin: ["box", 2.2, 1.0], cactus: ["circle", 0.4], urn: ["circle", 0.4], palm: ["circle", 0.5],
  icekeep: ["box", 4.2, 3.6], cabin: ["box", 2.4, 2.0], snowpine: ["circle", 0.5], iceblock: ["circle", 0.6], snowman: ["circle", 0.45], firepit: ["circle", 0.55], sled: ["box", 1.4, 0.7],
  crypt: ["box", 3.8, 3.4], tomb: ["box", 0.9, 1.4], deadtree: ["circle", 0.5], mausoleum: ["box", 2.2, 2.0], pumpkins: ["circle", 0.6], gravefence: ["box", 2.3, 0.3],
  forgekeep: ["box", 4.2, 3.6], spire: ["circle", 0.6], lavapool: ["circle", 1.7], columns: ["circle", 0.7], forgehut: ["box", 2.4, 2.0],
  coretower: ["box", 4.0, 4.0], tower: ["box", 2.6, 2.6], billboard: ["box", 2.0, 0.4], vending: ["box", 0.8, 0.6], holotree: ["circle", 0.5], car: ["box", 1.7, 0.85],
  starcore: ["box", 4.0, 4.0], crystals: ["circle", 0.7], dish: ["circle", 0.85], meteor: ["circle", 0.75], pylon: ["circle", 0.45], dome: ["box", 2.4, 2.4],
});
// seeded placement: the goal at the road's end, the gate where it comes in, then the world's props wherever they fit
// clear of the road, the edge and each other, with room left to build
function layout(map, seed, goal, gate, kinds) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const tmp = { road: map.road, props: [], lamps: [] };
  TD.prep(tmp);
  const props = [], [x0, x1, z0, z1] = map.bounds, foot = k => { const f = TD.FOOT[k]; return f[0] === "circle" ? f[1] : Math.hypot(f[1], f[2]) / 2; };
  const fits = (k, x, z, sc) => {
    const r = foot(k) * sc;
    if (x - r < x0 + 0.2 || x + r > x1 - 0.2 || z - r < z0 + 0.2 || z + r > z1 - 0.2) return false;
    if (TD.roadDist(tmp, x, z) < map.roadW / 2 + r + 0.35) return false;
    return props.every(p => Math.hypot(p[1] - x, p[2] - z) > foot(p[0]) * (p[4] || 1) + r + 0.5);
  };
  // the goal stands a little past the road's end, facing back along it (as Hollowbrook's hall does)
  const P = map.road, e = P[P.length - 1], f = P[P.length - 2], dx = e[0] - f[0], dz = e[1] - f[1], l = Math.hypot(dx, dz);
  props.push([goal, e[0] + (dx / l) * 3, e[1] + (dz / l) * 3, Math.atan2(-dx, -dz), 1]);
  // the gate the enemies come out of, on the road just before the play area (Hollowbrook's arch is at x -15.8)
  const pts = tmp.pts, gi = pts.findIndex(q => q[0] > -15.8), gp = pts[Math.max(1, gi)], gq = pts[Math.max(0, gi - 1)];
  props.push([gate, gp[0], gp[1], Math.atan2(gp[0] - gq[0], gp[1] - gq[1]), 1]);
  // kinds = [[kind, how many]], biggest first, so the big pieces find room before the small ones fill it
  for (const [k, want] of kinds) {
    let got = 0, tries = 0;
    while (got < want && tries++ < 900) {
      const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0), sc = 0.85 + rnd() * 0.3;
      if (!fits(k, x, z, sc)) continue;
      // face the nearest bit of road
      let best = null, bd = 1e9; for (const q of pts) { const d = Math.hypot(q[0] - x, q[1] - z); if (d < bd) { bd = d; best = q; } }
      props.push([k, x, z, Math.atan2(best[0] - x, best[1] - z) + (rnd() - 0.5) * 0.6, sc, (rnd() * 3) | 0]);
      got++;
    }
  }
  return props;
}
// (29 Oct, request: "On the space map I was thinking more like, theres a lot of empty space like genuine nothing just
// the background, and the road itself is rainbow, that the enemies walk on. Then you can only place the units on the
// "meteors" or just platforms floating next to that road and in the middle"): the platforms, [x, z, radius], laid
// out by a seeded hand beside the road (never on it), clear of each other and of the goal and gate
function padsFor(map, seed) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const tmp = TD.prep({ road: map.road, props: [], lamps: [] }), [x0, x1, z0, z1] = map.bounds, rw = map.roadW / 2, pads = [], cands = [];
  for (let x = x0 + 0.6; x <= x1 - 0.6; x += 0.4) for (let z = z0 + 0.6; z <= z1 - 0.6; z += 0.4) cands.push([x, z, rnd()]);
  cands.sort((a, b) => a[2] - b[2]);
  // the big ones first, then smaller ones into the gaps they leave
  for (const r of [2.4, 2.0, 1.6, 1.3, 1.1]) for (const [x, z] of cands) {
    if (pads.length >= 34) break;
    const rd = TD.roadDist(tmp, x, z);
    if (rd < rw + r + 0.25 || rd > rw + r + 3.4) continue;
    if (pads.some(p => Math.hypot(p[0] - x, p[1] - z) < p[2] + r + 0.38)) continue;
    if (map.props.some(p => Math.hypot(p[1] - x, p[2] - z) < r + 2.4)) continue;
    pads.push([x, z, r]);
  }
  return pads;
}
const B = [-13, 13, -8, 8];
const W = (o, kinds, seed) => { o.bounds = B; o.cash = 1000; o.lives = 20; o.roadW = 1.7; o.props = layout(o, seed, o.goal, o.gate, kinds); return o; };
// a gate prop sits where enemies come out; the goal is what they're walking to
TD.MAPS.push(
  W({ id: "harbor", boss: "kraken", theme: "harbor", name: "Gullport", world: "Coast", n: 2, waves: 15, hpK: 1.8, cashK: 1.2, rewardK: 1.6, goal: "lighthouse", gate: "arch",
    blurb: "The tide brought something in with it. Hold the harbour road to the lighthouse.",
    road: [[-19, 4.5], [-12, 5], [-9, 1.5], [-10.5, -3.5], [-6, -6], [-1.5, -3], [-2, 1.8], [2.5, 4.8], [7, 2.2], [6.5, -3.5], [10.5, -5.6], [12.6, -2]],
    lamps: [8, 15, 22, 29, 36], wave: waves("crab", "gull", "barnacle", "kraken") }, [["fishhut", 4], ["boat", 2], ["netrack", 2], ["crates", 3], ["barrels", 3], ["anchor", 1], ["rock", 3], ["bush", 3]], 101),
  W({ id: "desert", boss: "sphinx", theme: "desert", name: "Sunscar Dunes", world: "Desert", n: 3, waves: 15, hpK: 3.2, cashK: 1.45, rewardK: 2.2, goal: "pyramid", gate: "arch",
    blurb: "The old tombs opened at noon. Keep what crawled out off the road to the pyramid.",
    road: [[-19, -1], [-12, -1.5], [-9.5, 3.8], [-5, 5.2], [-3, 0], [-6, -4.8], [-1, -6.2], [3, -2.5], [1.8, 2.5], [5.5, 5.4], [10, 3], [9.5, -2.5], [12.4, -5]],
    lamps: [6, 13, 20, 27, 34, 41], wave: waves("scarab", "vulture", "mummy", "sphinx") }, [["tent", 3], ["ruin", 3], ["obelisk", 2], ["palm", 4], ["cactus", 5], ["urn", 3], ["rock", 3]], 202),
  W({ id: "frost", boss: "giant", theme: "frost", name: "Frostveil Pass", world: "Mountains", n: 4, waves: 15, hpK: 5.5, cashK: 1.75, rewardK: 3, goal: "icekeep", gate: "arch",
    blurb: "The pass froze over in a night. Something is coming down the switchbacks.",
    road: [[-19, -6], [-11, -6.2], [-6, -4.5], [-11, -1], [-10.5, 2.5], [-5, 4], [0, 1.5], [-1, -3], [4, -5.8], [8.5, -3], [5.5, 1.5], [8.5, 5.5], [12.6, 3]],
    lamps: [7, 14, 21, 28, 35, 42], wave: waves("imp", "wisp", "yeti", "giant") }, [["cabin", 3], ["sled", 1], ["firepit", 2], ["snowpine", 6], ["iceblock", 3], ["snowman", 2], ["rock", 3]], 303),
  W({ id: "grave", boss: "lich", theme: "grave", name: "Gloomhollow", world: "Graveyard", n: 5, waves: 15, hpK: 9, cashK: 2.1, rewardK: 4, goal: "crypt", gate: "arch",
    blurb: "The bells rang on their own last night. The dead want into the crypt.",
    road: [[-19, 2], [-12, 3], [-8, 6], [-3.5, 4], [-6, -0.5], [-3, -5], [1.5, -3.5], [2, 1.5], [5.8, 3.5], [9.5, 0.5], [7, -4], [11, -6], [12.6, -2.5]],
    lamps: [6, 12, 18, 24, 30, 36, 42], wave: waves("shambler", "wraith", "gargoyle", "lich") }, [["mausoleum", 2], ["gravefence", 3], ["deadtree", 4], ["tomb", 10], ["pumpkins", 3], ["rock", 2]], 404),
  W({ id: "volcano", boss: "wyrm", theme: "volcano", name: "Cinderfall", world: "Volcano", n: 6, waves: 15, hpK: 15, cashK: 2.6, rewardK: 5.5, goal: "forgekeep", gate: "arch",
    blurb: "The mountain woke up angry. Hold the basalt road to the forge.",
    road: [[-19, 0], [-13, 0.5], [-9, -4], [-4, -5.5], [0.5, -2], [-3, 2.5], [0, 6], [4.5, 4.5], [3.5, -0.5], [7.5, -5], [11.5, -2.5], [9, 2.5], [12.4, 5.5]],
    lamps: [7, 14, 21, 28, 35, 42], wave: waves("slime", "firebat", "basalt", "wyrm") }, [["forgehut", 2], ["lavapool", 2], ["spire", 4], ["columns", 4], ["rock", 4]], 505),
  W({ id: "neon", boss: "overseer", theme: "neon", name: "Neon Arcology", world: "City", n: 7, waves: 15, hpK: 25, cashK: 3.2, rewardK: 7.5, goal: "coretower", gate: "arch",
    blurb: "The city's own machines turned on it. Keep them off the avenue to the core.",
    road: [[-19, -3.5], [-10, -3.5], [-9.5, 3.5], [-4, 3.6], [-4.2, -5.8], [1.5, -5.8], [1.5, 4.8], [7, 4.8], [7, -2], [12.6, -2]],
    lamps: [6, 12, 18, 24, 30, 36, 42], wave: waves("bot", "drone", "mech", "overseer") }, [["tower", 4], ["billboard", 2], ["car", 3], ["vending", 3], ["holotree", 4]], 606),
  // ramp/bossK (29 Oct): 20 waves build a bigger army, so its late waves climb on their own curve (td.js waveHp)
  W({ id: "space", boss: "devourer", theme: "space", name: "Starfall Expanse", world: "Space", n: 8, waves: 20, hpK: 45, cashK: 4.5, upK: 1.35, rewardK: 12, goal: "starcore", gate: "arch", ramp: [1.3, 1.8], bossK: 0.65,
    blurb: "Past the edge of the sky, the road floats on a shelf of rock over nothing. Whatever eats stars is coming down it.",
    road: [[-19, 5], [-11, 6], [-6, 3], [-10, -1.5], [-7, -6], [-1.5, -5.5], [-2.5, -0.5], [2, 3.5], [6, 6.2], [9.5, 3], [5.5, -1.5], [8.5, -5.8], [12, -4.6], [13.4, -1.2]],
    lamps: [6, 12, 18, 24, 30, 36, 42, 48], wave: waves("mite", "jelly", "comet", "devourer", 20) }, [], 707),
);
TD.MAP = {}; TD.MAPS.forEach(m => { TD.MAP[m.id] = m; });
TD.MAP.space.pads = padsFor(TD.MAP.space, 808);
TD.MAP.village.theme = "village"; TD.MAP.village.boss = "scarecrow"; TD.MAP.village.goal = "hall";
TD.bossOf = map => TD.ENEMIES[map.boss];
// a world opens once the one before it is cleared on Normal
TD.mapOpen = (id, cleared) => { const i = TD.MAPS.findIndex(m => m.id === id); return i <= 0 || !!cleared(TD.MAPS[i - 1].id + ":normal"); };
})();
