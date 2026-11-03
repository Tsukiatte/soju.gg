/* Aura Farm's 3D world: one floating island at sunset with a place for every tab (29 Oct, Chris: "I'd like all of
   this to be more like a game ... a 3d world background with the foreground being what's important"; then "put it into
   the main localhost"). The camera travels between the places and frames each one beside its panel; the Area's plots
   and the Defense team are platforms the units stand on; the gate paints the game's own portal onto a texture; the
   Lab's plate is laid on the 3D screen. Built only when the game runs in 3D (ui.js boot calls AF.initWorld); the game's
   loop calls HUB.step every frame. Desktop only: phones and the Settings switch keep the flat interface. */
(function () {
const AF = window.AF;
AF.initWorld = canvas => {
const T = THREE, K = AF.kit, TD = AF.TD;
const PI = Math.PI, TAU = PI * 2, sin = Math.sin, cos = Math.cos;
const HUB = AF.HUB = {};
// (perf pass) ?nomerge builds it the old way: every mesh on its own, shadows redrawn each frame (for measuring)
HUB.merge = !/[?&]nomerge/.test(location.search);
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const smooth = K.smooth, lerp = (a, b, k) => a + (b - a) * k, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2), easeOut = k => 1 - Math.pow(1 - k, 3);
HUB.ease = ease; HUB.easeOut = easeOut;
const RAMP = K.mat(0xffffff).gradientMap;
const INK = new T.MeshBasicMaterial({ color: 0x07070a, side: T.BackSide });
const glow = (hex, k = 2, o = {}) => { const m = new T.MeshBasicMaterial(Object.assign({ color: hex }, o)); m.color.multiplyScalar(k); return m; };
const toonVC = flat => new T.MeshToonMaterial({ vertexColors: true, gradientMap: RAMP, flatShading: !!flat });
const toonFlat = hex => new T.MeshToonMaterial({ color: hex, gradientMap: RAMP, flatShading: true });
const V3 = (...a) => new T.Vector3(...a);
// value noise, smoother than sine sums for terrain
const hsh = (x, z) => { const s = sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hsh(xi, zi), b = hsh(xi + 1, zi), c = hsh(xi, zi + 1), d = hsh(xi + 1, zi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
const fbm = (x, z) => vnoise(x, z) * 0.6 + vnoise(x * 2.1 + 5, z * 2.1 - 3) * 0.3 + vnoise(x * 4.3 - 2, z * 4.3 + 7) * 0.1;

// ---------------- renderer, camera, glow ----------------
const gl = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
gl.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
gl.outputColorSpace = T.SRGBColorSpace;
gl.shadowMap.enabled = true; gl.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
scene.fog = new T.Fog(0xe39a9a, 110, 420);
const cam = new T.PerspectiveCamera(32, 1, 0.5, 2000);
HUB.cam = cam; HUB.scene = scene; HUB.gl = gl;

const FS_V = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const POST = {
  bright: `uniform sampler2D tSrc; uniform vec2 uThr; varying vec2 vUv; void main() { vec3 c = texture2D(tSrc, vUv).rgb; c = min(c, vec3(20.0));
    float l = max(c.r, max(c.g, c.b)); if (!(l >= 0.0)) c = vec3(0.0); gl_FragColor = vec4(c * smoothstep(uThr.x, uThr.y, l), 1.0); }`,
  down: `uniform sampler2D tSrc; uniform vec2 uTex; varying vec2 vUv; void main() { vec3 c = texture2D(tSrc, vUv).rgb * 4.0;
    c += texture2D(tSrc, vUv + vec2(-1., -1.) * uTex).rgb + texture2D(tSrc, vUv + vec2(1., -1.) * uTex).rgb + texture2D(tSrc, vUv + vec2(-1., 1.) * uTex).rgb + texture2D(tSrc, vUv + vec2(1., 1.) * uTex).rgb;
    gl_FragColor = vec4(c / 8.0, 1.0); }`,
  up: `uniform sampler2D tSrc; uniform vec2 uTex; varying vec2 vUv; void main() { vec3 c = texture2D(tSrc, vUv + vec2(-2., 0.) * uTex).rgb + texture2D(tSrc, vUv + vec2(2., 0.) * uTex).rgb
    + texture2D(tSrc, vUv + vec2(0., -2.) * uTex).rgb + texture2D(tSrc, vUv + vec2(0., 2.) * uTex).rgb
    + (texture2D(tSrc, vUv + vec2(-1., -1.) * uTex).rgb + texture2D(tSrc, vUv + vec2(1., -1.) * uTex).rgb + texture2D(tSrc, vUv + vec2(-1., 1.) * uTex).rgb + texture2D(tSrc, vUv + vec2(1., 1.) * uTex).rgb) * 2.0;
    gl_FragColor = vec4(c / 12.0, 1.0); }`,
  // (1 Nov, "more saturation and post processing, bloom, color correction, temp, color grading") the grade, in linear
  // light: exposure and white balance, saturation and vibrance, contrast round mid grey, split toning, edge fringe,
  // vignette, the soft roll-off over white, then grain after sRGB (it also dithers the sky's banding)
  comp: `uniform sampler2D tScene, tBloom; uniform float uBloom, uFlash, uAspect, uTime, uExpo, uTemp, uTint, uSat, uVib, uGreen, uCon, uSplit, uCA, uVig, uGrain;
    uniform vec3 uFlashC, uShad, uHigh; varying vec2 vUv;
    void main() {
    vec2 d = vUv - 0.5, o = d * dot(d, d) * uCA;
    vec3 c = vec3(texture2D(tScene, vUv - o).r, texture2D(tScene, vUv).g, texture2D(tScene, vUv + o).b);
    c += texture2D(tBloom, vUv).rgb * uBloom + uFlashC * uFlash;
    c = max(c * uExpo * vec3(1.0 + uTemp, 1.0 + uTint, 1.0 - uTemp), vec3(0.0));
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722)), mx = max(c.r, max(c.g, c.b)), s = (mx - min(c.r, min(c.g, c.b))) / max(mx, 1e-4);
    c = max(mix(vec3(l), c, uSat + uVib * (1.0 - s)), vec3(0.0));
    c.r *= 1.0 - smoothstep(0.0, 0.45, (c.g - max(c.r, c.b)) / max(c.g, 1e-4)) * uGreen;
    c = 0.18 * pow(c / 0.18, vec3(uCon));
    l = dot(c, vec3(0.2126, 0.7152, 0.0722)); c *= mix(vec3(1.0), mix(uShad, uHigh, smoothstep(0.02, 0.55, l)), uSplit);
    float v = length(d * vec2(uAspect, 1.0) * 0.9); c *= 1.0 - smoothstep(0.55, 1.25, v) * uVig;
    c = c / (1.0 + max(vec3(0.0), c - 1.0) * 0.4); gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
    gl_FragColor.rgb += (fract(sin(dot(gl_FragCoord.xy + fract(uTime) * 61.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * uGrain;
  }`,
};
const fsm = (frag, u, add) => new T.ShaderMaterial({ uniforms: u, vertexShader: FS_V, fragmentShader: frag, depthTest: false, depthWrite: false, blending: add ? T.AdditiveBlending : T.NoBlending, transparent: !!add });
const P = {
  quad: new T.Mesh(new T.PlaneGeometry(2, 2)), qs: new T.Scene(), qc: new T.OrthographicCamera(-1, 1, 1, -1, 0, 1),
  bright: fsm(POST.bright, { tSrc: { value: null }, uThr: { value: new T.Vector2(1.05, 1.7) } }),
  down: fsm(POST.down, { tSrc: { value: null }, uTex: { value: new T.Vector2() } }),
  up: fsm(POST.up, { tSrc: { value: null }, uTex: { value: new T.Vector2() } }, true),
  comp: fsm(POST.comp, Object.assign({ tScene: { value: null }, tBloom: { value: null }, uBloom: { value: 0.55 }, uFlash: { value: 0 }, uFlashC: { value: new T.Color(1, 0.95, 0.9) }, uAspect: { value: 1 }, uTime: { value: 0 },
    uShad: { value: new T.Vector3(1, 1, 1) }, uHigh: { value: new T.Vector3(1, 1, 1) } }, ...["uExpo", "uTemp", "uTint", "uSat", "uVib", "uGreen", "uCon", "uSplit", "uCA", "uVig", "uGrain"].map(k => ({ [k]: { value: 0 } })))),
};
// (1 Nov) each scene's grade; HUB.grade.on = false shows the picture as it was (the old bloom and vignette only)
const GRADE = HUB.grade = { on: !/[?&]nograde/.test(location.search),
  island: { bloom: 0.7, thr: [0.98, 1.6], expo: 1, temp: 0.015, tint: 0, sat: 1.16, vib: 0.18, green: 0.18, con: 1.12, split: 1, shad: [0.9, 0.93, 1.15], high: [1.05, 1.0, 0.95], ca: 0.008, vig: 0.42, grain: 0.014 },
  hell: { bloom: 0.8, thr: [0.85, 1.5], expo: 1.02, temp: 0.01, tint: -0.01, sat: 1.15, vib: 0.2, green: 0, con: 1.12, split: 1, shad: [0.96, 0.92, 1.1], high: [1.06, 0.98, 0.92], ca: 0.008, vig: 0.48, grain: 0.014 },
  off: { bloom: 0.55, thr: [1.05, 1.7], expo: 1, temp: 0, tint: 0, sat: 1, vib: 0, green: 0, con: 1, split: 0, shad: [1, 1, 1], high: [1, 1, 1], ca: 0, vig: 0.38, grain: 0 },
};
function applyGrade(g) {
  const u = P.comp.uniforms;
  u.uBloom.value = g.bloom; P.bright.uniforms.uThr.value.set(g.thr[0], g.thr[1]);
  u.uExpo.value = g.expo; u.uTemp.value = g.temp; u.uTint.value = g.tint; u.uSat.value = g.sat; u.uVib.value = g.vib; u.uGreen.value = g.green; u.uCon.value = g.con;
  u.uSplit.value = g.split; u.uShad.value.fromArray(g.shad); u.uHigh.value.fromArray(g.high); u.uCA.value = g.ca; u.uVig.value = g.vig; u.uGrain.value = g.grain;
  u.uTime.value = performance.now() / 1000;
}
P.quad.frustumCulled = false; P.qs.add(P.quad);
const rt = new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: 4 });
const mips = [0, 1, 2, 3, 4, 5].map(() => new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, depthBuffer: false }));
function pass(m, target) { P.quad.material = m; gl.setRenderTarget(target); gl.render(P.qs, P.qc); }
function render() {
  if (HUB.shadowCache) {
    cullFigures(); unitShadows();
    // the units' bones were just worked out for the shadow pass: the main pass reuses them (one upload a frame, not two)
    const next = gl.info.render.frame + 1; for (const f of figs) if (f.skel) f.skel.frame = next;
  }
  // (30 Oct) the Underworld is a scene of its own, drawn in the island's place on its tab
  const hell = HUB.tab === "evolve" && HUB.hell;
  applyGrade(!GRADE.on ? GRADE.off : hell ? GRADE.hell : GRADE.island);
  gl.setRenderTarget(rt); gl.render(hell ? HUB.hell : scene, cam);
  P.bright.uniforms.tSrc.value = rt.texture; pass(P.bright, mips[0]);
  for (let i = 1; i < mips.length; i++) { P.down.uniforms.tSrc.value = mips[i - 1].texture; P.down.uniforms.uTex.value.set(1 / mips[i - 1].width, 1 / mips[i - 1].height); pass(P.down, mips[i]); }
  const ac = gl.autoClear; gl.autoClear = false;
  for (let i = mips.length - 1; i > 0; i--) { P.up.uniforms.tSrc.value = mips[i].texture; P.up.uniforms.uTex.value.set(1 / mips[i].width, 1 / mips[i].height); pass(P.up, mips[i - 1]); }
  gl.autoClear = ac;
  P.comp.uniforms.tScene.value = rt.texture; P.comp.uniforms.tBloom.value = mips[0].texture;
  pass(P.comp, null);
}
let VW = 1, VH = 1;
function resize() {
  VW = innerWidth; VH = innerHeight;
  gl.setSize(VW, VH, false); cam.aspect = VW / VH; cam.updateProjectionMatrix();
  const dw = Math.round(VW * gl.getPixelRatio()), dh = Math.round(VH * gl.getPixelRatio());
  rt.setSize(dw, dh);
  let a = dw, b = dh; for (const m of mips) { a = Math.max(1, a >> 1); b = Math.max(1, b >> 1); m.setSize(a, b); }
  P.comp.uniforms.uAspect.value = dw / dh;
}
addEventListener("resize", resize);
HUB.flash = (a, hex) => { HUB.flashA = Math.max(HUB.flashA || 0, a); if (hex) P.comp.uniforms.uFlashC.value.set(hex); else P.comp.uniforms.uFlashC.value.setRGB(1, 0.95, 0.9); };

// ---------------- sky, sun, light, clouds ----------------
const SUN = new T.Vector3(-0.85, 0.16, -0.5).normalize();
const sky = new T.Mesh(new T.SphereGeometry(1500, 48, 24), new T.ShaderMaterial({
  side: T.BackSide, depthWrite: false, fog: false, uniforms: { uSun: { value: SUN }, uT: { value: 0 } },
  vertexShader: `varying vec3 vD; void main() { vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform vec3 uSun; uniform float uT; varying vec3 vD; void main() {
    float h = vD.y, s = max(0.0, dot(vD, uSun));
    vec3 hor = vec3(1.0, 0.52, 0.42), mid = vec3(0.78, 0.26, 0.42), top = vec3(0.24, 0.10, 0.34), low = vec3(0.62, 0.30, 0.42);
    vec3 c = h > 0.0 ? mix(hor, mid, smoothstep(0.0, 0.32, h)) : mix(hor, low, smoothstep(0.0, -0.3, h));
    c = mix(c, top, smoothstep(0.3, 0.95, h));
    c = mix(c, vec3(1.0, 0.86, 0.55), pow(s, 9.0) * 0.6);
    c += vec3(1.0, 0.95, 0.75) * pow(s, 90.0) * 0.6 + vec3(1.0, 0.98, 0.9) * pow(s, 1800.0) * 4.0;
    vec3 p = floor(vD * 260.0); float r = fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    c += vec3(step(0.9975, r) * smoothstep(0.35, 0.7, h) * (0.5 + 0.5 * sin(uT * 1.7 + r * 60.0))) * 1.2;
    gl_FragColor = vec4(c, 1.0); }`,
}));
scene.add(sky);
scene.add(new T.HemisphereLight(0xd8c8ff, 0x5a3a4a, 1.15));
const sun = new T.DirectionalLight(0xffcf9e, 2.7);
sun.position.copy(SUN).multiplyScalar(90).add(V3(0, 40, 0));
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 260 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);
const fill = new T.DirectionalLight(0x9aa8ff, 0.55); fill.position.set(40, 30, 50); scene.add(fill);

// faceted clouds, like the card art: lumps of low-poly balls, lit by the low sun
const cloudGeo = new T.IcosahedronGeometry(1, 0), cloudMat = toonFlat(0xf2e6ff);
const clouds = [];
function cloud(x, y, z, s) {
  const g = new T.Group(); g.position.set(x, y, z); scene.add(g);
  const n = 4 + ((rand() * 4) | 0);
  for (let i = 0; i < n; i++) {
    const m = new T.Mesh(cloudGeo, cloudMat), k = 0.6 + rand() * 0.6;
    m.position.set((i - n / 2) * 1.3 + rand() * 0.6, rand() * 0.6 - Math.abs(i - n / 2) * 0.12, rand() * 1.2 - 0.6);
    m.scale.set(1.5 * k, 1.05 * k, 1.2 * k); m.rotation.set(rand() * 3, rand() * 3, rand() * 3); g.add(m);
  }
  g.scale.setScalar(s); g.lookAt(0, y, 0);
  clouds.push({ g, a: Math.atan2(z, x), r: Math.hypot(x, z), y, sp: (0.4 + rand() * 0.6) * 0.004 });
}
for (let i = 0; i < 26; i++) { const a = rand() * TAU, r = 160 + rand() * 260; cloud(cos(a) * r, 30 + rand() * 70, sin(a) * r, 5 + rand() * 6); }
for (let i = 0; i < 22; i++) { const a = rand() * TAU, r = 70 + rand() * 180; cloud(cos(a) * r, -26 - rand() * 30, sin(a) * r, 5 + rand() * 7); }

// ---------------- the island's shape ----------------
const EDGE = a => 60 + 3 * sin(3 * a + 1) + 2 * sin(7 * a) + 1.1 * sin(13 * a + 2);
// every tab's site: where it is, how much flat ground it gets, how high it stands
const SITES = {
  village: { at: [0, 0], r: 14, h: 0.6 },
  area:    { at: [0, 30], r: 15, h: 0.3 },
  summon:  { at: [0, -37], r: 10, h: 5.5 },
  units:   { at: [-35, -3], r: 12, h: 0.9 },
  traits:  { at: [35, -6], r: 12, h: 0.8 },
  ascend:  { at: [28, -33], r: 7, h: 8.5 },
  journal: { at: [30, 27], r: 10, h: 0.6 },
  defense: { at: [-31, 29], r: 13, h: 0.5 },
  // (30 Oct) the Merchant's stall, in the back corner behind everything
  relics:  { at: [-27, -31], r: 9, h: 1.0 },
};
// where the camera stands for each tab; shift = how far across the screen the site sits (0 = middle), so it sits
// beside its interface instead of under it
const SPOTS = {
  // (29 Oct, "slightly more top down ... its hard to know which unit i'm selecting", then "boring ... cause you cant
  // see the village"): higher and looking down about 20 degrees, back far enough that the village fills the top
  // (30 Oct, "the units here should be in the dead center of the window, like the camera should be in the middle of this
  // so its even"): no sideways offset, the plots sit in the middle of the screen
  area:    { cam: V3(0, 9.5, 64),       look: V3(0, 2.6, 27),     shift: 0 },
  summon:  { cam: V3(0, 12, -2.5),      look: V3(0, 9.4, -37),    shift: 0 },
  units:   { cam: V3(-18.5, 6.6, 10),   look: V3(-34, 2.9, -3),   shift: -0.28 },
  traits:  { cam: V3(19, 7, 12),        look: V3(36, 4.5, -7),    shift: -0.02 },
  // (30 Oct, "that 3d crystal needs the camera moved up so it sits in the center"): higher, at the spire's middle
  ascend:  { cam: V3(1, 15.5, -3),      look: V3(28, 14.5, -33),  shift: -0.29 },
  journal: { cam: V3(10, 7.5, 45),      look: V3(30, 3, 26),      shift: -0.23 },
  // (29 Oct, "the defense area ... should be like the home area, but with 6 units"): from inland, over the team's
  // platforms, out past the dock to the worlds
  // (30 Oct, "that defense camera should be zoomed in slightly more"): 12% closer along the same line
  defense: { cam: V3(-14.8, 11.6, 16.8),  look: V3(-31.7, 1.6, 29.7), shift: 0.1 },
  // (30 Oct) the Merchant: from the village side, the stall left of the panel
  relics:  { cam: V3(-7.5, 8.6, -11.5),   look: V3(-27.5, 3.2, -32),   shift: -0.22 },
  // (30 Oct) the Underworld (its own scene, HUB.hell): from the lake's shore, the shrine and the altar right of the panel
  evolve:  { cam: V3(-6, 12, 46),        look: V3(0, 7, -12),       shift: 0.17 },
};
HUB.SPOTS = SPOTS; HUB.SITES = SITES;
// (30 Oct, "zoom the camera in more for bigger screens like mine"): on a window wider than 16:9 the Area and Defense
// cameras come in along their line of sight, so the units fill the screen as they do at 16:9
const SPOT_BASE = { area: SPOTS.area.cam.clone(), defense: SPOTS.defense.cam.clone() };
function wideSpots() {
  const k = Math.max(0.75, Math.min(1, (16 / 9) / (innerWidth / Math.max(1, innerHeight))));
  for (const t in SPOT_BASE) {
    const s = SPOTS[t], c = HUB.camS; s.cam.copy(SPOT_BASE[t]).sub(s.look).multiplyScalar(k).add(s.look);
    if (c && HUB.tab === t && c.k >= 1) c.pos.copy(s.cam); // standing there now: straight to the new spot
  }
}
wideSpots();
addEventListener("resize", wideSpots);
const PATHS = [];
for (const k in SITES) {
  if (k === "village") continue;
  const [x1, z1] = SITES[k].at, L = Math.hypot(x1, z1), nx = -z1 / L, nz = x1 / L, bend = (k.length % 3 - 1) * 0.12 * L;
  const mx = x1 / 2 + nx * bend, mz = z1 / 2 + nz * bend, pts = [];
  for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([2 * t * (1 - t) * mx + t * t * x1, 2 * t * (1 - t) * mz + t * t * z1]); }
  PATHS.push(pts);
}
function segDist(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz, t = l ? clamp(((px - ax) * dx + (pz - az) * dz) / l, 0, 1) : 0; return Math.hypot(px - ax - dx * t, pz - az - dz * t); }
function pathDist(x, z) { let d = 1e9; for (const p of PATHS) for (let i = 1; i < p.length; i++) d = Math.min(d, segDist(x, z, p[i - 1][0], p[i - 1][1], p[i][0], p[i][1])); return d; }
function siteDist(x, z) { let d = 1e9; for (const k in SITES) { const s = SITES[k]; d = Math.min(d, Math.hypot(x - s.at[0], z - s.at[1]) - s.r); } return d; }
// the ground: site heights blended smoothly (so paths ramp between them), then hills wherever paths and sites aren't
function low(x, z) {
  let w = 0.12, h = 0.6 * 0.12;
  for (const k in SITES) { const s = SITES[k], d = Math.hypot(x - s.at[0], z - s.at[1]), q = Math.exp(-Math.pow(d / (s.r + 7), 2)); w += q; h += s.h * q; }
  return h / w;
}
function H(x, z, pd = pathDist(x, z), sd = siteDist(x, z)) {
  const r = Math.hypot(x, z), R = EDGE(Math.atan2(z, x));
  const free = smooth(1.5, 7, pd) * smooth(0, 7, sd);
  const hills = (fbm(x * 0.045, z * 0.045) * 2.2 + 1.1) + smooth(R - 24, R - 4, r) * (2.5 + fbm(x * 0.08 + 3, z * 0.08) * 3);
  // (30 Oct, "the ascent crystal is floating off the ground"): across a site the ground is the site's own height,
  // ramping back to the blend over a few units past its edge
  let h = low(x, z) + hills * free, fk = 0, fh = 0;
  for (const k in SITES) { const s = SITES[k], f = smooth(s.r + 3, s.r - 0.5, Math.hypot(x - s.at[0], z - s.at[1])); if (f > fk) { fk = f; fh = s.h; } }
  return fk ? h + (fh - h) * fk : h;
}
HUB.H = H;

