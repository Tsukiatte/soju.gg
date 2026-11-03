/* Aura Farm Defense, the board: one WebGL canvas looking down on the map at an isometric angle (open ground that runs
   on past the edges of the screen, the road, the village, the placed units as the same figures the cards show, the
   enemies), and a 2D canvas on top for shots, hits, bursts, smoke and health bars. Pointer input (hover, place,
   select) is read here and handed to the page through hooks. The match itself is td.js; this only draws it and
   steps it while the Defense tab is open. */
(function () {
const T = THREE, AF = window.AF, K = AF.kit, TD = AF.TD;
const { box, pivot, mesh, cone, cyl, ball } = K;
const PI = Math.PI, sin = Math.sin, cos = Math.cos;
const DPR = Math.min(1.5, window.devicePixelRatio || 1);
const STEP = 1 / 60;
const UNIT_SCALE = 0.48; // a figure is about 3.4 units tall; on the board it stands about 1.6 high, half a house
const PAD = { top: 52, bottom: 64, side: 10 }; // screen room the HUD and team bar keep (the ground carries on under them)
// B.pad: the page's own room instead (a function or an object; the full-screen 3D match uses it)
const CAM = [16, 30, 28];
// the haze the far ground fades into (the stage behind the canvas is the same colour) is each world's own: worlds.js
const B = AF.Board = { speed: 1, paused: false };
B.faceCam = Math.atan2(CAM[0], CAM[2]); // a figure facing the viewer
// (30 Oct, "locked horizontally ... only in the actual tower defense map"): how far the match camera has been turned
// round the board's middle, and its glide after a drag
B.yaw = 0;
let yawV = 0, yawTo = 0, cam0 = null; // yawTo: where the drag is taking it; B.yaw eases after it
const orbit = { on: false, moved: false, x0: 0, last: 0, t: 0, down: null };
// (1 Nov, "add a scroll to zoom in defense, and would there be a good button to let them click and drag around"): the
// wheel zooms toward the pointer (B.uz, 1 to 3, easing after uzTo), the right button (or the wheel's) drags the board
// around; pan is the ground point the view centres on, kept on the map and only as far as the zoom leaves room for
B.uz = 1;
let uzTo = 1, panX = 0, panZ = 0, zAnchor = null;
const grab = { on: false, moved: false, x0: 0, y0: 0, g: null, btn: 0 };
const UZ_MAX = 3;
// the camera's direction from the board's middle, turned by the yaw (x and z over its height, for things placed "under"
// a point on the screen)
const camDir = () => { const c = Math.cos(B.yaw), s = Math.sin(B.yaw); return [CAM[0] * c + CAM[2] * s, CAM[1], -CAM[0] * s + CAM[2] * c]; };
B.camXZ = () => { const d = camDir(); return [d[0] / d[1], d[2] / d[1]]; };
function aim() {
  if (!cam) return;
  const d = camDir(), dir = new T.Vector3(...d).normalize();
  cam.position.copy(dir.multiplyScalar(80)); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  B.faceCam = Math.atan2(d[0], d[2]);
  if (V && V.on && V.view) cam.getWorldDirection(V.view);
  fit();
}

let gl = null, scene = null, cam = null, world = null, stage = null, glc = null, fxc = null, ctx = null, M = null, hooks = {};
let W = 0, H = 0, ro = null, acc = 0, t = 0;
const views = new Map(), foes = new Map(), pool = {}, dying = [], parts = [], fxs = [], trails = new WeakMap(), lastSfx = {};
let ghost = null, rangeMesh = null, rangeFill = null, selRing = null, hover = null, hoverUnit = null, blobGeo = null, blobMat = null;
let anims = [], chimneys = [], smoke = [], smokeAcc = 0;
const ray = new T.Raycaster(), ground = new T.Plane(new T.Vector3(0, 1, 0), 0), v3 = new T.Vector3(), hit = new T.Vector3();
const V = AF.VFX, X = AF.TDFX;

// ---------------- colours and small helpers ----------------
const css = (hex, a = 1) => { const c = new T.Color(hex); return `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},${a})`; };
const rimOf = u => { const d = AF.UNIT[u.k]; return d.rim || AF.R3.RIM[d.rarity]; };
const RARE = r => new T.Color(AF.RAR[r].color);
const own = m => { m.userData.board = true; return m; };
// a fixed sequence of "random" numbers, so the village looks the same every match
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
// smooth bumpy noise for the ground's colour and the hills outside the village
function noise(x, z) {
  return sin(x * 0.19 + 1.3) * cos(z * 0.23 - 0.7) * 0.5 + sin(x * 0.071 + z * 0.093) * 0.35 + sin(x * 0.53 - z * 0.41) * 0.15;
}
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// ---------------- the village's pieces ----------------
// each builds into g (centred on its footprint, front facing +z); o = the prop's extra look value
const WOOD = 0x5a3d28, PLASTER = [0xefe6d2, 0xe8dcc0, 0xf2e9da], STONE = 0x8b8f96, ROOF = { red: 0xb4533c, slate: 0x4b5a74, thatch: 0xc8a256 };
// a gable roof over a w x d footprint whose walls end at y: two slabs and the triangle ends
function gable(g, w, d, y, col, endCol) {
  // the ends are a three-sided prism (equilateral, so the slopes are as long as the house is deep), axis along x,
  // a corner up; the slabs sit on its two upper faces with a little overhang
  const R = d / Math.sqrt(3), top = y + 1.5 * R, th = 0.14;
  const ends = mesh(g, cyl(R, R, w, 3), endCol, 0, y + R / 2, 0);
  ends.rotation.set(-PI / 2, 0, -PI / 2);
  for (const s of [1, -1]) box(g, w + 0.36, th, d + 0.3, col, 0, y + 0.75 * R + th * 0.25, s * (d / 4 + th * 0.433), { rx: s * PI / 3 });
  return top;
}
const PROP = {
  house(g, look, i) {
    const w = 2.5, d = 2.1, wall = PLASTER[i % 3], roof = ROOF[look] || ROOF.red;
    box(g, w + 0.16, 0.32, d + 0.16, STONE, 0, 0.16, 0);
    box(g, w, 1.3, d, wall, 0, 0.97, 0);
    // timber frame: corner posts, a beam round the middle and the top, braces either side of the door
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(g, 0.12, 1.32, 0.12, WOOD, x * (w / 2), 0.97, z * (d / 2), { ink: 0.02 });
    for (const y of [0.92, 1.6]) { box(g, w + 0.04, 0.1, 0.06, WOOD, 0, y, d / 2 + 0.01, { ink: false }); box(g, w + 0.04, 0.1, 0.06, WOOD, 0, y, -d / 2 - 0.01, { ink: false });
      box(g, 0.06, 0.1, d + 0.04, WOOD, w / 2 + 0.01, y, 0, { ink: false }); box(g, 0.06, 0.1, d + 0.04, WOOD, -w / 2 - 0.01, y, 0, { ink: false }); }
    for (const s of [-1, 1]) box(g, 0.07, 0.8, 0.05, WOOD, s * 0.62, 1.26, d / 2 + 0.02, { rz: s * 0.6, ink: false });
    // door, step, windows with shutters and a flower box
    box(g, 0.5, 0.86, 0.08, 0x7a4e2e, 0, 0.75, d / 2 + 0.03, { ink: 0.02 });
    box(g, 0.06, 0.06, 0.04, 0xd8b45a, 0.15, 0.75, d / 2 + 0.08, { ink: false });
    box(g, 0.8, 0.12, 0.3, STONE, 0, 0.1, d / 2 + 0.2);
    for (const s of [-1, 1]) {
      box(g, 0.44, 0.4, 0.06, 0xffd98a, s * 0.82, 1.15, d / 2 + 0.02, { glow: 1, ink: 0.02 });
      box(g, 0.05, 0.4, 0.07, WOOD, s * 0.82, 1.15, d / 2 + 0.04, { ink: false });
      box(g, 0.13, 0.42, 0.05, look === "slate" ? 0x3d6b4a : 0x3d5a8a, s * 0.82 + s * 0.3, 1.15, d / 2 + 0.04, { ink: 0.015 });
      box(g, 0.48, 0.1, 0.14, 0x7a4e2e, s * 0.82, 0.9, d / 2 + 0.08, { ink: 0.015 });
      for (let k = 0; k < 4; k++) box(g, 0.07, 0.07, 0.07, [0xff5a6a, 0xffd23a, 0xff8ac8, 0xffffff][(k + i) % 4], s * 0.82 - 0.16 + k * 0.11, 0.98, d / 2 + 0.1, { ink: false });
      box(g, 0.06, 0.38, 0.38, 0xffd98a, s * (w / 2 + 0.02), 1.15, 0, { glow: 1, ink: 0.02 });
    }
    gable(g, w, d, 1.62, roof, wall);
    // chimney (its smoke is drawn on the 2D layer)
    box(g, 0.34, 1.0, 0.34, STONE, 0.75, 2.45, -0.35);
    box(g, 0.42, 0.1, 0.42, 0x6e737b, 0.75, 2.95, -0.35, { ink: 0.02 });
    g.userData.chimney = [0.75, 3.05, -0.35];
  },
  hall(g) {
    const w = 3.8, d = 3.0;
    box(g, w + 0.3, 0.4, d + 0.3, 0x9a9488, 0, 0.2, 0);
    box(g, w, 1.5, d, 0xc9c1b0, 0, 1.15, 0);
    box(g, w + 0.1, 0.14, d + 0.1, 0x9a9488, 0, 1.92, 0, { ink: 0.02 });
    box(g, w - 0.3, 1.1, d - 0.3, 0xefe6d2, 0, 2.55, 0);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(g, 0.14, 1.12, 0.14, WOOD, x * (w - 0.3) / 2, 2.55, z * (d - 0.3) / 2, { ink: 0.02 });
    gable(g, w - 0.3, d - 0.3, 3.1, ROOF.slate, 0xefe6d2);
    // the great doors the road leads to, steps, windows, banners
    box(g, 1.1, 1.2, 0.1, 0x6a4024, 0, 1.0, d / 2 + 0.04, { ink: 0.02 });
    box(g, 0.04, 1.2, 0.12, 0x3a2414, 0, 1.0, d / 2 + 0.06, { ink: false });
    box(g, 1.3, 0.12, 0.12, 0x9a9488, 0, 1.66, d / 2 + 0.06, { ink: 0.02 });
    for (let k = 0; k < 3; k++) box(g, 1.8 - k * 0.2, 0.12, 0.3, 0x9a9488, 0, 0.06 + k * 0.12, d / 2 + 0.5 - k * 0.15);
    for (const s of [-1, 1]) {
      box(g, 0.5, 0.6, 0.06, 0xffd98a, s * 1.3, 1.2, d / 2 + 0.02, { glow: 1, ink: 0.02 });
      box(g, 0.4, 0.4, 0.06, 0xffd98a, s * 1.0, 2.6, (d - 0.3) / 2 + 0.02, { glow: 1, ink: 0.02 });
      const b = box(g, 0.42, 0.95, 0.04, 0xc0282a, s * 0.75, 1.15, d / 2 + 0.1, { ink: 0.015 });
      box(b, 0.3, 0.3, 0.02, 0xd8b45a, 0, 0.1, 0.03, { ink: false, rz: 0.785 });
    }
    // clock tower
    const tw = pivot(g, 0, 3.1, -0.2);
    box(tw, 1.1, 2.0, 1.1, 0xc9c1b0, 0, 1.6, 0);
    mesh(tw, cyl(0.36, 0.36, 0.06, 20), 0xffffff, 0, 1.9, 0.56, { rx: PI / 2, glow: 1 });
    const hh = pivot(tw, 0, 1.9, 0.6), mh = pivot(tw, 0, 1.9, 0.61);
    box(hh, 0.05, 0.2, 0.02, 0x1a1a22, 0, 0.1, 0, { ink: false }); box(mh, 0.04, 0.3, 0.02, 0x1a1a22, 0, 0.15, 0, { ink: false });
    anims.push(tt => { mh.rotation.z = -tt * 0.4; hh.rotation.z = -tt * 0.033; });
    const tip = mesh(tw, cone(0.95, 1.5, 4), ROOF.slate, 0, 3.35, 0, { ry: PI / 4 });
    box(tw, 0.05, 0.6, 0.05, 0xd8b45a, 0, 4.3, 0, { ink: false });
    const flag = box(tw, 0.45, 0.28, 0.03, 0xc0282a, 0.25, 4.45, 0, { ink: 0.015 });
    // (moved into the world when the village is baked, so the swing is added to whatever turn it has there)
    anims.push(tt => { if (flag.userData.by === undefined) flag.userData.by = flag.rotation.y; flag.rotation.y = flag.userData.by + sin(tt * 3) * 0.25; });
    g.userData.keepAnim = [hh, mh, flag];
  },
  windmill(g) {
    mesh(g, cyl(0.78, 1.05, 3.2, 8), 0xe8dcc8, 0, 1.6, 0);
    for (const y of [0.9, 2.1]) mesh(g, cyl(0.98 - y * 0.08, 1.0 - y * 0.08, 0.1, 8), 0xb9a98a, 0, y, 0, { ink: false });
    box(g, 0.5, 0.8, 0.1, 0x7a4e2e, 0, 0.4, 1.0, { ink: 0.02 });
    for (const y of [1.5, 2.4]) box(g, 0.28, 0.32, 0.06, 0xffd98a, 0, y, 0.92 - (y - 1.5) * 0.08, { glow: 1, ink: 0.02 });
    mesh(g, cone(1.05, 1.3, 8), 0x6a4a3a, 0, 3.85, 0);
    const hub = pivot(g, 0, 3.0, 0.95);
    mesh(hub, cyl(0.16, 0.16, 0.3, 10), 0x4a3424, 0, 0, 0, { rx: PI / 2 });
    const sails = pivot(hub, 0, 0, 0.12);
    for (let k = 0; k < 4; k++) {
      const s = pivot(sails); s.rotation.z = (k / 4) * PI * 2;
      box(s, 0.1, 2.3, 0.06, 0x5a3d28, 0, 1.15, 0);
      box(s, 0.55, 1.8, 0.03, 0xf4efe2, 0.3, 1.35, 0.04, { ink: 0.015 });
      for (let j = 0; j < 4; j++) box(s, 0.62, 0.04, 0.05, 0x5a3d28, 0.3, 0.55 + j * 0.5, 0.06, { ink: false });
    }
    anims.push(tt => { sails.rotation.z = tt * 0.6; });
    g.userData.moving = [sails];
  },
  well(g) {
    mesh(g, cyl(0.62, 0.68, 0.55, 12), 0x9a9ea6, 0, 0.27, 0);
    mesh(g, cyl(0.5, 0.5, 0.05, 12), 0x3d7fb8, 0, 0.5, 0, { glow: 1 });
    for (const s of [-1, 1]) box(g, 0.1, 1.1, 0.1, WOOD, s * 0.55, 0.9, 0);
    box(g, 1.2, 0.08, 0.08, WOOD, 0, 1.25, 0, { ink: 0.02 });
    for (const s of [1, -1]) box(g, 1.4, 0.08, 0.62, ROOF.red, 0, 1.55, s * 0.22, { rx: s * 0.6 });
    box(g, 0.2, 0.22, 0.2, 0x7a4e2e, 0.1, 0.85, 0, { ink: 0.015 });
  },
  pond(g) {
    const w = mesh(g, new T.CircleGeometry(1.9, 40), 0x5aa8d8, 0, 0.02, 0, { rx: -PI / 2, glow: 1, own: 1, ink: false });
    mesh(g, new T.RingGeometry(1.85, 2.15, 40), 0x8fb06a, 0, 0.015, 0, { rx: -PI / 2, ink: false });
    for (let k = 0; k < 14; k++) { const a = (k / 14) * PI * 2 + rand() * 0.3; mesh(g, ball(0.16 + rand() * 0.1, 0), 0x9a9ea6, cos(a) * 2.0, 0.06, sin(a) * 2.0, { ry: rand() * 3 }); }
    for (let k = 0; k < 4; k++) { const a = rand() * PI * 2, r = rand() * 1.2; mesh(g, cyl(0.18, 0.18, 0.02, 10), 0x4f9a3c, cos(a) * r, 0.04, sin(a) * r, { ink: false }); }
    for (let k = 0; k < 9; k++) { const a = 2.4 + k * 0.12; mesh(g, cone(0.03, 0.7, 4), 0x5f8f3e, cos(a) * 1.75, 0.35, sin(a) * 1.75, { ink: false, rx: rand() * 0.2 }); }
    anims.push(tt => { const k = 0.9 + sin(tt * 1.7) * 0.06; w.material.color.setRGB(0.35 * k, 0.66 * k, 0.85 * k); });
    g.userData.moving = [w];
  },
  stall(g, look) {
    for (const [x, z] of [[-0.8, -0.45], [0.8, -0.45], [-0.8, 0.45], [0.8, 0.45]]) box(g, 0.08, 1.3, 0.08, WOOD, x, 0.65, z);
    box(g, 1.7, 0.1, 0.8, 0x9a6a3e, 0, 0.7, 0.1);
    box(g, 1.6, 0.6, 0.06, 0x7a4e2e, 0, 0.4, 0.48, { ink: 0.015 });
    for (let k = 0; k < 6; k++) box(g, 0.32, 0.05, 1.1, k % 2 ? 0xf4efe2 : look, -0.8 + k * 0.32, 1.4, 0.15, { rx: 0.35, ink: 0.015 });
    for (let k = 0; k < 9; k++) mesh(g, ball(0.08, 0), [0xd84a3a, 0xffa02e, 0x7fb84a][k % 3], -0.6 + (k % 5) * 0.28, 0.82, -0.1 + Math.floor(k / 5) * 0.25, { ink: false });
    box(g, 0.4, 0.3, 0.3, 0xa07a4a, 0.5, 0.15, 0.6, { ink: 0.015 });
  },
  cart(g) {
    box(g, 1.4, 0.3, 0.8, 0x9a6a3e, 0, 0.55, 0);
    for (const s of [-1, 1]) box(g, 1.4, 0.3, 0.06, 0x7a4e2e, 0, 0.8, s * 0.4, { ink: 0.015 });
    for (const s of [-1, 1]) mesh(g, cyl(0.32, 0.32, 0.08, 12), 0x5a3d28, -0.2, 0.32, s * 0.46, { rx: PI / 2 });
    for (const s of [-1, 1]) box(g, 0.9, 0.06, 0.06, WOOD, 1.05, 0.5, s * 0.3, { rz: -0.25, ink: 0.015 });
    mesh(g, ball(0.45, 1), 0xd9b45a, 0, 0.85, 0, { ink: 0.02 }).scale.set(1.3, 0.5, 0.8);
  },
  hay(g) {
    const h = mesh(g, cyl(0.42, 0.42, 0.85, 12), 0xd9b45a, 0, 0.42, 0, { rz: PI / 2 });
    for (const x of [-0.22, 0.22]) mesh(h, cyl(0.43, 0.43, 0.05, 12), 0xb08a3a, 0, x, 0, { ink: false });
  },
  barrels(g) {
    [[0, 0], [0.42, 0.18], [-0.1, 0.45]].forEach(([x, z], k) => {
      const b = mesh(g, cyl(0.22, 0.24, 0.58, 10), 0x8a5a32, x, 0.29, z);
      for (const y of [-0.16, 0.16]) mesh(b, cyl(0.245, 0.245, 0.04, 10), 0x3a2a1c, 0, y, 0, { ink: false });
      if (k === 2) b.scale.setScalar(0.85);
    });
  },
  crates(g) {
    box(g, 0.55, 0.55, 0.55, 0xa07a4a, 0, 0.27, 0);
    box(g, 0.5, 0.5, 0.5, 0xa07a4a, 0.5, 0.25, 0.1, { ry: 0.3 });
    box(g, 0.42, 0.42, 0.42, 0xb08a5a, 0.1, 0.76, 0.05, { ry: -0.2 });
  },
  fence(g) {
    for (let k = 0; k < 5; k++) box(g, 0.1, 0.65, 0.1, 0x8a6a48, -1.1 + k * 0.55, 0.32, 0);
    for (const y of [0.25, 0.5]) box(g, 2.3, 0.07, 0.05, 0x9a7a58, 0, y, 0, { ink: 0.015 });
  },
  lamp(g) {
    box(g, 0.1, 1.5, 0.1, 0x2a2d35, 0, 0.75, 0);
    box(g, 0.26, 0.1, 0.26, 0x2a2d35, 0, 0.05, 0);
    box(g, 0.24, 0.3, 0.24, 0xffd98a, 0, 1.62, 0, { glow: 1, ink: 0.02 });
    mesh(g, cone(0.22, 0.2, 4), 0x2a2d35, 0, 1.87, 0, { ry: PI / 4 });
  },
  bush(g) {
    mesh(g, ball(0.38, 1), 0x3f7a35, 0, 0.28, 0); mesh(g, ball(0.28, 1), 0x4a8a3c, 0.25, 0.22, 0.1); mesh(g, ball(0.24, 1), 0x356a2e, -0.22, 0.2, -0.08);
  },
  rock(g) {
    mesh(g, ball(0.42, 0), 0x8f9399, 0, 0.18, 0).scale.set(1, 0.6, 0.85);
    mesh(g, ball(0.22, 0), 0x7d8288, 0.38, 0.1, 0.12).scale.set(1, 0.7, 1);
  },
  // the ruined arch at the edge of the old woods, where the enemies come out
  arch(g) {
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) box(g, 0.55 - k * 0.04, 0.52, 0.6, k % 2 ? 0x7d8288 : 0x6e737b, s * 1.1 + (k % 2 ? 0.04 : -0.03) * s, 0.26 + k * 0.52, 0);
    box(g, 1.3, 0.4, 0.62, 0x6e737b, -0.45, 2.2, 0, { rz: 0.12 });
    box(g, 0.7, 0.35, 0.6, 0x7d8288, 0.85, 2.05, 0, { rz: -0.3 });
    for (const [x, y] of [[-1.2, 1.2], [1.0, 0.7], [-0.9, 2.3]]) box(g, 0.3, 0.12, 0.62, 0x5f8f3e, x, y, 0.01, { ink: false });
    const portal = mesh(g, new T.CircleGeometry(0.85, 32), 0x7a3bff, 0, 1.0, 0, { glow: 2, own: 1, ink: false });
    portal.scale.y = 1.25;
    anims.push(tt => { const k = 0.6 + sin(tt * 2.5) * 0.25; portal.material.opacity = k; portal.rotation.z = tt * 0.5; });
    g.userData.moving = [portal];
  },
  field(g, look, i) {
    mesh(g, new T.PlaneGeometry(4, 2.6), 0x8a6a42, 0, 0.02, 0, { rx: -PI / 2, ink: false });
    for (let r = 0; r < 6; r++) for (let k = 0; k < 9; k++) box(g, 0.22, i % 2 ? 0.34 : 0.18, 0.22, i % 2 ? 0xd8c060 : 0x7fb84a, -1.75 + k * 0.44, i % 2 ? 0.17 : 0.1, -1.05 + r * 0.42, { ink: false });
  },
};

// ---------------- merging the still scenery ----------------
// every still prop gets baked into one mesh per material (tens of meshes instead of thousands), and its shadows
// are drawn once; anything that moves (sails, water, the portal, the clock) stays a mesh of its own
function bake(root, keep) {
  root.updateMatrixWorld(true);
  const groups = new Map(), m4 = new T.Matrix4(), nm = new T.Matrix3();
  root.traverse(o => {
    if (!o.isMesh || keep.has(o)) return;
    let k = o; while (k && k !== root) { if (keep.has(k)) return; k = k.parent; }
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    m4.copy(o.matrixWorld); g.applyMatrix4(m4);
    const key = o.material.uuid;
    if (!groups.has(key)) groups.set(key, { mat: o.material, list: [] });
    groups.get(key).list.push(g);
  });
  const out = [];
  for (const { mat, list } of groups.values()) {
    let n = 0; list.forEach(g => { n += g.attributes.position.count; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    let o = 0;
    list.forEach(g => { pos.set(g.attributes.position.array, o * 3); if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; g.dispose(); });
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("normal", new T.BufferAttribute(nor, 3));
    const m = new T.Mesh(geo, mat);
    const ink = mat.side === T.BackSide;
    m.castShadow = !ink && !mat.transparent; m.receiveShadow = !ink;
    out.push(m);
  }
  return out;
}

// instanced trees (and other repeats): one mesh for the parts, one for their ink outline
const INKI = new T.MeshBasicMaterial({ color: 0x07070a, side: T.BackSide });
function instanced(parent, geo, items, ink = 1.07, shadow = true, glow = false) {
  if (!items.length) return;
  const mat = own(glow ? new T.MeshBasicMaterial({ color: 0xffffff }) : K.mat(0xffffff, 0, true)), im = new T.InstancedMesh(geo, mat, items.length), m4 = new T.Matrix4(), col = new T.Color();
  const q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), s = new T.Vector3();
  items.forEach((it, i) => {
    p.set(it.x, it.y, it.z); e.set(it.rx || 0, it.ry || 0, it.rz || 0); q.setFromEuler(e); s.set(it.sx || it.s || 1, it.sy || it.s || 1, it.sz || it.s || 1);
    m4.compose(p, q, s); im.setMatrixAt(i, m4); im.setColorAt(i, col.set(it.c).multiplyScalar(it.k || 1));
  });
  im.castShadow = shadow; im.receiveShadow = true;
  parent.add(im);
  if (!ink) return;
  const ik = new T.InstancedMesh(geo, INKI, items.length);
  items.forEach((it, i) => {
    p.set(it.x, it.y, it.z); e.set(it.rx || 0, it.ry || 0, it.rz || 0); q.setFromEuler(e);
    s.set((it.sx || it.s || 1) * ink, (it.sy || it.s || 1) * ink, (it.sz || it.s || 1) * ink);
    m4.compose(p, q, s); ik.setMatrixAt(i, m4);
  });
  parent.add(ik);
}
const GREENS = [0x4f9a3c, 0x5aa845, 0x447f35, 0x63ad4a, 0x3d7a33], PINES = [0x2f6b3a, 0x3a7a42, 0x285e33];
// a tree's parts, each stood on the ground under its trunk
function treeItems(x, z, s, kind, put) {
  const h = (0.9 + rand() * 0.3) * s;
  put("trunk", { x, y: h / 2, z, sx: s, sy: h, sz: s, c: 0x6a4a32 }, x, z);
  if (kind === "pine") {
    for (let k = 0; k < 3; k++) put("pine", { x, y: h * 0.75 + k * 0.48 * s, z, s: s * (1.15 - k * 0.27), ry: rand() * 3, c: PINES[(k + Math.abs(x * 7 | 0)) % 3] }, x, z);
  } else {
    put("leaf", { x, y: h + 0.45 * s, z, s: s * (1 + rand() * 0.2), c: GREENS[(rand() * 5) | 0] }, x, z);
    put("leaf", { x: x + 0.34 * s, y: h + 0.15 * s, z: z + 0.2 * s, s: s * 0.72, c: GREENS[(rand() * 5) | 0] }, x, z);
    put("leaf", { x: x - 0.3 * s, y: h + 0.25 * s, z: z - 0.22 * s, s: s * 0.68, c: GREENS[(rand() * 5) | 0] }, x, z);
  }
}

// ---------------- building the world ----------------
// (29 Oct, the new worlds): every board is Hollowbrook's recipe with its theme's parts (js/worlds.js): the ground and
// road colours, how the land rises outside the play area, what grows out there, how the props look, set pieces and
// weather. Pieces that repeat are instanced; KINDS gives each its geometry, outline, shadow and whether it glows
let TH = null, wx = null, texs = [], edge = null;
// (29 Oct, request: "show where the bounding box is for unit placement when you get close in red"): the edge of where
// units may stand, a red band that shows only within a few units of the cursor while placing
const EDGE_V = `varying vec2 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const EDGE_F = `uniform vec2 uC; varying vec2 vW; void main() { float a = clamp((4.5 - distance(vW, uC)) / 3.5, 0.0, 1.0); a = a * a * (3.0 - 2.0 * a); if (a < 0.01) discard; gl_FragColor = vec4(1.25, 0.22, 0.22, a * 0.95); }`;
function edgeMesh(b) {
  // where a unit's centre can actually go: the bounds less its footprint (TD.canPlace's "edge"), per Chris: "the actual
  // place where you stop being able to place any units"
  const r = TD.UNIT_R, x0 = b[0] + r, x1 = b[1] - r, z0 = b[2] + r, z1 = b[3] - r, w = 0.16, g = new T.Group();
  const mat = own(new T.ShaderMaterial({ vertexShader: EDGE_V, fragmentShader: EDGE_F, uniforms: { uC: { value: new T.Vector2() } }, transparent: true, depthWrite: false, depthTest: false })); // over trees and props
  for (const [cx, cz, sx, sz] of [[(x0 + x1) / 2, z0, x1 - x0 + w, w], [(x0 + x1) / 2, z1, x1 - x0 + w, w], [x0, (z0 + z1) / 2, w, z1 - z0 + w], [x1, (z0 + z1) / 2, w, z1 - z0 + w]]) {
    const m = new T.Mesh(new T.PlaneGeometry(sx, sz), mat); m.rotation.x = -PI / 2; m.position.set(cx, 0.06, cz); m.renderOrder = 3; g.add(m);
  }
  g.userData.mat = mat; g.visible = false;
  return g;
}
const KINDS = {
  trunk: [() => new T.CylinderGeometry(0.11, 0.16, 1, 6)], leaf: [() => new T.IcosahedronGeometry(0.62, 1)], pine: [() => new T.ConeGeometry(0.62, 0.95, 7)],
  flower: [() => new T.BoxGeometry(1, 1, 1), 0, false], tuft: [() => new T.ConeGeometry(0.06, 0.26, 3), 0, false],
};
function buildWorld() {
  const map = M.map, [x0, x1, z0, z1] = map.bounds, Wd = AF.WORLDS;
  seed = 7; anims = []; chimneys = []; smoke = []; wx = null;
  world = new T.Group(); scene.add(world);
  const outside = (x, z) => Math.max(x0 - x, x - x1, z0 - z, z - z1, 0);
  // the road carries on past where enemies start, straight back the way it came in; everything keeps clear of it
  const q0 = map.pts[0], q1 = map.pts[4], ex = q0[0] - q1[0], ez = q0[1] - q1[1], el = Math.hypot(ex, ez) || 1;
  const pts = [21, 14, 7].map(d => [q0[0] + (ex / el) * d, q0[1] + (ez / el) * d]).concat(map.pts), rmap = { pts }, rdist = (x, z) => TD.roadDist(rmap, x, z);
  const hills = TH.hills == null ? 1.6 : TH.hills;
  const baseLift = (x, z) => Math.max(0, smooth(1.5, 9, outside(x, z)) * smooth(2.5, 6, rdist(x, z)) * (0.6 + noise(x, z) * 0.9) * hills);
  const goal = map.all.find(p => p[0] === (map.goal || "hall")), gate = map.all.find(p => p[0] === "arch");
  // ...and at the other end on into the goal, under it (every goal stands 3 past the last point, facing the road)
  if (goal) {
    const L = map.pts[map.pts.length - 1], dx = goal[1] - L[0], dz = goal[2] - L[1], d = Math.hypot(dx, dz);
    if (d > 0.7 && d < 6) for (let k = 1; k <= 3; k++) { const f = (k / 3) * (1 - 0.6 / d); pts.push([L[0] + dx * f, L[1] + dz * f]); }
  }
  const still = new T.Group(), keep = new Set(), bag = {};
  // what a theme's builders get to work with
  const C = { T, K, map, world, scene, still, anims, rand, noise, smooth, outside, rdist, baseLift, pts, PROP, V, gable, emitters: [], c2: new T.Color(),
    anim: f => anims.push(f), own, tex: tx => { texs.push(tx); return tx; },
    put: (kind, it, bx = it.x, bz = it.z) => { it.bx = bx; it.bz = bz; (bag[kind] = bag[kind] || []).push(it); },
    nearGoal: (x, z, r) => !!((goal && Math.hypot(x - goal[1], z - goal[2]) < r) || (gate && Math.hypot(x - gate[1], z - gate[2]) < r * 0.6)) };
  C.tree = (x, z, s, kind) => treeItems(x, z, s, kind, C.put);
  const lift = C.lift = TH.height ? (x, z) => TH.height(x, z, C) : baseLift;
  // the ground: far bigger than the screen, flat where units stand, rising (or falling away) outside it, in patches
  const gw = 150, gd = 110, gr = TH.groundRes || 1, geo = new T.PlaneGeometry(gw, gd, Math.round(150 * gr), Math.round(110 * gr));
  geo.rotateX(-PI / 2);
  const P = geo.attributes.position, cols = new Float32Array(P.count * 3), c = new T.Color(), c2 = new T.Color(), GC = TH.ground;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i), n = noise(x, z), rd = rdist(x, z), h = lift(x, z);
    P.setY(i, h);
    c.set(GC.a).lerp(c2.set(GC.b), smooth(-0.6, 0.8, n));
    if (n < -0.45) c.lerp(c2.set(GC.low), 0.5);
    if (rd < map.roadW) c.lerp(c2.set(GC.worn), (1 - rd / map.roadW) * 0.5); // worn ground along the road
    if (TH.tint) TH.tint(c, x, z, n, rd, h, C);
    c.offsetHSL(0, 0, (rand() - 0.5) * 0.03);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    if (TH.warp) { const w = TH.warp(x, z, h, C); if (w) P.setXYZ(i, w[0], w[1], w[2]); }
  }
  geo.setAttribute("color", new T.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const gmat = own(new T.MeshToonMaterial({ vertexColors: true, gradientMap: K.mat(0x5f9f48).gradientMap }));
  const gm = new T.Mesh(geo, gmat); gm.receiveShadow = true;
  if (TH.noGround) geo.dispose(); else world.add(gm);
  // the road: a ribbon along the smoothed path (a glowing one has a thin bright edge and isn't lit)
  const RC = TH.road, rv = [], rc = [], dirtC = new T.Color(RC.dirt).multiplyScalar(RC.dirtK || 1), edgeC = new T.Color(RC.edge).multiplyScalar(RC.edgeK || 1);
  const lanes = RC.glow ? [[-1, edgeC], [-0.84, dirtC], [0.84, dirtC], [1, edgeC]] : [[-1, edgeC], [-0.45, dirtC], [0.45, dirtC], [1, edgeC]];
  if (!RC.custom) for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L, nz = dx / L, w = map.roadW / 2 * (0.94 + sin(i * 0.7) * 0.06);
    for (const [k, col] of lanes) {
      rv.push(pts[i][0] + nx * w * k, 0.03, pts[i][1] + nz * w * k); rc.push(col.r, col.g, col.b);
    }
  }
  const idx = [];
  if (!RC.custom) for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < 3; j++) {
    const a = i * 4 + j, b = a + 1, c3 = a + 4, d = a + 5;
    idx.push(a, c3, b, b, c3, d);
  }
  const rgeo = new T.BufferGeometry();
  rgeo.setAttribute("position", new T.Float32BufferAttribute(rv, 3)); rgeo.setAttribute("color", new T.Float32BufferAttribute(rc, 3));
  rgeo.setIndex(idx); rgeo.computeVertexNormals();
  const road = new T.Mesh(rgeo, own(RC.glow ? new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide })
    : new T.MeshToonMaterial({ vertexColors: true, gradientMap: gmat.gradientMap, side: T.DoubleSide })));
  road.receiveShadow = true; if (!RC.custom) world.add(road);
  // pebbles along both edges
  if (RC.pebbles) {
    const pebbles = [];
    for (let i = 2; i < pts.length; i += 2) {
      const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
      for (const s of [-1, 1]) if (rand() < 0.7) pebbles.push({ x: b[0] - (dz / L) * s * (map.roadW / 2 + 0.08), y: 0.05, z: b[1] + (dx / L) * s * (map.roadW / 2 + 0.08), s: 0.08 + rand() * 0.07, ry: rand() * 3, c: rand() < 0.5 ? RC.pebbles[0] : RC.pebbles[1] });
    }
    instanced(world, new T.IcosahedronGeometry(1, 0), pebbles, 0, false);
  }
  // the props (built in the theme's look), then the theme's set pieces
  map.all.forEach(([kind, x, z, rot = 0, sc = 1, look], i) => {
    if (kind === "tree" || kind === "pine") { C.tree(x, z, sc * 1.3, kind); return; }
    if (kind === "flowers") return;
    const build = (TH.props && TH.props[kind]) || Wd.PROP[kind] || PROP[kind];
    if (!build) return;
    const g = pivot(still, x, 0, z); g.rotation.y = rot; g.scale.setScalar(sc);
    build(g, look, i, C);
    if (g.userData.chimney) { g.updateMatrixWorld(true); chimneys.push(new T.Vector3(...g.userData.chimney).applyMatrix4(g.matrixWorld)); }
  });
  if (TH.extras) TH.extras(C);
  // what grows outside the play area, thicker the further out, kept off the road and away from the goal and gate
  if (TH.fill) for (let x = -44; x <= 44; x += 1.5) for (let z = -32; z <= 32; z += 1.5) {
    const jx = x + (rand() - 0.5) * 1.3, jz = z + (rand() - 0.5) * 1.3, o = outside(jx, jz);
    if (o < 0.6) continue;
    if (rand() > 0.25 + smooth(1, 8, o) * 0.6) continue;
    if (rdist(jx, jz) < 2.2) continue;
    if (goal && Math.hypot(jx - goal[1], jz - goal[2]) < 4.2) continue;
    if (gate && Math.hypot(jx - gate[1], jz - gate[2]) < 2.6) continue;
    TH.fill(jx, jz, o, C);
  }
  // flowers and grass tufts: lots of tiny things, no outlines, no shadows
  const FL = TH.flowers, TU = TH.tufts;
  if (FL) map.all.filter(p => p[0] === "flowers").forEach(([, x, z]) => {
    for (let k = 0; k < 16; k++) { const a = rand() * PI * 2, r = rand() * 0.9; C.put("flower", { x: x + cos(a) * r, y: 0.1, z: z + sin(a) * r, s: 0.07, c: FL[(rand() * FL.length) | 0] }); }
  });
  if (FL || TU) for (let k = 0; k < (TH.tuftN || 2600); k++) {
    const x = (rand() - 0.5) * 70, z = (rand() - 0.5) * 50;
    if (rdist(x, z) < map.roadW / 2 + 0.2) continue;
    if (k % 9 === 0 && outside(x, z) < 0.5) { if (FL) C.put("flower", { x, y: 0.08, z, s: 0.06, c: FL[(rand() * FL.length) | 0] }); continue; }
    if (TU) { if (TH.height && lift(x, z) < -0.05) continue; C.put("tuft", { x, y: 0.12, z, s: 0.8 + rand() * 0.6, ry: rand() * 3, c: rand() < 0.5 ? TU[0] : TU[1] }); }
  }
  // stand everything on the ground under its base (a tree's crown goes with its trunk), then instance it
  const KD = Object.assign({}, KINDS, Wd.KINDS);
  for (const k in bag) { for (const it of bag[k]) it.y += lift(it.bx, it.bz); }
  for (const k in bag) { const d = KD[k]; if (d) instanced(world, d[0](), bag[k], d[1] == null ? 1.07 : d[1], d[2] !== false, d[3]); }
  // bake the still props; the moving bits go back into the world as they are
  still.traverse(o => { (o.userData.moving || []).forEach(m => keep.add(m)); (o.userData.keepAnim || []).forEach(m => keep.add(m)); });
  const baked = bake(still, keep);
  keep.forEach(m => { m.updateMatrixWorld(true); world.attach(m); });
  baked.forEach(m => world.add(m));
  still.traverse(o => { if (o.isMesh && !keep.has(o) && o.geometry) o.geometry.dispose(); });
  wx = TH.weather ? TH.weather(C, V) : null;
  // placement ghost, range rings, selection ring, the soft shadow under figures
  ghost = new T.Mesh(new T.RingGeometry(TD.UNIT_R - 0.06, TD.UNIT_R + 0.02, 40), own(new T.MeshBasicMaterial({ color: 0x3fd07f, transparent: true, opacity: 0.9, depthWrite: false })));
  rangeMesh = new T.Mesh(new T.RingGeometry(0.975, 1, 96), own(new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false })));
  rangeFill = new T.Mesh(new T.CircleGeometry(1, 64), own(new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false })));
  selRing = new T.Mesh(new T.RingGeometry(0.56, 0.66, 48), own(new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })));
  for (const m of [ghost, rangeMesh, rangeFill, selRing]) { m.rotation.x = -PI / 2; m.position.y = 0.05; m.visible = false; m.renderOrder = 3; world.add(m); }
  // (2 Nov, owner: "selection able to go thru walls so that its always on top only selection not model")
  for (const m of [selRing, rangeMesh]) { m.material.depthTest = false; m.renderOrder = 30; }
  edge = edgeMesh(map.bounds); world.add(edge);
  const bc = document.createElement("canvas"); bc.width = bc.height = 64;
  const bx = bc.getContext("2d"), bg = bx.createRadialGradient(32, 32, 0, 32, 32, 32);
  bg.addColorStop(0, "rgba(0,0,0,.42)"); bg.addColorStop(0.6, "rgba(0,0,0,.2)"); bg.addColorStop(1, "rgba(0,0,0,0)");
  bx.fillStyle = bg; bx.fillRect(0, 0, 64, 64);
  blobGeo = new T.CircleGeometry(0.62, 24); blobGeo.rotateX(-PI / 2);
  blobMat = own(new T.MeshBasicMaterial({ map: C.tex(new T.CanvasTexture(bc)), transparent: true, depthWrite: false }));
}

// ---------------- camera ----------------
function fit() {
  if (!cam || !M) return;
  // frame the village (and a figure's height over it) in the part of the canvas the HUD leaves free; the world
  // carries on past every edge, so there's nothing to hide
  const [bx0, bx1, bz0, bz1] = M.map.bounds;
  // the play area's extent as a camera sees it (inv: that camera's view matrix)
  const ext = inv => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, z] of [[bx0, bz0], [bx1, bz0], [bx1, bz1], [bx0, bz1]]) for (const y of [0, 1.2]) {
      v3.set(x, y, z).applyMatrix4(inv);
      x0 = Math.min(x0, v3.x); x1 = Math.max(x1, v3.x); y0 = Math.min(y0, v3.y); y1 = Math.max(y1, v3.y);
    }
    return [x0, x1, y0, y1];
  };
  const pad = (typeof B.pad === "function" ? B.pad() : B.pad) || PAD;
  const uw = Math.max(100, W - pad.side * 2), uh = Math.max(100, H - pad.top - pad.bottom);
  // the scale is always the usual view's (a turned camera keeps its zoom), the middle is this camera's
  const [a0, a1, b0, b1] = ext(cam0.matrixWorldInverse), [x0, x1, y0, y1] = ext(cam.matrixWorldInverse);
  const k = Math.max((a1 - a0) / uw, (b1 - b0) / uh) / ((B.zoom || 1) * B.uz); // world units per pixel (zoom: the cloud reveal's push; uz: the wheel's)
  // the pan, as the view sees it
  const inv = cam.matrixWorldInverse, o = v3.set(0, 0, 0).applyMatrix4(inv), ox = o.x, oy = o.y;
  v3.set(panX, 0, panZ).applyMatrix4(inv);
  const cx = (x0 + x1) / 2 + (v3.x - ox), cy = (y0 + y1) / 2 + (v3.y - oy) - ((pad.bottom - pad.top) / 2) * k;
  cam.left = cx - (W / 2) * k; cam.right = cx + (W / 2) * k; cam.top = cy + (H / 2) * k; cam.bottom = cy - (H / 2) * k;
  cam.updateProjectionMatrix();
}
function resize() {
  if (!stage) return;
  const r = stage.getBoundingClientRect();
  W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
  gl.setSize(W, H, false);
  fxc.width = Math.round(W * DPR); fxc.height = Math.round(H * DPR);
  fit();
  if (V) V.resize(W, H);
}
// how far the view may move from the map's middle: none at the usual framing, up to the map's edges zoomed in
function clampPan() {
  if (!M) return;
  const [bx0, bx1, bz0, bz1] = M.map.bounds, f = Math.max(0, 1 - 1 / B.uz);
  const lx = ((bx1 - bx0) / 2) * f, lz = ((bz1 - bz0) / 2) * f;
  panX = Math.max(-lx, Math.min(lx, panX)); panZ = Math.max(-lz, Math.min(lz, panZ));
}
// the ground under a canvas pixel
function groundPx(px, py) {
  ray.setFromCamera({ x: (px / W) * 2 - 1, y: -(py / H) * 2 + 1 }, cam);
  return ray.ray.intersectPlane(ground, hit) ? { x: hit.x, z: hit.z } : null;
}
// after the zoom changes: the ground the wheel was turned over stays under the pointer
function zoomFit() {
  fit();
  if (zAnchor) { const g = groundPx(zAnchor.px, zAnchor.py); if (g) { panX += zAnchor.x - g.x; panZ += zAnchor.z - g.z; } }
  clampPan(); fit();
}
function onWheel(e) {
  if (!M) return;
  e.preventDefault();
  const d = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 600 : 1);
  uzTo = Math.max(1, Math.min(UZ_MAX, uzTo * Math.exp(-Math.max(-300, Math.min(300, d)) * 0.0015)));
  const r = fxc.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W, py = ((e.clientY - r.top) / r.height) * H, g = groundPx(px, py);
  zAnchor = g ? { px, py, x: g.x, z: g.z } : null;
}
// the view as it was when the match began (the Reset view button)
B.viewMoved = () => uzTo > 1.001 || Math.abs(yawTo - Math.round(yawTo / (2 * PI)) * 2 * PI) > 0.02;
B.resetView = () => {
  zAnchor = null; uzTo = 1; yawV = 0;
  yawTo = Math.round(B.yaw / (2 * PI)) * 2 * PI; // the nearest way round to the start
};
// world point to canvas pixels
function scr(x, y, z) {
  v3.set(x, y, z).project(cam);
  return [(v3.x * 0.5 + 0.5) * W, (-v3.y * 0.5 + 0.5) * H];
}

// ---------------- mounting ----------------
// stage: the element the two canvases fill; match: from TD.newMatch; h: { tick(M), event(ev), select(p), place(slot, x, z) }
B.mount = (el, match, h) => {
  B.unmount();
  stage = el; M = match; hooks = h || {}; acc = 0; B.paused = false; B.speed = 1; B.placing = null; B.selected = null;
  TH = (AF.WORLDS && AF.WORLDS[match.map.theme]) || AF.WORLDS.village;
  stage.style.background = "#" + new T.Color(TH.fog).getHexString();
  if (!gl) {
    gl = new T.WebGLRenderer({ antialias: true, alpha: false });
    gl.setPixelRatio(DPR); gl.outputColorSpace = T.SRGBColorSpace;
    gl.shadowMap.enabled = true; gl.shadowMap.type = T.PCFSoftShadowMap; gl.shadowMap.autoUpdate = false;
  }
  gl.setClearColor(TH.fog, 1);
  glc = gl.domElement; glc.className = "td-gl";
  fxc = document.createElement("canvas"); fxc.className = "td-fx"; ctx = fxc.getContext("2d");
  stage.prepend(fxc); stage.prepend(glc);
  scene = new T.Scene();
  scene.add(new T.HemisphereLight(TH.hemi[0], TH.hemi[1], TH.hemi[2]));
  const sun = new T.DirectionalLight(TH.sun[0], TH.sun[1]);
  sun.position.set(-14, 26, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 20, bottom: -20, near: 1, far: 90 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  // isometric-style, turned about 30 degrees off the village's long side and looking down at about 43 degrees
  cam = new T.OrthographicCamera(-1, 1, 1, -1, 1, 300);
  const dir = new T.Vector3(...CAM).normalize();
  cam.position.copy(dir.multiplyScalar(80)); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  // the usual view, kept for its framing; every match starts there
  cam0 = cam.clone(); cam0.updateMatrixWorld();
  B.yaw = 0; yawTo = 0; yawV = 0; orbit.on = false; B.faceCam = Math.atan2(CAM[0], CAM[2]);
  B.uz = 1; uzTo = 1; panX = 0; panZ = 0; zAnchor = null; grab.on = false;
  scene.fog = TH.fogFar ? new T.Fog(TH.fog, TH.fogNear || 82, TH.fogFar) : null;
  for (const [col, k, x, y, z, d] of TH.lights || []) { const pl = new T.PointLight(col, k, d, 1); pl.position.set(x, y, z); scene.add(pl); }
  buildWorld();
  gl.shadowMap.needsUpdate = true; // the scenery's shadows, drawn once
  if (V) { V.init(gl, scene, cam); V.bloom(...(TH.bloom || [])); }
  if (AF.usfx) AF.usfx.prep(match.team.map(tm => tm.u.k));
  if (X) X.bind({ views, world, sfx, M: () => M, label: (x, z, text, col) => fxs.push({ k: "label", x, z, text, c: col, life: 0, max: 1.4 }) });
  resize();
  ro = new ResizeObserver(resize); ro.observe(stage);
  fxc.addEventListener("pointermove", onMove);
  fxc.addEventListener("pointerleave", () => { hover = null; hoverUnit = null; });
  fxc.addEventListener("pointerdown", onDown);
  fxc.addEventListener("pointerup", onUp);
  fxc.addEventListener("pointercancel", onUp);
  fxc.addEventListener("contextmenu", e => e.preventDefault());
  fxc.addEventListener("wheel", onWheel, { passive: false });
};
B.unmount = () => {
  if (ro) { ro.disconnect(); ro = null; }
  drag = null; wx = null; rviews.clear();
  texs.forEach(tx => tx.dispose()); texs = [];
  if (V && V.on) V.dispose();
  if (X) X.unbind();
  if (scene) scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.userData.board) o.material.dispose(); });
  for (const k in pool) { pool[k].forEach(g => g.traverse(o => { if (o.geometry) o.geometry.dispose(); })); delete pool[k]; }
  views.clear(); foes.clear(); dying.length = 0; parts.length = 0; fxs.length = 0; smoke.length = 0;
  if (glc && glc.parentNode) glc.remove();
  if (fxc && fxc.parentNode) fxc.remove();
  scene = null; world = null; M = null; stage = null; hover = null;
};
B.match = () => M;
B.refit = () => fit(); // after B.zoom changes (the cloud crossing's settle)
// where a world point sits on the canvas (page callouts, and tests that click the board)
B.screenOf = (x, z, y = 0) => scr(x, y, z);
// a picture of the board as it stands (WebGL pixels read from an offscreen target, then the 2D layer on top), for
// checking the board when the page can't be looked at directly
B.snapshot = (w = 560, q = 0.6) => {
  const h = Math.round((w * H) / W), rt = new T.WebGLRenderTarget(w, h, { samples: 4 });
  rt.texture.colorSpace = T.SRGBColorSpace;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d");
  if (V && V.on) { rt.dispose(); V.render(); x.drawImage(glc, 0, 0, w, h); x.drawImage(fxc, 0, 0, w, h); return c.toDataURL("image/jpeg", q); }
  gl.setRenderTarget(rt); gl.render(scene, cam); gl.setRenderTarget(null);
  const px = new Uint8Array(w * h * 4); gl.readRenderTargetPixels(rt, 0, 0, w, h, px); rt.dispose();
  const img = x.createImageData(w, h);
  for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
  const tmp = document.createElement("canvas"); tmp.width = w; tmp.height = h; tmp.getContext("2d").putImageData(img, 0, 0);
  x.drawImage(tmp, 0, 0); x.drawImage(fxc, 0, 0, w, h);
  return c.toDataURL("image/jpeg", q);
};

// ---------------- placing and selecting ----------------
B.setPlacing = slot => { B.placing = slot; if (slot != null) B.select(null); };
B.select = p => { B.selected = p; if (hooks.select) hooks.select(p); };
function groundAt(e) {
  const r = fxc.getBoundingClientRect();
  ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, cam);
  if (!ray.ray.intersectPlane(ground, hit)) return null;
  return { x: hit.x, z: hit.z, px: e.clientX - r.left, py: e.clientY - r.top };
}
// a figure stands over the ground behind it, so a click on its body picks it before the ground
function unitAt(px, py) {
  let best = null, bd = 26 * 26;
  for (const p of M.units) {
    const [x, y] = scr(p.x, 0.75 + (p.alt || 0), p.z), d = (x - px) ** 2 + (y - py) ** 2;
    if (d < bd) { bd = d; best = p; }
    // (2 Nov, owner: "i can select units from their placement spot") its ring on the ground counts too
    const [hx, hy] = scr(p.hx ?? p.x, 0.04, p.hz ?? p.z), hd = (hx - px) ** 2 + (hy - py) ** 2;
    if (hd < bd) { bd = hd; best = p; }
  }
  return best;
}
function onMove(e) {
  if (!M) return;
  // a right (or middle) drag moves the board: the ground it was grabbed by stays under the pointer
  if (grab.on) {
    if (!grab.moved && Math.hypot(e.clientX - grab.x0, e.clientY - grab.y0) > 5) grab.moved = true;
    if (grab.moved && grab.g) {
      const r = fxc.getBoundingClientRect(), g = groundPx(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
      if (g) { panX += grab.g.x - g.x; panZ += grab.g.z - g.z; clampPan(); fit(); }
      fxc.style.cursor = "move"; hover = null; hoverUnit = null;
    }
    return;
  }
  // a drag turns the camera round the board (once it has moved a few pixels)
  if (orbit.on) {
    if (!orbit.moved && Math.abs(e.clientX - orbit.x0) > 6) orbit.moved = true;
    if (orbit.moved) {
      const now = performance.now(), d = -(e.clientX - orbit.last) * 0.0065;
      yawTo += d; yawV = d / Math.max(0.008, (now - orbit.t) / 1000);
      orbit.last = e.clientX; orbit.t = now;
      fxc.style.cursor = "grabbing"; hover = null; hoverUnit = null;
      return;
    }
  }
  hover = groundAt(e);
  hoverUnit = hover && B.placing == null ? unitAt(hover.px, hover.py) : null;
  // open ground can be grabbed and turned
  fxc.style.cursor = B.placing != null || hoverUnit ? "pointer" : "grab";
}
function onDown(e) {
  if (!M) return;
  const gp = groundAt(e); if (!gp) return;
  // right or middle: a drag moves the board; a right click that doesn't move cancels (on release)
  if (e.button === 2 || e.button === 1) {
    e.preventDefault();
    Object.assign(grab, { on: true, moved: false, x0: e.clientX, y0: e.clientY, g: { x: gp.x, z: gp.z }, btn: e.button });
    zAnchor = null;
    try { fxc.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
    return;
  }
  if (B.placing != null) {
    const ok = hooks.place && hooks.place(B.placing, gp.x, gp.z);
    if (ok && !e.shiftKey) B.setPlacing(null);
    return;
  }
  // (30 Oct) selecting waits for the release: a press that turns into a drag turns the camera instead
  if (e.button !== 0) return;
  Object.assign(orbit, { on: true, moved: false, x0: e.clientX, last: e.clientX, t: performance.now(), down: gp });
  yawV = 0;
  try { fxc.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
}
function onUp() {
  if (M && grab.on) {
    grab.on = false;
    if (!grab.moved && grab.btn === 2) { B.setPlacing(null); B.select(null); }
    fxc.style.cursor = "grab";
    return;
  }
  if (!M || !orbit.on) return;
  orbit.on = false;
  if (orbit.moved) {
    orbit.moved = false;
    // a glide when it was let go moving, none when it stopped first
    yawV = performance.now() - orbit.t > 80 ? 0 : Math.max(-5, Math.min(5, yawV));
    return;
  }
  const gp = orbit.down; orbit.down = null;
  if (!gp) return;
  const near = M.units.find(p => Math.hypot(p.x - gp.x, p.z - gp.z) < TD.UNIT_R + 0.15 || Math.hypot((p.hx ?? p.x) - gp.x, (p.hz ?? p.z) - gp.z) < TD.UNIT_R + 0.15);
  B.select(unitAt(gp.px, gp.py) || near || null);
}

// ---------------- picking a unit up and putting it down ----------------
const LIFT = 2.6, HANG = 1.55; // the grab point's height, and how far the figure hangs below it
let drag = null;
function makeDrag(slot) {
  const tm = M.team[slot], g = new T.Group(), swing = new T.Group(), holder = new T.Group();
  g.add(swing); swing.add(holder); holder.position.y = -HANG; holder.scale.setScalar(UNIT_SCALE);
  const R = AF.R3.makeRig(holder, AF.formKey(tm.u), tm.u.sh, tm.u.tr === "golden");
  if (tm.u.sh || tm.u.tr === "golden") R.root.traverse(o => { if (o.isMesh && o.material.side !== T.BackSide) o.material.userData.board = true; });
  const blob = new T.Mesh(blobGeo, blobMat); blob.renderOrder = 1;
  world.add(g); world.add(blob);
  const L = () => ({ x: 0, z: 0, vx: 0, vz: 0 });
  return { slot, u: tm.u, g, swing, holder, R, blob, pos: new T.Vector3(hover.x, LIFT, hover.z), vel: new T.Vector3(), px: 0, pz: 0, vpx: 0, vpz: 0, aL: L(), aR: L(), lL: L(), lR: L(), hd: L() };
}
function freeDrag() {
  if (!drag) return;
  if (drag.handed) { world.remove(drag.g); world.remove(drag.blob); drag = null; return; }
  drag.g.traverse(o => { if (o.geometry && o.geometry !== blobGeo) o.geometry.dispose(); if (o.material && o.material.userData.board && o.material !== blobMat) o.material.dispose(); });
  world.remove(drag.g); world.remove(drag.blob); drag = null;
}
// a floppy limb: springs toward a target that leans against how the body is swinging
function flop(l, tx, tz, dt, k = 70, c = 5) {
  l.vx += ((tx - l.x) * k - l.vx * c) * dt; l.vz += ((tz - l.z) * k - l.vz * c) * dt;
  l.x += l.vx * dt; l.z += l.vz * dt;
}
function updateDrag(dt) {
  const tm = B.placing != null && hover ? M.team[B.placing] : null;
  if (!tm) { freeDrag(); return; }
  if (!drag || drag.slot !== B.placing) { freeDrag(); drag = makeDrag(B.placing); }
  const d = drag, k = 85, c = 12.5, ty = LIFT + sin(t * 2.6) * 0.07;
  // the grab point chases the cursor on a spring
  const ax = (hover.x - d.pos.x) * k - d.vel.x * c, ay = (ty - d.pos.y) * k - d.vel.y * c, az = (hover.z - d.pos.z) * k - d.vel.z * c;
  d.vel.x += ax * dt; d.vel.y += ay * dt; d.vel.z += az * dt;
  d.pos.addScaledVector(d.vel, dt);
  d.g.position.copy(d.pos);
  d.g.rotation.y = B.faceCam + sin(t * 1.7) * 0.15;
  // the body swings under it like a pendulum, left behind by the grab's acceleration
  const gk = 9.8 / HANG, cl = v => Math.max(-0.8, Math.min(0.8, v));
  d.vpx += (-gk * sin(d.px) - 4.2 * d.vpx + Math.max(-40, Math.min(40, az)) / HANG * 0.42) * dt;
  d.vpz += (-gk * sin(d.pz) - 4.2 * d.vpz - Math.max(-40, Math.min(40, ax)) / HANG * 0.42) * dt;
  d.px = cl(d.px + d.vpx * dt); d.pz = cl(d.pz + d.vpz * dt);
  // the figure turns with the group, so the swing is put in its own frame
  const yaw = d.g.rotation.y, cy = cos(yaw), sy = sin(yaw);
  d.swing.rotation.x = d.px * cy + d.pz * sy; d.swing.rotation.z = d.pz * cy - d.px * sy;
  // ragdoll: arms, legs and head flop after the swing; a little kicking while it's carried fast
  const R = d.R, sp = Math.hypot(d.vel.x, d.vel.z), kick = Math.min(1, sp / 6);
  flop(d.aL, -d.vpx * 0.35 + sin(t * 9) * 0.25 * kick, -0.5 - d.vpz * 0.3, dt);
  flop(d.aR, -d.vpx * 0.35 - sin(t * 9) * 0.25 * kick, 0.5 - d.vpz * 0.3, dt);
  flop(d.lL, -d.vpx * 0.25 + sin(t * 11) * 0.35 * kick, -0.12 - d.vpz * 0.2, dt, 60, 4);
  flop(d.lR, -d.vpx * 0.25 - sin(t * 11) * 0.35 * kick, 0.12 - d.vpz * 0.2, dt, 60, 4);
  flop(d.hd, -d.vpx * 0.2, -d.vpz * 0.2, dt, 50, 4);
  R.root.position.y = 0; R.hips.position.y = R.hipY; R.hips.rotation.set(0, 0, 0); R.torso.rotation.set(-d.vpx * 0.08, 0, -d.vpz * 0.08);
  R.armL.rotation.set(d.aL.x, 0, d.aL.z); R.armR.rotation.set(d.aR.x, 0, d.aR.z);
  if (R.legL) { R.legL.rotation.set(d.lL.x, 0, d.lL.z); R.legR.rotation.set(d.lR.x, 0, d.lR.z); }
  R.head.rotation.set(d.hd.x, sin(t * 0.9) * 0.2, d.hd.z);
  for (const a of R.anim) a(t);
  // its shadow on the ground below, small for the height
  d.blob.position.set(d.pos.x, 0.035, d.pos.z); d.blob.scale.setScalar(0.75);
}
// letting go: the placed figure falls from where it hung, drifting onto its spot
function dropFrom(v) {
  if (!drag || drag.slot !== v.p.slot) return false;
  const d = drag, feet = Math.max(0.2, d.pos.y - HANG * cos(d.px) * cos(d.pz));
  // where its feet were, relative to the spot (the swing carries the body off the grab point)
  v.drop = { y: feet, ox: d.pos.x - v.p.x, oz: d.pos.z - v.p.z, k: 0, tx: d.swing.rotation.x, tz: d.swing.rotation.z, fy: d.g.rotation.y };
  v.born = 1;
  freeDrag();
  return true;
}

// ---------------- the Singularity tier's crowns ----------------
// (29 Oct, request: "singularity and infinity units get their own cool extra aura when placed too, like a rainbow
// crown or infinity or something"): returns the crown's per-frame tick, or null for any other trait
class Lem extends T.Curve {
  constructor(a) { super(); this.a = a; }
  getPoint(u, out = new T.Vector3()) { const s = u * PI * 2, d = 1 + sin(s) * sin(s); return out.set(this.a * cos(s) / d, this.a * sin(s) * cos(s) / d, 0); }
}
// lift: how much higher the crown or sign floats (the Defense dock lifts it over the unit's label; the floor glow stays)
function crownOf(g, p, lift = 0) {
  const id = p.u.tr, H = AF.WORLDS.hot;
  if (id !== "singular" && id !== "infinity") return null;
  const top = 2.2 + lift, col = new T.Color();
  const tint = (m, h, k) => { col.setHSL(((h % 1) + 1) % 1, 1, 0.5); m.color.copy(col).multiplyScalar(k); };
  const floor = H(g, new T.RingGeometry(0.6, 0.86, 56), 0xffffff, 1.1, 0, 0.05, 0, { rx: -PI / 2, a: 0.75, add: true, own: true });
  const halo = H(g, new T.RingGeometry(0.86, 1.35, 56), 0xffffff, 0.8, 0, 0.045, 0, { rx: -PI / 2, a: 0.18, add: true, own: true });
  floor.renderOrder = halo.renderOrder = 2;
  if (id === "singular") {
    // (30 Oct, "that ring should be a rainbow gradient that actually follows the colors of the crown ... whichever color
    // is near the gradient band, thats the color the spike on the crown gets"): the band is a rainbow round its circle
    // (hue = angle), turning inside the crown; each gem takes the band's colour right under it. The floor ring and halo
    // are the same gradient. A ring or torus lies in its own XY plane, so a vertex's angle there is its hue
    const rainbow = (m, k) => {
      const geo = m.geometry, P = geo.attributes.position, cs = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) {
        col.setHSL(((Math.atan2(P.getY(i), P.getX(i)) / (PI * 2)) % 1 + 1) % 1, 1, 0.5);
        cs[i * 3] = col.r; cs[i * 3 + 1] = col.g; cs[i * 3 + 2] = col.b;
      }
      geo.setAttribute("color", new T.BufferAttribute(cs, 3)); m.material.vertexColors = true; m.material.color.setScalar(k);
      return m;
    };
    const c = pivot(g, 0, top, 0), gems = [];
    // (rx PI/2 lays the torus flat with its angle u at (cos u, 0, sin u) in c, the gems' own angles)
    const band = rainbow(H(c, new T.TorusGeometry(0.38, 0.05, 8, 64), 0xffffff, 2, 0, 0, 0, { rx: PI / 2, own: true }), 2);
    const glow = rainbow(H(c, new T.TorusGeometry(0.38, 0.13, 8, 64), 0xffffff, 1, 0, 0.08, 0, { rx: PI / 2, a: 0.22, add: true, own: true }), 0.9);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * PI * 2, gem = H(c, new T.OctahedronGeometry(0.12, 0), 0xffffff, 2.4, cos(a) * 0.38, 0.17, sin(a) * 0.38, { own: true });
      gem.scale.y = 1.8; gems.push([gem.material, k / 8]);
    }
    rainbow(floor, 1.1); rainbow(halo, 0.8);
    return tt => {
      c.rotation.y = tt * 0.8; c.position.y = top + sin(tt * 2) * 0.04;
      // the band turns by ph of a circle inside the crown: the hue at a gem's angle a is a - ph (in turns)
      const ph = (tt * 0.25) % 1;
      band.rotation.z = glow.rotation.z = ph * PI * 2;
      for (const [m, o] of gems) tint(m, o - ph, 1.25);
      floor.rotation.z = halo.rotation.z = ph * PI * 2;
    };
  }
  // the infinity sign: a rainbow core inside a colour-shifting glow, four sparks running round it
  // (30 Oct, "should be rainbow cycling like the crown on singularity, and it should move up slightly more you cant
  // see it"): the core's colours run along it at the crown's pace, and it sits clear of the head
  const iy = top + 0.55, c = pivot(g, 0, iy, 0), lem = new Lem(0.68), pt = new T.Vector3();
  const coreGeo = new T.TubeGeometry(lem, 128, 0.05, 8, true), ring = 9, n = coreGeo.attributes.position.count;
  const cols = new Float32Array(n * 3); coreGeo.setAttribute("color", new T.BufferAttribute(cols, 3));
  const core = H(c, coreGeo, 0xffffff, 1.3, 0, 0, 0, { own: true }); core.material.vertexColors = true;
  const glow = H(c, new T.TubeGeometry(lem, 128, 0.11, 8, true), 0xffffff, 1, 0, 0, 0, { a: 0.28, add: true, own: true });
  const wide = H(c, new T.TubeGeometry(lem, 128, 0.22, 8, true), 0xffffff, 0.9, 0, 0, 0, { a: 0.08, add: true, own: true });
  const sparks = [0, 1, 2, 3].map(() => H(c, new T.OctahedronGeometry(0.09, 0), 0xffffff, 1.6, 0, 0, 0, { own: true }));
  return tt => {
    c.rotation.y = tt * 0.6; c.position.y = iy + sin(tt * 1.7) * 0.06;
    // a full rainbow along the sign (once round each loop), turning at the crown's 0.25 a second
    for (let v = 0; v < n; v++) {
      col.setHSL((((Math.floor(v / ring) / 128) * 2 - tt * 0.25) % 1 + 1) % 1, 1, 0.5);
      cols[v * 3] = col.r; cols[v * 3 + 1] = col.g; cols[v * 3 + 2] = col.b;
    }
    coreGeo.attributes.color.needsUpdate = true;
    tint(glow.material, tt * 0.25, 1); tint(wide.material, tt * 0.25 + 0.5, 0.8);
    sparks.forEach((s, i) => { s.position.copy(lem.getPoint((tt * 0.35 + i / 4) % 1, pt)); tint(s.material, tt * 0.25 + i / 4, 1.6); });
    const k = 0.5 + 0.5 * sin(tt * 2.2);
    floor.material.opacity = 0.4 + 0.35 * k; floor.scale.setScalar(1 + 0.12 * k); tint(floor.material, 0.12, 1.15);
    halo.material.opacity = 0.1 + 0.15 * k; tint(halo.material, tt * 0.2, 0.8);
  };
}
B.crown = crownOf; // (30 Oct) the Defense dock's platforms wear them too (island.js)
// ---------------- units on the board ----------------
// (2 Nov, owner: "add an outline to all the towers and make sure its always on top") Two extra draws of the cube after
// everything else, pinned to the very front of the depth range: the first writes the cube's shape with no colour, the second is a
// slightly bigger copy in the unit's rarity colour just behind that, so only its rim survives. Only the outline shows through
// walls; the model does not. Depth, not stencil: a stencil buffer on the board's target cost 60 fps down to 34 here.
function frontMost(mat, k) {
  mat.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace("#include <project_vertex>", `#include <project_vertex>\n  gl_Position.z = -gl_Position.w * ${k.toFixed(5)};`); };
  mat.customProgramCacheKey = () => "front" + k;
  return own(mat);
}
function addOutline(v) {
  const c = v.R.cube;
  if (!c) return;
  const mask = new T.Mesh(c.geometry, frontMost(new T.MeshBasicMaterial({ colorWrite: false, depthFunc: T.AlwaysDepth, depthWrite: true, transparent: true }), 0.9999));
  mask.renderOrder = 40;
  const line = new T.Mesh(c.geometry, frontMost(new T.MeshBasicMaterial({ color: RARE(AF.UNIT[v.p.u.k].rarity), depthFunc: T.LessEqualDepth, depthWrite: false, transparent: true }), 0.9998));
  line.renderOrder = 41;
  line.scale.setScalar(1.1);
  c.add(mask, line);
  v.outline = line;
}
function addView(p) {
  const g = pivot(world, p.x, 0, p.z);
  let holder, R;
  if (drag && drag.slot === p.slot && drag.u === p.u) {
    // the figure in hand becomes this unit: no new model is built on the click
    holder = drag.holder; R = drag.R; drag.swing.remove(holder); g.add(holder);
    holder.position.set(0, 0, 0); holder.rotation.set(0, 0, 0); drag.handed = true;
  } else {
    holder = pivot(g); holder.scale.setScalar(UNIT_SCALE);
    R = AF.R3.makeRig(holder, AF.formKey(p.u), p.u.sh, p.u.tr === "golden");
  }
  // a shiny figure has its own recoloured materials (makeRig clones them); those go when the unit goes
  if (p.u.sh || p.u.tr === "golden") R.root.traverse(o => { if (o.isMesh && o.material.side !== T.BackSide) o.material.userData.board = true; });
  const blob = new T.Mesh(blobGeo, blobMat); blob.position.y = 0.035; blob.renderOrder = 1; g.add(blob);
  const disc = new T.Mesh(new T.RingGeometry(0.42, 0.56, 40), own(new T.MeshBasicMaterial({ color: RARE(AF.UNIT[p.u.k].rarity), transparent: true, opacity: 0.85, depthWrite: false })));
  disc.rotation.x = -PI / 2; disc.position.y = 0.04; disc.renderOrder = 2; g.add(disc);
  if (!p.fired) p.face = B.faceCam;
  const v = { p, g, holder, R, ph: Math.random() * 30, atk: 0, face: p.face, disc, blob, rim: rimOf(p.u), born: 0 };
  if (p.s.kind === "farm") v.farm = farmProp(g, p);
  v.crown = crownOf(g, p);
  addOutline(v);
  views.set(p.id, v);
  return v;
}
// ---------------- runners ----------------
// (29 Oct) what a runner unit sends back down the road, by its shape: Doug's van, Gale's gust, Dash's spark, Grund's
// boulder, Thalor's comet, Hrimgard's glacier; a signature one is bigger
const rviews = new Map();
function runnerModel(r) {
  const A = AF.ATTACKS[r.p.u.k] || {}, c = A.c || [0xffffff, 0xcccccc, 0xffffff], g = new T.Group(), body = pivot(g), H = AF.WORLDS.hot, spin = [];
  const shape = A.shape;
  if (shape === "van") {
    box(body, 0.5, 0.42, 0.95, c[0], 0, 0.38, 0); box(body, 0.48, 0.3, 0.32, 0xf4efe2, 0, 0.4, 0.5);
    box(body, 0.44, 0.16, 0.05, 0x9fd8ff, 0, 0.47, 0.67, { glow: 1, ink: 0.015 });
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mesh(body, cyl(0.12, 0.12, 0.08, 10), 0x1a1a22, x * 0.26, 0.13, z * 0.3, { rz: PI / 2 });
    H(body, new T.BoxGeometry(0.1, 0.06, 0.03), 0xffffff, 3, 0.16, 0.36, 0.67); H(body, new T.BoxGeometry(0.1, 0.06, 0.03), 0xffffff, 3, -0.16, 0.36, 0.67);
  } else if (shape === "gust") {
    H(body, ball(0.28, 1), c[0], 1.4, 0, 0.5, 0, { a: 0.5, add: true });
    for (let k = 0; k < 2; k++) { const s2 = pivot(body, 0, 0.5, 0); H(s2, new T.TorusGeometry(0.34 + k * 0.1, 0.035, 4, 24), c[k], 1.8, 0, 0, 0, { rx: PI / 2 + k * 0.5 }); spin.push(s2); }
  } else if (shape === "volt") {
    H(body, ball(0.2, 1), 0xffffff, 3, 0, 0.5, 0); H(body, ball(0.34, 1), c[0], 1.6, 0, 0.5, 0, { a: 0.4, add: true });
    const s2 = pivot(body, 0, 0.5, 0); for (let k = 0; k < 6; k++) H(s2, new T.BoxGeometry(0.04, 0.04, 0.4), c[k % 2], 2.6, 0, 0, 0, { ry: k * 1.05, rx: 0.6 }); spin.push(s2);
  } else if (shape === "boulder") {
    const b = mesh(body, ball(0.45, 0), c[0], 0, 0.45, 0); spin.push(b); r.roll = 0.45;
    for (let k = 0; k < 3; k++) mesh(b, ball(0.12, 0), 0x6a5a4a, cos(k * 2.1) * 0.38, sin(k * 2.1) * 0.3, 0.2, { ink: 0.01 });
  } else if (shape === "comet") {
    H(body, ball(0.26, 2), 0xffffff, 3, 0, 0.55, 0); H(body, ball(0.4, 1), c[0], 1.4, 0, 0.55, 0, { a: 0.35, add: true });
    H(body, new T.ConeGeometry(0.32, 1.4, 10, 1, true), c[1], 1.8, 0, 0.55, -0.8, { rx: -PI / 2, a: 0.55, add: true });
  } else if (shape === "glacier") {
    mesh(body, ball(0.5, 0), c[0], 0, 0.42, 0, { ry: 0.5 }).scale.set(1, 0.8, 1.2);
    for (let k = 0; k < 4; k++) H(body, new T.OctahedronGeometry(0.12, 0), 0xd8f8ff, 2, cos(k * 1.6) * 0.32, 0.75, sin(k * 1.6) * 0.32).scale.y = 2.2;
  } else {
    H(body, ball(0.3, 1), c[0], 2, 0, 0.5, 0);
  }
  const blob = new T.Mesh(blobGeo, blobMat); blob.position.y = 0.035; blob.renderOrder = 1; g.add(blob);
  g.scale.setScalar(r.sig ? 1.45 : 1);
  return { g, body, spin, c, shape, puff: 0 };
}
function stepRunnerViews(dt) {
  const live = new Set();
  for (const r of M.runners || []) {
    live.add(r.id);
    let rv = rviews.get(r.id);
    if (!rv) { rv = runnerModel(r); rv.r = r; rviews.set(r.id, rv); world.add(rv.g); }
    rv.g.position.set(r.x, 0, r.z); rv.g.rotation.y = r.face;
    rv.body.position.y = rv.shape === "van" ? Math.abs(sin(t * 18)) * 0.03 : rv.shape === "gust" || rv.shape === "volt" || rv.shape === "comet" ? 0.15 + sin(t * 6) * 0.06 : 0;
    rv.spin.forEach((s2, k) => { if (rv.shape === "boulder") s2.rotation.x += (r.speed / 0.45) * dt; else s2.rotation.z += dt * (6 + k * 3); });
    // a little trail behind it
    rv.puff += dt;
    if (V && V.on && rv.puff > 0.05) {
      rv.puff = 0;
      const dust = rv.shape === "van" || rv.shape === "boulder";
      V.burst(!dust, r.x, dust ? 0.12 : 0.55, r.z, 1, dust ? { cols: [0xd8ccb4], speed: [0.2, 0.6], up: 0.4, life: [0.4, 0.7], size: [0.18, 0.4], cell: V.CELL.smoke, a: 0.45, drag: 2 }
        : { cols: [rv.c[0], rv.c[1]], speed: [0.1, 0.4], life: [0.3, 0.5], size: [0.12, 0.02], cell: V.CELL.hot, k: 2 });
    }
  }
  for (const [id, rv] of rviews) if (!live.has(id)) { world.remove(rv.g); rv.g.traverse(o => { if (o.geometry && o.geometry !== blobGeo) o.geometry.dispose(); }); rviews.delete(id); }
}
// what a runner does when it sets off, hits and is spent
function runnerFx(ev) {
  if (!V || !V.on) return;
  const A = AF.ATTACKS[ev.p.u.k] || {}, c = A.c || [0xffffff, 0xcccccc, 0xffffff], st = ev.p.s.cfg || {}, s = ev.sig ? 1.4 : 1;
  if (ev.t === "rspawn") { V.burst(true, ev.x, 0.5, ev.z, 10, { cols: [c[0], c[2]], speed: [1, 2.5], up: 1, life: [0.3, 0.5], size: [0.12, 0.02], cell: V.CELL.star, k: 1.8, spin: 4 }); V.decal(ev.x, ev.z, 0, 0.7 * s, { col: c[0], k: 1.3, dur: 0.4 }); return; }
  if (ev.t === "rend") { V.burst(false, ev.x, 0.3, ev.z, 6, { cols: [0xd8d2c4], speed: [0.3, 1], up: 0.5, life: [0.4, 0.7], size: [0.25, 0.6], cell: V.CELL.smoke, a: 0.45, drag: 2.5, spin: 1 }); return; }
  // a hit: a burst in its colours, and what it leaves
  V.burst(true, ev.x, 0.45, ev.z, 12, { cols: [c[0], c[2]], speed: [1.5, 4], up: 1.2, life: [0.25, 0.5], size: [0.14, 0.03], cell: V.CELL.hot, k: 1.8, grav: 6 });
  if (st.aoe) {
    V.decal(ev.x, ev.z, 1, st.aoe * s, { col: c[0], k: 1.2, dur: 0.8 });
    V.decal(ev.x, ev.z, 0, st.aoe * s, { col: c[0], k: 1.4, dur: 0.45 });
    V.burst(false, ev.x, 0.4, ev.z, 8, { cols: [0x6a6058, 0x8a8078], speed: [1, 2.5], up: 1.4, life: [0.5, 0.9], size: [0.3, 0.9], cell: V.CELL.smoke, a: 0.5, drag: 2, spin: 1 });
    V.shake(0.06 * s);
  } else V.decal(ev.x, ev.z, 0, 0.7, { col: c[0], k: 1.3, dur: 0.35 });
  if (st.stun || (ev.sig && st.stunSig)) V.burst(true, ev.x, 0.9, ev.z, 6, { cols: [0xffe23a, 0xffffff], speed: [0.5, 1.2], life: [0.4, 0.6], size: [0.1, 0.02], cell: V.CELL.star, k: 2, spin: 6 });
  if (st.slow) V.decal(ev.x, ev.z, 2, 0.9 * s, { col: 0xd8f6ff, k: 1.1, dur: 1.2 });
  if (!quiet) sfx(st.aoe ? "tdBoom" : "tdSlash", {}, 0.06);
}

// a farm's crate with its colour on the lid, and its coins stacked beside it (the stack grows with each upgrade)
function farmProp(g, p) {
  const f = pivot(g, 0.55, 0, 0.42), col = (AF.ATTACKS[p.u.k] || {}).c || [0xffd23a];
  f.rotation.y = 0.3;
  box(f, 0.36, 0.26, 0.3, 0x9a6a3e, 0, 0.13, 0);
  box(f, 0.38, 0.05, 0.32, col[0], 0, 0.285, 0, { ink: 0.015 });
  const stack = pivot(f, -0.34, 0, 0.12);
  for (let k = 0; k < 4; k++) mesh(stack, cyl(0.1, 0.1, 0.05, 12), 0xffc83a, (k % 2) * 0.012, 0.03 + k * 0.055, 0, { ink: 0.01 });
  f.userData.stack = stack;
  return f;
}
// a farm paying out: coins up out of the stack, the amount floating up, a small hop
function farmPaid(ev) {
  const p = ev.p, v = views.get(p.id);
  if (V && V.on) V.burst(true, p.x + 0.45, 0.5, p.z + 0.4, 14, { cols: [0xffd23a, 0xfff2a0, 0xffb02e], speed: [1.2, 3], up: 3, life: [0.5, 0.9], size: [0.12, 0.05], cell: V.CELL.star, k: 1.6, grav: 7, spin: 6 });
  fxs.push({ k: "farmcash", x: p.x, z: p.z, v: ev.cash, life: 0, max: 1.8 });
  if (v) v.born = 0.25;
  // its own payout sound (js/unitsfx.js), or the coins
  if (!(AF.usfx && AF.usfx.payout(p.u.k))) sfx("coin", { i: 6, v: 0.35 }, 0.05);
}
function dropView(v) {
  v.g.traverse(o => { if (o.geometry && o.geometry !== blobGeo) o.geometry.dispose(); if (o.material && o.material.userData.board && o.material !== blobMat) o.material.dispose(); });
  world.remove(v.g); views.delete(v.p.id);
}
// (30 Oct) a gate unit's released figure while its Release shows (tdgate.js p.relShow), built the first time it's
// needed and kept; the two swap places, so every pose below moves whichever is out
// (1 Nov) the released look of the form it's in (an evolved Søvn has his own)
const relKey = u => (AF.UNIT[AF.formKey(u) + "@rel"] ? AF.formKey(u) + "@rel" : u.k + "@rel");
function swapForm(v, on) {
  if (!v.alt) {
    const h = pivot(v.g); h.scale.setScalar(UNIT_SCALE);
    const R2 = AF.R3.makeRig(h, relKey(v.p.u), v.p.u.sh, v.p.u.tr === "golden");
    if (v.p.u.sh || v.p.u.tr === "golden") R2.root.traverse(o => { if (o.isMesh && o.material.side !== T.BackSide) o.material.userData.board = true; });
    v.alt = { holder: h, R: R2 };
  }
  const was = { holder: v.holder, R: v.R };
  v.holder = v.alt.holder; v.R = v.alt.R; v.alt = was;
  v.alt.holder.visible = false; v.holder.visible = true; v.relOn = on;
}
function poseUnit(v, dt) {
  if ((v.p.relShow > 0) !== !!v.relOn && !v.drop && AF.UNIT[v.p.u.k + "@rel"]) swapForm(v, v.p.relShow > 0);
  const R = v.R, P = R.P;
  R.atk = v.atk;
  K.animate(R, t + v.ph, P);
  // turn toward the last thing it hit, the short way round
  let d = v.p.face - v.face; d = Math.atan2(sin(d), cos(d));
  v.face += d * Math.min(1, dt * 12);
  v.g.rotation.y = v.face;
  const picked = B.selected === v.p || hoverUnit === v.p;
  v.disc.material.depthTest = !picked;
  v.disc.renderOrder = picked ? 30 : 2;
  // (2 Nov, owner: "units not moving with their hitboxes like the fig and dot") A flyer's real position moves every step, so
  // its figure has to follow every frame. It lifts off gently after landing; its shadow stays on the ground under it, and its
  // ring stays on the spot it was placed, which is also the spot that blocks building.
  if (v.p.s.fly && !v.drop) {
    const p = v.p, a = v.g.rotation.y, wx = (p.hx ?? p.x) - p.x, wz = (p.hz ?? p.z) - p.z;
    v.alt = (v.alt || 0) + ((p.alt || 0) - (v.alt || 0)) * Math.min(1, dt * 5);
    v.g.position.set(p.x, v.alt, p.z);
    v.blob.position.y = 0.035 - v.alt;
    v.disc.position.set(wx * cos(a) - wz * sin(a), 0.04 - v.alt, wx * sin(a) + wz * cos(a));
  }
  v.born = Math.min(1, v.born + dt * 4);
  if (v.crown) v.crown(t + v.ph);
  if (v.farm) v.farm.userData.stack.scale.y = 1 + v.p.lv * 0.4;
  const pop = v.born < 1 ? 1 + sin(v.born * PI) * 0.35 : 1;
  // p.sz: a figure that grows (Bjarnulf, every wave, and twice over in his Release), eased
  v.sz = (v.sz || 1) + ((v.p.sz || 1) - (v.sz || 1)) * Math.min(1, dt * 4);
  v.holder.scale.setScalar(UNIT_SCALE * pop * (1 + 0.03 * v.p.lv) * v.sz);
  v.holder.position.set(0, 0, 0); v.holder.rotation.set(0, 0, 0);
  if (v.drop) {
    // a quick eased drop: down like gravity (k squared), onto the spot and upright like a settle (ease out)
    const D = v.drop;
    D.k = Math.min(1, D.k + dt / 0.24);
    const fall = D.k * D.k, settle = 1 - Math.pow(1 - D.k, 3);
    D.y = D.y0 == null ? (D.y0 = D.y) : D.y0 * (1 - fall);
    v.g.position.set(v.p.x + D.ox * (1 - settle), D.y, v.p.z + D.oz * (1 - settle));
    v.g.rotation.x = D.tx * (1 - settle); v.g.rotation.z = D.tz * (1 - settle);
    let fy = D.fy - v.face; fy = Math.atan2(sin(fy), cos(fy)); v.g.rotation.y = v.face + fy * (1 - settle);
    R.armL.rotation.set(-0.3, 0, -1.1 * (1 - settle * 0.6)); R.armR.rotation.set(-0.3, 0, 1.1 * (1 - settle * 0.6));
    if (R.legL) { R.legL.rotation.x = 0.35 * (1 - settle); R.legR.rotation.x = -0.25 * (1 - settle); }
    if (D.k >= 1) {
      v.drop = null; v.land = 1;
      v.g.position.set(v.p.x, 0, v.p.z); v.g.rotation.x = v.g.rotation.z = 0;
      // the landing: dust, a ring, the burst a placement makes
      const [x, y] = scr(v.p.x, 0.2, v.p.z);
      burst(x, y, [css(v.rim[0]), css(v.rim[1]), "#ffffff"], 18, 200, 3, 0.6);
      fxs.push({ k: "ring", x: v.p.x, z: v.p.z, r: 0.9, c: v.rim, life: 0, max: 0.5 });
      if (V && V.on) { V.burst(false, v.p.x, 0.1, v.p.z, 10, { cols: [0xd8ccb4, 0xc8bca8], flat: true, speed: [1, 2.5], up: 0.3, life: [0.5, 0.8], size: [0.25, 0.6], cell: V.CELL.smoke, a: 0.5, drag: 3, spin: 1 }); V.decal(v.p.x, v.p.z, 0, 0.9, { col: 0xffffff, k: 1.2, dur: 0.4 }); V.shake(0.05); }
      sfx("drop", {}, 0);
    }
    return;
  }
  if (v.land > 0) {
    v.land = Math.max(0, v.land - dt * 5.5);
    const s2 = sin((1 - v.land) * PI), q = sin((1 - v.land) * PI * 2) * v.land;
    v.holder.scale.set(UNIT_SCALE * v.sz * (1 + 0.16 * s2 * v.land), UNIT_SCALE * v.sz * (1 - 0.22 * s2 * v.land + 0.06 * q), UNIT_SCALE * v.sz * (1 + 0.16 * s2 * v.land));
  }
  if (v.atk <= 0) return;
  // the attack: a swing for melee, an aimed arm and a kick back for shots, both arms up for magic
  v.atk = Math.max(0, v.atk - dt * (X ? X.decay(v.p) : 5));
  const s = 1 - v.atk, e = s * s * (3 - 2 * s), st = v.p.s.style;
  if (X && V && V.on && X.pose(v, s, e, R)) return;
  if (st === "melee") {
    R.armR.rotation.set(-2.8 + 3.3 * e, 0, 0.2); R.armL.rotation.x = 0.4 * e;
    v.holder.position.z = 0.16 * sin(PI * s);
  } else if (st === "ranged") {
    R.armR.rotation.set(-1.55, 0, 0.05); R.armL.rotation.set(-0.4, 0, -0.2);
    v.holder.position.z = -0.06 * sin(PI * s);
  } else {
    R.armR.rotation.set(-2.7 * (1 - e * 0.6), 0, 0.3); R.armL.rotation.set(-2.7 * (1 - e * 0.6), 0, -0.3);
    v.holder.position.y = 0.06 * sin(PI * s);
  }
}

// ---------------- enemies ----------------
// what comes out of the old woods; each builds about one unit tall and takes the enemy's size as its scale
const FOES = {
  mudling(g, L) {
    const b = pivot(g, 0, 0.42, 0);
    mesh(b, ball(0.5, 1), 0x7a5a3a, 0, 0, 0).scale.set(1, 0.82, 0.95);
    mesh(b, ball(0.22, 1), 0x6a4a2e, 0.28, -0.18, 0.2, { ink: 0.02 });
    for (const x of [-0.17, 0.17]) { box(b, 0.17, 0.2, 0.06, 0xffffff, x, 0.08, 0.44, { ink: false }); box(b, 0.08, 0.1, 0.03, 0x0b0d16, x, 0.06, 0.48, { ink: false }); }
    const sprout = pivot(b, 0, 0.38, 0); mesh(sprout, cone(0.07, 0.28, 4), 0x5fae4a, 0, 0.12, 0, { ink: 0.015 }); box(sprout, 0.2, 0.04, 0.1, 0x6fbe5a, 0.08, 0.22, 0, { rz: -0.4, ink: false });
    L.push(...legs(g, 0x5a4026, 0.2, 0.16));
    g.userData.anim = (w, k) => { b.scale.set(1 + sin(w * 2) * 0.06, 1 - sin(w * 2) * 0.08, 1); sprout.rotation.z = sin(w) * 0.3; };
  },
  crow(g, L) {
    const b = pivot(g, 0, 0.5, 0);
    box(b, 0.42, 0.42, 0.7, 0x1a1a22, 0, 0, 0);
    box(b, 0.36, 0.34, 0.36, 0x22222c, 0, 0.26, 0.38);
    mesh(b, cone(0.1, 0.32, 4), 0xffa02e, 0, 0.22, 0.68, { rx: PI / 2, ry: PI / 4, ink: 0.015 });
    for (const x of [-0.12, 0.12]) box(b, 0.08, 0.08, 0.04, 0xff3b4e, x, 0.33, 0.56, { glow: 1, ink: false });
    box(b, 0.3, 0.06, 0.3, 0x1a1a22, 0, 0.12, -0.45, { rx: -0.4 });
    const wings = [-1, 1].map(s => { const p = pivot(b, s * 0.22, 0.12, 0); box(p, 0.6, 0.06, 0.45, 0x2a2a36, s * 0.3, 0, 0, { ink: 0.015 }); return p; });
    L.push(...legs(g, 0xffa02e, 0.1, 0.3, 0, 0.05));
    g.userData.anim = w => { wings.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * (0.2 + Math.abs(sin(w * 2.5)) * 0.9); }); b.position.y = 0.5 + Math.abs(sin(w * 1.25)) * 0.18; };
  },
  golem(g, L) {
    const b = pivot(g, 0, 0.55, 0);
    box(b, 1.0, 0.85, 0.75, 0x7d8288, 0, 0.35, 0);
    box(b, 0.62, 0.5, 0.55, 0x8f9399, 0, 0.98, 0.04);
    for (const x of [-0.13, 0.13]) box(b, 0.12, 0.08, 0.04, 0x7fe3ff, x, 1.0, 0.33, { glow: 1, ink: false });
    for (const [x, y] of [[-0.3, 0.72], [0.25, 0.1], [0.1, 1.2]]) box(b, 0.32, 0.1, 0.3, 0x5f8f3e, x, y, 0.2, { ink: false });
    const arms = [-1, 1].map(s => { const p = pivot(b, s * 0.62, 0.6, 0); box(p, 0.32, 0.8, 0.36, 0x6e737b, 0, -0.32, 0); box(p, 0.38, 0.3, 0.4, 0x7d8288, 0, -0.75, 0.04); return p; });
    L.push(...legs(g, 0x6e737b, 0.28, 0.55, 0, 0.3));
    g.userData.anim = w => { arms.forEach((p, i) => { p.rotation.x = sin(w + i * PI) * 0.5; }); };
  },
  // the boss: a scarecrow off its post, burlap head lit from inside
  scarecrow(g, L) {
    const b = pivot(g, 0, 0.9, 0);
    box(b, 0.12, 1.4, 0.12, 0x6a4a2e, 0, -0.2, 0);
    box(b, 0.7, 0.8, 0.45, 0x6a4a2a, 0, 0.55, 0);
    for (const [x, y] of [[0.18, 0.7], [-0.2, 0.4]]) box(b, 0.22, 0.2, 0.47, 0x8a6a3a, x, y, 0, { ink: false });
    const arms = pivot(b, 0, 0.85, 0);
    box(arms, 1.9, 0.14, 0.14, 0x6a4a2e, 0, 0, 0);
    for (const s of [-1, 1]) { box(arms, 0.5, 0.36, 0.36, 0x6a4a2a, s * 0.6, -0.05, 0, { ink: 0.02 }); for (let k = 0; k < 3; k++) mesh(arms, cone(0.05, 0.3, 4), 0xd8b45a, s * (0.95 + k * 0.05), -0.12 - k * 0.04, (k - 1) * 0.08, { rz: s * PI / 2, ink: false }); }
    const head = pivot(b, 0, 1.3, 0);
    box(head, 0.6, 0.62, 0.55, 0xc9b07a, 0, 0, 0);
    for (const x of [-0.14, 0.14]) box(head, 0.12, 0.12, 0.03, 0xff8a1a, x, 0.06, 0.29, { glow: 1, ink: false });
    for (let k = 0; k < 5; k++) box(head, 0.06, 0.08 + (k % 2) * 0.05, 0.03, 0xff8a1a, -0.16 + k * 0.08, -0.16, 0.29, { glow: 1, ink: false });
    mesh(head, cyl(0.62, 0.62, 0.06, 16), 0xd8b45a, 0, 0.32, 0);
    mesh(head, cone(0.34, 0.5, 8), 0xc9a24a, 0, 0.6, 0);
    box(head, 0.7, 0.08, 0.6, 0x8a3a2a, 0, 0.38, 0, { ink: false });
    g.userData.anim = w => { b.position.y = 0.9 + Math.abs(sin(w * 0.9)) * 0.25; arms.rotation.z = sin(w * 0.9) * 0.15; head.rotation.z = sin(w * 0.45) * 0.12; };
  },
};
B.camPos = () => cam.position.clone();
B.canvas = () => gl.domElement;
B.viewOf = id => views.get(id); // for tools/soju_live.mjs
B.drawNow = () => { if (V && V.on) V.render(); else gl.render(scene, cam); }; // the same frame again, for tools/soju_live.mjs
B.FOES = FOES; // (31 Oct) the village's own enemies, for tools/lab.html
function legs(g, c, x, h, z = 0, wdt = 0.16) {
  return [-1, 1].map(s => { const l = pivot(g, s * x, h, z); box(l, wdt, h, wdt * 1.1, c, 0, -h / 2, 0); return l; });
}
function getFoe(type) {
  const list = pool[type] || (pool[type] = []);
  if (list.length) { const g = list.pop(); g.visible = true; return g; }
  const g = new T.Group(), L = [];
  (FOES[type] || AF.WORLDS.FOES[type])(g, L);
  AF.soju.foe(g, L, type);
  g.userData.legs = L;
  const blob = new T.Mesh(blobGeo, blobMat); blob.position.y = 0.035; blob.renderOrder = 1; g.add(blob);
  return g;
}
const SHELL_R = { mudling: 0.62, crow: 0.6, golem: 0.95, scarecrow: 1.15 };
function freeFoe(v) { if (v.shell) { V.unshell(v.shell); v.shell = null; } }
function addFoe(e) {
  const g = getFoe(e.type);
  g.scale.setScalar(e.def.size);
  world.add(g);
  const v = { e, g, ph: Math.random() * 6, hurt: 0, lastHp: e.hp };
  foes.set(e.id, v);
  return v;
}
function poseFoe(v, dt) {
  const e = v.e, g = v.g, w = t * e.speed * 5 + v.ph;
  g.position.set(e.x, 0, e.z);
  g.rotation.y = e.face; g.rotation.z = sin(w * 2) * 0.05;
  g.userData.legs.forEach((l, i) => { l.rotation.x = sin(w * 2 + i * PI) * 0.7; });
  if (g.userData.anim) g.userData.anim(w);
  if (V && V.on) {
    const iced = e.slowT > 0 && X && X.isSlowIce(e);
    if (iced && !v.shell) v.shell = V.shell(g, SHELL_R[e.type] || AF.WORLDS.SHELL[e.type] || 0.6);
    else if (!iced && v.shell) { V.unshell(v.shell); v.shell = null; }
    if (v.shell && Math.random() < dt * 5) V.burst(true, e.x, 0.9 * e.def.size, e.z, 1, { cols: [0xe8f8ff], speed: [0.2, 0.5], life: [0.6, 1], size: [0.07, 0.03], cell: V.CELL.star, k: 1.6, grav: 0.6, spin: 3 });
  }
  if (e.hp < v.lastHp) { v.hurt = 1; v.lastHp = e.hp; }
  v.hurt = Math.max(0, v.hurt - dt * 6);
  g.scale.setScalar(e.def.size * (1 + v.hurt * 0.12));
}

