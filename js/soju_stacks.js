/* Stolen lunchboxes. (3 Nov, owner: "make defense easier and make starting cash less and just make the wave progression like btd 6 and see if we can
   change hp to btd6 balloon layer style damage management but do something unique that fits the theme")
   Picnic raiders carry a stack of stolen lunchboxes on their heads. A hit knocks boxes off: one pop is one box, and a bigger hit carries on through the
   next ones. Each box is a soju flavour, the top one showing how far gone they are, and a raider gets lighter and faster with every box it loses.
   Brutes carry steel tiffins that take several pops each. A boss hauls a whole feast. Leaking costs a life per box still carried, knocking a box off
   pays cash, and clearing a round pays a bonus. A round starts when you say, or a moment after the last with Auto next, and never on a clock.
   Loaded after soju_rules.js. Rules here touch td.js through TD.stackOf, TD.popped, TD.leakCost and TD.killCash. */
(function () {
const AF = window.AF, TD = AF.TD, T = THREE, K = AF.kit;
const E = TD.ENEMIES;

// ---------------- the numbers ----------------
const BOSS_BOXES = 12;
TD.STACK = { BRUTE_K: 5, BOSS_K: 10 };   // pops a steel tiffin takes, and each box of a boss's feast
const LIGHTER = 0.05, HEAVY = 0.04, MIN_LOAD = 0.75, MAX_LIGHT = 1.4; // a full stack slows a raider, and each box lost speeds it up
const POP_CASH = 1;
TD.NEXT_GAP = 2.5;  // Auto next's pause between rounds
TD.BOARD_LIVES = 100;
const START_CASH = 300, ROUNDS = 15;
for (const m of TD.MAPS) { m.cash = START_CASH; m.lives = TD.BOARD_LIVES; }
for (const k of Object.keys(E)) E[k].armor = 0; // a steel tiffin does this job now, and a whole hit should always knock a whole box
TD.FARM.cost = 400; TD.FARM.pay = 60;
TD.UP.fightK = 2;
TD.UP.atk = Math.pow(4, 1 / TD.UP.max); // what the cards say a full upgrade gives; TD.live below is the real step
TD.DIFF.normal.speed = 1.2; TD.DIFF.hard.speed = 1.25; TD.DIFF.nightmare.speed = 1.35;
// Tuned with bots in tools/soju_stacks.mjs. Normal is always winnable with most lives left, Hard asks more of the late worlds, Nightmare can still lose.
TD.DIFF.hard.hp = 1.7; TD.DIFF.nightmare.hp = 2.6;
TD.MAPS.forEach((m, i) => { m.hpK = 1 + 0.25 * i; });
TD.bonus = (M, n) => Math.round((80 + 10 * n) * M.diff.cash * (M.map.cashK || 1));

// Whole pops: half the tower's base again per upgrade, four times it fully upgraded. A trait's edge can make a fraction, which carries to the next hit.
TD.live = p => {
  if (p.s.kind === 'farm') return { atk: 0, spa: 0, rng: 0 };
  return { atk: p.s.atk * (1 + 0.5 * p.lv) * (p.gm || 1), spa: p.s.spa / (p.gs || 1), rng: p.s.rng + TD.UP.rng * p.lv };
};

// ---------------- rounds, in the order BTD6 teaches them ----------------
// One thing new at a time: more of the plainest box, then a second box, then flyers, then deeper stacks, a rush, the first brute, and a boss to finish.
// w walker, f flyer, b brute, B boss: [who, how many, boxes, seconds between]
const ROUND = [
  [['w', 8, 1, 0.9]],
  [['w', 12, 1, 0.7]],
  [['w', 8, 1, 0.7], ['f', 3, 1, 1]], // (3 Nov, owner: "have flying type show up on map one so they get used to all the different mob types")
  [['w', 10, 1, 0.6], ['w', 4, 2, 0.8]],
  [['w', 10, 2, 0.6], ['f', 4, 1, 0.8]],
  [['w', 14, 2, 0.5], ['f', 6, 1, 0.6]],
  [['w', 10, 3, 0.6], ['f', 6, 2, 0.6]],
  [['b', 1, 2, 0], ['w', 12, 2, 0.5]],
  [['w', 24, 2, 0.28], ['f', 10, 2, 0.4]],
  [['w', 16, 3, 0.5]],
  [['w', 12, 4, 0.55], ['f', 8, 2, 0.5]],
  [['b', 3, 2, 1.6], ['w', 14, 3, 0.45]],
  [['w', 16, 4, 0.45], ['f', 10, 3, 0.4]],
  [['b', 4, 3, 1.3], ['w', 12, 5, 0.5]],
  [['B', 1, BOSS_BOXES, 0], ['w', 12, 3, 0.8], ['f', 8, 3, 0.8]],
];
for (const m of TD.MAPS) {
  const types = {}, authored = m.wave;
  for (const [type] of authored(m.waves || 15)) {
    const d = E[type];
    if (d.boss) types.B = type; else if (d.air) types.f = type; else if (!types.w) types.w = type; else types.b = type;
  }
  m.roster = types;
  m.waves = ROUNDS;
  m.wave = n => ROUND[Math.min(n, ROUND.length) - 1].map(([who, count, boxes, gap]) => [types[who], count, gap, boxes]);
}
// Endless: the same lessons, then deeper stacks and more of them for as long as you last
const Tw = TD.TOWER;
Tw.lives = TD.BOARD_LIVES; Tw.cash = 1; Tw.startCash = START_CASH;
for (const tw of Tw.TWISTS) if (tw.id === 'thin') { tw.lives = 50; tw.desc = '50 lives instead of 100.'; }
for (const tw of Tw.TWISTS) if (tw.id === 'swarm') tw.desc = 'Half again as many enemies, each with a lighter stack.';
for (const tw of Tw.TWISTS) if (tw.id === 'titans') tw.desc = 'Steel tiffins take twice as many pops.';
for (const tw of Tw.TWISTS) if (tw.id === 'plated') tw.desc = 'Every hit knocks 15% less off.';
for (const tw of Tw.TWISTS) if (tw.id === 'lean') tw.desc = 'Boxes and floors pay 30% less cash.';
const floor0 = Tw.floor;
Tw.floor = (K2, tw) => {
  const list = floor0(K2, tw);
  return n => list(n).map(([type, count, gap]) => {
    const d = E[type], deep = 1 + Math.floor(n / 3);
    return [type, count, gap, d.boss ? BOSS_BOXES : d.air ? Math.max(1, deep - 1) : type === K2.brute ? 1 + Math.floor(n / 5) : deep];
  });
};

// ---------------- a stack ----------------
const weight = M => (M.map.hpK || 1) * M.diff.hp * (M.map.tower ? 1 + (M.wave - 1) * 0.04 : 1);
TD.stackOf = (M, q, d) => {
  const load = weight(M) * (d.hpT || 1), twist = M.map.tower && M.map.tower.twist;
  let k = 1, boxes = q.tier || (d.boss ? BOSS_BOXES : 1), kind = 'box';
  if (d.boss) { k = Math.round(TD.STACK.BOSS_K * load); kind = 'feast'; }
  else if (M.map.roster ? q.type === M.map.roster.b : M.map.tower && q.type === M.map.tower.kinds.brute) { k = Math.round(TD.STACK.BRUTE_K * load); kind = 'steel'; }
  else boxes = Math.max(1, Math.round(boxes * load));
  if (twist && twist.hp && kind === 'box') boxes = Math.max(1, Math.round(boxes * twist.hp));
  return { hp: boxes * k, k, boxes, full: boxes, kind, load: Math.max(MIN_LOAD, 1 - HEAVY * (boxes - 1)) };
};
// after any damage: anything knocked off pays, and the raider feels lighter
TD.popped = (M, p, e) => {
  if (!e.k) return;
  const left = e.hp > 0 ? Math.ceil(e.hp / e.k - 1e-9) : 0;
  if (left >= e.boxes) return;
  const n = e.boxes - left;
  e.boxes = left;
  M.popCash = (M.popCash || 0) + n * e.k * POP_CASH * M.diff.cash * (M.map.cashK || 1);
  const whole = Math.floor(M.popCash);
  M.popCash -= whole; M.cash += whole;
  if (e.speed0) e.speed = e.speed0 * Math.min(MAX_LIGHT, e.load + LIGHTER * (e.full - left));
};
// a leak costs what it still carries: a steel box counts double, and a feast box counts eight, so a boss you barely touched costs nearly everything
TD.leakCost = e => Math.max(1, e.boxes * (e.def.boss ? 8 : e.k > 1 ? 2 : 1));
TD.killCash = () => 0;

// ---------------- drawing a stack: the top of each foe's cube, then a box for each, knocked ones tumbling off ----------------
const FLAVOUR = [0xf7efdc, 0xffe14a, 0xff9a7a, 0x8fce3f, 0x5a6be0, 0xff8a1e, 0x2a2a34]; // rice, lemon, peach, green grape, blueberry, mango, black label
const STEEL = [0xc2c9d4, 0x9aa3b2, 0xdde2ea];
const FEAST = [0xd9413f, 0xf2c23a, 0xf6f4ee, 0x35b56a];
const colourOf = (kind, i) => (kind === 'steel' ? STEEL[i % STEEL.length] : kind === 'feast' ? FEAST[i % FEAST.length] : FLAVOUR[Math.min(i, FLAVOUR.length - 1)]);
const SHOW = 7, BOX_H = 0.2;
const boxGeo = new T.BoxGeometry(0.62, BOX_H * 0.82, 0.62), lidGeo = new T.BoxGeometry(0.66, BOX_H * 0.24, 0.66), clipGeo = new T.BoxGeometry(0.1, BOX_H * 0.5, 0.67);
function makeBox(col, kind) {
  const g = new T.Group(), body = new T.Mesh(boxGeo, K.mat(col)), lid = new T.Mesh(lidGeo, K.mat(kind === 'steel' ? 0x7a8494 : new T.Color(col).multiplyScalar(0.78).getHex())), clip = new T.Mesh(clipGeo, K.mat(0xfff8e8));
  lid.position.y = BOX_H * 0.42; g.add(body, lid, clip);
  return g;
}
const flying = [];
const S = AF.soju.stacks = {
  // how high a foe's stack reaches, for its health bar
  top(v) { const body = v.g.userData.body, base = (body ? body.position.y : 0) + (v.g.userData.top || 0.9), n = v.stack ? v.stack.children.length : 0; return (base + n * BOX_H * (v.e.kind === 'feast' ? 1.5 : 1)) * v.e.def.size; },
  pose(v, dt, ctx) {
    const e = v.e;
    if (!e.k) return;
    if (!v.stack) {
      v.stack = new T.Group();
      v.stack.position.y = (v.g.userData.top || 0.9) + 0.02;
      if (e.kind === 'feast') v.stack.scale.setScalar(1.5);
      (v.g.userData.body || v.g).add(v.stack);
      v.shown = Math.min(e.boxes, SHOW);
      v.fall = e.boxes;
      for (let i = 0; i < v.shown; i++) { const b = makeBox(colourOf(e.kind, i), e.kind); b.position.y = i * BOX_H; b.rotation.y = (i * 0.37) % 0.5 - 0.25; v.stack.add(b); }
    }
    // knocked off since last time
    if (e.boxes < v.fall) {
      const lost = v.fall - e.boxes;
      v.fall = e.boxes;
      const want = Math.min(e.boxes, SHOW);
      // only so many tumble at once, whatever the hit
      for (let i = v.stack.children.length - 1, n = 0; i >= want; i--, n++) {
        const b = v.stack.children[i];
        v.stack.remove(b);
        b.position.set(e.x, S.top(v) - (want - i) * BOX_H, e.z);
        b.scale.setScalar(e.def.size * (e.kind === 'feast' ? 1.5 : 1));
        ctx.world.add(b);
        const a = Math.random() * 6.283;
        flying.push({ b, vx: Math.cos(a) * 2.2, vy: 3 + Math.random() * 1.5, vz: Math.sin(a) * 2.2, rx: 5 + Math.random() * 6, rz: 4 + Math.random() * 5, life: 0.6 });
      }
      const col = colourOf(e.kind, Math.max(0, e.boxes));
      if (ctx.V && ctx.V.on) ctx.V.burst(true, e.x, S.top(v), e.z, Math.min(10, 4 + lost * 2), { cols: [col, 0xffffff], speed: [1.2, 2.8], up: 1.4, life: [0.2, 0.4], size: [0.1, 0.02], cell: ctx.V.CELL.star, k: 1.6, grav: 6 });
      ctx.popSound(lost);
    }
    v.stack.rotation.z = Math.sin(v.ph + e.d * 3) * 0.05;
  },
  // the foe is going back in the pool: what it still carried goes with it
  free(v) { if (v.stack) { v.stack.removeFromParent(); v.stack = null; } },
  frame(dt) {
    for (let i = flying.length - 1; i >= 0; i--) {
      const f = flying[i];
      f.life -= dt;
      if (f.life <= 0) { f.b.removeFromParent(); flying.splice(i, 1); continue; }
      f.vy -= 11 * dt;
      f.b.position.x += f.vx * dt; f.b.position.y += f.vy * dt; f.b.position.z += f.vz * dt;
      f.b.rotation.x += f.rx * dt; f.b.rotation.z += f.rz * dt;
    }
  },
  flying: () => flying.length,
};
})();
