/* Aura Farm data: rarities, traits, gates, economy. Every number the game balances on lives here. */
(function (G) {
const AF = G.AF = G.AF || {};

// ---- rarities, lowest first ----
// upBase: cost of the first level-up; rerollBase: a trait reroll's price (30 Oct: fixed, any level); base income ranges live on each unit
AF.RARITIES = [
  { id: "common",    name: "Common",    color: "#a9adb5", upBase: 4,      rerollBase: 150 },
  { id: "rare",      name: "Rare",      color: "#3d8bff", upBase: 14,     rerollBase: 600 },
  { id: "epic",      name: "Epic",      color: "#a24bff", upBase: 90,     rerollBase: 5000 },
  { id: "legendary", name: "Legendary", color: "#ffb21e", upBase: 800,    rerollBase: 50000 },
  { id: "mythic",    name: "Mythic",    color: "#ff4fd8", upBase: 7000,   rerollBase: 750000 },
  { id: "secret",    name: "Secret",    color: "#e9e9ee", upBase: 90000,  rerollBase: 1.5e7 },
  { id: "divine",    name: "Divine",    color: "#fff2b8", upBase: 2.6e6,  rerollBase: 1e9 },
  // (29 Oct, request: "3 more rarities above divine"): Void Gate only, like Divine
  { id: "transcendent", name: "Transcendent", color: "#7dffcf", upBase: 3e7, rerollBase: 1e11 },
  { id: "primordial",   name: "Primordial",   color: "#ff6a1a", upBase: 3e8, rerollBase: 1e13 },
  { id: "eternal",      name: "Eternal",      color: "#ffffff", upBase: 5e9, rerollBase: 1e16 },
  // (29 Oct, the package past the Rift): only from the three gates a Rebirth opens, one Absolute unit in each
  { id: "absolute",     name: "Absolute",     color: "#f0f0f0", upBase: 8e10, rerollBase: 1e20 },
];
AF.RAR = {};
AF.RARITIES.forEach((r, i) => { r.order = i; AF.RAR[r.id] = r; });

// ---- traits ----
// tier 0-2 are plain; 3 (Solar) glows; 4-6 are the gradient/rainbow traits with escalating reveals, auras and pity
AF.TRAIT_TIERS = [
  { tier: 0, name: "Basic",     color: "#c9ced8" },
  { tier: 1, name: "Rare",      color: "#ffd257" },
  { tier: 2, name: "Epic",      color: "#58c8ff" },
  { tier: 3, name: "Legendary", color: "#ffb21e" },
  { tier: 4, name: "Mythic",    color: "#ff3b6b", grad: ["#ff3b6b", "#8a2be2"] },
  { tier: 5, name: "Celestial", color: "#7fe3ff", grad: ["#7fe3ff", "#ffe48a", "#c9a8ff"] },
  { tier: 6, name: "Unique",    color: "#ffffff", rainbow: true },
];
AF.TRAITS = [
  { id: "sturdy1", name: "Sturdy I",    mult: 1.10, w: 14,   tier: 0, glyph: "S1" },
  { id: "sturdy2", name: "Sturdy II",   mult: 1.15, w: 11,   tier: 0, glyph: "S2" },
  { id: "sturdy3", name: "Sturdy III",  mult: 1.20, w: 8,    tier: 0, glyph: "S3" },
  { id: "swift1",  name: "Swift I",     mult: 1.20, w: 12,   tier: 0, glyph: "W1" },
  { id: "swift2",  name: "Swift II",    mult: 1.30, w: 9,    tier: 0, glyph: "W2" },
  { id: "swift3",  name: "Swift III",   mult: 1.40, w: 6,    tier: 0, glyph: "W3" },
  { id: "keen1",   name: "Keen I",      mult: 1.25, w: 10,   tier: 0, glyph: "K1" },
  { id: "keen2",   name: "Keen II",     mult: 1.35, w: 7,    tier: 0, glyph: "K2" },
  { id: "keen3",   name: "Keen III",    mult: 1.50, w: 4,    tier: 0, glyph: "K3" },
  { id: "gilded",  name: "Gilded",      mult: 2,     w: 11.4, tier: 1, glyph: "G" },
  { id: "tempest", name: "Tempest",     mult: 5,     w: 5,    tier: 2, glyph: "T" },
  { id: "solar",   name: "Solar",       mult: 25,    w: 1.5,  tier: 3, glyph: "SO" },
  // (28 Oct, request: "add a trait in between solar and eclipse, and astral and singularity"): each joins the tier
  // below it (so pity and "or better" rules hold) and has its own look through vis
  { id: "inferno", name: "Inferno",     mult: 50,    w: 0.5,  tier: 3, glyph: "IN", vis: 3.5 },
  { id: "eclipse", name: "Eclipse",     mult: 100,   w: 0.4,  tier: 4, glyph: "EC" },
  // (29 Oct, request: "add ... a trait or two"): Nebula fills the gap between Eclipse and Astral, Infinity tops Singularity
  { id: "nebula",  name: "Nebula",      mult: 300,   w: 0.15, tier: 4, glyph: "NB", vis: 4.5 },
  // (29 Oct, request: "add a 'golden' trait that gives a decent money boost but also a good farm boost"): the farm
  // trait: x30 income, and a Golden farm pays x2.5 in Defense (no other trait changes a farm's pay). Then "It should be
  // closer to 1 in 1000 default": weight 0.1 (was 1.0, the 0.9 back to Gilded), so it sits here in the list, between
  // Nebula and Astral. It stays in the Legendary tier, so the Eclipse-or-better pity can never hand out a x30 trait
  // (same day, "give it 300x income"): x300, as much as Nebula
  { id: "astral",  name: "Astral",      mult: 1000,  w: 0.07, tier: 5, glyph: "AS" },
  { id: "zenith",  name: "Zenith",      mult: 3000,  w: 0.02, tier: 5, glyph: "ZE", vis: 5.5 },
  // (30 Oct, "a 2x money mult for farms"): farm 2.5 -> 2, and no ATK in Defense (td.js TRAIT_TD)
  // (30 Oct, "make golden above zenith in rarity, but the multiplier stays at 3000x like zenith"): weight 0.01 (was
  // 0.1), half Zenith's, and x3000 (was x300); after Zenith in the list now. Still the Legendary tier: no pity hands it
  // out and Trait Mastery doesn't touch it
  { id: "golden",  name: "Golden",      mult: 3000,  w: 0.01, tier: 3, glyph: "GO", vis: 3.2, farm: 2 },
  { id: "singular",name: "Singularity", mult: 10000, w: 0.01, tier: 6, glyph: "SG" },
  { id: "infinity",name: "Infinity",    mult: 50000, w: 0.002, tier: 6, glyph: "\u221E", vis: 6.5 },
];
AF.traitVis = t => (t ? (t.vis === undefined ? t.tier : t.vis) : -1);
AF.TRAIT = {};
AF.TRAITS.forEach(t => { AF.TRAIT[t.id] = t; });
// (29 Oct, Chris: "it only gives you duplicate traits if you have double roll and they roll the same trait at once. This
// only adds the extra multiplier (2 singularities = x20,000), it doesnt multiply the multiplier"): a doubled trait
// (u.dbl) counts twice. Income: twice the multiplier. Defense (td.js traitTd) and a Golden farm's pay: twice the bonus,
// so ATK x3 becomes x5 and pay x2.5 becomes x4
AF.TRAIT_DBL = {};
AF.TRAITS.forEach(t => { AF.TRAIT_DBL[t.id] = Object.assign({}, t, { dbl: true, name: "Double " + t.name, mult: t.mult * 2, farm: t.farm ? 1 + 2 * (t.farm - 1) : undefined }); });
// a unit's trait as it counts: every place that reads one goes through here
AF.traitOf = u => (u && u.tr ? (u.dbl ? AF.TRAIT_DBL[u.tr] : AF.TRAIT[u.tr]) || null : null);
AF.TRAIT_TOTAL = AF.TRAITS.reduce((s, t) => s + t.w, 0); // 100
// pity: N rerolls without that tier or better guarantees it
// (29 Oct, request: "up ... the pity on traits ... since they can get trait luck now. Maybe like 3-5x"): 4x the old 200/800/6000
AF.TRAIT_PITY = [
  { key: "eclipse", tier: 4, at: 800,   name: "Eclipse+" },
  { key: "astral",  tier: 5, at: 3200,  name: "Astral+" },
  { key: "singular",tier: 6, at: 24000, name: "Singularity+" },
];

// ---- summon gates (banners), unlocked by lifetime earnings ----
AF.GATES = [
  { id: "ember", name: "Ember Gate", cost: 100,   unlock: 0,     hue: ["#ff5a2a", "#ffb02e"],
    odds: { common: 55, rare: 30, epic: 12, legendary: 2.6, mythic: 0.39, secret: 0.01 } },
  { id: "tide",  name: "Tide Gate",  cost: 8000,  unlock: 5e4,   hue: ["#1fb6ff", "#5cf2d6"],
    odds: { common: 20, rare: 38, epic: 30, legendary: 10, mythic: 1.9, secret: 0.1 } },
  { id: "storm", name: "Storm Gate", cost: 2.5e6, unlock: 2.5e7, hue: ["#8a6bff", "#4fe6ff"],
    odds: { common: 0, rare: 15, epic: 42, legendary: 33, mythic: 9.5, secret: 0.5 } },
  { id: "void",  name: "Void Gate",  cost: 1.5e9, unlock: 2e10,  hue: ["#ff3bc8", "#2a0b3a"],
    // (29 Oct): "the last top one is 0.01%. the others fill the current 4%": Secret 3.99 + Divine 0.01 became this ladder
    // (30 Oct, "transcendent and up is slightly too easy to get on void gate"): Transcendent 0.2 and Primordial 0.07 were
    // trimmed, a third fewer of them, the rest went to Secret; then "eternal even lower": 0.01 -> 0.005
    odds: { common: 0, rare: 0, epic: 25, legendary: 45, mythic: 26, secret: 3.095, divine: 0.72, transcendent: 0.13, primordial: 0.05, eternal: 0.005 } },
  // (29 Oct, request: "add one more gate too its definitely needed"): past the Void, every top rarity 3-6x likelier
  { id: "genesis", name: "Genesis Gate", cost: 5e12, unlock: 1e14, td: "village:normal", hue: ["#fff2b8", "#7dffcf"],
    odds: { common: 0, rare: 0, epic: 0, legendary: 40, mythic: 40, secret: 14, divine: 4.5, transcendent: 1.2, primordial: 0.27, eternal: 0.03 } },
  // (29 Oct, request: "add more progression stuff and units"): opens from the 5th ascension. Rift units (gate: "rift" in
  // units.js) only come from here, and take excl of every pull of a rarity that has one
  { id: "rift", name: "Rift Gate", cost: 2e15, unlock: 5e17, asc: 5, td: "harbor:normal", excl: 0.2, hue: ["#3dffc8", "#5a1aff"],
    odds: { mythic: 45, secret: 35, divine: 13.5, transcendent: 5, primordial: 1.25, eternal: 0.25 } },
  // (30 Oct, the package past the Rift; Chris approved the fifteen units with "yea looks good then"): one gate per
  // faction (units_gates.js), each opened by a Rebirth (reb). A faction unit is half the pulls of its rarity there
  // (excl), and the Absolute is only ever its gate's own. Each gate a step richer than the one before
  // (30 Oct) a Rebirth starts the run at 0, so each opens early in the run (kept units earn fast); reasoned, not measured
  { id: "aurora", name: "Aurora Gate", cost: 5e14, unlock: 1e15, reb: 1, excl: 0.5, hue: ["#3dffa0", "#2ee6ff"],
    odds: { secret: 35, divine: 42, transcendent: 16, primordial: 5, eternal: 1.99, absolute: 0.01 } },
  { id: "chrono", name: "Chrono Gate", cost: 4e15, unlock: 1e16, reb: 2, excl: 0.5, hue: ["#ffb02e", "#f2efe6"],
    odds: { secret: 25, divine: 44, transcendent: 21, primordial: 7.5, eternal: 2.48, absolute: 0.02 } },
  { id: "origin", name: "Origin Gate", cost: 3e16, unlock: 1e17, reb: 3, excl: 0.5, hue: ["#9a6aff", "#f4f4f0"],
    odds: { secret: 15, divine: 45, transcendent: 26, primordial: 10.5, eternal: 3.47, absolute: 0.03 } },
];
AF.GATE = {};
AF.GATES.forEach(g => { AF.GATE[g.id] = g; });
AF.SUMMON_PITY = [
  { key: "mythic", rank: 4, at: 200,  name: "Mythic+" },
  { key: "secret", rank: 5, at: 5000, name: "Secret" },
];

// ---- economy ----
AF.ECON = {
  startYen: 300,
  startUnit: "gary",
  slotsStart: 3,
  slotCosts: [500, 6e3, 6e4, 7e5, 8e6, 1e8, 1.5e9, 2.5e10, 5e11, 1e14, 1e16, 1e18], // slots 4..15
  slotAsc: { 13: 4, 14: 6, 15: 10 }, // slot number: ascensions needed before it can be bought
  levelMax: 100,
  levelGrowth: 1.055,      // income multiplier per level
  costGrowth: 1.115,       // upgrade cost growth per level
  // (30 Oct) rerollPerLevel (+4% a level) is gone: a reroll is one fixed price per rarity
  variance: 0.10,          // +/- 10% income rolled when a unit is obtained
  releaseSeconds: 8,       // a release pays 8 s of the unit's base income
  offlineCapHours: 12,
};
// ---- stars: duplicates of a unit feed it up to 5 stars (28 Oct) ----
// copies[s] = copies used to go from s stars to s+1; mult and cap are indexed by stars - 1
AF.STARS = { max: 5, copies: [0, 1, 2, 3, 4], mult: [1, 1.5, 2.25, 3.5, 5], cap: [100, 120, 140, 160, 200] };
// ---- shiny variants: a recoloured, holographic copy of any unit ----
AF.SHINY = { chance: 1 / 500, mult: 1.5 };
// ---- ascension: reset the run for Aura Shards; shards = floor(sqrt(earned this run / per)) ----
// (29 Oct, rebalance): the Nth ascension needs at least min * grow^N shards, so ascending can't be spammed for the
// unlocks below, and every ascension adds incomePer to all income for good
// (29 Oct, "~5h till endgame"; Chris finished in about 4): an ascension needs about 30% more earned for the same shards
AF.ASCEND = { per: 1.3e8, min: 3, grow: 3, incomePer: 0.1,
  // (29 Oct, request: "tower defense should be a more integral part of the game, make it needed to continue"):
  // these ascensions wait for a Defense clear ("map:difficulty")
  // (29 Oct) Hard and Nightmare got easier (3x and 11x health), so those steps moved to worlds that keep them as hard
  td: { 4: "village:normal", 5: "harbor:normal", 6: "desert:normal", 7: "frost:normal", 8: "desert:hard", 9: "grave:normal",
    10: "volcano:normal", 11: "neon:normal", 12: "grave:hard", 13: "space:normal", 14: "frost:nightmare", 15: "neon:hard" } };
AF.TD_INCOME = 0.1; // every first Defense clear (each map and difficulty) adds this to all income for good
// ---- Rebirth (30 Oct): from Ascension 15, the whole climb again: ascensions back to 0 for Starlight, spent on the star
// map. Each Rebirth opens the next gate past the Rift (gate.reb). Starlight: base at Ascension 15, perAsc for each
// ascension past it ----
AF.REBIRTH = { asc: 15, base: 10, perAsc: 5,
  // (30 Oct, "already 7 ascentions in because it takes 1 second ... no new requirements to stop me"): every Rebirth, each
  // ascension needs climb times the shards, and the path asks for that Rebirth's own goals (game.js G.reqMet)
  climb: 10,
  // (1 Nov, "my friend cant ascend ... hes on rebirth 15"): only the first climbFull Rebirths multiply by climb; each
  // after that by climbAfter (x10 forever asked 40 trillion times a run's earning by 13 Rebirths)
  climbFull: 3, climbAfter: 2,
  // (1 Nov, "thats just too time consuming"): past the last listed path its Endless floors grow creep a Rebirth (was 3)
  creep: 1,
  paths: [
    { 2: "village:nightmare", 3: "floor:village:15", 4: "harbor:nightmare", 5: "found:100", 6: "desert:hard", 7: "floor:harbor:20", 8: "frost:hard",
      9: "desert:nightmare", 10: "floor:desert:20", 11: "grave:hard", 12: "frost:nightmare", 13: "floor:frost:20", 14: "volcano:hard", 15: "neon:hard" },
    { 2: "grave:nightmare", 3: "floor:village:30", 4: "volcano:nightmare", 5: "rank:8", 6: "floor:grave:20", 7: "neon:nightmare", 8: "floor:volcano:18",
      9: "space:hard", 10: "mult:10000", 11: "floor:neon:16", 12: "floor:desert:28", 13: "floor:frost:25", 14: "floor:space:14", 15: "space:nightmare" },
    { 2: "floor:village:40", 4: "floor:harbor:35", 6: "floor:desert:32", 8: "rank:10", 9: "floor:frost:28", 11: "floor:grave:26", 12: "floor:volcano:22",
      14: "floor:neon:20", 15: "floor:space:18" },
  ] };
// the star map: one centre star, four arms (Income north, Luck east, Defense south, the Climb west), each forking into
// two before its tip, and four corner stars that need both arms beside them (all). x, y: where it sits on the map
// (1000 x 700). fx: what it adds (game.js G.star): inc income, ascPer income per ascension, keepAsc ascensions' bonus
// kept through a Rebirth, offline hours, luck (Legendary+), favor (Divine+), shiny, tluck (Solar to Zenith traits),
// abs (Absolute summons), tdAtk Defense damage, tdCash Defense cash, relCharge Release charging, start (x starting yen),
// shardK ascension shards, slots, sumCost (summons cheaper), star (Starlight from a Rebirth)
const N = (id, name, desc, cost, x, y, from, fx, arm, all) => ({ id, name, desc, cost, x, y, from, fx, arm, all: !!all });
AF.STARMAP = [
  N("core", "First Light", "+50% income from every unit", 1, 500, 350, [], { inc: 0.5 }, "core"),
  // Income (north)
  N("n1", "Warm Glow", "+50% income from every unit", 2, 500, 268, ["core"], { inc: 0.5 }, "inc"),
  N("n2", "Afterglow", "After a Rebirth, income keeps the bonus of 3 ascensions", 4, 500, 192, ["n1"], { keepAsc: 3 }, "inc"),
  N("n3a", "Long Summer", "Every ascension adds 15% income instead of 10%", 7, 432, 128, ["n2"], { ascPer: 0.05 }, "inc"),
  N("n3b", "Deep Sleep", "12 more hours of offline earnings", 7, 568, 128, ["n2"], { offline: 12 }, "inc"),
  N("n4", "High Noon", "+150% income from every unit", 12, 500, 64, ["n3a", "n3b"], { inc: 1.5 }, "inc"),
  // Luck (east)
  N("e1", "Lucky Star", "Legendary or better summons are 25% more likely", 2, 584, 350, ["core"], { luck: 0.25 }, "luck"),
  N("e2", "Shooting Star", "Shinies are 50% more likely", 4, 664, 350, ["e1"], { shiny: 0.5 }, "luck"),
  N("e3a", "Wishing Star", "Divine or better summons are 30% more likely", 7, 732, 284, ["e2"], { favor: 0.3 }, "luck"),
  N("e3b", "Star Sign", "Solar to Golden traits are 25% more likely", 7, 732, 416, ["e2"], { tluck: 0.25 }, "luck"),
  N("e4", "Polaris", "Absolute summons are twice as likely", 12, 808, 350, ["e3a", "e3b"], { abs: 1 }, "luck"),
  // Defense (south)
  N("s1", "Battle Star", "Every unit deals 25% more damage in Defense", 2, 500, 432, ["core"], { tdAtk: 0.25 }, "td"),
  N("s2", "War Chest", "Defense matches start with 50% more cash", 4, 500, 508, ["s1"], { tdCash: 0.5 }, "td"),
  N("s3a", "Quick Release", "Releases charge 25% faster", 7, 432, 572, ["s2"], { relCharge: 0.25 }, "td"),
  N("s3b", "Iron Sky", "Every unit deals another 50% more damage in Defense", 7, 568, 572, ["s2"], { tdAtk: 0.5 }, "td"),
  N("s4", "Supernova", "Every unit deals another 100% more damage in Defense", 12, 500, 636, ["s3a", "s3b"], { tdAtk: 1 }, "td"),
  // the Climb (west)
  N("w1", "Head Start", "Every run starts with 1K times more \u00A5", 2, 416, 350, ["core"], { start: 1000 }, "climb"),
  N("w2", "Bright Shards", "Ascending gives 50% more Aura Shards", 4, 336, 350, ["w1"], { shardK: 0.5 }, "climb"),
  N("w3a", "Open Field", "Every run starts with 2 more slots", 7, 268, 284, ["w2"], { slots: 2 }, "climb"),
  N("w3b", "Cheap Gates", "Summons cost 25% less", 7, 268, 416, ["w2"], { sumCost: 0.25 }, "climb"),
  N("w4", "Comet", "Rebirths give 50% more Starlight", 12, 192, 350, ["w3a", "w3b"], { star: 0.5 }, "climb"),
  // the corners, each between two arms' tips
  N("cne", "Aurora", "+300% income from every unit", 25, 760, 110, ["n4", "e4"], { inc: 3 }, "corner", 1),
  N("cse", "Eclipse", "Double damage in Defense, and Releases charge another 25% faster", 25, 760, 590, ["e4", "s4"], { tdAtk: 1, relCharge: 0.25 }, "corner", 1),
  N("csw", "Meteor Shower", "Rebirths give double Starlight", 25, 240, 590, ["s4", "w4"], { star: 1 }, "corner", 1),
  N("cnw", "Constellation", "Every ascension adds another 10% income", 25, 240, 110, ["w4", "n4"], { ascPer: 0.1 }, "corner", 1),
];
AF.SMAP = {};
AF.STARMAP.forEach(n => { AF.SMAP[n.id] = n; });
// shard shop; cost of the next level = ceil(base * growth^level). unlock = a one-time automation with an on/off switch
AF.UPGRADES = [
  // (30 Oct, "should get exponentially harder, up to like 1 mil for the last upgrade"): growth 1.32 -> 1.425, the 40th ~997K
  { id: "income", name: "Golden Touch", desc: "+25% income from every unit", max: 40, base: 1, growth: 1.425, fx: l => `+${l * 25}% income` },
  { id: "study", name: "Quick Study", desc: "Level-ups cost 6% less", max: 10, base: 2, growth: 1.5, fx: l => `-${Math.round((1 - Math.pow(0.94, l)) * 100)}% level cost` },
  { id: "luck", name: "Fortune", desc: "Legendary or better summons and shinies are 10% more likely", max: 10, base: 3, growth: 1.55, fx: l => `+${l * 10}% luck` },
  { id: "sense", name: "Trait Sense", desc: "Trait rerolls cost 6% less", max: 10, base: 2, growth: 1.5, fx: l => `-${Math.round((1 - Math.pow(0.94, l)) * 100)}% reroll cost` },
  // (29 Oct, request: "let trait luck go to 200% on trait fortune"): 20 levels instead of 10
  { id: "tluck", name: "Trait Fortune", desc: "Solar to Golden traits are 10% more likely", max: 20, base: 3, growth: 1.55, fx: l => `+${l * 10}% trait luck` },
  { id: "nap", name: "Long Nap", desc: "4 more hours of offline earnings", max: 9, base: 2, growth: 1.4, fx: l => `${12 + l * 4}h offline cap` },
  { id: "head", name: "Head Start", desc: "Each ascension starts with 20 times more ¥", max: 4, base: 3, growth: 2.2, fx: l => `Start with ${AF.fmt ? AF.fmt(300 * Math.pow(20, l)) : 300 * Math.pow(20, l)} ¥` },
  { id: "wide", name: "Wide Area", desc: "One more slot, kept through every ascension", max: 3, base: 5, growth: 2, fx: l => `Start with ${3 + l} slots` },
  // (29 Oct, request: "there's literally nothing else for me to buy but this one shop item"): each of these opens at an
  // ascension count, so every ascension puts something new in the shop
  { id: "magnet", name: "Shard Magnet", desc: "Ascending gives 10% more Aura Shards", max: 10, base: 200, growth: 1.65, asc: 3, fx: l => `+${l * 10}% shards` },
  { id: "forge", name: "Star Forge", desc: "Stars give 20% more of their income bonus", max: 10, base: 300, growth: 1.7, asc: 3, fx: l => `5 stars give \u00D7${+(1 + 4 * (1 + 0.2 * l)).toFixed(1)}` },
  { id: "bargain", name: "Bargain", desc: "Summons cost 5% less", max: 10, base: 400, growth: 1.6, asc: 4, fx: l => `-${Math.round((1 - Math.pow(0.95, l)) * 100)}% summon cost` },
  { id: "charm", name: "Shiny Charm", desc: "Shinies are 25% more likely", max: 8, base: 500, growth: 1.8, asc: 4, fx: l => `+${l * 25}% shiny luck` },
  { id: "limit", name: "Limit Break", desc: "+10 max level for every unit", max: 10, base: 1500, growth: 1.9, asc: 5, fx: l => `+${l * 10} max level` },
  { id: "double", name: "Lucky Double", desc: "Every summon has a 3% chance to bring a second unit free", max: 10, base: 1200, growth: 1.7, asc: 5, fx: l => `${l * 3}% double summons` },
  { id: "collector", name: "Collector", desc: "+1% income for every different unit you've found", max: 5, base: 8000, growth: 2.4, asc: 6, fx: l => `+${l * AF.G.found()}% income now` },
  { id: "momentum", name: "Momentum", desc: "Every minute of a run adds 4% income, up to 40% more per level", max: 10, base: 12000, growth: 1.7, asc: 7, fx: l => `Up to +${l * 40}%, +${Math.round(AF.G.momentum() * 100)}% now` },
  { id: "favor", name: "Divine Favor", desc: "Divine or better summons are 15% more likely", max: 10, base: 30000, growth: 1.7, asc: 8, fx: l => `+${l * 15}% divine luck` },
  { id: "mastery", name: "Trait Mastery", desc: "Eclipse to Zenith traits are 15% more likely", max: 10, base: 60000, growth: 1.7, asc: 10, fx: l => `+${l * 15}% top trait luck` },
  // asc: ascensions needed before it can be bought (29 Oct, request: "all of the qol stuff should need 1,2,3 rebirths")
  { id: "autoCollect", name: "Auto Collect", desc: "Collects your Area every 10 seconds", max: 1, base: 3, unlock: true, asc: 1 },
  { id: "autoEquip", name: "Auto Equip", desc: "Places your best units after every summon", max: 1, base: 2, unlock: true, asc: 1 },
  { id: "autoLevel", name: "Auto Level", desc: "Levels up your Area units, spending at most a quarter of your ¥ at a time", max: 1, base: 6, unlock: true, asc: 2 },
  { id: "bulk", name: "Bulk Summon", desc: "Summon 50 or 100 at once", max: 1, base: 4, unlock: true, asc: 2 },
  // (29 Oct, request: "an upgrade where you can auto roll and auto reroll traits at the same time for like a tonn diamonds")
  { id: "twinAuto", name: "Twin Automation", desc: "Run auto summon and auto reroll at the same time", max: 1, base: 250, unlock: true, asc: 3 },
  { id: "autoStar", name: "Auto Star", desc: "Feeds spare copies into your best copy of each unit after summons", max: 1, base: 400, unlock: true, asc: 4 },
  // (29 Oct, request: "add a 100k option to reroll 2 traits at once. on the same unit"; Chris picked best of two)
  { id: "twinRoll", name: "Twin Roll", desc: "Every trait reroll rolls twice and keeps the better trait (with one unit in the Lab)", max: 1, base: 100000, unlock: true, asc: 3 },
  // (30 Oct, "nothing else I can possibly do with my shards"): the Rebirth shop, opened by Rebirths (reb). boost: what a
  // level adds to G.star's boosts (the same keys as the star map's fx)
  { id: "overflow", name: "Aura Overflow", desc: "+25% income from every unit, on top of everything else", max: 500, base: 1e6, growth: 1.16, reb: 1, fx: l => `\u00D7${AF.fmt ? AF.fmt(1 + 0.25 * l) : 1 + 0.25 * l} income` },
  { id: "deepMagnet", name: "Deep Magnet", desc: "Ascending gives 25% more Aura Shards", max: 20, base: 2e6, growth: 1.45, reb: 1, boost: { shardK: 0.25 }, fx: l => `+${l * 25}% shards` },
  { id: "relicCase", name: "Relic Case", desc: "One more slot to wear a Relic in", max: 2, base: 5e7, growth: 12, reb: 1, fx: l => `${3 + l} relic slots` },
  { id: "warmStart", name: "Warm Start", desc: "Every run starts with 100 times more \u00A5", max: 3, base: 1e7, growth: 6, reb: 1, fx: l => `\u00D7${AF.fmt ? AF.fmt(Math.pow(100, l)) : Math.pow(100, l)} starting \u00A5` },
  { id: "highFavor", name: "High Favor", desc: "Divine or better summons are 10% more likely", max: 10, base: 2e7, growth: 1.6, reb: 2, boost: { favor: 0.1 }, fx: l => `+${l * 10}% divine luck` },
  { id: "relicLuck", name: "Relic Luck", desc: "Epic or better Relics are 20% more likely", max: 10, base: 3e7, growth: 1.6, reb: 2, fx: l => `+${l * 20}% relic luck` },
  { id: "warBanner", name: "War Banner", desc: "Defense matches start with 25% more cash", max: 8, base: 2.5e7, growth: 1.7, reb: 2, boost: { tdCash: 0.25 }, fx: l => `+${l * 25}% Defense cash` },
  { id: "absCall", name: "Absolute Call", desc: "Absolute summons are 25% more likely", max: 8, base: 2e8, growth: 1.8, reb: 3, boost: { abs: 0.25 }, fx: l => `+${l * 25}% Absolute luck` },
  { id: "starPress", name: "Starlight Press", desc: "Rebirths give 20% more Starlight", max: 10, base: 3e8, growth: 1.7, reb: 3, boost: { star: 0.2 }, fx: l => `+${l * 20}% Starlight` },
  // (30 Oct) two Lab units each rolling Twin Roll's pair: four reels at once
  // (31 Oct, "auto upgrade for defense, so it just upgrades SMARTLY"): defense.js autoUpgrade
  { id: "autoUpgrade", name: "Auto Upgrade", desc: "In Defense, upgrades what you've placed on its own: farms while it's safe, damage where the enemies are. Placing stays yours.", max: 1, base: 3e9, unlock: true, reb: 1 },
  // (1 Nov, "run it at 2x speed while not being in it, cause it runs at half speed currently"): defense.js bgSpeed
  { id: "doubleTime", name: "Double Time", desc: "On other tabs, a Defense match keeps the speed you picked, up to 2x, instead of half speed", max: 1, base: 8e9, unlock: true, reb: 1 },
  // (1 Nov, "make the auto upgrade another 20% faster as an upgrade in rebirth shop"; "auto upgrade should go up to 4x, i
  // hope you know i mean auto upgrade in the area"): the Area's Auto Level, ui.js loop
  { id: "quickHands", name: "Quick Hands", desc: "Auto Level in your Area works 20% faster", max: 15, base: 5e9, growth: 1.8, reb: 1, needs: ["autoLevel"], fx: l => `Auto Level x${+(1 + 0.2 * l).toFixed(1)} speed` },
  { id: "quadAuto", name: "Quadruplet Automation", desc: "With two units in the Lab, Twin Roll rolls each of them twice", max: 1, base: 5e8, unlock: true, reb: 1, needs: ["twinAuto", "twinRoll"] },
  { id: "longClimb", name: "Long Climb", desc: "Endless floors pay 25% more Aura Shards", max: 10, base: 1.5e8, growth: 1.6, reb: 3, boost: { towerSh: 0.25 }, fx: l => `+${l * 25}% Endless shards` },
  // (1 Nov, "add more progression ... makes it worth it to continue, even where he's at, and where i'm at at rebirth 3"):
  // the Rebirth shop's second shelf, something new at Rebirths 4, 5, 6, 8, 10 and 15, priced for those climbs' shards
  { id: "warOverflow", name: "War Overflow", desc: "+20% damage in Defense for every unit, on top of everything else", max: 300, base: 1e10, growth: 1.15, reb: 4, boost: { tdAtk: 0.2 }, fx: l => `+${l * 20}% Defense damage` },
  { id: "relicVault", name: "Relic Vault", desc: "One more slot to wear a Relic in, on top of Relic Case", max: 1, base: 1e11, reb: 5, fx: () => `${AF.G.relicSlots()} relic slots` },
  { id: "ascendant", name: "Ascendant", desc: "Every ascension adds another 5% income", max: 10, base: 1e11, growth: 2.5, reb: 6, boost: { ascPer: 0.05 }, fx: l => `+${l * 5}% per ascension` },
  { id: "starLens", name: "Starlight Lens", desc: "Rebirths give 25% more Starlight", max: 10, base: 3e11, growth: 2, reb: 8, boost: { star: 0.25 }, fx: l => `+${l * 25}% Starlight` },
  { id: "flood", name: "Aura Flood", desc: "Doubles income from every unit", max: 25, base: 1e12, growth: 3, reb: 10, fx: l => `\u00D7${AF.fmt ? AF.fmt(Math.pow(2, l)) : Math.pow(2, l)} income` },
  { id: "supergiant", name: "Supergiant", desc: "Brightening a star costs 10% less Starlight", max: 5, base: 5e13, growth: 3, reb: 15, fx: l => `-${l * 10}% brightening cost` },
];
// (1 Nov) brightening a lit star (G.brightenStar): up to max more times, each adding its effect again; these effects
// don't stack, so a star made only of them can't be brightened
AF.BRIGHT = { max: 10, skip: ["slots", "sumCost", "start", "abs"] };
AF.UPG = {};
AF.UPGRADES.forEach(u => { AF.UPG[u.id] = u; });
// ---- Relics (30 Oct): charms rolled for Aura Shards from the first Rebirth, worn in slots. kinds: what one adds, by
// rarity (Common to Mythic), times its quality (0.8-1.2); key: the boost it adds to (game.js G.star) ----
AF.RELIC = {
  reb: 1, cost: 250000, slots: 3, keep: 80,
  // (30 Oct, "the relic rolls should get more and more expensive"): each roll 2% dearer than the last, for good
  grow: 1.02,
  rar: [{ name: "Common", w: 62 }, { name: "Rare", w: 27 }, { name: "Epic", w: 8.5 }, { name: "Legendary", w: 2.2 }, { name: "Mythic", w: 0.3 }],
  // what scrapping one pays back, as a share of a roll's cost
  scrap: [0.04, 0.1, 0.25, 0.8, 3],
  kinds: [
    { id: "inc", key: "inc", name: "Coin Charm", v: [0.15, 0.4, 1, 2.5, 6], txt: v => `+${Math.round(v * 100)}% income` },
    { id: "shard", key: "shardK", name: "Shard Lens", v: [0.05, 0.1, 0.2, 0.4, 0.8], txt: v => `+${Math.round(v * 100)}% ascension shards` },
    { id: "luck", key: "luck", name: "Lucky Die", v: [0.05, 0.1, 0.2, 0.35, 0.6], txt: v => `Legendary+ summons +${Math.round(v * 100)}%` },
    { id: "favor", key: "favor", name: "Halo Shard", v: [0.05, 0.1, 0.2, 0.35, 0.6], txt: v => `Divine+ summons +${Math.round(v * 100)}%` },
    { id: "tluck", key: "tluck", name: "Prism", v: [0.05, 0.1, 0.2, 0.35, 0.6], txt: v => `Solar to Golden +${Math.round(v * 100)}%` },
    { id: "shiny", key: "shiny", name: "Gleam Stone", v: [0.1, 0.25, 0.5, 1, 2], txt: v => `Shinies +${Math.round(v * 100)}%` },
    { id: "cash", key: "tdCash", name: "War Purse", v: [0.05, 0.1, 0.2, 0.35, 0.6], txt: v => `Defense cash +${Math.round(v * 100)}%` },
    { id: "nap", key: "offline", name: "Dream Bell", v: [1, 2, 4, 8, 12], txt: v => `+${+v.toFixed(1)}h offline earnings` },
    { id: "star", key: "star", name: "Star Compass", v: [0.03, 0.06, 0.12, 0.25, 0.5], txt: v => `Rebirths +${Math.round(v * 100)}% Starlight` },
  ],
};
// (30 Oct) the Merchant's evolution materials: price base * grow^(how many you've bought); ic: its mark (merchant.js)
AF.MATS = [
  { id: "soul", name: "Soul Lantern", desc: "A lantern with something still burning inside.", base: 4e6, grow: 1.08, c: "#7de8ff" },
  { id: "ingot", name: "Hellforged Ingot", desc: "Iron that never quite cooled.", base: 2e7, grow: 1.1, c: "#ff6a3a" },
  { id: "contract", name: "Abyssal Contract", desc: "Terms written in a hand nobody living uses.", base: 1.2e8, grow: 1.12, c: "#b88aff" },
  { id: "crown", name: "Ember Crown", desc: "Worn once by something that ruled the lake.", base: 1e9, grow: 1.15, c: "#ffd76a" },
];
AF.MAT = {}; AF.MATS.forEach(m => { AF.MAT[m.id] = m; });
AF.RELIC.KIND = {};
AF.RELIC.kinds.forEach(k => { AF.RELIC.KIND[k.id] = k; });
// ---- quests: whole-game goals you claim for shards ----
// stat names are read by G.qstat; bool quests show done / not yet instead of a count
// (29 Oct, request: "the journal is a little too overpowered ... make it like 50% less"): every listed reward is halved,
// never below 1 shard (308 shards for all quests became 165)
const QUEST_SCALE = 0.5;
const Q = (id, name, stat, goal, shards, bool) => ({ id, name, stat, goal, shards: Math.max(1, Math.round(shards * QUEST_SCALE)), bool: !!bool });
AF.QUESTS = [
  ["Summoning", [Q("sum10", "Summon 10 units", "summons", 10, 1), Q("sum100", "Summon 100 units", "summons", 100, 2),
    Q("sum1k", "Summon 1K units", "summons", 1000, 5), Q("sum10k", "Summon 10K units", "summons", 10000, 15),
    Q("sum100k", "Summon 100K units", "summons", 100000, 40)]],
  ["Rarities", [Q("leg", "Pull a Legendary", "bestRank", 3, 1, 1), Q("myth", "Pull a Mythic", "bestRank", 4, 3, 1),
    Q("sec", "Pull a Secret", "bestRank", 5, 8, 1), Q("div", "Pull a Divine", "bestRank", 6, 25, 1),
    Q("tra", "Pull a Transcendent", "bestRank", 7, 40, 1), Q("pri", "Pull a Primordial", "bestRank", 8, 70, 1), Q("ete", "Pull an Eternal", "bestRank", 9, 140, 1),
    Q("abs", "Pull an Absolute", "bestRank", 10, 800, 1)]],
  // f48 keeps its id (saves that claimed it stay claimed); its goal becomes the whole roster once units.js loads
  ["Collection", [Q("f10", "Find 10 different units", "found", 10, 1), Q("f25", "Find 25 different units", "found", 25, 3),
    Q("f40", "Find 50 different units", "found", 50, 6), Q("f75", "Find 75 different units", "found", 75, 12),
    Q("f100", "Find 100 different units", "found", 100, 20), Q("f48", "Find every unit", "found", 48, 30)]],
  // riftAll's goal becomes the number of Rift units once units.js loads
  ["The Rift", [Q("rift1", "Pull a Rift unit", "rift", 1, 60), Q("riftAll", "Find every Rift unit", "rift", 5, 200)]],
  // (30 Oct) each faction past the Rift; the goals become each gate's count once units_gates.js loads
  ["The Gates", [Q("auroraAll", "Find all of the Order of the Long Night", "gate:aurora", 5, 600), Q("chronoAll", "Find all of the Unwound", "gate:chrono", 5, 900),
    Q("originAll", "Find all of the First Court", "gate:origin", 5, 1400)]],
  ["Earning", [Q("e4", "Earn 10K ¥ in total", "earned", 1e4, 1), Q("e6", "Earn 1M ¥ in total", "earned", 1e6, 2),
    Q("e9", "Earn 1B ¥ in total", "earned", 1e9, 4), Q("e12", "Earn 1T ¥ in total", "earned", 1e12, 8), Q("e15", "Earn 1Qa ¥ in total", "earned", 1e15, 15),
    Q("e18", "Earn 1Qi ¥ in total", "earned", 1e18, 30), Q("e21", "Earn 1Sx ¥ in total", "earned", 1e21, 80), Q("e24", "Earn 1Sp ¥ in total", "earned", 1e24, 300)]],
  ["Income", [Q("r3", "Reach 1K ¥/s", "maxRate", 1e3, 1), Q("r6", "Reach 1M ¥/s", "maxRate", 1e6, 3),
    Q("r9", "Reach 1B ¥/s", "maxRate", 1e9, 8), Q("r12", "Reach 1T ¥/s", "maxRate", 1e12, 20),
    Q("r15", "Reach 1Qa ¥/s", "maxRate", 1e15, 40), Q("r18", "Reach 1Qi ¥/s", "maxRate", 1e18, 100), Q("r21", "Reach 1Sx ¥/s", "maxRate", 1e21, 300)]],
  ["Traits", [Q("tg", "Roll Gilded or better", "bestMult", 2, 1, 1), Q("ts", "Roll Solar or better", "bestMult", 25, 2, 1),
    Q("ti", "Roll Inferno or better", "bestMult", 50, 3, 1), Q("te", "Roll Eclipse or better", "bestMult", 100, 5, 1),
    Q("tn", "Roll Nebula or better", "bestMult", 300, 8, 1),
    Q("ta", "Roll Astral or better", "bestMult", 1000, 12, 1), Q("tz", "Roll Zenith or better", "bestMult", 3000, 20, 1), Q("tu", "Roll Singularity or better", "bestMult", 10000, 40, 1),
    Q("tinf", "Roll Infinity", "bestMult", 50000, 400, 1),
    Q("rr50", "Reroll 50 times", "rerolls", 50, 1), Q("rr500", "Reroll 500 times", "rerolls", 500, 3), Q("rr5k", "Reroll 5K times", "rerolls", 5000, 8),
    Q("rr50k", "Reroll 50K times", "rerolls", 50000, 30)]],
  ["Training", [Q("l50", "Get a unit to Lv 50", "maxLevel", 50, 1), Q("l100", "Get a unit to Lv 100", "maxLevel", 100, 3),
    Q("l150", "Get a unit to Lv 150", "maxLevel", 150, 6), Q("l200", "Get a unit to Lv 200", "maxLevel", 200, 12),
    Q("l250", "Get a unit to Lv 250", "maxLevel", 250, 40), Q("l300", "Get a unit to Lv 300", "maxLevel", 300, 120),
    Q("s2", "Give a unit 2 stars", "maxStars", 2, 1), Q("s5", "Give a unit 5 stars", "maxStars", 5, 6)]],
  ["Rare finds", [Q("sh1", "Find a shiny", "shinies", 1, 4), Q("sh5", "Find 5 shinies", "shinies", 5, 10),
    Q("sh25", "Find 25 shinies", "shinies", 25, 30),
    Q("slots", "Unlock 12 slots", "slotsMax", 12, 5), Q("slots15", "Unlock all 15 slots", "slotsMax", 15, 40),
    Q("a1", "Ascend", "asc", 1, 3), Q("a5", "Ascend 5 times", "asc", 5, 10), Q("a10", "Ascend 10 times", "asc", 10, 80), Q("a15", "Ascend 15 times", "asc", 15, 400)]],
  ["Defense", [Q("tdv1", "Clear Hollowbrook on Normal", "td:village:normal", 1, 40, 1), Q("tdv2", "Clear Hollowbrook on Hard", "td:village:hard", 1, 160, 1),
    Q("tdv3", "Clear Hollowbrook on Nightmare", "td:village:nightmare", 1, 600, 1),
    Q("tdh1", "Clear Gullport on Normal", "td:harbor:normal", 1, 70, 1), Q("tdd1", "Clear Sunscar Dunes on Normal", "td:desert:normal", 1, 110, 1),
    Q("tdf1", "Clear Frostveil Pass on Normal", "td:frost:normal", 1, 160, 1), Q("tdg1", "Clear Gloomhollow on Normal", "td:grave:normal", 1, 230, 1),
    Q("tdc1", "Clear Cinderfall on Normal", "td:volcano:normal", 1, 330, 1), Q("tdn1", "Clear Neon Arcology on Normal", "td:neon:normal", 1, 480, 1),
    Q("tds1", "Clear Starfall Expanse on Normal", "td:space:normal", 1, 800, 1),
    Q("tdd2", "Clear Sunscar Dunes on Hard", "td:desert:hard", 1, 520, 1), Q("tdg2", "Clear Gloomhollow on Hard", "td:grave:hard", 1, 1200, 1)]],
  // (30 Oct) Rebirth
  ["Rebirth", [Q("rb1", "Rebirth", "reb", 1, 1000, 1), Q("rb3", "Rebirth 3 times", "reb", 3, 3000), Q("rb10", "Rebirth 10 times", "reb", 10, 12000),
    Q("sm10", "Light 10 stars on the star map", "smap", 10, 2000), Q("smAll", "Light every star on the star map", "smap", 25, 10000),
    Q("ev1", "Evolve a unit", "evolved", 1, 50000), Q("rl1", "Roll a Relic", "relics", 1, 2000), Q("rl100", "Roll 100 Relics", "relics", 100, 20000), Q("rlm", "Find a Mythic Relic", "bestRelic", 4, 100000, 1)]],
  ["Surges", [Q("su1", "Catch an Aura Surge", "surges", 1, 2), Q("su25", "Catch 25 Aura Surges", "surges", 25, 12),
    Q("su100", "Catch 100 Aura Surges", "surges", 100, 40)]],
];
AF.QUEST = {};
AF.QUESTS.forEach(([, qs]) => qs.forEach(q => { AF.QUEST[q.id] = q; }));
AF.levelMult = lv => Math.pow(AF.ECON.levelGrowth, lv - 1);
AF.upCost = (rar, lv) => Math.ceil(AF.RAR[rar].upBase * Math.pow(AF.ECON.costGrowth, lv - 1));
AF.rerollCost = rar => AF.RAR[rar].rerollBase;

if (typeof module !== "undefined") module.exports = AF;
})(typeof window !== "undefined" ? window : globalThis);
