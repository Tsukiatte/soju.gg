/* Expedition battle rules (3 Nov, owner: "switch from tower defense to angry birds epic, with soju.gg theme over it").
   The mechanics follow Angry Birds Epic: three heroes, one action each, then every raider acts. Drag to attack, drag to
   an ally for support, one shared meter that fires a hero's big skill. Names, numbers and models are this game's own.
   No page and no three.js here, so bots can play thousands of fights (tools/soju_epic.mjs). Every action returns a list
   of events; epic_battle.js plays them back. Progress, gear and the map's stages live in epic_world.js. */
(function () {
const AF = window.AF;
const EP = AF.EP = {};
const rnd = () => Math.random();
const pick = a => a[Math.floor(rnd() * a.length)];
const pct = n => Math.round(n * 100) + '%';

// ---------------- team level ----------------
EP.LEVEL_MAX = 60;
EP.LV = L => Math.pow(1.095, L - 1);

// ---------------- statuses ----------------
// good: can be stripped by a dispel; bad: can be cleansed. Durations count down at the end of their owner's side's turn,
// and one put on during its owner's own turn waits a turn, so "3 turns" always covers 3 enemy turns
const ST = EP.ST = {
  taunt:   { n: 'Taunt', good: 1, c: '#ffb648', d: 'Raiders must hit this hero.' },
  mark:    { n: 'Marked', good: 0, c: '#ff6a5a', d: 'Every raider goes for this hero, and hits softer.' },
  guard:   { n: 'Covered', good: 1, c: '#8fd0ff', d: 'A friend takes the hits for this hero.' },
  less:    { n: 'Protected', good: 1, c: '#8fd0ff', d: 'Takes less damage.' },
  more:    { n: 'Exposed', good: 0, c: '#ff8a5a', d: 'Takes more damage.' },
  power:   { n: 'Pumped', good: 1, c: '#ffd25a', d: 'Deals more damage.' },
  weak:    { n: 'Weakened', good: 0, c: '#b98cff', d: 'Deals less damage.' },
  poison:  { n: 'Poison', good: 0, c: '#8fe05a', d: 'Loses health every turn.' },
  bleed:   { n: 'Bleeding', good: 0, c: '#ff5a6a', d: 'Loses health every turn.' },
  regen:   { n: 'Warm Soup', good: 1, c: '#7ee8a0', d: 'Heals every turn.' },
  stun:    { n: 'Stunned', good: 0, c: '#ffe05a', d: 'Skips its next turn.' },
  thorns:  { n: 'Prickly', good: 1, c: '#d8a860', d: 'Whoever hits this hero gets hurt.' },
  counter: { n: 'Return Fire', good: 1, c: '#ff9d3a', d: 'Hits back when hit.' },
  smoke:   { n: 'Smoke', good: 1, c: '#a8a8b8', d: 'Attacks on it often miss.' },
  bubble:  { n: 'Bubble', good: 1, c: '#7fd8ff', d: 'Sends all damage back at the attacker.' },
  soup:    { n: 'Soup Line', good: 1, c: '#7ee8a0', d: 'The team heals from damage this hero takes.' },
  shareHeal: { n: 'Shared Bowl', good: 1, c: '#a0f0c0', d: 'Healing this hero also heals the others.' },
  mirror:  { n: 'Decoy', good: 1, c: '#ff8ad0', d: 'Raiders must hit this hero, and take their own damage back.' },
  gang:    { n: 'Ganged Up', good: 0, c: '#ff6a5a', d: 'Every hero joins in when this raider is hit.' },
  feeder:  { n: 'Tasty', good: 0, c: '#7ee8a0', d: 'Heroes who hit this raider heal a little.' },
  spark:   { n: 'Static', good: 1, c: '#ffe05a', d: 'Getting hit fills the bottle and may stun the attacker.' },
  magnet:  { n: 'Snubbed', good: 0, c: '#ff8ad0', d: 'This raider has to attack your healthiest hero.' },
  drip:    { n: 'Bleed Mark', good: 0, c: '#ff5a6a', d: 'Takes extra damage every time it is attacked.' },
  charge:  { n: 'Charging', good: 0, c: '#ff4a3a', d: 'Winding up a huge hit next turn.', sticky: 1 },
  immune:  { n: 'Unshakable', good: 1, c: '#f0f0ff', d: 'Effects do not stick to it.', sticky: 1 },
  shell:   { n: 'Ice Shell', good: 1, c: '#a8e4ff', d: 'Takes far less from a hit, and each hit cracks it. Poison and bleeding go straight through.', sticky: 1 },
  // (5 Nov, owner: "more mechanics more unique to each hero so that like a different combination is required for some of the rooms ... the bosses shold be hard and only with strategy shold they be able to win and not by brute force")
  chill:   { n: 'Chilled', good: 0, c: '#a8e4ff', d: 'Enough of these and it freezes for a turn.', sticky: 1 },
  burn:    { n: 'Burning', good: 0, c: '#ff8a3a', d: 'Loses health every turn, and cannot heal.' },
  doom:    { n: 'Doom', good: 0, c: '#b06aff', d: 'Falls when the count runs out. Only Pig\'s healing lifts it, or beating whoever cast it.', sticky: 1 },
  hush:    { n: 'Hushed', good: 0, c: '#c0c8e0', d: 'Its next spell fizzles.' },
  armor:   { n: 'Armour', good: 1, c: '#c8d0dc', d: 'Takes a quarter from hits. Only Pip cracks it. Poison, bleeding and burns go through.', sticky: 1 },
  hidden:  { n: 'Hidden', good: 1, c: '#8878b8', d: 'Hits miss it three times in four. Owl always finds it, and drags it out for 2 turns.', sticky: 1 },
  frenzy:  { n: 'Frenzy', good: 1, c: '#ff5a4a', d: 'Acts twice a turn. Freeze it.', sticky: 1 },
  aloft:   { n: 'Aloft', good: 1, c: '#9ad8ff', d: 'Close-up heroes can hardly reach it. Dot knocks it down.', sticky: 1 },
  ward:    { n: 'Bone Ward', good: 1, c: '#d8d0b8', d: 'Takes a fifth from hits while any of its minions stands.', sticky: 1 },
};

// ---------------- each world's rule ----------------
// (4 Nov, owner: "add mroe mechanics to create strategy ... only some strategies will work for some maps like just have it be a puzzle a little"). Every world bends the fight one way, and the team that won the last world may not win this one. good: the hero types that answer it, shown on the stage's board
const RULES = EP.RULES = {
  tide: { n: 'High Tide', ic: 'drop', d: 'Raiders heal every turn, unless they are poisoned or bleeding. Finish one at a time, or keep them hurting.', good: ['off', 'rogue'] },
  sun: { n: 'Scorching Sun', ic: 'sun', d: 'Your heroes lose health every turn. Bring healing, or win fast.', good: ['heal'] },
  shell: { n: 'Ice Shell', ic: 'st_shield2', d: 'Raiders start in a shell that soaks up most of a hit. Each hit cracks it. Hit them all at once, or poison them.', good: ['off', 'rogue'] },
  restless: { n: 'Restless Dead', ic: 'grave', d: 'A raider who falls gets back up next turn, unless the whole wave is down. Bring them all low, then finish them together.', good: ['mage', 'rogue'] },
  furnace: { n: 'The Furnace', ic: 'burst', d: 'Raiders hit harder every turn of a wave. Win fast, or weaken them.', good: ['off', 'rogue'] },
  grid: { n: 'Power Grid', ic: 'boltR', d: 'A Pylon shields the others, who take far less until it falls. It only ever loses 1 a hit, however hard you hit it. Count your hits.', good: ['mage'] },
};
const ruleK = (B, id) => { const l = B.rules || []; const r = l.find(q => q.id === id); return r ? r.s : 0; };
EP.ruleK = ruleK;
// the moment a wave arrives
function rulesOnWave(B) {
  const st = B.stage;
  B.rules = st.ruleByWave ? [st.ruleByWave[Math.min(B.wave, st.ruleByWave.length - 1)]] : st.rules || [];
  B.heat = 0; B.waveT = 0;
  const sh = ruleK(B, 'shell');
  if (sh) for (const e of B.foes) e.st.push({ id: 'shell', t: 99, v: Math.round((e.boss ? 3 : 1.5) * sh) + 1, by: e.id });
  const gr = ruleK(B, 'grid');
  if (gr) B.foes.unshift(makeFoe(B, { who: 'w', kit: 'pylon', name: 'Pylon', onlyHits: true, hits: Math.round(2 + gr) }));
}
// after the raiders have acted
function rulesOnTurn(B) {
  const k = ruleK(B, 'tide');
  if (k) for (const e of B.foes) if (e.hp > 0 && !e.onlyHits && e.hp < e.max && !has(e, 'poison') && !has(e, 'bleed')) healUnit(B, null, e, e.max * (e.boss ? 0.09 : 0.12) * k);
  const s = ruleK(B, 'sun');
  if (s) for (const h of B.heroes) if (h.hp > 0) selfHurt(B, h, h.max * 0.05 * s);
  const f = ruleK(B, 'furnace');
  if (f) B.heat += 0.26 * f * (B.foes.some(e => e.boss && e.hp > 0) ? 0.45 : 1);
  // overtime: no team wins by hiding behind a shield for ever. Past a few turns on one wave, raiders get angrier and angrier
  B.waveT = (B.waveT || 0) + 1;
  const bossUp = B.foes.some(e => e.boss && e.hp > 0);
  if ((B.stage.world || 0) >= 1 && B.waveT > (bossUp ? 11 : 4)) B.heat += bossUp ? ((B.stage.world || 0) >= 7 ? 0.45 : 0.3) : 0.22;
  // dragged out or knocked down for a while, then back
  for (const e of B.foes) {
    if (e.hp <= 0) continue;
    if (e.reveal > 0 && --e.reveal === 0) { e.st.push({ id: 'hidden', t: 99, v: 0, by: e.id }); B.log.push({ t: 'st', to: e.id, id: 'hidden', on: true }); }
    if (e.grounded > 0 && --e.grounded === 0) { e.st.push({ id: 'aloft', t: 99, v: 1, by: e.id }); B.log.push({ t: 'st', to: e.id, id: 'aloft', on: true }); }
  }
  if (B.heat) B.log.push({ t: 'heat', v: B.heat });
  if (ruleK(B, 'restless')) for (const e of B.foes) if (e.hp <= 0 && e.fellNow && !e.noRaise && e.kit !== 'pylon') { e.fellNow = false; e.noRaise = true; e.hp = Math.round(e.max * 0.55); e.st = []; B.log.push({ t: 'revive', to: e.id, hp: e.hp }); }
}

// ---------------- the action: what a skill can do ----------------
// c: me, to, B, k (the class's tier), and the verbs below. Every verb adds events to B.log
function ctxOf(B, me, to, k) {
  const c = {
    B, me, to, k: k || 1,
    foes: () => (me.side === 'h' ? B.foes : B.heroes).filter(u => u.hp > 0),
    pals: () => (me.side === 'h' ? B.heroes : B.foes).filter(u => u.hp > 0),
    hit: (p, o = {}) => deal(B, me, o.to || c.to, p * c.k, o),
    hitAll: (p, o = {}) => { let sum = 0; for (const u of c.foes()) sum += deal(B, me, u, p * c.k, o); return sum; },
    heal: (u, p) => healUnit(B, me, u, u.max * p * c.k),
    healN: (u, n) => healUnit(B, me, u, n),
    healAll: p => { for (const u of c.pals()) healUnit(B, me, u, u.max * p * c.k); },
    st: (u, id, t, v) => addStatus(B, u, id, t, v, me),
    stAll: (list, id, t, v) => { for (const u of list) addStatus(B, u, id, t, v, me); },
    cleanse: u => strip(B, u, false),
    dispel: u => strip(B, u, true),
    rage: n => addRage(B, n),
    hurt: (u, n) => selfHurt(B, u, n),
  };
  return c;
}
const has = (u, id) => u.st.find(s => s.id === id);
const sumV = (u, id) => u.st.reduce((a, s) => a + (s.id === id ? s.v || 0 : 0), 0);
EP.has = has;

function addStatus(B, u, id, t, v, by) {
  if (!u || u.hp <= 0) return null;
  if (has(u, 'immune') && !ST[id].good) { B.log.push({ t: 'resist', to: u.id }); return null; }
  const was = u.st.find(s => s.id === id && s.by === (by && by.id));
  const own = (u.side === 'h') === (B.phase === 'player');
  if (was) { was.t = Math.max(was.t, t); was.v = Math.max(was.v || 0, v || 0); was.fresh = own; }
  else u.st.push({ id, t, v: v || 0, by: by && by.id, fresh: own });
  B.log.push({ t: 'st', to: u.id, id, on: true });
  return true;
}
function strip(B, u, good) {
  const n = u.st.length;
  u.st = u.st.filter(s => ST[s.id].sticky || !!ST[s.id].good !== good);
  if (u.st.length !== n) B.log.push({ t: good ? 'dispel' : 'cleanse', to: u.id });
}
function addRage(B, n) {
  const k = n > 0 ? B.rageK : 1;
  const was = B.rage;
  B.rage = Math.max(0, Math.min(100, B.rage + n * k));
  if (B.rage !== was) B.log.push({ t: 'rage', v: B.rage, d: B.rage - was });
}
function healUnit(B, by, u, n) {
  if (!u || u.hp <= 0) return 0;
  if (by && by.animal === 'pig' && has(u, 'doom')) { u.st = u.st.filter(s => s.id !== 'doom'); B.log.push({ t: 'st', to: u.id, id: 'doom', on: false }); B.log.push({ t: 'say', to: u.id, ic: 'plus' }); }
  if (has(u, 'burn')) return 0;
  const k = by && by.healK ? by.healK : 1;
  const got = Math.min(u.max - u.hp, Math.max(1, Math.round(n * k)));
  if (got <= 0) return 0;
  u.hp += got;
  B.log.push({ t: 'heal', to: u.id, n: got, hp: u.hp });
  if (has(u, 'shareHeal') && !B.sharing) {
    B.sharing = true;
    for (const o of B.heroes) if (o !== u && o.hp > 0) healUnit(B, null, o, got * 0.5);
    B.sharing = false;
  }
  return got;
}
function selfHurt(B, u, n) {
  const got = Math.min(u.hp - 1, Math.max(0, Math.round(n)));
  if (got <= 0) return 0;
  u.hp -= got;
  B.log.push({ t: 'hit', to: u.id, n: got, hp: u.hp, self: true });
  return got;
}
function die(B, u, by) {
  u.hp = 0;
  u.st = [];
  B.log.push({ t: 'die', to: u.id, by: by && by.id });
  if (u.side === 'e') { u.fellNow = true; for (const h of B.heroes) if (h.st.some(s => s.id === 'doom' && s.by === u.id)) { h.st = h.st.filter(s => !(s.id === 'doom' && s.by === u.id)); B.log.push({ t: 'st', to: h.id, id: 'doom', on: false }); } }
  // a set piece: back on your feet once
  if (u.side === 'h' && u.reviveOnce) {
    u.reviveOnce = false; u.hp = Math.round(u.max * 0.4);
    B.log.push({ t: 'revive', to: u.id, hp: u.hp });
  }
}

// one blow: who it really lands on, how hard, and everything that answers it. o.flat: a number, not a share of attack.
function deal(B, src, tgt0, p, o = {}) {
  let tgt = tgt0;
  if (!tgt || tgt.hp <= 0) return 0;
  const cover = has(tgt, 'guard'), sig = src.animal; // sig: a hero's own knack, EP.SIG
  let less = 0;
  if (cover && !o.noCover && sig !== 'mochi') {
    const g = (tgt.side === 'h' ? B.heroes : B.foes).find(u => u.id === cover.by && u.hp > 0);
    if (g && g !== tgt) { tgt = g; less += cover.v || 0; }
  }
  if (has(tgt, 'smoke') && !o.sure && sig !== 'owl' && rnd() < 0.5) { B.log.push({ t: 'miss', to: tgt.id, by: src.id }); return 0; }
  if (has(tgt, 'hidden') && !o.sure) {
    if (sig === 'owl') { if (has(tgt, 'hidden').t > 9) tgt.reveal = 2; tgt.st = tgt.st.filter(s => s.id !== 'hidden'); B.log.push({ t: 'st', to: tgt.id, id: 'hidden', on: false }); B.log.push({ t: 'say', to: tgt.id, ic: 'search' }); }
    else if (rnd() < 0.75) { B.log.push({ t: 'miss', to: tgt.id, by: src.id }); return 0; }
  }
  let d = src.atk * p * (0.95 + rnd() * 0.1);
  d *= Math.max(0.1, 1 + sumV(src, 'power') - sumV(src, 'weak'));
  const taken = Math.max(0.1, 1 - less - sumV(tgt, 'less') + sumV(tgt, 'more') + (tgt.gearLess ? -tgt.gearLess : 0));
  d *= taken;
  // a share of the hero's own health, so no amount of gear walks through it: only less damage, a Catch, or stopping it
  if (o.lethal) d = Math.max(d, tgt.max * o.lethal * taken);
  let crit = false;
  if (src.critP && rnd() < src.critP) { d *= 1 + src.critD; crit = true; }
  if (src.luckP && rnd() < src.luckP) { d *= 1.5; crit = true; }
  const drip = has(tgt, 'drip');
  if (drip) d += src.atk * (drip.v || 0);
  d = Math.max(1, Math.round(d));
  if (has(tgt, 'bubble') && sig === 'mochi') { tgt.st = tgt.st.filter(s => s.id !== 'bubble'); B.log.push({ t: 'st', to: tgt.id, id: 'bubble', on: false }); B.log.push({ t: 'say', to: tgt.id, ic: 'hand' }); }
  if (has(tgt, 'bubble')) {
    B.log.push({ t: 'bounce', to: tgt.id, by: src.id });
    if (!o.noReact) deal(B, tgt, src, 0, { flat: d, noReact: true, noCover: true, sure: true, raw: d });
    return 0;
  }
  if (o.raw) d = Math.round(o.raw);
  // the world's rule: a shell soaks up most of a blow and cracks; a Pylon shields its friends; the furnace heats every raider's hits
  if (src.side === 'e' && B.heat) d = Math.round(d * (1 + B.heat));
  if (tgt.side === 'e') {
    const shell = has(tgt, 'shell');
    if (shell) { d = Math.max(1, Math.round(d * 0.2)); shell.v -= sig === 'fox' ? 2 : 1; B.log.push({ t: 'crack', to: tgt.id, left: Math.max(0, shell.v) }); if (shell.v <= 0) { tgt.st = tgt.st.filter(s => s !== shell); B.log.push({ t: 'st', to: tgt.id, id: 'shell', on: false }); } }
    if (tgt.kit !== 'pylon' && B.foes.some(u => u.kit === 'pylon' && u.hp > 0)) d = Math.max(1, Math.round(d * (tgt.boss ? 0.2 : 0.42)));
    const armor = has(tgt, 'armor');
    if (armor) {
      if (sig === 'pip') { armor.v--; B.log.push({ t: 'crack', to: tgt.id, left: Math.max(0, armor.v) }); if (armor.v <= 0) { tgt.st = tgt.st.filter(s => s !== armor); B.log.push({ t: 'st', to: tgt.id, id: 'armor', on: false }); } }
      else d = Math.max(1, Math.round(d * 0.25));
    }
    const aloft = has(tgt, 'aloft');
    if (aloft) {
      if (sig === 'dot') { tgt.st = tgt.st.filter(s => s !== aloft); if (aloft.v) tgt.grounded = 2; B.log.push({ t: 'st', to: tgt.id, id: 'aloft', on: false }); B.log.push({ t: 'say', to: tgt.id, ic: 'up' }); }
      else if (aloft.v) d = Math.max(1, Math.round(d * (src.style === 'melee' ? 0.1 : 0.2)));
      else if (src.style === 'melee') d = Math.max(1, Math.round(d * 0.4));
    }
    if (has(tgt, 'ward') && B.foes.some(u => u !== tgt && u.hp > 0 && u.kit !== 'pylon')) d = Math.max(1, Math.round(d * 0.2));
  }
  if (tgt.onlyHits) { d = sig === 'hazel' && tgt.kit === 'pylon' ? 3 : 1; }
  // no hit is worth more than a slice of a boss, and it can't be hurried past its next stage in one turn
  d = bossClamp(tgt, d);
  if (d <= 0) { B.log.push({ t: 'resist', to: tgt.id }); return 0; }
  tgt.hp = Math.max(0, tgt.hp - d);
  B.stats.dmg += src.side === 'h' ? d : 0;
  if (tgt.side === 'h') B.stats.taken += d;
  B.log.push({ t: 'hit', to: tgt.id, by: src.id, n: d, crit, hp: tgt.hp, fx: o.fx });
  if (tgt.coinPerHit) { B.stats.coins += tgt.coinPerHit; B.log.push({ t: 'coin', to: tgt.id, n: tgt.coinPerHit }); }
  if (src.side === 'h' && !o.noRage) addRage(B, o.rage == null ? 7 : o.rage);
  if (tgt.side === 'h' && !o.noRage) addRage(B, 4);
  const soup = has(tgt, 'soup');
  if (soup) for (const u of B.heroes) if (u.hp > 0) healUnit(B, null, u, d * (soup.v || 0.15));
  if (!o.noReact && tgt.hp > 0 && src.hp > 0) react(B, src, tgt, d);
  if (sig && tgt.side === 'e' && tgt.hp > 0 && !o.noSig && !has(tgt, 'immune')) {
    if (sig === 'fox') addStatus(B, tgt, 'burn', 2, src.atk * 0.25, src);
    else if (sig === 'fig' && !(tgt.boss && tgt.hushCd > 0)) addStatus(B, tgt, 'hush', 1, 0, src);
  }
  if (tgt.animal === 'penguin' && src.side === 'e' && src.hp > 0 && !o.noReact) chillOf(B, src);
  if (src.side === 'h' && !o.noReact) {
    const feed = has(tgt, 'feeder');
    if (feed && src.hp > 0) healUnit(B, null, src, src.max * (feed.v || 0.05));
    const gang = has(tgt, 'gang');
    if (gang && !B.ganging && tgt.hp > 0) {
      B.ganging = true;
      for (const u of B.heroes) if (u !== src && u.hp > 0 && tgt.hp > 0) deal(B, u, tgt, gang.v || 0.25, { noReact: true, noRage: true, fx: 'gang' });
      B.ganging = false;
    }
    gearAfter(B, src, tgt);
  }
  if (tgt.hp <= 0) die(B, tgt, src);
  return d;
}
function bossClamp(u, d) {
  if (u.capHit) d = Math.min(d, Math.max(1, Math.round(u.max * u.capHit)));
  const gate = u.phases && u.phases[u.phaseI || 0];
  if (gate) d = Math.min(d, Math.max(0, u.hp - Math.ceil(u.max * gate.at)));
  return d;
}
function chillOf(B, e) {
  if (has(e, 'immune') || e.kit === 'pylon') return;
  const c = has(e, 'chill'), need = e.boss ? 5 : 3;
  if (c && c.v + 1 >= need) { e.st = e.st.filter(s => s !== c); addStatus(B, e, 'stun', 1, 0, null); B.log.push({ t: 'st', to: e.id, id: 'chill', on: false }); return; }
  if (c) c.v++; else { e.st.push({ id: 'chill', t: 99, v: 1, by: 'pebble' }); B.log.push({ t: 'st', to: e.id, id: 'chill', on: true }); }
}
function react(B, src, tgt, d) {
  const th = has(tgt, 'thorns');
  if (th) deal(B, tgt, src, 0, { raw: Math.max(1, d * (th.v || 0.35)), noReact: true, noCover: true, sure: true, noRage: true, fx: 'thorns' });
  const mir = has(tgt, 'mirror');
  if (mir && src.hp > 0) deal(B, tgt, src, 0, { raw: Math.max(1, d), noReact: true, noCover: true, sure: true, noRage: true, fx: 'thorns' });
  const co = has(tgt, 'counter');
  if (co && src.hp > 0) deal(B, tgt, src, co.v || 0.4, { noReact: true, noCover: true, noRage: true, fx: 'counter' });
  const sp = has(tgt, 'spark');
  if (sp) { addRage(B, 5); if (src.hp > 0 && rnd() < 0.2) addStatus(B, src, 'stun', 1, 0, tgt); }
}
function gearAfter(B, src, tgt) {
  if (src.chainP && rnd() < src.chainP) {
    const others = B.foes.filter(u => u.hp > 0 && u !== tgt);
    if (others.length) deal(B, src, pick(others), 0.2, { noReact: true, noRage: true, fx: 'chain' });
  }
  if (src.stunP && tgt.hp > 0 && rnd() < src.stunP) addStatus(B, tgt, 'stun', 1, 0, src);
}

// ---------------- the classes ----------------
// each hero has two or three, each with one attack and one support, and one big skill for the bottle.
// a: attack, s: support. to: 'ally' (drag to anyone on your side, a tap means yourself), 'self' (just tap).
// ai: how auto-pilot and the bots read it: heal, guard, buff, cleanse, nuke
const HEROES = EP.HEROES = {
  bao: { role: 'tank', style: 'melee', blurb: 'Big, slow and in the way on purpose.',
    rage: { n: 'Big Hug', d: 'Squeezes the healthiest raider for 500%.', f: c => { const t = c.foes().sort((a, b) => b.hp - a.hp)[0]; c.hit(5, { to: t, rage: 0 }); } },
    classes: [
      { id: 'bouncer', n: 'Bouncer', hat: 'cap', a: { n: 'Shove', d: '115% to one raider. Bao taunts for 3 turns.', f: c => { c.hit(1.15); c.st(c.me, 'taunt', 3); } },
        s: { n: 'Behind Me', d: 'One friend takes 55% less for 2 turns.', to: 'ally', ai: 'guard', f: c => c.st(c.to, 'less', 2, 0.55) } },
      { id: 'doorman', n: 'Doorman', hat: 'top', a: { n: 'No Entry', d: '95%, and that raider deals 25% less for 2 turns.', f: c => { c.hit(0.95); c.st(c.to, 'weak', 2, 0.25); } },
        s: { n: 'House Rules', d: 'The whole team takes 25% less for 3 turns.', to: 'self', ai: 'buff', f: c => c.stAll(c.pals(), 'less', 3, 0.25) } },
      { id: 'ronin', n: 'Ronin', hat: 'band', a: { n: 'Three Cuts', d: 'Three hits of 50%.', f: c => { c.hit(0.5); c.hit(0.5); c.hit(0.5); } },
        s: { n: 'Hold the Line', d: 'One friend takes 50% less, the others 40% less, for 1 turn.', to: 'ally', ai: 'guard', f: c => { for (const u of c.pals()) c.st(u, 'less', 1, u === c.to ? 0.5 : 0.4); } } },
    ] },
  penguin: { role: 'tank', style: 'melee', blurb: 'Takes it personally. Gets stronger the more it hurts.',
    rage: { n: 'Belly Slide', d: '220% to one raider and 110% to the others.', f: c => { const t = c.foes().sort((a, b) => b.hp - a.hp)[0]; c.hit(2.2, { to: t, rage: 0 }); for (const u of c.foes()) if (u !== t) c.hit(1.1, { to: u, rage: 0 }); } },
    classes: [
      { id: 'grudge', n: 'Grudge', hat: 'cap', a: { n: 'Grudge Slap', d: '80%, plus 1.2% for every 1% of health Pebble has lost.', f: c => c.hit(0.8 + 1.2 * (1 - c.me.hp / c.me.max)) },
        s: { n: 'Pick On Me', d: 'Every raider must hit this friend, and deals 10% less, for 2 turns.', to: 'ally', ai: 'guard', f: c => c.st(c.to, 'mark', 2, 0.1) } },
      { id: 'warden', n: 'Warden', hat: 'top', a: { n: 'Ice Gavel', d: '135%. The most hurt friend heals 40% of the damage.', f: c => { const d = c.hit(1.35); const w = c.pals().sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (d) c.healN(w, d * 0.4); } },
        s: { n: 'Cover', d: 'Pebble takes this friend\'s hits at 35% less, for 3 turns.', to: 'ally', ai: 'guard', f: c => { if (c.to !== c.me) c.st(c.to, 'guard', 3, 0.35); else c.st(c.me, 'less', 3, 0.35); } } },
    ] },
  owl: { role: 'mage', style: 'cast', blurb: 'Hits everybody at once. Never in a hurry.',
    rage: { n: 'Hoot Storm', d: 'Six hits of 60% on random raiders.', f: c => { for (let i = 0; i < 6; i++) { const l = c.foes(); if (!l.length) break; c.hit(0.6, { to: pick(l), rage: 0 }); } } },
    classes: [
      { id: 'hedge', n: 'Hedge Mage', hat: 'wizard', a: { n: 'Acorn Rain', d: '55% to every raider.', f: c => c.hitAll(0.55, { rage: 3 }), area: 1 },
        s: { n: 'Prickly Aura', d: 'Whoever hits this friend takes 50% back, for 3 turns.', to: 'ally', ai: 'buff', f: c => c.st(c.to, 'thorns', 3, 0.5) } },
      { id: 'storm', n: 'Storm Caller', hat: 'cap', a: { n: 'Zap', d: '45% to every raider. 65% chance to strip each one\'s buffs.', f: c => { c.hitAll(0.45, { rage: 3 }); for (const u of c.foes()) if (rnd() < 0.65) c.dispel(u); }, area: 1 },
        s: { n: 'Go Again', d: 'This friend attacks right now, for free.', to: 'ally', ai: 'nuke', f: c => freeAttack(c) } },
      { id: 'rain', n: 'Rain Dancer', hat: 'band', a: { n: 'Sour Drizzle', d: '20% to every raider, plus poison for 35% a turn for 3 turns.', f: c => { c.hitAll(0.2, { rage: 3 }); for (const u of c.foes()) c.st(u, 'poison', 3, c.me.atk * 0.35 * c.k); }, area: 1 },
        s: { n: 'Clean Rain', d: 'Cleans bad effects off everyone and heals the team 20%.', to: 'self', ai: 'heal', f: c => { for (const u of c.pals()) c.cleanse(u); c.healAll(0.2); } } },
    ] },
  hazel: { role: 'mage', style: 'cast', blurb: 'Quills and static. Jumps from raider to raider.',
    rage: { n: 'Quill Burst', d: '120% to every raider. They deal 25% less for 2 turns.', f: c => { c.hitAll(1.2, { rage: 0 }); c.stAll(c.foes(), 'weak', 2, 0.25); } },
    classes: [
      { id: 'spark', n: 'Spark Wizard', hat: 'wizard', a: { n: 'Chain Quill', d: '100%, jumping on for 67%, then 45%, then 30%.', f: c => { c.hit(1); const seen = [c.to], J = [0.67, 0.45, 0.3]; let at = 0; for (const u of c.foes()) { if (seen.includes(u) || at >= 3) continue; c.hit(J[at++], { to: u, rage: 2, fx: 'chain' }); seen.push(u); } } },
        s: { n: 'Static Charge', d: 'Being hit fills the bottle and may stun the attacker, for 3 turns.', to: 'ally', ai: 'buff', f: c => c.st(c.to, 'spark', 3) } },
      { id: 'thunder', n: 'Thunderhead', hat: 'cap', a: { n: 'Shock Wave', d: '45% to all. Your target takes 25% more for 3 turns.', f: c => { c.hitAll(0.45, { rage: 3 }); c.st(c.to, 'more', 3, 0.25); }, area: 1 },
        s: { n: 'Spike Coat', d: 'Whoever hits the team takes 35% back, for 3 turns.', to: 'self', ai: 'buff', f: c => c.stAll(c.pals(), 'thorns', 3, 0.35) } },
    ] },
  pig: { role: 'heal', style: 'cast', blurb: 'Keeps everyone fed and on their feet.',
    rage: { n: 'Truffle Feast', d: 'Heals the team 35% and cleans every bad effect.', ai: 'heal', f: c => { for (const u of c.pals()) c.cleanse(u); c.healAll(0.35); } },
    classes: [
      { id: 'nurse', n: 'Nurse', hat: 'nurse', a: { n: 'Hot Soup', d: '100%. The whole team heals 20% of the damage.', f: c => { const d = c.hit(1); if (d) for (const u of c.pals()) c.healN(u, d * 0.2); } },
        s: { n: 'Soup Line', d: 'The team heals 15% of damage this friend takes, for 3 turns.', to: 'ally', ai: 'buff', f: c => c.st(c.to, 'soup', 3, 0.15) } },
      { id: 'herb', n: 'Herbalist', hat: 'band', a: { n: 'Thorn Vine', d: '35%, plus 100% a turn for 3 turns.', f: c => { c.hit(0.35); c.st(c.to, 'poison', 3, c.me.atk * 1 * c.k); } },
        s: { n: 'Herb Tea', d: 'Heals a friend 22% and the others 10%.', to: 'ally', ai: 'heal', f: c => { for (const u of c.pals()) c.heal(u, u === c.to ? 0.22 : 0.1); } } },
      { id: 'duchess', n: 'Duchess', hat: 'tiara', a: { n: 'Snub', d: '125%. That raider must hit your healthiest hero for 3 turns.', f: c => { c.hit(1.25); c.st(c.to, 'magnet', 3); } },
        s: { n: 'Smelling Salts', d: 'Cleans a friend and heals them 30%.', to: 'ally', ai: 'heal', f: c => { c.cleanse(c.to); c.heal(c.to, 0.3); } } },
    ] },
  fig: { role: 'heal', style: 'cast', blurb: 'Calm frog. Loud singer.',
    rage: { n: 'Lily Rain', d: 'Heals the team 20%, then 7% a turn for 3 turns.', ai: 'heal', f: c => { c.healAll(0.2); for (const u of c.pals()) c.st(u, 'regen', 3, u.max * 0.07); } },
    classes: [
      { id: 'monk', n: 'Monk', hat: 'band', a: { n: 'Two Slaps', d: 'Two hits of 55%. Heroes who hit that raider heal 3%, for 3 turns.', f: c => { c.hit(0.55); c.hit(0.55); c.st(c.to, 'feeder', 3, 0.03); } },
        s: { n: 'Shared Bowl', d: 'Healing anyone on the team heals the others too, for 3 turns.', to: 'self', ai: 'buff', f: c => c.stAll(c.pals(), 'shareHeal', 3) } },
      { id: 'busker', n: 'Busker', hat: 'top', a: { n: 'Loud Note', d: '160%, with a 15% chance to stun.', f: c => { c.hit(1.6); if (rnd() < 0.15) c.st(c.to, 'stun', 1); } },
        s: { n: 'Encore', d: 'Heals the team 10%, then 5% a turn for 3 turns.', to: 'self', ai: 'heal', f: c => { c.healAll(0.1); for (const u of c.pals()) c.st(u, 'regen', 3, u.max * 0.05 * c.k); } } },
    ] },
  fox: { role: 'off', style: 'throw', blurb: 'Throws things. Gets the crew fired up.',
    rage: { n: 'Fire Sale', d: '150% to every raider.', f: c => c.hitAll(1.5, { rage: 0 }) },
    classes: [
      { id: 'deckhand', n: 'Deckhand', hat: 'bandana', a: { n: 'Sling', d: '100% to one raider.', f: c => c.hit(1) },
        s: { n: 'Rally', d: 'The whole team deals 25% more for 3 turns.', to: 'self', ai: 'buff', f: c => c.stAll(c.pals(), 'power', 3, 0.25) } },
      { id: 'gunner', n: 'Gunner', hat: 'cap', a: { n: 'Triple Shot', d: 'Three hits of 30%. That raider deals 20% less for 2 turns.', f: c => { c.hit(0.3); c.hit(0.3); c.hit(0.3); c.st(c.to, 'weak', 2, 0.2); } },
        s: { n: 'Return Fire', d: 'This friend hits back for 40% when hit, for 3 turns.', to: 'ally', ai: 'buff', f: c => c.st(c.to, 'counter', 3, 0.4) } },
      { id: 'wild', n: 'Wildcard', hat: 'band', a: { n: 'Reckless', d: '85%, up to 130% the fuller your bottle is.', f: c => c.hit(0.85 + 0.45 * (c.B.rage / 100)) },
        s: { n: 'Blood Pact', d: 'Rusty loses 15% health. Every raider loses the same.', to: 'self', ai: 'nuke', f: c => { const n = c.hurt(c.me, c.me.max * 0.15); for (const u of c.foes()) deal(c.B, c.me, u, 0, { raw: Math.max(1, n), noReact: true, noCover: true, sure: true, noRage: true }); } } },
    ] },
  dot: { role: 'off', style: 'throw', blurb: 'Salty old duck. Hits harder than expected.',
    rage: { n: 'Quack Blast', d: '120% to all, and stuns one raider.', f: c => { c.hitAll(1.2, { rage: 0 }); const l = c.foes(); if (l.length) c.st(pick(l), 'stun', 1); } },
    classes: [
      { id: 'skipper', n: 'Skipper', hat: 'bandana', a: { n: 'Scrub', d: '90%, and strips that raider\'s buffs.', f: c => { c.hit(0.9); c.dispel(c.to); } },
        s: { n: 'Pep Talk', d: 'Dot loses 10% health. This friend deals 60% more for 3 turns.', to: 'ally', ai: 'buff', f: c => { c.hurt(c.me, c.me.max * 0.1); c.st(c.to, 'power', 3, 0.6); } } },
      { id: 'salt', n: 'Old Salt', hat: 'cap', a: { n: 'Last Stand', d: '125%, less the more health Dot has lost.', f: c => c.hit(Math.max(0.5, 1.25 - 0.75 * (1 - c.me.hp / c.me.max))) },
        s: { n: 'Gang Up', d: 'For 2 turns every hit on any raider draws a 25% hit from the rest of the team.', to: 'self', ai: 'buff', f: c => c.stAll(c.foes(), 'gang', 2, 0.25) } },
    ] },
  mochi: { role: 'rogue', style: 'melee', blurb: 'Quick paws. Takes your buffs and your wallet.',
    rage: { n: 'Nine Lives', d: '200% to one, stuns a second, strips a third.', f: c => { const l = c.foes().sort((a, b) => b.hp - a.hp); c.hit(2, { to: l[0], rage: 0 }); if (l[1]) c.st(l[1], 'stun', 1); if (l[2]) c.dispel(l[2]); } },
    classes: [
      { id: 'trick', n: 'Trickster', hat: 'bandana', a: { n: 'Yarn Trick', d: '100%, and strips that raider\'s buffs.', f: c => { c.hit(1); c.dispel(c.to); } },
        s: { n: 'Clean Getaway', d: 'Cleans the team. They deal 15% more for 3 turns.', to: 'self', ai: 'cleanse', f: c => { for (const u of c.pals()) { c.cleanse(u); c.st(u, 'power', 3, 0.15); } } } },
      { id: 'purse', n: 'Cutpurse', hat: 'cap', a: { n: 'Razor Yarn', d: '30%, plus 90% a turn for 3 turns.', f: c => { c.hit(0.3); c.st(c.to, 'bleed', 3, c.me.atk * 0.9 * c.k); } },
        s: { n: 'Decoy', d: 'Raiders must hit this friend and take their own damage back, for 2 turns.', to: 'ally', ai: 'guard', f: c => c.st(c.to, 'mirror', 2) } },
      { id: 'snoop', n: 'Snoop', hat: 'top', a: { n: 'Pounce', d: '85%, plus 35% to every other raider.', f: c => { c.hit(0.85); for (const u of c.foes()) if (u !== c.to) c.hit(0.35, { to: u, rage: 2 }); } },
        s: { n: 'First Aid', d: 'The team heals 15% of damage this friend takes, for 3 turns.', to: 'ally', ai: 'buff', f: c => c.st(c.to, 'soup', 3, 0.15) } },
    ] },
  pip: { role: 'rogue', style: 'throw', blurb: 'The new kid. Never misses twice.',
    rage: { n: 'Carrot Barrage', d: '350% to the weakest raider and 100% to the rest.', f: c => { const l = c.foes().sort((a, b) => a.hp - b.hp); c.hit(3.5, { to: l[0], rage: 0 }); for (const u of c.foes()) if (u !== l[0]) c.hit(1, { to: u, rage: 0 }); } },
    classes: [
      { id: 'sharp', n: 'Sharpshooter', hat: 'cap', a: { n: 'Double Dart', d: 'Two hits of 50%. That raider takes 15% extra per attack for 3 turns.', f: c => { c.hit(0.5); c.hit(0.5); c.st(c.to, 'drip', 3, 0.15); } },
        s: { n: 'Bodyguard', d: 'Pip takes this friend\'s hits and hits back for 50%, for 2 turns.', to: 'ally', ai: 'guard', f: c => { if (c.to !== c.me) c.st(c.to, 'guard', 2, 0); c.st(c.me, 'counter', 2, 0.5); } } },
      { id: 'sneak', n: 'Sneak', hat: 'bandana', a: { n: 'Backstab', d: '90%. Pip deals 30% more for 2 turns.', f: c => { c.hit(0.9); c.st(c.me, 'power', 2, 0.3); } },
        s: { n: 'Stink Bomb', d: 'Up to 35% to every raider, and 2 turns of random trouble.', to: 'self', ai: 'nuke', f: c => { c.hitAll(0.2 + rnd() * 0.15, { rage: 3 }); for (const u of c.foes()) { const r = rnd(); if (r < 0.34) c.st(u, 'weak', 2, 0.3); else if (r < 0.67) c.st(u, 'more', 2, 0.3); else c.st(u, 'poison', 2, c.me.atk * 0.4); } } } },
    ] },
};
// (5 Nov, owner: "more mechanics more unique to each hero so that like a different combination is required for some of the rooms ... the bosses shold be hard and only with strategy shold they be able to win and not by brute force")
// Whatever class they wear, each hero does one thing nobody else can, and each opens a lock some raiders and every boss put on the fight. The code for them sits where the blow lands: deal(), swing(), healUnit()
EP.SIG = {
  bao: { n: 'Catch', ic: 'shield', d: 'Steps in front of every wound-up blow, even one aimed at the whole team, and takes it at half. Not while stunned.' },
  penguin: { n: 'Frost Hide', ic: 'mat_ice', d: 'Whoever hits Pebble is chilled. Three chills freeze a raider for a turn. A boss takes five.' },
  owl: { n: 'Night Eyes', ic: 'search', d: 'Never misses. Finds Hidden raiders, and drags them out for 2 turns.' },
  hazel: { n: 'Short Circuit', ic: 'boltR', d: 'Every hit takes 3 off a Pylon, not 1.' },
  pig: { n: 'Antidote', ic: 'plus', d: 'Any healing from this hero lifts Doom.' },
  fig: { n: 'Lullaby', ic: 'mute', d: 'A raider Fig hits is Hushed: its next spell or wind-up fizzles. A boss shakes it off, is safe from it for 2 turns, and winds up regardless: pick the moment.' },
  fox: { n: 'Fire Starter', ic: 'burst', d: 'Every hit sets a raider Burning, which stops it healing, and melts Ice Shell twice as fast.' },
  dot: { n: 'Clip Wings', ic: 'up', d: 'A hit knocks an Aloft raider out of the air.' },
  mochi: { n: 'Slip Past', ic: 'hand', d: 'Goes round bodyguards, and pops bubbles instead of bouncing off them.' },
  pip: { n: 'Weak Spot', ic: 'target', d: 'Hits go straight through Armour, and every hit cracks it.' },
};
// the locks: what a stage's board warns about, and who opens each one. Other answers exist, and the keys are the sure ones
EP.LOCKS = {
  windup: { n: 'Finisher', ic: 'boltR', d: 'It winds up, then lands a blow worth most of the health of whoever takes it, however much gear they wear. Catch it, shield them, or stun it.', keys: ['bao'] },
  regrow: { n: 'Regrowth', ic: 'drop', d: 'Heals every turn unless it is Burning, poisoned or bleeding.', keys: ['fox'] },
  doom: { n: 'Doom', ic: 'skull', d: 'Marks a hero to fall in 3 turns. Pig\'s healing lifts it, Hushing stops the cast, and beating the caster ends it.', keys: ['pig', 'fig'] },
  armor: { n: 'Armour', ic: 'helmet', d: 'Hits do a quarter until it is cracked, and only Pip cracks it. Poison, bleeding and burns go through.', keys: ['pip'] },
  ward: { n: 'Bone Ward', ic: 'grave', d: 'Takes a fifth from hits while any of its minions stands, and it keeps raising more. Clear them with hits on everyone, or Hush the raising.', keys: ['owl', 'hazel', 'fig'] },
  aloft: { n: 'Aloft', ic: 'up', d: 'Close-up heroes can hardly reach it. Dot knocks it down.', keys: ['dot'] },
  high: { n: 'High Aloft', ic: 'up', d: 'Everyone hits it at a fraction until Dot knocks it down, and it climbs back after 2 turns.', keys: ['dot'] },
  frenzy: { n: 'Frenzy', ic: 'fist2', d: 'Acts twice a turn. Make it hit Pebble, and it freezes itself.', keys: ['penguin'] },
  hidden: { n: 'Hidden', ic: 'search', d: 'Hits miss it three times in four. Owl always finds it.', keys: ['owl'] },
  grid: { n: 'Pylon', ic: 'st_shield2', d: 'Shields the others until it falls, and only loses 1 a hit. Hazel takes 3.', keys: ['hazel'] },
  bubble: { n: 'Bubble', ic: 'bubble', d: 'Sends every hit back at you. Mochi pops it.', keys: ['mochi'] },
  guard: { n: 'Bodyguard', ic: 'st_guard', d: 'Takes the hits for its friends. Mochi goes round it.', keys: ['mochi'] },
  caster: { n: 'Spellcaster', ic: 'st_weak', d: 'Spends its turns on tricks. Fig\'s hits Hush it.', keys: ['fig'] },
};
EP.locksOf = node => {
  const out = [], put = id => { if (!out.includes(id)) out.push(id); };
  for (const wave of node.waves || []) for (const q of wave) {
    const aff = q.aff || [];
    if (q.armor) put('armor');
    if (aff.includes('hidden')) put('hidden');
    if (aff.includes('frenzy')) put('frenzy');
    if (q.aloft) put('high'); else if (q.who === 'f' && (node.world || 0) >= 1) put('aloft');
    if (q.ward) put('ward');
    if (q.kit === 'curse') put('doom');
    if (q.kit === 'bodyguard') put('guard');
    if (q.kit === 'bubble') put('bubble');
    if (q.kit === 'healer' || q.kit === 'summon' || q.kit === 'revive') put('caster');
    if (q.kit === 'boss') {
      const all = (q.moves || []).concat(...(q.phases || []).map(p => p.do));
      if (q.lethal) put('windup');
      if (all.some(m => m === 'doom')) put('doom');
      if (all.some(m => /^armor/.test(m))) put('armor');
      if (all.some(m => /^hidden/.test(m))) put('hidden');
      if (all.includes('frenzy')) put('frenzy');
      if (all.includes('aloft')) put('high');
      if (all.includes('drones')) put('grid');
      if (all.includes('bubble')) put('bubble');
    }
  }
  const rules = node.rules || node.ruleByWave || [];
  if (rules.some(r => r.id === 'tide')) put('regrow');
  if (rules.some(r => r.id === 'grid')) put('grid');
  return out;
};
const ROLE = EP.ROLE = {
  // (4 Nov, owner: "show what type a hero is on their info card like attacker, defender, healer")
  tank: { n: 'Defender', d: 'Tough. Takes the hits for the team.', hp: 210, atk: 20, c: '#6ea8ff' }, mage: { n: 'Caster', d: 'Hits every raider at once.', hp: 125, atk: 23, c: '#c79bff' },
  heal: { n: 'Healer', d: 'Keeps the team on its feet.', hp: 145, atk: 19, c: '#7ee8a0' }, off: { n: 'Attacker', d: 'The hardest hits on one raider.', hp: 155, atk: 26, c: '#ff9d5a' },
  rogue: { n: 'Trickster', d: 'Poison, bleeding and dirty tricks.', hp: 135, atk: 25, c: '#ff8ad0' },
};
EP.classOf = (animal, id) => { const H = HEROES[animal]; return H.classes.find(x => x.id === id) || H.classes[0]; };
function freeAttack(c) {
  const a = c.to, cl = a.cls, l = c.foes();
  if (!l.length || a.hp <= 0 || !cl) return;
  // whoever goes again never fires this same skill back
  const sub = ctxOf(c.B, a, pick(l), a.tierK);
  c.B.log.push({ t: 'act', by: a.id, to: sub.to.id, kind: 'attack', n: cl.a.n, free: true });
  cl.a.f(sub);
}

// ---------------- what raiders do ----------------
// each raider in a stage has a kit. A kit picks its move from the fight as it stands. kit.d is the line the card shows
const who = (B, e) => {
  const live = B.heroes.filter(u => u.hp > 0);
  if (!live.length) return null;
  const forced = live.find(u => has(u, 'mirror')) || live.find(u => has(u, 'taunt')) || live.find(u => has(u, 'mark'));
  if (forced) return forced;
  if (has(e, 'magnet')) return live.slice().sort((a, b) => b.hp - a.hp)[0];
  // (owner: "a puzzle"): a raider picks who it is going for at the start of your turn, and you can see it. Taunts, stuns and kills all answer that
  const was = live.find(u => u.id === e.aim);
  if (was) return was;
  const p = pick(live); e.aim = p.id;
  return p;
};
const lowest = B => B.heroes.filter(u => u.hp > 0).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
const catcher = B => B.heroes.find(u => u.animal === 'bao' && u.hp > 0 && !has(u, 'stun'));
const swing = (B, e, t0, p, o = {}) => {
  let t = t0, half = 1;
  if (!t) return;
  if (o.windup) { const bao = catcher(B); if (bao) { if (bao !== t) B.log.push({ t: 'say', to: bao.id, ic: 'shield' }); t = bao; half = 0.5; } }
  const mk = has(t, 'mark');
  B.log.push({ t: 'act', by: e.id, to: t.id, kind: 'attack', n: o.n });
  const c = ctxOf(B, e, t, 1);
  const k = (mk ? 1 - (mk.v || 0.2) : 1) * half;
  c.hit(p * k, o.lethal ? Object.assign({}, o, { lethal: o.lethal * k }) : o);
};
// a raider's Doom: on someone it hasn't already marked
const doomOn = (B, e) => { const l = B.heroes.filter(u => u.hp > 0 && !has(u, 'doom')); if (!l.length) return false; const t = who(B, e), to = t && !has(t, 'doom') ? t : l[0]; B.log.push({ t: 'act', by: e.id, to: to.id, kind: 'cast', n: 'Doom' }); addStatus(B, to, 'doom', 3, 0, e); return true; };
// a boss turning a corner at a share of its health. Each step: a move it makes at once
function bossStep(B, e, m) {
  if (/^armor/.test(m)) { const n = +m.split(':')[1] || 4, a = has(e, 'armor'); if (a) a.v = Math.max(a.v, n); else { e.st.push({ id: 'armor', t: +m.split(':')[2] || 99, v: n, by: e.id }); B.log.push({ t: 'st', to: e.id, id: 'armor', on: true }); } }
  else if (m === 'frenzy') { if (!has(e, 'frenzy')) { e.st.push({ id: 'frenzy', t: 99, v: 0, by: e.id }); B.log.push({ t: 'st', to: e.id, id: 'frenzy', on: true }); } }
  else if (/^hidden/.test(m)) { if (!has(e, 'hidden')) { e.st.push({ id: 'hidden', t: +m.split(':')[1] || 99, v: 0, by: e.id }); B.log.push({ t: 'st', to: e.id, id: 'hidden', on: true }); } }
  else if (m === 'aloft') { if (!has(e, 'aloft')) { e.st.push({ id: 'aloft', t: 99, v: 1, by: e.id }); B.log.push({ t: 'st', to: e.id, id: 'aloft', on: true }); } }
  else if (m === 'doom') doomOn(B, e);
  else if (m === 'bubble') { B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'cast', n: 'Bubble' }); addStatus(B, e, 'bubble', 2, 0, e); }
  else if (m === 'call' || m === 'raise') { const live = B.foes.filter(u => u.hp > 0).length; B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'cast', n: m === 'raise' ? 'Rise' : 'Call for Backup' }); for (let i = 0, n = m === 'raise' ? 2 : 1; i < n && live + i < 4; i++) spawn(B, 'w', 'brawl', e.power * 0.7, 0.55); }
  else if (m === 'drones') { if (!B.foes.some(u => u.kit === 'pylon' && u.hp > 0)) { B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'cast', n: 'Power Up' }); const p = makeFoe(B, { who: 'w', kit: 'pylon', name: 'Pylon', onlyHits: true, hits: 8 }); B.foes.push(p); B.log.push({ t: 'spawn', to: p.id, by: p.id }); } }
}
function bossPhases(B) {
  for (const e of B.foes) {
    if (e.hp <= 0 || !e.phases) continue;
    for (let p = e.phases[e.phaseI || 0]; p && e.hp <= Math.ceil(e.max * p.at); p = e.phases[e.phaseI || 0]) {
      e.phaseI = (e.phaseI || 0) + 1;
      B.log.push({ t: 'say', to: e.id, ic: 'alert' });
      for (const m of p.do) bossStep(B, e, m);
    }
  }
}
const KITS = EP.KITS = {
  pylon: { n: 'Pylon', d: 'Shields its friends until it falls. It only ever loses 1 a hit.', start: (B, e) => e.st.push({ id: 'immune', t: 99, v: 0, by: e.id }), f: () => {} },
  brawl: { n: 'Brawler', d: 'Just hits you.', f: (B, e) => swing(B, e, who(B, e), 1) },
  pack: { n: 'Scrapper', d: 'Hits twice, softly.', f: (B, e) => { const t = who(B, e); swing(B, e, t, 0.6); if (t && t.hp > 0) deal(B, e, t, 0.6); } },
  sniper: { n: 'Sniper', d: 'Goes for your weakest hero.', f: (B, e) => { const forced = B.heroes.find(u => u.hp > 0 && (has(u, 'taunt') || has(u, 'mirror'))); swing(B, e, forced || lowest(B), 1.15); } },
  bleed: { n: 'Slasher', d: 'Leaves you bleeding.', f: (B, e) => { const t = who(B, e); swing(B, e, t, 0.75); if (t && t.hp > 0) addStatus(B, t, 'bleed', 3, e.atk * 0.35, e); } },
  poison: { n: 'Poisoner', d: 'Poisons one hero.', f: (B, e) => { const t = who(B, e); swing(B, e, t, 0.5); if (t && t.hp > 0) addStatus(B, t, 'poison', 3, e.atk * 0.45, e); } },
  weaken: { n: 'Hexer', d: 'Weakens a hero by 75%.', f: (B, e) => { const t = who(B, e); if (e.cd > 0) { e.cd--; swing(B, e, t, 0.9); return; } e.cd = 2; B.log.push({ t: 'act', by: e.id, to: t.id, kind: 'cast', n: 'Hex' }); addStatus(B, t, 'weak', 2, 0.75, e); } },
  stun: { n: 'Stunner', d: 'Can stun a hero.', f: (B, e) => { const t = who(B, e); swing(B, e, t, 0.7); if (t && t.hp > 0 && rnd() < 0.3) addStatus(B, t, 'stun', 1, 0, e); } },
  drain: { n: 'Bottle Thief', d: 'Drains your bottle.', f: (B, e) => { swing(B, e, who(B, e), 0.8); addRage(B, -14); B.log.push({ t: 'drain', by: e.id }); } },
  smoke: { n: 'Smoker', d: 'Hides its friends in smoke.', f: (B, e) => { if (e.cd > 0) { e.cd--; swing(B, e, who(B, e), 0.8); return; } e.cd = 2; B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'cast', n: 'Smoke Screen' }); for (const u of B.foes) if (u.hp > 0) addStatus(B, u, 'smoke', 2, 0, e); } },
  curse: { n: 'Curser', d: 'Marks a hero with Doom, to fall in 3 turns.', f: (B, e) => { if (e.cd > 0 || !doomOn(B, e)) { e.cd = Math.max(0, e.cd - 1); swing(B, e, who(B, e), 0.7); return; } e.cd = 3; } },
  bodyguard: { n: 'Bodyguard', d: 'Takes the hits for a friend.', f: (B, e) => { const f = B.foes.filter(u => u.hp > 0 && u !== e && u.kit !== 'pylon' && !has(u, 'guard')); if (!f.length) { swing(B, e, who(B, e), 0.9); return; } const t = f.sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; B.log.push({ t: 'act', by: e.id, to: t.id, kind: 'cast', n: 'Cover' }); addStatus(B, t, 'guard', 1, 0.35, e); swing(B, e, who(B, e), 0.5); } },
  charger: { n: 'Charger', d: 'Winds up for two turns, then hits for triple.', f: (B, e) => {
    if (has(e, 'charge')) { e.st = e.st.filter(s => s.id !== 'charge'); swing(B, e, who(B, e), 3, { n: 'Big Hit', windup: true }); e.cd = 1; return; }
    if (e.cd > 0) { e.cd--; swing(B, e, who(B, e), 0.8); return; }
    B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'charge', n: 'Winding up' }); e.st.push({ id: 'charge', t: 9, v: 0, by: e.id }); B.log.push({ t: 'st', to: e.id, id: 'charge', on: true });
  } },
  bubble: { n: 'Bubbler', d: 'Bubbles a friend so hits bounce off.', f: (B, e) => {
    const f = B.foes.filter(u => u.hp > 0 && !has(u, 'bubble'));
    if (e.cd > 0 || !f.length) { e.cd = Math.max(0, e.cd - 1); swing(B, e, who(B, e), 0.8); return; }
    e.cd = 3; const t = f.sort((a, b) => b.hp - a.hp)[0];
    B.log.push({ t: 'act', by: e.id, to: t.id, kind: 'cast', n: 'Bubble' }); addStatus(B, t, 'bubble', 2, 0, e);
  } },
  healer: { n: 'Medic', d: 'Patches up its friends.', f: (B, e) => {
    const f = B.foes.filter(u => u.hp > 0).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
    if (f && f.hp < f.max * 0.7) { B.log.push({ t: 'act', by: e.id, to: f.id, kind: 'cast', n: 'Patch Up' }); healUnit(B, null, f, f.max * 0.25); return; }
    swing(B, e, who(B, e), 0.6);
  } },
  summon: { n: 'Caller', d: 'Calls in more raiders.', f: (B, e) => {
    const live = B.foes.filter(u => u.hp > 0).length;
    if (e.cd > 0 || live >= 4) { e.cd = Math.max(0, e.cd - 1); swing(B, e, who(B, e), 0.8); return; }
    e.cd = 3; B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'cast', n: 'Call for Backup' });
    spawn(B, 'w', 'brawl', e.power * 0.7, 0.6);
  } },
  revive: { n: 'Raiser', d: 'Brings a fallen raider back.', f: (B, e) => {
    const dead = B.foes.filter(u => u.hp <= 0 && !u.noRaise);
    if (e.cd > 0 || !dead.length) { e.cd = Math.max(0, e.cd - 1); swing(B, e, who(B, e), 0.8); return; }
    e.cd = 3; const t = dead[0]; t.noRaise = true; t.hp = Math.round(t.max * 0.5);
    B.log.push({ t: 'act', by: e.id, to: t.id, kind: 'cast', n: 'Get Up' }); B.log.push({ t: 'revive', to: t.id, hp: t.hp });
  } },
  ironclad: { n: 'Ironclad', d: 'Effects do not stick to it.', start: (B, e) => e.st.push({ id: 'immune', t: 99, v: 0, by: e.id }), f: (B, e) => swing(B, e, who(B, e), 1) },
  // the random visitor: hits like a truck, drains the bottle, pays a coin for every hit, and leaves after three turns
  golden: { n: 'Lucky', d: 'Pays out on every hit. Leaves after 3 turns.', start: (B, e) => e.st.push({ id: 'immune', t: 99, v: 0, by: e.id }), f: (B, e) => {
    e.left = (e.left == null ? 3 : e.left) - 1;
    if (e.left <= 0) { B.log.push({ t: 'flee', to: e.id }); e.hp = 0; e.fled = true; return; }
    const t = who(B, e); swing(B, e, t, 1.8); addRage(B, -10); B.log.push({ t: 'drain', by: e.id });
  } },
  // bosses: a loop of moves, one a turn
  boss: { n: 'Boss', d: 'Big moves, in a pattern.', f: (B, e) => {
    const seq = e.moves || ['hit', 'all', 'charge', 'big'];
    const m = seq[e.step % seq.length]; e.step = (e.step || 0) + 1;
    if (m === 'hit') swing(B, e, who(B, e), 1.1);
    else if (m === 'all') { B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'slam', n: 'Ground Slam' }); for (const u of B.heroes) if (u.hp > 0) deal(B, e, u, 0.6); }
    else if (m === 'charge') { B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'charge', n: 'Winding up' }); e.st.push({ id: 'charge', t: 9, v: 0, by: e.id }); B.log.push({ t: 'st', to: e.id, id: 'charge', on: true }); }
    else if (m === 'big') { if (!has(e, 'charge')) { swing(B, e, who(B, e), 1); return; } e.st = e.st.filter(s => s.id !== 'charge'); swing(B, e, who(B, e), 2.6, { n: 'Finisher', windup: true, lethal: e.lethal || 0 }); }
    else if (m === 'breath') {
      if (!has(e, 'charge')) { swing(B, e, who(B, e), 1); return; }
      e.st = e.st.filter(s => s.id !== 'charge');
      const bao = catcher(B);
      if (bao) { B.log.push({ t: 'say', to: bao.id, ic: 'shield' }); swing(B, e, bao, 1.8, { n: 'Fire Breath', windup: true, lethal: e.lethal || 0 }); }
      else { B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'slam', n: 'Fire Breath' }); for (const u of B.heroes) if (u.hp > 0) deal(B, e, u, 1.8, { lethal: (e.lethal || 0) * 0.75 }); }
    }
    else if (m === 'doom') { if (!doomOn(B, e)) swing(B, e, who(B, e), 1); }
    else if (m === 'raise') bossStep(B, e, m);
    else if (m === 'drones') { if (B.foes.some(u => u.kit === 'pylon' && u.hp > 0)) swing(B, e, who(B, e), 1); else bossStep(B, e, m); }
    else if (m === 'call') { B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'cast', n: 'Call for Backup' }); if (B.foes.filter(u => u.hp > 0).length < 3) { spawn(B, 'w', 'brawl', e.power * 0.7, 0.55); } else swing(B, e, who(B, e), 1); }
    else if (m === 'bubble') { B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'cast', n: 'Bubble' }); addStatus(B, e, 'bubble', 1, 0, e); }
    else if (m === 'hex') { const t = who(B, e); B.log.push({ t: 'act', by: e.id, to: t.id, kind: 'cast', n: 'Hex' }); addStatus(B, t, 'weak', 2, 0.6, e); addStatus(B, t, 'poison', 3, e.atk * 0.3, e); }
    else if (m === 'drain') { swing(B, e, who(B, e), 0.9); addRage(B, -18); B.log.push({ t: 'drain', by: e.id }); }
    else if (m === 'heal') { B.log.push({ t: 'act', by: e.id, to: e.id, kind: 'cast', n: 'Second Wind' }); healUnit(B, null, e, e.max * 0.12); }
  } },
};
// what a raider means to do next turn, as it stands right now: the screen shows this over its head. Worked out the same way the kit decides, with no dice
const est = (B, e, t, m) => {
  if (!t) return 0;
  const mk = has(t, 'mark'), mine = Math.max(0.1, 1 + sumV(e, 'power') - sumV(e, 'weak')), its = Math.max(0.1, 1 - sumV(t, 'less') + sumV(t, 'more') - (t.gearLess || 0));
  return Math.max(1, Math.round(e.atk * m * (mk ? 1 - (mk.v || 0.2) : 1) * mine * its * (1 + (B.heat || 0))));
};
EP.intent = (B, e) => {
  if (e.hp <= 0) return null;
  if (e.kit === 'pylon') return { k: 'hold', ic: 'st_shield2' };
  if (has(e, 'stun')) return { k: 'stun', ic: 'stars' };
  const hit = (m, ic, k) => { const t = who(B, e); return { k: k || 'hit', ic: ic || 'sword', to: t && t.id, n: est(B, e, t, m) }; };
  // a wound-up blow: on whoever will really take it, for what it will really do
  const big = (m, lethal) => { let t = who(B, e), half = 1; const bao = catcher(B); if (bao) { t = bao; half = 0.5; } if (!t) return null; const its = Math.max(0.1, 1 - sumV(t, 'less') + sumV(t, 'more') - (t.gearLess || 0)); return { k: 'big', ic: 'boltR', to: t.id, n: Math.max(est(B, e, t, m * half), Math.round(t.max * (lethal || 0) * half * its)) }; };
  const cast = (ic, t) => ({ k: 'cast', ic, to: t && t.id });
  switch (e.kit) {
    case 'pack': return hit(1.2);
    case 'sniper': { const forced = B.heroes.find(u => u.hp > 0 && (has(u, 'taunt') || has(u, 'mirror'))), t = forced || lowest(B); return { k: 'hit', ic: 'target', to: t && t.id, n: est(B, e, t, 1.15) }; }
    case 'bleed': return hit(0.75, 'drop');
    case 'poison': return hit(0.5, 'poison');
    case 'weaken': return e.cd > 0 ? hit(0.9) : cast('st_weak', who(B, e));
    case 'stun': return hit(0.7);
    case 'drain': return hit(0.8, 'bottle');
    case 'smoke': return e.cd > 0 ? hit(0.8) : cast('cloud');
    case 'charger': return has(e, 'charge') ? big(3, 0) : e.cd > 0 ? hit(0.8) : cast('boltR');
    case 'curse': return e.cd > 0 || !B.heroes.some(u => u.hp > 0 && !has(u, 'doom')) ? hit(0.7) : cast('skull', who(B, e));
    case 'bodyguard': return B.foes.some(u => u.hp > 0 && u !== e && u.kit !== 'pylon' && !has(u, 'guard')) ? cast('st_guard') : hit(0.9);
    case 'bubble': return e.cd > 0 || !B.foes.some(u => u.hp > 0 && !has(u, 'bubble')) ? hit(0.8) : cast('bubble');
    case 'healer': { const f = B.foes.filter(u => u.hp > 0).sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; return f && f.hp < f.max * 0.7 ? cast('plus') : hit(0.6); }
    case 'summon': return e.cd > 0 || B.foes.filter(u => u.hp > 0).length >= 4 ? hit(0.8) : cast('horn');
    case 'revive': return e.cd > 0 || !B.foes.some(u => u.hp <= 0 && !u.noRaise) ? hit(0.8) : cast('grave');
    case 'golden': return hit(1.8);
    case 'boss': {
      const seq = e.moves || ['hit', 'all', 'charge', 'big'], m = seq[(e.step || 0) % seq.length];
      if (m === 'hit') return hit(1.1);
      if (m === 'all') { const l = B.heroes.filter(u => u.hp > 0); return { k: 'all', ic: 'burst', n: l.length ? est(B, e, l[0], 0.6) : 0 }; }
      if (m === 'charge') return cast('boltR');
      if (m === 'big') return has(e, 'charge') ? big(2.6, e.lethal) : hit(1);
      if (m === 'breath') { if (!has(e, 'charge')) return hit(1); if (catcher(B)) return big(1.8, e.lethal); const l = B.heroes.filter(u => u.hp > 0); return { k: 'all', ic: 'burst', n: l.length ? Math.max(est(B, e, l[0], 1.8), Math.round(l[0].max * (e.lethal || 0) * 0.75)) : 0 }; }
      if (m === 'doom') return B.heroes.some(u => u.hp > 0 && !has(u, 'doom')) ? cast('skull', who(B, e)) : hit(1);
      if (m === 'raise') return cast('grave');
      if (m === 'drones') return B.foes.some(u => u.kit === 'pylon' && u.hp > 0) ? hit(1) : cast('st_shield2');
      if (m === 'call') return cast('horn');
      if (m === 'bubble') return cast('bubble');
      if (m === 'hex') return cast('st_weak', who(B, e));
      if (m === 'drain') return hit(0.9, 'bottle');
      if (m === 'heal') return cast('plus');
      return hit(1);
    }
    default: return hit(1);
  }
};
// base numbers at power 1 (a level 1 team)
const SPECIES = EP.SPECIES = {
  w: { hp: 40, atk: 24, size: 1.25 }, f: { hp: 30, atk: 27, size: 1.1, air: true }, b: { hp: 92, atk: 33, size: 1.35 },
  B: { hp: 320, atk: 37, size: 1.55, boss: true },
};

