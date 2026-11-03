/* Aura Farm screen effects and sound: a full-screen particle layer (bursts, coins, rings, rays, confetti),
   screen shake, slow motion, squash-and-stretch pops, number tweens, and synthesized audio (no sound files). */
(function () {
const AF = window.AF;
const FX = AF.fx = {};
const PI = Math.PI, rnd = (a, b) => a + Math.random() * (b - a);
AF.time = { scale: 1, target: 1 };
FX.reduced = () => (AF.G && AF.G.S && AF.G.S.opts.reduced) || matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------- particle layer ----------------
const cv = document.getElementById("fxc"), ctx = cv.getContext("2d");
let DPR = 1;
function fit() { DPR = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * DPR; cv.height = innerHeight * DPR; }
fit(); addEventListener("resize", fit);
const parts = [], rings = [], rays = [];

const RAINBOW = ["#ff3b4e", "#ff9a2e", "#ffe93a", "#4dff7a", "#2ee6ff", "#4d6bff", "#b84dff", "#ff3bc8"];
FX.RAINBOW = RAINBOW;
// o: n, colors, speed, spread (radians, around angle), angle, gravity, size, life, shape, drag
// (30 Oct, "all the effects for trait rerolls get like queued up until I come back to the tab"): a hidden tab doesn't
// draw, so nothing is added while it's hidden (it would wait and play all at once on the way back)
const unseen = () => document.hidden;
FX.burst = (x, y, o = {}) => {
  if (unseen()) return;
  const n = FX.reduced() ? Math.ceil((o.n || 24) / 3) : (o.n || 24);
  for (let i = 0; i < n; i++) {
    const a = (o.angle === undefined ? rnd(0, PI * 2) : o.angle + rnd(-1, 1) * (o.spread || PI));
    const sp = (o.speed || 420) * rnd(0.35, 1);
    const cols = o.colors || ["#ffffff"];
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.gravity === undefined ? 600 : o.gravity, life: 0,
      max: (o.life || 0.9) * rnd(0.6, 1.2), s: (o.size || 4) * rnd(0.6, 1.4), c: cols[(Math.random() * cols.length) | 0],
      shape: o.shape || "spark", rot: rnd(0, 6), vr: rnd(-10, 10), drag: o.drag || 1.6, add: o.add !== false });
  }
};
FX.ring = (x, y, o = {}) => unseen() || rings.push({ x, y, life: 0, max: o.life || 0.6, r: o.r || 180, w: o.w || 8, c: o.c || "#ffffff", rainbow: o.rainbow });
FX.rays = (x, y, o = {}) => unseen() || rays.push({ x, y, life: 0, max: o.life || 1.6, n: o.n || 16, c: o.c || "#ffffff", len: o.len || 900, rainbow: o.rainbow, spin: o.spin || 0.4 });
// coins arc from one point to another; onHit fires as each lands
FX.coins = (from, to, n, onHit, o = {}) => {
  // hidden: no coins, but each one's landing still counts (it gives back the yen the counter held for it)
  if (unseen()) { if (onHit) for (let i = 0; i < n; i++) onHit(); return; }
  for (let i = 0; i < n; i++) {
    const delay = i * (o.gap || 0.025);
    parts.push({ coin: true, x: from.x, y: from.y, sx: from.x + rnd(-40, 40), sy: from.y + rnd(-30, 30), tx: to.x, ty: to.y,
      cx: (from.x + to.x) / 2 + rnd(-220, 220), cy: Math.min(from.y, to.y) - rnd(80, 260), life: -delay, max: o.dur || rnd(0.55, 0.8),
      s: o.size || rnd(7, 10), onHit, rot: rnd(0, 6) });
  }
};
function drawCoin(x, y, s, rot) {
  const w = Math.abs(Math.cos(rot)) * s + 1.5;
  ctx.fillStyle = "#a86a00"; ctx.beginPath(); ctx.ellipse(x, y + 1.5, w, s, 0, 0, PI * 2); ctx.fill();
  ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.ellipse(x, y, w, s, 0, 0, PI * 2); ctx.fill();
  ctx.fillStyle = "#fff3a8"; ctx.beginPath(); ctx.ellipse(x - w * 0.25, y - s * 0.3, w * 0.35, s * 0.3, 0, 0, PI * 2); ctx.fill();
}
function frameParts(dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = rays.length - 1; i >= 0; i--) {
    const r = rays[i]; r.life += dt;
    if (r.life > r.max) { rays.splice(i, 1); continue; }
    const k = r.life / r.max, a = Math.sin(Math.min(1, k * 4) * PI / 2) * (1 - k);
    ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.life * r.spin);
    ctx.globalCompositeOperation = "lighter";
    for (let j = 0; j < r.n; j++) {
      ctx.rotate((PI * 2) / r.n);
      const g = ctx.createLinearGradient(0, 0, r.len, 0);
      const c = r.rainbow ? RAINBOW[j % RAINBOW.length] : r.c;
      g.addColorStop(0, hexA(c, 0.5 * a)); g.addColorStop(1, hexA(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r.len, -r.len * 0.05); ctx.lineTo(r.len, r.len * 0.05); ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalCompositeOperation = "lighter";
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.life += dt;
    if (r.life > r.max) { rings.splice(i, 1); continue; }
    const k = r.life / r.max, e = 1 - Math.pow(1 - k, 3);
    ctx.strokeStyle = r.rainbow ? `hsla(${(r.life * 600) % 360},100%,65%,${1 - k})` : hexA(r.c, 1 - k);
    ctx.lineWidth = r.w * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(r.x, r.y, e * r.r, 0, PI * 2); ctx.stroke();
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life += dt;
    if (p.coin) {
      if (p.life < 0) continue;
      const k = Math.min(1, p.life / p.max), e = k * k * (3 - 2 * k), u = 1 - e;
      const x = u * u * p.sx + 2 * u * e * p.cx + e * e * p.tx, y = u * u * p.sy + 2 * u * e * p.cy + e * e * p.ty;
      ctx.globalCompositeOperation = "source-over";
      drawCoin(x, y, p.s * (1 - k * 0.4), p.rot + p.life * 12);
      ctx.globalCompositeOperation = "lighter";
      if (k >= 1) { parts.splice(i, 1); if (p.onHit) p.onHit(); }
      continue;
    }
    if (p.life > p.max) { parts.splice(i, 1); continue; }
    const k = p.life / p.max, d = Math.exp(-p.drag * dt);
    p.vx *= d; p.vy = p.vy * d + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    ctx.globalCompositeOperation = p.add ? "lighter" : "source-over";
    const a = 1 - k;
    if (p.shape === "spark") {
      ctx.strokeStyle = hexA(p.c, a); ctx.lineWidth = p.s * 0.6 * (1 - k * 0.5); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); ctx.stroke();
    } else if (p.shape === "star") {
      ctx.fillStyle = hexA(p.c, a); AF.kit.star(ctx, p.x, p.y, p.s * 2 * (1 - k * 0.5));
    } else if (p.shape === "confetti") {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.rot * 2));
      ctx.fillStyle = hexA(p.c, Math.min(1, a * 2)); ctx.fillRect(-p.s, -p.s * 0.5, p.s * 2, p.s); ctx.restore();
    } else if (p.shape === "shard") {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = hexA(p.c, a); ctx.beginPath(); ctx.moveTo(0, -p.s * 1.6); ctx.lineTo(p.s * 0.6, 0); ctx.lineTo(0, p.s * 1.6); ctx.lineTo(-p.s * 0.6, 0); ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = hexA(p.c, a); ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1 - k * 0.6), 0, PI * 2); ctx.fill();
    }
  }
  ctx.globalCompositeOperation = "source-over";
}
function hexA(c, a) {
  if (c[0] !== "#") return c;
  const n = parseInt(c.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}
FX.hexA = hexA;

// ---------------- shake, slow motion, flash ----------------
let trauma = 0;
const shakeEls = () => [document.getElementById("app"), document.getElementById("layer")];
FX.shake = amt => { if (!FX.reduced() && !unseen()) trauma = Math.min(1.4, trauma + amt); };
// (30 Oct) raise the shake to at least v, never past it by repeating (a spammed button shakes like a single press)
FX.shakeTo = v => { if (!FX.reduced() && !unseen()) trauma = Math.max(trauma, Math.min(1.4, v)); };
let slowT = 0;
FX.slowmo = (scale, dur) => { if (FX.reduced() || unseen()) return; AF.time.target = scale; slowT = dur; };
FX.flash = (color = "#fff", dur = 0.35, max = 0.9) => {
  if (unseen()) return;
  const d = document.createElement("div");
  d.className = "flash"; d.style.background = color;
  document.body.appendChild(d);
  d.animate([{ opacity: max }, { opacity: 0 }], { duration: dur * 1000, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => d.remove();
};
// coming back to the tab: whatever was still waiting goes (a coin still in the air counts as landed), and the screen
// is steady and at full speed
addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  for (const p of parts) if (p.onHit && p.life < p.max) p.onHit();
  parts.length = 0; rings.length = 0; rays.length = 0;
  trauma = 0; slowT = 0; AF.time.target = 1; AF.time.scale = 1;
  document.querySelectorAll(".flash").forEach(d => d.remove());
});
FX.frame = (realDt) => {
  if (slowT > 0) { slowT -= realDt; if (slowT <= 0) AF.time.target = 1; }
  AF.time.scale += (AF.time.target - AF.time.scale) * Math.min(1, realDt * 8);
  const t = performance.now() / 1000;
  trauma = Math.max(0, trauma - realDt * 1.6);
  const s = trauma * trauma;
  FX.shakeNow = s; // the 3D world shakes its camera by this too (island.js), so the whole screen shakes as in 2D
  const tx = s ? (Math.sin(t * 61) + Math.sin(t * 37)) * 9 * s : 0, ty = s ? (Math.sin(t * 53 + 1) + Math.sin(t * 29)) * 9 * s : 0;
  const tr = s ? `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotate(${(Math.sin(t * 43) * 0.9 * s).toFixed(3)}deg)` : "";
  // (30 Oct, "you can see the edges popping out"): in 3D the interface stays put and only the world's camera shakes
  const still = document.body.classList.contains("w3d");
  shakeEls().forEach(el => { const want = still ? "" : tr; if (el && el.style.transform !== want) el.style.transform = want; });
  frameParts(realDt * AF.time.scale);
};

// ---------------- springy DOM motion ----------------
// squash and stretch with overshoot; k scales how hard
FX.pop = (el, k = 1) => {
  if (!el || !el.animate) return;
  el.animate([
    { transform: "scale(1,1)" },
    { transform: `scale(${1 + 0.18 * k},${1 - 0.16 * k})`, offset: 0.18 },
    { transform: `scale(${1 - 0.08 * k},${1 + 0.12 * k})`, offset: 0.42 },
    { transform: `scale(${1 + 0.04 * k},${1 - 0.03 * k})`, offset: 0.68 },
    { transform: "scale(1,1)" },
  ], { duration: 520, easing: "ease-out", composite: "add" });
};
FX.squash = el => {
  if (!el || !el.animate) return;
  el.animate([{ transform: "scale(1)" }, { transform: "scale(1.12,0.86)", offset: 0.25 }, { transform: "scale(0.95,1.06)", offset: 0.6 }, { transform: "scale(1)" }],
    { duration: 380, easing: "cubic-bezier(.3,1.6,.5,1)", composite: "add" });
};
FX.nope = el => {
  if (!el || !el.animate) return;
  el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" },
    { transform: "translateX(2px)" }, { transform: "translateX(0)" }], { duration: 380, easing: "ease-out", composite: "add" });
};
FX.enter = (el, delay = 0) => {
  if (!el || !el.animate) return;
  el.animate([{ opacity: 0, transform: "translateY(14px) scale(.92)" }, { opacity: 1, transform: "translateY(-3px) scale(1.02)", offset: 0.7 },
    { opacity: 1, transform: "none" }], { duration: 480, delay, easing: "cubic-bezier(.2,.9,.3,1.2)", fill: "backwards" });
};
// counts a number up in an element; fmt formats it
FX.count = (el, from, to, dur, fmt = AF.fmt) => {
  if (!el) return;
  const t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / (dur * 1000)), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
