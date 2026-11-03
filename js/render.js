/* Aura Farm card renderer: one shared WebGL renderer draws every visible unit, then each card canvas gets
   back effects, the figure, front effects. Cards register a canvas with AF.R3.view() and drop out when removed. */
(function () {
const T = THREE, AF = window.AF, K = AF.kit;
const DPR = Math.min(2, window.devicePixelRatio || 1);
const ART = [[240, 270], [360, 405], [720, 810]]; // small card, card, hero (8:9); picked by the canvas size
const BUDGET_MS = 7; // time the cards may take per frame; with many on screen each one animates at a lower rate
let cardMs = 1; // how long a card takes to draw, a running average; the budget check uses it for a card not drawn yet
const RIM = {
  common: [0xc4ccda, 0x8a8f99], rare: [0x6fb0ff, 0x3d8bff], epic: [0xc47bff, 0x6a3aff], legendary: [0x6fd8ff, 0xffb21e],
  mythic: [0xff4fd8, 0x4fe6ff], secret: [0xffffff, 0xff2a4a], divine: [0xfff2b0, 0x9fe8ff],
  transcendent: [0x7dffcf, 0xa07bff], primordial: [0xff6a1a, 0xffd23a], eternal: [0xffffff, 0xff3bc8], absolute: [0xffffff, 0x2ee6ff],
};
const gls = [];
function gl(i) {
  if (!gls[i]) {
    const r = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(ART[i][0], ART[i][1], false);
    r.outputColorSpace = T.SRGBColorSpace; r.setClearColor(0x000000, 0);
    gls[i] = r;
  }
  return gls[i];
}
const scratch = [0, 1].map(() => { const c = document.createElement("canvas"); c.width = 1100; c.height = 1240; return c; });
const sF = scratch[0].getContext("2d"), sB = scratch[1].getContext("2d");

// one unit's figure built into any parent: rig, accessories, marks, size, shiny recolour. The cards and the Defense
// board (board.js) both build through here
function makeRig(parent, key, shiny, gold) {
  const def = AF.UNIT[key];
  const R = K.rig(parent, def.look);
  R.P = Object.assign({}, def.pose || {});
  for (const [n, o] of def.acc || []) {
    if (K.acc[n]) K.acc[n](R, def.look, o || {});
    else console.warn("Aura Farm: no accessory", n, "for", key);
  }
  if (def.build) def.build(R, def.look);
  for (const [name, par, x, y, z] of def.marks || []) K.marker(R, name, R[par] || R.m[par], x, y, z);
  if (def.scale) R.root.scale.setScalar(def.scale);
  if (gold) {
    // (29 Oct, "golden turns the whole characters model shiny gold"): each part's lightness onto a gold ramp, a touch
    // of glow; on materials of its own (they're shared by colour)
    const hsl = {}, lo = new T.Color(0x7a4a08), mid = new T.Color(0xf0b52a), hi = new T.Color(0xfff3b8);
    R.root.traverse(o => {
      if (!o.isMesh || o.material.side === T.BackSide) return;
      o.material = o.material.clone();
      o.material.color.getHSL(hsl);
      const l = Math.min(1, Math.max(0, hsl.l * 1.15 + 0.08));
      o.material.color.copy(l < 0.5 ? lo.clone().lerp(mid, l / 0.5) : mid.clone().lerp(hi, (l - 0.5) / 0.5));
      if (o.material.emissive) { o.material.emissive.set(0x3a2400); o.material.emissiveIntensity = 0.6; }
    });
  } else if (shiny) {
    // shiny: every colour swung round the wheel and pushed brighter, on materials of its own (they're shared by colour)
    const hsl = {};
    R.root.traverse(o => {
      if (!o.isMesh || o.material.side === T.BackSide) return;
      o.material = o.material.clone();
      o.material.color.getHSL(hsl);
      o.material.color.setHSL((hsl.h + 0.47) % 1, Math.min(1, hsl.s * 1.25 + 0.12), Math.min(0.85, hsl.l * 1.08 + 0.04));
    });
  }
  return AF.soju.dress(R, def, key, shiny, gold);
}
const built = {};
function build(key, shiny, gold) {
  const ck = key + (gold ? ":gold" : shiny ? ":shiny" : "");
  if (built[ck]) return built[ck];
  const def = AF.UNIT[key];
  const S = new T.Scene();
  const rim = def.rim || RIM[def.rarity];
  S.add(new T.HemisphereLight(0xf6f2ff, 0x221a2a, 1.1));
  const k = new T.DirectionalLight(0xffffff, 2.3); k.position.set(-4, 7, 6); S.add(k);
  const r1 = new T.DirectionalLight(rim[0], 2.0); r1.position.set(5, 3, -6); S.add(r1);
  const r2 = new T.DirectionalLight(rim[1], 1.4); r2.position.set(-6, 2, -4); S.add(r2);
  const R = makeRig(S, key, shiny, gold);
  K.animate(R, 0, R.P);
  S.updateMatrixWorld(true);
  // frame the whole figure (and whatever orbits it) from a fixed 3/4 angle
  const bb = new T.Box3().setFromObject(R.root), size = bb.getSize(new T.Vector3()), c = bb.getCenter(new T.Vector3());
  const cam = new T.PerspectiveCamera(26, 8 / 9, 0.1, 300);
  const th = Math.tan((13 * Math.PI) / 180);
  const dist = Math.max((size.y * 1.12) / 2 / th, (size.x * 1.08) / 2 / (th * cam.aspect)) * (def.zoom || 1) + size.z * 0.45;
  const target = c.clone(); target.y -= size.y * 0.03;
  cam.position.copy(target).addScaledVector(new T.Vector3(0.27, 0.2, 1).normalize(), dist);
  cam.lookAt(target);
  centre(R, cam, dist);
  return (built[ck] = { def, S, R, cam });
}
// (29 Oct, request: "this unit is on the left side, like its not centered. this is true for a couple others too"): the
// box round everything sat in the middle, so a sword, hammer or lantern held out to one side pushed the body off it
// (Riftling's sat 20% of the card left; 17 units 6% or more). Across, the camera now aims at the torso and backs off
// to keep the far side in, by at most 15%; past that the end of the weapon runs off the card instead
const right = new T.Vector3(), back = new T.Vector3(), pt = new T.Vector3();
function centre(R, cam, dist) {
  cam.updateMatrixWorld();
  // (30 Oct) a card of two figures (the twins) aims between them: R.centre
  (R.centre || R.torso).getWorldPosition(pt).applyMatrix4(cam.matrixWorldInverse);
  cam.position.addScaledVector(right.setFromMatrixColumn(cam.matrixWorld, 0), pt.x);
  cam.updateMatrixWorld();
  const tanX = Math.tan((cam.fov * Math.PI) / 360) * cam.aspect * 0.97;
  let need = 0;
  R.root.traverse(o => {
    if (!o.isMesh || !o.visible) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const b = o.geometry.boundingBox;
    for (let i = 0; i < 8; i++) {
      pt.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(o.matrixWorld).applyMatrix4(cam.matrixWorldInverse);
      need = Math.max(need, Math.abs(pt.x) / tanX + pt.z); // how far back this corner needs the camera (z is minus its depth)
    }
  });
  cam.position.addScaledVector(back.setFromMatrixColumn(cam.matrixWorld, 2), Math.min(need, dist * 0.15));
  cam.updateMatrixWorld();
}

const views = new Set();
const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target._view; if (v) v.visible = e.isIntersecting; }), { rootMargin: "80px" });
// (29 Oct, perf pass): a card draws only once this has sized its canvas. Before that it's the 300x150 default, and the
// first card of a page drawn at that size made a second renderer for big cards and compiled every shader again (76 ms)
const ro = new ResizeObserver(es => es.forEach(e => {
  const v = e.target._view; if (!v) return;
  const w = Math.round(e.contentRect.width * DPR), h = Math.round(e.contentRect.height * DPR);
  if (w && h && (w !== v.canvas.width || h !== v.canvas.height)) { v.canvas.width = w; v.canvas.height = h; }
  if (w && h) v.sized = true;
}));
const tmp = new T.Vector3(), tmp2 = new T.Vector3();