// ---------------- a fight ----------------
let uid = 1;
function makeFoe(B, q) {
  const S = SPECIES[q.who] || SPECIES.w, power = (q.power || B.power) * (q.k || 1), map = B.roster;
  const type = q.type || (map && map[q.who]) || 'mudling', base = AF.TD && AF.TD.ENEMIES[type];
  // a raider that only ever loses one point a hit (the golden one) has a count of hits, not health
  const kit = KITS[q.kit] || KITS.brawl, hp = q.onlyHits ? q.hits || 80 : Math.round(S.hp * power * (q.hpK || 1));
  const e = {
    id: 'e' + uid++, side: 'e', who: q.who, type, name: (q.name || (base && base.name) || 'Raider'), kit: q.kit || 'brawl', kitName: kit.n,
    hp, max: hp, atk: S.atk * power * (q.atkK || 1), st: [], cd: q.kit === 'charger' ? 1 : 0, step: 0, power: q.power || B.power, size: S.size, moves: q.moves, air: !!S.air, boss: !!S.boss,
    coinPerHit: q.coin || 0, onlyHits: !!q.onlyHits, capHit: q.cap || 0, lethal: q.lethal || 0, phases: q.phases || null, phaseI: 0,
  };
  if (kit.start) kit.start(B, e);
  if (S.air && (B.stage.world || 0) >= 1) e.st.push({ id: 'aloft', t: 99, v: 0, by: e.id });
  if (q.aloft) e.st.push({ id: 'aloft', t: 99, v: 1, by: e.id });
  if (q.armor) e.st.push({ id: 'armor', t: 99, v: q.armor, by: e.id });
  if (q.ward) e.st.push({ id: 'ward', t: 99, v: 0, by: e.id });
  for (const id of q.aff || []) e.st.push({ id, t: 99, v: 0, by: e.id });
  return e;
}
function spawn(B, who, kit, power, k) {
  const e = makeFoe(B, { who, kit, power, k, hpK: 0.8 });
  B.foes.push(e);
  B.log.push({ t: 'spawn', to: e.id, by: e.id });
  return e;
}
// heroes: { animal, cls, atk, hp, ... } as EP.heroUnit builds them
EP.newBattle = (stage, party, o = {}) => {
  const B = {
    stage, wave: 0, waves: stage.waves, heroes: party.map(p => Object.assign({ id: 'h' + uid++, side: 'h', st: [] }, p)), foes: [],
    roster: stage.roster, power: stage.power, rage: o.rage || 0, rageK: 1, turn: 1, phase: 'player', acted: {}, log: [], state: 'fight',
    stats: { dmg: 0, taken: 0, coins: 0, turns: 0, potions: 0 }, auto: false,
  };
  for (const h of B.heroes) { if (h.rageK) B.rageK = Math.max(B.rageK, h.rageK); h.hp = h.max; }
  loadWave(B);
  return B;
};
function loadWave(B) {
  B.foes = B.waves[B.wave].map(q => makeFoe(B, Object.assign({}, q)));
  rulesOnWave(B);
  B.log.push({ t: 'wave', n: B.wave + 1, of: B.waves.length, foes: B.foes.map(f => f.id) });
  B.acted = {};
}
const liveH = B => B.heroes.filter(u => u.hp > 0);
const liveF = B => B.foes.filter(u => u.hp > 0);
EP.unit = (B, id) => B.heroes.find(u => u.id === id) || B.foes.find(u => u.id === id);
EP.canAct = (B, h) => B.state === 'fight' && B.phase === 'player' && h.side === 'h' && h.hp > 0 && !B.acted[h.id] && !has(h, 'stun');
function settle(B) {
  // (5 Nov): already waiting on the next wave. Without this, a last raider who fell on its own turn, to thorns or a counter, counted again at each check, skipping waves and even the boss
  if (B.state !== 'fight' || B.needsWave) return;
  if (!liveH(B).length) { B.state = 'lost'; B.log.push({ t: 'lost' }); return; }
  if (!liveF(B).length) {
    if (B.wave + 1 < B.waves.length) { B.wave++; B.needsWave = true; return; }
    B.state = 'won'; B.log.push({ t: 'won' });
  }
}
EP.settle = settle;
const take = B => { const l = B.log; B.log = []; return l; };
// bring on the next wave, once the last one has finished dying on screen. No healing and no swaps between waves
EP.nextWave = B => {
  if (!B.needsWave) return [];
  B.needsWave = false;
  loadWave(B);
  // statuses on heroes keep ticking across waves, and a new wave means a new player turn
  B.phase = 'player';
  B.turn++;
  B.stats.turns++;
  return take(B);
};
// the player's three kinds of move. Each returns its events; an illegal move returns null
EP.attack = (B, h, to) => {
  if (!EP.canAct(B, h) || !to || to.side !== 'e' || to.hp <= 0) return null;
  B.acted[h.id] = true;
  B.log.push({ t: 'act', by: h.id, to: to.id, kind: 'attack', n: h.cls.a.n, area: h.cls.a.area });
  h.cls.a.f(ctxOf(B, h, to, h.tierK));
  if (h.extraP && rnd() < h.extraP) { B.acted[h.id] = false; B.log.push({ t: 'again', to: h.id }); }
  settle(B);
  return take(B);
};
EP.support = (B, h, to) => {
  if (!EP.canAct(B, h)) return null;
  const s = h.cls.s, t = s.to === 'self' ? h : to || h;
  if (t.side !== 'h' || t.hp <= 0) return null;
  B.acted[h.id] = true;
  B.log.push({ t: 'act', by: h.id, to: t.id, kind: 'support', n: s.n, all: s.to === 'self' });
  s.f(ctxOf(B, h, t, h.tierK));
  B.stats.sup = (B.stats.sup || 0) + 1;
  settle(B);
  return take(B);
};
// the bottle: only when it is full. It does not use up the hero's action
EP.bottomsUp = (B, h) => {
  if (B.state !== 'fight' || B.phase !== 'player' || B.rage < 100 || h.side !== 'h' || h.hp <= 0) return null;
  B.rage = 0;
  B.log.push({ t: 'rage', v: 0, d: -100 });
  const R = HEROES[h.animal].rage;
  B.log.push({ t: 'act', by: h.id, to: h.id, kind: 'rage', n: R.n });
  R.f(ctxOf(B, h, liveF(B)[0] || null, h.tierK));
  B.stats.rages = (B.stats.rages || 0) + 1;
  settle(B);
  return take(B);
};
// all heroes done (or skipped): every raider goes, then both sides' effects count down
EP.needsEnd = B => B.state === 'fight' && !B.needsWave && B.phase === 'player' && liveH(B).every(h => B.acted[h.id] || has(h, 'stun'));
function tick(B, list) {
  for (const u of list) {
    if (u.hp <= 0) continue;
    for (const s of u.st) {
      if (s.fresh) { s.fresh = false; continue; }
      if (s.id === 'doom' && s.t <= 1) { B.log.push({ t: 'say', to: u.id, ic: 'skull' }); die(B, u, null); break; }
      if (s.id === 'poison' || s.id === 'bleed' || s.id === 'burn') {
        const n = bossClamp(u, Math.max(1, Math.round(s.v)));
        if (n <= 0) { s.t--; continue; }
        u.hp = Math.max(0, u.hp - n);
        B.log.push({ t: 'hit', to: u.id, n, hp: u.hp, dot: s.id });
        if (u.side === 'e') B.stats.dmg += n; else B.stats.taken += n;
        if (u.hp <= 0) { die(B, u, null); break; }
      } else if (s.id === 'regen') healUnit(B, null, u, s.v);
      s.t--;
    }
    if (u.hp > 0) {
      const before = u.st.length;
      u.st = u.st.filter(s => s.t > 0);
      if (u.st.length !== before) B.log.push({ t: 'st', to: u.id, on: false });
    }
  }
}
EP.endTurn = B => {
  if (B.state !== 'fight' || B.phase !== 'player' || B.needsWave) return [];
  tick(B, B.heroes);
  settle(B);
  if (B.state !== 'fight') return take(B);
  B.phase = 'enemy';
  B.stats.turns++;
  B.log.push({ t: 'enemy' });
  bossPhases(B);
  for (const e of B.foes.slice()) {
    if (e.hp <= 0 || !liveH(B).length) continue;
    if (has(e, 'stun')) { B.log.push({ t: 'stunned', to: e.id }); continue; }
    for (let act = 0, acts = has(e, 'frenzy') ? 2 : 1; act < acts && e.hp > 0 && liveH(B).length && !has(e, 'stun'); act++) {
      const it = has(e, 'hush') ? EP.intent(B, e) : null;
      if (it && it.k === 'cast' && !(e.boss && it.ic === 'boltR')) { B.log.push({ t: 'say', to: e.id, ic: 'mute' }); if (e.kit === 'boss') { e.step = (e.step || 0) + 1; e.hushCd = 3; e.st = e.st.filter(s => s.id !== 'hush'); } else if (e.cd) e.cd--; swing(B, e, who(B, e), 0.6); }
      else KITS[e.kit].f(B, e);
      B.log.push({ t: 'beat' });
      settle(B);
      if (B.state !== 'fight') return take(B);
    }
  }
  tick(B, B.foes);
  settle(B);
  if (B.state === 'fight' && !B.needsWave) { rulesOnTurn(B); settle(B); }
  for (const e of B.foes) { e.aim = null; e.fellNow = false; if (e.hushCd > 0) e.hushCd--; }
  if (B.state !== 'fight' || B.needsWave) { B.phase = 'player'; return take(B); }
  B.phase = 'player';
  B.turn++;
  B.acted = {};
  B.log.push({ t: 'player', turn: B.turn });
  return take(B);
};
EP.potion = (B, id, to) => {
  const P = EP.POTIONS[id];
  if (!P || B.state !== 'fight' || B.phase !== 'player') return null;
  const t = to || liveH(B)[0];
  B.log.push({ t: 'potion', id, to: t && t.id });
  P.use(B, t, ctxOf(B, t, t, 1));
  B.stats.potions++;
  settle(B);
  return take(B);
};
EP.POTIONS = {
  heal1: { n: 'Small Soup', d: 'Heals one hero 25%.', pick: 1, use: (B, t, c) => c.heal(t, 0.25) },
  heal2: { n: 'Big Soup', d: 'Heals one hero 50%.', pick: 1, use: (B, t, c) => c.heal(t, 0.5) },
  heal3: { n: 'Hangover Stew', d: 'Heals one hero 75%.', pick: 1, use: (B, t, c) => c.heal(t, 0.75) },
  rage1: { n: 'Shot Glass', d: 'Fills the bottle 25%.', use: B => addRageRaw(B, 25) },
  rage2: { n: 'Half Bottle', d: 'Fills the bottle 50%.', use: B => addRageRaw(B, 50) },
  rage3: { n: 'Golden Bottle', d: 'Fills the bottle 75%.', use: B => addRageRaw(B, 75) },
  group: { n: 'Family Pot', d: 'Heals the whole team 30%.', use: (B, t, c) => { for (const u of liveH(B)) c.heal(u, 0.3); } },
  xp2: { n: 'Study Tea', d: 'Doubles the team XP from this fight.', use: B => { B.xpK = 2; B.log.push({ t: 'xp2' }); } },
  lastcall: { n: 'Last Call', d: 'Every raider in this wave goes home.', use: B => { for (const e of liveF(B)) { e.hp = 0; e.st = []; B.log.push({ t: 'die', to: e.id }); } } },
};
function addRageRaw(B, n) { const k = B.rageK; B.rageK = 1; addRage(B, n); B.rageK = k; }