// ---------------- building the island ----------------
const island = new T.Group(); scene.add(island);
{
  const N = 200, S = 132, geo = new T.PlaneGeometry(S, S, N, N); geo.rotateX(-PI / 2);
  const Pp = geo.attributes.position, cols = new Float32Array(Pp.count * 3), c = new T.Color(), c2 = new T.Color();
  for (let i = 0; i < Pp.count; i++) {
    let x = Pp.getX(i), z = Pp.getZ(i);
    const a = Math.atan2(z, x), r = Math.hypot(x, z), R = EDGE(a);
    let lip = 0;
    if (r > R) { x *= R / r; z *= R / r; lip = 1; }
    const pd = pathDist(x, z), sd = siteDist(x, z);
    Pp.setXYZ(i, x, H(x, z, pd, sd) - lip * 0.6, z);
    const n = fbm(x * 0.07, z * 0.07);
    c.set(0x5aa63e).lerp(c2.set(0x86c252), smooth(-0.4, 0.6, n));
    c.lerp(c2.set(0x4a8f37), smooth(0.2, -0.6, fbm(x * 0.03 + 9, z * 0.03)) * 0.6);
    c.lerp(c2.set(0xa8c25a), smooth(4, 0, sd) * 0.15);
    c.offsetHSL(0, 0, (rand() - 0.5) * 0.02);
    cols.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new T.BufferAttribute(cols, 3)); geo.computeVertexNormals();
  // both sides: grid triangles pulled in to the island's outline can flip over, and a flipped one would be a hole
  const top = new T.Mesh(geo, toonVC()); top.material.side = T.DoubleSide; top.receiveShadow = true; island.add(top);
  // the rock underneath, tapering far down, with grass lipping over the top edge
  const SEG = 160, RINGS = 16, v = [], cl = [], idx = [];
  for (let j = 0; j <= RINGS; j++) for (let i = 0; i <= SEG; i++) {
    const a = (i / SEG) * TAU, f = j / RINGS, R = EDGE(a), ex = cos(a) * R, ez = sin(a) * R, n = fbm(cos(a) * 6 + j * 0.5, sin(a) * 6 - j * 0.3);
    const r = j === RINGS ? 0 : R * Math.pow(1 - f, 0.7) * (1 + (j ? 0.12 * n : 0));
    // each ring starts below the grass right above it, or the rock's top slope can rise through low ground near the
    // edge (the Defense camp's flat ground runs almost to the rim)
    const rx = cos(a) * r, rz = sin(a) * r, top = j && r < R ? Math.min(H(ex, ez) - 0.6, H(rx, rz) - 0.8) : H(ex, ez) - 0.6;
    const y = top - f * 46 - (j ? n * 2.2 : 0);
    v.push(cos(a) * r, y, sin(a) * r);
    c.set(j === 0 ? 0x5a9a3c : f < 0.1 ? 0x8a5a3a : 0x7a6070).lerp(c2.set(0x45324c), smooth(0.15, 1, f) * 0.85);
    c.offsetHSL(0, 0, n * 0.05); cl.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) { const a = j * (SEG + 1) + i, b = a + SEG + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const ug = new T.BufferGeometry(); ug.setAttribute("position", new T.Float32BufferAttribute(v, 3)); ug.setAttribute("color", new T.Float32BufferAttribute(cl, 3));
  ug.setIndex(idx); ug.computeVertexNormals();
  const under = new T.Mesh(ug, toonVC(true)); island.add(under);
  // the rock's ink outline sits a little below the grass lip: at full height it rose above the ground near the edge
  const ink = new T.Mesh(ug, INK); ink.scale.set(1.008, 1, 1.008); ink.position.y = -0.7; under.add(ink);
}
// dirt paths, following the ground
for (const p of PATHS) {
  const v = [], cl = [], idx = [], c = new T.Color(), dirt = new T.Color(0xd2b282), edge = new T.Color(0xa88a5c);
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L, w = 1.25 * (0.9 + sin(i * 1.7) * 0.1);
    for (const [s, col] of [[-1, edge], [-0.6, dirt], [0.6, dirt], [1, edge]]) {
      const x = p[i][0] + nx * w * s, z = p[i][1] + nz * w * s;
      v.push(x, H(x, z) + 0.06, z); c.copy(col).offsetHSL(0, 0, (rand() - 0.5) * 0.03); cl.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < p.length - 1; i++) for (let j = 0; j < 3; j++) { const a = i * 4 + j; idx.push(a, a + 4, a + 1, a + 1, a + 4, a + 5); }
  const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(v, 3)); g.setAttribute("color", new T.Float32BufferAttribute(cl, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new T.Mesh(g, toonVC()); m.receiveShadow = true; m.material.polygonOffset = true; m.material.polygonOffsetFactor = -2; island.add(m);
}
function floor(x, z, r, col, y, sy = 1) {
  const m = new T.Mesh(new T.CircleGeometry(r, 56), K.mat(col)); m.rotation.x = -PI / 2; m.scale.y = sy; m.position.set(x, y + 0.08, z); m.receiveShadow = true; island.add(m);
  const e = new T.Mesh(new T.RingGeometry(r, r + 0.4, 56), K.mat(0x9a8262)); e.rotation.x = -PI / 2; e.scale.y = sy; e.position.set(x, y + 0.085, z); island.add(e);
  return m;
}

// ---------------- props, in the card art's style ----------------
const at = k => SITES[k].at;
function pivot(x, z, ry = 0, y) { const g = new T.Group(); g.position.set(x, y === undefined ? H(x, z) : y, z); g.rotation.y = ry; island.add(g); return g; }
function prism(w, h, d) {
  const s = new T.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); g.translate(0, 0, -w / 2); g.rotateY(PI / 2); return g;
}
const WIN = glow(0xffcf6a, 1.5);
function windows(g, w, d, y, n) {
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5 - n / 2) * (w / n);
    for (const s of [-1, 1]) { const m = new T.Mesh(new T.BoxGeometry(0.5, 0.6, 0.06), WIN); m.position.set(x, y, s * (d / 2 + 0.02)); g.add(m); }
  }
}
function cottage(x, z, ry, o = {}) {
  const g = pivot(x, z, ry), w = o.w || 4, d = o.d || 3.4, h = o.h || 2.6, roof = o.roof || 0xb4533c;
  K.box(g, w, h, d, o.wall || 0xf2e6d0, 0, h / 2, 0);
  K.box(g, w + 0.06, 0.18, d + 0.06, 0x6a4a32, 0, h * 0.55, 0, { ink: 0.02 });
  for (const s of [-1, 1]) K.box(g, 0.18, h, 0.18, 0x6a4a32, s * (w / 2), h / 2, d / 2, { ink: 0.02 });
  K.mesh(g, prism(w + 0.6, h * 0.62 + 0.6, d + 0.8), roof, 0, h - 0.05, 0, { inkScale: 1.03 });
  windows(g, w, d, h * 0.32, Math.max(1, Math.round(w / 2)));
  K.box(g, 0.7, 1.1, 0.08, 0x5a3a24, 0, 0.55, d / 2 + 0.05, { ink: 0.02 });
  if (o.chimney !== false) K.box(g, 0.5, 1.6, 0.5, 0x8b8f96, w * 0.28, h + 0.9, -d * 0.18);
  return g;
}
function windmill(x, z, ry) {
  const g = pivot(x, z, ry);
  K.mesh(g, K.cyl(1.3, 1.9, 5.5, 8), 0xe8dcc0, 0, 2.75, 0);
  K.mesh(g, new T.ConeGeometry(1.7, 1.8, 8), 0x5a3e6a, 0, 6.4, 0);
  const hub = new T.Group(); hub.position.set(0, 4.8, 1.6); g.add(hub);
  for (let i = 0; i < 4; i++) { const b = new T.Group(); b.rotation.z = (i / 4) * TAU; hub.add(b); K.box(b, 0.16, 3.6, 0.1, 0x6a4a32, 0, 1.9, 0); K.box(b, 0.9, 2.8, 0.06, 0x8a7ab8, 0.5, 2.2, 0, { ink: 0.02 }); }
  windows(g, 1.2, 2.6, 3.2, 1);
  return hub;
}
function lamp(x, z, col = 0xffc070) {
  const g = pivot(x, z);
  K.box(g, 0.14, 2.3, 0.14, 0x2e2630, 0, 1.15, 0);
  K.box(g, 0.44, 0.1, 0.44, 0x2e2630, 0, 2.38, 0);
  const b = new T.Mesh(new T.BoxGeometry(0.3, 0.38, 0.3), glow(col, 2.4)); b.position.y = 2.12; g.add(b);
  return g;
}
function fence(pts, col = 0x7a5638) {
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 1.6));
    for (let j = 0; j <= n; j++) { const x = lerp(ax, bx, j / n), z = lerp(az, bz, j / n); K.box(island, 0.16, 0.95, 0.16, col, x, H(x, z) + 0.45, z, { ink: 0.025 }); }
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, ry = -Math.atan2(bz - az, bx - ax);
    for (const y of [0.4, 0.75]) K.box(island, L, 0.1, 0.08, 0x8a6442, mx, H(mx, mz) + y, mz, { ry, ink: 0.02 });
  }
}
function barrels(x, z) { const g = pivot(x, z); for (let i = 0; i < 3; i++) K.mesh(g, K.cyl(0.38, 0.38, 0.8, 10), 0x8a5a3a, (i - 1) * 0.8, 0.4, (i % 2) * 0.4); return g; }
function crates(x, z) { const g = pivot(x, z, rand()); K.box(g, 0.8, 0.8, 0.8, 0xb08a58, 0, 0.4, 0); K.box(g, 0.7, 0.7, 0.7, 0xc49a62, 0.85, 0.35, 0.2, { ry: 0.4 }); K.box(g, 0.6, 0.6, 0.6, 0xb08a58, 0.3, 1.1, 0.1, { ry: 0.2 }); return g; }
function rock(x, z, s) { const m = K.mesh(island, new T.DodecahedronGeometry(s, 0), 0x8b8f9a, x, H(x, z) + s * 0.3, z, { ry: rand() * 3, inkScale: 1.06 }); m.scale.y = 0.65; m.material = toonFlat(0x8b8f9a); return m; }

