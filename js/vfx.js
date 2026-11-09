/* Aura Farm Defense effects (29 Oct, request: "Take heavy inspiration from bloons td6 and their attack types, as well
   as the visually interesting effects from anime adventures. I'm talking like actual particle systems, slashes,
   shaders, mesh animations, post processing, make it look amazing and optimize it for web").
   Everything here draws in the board's own Three.js scene:
   - particles: two pools of camera-facing quads moved on the GPU (one added as light, one blended for smoke and
     debris); a particle is written once when it spawns and the shader works out where it is from its age
   - slashes: crescent meshes with a sweeping shader; ground decals (shockwaves, scorch, frost); lightning ribbons;
     ice spikes and frozen shells
   - the frame: rendered to a half-float target, bloom (only what's brighter than white glows, so the world stays
     as it is and the effects shine), screen ripples from big hits, a flash, a colour split, shake and a vignette
   board.js calls init on mount, update and render every frame, and dispose on unmount. */
(function () {
const T = THREE, AF = window.AF, PI = Math.PI;
const V = AF.VFX = { on: false };
let gl = null, scene = null, cam = null, W = 1, H = 1, time = 0;
let rt = null, mips = [], post = null, atlas = null, ADD = null, BLEND = null;
const live = [], pools = {}, waves = [], tmpC = new T.Color(), v3 = new T.Vector3(), v3b = new T.Vector3();
let shakeA = 0, flashA = 0, flashC = new T.Color(1, 1, 1), chroma = 0;
const rnd = (a, b) => a + Math.random() * (b - a);
const lin = (hex, k = 1) => { tmpC.set(hex); return [tmpC.r * k, tmpC.g * k, tmpC.b * k]; };

// ---------------- the particle sheet: eight 128 px cells drawn once ----------------
// row 1: 0 soft dot, 1 hot dot, 2 streak, 3 four-point star, 4 smoke puff, 5 thin ring, 6 shard, 7 flame
// row 2: 8 leaf, 9 music note, 10 bubble, 11 feather, 12 petal, 13 pixel, 14 rune, 15 droplet
const CELL = { dot: 0, hot: 1, streak: 2, star: 3, smoke: 4, ring: 5, shard: 6, flame: 7, leaf: 8, note: 9, bubble: 10, feather: 11, petal: 12, pixel: 13, rune: 14, drop: 15 };
function makeAtlas() {
  const S = 128, c = document.createElement("canvas"); c.width = S * 8; c.height = S * 2;
  const x = c.getContext("2d");
  const rad = (i, stops) => { const g = x.createRadialGradient(i * S + S / 2, S / 2, 0, i * S + S / 2, S / 2, S / 2); stops.forEach(([o, a]) => g.addColorStop(o, `rgba(255,255,255,${a})`)); x.fillStyle = g; x.fillRect(i * S, 0, S, S); };
  rad(0, [[0, 1], [0.25, 0.7], [0.6, 0.18], [1, 0]]);
  rad(1, [[0, 1], [0.18, 1], [0.35, 0.5], [0.7, 0.08], [1, 0]]);
  // streak: a thin bright line with a soft halo, long along x
  x.save(); x.translate(2 * S + S / 2, S / 2); x.scale(1, 0.16);
  let g = x.createRadialGradient(0, 0, 0, 0, 0, S / 2); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.4, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(-S / 2, -S / 2, S, S); x.restore();
  // star: two crossed streaks and a core
  x.save(); x.translate(3 * S + S / 2, S / 2);
  for (const r of [0, PI / 2]) { x.save(); x.rotate(r); x.scale(1, 0.07); g = x.createRadialGradient(0, 0, 0, 0, 0, S / 2); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(-S / 2, -S / 2, S, S); x.restore(); }
  g = x.createRadialGradient(0, 0, 0, 0, 0, S * 0.16); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(-S / 2, -S / 2, S, S); x.restore();
  // smoke: lumpy, made of soft blobs, soft edges
  for (let k = 0; k < 14; k++) {
    const a = rnd(0, PI * 2), r = rnd(0, S * 0.22), bx = 4 * S + S / 2 + Math.cos(a) * r, by = S / 2 + Math.sin(a) * r, br = rnd(S * 0.14, S * 0.26);
    g = x.createRadialGradient(bx, by, 0, bx, by, br); g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g;
    x.beginPath(); x.arc(bx, by, br, 0, PI * 2); x.fill();
  }
  // ring
  x.strokeStyle = "rgba(255,255,255,1)"; x.lineWidth = 7; x.shadowColor = "#fff"; x.shadowBlur = 10;
  x.beginPath(); x.arc(5 * S + S / 2, S / 2, S * 0.38, 0, PI * 2); x.stroke(); x.shadowBlur = 0;
  // shard: a long diamond
  x.fillStyle = "rgba(255,255,255,1)"; x.beginPath();
  x.moveTo(6 * S + S / 2, 6); x.lineTo(6 * S + S / 2 + S * 0.14, S / 2); x.lineTo(6 * S + S / 2, S - 6); x.lineTo(6 * S + S / 2 - S * 0.14, S / 2); x.closePath(); x.fill();
  // flame: a teardrop, hot at the bottom
  x.save(); x.translate(7 * S + S / 2, S * 0.62);
  g = x.createRadialGradient(0, 0, 0, 0, 0, S * 0.42); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.5, "rgba(255,255,255,.6)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.beginPath(); x.moveTo(0, -S * 0.55); x.quadraticCurveTo(S * 0.36, -S * 0.05, 0, S * 0.32); x.quadraticCurveTo(-S * 0.36, -S * 0.05, 0, -S * 0.55); x.fill(); x.restore();
  // ---- row 2 ----
  const cell = (i, f) => { x.save(); x.translate(i * S + S / 2, S + S / 2); x.fillStyle = x.strokeStyle = "rgba(255,255,255,1)"; f(); x.restore(); };
  cell(0, () => { // leaf: a pointed oval and its vein
    x.beginPath(); x.moveTo(0, -S * 0.42); x.quadraticCurveTo(S * 0.3, -S * 0.05, 0, S * 0.42); x.quadraticCurveTo(-S * 0.3, -S * 0.05, 0, -S * 0.42); x.fill();
    x.globalCompositeOperation = "destination-out"; x.lineWidth = 4; x.beginPath(); x.moveTo(0, -S * 0.36); x.lineTo(0, S * 0.38); x.stroke(); x.globalCompositeOperation = "source-over";
  });
  cell(1, () => { // music note
    x.beginPath(); x.ellipse(-S * 0.12, S * 0.22, S * 0.15, S * 0.11, -0.4, 0, PI * 2); x.fill();
    x.fillRect(S * 0.0, -S * 0.36, S * 0.06, S * 0.58);
    x.beginPath(); x.moveTo(S * 0.06, -S * 0.36); x.quadraticCurveTo(S * 0.3, -S * 0.24, S * 0.22, -S * 0.02); x.lineTo(S * 0.06, -S * 0.18); x.fill();
  });
  cell(2, () => { // bubble: a thin rim, a soft inside, a glint
    let g = x.createRadialGradient(0, 0, S * 0.25, 0, 0, S * 0.42); g.addColorStop(0, "rgba(255,255,255,.12)"); g.addColorStop(0.85, "rgba(255,255,255,.75)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, S * 0.42, 0, PI * 2); x.fill();
    x.fillStyle = "rgba(255,255,255,1)"; x.beginPath(); x.ellipse(-S * 0.14, -S * 0.16, S * 0.08, S * 0.05, -0.7, 0, PI * 2); x.fill();
  });
  cell(3, () => { // feather: a long vane on a quill
    x.beginPath(); x.moveTo(0, -S * 0.46); x.quadraticCurveTo(S * 0.2, -S * 0.1, S * 0.04, S * 0.3); x.lineTo(-S * 0.04, S * 0.3); x.quadraticCurveTo(-S * 0.18, -S * 0.1, 0, -S * 0.46); x.fill();
    x.fillRect(-S * 0.015, S * 0.25, S * 0.03, S * 0.2);
    x.globalCompositeOperation = "destination-out"; x.lineWidth = 2;
    for (let k = 0; k < 6; k++) { const y = -S * 0.3 + k * S * 0.09; x.beginPath(); x.moveTo(0, y); x.lineTo(S * 0.16, y - S * 0.06); x.stroke(); }
    x.globalCompositeOperation = "source-over";
  });
  cell(4, () => { // petal: a soft teardrop
    const g = x.createRadialGradient(0, S * 0.1, 0, 0, S * 0.1, S * 0.4); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.75, "rgba(255,255,255,.85)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.beginPath(); x.moveTo(0, -S * 0.4); x.bezierCurveTo(S * 0.36, -S * 0.1, S * 0.24, S * 0.38, 0, S * 0.36); x.bezierCurveTo(-S * 0.24, S * 0.38, -S * 0.36, -S * 0.1, 0, -S * 0.4); x.fill();
  });
  cell(5, () => { x.fillRect(-S * 0.3, -S * 0.3, S * 0.6, S * 0.6); }); // pixel
  cell(6, () => { // rune: a ring of marks round a glyph
    x.lineWidth = 6; x.lineCap = "round";
    x.beginPath(); x.moveTo(0, -S * 0.36); x.lineTo(S * 0.3, S * 0.24); x.lineTo(-S * 0.3, S * 0.24); x.closePath(); x.stroke();
    x.beginPath(); x.moveTo(0, -S * 0.36); x.lineTo(0, S * 0.38); x.moveTo(-S * 0.2, -S * 0.02); x.lineTo(S * 0.2, -S * 0.02); x.stroke();
    x.beginPath(); x.arc(0, S * 0.06, S * 0.08, 0, PI * 2); x.stroke();
  });
  cell(7, () => { // droplet
    const g = x.createRadialGradient(-S * 0.06, S * 0.1, 0, 0, S * 0.12, S * 0.3); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.7, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.beginPath(); x.moveTo(0, -S * 0.42); x.quadraticCurveTo(S * 0.3, S * 0.05, 0, S * 0.36); x.quadraticCurveTo(-S * 0.3, S * 0.05, 0, -S * 0.42); x.fill();
  });
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.NoColorSpace; tex.generateMipmaps = true; tex.minFilter = T.LinearMipmapLinearFilter;
  return tex;
}

// ---------------- particles ----------------
const PV = `
attribute vec3 a_p; attribute vec3 a_v; attribute vec4 a_t; attribute vec4 a_s; attribute vec4 a_c; attribute vec2 a_r;
uniform float uTime, uPx; uniform vec2 uView;
varying vec2 vUv; varying vec4 vC;
void main() {
  float age = uTime - a_t.x;
  if (age < 0.0 || age > a_t.y) { gl_Position = vec4(3.0, 3.0, 3.0, 1.0); vC = vec4(0.0); vUv = vec2(0.0); return; }
  float k = age / a_t.y, drag = a_t.z;
  float dk = drag > 0.0 ? (1.0 - exp(-drag * age)) / drag : age;
  vec3 pos = a_p + a_v * dk - vec3(0.0, 0.5 * a_t.w * age * age, 0.0);
  vec3 vel = a_v * exp(-drag * age) - vec3(0.0, a_t.w * age, 0.0);
  float size = mix(a_s.x, a_s.y, k) * uPx;
  vec4 clip = projectionMatrix * viewMatrix * vec4(pos, 1.0);
  vec2 q = position.xy, off;
  if (a_s.w > 0.0) {
    vec4 c2 = projectionMatrix * viewMatrix * vec4(pos + vel * 0.02, 1.0);
    vec2 d = (c2.xy - clip.xy) * uView * 0.5;
    float l = length(d);
    vec2 dir = l > 1e-4 ? d / l : vec2(1.0, 0.0);
    off = dir * q.x * (size + l * a_s.w) + vec2(-dir.y, dir.x) * q.y * size;
  } else {
    float a = a_r.x + a_r.y * age, c = cos(a), s = sin(a);
    off = vec2(q.x * c - q.y * s, q.x * s + q.y * c) * size;
  }
  clip.xy += off / uView * 2.0 * clip.w;
  gl_Position = clip;
  float cl = mod(a_s.z, 8.0), rw = floor(a_s.z / 8.0 + 0.001);
  vUv = vec2((q.x + 0.5 + cl) / 8.0, (q.y + 0.5 + 1.0 - rw) / 2.0);
  vC = vec4(a_c.rgb, a_c.a * min(1.0, k * 12.0) * (1.0 - k * k));
}`;
const PF = `
uniform sampler2D uMap; varying vec2 vUv; varying vec4 vC;
void main() { float m = texture2D(uMap, vUv).a * vC.a; if (m < 0.004) discard; gl_FragColor = vec4(vC.rgb, m); }`;
function makeSys(N, blending, order) {
  const geo = new T.InstancedBufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const A = {};
  for (const [k, n] of [["p", 3], ["v", 3], ["t", 4], ["s", 4], ["c", 4], ["r", 2]]) {
    const at = new T.InstancedBufferAttribute(new Float32Array(N * n), n);
    at.setUsage(T.DynamicDrawUsage); geo.setAttribute("a_" + k, at); A[k] = at;
  }
  // every slot starts long dead
  for (let i = 0; i < N; i++) A.t.array[i * 4] = -1e6;
  geo.instanceCount = N;
  const mat = new T.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uView: { value: new T.Vector2(1, 1) }, uMap: { value: atlas } },
    vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, blending,
  });
  const m = new T.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order;
  scene.add(m);
  return { N, A, m, head: 0, from: 0, wrapped: false };
}
// one particle: position, velocity, life, drag, gravity, size start/end, cell, stretch, colour (linear rgb, may go
// past 1 so it blooms), alpha, rotation and spin; delay holds it back that many seconds
function put(S, x, y, z, vx, vy, vz, life, drag, grav, s0, s1, cell, stretch, rgb, a, rot = 0, spin = 0, delay = 0) {
  const i = S.head, A = S.A;
  S.head = (i + 1) % S.N; if (S.head === 0) S.wrapped = true;
  A.p.array.set([x, y, z], i * 3); A.v.array.set([vx, vy, vz], i * 3);
  A.t.array.set([time + delay, life, drag, grav], i * 4); A.s.array.set([s0, s1, cell, stretch], i * 4);
  A.c.array.set([rgb[0], rgb[1], rgb[2], a], i * 4); A.r.array.set([rot, spin], i * 2);
}
// upload only the slots written this frame
function flush(S) {
  const a = S.from, b = S.head, A = S.A;
  if (a === b && !S.wrapped) return;
  for (const k in A) {
    const at = A[k], n = at.itemSize;
    at.clearUpdateRanges();
    if (S.wrapped || b < a) { at.addUpdateRange(a * n, (S.N - a) * n); at.addUpdateRange(0, b * n); }
    else at.addUpdateRange(a * n, (b - a) * n);
    at.needsUpdate = true;
  }
  S.from = b; S.wrapped = false;
}
// a burst of n round a point. o: speed [a, b], up (added rise), dir [x, y, z] + cone (radians), life [a, b], size
// [s0, s1] (scaled by a random 0.6-1.4 unless fixed), cell, stretch, cols (hex list), k (brightness), a, drag, grav,
// spread (start jitter), spin
function burst(S, x, y, z, n, o) {
  const cols = o.cols || [0xffffff], sp = o.speed || [1, 3], life = o.life || [0.3, 0.6], sz = o.size || [0.1, 0];
  for (let i = 0; i < n; i++) {
    let dx, dy, dz;
    if (o.dir) {
      const [ax, ay, az] = o.dir, c = o.cone || 0.4;
      dx = ax + rnd(-c, c); dy = ay + rnd(-c, c); dz = az + rnd(-c, c);
    } else { const u = rnd(-1, 1), a = rnd(0, PI * 2), r = Math.sqrt(1 - u * u); dx = r * Math.cos(a); dy = o.flat ? rnd(-0.15, 0.25) : u; dz = r * Math.sin(a); }
    const l = Math.hypot(dx, dy, dz) || 1, s = rnd(sp[0], sp[1]);
    const j = o.spread || 0, sc = o.fixed ? 1 : rnd(0.6, 1.4);
    put(S, x + rnd(-j, j), y + rnd(-j, j) * (o.flatSpread ? 0.2 : 1), z + rnd(-j, j),
      (dx / l) * s, (dy / l) * s + (o.up || 0), (dz / l) * s, rnd(life[0], life[1]), o.drag || 0, o.grav || 0,
      sz[0] * sc, sz[1] * sc, o.cell || 0, o.stretch || 0, lin(cols[i % cols.length], o.k || 1), o.a == null ? 1 : o.a,
      o.rot != null ? o.rot : rnd(0, PI * 2), o.spin ? rnd(-o.spin, o.spin) : 0, o.delay ? rnd(0, o.delay) : 0);
  }
}
V.burst = (add, x, y, z, n, o) => burst(add ? ADD : BLEND, x, y, z, n, o);
V.put = (add, ...a) => put(add ? ADD : BLEND, ...a);

