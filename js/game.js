/* Aura Farm game state: units, summons with pity, trait rerolls with pity, levels, slots, collecting,
   saving to localStorage (every access in try/catch) and offline earnings. No DOM in here. */
(function () {
const AF = window.AF, E = AF.ECON;
const KEY = "picnicpatrol.farm.v1", BACKUP = "picnicpatrol.farm.v1.bak";
const now = () => Date.now();

function fresh() {
  return {
    v: 1, yen: E.startYen, pending: 0, lifetime: 0, slots: E.slotsStart, nextUid: 1, units: [], gate: "ember",
    pity: { mythic: 0, secret: 0, eclipse: 0, astral: 0, singular: 0 },
    stats: { summons: 0, rerolls: 0, collected: 0, upgrades: 0, maxRate: 0, maxLevel: 1, maxStars: 1, bestRank: -1, bestTier: -1,
      shinies: 0, played: 0, slotsMax: E.slotsStart, bestPull: null, surges: 0 },
    seen: {}, lastSeen: now(), created: now(), runStart: now(),
    shards: 0, asc: 0, reb: 0, starlight: 0, smap: {}, up: {}, quests: {}, hist: [],
    td: { team: [], clears: {}, map: "village", diff: "normal", autoNext: false, mode: "worlds", tower: { best: 0, week: -1, weekBest: 0, runs: 0 } },
    opts: { sound: true, volume: 0.7, reduced: false, protect: true, stopAt: 4, stopMult: 100, autoSell: {}, lab: null,
      autoCollect: true, autoEquip: true, autoLevel: true, autoStar: true, sumStop: 4 },
  };
}

const G = AF.G = { S: null, offline: null };
G.def = u => AF.UNIT[u.k];
G.rar = u => AF.RAR[AF.UNIT[u.k].rarity];
G.trait = u => AF.traitOf(u);
G.tier = u => (u.tr ? AF.TRAIT[u.tr].tier : -1);
G.upLv = id => G.S.up[id] || 0;
G.has = id => G.upLv(id) > 0;
// different units in the Index (Collector); counted again only when a new one turns up
G.found = () => (G._found != null ? G._found : (G._found = Object.keys(G.S.seen).filter(k => AF.UNIT[k]).length));
// Momentum: 4% for every minute of this run, capped at 40% per level
G.momentum = () => Math.min(0.04 * Math.max(0, now() - (G.S.runStart || now())) / 60000, 0.4 * G.upLv("momentum"));
// (30 Oct) the star map: what the stars bought add up to, by kind (data.js AF.STARMAP fx)
// (30 Oct) G.star also adds worn Relics and the Rebirth shop's boosts (data.js upgrade boost); G.starLit is the stars alone
// (1 Nov) S.smap[id] is how many times a star counts: 1 lit, up to 1 + AF.BRIGHT.max brightened
G.starLv = id => (G.S.smap && +G.S.smap[id]) || 0;
const starFx = (id, f) => AF.SMAP[id].fx[f] * (AF.BRIGHT.skip.includes(f) ? 1 : Math.max(1, G.starLv(id)));
G.starLit = k => {
  if (!G._lit) { G._lit = {}; for (const id in G.S.smap || {}) { const n = AF.SMAP[id]; if (n) for (const f in n.fx) G._lit[f] = (G._lit[f] || 0) + starFx(id, f); } }
  return G._lit[k] || 0;
};
G.star = k => {
  if (!G._star) {
    G._lit = null; G._star = {};
    const add = (f, v) => { G._star[f] = (G._star[f] || 0) + v; };
    for (const id in G.S.smap || {}) { const n = AF.SMAP[id]; if (n) for (const f in n.fx) add(f, starFx(id, f)); }
    for (const x of G.relicsWorn()) add(AF.RELIC.KIND[x.k].key, G.relicVal(x));
    for (const d of AF.UPGRADES) if (d.boost && G.upLv(d.id)) for (const f in d.boost) add(f, d.boost[f] * G.upLv(d.id));
  }
  return G._star[k] || 0;
};
// an ascension's income bonus; Afterglow keeps some of it through a Rebirth
G.ascMult = () => 1 + (AF.ASCEND.incomePer + G.star("ascPer")) * (G.S.asc + (G.S.reb ? G.star("keepAsc") : 0));
// Defense: clears by "map:difficulty"; every first clear adds AF.TD_INCOME to all income
G.tdWon = key => ((G.S.td && G.S.td.clears[key]) || 0) > 0;
// (30 Oct, "if you complete something on a higher difficulty than what it asks for it should just give it to you"):
// a requirement is met by that world on that difficulty or any harder one (first-clear pay still reads G.tdWon)
G.tdClear = key => {
  const [m, d] = key.split(":"), D = AF.TD ? AF.TD.DIFFS : [], i = D.findIndex(x => x.id === d);
  return i < 0 ? G.tdWon(key) : D.slice(i).some(x => G.tdWon(m + ":" + x.id));
};
G.tdClears = () => (G.S.td ? Object.values(G.S.td.clears).filter(n => n > 0).length : 0);
G.tdMult = () => 1 + AF.TD_INCOME * G.tdClears();
G.globalMult = () => (1 + 0.25 * G.upLv("income")) * (1 + 0.25 * G.upLv("overflow")) * (1 + G.star("inc")) * G.ascMult() * (1 + 0.01 * G.upLv("collector") * G.found()) * (1 + G.momentum()) * G.tdMult() * Math.pow(2, G.upLv("flood"));
// Aura Surge: a short income boost you catch on screen; kept in memory only, so offline time never counts it
G.surge = { until: 0, mult: 2 };
G.boost = () => (now() < G.surge.until ? G.surge.mult : 1);
G.catchSurge = secs => { G.surge.until = Math.max(now(), G.surge.until) + secs * 1000; G.S.stats.surges = (G.S.stats.surges || 0) + 1; };
G.stars = u => u.st || 1;
// Star Forge raises the part of the star bonus above x1
G.starMult = st => 1 + (AF.STARS.mult[st - 1] - 1) * (1 + 0.2 * G.upLv("forge"));
G.capAt = st => AF.STARS.cap[st - 1] + 10 * G.upLv("limit");
G.cap = u => G.capAt(G.stars(u));
// (30 Oct) Evolution: what an evolved unit is drawn as, and what it earns (AF.EVO_INC) and deals in Defense (td.js)
AF.formKey = u => (u && u.ev && AF.UNIT[u.k + "@evo"] ? u.k + "@evo" : u && u.k);
// (31 Oct, "since he's evo his name should change"): a unit's name as the form it's drawn as
AF.nameOf = u => AF.UNIT[AF.formKey(u)].name;
AF.EVO_INC = 3; AF.EVO_TD = 2.5;
G.income = u => AF.UNIT[u.k].base * u.vr * AF.levelMult(u.lv) * (u.tr ? AF.traitOf(u).mult : 1) * (u.ev ? (AF.EVO_REQ[u.k] && AF.EVO_REQ[u.k].inc) || AF.EVO_INC : 1)
  * G.starMult(G.stars(u)) * (u.sh ? AF.SHINY.mult : 1) * G.globalMult() * G.boost();
G.luck = () => 1 + 0.1 * G.upLv("luck") + G.star("luck");
G.favor = () => 1 + 0.15 * G.upLv("favor") + G.star("favor");
G.shinyChance = () => AF.SHINY.chance * G.luck() * (1 + 0.25 * G.upLv("charm")) * (1 + G.star("shiny"));
// Trait Fortune scales the weight of Solar and better, Trait Mastery Eclipse and better; the Lab's odds table shows the result
// (29 Oct, Chris: "my odds are kinda too much, im getting singularity a ton with the double roll", then "this is perfect
// do this"): Trait Fortune and Trait Mastery stop at Zenith; Singularity and Infinity only get Twin Roll's second roll
// (1 in about 5,400 and 27,000 with it, was 723 and 3,613 with both upgrades maxed)
G.traitW = t => t.w * (t.tier >= 3 && t.tier < 6 ? 1 + 0.1 * G.upLv("tluck") + G.star("tluck") : 1) * (t.tier >= 4 && t.tier < 6 ? 1 + 0.15 * G.upLv("mastery") : 1);
G.offlineCap = () => (E.offlineCapHours + 4 * G.upLv("nap") + G.star("offline")) * 3600;
G.unit = uid => G.S.units.find(u => u.uid === uid);
G.rate = () => G.S.units.reduce((s, u) => s + (u.eq >= 0 ? G.income(u) : 0), 0);
G.slotsView = () => {
  const out = new Array(G.S.slots).fill(null);
  G.S.units.forEach(u => { if (u.eq >= 0 && u.eq < out.length) out[u.eq] = u; });
  return out;
};

// ---- obtaining ----
G.add = key => {
  const S = G.S;
  const u = { uid: S.nextUid++, k: key, lv: 1, vr: 1 + (Math.random() * 2 - 1) * E.variance, tr: null, eq: -1, lock: false, at: now(), rolls: 0, st: 1, sh: false };
  u.isNew = !S.seen[key];
  if (u.isNew) G._found = null;
  S.seen[key] = (S.seen[key] || 0) + 1;
  S.units.push(u);
  return u;
};
function notePull(u) {
  const st = G.S.stats, rank = AF.RAR[AF.UNIT[u.k].rarity].order;
  st.bestRank = Math.max(st.bestRank, rank);
  const score = rank * 2 + (u.sh ? 1 : 0);
  if (!st.bestPull || score > st.bestPull.score) st.bestPull = { k: u.k, sh: !!u.sh, score, at: now() };
}
function weighted(pairs) {
  const total = pairs.reduce((s, p) => s + p[1], 0);
  let r = Math.random() * total;
  for (const [k, w] of pairs) { if ((r -= w) < 0) return k; }
  return pairs[pairs.length - 1][0];
}
G.gateOpen = g => G.S.lifetime >= g.unlock && G.S.asc >= (g.asc || 0) && (G.S.reb || 0) >= (g.reb || 0) && (!g.td || G.tdClear(g.td));
function rollRarity(g) {
  const P = G.S.pity;
  P.mythic++; P.secret++;
  // Fortune (shard upgrade) scales the weight of Legendary and better, Divine Favor Divine and better on top
  const luck = G.luck(), fav = G.favor();
  // Polaris (star map) doubles the Absolute's share
  const abs = 1 + G.star("abs");
  let r = weighted(Object.entries(g.odds).filter(([, w]) => w > 0).map(([k, w]) => [k, AF.RAR[k].order >= 3 ? w * luck * (AF.RAR[k].order >= 6 ? fav : 1) * (k === "absolute" ? abs : 1) : w]));
  let rank = AF.RAR[r].order;
  if (rank < 5 && P.secret >= AF.SUMMON_PITY[1].at) { r = "secret"; rank = 5; }
  else if (rank < 4 && P.mythic >= AF.SUMMON_PITY[0].at) { r = "mythic"; rank = 4; }
  if (rank >= 4) P.mythic = 0;
  if (rank >= 5) P.secret = 0;
  return r;
}
G.autoSells = (r, sh) => !!(G.S.opts.autoSell || {})[sh ? r + ":sh" : r];
G.summonCost = (gid, n) => Math.ceil(AF.GATE[gid].cost * n * Math.pow(0.95, G.upLv("bargain")) * (1 - G.star("sumCost")));
// which units a gate can give for a rarity: a gate's own units (gate: "rift") take g.excl of the pulls of their rarity there
const pools = {};
function pickUnit(g, r) {
  const k = g.id + "|" + r;
  const p = pools[k] || (pools[k] = { own: AF.UNITS.filter(d => d.rarity === r && d.gate === g.id), all: AF.UNITS.filter(d => d.rarity === r && !d.gate) });
  // a rarity with no unit outside a gate (Absolute) is always the gate's own
  const list = p.own.length && (!p.all.length || Math.random() < (g.excl || 0)) ? p.own : p.all;
  return list[(Math.random() * list.length) | 0].key;
}
// (31 Oct, "there should be a backpack, like a 10k cap"): how many units you can hold
G.BAG = 10000;
G.bagRoom = () => Math.max(0, G.BAG - G.S.units.length);
G.summon = (gid, n) => {
  const S = G.S, g = AF.GATE[gid], cost = G.summonCost(gid, n);
  if (!G.gateOpen(g)) return { err: "locked" };
  if (S.units.length + n > G.BAG) return { err: "full", room: G.bagRoom() };
  if (S.yen < cost) return { err: "yen", need: cost };
  S.yen -= cost;
  const units = [], dbl = 0.03 * G.upLv("double");
  let extra = 0;
  // Lucky Double: a paid pull can bring one more unit free
  for (let i = 0; i < n + extra; i++) {
    if (i < n && dbl && Math.random() < dbl) extra++;
    const r = rollRarity(g);
    const u = G.add(pickUnit(g, r));
    if (Math.random() < G.shinyChance()) { u.sh = true; S.stats.shinies++; }
    notePull(u);
    // Auto sell (30 Oct): the rarities, and the shiny version of each, the player picked; never a unit's first copy
    if (G.autoSells(r, u.sh) && !u.isNew) { u.autoReleased = true; }
    units.push(u);
  }
  S.stats.summons += n + extra;
  const auto = units.filter(u => u.autoReleased);
  if (auto.length) u_release(auto.map(u => u.uid));
  // (30 Oct, auto summon lag) lay the Area out again only when a pulled unit beats the weakest placed one or a plot is
  // empty: otherwise nothing there would change, and a re-sort shuffles the world's figures for nothing
  if (G.has("autoEquip") && S.opts.autoEquip) {
    const placed = S.units.filter(u => u.eq >= 0), kept = units.filter(u => !u.autoReleased);
    const low = placed.length < S.slots ? -1 : Math.min(...placed.map(G.maxIncome));
    if (kept.some(u => G.maxIncome(u) > low)) G.equipBest();
  }
  return { units, cost, extra };
};

// ---- traits ----
G.twinRoll = () => G.has("twinRoll");
// (30 Oct) n Lab units rolling at once: with two, each rolls once unless Quadruplet Automation is owned
G.labTwin = n => G.twinRoll() && (n < 2 || G.has("quadAuto"));
G.rerollCost = u => Math.ceil(AF.rerollCost(AF.UNIT[u.k].rarity) * Math.pow(0.94, G.upLv("sense")));
function pickTier(tier) { return weighted(AF.TRAITS.filter(t => t.tier === tier).map(t => [t, t.w])); }
// (29 Oct, Chris: "3 singularities can get fused into an infinity"): the Singularity Forge. The unit getting Infinity
// counts its own Singularity first, a Double Singularity counts as two, and the rest come from the lowest-earning
// Singularity holders that aren't locked. forgePlan says who gives what without changing anything; forge does it
G.FORGE_NEED = 3;
G.forgePlan = uid => {
  const u = G.unit(uid); if (!u) return null;
  const sing = x => (x.tr === "singular" ? (x.dbl ? 2 : 1) : 0);
  const take = [];
  let need = G.FORGE_NEED;
  const own = Math.min(need, sing(u)); if (own) { take.push({ u, n: own }); need -= own; }
  const donors = G.S.units.filter(x => x !== u && !x.lock && sing(x)).sort((a, b) => G.income(a) - G.income(b));
  for (const x of donors) { if (!need) break; const n = Math.min(need, sing(x)); take.push({ u: x, n }); need -= n; }
  const have = sing(u) + donors.reduce((s, x) => s + sing(x), 0);
  return { u, take, have, ok: !need && u.tr !== "infinity" };
};
G.forge = uid => {
  const plan = G.forgePlan(uid);
  if (!plan || !plan.ok) return { err: plan && plan.u.tr === "infinity" ? "has" : "few", have: plan ? plan.have : 0 };
  for (const { u, n } of plan.take) {
    if (u === plan.u) continue;
    // a Double Singularity giving one keeps a single Singularity
    if (u.dbl && n === 1) delete u.dbl; else { u.tr = null; delete u.dbl; delete u.tw; }
  }
  plan.u.tr = "infinity"; delete plan.u.dbl; delete plan.u.tw;
  G.S.stats.bestTier = Math.max(G.S.stats.bestTier, AF.TRAIT.infinity.tier);
  G.S.stats.bestMult = Math.max(G.S.stats.bestMult || 0, AF.TRAIT.infinity.mult);
  return { ok: true, plan };
};
G.reroll = (uid, single) => {
  const S = G.S, u = G.unit(uid);
  if (!u) return { err: "gone" };
  const cost = G.rerollCost(u);
  if (S.yen < cost) return { err: "yen", need: cost };
  S.yen -= cost;
  S.stats.rerolls++; u.rolls = (u.rolls || 0) + 1;
  // (31 Oct, "remove pity completely on trait rerolls"): only the odds decide
  let t = weighted(AF.TRAITS.map(x => [x, G.traitW(x)])), pity = false, twin = null;
  // Twin Roll: a second roll for the same price, and the better of the two stays (both are returned, for the reels)
  if (G.twinRoll() && !single) { const t2 = weighted(AF.TRAITS.map(x => [x, G.traitW(x)])); twin = [t, t2]; if (t2.mult > t.mult) t = t2; }
  let dbl = !!twin && twin[0].id === twin[1].id; // both rolls the same trait: it counts twice
  const prev = u.tr, prevDbl = !!u.dbl;
  u.tr = t.id; u.dbl = dbl || undefined;
  u.tw = twin ? twin.map(x => x.id) : undefined; // Twin Roll's pair, for the Lab's plate
  S.stats.bestTier = Math.max(S.stats.bestTier, t.tier);
  S.stats.bestMult = Math.max(S.stats.bestMult || 0, t.mult * (dbl ? 2 : 1));
  return { trait: t, prev, prevDbl, cost, pity, twin, dbl };
};

// ---- levels ----
const lvCost = (u, lv) => Math.ceil(AF.upCost(AF.UNIT[u.k].rarity, lv) * Math.pow(0.94, G.upLv("study")));
G.upCost = u => lvCost(u, u.lv);
G.upPlan = (u, n, budget) => {
  // how many of the next n levels you can afford right now (up to the star cap), and what they cost
  const cap = G.cap(u), yen = budget === undefined ? G.S.yen : budget;
  let lv = u.lv, cost = 0, k = 0;
  while (k < n && lv < cap) {
    const c = lvCost(u, lv);
    if (cost + c > yen) break;
    cost += c; lv++; k++;
  }
  let want = 0, wl = u.lv;
  for (let i = 0; i < n && wl < cap; i++, wl++) want += lvCost(u, wl);
  return { levels: k, cost, want };
};
G.upgrade = (uid, n, budget) => {
  const u = G.unit(uid); if (!u) return 0;
  const plan = G.upPlan(u, n, budget);
  if (!plan.levels) return 0;
  G.S.yen -= plan.cost; u.lv += plan.levels; G.S.stats.upgrades += plan.levels;
  G.S.stats.maxLevel = Math.max(G.S.stats.maxLevel, u.lv);
  return plan.levels;
};
// Auto Level: one level for whichever Area unit gains the most income per yen, never spending over a quarter of the balance
G.autoLevel = () => {
  let best = null, bestScore = 0;
  G.slotsView().forEach(u => {
    if (!u || u.lv >= G.cap(u)) return;
    const c = lvCost(u, u.lv);
    if (c > G.S.yen * 0.25) return;
    const score = (G.income(u) * (E.levelGrowth - 1)) / c;
    if (score > bestScore) { best = u; bestScore = score; }
  });
  return best && G.upgrade(best.uid, 1) ? best : null;
};

// ---- stars ----
// copies that can be fed: same unit, not placed, not locked, not shiny, no trait of Solar or better, not in the Lab
G.fodder = u => G.S.units.filter(o => o.k === u.k && o.uid !== u.uid && o.eq < 0 && !o.lock && !o.sh && G.tier(o) < 3 && o.uid !== G.S.opts.lab && o.uid !== G.S.opts.lab2)
  .sort((a, b) => G.stars(a) - G.stars(b) || a.lv - b.lv || G.tier(a) - G.tier(b));
G.starNeed = u => (G.stars(u) >= AF.STARS.max ? 0 : AF.STARS.copies[G.stars(u)]);
G.starUp = uid => {
  const S = G.S, u = G.unit(uid); if (!u) return { err: "gone" };
  const need = G.starNeed(u); if (!need) return { err: "max" };
  const f = G.fodder(u);
  if (f.length < need) return { err: "copies", need, have: f.length };
  const used = new Set(f.slice(0, need).map(o => o.uid));
  S.units = S.units.filter(o => !used.has(o.uid));
  if (used.has(S.opts.lab)) S.opts.lab = null;
  if (used.has(S.opts.lab2)) S.opts.lab2 = null;
  u.st = G.stars(u) + 1;
  S.stats.maxStars = Math.max(S.stats.maxStars, u.st);
  return { ok: true, used: need };
};
// Auto Star: the best copy of each unit (placed first, then by income) takes every star its spare copies pay for
G.autoStar = () => {
  const by = {};
  G.S.units.forEach(u => { (by[u.k] = by[u.k] || []).push(u); });
  let n = 0;
  for (const k in by) {
    if (by[k].length < 2) continue;
    const best = by[k].sort((a, b) => (b.eq >= 0) - (a.eq >= 0) || G.income(b) - G.income(a))[0];
    while (G.starNeed(best) && G.fodder(best).length >= G.starNeed(best) && G.starUp(best.uid).ok) n++;
  }
  return n;
};

// ---- ascension and the shard shop ----
G.magnet = () => 1 + 0.1 * G.upLv("magnet") + G.star("shardK");
G.ascendShards = () => Math.floor(Math.sqrt(G.S.lifetime / AF.ASCEND.per) * G.magnet());
// the shards this ascension has to be worth before it opens (3, 9, 27, ... with AF.ASCEND.grow 3)
// (30 Oct) times AF.REBIRTH.climb for every Rebirth; (1 Nov) climbAfter for each one past the first climbFull
G.climbK = (reb = G.S.reb || 0) => { const R = AF.REBIRTH; return Math.pow(R.climb, Math.min(reb, R.climbFull)) * Math.pow(R.climbAfter, Math.max(0, reb - R.climbFull)); };
G.ascMin = () => Math.ceil(AF.ASCEND.min * Math.pow(AF.ASCEND.grow, G.S.asc) * G.climbK());
// (30 Oct) the goals of a Rebirth's ascension path, by ascension (data.js AF.REBIRTH.paths; the first climb's are
// AF.ASCEND.td). Past the last listed path the last one repeats, its Endless floors 3 deeper each time
G.ascPath = (reb = G.S.reb || 0) => {
  if (!reb) return AF.ASCEND.td;
  const P = AF.REBIRTH.paths, p = P[Math.min(reb, P.length) - 1], extra = Math.max(0, reb - P.length);
  if (!extra) return p;
  const o = {};
  for (const n in p) o[n] = p[n].replace(/^(floor:(?:[a-z]+:)?)(\d+)$/, (m, a, b) => a + (+b + AF.REBIRTH.creep * extra));
  return o;
};
// is a goal met: "map:difficulty" (or harder), "floor:N" / "floor:map:N" (best Endless floor), "rank:N", "mult:N", "found:N"
G.reqMet = k => {
  const [a, b, c] = k.split(":"), st = G.S.stats;
  if (a === "floor") { const B = (G.S.td && G.S.td.tower && G.S.td.tower.bests) || {}; return (c ? B[b] || 0 : Math.max(0, ...Object.values(B))) >= +(c || b); }
  if (a === "rank") return (st.bestRank || 0) >= +b;
  if (a === "mult") return (st.bestMult || 0) >= +b;
  if (a === "found") return G.found() >= +b;
  return G.tdClear(k);
};
// the goal the next ascension still waits for, if any
G.ascReq = () => { const k = G.ascPath()[G.S.asc + 1]; return k && !G.reqMet(k) ? k : null; };
G.ascTd = G.ascReq;
G.canAscend = () => G.ascendShards() >= G.ascMin() && !G.ascTd();
// what you need to have earned this run for n shards
G.shardsAt = n => Math.pow(n / G.magnet(), 2) * AF.ASCEND.per;
G.nextShardAt = () => G.shardsAt(G.ascendShards() + 1);
G.startSlots = () => Math.min(E.slotsStart + E.slotCosts.length, E.slotsStart + G.upLv("wide") + G.star("slots"));
// what a run starts with: Head Start (shop) x Head Start (star map)
G.startYen = () => E.startYen * Math.pow(20, G.upLv("head")) * Math.pow(100, G.upLv("warmStart")) * Math.max(1, G.star("start"));
G.ascend = () => {
  const S = G.S;
  if (!G.canAscend()) return 0;
  const got = G.ascendShards();
  S.shards += got; S.asc++;
  newRun();
  return got;
};
// a new run: what an ascension and a Rebirth both reset
function newRun() {
  const S = G.S;
  S.yen = G.startYen();
  S.pending = 0; S.lifetime = 0; S.gate = "ember"; S.runStart = now();
  S.slots = G.startSlots();
  S.units.forEach(u => { u.lv = 1; if (u.eq >= S.slots) u.eq = -1; });
}
// ---- Rebirth (30 Oct): from Ascension 15; ascensions back to 0 (and the run), Starlight for the star map, and the
// next gate past the Rift opens. Units, traits, stars, shinies, shards, the shop, quests and Defense clears stay ----
G.canRebirth = () => G.S.asc >= AF.REBIRTH.asc;
G.rebirthStarlight = () => Math.floor((AF.REBIRTH.base + AF.REBIRTH.perAsc * Math.max(0, G.S.asc - AF.REBIRTH.asc)) * (1 + G.star("star")));
G.rebirth = () => {
  const S = G.S;
  if (!G.canRebirth()) return 0;
  const got = G.rebirthStarlight();
  S.starlight += got; S.reb++; S.asc = 0;
  newRun();
  return got;
};
// the star map: a star can be bought once a star it hangs from is lit (a corner needs both of its)
G.starOwned = id => !!(G.S.smap && G.S.smap[id]);
G.starOpen = n => !n.from.length || (n.all ? n.from.every(G.starOwned) : n.from.some(G.starOwned));
G.buyStar = id => {
  const S = G.S, n = AF.SMAP[id];
  if (!n || G.starOwned(id)) return { err: "owned" };
  if (!G.starOpen(n)) return { err: "locked" };
  if (S.starlight < n.cost) return { err: "starlight", need: n.cost };
  S.starlight -= n.cost; (S.smap = S.smap || {})[id] = 1; G._star = null;
  if (n.fx.slots) S.slots = Math.max(S.slots, G.startSlots());
  return { ok: true };
};
// (1 Nov, "add more progression ... even where he's at"): a lit star brightened again with Starlight
G.canBrighten = n => G.starLv(n.id) > 0 && Object.keys(n.fx).some(f => !AF.BRIGHT.skip.includes(f));
G.brightMax = n => G.starLv(n.id) > AF.BRIGHT.max;
G.brightCost = n => Math.ceil(n.cost * G.starLv(n.id) * (1 - 0.1 * G.upLv("supergiant")));
G.brightenStar = id => {
  const S = G.S, n = AF.SMAP[id];
  if (!n || !G.canBrighten(n)) return { err: "locked" };
  if (G.brightMax(n)) return { err: "max" };
  const c = G.brightCost(n);
  if (S.starlight < c) return { err: "starlight", need: c };
  S.starlight -= c; S.smap[id] = G.starLv(id) + 1; G._star = null;
  return { ok: true };
};
G.shopCost = id => { const d = AF.UPG[id]; return Math.ceil(d.base * Math.pow(d.growth || 1, G.upLv(id))); };
G.upLocked = d => (!!d.asc && G.S.asc < d.asc) || (!!d.reb && (G.S.reb || 0) < d.reb) || (!!d.needs && !d.needs.every(G.has));
G.buyUp = id => {
  const S = G.S, d = AF.UPG[id], lv = G.upLv(id);
  if (lv >= d.max) return { err: "max" };
  if (G.upLocked(d)) return d.reb && (G.S.reb || 0) < d.reb ? { err: "reb", need: d.reb } : d.needs && !d.needs.every(G.has) ? { err: "needs", need: d.needs } : { err: "asc", need: d.asc };
  const c = G.shopCost(id);
  if (S.shards < c) return { err: "shards", need: c };
  S.shards -= c; S.up[id] = lv + 1; G._star = null;
  if (id === "wide") S.slots = Math.max(S.slots, G.startSlots());
  return { ok: true };
};

// ---- Relics (30 Oct): rolled for shards from the first Rebirth (data.js AF.RELIC). S.relics: inv (every relic: id, k
// kind, r rarity 0-4, q quality), eq (worn ids, in slot order), n (next id) ----
G.relicBox = () => G.S.relics || (G.S.relics = { inv: [], eq: [], n: 1 });
G.relicOpen = () => (G.S.reb || 0) >= AF.RELIC.reb;
G.relicSlots = () => AF.RELIC.slots + G.upLv("relicCase") + G.upLv("relicVault");
G.relicVal = x => AF.RELIC.KIND[x.k].v[x.r] * x.q;
G.relicsWorn = () => { const B = G.S.relics; if (!B) return []; return B.eq.slice(0, G.relicSlots()).map(id => id == null ? null : B.inv.find(x => x.id === id)).filter(Boolean); };
// (31 Oct) eq holds one entry per slot: an id, or null for an empty slot
G.relicAt = i => { const B = G.relicBox(), id = B.eq[i]; return id == null || i >= G.relicSlots() ? null : B.inv.find(x => x.id === id) || null; };
G.relicScrapVal = x => Math.ceil(AF.RELIC.cost * AF.RELIC.scrap[x.r] * x.q);
// rarity weights: Relic Luck raises Epic and better
G.relicW = () => AF.RELIC.rar.map((r, i) => r.w * (i >= 2 ? 1 + 0.2 * G.upLv("relicLuck") : 1));
// (30 Oct) the next n rolls' price, each 2% over the one before it, counted over every relic ever rolled
G.relicCost = (n = 1) => { const r0 = G.relicBox().rolled || 0; let c = 0; for (let i = 0; i < n; i++) c += Math.ceil(AF.RELIC.cost * Math.pow(AF.RELIC.grow, r0 + i)); return c; };
G.rollRelics = n => {
  const S = G.S, B = G.relicBox(), cost = G.relicCost(n);
  if (!G.relicOpen()) return { err: "reb" };
  if (S.shards < cost) return { err: "shards", need: cost };
  S.shards -= cost; B.rolled = (B.rolled || 0) + n;
  const W = G.relicW(), tot = W.reduce((s, w) => s + w, 0), cut = S.opts.relicScrap == null ? -1 : S.opts.relicScrap, out = [];
  for (let i = 0; i < n; i++) {
    let x = Math.random() * tot, r = 0;
    while (r < W.length - 1 && x >= W[r]) { x -= W[r]; r++; }
    const k = AF.RELIC.kinds[(Math.random() * AF.RELIC.kinds.length) | 0].id;
    const it = { id: B.n++, k, r, q: Math.round(80 + Math.random() * 40) / 100 };
    // auto scrap: that rarity and below go straight back as shards (never past the box's room either)
    const scrap = r <= cut || B.inv.length >= AF.RELIC.keep;
    if (scrap) S.shards += G.relicScrapVal(it); else B.inv.push(it);
    out.push({ x: it, scrap });
    S.stats.relics = (S.stats.relics || 0) + 1; S.stats.bestRelic = Math.max(S.stats.bestRelic == null ? -1 : S.stats.bestRelic, r);
  }
  return { ok: true, got: out };
};
G.wearRelic = (id, on, slot) => {
  const B = G.relicBox(), n = G.relicSlots();
  B.eq = Array.from({ length: n }, (_, i) => { const x = B.eq[i]; return x != null && B.inv.some(y => y.id === x) ? x : null; });
  const was = B.eq.indexOf(id);
  if (was >= 0) B.eq[was] = null;
  if (on) {
    const at = slot != null ? slot : B.eq.indexOf(null);
    if (at < 0 || at >= n) { if (was >= 0) B.eq[was] = id; return { err: "full" }; }
    // a relic already in that slot moves to the one this came from (a swap), or comes off
    if (B.eq[at] != null && was >= 0) B.eq[was] = B.eq[at];
    B.eq[at] = id;
  }
  G._star = null;
  return { ok: true };
};
// wear the best: rarity first, then quality
G.wearBestRelics = () => {
  const B = G.relicBox();
  B.eq = B.inv.slice().sort((a, b) => b.r - a.r || b.q - a.q).slice(0, G.relicSlots()).map(x => x.id);
  G._star = null;
};
G.scrapRelics = ids => {
  const B = G.relicBox(), set = new Set(ids); let got = 0;
  B.inv = B.inv.filter(x => { if (!set.has(x.id) || B.eq.includes(x.id)) return true; got += G.relicScrapVal(x); return false; });
  G.S.shards += got;
  return got;
};

// ---- Evolution (30 Oct): the Keeper's pacts (units_evo.js AF.EVO, AF.EVO_REQ) ----
G.evoBox = () => G.S.evo || (G.S.evo = { pact: false });
G.evoOpen = () => (G.S.reb || 0) >= 1;
G.canEvo = u => !!(u && !u.ev && AF.EVO && AF.EVO[u.k] && AF.EVO_REQ[u.k]);
// the units an offering could take: that rarity, none you'd miss
G.evoFodder = (u, rar) => {
  const S = G.S, team = new Set((S.td && S.td.team) || []), lab = [S.opts.lab, S.opts.lab2];
  return S.units.filter(o => o !== u && AF.UNIT[o.k].rarity === rar && !o.lock && o.eq < 0 && !team.has(o.uid) && !lab.includes(o.uid) && !o.sh && !o.ev && G.tier(o) < 3)
    .sort((a, b) => G.income(a) - G.income(b));
};
G.evoReqs = u => {
  const R = AF.EVO_REQ[u.k], [rar, n] = R.offer, f = G.evoFodder(u, rar);
  return [
    { k: "stars", need: R.stars, have: G.stars(u), ok: G.stars(u) >= R.stars },
    { k: "offer", rar, need: n, have: Math.min(n, f.length), ok: f.length >= n, take: f.slice(0, n) },
    { k: "shards", need: R.shards, have: G.S.shards, ok: G.S.shards >= R.shards },
    { k: "deed", goal: R.deed, ok: G.reqMet(R.deed) },
    ...Object.entries(R.mats || {}).map(([id, n]) => ({ k: "mat", id, need: n, have: G.matHave(id), ok: G.matHave(id) >= n })),
  ];
};
// (1 Nov) the Keeper's star pact (units_evo.js AF.STAR_PACT): the price of a unit's next star, what's in hand, binding it
G.starPact = u => { const L = u && AF.STAR_PACT && AF.STAR_PACT[u.k]; return L ? L[G.stars(u) - 1] || null : null; };
G.starPactReqs = u => {
  const P = G.starPact(u), [rar, n] = P.offer, f = G.evoFodder(u, rar);
  return [
    { k: "offer", rar, need: n, have: Math.min(n, f.length), ok: f.length >= n, take: f.slice(0, n) },
    { k: "shards", need: P.shards, have: G.S.shards, ok: G.S.shards >= P.shards },
    ...Object.entries(P.mats || {}).map(([id, k]) => ({ k: "mat", id, need: k, have: G.matHave(id), ok: G.matHave(id) >= k })),
  ];
};
G.starPactSeal = uid => {
  const S = G.S, u = G.unit(uid);
  if (!G.evoOpen() || !G.starPact(u)) return { err: "no" };
  const reqs = G.starPactReqs(u);
  if (!reqs.every(r => r.ok)) return { err: "reqs", reqs };
  const take = new Set(reqs[0].take.map(o => o.uid));
  S.units = S.units.filter(o => !take.has(o.uid));
  S.shards -= reqs[1].need;
  for (const r of reqs) if (r.k === "mat") G.matBox().have[r.id] -= r.need;
  u.st = G.stars(u) + 1;
  S.stats.maxStars = Math.max(S.stats.maxStars, u.st);
  return { ok: true, gave: reqs[0].take };
};
// (30 Oct) the Keeper's gift: Vesh, once, after your first evolution
G.evoGift = () => {
  const S = G.S;
  if (!(S.stats.evolved > 0) || G.evoBox().gift || !AF.UNIT.vesh) return null;
  S.evo.gift = 1;
  const u = G.add("vesh"); notePull(u);
  return u;
};
G.evolve = uid => {
  const S = G.S, u = G.unit(uid);
  if (!G.evoOpen() || !G.canEvo(u)) return { err: "no" };
  const reqs = G.evoReqs(u);
  if (!reqs.every(r => r.ok)) return { err: "reqs", reqs };
  const take = new Set(reqs[1].take.map(o => o.uid));
  S.units = S.units.filter(o => !take.has(o.uid));
  S.shards -= reqs[2].need;
  for (const r of reqs) if (r.k === "mat") G.matBox().have[r.id] -= r.need;
  u.ev = 1; S.stats.evolved = (S.stats.evolved || 0) + 1;
  return { ok: true, gave: reqs[1].take };
};

// ---- the Merchant's store (30 Oct): materials for evolutions, daily deals; open from the first Rebirth ----
G.storeOpen = () => (G.S.reb || 0) >= 1;
G.matBox = () => G.S.mats || (G.S.mats = { have: {}, bought: {} });
G.matHave = id => G.matBox().have[id] || 0;
G.matCost = (id, n = 1) => { const m = AF.MAT[id], b = G.matBox().bought[id] || 0; let c = 0; for (let i = 0; i < n; i++) c += Math.ceil(m.base * Math.pow(m.grow, b + i)); return c; };
G.buyMat = (id, n = 1) => {
  if (!G.storeOpen()) return { err: "closed" };
  const c = G.matCost(id, n), B = G.matBox();
  if (G.S.shards < c) return { err: "shards", need: c };
  G.S.shards -= c; B.have[id] = (B.have[id] || 0) + n; B.bought[id] = (B.bought[id] || 0) + n;
  return { ok: true, cost: c };
};
// a unit copy's price on a deal, by rarity
const COPY_PRICE = r => Math.round(5000 * Math.pow(3.5, AF.RAR[r].order) / 1000) * 1000;
// today's deals (the UTC day picks them, the same all day): four of materials at a discount, an Epic+ coin, a unit copy
// of one you've found, a crate of yen
G.dealDay = () => Math.floor(Date.now() / 864e5);
G.deals = () => {
  const day = G.dealDay();
  if (G._deals && G._deals.day === day) return G._deals.list;
  let s = day * 2654435761 >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = a => a[(rnd() * a.length) | 0];
  const mats = AF.MATS.slice(0, 3), list = [];
  const m1 = pick(mats), m2 = pick(mats.filter(m => m !== m1));
  list.push({ t: "mat", id: m1.id, n: 3, off: 0.35 });
  list.push({ t: "mat", id: m2.id, n: 1, off: 0.5 });
  list.push({ t: "coin", min: 2 });
  const found = Object.keys(G.S.seen).filter(k => { const d = AF.UNIT[k]; return d && !d.gate && AF.RAR[d.rarity].order <= 9; });
  list.push(found.length && rnd() < 0.6 ? { t: "copy", k: pick(found) } : { t: "yen", mins: 60 });
  G._deals = { day, list };
  return list;
};
// what a deal costs now (materials at their current price less the discount, the coin at 4 flips' price)
G.dealCost = d => d.t === "mat" ? Math.ceil(G.matCost(d.id, d.n) * (1 - d.off)) : d.t === "coin" ? G.relicCost(1) * 4 : d.t === "copy" ? COPY_PRICE(AF.UNIT[d.k].rarity) : 1.5e6;
G.dealGot = i => { const D = G.S.deals; return !!(D && D.day === G.dealDay() && D.got.includes(i)); };
G.buyDeal = i => {
  if (!G.storeOpen()) return { err: "closed" };
  const d = G.deals()[i]; if (!d) return { err: "none" };
  if (G.dealGot(i)) return { err: "got" };
  const c = G.dealCost(d); if (G.S.shards < c) return { err: "shards", need: c };
  G.S.shards -= c;
  if (!G.S.deals || G.S.deals.day !== G.dealDay()) G.S.deals = { day: G.dealDay(), got: [] };
  G.S.deals.got.push(i);
  const out = { ok: true, d };
  if (d.t === "mat") { const B = G.matBox(); B.have[d.id] = (B.have[d.id] || 0) + d.n; }
  else if (d.t === "coin") out.relic = G.giftRelic(d.min);
  else if (d.t === "copy") { const u = G.add(d.k); notePull(u); out.unit = u; }
  else { out.yen = G.rate() * d.mins * 60; G.S.yen += out.yen; }
  return out;
};
// one relic of at least rarity min, outside the coin price (a deal); the same rules as a flip otherwise
G.giftRelic = min => {
  const B = G.relicBox(), W = G.relicW().map((w, i) => (i >= min ? w : 0)), tot = W.reduce((s, w) => s + w, 0);
  let x = Math.random() * tot, r = 0;
  while (r < W.length - 1 && x >= W[r]) { x -= W[r]; r++; }
  const it = { id: B.n++, k: AF.RELIC.kinds[(Math.random() * AF.RELIC.kinds.length) | 0].id, r, q: Math.round(80 + Math.random() * 40) / 100 };
  B.inv.push(it); G.S.stats.relics = (G.S.stats.relics || 0) + 1; G.S.stats.bestRelic = Math.max(G.S.stats.bestRelic == null ? -1 : G.S.stats.bestRelic, r);
  return { x: it, scrap: false };
};

// ---- quests ----
G.qstat = q => {
  const st = G.S.stats;
  switch (q.stat) {
    case "found": return Object.keys(G.S.seen).filter(k => AF.UNIT[k] && !AF.UNIT[k].crew).length; // the free crew is not a find
    case "earned": return st.collected;
    case "asc": return G.S.asc;
    case "reb": return G.S.reb || 0;
    case "smap": return Object.keys(G.S.smap || {}).length;
    case "rift": return Object.keys(G.S.seen).filter(k => AF.UNIT[k] && AF.UNIT[k].gate === "rift").length;
    default:
      if (q.stat.startsWith("gate:")) { const id = q.stat.slice(5); return Object.keys(G.S.seen).filter(k => AF.UNIT[k] && AF.UNIT[k].gate === id).length; } return q.stat.startsWith("td:") ? (G.tdClear(q.stat.slice(3)) ? 1 : 0) : st[q.stat] || 0;
  }
};
G.questDone = q => G.qstat(q) >= q.goal;
G.claimable = () => Object.values(AF.QUEST).filter(q => !G.S.quests[q.id] && G.questDone(q)).length;
G.claim = id => {
  const q = AF.QUEST[id];
  if (!q || G.S.quests[id] || !G.questDone(q)) return 0;
  G.S.quests[id] = true; G.S.yen += q.shards;
  return q.shards;
};

// ---- area ----
G.slotCost = () => E.slotCosts[G.S.slots - E.slotsStart];
G.slotsMax = () => E.slotsStart + E.slotCosts.length;
// ascensions the next slot waits for (0 = none)
G.slotAscNeed = () => { const a = E.slotAsc[G.S.slots + 1] || 0; return G.S.asc < a ? a : 0; };
G.buySlot = () => {
  const c = G.slotCost();
  if (c === undefined) return { err: "max" };
  if (G.slotAscNeed()) return { err: "asc", need: G.slotAscNeed() };
  if (G.S.yen < c) return { err: "yen", need: c };
  G.S.yen -= c; G.S.slots++;
  return { ok: true };
};
G.equip = (uid, slot) => {
  const u = G.unit(uid); if (!u || slot < 0 || slot >= G.S.slots) return;
  G.S.units.forEach(o => { if (o.eq === slot) o.eq = -1; });
  u.eq = slot;
};
G.unequip = uid => { const u = G.unit(uid); if (u) u.eq = -1; };
// (29 Oct, request: "When you click equip best it should sort by the max lvl money"): best = what a unit would earn
// at its level cap (its stars' cap), not at the level it happens to be now; Auto Equip uses the same order
G.maxIncome = u => G.income(Object.assign({}, u, { lv: Math.max(u.lv, G.cap(u)) }));
// (30 Oct, auto summon lag) each unit's max income worked out once, not inside the sort's comparison
G.bestOrder = () => G.S.units.map(u => [u, G.maxIncome(u)]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
G.equipBest = () => {
  const best = G.bestOrder().slice(0, G.S.slots), keep = new Set(best.map(u => u.uid));
  G.S.units.forEach(u => { if (u.eq >= 0 && !keep.has(u.uid)) u.eq = -1; });
  // (29 Oct, "there is no way that zephra is the best unit ... idk why its at the top"): units already placed used to
  // keep their slot; now the Area is laid out in that order, best first
  best.forEach((u, i) => { u.eq = i; });
};

// ---- money ----
let histAcc = 0;
G.tick = dt => {
  const S = G.S, rate = G.rate(), st = S.stats;
  S.pending += rate * dt;
  st.played += dt;
  if (rate > st.maxRate) st.maxRate = rate;
  if (S.slots > st.slotsMax) st.slotsMax = S.slots;
  // income history for the Stats graph: a point a minute, the last 4 hours
  histAcc += dt;
  if (histAcc >= 60 || !S.hist.length) { histAcc = 0; S.hist.push([now(), rate]); if (S.hist.length > 240) S.hist.splice(0, S.hist.length - 240); }
};
G.collect = () => {
  const a = G.S.pending;
  G.S.pending = 0; G.S.yen += a; G.S.lifetime += a; G.S.stats.collected += a;
  return a;
};
G.releaseValue = u => AF.UNIT[u.k].base * u.vr * E.releaseSeconds;
function u_release(uids) {
  const S = G.S, set = new Set(uids);
  let yen = 0, n = 0;
  S.units = S.units.filter(u => {
    if (!set.has(u.uid) || u.lock || u.eq >= 0) return true;
    yen += G.releaseValue(u); n++;
    if (S.opts.lab === u.uid) S.opts.lab = null;
    if (S.opts.lab2 === u.uid) S.opts.lab2 = null;
    return false;
  });
  S.yen += yen;
  return { yen, n };
}
G.release = u_release;

// ---- saving ----
// (31 Oct) the totals a save keeps; one that went to NaN or Infinity is written by JSON as null
const TOTALS = ["yen", "pending", "lifetime", "shards", "starlight"];
const fixNum = v => (typeof v === "number" && !isNaN(v) ? Math.min(v, Number.MAX_VALUE) : 0);
// a unit's fields that hold only their defaults are left out of the save (adopt puts them back)
const UDEF = { vr: 1, tr: null, eq: -1, lock: false, rolls: 0, st: 1, sh: false };
G.saveErr = null;
G.save = () => {
  try {
    G.S.lastSeen = now();
    for (const k of TOTALS) if (k in G.S && !(typeof G.S[k] === "number" && isFinite(G.S[k]))) G.S[k] = fixNum(G.S[k]);
    const raw = JSON.stringify(G.S, function (k, v) {
      if (k === "isNew" || k === "autoReleased") return undefined;
      if (this && this.uid !== undefined && k in UDEF && UDEF[k] === v) return undefined;
      return v;
    });
    try { localStorage.setItem(KEY, raw); }
    catch (e) {
      // the site's storage is full: the backup copy goes first, then try again
      try { localStorage.removeItem(BACKUP); localStorage.setItem(KEY, raw); }
      catch (e2) { G.saveErr = "full"; return false; }
    }
    G.saveErr = null;
    return true;
  } catch (e) { G.saveErr = "error"; return false; }
};
// (31 Oct) only a save without its unit list is unreadable; a broken total is repaired, not a reason to throw it away
function valid(s) { return s && typeof s === "object" && Array.isArray(s.units); }
function adopt(s) {
  const f = fresh();
  const S = Object.assign(f, s);
  for (const k of TOTALS) S[k] = fixNum(s[k] == null ? f[k] : +s[k]);
  S.pity = Object.assign(fresh().pity, s.pity);
  S.stats = Object.assign(fresh().stats, s.stats);
  S.opts = Object.assign(fresh().opts, s.opts);
  delete S.opts.twinRoll; // Twin Roll stays on once bought (29 Oct)
  // the old "Auto release duplicates" (Common, Rare) carries over into Auto sell
  S.opts.autoSell = Object.assign({}, s.opts && s.opts.autoRelease, s.opts && s.opts.autoSell);
  delete S.opts.autoRelease;
  S.up = Object.assign({}, s.up); S.quests = Object.assign({}, s.quests);
  S.hist = Array.isArray(s.hist) ? s.hist.slice(-240) : [];
  S.shards = +s.shards || 0; S.asc = +s.asc || 0; S.reb = +s.reb || 0; S.runStart = +s.runStart || now();
  S.starlight = +s.starlight || 0; S.smap = Object.assign({}, s.smap); G._star = null;
  S.evo = Object.assign({ pact: false }, s.evo);
  S.mats = { have: Object.assign({}, s.mats && s.mats.have), bought: Object.assign({}, s.mats && s.mats.bought) };
  S.deals = s.deals && Array.isArray(s.deals.got) ? { day: +s.deals.day, got: s.deals.got.slice() } : null;
  // (30 Oct) Relics
  const RB = s.relics || {};
  S.relics = { inv: Array.isArray(RB.inv) ? RB.inv.filter(x => x && AF.RELIC.KIND[x.k] && x.r >= 0 && x.r <= 4) : [], eq: Array.isArray(RB.eq) ? RB.eq.slice() : [], n: +RB.n || 1, rolled: +RB.rolled || 0 };
  S.relics.n = Math.max(S.relics.n, ...S.relics.inv.map(x => x.id + 1));
  S.td = Object.assign(fresh().td, s.td); S.td.clears = Object.assign({}, s.td && s.td.clears);
  // (30 Oct) the Endless tower's record
  S.td.tower = Object.assign({ best: 0, week: -1, weekBest: 0, runs: 0 }, s.td && s.td.tower);
  S.td.team = Array.isArray(S.td.team) ? S.td.team.slice(0, 6) : [];
  // the first test map (Office Park) was replaced by Hollowbrook; its clears go with it
  if (AF.TD) {
    if (!AF.TD.MAP[S.td.map]) S.td.map = "village";
    for (const k in S.td.clears) if (!AF.TD.MAP[k.split(":")[0]]) delete S.td.clears[k];
  }
  G._found = null;
  S.units = S.units.filter(u => AF.UNIT[u.k]).map(u => Object.assign({ lv: 1, vr: 1, tr: null, eq: -1, lock: false, rolls: 0, st: 1, sh: false }, u));
  S.units.forEach(u => {
    if (u.tr && !AF.TRAIT[u.tr]) u.tr = null;
    if (!u.tr) delete u.dbl;
    u.st = Math.min(AF.STARS.max, Math.max(1, u.st | 0));
    u.lv = Math.min(AF.STARS.cap[u.st - 1] + 10 * (S.up.limit || 0), Math.max(1, u.lv | 0));
  });
  // saves from before 28 Oct: best trait by multiplier, auto reroll's stop point by multiplier
  S.stats.bestMult = Math.max(S.stats.bestMult || 0, ...S.units.map(u => (u.tr ? AF.traitOf(u).mult : 0)));
  if (!S.opts.stopMult) { const t = AF.TRAITS.find(x => x.tier === (S.opts.stopAt || 4)); S.opts.stopMult = t ? t.mult : 100; }
  S.slots = Math.min(E.slotsStart + E.slotCosts.length, Math.max(E.slotsStart, S.slots | 0));
  S.nextUid = Math.max(S.nextUid | 0, ...S.units.map(u => u.uid + 1), 1);
  return S;
}
function starter() {
  const u = G.add(E.startUnit);
  u.isNew = false; u.eq = 0;
}
G.load = () => {
  // (31 Oct) the save, or the backup if it's the newer of the two that can be read
  const read = k => { try { const raw = localStorage.getItem(k); const o = raw ? JSON.parse(raw) : null; return valid(o) ? o : null; } catch (e) { return null; } };
  const a = read(KEY), b = read(BACKUP);
  let s = a && b ? ((b.lastSeen || 0) > (a.lastSeen || 0) ? b : a) : a || b;
  if (valid(s)) {
    G.S = adopt(s);
    const secs = Math.min((now() - (s.lastSeen || now())) / 1000, G.offlineCap());
    if (secs > 60) {
      const gained = G.rate() * secs;
      if (gained > 0) { G.S.pending += gained; G.offline = { secs, gained }; }
    }
  } else {
    G.S = fresh(); G._found = null;
    starter();
    G.firstRun = true;
  }
  try { localStorage.setItem(BACKUP, JSON.stringify(G.S)); } catch (e) { /* storage unavailable: play on without it */ }
};
G.exportSave = () => {
  G.save();
  return btoa(unescape(encodeURIComponent(JSON.stringify(G.S))));
};
G.importSave = str => {
  try {
    const s = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    if (!valid(s)) return false;
    G.S = adopt(s); G.save();
    return true;
  } catch (e) { return false; }
};
G.reset = () => {
  try { localStorage.removeItem(KEY); localStorage.removeItem(BACKUP); } catch (e) { /* nothing stored */ }
  G.S = fresh(); G._found = null; G._star = null; starter(); G.save();
};

// ---- numbers ----
const SUF = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
AF.fmt = n => {
  if (!isFinite(n)) return "∞";
  const neg = n < 0; n = Math.abs(n);
  let s;
  if (n < 10) s = n < 0.995 && n > 0 ? n.toFixed(1) : (Math.round(n * 10) / 10).toString();
  else if (n < 1000) s = Math.floor(n).toString();
  else {
    const i = Math.min(SUF.length - 1, Math.floor(Math.log10(n) / 3));
    if (i >= SUF.length - 1 && n >= 1e36) s = n.toExponential(2).replace("+", "");
    else {
      const v = n / Math.pow(1000, i);
      s = (v >= 100 ? Math.floor(v) : v >= 10 ? Math.floor(v * 10) / 10 : Math.floor(v * 100) / 100) + SUF[i];
    }
  }
  return (neg ? "-" : "") + s;
};
AF.fmtTime = s => {
  s = Math.floor(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`;
};
AF.oneIn = pct => {
  // whole numbers with commas ("1 in 1,111"); odds read wrong in K/M shorthand
  const n = 100 / pct;
  return n < 1.05 ? "always" : "1 in " + (n < 10 ? n.toFixed(1).replace(/\.0$/, "") : AF.fmt(Math.round(n))); // (30 Oct) abbreviated like every other number
};
})();