// ---------------- 2D effects ----------------
function burst(x, y, cols, n, sp = 140, size = 3, life = 0.5, grav = 260) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * PI * 2, s = sp * (0.4 + Math.random() * 0.8);
    parts.push({ x, y, vx: cos(a) * s, vy: sin(a) * s - sp * 0.3, life: 0, max: life * (0.6 + Math.random() * 0.6), c: cols[i % cols.length], s: size * (0.6 + Math.random() * 0.8), g: grav });
  }
}
// a ground circle seen from the camera
function groundRing(x, z, r, n = 40) { const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2; pts.push(scr(x + cos(a) * r, 0.05, z + sin(a) * r)); } return pts; }
function sfx(name, o, gap = 0.07) {
  if (quiet) return;
  const now = performance.now() / 1000;
  if (now - (lastSfx[name] || 0) < gap) return;
  lastSfx[name] = now; AF.sfx(name, o || {});
}
const DEATH = { mudling: ["#7a5a3a", "#5fae4a", "#a07a52"], crow: ["#1a1a22", "#3a3a4a", "#ffa02e"], golem: ["#8f9399", "#5f8f3e", "#7fe3ff"], scarecrow: ["#d8b45a", "#ff8a1a", "#6a4a2a"] };
// (29 Oct) each unit's own sounds (js/unitsfx.js): its attack, or its signature, once per attack (on the fire, or
// the beam, orbit or pet tick, spaced so a hum isn't restarted every tick), its hit where that lands. True when its
// own sound covers the event, which keeps the generic one quiet for it
let quiet = false, killT = -9, killN = 0;
const ATTACK_EV = new Set(["rspawn", "fire", "melee", "swell", "nova", "chain", "snipe", "slam", "dash", "launch", "aim", "field", "beam", "orbit", "bite"]);
const HIT_EV = new Set(["rhit", "hit", "boom", "land", "cut"]);
const TICK_GAP = { beam: 1.05, orbit: 0.7, bite: 0.25 };
function unitSound(ev, p) {
  const U = AF.usfx, k = p.u.k, kind = p.s.kind;
  if (!U) return false;
  if (ATTACK_EV.has(ev.t)) {
    const role = ev.sig && U.has(k, "sig") ? "sig" : "attack";
    if (!U.ready(k, role)) { if (U.has(k, role)) U.prep([k]); return false; }
    if (ev.t === "fire" || ev.t === "rspawn" || TICK_GAP[ev.t]) {
      const gap = role === "sig" ? 0 : TICK_GAP[ev.t] || Math.max(0.07, Math.min(0.2, p.s.spa * 0.5));
      if (t - (p._usA == null ? -9 : p._usA) >= gap && U.play(k, role, kind)) p._usA = t;
    }
    return true;
  }
  if (HIT_EV.has(ev.t)) {
    if (!U.ready(k, "hit")) return false;
    if (t - (p._usH == null ? -9 : p._usH) >= 0.09 && U.play(k, "hit", kind)) p._usH = t;
    return true;
  }
  return false;
}
function onEvent(ev) {
  quiet = !!(ev.p && ev.p.u && ev.p.s) && unitSound(ev, ev.p);
  try { onEvent1(ev); } finally { quiet = false; }
}
function onEvent1(ev) {
  if (ev.t === "farm") { farmPaid(ev); if (hooks.event) hooks.event(ev); return; }
  if (ev.t === "rspawn" || ev.t === "rhit" || ev.t === "rend") {
    if (ev.t === "rhit" && X && V && V.on && ev.p.u) X.event(ev, ev.p); // its signature plays where it hits
    runnerFx(ev); if (hooks.event) hooks.event(ev); return;
  }
  const p = ev.p, rim = p ? rimOf(p.u) : null;
  // (30 Oct) the gate units' passives and Releases (tdrel.js) see their events first
  if (AF.TDREL && V && V.on && AF.TDREL.event(ev)) { if (hooks.event) hooks.event(ev); return; }
  if (p && p.u && X && V && V.on && X.event(ev, p)) { if (hooks.event) hooks.event(ev); return; }
  if (ev.t === "fire") {
    const v = views.get(p.id); if (v) v.atk = 1;
    if (p.s.style === "ranged") sfx("tdShot");
  } else if (ev.t === "hit") {
    const [x, y] = scr(ev.x, 0.5, ev.z);
    burst(x, y, [css(rim[0]), "#ffffff"], 6, 120, 2.5, 0.35);
  } else if (ev.t === "boom") {
    fxs.push({ k: "boom", x: ev.x, z: ev.z, r: ev.r, c: rim, life: 0, max: 0.45 });
    const [x, y] = scr(ev.x, 0.3, ev.z);
    burst(x, y, [css(rim[0]), css(rim[1]), "#ffffff"], 14, 220, 3, 0.5);
    sfx("tdBoom");
  } else if (ev.t === "chain") {
    fxs.push({ k: "chain", pts: ev.pts, c: rim, life: 0, max: 0.18 });
    sfx("tdZap");
  } else if (ev.t === "melee") {
    fxs.push({ k: "slash", x: ev.x, z: ev.z, a: p.face, c: rim, life: 0, max: 0.22 });
    sfx("tdSlash");
  } else if (ev.t === "kill") {
    const v = foes.get(ev.e.id);
    if (v) { freeFoe(v); dying.push({ g: v.g, type: ev.e.type, k: 0, s: ev.e.def.size }); foes.delete(ev.e.id); }
    if (V && V.on) {
      // chunks of whatever it was made of, a puff of dust, a pop of light
      const e = ev.e, s = e.def.size, boss = e.def.boss, cols = (DEATH[e.type] || AF.WORLDS.DEATH[e.type] || ["#ffffff"]).map(c => parseInt(c.slice(1), 16));
      V.burst(false, e.x, 0.45 * s, e.z, boss ? 46 : 12, { cols, speed: [1.5, boss ? 6 : 3.6], up: boss ? 3.5 : 2.2, life: [0.45, 0.8], size: [0.14 * s, 0.1 * s], cell: V.CELL.shard, grav: 10, spin: 9 });
      V.burst(false, e.x, 0.35 * s, e.z, boss ? 20 : 6, { cols: [0xd8d2c4, 0xc2bcae], speed: [0.4, 1.2], up: 0.6, life: [0.5, 0.9], size: [0.35 * s, 0.9 * s], cell: V.CELL.smoke, a: 0.55, drag: 2.5, grav: -0.3, spin: 1 });
      V.burst(true, e.x, 0.5 * s, e.z, 1, { cols: [0xffffff], speed: [0, 0], life: [0.12, 0.12], size: [0.9 * s, 1.4 * s], cell: V.CELL.dot, k: 1.4, fixed: true });
      if (boss) { V.decal(e.x, e.z, 0, 3, { col: 0xffb04a, k: 2.4, dur: 0.7 }); V.ripple(e.x, 0.4, e.z, 0.008, 1.3); V.shake(0.45); V.flash(0xfff0d0, 0.4); }
    } else {
      const [x, y] = scr(ev.e.x, 0.45, ev.e.z);
      burst(x, y, DEATH[ev.e.type] || AF.WORLDS.DEATH[ev.e.type] || ["#ffffff"], ev.e.def.boss ? 70 : 12, ev.e.def.boss ? 380 : 160, 3.5, 0.7, 420);
    }
    fxs.push({ k: "cash", x: ev.e.x, z: ev.e.z, v: ev.cash, life: 0, max: 0.9 });
    // kills close together climb in pitch (29 Oct, "the kill sound ... should be more satisfying")
    killN = t - killT < 0.6 ? Math.min(10, killN + 1) : 0; killT = t;
    sfx("tdKill", { i: killN }, 0.035);
    if (ev.e.def.boss) { AF.fx.shake(0.6); sfx("burst", { rank: 5 }, 0); }
  } else if (ev.t === "leak") {
    const v = foes.get(ev.e.id);
    if (v) { freeFoe(v); dying.push({ g: v.g, type: ev.e.type, k: 0, s: ev.e.def.size }); foes.delete(ev.e.id); }
    fxs.push({ k: "leak", life: 0, max: 0.6 });
    sfx("error", {}, 0.25);
  } else if (ev.t === "place" || ev.t === "upgrade") {
    const v = views.get(p.id) || addView(p);
    if (ev.t === "upgrade") v.born = 0.35;
    if (ev.t === "place" && dropFrom(v)) { sfx("equip", {}, 0); if (hooks.event) hooks.event(ev); return; }
    const [x, y] = scr(p.x, 0.2, p.z);
    burst(x, y, [css(rim[0]), css(rim[1]), "#ffffff"], ev.t === "place" ? 18 : 26, 200, 3, 0.6);
    fxs.push({ k: "ring", x: p.x, z: p.z, r: 0.9, c: rim, life: 0, max: 0.5 });
    sfx(ev.t === "place" ? "equip" : "unlock", {}, 0);
  } else if (ev.t === "sell") {
    const v = views.get(p.id); if (v) dropView(v);
    if (B.selected === p) B.select(null);
    sfx("coin", { i: 4 }, 0);
  }
  if (hooks.event) hooks.event(ev);
}
function drawFx(dt) {
  const c = ctx;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.clearRect(0, 0, W, H);
  // chimney smoke, soft and slow, under everything else
  smokeAcc += dt;
  if (smokeAcc > 0.35) { smokeAcc = 0; chimneys.forEach(p => smoke.push({ x: p.x, y: p.y, z: p.z, life: 0, max: 3.2 + Math.random(), dx: 0.25 + Math.random() * 0.2 })); }
  c.globalCompositeOperation = "source-over";
  for (let i = smoke.length - 1; i >= 0; i--) {
    const q = smoke[i]; q.life += dt;
    if (q.life >= q.max) { smoke.splice(i, 1); continue; }
    const k = q.life / q.max, [x, y] = scr(q.x + q.dx * q.life, q.y + q.life * 0.55, q.z - q.dx * 0.5 * q.life);
    c.fillStyle = `rgba(235,238,242,${0.35 * Math.sin(k * PI)})`;
    c.beginPath(); c.arc(x, y, 4 + k * 12, 0, PI * 2); c.fill();
  }
  // health bars
  for (const v of foes.values()) {
    const e = v.e; if (e.hp >= e.max && !e.def.boss) continue;
    const [x, y] = scr(e.x, e.def.hb * e.def.size + 0.25, e.z), w = e.def.boss ? 80 : 28, f = Math.max(0, e.hp / e.max);
    c.fillStyle = "rgba(0,0,0,.65)"; c.fillRect(x - w / 2 - 1, y - 1, w + 2, e.def.boss ? 8 : 5);
    c.fillStyle = f > 0.5 ? "#3fd07f" : f > 0.25 ? "#ffd23a" : "#ff5a5a"; c.fillRect(x - w / 2, y, w * f, e.def.boss ? 6 : 3);
  }
  c.globalCompositeOperation = "lighter";
  // shots in flight, with a short trail
  for (const s of M.proj) {
    if (s.wave || (s.p.s.kind && V && V.on)) continue;
    const rim = rimOf(s.p.u), lob = s.kind === "splash" ? Math.sin(Math.min(1, s.life * 1.6) * PI) * 0.8 : 0;
    const pt = scr(s.x, 0.6 + lob, s.z), tr = trails.get(s) || [];
    tr.push(pt); if (tr.length > 6) tr.shift(); trails.set(s, tr);
    for (let i = 0; i < tr.length; i++) {
      const k = (i + 1) / tr.length;
      c.fillStyle = css(rim[0], 0.35 * k); c.beginPath(); c.arc(tr[i][0], tr[i][1], (s.kind === "splash" ? 6 : 4) * k, 0, PI * 2); c.fill();
    }
    const g = c.createRadialGradient(pt[0], pt[1], 0, pt[0], pt[1], s.kind === "splash" ? 12 : 8);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, css(rim[0], 0.9)); g.addColorStop(1, css(rim[1], 0));
    c.fillStyle = g; c.beginPath(); c.arc(pt[0], pt[1], s.kind === "splash" ? 12 : 8, 0, PI * 2); c.fill();
  }
  for (let i = fxs.length - 1; i >= 0; i--) {
    const f = fxs[i]; f.life += dt;
    if (f.life >= f.max) { fxs.splice(i, 1); continue; }
    const k = f.life / f.max;
    if (f.k === "boom" || f.k === "ring") {
      const pts = groundRing(f.x, f.z, f.r * (0.35 + 0.65 * Math.sqrt(k)));
      c.strokeStyle = css(f.c[0], 1 - k); c.lineWidth = (f.k === "boom" ? 4 : 2.5) * (1 - k) + 1;
      c.beginPath(); pts.forEach((q, j) => (j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); c.stroke();
      if (f.k === "boom") { c.fillStyle = css(f.c[1], 0.25 * (1 - k)); c.fill(); }
    } else if (f.k === "chain") {
      const pts = f.pts.map(([x, z], j) => scr(x, j ? 0.5 : 0.7, z));
      for (let j = 1; j < pts.length; j++) {
        const bolt = K.boltPts(pts[j - 1], pts[j], 8, 14);
        c.strokeStyle = css(f.c[0], 0.55 * (1 - k)); c.lineWidth = 6; K.strokePts(c, bolt);
        c.strokeStyle = `rgba(255,255,255,${1 - k})`; c.lineWidth = 2; K.strokePts(c, bolt);
      }
    } else if (f.k === "slash") {
      const [x, y] = scr(f.x, 0.5, f.z), r = 20 + 10 * k, a0 = -f.a - PI * 0.9 + k * 1.2;
      c.strokeStyle = css(f.c[0], 1 - k); c.lineWidth = 5 * (1 - k) + 1; c.lineCap = "round";
      c.beginPath(); c.arc(x, y, r, a0, a0 + PI * 0.9); c.stroke();
      c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, r - 3, a0 + 0.1, a0 + PI * 0.8); c.stroke();
    } else if (f.k === "cash") {
      const [x, y] = scr(f.x, 1.1, f.z);
      c.globalCompositeOperation = "source-over";
      c.font = '14px "Fredoka One", Geist, system-ui, sans-serif'; c.textAlign = "center";
      c.fillStyle = `rgba(0,0,0,${0.6 * (1 - k)})`; c.fillText("+$" + f.v, x + 1, y - k * 26 + 1);
      c.fillStyle = `rgba(125,255,168,${1 - k})`; c.fillText("+$" + f.v, x, y - k * 26);
      c.globalCompositeOperation = "lighter";
    } else if (f.k === "farmcash") {
      // (29 Oct, request: "put the money above the farms above their heads floating up and fading out"): gold, over
      // its head, easing up and fading away
      const [x, y] = scr(f.x, 2.05, f.z), up = (1 - (1 - k) * (1 - k)) * 46, a = k < 0.12 ? k / 0.12 : 1 - Math.max(0, (k - 0.45) / 0.55);
      c.globalCompositeOperation = "source-over";
      c.font = '700 19px "Fredoka One", Geist, system-ui, sans-serif'; c.textAlign = "center";
      c.lineWidth = 4; c.strokeStyle = `rgba(30,18,0,${0.75 * a})`; c.strokeText("+$" + (f.v >= 1000 ? AF.fmt(f.v) : f.v), x, y - up);
      c.fillStyle = `rgba(255,214,74,${a})`; c.fillText("+$" + (f.v >= 1000 ? AF.fmt(f.v) : f.v), x, y - up);
      c.globalCompositeOperation = "lighter";
    } else if (f.k === "label") {
      const [x, y] = scr(f.x, 2.3, f.z), a = k < 0.15 ? k / 0.15 : k > 0.7 ? (1 - k) / 0.3 : 1;
      c.globalCompositeOperation = "source-over";
      c.font = 'italic 17px "Fredoka One", Geist, system-ui, sans-serif'; c.textAlign = "center";
      c.lineWidth = 4; c.strokeStyle = `rgba(0,0,0,${0.7 * a})`; c.strokeText(f.text, x, y - k * 18);
      c.fillStyle = css(f.c, a); c.fillText(f.text, x, y - k * 18);
      c.globalCompositeOperation = "lighter";
    } else if (f.k === "leak") {
      const g = c.createRadialGradient(W, H * 0.7, 0, W, H * 0.7, W * 0.6);
      g.addColorStop(0, `rgba(255,40,60,${0.35 * (1 - k)})`); g.addColorStop(1, "rgba(255,40,60,0)");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
  }
  if (AF.TDREL) AF.TDREL.draw2d(c, scr, M, dt);
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i]; q.life += dt;
    if (q.life >= q.max) { parts.splice(i, 1); continue; }
    q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    const k = q.life / q.max;
    c.fillStyle = q.c; c.globalAlpha = 1 - k;
    c.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
}