// ---- the village square in the middle ----
{
  floor(0, 0, 9, 0xd8c6a2, SITES.village.h);
  const base = pivot(0, 0); K.mesh(base, K.cyl(2.2, 2.7, 0.7, 10), 0x8b8f9a, 0, 0.35, 0); K.mesh(base, K.cyl(1.4, 1.8, 0.8, 10), 0x9da2ad, 0, 1.1, 0);
  const cr = new T.Mesh(new T.OctahedronGeometry(1.1, 0), glow(0xff6a3d, 1.35)); cr.scale.set(1, 1.8, 1); cr.position.y = 4.3; base.add(cr);
  const ci = new T.Mesh(cr.geometry, INK); ci.scale.setScalar(1.08); cr.add(ci);
  const pl = new T.PointLight(0xff7a4a, 14, 18, 1.5); pl.position.y = 4; base.add(pl);
  HUB.crystal = cr;
  [[-12, -7, { roof: 0xb4533c }], [-13, 5, { roof: 0x4b5a74, w: 4.6 }], [12, -8, { roof: 0x7a4a2e }], [13.5, 4, { roof: 0xb4533c, w: 3.6 }],
    [-6, -13.5, { roof: 0x4b5a74, w: 3.4 }], [7, -14, { roof: 0xb4533c }]].forEach(([x, z, o]) => cottage(x, z, Math.atan2(-x, -z), o));
  [[-8.6, 3], [8.6, -3], [-3, -9.5], [4, 9.2], [-6.5, 7.5]].forEach(([x, z]) => lamp(x, z));
  barrels(9.8, 6.5); crates(-10, -2.5); crates(5.5, -11.5);
  const w = pivot(5.8, 4.8); K.mesh(w, K.cyl(1, 1.1, 0.9, 12), 0x8b8f96, 0, 0.45, 0); for (const s of [-1, 1]) K.box(w, 0.14, 1.9, 0.14, 0x5a3e2a, s * 0.85, 1.4, 0); K.mesh(w, prism(2.2, 0.7, 1.5), 0xb4533c, 0, 2.3, 0, { inkScale: 1.05 });
}
// the gold "+" that floats over an empty platform (Area and Defense)
const PLUS = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  x.beginPath(); x.arc(64, 64, 52, 0, TAU); x.fillStyle = "#ffc93a"; x.fill(); x.lineWidth = 10; x.strokeStyle = "#130d1d"; x.stroke();
  x.beginPath(); x.arc(64, 64, 40, PI * 1.1, PI * 1.9); x.lineWidth = 6; x.strokeStyle = "rgba(255,255,255,.55)"; x.stroke();
  x.lineCap = "round"; x.lineWidth = 22; x.strokeStyle = "#130d1d"; x.beginPath(); x.moveTo(64, 38); x.lineTo(64, 90); x.moveTo(38, 64); x.lineTo(90, 64); x.stroke();
  x.lineWidth = 11; x.strokeStyle = "#ffffff"; x.stroke();
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
})();
// a padlock over a plot that isn't open: gold on the next one to buy, violet on those that open with ascensions, grey
// on the rest
const lockTex = col => {
  const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  x.lineJoin = x.lineCap = "round";
  x.beginPath(); x.arc(64, 54, 23, PI, 0); x.lineWidth = 26; x.strokeStyle = "#130d1d"; x.stroke(); x.lineWidth = 12; x.strokeStyle = "#d9dbe2"; x.stroke();
  x.beginPath(); x.roundRect(28, 52, 72, 58, 14); x.fillStyle = col; x.fill(); x.lineWidth = 10; x.strokeStyle = "#130d1d"; x.stroke();
  x.beginPath(); x.moveTo(38, 64); x.lineTo(88, 64); x.lineWidth = 5; x.strokeStyle = "rgba(255,255,255,.5)"; x.stroke();
  x.beginPath(); x.arc(64, 80, 7, 0, TAU); x.fillStyle = "#130d1d"; x.fill(); x.fillRect(61, 82, 6, 14);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
};
const LOCKS = { next: lockTex("#ffc93a"), asc: lockTex("#a77bff"), locked: lockTex("#7f8494") };
function padExtras(p, kind, i, lift = 0) {
  const plus = new T.Sprite(new T.SpriteMaterial({ map: PLUS, transparent: true, depthWrite: false })); plus.scale.setScalar(1.15); plus.position.y = 1.9 + lift; plus.userData.y = 1.9 + lift; p.add(plus);
  const hit = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 3.2 + lift, 8), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 1.6 + lift / 2; p.add(hit);
  // (29 Oct, "when you hover it should show a glow around the pedastal"): a ring of light on the ground around it
  // a ring of light at the unit's feet and a glowing shell round the pedestal, so it reads from either row
  const glowM = () => new T.MeshBasicMaterial({ color: new T.Color(0xffe27a).multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  const hl = new T.Mesh(new T.RingGeometry(1.05, 1.6, 56), glowM()); hl.rotation.x = -PI / 2; hl.position.y = 0.54 + lift; p.add(hl);
  const shell = new T.Mesh(new T.CylinderGeometry(1.34, 1.46, 0.5 + lift, 40, 1, true), glowM()); shell.position.y = (0.5 + lift) / 2; p.add(shell);
  p.userData.hl = hl; p.userData.shell = shell;
  for (const k of [hl, shell, hit]) k.userData.keep = true;
  p.userData.pad = kind; p.userData.slot = i;
  return plus;
}
// ---- the Area: a fenced farm south of the square, units on round plots among the crops ----
const plots = [];
{
  const [ax, az] = at("area"), hy = SITES.area.h;
  floor(ax, az, 12.5, 0x8a6a4a, hy, 0.62);
  for (let r = 0; r < 7; r++) for (let i = 0; i < 9; i++) { const x = ax - 9 + i * 2.2 + (r % 2) * 0.5, z = az - 11.6 + r * 0.35; if (Math.abs(x - ax) < 1) continue; K.box(island, 0.22, 0.75 + rand() * 0.25, 0.22, 0xe8b53a, x, hy + 0.45, z - 0.2, { ink: 0.02 }); }
  // (29 Oct, "connect this fence behind the units"): one pen, closed just behind the back row, the crops outside it
  fence([[ax - 3, az + 9], [ax - 13.5, az + 9], [ax - 13.5, az - 9.2], [ax + 13.5, az - 9.2], [ax + 13.5, az + 9], [ax + 3, az + 9]]);
  HUB.mill = windmill(ax + 17.5, az - 3, -0.6);
  HUB.mill.add(new T.Mesh(new T.CircleGeometry(4.2, 20), new T.MeshBasicMaterial({ visible: false }))); // (1 Nov) the storm's click area
  barrels(ax + 14.8, az + 5); crates(ax - 14.8, az + 6);
  // the game's 15 slots: two rows of six, then slots 13-15 (they open with ascensions) on a row of three tall violet
  // pedestals at the back, a step above the rest
  for (let i = 0; i < 15; i++) {
    // (29 Oct, "put the back row of units on a slightly higher pedestal"): the back row stands a step up, so it shows over the front
    const row = i < 6 ? 0 : i < 12 ? 1 : 2, col = row < 2 ? i % 6 : i - 12, x = ax + (row < 2 ? col - 2.5 : col - 1) * 3.7;
    const z = az + [2.0, -2.6, -7.0][row], lift = [0, 0.95, 1.6][row];
    const p = pivot(x, z, 0, hy);
    // the ascension plots are altars, a slim stem under a wide violet cap, so they don't wall off the village behind
    if (row === 2) { K.mesh(p, K.cyl(0.55, 0.8, 0.1 + lift, 14), 0x5d4c80, 0, (0.1 + lift) / 2, 0); K.mesh(p, K.cyl(1.12, 0.9, 0.32, 18), 0x8a76b8, 0, lift + 0.24, 0); }
    else K.mesh(p, K.cyl(1.05, 1.25, 0.4 + lift, 18), lift ? 0x7d8290 : 0x8b8f9a, 0, (0.4 + lift) / 2, 0);
    K.mesh(p, K.cyl(0.95, 1.0, 0.12, 18), 0xb6a68a, 0, 0.46 + lift, 0, { ink: false });
    const ring = new T.Mesh(new T.TorusGeometry(1.02, 0.05, 6, 48), glow(0xffffff, 1.4)); ring.rotation.x = PI / 2; ring.position.y = 0.52 + lift; ring.userData.keep = true; p.add(ring);
    plots.push({ p, ring, x, z, y: hy + 0.5 + lift, face: 0, f: null, plus: padExtras(p, "area", i, lift) });
  }
}
HUB.plots = plots;
// ---- Summon: the gate up on its hill, stone steps up to it ----
const gate = {};
{
  const [gx, gz] = at("summon"), hy = SITES.summon.h;
  floor(gx, gz, 8.5, 0xb8b0a4, hy);
  const G = pivot(gx, gz, 0, hy);
  [[7, 0.45], [6, 0.45], [5, 0.45]].forEach(([r, h], i) => K.mesh(G, K.cyl(r, r + 0.15, h, 40), [0x7d8290, 0x8b909e, 0x9a9fad][i], 0, 0.22 + i * 0.45, 0));
  const top = 1.35;
  for (const s of [-1, 1]) {
    K.box(G, 1.4, 10.4, 1.4, 0x6e7280, s * 5.6, top + 5.2, 0); K.box(G, 2, 0.7, 2, 0x5d616e, s * 5.6, top + 10.6, 0); K.box(G, 2, 0.7, 2, 0x5d616e, s * 5.6, top + 0.35, 0);
    // (30 Oct) the gate's banner: its own material, recoloured with the gate; its symbol hangs on a plane in front
    const b = K.box(G, 1.3, 3.6, 0.08, 0xd2402a, s * 5.6, top + 7.6, 0.75, { ink: 0.02, own: 1 });
    const sym = new T.Mesh(new T.PlaneGeometry(1.1, 1.1), new T.MeshBasicMaterial({ transparent: true, depthWrite: false }));
    sym.position.set(0, 0, 0.05); sym.visible = false; b.add(sym); b.userData.sym = sym;
    (gate.banners = gate.banners || []).push(b);
  }
  K.mesh(G, new T.TorusGeometry(4.6, 0.6, 10, 72), 0x5d616e, 0, top + 5.1, 0, { inkScale: 1.05 });
  K.box(G, 12.6, 0.8, 1.6, 0x5d616e, 0, top + 11.1, 0);
  const hole = new T.Mesh(new T.CircleGeometry(4.05, 64), new T.MeshBasicMaterial({ color: 0x06030c })); hole.position.set(0, top + 5.1, -0.08); G.add(hole);
  // the portal: the game's own drawing (portal.js) on a texture, redrawn every frame
  gate.canvas = document.createElement("canvas"); gate.canvas.width = gate.canvas.height = 1024;
  // (29 Oct, perf pass) kept as plain RGBA8 and turned from sRGB in the shader, the way three does video: copying a
  // canvas into an sRGB texture misses the browser's GPU-to-GPU path, and that upload was 11 of the Summon tab's 12.6 ms
  // of GPU a frame (now 1.4 ms in all; the picture moves by 0.03 of 255 on average)
  gate.tex = new T.CanvasTexture(gate.canvas); gate.tex.colorSpace = T.NoColorSpace; gate.tex.generateMipmaps = false; gate.tex.minFilter = T.LinearFilter;
  gate.tex.anisotropy = gl.capabilities.getMaxAnisotropy();
  // (30 Oct, "whats going on here with the dots on the edge?"): uploaded premultiplied, as the canvas keeps it, and drawn
  // with premultiplied blending; un-premultiplying the faint outer glow turned its rounding into coloured specks
  gate.tex.premultiplyAlpha = true;
  gate.mat = new T.MeshBasicMaterial({ map: gate.tex, transparent: true, depthWrite: false, blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor });
  gate.mat.color.setScalar(1.45);
  gate.mat.defines = { DECODE_VIDEO_TEXTURE: "" };
  const disk = new T.Mesh(new T.PlaneGeometry(10.6, 10.6), gate.mat); disk.position.set(0, top + 5.1, 0.02); G.add(disk);
  // (30 Oct) the portal's light on the stone: just in front of the opening, so the ring's inner face and the pillars catch it
  gate.light = new T.PointLight(0xff6a2a, 62, 24, 1.4); gate.light.position.set(0, top + 5.1, 1.6); G.add(gate.light);
  // (29 Oct, "this vortex in 3d should have a lot more glow on around it"): a halo in the gate's colour round the portal,
  // clear over the vortex itself, brightest at its rim and out over the stone ring into the air, past the bloom's
  // threshold so it spreads further still; it breathes, and flares when a summon kicks the portal
  const hc = document.createElement("canvas"); hc.width = hc.height = 256;
  { const x = hc.getContext("2d"), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 0], [0.46, 0], [0.53, 0.7], [0.58, 1], [0.66, 0.4], [0.8, 0.1], [1, 0]].forEach(([o, a]) => g.addColorStop(o, `rgba(255,255,255,${a})`));
    x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
  const ht = new T.CanvasTexture(hc); ht.colorSpace = T.SRGBColorSpace;
  // (30 Oct, "the blue glow on the outer portal is still horrible ... a real glow that's actually making the portal itself
  // look like its illuminated"): the halo no longer lies over the stone. It stands BEHIND the ring, so its light spills
  // out round the frame's outer edge with the stone solid in front (the black disc inside hides its middle)
  { const x = hc.getContext("2d"), g2 = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    x.clearRect(0, 0, 256, 256);
    [[0, 0], [0.55, 0], [0.62, 0.85], [0.68, 0.55], [0.8, 0.18], [1, 0]].forEach(([o, a]) => g2.addColorStop(o, `rgba(255,255,255,${a})`));
    x.fillStyle = g2; x.fillRect(0, 0, 256, 256); ht.needsUpdate = true; }
  gate.halo = new T.Mesh(new T.PlaneGeometry(17, 17), new T.MeshBasicMaterial({ map: ht, color: 0xff6a2a, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
  gate.halo.position.set(0, top + 5.1, -0.75); gate.halo.renderOrder = 2; G.add(gate.halo);
  gate.haloC = new T.Color(0xff6a2a);
  // the portal's edge: a thin bright ring where it meets the stone
  gate.rim = new T.Mesh(new T.TorusGeometry(4.02, 0.07, 6, 96), glow(0xff6a2a, 2)); gate.rim.position.set(0, top + 5.1, 0.06); G.add(gate.rim);
  // motes drifting slowly up and round the gate, twinkling (a soft round sprite, light added)
  { const N = 90, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), sc = document.createElement("canvas"); sc.width = sc.height = 64;
    const sx = sc.getContext("2d"), sg = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0, "rgba(255,255,255,1)"); sg.addColorStop(0.3, "rgba(255,255,255,.55)"); sg.addColorStop(1, "rgba(255,255,255,0)");
    sx.fillStyle = sg; sx.fillRect(0, 0, 64, 64);
    const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("color", new T.BufferAttribute(col, 3));
    const st = new T.CanvasTexture(sc); st.colorSpace = T.SRGBColorSpace;
    gate.motes = new T.Points(geo, new T.PointsMaterial({ size: 0.46, map: st, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    gate.motes.frustumCulled = false; G.add(gate.motes);
    // the portal's light pooled on the steps in front of it
    gate.pool = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ map: st, color: 0xff6a2a, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    gate.pool.rotation.x = -PI / 2; gate.pool.scale.set(4.2, 2.3, 1); gate.pool.position.set(0, top + 0.03, 2.2); // inside the top step G.add(gate.pool);
    gate.moteP = Array.from({ length: N }, (_, i) => ({ a: rand() * TAU, r: 4.2 + rand() * 3.2, y: rand() * 11.5, z: (rand() - 0.5) * 3, sp: 0.06 + rand() * 0.12, up: 0.25 + rand() * 0.35, ph: rand() * TAU, w: i % 3 === 0 }));
  }
  for (const s of [-1, 1]) { K.mesh(G, K.cyl(0.55, 0.38, 0.8, 10), 0x4a4652, s * 3.4, top + 0.4, 4.2); const f = new T.Mesh(new T.ConeGeometry(0.32, 0.9, 6), glow(0xffa040, 2.2)); f.position.set(s * 3.4, top + 1.2, 4.2); G.add(f); }
  // each step on the highest ground under it (across its width and depth), never into the ground
  for (let i = 0, prev = hy; i < 9; i++) {
    const z = gz + 8.5 + i * 0.9;
    let g = -1e9; for (const dx of [-2.3, 0, 2.3]) for (const dz of [-0.5, 0, 0.5]) g = Math.max(g, H(gx + dx, z + dz));
    const y = Math.max(g + 0.06, Math.min(prev, lerp(hy, H(gx, gz + 17), i / 9))); prev = y;
    K.box(island, 4.6, 0.5, 1.0, 0xa8a094, gx, y - 0.1, z, { ink: 0.03 });
  }
  gate.G = G; gate.top = top; gate.at = V3(gx, hy + top + 5.1, gz);
  gate.st = AF.portal.newPortal("ember"); gate.o = {};
}
HUB.gate = gate;
// ---- Units: the hall, a courtyard and a showcase pedestal ----
const hall = {};
{
  const [ux, uz] = at("units"), hy = SITES.units.h;
  floor(ux, uz, 10.5, 0xc8bca6, hy);
  const g = pivot(ux - 9, uz, PI / 2, hy);
  K.box(g, 12, 6, 6, 0xe8dcc8, 0, 3, 0); K.mesh(g, prism(12.8, 3.6, 7), 0x4b5a74, 0, 5.95, 0, { inkScale: 1.02 });
  for (const s of [-1, 1]) { K.box(g, 2.6, 9, 2.6, 0xdcd0bc, s * 6.4, 4.5, 0.2); K.mesh(g, new T.ConeGeometry(2.1, 3.2, 4), 0x4b5a74, s * 6.4, 10.6, 0.2, { ry: PI / 4, inkScale: 1.05 }); }
  windows(g, 10, 6, 3.6, 4); K.box(g, 2, 3.2, 0.1, 0x5a3a24, 0, 1.6, 3.05, { ink: 0.02 });
  for (const s of [-1, 1]) K.box(g, 1.4, 3.2, 0.06, 0xd2402a, s * 3.2, 3.8, 3.06, { ink: 0.02 });
  hall.ped = pivot(ux + 1, uz, 0, hy);
  K.mesh(hall.ped, K.cyl(1.9, 2.2, 0.6, 24), 0x8b8f9a, 0, 0.3, 0); K.mesh(hall.ped, K.cyl(1.7, 1.8, 0.18, 24), 0xc9b88f, 0, 0.66, 0, { ink: false });
  hall.ring = new T.Mesh(new T.RingGeometry(0.97, 1, 96), new T.MeshBasicMaterial({ color: new T.Color(0xffd23a).multiplyScalar(1.2), transparent: true, opacity: 0.85, depthWrite: false })); hall.ring.rotation.x = -PI / 2; hall.ring.position.set(ux + 1, hy + 0.12, uz); island.add(hall.ring);
  hall.fill = new T.Mesh(new T.CircleGeometry(1, 64), new T.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: 0.08, depthWrite: false })); hall.fill.rotation.x = -PI / 2; hall.fill.position.copy(hall.ring.position); island.add(hall.fill);
  // (29 Oct, request: "the units around them here are clashing into the house", then "just remove those units"): the six
  // units that stood round the pedestal are gone; only the showcased one stands in the courtyard
  [[ux + 5, uz - 9.5], [ux + 5, uz + 9.5]].forEach(([x, z]) => lamp(x, z));
  hall.at = [ux, uz, hy];
}
HUB.hall = hall;
// ---- Trait Lab: a workshop, a deck and the big screen ----
const lab = {};
{
  const [lx, lz] = at("traits"), hy = SITES.traits.h;
  const w = cottage(lx + 9, lz - 4, -PI / 2 - 0.3, { w: 5, d: 4, roof: 0x3d6aa8 });
  K.box(w, 0.1, 3.2, 0.1, 0x3a3a44, -1.6, 5.4, 0); const tipL = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), glow(0x6ab0ff, 2.5)); tipL.position.set(-1.6, 7.05, 0); w.add(tipL);
  const D = pivot(lx, lz, 0, hy); K.box(D, 13, 0.4, 10, 0x8a6442, 0, 0.2, 0);
  for (let i = 0; i < 10; i++) K.box(D, 0.07, 0.42, 9.9, 0x6a4a32, -5.85 + i * 1.3, 0.21, 0, { ink: false });
  const S = new T.Group(); S.position.set(lx + 3.6, hy + 0.4, lz - 2); S.rotation.y = -PI / 2 + 0.55; island.add(S);
  // (29 Oct, request: "these 2 beams should be lowered to attach just below the sign"): the posts stop at the screen's
  // bottom edge (y 2.2) and sit under it, instead of rising 1.2 into its lower corners from in front
  for (const s of [-1, 1]) K.box(S, 0.4, 2.2, 0.4, 0x2a2d36, s * 4.2, 1.1, -0.28);
  K.box(S, 9.6, 5.8, 0.55, 0x1e212a, 0, 5.1, -0.28);
  K.box(S, 10, 0.32, 0.8, 0x2f333e, 0, 8.05, -0.28);
  // the screen's face: what the interface's plate is laid over (stepScreen maps it onto these corners)
  lab.face = new T.Mesh(new T.PlaneGeometry(8.9, 5.1), glow(0x10162a, 1)); lab.face.position.set(0, 5.1, 0.02); S.add(lab.face);
  lab.glowM = new T.Mesh(new T.PlaneGeometry(9.6, 5.8), new T.MeshBasicMaterial({ color: new T.Color(0x5a8aff).multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); lab.glowM.position.set(0, 5.1, -0.02); S.add(lab.glowM);
  lab.light = new T.PointLight(0x6ab0ff, 30, 16, 1.4); lab.light.position.set(0, 5, 3); S.add(lab.light);
  lab.S = S;
  // (30 Oct, Twin Automation's second Lab unit) two platforms, kept out of the bake so they can stand apart
  lab.pads = [0, 1].map(i => {
    const pad = pivot(lx - 2.6, lz + 1.5, 0, hy + 0.4); pad.userData.keep = true;
    K.mesh(pad, K.cyl(1.4, 1.5, 0.32, 24), 0x4a4e5a, 0, 0.16, 0);
    const ring = new T.Mesh(new T.TorusGeometry(1.35, 0.06, 6, 48), glow(0x6ab0ff, 1.5)); ring.rotation.x = PI / 2; ring.position.y = 0.34; pad.add(ring);
    pad.userData.ring = ring; pad.visible = i === 0;
    return pad;
  });
  lab.pad = lab.pads[0]; lab.ring = lab.pad.userData.ring; lab.home = lab.pad.position.clone();
  K.box(D, 1.8, 1.2, 1, 0x2f333e, -4.6, 0.9, -3.4); const kb = new T.Mesh(new T.BoxGeometry(1.3, 0.05, 0.55), glow(0x6ab0ff, 1.4)); kb.position.set(-4.6, 1.53, -3.4); D.add(kb);
  crates(lx + 5.5, lz + 4.5); barrels(lx - 5, lz - 5.5);
}
HUB.lab = lab;
// ---- the Merchant (30 Oct): a stall in the back corner, where relics are flipped ----
const mr = {};
{
  const [mx, mz] = at("relics"), hy = SITES.relics.h, cam = SPOTS.relics.cam;
  const St = pivot(mx, mz, Math.atan2(cam.x - mx, cam.z - mz), hy); mr.St = St;
  const B = (w, h, d, c, x, y, z, o) => K.box(St, w, h, d, c, x, y, z, o);
  B(8.4, 0.3, 6.4, 0x7a5232, 0, 0.15, 0);
  for (let i = 0; i < 9; i++) B(0.06, 0.32, 6.3, 0x5a3a22, -3.8 + i * 0.95, 0.16, 0, { ink: false });
  // the counter
  B(6, 1.1, 1.1, 0x5a3820, 0, 0.85, 1.6); B(6.3, 0.14, 1.3, 0xc89a5a, 0, 1.47, 1.6); B(6.34, 0.08, 0.06, 0xe8b54a, 0, 1.3, 2.27, { ink: false });
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) K.mesh(St, K.cyl(0.2, 0.2, 0.06, 12), 0xe8b54a, s * 2.3 + (k % 2) * 0.08, 1.58 + k * 0.065, 1.5, { ink: false });
  // the wagon wall, shelves and jars
  B(7, 3.6, 0.4, 0x6a4428, 0, 2.1, -2.2);
  for (const y of [1.9, 3.0]) B(6.4, 0.1, 0.6, 0x8a5a32, 0, y, -1.9);
  const JAR = [0x6ad8ff, 0xffb04a, 0xc87aff, 0x7dffb0, 0xff6a7a];
  for (let i = 0; i < 12; i++) { const m = new T.Mesh(new T.CylinderGeometry(0.17, 0.2, 0.42, 10), glow(JAR[i % 5], 1.3)); m.position.set(-2.8 + (i % 6) * 1.1 + (i > 5 ? 0.4 : 0), i > 5 ? 3.27 : 2.17, -1.85); St.add(m); }
  // posts, the striped awning and its scalloped edge, lanterns
  for (const [x, z, h] of [[-3.7, 2.6, 4.2], [3.7, 2.6, 4.2], [-3.7, -2.2, 4.9], [3.7, -2.2, 4.9]]) B(0.22, h, 0.22, 0x5a3a22, x, h / 2, z);
  for (let i = 0; i < 8; i++) B(0.96, 0.08, 5.4, i % 2 ? 0xf4e8d0 : 0xc8341a, -3.36 + i * 0.96, 4.55, 0.2, { rx: 0.13, ink: 0.015 });
  // (31 Oct, "make the merchant shop drapes look like the one on the ui"): a band and one round lobe per stripe
  const lobe = new T.CircleGeometry(0.36, 20, PI, PI);
  for (let i = 0; i < 8; i++) {
    const col = i % 2 ? 0xf4e8d0 : 0xc8341a, x = -3.36 + i * 0.96;
    B(0.96, 0.26, 0.05, col, x, 4.07, 2.92, { ink: false });
    const m = new T.Mesh(lobe, K.mat(col)); m.position.set(x, 3.95, 2.95); St.add(m);
  }
  B(7.7, 0.04, 0.07, 0x5a2a14, 0, 4.2, 2.93, { ink: false });
  mr.lamps = [];
  for (const s of [-1, 1]) { const l = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), glow(0xffcf6a, 1.15)); l.position.set(s * 3.4, 3.3, 2.75); St.add(l); mr.lamps.push(l); }
  // the sign, with the Merchant's coin on it
  B(2.6, 0.9, 0.12, 0x3a2414, 0, 5.2, 2.75); B(0.06, 0.7, 0.06, 0x3a3a40, -0.9, 4.6, 2.75, { ink: false }); B(0.06, 0.7, 0.06, 0x3a3a40, 0.9, 4.6, 2.75, { ink: false });
  const sc = new T.Mesh(new T.CircleGeometry(0.36, 32), new T.MeshBasicMaterial({ map: AF.coin.texture("back", -1), transparent: true })); sc.position.set(0, 5.2, 2.82); St.add(sc);
  // crates and barrels round it
  crates(mx - 2.5, mz - 6); barrels(mx - 6.5, mz + 1);
  B(2.2, 0.5, 1.2, 0x5a3a22, 0, 0.55, 0.2); // the step he stands on
  mr.light = new T.PointLight(0xffc66a, 6, 12, 1.6); mr.light.position.set(0, 3.2, 2.5); St.add(mr.light);
  mr.coins = [];
}
HUB.mr = mr;
// (30 Oct) before the first Rebirth the stall is shut: a CLOSED board on the counter and nobody behind it
{
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 160;
  const x = cv.getContext("2d"); x.fillStyle = "#3a2414"; x.fillRect(0, 0, 512, 160); x.strokeStyle = "#e8b54a"; x.lineWidth = 10; x.strokeRect(10, 10, 492, 140);
  x.fillStyle = "#f4e8d0"; x.font = "bold 96px Fredoka One, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("CLOSED", 256, 86);
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace;
  mr.closed = new T.Mesh(new T.PlaneGeometry(2.6, 0.82), new T.MeshBasicMaterial({ map: t })); mr.closed.position.set(0, 2.05, 2.24); mr.closed.rotation.x = -0.08; mr.St.add(mr.closed);
}
HUB.storeOpen = open => { if (mr.isOpen === open) return; mr.isOpen = open; mr.closed.visible = !open; if (mr.fig) mr.fig.g.visible = open; };
// the coin: a disc whose top is the relic's face and bottom the Merchant's mark
const coinGeo = new T.CylinderGeometry(0.55, 0.55, 0.1, 40), coinSide = new T.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.7, roughness: 0.35 });
function makeCoin(k, r) {
  const face = new T.MeshBasicMaterial({ map: AF.coin.texture(k, r) }), back = new T.MeshBasicMaterial({ map: AF.coin.texture("back", -1) });
  face.color.setScalar(0.95); back.color.setScalar(0.9);
  const m = new T.Mesh(coinGeo, [coinSide, face, back]); m.castShadow = true; mr.St.add(m);
  return m;
}
HUB.coinHover = -1;
mr.hits = [];
const hitGeo = new T.BoxGeometry(1.2, 1.6, 0.5);
HUB.coinClear = () => {
  for (const c of mr.coins) { mr.St.remove(c); c.material[1].dispose(); c.material[2].dispose(); }
  for (const f of mr.fx) { mr.St.remove(f); f.material.dispose(); }
  for (const b of mr.hits) mr.St.remove(b);
  mr.coins = []; mr.fx = []; mr.hits = []; camS.push = 0;
};
// (31 Oct, "every time you get a coin cooler than epic it does an animation based on how cool it is. just around the
// coin itself"): light that faces the camera round the coin: a burst, rings, sparks, and a halo (Mythic: rays) that stays
mr.fx = [];
const fxTex = (() => {
  const mk = draw => { const cv = document.createElement("canvas"); cv.width = cv.height = 128; draw(cv.getContext("2d")); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t; };
  return {
    glow: mk(x => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }),
    ring: mk(x => { const g = x.createRadialGradient(64, 64, 40, 64, 64, 62); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.7, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }),
    rays: mk(x => {
      x.translate(64, 64);
      for (let i = 0; i < 14; i++) { x.rotate(PI * 2 / 14); const g = x.createLinearGradient(0, 0, 0, -64); g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.beginPath(); x.moveTo(-3, 0); x.lineTo(0, -64); x.lineTo(3, 0); x.fill(); }
    }),
    spark: mk(x => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.8)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }),
  };
})();
function fxSprite(tex, col, at, size, op) {
  const s = new T.Sprite(new T.SpriteMaterial({ map: tex, color: col, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false }));
  s.position.copy(at); s.scale.setScalar(size); mr.St.add(s); mr.fx.push(s);
  return s;
}
const RAINBOW3 = [0xff5a6a, 0xffd23a, 0x5aff9a, 0x4ad8ff, 0xa87aff, 0xff5ad8];
HUB.coinFlair = (i, r) => {
  const c = mr.coins[i]; if (!c || r < 3) return;
  const myth = r >= 4, col = new T.Color(myth ? 0xffffff : 0xffc23a), k = myth ? 1.45 : 1;
  // just behind the coin (toward the stall), so the coin sits in front of its light
  const at = c.position.clone(); at.z -= 0.12;
  // the coin punches up and settles
  c.userData.punch = true;
  HUB.tw(0, 0.5, e => c.scale.setScalar(1 + Math.sin(PI * e) * (myth ? 0.32 : 0.2))).then(() => { c.userData.punch = false; });
  // a burst of light that settles into the halo that stays
  const halo = fxSprite(fxTex.glow, col, at, 0.5, 0.6); halo.userData.c = c;
  halo.userData = { halo: true, c, base: myth ? 2.2 : 1.8, op: myth ? 0.18 : 0.14 };
  HUB.tw(0, 0.7, e => { const p = Math.sin(PI * Math.min(1, e * 1.4)); halo.scale.setScalar(lerp(0.5, halo.userData.base, easeOut(e)) + p * 0.8 * k); halo.material.opacity = lerp(0.6, halo.userData.op, e); })
    .then(() => { halo.userData.live = true; });
  // rays behind it (Mythic, and they stay; Legendary gets a short flash of them)
  const rays = fxSprite(fxTex.rays, col, at, 0.2, 0);
  rays.userData = { rays: true, c, keep: myth };
  HUB.tw(0, myth ? 0.8 : 0.9, e => { rays.scale.setScalar(lerp(0.4, 2.2 * k, easeOut(e))); rays.material.opacity = myth ? Math.min(1, e * 3) * 0.35 : Math.sin(PI * e) * 0.3; rays.material.rotation = e * 0.8; })
    .then(() => { if (myth) rays.userData.live = true; else rays.visible = false; });
  // rings going out
  for (let n = 0; n < (myth ? 2 : 1); n++) {
    const ring = fxSprite(fxTex.ring, myth ? new T.Color(RAINBOW3[(n * 3 + i) % 6]) : col, at, 0.6, 0);
    HUB.tw(n * 0.18, 0.65, e => { ring.scale.setScalar(lerp(0.8, 3.2 * k, easeOut(e))); ring.material.opacity = (1 - e) * 0.55; }).then(() => { ring.visible = false; });
  }
  // sparks flying out and falling
  const N = myth ? 26 : 14;
  for (let n = 0; n < N; n++) {
    const sp = fxSprite(fxTex.spark, new T.Color(myth ? RAINBOW3[n % 6] : n % 3 ? 0xffd76a : 0xffffff), at, 0.14, 1);
    const a = (n / N) * PI * 2 + Math.random() * 0.4, v = (1.6 + Math.random() * 1.6) * k, vy = Math.random() * 1.2;
    sp.position.z += 0.2;
    HUB.tw(Math.random() * 0.08, 0.9 + Math.random() * 0.4, e => {
      sp.position.set(at.x + Math.cos(a) * v * e, at.y + Math.sin(a) * v * e + vy * e - 2.2 * e * e, at.z + 0.2);
      sp.material.opacity = (1 - e) * 0.85; sp.scale.setScalar(0.11 * (1 - e * 0.6));
    }).then(() => { sp.visible = false; });
  }
};
// flips list ([{k, r}]) off the counter; onLand(i) as each one lands; resolves once they all stand facing you
HUB.coinToss = async (list, onLand) => {
  HUB.coinClear();
  // (31 Oct) Mythic coins' rims turn while coins are out
  AF.coin.texLive = () => mr.coins.length > 0; AF.coin.wake();
  const one = list.length === 1, coins = list.map(x => makeCoin(x.k, x.r)), wp = new T.Vector3();
  mr.coins = coins;
  // the camera leans in on the counter (one coin) or the stall's front (ten)
  mr.St.localToWorld(wp.set(0, one ? 2.4 : 1.6, one ? 1.8 : 3.4));
  camS.pushTo.copy(wp).lerp(SPOTS.relics.cam, one ? 0.42 : 0.62);
  HUB.tw(0, 0.6, k => { camS.push = easeOut(k) * 0.75; });
  // (30 Oct, "the merchant should flip the coin onto the table") he takes them up and throws them
  // (31 Oct, "much smaller, and he flips em on the table"): coin-sized until they have landed on the counter
  const SM = 0.2, TOP = 1.555;
  // (31 Oct) a fanned stack in each hand (ten: odd ones in the left), each coin a step further out so none z-fight
  coins.forEach((c, i) => { const k = one ? 0 : i >> 1; c.rotation.order = "YXZ"; c.rotation.set(PI / 2 - 0.2, 0, (k - 2) * 0.18); c.scale.setScalar(SM); c.userData.off = [(k - 2) * 0.035, k * 0.012, k * 0.03]; c.userData.grow = 1; });
  mr.held = coins; mr.act = { t0: clock, kind: one ? "one" : "ten", land: 0 };
  await HUB.wait(one ? 0.6 : 0.72);
  mr.held = null;
  // where each lands on the counter: one in the middle, ten in two rows between his stacks of coins
  const spot = i => one ? [0, 1.55] : [-1.8 + (i % 5) * 0.9 + (i < 5 ? 0 : 0.3), i < 5 ? 1.3 : 1.9];
  const lands = coins.map((c, i) => {
    const sx = c.position.x, sy = c.position.y, sz = c.position.z, [tx, tz] = spot(i), turns = 4 + (i % 3);
    const delay = one ? 0 : i * 0.05, dur = one ? 1.15 : 0.85, top = one ? 1.5 : 0.9;
    return HUB.tw(delay, dur, k => {
      c.position.set(lerp(sx, tx, k), lerp(sy, TOP, k) + Math.sin(PI * k) * top, lerp(sz, tz, k));
      c.rotation.x = PI / 2 - 0.2 + k * (turns * 2 * PI - PI / 2 + 0.2);
      c.rotation.z = Math.sin(k * 9 + i) * 0.15 * (1 - k);
    }).then(() => {
      c.rotation.set(0, (i * 1.7) % (2 * PI), 0);
      // a little hop and a wobble as it settles on the wood
      return HUB.tw(0, 0.3, k => { c.position.y = TOP + Math.sin(PI * k) * 0.07 * (1 - k); c.rotation.z = Math.sin(k * 18) * 0.2 * (1 - k); });
    });
  });
  await Promise.all(lands);
  if (mr.act) mr.act.land = clock;
  await HUB.wait(one ? 0.45 : 0.5);
  // then each rises off the counter, grows to full size and swings round to stand facing you where it used to stand
  await Promise.all(coins.map((c, i) => {
    const [sx, sz] = spot(i), y0 = c.rotation.y;
    const fx = one ? 0 : -3.6 + (i % 5) * 1.8, fz = one ? 1.6 : (i < 5 ? 3.7 : 5.1), fy = one ? 2.45 : i < 5 ? 1.24 : 0.72, lift = one ? 0.5 : 0.8;
    return HUB.tw(one ? 0 : i * 0.09, one ? 0.65 : 0.55, k => {
      const e = easeOut(k), s = 1 - Math.pow(1 - k, 3);
      c.position.set(lerp(sx, fx, e), lerp(TOP, fy, e) + Math.sin(PI * k) * lift, lerp(sz, fz, e));
      c.scale.setScalar(lerp(SM, 1, s));
      c.rotation.x = e * (PI / 2 - 0.35);
      c.rotation.y = lerp(y0 - 2 * PI, 0, e);
      c.rotation.z = 0;
    }).then(() => { c.userData.grow = 0; c.userData.at = clock; c.userData.base = c.position.clone(); c.userData.hov = 0;
      // what the pointer is tested against: a box that never moves, from the coin's resting spot up past its lifted one
      const hb = new T.Mesh(hitGeo, coinSide); hb.visible = false; hb.position.copy(c.userData.base); hb.position.y += 0.175; hb.userData.ci = i;
      mr.St.add(hb); mr.hits.push(hb);
      if (onLand) onLand(i); });
  }));
};
// the Merchant's throw, blended over his idle by its weight: [time, armR x, armR z, armL x, armL z, head x, torso x]
const sm01 = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
const THROW = {
  one: [[0, 0, 0, 0, 0, 0, 0], [0.35, -1.25, 0.28, 0.1, 0, 0.28, -0.06], [0.5, -0.92, 0.3, 0.1, 0, 0.3, -0.04], [0.6, -2.35, 0.1, 0.1, 0, -0.32, 0.05],
    [1.2, -1.2, 0.2, 0.05, 0, -0.42, 0], [1.9, -0.6, 0.2, 0, 0, 0.12, 0.02]],
  ten: [[0, 0, 0, 0, 0, 0, 0], [0.4, -1.15, -0.18, -1.15, 0.18, 0.25, 0.02], [0.56, -0.62, -0.1, -0.62, 0.1, 0.12, -0.14], [0.72, -2.05, 0.15, -2.05, -0.15, -0.3, 0.22],
    [1.6, -1.1, 0.2, -1.1, -0.2, -0.1, 0.06], [2.4, -0.5, 0.2, -0.5, -0.2, 0.12, 0.02]],
  // when the coins land: both arms out over the counter, leaning in
  land: [0, -0.55, 0.75, -0.55, -0.75, 0.15, 0.24],
};
function throwPose(kind, t) {
  const K2 = THROW[kind]; let i = 0;
  while (i < K2.length - 2 && t > K2[i + 1][0]) i++;
  const A = K2[i], B = K2[i + 1], k = sm01((t - A[0]) / (B[0] - A[0]));
  return A.map((v, j) => v + (B[j] - v) * k);
}
function merchantOver() {
  const a = mr.act; if (!a) return;
  const R = mr.fig.R, t = clock - a.t0;
  let P = throwPose(a.kind, t), w = sm01(t / 0.15);
  if (a.land) {
    const lt = clock - a.land, L = THROW.land, k = sm01(lt / 0.3) * (1 - sm01((lt - 1.1) / 0.6));
    P = P.map((v, j) => (j ? v + (L[j] - v) * k : v));
    w *= 1 - sm01((lt - 1.6) / 0.6);
    if (lt > 2.3) { mr.act = null; return; }
  }
  const mix = (o, ax, v) => { o.rotation[ax] += (v - o.rotation[ax]) * w; };
  mix(R.armR, "x", P[1]); mix(R.armR, "z", P[2]); mix(R.armL, "x", P[3]); mix(R.armL, "z", P[4]);
  R.head.rotation.x += P[5] * w; R.torso.rotation.x += P[6] * w;
}
// the coins standing up glint and turn a little; held ones sit in the Merchant's hand
const handV = new T.Vector3();
function stepCoins(t) {
  // the halos and rays that stay behind Legendary and Mythic coins breathe and turn; Mythic's run through the colours
  // (31 Oct, "hover over the coins in 3d space"): the coin under the pointer lifts; HUB.onCoin hears which
  let hi = -1;
  if (ptrIn && camS.k >= 1 && !mr.held && mr.coins.length && mr.coins.every(c => !c.userData.grow)) {
    ray.setFromCamera(ptr, cam);
    const h = ray.intersectObjects(mr.hits, false)[0];
    if (h) hi = h.object.userData.ci;
  }
  if (hi !== HUB.coinHover) { HUB.coinHover = hi; if (HUB.onCoin) HUB.onCoin(hi, px, py); }
  else if (hi >= 0 && HUB.onCoin) HUB.onCoin(hi, px, py, true);
  mr.coins.forEach((c, i) => {
    const u = c.userData; if (!u.base) return;
    u.hov += ((i === hi ? 1 : 0) - u.hov) * 0.18;
    c.position.y = u.base.y + easeOut(u.hov) * 0.35;
    if (!u.punch) c.scale.setScalar(1 + u.hov * 0.15);
  });
  for (const f of mr.fx) {
    const u = f.userData; if (!u.live) continue;
    const hv = u.c ? u.c.userData.hov || 0 : 0;
    if (u.c) f.position.y = u.c.position.y;
    if (u.halo) { f.scale.setScalar(u.base * (1 + Math.sin(t * 2.2) * 0.06) * (1 + hv * 0.33)); f.material.opacity = u.op * (0.85 + Math.sin(t * 3.1) * 0.15) * (1 + hv * 2.5); }
    if (u.rays) { f.material.rotation += 0.004 + hv * 0.01; f.material.color.setHSL((t * 0.12) % 1, 0.8, 0.7); f.material.opacity = 0.35 * (1 + hv); }
  }
  if (mr.held) {
    const R = mr.fig.R, hands = mr.act && mr.act.kind === "ten" ? [R.handR, R.handL] : [R.handR];
    mr.held.forEach((c, i) => { hands[i % hands.length].getWorldPosition(handV); mr.St.worldToLocal(handV); c.position.set(handV.x + c.userData.off[0], handV.y + 0.12 + c.userData.off[1], handV.z + 0.12 + c.userData.off[2]); });
    return;
  }
  // (31 Oct) not while one grows; its idle turn eases in after
  mr.coins.forEach((c, i) => { if (!c.userData.grow && c.rotation.x > 0.5 && c.rotation.x < 2) c.rotation.y = Math.sin(t * 1.4 + i) * 0.18 * Math.min(1, (clock - (c.userData.at || 0)) / 0.8); });
}
// ---- Ascend: a crystal spire on a rocky crag ----
const asc = {};
{
  const [sx, sz] = at("ascend"), hy = SITES.ascend.h;
  const A = pivot(sx, sz, 0, hy);
  K.mesh(A, K.cyl(3.6, 4.2, 0.7, 8), 0x6a6e7c, 0, 0.35, 0);
  asc.core = new T.Mesh(new T.OctahedronGeometry(1.5, 0), glow(0xb08aff, 1.15)); asc.core.scale.set(1, 3.6, 1); asc.core.position.y = 7; A.add(asc.core);
  const ci = new T.Mesh(asc.core.geometry, INK); ci.scale.setScalar(1.07); asc.core.add(ci);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, h = 1.8 + rand() * 2.8; const m = K.mesh(A, new T.OctahedronGeometry(0.6, 0), [0x8a6bff, 0x4fe6ff, 0xc47bff][i % 3], cos(a) * 2.6, h / 2 + 0.4, sin(a) * 2.6, { rz: (rand() - 0.5) * 0.6 }); m.scale.set(1, h, 1); }
  const beam = new T.Mesh(new T.CylinderGeometry(0.6, 1.3, 300, 24, 1, true), new T.MeshBasicMaterial({ color: new T.Color(0xb08aff).multiplyScalar(1.4), transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
  beam.position.y = 149.7; A.add(beam); // (30 Oct) its bottom 0.3 under the ground, so no rim shows
  // and it fades in over its bottom 6 units, so it never shows an edge where it meets the stone (v runs 0 at its foot)
  { const c = document.createElement("canvas"); c.width = 4; c.height = 1024; const x = c.getContext("2d"), g = x.createLinearGradient(0, 1024, 0, 0);
    const f = 6.3 / 300; g.addColorStop(0, "#000"); g.addColorStop(f * 0.15, "#000"); g.addColorStop(f, "#fff"); g.addColorStop(1, "#fff");
    x.fillStyle = g; x.fillRect(0, 0, 4, 1024);
    beam.material.alphaMap = new T.CanvasTexture(c); beam.material.needsUpdate = true; }
  asc.A = A; asc.beam = beam; asc.coreC = asc.core.material.color.clone(); asc.beamO = beam.material.opacity;
  asc.o = { charge: 0, burst: 0 }; asc.spin = 0;
  // (30 Oct) the Ascend show's pieces, hidden until then: motes and shards (one set of points), and a shockwave
  { const N = 260, sc = document.createElement("canvas"); sc.width = sc.height = 64;
    const sx = sc.getContext("2d"), sg = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0, "rgba(255,255,255,1)"); sg.addColorStop(0.35, "rgba(255,255,255,.5)"); sg.addColorStop(1, "rgba(255,255,255,0)");
    sx.fillStyle = sg; sx.fillRect(0, 0, 64, 64);
    const st = new T.CanvasTexture(sc); st.colorSpace = T.SRGBColorSpace;
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(new Float32Array(N * 3), 3)); geo.setAttribute("color", new T.BufferAttribute(new Float32Array(N * 3), 3));
    asc.pts = new T.Points(geo, new T.PointsMaterial({ size: 0.55, map: st, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    asc.pts.frustumCulled = false; asc.pts.visible = false; A.add(asc.pts);
    asc.P = Array.from({ length: N }, () => ({ on: 0 }));
    asc.wave = new T.Mesh(new T.RingGeometry(0.86, 1, 96), new T.MeshBasicMaterial({ color: 0xc9a8ff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
    asc.wave.rotation.x = -PI / 2; asc.wave.position.y = 0.9; asc.wave.visible = false; A.add(asc.wave);
  }
  asc.rings = [0, 1, 2].map(i => { const r = new T.Mesh(new T.TorusGeometry(2.5 + i * 0.8, 0.05, 6, 64), glow(0xb08aff, 1.5)); r.position.y = 4.5 + i * 2.4; A.add(r); return r; });
  for (let i = 0; i < 9; i++) { const a = rand() * TAU, r = 5 + rand() * 4; rock(sx + cos(a) * r, sz + sin(a) * r, 0.8 + rand() * 1.6); }
}
// ---- Journal: a little library and a notice board ----
{
  const [jx, jz] = at("journal"), hy = SITES.journal.h;
  floor(jx, jz, 7.5, 0xd8c6a2, hy);
  cottage(jx + 5.5, jz + 4, -2.3, { w: 5.4, d: 4, roof: 0x5a7a3a, h: 3 });
  const J = pivot(jx - 1, jz - 1.5, -0.75);
  for (const s of [-1, 1]) K.box(J, 0.3, 3.6, 0.3, 0x5a3e2a, s * 2.6, 1.8, 0);
  K.box(J, 5.8, 3.2, 0.25, 0x8a6442, 0, 2.7, 0); K.mesh(J, prism(6.6, 0.8, 1.1), 0x7a4a2e, 0, 4.3, 0, { inkScale: 1.05 });
  [[0xfff6e0, -1.7, 3.3], [0xffe7a8, -0.4, 3.5], [0xe8f0ff, 1.2, 3.2], [0xfff6e0, -1.1, 2.0], [0xffd2c8, 0.5, 2.1], [0xfff6e0, 1.9, 1.9]].forEach(([c, x, y]) => {
    K.box(J, 1.05, 0.95, 0.04, c, x, y, 0.16, { ink: 0.02, rz: (rand() - 0.5) * 0.2 });
    const pin = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), glow(0xf43120, 1.1)); pin.position.set(x, y + 0.38, 0.22); J.add(pin);
  });
  lamp(jx - 4.5, jz + 2.5, 0xffd27a); barrels(jx + 1, jz + 5.8);
}
// ---- Defense: the team's camp. Six platforms like the Area's (29 Oct, Chris: "like the home area, but with 6 units,
// and it shows a + or something above the platform"), a dock off the edge behind them, the worlds hanging past it ----
const worlds = [], team = { slots: [] };
{
  const [cx, cz] = at("defense"), hy = SITES.defense.h, L = Math.hypot(cx, cz), ux = cx / L, uz = cz / L, vx = -uz, vz = ux;
  const face = Math.atan2(-ux, -uz); // toward the island's middle, where the camera stands
  floor(cx, cz, 11.5, 0xc8bca6, hy, 0.7).rotation.z = Math.atan2(uz, ux);
  const D = pivot(cx + ux * 8, cz + uz * 8, PI / 2 - Math.atan2(cz, cx), hy);
  for (const s of [-1, 1]) K.box(D, 1.1, 6.6, 1.1, 0x6e7280, s * 3, 3.3, 0);
  K.box(D, 8, 1.1, 1.4, 0x5d616e, 0, 7, 0);
  for (let i = 0; i < 30; i++) K.box(D, 3.4, 0.2, 0.75, i % 2 ? 0x8a6442 : 0x7a5638, 0, 0.12, 1.4 + i * 0.86, { ry: (rand() - 0.5) * 0.05, ink: 0.03 });
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) K.box(D, 0.15, 1.2, 0.15, 0x5a3e2a, s * 1.85, 0.6, 2 + i * 3.1);
  for (const s of [-1, 1]) { const b = K.box(D, 1.2, 2.8, 0.06, 0x3d6aa8, s * 3, 4.6, 0.6, { ink: 0.02 }); }
  // the six platforms, in a shallow arc that opens toward the camera
  // three across, two deep, like the team grid on screen: slots 1-3 the back row, 4-6 the front, left to right as seen
  for (let i = 0; i < 6; i++) {
    const k = (i % 3) - 1, back = i < 3, x = cx + ux * (back ? 1.4 : -2.6) + vx * k * 3.9, z = cz + uz * (back ? 1.4 : -2.6) + vz * k * 3.9;
    const p = pivot(x, z, face, hy);
    K.mesh(p, K.cyl(1.05, 1.25, 0.4, 18), 0x6e7280, 0, 0.2, 0);
    K.mesh(p, K.cyl(0.95, 1.0, 0.12, 18), 0x9aa0b4, 0, 0.46, 0, { ink: false });
    const ring = new T.Mesh(new T.TorusGeometry(1.02, 0.05, 6, 48), glow(0x8a9cff, 1)); ring.rotation.x = PI / 2; ring.position.y = 0.52; ring.userData.keep = true; p.add(ring);
    const plus = padExtras(p, "defense", i);
    team.slots.push({ p, ring, plus, x, z, y: hy + 0.52, face, f: null });
  }
  // (30 Oct, "the floating world images near the defense dock should be removed u cant even see em"): no pictures past
  // the end of the dock any more (worlds stays empty); worlds are picked from the panel
  [[cx - ux * 3 + vx * 11, cz - uz * 3 + vz * 11], [cx - ux * 3 - vx * 11, cz - uz * 3 - vz * 11]].forEach(([x, z]) => lamp(x, z, 0xffd27a));
  crates(cx + vx * 9 + ux * 4, cz + vz * 9 + uz * 4); barrels(cx - vx * 9 + ux * 4, cz - vz * 9 + uz * 4);
}
HUB.team = team;
HUB.worlds = worlds;

// ---- forest, flowers, grass, rocks: everywhere the sites and paths aren't ----
{
  // (30 Oct) the Area and Defense cameras' usual spots too (on a wide window they stand closer, wideSpots)
  const views = Object.values(SPOTS).concat(Object.keys(SPOT_BASE).map(t => ({ cam: SPOT_BASE[t], look: SPOTS[t].look })))
    .map(s => [s.cam.x, s.cam.z, lerp(s.cam.x, s.look.x, 0.75), lerp(s.cam.z, s.look.z, 0.75)]);
  const round = [], pines = [], trunks = [];
  const cols = [0x4f9a3c, 0x5aa845, 0x447f35, 0x63ad4a, 0x3f8a3a], pcols = [0x2f6b3a, 0x3a7a42, 0x285e33, 0x34703c];
  for (let i = 0; i < 9000 && round.length + pines.length < 1400; i++) {
    const a = rand() * TAU, r = Math.sqrt(rand()) * 62, x = cos(a) * r, z = sin(a) * r, R = EDGE(a);
    if (r > R - 1.2) continue;
    const pd = pathDist(x, z), sd = siteDist(x, z);
    if (pd < 3 || sd < 3.5) continue;
    const clump = smooth(-0.25, 0.25, fbm(x * 0.06 + 11, z * 0.06 - 4)), rim = smooth(R - 26, R - 5, r);
    if (rand() > 0.12 + clump * 0.75 + rim * 0.35) continue;
    // nothing between a camera and what it looks at, and no tree right beside a camera filling a corner
    if (views.some(([cx, cz, lx, lz]) => segDist(x, z, cx, cz, lx, lz) < 6.5 || Math.hypot(x - cx, z - cz) < 13)) continue;
    const y = H(x, z, pd, sd), s = 0.85 + rand() * 0.6, pine = rand() < 0.35 + rim * 0.2;
    trunks.push([x, y + 0.7 * s, z, s * (pine ? 0.8 : 1)]);
    if (pine) pines.push([x, y + 1.1 * s, z, s, pcols[(rand() * 4) | 0]]);
    else round.push([x, y + 2.25 * s, z, s * (1 + rand() * 0.25), cols[(rand() * 5) | 0]]);
  }
  const inst = (geo, list, colFn, ink, flat) => {
    const mat = flat ? new T.MeshToonMaterial({ gradientMap: RAMP, flatShading: true }) : K.mat(0xffffff, 0, true);
    const m = new T.InstancedMesh(geo, mat, list.length), ik = new T.InstancedMesh(geo, INK, list.length), o = new T.Object3D(), c = new T.Color();
    list.forEach((it, i) => {
      o.position.set(it[0], it[1], it[2]); o.scale.setScalar(it[3]); o.rotation.set(0, i * 2.4, 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
      o.scale.setScalar(it[3] * ink); o.updateMatrix(); ik.setMatrixAt(i, o.matrix); m.setColorAt(i, c.set(colFn(it)));
    });
    m.castShadow = true; m.receiveShadow = true; island.add(m, ik);
  };
  inst(new T.CylinderGeometry(0.14, 0.22, 1.4, 6), trunks, () => 0x5a3d28, 1.12);
  inst(new T.IcosahedronGeometry(1.2, 0), round, it => it[4], 1.07, true);
  const pg = new T.ConeGeometry(1.0, 2.6, 7); pg.translate(0, 0.4, 0);
  const pg2 = new T.ConeGeometry(0.75, 2.0, 7); pg2.translate(0, 1.7, 0);
  inst(pg, pines, it => it[4], 1.07, true); inst(pg2, pines, it => it[4], 1.08, true);
  const tufts = [], flowers = [], o = new T.Object3D(), c = new T.Color();
  for (let i = 0; i < 9000; i++) {
    const a = rand() * TAU, r = Math.sqrt(rand()) * 60, x = cos(a) * r, z = sin(a) * r;
    if (r > EDGE(a) - 1 || pathDist(x, z) < 1.6 || siteDist(x, z) < 0.5) continue;
    (rand() < 0.16 ? flowers : tufts).push([x, H(x, z), z]);
  }
  const tm = new T.InstancedMesh(new T.ConeGeometry(0.07, 0.36, 3), K.mat(0xffffff, 0, true), tufts.length);
  tufts.forEach((p, i) => { o.position.set(p[0], p[1] + 0.15, p[2]); o.rotation.set(0, rand() * 3, (rand() - 0.5) * 0.3); o.scale.setScalar(0.8 + rand() * 0.8); o.updateMatrix(); tm.setMatrixAt(i, o.matrix); tm.setColorAt(i, c.set(rand() < 0.5 ? 0x6fb84a : 0x4f9a3c)); });
  const FC = [0xffffff, 0xffd23a, 0xff6a8a, 0xb88aff, 0xff9a3a];
  const fm = new T.InstancedMesh(new T.BoxGeometry(0.16, 0.16, 0.16), K.mat(0xffffff, 0, true), flowers.length);
  flowers.forEach((p, i) => { o.position.set(p[0], p[1] + 0.12, p[2]); o.rotation.set(0, rand() * 3, 0); o.scale.setScalar(1); o.updateMatrix(); fm.setMatrixAt(i, o.matrix); fm.setColorAt(i, c.set(FC[(rand() * FC.length) | 0])); });
  island.add(tm, fm);
  for (let i = 0; i < 40; i++) { const a = rand() * TAU, r = 18 + rand() * 40, x = cos(a) * r, z = sin(a) * r; if (r < EDGE(a) - 2 && pathDist(x, z) > 2.5 && siteDist(x, z) > 2) rock(x, z, 0.4 + rand() * 0.9); }
}
// little islets floating around
const islets = [];
for (let i = 0; i < 12; i++) {
  const a = rand() * TAU, r = 80 + rand() * 70, g = new T.Group(); g.position.set(cos(a) * r, -8 + rand() * 22, sin(a) * r); scene.add(g);
  const s = 2 + rand() * 3.5;
  K.mesh(g, new T.ConeGeometry(s, s * 2.6, 7), 0x6a5568, 0, -s * 1.3, 0, { rx: PI, inkScale: 1.04 }).material = toonFlat(0x6a5568);
  K.mesh(g, K.cyl(s * 1.03, s * 1.03, 0.4, 7), 0x5aa63e, 0, 0.05, 0);
  if (rand() < 0.7) { const t = new T.Mesh(new T.IcosahedronGeometry(1.2, 0), toonFlat(0x4f9a3c)); t.position.y = 1.8; t.scale.setScalar(s * 0.35); g.add(t); }
  islets.push({ g, y: g.position.y, ph: rand() * 6 });
}

// ---------------- merging: fewer draw calls, the same picture ----------------
// (29 Oct, perf pass: about 4,400 draw calls a frame on the Area, 130 to 267 meshes per unit and about 1,000 still
// props). Solid materials become one shared material each, with each part's colour baked into its vertices, so a whole
// group of parts can be drawn at once; anything see-through, textured or animated keeps its own material.
const VC = {};
function matClass(m, live) {
  // the game's see-through light (K.mat glow 2: half opacity, no depth writes), one shared material per opacity
  if (!Array.isArray(m) && m.isMeshBasicMaterial && m.transparent && !m.map && !m.alphaMap && m.blending === T.NormalBlending && m.visible && !m.polygonOffset && !live.has(m)) {
    const k = `glass|${m.side}|${m.opacity}|${m.depthWrite}|${m.depthTest}|${m.fog}`;
    return { key: k, vc: true, mat: VC[k] || (VC[k] = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: m.opacity, depthWrite: m.depthWrite, depthTest: m.depthTest, side: m.side, fog: m.fog })) };
  }
  if (Array.isArray(m) || m.map || m.alphaMap || m.transparent || m.opacity < 1 || m.blending !== T.NormalBlending || !m.depthWrite || !m.depthTest || m.polygonOffset || m.wireframe || !m.visible || live.has(m))
    return { key: "own:" + m.uuid, mat: m, vc: false };
  if (m.isMeshToonMaterial) {
    const k = `toon|${m.side}|${m.flatShading}|${m.emissive.getHex()}|${m.emissiveIntensity}|${m.gradientMap ? m.gradientMap.uuid : ""}`;
    return { key: k, vc: true, mat: VC[k] || (VC[k] = new T.MeshToonMaterial({ vertexColors: true, gradientMap: m.gradientMap, side: m.side, flatShading: m.flatShading, emissive: m.emissive.clone(), emissiveIntensity: m.emissiveIntensity })) };
  }
  if (m.isMeshBasicMaterial) {
    const k = `basic|${m.side}|${m.fog}`;
    return { key: k, vc: true, mat: VC[k] || (VC[k] = new T.MeshBasicMaterial({ vertexColors: true, side: m.side, fog: m.fog })) };
  }
  return { key: "own:" + m.uuid, mat: m, vc: false };
}
// one mesh's triangles, non-indexed, with its colour baked in when its material is shared
function partGeo(o, mtx, vc) {
  const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
  if (mtx) g.applyMatrix4(mtx);
  const n = g.attributes.position.count, out = { pos: g.attributes.position.array, nor: g.attributes.normal ? g.attributes.normal.array : new Float32Array(n * 3), n, col: null };
  // the material's colour, times the vertex colours the part already had (the ground, paths)
  if (vc) { const c = o.material.color, vcol = o.material.vertexColors && g.attributes.color ? g.attributes.color.array : null, col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { col[i * 3] = c.r * (vcol ? vcol[i * 3] : 1); col[i * 3 + 1] = c.g * (vcol ? vcol[i * 3 + 1] : 1); col[i * 3 + 2] = c.b * (vcol ? vcol[i * 3 + 2] : 1); } out.col = col; }
  g.dispose();
  return out;
}
function joinGeo(parts, vc, skin) {
  let n = 0; parts.forEach(p => { n += p.n; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = vc ? new Float32Array(n * 3) : null;
  const si = skin ? new Uint16Array(n * 4) : null, sw = skin ? new Float32Array(n * 4) : null;
  let o = 0;
  for (const p of parts) {
    pos.set(p.pos, o * 3); nor.set(p.nor, o * 3); if (col) col.set(p.col, o * 3);
    if (skin) for (let i = 0; i < p.n; i++) { si[(o + i) * 4] = p.bone; sw[(o + i) * 4] = 1; }
    o += p.n;
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("normal", new T.BufferAttribute(nor, 3));
  if (col) geo.setAttribute("color", new T.BufferAttribute(col, 3));
  if (skin) { geo.setAttribute("skinIndex", new T.BufferAttribute(si, 4)); geo.setAttribute("skinWeight", new T.BufferAttribute(sw, 4)); }
  geo.computeBoundingSphere();
  return geo;
}
// a unit: every part keeps moving exactly as it did (the parts stay in the scene as bones, hidden), but it's drawn as a
// few skinned meshes, one per kind of material. Parts that blink in and out, and materials the idle animation changes,
// are left as they are. Picking still hits the hidden parts, which have the exact shapes.
const HIDE = 31, UNIT_SHADOW = 1;
function bakeFigure(f) {
  const R = f.R, meshes = [];
  f.holder.traverse(o => { if (o.isMesh && !o.isSkinnedMesh) meshes.push(o); });
  // what the idle animation changes: run it at a spread of times and compare
  const mats = new Set(meshes.map(m => m.material).filter(m => !Array.isArray(m)));
  const sig = m => [m.color && m.color.getHex(), m.emissive && m.emissive.getHex(), m.opacity, m.visible, m.emissiveIntensity].join();
  const before = new Map([...mats].map(m => [m, sig(m)])), vis = new Map(meshes.map(m => [m, m.visible])), live = new Set(), blink = new Set();
  for (let i = 0; i < 24; i++) {
    K.animate(R, i * 2.71 + 0.13, R.P);
    for (const m of mats) if (sig(m) !== before.get(m)) live.add(m);
    for (const m of meshes) if (m.visible !== vis.get(m)) blink.add(m);
  }
  K.animate(R, 0, R.P);
  const shown = m => { for (let q = m; q && q !== f.holder; q = q.parent) if (!q.visible || blink.has(q)) return false; return true; };
  const groups = new Map(), bones = [];
  for (const m of meshes) {
    if (!shown(m)) continue;
    const c = matClass(m.material, live);
    if (Array.isArray(m.material) || m.material.map) continue;
    const key = c.key + "|" + (m.castShadow ? 1 : 0);
    if (!groups.has(key)) groups.set(key, { c, cast: m.castShadow, parts: [] });
    const p = partGeo(m, null, c.vc); p.bone = bones.length; bones.push(m);
    groups.get(key).parts.push(p);
    m.layers.set(HIDE);
  }
  if (!bones.length) return;
  const skel = new T.Skeleton(bones, bones.map(() => new T.Matrix4())); f.skel = skel;
  f.baked = [];
  for (const { c, cast, parts } of groups.values()) {
    const sk = new T.SkinnedMesh(joinGeo(parts, c.vc, true), c.mat);
    sk.bind(skel, new T.Matrix4());
    sk.frustumCulled = false; sk.castShadow = cast; sk.raycast = () => {};
    f.holder.add(sk); f.baked.push(sk);
  }
  // the unit's own shadow pass draws whatever of it casts
  f.casters = f.baked.filter(m => m.castShadow);
  // (a hidden part is off layer 0; comparing masks with 1 << 31 fails, three.js keeps the mask unsigned)
  f.holder.traverse(o => { if (o.isMesh && !o.isSkinnedMesh && o.castShadow && o.layers.isEnabled(0)) f.casters.push(o); });
}
// the island's still props: one mesh per kind of material, in world space; anything that moves, glows on and off,
// changes colour, is clicked or hovered stays as it is
function bakeScenery(keep) {
  island.updateMatrixWorld(true);
  const groups = new Map(), drop = [], none = new Set();
  island.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh) return;
    for (let q = o; q && q !== island; q = q.parent) if (keep.has(q) || q.userData.keep || q.userData.fig || q.userData.world !== undefined) return;
    const m = o.material;
    if (Array.isArray(m) || m.map || !m.visible || !o.visible || !o.geometry.attributes.normal) return;
    const c = matClass(m, none), key = `${c.key}|${o.castShadow ? 1 : 0}|${o.receiveShadow ? 1 : 0}|${o.renderOrder}`;
    if (!groups.has(key)) groups.set(key, { c, cast: o.castShadow, recv: o.receiveShadow, order: o.renderOrder, parts: [] });
    groups.get(key).parts.push(partGeo(o, o.matrixWorld, c.vc));
    drop.push(o);
  });
  for (const o of drop) {
    let kept = false; o.traverse(q => { if (q !== o && drop.indexOf(q) < 0) kept = true; });
    if (kept) o.layers.set(HIDE); else if (o.parent) o.parent.remove(o);
  }
  for (const { c, cast, recv, order, parts } of groups.values()) {
    const m = new T.Mesh(joinGeo(parts, c.vc, false), c.mat);
    m.castShadow = cast; m.receiveShadow = recv; m.renderOrder = order;
    scene.add(m);
  }
  return { meshes: drop.length, merged: groups.size };
}

// a group that moves as one piece (a cloud, a floating islet): its meshes merged in its own space, one per material
function bakeGroup(g) {
  g.updateMatrixWorld(true);
  const inv = new T.Matrix4().copy(g.matrixWorld).invert(), groups = new Map(), drop = [], none = new Set();
  g.traverse(o => {
    if (!o.isMesh || o === g) return;
    const m = o.material; if (Array.isArray(m) || m.map || !o.geometry.attributes.normal) return;
    const c = matClass(m, none), key = `${c.key}|${o.castShadow ? 1 : 0}|${o.receiveShadow ? 1 : 0}`;
    if (!groups.has(key)) groups.set(key, { c, cast: o.castShadow, recv: o.receiveShadow, parts: [] });
    groups.get(key).parts.push(partGeo(o, new T.Matrix4().multiplyMatrices(inv, o.matrixWorld), c.vc));
    drop.push(o);
  });
  drop.forEach(o => { if (o.parent) o.parent.remove(o); });
  for (const { c, cast, recv, parts } of groups.values()) { const m = new T.Mesh(joinGeo(parts, c.vc, false), c.mat); m.castShadow = cast; m.receiveShadow = recv; g.add(m); }
}

// ---------------- figures (the game's own rigs) ----------------
const figs = [];
HUB.figs = figs;
function figure(parent, u, x, y, z, ry = 0, s = 0.55) {
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const holder = new T.Group(); holder.scale.setScalar(s); g.add(holder);
  const R = AF.R3.makeRig(holder, AF.formKey(u) || u.k, u.sh, u.tr === "golden");
  R.root.traverse(o => { if (o.isMesh && o.material.side !== T.BackSide) o.castShadow = true; });
  const f = { g, holder, R, u, ph: rand() * 20, s };
  g.userData.fig = f; figs.push(f);
  if (HUB.merge !== false) bakeFigure(f);
  return f;
}
function dropFig(f) { if (!f) return; const i = figs.indexOf(f); if (i >= 0) figs.splice(i, 1); if (f.g.parent) f.g.parent.remove(f.g); }
HUB.figure = figure; HUB.dropFig = dropFig;
HUB.showcase = u => {
  dropFig(hall.show); hall.show = null;
  if (!u) return;
  const [ux, uz, hy] = hall.at;
  hall.show = figure(island, u, ux + 1, hy + 0.75, uz, PI / 2 - 0.35, 0.78);
  const s = TD.statsOf(u), r = s.rng ? s.rng * 1.25 : 0;
  hall.ring.visible = hall.fill.visible = r > 0;
  hall.ringK = 0; hall.ringR = r;
  const col = AF.RAR[AF.UNIT[u.k].rarity].color;
  hall.ring.material.color.set(col).multiplyScalar(1.2); hall.fill.material.color.set(col);
};
// (29 Oct, "do that same + mechanic for the area"): the Area's plots and the Defense team's platforms work the same way
const PADS = { area: plots, defense: team.slots };
// locks[i], for a plot that isn't open: "next" (the next one to buy), "ready" (that, and affordable), "asc" (opens with
// ascensions) or "locked". A figure is rebuilt only when its unit or that unit's look (Golden, shiny) changes
const RING = { next: 0xffc93a, ready: 0xffc93a, asc: 0xa77bff, locked: 0x6b6f7a };
HUB.setPads = (kind, units, drop, locks = []) => {
  PADS[kind].forEach((sl, i) => {
    const u = units[i] || null, lk = u ? null : locks[i] || null;
    sl.lock = lk;
    sl.plus.visible = !u;
    sl.plus.material.map = lk ? LOCKS[lk === "ready" ? "next" : lk] : PLUS;
    sl.plus.scale.setScalar(lk === "locked" || lk === "asc" ? 0.85 : 1.15);
    sl.ring.material.color.set(u ? AF.RAR[AF.UNIT[u.k].rarity].color : lk ? RING[lk] : kind === "area" ? 0xffe27a : 0x8a9cff).multiplyScalar(u ? 1.4 : lk === "locked" ? 0.6 : 1);
    const sig = u ? u.uid + (u.tr === "golden" ? "g" : "") + (u.sh ? "s" : "") + (u.ev ? "e" : "") + (u.tr === "singular" || u.tr === "infinity" ? u.tr : "") : "";
    if (sl.sig === sig && !!sl.f === !!u) return;
    // (30 Oct) a unit put on a Defense platform (not the first build, not the same unit's trait changing) drops onto it
    const placed = kind === "defense" && sl.sig !== undefined && u && sl.uid !== u.uid;
    sl.sig = sig; sl.uid = u ? u.uid : null;
    dropFig(sl.f); sl.f = null;
    if (!u) return;
    sl.f = figure(island, u, sl.x, sl.y, sl.z, sl.face, 0.55); sl.f.slot = i; sl.f.pad = kind;
    // (30 Oct, "their unit place effects should be here in this defense area, the particles and crown / infinity if
    // applicable"): the match's crown, scaled from the board's figure (0.48) to this one (0.55), outside the baked holder
    if (kind === "defense" && AF.Board && AF.Board.crown) {
      const cg = new T.Group(); cg.scale.setScalar(0.55 / 0.48); sl.f.g.add(cg);
      // (30 Oct, "move the crown / infinity up, not the labels themselves"): over the label that stands over the head
      sl.f.crown = AF.Board.crown(cg, { u }, u.tr === "infinity" ? 0.4 : 0.7);
    }
    if (drop === i || placed) {
      let landed = false;
      const f = sl.f;
      HUB.tw(0, 0.55, k => {
        const b = k < 0.7 ? 1 - Math.pow(k / 0.7, 2) : Math.sin((k - 0.7) / 0.3 * PI) * 0.12; f.g.position.y = sl.y + b * 5;
        if (kind === "defense" && k >= 0.7 && !landed) { landed = true; placePop(sl.x, sl.y, sl.z, AF.UNIT[u.k].rim || AF.R3.RIM[AF.UNIT[u.k].rarity]); }
      });
    }
  });
};
// a placement's landing (as on the board): sparks in the unit's colours flung out and falling, a ring spreading
const pops = [], popGeo = new T.OctahedronGeometry(0.09, 0), popRing = new T.RingGeometry(0.85, 1, 48);
function placePop(x, y, z, rim) {
  const cols = [rim[0], rim[1], 0xffffff];
  for (let i = 0; i < 18; i++) {
    const a = rand() * TAU, sp = 2 + rand() * 3, m = new T.Mesh(popGeo, glow(cols[i % 3], 1.8, { transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    m.position.set(x + Math.cos(a) * 0.5, y + 0.25, z + Math.sin(a) * 0.5); island.add(m);
    pops.push({ m, vx: Math.cos(a) * sp, vy: 3 + rand() * 3, vz: Math.sin(a) * sp, life: 0, max: 0.5 + rand() * 0.35 });
  }
  const r = new T.Mesh(popRing, glow(rim[0], 1.6, { transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
  r.rotation.x = -PI / 2; r.position.set(x, y + 0.06, z); island.add(r);
  pops.push({ m: r, ring: 1, life: 0, max: 0.5 });
}
function stepPops(dt) {
  for (let i = pops.length - 1; i >= 0; i--) {
    const q = pops[i], m = q.m; q.life += dt;
    const k = Math.min(1, q.life / q.max);
    if (q.ring) { m.scale.setScalar(0.4 + 1.6 * (1 - Math.pow(1 - k, 3))); m.material.opacity = 1 - k; }
    else {
      q.vy -= 12 * dt; m.position.x += q.vx * dt; m.position.y += q.vy * dt; m.position.z += q.vz * dt;
      m.rotation.x += dt * 8; m.rotation.y += dt * 6; m.scale.setScalar(1 - k * 0.7); m.material.opacity = 1 - k * k;
    }
    if (k >= 1) { island.remove(m); m.material.dispose(); pops.splice(i, 1); }
  }
}
// (29 Oct, "the character should be facing the player in traits", then "it should be looking slighly to the right
// coming from the viewport of the camera"): turned toward the Trait Lab's camera, then 22 degrees toward the screen's
// right (it stood side-on, its back half to you, at a fixed angle)
lab.figs = [null, null];
HUB.setLabUnit = (u, i = 0) => {
  const pad = lab.pads[i];
  dropFig(lab.figs[i]); lab.figs[i] = null;
  if (!u) return;
  pad.updateWorldMatrix(true, false);
  const c = pad.worldToLocal(SPOTS.traits.cam.clone());
  lab.figs[i] = figure(pad, u, 0, 0.32, 0, Math.atan2(c.x, c.z) + 0.38, 0.62);
};
HUB.labTrait = (col, i = 0) => { lab.pads[i].userData.ring.material.color.set(col).multiplyScalar(1.5); if (!i) lab.light.color.set(col); lab.pulse = 1; };
// (30 Oct) two platforms: 1.9 either side of the first one's spot, across the Lab camera's view (its right is (-dz, dx)
// of the way it looks, flattened)
HUB.labDual = on => {
  if (lab.dual === on) return;
  lab.dual = on;
  const s = SPOTS.traits, dx = s.look.x - s.cam.x, dz = s.look.z - s.cam.z, l = Math.hypot(dx, dz), rx = -dz / l, rz = dx / l;
  lab.pads.forEach((p, i) => {
    const k = on ? (i ? 1.9 : -1.9) : 0;
    p.position.set(lab.home.x + rx * k, lab.home.y, lab.home.z + rz * k);
    p.visible = on || i === 0;
    p.updateWorldMatrix(true, true);
    // the unit on it turns to the camera again from its new spot
    const f = lab.figs[i]; if (f) { const c = p.worldToLocal(SPOTS.traits.cam.clone()); f.g.rotation.y = Math.atan2(c.x, c.z) + 0.38; }
  });
};

// ---------------- camera travel ----------------
const camS = { k: 1, dur: 1.4, pos: SPOTS.area.cam.clone(), look: SPOTS.area.look.clone(), shift: 0, from: null, to: null, push: 0, pushTo: new T.Vector3(), peekTo: null, peekK: 0 };
HUB.camS = camS;
HUB.tab = "area";
// (29 Oct, the wheel moves between tabs, ui.js): while you scroll toward a tab the camera leans up to a tenth of the way to
// its spot, k 0-1, and settles back if you stop short
const PEEK = 0.1;
HUB.peek = (t, k) => { camS.peekTo = t; camS.peekK = SPOTS[t] ? Math.max(0, Math.min(1, k)) : 0; };
const peekAmt = () => (camS.peekK > 0 && camS.k >= 1 && SPOTS[camS.peekTo] ? easeOut(camS.peekK) * PEEK : 0);
HUB.go = t => {
  if (t === HUB.tab && camS.k >= 1) return;
  // leaving toward the tab it was leaning to: the trip starts from the lean, so nothing jumps
  const pk = camS.peekTo === t ? peekAmt() : 0;
  if (pk) { const s = SPOTS[t]; camS.pos.lerp(s.cam, pk); camS.look.lerp(s.look, pk); camS.shift = lerp(camS.shift, s.shift, pk); }
  camS.peekK = 0;
  camS.from = { pos: camS.pos.clone(), look: camS.look.clone(), shift: camS.shift };
  camS.to = { pos: SPOTS[t].cam.clone(), look: SPOTS[t].look.clone(), shift: SPOTS[t].shift };
  camS.k = 0; camS.dur = Math.min(1.8, 0.9 + camS.from.pos.distanceTo(camS.to.pos) / 70);
  HUB.tab = t; camS.push = 0;
};
// (30 Oct) straight to a tab's spot, no flight (under the clouds, where nobody sees it move)
HUB.jump = t => {
  const s = SPOTS[t]; if (!s) return;
  camS.pos.copy(s.cam); camS.look.copy(s.look); camS.shift = s.shift; camS.k = 1; camS.from = camS.to = null;
  camS.push = 0; camS.peekK = 0; HUB.tab = t;
};
const mid = new T.Vector3(), shk = new T.Vector3(), lk = new T.Vector3();
// (30 Oct) the dive to and from the Underworld: dir "down" or "up"; swap() changes the tab under the black veil
// a CSS cubic-bezier as a function of progress (0-1)
HUB.bez = (x1, y1, x2, y2) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-6) return Y(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 30; i++) { const v = X(t); if (Math.abs(v - x) < 1e-6) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return Y(t);
  };
};
// (30 Oct, Chris's curves) the roll out, and the same curve flipped for the roll in
const ROLL_OUT = HUB.bez(0.87, 0.17, 0.93, 0.61), ROLL_IN = HUB.bez(0.04, 0.65, 0.34, 0.95);
HUB.dive = async (dir, swap, ui) => {
  const veil = document.getElementById("uwVeil") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "uwVeil" }));
  veil.style.background = dir === "down" ? "#1e0406" : "#e8a4a0";
  const sm = k => k * k * (3 - 2 * k), smr = k => k * k * k * (k * (6 * k - 15) + 10);
  const p0 = camS.pos.clone(), l0 = camS.look.clone(), d0 = l0.clone().sub(p0), fwd = d0.clone().setY(0).normalize();
  const ov = camS.ov = { pos: p0.clone(), look: l0.clone(), roll: 0 }, lv = new T.Vector3();
  const dDown = fwd.clone().multiplyScalar(10).setY(-17);
  // out: sink and start to tip, the veil coming in
  await HUB.tw(0, 1.5, k => {
    const e = sm(k);
    ov.pos.copy(p0).addScaledVector(fwd, 4 * e); ov.pos.y -= 24 * k * k;
    lv.lerpVectors(d0, dDown, e); ov.look.copy(ov.pos).add(lv);
    ov.roll = (PI / 2) * ROLL_OUT(k);
    veil.style.opacity = sm(clamp((k - 0.6) / 0.4, 0, 1)).toFixed(3);
  });
  veil.style.opacity = 1;
  if (swap) swap();
  const s = SPOTS[HUB.tab] || SPOTS.area, d1 = s.look.clone().sub(s.cam), f2 = d1.clone().setY(0).normalize();
  const from = s.cam.clone().addScaledVector(f2, 3); from.y -= 16;
  const dUp = f2.clone().multiplyScalar(10).setY(16);
  camS.pos.copy(s.cam); camS.look.copy(s.look); camS.shift = s.shift; camS.k = 1; camS.from = camS.to = null;
  // in: up through the ground, upside down, turning upright as it rises into place
  if (ui) HUB.wait(0.9).then(ui);
  await HUB.tw(0, 1.4, k => {
    const e = 1 - (1 - ROLL_IN(k)) * (1 - k);
    ov.pos.lerpVectors(from, s.cam, e);
    lv.lerpVectors(dUp, d1, e); ov.look.copy(ov.pos).add(lv);
    ov.roll = -(PI / 2) * (1 - e);
    veil.style.opacity = (1 - sm(clamp(k / 0.35, 0, 1))).toFixed(3);
  });
  veil.style.opacity = 0; camS.ov = null;
};
const rollF = new T.Vector3(), rollUp = new T.Vector3();
function stepCam(dt, t) {
  if (camS.ov) { camS.pos.copy(camS.ov.pos); camS.look.copy(camS.ov.look); }
  else if (camS.k < 1) {
    camS.k = Math.min(1, camS.k + dt / camS.dur);
    const k = ease(camS.k), A = camS.from.pos, B = camS.to.pos;
    // (29 Oct, "when you go from defense back to area it moves the camera up and down"): the path used to bow up by a
    // fifth of its length (14 units between those two, rising 5 and dropping 9). Measured under every straight path
    // between two tabs, the tallest thing is 6.5 high and the cameras fly at 9.5-13, so it only lifts a little now
    // (1.5 at most, which Trait Lab to Journal needs to clear a tree by 2.5)
    mid.copy(A).add(B).multiplyScalar(0.5); mid.y += 3;
    camS.pos.set(0, 0, 0).addScaledVector(A, (1 - k) * (1 - k)).addScaledVector(mid, 2 * k * (1 - k)).addScaledVector(B, k * k);
    camS.look.lerpVectors(camS.from.look, camS.to.look, ease(Math.min(1, camS.k * 1.1)));
    camS.shift = lerp(camS.from.shift, camS.to.shift, k);
  }
  cam.position.copy(camS.pos); lk.copy(camS.look);
  let shift = camS.shift;
  const pk = peekAmt();
  if (pk) { const s = SPOTS[camS.peekTo]; cam.position.lerp(s.cam, pk); lk.lerp(s.look, pk); shift = lerp(shift, s.shift, pk); }
  cam.position.x += sin(t * 0.21) * 0.22; cam.position.y += sin(t * 0.17 + 1) * 0.14;
  if (camS.push) cam.position.lerp(camS.pushTo, camS.push);
  // (29 Oct, "the reroll camera punch in is horrible ... it should just shake it based on how cool it is"): the game's
  // own screen shake (fx.js, sized by how good the roll, pull or collect was) shakes the camera too
  const sk = (AF.fx && AF.fx.shakeNow) || 0;
  if (sk) {
    const tt = performance.now() / 1000, j = 0.32 * sk;
    shk.set((sin(tt * 61) + sin(tt * 37)) * j, (sin(tt * 53 + 1) + sin(tt * 29)) * j, (sin(tt * 47 + 2) + sin(tt * 31)) * j);
    cam.position.add(shk); lk.addScaledVector(shk, 0.6);
  }
  // (30 Oct) the dive's roll, turned about the camera's own line of sight after it looks (steady at any angle)
  cam.lookAt(lk);
  if (camS.ov && camS.ov.roll) cam.rotateZ(camS.ov.roll);
  if (shift) cam.setViewOffset(VW, VH, -shift * VW, 0, VW, VH); else cam.clearViewOffset();
}

// ---------------- timing helpers ----------------
const tweens = [], timers = [];
let clock = 0;
HUB.tw = (delay, dur, fn) => new Promise(res => tweens.push({ t0: clock + delay, dur, fn, res }));
HUB.wait = s => new Promise(res => timers.push([clock + s, res]));

// ---------------- the summon reveal on the gate ----------------
// (30 Oct, "the 2 red flags should change color and have the portal's symbol on it when you switch"): each gate's
// symbol drawn once (its icon from icons.js) in the gate's light colour, on a soft glow
const symTex = {};
function gateSym(id) {
  if (symTex[id]) return symTex[id];
  const th = AF.portal.PTHEME[id] || AF.portal.PTHEME.ember, c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d"), d = ((AF.icon("gate:" + id) || "").match(/ d="([^"]+)"/) || [])[1];
  if (d) {
    x.translate(28, 28); x.scale(200 / 512, 200 / 512);
    x.shadowColor = "rgba(0,0,0,.6)"; x.shadowBlur = 16; x.shadowOffsetY = 4; x.fillStyle = "#ffffff"; x.fill(new Path2D(d));
    x.shadowColor = "transparent"; x.fill(new Path2D(d));
  }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  return (symTex[id] = t);
}
function dressGate(id) {
  const th = AF.portal.PTHEME[id] || AF.portal.PTHEME.ember;
  gate.st = AF.portal.newPortal(id); gate.o = {}; gate.light.color.set(th.glow || th.a); gate.haloC.set(th.glow || th.a);
  gate.rim.material.color.set(th.glow || th.a).multiplyScalar(2);
  for (const b of gate.banners || []) {
    b.material.color.set(th.glow || th.a).multiplyScalar(0.9); // the colour the portal glows
    const m = b.userData.sym.material; m.map = gateSym(id); m.color.setScalar(1.15); m.needsUpdate = true; b.userData.sym.visible = true;
  }
}
// (30 Oct, "the switching between portals should have a very small fast animation"): the portal folds into its middle
// and opens out as the new gate, the banners flip over to its colour and symbol, a little flash of its colour; the
// first gate shown just appears
HUB.setGate = id => {
  if (!gate.dressed) { gate.dressed = true; dressGate(id); return; }
  if (gate.st.g === id && !gate.swap) return;
  const tok = gate.swap = (gate.swapN = (gate.swapN || 0) + 1), live = () => gate.swapN === tok;
  const flip = a => { for (const b of gate.banners || []) b.rotation.y = a; };
  HUB.tw(0, 0.12, k => { if (!live()) return; gate.o.collapse = k * k; flip(k * PI / 2); })
    .then(() => {
      if (!live()) return;
      dressGate(id); gate.o.collapse = 1;
      const th = AF.portal.PTHEME[id] || AF.portal.PTHEME.ember; HUB.flash(0.1, th.glow || th.a);
      return HUB.tw(0, 0.2, k => { if (!live()) return; const e = easeOut(k); gate.o.collapse = 1 - e; flip((1 - e) * PI / 2); });
    })
    .then(() => { if (live()) { gate.o.collapse = 0; flip(0); gate.swap = 0; } });
};
const RARS = AF.RARITIES.map(r => r.id);
gate.flyers = []; gate.labels = [];
HUB.clearPulls = () => { gate.flyers.forEach(dropFig); gate.flyers = []; gate.labels.forEach(l => { if (l.parent) l.parent.remove(l); l.material.map.dispose(); }); gate.labels = []; };
function textSprite(text, col, size = 1) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128;
  const x = c.getContext("2d"); x.font = '64px "Fredoka One", sans-serif'; x.textAlign = "center"; x.textBaseline = "middle";
  x.lineJoin = "round"; x.lineWidth = 14; x.strokeStyle = "#0d0a16"; x.strokeText(text, 256, 66); x.fillStyle = col; x.fillText(text, 256, 66);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const m = new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false }); m.color.setScalar(1.1);
  const s = new T.Sprite(m); s.scale.set(4 * size, 1 * size, 1); s.renderOrder = 10; return s;
}
HUB.textSprite = textSprite;
// ---------------- the Ascend show ----------------
// (30 Oct, "the ascend animation ... should be its own thing with the new 3d crystal"): asc.o.charge (0-1) speeds the
// rings and draws them in, brightens the core and the beam; asc.o.burst (1 falling to 0) flings them out and flares
const ASC_COLS = [[0.69, 0.54, 1], [0.5, 0.89, 1], [1, 1, 1], [1, 0.82, 0.94]];
function stepAsc(dt, t) {
  const ch = asc.o.charge, bu = asc.o.burst;
  asc.spin += dt * (1 + ch * 10 + bu * 4);
  asc.core.rotation.y = asc.spin * 0.4;
  asc.core.scale.set(1 + bu * 0.35, 3.6 * (1 + ch * 0.08 * sin(t * 30) + bu * 0.2), 1 + bu * 0.35);
  asc.core.material.color.copy(asc.coreC).multiplyScalar(1 + ch * 2.2 + bu * 5);
  asc.rings.forEach((r, i) => {
    r.rotation.x = PI / 2 + sin(t * 0.7 + i) * 0.25 * (1 - ch);
    r.rotation.y = asc.spin * (0.3 + i * 0.2);
    r.position.y = lerp(4.5 + i * 2.4 + sin(t + i) * 0.3, 7 + (i - 1) * 0.9, ch * 0.75);
    r.scale.setScalar(1 - ch * 0.4 + bu * (2.2 + i));
  });
  asc.beam.material.opacity = asc.beamO + ch * 0.35 + bu * 0.7;
  asc.beam.scale.set(1 + ch * 0.5 + bu * 3.5, 1, 1 + ch * 0.5 + bu * 3.5);
  if (!asc.pts.visible) return;
  // motes spiral in to the core while it charges; shards fly out and fall after the burst
  const P = asc.pts.geometry.attributes.position, C = asc.pts.geometry.attributes.color;
  let live = 0;
  asc.P.forEach((m, i) => {
    if (!m.on && asc.feed && rand() < dt * 9) {
      m.on = 1; m.k = 0; m.a = rand() * TAU; m.r = 7 + rand() * 6; m.y = rand() * 14 - 2; m.sp = 0.8 + rand() * 0.6; m.c = ASC_COLS[(rand() * 4) | 0];
    }
    if (m.on === 1) { // in: round and in to the core (7 up), faster as it closes
      m.k += dt * m.sp; const e = m.k * m.k, rr = m.r * (1 - e);
      P.setXYZ(i, cos(m.a + m.k * 5) * rr, lerp(m.y, 7, e), sin(m.a + m.k * 5) * rr);
      const b = Math.min(1, m.k * 3) * (1 - Math.max(0, m.k - 0.9) * 10); C.setXYZ(i, m.c[0] * b, m.c[1] * b, m.c[2] * b);
      if (m.k >= 1) m.on = 0; else live++;
    } else if (m.on === 2) { // out: a shard, falling, fading
      m.k += dt; m.vy -= dt * 14; m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;
      if (m.y < 0.6) { m.y = 0.6; m.vy *= -0.3; m.vx *= 0.6; m.vz *= 0.6; }
      P.setXYZ(i, m.x, m.y, m.z);
      const b = Math.max(0, 1 - m.k / m.life) * 1.6; C.setXYZ(i, m.c[0] * b, m.c[1] * b, m.c[2] * b);
      if (m.k >= m.life) m.on = 0; else live++;
    } else C.setXYZ(i, 0, 0, 0);
  });
  P.needsUpdate = true; C.needsUpdate = true;
  if (!live && !asc.feed) asc.pts.visible = false;
}
// onBurst runs at the burst (the ascension itself); resolves when the crystal has settled
HUB.ascendShow = async onBurst => {
  const o = asc.o, home = SPOTS.ascend, here = HUB.tab === "ascend" && camS.k >= 1;
  const core = new T.Vector3(0, 7, 0); asc.A.localToWorld(core);
  camS.pushTo.copy(home.cam).sub(core).setLength(15).add(core);
  const sh0 = camS.shift;
  asc.pts.visible = true; asc.feed = true;
  // 1. charge
  await HUB.tw(0, 1.8, k => {
    o.charge = k * k;
    if (here) { camS.push = easeOut(k) * 0.55; camS.shift = lerp(sh0, 0, ease(Math.min(1, k * 1.6))); }
  });
  asc.feed = false;
  // 2. burst
  o.charge = 0; o.burst = 1;
  HUB.flash(1, "#efe4ff");
  asc.P.forEach(m => {
    if (rand() > 0.85) return;
    const a = rand() * TAU, up = rand(), v = 7 + rand() * 13;
    Object.assign(m, { on: 2, k: 0, life: 1.3 + rand() * 1.4, x: 0, y: 7, z: 0, vx: cos(a) * v * (1 - up * 0.5), vy: 4 + up * 14, vz: sin(a) * v * (1 - up * 0.5), c: ASC_COLS[(rand() * 4) | 0] });
  });
  asc.wave.visible = true;
  HUB.tw(0, 1.4, k => { const e = easeOut(k); asc.wave.scale.setScalar(1 + e * 46); asc.wave.material.opacity = (1 - k) * 0.9; }).then(() => { asc.wave.visible = false; });
  try { if (onBurst) onBurst(); } catch (e) { console.error(e); }
  // 3. settle
  await HUB.tw(0, 1.6, k => {
    o.burst = Math.pow(1 - k, 2);
    if (here && HUB.tab === "ascend") { camS.push = 0.55 * (1 - ease(k)); camS.shift = lerp(0, home.shift, ease(Math.max(0, k * 1.4 - 0.4))); }
  });
  o.burst = 0;
  if (HUB.tab === "ascend") { camS.push = 0; camS.shift = home.shift; }
};
// units: what came out (the best rarity decides how far the portal climbs). Resolves once they've all landed
HUB.summonReveal = async (units, gid) => {
  HUB.clearPulls();
  const best = units.reduce((m, u) => Math.max(m, AF.RAR[AF.UNIT[u.k].rarity].order), 0);
  const odds = Object.keys(AF.GATE[gid].odds).filter(r => AF.GATE[gid].odds[r] > 0), first = RARS.indexOf(odds[0]);
  const steps = Math.max(0, best - first), st = gate.st, o = gate.o;
  camS.pushTo.copy(gate.at).add(V3(0, -0.6, 12));
  HUB.tw(0, 0.6 + steps * 0.45, k => { camS.push = easeOut(k) * 0.7; });
  for (let i = 0; i <= steps; i++) {
    const r = AF.RARITIES[first + i], rb = r.id === "mythic" || r.id === "eternal" || r.id === "absolute";
    o.tint = [r.color, r.color]; o.rainbow = rb; o.power = 1 + i * 0.7; o.kick = 1;
    st.waves.push({ c: r.color, life: 0, max: 0.9 });
    AF.portal.portalRays(st, { c: r.color, n: 12 + i * 2, len: 700, rainbow: rb });
    gate.light.color.set(r.color);
    HUB.flash(0.08 + i * 0.03, r.color);
    if (HUB.onStep) HUB.onStep(r, i, steps);
    await HUB.wait(0.45);
  }
  await HUB.tw(0, 0.35, k => { o.collapse = k; });
  o.collapse = 0;
  HUB.flash(0.85);
  HUB.tw(0, 0.6, k => { o.boom = k; }).then(() => { o.boom = 0; o.power = 0; o.tint = null; o.rainbow = false; });
  const n = units.length, G = gate.G, top = gate.top;
  HUB.tw(0.1, 1.2, k => { camS.push = 0.7 * (1 - ease(k)) + (n > 1 ? 0 : 0.3) * ease(k); });
  // they fly out of the portal and land in an arc in front of it, on whichever step of the plinth is under them
  await Promise.all(units.map((u, i) => new Promise(res => {
    const a = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2.3, rr = n === 1 ? 3.6 : 6.1, lx = sin(a) * rr, lz = cos(a) * rr * 0.8 + 1.2;
    const rad = Math.hypot(lx, lz), ly = rad < 4.9 ? top : rad < 5.9 ? top - 0.45 : top - 0.9;
    HUB.wait(i * (n > 1 ? 0.11 : 0)).then(() => {
      const f = figure(G, u, 0, top + 5.1, 0.3, 0, 0.001), sz = n === 1 ? 0.95 : 0.62; gate.flyers.push(f);
      HUB.tw(0, 0.75, k => {
        const e = easeOut(k);
        f.g.position.set(lx * e, lerp(top + 5.1, ly, e) + sin(k * PI) * 2.5, lerp(0.3, lz, e));
        f.holder.scale.setScalar(0.001 + sz * Math.min(1, k * 1.6)); f.g.rotation.y = (1 - e) * 6;
      }).then(() => {
        const r = AF.RAR[AF.UNIT[u.k].rarity];
        if (n > 1 && r.order < 2) { res(); return; }
        const lab2 = textSprite(r.name, r.color, n === 1 ? 1.3 : 0.7); lab2.position.set(lx, ly + (n === 1 ? 3.9 : 2.5), lz); G.add(lab2); gate.labels.push(lab2);
        if (r.order >= 4) HUB.flash(0.16, r.color);
        res();
      });
    });
  })));
};