FX.center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
FX.wait = ms => new Promise(r => setTimeout(r, ms));
// waits ms of game time, so slow motion stretches reveal timings too
FX.gwait = ms => new Promise(res => {
  let left = ms / 1000, last = performance.now();
  const step = now => { left -= ((now - last) / 1000) * AF.time.scale; last = now; if (left <= 0) res(); else requestAnimationFrame(step); };
  requestAnimationFrame(step);
});

// ---------------- sound (WebAudio, synthesized) ----------------
let ac = null, master = null, noiseBuf = null;
// volume slider (0-1) on a gentle curve, so the low end of the slider is still usable
const vol = () => { const v = AF.G && AF.G.S ? AF.G.S.opts.volume : 0.7; return 0.8 * Math.pow(Math.max(0, Math.min(1, v === undefined ? 0.7 : v)), 1.6); };
FX.setVolume = () => { if (master && ac) master.gain.setTargetAtTime(vol(), ac.currentTime, 0.03); };
function audio() {
  if (!ac) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master = ac.createGain(); master.gain.value = vol();
      master.connect(comp); comp.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
  }
  if (ac && ac.state === "suspended") ac.resume();
  return ac;
}
function tone(f, dur, o = {}) {
  const t = ac.currentTime + (o.at || 0);
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.type = o.type || "sine";
  osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
  if (o.detune) osc.detune.value = o.detune;
  const v = o.vol || 0.2, a = o.attack || 0.005;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = osc;
  if (o.lp) { const f2 = ac.createBiquadFilter(); f2.type = "lowpass"; f2.frequency.value = o.lp; osc.connect(f2); node = f2; }
  node.connect(g); g.connect(master);
  osc.start(t); osc.stop(t + dur + 0.05);
}
function noise(dur, o = {}) {
  const t = ac.currentTime + (o.at || 0);
  const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf;
  f.type = o.type || "bandpass"; f.frequency.setValueAtTime(o.f || 1200, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  f.Q.value = o.q || 1;
  const v = o.vol || 0.15;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t); src.stop(t + dur + 0.05);
}
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
// a sub-bass drop: f0 falling to f1 over dur, through a tanh shaper for harmonics a small speaker can play
let shaper = null;
function subDrop(f0 = 110, f1 = 36, dur = 1.1, vol = 0.55) {
  const t = ac.currentTime, osc = ac.createOscillator(), g = ac.createGain();
  if (!shaper) {
    shaper = ac.createWaveShaper();
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * 2.6) / Math.tanh(2.6); }
    shaper.curve = c; shaper.connect(master);
  }
  osc.type = "sine";
  osc.frequency.setValueAtTime(f0, t); osc.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(shaper);
  osc.start(t); osc.stop(t + dur + 0.05);
  noise(0.14, { f: 180, type: "lowpass", vol: 0.35 });
}
function chord(notes, dur, o = {}) { notes.forEach((n, i) => tone(NOTE(n), dur, Object.assign({ at: (o.roll || 0) * i }, o))); }