// ---------------- shaders for the meshes ----------------
// slash: a crescent drawn on as it sweeps, white-hot at its leading edge, its colour bleeding into the tail
const SLASH_V = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SLASH_F = `
uniform float uProg, uAlpha; uniform vec3 uCol, uCore; varying vec2 vUv;
void main() {
  float h = uProg * 1.35, u = vUv.x;
  float body = smoothstep(h - 0.85, h - 0.1, u) * (1.0 - smoothstep(h - 0.02, h + 0.02, u));
  float across = vUv.y, edge = smoothstep(0.35, 1.0, across);
  float thick = sin(clamp(u, 0.0, 1.0) * 3.14159);
  float a = body * thick * uAlpha * smoothstep(0.0, 0.25, across);
  vec3 c = mix(uCol, uCore, pow(edge, 2.0) * smoothstep(h - 0.45, h, u));
  if (a < 0.004) discard;
  gl_FragColor = vec4(c, a);
}`;
// ground decals: a ring that runs outward, a scorch mark, frost, a glow pool
const DECAL_V = SLASH_V;
const DECAL_F = `
uniform float uProg, uAlpha, uKind, uSeed; uniform vec3 uCol; varying vec2 vUv;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec2 p = vUv * 2.0 - 1.0; float d = length(p), a = 0.0; vec3 c = uCol;
  if (uKind < 0.5) { // ring
    float r = uProg, w = 0.05 + 0.18 * (1.0 - uProg);
    float q = (d - r) / w; a = exp(-q * q) * (1.0 - uProg);
    a += 0.25 * (1.0 - smoothstep(0.0, r, d)) * (1.0 - uProg) * step(d, r);
  } else if (uKind < 1.5) { // scorch
    float nn = n(p * 3.5) * 0.6 + n(p * 9.0) * 0.4;
    a = smoothstep(1.0, 0.25, d + (nn - 0.5) * 0.5) * uAlpha;
  } else if (uKind < 2.5) { // frost: spikes of ice out from the middle
    float ang = atan(p.y, p.x), sp = pow(abs(cos(ang * 6.0 + n(vec2(ang * 3.0, 1.0)) * 2.0)), 18.0);
    float body = smoothstep(1.0, 0.0, d + n(p * 6.0) * 0.35);
    a = (body * 0.3 + sp * smoothstep(1.0, 0.1, d) * 0.9) * uAlpha;
    c = mix(uCol, vec3(1.3, 1.5, 1.7), sp);
  } else if (uKind < 3.5) { // glow pool
    a = (1.0 - smoothstep(0.0, 1.0, d)) * uAlpha;
  } else if (uKind < 4.5) { // cracks running out from the middle
    float ang = atan(p.y, p.x);
    float cr = pow(abs(sin(ang * 4.5 + n(vec2(ang * 2.0, d * 4.0)) * 2.5)), 30.0) * smoothstep(1.0, 0.15, d);
    a = (cr + smoothstep(0.32, 0.0, d) * 0.6) * uAlpha;
  } else if (uKind < 5.5) { // a splat: a lumpy blob with drops thrown off it
    float nn = n(p * 4.0), drops = step(0.83, n(p * 9.0 + 3.0)) * smoothstep(1.0, 0.6, d);
    a = (smoothstep(0.72, 0.5, d + (nn - 0.5) * 0.5) + drops) * uAlpha;
  } else if (uKind < 6.5) { // a rune circle that turns
    float ang = atan(p.y, p.x) + uProg * 2.0;
    float q1 = (d - 0.9) / 0.035, q2 = (d - 0.64) / 0.03;
    float ticks = step(0.9, abs(cos(ang * 12.0))) * smoothstep(0.66, 0.72, d) * smoothstep(0.9, 0.84, d);
    float glyph = step(0.6, n(vec2(floor((ang + 3.2) * 4.0), 7.0))) * smoothstep(0.7, 0.74, d) * smoothstep(0.84, 0.8, d) * 0.5;
    a = (exp(-q1 * q1) + exp(-q2 * q2) + ticks * 0.9 + glyph) * uAlpha;
  } else if (uKind < 7.5) { // a puddle with a shine on it
    float body = smoothstep(1.0, 0.72, d + (n(p * 3.0) - 0.5) * 0.35);
    float shine = smoothstep(0.22, 0.0, length(p - vec2(-0.28, 0.26)));
    c = uCol + vec3(shine * 0.5);
    a = body * 0.85 * uAlpha;
  } else { // a whirlpool / vortex turning inward
    float ang = atan(p.y, p.x);
    float s = sin(ang * 3.0 + d * 11.0 - uProg * 14.0);
    a = (smoothstep(0.2, 1.0, s) * smoothstep(1.0, 0.15, d) * 0.7 + smoothstep(0.32, 0.0, d)) * uAlpha;
  }
  if (a < 0.004) discard;
  gl_FragColor = vec4(c, a);
}`;
// lightning: a ribbon, white core and coloured glow across its width, flickering
const BOLT_F = `
uniform float uAlpha, uTime, uFlick; uniform vec3 uCol; varying vec2 vUv;
void main() {
  float x = min(1.0, abs(vUv.y * 2.0 - 1.0)), core = pow(1.0 - x, 6.0), glow = pow(1.0 - x, 1.6);
  float fl = 1.0 - uFlick * (0.5 - 0.5 * sin(uTime * 90.0 + vUv.x * 30.0));
  vec3 c = uCol * glow * 1.6 + vec3(2.4) * core;
  float a = max(core, glow * 0.8) * uAlpha * fl;
  if (a < 0.004) discard;
  gl_FragColor = vec4(c, a);
}`;
// ice: see-through, bright where it turns away from the eye, a light catch on top
const ICE_V = `varying vec3 vN; varying vec3 vP; void main() { vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`;
const ICE_F = `
uniform float uAlpha; uniform vec3 uCol; varying vec3 vN; varying vec3 vP;
void main() {
  float rim = clamp(1.0 - abs(vN.z), 0.0, 1.0), top = clamp(vN.y, 0.0, 1.0);
  vec3 c = mix(uCol, vec3(1.7, 1.95, 2.2), pow(rim, 3.0)) + vec3(0.7, 0.9, 1.1) * pow(top, 6.0);
  gl_FragColor = vec4(c, (0.14 + pow(rim, 1.5) * 0.7 + pow(top, 6.0) * 0.3) * uAlpha);
}`;