// ---------------- the screen in the Trait Lab: the interface's plate, laid onto it ----------------
// a CSS matrix that maps a w x h box onto four points (a homography), so the plate stays real HTML and looks exactly
// like the game's, standing in the world at the screen's angle
function adj(m) { return [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4], m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5], m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]]; }
function mm(a, b) { const c = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]; c[3 * i + j] = s; } return c; }
function mv(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
function basis(p) { const m = [p[0], p[2], p[4], p[1], p[3], p[5], 1, 1, 1], v = mv(adj(m), [p[6], p[7], 1]); return mm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]); }
function homography(w, h, dst) { const s = basis([0, 0, w, 0, 0, h, w, h]), d = basis(dst), t = mm(d, adj(s)); for (let i = 0; i < 9; i++) t[i] /= t[8]; return `matrix3d(${t[0]},${t[3]},0,${t[6]},${t[1]},${t[4]},0,${t[7]},0,0,1,0,${t[2]},${t[5]},0,${t[8]})`; }
const sv = new T.Vector3();
let screenEl = null;
HUB.attachScreen = el => { screenEl = el; };
function stepScreen() {
  if (!screenEl) return;
  // (30 Oct, "should start loading as soon as the camera starts animating to the trait lab"): from the trip's start
  if (HUB.tab !== "traits") { screenEl.style.visibility = "hidden"; return; }
  lab.face.updateMatrixWorld();
  const hw = 8.9 / 2, hh = 5.1 / 2, pts = [];
  for (const [x, y] of [[-hw, hh], [hw, hh], [-hw, -hh], [hw, -hh]]) {
    sv.set(x, y, 0.03).applyMatrix4(lab.face.matrixWorld).project(cam);
    if (sv.z > 1) { screenEl.style.visibility = "hidden"; return; }
    pts.push((sv.x * 0.5 + 0.5) * VW, (-sv.y * 0.5 + 0.5) * VH);
  }
  screenEl.style.visibility = "visible";
  screenEl.style.transform = homography(screenEl.offsetWidth, screenEl.offsetHeight, pts);
}