const SFX = {
  // a Defense kill: thump, crack and a tink an octave up, a quarter tone higher for each kill in a quick run (i)
  tdKill(o) {
    const up = Math.pow(2, Math.min(10, o.i || 0) / 24);
    tone(200 * up, 0.1, { type: "sine", vol: 0.16, to: 58 });
    noise(0.05, { f: 2400 * up, to: 900, vol: 0.06, q: 1.4 });
    tone(1250 * up, 0.08, { type: "triangle", vol: 0.04, at: 0.015 });
  },
  click() { tone(660, 0.05, { type: "triangle", vol: 0.12 }); tone(990, 0.04, { type: "sine", vol: 0.06, at: 0.01 }); },
  // 4x louder since 29 Oct: it sat next to the recorded sounds and was barely heard
  tab() { tone(520, 0.075, { type: "triangle", vol: 0.4, to: 780 }); },
  arrive() { subDrop(); },
  chime(o) { const i = Math.max(1, Math.min(9, o.i || 1)); tone(1010 * [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2, 3][i - 1], 0.5, { type: "sine", vol: 0.1 }); },
  swell() { noise(0.45, { f: 400, to: 5000, vol: 0.1, attack: 0.4 }); },
  portalBurst(o) { this.burst(o); },
  win(o) { [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.16, { type: "triangle", vol: 0.25, at: (o.at || 0) + i * 0.1 })); },
  lose(o) { [392, 330, 262, 196].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.2, { type: "triangle", vol: 0.22, at: (o.at || 0) + i * 0.14 })); },
  error() { tone(190, 0.14, { type: "sawtooth", vol: 0.09, lp: 900 }); tone(150, 0.16, { type: "sawtooth", vol: 0.08, lp: 700, at: 0.07 }); },
  coin(o) { const f = 1250 + (o.i || 0) * 35; tone(f, 0.09, { type: "square", vol: 0.035, lp: 4000 }); tone(f * 1.5, 0.12, { vol: 0.05, at: 0.03 }); },
  collect(o) {
    const big = Math.min(1, (o.size || 0) / 6);
    tone(140, 0.35, { type: "sine", vol: 0.35, to: 60 });
    noise(0.25, { f: 3000, to: 8000, vol: 0.06 });
    [72, 76, 79, 84, 88].forEach((n, i) => tone(NOTE(n), 0.22, { type: "triangle", vol: 0.1, at: 0.04 + i * 0.045 }));
    if (big > 0.5) chord([60, 64, 67, 72], 0.6, { type: "sawtooth", vol: 0.035, lp: 2400, at: 0.12 });
  },
  pop(o) { const k = Math.min(12, o.i || 0); tone(440 * Math.pow(2, k / 24), 0.1, { type: "triangle", vol: 0.14, to: 880 * Math.pow(2, k / 24) }); tone(1760, 0.06, { vol: 0.04, at: 0.04 }); },
  equip() { tone(660, 0.08, { type: "triangle", vol: 0.12 }); tone(990, 0.12, { type: "triangle", vol: 0.1, at: 0.06 }); },
  unequip() { tone(660, 0.08, { type: "triangle", vol: 0.1 }); tone(440, 0.1, { type: "triangle", vol: 0.08, at: 0.06 }); },
  unlock() { [67, 71, 74, 79, 83].forEach((n, i) => tone(NOTE(n), 0.3, { type: "triangle", vol: 0.1, at: i * 0.06 })); noise(0.5, { f: 4000, vol: 0.05 }); },
  whoosh() { noise(0.5, { f: 400, to: 4000, vol: 0.12, q: 0.7 }); },
  drop() { tone(320, 0.18, { type: "sine", vol: 0.25, to: 90 }); noise(0.12, { f: 600, vol: 0.08 }); },
  charge(o) { const i = o.i || 0; tone(NOTE(57 + i * 4), 0.35, { type: "sawtooth", vol: 0.06, lp: 1800 + i * 500 }); tone(NOTE(69 + i * 4), 0.25, { type: "sine", vol: 0.1 }); noise(0.25, { f: 1500 + i * 600, vol: 0.05 }); },
  tick(o) { const i = o.i || 0; tone(700 + i * 28, 0.035, { type: "square", vol: 0.04, lp: 3500 }); },
  // Defense: shots, splash bursts, chain lightning, melee swings (kept quiet; there are a lot of them)
  tdShot() { tone(900, 0.05, { type: "square", vol: 0.02, to: 520, lp: 3000 }); },
  tdBoom() { tone(150, 0.2, { type: "sine", vol: 0.14, to: 60 }); noise(0.16, { f: 900, vol: 0.05 }); },
  tdZap() { noise(0.09, { f: 5200, vol: 0.04 }); tone(1500, 0.06, { type: "sawtooth", vol: 0.02, to: 700, lp: 5000 }); },
  tdSlash() { noise(0.12, { f: 2600, to: 700, vol: 0.05, q: 0.8 }); },
  rise(o) { const d = o.dur || 1.2; tone(110, d, { type: "sawtooth", vol: 0.08, to: 880, lp: 2400, attack: d * 0.6 }); noise(d, { f: 300, to: 6000, vol: 0.09, attack: d * 0.8 }); },
  // the cloud crossing's whooshes until the wind recording has loaded (REC has the real ones)
  cloudIn(o) { const d = o.dur || 1.15; noise(d + 0.4, { f: 350, to: 1800, vol: 0.1, attack: d, q: 0.8 }); },
  cloudOut(o) { const d = o.dur || 0.75; noise(d, { f: 2600, to: 450, vol: 0.12, attack: 0.04, q: 0.8 }); },
  burst(o) {
    const r = o.rank || 0;
    tone(90, 0.5, { type: "sine", vol: 0.4, to: 40 });
    noise(0.4 + r * 0.1, { f: 900, to: 200, type: "lowpass", vol: 0.25 });
    noise(0.3, { f: 6000, vol: 0.05 });
  },
  // a stinger per rank: plain for low, a bigger chord each step up, a long swell at the top
  reveal(o) {
    const r = o.rank || 0;
    const sets = [[64, 67], [64, 67, 71], [62, 66, 69, 74], [60, 64, 67, 72, 76], [57, 61, 64, 69, 73, 76], [55, 58, 62, 67, 70, 74, 79], [48, 55, 60, 64, 67, 72, 76, 79, 84]];
    const n = sets[Math.min(r, sets.length - 1)];
    chord(n, 0.5 + r * 0.25, { type: "triangle", vol: 0.09, roll: r < 3 ? 0.05 : 0.03 });
    if (r >= 3) chord(n.map(x => x + 12), 0.9 + r * 0.2, { type: "sawtooth", vol: 0.025, lp: 3000, roll: 0.02, at: 0.05 });
    if (r >= 4) { noise(1.5, { f: 8000, vol: 0.05 }); tone(NOTE(n[0] - 24), 1.6, { type: "sine", vol: 0.25 }); }
    if (r >= 5) chord([n[0] - 12, n[0] - 5], 2.2, { type: "sawtooth", vol: 0.05, lp: 1200, detune: 12 });
    // past Divine: a fifth above and a long shimmer, then a choir-like swell for the top rarity
    if (r >= 7) { chord(n.map(x => x + 7), 2.4, { type: "triangle", vol: 0.05, roll: 0.04, at: 0.15 }); noise(2.4, { f: 9000, vol: 0.05, at: 0.1 }); }
    if (r >= 9) chord([36, 48, 55, 60, 64, 67, 72, 79, 84], 3.6, { type: "sawtooth", vol: 0.03, lp: 2200, detune: 8, roll: 0.06, at: 0.3 });
  },
};
// ---------------- sound files ----------------
// every file the game plays, with a gain that matches its loudness to the others (measured 29 Oct from each file's
// RMS and peak); the Digital pack is mp3, the rest ogg
const FILES = {
  select_007: 0.8, error_006: 0.8, handleCoins2: 3, glass_002: 0.7, pluck_001: 0.9, coins_mixkit: 0.6,
  select_003: 0.8, back_002: 0.6, confirmation_002: 0.7, forceField_001: 0.45, forceField_003: 0.45, drop_002: 0.8,
  tick_002: 0.45, glass_003: 0.6, explosionCrunch_000: 0.6, explosionCrunch_003: 0.6, lowFrequency_explosion_000: 1,
  lowFrequency_explosion_001: 0.9, jingles_PIZZA00: 0.9, jingles_PIZZA06: 0.9, jingles_STEEL04: 0.9, jingles_STEEL01: 0.9,
  jingles_HIT15: 1, jingles_STEEL07: 0.9, jingles_STEEL03: 0.9, jingles_HIT11: 1, jingles_STEEL02: 0.8, jingles_STEEL12: 0.7,
  vortex_wind: 1, portal_swell: 1.6, magical_3: 0.6, glass_004: 0.7, laserSmall_000: 0.35, knifeSlice2: 0.4,
  phaserUp1: 4, phaserUp2: 4, phaserUp3: 4, phaserUp4: 4, phaserUp5: 4, phaserUp6: 4, phaserUp7: 4, zap1: 2.5,
};
const MP3 = /^(phaserUp|zap)/, WAV = /^coins_mixkit$/;
const ext = f => (MP3.test(f) ? "mp3" : WAV.test(f) ? "wav" : "ogg");
const bufs = {};
let loading = false;
// the files download as the page loads; they are decoded once there is an audio context (the first sound)
const raw = {};
for (const f of Object.keys(FILES)) {
  raw[f] = fetch(`sfx/${f}.${ext(f)}`).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)));
  raw[f].catch(() => { /* this one stays synthesized */ });
}
function loadFiles() {
  if (loading || !ac) return;
  loading = true;
  bake("tab");
  for (const f of Object.keys(FILES)) raw[f].then(a => ac.decodeAudioData(a)).then(b => { bufs[f] = b; }).catch(() => { /* this one stays synthesized */ });
}
// decode on the first press anywhere, so everything is ready before the first summon opens
addEventListener("pointerdown", () => { if (AF.G && AF.G.S && AF.G.S.opts.sound && audio()) loadFiles(); }, { capture: true, once: true });
// play a file: v = volume, r = pitch (playback rate), at = seconds from now. false when it isn't ready
function play(f, v = 1, r = 1, at = 0) {
  const b = bufs[f]; if (!b) return false;
  const src = ac.createBufferSource(), g = ac.createGain();
  src.buffer = b; src.playbackRate.value = r;
  g.gain.value = v * FILES[f];
  src.connect(g); g.connect(master);
  src.start(ac.currentTime + at);
  return src;
}
const vary = (a = 0.06) => 1 + (Math.random() * 2 - 1) * a; // a little pitch drift so repeats don't sound copied
// each sound's recorded version; returns false when its file hasn't loaded, so the synthesized one plays instead
const VSTEP = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2, 3];
// (29 Oct, "cant hear the tab switch sound effect on defense, journal and ascend"): synthesized sounds rendered once
// into a buffer. A buffer started late still plays whole; a live envelope started late is already fading, which is what
// happened to the tab blip behind the pages that rebuild on every visit
const baked = {};
function bake(name) {
  if (baked[name] !== undefined || !ac) return;
  baked[name] = null;
  try {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, off = new OAC(1, Math.ceil(ac.sampleRate * 0.2), ac.sampleRate);
    const keep = [ac, master];
    ac = off; master = off.createGain(); master.connect(off.destination);
    try { SFX[name]({}); } finally { [ac, master] = keep; }
    const p = off.startRendering();
    if (p && p.then) p.then(b => { baked[name] = b; }).catch(() => {});
    else off.oncomplete = e => { baked[name] = e.renderedBuffer; };
  } catch (e) { /* stays live */ }
}
function playBaked(name) {
  const b = baked[name]; if (!b) { bake(name); return false; }
  const src = ac.createBufferSource(); src.buffer = b; src.connect(master); src.start();
  return src;
}
const REC = {
  click: () => play("select_007", 1, vary(0.04)),
  // the tab: the synthesized blip (Chris liked it; the recorded toggle was piercing), played from its baked buffer
  tab: () => playBaked("tab"),
  error: () => play("error_006"),
  coin: o => play("handleCoins2", o.v || 1, 1 + Math.min(12, o.i || 0) * 0.02),
  // just the tap of the button, no coin jingle after it
  // the tap of the button with a handful of coins over it (louder for a bigger collect)
  collect: o => { const s = play("glass_002", 1 + Math.min(1, (o.size || 0) / 6) * 0.3, 1.1 * vary(0.03)); play("coins_mixkit", 0.8 + Math.min(1, (o.size || 0) / 6) * 0.35, vary(0.03)); return s; },
  pop: o => play("pluck_001", 1, (1 + Math.min(12, o.i || 0) * 0.045) * vary(0.02)),
  // (29 Oct) the designed kill sounds (js/unitsfx.js) once they've loaded; till then the synthesized thump and tink
  tdKill: o => { if (AF.usfx && AF.usfx.kill(o.i)) return true; SFX.tdKill(o); play("glass_003", 0.4, (1.3 + Math.min(10, o.i || 0) * 0.045) * vary(0.02), 0.02); return true; },
  equip: () => play("select_003"),
  unequip: () => play("back_002"),
  unlock: () => play("confirmation_002"),
  whoosh: () => play("forceField_001", 1, vary(0.05)),
  drop: () => play("drop_002"),
  // a rising phaser per rarity step, a little higher each time
  charge: o => { const i = o.i || 0; return play("phaserUp" + (((i - 1) % 7 + 7) % 7 + 1), 1, 1 + i * 0.04); },
  tick: o => play("tick_002", 1, 0.9 + (o.i || 0) * 0.025),
  // a long riser: the force field slowed right down, sweeping up for as long as asked
  rise: o => {
    const d = o.dur || 1.2, s = play("forceField_003", 1, 0.5); if (!s) return false;
    s.loop = true; s.playbackRate.setValueAtTime(0.5, ac.currentTime); s.playbackRate.linearRampToValueAtTime(1.6, ac.currentTime + d); s.stop(ac.currentTime + d + 0.1);
    return s;
  },
  // a card bursting: glass for the plain ones, a crunch from Legendary up, a deep boom on top past Divine
  burst: o => {
    const r = o.rank || 0;
    if (r < 3) return play("glass_003", 0.7, vary(0.08) * (1 + r * 0.05));
    const s = play(r >= 7 ? "explosionCrunch_003" : "explosionCrunch_000", 0.6 + r * 0.06, vary(0.04));
    if (s && r >= 6) play(r >= 8 ? "lowFrequency_explosion_000" : "lowFrequency_explosion_001", 0.9);
    return s;
  },
  // the stinger: a bigger jingle for every rarity, layered past Divine
  reveal: o => {
    const r = o.rank || 0, J = ["jingles_PIZZA00", "jingles_PIZZA00", "jingles_PIZZA06", "jingles_STEEL04", "jingles_STEEL01", "jingles_HIT15", "jingles_STEEL07", "jingles_STEEL03", "jingles_HIT11", "jingles_STEEL07"];
    const s = play(J[Math.min(r, J.length - 1)]);
    if (s && r >= 8) play("jingles_HIT15", 0.8, 1, 0.35);
    return s;
  },
  // the portal arriving: the sub drop with a pitched-down boom under it
  arrive: () => { if (!bufs.lowFrequency_explosion_001) return false; subDrop(); return play("lowFrequency_explosion_001", 0.6, 0.62); },
  // the summon portal (with AF.vortex below): a chime a pentatonic step higher per rarity, the fold-in swell, and
  // the burst as a low boom with a sparkle
  chime: o => { const i = Math.max(1, Math.min(9, o.i || 1)); return play("glass_004", 0.9 - i * 0.04, 0.55 * VSTEP[i - 1]); },
  swell: o => play("portal_swell", 1, o.r || 1),
  portalBurst: o => {
    const r = o.rank || 0, s = play("lowFrequency_explosion_001", 0.35 + r * 0.06);
    if (s) play("magical_3", 0.6 + r * 0.04, 1 + r * 0.015);
    return s;
  },
  // a win (climbs to a held top note, ~0.6 s in) and a loss (falls an octave and more)
  win: o => play("jingles_STEEL02", 1, 1, o.at || 0),
  lose: o => play("jingles_STEEL12", 1, 1, o.at || 0),
  // (29 Oct, "50% quieter"): the Defense attack sounds at half
  tdShot: () => play("laserSmall_000", 0.5, vary(0.1)),
  tdBoom: () => play("explosionCrunch_000", 0.2, vary(0.08) * 1.15),
  tdZap: () => play("zap1", 0.5, 1.6 * vary(0.08)),
  tdSlash: () => play("knifeSlice2", 0.5, vary(0.08)),
  // the cloud crossing (clouds.js): the wind, shaped (cloudGraph below)
  cloudIn: o => (bufs.vortex_wind ? (cloudGraph(ac, master, bufs.vortex_wind, "in", o.dur || 1.15), true) : false),
  cloudOut: o => (bufs.vortex_wind ? (cloudGraph(ac, master, bufs.vortex_wind, "out", o.dur || 0.75), true) : false),
};
// (29 Oct, request: "add some whoosh sound effects" to the cloud crossing): the real wind (vortex_wind) shaped two ways.
// "in": flying into the bank, the wind speeds up and brightens over dur, sweeping left to right, its low body under it,
// then falls away under the whiteout. "out": breaking through, a quick bright gust split hard left and right (clouds
// rushing past on both sides) with the low air under it, falling away. Built on any context (measured offline)
function cloudGraph(ctx, out, wind, kind, dur) {
  // make-up gain: the filters leave the wind about 8x quieter; measured offline this puts both just under the summon
  // swell (100 ms RMS: in 0.17, out 0.20, swell 0.20, the old Start whoosh 0.27)
  const t = ctx.currentTime, pre = ctx.createGain(); pre.gain.value = kind === "in" ? 8 : 6; pre.connect(out); out = pre;
  // one layer: the wind at a rate ramping r0 to r1, through a filter sweeping f0 to f1, rising to peak over atk and
  // gone rel later, panned p0 to p1 across the whole of it
  const layer = (r0, r1, type, f0, f1, q, peak, atk, rel, p0, p1) => {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = wind; src.loop = true;
    src.playbackRate.setValueAtTime(r0, t); src.playbackRate.linearRampToValueAtTime(r1, t + atk + rel);
    f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + atk);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + atk + rel);
    src.connect(f); f.connect(g);
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.setValueAtTime(p0, t); p.pan.linearRampToValueAtTime(p1, t + atk + rel); g.connect(p); p.connect(out); }
    else g.connect(out);
    src.start(t, Math.random() * Math.max(0, wind.duration - 2)); src.stop(t + atk + rel + 0.1);
  };
  if (kind === "in") {
    layer(0.7, 1.35, "bandpass", 380, 1700, 0.9, 1.1, dur, 0.45, -0.5, 0.4);
    layer(0.45, 0.8, "lowpass", 240, 560, 0.7, 0.9, dur, 0.55, 0.3, -0.2);
  } else {
    layer(1.5, 0.85, "bandpass", 2600, 520, 0.8, 1, 0.05, dur, -0.8, -0.95);
    layer(1.4, 0.8, "bandpass", 2300, 480, 0.8, 1, 0.07, dur, 0.8, 0.95);
    layer(0.6, 0.45, "lowpass", 620, 240, 0.7, 0.6, 0.05, dur * 0.8, 0, 0);
  }
}
FX.cloudGraph = cloudGraph;
AF.sfx = (name, o = {}) => {
  if (!AF.G || !AF.G.S || !AF.G.S.opts.sound) return;
  if (!audio()) return;
  loadFiles();
  try { if (!(REC[name] && REC[name](o)) && SFX[name]) SFX[name](o); } catch (e) { /* audio is decoration */ }
};
// the context and the master volume, for sounds loaded elsewhere (unitsfx.js); null with the sound off
AF.sfx.ctx = () => (AF.G && AF.G.S && AF.G.S.opts.sound && audio() ? { ac, master } : null);

