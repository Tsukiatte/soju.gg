/* Aura Farm Defense, the rules: attack styles, what each unit does on the board, enemies, maps and waves, and the
   match itself (spawning, walking, targeting, damage, cash, lives). No DOM and no Three.js in here; board.js draws
   it and defense.js runs the page. Distances are in world units (a unit stands about 1.2 tall), times in seconds. */
(function () {
const AF = window.AF, TD = AF.TD = {};

// ---- attack styles ----
// atk = share of the unit's damage per attack, spa = seconds per attack, rng = reach.
// melee hits round its target (cleave), ranged fires one homing shot, splash bursts where it lands, chain jumps on
TD.STYLES = {
  melee:  { name: "Melee",  atk: 1.3,  spa: 1.0,  rng: 2.0, cleave: 0.9, cleaveK: 0.6 },
  ranged: { name: "Ranged", atk: 1.0,  spa: 1.0,  rng: 4.6, speed: 13 },
  splash: { name: "Splash", atk: 0.9,  spa: 1.6,  rng: 3.9, speed: 8, aoe: 1.25 },
  chain:  { name: "Chain",  atk: 0.85, spa: 1.35, rng: 4.1, jumps: 3, hop: 2.0, fall: 0.75 },
};
// a style the plain four don't have: hits everything round the unit at once
TD.STYLES.nova = { name: "Nova", atk: 0.5, spa: 1.5, rng: 2.6 };
TD.STYLES.farm = { name: "Farm", atk: 0, spa: 1, rng: 0 };
// (29 Oct, requests: "Take heavy inspiration from bloons td6 and their attack types" and "give all of the units
// specific individual effects"): the attack mechanics. Every unit has one (AF.ATTACKS in attacks.js names it and can
// change any number here); style is the family it counts as for the page's colours and the best-team pick.
// atk = share of the unit's damage per attack, spa = seconds per attack, rng = reach; the rest is the mechanic's own.
// Conditions any of them can carry: slow [share, seconds], stun seconds, dot [share of atk per second, seconds],
// knock (distance pushed back). Bosses shrug off most of each.
// (29 Oct, request: "everything attacks so quick. everything is ~1s cooldown, I was expecting 1-5s ... it just becomes
// too much and a little overstimulating"): every attack is slower, 1 to 5 s by mechanic (beams and orbits pulse once
// a second, rapid fire is a burst of three), and each hit is bigger by the same factor, so damage a second is as it was
TD.KINDS = {
  farm:   { style: "farm",   atk: 0,    spa: 1,    rng: 0 },                                       // no attack: pays cash every wave
  shot:   { style: "ranged", atk: 1.93,  spa: 1.8,  rng: 4.6, speed: 13 },                         // one homing shot
  rapid:  { style: "ranged", atk: 0.494, spa: 1.1, rng: 4.4, speed: 20, n: 3 },                         // a burst of three quick shots
  snipe:  { style: "ranged", atk: 5.46,  spa: 4.0,  rng: 7.5 },                                    // hits at once, very far
  pierce: { style: "ranged", atk: 1.5, spa: 2.2,  rng: 4.8, speed: 15, pierce: 3, w: 0.45 },     // straight on through several
  spread: { style: "ranged", atk: 1.53, spa: 2.2, rng: 4.0, speed: 13, n: 3, fan: 0.42, pierce: 1, w: 0.4 }, // a fan
  boomer: { style: "ranged", atk: 0.942, spa: 2.4, rng: 4.2, w: 0.55, dur: 1.0 },                 // out on a curve and back
  seek:   { style: "ranged", atk: 1.04, spa: 2.0,  rng: 4.6, speed: 10, n: 2 },                   // homing, finds a new target
  tack:   { style: "splash", atk: 1.26,  spa: 2.2,  rng: 2.6, speed: 12, n: 8, pierce: 1, w: 0.45 }, // all round at once
  lob:    { style: "splash", atk: 1.81,  spa: 3.0,  rng: 4.0, speed: 7, aoe: 1.55 },               // a lobbed blast
  mortar: { style: "splash", atk: 2.68,  spa: 4.5,  rng: 8.0, aoe: 1.7, delay: 0.9 },              // falls from the sky, far
  strike: { style: "splash", atk: 2.16, spa: 3.2,  rng: 5.0, aoe: 1.25, delay: 0.35 },            // a strike from above
  volley: { style: "splash", atk: 1.87, spa: 3.2,  rng: 5.0, aoe: 1.45, delay: 0.45 },            // a rain of shots on an area
  field:  { style: "splash", atk: 0.408, spa: 4.0,  rng: 4.2, r: 1.2, dur: 3.2, tick: 0.5 },       // a patch that hurts over time
  hole:   { style: "splash", atk: 0.144,  spa: 4.5,  rng: 4.4, r: 1.5, dur: 3.0, tick: 0.25, pull: 0.7 }, // pulls back and grinds
  chain:  { style: "chain",  atk: 1.7, spa: 2.6, rng: 4.4, jumps: 3, hop: 2.2, fall: 0.78 },    // jumps from one to the next
  beam:   { style: "chain",  atk: 1.06, spa: 1.0,  rng: 4.2, ramp: 0.6, rampT: 2 },               // a held beam that builds up
  nova:   { style: "nova",   atk: 1.07,  spa: 2.6,  rng: 2.6 },                                    // everything round it
  spin:   { style: "nova",   atk: 0.926, spa: 1.8, rng: 2.0 },                                    // a whirl, close in
  orbit:  { style: "nova",   atk: 0.563, spa: 1.0, rng: 1.9 },                                    // blades circling it
  stop:   { style: "nova",   atk: 1.26,  spa: 5.0,  rng: 3.0, stun: 1.6 },                         // time stands still round it
  slash:  { style: "melee",  atk: 2.08,  spa: 1.6,  rng: 2.0, cleave: 0.9, cleaveK: 0.6 },         // a cleaving cut
  combo:  { style: "melee",  atk: 1.71, spa: 1.4,  rng: 2.2, cleave: 1.0, cleaveK: 0.6, every: 3, wave: { len: 4.4, w: 0.7, speed: 10, k: 1.3 } },
  slam:   { style: "melee",  atk: 2.2, spa: 2.8,  rng: 2.4, aoe: 1.3, stun: 0.5 },               // down on the ground
  dash:   { style: "melee",  atk: 1.98,  spa: 2.6, rng: 3.2, w: 0.65 },                           // lunges through a line
  summon: { style: "melee",  atk: 1.53,  spa: 1.2, rng: 4.0, n: 1, speed: 4.5, reach: 0.7 },       // a pet that goes and fights
  runner: { style: "melee",  atk: 2.09, spa: 3.5,  rng: 0,   hits: 1, speed: 4.2 },                  // sent back down the road from the end
};
// what each mechanic is called on the page, and what it does in a line
TD.KIND_NAME = { runner: "Runner", farm: "Farm", shot: "Shot", rapid: "Rapid fire", snipe: "Sniper", pierce: "Piercing", spread: "Spread", boomer: "Boomerang", seek: "Homing",
  tack: "Radial burst", lob: "Lobbed blast", mortar: "Mortar", strike: "Sky strike", volley: "Rain", field: "Ground field", hole: "Black hole",
  chain: "Chain", beam: "Beam", nova: "Nova", spin: "Whirl", orbit: "Orbit", stop: "Time stop", slash: "Cleave", combo: "Combo", slam: "Slam",
  dash: "Dash", summon: "Summon" };
TD.KIND_INFO = { runner: "Sends runners from the end of the road back toward the enemies. Each one hits the ground enemies it meets; where it stands doesn't matter.", farm: "Doesn't attack. Pays cash at the end of every wave.", shot: "One homing shot.", rapid: "A quick burst of three light shots.", snipe: "Hits at once, from very far.",
  pierce: "Flies straight on through several enemies.", spread: "A fan of shots.", boomer: "Curves out and comes back, hitting both ways.",
  seek: "Homing shots that find a new target when theirs falls.", tack: "Shots in every direction at once.", lob: "A lobbed shot that bursts where it lands.",
  mortar: "Falls from the sky far away, on the strongest.", strike: "A strike from above after a moment.", volley: "A rain of shots over an area.",
  field: "A patch on the road that hurts whatever walks through.", hole: "Drags enemies back down the road and grinds them.",
  chain: "Jumps from one enemy to the next.", beam: "A held beam that builds up the longer it holds.", nova: "Hits everything around it.",
  spin: "A whirl that hits everything close.", orbit: "Pieces circling it cut whatever comes close.", stop: "Stops time around it.",
  slash: "A cleaving hit that catches those behind.", combo: "A combo; every third swing sends a wave down the line.",
  slam: "Comes down on the ground, hitting all round the spot.", dash: "Lunges through a whole line.", summon: "Pets that go and fight for it." };
// a unit's attack: its own entry in AF.ATTACKS (or td.kind on the unit)
TD.attackOf = def => {
  const A = AF.ATTACKS && AF.ATTACKS[def.key];
  if (A && TD.KINDS[A.kind]) return A;
  if (def.td && def.td.kind && TD.KINDS[def.td.kind]) return { kind: def.td.kind };
  return null;
};
TD.kindOf = def => { const A = TD.attackOf(def); return A ? A.kind : null; };
// (1 Nov) a unit's attack as it is: an evolved unit's own when it has one (AF.ATTACKS["key@evo"], tdhell.js)
TD.attackOfU = u => { const E = u && u.ev && AF.ATTACKS && AF.ATTACKS[u.k + "@evo"]; return E && TD.KINDS[E.kind] ? E : TD.attackOf(AF.UNIT[u.k]); };
// what a unit can hit: ground (only what walks) or hybrid (walkers and flyers)
TD.KIND_REACH = { runner: "ground", slash: "ground", combo: "ground", slam: "ground", dash: "ground", spin: "ground", nova: "ground", field: "ground", lob: "ground", mortar: "ground" };
const FLY_PETS = { bee: 1, kite: 1, owl: 1, dragon: 1, lanternGhost: 1 };
TD.reachOf = def => {
  const A = TD.attackOf(def);
  if (!A) return TD.styleOf(def) === "melee" ? "ground" : "hybrid";
  if (A.reach) return A.reach;
  if (A.kind === "summon") return FLY_PETS[A.shape] ? "hybrid" : "ground";
  return TD.KIND_REACH[A.kind] || "hybrid";
};
TD.REACH_NAME = { ground: "Ground", hybrid: "HBD" }; // (29 Oct, "hybrid on the cards can be abbreviated to hbd")
TD.REACH_INFO = { ground: "Hits only enemies on the ground; flyers pass over it.", hybrid: "Hits enemies on the ground and in the air." };
// can unit p hit enemy e?
TD.can = (p, e) => { const r = p.s.reach; return r !== "ground" || !e.def.air; };
// a unit's style comes from what it carries; step 2 hand-tunes the ones this gets wrong
const MELEE = ["greatsword", "sword", "katana", "dagger", "spear", "hammer", "gauntlets", "tapedFists", "mechArm", "baton", "mop",
  "ladle", "stopSign", "shield", "wrench", "sheath"];
const RANGED = ["bow", "flintlock", "blaster", "cards", "kunai", "flashlight", "scanner", "drone", "kite", "parrot", "dog", "skateboard"];
const SPLASH = ["staff", "orb", "waterOrb", "book", "pages", "planets", "sunDisc", "vortex", "blackHole", "eclipse", "lavaCracks", "lotus",
  "crystals", "lute", "notesRing", "ghostLanterns", "lanternPole", "runeRing", "clockRings", "halos", "serpent", "dragonling", "shards",
  "orbitOrbs", "blades", "riftTear"];
TD.styleOf = def => {
  if (TD.kindOf(def)) return TD.KINDS[TD.kindOf(def)].style;
  if (def.td && def.td.style) return def.td.style;
  const acc = (def.acc || []).map(a => a[0]);
  if (acc.some(a => MELEE.includes(a))) return "melee";
  if ((def.fx || []).some(f => f.k === "arc")) return "chain";
  if (acc.some(a => RANGED.includes(a))) return "ranged";
  if (acc.some(a => SPLASH.includes(a))) return "splash";
  return "ranged";
};
// small, fixed differences between units of the same rarity and style
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return ((x >>> 0) % 1000) / 1000; };

// ---- a unit's board stats ----
// Rarity sets the base (x1.5 a step); stars, shiny and the trait add to it. Traits count on a squashed scale
// (1 + half the log of the multiplier: Gilded x1.15, Eclipse x2, Infinity x3.35), since x50,000 would end every map.
// Levels are left out: they reset with every ascension.
// (29 Oct, request: "eternal was in the millions of atk. like 50k dps, up to 800-1m with upgrades"): a 5-star
// Eternal with a top trait does about 50K damage a second when placed and about 1M fully upgraded
TD.BASE_ATK = 250;
TD.RARITY_STEP = 1.5;
// (29 Oct, request: "instead of 'defense' for all the traits, do 'atk, spa,' etc and all traits give different based on
// the theme. like eclipse would be range, tempes spa ... some better ones can have multiple"): what a trait does in
// Defense. atk multiplies damage, spa attack speed (2 = twice as often), rng range. Each is about as strong as the one
// damage boost it replaces (Eclipse was x2, Astral x2.5, Singularity x6), so the Defense tuning holds. Infinity (asked
// for x20 earlier the same day, then "all 20x", then "x20 damage, big speed+range"): one on the board, and its speed and
// range as big as Chris's Starfall Nightmare rule allows. Measured with the whole-match sim at 5 stars: at x2 speed and
// x1.5 range a Transcendent team won Starfall Nightmare; at x1.4 and x1.15 it gets the boss to 63% and loses, while an
// Eternal/Primordial team still wins with no leaks
TD.TRAIT_TD = {
  sturdy1: { atk: 1.05 }, sturdy2: { atk: 1.08 }, sturdy3: { atk: 1.12 },
  swift1: { spa: 1.05 }, swift2: { spa: 1.08 }, swift3: { spa: 1.12 },
  keen1: { rng: 1.05 }, keen2: { rng: 1.08 }, keen3: { rng: 1.12 },
  gilded: { atk: 1.15 },
  tempest: { spa: 1.35 },
  solar: { atk: 1.7 },
  inferno: { atk: 1.4, spa: 1.3 },
  eclipse: { rng: 1.4, atk: 1.5 },
  nebula: { spa: 1.7, rng: 1.3 },
  // golden: nothing for a fighter (30 Oct, "golden should have no atk multiplier"); it's the farm trait (data.js farm)
  astral: { atk: 2, rng: 1.35 },
  zenith: { atk: 1.6, spa: 1.6, rng: 1.25 },
  singular: { atk: 3, spa: 2 },
  infinity: { atk: 20, spa: 1.4, rng: 1.15 },
};
// a doubled trait (data.js TRAIT_DBL) gives twice each bonus: ATK x3 becomes x5
const DBL_TD = {};
TD.traitTd = tr => {
  const b = (tr && TD.TRAIT_TD[tr.id]) || {};
  if (!tr || !tr.dbl) return b;
  if (!DBL_TD[tr.id]) { const o = {}; for (const k in b) o[k] = 1 + 2 * (b[k] - 1); DBL_TD[tr.id] = o; }
  return DBL_TD[tr.id];
};
TD.traitBoost = tr => TD.traitTd(tr).atk || 1;
// farms: one price for all, and about the same pay (a rarity step adds 2.5%), half again more each upgrade
// (29 Oct, "the farm units are way too cheap", then "farms are still too cheap": was 450, then 1000) a farm costs 1500
// times the match's cash multiplier (difficulty x world, as starting cash and kills are), and pays 120 a wave times it
// (same day, "farms are also just a little too expensive now, it should take like 1-3 rounds to make ur money back"):
// 1500 for 120 a wave took about 12 waves to pay back. Now 1200 for 500: the farm and each upgrade (costs x0.5 to
// x3.2 of its price, pay x1.5) pay back in about 2 to 2.4 waves, a Golden farm (x2 pay, 30 Oct) in about 1.2
TD.FARM = { cost: 1200, pay: 500, rank: 0.025, up: 1.5 };
// (29 Oct) a farm's pay times its trait's farm boost: only Golden has one (x2.5)
TD.farmTrait = tr => (tr && tr.farm) || 1;
TD.cashMult = M => M.diff.cash * (M.map.cashK || 1);
TD.farmPay = (M, p, lv = p.lv || 0) => Math.round(p.s.farm * Math.pow(TD.FARM.up, lv) * (M ? M.diff.cash * (M.map.cashK || 1) : 1));
TD.payFarms = M => {
  for (const p of M.units) if (p.s.kind === "farm") { const c = TD.farmPay(M, p); M.cash += c; p.earned = (p.earned || 0) + c; M.ev.push({ t: "farm", p, cash: c }); }
};
TD.statsOf = u => {
  const def = AF.UNIT[u.k], rank = AF.RAR[def.rarity].order, A = TD.attackOfU(u), kind = A ? A.kind : null;
  if (kind === "farm") return { style: "farm", kind, reach: null, cfg: null, sig: 0, name: A.name, atk: 0, spa: 0, rng: 0, cost: TD.FARM.cost,
    farm: TD.FARM.pay * (1 + TD.FARM.rank * rank) * TD.farmTrait(AF.traitOf(u)) * (u.ev ? (AF.EVO_REQ[u.k] && AF.EVO_REQ[u.k].td) || AF.EVO_TD : 1) };
  const style = kind ? TD.KINDS[kind].style : TD.styleOf(def);
  const st = kind ? Object.assign({}, TD.KINDS[kind], A.p || {}) : TD.STYLES[style];
  const tr = AF.traitOf(u), vary = 0.92 + 0.16 * hash(def.key);
  // conditions and signature attacks are worth damage, so a unit with them hits a little softer
  let even = 1;
  if (kind) {
    if (st.slow) even *= 1 - st.slow[0] * 0.5;
    if (st.stun && kind !== "stop" && kind !== "slam") even *= 0.9;
    if (st.dot) even /= 1 + st.dot[0] * st.dot[1] * 0.6;
    if (st.knock) even *= 0.85;
    if (A.sig) even /= 1 + 0.6 / A.sig.every;
    if (kind === "runner") { even /= 1 + ((st.hits || 1) - 1) * 0.55; if (st.aoe) even *= 0.75; }
  }
  // rarity no longer makes a unit attack faster (29 Oct, slower attacks); the speed it used to give is damage now
  const atk = TD.BASE_ATK * Math.pow(TD.RARITY_STEP, rank) / (1 - 0.02 * rank) * st.atk * vary * even * TD.traitBoost(tr) // (30 Oct) its trait only: stars and shiny no longer count
    * (AF.G && AF.G.S ? 1 + AF.G.star("tdAtk") : 1) // (30 Oct) the star map's Defense stars
    * (u.ev ? (AF.EVO_REQ[u.k] && AF.EVO_REQ[u.k].td) || AF.EVO_TD : def.tdK || 1); // (30 Oct) an evolved unit (or Vesh before)
  return {
    style, kind, reach: TD.reachOf(def), cfg: kind ? st : null, sig: A && A.sig ? A.sig.every : 0, name: A && A.name, atk, spa: st.spa * (1.04 - 0.08 * hash(def.key + "s")) / (TD.traitTd(tr).spa || 1),
    rng: (st.rng + 0.08 * rank) * (TD.traitTd(tr).rng || 1),
    cost: Math.round((120 * Math.pow(1.3, rank)) / 5) * 5, cap: tr && tr.id === "infinity" ? 1 : 0,
    // (30 Oct) a unit from a gate past the Rift: its passive and its Release (tdgate.js)
    gate: def.gate && AF.REL && AF.REL[def.key] ? def.gate : null,
  };
};
// damage per second, for sorting and the best-team pick (splash and chain count a little extra for the crowd)
TD.dps = s => (s.spa ? s.atk / s.spa : 0);
TD.power = s => TD.dps(s) * ({ melee: 1.15, ranged: 1, splash: 1.35, chain: 1.3, nova: 1.45 }[s.style] || 1) * (0.85 + s.rng * 0.05) * TD.capOf({ s }) / TD.PER_SLOT;

// ---- in-match upgrades: six levels bought with match cash; the sixth takes damage per second to about x20 ----
// upgrades: harder hits only, so attack times stay 1 to 5 s at every level (29 Oct: was x1.55 damage and x0.94 time
// each; damage a second per level unchanged)
// (31 Oct, "I should barely be able to max everything with 3 golden farms"): a fighter's upgrades cost fightK times
// the map's cash multiplier and its upK (not in the Endless tower); stamped on the match's team stats as s.upK
// (patch_td_economy3.py has the measurements)
TD.UP = { max: 6, cost: [0.5, 0.75, 1.1, 1.6, 2.3, 3.2], atk: 1.649, rng: 0.25, spa: 1, fightK: 3, towerK: 4 };
// (1 Nov, "I'm on wave 7 and I already have everything maxed") the Endless tower too, at towerK times its cash
// (patch_tower_economy.py)
// (30 Oct) p.gm / p.gs: what a gate unit's passive adds right now (tdgate.js), damage and speed
TD.live = p => (p.s.kind === "farm" ? { atk: 0, spa: 0, rng: 0 } : { atk: p.s.atk * Math.pow(TD.UP.atk, p.lv) * (p.gm || 1), spa: p.s.spa * Math.pow(TD.UP.spa, p.lv) / (p.gs || 1), rng: p.s.rng + TD.UP.rng * p.lv });
TD.upCost = p => (p.lv >= TD.UP.max ? 0 : Math.round((p.s.cost * TD.UP.cost[p.lv] * (p.s.upK || 1)) / 5) * 5);
TD.sellValue = p => Math.floor(p.spent * 0.5);
TD.PER_SLOT = 3;   // copies of one team unit on the board at once (an Infinity unit: one)
TD.capOf = t => (t.s && t.s.cap) || TD.PER_SLOT;
TD.UNIT_R = 0.5;   // a unit's footprint
TD.GAP = 1.3;      // closest two units may stand, centre to centre

// ---- enemies ----
// lives: what one costs you if it reaches the end; armor takes that share off every hit; hb = health bar height
TD.ENEMIES = {
  mudling:   { name: "Mudling",          hp: 2200,   speed: 1.25, cash: 20,  lives: 1,  armor: 0,    size: 0.85, hb: 1.0 },
  crow:      { air: true, name: "Crow",             hp: 1250,   speed: 2.3,  cash: 15,  lives: 1,  armor: 0,    size: 0.75, hb: 1.0 },
  golem:     { name: "Stone Golem",      hp: 12000,  speed: 0.7,  cash: 75,  lives: 3,  armor: 0.25, size: 1.05, hb: 1.9 },
  scarecrow: { name: "Hollow Scarecrow", hp: 110000, speed: 0.5,  cash: 750, lives: 20, armor: 0.15, size: 1.6,  hb: 3.0, boss: true },
};
// hp and speed scale the enemies; cash scales the starting cash and every kill (tougher waves need a bigger board
// sooner); reward = [first clear, every clear after] in Aura Shards
TD.DIFFS = [
  { id: "normal",    name: "Normal",    hp: 1,  speed: 1,   cash: 1,   reward: [500, 50] },
  // (29 Oct, "nightmare should only be possible on the last map with singularity + primordial or eternal"): Hard was
  // 8x with 1.5x cash, Nightmare 60x (beyond any team); see tools/patch_difficulty.py for the measured ladder
  { id: "hard",      name: "Hard",      hp: 3,  speed: 1,   cash: 1.8, reward: [2000, 200] },
  { id: "nightmare", name: "Nightmare", hp: 11, speed: 1.1, cash: 2.4, reward: [8000, 800] },
];
// (29 Oct, request: "tower defense lowkey gives too many shards no?" early on, and "~5h till endgame"): a clear pays by
// how hard it is, the world's enemy health times the difficulty's (E): about a third of the shards the ascension you'd
// be on for it needs (a = 4 + 5.92 log10 E fits the ascension path: Hollowbrook Normal at 4, Gloomhollow Hard at 15).
// Hollowbrook on Normal pays about 30 now (was 500), each step up the path about 3x more; a repeat win pays 5%
TD.reward = (map, diff, first) => {
  // past the end of the path (15) it stops climbing: shards beyond what the shop can use mean nothing
  const E = (map.hpK || 1) * diff.hp, a = Math.min(16, 4 + 5.92 * Math.log10(E)), v = 1.05 * Math.pow(3, a - 1) * (first ? 1 : 0.05);
  const step = v >= 1e4 ? 1000 : v >= 1000 ? 100 : v >= 100 ? 10 : 1;
  return Math.max(first ? 10 : 2, Math.round(v / step) * step);
};
TD.GROW = 1.22; // enemy health grows this much each wave of 15 (early waves stay gentle, the last ones bite);
// a world with more waves grows by as much over all of them
// (29 Oct, request: "the 14 waves before the boss are easy and the actual boss is insanely hard, up to wave 14 it should
// start getting pretty hard"): the waves before the boss get tougher toward the end, x (1 + a y^p) on top of the growth
// (y = 0 at wave 1, 1 at the wave before the boss), the boss wave's own crowd stays as it was, and the boss has BOSS_K
// of its old health. A world can set its own ramp [a, p] and bossK (Starfall does). tools/patch_wave_curve.py has the
// measurements
TD.RAMP = [1.2, 2];
TD.BOSS_K = 0.75;
TD.waveHp = (M, d) => {
  if (M.map.tower) return TD.TOWER.waveHp(M, d); // (30 Oct) a tower floor's own
  const n = M.map.waves || 15, grow = k => Math.pow(TD.GROW, k);
  if (d.boss) return grow(14) * (M.map.bossK || TD.BOSS_K);
  const x = (M.wave - 1) / (n - 1);
  if (M.wave >= n) return grow(x * 14);
  const [a, p] = M.map.ramp || TD.RAMP;
  return grow(x * 14) * (1 + a * Math.pow((M.wave - 1) / (n - 2), p));
};
TD.DIFF = {}; TD.DIFFS.forEach(d => { TD.DIFF[d.id] = d; });

// ---- maps ----
// (29 Oct, request: "I want the first world to be an overworld. like a village, well modeled. i should be able to
// place units anywhere (within reason)"): open ground instead of tiles. bounds = where units may stand
// [x0, x1, z0, z1]; road = control points of the winding road (smoothed), from the woods to the town hall;
// props = [kind, x, z, turn, size, look] (board.js models them; the ones in TD.FOOT block placement)
TD.FOOT = { house: ["box", 2.8, 2.4], hall: ["box", 4.2, 3.6], windmill: ["circle", 1.45], well: ["circle", 0.9], tree: ["circle", 0.55],
  pine: ["circle", 0.5], bush: ["circle", 0.4], rock: ["circle", 0.45], stall: ["box", 1.9, 1.2], fence: ["box", 2.3, 0.3], lamp: ["circle", 0.22],
  hay: ["circle", 0.5], barrels: ["circle", 0.5], crates: ["circle", 0.55], cart: ["box", 1.7, 1.0], pond: ["circle", 2.1], arch: ["box", 3, 1] };
TD.MAPS = [{
  id: "village", name: "Hollowbrook", world: "Overworld", n: 1, waves: 15, cash: 1000, lives: 20,
  blurb: "Something is crawling out of the old woods. Keep it off the road to the town hall.",
  bounds: [-13, 13, -8, 8],
  road: [[-19, -5], [-12.5, -5.2], [-8.5, -3.4], [-7.2, 1.2], [-3.8, 4.6], [1.2, 4.4], [3.6, 0], [7.6, -4.2], [11, -1.6], [10.8, 2.6], [13.4, 4.7]],
  roadW: 1.7,
  lamps: [7, 13, 19, 25, 31, 37],
  props: [
    ["house", -3.2, -1.2, 0.3, 1, "red"], ["house", 0.8, -4.3, -0.2, 1, "slate"], ["house", 6.9, 2.9, 0.9, 1, "thatch"], ["house", -10.6, 2.6, -0.4, 1, "slate"],
    ["house", 9.9, -6.4, 0.2, 1, "red"], ["house", -6.5, -7.1, -0.1, 1, "thatch"], ["house", 2.6, 7.7, 0.1, 1, "red"],
    ["hall", 16.2, 6.4, -2.07, 1], ["windmill", -11.6, -1.1, 0.5, 1], ["well", -1.0, 1.7, 0, 1], ["pond", -8.4, 6.4, 0, 1],
    ["stall", 4.9, 4.7, 0.3, 1, 0xd84a3a], ["stall", 6.5, 6.1, -0.3, 1, 0x3d8bff], ["cart", 8.6, 5.4, 0.6, 1],
    ["hay", -10.4, -2.7, 0, 1], ["hay", -12.3, 1.2, 0.6, 1], ["barrels", 5.5, 1.3, 0, 1], ["crates", -2.0, -3.4, 0.4, 1], ["barrels", 11.8, -4.4, 0, 1],
    ["fence", -1.5, -5.6, 0.1, 1], ["fence", 0.9, -6.6, 0.1, 1], ["fence", -11.4, 4.7, -0.2, 1], ["fence", -13.6, 5.1, -0.2, 1],
    ["tree", -12.4, -7.1, 0, 1.1], ["pine", 12.6, -7.6, 0, 1.1], ["tree", 4.6, -7.4, 0, 1], ["pine", -4.4, 7.7, 0, 1], ["tree", 9, 7.6, 0, 1.15],
    ["tree", 12.6, -3.4, 0, 0.9], ["pine", -0.6, 6.9, 0, 0.85], ["tree", -6.0, -4.2, 0, 0.9], ["pine", 3.3, -2.4, 0, 0.8],
    ["bush", -4.8, 1.0, 0, 1], ["bush", 2.3, 1.6, 0, 0.9], ["bush", 8.8, -1.9, 0, 1], ["bush", -8.9, -6.2, 0, 1], ["bush", 12.3, 0.8, 0, 0.9],
    ["rock", -2.5, 3.0, 0, 1], ["rock", 4.4, -5.6, 0.7, 1.2], ["rock", -12.1, -3.6, 0, 0.9], ["rock", 11.6, 6.6, 0, 1],
    ["arch", -15.8, -5.1, 1.57, 1],
    ["field", -1.4, -7.4, 0.1, 1], ["field", -12.4, 6.3, -0.2, 1],
    ["flowers", -2.0, 2.6, 0, 1], ["flowers", 3.1, 3.0, 0, 1], ["flowers", -9.1, 0.6, 0, 1], ["flowers", 9.3, 1.1, 0, 1], ["flowers", -5.6, 5.9, 0, 1],
    ["flowers", 6.2, -1.6, 0, 1], ["flowers", -7.4, -1.6, 0, 1],
  ],
  // wave n (1-based): [enemy, count, seconds between]
  wave: n => {
    const g = [["mudling", 5 + n * 2, 0.75]];
    if (n >= 3) g.push(["crow", 2 + n, 0.45]);
    if (n >= 5) g.push(["golem", Math.floor((n - 3) / 2), 1.6]);
    if (n === 10) g.push(["golem", 4, 1.0]); // was 6: the rush outdid the waves after it
    if (n === 15) g.push(["scarecrow", 1, 0]);
    return g;
  },
}];
TD.MAP = {}; TD.MAPS.forEach(m => { TD.MAP[m.id] = m; });
TD.label = key => { const [m, d] = key.split(":"); return `${TD.MAP[m] ? TD.MAP[m].name : m} on ${TD.DIFF[d] ? TD.DIFF[d].name : d}`; };

// the road smoothed through its control points (Catmull-Rom), as a fine polyline with distances along it
function cr(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return [0, 1].map(i => 0.5 * (2 * p1[i] + (p2[i] - p0[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (3 * p1[i] - p0[i] - 3 * p2[i] + p3[i]) * t3));
}
function prep(map) {
  if (map.pts) return map;
  const P = map.road, pts = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 14; k++) pts.push(cr(p0, p1, p2, p3, k / 14));
  }
  pts.push(P[P.length - 1].slice());
  map.pts = pts; map.cum = [0];
  for (let i = 1; i < pts.length; i++) map.cum.push(map.cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  map.len = map.cum[map.cum.length - 1];
  // lamps stand beside the road, sides alternating
  map.all = map.props.slice();
  (map.lamps || []).forEach((d, i) => {
    const [x, z, , dx, dz] = TD.posAt(map, d), s = i % 2 ? 1 : -1, off = map.roadW / 2 + 0.45;
    map.all.push(["lamp", x - dz * off * s, z + dx * off * s, 0, 1]);
  });
  map.blockers = map.all.filter(p => TD.FOOT[p[0]]);
  return map;
}
TD.prep = prep;
// where something d along the road stands: x, z, facing, and the road's direction
TD.posAt = (map, d) => {
  const c = map.cum, n = c.length;
  if (d <= 0) d = 0;
  if (d >= map.len) d = map.len - 1e-6;
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (c[mid] <= d) lo = mid; else hi = mid; }
  const a = map.pts[lo], b = map.pts[hi], L = c[hi] - c[lo] || 1, k = (d - c[lo]) / L, dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L;
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(dx, dz), dx, dz];
};
TD.roadDist = (map, x, z) => {
  let best = Infinity;
  const P = map.pts;
  for (let i = 1; i < P.length; i++) {
    const ax = P[i - 1][0], az = P[i - 1][1], bx = P[i][0] - ax, bz = P[i][1] - az, L2 = bx * bx + bz * bz;
    const t = L2 ? Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / L2)) : 0;
    best = Math.min(best, Math.hypot(x - ax - bx * t, z - az - bz * t));
  }
  return best;
};
// does a footprint of radius r at x, z overlap this prop?
function hits(p, x, z, r) {
  const [kind, px, pz, rot = 0, sc = 1] = p, f = TD.FOOT[kind];
  if (f[0] === "circle") return Math.hypot(x - px, z - pz) < f[1] * sc + r;
  const c = Math.cos(-rot), s = Math.sin(-rot), lx = (x - px) * c - (z - pz) * s, lz = (x - px) * s + (z - pz) * c;
  return Math.abs(lx) < (f[1] * sc) / 2 + r && Math.abs(lz) < (f[2] * sc) / 2 + r;
}

