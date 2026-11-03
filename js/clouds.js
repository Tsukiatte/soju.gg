/* Aura Farm: the cloud crossing between the world and a Defense match (29 Oct, request: "When you go into a match, it
   should play a animation to switch the view, like either clouds, something else, comes in, the map switches when it
   full covers, then they come out. It should NOT look basic, I need a good looking animation that genuinely flows well
   with the switch"; then, of a first flat version, "so much clipping on the clouds edges, needs to be diff shapes and
   sizes. the line in the middle is horrible", pointing at spite's CSS3DClouds).
   So it is that idea in WebGL: a bank of a couple of hundred soft cloud puffs (canvas-drawn, each its own size, turn and
   slow spin, lit from above with a shaded underside that takes a little of where you're going) standing in 3D in front
   of a camera that flies into it. The bank thickens until the view whites out, the swap runs under that (a board takes
   a moment to build, so the hitch is hidden), and the camera flies on through and out the far side: the puffs thin,
   stream past the edges and fade as they pass, and the new view settles from a little closer.
   AF.clouds.swap({ tint, push(k), cover(), settle(k) }) resolves when the clouds have gone:
     tint: the colour of where you're going   push(k): k 0 to 1 while the clouds come in (the old view leans in)
     cover(): runs under full cover; may return a promise (waited for, and two more frames)
     settle(k): k 1 to 0 while they clear (the new view's push, easing out)
   Anything that fails in here still runs the swap at once: a match never waits on its animation. */
(function () {
const AF = window.AF = window.AF || {};
// (29 Oct, "the clouds pop in slightly too quick when you leave / enter, they should fade in smoother"): IN was 0.95 s
// with a 0.3 s fade from the nearest clouds; now they start further off and fade up over most of the approach
// (29 Oct, "once the screen turns white, and it starts fading the clouds out, that half of the animation should go
// faster"): OUT was 1.3 s and HOLD 0.12 s
const IN = 1.15, OUT = 0.75, HOLD = 0.05;
const Z_COVER = -150, Z_END = -440; // where the camera is at full cover, and where it ends (past the bank)
const ease = { inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), in: t => t * t, out: t => 1 - Math.pow(1 - t, 3) };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
// two #rrggbb colours mixed, k of the way to b
const mix = (a, b, k) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join(""); };

// one puff: dozens of soft blobs heaped into a fluffy lump (denser in the middle, ragged at the rim), then shaded from
// below. Nothing in it has an edge, so nothing can clip
function puff(seed, shade) {
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
  const x = c.getContext("2d");
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.75), px = S / 2 + Math.cos(a) * d * S * 0.27, py = S * 0.54 + Math.sin(a) * d * S * 0.17 - (1 - d) * S * 0.06;
    const r = S * (0.09 + rnd() * 0.12) * (1.15 - d * 0.4);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(255,255,255,.62)"); g.addColorStop(0.55, "rgba(255,255,255,.3)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  }
  // lit from above: the underside in the shade colour, the top as it is
  x.globalCompositeOperation = "source-atop";
  const g = x.createLinearGradient(0, S * 0.32, 0, S * 0.82);
  g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, shade);
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  return c;
}

let busy = false;
AF.clouds = {
  speed: 1, // 1 (a slower one only for looking at it frame by frame)
  get busy() { return busy; },
  swap(o = {}) {
    if (busy) return Promise.resolve(o.cover && o.cover());
    try { return run(o); } catch (e) { console.error(e); busy = false; document.querySelectorAll(".cloudx").forEach(c => c.remove()); if (o.cover) o.cover(); if (o.settle) o.settle(0); return Promise.resolve(); }
  },
};