// ---------------- the summon vortex ----------------
// (29 Oct, request: "the summon sound effects are horrible ... doesnt sound like a vortex or anything interesting"):
// real wind through a band-pass whose centre sweeps up and down while the sound pans left and right a quarter turn
// apart, so the air seems to go round; the same wind an octave down as a roar under it. power(k) speeds the swirl up
// and brightens it, kick() swells it on a rarity step, surge(d) is a big lift, collapse(d) sucks it all upward, end()
// cuts it on the burst. Built on any context so it can be measured offline (FX.vortexGraph).
function vortexGraph(ctx, out, wind) {
  const t0 = ctx.currentTime, set = (p, v, tc = 0.15) => p.setTargetAtTime(v, ctx.currentTime, tc);
  const mix = ctx.createGain(), kick = ctx.createGain();
  mix.gain.setValueAtTime(0.0001, t0); mix.gain.exponentialRampToValueAtTime(0.7, t0 + 0.6);
  mix.connect(kick); kick.connect(out);
  const src = ctx.createBufferSource(), pre = ctx.createGain(), bp = ctx.createBiquadFilter();
  src.buffer = wind; src.loop = true; src.playbackRate.value = 0.8; pre.gain.value = 2.2;
  bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = 1.3;
  const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = 0.8; depth.gain.value = 450;
  lfo.connect(depth); depth.connect(bp.frequency);
  const pan = ctx.createStereoPanner(), plfo = ctx.createOscillator(), pdepth = ctx.createGain();
  plfo.frequency.value = 0.8; pdepth.gain.value = 0.75; plfo.connect(pdepth); pdepth.connect(pan.pan);
  src.connect(pre); pre.connect(bp); bp.connect(pan); pan.connect(mix);
  const low = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), lg = ctx.createGain();
  low.buffer = wind; low.loop = true; low.playbackRate.value = 0.45; lp.type = "lowpass"; lp.frequency.value = 320; lg.gain.value = 1.7;
  low.connect(lp); lp.connect(lg); lg.connect(mix);
  const nodes = [src, low, lfo, plfo];
  src.start(t0); low.start(t0, 2.5); lfo.start(t0); plfo.start(t0 + 1 / (4 * 0.8));
  nodes.forEach(n => n.stop(t0 + 30)); // never left running, whatever happens to the reveal
  let rate = 0.8, over = false;
  const spin = (r, tc) => { rate = r; set(lfo.frequency, r, tc); set(plfo.frequency, r, tc); };
  const stop = fade => {
    if (over) return; over = true;
    const t = ctx.currentTime; mix.gain.cancelScheduledValues(t); set(mix.gain, 0.0001, fade);
    nodes.forEach(n => { try { n.stop(t + fade * 8); } catch (e) { /* already stopped */ } });
  };
  return {
    power(k) {
      k = Math.max(0, Math.min(1, k));
      spin(0.8 + k * 3.4);
      set(bp.frequency, 700 + k * 1700); set(depth.gain, 450 + k * 1100);
      set(src.playbackRate, 0.8 + k * 0.55, 0.25); set(low.playbackRate, 0.45 + k * 0.3, 0.25);
      set(mix.gain, 0.7 + k * 0.5);
    },
    kick() { const t = ctx.currentTime; kick.gain.cancelScheduledValues(t); kick.gain.setValueAtTime(1.6, t); kick.gain.setTargetAtTime(1, t + 0.04, 0.2); },
    surge(d) { spin(rate * 1.8, d / 3); set(bp.frequency, 4200, d / 3); set(mix.gain, 1.5, d / 3); },
    collapse(d) { spin(9, d / 2.5); set(bp.frequency, 4200, d / 2.5); set(depth.gain, 1800, d / 2.5); set(src.playbackRate, 2.2, d / 2.5); set(low.playbackRate, 1.2, d / 2.5); set(mix.gain, 1.6, d / 3); },
    end() { stop(0.03); },
    stop() { stop(0.12); },
  };
}
FX.vortexGraph = vortexGraph;
// a vortex on the game's speakers, or null (sound off, or the wind not loaded yet)
AF.vortex = () => {
  if (!AF.G || !AF.G.S || !AF.G.S.opts.sound || !audio()) return null;
  loadFiles();
  if (!bufs.vortex_wind) return null;
  try { return vortexGraph(ac, master, bufs.vortex_wind); } catch (e) { return null; }
};
})();