// ---- a match ----
// team: up to 6 of the player's units. Each slot keeps the unit's stats as they were when the match began.
TD.newMatch = (mapId, diffId, team) => {
  // (30 Oct) or the map and difficulty themselves (the Endless tower builds its own each week, tdtower.js)
  const map = prep(typeof mapId === "object" ? mapId : TD.MAP[mapId]), diff = typeof diffId === "object" ? diffId : TD.DIFF[diffId];
  return {
    map, diff, t: 0, wave: 0, paid: 0, cash: Math.round(map.cash * diff.cash * (map.cashK || 1) * (AF.G && AF.G.S ? 1 + AF.G.star("tdCash") : 1)), lives: map.lives, state: "build", autoNext: false, nextAt: 0,
    // (31 Oct) a fighter's upgrades grow with the map's cash (they didn't, so harder maps maxed everything by wave 9)
    team: team.map(u => { const s = TD.statsOf(u); if (s.kind === "farm") s.cost = Math.round((s.cost * diff.cash * (map.cashK || 1)) / 50) * 50; s.upK = s.kind === "farm" ? 1 : (map.tower ? TD.UP.towerK : TD.UP.fightK * (map.upK || 1)) * diff.cash * (map.cashK || 1); return { u, s, placed: 0 }; }), units: [], enemies: [], proj: [], fields: [], runners: [], queue: [], ev: [], id: 1, kills: 0, leaks: 0,
  };
};
// "" when a unit can stand at x, z; otherwise why not
TD.canPlace = (M, x, z, skip) => {
  const map = M.map, [x0, x1, z0, z1] = map.bounds, r = TD.UNIT_R;
  if (x < x0 + r || x > x1 - r || z < z0 + r || z > z1 - r) return "edge";
  if (TD.roadDist(map, x, z) < map.roadW / 2 + r) return "road";
  if (map.pads && !map.pads.some(p => Math.hypot(x - p[0], z - p[1]) < p[2] - r * 0.6)) return "void";
  if (map.blockers.some(p => hits(p, x, z, r))) return "blocked";
  if (M.units.some(p => p !== skip && Math.hypot(p.x - x, p.z - z) < TD.GAP)) return "crowded";
  return "";
};
TD.place = (M, slot, x, z) => {
  const t = M.team[slot]; if (!t) return { err: "slot" };
  if (M.state === "won" || M.state === "lost") return { err: "over" };
  const why = TD.canPlace(M, x, z); if (why) return { err: why };
  if (t.placed >= TD.capOf(t)) return { err: "cap" };
  if (M.cash < t.s.cost) return { err: "cash", need: t.s.cost };
  M.cash -= t.s.cost; t.placed++;
  const p = { id: M.id++, slot, u: t.u, s: t.s, x, z, lv: 0, spent: t.s.cost, cd: 0.3, mode: TD.MODES.includes(t.u.tm) ? t.u.tm : "first", dealt: 0, face: 0 };
  M.units.push(p);
  M.ev.push({ t: "place", p });
  return { ok: true, p };
};
TD.upgrade = (M, p) => {
  const c = TD.upCost(p); if (!c) return { err: "max" };
  if (M.cash < c) return { err: "cash", need: c };
  M.cash -= c; p.spent += c; p.lv++;
  M.ev.push({ t: "upgrade", p });
  return { ok: true };
};
TD.sell = (M, p) => {
  const v = TD.sellValue(p);
  M.cash += v; M.units = M.units.filter(o => o !== p); M.team[p.slot].placed--;
  M.ev.push({ t: "sell", p, v });
  return v;
};
// the next wave can be called once everything in the current one is out; calling it early pays the cleared-wave
// bonus now instead of when the road is empty
TD.canCall = M => M.state === "build" || (M.state === "wave" && !M.queue.length && M.wave < M.map.waves);
TD.bonus = (M, n) => Math.round((200 + 50 * n) * M.diff.cash * (M.map.cashK || 1));
TD.callWave = M => {
  if (!TD.canCall(M)) return false;
  if (M.paid < M.wave) { M.paid = M.wave; const b = TD.bonus(M, M.wave); M.cash += b; M.ev.push({ t: "bonus", n: M.wave, cash: b }); TD.payFarms(M); }
  M.wave++; M.state = "wave";
  let at = M.t + 0.4;
  for (const [type, n, gap] of M.map.wave(M.wave)) {
    for (let i = 0; i < n; i++) { M.queue.push({ type, at }); at += gap; }
    at += 1.2;
  }
  M.queue.sort((a, b) => a.at - b.at);
  M.ev.push({ t: "wave", n: M.wave });
  if (TD.G) TD.G.wave(M);
  return true;
};
function spawn(M, q) {
  const d = M.map.tower ? TD.TOWER.def(M, q.type) : TD.ENEMIES[q.type], hp = d.hp * TD.waveHp(M, d) * M.diff.hp * (M.map.hpK || 1);
  M.enemies.push({ id: M.id++, type: q.type, def: d, hp, max: hp, d: 0, off: (Math.random() - 0.5) * 0.7, speed: d.speed * M.diff.speed * (0.95 + Math.random() * 0.1),
    x: 0, z: 0, face: 0, wave: M.wave });
}
// how: what the damage is when it isn't a plain hit (a share along Tsumugi's thread, held damage landing...)
function hurt(M, p, e, dmg, how) {
  if (e.hp <= 0 || (p.s && !TD.can(p, e))) return;
  if (TD.G && (dmg = TD.G.before(M, p, e, dmg, how)) <= 0) return;
  const real = Math.min(e.hp, dmg * (1 - e.def.armor));
  e.hp -= real; p.dealt += real;
  if (TD.G && real > 0) TD.G.after(M, p, e, real, how);
}
// the conditions an attack leaves on what it hits (st = the attack's numbers, atk = the hit's damage)
// (29 Oct) attacks come about 1.7x less often since the slow-down, so what they leave lasts longer to match: slows and
// burns x1.5, stuns x1.3, knockback x1.6
const COND = { slow: 1.5, dot: 1.5, stun: 1.3, knock: 1.6 };
function afflict(M, p, e, st, atk) {
  if (e.hp <= 0 || !st) return;
  const boss = e.def.boss;
  if (st.slow) { const k = st.slow[0] * (boss ? 0.6 : 1); e.slowK = Math.max(e.slowT > 0 ? e.slowK : 0, k); e.slowT = Math.max(e.slowT || 0, st.slow[1] * COND.slow); e.slowP = p; }
  if (st.stun) e.stunT = Math.max(e.stunT || 0, st.stun * COND.stun * (boss ? 0.3 : 1));
  if (st.dot) { const d = atk * st.dot[0]; if (!(e.dotT > 0) || d >= e.dotD) { e.dotD = d; e.dotP = p; } e.dotT = Math.max(e.dotT || 0, st.dot[1] * COND.dot); }
  if (st.knock) e.d = Math.max(0, e.d - st.knock * COND.knock * (boss ? 0.25 : 1));
}
function inRange(p, e, rng) { const dx = e.x - p.x, dz = e.z - p.z; return dx * dx + dz * dz <= rng * rng; }
// the enemies a unit can reach, best first by its mode: First = furthest along the road, Strongest = the toughest
// (most max hp; the furthest along among equals), Closest = nearest the unit
TD.MODES = ["first", "strong", "close"];
const better = (p, a, b) => p.mode === "strong" ? (a.max !== b.max ? a.max > b.max : a.d > b.d)
  : p.mode === "close" ? Math.hypot(a.x - p.x, a.z - p.z) < Math.hypot(b.x - p.x, b.z - p.z) : a.d > b.d;