// ---------------- hovering and clicking things in the world ----------------
const ray = new T.Raycaster(), ptr = new T.Vector2();
ray.layers.enable(HIDE);
let ptrIn = false, px = 0, py = 0;
canvas.addEventListener("pointermove", e => { ptrIn = true; px = e.clientX; py = e.clientY; ptr.set((px / VW) * 2 - 1, -(py / VH) * 2 + 1); });
canvas.addEventListener("pointerleave", () => { ptrIn = false; });
function pickAt() {
  ray.setFromCamera(ptr, cam);
  const pads = PADS[HUB.tab] ? PADS[HUB.tab].map(s => s.p) : [];
  const hits = ray.intersectObjects(figs.map(f => f.g).concat(worlds.map(w => w.g), pads), true);
  // a unit under the pointer wins over a platform's click area (the front row's areas stand in front of the back row);
  // hidden things (the "+" over a filled platform) never count
  const shown = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  for (const h of hits) {
    let o = h.object; if (!shown(o)) continue;
    while (o && !o.userData.fig) o = o.parent;
    if (o) { const f = o.userData.fig; return { fig: f, pad: f.pad, slot: f.slot }; }
  }
  for (const h of hits) {
    let o = h.object; if (!shown(o)) continue;
    while (o && !o.userData.fig && o.userData.world === undefined && o.userData.slot === undefined) o = o.parent;
    if (!o) continue;
    if (o.userData.world !== undefined) return { world: o.userData.world };
    const sl = PADS[o.userData.pad][o.userData.slot];
    return sl.f ? { fig: sl.f, pad: o.userData.pad, slot: o.userData.slot } : { pad: o.userData.pad, slot: o.userData.slot };
  }
  return null;
}
HUB.pickAt = pickAt; HUB.canvasEl = canvas; // for tools/soju_clickout.mjs
// (3 Nov, owner: "if i click out anywhere in the lobby it just sends me back to crew") A plain click on nothing. A drag, or spinning
// the windmill, is not a click out.
let downAt = null;
canvas.addEventListener("pointerdown", e => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener("click", e => {
  if (camS.k < 1) return;
  const p = pickAt();
  if (p) { if (HUB.onPick) HUB.onPick(p); return; }
  const still = downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 6;
  if (still && !onMill(e) && HUB.onEmpty) HUB.onEmpty();
});
// (1 Nov, the easter egg, "somewhere in the 3d lobby where you can click / drag or do something"): the windmill's sails
// spin by hand: a click on them is a shove, a drag across them winds them up. Spun hard enough they overload and the
// Trait Storm is offered (ui.js AF.stormOffer); then they wind back down to the breeze
const mill = { a: 0, v: 0.6, down: false, lx: 0, ly: 0, at: -99 };
const onMill = e => { ptr.set((e.clientX / VW) * 2 - 1, -(e.clientY / VH) * 2 + 1); ray.setFromCamera(ptr, cam); return ray.intersectObject(HUB.mill, true).length > 0; };
canvas.addEventListener("pointerdown", e => { if (camS.k < 1 || !onMill(e)) return; mill.down = true; mill.lx = e.clientX; mill.ly = e.clientY; mill.v = Math.min(40, mill.v + 2.4); });
canvas.addEventListener("pointermove", e => {
  if (!mill.down) return;
  const d = Math.hypot(e.clientX - mill.lx, e.clientY - mill.ly); mill.lx = e.clientX; mill.ly = e.clientY;
  mill.v = Math.min(40, mill.v + d * 0.03);
});
addEventListener("pointerup", () => { mill.down = false; });
function stepMill(dt) {
  mill.v += (0.6 - mill.v) * Math.min(1, dt * 0.45);
  mill.a += mill.v * dt; HUB.mill.rotation.z = mill.a;
  if (mill.v > 18 && clock - mill.at > 8) { mill.at = clock; mill.v = 26; HUB.flash(0.55, 0xffe9a8); if (AF.stormOffer) AF.stormOffer(); }
}
function stepHover() {
  let p = null;
  if (ptrIn && camS.k >= 1) p = pickAt();
  canvas.style.cursor = p ? "pointer" : "";
  if (HUB.onHover) HUB.onHover(p && p.fig ? p.fig : null, px, py, p && !p.fig && p.pad ? p : null);
  worlds.forEach((w, i) => { w.hover = !!p && p.world === i; });
  HUB.hoverPad = p && p.pad ? PADS[p.pad][p.slot] : null;
}
HUB.selectWorld = i => { HUB.worldSel = i; };
// (29 Oct, "the defense camera is messed up"): the picked world only grows and glows. The camera used to lean a third of
// the way toward it, which swung the aim 12 units over and pushed the team's front row off the bottom of the screen
// where a platform's unit stands on the screen (its head), for the +income that rises off it; null off screen
const ps = new T.Vector3();
// s: how many pixels one world unit is there (the Area's income labels size by it)
HUB.padScreen = (kind, i) => {
  const sl = PADS[kind] && PADS[kind][i]; if (!sl) return null;
  ps.set(sl.x, sl.y + 3.4, sl.z).project(cam); const y1 = (-ps.y * 0.5 + 0.5) * VH;
  ps.set(sl.x, sl.y + 2.4, sl.z).project(cam);
  if (ps.z > 1 || Math.abs(ps.x) > 1 || Math.abs(ps.y) > 1) return null;
  const y = (-ps.y * 0.5 + 0.5) * VH;
  return { x: (ps.x * 0.5 + 0.5) * VW, y, s: y - y1 };
};

// the Merchant behind his counter (made here: figure() needs the world's list of figures, made above)
mr.fig = figure(mr.St, { k: "@merchant" }, 0, 0.8, 0.2, 0, 0.78); mr.fig.over = merchantOver;
// ---------------- the Underworld (30 Oct): Evolution's place, a scene of its own ----------------
const uw = {};
{
  const S = uw.S = HUB.hell = new T.Scene();
  S.background = new T.Color(0x070103);
  S.fog = new T.Fog(0x1e0406, 18, 135);
  S.add(new T.HemisphereLight(0x7a5058, 0x0a0204, 1.1));
  const key = new T.DirectionalLight(0xffa890, 1.3); key.position.set(-18, 26, 22); S.add(key);
  const back = new T.DirectionalLight(0xff2030, 1.1); back.position.set(10, 14, -40); S.add(back);
  const lavaLight = new T.DirectionalLight(0xff7a2a, 1.3); lavaLight.position.set(-30, 4, -60); S.add(lavaLight);
  uw.lamp = new T.PointLight(0xff3a2a, 16, 22, 1.8); uw.lamp.position.set(0, 4.5, 4); S.add(uw.lamp);
  // the sky: black overhead, red near the lake, a low dim moon behind the shrine
  const sky = new T.Mesh(new T.SphereGeometry(400, 32, 16), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false, uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec3 vD; void main() { vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uT; varying vec3 vD; void main() {
      float h = vD.y; vec3 c = mix(vec3(0.118, 0.016, 0.024), vec3(0.02, 0.0, 0.01), smoothstep(0.02, 0.5, h));
      vec3 m = normalize(vec3(0.15, 0.2, -1.0)); float d = distance(vD, m);
      c += vec3(0.9, 0.12, 0.08) * (1.0 - smoothstep(0.075, 0.08, d)) * 0.85 + vec3(0.5, 0.04, 0.04) * pow(max(0.0, 1.0 - d * 2.4), 3.0) * 0.6;
      float s = sin(vD.x * 30.0 + uT * 0.1) * sin(vD.z * 22.0 - uT * 0.07); c += vec3(0.12, 0.0, 0.01) * smoothstep(0.85, 1.0, s) * smoothstep(0.5, 0.0, h);
      gl_FragColor = vec4(c, 1.0); }`,
  }));
  S.add(sky); uw.sky = sky;
  // (30 Oct, "no terraforming or terrain its just solid ground"): the ground. A basin round the shrine (stretched toward
  // the camera, so nothing rises between it and the shrine), its rim breaking into rock and ridges, and channels cut
  // below the lava's level so molten rivers wind through it
  const LAVA_Y = -0.8;
  const th = uw.th = (x, z) => {
    const zz = z + 4, d = Math.hypot(x, zz * (zz > 0 ? 0.42 : 1));
    let h = 0.05 + fbm(x * 0.23 + 7, z * 0.23 - 1) * 0.55 + smooth(15, 26, d) * 1.2;
    h += smooth(24, 70, d) * (5 + 11 * Math.max(0, fbm(x * 0.028 + 4, z * 0.028)));
    h += fbm(x * 0.11 + 3, z * 0.11 - 2) * 1.7 * smooth(15, 24, d);
    const c = Math.abs(vnoise(x * 0.04 + 11, z * 0.04 - 7));
    h -= smooth(0.11, 0.0, c) * (4 + 4 * smooth(30, 70, d)) * smooth(17, 25, d);
    return h;
  };
  {
    const geo = new T.PlaneGeometry(360, 360, 200, 200); geo.rotateX(-PI / 2);
    const P = geo.attributes.position, cols = new Float32Array(P.count * 3), cc = new T.Color(), rock = new T.Color(0x16100f), rust = new T.Color(0x3c2018), high = new T.Color(0x2e2422), hot = new T.Color(0xa0300e);
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i), y = th(x, z); P.setY(i, y);
      cc.copy(rock).lerp(rust, clamp(0.5 + fbm(x * 0.17 - 5, z * 0.17 + 9) * 1.1, 0, 1)).lerp(high, clamp((y - 2) / 14, 0, 0.6)).lerp(hot, clamp(1 - (y - LAVA_Y) / 1.6, 0, 1) * 0.9);
      cols.set([cc.r, cc.g, cc.b], i * 3);
    }
    geo.setAttribute("color", new T.BufferAttribute(cols, 3)); geo.computeVertexNormals();
    S.add(new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0.05 })));
  }
  // the lava: a dark crust over a moving glow
  uw.lava = new T.Mesh(new T.PlaneGeometry(360, 360, 1, 1), new T.ShaderMaterial({
    fog: true, uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, { uT: { value: 0 } }]),
    vertexShader: `varying vec2 vP;
      #include <fog_pars_vertex>
      void main() { vP = position.xy; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform float uT; varying vec2 vP;
      #include <fog_pars_fragment>
      float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec2 p = vP * 0.08; float a = n(p + vec2(uT * 0.06, uT * 0.035)) * 0.6 + n(p * 2.3 - vec2(uT * 0.09, -uT * 0.05)) * 0.3 + n(p * 5.1 + uT * 0.12) * 0.1;
        float hotk = smoothstep(0.42, 0.78, a), crack = smoothstep(0.035, 0.0, abs(a - 0.5));
        vec3 c = mix(vec3(0.16, 0.02, 0.01), vec3(1.45, 0.42, 0.07), hotk) + vec3(1.1, 0.55, 0.12) * crack * 0.7;
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  }));
  uw.lava.rotation.x = -PI / 2; uw.lava.position.y = LAVA_Y; S.add(uw.lava);
  // rubble: boulders and shards heaped along the foot of the steps, round the altar and over the basin, half buried
  {
    const rockM = new T.MeshStandardMaterial({ color: 0x241818, flatShading: true, roughness: 0.95 }), rockM2 = new T.MeshStandardMaterial({ color: 0x3a2420, flatShading: true, roughness: 0.95 });
    const geos = [new T.DodecahedronGeometry(1, 0), new T.IcosahedronGeometry(1, 0), new T.OctahedronGeometry(1, 0)];
    const rock = (x, z, s, yOff = 0) => {
      const m = new T.Mesh(geos[(rand() * 3) | 0], rand() < 0.35 ? rockM2 : rockM);
      m.scale.set(s * (0.8 + rand() * 0.6), s * (0.5 + rand() * 0.5), s * (0.8 + rand() * 0.6));
      m.position.set(x, th(x, z) + s * 0.15 + yOff, z); m.rotation.set(rand() * 3, rand() * 3, rand() * 3); S.add(m);
    };
    // along each step's front and sides (the steps: 26x14, 21x11, 16x8.5 wide, their tops at 1, 2.2, 3.4)
    for (const [w, dd, cz, y] of [[26, 14, -12, -0.2], [21, 11, -12.5, 1.0], [16, 8.5, -13, 2.2]]) {
      for (let i = 0; i < 16; i++) { const x = -w / 2 + rand() * w; rock(x, cz + dd / 2 + 0.3 + rand() * 0.9, 0.5 + rand() * 0.9, y > 0 ? y - th(x, cz + dd / 2) : 0); }
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = cz - dd / 2 + rand() * dd; rock(s * (w / 2 + 0.3 + rand() * 0.8), z, 0.6 + rand() * 0.9, y > 0 ? y - th(s * w / 2, z) : 0); }
    }
    for (let i = 0; i < 14; i++) { const a = (i / 14) * PI * 2 + rand() * 0.3, r = 2.9 + rand() * 0.8; rock(Math.cos(a) * r, 4 + Math.sin(a) * r, 0.35 + rand() * 0.45); }
    for (let i = 0; i < 40; i++) { const x = (rand() - 0.5) * 34, z = -4 + rand() * 30; if (Math.hypot(x, z - 4) < 4) continue; rock(x, z, 0.3 + rand() * 0.8); }
  }
  const G = new T.Group(); S.add(G);
  const B = (w, h, d, c, x, y, z, o) => K.box(G, w, h, d, c, x, y, z, o);
  const STONE = 0x1c1418, STONE2 = 0x2a1e22, BONE = 0xe6dcc8, RED = 0xff2a3a;
  // the dais, three steps, heaped with skulls
  B(26, 1.2, 14, STONE, 0, 0.4, -12); B(21, 1.2, 11, STONE2, 0, 1.6, -12.5); B(16, 1.2, 8.5, STONE, 0, 2.8, -13);
  const skull = (x, y, z, s, ry) => {
    const g = new T.Group(); g.position.set(x, y, z); g.rotation.set(rand() * 0.5 - 0.25, ry, rand() * 0.5 - 0.25); g.scale.setScalar(s); G.add(g);
    K.box(g, 0.9, 0.8, 0.9, BONE, 0, 0.4, 0); K.box(g, 0.7, 0.3, 0.6, BONE, 0, 0.05, 0.12, { ink: false });
    for (const e of [-1, 1]) K.box(g, 0.24, 0.24, 0.04, 0x0a0406, e * 0.2, 0.45, 0.46, { ink: false });
  };
  for (let i = 0; i < 70; i++) {
    const side = i % 2 ? 1 : -1, x = side * (4 + rand() * 9), z = -6 - rand() * 12, y = x * side < 8.5 && z < -8.5 ? 3.4 : x * side < 10.5 && z < -7 ? 2.2 : 1.0;
    skull(x, y, z, 0.6 + rand() * 0.6, rand() * 6);
  }
  for (let i = 0; i < 26; i++) skull(-11 + rand() * 22, 0.1, -4.5 - rand() * 2.5, 0.5 + rand() * 0.5, rand() * 6);
  // the shrine: four pillars, red bands, a heavy two-tier roof whose corners curl into horns, lanterns under them
  for (const [x, z] of [[-5.5, -10], [5.5, -10], [-5.5, -16], [5.5, -16]]) {
    B(1.1, 7.5, 1.1, 0x120c0e, x, 7.1, z); B(1.25, 0.35, 1.25, RED, x, 8.6, z, { ink: 0.02 }); B(1.6, 0.6, 1.6, STONE2, x, 3.6, z);
  }
  B(15, 0.9, 9.5, 0x120c0e, 0, 11.2, -13); B(13, 1.6, 8, 0x1a1214, 0, 12.4, -13); B(9, 0.8, 5.5, 0x120c0e, 0, 13.6, -13); B(6, 1.2, 3.5, 0x1a1214, 0, 14.5, -13);
  B(15.4, 0.2, 9.9, RED, 0, 10.7, -13, { ink: false });
  uw.lanterns = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    let p = new T.Group(); p.position.set(sx * 7.6, 11.4, -13 + sz * 4.9); G.add(p);
    for (let i = 0; i < 4; i++) { const q = new T.Group(); q.position.y = i ? 0.55 : 0; q.rotation.z = -sx * 0.32; q.rotation.x = sz * 0.22; p.add(q); K.box(q, 0.7 - i * 0.14, 0.62, 0.7 - i * 0.14, i === 3 ? RED : 0x120c0e, 0, 0.3, 0); p = q; }
    const L = new T.Group(); L.position.set(sx * 7.2, 9.4, -13 + sz * 4.6); G.add(L);
    K.box(L, 0.05, 0.8, 0.05, 0x3a3a40, 0, 0.6, 0, { ink: false });
    const lm = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.9, 10), glow(0xff3a2a, 1.6)); L.add(lm);
    uw.lanterns.push(L);
  }
  // a doorway of black behind the throne, a red line round it
  B(5, 6.5, 0.4, 0x050203, 0, 6.6, -16.4); B(5.6, 0.25, 0.5, RED, 0, 9.9, -16.4, { ink: false });
  // bone arches out of the lake, either side
  for (const [x, z, r, ry] of [[-17, -8, 7, 0.5], [17, -8, 7, -0.5], [-26, -22, 10, 0.4], [24, -26, 11, -0.35]]) {
    const y0 = Math.min(th(x, z), 1) - 0.6;
    const a = new T.Mesh(new T.TorusGeometry(r, r * 0.07, 6, 18, PI), toonFlat(BONE)); a.position.set(x, y0, z); a.rotation.y = ry; S.add(a);
    for (let k = 1; k < 4; k++) { const rib = new T.Mesh(new T.TorusGeometry(r * (1 - k * 0.2), r * 0.045, 5, 14, PI), toonFlat(BONE)); rib.position.set(x + Math.cos(ry) * k * 1.4, y0, z - Math.sin(ry) * k * 1.4); rib.rotation.y = ry; S.add(rib); }
  }
  // black rock spires on the ridges
  for (let i = 0; i < 18; i++) {
    const a = PI + (i / 17) * PI + (rand() - 0.5) * 0.2, d = 40 + rand() * 45, h = 12 + rand() * 26, x = Math.cos(a) * d, z = Math.sin(a) * d * 0.9 - 8;
    const sp = new T.Mesh(new T.ConeGeometry(2 + rand() * 3.5, h, 5), toonFlat(0x120a0c)); sp.position.set(x, th(x, z) + h / 2 - 1.5, z); sp.rotation.set((rand() - 0.5) * 0.25, rand() * 3, (rand() - 0.5) * 0.25); S.add(sp);
  }
  // (30 Oct, "animated lava spouts ... in the back"): volcanoes behind the shrine, lava down their sides, glowing craters
  // (30 Oct, "give you the volcano model cause it was really good"): Cinderfall's card volcano, from its data (AF.VOLCANO)
  uw.spouts = []; uw.fount = []; uw.plume = [];
  const VO = AF.VOLCANO, C = VO.colours, col3 = h => new T.Color(h);
  const smoothV = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  // the card's lava colour by heat (crust -> edge -> core -> white-hot)
  const lavaCol = h => col3(C.lavaCrust).lerp(col3(C.lavaEdge), smoothV(0, 0.55, h)).lerp(col3(C.lavaCore), smoothV(0.5, 0.82, h)).lerp(col3(C.lavaWhiteHot), smoothV(0.82, 1, h))
    .multiplyScalar(1 + 0.8 * smoothV(0.55, 1, h));
  // the ridges and gullies: how far out the slope stands at angle a, height h
  const ridge = (a, h) => 1 + 0.11 * Math.sin(9 * a + 1.3) * Math.pow(Math.max(0, 1 - h), 0.6) + vnoise(a * 2.3 + 4, h * 7) * 0.07 * (1 - h);
  const bodyGeo = (() => {
    const g = new T.LatheGeometry(VO.profile.map(([r, h]) => new T.Vector2(r, h)), 36).toNonIndexed(), P = g.attributes.position, cs = new Float32Array(P.count * 3), cc = new T.Color();
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), a = Math.atan2(z, x), rr = Math.hypot(x, z), inner = y > 0.94 && rr < 0.21;
      if (!inner) { const k = ridge(a, y); P.setX(i, x * k); P.setZ(i, z * k); P.setY(i, y + (y < 0.99 ? (vnoise(a * 9, y * 13) * 0.017 * (1 - y)) : 0)); }
      cc.copy(col3(C.rockBase)).lerp(col3(C.rockTop), smoothV(0.1, 0.95, y)); if (Math.sin(9 * a + 1.3) < -0.4) cc.multiplyScalar(0.78); if (inner) cc.set(0x502216);
      cs.set([cc.r, cc.g, cc.b], i * 3);
    }
    g.setAttribute("color", new T.BufferAttribute(cs, 3)); g.computeVertexNormals(); return g;
  })();
  const bodyM = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0.02 });
  // the flows: ribbons three across, lying on the ridged slope
  const flowGeo = (() => {
    const pos = [], cols = [], idx = [];
    for (const f of VO.flows) {
      const base = pos.length / 3;
      f.p.forEach(([x, y, z], i) => {
        const a = Math.atan2(z, x), k = ridge(a, y) + 0.012, px = x * k, pz = z * k, l = Math.hypot(px, pz) || 1, tx = -pz / l, tz = px / l, w = f.w[i] / 2, ht = f.h[i];
        pos.push(px - tx * w, y, pz - tz * w, px * 1.004, y + 0.003, pz * 1.004, px + tx * w, y, pz + tz * w);
        const ce = lavaCol(Math.max(0.12, ht)), ed = lavaCol(Math.max(0.12, ht * 0.72));
        cols.push(ed.r, ed.g, ed.b, ce.r, ce.g, ce.b, ed.r, ed.g, ed.b);
        if (i) { const b = base + (i - 1) * 3; idx.push(b, b + 3, b + 1, b + 1, b + 3, b + 4, b + 1, b + 4, b + 2, b + 2, b + 4, b + 5); }
      });
    }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new T.Float32BufferAttribute(cols, 3)); g.setIndex(idx); return g;
  })();
  const flowM = new T.MeshBasicMaterial({ vertexColors: true, fog: false, side: T.DoubleSide });
  const camAt = SPOTS.evolve.cam;
  [[-46, -80, 14], [14, -100, 16], [62, -76, 12.5], [-98, -52, 9], [100, -46, 9]].forEach(([x, z, H], n) => {
    const v = new T.Group(); v.position.set(x, th(x, z) - 0.08 * H, z); v.scale.setScalar(H); v.rotation.y = Math.atan2(camAt.x - x, camAt.z - z); S.add(v);
    v.add(new T.Mesh(bodyGeo, bodyM)); v.add(new T.Mesh(flowGeo, flowM));
    for (const fh of VO.foothills) { const m = new T.Mesh(new T.ConeGeometry(fh.radius, fh.height, 9), bodyM); m.position.set(fh.x, fh.height / 2 - 0.02, fh.z); v.add(m); }
    const cr = VO.crater;
    const pool = new T.Mesh(new T.CircleGeometry(cr.lavaRadius, 24), new T.MeshBasicMaterial({ color: lavaCol(0.75), fog: false })); pool.rotation.x = -PI / 2; pool.position.y = cr.lavaHeight; v.add(pool);
    const core = new T.Mesh(new T.CircleGeometry(cr.whiteCoreRadius, 20), new T.MeshBasicMaterial({ color: lavaCol(0.95), fog: false })); core.rotation.x = -PI / 2; core.position.y = cr.lavaHeight + 0.002; v.add(core);
    const rim = new T.Mesh(new T.TorusGeometry(VO.rim.radius, VO.rim.tube, 6, 36), glow(new T.Color(VO.rim.colour).getHex(), 1.5, { fog: false })); rim.rotation.x = PI / 2; rim.position.y = cr.lipHeight; v.add(rim);
    // the fountain's three cones of light
    VO.fountain.forEach((c, i) => {
      const m = new T.Mesh(new T.CylinderGeometry(c.topRadius, c.bottomRadius, c.height, 16, 1, true), new T.MeshBasicMaterial({ color: new T.Color(c.colour).multiplyScalar(Math.min(1.2, c.strength * 0.3)),
        transparent: true, opacity: c.alpha, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }));
      m.position.y = c.centreY; v.add(m); uw.fount.push({ m, a: c.alpha, i, n });
    });
    // the ash plume: lumps rising and drifting downwind
    const P = VO.plume;
    for (let i = 0; i < P.count; i++) {
      const t = i / (P.count - 1), r = 0.2 * (0.55 + 1.6 * t) * (0.8 + rand() * 0.4);
      const m = new T.Mesh(new T.IcosahedronGeometry(r, 0), new T.MeshStandardMaterial({ color: col3(C.ash).lerp(col3(C.ashTop), smoothV(0, 0.6, t)), flatShading: true, roughness: 1 }));
      m.position.set(t * t * P.drift + (rand() - 0.5) * 0.12, P.riseFrom + (P.riseTo - P.riseFrom) * t, (rand() - 0.5) * 0.12); m.rotation.set(rand() * 3, rand() * 3, 0); v.add(m);
      uw.plume.push({ m, y: m.position.y, ph: rand() * 6 });
    }
    if (n === 1) { const L = new T.PointLight(0xff6a1a, 60, H * 3.5, 1.4); L.position.y = 1.08; v.add(L); }
    // eruptions: bombs on the card's arcs, in this volcano's size
    uw.spouts.push({ x, y: v.position.y + 1.02 * H, z, big: true, on: 0, next: rand() * 4, sp: [0.43 * 0.7 * H * 1.6, 0.43 * 1.3 * H * 1.6], spread: 0.17 * H * 1.4, g: 0.37 * H * 2.4, n });
  });
  // geysers out of the nearer lava channels: wherever a channel is, a few spots spit
  for (let i = 0, tries = 0; i < 6 && tries < 400; tries++) {
    const a = PI * 1.05 + rand() * PI * 0.9, d = 26 + rand() * 30, x = Math.cos(a) * d, z = Math.sin(a) * d - 6;
    if (th(x, z) > LAVA_Y - 0.3) continue;
    uw.spouts.push({ x, y: LAVA_Y, z, big: false, on: 0, next: rand() * 3, sp: [6, 11], spread: 1 }); i++;
  }
  // the molten drops: one cloud for every spout, each drop flying its own arc
  // (two clouds: the volcanoes' drops are seen from much further off)
  uw.drops = [[700, 2.6], [300, 0.8]].map(([N, size]) => {
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), list = [];
    for (let i = 0; i < N; i++) { list.push({ life: 0, max: 0 }); pos[i * 3 + 1] = -99; }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setAttribute("color", new T.BufferAttribute(col, 3));
    const pts = new T.Points(g, new T.PointsMaterial({ size, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: size < 2 }));
    pts.frustumCulled = false; S.add(pts);
    return { pts, list, i: 0 };
  });
  // the altar stone in the lake, before the shrine
  uw.altar = new T.Group(); uw.altar.position.set(0, Math.max(0, th(0, 4)) + 0.1, 4); S.add(uw.altar);
  K.mesh(uw.altar, K.cyl(2.2, 2.5, 0.6, 24), STONE, 0, 0.3, 0); K.mesh(uw.altar, K.cyl(1.9, 2.0, 0.15, 24), STONE2, 0, 0.66, 0, { ink: false });
  uw.ring = new T.Mesh(new T.TorusGeometry(2.05, 0.05, 6, 64), glow(RED, 1.5)); uw.ring.rotation.x = PI / 2; uw.ring.position.y = 0.74; uw.altar.add(uw.ring);
  // the Keeper on the dais
  uw.keeper = figure(G, { k: "@keeper" }, 0, 3.4, -13.2, 0, 1.05);
  // embers and ash drifting up
  const N = 420, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), c = new T.Color();
  uw.ash = [];
  for (let i = 0; i < N; i++) {
    const q = { x: (rand() - 0.5) * 70, y: rand() * 26, z: (rand() - 0.5) * 50 - 6, v: 0.4 + rand() * 1.2, ph: rand() * 6 };
    uw.ash.push(q); c.set(i % 4 ? 0xff3a1a : 0x3a2a2a); if (i % 4) c.multiplyScalar(1.4 + rand());
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setAttribute("color", new T.BufferAttribute(col, 3));
  uw.pts = new T.Points(g, new T.PointsMaterial({ size: 0.14, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending, fog: true }));
  uw.pts.frustumCulled = false; S.add(uw.pts);
  // the evolution's pieces: a column of fire, a shockwave on the lake, bolts
  uw.col = new T.Mesh(new T.CylinderGeometry(1.4, 2.0, 30, 24, 1, true), new T.MeshBasicMaterial({ color: new T.Color(RED).multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
  uw.col.position.set(0, 15, 4); S.add(uw.col);
  uw.wave = new T.Mesh(new T.RingGeometry(0.9, 1, 96), new T.MeshBasicMaterial({ color: new T.Color(0xff5a3a).multiplyScalar(1.4), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
  uw.wave.rotation.x = -PI / 2; uw.wave.position.set(0, 0.05, 4); S.add(uw.wave);
  uw.bolts = [];
}
HUB.uw = uw;
// the unit on the altar (null clears it)
HUB.evoUnit = u => {
  const key = u ? u.uid + ":" + (u.ev ? 1 : 0) + (u.sh ? "s" : "") + (u.tr === "golden" ? "g" : "") : "";
  if (uw.figKey === key) return;
  uw.figKey = key; dropFig(uw.fig); uw.fig = null;
  if (u) uw.fig = figure(uw.altar, u, 0, 0.74, 0, -0.15, 0.95);
};
// (30 Oct) the units a pact would take, standing in a half ring behind the altar
uw.offer = [];
HUB.evoOffer = list => {
  const key = list.map(u => u.uid).join();
  if (uw.offerKey === key) return;
  uw.offerKey = key; uw.offer.forEach(dropOffer); uw.offer = [];
  const A = uw.altar.position, cam = SPOTS.evolve.cam;
  list.forEach((u, i) => {
    const a = PI + PI * (i + 1) / (list.length + 1), r = 4.8, x = A.x + Math.cos(a) * r, z = A.z + Math.sin(a) * r * 0.85;
    // the ground's highest point under the plinth, so no knob of rock comes up through it
    let gy = -9; for (const [dx, dz] of [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7]]) gy = Math.max(gy, uw.th(x + dx, z + dz));
    const ped = new T.Group(); ped.position.set(x, gy, z); uw.S.add(ped);
    K.mesh(ped, K.cyl(0.85, 1.0, 0.7, 14), 0x1c1418, 0, 0.1, 0); K.mesh(ped, K.cyl(0.8, 0.82, 0.08, 14), 0x2a1e22, 0, 0.49, 0, { ink: false });
    const f = figure(ped, u, 0, 0.53, 0, Math.atan2(cam.x - x, cam.z - z), 0.62);
    f.ped = ped; uw.offer.push(f);
  });
};
function dropOffer(f) { dropFig(f); if (f.ped) uw.S.remove(f.ped); }
// a jagged bolt from the sky onto (x, z), fading
function uwBolt(x, z) {
  const pts = []; let px = x + (rand() - 0.5) * 6, pz = z + (rand() - 0.5) * 4;
  for (let i = 0; i <= 10; i++) { const k = i / 10; pts.push(new T.Vector3(lerp(px, x, k) + (i && i < 10 ? (rand() - 0.5) * 1.4 : 0), lerp(26, 0.8, k), lerp(pz, z, k) + (i && i < 10 ? (rand() - 0.5) * 1.4 : 0))); }
  const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 30, 0.09, 4), new T.MeshBasicMaterial({ color: new T.Color(0xff3a3a).multiplyScalar(2.2), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  uw.S.add(m); uw.bolts.push({ m, t: 0 });
}
// the evolution itself; swap() is called under the flash and must rebuild the figure in its new form
HUB.evoShow = async swap => {
  const fx = AF.fx || {};
  uw.charge = 0.001;
  // the offering burns first: each sinks into the ground in red fire, one after another
  const gone = uw.offer.slice(); uw.offer = []; uw.offerKey = "";
  for (const f of gone) {
    const P0 = f.ped ? f.ped.position : f.g.position;
    uwBolt(P0.x, P0.z);
    const y0 = P0.y;
    HUB.tw(0, 0.9, k => { P0.y = y0 - k * k * 2.6; f.g.scale.setScalar(1 - k * 0.35); f.g.rotation.y += 0.08; }).then(() => dropOffer(f));
    placeBurn(f);
    if (fx.shake) fx.shake(0.18);
    await HUB.wait(0.35);
  }
  if (gone.length) await HUB.wait(0.5);
  for (let i = 0; i < 7; i++) { uwBolt(0, 4); if (fx.shake) fx.shake(0.15 + i * 0.05); await HUB.wait(0.32 - i * 0.025); }
  await HUB.tw(0, 0.7, k => { uw.col.material.opacity = k * 0.55; uw.col.scale.set(0.4 + k * 0.6, 1, 0.4 + k * 0.6); });
  HUB.flash(1.4, 0xffd0c0);
  if (swap) swap();
  uw.charge = 0;
  if (fx.shake) fx.shake(1.1);
  for (let i = 0; i < 3; i++) uwBolt((rand() - 0.5) * 3, 4 + (rand() - 0.5) * 3);
  HUB.tw(0, 1.6, k => { uw.wave.material.opacity = (1 - k) * 0.9; uw.wave.scale.setScalar(1 + easeOut(k) * 40); });
  await HUB.tw(0, 1.2, k => { uw.col.material.opacity = (1 - k) * 0.55; uw.col.scale.set(1 + k * 0.6, 1, 1 + k * 0.6); });
};
// red fire licking up round a unit as it sinks (a few additive flames that rise and fade)
function placeBurn(f) {
  const p = new T.Vector3(); f.g.getWorldPosition(p);
  for (let i = 0; i < 14; i++) {
    const m = new T.Mesh(new T.ConeGeometry(0.18 + rand() * 0.18, 0.9 + rand() * 0.9, 5), new T.MeshBasicMaterial({ color: new T.Color(i % 3 ? 0xff3a1a : 0xffb030).multiplyScalar(1.4), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    const a = rand() * PI * 2, r = 0.3 + rand() * 0.5; m.position.set(p.x + Math.cos(a) * r, p.y + 0.3, p.z + Math.sin(a) * r); uw.S.add(m);
    const d = 0.6 + rand() * 0.6, vy = 1.5 + rand() * 2;
    HUB.tw(rand() * 0.3, d, k => { m.position.y += vy * 0.016; m.material.opacity = 1 - k; m.scale.set(1 - k * 0.5, 1 + k, 1 - k * 0.5); }).then(() => { uw.S.remove(m); m.geometry.dispose(); m.material.dispose(); });
  }
}
function stepUw(dt, t) {
  if (HUB.tab !== "evolve") return;
  uw.sky.material.uniforms.uT.value = t;
  const P = uw.pts.geometry.attributes.position;
  for (let i = 0; i < uw.ash.length; i++) {
    const q = uw.ash[i]; q.y += q.v * dt * (1 + (uw.charge ? 2 : 0)); if (q.y > 26) q.y = 0;
    P.setXYZ(i, q.x + Math.sin(t * 0.6 + q.ph) * 0.8, q.y, q.z + Math.cos(t * 0.5 + q.ph) * 0.6);
  }
  P.needsUpdate = true;
  uw.lava.material.uniforms.uT.value = t;
  for (const f of uw.fount) {
    const s = uw.spouts.find(q => q.big && q.n === f.n), on = s && s.on > 0 ? 1 : 0;
    f.k = (f.k || 0) + (on - (f.k || 0)) * Math.min(1, dt * 4);
    f.m.scale.set(1 + f.k * 0.35, 0.8 + f.k * 0.9 + Math.sin(t * 9 + f.i * 2 + f.n) * 0.08, 1 + f.k * 0.35);
    f.m.position.y = 1.0 + (f.m.geometry.parameters.height * f.m.scale.y) / 2 + f.i * 0.05;
    f.m.material.opacity = f.a * (0.55 + 0.45 * f.k) * (0.85 + 0.15 * Math.sin(t * 13 + f.i));
  }
  for (const p of uw.plume) { p.m.position.y = p.y + Math.sin(t * 0.4 + p.ph) * 0.03; p.m.rotation.y += dt * 0.05; }
  // spouts: each erupts for a while, rests, erupts again; drops arc out, fall and cool from yellow to dark red
  for (const s of uw.spouts) {
    if (s.on > 0) {
      s.on -= dt;
      const n = Math.random() < dt * (s.big ? 40 : 24) ? (s.big ? 2 : 1) : 0;
      for (let k = 0; k < n; k++) {
        const D = uw.drops[s.big ? 0 : 1], q = D.list[D.i = (D.i + 1) % D.list.length], a = Math.random() * PI * 2, r = Math.random() * s.spread * 0.4;
        q.x = s.x + Math.cos(a) * r; q.y = s.y; q.z = s.z + Math.sin(a) * r;
        const v = s.sp[0] + Math.random() * (s.sp[1] - s.sp[0]), out = Math.random() * s.spread;
        q.g = s.g || 22; q.vx = Math.cos(a) * out; q.vy = v; q.vz = Math.sin(a) * out; q.life = 0; q.max = (2 * v) / q.g + 0.8; q.floor = s.big ? s.y - 30 : s.y - 0.2;
      }
    } else if ((s.next -= dt) <= 0) { s.on = s.big ? 1.6 + Math.random() * 1.6 : 0.8 + Math.random(); s.next = (s.big ? 3 : 2) + Math.random() * 4; }
  }
  for (const D of uw.drops) {
    const P = D.pts.geometry.attributes.position, C = D.pts.geometry.attributes.color;
    for (let i = 0; i < D.list.length; i++) {
      const q = D.list[i];
      if (q.life >= q.max) { if (q.max) { P.setY(i, -99); q.max = 0; } continue; }
      q.life += dt; q.vy -= (q.g || 22) * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.y < q.floor) q.life = q.max;
      const k = q.life / q.max;
      P.setXYZ(i, q.x, q.y, q.z); C.setXYZ(i, 1.05 - k * 0.55, 0.34 - k * 0.3, 0.06 - k * 0.05);
    }
    P.needsUpdate = true; C.needsUpdate = true;
  }
  uw.ring.rotation.z = t * 0.6; uw.lamp.intensity = 14 + Math.sin(t * 7) * 1.5 + Math.sin(t * 13) + (uw.charge ? 16 : 0);
  uw.lanterns.forEach((L, i) => { L.rotation.z = Math.sin(t * 1.3 + i) * 0.08; });
  for (let i = uw.bolts.length - 1; i >= 0; i--) {
    const b = uw.bolts[i]; b.t += dt; b.m.material.opacity = Math.max(0, 1 - b.t / 0.35);
    if (b.t > 0.35) { uw.S.remove(b.m); b.m.geometry.dispose(); b.m.material.dispose(); uw.bolts.splice(i, 1); }
  }
}

// ---------------- the loop ----------------
let last = performance.now();
const gp = new T.Vector3(), gp2 = new T.Vector3();
function step(now) {
  // never a negative step (a clock that ran ahead must not run time backwards: a ring once got a negative radius)
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = Math.max(last, now); clock += dt;
  const t = clock;
  for (let i = timers.length - 1; i >= 0; i--) if (clock >= timers[i][0]) { const r = timers[i][1]; timers.splice(i, 1); r(); }
  for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i], k = (clock - w.t0) / w.dur; if (k < 0) continue; w.fn(Math.min(1, k)); if (k >= 1) { tweens.splice(i, 1); w.res(); } }
  stepCam(dt, t);
  for (const f of figs) { K.animate(f.R, t + f.ph, f.R.P); if (f.crown) f.crown(t + f.ph); if (f.over) f.over(); }
  stepPops(dt); stepUw(dt, t); stepCoins(t);
  HUB.crystal.rotation.y = t * 0.5; HUB.crystal.position.y = 4.3 + sin(t * 1.3) * 0.2;
  stepMill(dt);
  stepAsc(dt, t);
  lab.pads[0].userData.ring.rotation.z = lab.pads[1].userData.ring.rotation.z = t; lab.pulse = Math.max(0, (lab.pulse || 0) - dt * 1.5); lab.glowM.material.opacity = lab.pulse * 0.5;
  hall.ringK = Math.min(1, (hall.ringK || 0) + dt * 2.5); const rr = (hall.ringR || 0) * easeOut(hall.ringK); hall.ring.scale.setScalar(Math.max(0.01, rr)); hall.fill.scale.setScalar(Math.max(0.01, rr));
  worlds.forEach((w, i) => {
    w.g.position.y = w.y + sin(t * 0.8 + w.ph) * 0.35;
    const on = HUB.worldSel === i ? 1 : w.hover ? 0.45 : 0; w.k += (on - w.k) * Math.min(1, dt * 8);
    w.edge.material.opacity = w.k * 0.9; w.g.scale.setScalar(1 + w.k * 0.12);
  });
  islets.forEach(w => { w.g.position.y = w.y + sin(t * 0.5 + w.ph) * 0.6; });
  for (const k in PADS) PADS[k].forEach(sl => {
    const hl = sl.p.userData.hl; sl.hk = (sl.hk || 0) + ((HUB.hoverPad === sl ? 1 : 0) - (sl.hk || 0)) * Math.min(1, dt * 12);
    const pulse = 0.75 + 0.25 * sin(t * 6), sh = sl.p.userData.shell;
    hl.material.opacity = sl.hk * pulse; hl.scale.setScalar(0.92 + sl.hk * 0.08); hl.visible = sl.hk > 0.01;
    sh.material.opacity = sl.hk * 0.32 * pulse; sh.visible = hl.visible;
    sl.ring.scale.setScalar(1 + sl.hk * 0.06);
  });
  for (const k in PADS) PADS[k].forEach((sl, i) => {
    if (!sl.plus.visible) return;
    sl.plus.position.y = (sl.plus.userData.y || 1.9) + sin(t * 2.2 + i) * 0.15; sl.plus.material.rotation = sin(t * 1.3 + i) * 0.08;
    if (sl.lock === "ready") sl.plus.scale.setScalar(1.15 + sin(t * 5) * 0.09); // affordable: it beats
  });
  clouds.forEach(c => { c.a += c.sp * dt; c.g.position.set(cos(c.a) * c.r, c.y, sin(c.a) * c.r); });
  sky.material.uniforms.uT.value = t;
  // the portal: the game's drawing, redrawn while the gate is anywhere near the screen
  gp.copy(gate.at).project(cam);
  if (Math.abs(gp.x) < 1.6 && Math.abs(gp.y) < 1.6 && gp.z < 1) {
    // (perf pass) drawn at the size it shows: 1024 when the gate fills the Summon tab, less when it's small in the
    // distance (from the Area it's about 200px tall); each step down is 4x less to draw and upload, at over 2 texels a pixel
    const top = gp2.copy(gate.at).setY(gate.at.y + 5.3).project(cam), px = Math.abs(top.y - gp.y) * VH;
    const res = HUB.merge === false ? 1024 : px > 420 ? 1024 : px > 200 ? 512 : 256;
    if (gate.canvas.width !== res) { gate.canvas.width = gate.canvas.height = res; gate.tex.dispose(); gate.st = AF.portal.newPortal(gate.st.g); }
    AF.portal.paint(gate.canvas, t, dt, gate.st, Object.assign({}, gate.o, { scale: 0.35, own: true })); gate.tex.needsUpdate = true;
  }
  gate.o.kick = Math.max(0, (gate.o.kick || 0) - dt * 1.5);
  // the light behind the frame breathes, and flares with a summon's kick
  gate.halo.material.color.copy(gate.haloC).multiplyScalar(0.9 + 0.15 * sin(t * 1.6) + gate.o.kick * 1.4);
  // the motes: round and up, back to the bottom once they're over the top, twinkling; a kick quickens and brightens them
  { const P = gate.motes.geometry.attributes.position, C = gate.motes.geometry.attributes.color, q = 1 + gate.o.kick * 3, hc2 = gate.haloC;
    gate.moteP.forEach((m, i) => {
      m.a += dt * m.sp * q; m.y += dt * m.up * q; if (m.y > 11.8) { m.y = 0.2; m.a = rand() * TAU; }
      P.setXYZ(i, cos(m.a) * m.r, gate.top + m.y, sin(m.a) * m.r * 0.35 + m.z);
      const tw = (0.45 + 0.55 * Math.max(0, sin(t * 2.2 + m.ph))) * (1 + gate.o.kick) * Math.min(1, m.y / 1.5, (11.8 - m.y) / 1.5);
      if (m.w) C.setXYZ(i, tw * 1.6, tw * 1.6, tw * 1.6); else C.setXYZ(i, hc2.r * tw * 2.6, hc2.g * tw * 2.6, hc2.b * tw * 2.6);
    });
    P.needsUpdate = true; C.needsUpdate = true;
    gate.pool.material.color.copy(hc2).multiplyScalar(0.55 + 0.1 * sin(t * 1.6) + gate.o.kick); }
  HUB.flashA = Math.max(0, (HUB.flashA || 0) - dt * 2.2); P.comp.uniforms.uFlash.value = HUB.flashA * 0.7;
  stepHover(); stepScreen();
  render();
}
HUB.step = step;
// (test hook) run n frames of ms each right now, for when the page isn't being drawn; then a JPEG of the canvas
HUB.tick = (n = 1, ms = 16.7) => { for (let i = 0; i < n; i++) { const now = performance.now(); last = now - ms; step(now); } };
HUB.shot = (q = 0.7) => canvas.toDataURL("image/jpeg", q);
HUB.render = render;
// ---------------- shadows: the scenery's drawn once, the units' each frame ----------------
// (29 Oct, perf pass) The sun's shadow map held every caster and was redrawn every frame. Now the scenery's shadows
// (the trees) are drawn into it once and kept; each frame that copy goes back in, depth and all, and only the units
// near the screen are drawn over it, so they still cast real shadows on everything and on each other.
let shadowKeep = null;
const SHADOW_COPY_F = `uniform sampler2D tSrc; varying vec2 vUv; void main() { gl_FragColor = texture2D(tSrc, vUv); }`;
const SHADOW_RESTORE_F = `#include <packing>
uniform sampler2D tSrc; varying vec2 vUv; void main() { vec4 c = texture2D(tSrc, vUv); gl_FragColor = c; gl_FragDepth = unpackRGBAToDepth(c); }`;
const shadowCopy = fsm(SHADOW_COPY_F, { tSrc: { value: null } });
const shadowRestore = new T.ShaderMaterial({ uniforms: { tSrc: { value: null } }, vertexShader: FS_V, fragmentShader: SHADOW_RESTORE_F, depthTest: true, depthWrite: true, depthFunc: T.AlwaysDepth });
// the same depth material three.js uses for shadows, drawing back faces as it does for front-sided materials
const shadowDepth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, side: T.BackSide });
function cacheShadows() {
  gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true;
  gl.setRenderTarget(rt); gl.render(scene, cam); // fills the sun's map with what casts now: the scenery
  const map = sun.shadow.map;
  shadowKeep = new T.WebGLRenderTarget(map.width, map.height, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: false, generateMipmaps: false });
  shadowCopy.uniforms.tSrc.value = map.texture; pass(shadowCopy, shadowKeep);
  sun.shadow.camera.layers.set(UNIT_SHADOW);
  HUB.shadowCache = true;
}
// units far off the screen are skipped (their merged meshes can't be culled by three.js on its own); units on or near
// it cast this frame
const frustum = new T.Frustum(), fm4 = new T.Matrix4(), fsph = new T.Sphere(), fv3 = new T.Vector3();
let unitsCasting = 0;
function cullFigures() {
  cam.updateMatrixWorld();
  frustum.setFromProjectionMatrix(fm4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  unitsCasting = 0;
  for (const f of figs) {
    f.g.getWorldPosition(fv3); fv3.y += 1; fsph.set(fv3, 6);
    const on = frustum.intersectsSphere(fsph);
    f.holder.visible = on;
    for (const c of f.casters || []) { if (on) c.layers.enable(UNIT_SHADOW); else c.layers.disable(UNIT_SHADOW); }
    if (on) unitsCasting++;
  }
}
function unitShadows() {
  const map = sun.shadow.map;
  shadowRestore.uniforms.tSrc.value = shadowKeep.texture; pass(shadowRestore, map);
  if (!unitsCasting) return;
  const ac = gl.autoClear; gl.autoClear = false; scene.overrideMaterial = shadowDepth;
  gl.setRenderTarget(map); gl.render(scene, sun.shadow.camera);
  scene.overrideMaterial = null; gl.autoClear = ac;
}

// the island's still props, merged (everything that moves or changes is kept as it is)
if (HUB.merge !== false) { clouds.forEach(c => bakeGroup(c.g)); islets.forEach(w => bakeGroup(w.g)); }
if (HUB.merge !== false) HUB.bakeInfo = bakeScenery(new Set([HUB.crystal, HUB.mill, asc.core, ...asc.rings, lab.face, lab.glowM, lab.ring, hall.ring, hall.fill, ...(gate.banners || []), gate.halo, gate.rim, gate.motes, gate.pool, asc.beam, asc.pts, asc.wave]));
resize();
cam.position.copy(camS.pos); cam.lookAt(camS.look);
if (HUB.merge !== false) cacheShadows();
return HUB;
};
})();