function run(o) {
  const T = window.THREE;
  busy = true;
  const tint = o.tint || "#c8d1f0";
  const gl = new T.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true });
  gl.setPixelRatio(Math.min(1, window.devicePixelRatio || 1) * 0.8); // soft clouds: no need for every pixel
  gl.setSize(innerWidth, innerHeight);
  const cv = gl.domElement; cv.className = "cloudx"; document.body.appendChild(cv);
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(62, innerWidth / innerHeight, 1, 700);
  // o.soft (30 Oct): a quick crossing covers in a softer cloud colour, so it doesn't read as a white flash
  const back = new T.Color(o.dark ? "#1a0306" : o.soft ? mix("#5d6888", tint, 0.35) : mix("#edf1fd", tint, 0.14));
  // eight puff looks: four lit ones and four in deeper shade for the far side of the bank
  const texs = [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
    const tx = new T.CanvasTexture(puff(i * 13 + 5, i < 4 ? mix("#aab6dc", tint, 0.25) + "cc" : mix("#8e9bcb", tint, 0.3) + "dd"));
    tx.colorSpace = T.SRGBColorSpace; return tx;
  });
  // the bank, along the camera's path: scattered clouds on the way in, a thick wall where the view whites out, then a
  // long tunnel of clouds round the path (none on it), so the middle opens first and the rest stream past the edges
  let seed = 23; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const puffs = [];
  const cluster = (cx, cy, cz, n, size) => {
    for (let i = 0; i < n; i++) {
      const m = new T.SpriteMaterial({ map: texs[(rnd() * 8) | 0], transparent: true, depthWrite: false, opacity: 0, rotation: rnd() * Math.PI * 2 });
      if (o.dark) m.color.set("#4a1418"); // (30 Oct) the way down to the Underworld: red-black smoke
      else if (o.soft) m.color.set(mix("#a3aed0", tint, 0.3)); // a quick crossing's clouds are in shade too
      const sp = new T.Sprite(m), k = size * (0.6 + rnd() * 0.8);
      sp.position.set(cx + (rnd() - 0.5) * size * 1.6, cy + (rnd() - 0.5) * size * 0.6, cz + (rnd() - 0.5) * size * 1.2);
      sp.scale.set(k * (1.1 + rnd() * 0.5), k, 1);
      sp.userData = { a: 0.75 + rnd() * 0.25, spin: (rnd() - 0.5) * 0.25 };
      scene.add(sp); puffs.push(sp);
    }
  };
  const ring = (z0, z1, r0, r1, n, per, size) => { for (let i = 0; i < n; i++) { const z = z0 - rnd() * (z0 - z1), r = r0 + rnd() * (r1 - r0), a = rnd() * Math.PI * 2;
    cluster(Math.cos(a) * r * 1.5, Math.sin(a) * r * 0.75, z, per, size * (0.8 + rnd() * 0.5)); } };
  ring(-90, -150, 18, 75, 12, 6, 30); // on the way in
  ring(-120, -215, 0, 36, 12, 9, 40); // the wall
  for (let i = 0; i < 7; i++) cluster((rnd() - 0.5) * 70, (rnd() - 0.5) * 34, Z_COVER - 12 - rnd() * 40, 6, 34); // across the path, so it always whites out
  ring(-225, -420, 30, 90, 22, 6, 34); // the tunnel out
  let t0 = performance.now(), phase = "in", tc = 0, covered = false, done = null, raf = 0, last = t0, camZ = 0;
  // (29 Oct, "add some whoosh sound effects"): the wind of flying in now, and of breaking through as they clear
  // o.speed (30 Oct): a quicker crossing (a tab switch to or from a match in progress)
  const SPD = AF.clouds.speed * (o.speed || 1);
  if (AF.sfx) AF.sfx("cloudIn", { dur: IN / SPD });
  const fin = new Promise(r => { done = r; });
  const end = () => {
    cancelAnimationFrame(raf); cv.remove();
    puffs.forEach(p => p.material.dispose()); texs.forEach(t => t.dispose()); gl.dispose(); if (gl.forceContextLoss) gl.forceContextLoss();
    busy = false;
  };
  const bail = e => {
    console.error(e); end();
    if (!covered) { covered = true; try { if (o.cover) o.cover(); } catch (e2) { console.error(e2); } }
    if (o.settle) o.settle(0); done();
  };
  const draw = now => { try { frameAt(now); } catch (e) { bail(e); } };
  const frameAt = now => {
    raf = requestAnimationFrame(draw);
    if (cv.width !== Math.round(innerWidth * gl.getPixelRatio())) { gl.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
    const sp = SPD, t = (now - t0) / 1000 * sp, dt = Math.min(0.05, (now - last) / 1000) * sp; last = now;
    let white = 0;
    if (phase === "in") {
      const k = clamp(t / IN);
      if (o.push) o.push(ease.inOut(k));
      camZ = Z_COVER * ease.in(k);
      white = sstep(o.soft ? 0.45 : 0.58, 1, k);
      if (k >= 1 && !covered) { covered = true; phase = "hold"; tc = now; runCover(); }
    } else if (phase === "hold") { white = 1; camZ = Z_COVER - (now - tc) / 1000 * sp * 8; }
    else {
      const k = clamp(t / OUT);
      camZ = Z_COVER - 8 * HOLD + (Z_END - Z_COVER) * ease.out(k);
      white = 1 - sstep(0, o.soft ? 0.7 : 0.32, k);
      if (o.settle) o.settle(1 - ease.out(k));
      if (k >= 1) { end(); if (o.settle) o.settle(0); done(); return; }
    }
    cam.position.set(Math.sin(t * 1.3) * 1.5, Math.sin(t * 0.9) * 0.8, camZ);
    cam.rotation.z = Math.sin(t * 0.8) * 0.025;
    // each puff: in from the far haze, out as it comes too close (so nothing huge and blurry hangs on the screen)
    for (const p of puffs) {
      const d = p.position.z - camZ; // negative ahead of the camera
      const far = sstep(-340, -170, d), near = sstep(-6, -38, d);
      p.material.opacity = p.userData.a * far * near * (phase === "in" ? sstep(0, 0.6, t / IN) : phase === "out" ? 1 - sstep(0.75, 1, t / OUT) : 1);
      p.material.rotation += p.userData.spin * dt;
    }
    gl.setClearColor(back, white);
    gl.render(scene, cam);
  };
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  async function runCover() {
    try { if (o.cover) await o.cover(); } catch (e) { console.error(e); }
    await frame(); await frame();
    const wait = HOLD * 1000 / SPD - (performance.now() - tc);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    if (o.settle) o.settle(1);
    if (AF.sfx) AF.sfx("cloudOut", { dur: OUT / SPD });
    t0 = performance.now(); phase = "out";
  }
  raf = requestAnimationFrame(draw);
  return fin;
}
})();