function pick(M, p, rng, skip) {
  let best = null;
  for (const e of M.enemies) {
    if (e.hp <= 0 || !inRange(p, e, rng) || !TD.can(p, e) || (skip && skip.has(e))) continue;
    if (!best || better(p, e, best)) best = e;
  }
  return best;
}
// runners (29 Oct): every spa one sets off from the end of the road back toward the start (only while there is a
// ground enemy for it); every ground enemy it meets takes its hit and what its attack leaves (stun, slow, knock, burn,
// and a blast round it with aoe), until it has hit its number or reaches the start. Upgrade 4 adds a hit, and a
// signature runner is bigger: half again the damage and one more hit
function sendRunner(M, p, dt) {
  p.cd -= dt;
  if (p.cd > 0 || !M.enemies.some(e => e.hp > 0 && TD.can(p, e))) return;
  const L = TD.live(p), st = p.s.cfg;
  p.cd = L.spa; p.combo = (p.combo || 0) + 1; p.fired = true;
  const sig = !!(p.s.sig && p.combo % p.s.sig === 0), d = M.map.len - 0.2, [x, z, f] = TD.posAt(M.map, d);
  const r = { id: M.id++, p, d, x, z, face: f + Math.PI, dmg: L.atk * (sig ? 1.6 : 1), left: (st.hits || 1) + (p.lv >= 4 ? 1 : 0) + (sig ? 1 : 0), speed: st.speed || 4.2, hit: new Set(), sig };
  (M.runners = M.runners || []).push(r);
  M.ev.push({ t: "rspawn", p, r, x, z, sig });
}
function stepRunners(M, dt) {
  const R = M.runners || [];
  for (let i = R.length - 1; i >= 0; i--) {
    // stunSig: only the signature runner stuns (29 Oct, "only gaiadons 3rd big boulder should stun"); (30 Oct, "it should
    // just stop them for a second"): for stunSig seconds exactly, and an enemy it stopped can't be stopped by one again
    // for 3 s after, so several of them can't hold the road still
    const r = R[i], cfg = r.p.s.cfg, stopper = r.sig && cfg.stunSig ? (r.stopSt = r.stopSt || Object.assign({}, cfg, { stun: cfg.stunSig / COND.stun })) : null;
    const stOf = e => { if (!stopper || M.t < (e.stopAt || -9)) return cfg; e.stopAt = M.t + cfg.stunSig + 3; return stopper; };
    r.d -= r.speed * dt;
    if (r.d <= 0) { R.splice(i, 1); M.ev.push({ t: "rend", p: r.p, r, x: r.x, z: r.z }); continue; }
    const [x, z, f] = TD.posAt(M.map, r.d); r.x = x; r.z = z; r.face = f + Math.PI;
    for (const e of M.enemies) {
      if (r.left <= 0) break;
      if (e.hp <= 0 || r.hit.has(e) || !TD.can(r.p, e) || Math.abs(e.d - r.d) > 0.5) continue;
      r.hit.add(e); r.left--;
      hurt(M, r.p, e, r.dmg); afflict(M, r.p, e, stOf(e), r.dmg);
      if (cfg.aoe) near(M, e.x, e.z, cfg.aoe * (r.sig ? 1.4 : 1), o => { if (o !== e) { hurt(M, r.p, o, r.dmg * 0.6); afflict(M, r.p, o, stOf(o), r.dmg); } }, r.p);
      M.ev.push({ t: "rhit", p: r.p, r, e, x: e.x, z: e.z, sig: r.sig });
    }
    if (r.left <= 0) { R.splice(i, 1); M.ev.push({ t: "rend", p: r.p, r, x: r.x, z: r.z }); }
  }
}
// every live enemy within r of x, z
function near(M, x, z, r, fn, p) { for (const o of M.enemies) if (o.hp > 0 && (!p || TD.can(p, o)) && Math.hypot(o.x - x, o.z - z) <= r) fn(o); }
// where an enemy will stand t seconds from now (for whatever lands later)
function lead(M, e, t) {
  const sp = e.stunT > 0 ? 0 : e.speed * (e.slowT > 0 ? 1 - e.slowK : 1);
  const [x, z, , dx, dz] = TD.posAt(M.map, Math.min(M.map.len - 0.01, e.d + sp * t));
  return [x - dz * e.off, z + dx * e.off];
}
// a straight shot from x, z along (dx, dz) for len, through up to `pierce` enemies
function line(M, p, x, z, dx, dz, len, st, dmg, sig) {
  M.proj.push({ p, line: true, x, z, ox: x, oz: z, dx, dz, d: 0, len, speed: st.speed || 13, dmg, pierce: (st.pierce || 1) + (sig ? 1 : 0), w: st.w || 0.45, hit: new Set(), kind: p.s.kind, life: 0, st, sig });
}
function fire(M, p, e, L) {
  const st = p.s.cfg || TD.STYLES[p.s.style], kind = p.s.kind || p.s.style;
  p.face = Math.atan2(e.x - p.x, e.z - p.z); p.fired = true;
  p.combo = (p.combo || 0) + 1; p.hand = !p.hand;
  // a signature attack every few (Legendary and up): half again the damage, and its own look
  const sig = !!(p.s.sig && p.combo % p.s.sig === 0), atk = L.atk; // (2 Nov: "all units should be balanced") a signature is its look, not extra damage
  M.ev.push({ t: "fire", p, e, sig });
  const dx0 = e.x - p.x, dz0 = e.z - p.z, l0 = Math.hypot(dx0, dz0) || 1, ux = dx0 / l0, uz = dz0 / l0;
  switch (kind) {
    case "melee": case "slash": case "combo": {
      hurt(M, p, e, atk); afflict(M, p, e, st, atk);
      const cl = st.cleave || 0.9, ck = st.cleaveK || 0.6;
      for (const o of M.enemies) if (o !== e && o.hp > 0 && TD.can(p, o) && Math.hypot(o.x - e.x, o.z - e.z) <= cl) { hurt(M, p, o, atk * ck); afflict(M, p, o, st, atk); }
      M.ev.push({ t: "melee", p, x: e.x, z: e.z, n: p.combo, sig });
      // a combo sends a crescent wave on through the line every few swings
      if (st.wave && p.combo % st.every === 0) {
        const W = st.wave, len = W.len + L.rng - st.rng;
        M.proj.push({ p, wave: true, x: p.x, z: p.z, dx: ux, dz: uz, d: 0, len, w: W.w, speed: W.speed, dmg: atk * W.k, hit: new Set(), life: 0, st, sig });
        M.ev.push({ t: "swell", p, x: p.x, z: p.z, dx: ux, dz: uz, len, speed: W.speed, sig });
      }
      break;
    }
    case "nova": case "spin": case "stop": {
      const hits = [];
      near(M, p.x, p.z, L.rng, o => { hurt(M, p, o, atk); afflict(M, p, o, st, atk); hits.push(o); }, p);
      M.ev.push({ t: "nova", p, r: L.rng, hits, sig });
      break;
    }
    case "chain": {
      const hit = [e], pts = [[p.x, p.z], [e.x, e.z]];
      hurt(M, p, e, atk); afflict(M, p, e, st, atk);
      let last = e, dmg = atk;
      const jumps = (st.jumps || 3) + (sig ? 2 : 0);
      for (let j = 0; j < jumps; j++) {
        let nx = null, nd = st.hop || 2;
        for (const o of M.enemies) { if (o.hp <= 0 || hit.includes(o) || !TD.can(p, o)) continue; const dd = Math.hypot(o.x - last.x, o.z - last.z); if (dd <= nd) { nd = dd; nx = o; } }
        if (!nx) break;
        dmg *= st.fall || 0.75; hurt(M, p, nx, dmg); afflict(M, p, nx, st, dmg); hit.push(nx); pts.push([nx.x, nx.z]); last = nx;
      }
      M.ev.push({ t: "chain", p, pts, hit, sig });
      break;
    }
    case "snipe":
      hurt(M, p, e, atk); afflict(M, p, e, st, atk);
      M.ev.push({ t: "snipe", p, e, x: e.x, z: e.z, sig });
      break;
    case "slam": {
      const x = e.x, z = e.z, r = (st.aoe || 1.3) * (sig ? 1.3 : 1), hits = [];
      near(M, x, z, r, o => { hurt(M, p, o, atk); afflict(M, p, o, st, atk); hits.push(o); }, p);
      M.ev.push({ t: "slam", p, x, z, r, hits, sig });
      break;
    }
    case "dash": {
      const len = l0 + 0.9, w = st.w || 0.65, hits = [];
      for (const o of M.enemies) {
        if (o.hp <= 0 || !TD.can(p, o)) continue;
        const ox = o.x - p.x, oz = o.z - p.z, along = ox * ux + oz * uz;
        if (along < -0.2 || along > len || Math.abs(ox * uz - oz * ux) > w) continue;
        hurt(M, p, o, atk); afflict(M, p, o, st, atk); hits.push(o);
      }
      M.ev.push({ t: "dash", p, x0: p.x, z0: p.z, x1: p.x + ux * len, z1: p.z + uz * len, dx: ux, dz: uz, hits, sig });
      break;
    }
    case "pierce": line(M, p, p.x, p.z, ux, uz, st.edge || L.rng + 0.8, st, atk, sig); M.ev.push({ t: "launch", p, e, n: 1, sig }); break;
    case "spread": {
      const n = (st.n || 3) + (sig ? 2 : 0), fan = st.fan || 0.42, a0 = Math.atan2(ux, uz);
      for (let i = 0; i < n; i++) { const a = a0 + (n > 1 ? (i / (n - 1) - 0.5) * fan * 2 : 0); line(M, p, p.x, p.z, Math.sin(a), Math.cos(a), L.rng + 0.6, st, atk, sig); }
      M.ev.push({ t: "launch", p, e, n, sig });
      break;
    }
    case "tack": {
      const n = (st.n || 8) + (sig ? 4 : 0), a0 = Math.atan2(ux, uz);
      for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; line(M, p, p.x, p.z, Math.sin(a), Math.cos(a), L.rng + 0.3, st, atk, sig); }
      M.ev.push({ t: "launch", p, e, n, sig });
      break;
    }
    case "boomer":
      M.proj.push({ p, boomer: true, ox: p.x, oz: p.z, dx: ux, dz: uz, len: L.rng + 0.3, t: 0, dur: st.dur || 1, x: p.x, z: p.z, dmg: atk, w: (st.w || 0.55) * (sig ? 1.4 : 1), hit: new Set(), back: false, kind, life: 0, st, sig });
      M.ev.push({ t: "launch", p, e, n: 1, sig });
      break;
    case "seek": {
      const n = (st.n || 2) + (sig ? 2 : 0);
      for (let i = 0; i < n; i++) M.proj.push({ p, e, seek: true, x: p.x, z: p.z, sx: p.x, sz: p.z, tx: e.x, tz: e.z, speed: (st.speed || 10) * (0.9 + 0.2 * (i % 2)), dmg: atk, aoe: 0, kind, hand: i % 2 === 0, life: 0, st, i, sig });
      M.ev.push({ t: "launch", p, e, n, sig });
      break;
    }
    case "mortar": case "strike": case "volley": {
      const delay = st.delay || 0.4, [x, z] = lead(M, e, delay), r = (st.aoe || 1.3) * (sig ? 1.3 : 1);
      M.proj.push({ p, sky: true, x, z, land: M.t + delay, delay, r, dmg: atk, kind, life: 0, st, sig });
      M.ev.push({ t: "aim", p, x, z, r, delay, sig });
      break;
    }
    case "field": case "hole": {
      const [x, z] = lead(M, e, 0.3), r = (st.r || 1.2) * (sig ? 1.3 : 1), dur = (st.dur || 3) * (sig ? 1.3 : 1);
      M.fields.push({ p, x, z, r, t: dur, dur, tick: st.tick || 0.5, acc: 0, dmg: atk, st, kind, pull: kind === "hole" ? st.pull || 0.7 : 0, id: M.id++, sig });
      M.ev.push({ t: "field", p, x, z, r, dur, sig });
      break;
    }
    default:
      // rapid fire is a burst of n: the shots set off one behind the other, so they land in quick succession
      if (kind === "rapid") { for (let k = 0; k < (st.n || 3); k++) M.proj.push({ p, e, x: p.x - ux * k * 0.75, z: p.z - uz * k * 0.75, sx: p.x, sz: p.z, tx: e.x, tz: e.z, speed: st.speed || 20, dmg: atk, aoe: 0, kind, hand: k % 2 ? !p.hand : p.hand, life: 0, st, sig }); break; }
      // shot and lob (and the plain styles): a homing shot that bursts where it lands if it has a blast
      M.proj.push({ p, e, x: p.x, z: p.z, sx: p.x, sz: p.z, tx: e.x, tz: e.z, speed: st.speed || 13, dmg: atk, aoe: (st.aoe || 0) * (sig ? 1.3 : 1), kind, hand: p.hand, life: 0, st, sig });
  }
  if (TD.G && p.s.gate) TD.G.fire(M, p, e, L, atk);
}
// a held beam: stays on one enemy while it can, ticking harder the longer it holds
function beam(M, p, dt) {
  const L = TD.live(p), st = p.s.cfg;
  let e = p.beamE;
  // it keeps its enemy between ticks; on each tick (and at once when the mode changes) it moves to the mode's pick,
  // keeping half the ramp it built
  if (!e || e.hp <= 0 || !inRange(p, e, L.rng) || p.beamM !== p.mode || p.cd - dt <= 0) {
    e = pick(M, p, L.rng);
    if (e !== p.beamE) p.beamT = p.beamE && p.beamE.hp > 0 && e ? (p.beamT || 0) * 0.5 : 0;
    p.beamE = e; p.beamM = p.mode;
  }
  if (!e) { p.beamT = 0; p.cd = 0; return; }
  p.face = Math.atan2(e.x - p.x, e.z - p.z); p.fired = true;
  p.beamT = (p.beamT || 0) + dt; p.cd -= dt;
  if (p.cd > 0) return;
  p.cd = L.spa; p.combo = (p.combo || 0) + 1;
  // beams tick five times a second, so their signature comes every few seconds and lands harder
  const sig = !!(p.s.sig && p.combo % (p.s.sig * 2) === 0);
  const dmg = L.atk * (1 + st.ramp * Math.min(1, p.beamT / st.rampT)) * (sig ? 4 : 1);
  hurt(M, p, e, dmg); afflict(M, p, e, st, dmg);
  M.ev.push({ t: "beam", p, e, sig });
}
// summoned pets: each goes after the enemy nearest it that its owner can reach, and hits it up close
function pets(M, p, dt) {
  const L = TD.live(p), st = p.s.cfg, n = (st.n || 1) + (p.lv >= 4 ? 1 : 0);
  if (!p.pets) p.pets = [];
  while (p.pets.length < n) p.pets.push({ x: p.x, z: p.z, e: null, cd: 0.2 * p.pets.length, face: 0, id: M.id++ });
  // each pet takes the owner's best pick that no other pet has, or shares the best one when there are fewer enemies
  const taken = new Set();
  for (const m of p.pets) {
    m.cd -= dt;
    if (!m.e || m.e.hp <= 0 || !inRange(p, m.e, L.rng + 0.5) || m.mode !== p.mode) { m.e = pick(M, p, L.rng, taken) || pick(M, p, L.rng); m.mode = p.mode; }
    if (m.e) taken.add(m.e);
    const tx = m.e ? m.e.x : p.x + Math.sin(m.id) * 0.7, tz = m.e ? m.e.z : p.z + Math.cos(m.id) * 0.7;
    const dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz), sp = (st.speed || 4.5) * dt;
    if (d > (m.e ? (st.reach || 0.7) * 0.8 : 0.05)) { const k = Math.min(1, sp / d); m.x += dx * k; m.z += dz * k; m.face = Math.atan2(dx, dz); }
    if (m.e && d <= (st.reach || 0.7) && m.cd <= 0) {
      m.cd = L.spa; p.combo = (p.combo || 0) + 1; p.face = Math.atan2(m.e.x - p.x, m.e.z - p.z); p.fired = true;
      const sig = !!(p.s.sig && p.combo % p.s.sig === 0), dmg = (L.atk / n) * (sig ? 1.6 : 1);
      hurt(M, p, m.e, dmg); afflict(M, p, m.e, st, dmg);
      M.ev.push({ t: "bite", p, m, e: m.e, x: m.e.x, z: m.e.z, sig });
    }
  }
}
TD.step = (M, dt) => {
  if (M.state === "won" || M.state === "lost") return;
  M.t += dt;
  if (!M.fields) M.fields = [];
  while (M.queue.length && M.queue[0].at <= M.t) spawn(M, M.queue.shift());
  if (TD.G) TD.G.step(M, dt);
  if (M.state === "build" && M.autoNext && M.wave > 0 && M.t >= M.nextAt) TD.callWave(M);
  // walk (burning first, stunned enemies stand still, slowed ones walk slower)
  for (const e of M.enemies) {
    if (e.hp <= 0) continue;
    if (e.dotT > 0) { e.dotT -= dt; hurt(M, e.dotP, e, e.dotD * dt); if (e.hp <= 0) continue; }
    if (e.slowT > 0) e.slowT -= dt;
    if (e.stunT > 0) e.stunT -= dt;
    // (30 Oct) Kagero's haze turns one round to walk back the way it came; Vidar slows whatever comes near him
    else if (e.confT > 0) { e.confT -= dt; e.d = Math.max(0, e.d - e.speed * 0.8 * dt); }
    else e.d += e.speed * (1 - Math.max(e.slowT > 0 ? e.slowK : 0, e.aSlow || 0)) * dt;
    if (e.d >= M.map.len) {
      e.hp = 0; e.leaked = true; M.leaks++;
      M.lives = Math.max(0, M.lives - e.def.lives);
      M.ev.push({ t: "leak", e });
      continue;
    }
    const [x, z, face, dx, dz] = TD.posAt(M.map, e.d);
    e.x = x - dz * e.off; e.z = z + dx * e.off; e.face = face;
  }
  // fields grind what stands in them; black holes drag it back down the road (only the strongest pull on an enemy
  // counts; brutes and bosses lose at most 60% of their speed to it, so they always keep coming)
  const pulls = new Map();
  for (let i = M.fields.length - 1; i >= 0; i--) {
    const f = M.fields[i];
    f.t -= dt; f.acc += dt;
    if (f.pull) for (const o of M.enemies) if (o.hp > 0 && TD.can(f.p, o) && Math.hypot(o.x - f.x, o.z - f.z) <= f.r) pulls.set(o, Math.max(pulls.get(o) || 0, f.pull * (o.def.boss ? 0.3 : 1)));
    while (f.acc >= f.tick) { f.acc -= f.tick; near(M, f.x, f.z, f.r, o => { hurt(M, f.p, o, f.dmg); afflict(M, f.p, o, f.st, f.dmg); }, f.p); }
    if (f.t <= 0) { M.fields.splice(i, 1); M.ev.push({ t: "fieldEnd", p: f.p, f }); }
  }
  for (const [o, k] of pulls) o.d = Math.max(0, o.d - (o.def.boss || o.def.lives >= 3 ? Math.min(k, o.speed * 0.6) : k) * dt);
  // attack
  for (const p of M.units) {
    const kind = p.s.kind;
    if (kind === "farm" || p.hold > 0) continue;
    if (kind === "runner") { sendRunner(M, p, dt); continue; }
    if (kind === "summon") { pets(M, p, dt); continue; }
    if (kind === "beam") { beam(M, p, dt); continue; }
    p.cd -= dt;
    if (p.cd > 0) continue;
    const L = TD.live(p);
    // orbiting blades cut whatever comes inside their ring, on a fast tick
    if (kind === "orbit") {
      const hits = [];
      near(M, p.x, p.z, L.rng, o => { hurt(M, p, o, L.atk); afflict(M, p, o, p.s.cfg, L.atk); hits.push(o); }, p);
      p.cd = L.spa;
      if (hits.length) {
        p.combo = (p.combo || 0) + 1; p.face = Math.atan2(hits[0].x - p.x, hits[0].z - p.z); p.fired = true;
        const sig = !!(p.s.sig && p.combo % (p.s.sig * 2) === 0);
        if (sig) for (const o of hits) hurt(M, p, o, L.atk * 2.4);
        M.ev.push({ t: "orbit", p, hits, sig });
      }
      continue;
    }
    const e = pick(M, p, L.rng);
    if (!e) { p.cd = 0; continue; }
    fire(M, p, e, L); p.cd = L.spa;
  }
  // runners on their way back down the road
  stepRunners(M, dt);
  // everything in flight
  for (let i = M.proj.length - 1; i >= 0; i--) {
    const s = M.proj[i];
    s.life += dt;
    // a crescent wave: straight on, cutting everything it passes once
    if (s.wave) {
      s.d += s.speed * dt; s.x = s.p.x + s.dx * s.d; s.z = s.p.z + s.dz * s.d;
      for (const o of M.enemies) {
        if (o.hp <= 0 || s.hit.has(o) || !TD.can(s.p, o)) continue;
        const ox = o.x - s.p.x, oz = o.z - s.p.z, along = ox * s.dx + oz * s.dz;
        if (along < s.d - 0.6 || along > s.d + 0.2) continue;
        if (Math.abs(ox * s.dz - oz * s.dx) <= s.w) { hurt(M, s.p, o, s.dmg); afflict(M, s.p, o, s.st, s.dmg); s.hit.add(o); M.ev.push({ t: "cut", p: s.p, x: o.x, z: o.z }); }
      }
      if (s.d >= s.len) M.proj.splice(i, 1);
      continue;
    }
    // from the sky: lands when its time comes, hitting everything under it
    if (s.sky) {
      if (M.t >= s.land) {
        M.proj.splice(i, 1);
        const hits = [];
        near(M, s.x, s.z, s.r, o => { hurt(M, s.p, o, s.dmg); afflict(M, s.p, o, s.st, s.dmg); hits.push(o); }, s.p);
        M.ev.push({ t: "land", p: s.p, x: s.x, z: s.z, r: s.r, hits, sig: s.sig });
      }
      continue;
    }
    // straight on, through up to `pierce` enemies
    if (s.line) {
      const step = s.speed * dt;
      s.d += step; s.x += s.dx * step; s.z += s.dz * step;
      for (const o of M.enemies) {
        if (o.hp <= 0 || s.hit.has(o) || !TD.can(s.p, o) || Math.hypot(o.x - s.x, o.z - s.z) > s.w + 0.15) continue;
        hurt(M, s.p, o, s.dmg); afflict(M, s.p, o, s.st, s.dmg); s.hit.add(o); s.pierce--;
        M.ev.push({ t: "hit", p: s.p, x: o.x, z: o.z, s });
        if (s.pierce <= 0) break;
      }
      if (s.pierce <= 0 || s.d >= s.len) { M.proj.splice(i, 1); M.ev.push({ t: "lineEnd", p: s.p, x: s.x, z: s.z, s }); }
      continue;
    }
    // out on a curve and back, hitting each enemy once each way
    if (s.boomer) {
      s.t += dt;
      const u = Math.min(1, s.t / s.dur), f = Math.sin(Math.PI * u), lat = Math.sin(2 * Math.PI * u) * 0.9;
      if (u >= 0.5 && !s.back) { s.back = true; s.hit.clear(); }
      s.x = s.ox + s.dx * s.len * f + s.dz * lat; s.z = s.oz + s.dz * s.len * f - s.dx * lat;
      for (const o of M.enemies) {
        if (o.hp <= 0 || s.hit.has(o) || !TD.can(s.p, o) || Math.hypot(o.x - s.x, o.z - s.z) > s.w + 0.15) continue;
        hurt(M, s.p, o, s.dmg); afflict(M, s.p, o, s.st, s.dmg); s.hit.add(o);
        M.ev.push({ t: "hit", p: s.p, x: o.x, z: o.z, s });
      }
      if (u >= 1) M.proj.splice(i, 1);
      continue;
    }
    // homing; a seeker finds a new target when its own falls
    if (s.e.hp > 0) { s.tx = s.e.x; s.tz = s.e.z; }
    else if (s.seek && !s.lost) {
      let best = null, bd = 3;
      for (const o of M.enemies) { if (o.hp <= 0 || !TD.can(s.p, o)) continue; const d = Math.hypot(o.x - s.x, o.z - s.z); if (d < bd) { bd = d; best = o; } }
      if (best) s.e = best; else s.lost = true;
    }
    if (s.seek && s.life > 4) { M.proj.splice(i, 1); continue; }
    const dx = s.tx - s.x, dz = s.tz - s.z, dd = Math.hypot(dx, dz), step = s.speed * dt;
    if (dd > step) { s.x += (dx / dd) * step; s.z += (dz / dd) * step; continue; }
    s.x = s.tx; s.z = s.tz;
    M.proj.splice(i, 1);
    if (s.aoe) {
      const hits = [];
      near(M, s.x, s.z, s.aoe, o => { hurt(M, s.p, o, s.dmg); afflict(M, s.p, o, s.st, s.dmg); hits.push(o); }, s.p);
      M.ev.push({ t: "boom", p: s.p, x: s.x, z: s.z, r: s.aoe, hits, s, sig: s.sig });
    } else {
      if (s.e.hp > 0) { hurt(M, s.p, s.e, s.dmg); afflict(M, s.p, s.e, s.st, s.dmg); }
      M.ev.push({ t: "hit", p: s.p, x: s.x, z: s.z, s, sig: s.sig });
      if (TD.G && s.p.s && s.p.s.gate) TD.G.shot(M, s);
    }
  }
  // the fallen pay out
  for (let i = M.enemies.length - 1; i >= 0; i--) {
    const e = M.enemies[i];
    if (e.hp > 0) continue;
    M.enemies.splice(i, 1);
    if (!e.leaked) { const c = Math.round(e.def.cash * M.diff.cash * (M.map.cashK || 1)); M.cash += c; M.kills++; M.ev.push({ t: "kill", e, cash: c }); if (TD.G) TD.G.kill(M, e); }
  }
  if (M.lives <= 0) { M.state = "lost"; M.ev.push({ t: "lost" }); return; }
  if (M.state === "wave" && !M.queue.length && !M.enemies.length) {
    if (M.paid < M.wave) { M.paid = M.wave; const b = TD.bonus(M, M.wave); M.cash += b; M.ev.push({ t: "bonus", n: M.wave, cash: b }); TD.payFarms(M); }
    if (M.wave >= M.map.waves) { M.state = "won"; M.ev.push({ t: "won" }); return; }
    M.state = "build"; M.nextAt = M.t + 8;
    M.ev.push({ t: "clear", n: M.wave });
    if (M.map.tower && TD.TOWER.onFloor) TD.TOWER.onFloor(M, M.wave); // (30 Oct) a tower floor pays as it's cleared
  }
};
// (30 Oct) what tdgate.js builds the gate units' rules from
TD._ = { hurt, afflict, near, lead, line, pick, inRange };
})();