function draw(v, t) {
  const W = v.canvas.width, H = v.canvas.height;
  if (W < 4 || H < 4) return;
  const U = build(v.key, v.shiny, v.gold), r = gl(v.hero ? 2 : W <= 280 ? 0 : 1);
  const tt = t + v.phase, dt = Math.min(0.1, Math.max(0, t - (v.lt === undefined ? t : v.lt)));
  v.lt = t;
  K.animate(U.R, tt, U.R.P);
  r.render(U.S, U.cam);
  // screen point of a marker plus its depth against the body (third value > 0 = behind the figure), so 2D effects
  // on things orbiting behind him go on the back layer and get covered by the model
  U.R.torso.getWorldPosition(tmp2); tmp2.applyMatrix4(U.cam.matrixWorldInverse);
  const zc = -tmp2.z;
  const scr = name => {
    const o = U.R.m[name]; if (!o) return null;
    o.getWorldPosition(tmp);
    tmp2.copy(tmp).applyMatrix4(U.cam.matrixWorldInverse);
    tmp.project(U.cam);
    return [(tmp.x * 0.5 + 0.5) * W, (-tmp.y * 0.5 + 0.5) * H, -tmp2.z - zc];
  };
  const p = { t: tt, dt, W, H, S: W / 240, scr, src: r.domElement, R: U.R };
  sF.clearRect(0, 0, W, H); sB.clearRect(0, 0, W, H);
  sF.globalCompositeOperation = sB.globalCompositeOperation = "lighter";
  if (v.fx !== false) {
    K.aura(v.tier, sF, sB, v.aura, p);
    (U.def.fx || []).forEach((o, i) => { const f = K.FX[o.k]; if (f) f(sF, sB, v.st[i] || (v.st[i] = {}), p, o); });
    if (v.shiny) {
      K.FX.stars(sF, sB, v.st.sh1 || (v.st.sh1 = {}), p, { c: "rainbow", rate: 5 });
      K.FX.motes(sF, sB, v.st.sh2 || (v.st.sh2 = {}), p, { c: "rainbow", rate: 8, size: 1.2 });
    }
  }
  sF.globalCompositeOperation = sB.globalCompositeOperation = "source-over";
  const ctx = v.ctx;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(scratch[1], 0, 0, W, H, 0, 0, W, H);
  ctx.drawImage(r.domElement, 0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(scratch[0], 0, 0, W, H, 0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
}

AF.R3 = {
  build, makeRig, RIM,
  // one card canvas showing one unit; tier = trait tier for the aura; hero = big renderer
  view(canvas, key, o = {}) {
    const v = { canvas, ctx: canvas.getContext("2d"), key, hero: !!o.hero, tier: o.tier || 0, phase: o.phase === undefined ? Math.random() * 30 : o.phase,
      st: {}, aura: {}, visible: false, fx: o.fx, shiny: !!o.shiny, gold: !!o.gold };
    canvas._view = v; io.observe(canvas); ro.observe(canvas); views.add(v);
    return v;
  },
  drop(v) { if (!v) return; io.unobserve(v.canvas); ro.unobserve(v.canvas); views.delete(v); },
  setTier(v, tier) { if (v.tier !== tier) { v.tier = tier; v.aura = {}; } },
  frame(t) {
    const list = [];
    for (const v of views) {
      if (!v.canvas.isConnected) { AF.R3.drop(v); continue; }
      if (v.visible && v.sized) list.push(v);
    }
    // (28 Oct, request: "change the fps of the units based on the amount"): heroes draw every frame; the other cards
    // take turns, stalest first, until this frame's time budget is spent (measured 19 ms/frame for 21 cards before)
    list.sort((a, b) => (b.hero - a.hero) || ((a.lt || 0) - (b.lt || 0)));
    // (29 Oct, perf pass, a grid of 40 measured 7.5 ms median against the 7 ms budget and a 269 ms first frame): a card
    // is skipped when its own expected draw, plus a fifth for its jitter, would cross the budget (cards cost 0.3 to
    // 3.2 ms each, so one shared figure let a heavy one through), and a card whose figure isn't built yet only goes first in a frame, one a frame, so a
    // new page of cards doesn't land in one frame. Skipped cards are the stalest next frame, so none of them starves
    const t0 = performance.now();
    let n = 0;
    for (const v of list) {
      const isNew = !built[v.key + (v.gold ? ":gold" : v.shiny ? ":shiny" : "")];
      if (!v.hero && n > 0 && (isNew || performance.now() - t0 + (v.ms || cardMs) * 1.2 > BUDGET_MS)) continue;
      const a = performance.now();
      draw(v, t);
      const d = performance.now() - a;
      if (!isNew) { v.ms = v.ms ? v.ms * 0.7 + d * 0.3 : d; cardMs = cardMs * 0.9 + d * 0.1; }
      if (!v.hero) n++;
    }
  },
};
})();