// ---------------- auto-pilot, and the bots ----------------
// a plain read of the fight: heal who needs it, use guards and buffs when they are not already up, otherwise hit the
// raider most worth hitting. Returns the moves for one hero, or null when that hero has nothing to do.
const focus = (B, attacker) => {
  const l = liveF(B).filter(u => attacker.animal === 'mochi' || !has(u, 'bubble'));
  const list = l.length ? l : liveF(B);
  const score = u => {
    let s = 1 - u.hp / u.max * 0.4;
    // each hero goes for the lock it opens, and leaves the ones it can't touch. Auto does no more thinking than this: it never times a Hush, or saves a Catch
    const me = attacker.animal, aloft = has(u, 'aloft');
    if (has(u, 'armor')) s += me === 'pip' ? 0.8 : -0.5;
    if (has(u, 'hidden')) s += me === 'owl' ? 0.9 : -1;
    if (aloft) s += me === 'dot' ? 0.9 : aloft.v || attacker.style === 'melee' ? -0.5 : 0;
    if (me === 'mochi' && has(u, 'bubble')) s += 0.8;
    if (me === 'hazel' && u.kit === 'pylon') s += 1;
    if (me === 'fox' && (has(u, 'shell') || (ruleK(B, 'tide') && u.hp < u.max && !has(u, 'burn')))) s += 0.4;
    if (u.kit === 'curse') s += 0.5;
    if (has(u, 'ward') && liveF(B).some(o => o !== u && o.kit !== 'pylon')) s -= 1.2;
    if (u.kit === 'healer' || u.kit === 'revive') s += 0.6;
    if (u.kit === 'summon' || u.kit === 'smoke' || u.kit === 'bubble') s += 0.35;
    if (has(u, 'charge')) s += 0.2;
    if (has(u, 'smoke')) s -= 0.4;
    if (u.kit === 'pylon') s += 3;
    if (has(u, 'shell')) s -= 0.3;
    if (ruleK(B, 'restless')) s = 1 + u.hp / u.max * 0.6 - (u.hp / u.max < 0.45 && liveF(B).length > 1 && liveF(B).some(o => o !== u && o.hp / o.max > 0.45) ? 2 : 0);
    return s + rnd() * 0.05 - u.hp / (attacker.atk * 12) * 0.2;
  };
  return list.slice().sort((a, b) => score(b) - score(a))[0];
};
EP.decide = (B, h) => {
  const s = h.cls.s, live = liveH(B);
  // every raider in a bubble: hitting one only hurts us, so support and wait it out
  if (h.animal !== 'mochi' && liveF(B).every(e => has(e, 'bubble'))) return { k: 'support', to: h };
  const doomed = h.animal === 'pig' && live.find(u => has(u, 'doom'));
  if (doomed && s.ai === 'heal') return { k: 'support', to: doomed };
  if (h.animal === 'penguin' && s.n === 'Pick On Me' && !has(h, 'mark') && liveF(B).some(e => has(e, 'frenzy'))) return { k: 'support', to: h };
  const hurt = live.slice().sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
  const allHurt = live.reduce((a, u) => a + (1 - u.hp / u.max), 0) / live.length;
  if (s.ai === 'heal' && (hurt.hp / hurt.max < 0.6 || allHurt > 0.3)) return { k: 'support', to: hurt };
  if (s.ai === 'cleanse' && live.some(u => u.st.some(x => !ST[x.id].good && !ST[x.id].sticky))) return { k: 'support', to: h };
  const big = B.foes.some(e => e.hp > 0 && (has(e, 'charge') || e.boss));
  if (s.ai === 'guard' && !live.some(u => has(u, 'less') || has(u, 'guard') || has(u, 'mark') || has(u, 'mirror'))) {
    if (big || hurt.hp / hurt.max < 0.7 || rnd() < 0.3) {
      const soft = s.n === 'Pick On Me' || s.n === 'Decoy' ? live.slice().sort((a, b) => b.hp - a.hp)[0] : hurt;
      return { k: 'support', to: soft };
    }
  }
  if (s.ai === 'buff' && B.turn % 3 === 1 && !h.st.some(x => ST[x.id].good && x.by === h.id)) return { k: 'support', to: live.slice().sort((a, b) => b.atk - a.atk)[0] };
  if (s.ai === 'nuke' && liveF(B).length >= 2 && h.hp / h.max > 0.5) return { k: 'support', to: live.slice().sort((a, b) => b.atk - a.atk).find(u => u !== h) || h };
  return { k: 'attack', to: focus(B, h) };
};
// who gets the bottle: a healer when the team is hurting, otherwise the hardest hitter
EP.decideBottle = B => {
  if (B.rage < 100) return null;
  const live = liveH(B), avg = live.reduce((a, u) => a + u.hp / u.max, 0) / live.length;
  const healer = live.find(u => HEROES[u.animal].rage.ai === 'heal');
  if (healer && avg < 0.6) return healer;
  if (avg >= 0.6 && !liveF(B).some(e => e.hp > e.max * 0.25)) return null; // nothing worth it left: save it for the next wave
  return live.filter(u => HEROES[u.animal].rage.ai !== 'heal').sort((a, b) => b.atk - a.atk)[0] || live[0];
};
// a whole fight with no screen; returns the battle when it is over. Potions: used when a hero is about to fall
EP.simulate = (B, o = {}) => {
  let guard = 0;
  while (B.state === 'fight' && guard++ < 400) {
    if (B.needsWave) { EP.nextWave(B); continue; }
    const bottle = EP.decideBottle(B);
    if (bottle) EP.bottomsUp(B, bottle);
    if (B.state !== 'fight' || B.needsWave) continue;
    const h = liveH(B).find(u => EP.canAct(B, u));
    if (h) {
      const m = EP.decide(B, h);
      if (m.k === 'support') EP.support(B, h, m.to); else EP.attack(B, h, m.to);
      continue;
    }
    EP.endTurn(B);
  }
  return B;
};
// 1 to 3: quick and unhurt. Health left counts only as it stands at the end, so healing up before the last blow helps
EP.parOf = stage => stage.waves.length * 2 + (stage.boss ? 2 : 1);
EP.starsOf = B => {
  const left = B.heroes.reduce((a, u) => a + u.hp / u.max, 0) / B.heroes.length, par = EP.parOf(B.stage);
  let s = 3;
  if (left < 0.45) s--;
  if (B.stats.turns > par + 1) s--;
  return Math.max(1, s);
};
EP.fmt = pct;
})();