// ---------------- pooled meshes ----------------
function pool(name, make) { const p = pools[name] || (pools[name] = { free: [], make }); return p.free.pop() || make(); }
function release(name, m) { m.visible = false; pools[name].free.push(m); }
// a crescent: arc of `arc` radians, inner radius r0, outer r1, centred on -y, thick in the middle
function crescentGeo(arc = PI * 1.15, r0 = 0.62, r1 = 1, n = 40) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = -PI / 2 - arc / 2 + arc * u, th = Math.sin(u * PI);
    const ri = r1 - (r1 - r0) * th;
    pos.push(Math.cos(a) * ri, Math.sin(a) * ri, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0);
    uv.push(u, 0, u, 1);
    if (i < n) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
let SLASH_GEO = null, DECAL_GEO = null, SPIKE_GEO = null, SHELL_GEO = null;
function slashMesh() {
  const mat = new T.ShaderMaterial({ uniforms: { uProg: { value: 0 }, uAlpha: { value: 1 }, uCol: { value: new T.Vector3() }, uCore: { value: new T.Vector3() } },
    vertexShader: SLASH_V, fragmentShader: SLASH_F, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  const g = new T.Group(), m = new T.Mesh(SLASH_GEO, mat); m.frustumCulled = false; m.renderOrder = 12; g.add(m); g.userData.m = m; scene.add(g);
  return g;
}
function decalMesh() {
  const mat = new T.ShaderMaterial({ uniforms: { uProg: { value: 0 }, uAlpha: { value: 1 }, uKind: { value: 0 }, uSeed: { value: 0 }, uCol: { value: new T.Vector3() } },
    vertexShader: DECAL_V, fragmentShader: DECAL_F, transparent: true, depthWrite: false });
  const m = new T.Mesh(DECAL_GEO, mat); m.rotation.x = -PI / 2; m.frustumCulled = false; scene.add(m);
  return m;
}
function boltMesh() {
  const N = 96, g = new T.BufferGeometry();
  g.setAttribute("position", new T.BufferAttribute(new Float32Array(N * 2 * 3), 3).setUsage(T.DynamicDrawUsage));
  g.setAttribute("uv", new T.BufferAttribute(new Float32Array(N * 2 * 2), 2).setUsage(T.DynamicDrawUsage));
  const idx = []; for (let i = 0; i < N - 1; i++) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } g.setIndex(idx);
  const mat = new T.ShaderMaterial({ uniforms: { uAlpha: { value: 1 }, uTime: { value: 0 }, uFlick: { value: 1 }, uCol: { value: new T.Vector3() } },
    vertexShader: SLASH_V, fragmentShader: BOLT_F, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  const m = new T.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 13; m.userData.N = N; scene.add(m);
  return m;
}
function iceMat() {
  return new T.ShaderMaterial({ uniforms: { uAlpha: { value: 1 }, uCol: { value: new T.Vector3(...lin(0x5fc8ff, 0.8)) } },
    vertexShader: ICE_V, fragmentShader: ICE_F, transparent: true, depthWrite: false });
}
// geometries merged by hand (no BufferGeometryUtils in the vendored build)
function merge(parts) {
  const pos = [], nor = [], idx = []; let base = 0;
  for (const [geo, mtx] of parts) {
    const g = geo.index ? geo : geo, p = g.attributes.position, nn = g.attributes.normal, nm = new T.Matrix3().getNormalMatrix(mtx);
    for (let i = 0; i < p.count; i++) {
      v3.fromBufferAttribute(p, i).applyMatrix4(mtx); pos.push(v3.x, v3.y, v3.z);
      v3b.fromBufferAttribute(nn, i).applyMatrix3(nm).normalize(); nor.push(v3b.x, v3b.y, v3b.z);
    }
    const ix = g.index ? g.index.array : [...Array(p.count).keys()];
    for (const i of ix) idx.push(i + base);
    base += p.count; geo.dispose();
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}
function spikeGeo() {
  const parts = [], M = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
  const spec = [[0, 0, 0, 0.17, 1.0], [0.16, 0.0, 0.05, 0.11, 0.62, 0.45, 0.3], [-0.14, 0, 0.08, 0.1, 0.55, -0.4, 0.5], [0.04, 0, -0.16, 0.1, 0.5, 0.2, -0.45], [-0.06, 0, -0.1, 0.08, 0.4, -0.3, -0.3]];
  for (const [x, y, z, r, h, tx = 0, tz = 0] of spec) {
    const c = new T.ConeGeometry(r, h, 5, 1); c.translate(0, h / 2, 0);
    e.set(tz, 0, -tx); q.setFromEuler(e); M.compose(new T.Vector3(x, y, z), q, new T.Vector3(1, 1, 1));
    parts.push([c, M.clone()]);
  }
  return merge(parts);
}

// ---------------- running effects ----------------
// each live effect is { tick(dt) -> false when done }
function run(fx) { live.push(fx); return fx; }
// a slash across a point. o: ang (facing), tilt (roll of the cut), r (size), col, core, dur, delay, y, arc offset
V.slash = (x, y, z, o = {}) => {
  const g = pool("slash", slashMesh), m = g.userData.m, U = m.material.uniforms, r = o.r || 1.3, dur = o.dur || 0.26;
  g.position.set(x, y, z); g.rotation.set(0, o.ang || 0, 0); g.visible = true;
  m.rotation.set(-PI / 2 + (o.pitch == null ? 0.8 : o.pitch), 0, o.tilt || 0); m.scale.set(r * (o.flip ? -1 : 1), r, r);
  U.uCol.value.set(...lin(o.col || 0xff6a2a, o.k || 1.8)); U.uCore.value.set(...lin(o.core || 0xffffff, o.coreK || 2.5)); U.uProg.value = 0; U.uAlpha.value = 1;
  let age = -(o.delay || 0);
  g.visible = age >= 0;
  return run({ tick(dt) {
    age += dt; if (age < 0) return true; g.visible = true;
    const k = age / dur; U.uProg.value = Math.min(1.1, k * 1.25); U.uAlpha.value = k < 0.8 ? 1 : Math.max(0, 1 - (k - 0.8) * 4);
    m.scale.set(r * (o.flip ? -1 : 1) * (1 + k * 0.12), r * (1 + k * 0.12), r);
    if (k >= 1.05) { release("slash", g); return false; }
    return true;
  } });
};
// a crescent of light flying along a line (the Iaido wave)
V.crescent = (x, z, dx, dz, len, speed, o = {}) => {
  const g = pool("slash", slashMesh), m = g.userData.m, U = m.material.uniforms, r = o.r || 1.3;
  const ang = Math.atan2(dx, dz);
  g.position.set(x, 0.55, z); g.rotation.set(0, ang, 0); g.visible = true;
  const fx = o.flip ? -1 : 1;
  m.rotation.set(-PI / 2 + 0.55, 0, 0); m.scale.set(r * fx, r * 0.9, r);
  U.uCol.value.set(...lin(o.col || 0xff5a1a, 2.6)); U.uCore.value.set(...lin(o.core || 0xfff2c8, 3.5)); U.uProg.value = 0.74; U.uAlpha.value = 1;
  let d = 0;
  return run({ tick(dt) {
    d += speed * dt;
    const k = d / len;
    g.position.set(x + dx * d, 0.55, z + dz * d);
    U.uAlpha.value = k < 0.85 ? Math.min(1, k * 8) : Math.max(0, 1 - (k - 0.85) / 0.15);
    m.scale.set(r * fx * (1 + k * 0.35), r * 0.9 * (1 + k * 0.35), r);
    // embers shed off its edge, smoke behind it
    const ex = g.position.x, ez = g.position.z, px = dz, pz = -dx;
    for (let i = 0; i < 3; i++) { const s = rnd(-1, 1) * r; put(ADD, ex + px * s - dx * 0.2, 0.55 + rnd(-0.1, 0.25), ez + pz * s - dz * 0.2, rnd(-0.4, 0.4) - dx * 0.8, rnd(0.4, 1.4), rnd(-0.4, 0.4) - dz * 0.8, rnd(0.25, 0.5), 2, -1.5, 0.09, 0, CELL.hot, 0.6, lin(i % 2 ? 0xffb02e : 0xff4a1a, 2.4), 1); }
    // a trail of fire along the ground behind it (the maxed Iaido)
    if (o.trail) for (let i = 0; i < 2; i++) put(ADD, ex - dx * 0.3 + rnd(-0.3, 0.3), 0.05, ez - dz * 0.3 + rnd(-0.3, 0.3), 0, rnd(0.8, 1.6), 0, rnd(0.45, 0.7), 1, -1, 0.32, 0.05, CELL.flame, 0, lin(i ? 0xff8a2a : 0xff4a1a, 2.2), 1, 0, 0);
    if (Math.random() < 0.5) put(BLEND, ex - dx * 0.4, 0.4, ez - dz * 0.4, 0, 0.5, 0, rnd(0.5, 0.8), 1, 0, 0.35, 0.9, CELL.smoke, 0, lin(0x2a2a2e), 0.35, rnd(0, 6), rnd(-1, 1));
    if (d >= len) { release("slash", g); return false; }
    return true;
  } });
};
// run fn after s seconds of effect time (follows the board's clock, unlike a timer)
V.later = (s, fn) => run({ tick(dt) { s -= dt; if (s > 0) return true; fn(); return false; } });
// decals: kind 0 ring (r = final radius), 1 scorch, 2 frost, 3 glow pool
// decals: kind 0 ring, 1 scorch, 2 frost, 3 glow pool, 4 cracks, 5 splat, 6 rune circle, 7 puddle, 8 whirlpool
// (dark marks are blended, light ones added; o.add / o.blend overrides)
const DARK = { 1: true, 4: true, 5: true, 7: true, 8: true };
V.decal = (x, z, kind, r, o = {}) => {
  const m = pool("decal", decalMesh), U = m.material.uniforms, dur = o.dur || (kind === 1 ? 4 : kind === 2 ? 1.8 : kind >= 4 ? 2 : 0.45);
  const dark = o.add ? false : o.blend ? true : !!DARK[kind];
  m.position.set(x, (o.y || 0.04) + live.length * 0.0004, z); m.scale.setScalar(r * 2); m.visible = true; m.rotation.z = o.spin === false ? 0 : rnd(0, PI * 2);
  m.material.blending = dark ? T.NormalBlending : T.AdditiveBlending; m.renderOrder = dark ? 3 : 4;
  U.uKind.value = kind; U.uSeed.value = rnd(0, 100); U.uCol.value.set(...lin(o.col || 0xffffff, o.k == null ? (kind === 1 ? 1 : 2) : o.k));
  let age = 0;
  return run({ tick(dt) {
    age += dt; const k = age / dur;
    U.uProg.value = kind === 0 ? 1 - Math.pow(1 - Math.min(1, k), 3) : k;
    U.uAlpha.value = (o.a == null ? 1 : o.a) * (kind === 1 ? (k < 0.7 ? 0.75 : 0.75 * (1 - (k - 0.7) / 0.3)) : kind === 2 ? (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85)
      : kind >= 4 ? (k < 0.08 ? k / 0.08 : k > 0.75 ? (1 - k) / 0.25 : 1) * 0.9 : 1 - k);
    if (kind === 6 || kind === 8) U.uProg.value = age * (o.speed || 1) / 2;
    if (k >= 1) { release("decal", m); return false; }
    return true;
  } });
};
// a lightning bolt from a to b: jagged in the plane facing the camera, re-drawn a few times while it lives
function boltPts(a, b, jag, depth) {
  let pts = [a, b];
  for (let d = 0; d < depth; d++) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i], mid = p.clone().add(q).multiplyScalar(0.5), len = p.distanceTo(q);
      const dir = q.clone().sub(p).normalize(), side = v3b.copy(dir).cross(V.view).normalize();
      mid.addScaledVector(side, rnd(-1, 1) * len * jag);
      out.push(mid, q);
    }
    pts = out;
  }
  return pts;
}
function drawBolt(m, pts, w) {
  const P = m.geometry.attributes.position, U = m.geometry.attributes.uv, n = Math.min(pts.length, m.userData.N);
  for (let i = 0; i < m.userData.N; i++) {
    const j = Math.min(i, n - 1), p = pts[j], q = pts[Math.min(j + 1, n - 1)], o = pts[Math.max(j - 1, 0)];
    const dir = v3.copy(q).sub(o).normalize(), side = v3b.copy(dir).cross(V.view).normalize();
    const ww = w * (j === 0 || j === n - 1 ? 0.5 : 1) * (0.7 + 0.3 * Math.sin(j * 1.7));
    P.setXYZ(i * 2, p.x - side.x * ww, p.y - side.y * ww, p.z - side.z * ww);
    P.setXYZ(i * 2 + 1, p.x + side.x * ww, p.y + side.y * ww, p.z + side.z * ww);
    U.setXY(i * 2, j / (n - 1), 0); U.setXY(i * 2 + 1, j / (n - 1), 1);
  }
  P.needsUpdate = U.needsUpdate = true;
}
V.bolt = (a, b, o = {}) => {
  const m = pool("bolt", boltMesh), Uf = m.material.uniforms, dur = o.dur || 0.22, w = o.w || 0.12;
  const A = new T.Vector3(...a), Bv = new T.Vector3(...b), depth = o.depth || 5;
  Uf.uCol.value.set(...lin(o.col || 0x4fb8ff, 1)); m.visible = true;
  let age = 0, next = 0;
  const branches = [];
  return run({ tick(dt) {
    age += dt; next -= dt;
    if (next <= 0) {
      next = 0.045;
      const pts = boltPts(A, Bv, o.jag || 0.22, depth); drawBolt(m, pts, w);
      // a few forks off the main bolt, redrawn with it
      if (o.forks) {
        branches.forEach(f => release("bolt", f)); branches.length = 0;
        for (let k = 0; k < o.forks; k++) {
          const s = pts[Math.floor(rnd(0.2, 0.8) * pts.length)], len = A.distanceTo(Bv) * rnd(0.15, 0.3);
          const e = s.clone().add(new T.Vector3(rnd(-1, 1), rnd(-0.6, 0.2), rnd(-1, 1)).normalize().multiplyScalar(len));
          const f = pool("bolt", boltMesh); f.visible = true; f.material.uniforms.uCol.value.copy(Uf.uCol.value);
          drawBolt(f, boltPts(s, e, 0.3, 3), w * 0.45); branches.push(f);
        }
      }
    }
    const k = age / dur, al = k < 0.1 ? 1 : Math.max(0, 1 - (k - 0.1) / 0.9);
    Uf.uAlpha.value = al; Uf.uTime.value = time;
    branches.forEach(f => { f.material.uniforms.uAlpha.value = al * 0.8; f.material.uniforms.uTime.value = time; });
    if (k >= 1) { branches.forEach(f => release("bolt", f)); release("bolt", m); return false; }
    return true;
  } });
};
// a held ribbon (beams, cones of light): show(a, b, w0, w1, hex, alpha) every frame it should be seen
function drawRibbon(m, a, b, w0, w1) {
  const P = m.geometry.attributes.position, U = m.geometry.attributes.uv, N = m.userData.N;
  v3.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
  const side = v3b.copy(v3).cross(V.view).normalize();
  for (let i = 0; i < N; i++) {
    const k = Math.min(1, i / 15), x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k, z = a[2] + (b[2] - a[2]) * k, w = w0 + (w1 - w0) * k;
    P.setXYZ(i * 2, x - side.x * w, y - side.y * w, z - side.z * w); P.setXYZ(i * 2 + 1, x + side.x * w, y + side.y * w, z + side.z * w);
    U.setXY(i * 2, k, 0); U.setXY(i * 2 + 1, k, 1);
  }
  P.needsUpdate = U.needsUpdate = true;
}
V.ribbon = () => {
  const m = pool("bolt", boltMesh);
  return {
    m,
    show(a, b, w0, w1, hex, alpha = 1, flick = 0.25) {
      m.visible = true; drawRibbon(m, a, b, w0, w1);
      const U = m.material.uniforms; U.uCol.value.set(...lin(hex, 1)); U.uAlpha.value = alpha; U.uTime.value = time; U.uFlick.value = flick;
    },
    hide() { m.visible = false; },
    free() { m.material.uniforms.uFlick.value = 1; release("bolt", m); },
  };
};
// ice bursting out of the ground and melting back
V.spikes = (x, z, s = 1) => {
  const m = pool("spike", () => { const mm = new T.Mesh(SPIKE_GEO, iceMat()); mm.renderOrder = 6; mm.frustumCulled = false; scene.add(mm); return mm; });
  m.position.set(x + rnd(-0.1, 0.1), 0, z + rnd(-0.1, 0.1)); m.rotation.set(0, rnd(0, PI * 2), 0); m.visible = true;
  let age = 0;
  return run({ tick(dt) {
    age += dt;
    const up = Math.min(1, age / 0.09), out = age > 0.5 ? Math.min(1, (age - 0.5) / 0.3) : 0;
    const h = (up < 1 ? 1 - Math.pow(1 - up, 3) : 1) * (1 + 0.15 * Math.sin(Math.min(1, age / 0.25) * PI)) * (1 - out * 0.6);
    m.scale.set(s * (1 - out * 0.3), s * h, s * (1 - out * 0.3));
    m.material.uniforms.uAlpha.value = 1 - out;
    if (out >= 1) { release("spike", m); return false; }
    return true;
  } });
};
// a frozen shell on an enemy figure (the board attaches it and calls this back when the slow wears off)
V.shell = (parent, r) => {
  const m = pool("shell", () => { const mm = new T.Mesh(SHELL_GEO, iceMat()); mm.renderOrder = 7; mm.frustumCulled = false; return mm; });
  m.visible = true; m.scale.set(r, r * 1.15, r); m.position.set(0, r * 0.85, 0); m.material.uniforms.uAlpha.value = 0.85;
  parent.add(m);
  return m;
};
V.unshell = m => { if (m.parent) m.parent.remove(m); release("shell", m); };
// the frame: shake, a flash, a colour split and a ripple from a screen point
V.shake = a => { shakeA = Math.max(shakeA, a); };
V.flash = (hex, a) => { flashC.set(hex); flashA = Math.max(flashA, a); };
V.chroma = a => { chroma = Math.max(chroma, a); };
V.ripple = (x, y, z, strength = 0.03, speed = 1.4) => {
  v3.set(x, y, z).project(cam);
  if (waves.length >= 4) waves.shift();
  waves.push({ x: v3.x * 0.5 + 0.5, y: v3.y * 0.5 + 0.5, r: 0, s: strength, v: speed });
};

// ---------------- post: bloom, ripples, flash, colour split, vignette ----------------
const FS_V = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const BRIGHT_F = `uniform sampler2D tSrc; uniform vec2 uTex; uniform float uTh, uKnee; varying vec2 vUv;
void main() {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 4; i++) { vec2 o = vec2(i == 0 || i == 2 ? -1.0 : 1.0, i < 2 ? -1.0 : 1.0) * uTex * 0.5; c += texture2D(tSrc, vUv + o).rgb; }
  c *= 0.25;
  float l = max(c.r, max(c.g, c.b));
  // a NaN or a blown-out value from any shader would spread through the blur and black out the frame
  if (!(l >= 0.0) || !(l < 1e4)) c = vec3(0.0);
  c = min(c, vec3(24.0)); l = max(c.r, max(c.g, c.b));
  float w = smoothstep(uTh, uTh + uKnee, l);
  gl_FragColor = vec4(c * w, 1.0);
}`;
const DOWN_F = `uniform sampler2D tSrc; uniform vec2 uTex; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb * 4.0;
  c += texture2D(tSrc, vUv + vec2(-1.0, -1.0) * uTex).rgb + texture2D(tSrc, vUv + vec2(1.0, -1.0) * uTex).rgb;
  c += texture2D(tSrc, vUv + vec2(-1.0, 1.0) * uTex).rgb + texture2D(tSrc, vUv + vec2(1.0, 1.0) * uTex).rgb;
  gl_FragColor = vec4(c / 8.0, 1.0);
}`;
const UP_F = `uniform sampler2D tSrc; uniform vec2 uTex; uniform float uK; varying vec2 vUv;
void main() {
  vec3 c = vec3(0.0);
  c += texture2D(tSrc, vUv + vec2(-2.0, 0.0) * uTex).rgb + texture2D(tSrc, vUv + vec2(2.0, 0.0) * uTex).rgb;
  c += texture2D(tSrc, vUv + vec2(0.0, -2.0) * uTex).rgb + texture2D(tSrc, vUv + vec2(0.0, 2.0) * uTex).rgb;
  c += (texture2D(tSrc, vUv + vec2(-1.0, -1.0) * uTex).rgb + texture2D(tSrc, vUv + vec2(1.0, -1.0) * uTex).rgb
     + texture2D(tSrc, vUv + vec2(-1.0, 1.0) * uTex).rgb + texture2D(tSrc, vUv + vec2(1.0, 1.0) * uTex).rgb) * 2.0;
  gl_FragColor = vec4(c / 12.0 * uK, 1.0);
}`;
const COMP_F = `uniform sampler2D tScene, tBloom; uniform float uBloom, uFlash, uChroma, uAspect, uGrey, uNeg; uniform vec3 uFlashC; uniform vec4 uWaves[4]; varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  for (int i = 0; i < 4; i++) {
    vec4 w = uWaves[i]; if (w.w <= 0.0) continue;
    vec2 d = (uv - w.xy) * vec2(uAspect, 1.0); float l = length(d);
    float q = (l - w.z) / 0.022, ring = exp(-q * q);
    uv -= (l > 0.0001 ? d / l : vec2(0.0)) * vec2(1.0 / uAspect, 1.0) * ring * w.w;
  }
  vec2 cd = (uv - 0.5) * uChroma;
  vec3 c = vec3(texture2D(tScene, uv + cd).r, texture2D(tScene, uv).g, texture2D(tScene, uv - cd).b);
  c += texture2D(tBloom, uv).rgb * uBloom;
  c += uFlashC * uFlash;
  float v = length((vUv - 0.5) * vec2(uAspect, 1.0) * 0.9);
  c *= 1.0 - smoothstep(0.55, 1.25, v) * 0.35;
  c = c / (1.0 + max(vec3(0.0), c - 1.0) * 0.35);
  // (30 Oct) a stopped world goes grey, a seen-through one goes negative (tdrel.js)
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, vec3(lum) * vec3(0.94, 0.97, 1.06), uGrey);
  c = mix(c, vec3(1.0) - clamp(c, 0.0, 1.0), uNeg);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
function fsMat(frag, uniforms, blend) {
  return new T.ShaderMaterial({ uniforms, vertexShader: FS_V, fragmentShader: frag, depthTest: false, depthWrite: false, blending: blend || T.NoBlending, transparent: !!blend });
}
function makePost() {
  const quad = new T.Mesh(new T.PlaneGeometry(2, 2)), qs = new T.Scene(), qc = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quad.frustumCulled = false; qs.add(quad);
  const waveU = [0, 1, 2, 3].map(() => new T.Vector4(0, 0, 0, 0));
  return {
    quad, qs, qc, waveU,
    bright: fsMat(BRIGHT_F, { tSrc: { value: null }, uTex: { value: new T.Vector2() }, uTh: { value: 1.0 }, uKnee: { value: 0.35 } }),
    down: fsMat(DOWN_F, { tSrc: { value: null }, uTex: { value: new T.Vector2() } }),
    up: fsMat(UP_F, { tSrc: { value: null }, uTex: { value: new T.Vector2() }, uK: { value: 1 } }, T.AdditiveBlending),
    comp: fsMat(COMP_F, { tScene: { value: null }, tBloom: { value: null }, uBloom: { value: 0.72 }, uFlash: { value: 0 }, uFlashC: { value: new T.Vector3(1, 1, 1) },
      uChroma: { value: 0 }, uAspect: { value: 1 }, uGrey: { value: 0 }, uNeg: { value: 0 }, uWaves: { value: waveU } }),
  };
}
function pass(mat, target) { post.quad.material = mat; gl.setRenderTarget(target); gl.render(post.qs, post.qc); }
function sizeTargets() {
  const dw = Math.max(1, Math.round(W * gl.getPixelRatio())), dh = Math.max(1, Math.round(H * gl.getPixelRatio()));
  if (!rt) {
    rt = new T.WebGLRenderTarget(dw, dh, { type: T.HalfFloatType, samples: 4 });
    for (let i = 0; i < 5; i++) mips.push(new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, depthBuffer: false }));
  }
  rt.setSize(dw, dh);
  let w = dw, h = dh;
  for (const m of mips) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); m.setSize(w, h); }
  post.comp.uniforms.uAspect.value = dw / dh;
}

// ---------------- lifecycle ----------------
V.init = (renderer, sc, camera) => {
  gl = renderer; scene = sc; cam = camera; time = 0; live.length = 0; waves.length = 0;
  for (const k in pools) delete pools[k];
  if (!atlas) atlas = makeAtlas();
  SLASH_GEO = crescentGeo(); DECAL_GEO = new T.PlaneGeometry(1, 1); SPIKE_GEO = spikeGeo(); SHELL_GEO = new T.IcosahedronGeometry(0.62, 0); SHELL_GEO.computeVertexNormals(); SPIKE_GEO = SPIKE_GEO.toNonIndexed(); SPIKE_GEO.computeVertexNormals();
  // the direction the camera looks along, for bolts that face it
  V.view = new T.Vector3(); cam.getWorldDirection(V.view);
  ADD = makeSys(9000, T.AdditiveBlending, 20);
  BLEND = makeSys(2500, T.NormalBlending, 11);
  if (!post) post = makePost();
  V.on = true;
};
V.resize = (w, h) => { W = w; H = h; if (V.on) sizeTargets(); };
V.dispose = () => {
  V.on = false;
  for (const k in pools) { pools[k].free.forEach(m => { m.traverse(o => { if (o.material) o.material.dispose(); }); }); delete pools[k]; }
  for (const S of [ADD, BLEND]) if (S) S.m.material.dispose();
  [SLASH_GEO, DECAL_GEO, SPIKE_GEO, SHELL_GEO].forEach(g => g && g.dispose());
  if (rt) { rt.dispose(); mips.forEach(m => m.dispose()); rt = null; mips = []; }
  ADD = BLEND = null; live.length = 0; scene = null;
};
V.update = dt => {
  if (!V.on) return;
  time += dt;
  for (let i = live.length - 1; i >= 0; i--) if (!live[i].tick(dt)) live.splice(i, 1);
  for (const S of [ADD, BLEND]) { S.m.material.uniforms.uTime.value = time; flush(S); }
  shakeA = Math.max(0, shakeA - dt * 2.6); flashA = Math.max(0, flashA - dt * 5); chroma = Math.max(0, chroma - dt * 0.05);
  for (let i = waves.length - 1; i >= 0; i--) { const w = waves[i]; w.r += w.v * dt; w.s *= Math.pow(0.04, dt); if (w.r > 1.4 || w.s < 0.0008) waves.splice(i, 1); }
};
V.time = () => time;
// (30 Oct) the picture's grade, eased toward what it's asked for: grey 0-1, negative 0-1
const grade = [0, 0];
V.grade = (grey, neg, dt = 0.016) => { grade[0] += (grey - grade[0]) * Math.min(1, dt * 7); grade[1] += (neg - grade[1]) * Math.min(1, dt * (neg > grade[1] ? 14 : 5)); };
V.render = () => {
  const dw = rt.width, dh = rt.height, px = dh / (cam.top - cam.bottom);
  for (const S of [ADD, BLEND]) { const U = S.m.material.uniforms; U.uPx.value = px; U.uView.value.set(dw, dh); }
  // shake: nudge the camera across the screen, then put it back
  const sx = shakeA > 0 ? (Math.random() - 0.5) * shakeA * 0.5 : 0, sy = shakeA > 0 ? (Math.random() - 0.5) * shakeA * 0.5 : 0;
  if (sx || sy) { cam.left += sx; cam.right += sx; cam.top += sy; cam.bottom += sy; cam.updateProjectionMatrix(); }
  gl.setRenderTarget(rt); gl.render(scene, cam);
  if (sx || sy) { cam.left -= sx; cam.right -= sx; cam.top -= sy; cam.bottom -= sy; cam.updateProjectionMatrix(); }
  const P = post;
  P.bright.uniforms.tSrc.value = rt.texture; P.bright.uniforms.uTex.value.set(1 / dw, 1 / dh); pass(P.bright, mips[0]);
  const nb = Math.max(1, Math.min(mips.length, bloomN));
  for (let i = 1; i < nb; i++) { P.down.uniforms.tSrc.value = mips[i - 1].texture; P.down.uniforms.uTex.value.set(1 / mips[i - 1].width, 1 / mips[i - 1].height); pass(P.down, mips[i]); }
  const ac = gl.autoClear; gl.autoClear = false;
  for (let i = nb - 1; i > 0; i--) { P.up.uniforms.tSrc.value = mips[i].texture; P.up.uniforms.uTex.value.set(1 / mips[i].width, 1 / mips[i].height); P.up.uniforms.uK.value = 1; pass(P.up, mips[i - 1]); }
  gl.autoClear = ac;
  const C = P.comp.uniforms;
  C.tScene.value = rt.texture; C.tBloom.value = mips[0].texture;
  C.uFlash.value = flashA * 0.6; C.uFlashC.value.set(flashC.r, flashC.g, flashC.b); C.uChroma.value = Math.min(0.012, chroma);
  C.uGrey.value = grade[0]; C.uNeg.value = grade[1];
  for (let i = 0; i < 4; i++) { const w = waves[i]; if (w) P.waveU[i].set(w.x, w.y, w.r, w.s); else P.waveU[i].set(0, 0, 0, 0); }
  pass(P.comp, null);
};
// how far the glow spreads (levels of blur, 1 to 5) and how strong it is; no arguments puts back the usual
let bloomN = 5;
V.bloom = (levels = 5, strength = 0.72) => { bloomN = levels; if (post) post.comp.uniforms.uBloom.value = strength; };
V.particles = () => [ADD, BLEND].map(S => (S ? S.head : 0));
V.CELL = CELL; V.lin = lin; V.rnd = rnd;
})();