// ---------------- each frame ----------------
B.frame = dt => {
  if (!M || !scene) return;
  t += dt;
  if (!B.paused) {
    if (M.state !== "won" && M.state !== "lost") M.played = (M.played || 0) + dt; // real seconds, for the result
    acc += dt * B.speed;
    let n = 0;
    while (acc >= STEP && n < 12) { TD.step(M, STEP); acc -= STEP; n++; }
    if (n >= 12) acc = 0;
  }
  for (const ev of M.ev) onEvent(ev);
  M.ev.length = 0;
  // the camera's glide after a drag, and the camera easing after where it's heading
  if (!orbit.on && yawV) { yawTo += yawV * dt; yawV *= Math.exp(-dt * 4.5); if (Math.abs(yawV) < 0.01) yawV = 0; }
  if (Math.abs(yawTo - B.yaw) > 1e-4) { B.yaw += (yawTo - B.yaw) * (1 - Math.exp(-dt * 9)); aim(); }
  if (Math.abs(uzTo - B.uz) > 1e-4) { B.uz += (uzTo - B.uz) * (1 - Math.exp(-dt * 12)); if (Math.abs(uzTo - B.uz) <= 1e-4) B.uz = uzTo; zoomFit(); }
  for (const a of anims) a(t);
  if (wx && V && V.on) wx(dt);
  // keep the figures in step with the match
  for (const p of M.units) if (!views.has(p.id)) addView(p);
  for (const v of views.values()) poseUnit(v, dt);
  for (const e of M.enemies) { if (e.hp > 0 && !foes.has(e.id)) addFoe(e); }
  for (const v of foes.values()) poseFoe(v, dt);
  for (let i = dying.length - 1; i >= 0; i--) {
    const d = dying[i]; d.k += dt * 5;
    if (d.k >= 1) { world.remove(d.g); d.g.visible = false; d.g.scale.setScalar(d.s); (pool[d.type] = pool[d.type] || []).push(d.g); dying.splice(i, 1); continue; }
    d.g.scale.set(d.s * (1 + d.k * 0.4), d.s * (1 - d.k), d.s * (1 + d.k * 0.4));
  }
  stepRunnerViews(dt);
  updateDrag(dt);
  // where a unit would go, its reach, the selected unit's reach
  const placing = B.placing != null ? M.team[B.placing] : null;
  if (hover && placing) {
    const why = TD.canPlace(M, hover.x, hover.z), ok = !why && M.cash >= placing.s.cost && placing.placed < TD.capOf(placing);
    ghost.visible = true; ghost.position.set(hover.x, 0.05, hover.z);
    if (edge) { edge.visible = true; edge.userData.mat.uniforms.uC.value.set(hover.x, hover.z); }
    ghost.material.color.set(ok ? 0x3fd07f : 0xff5a5a);
    showRange(hover.x, hover.z, placing.s.rng, ok ? 0xffffff : 0xff5a5a);
  } else if (B.selected && M.units.includes(B.selected)) {
    ghost.visible = false; if (edge) edge.visible = false;
    showRange(B.selected.x, B.selected.z, TD.live(B.selected).rng, 0x9fe8ff);
  } else {
    ghost.visible = false; rangeMesh.visible = rangeFill.visible = false; if (edge) edge.visible = false;
    if (B.selected) B.select(null);
  }
  selRing.visible = !!(B.selected || hoverUnit);
  const sp = B.selected || hoverUnit;
  if (sp) { selRing.position.set(sp.x, 0.05, sp.z); selRing.material.opacity = B.selected ? 0.95 : 0.5; selRing.scale.setScalar(1 + sin(t * 5) * 0.05); }
  if (X && V && V.on) X.frame(dt);
  if (AF.TDREL && V && V.on) AF.TDREL.frame(dt, M);
  if (V && V.on) { V.update(dt); V.render(); } else gl.render(scene, cam);
  drawFx(dt);
  if (hooks.tick) hooks.tick(M);
};
function showRange(x, z, r, col) {
  for (const m of [rangeMesh, rangeFill]) { m.visible = true; m.position.set(x, 0.05, z); m.scale.setScalar(r); m.material.color.set(col); }
}
B.hover = () => hover;
// (29 Oct, request: "run in the background ... at 0.5x speed in this state ... run a calculation instead of
// rendering"): off the Defense tab the match steps as numbers only. Events that only matter on screen are dropped;
// enemies that died meanwhile give their figures back to the pool. Returns the events the page cares about.
const BG_EVENTS = new Set(["leak", "won", "lost", "wave", "clear", "bonus"]);
B.background = (dt, speed = 0.5) => {
  if (!M || !scene) return [];
  if (!B.paused) {
    if (M.state !== "won" && M.state !== "lost") M.played = (M.played || 0) + dt;
    acc += dt * speed;
    let n = 0;
    while (acc >= STEP && n < 12) { TD.step(M, STEP); acc -= STEP; n++; }
    if (n >= 12) acc = 0;
  }
  const out = [];
  for (const ev of M.ev) {
    if (ev.t === "kill" || ev.t === "leak") {
      const v = foes.get(ev.e.id);
      if (v) { freeFoe(v); world.remove(v.g); v.g.visible = false; (pool[ev.e.type] = pool[ev.e.type] || []).push(v.g); foes.delete(ev.e.id); }
    }
    if (BG_EVENTS.has(ev.t)) out.push(ev);
  }
  M.ev.length = 0;
  for (const ev of out) if ((ev.t === "won" || ev.t === "lost") && hooks.event) hooks.event(ev);
  return out;
};
})();
