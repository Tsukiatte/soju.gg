/* Aura Farm interface: header, tabs, the Area with its Collect button, summon gates and reveals, the unit
   collection, the Trait Lab and its reveals, the Index, modals, toasts, and the main loop. */
(function () {
const AF = window.AF, G = AF.G, FX = AF.fx, R3 = AF.R3, fmt = AF.fmt;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const S = () => G.S;
const sfx = AF.sfx;
const UI = AF.UI = { tab: "area", sort: "income", filter: "all", q: "", page: 0, busy: false, autoSum: false, autoRoll: false, hold: 0,
  disp: 0, hist: [], hist2: [], lastN: 1, rollShows: {} };
// the 3D world (js/island.js, css/world.css): W3D is decided at boot (wide screen, a mouse, Settings), HUB is the world
let W3D = false, HUB = null, tip = null;

// ---------------- icons ----------------
const sv = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  area: AF.icon("tab:area"),
  summon: AF.icon("tab:summon"),
  units: AF.icon("tab:units"),
  traits: AF.icon("tab:traits"),
  index: sv('<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>'),
  sound: sv('<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/>'),
  mute: sv('<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="m16 9.5 5 5"/><path d="m21 9.5-5 5"/>'),
  sliders: sv('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  lock: sv('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  check: sv('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  // (30 Oct) the Merchant: a coin
  coinT: sv('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><path d="M12 9.5v5M10.5 11h3"/>'),
  // (30 Oct) the Underworld: a horned skull
  uw: sv('<path d="M5 4c0 3 1 4.5 2.6 5.2M19 4c0 3-1 4.5-2.6 5.2"/><path d="M7 11a5 5 0 0 1 10 0v3l-1.5 1.5V19h-7v-3.5L7 14Z"/><circle cx="10" cy="12.5" r="1.2"/><circle cx="14" cy="12.5" r="1.2"/><path d="M11 19v-2M13 19v-2"/>'),
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  search: sv('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  up: sv('<path d="m6 14 6-6 6 6"/>'),
  alert: sv('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h0"/>'),
  info: sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h0"/>'),
  ascend: AF.icon("tab:ascend"),
  journal: AF.icon("tab:journal"),
  defense: AF.icon("tab:defense"),
  shard: sv('<path d="M12 2.5 19 9l-7 12.5L5 9z"/><path d="M5 9h14M12 2.5 9.5 9l2.5 12.5L14.5 9z"/>'),
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.8l2.7 5.9 6.4.7-4.8 4.3 1.4 6.3L12 16.8 6.3 20l1.4-6.3-4.8-4.3 6.4-.7z"/></svg>',
};
const SHARD = '<span class="coin" aria-hidden="true">&yen;</span>';
// (30 Oct) Starlight, the Rebirth currency: a four-pointed star
const STARL = `<span class="stl-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.5 14.3 9.7 22.5 12l-8.2 2.3L12 22.5l-2.3-8.2L1.5 12l8.2-2.3z"/></svg></span>`;
const starsHTML = (n, max = 0) => Array.from({ length: max || n }, (_, i) => `<i class="${i < n ? "on" : ""}">${I.star}</i>`).join("");
const LOGO = '<canvas class="soju-logo" aria-hidden="true"></canvas>';
const COIN = '<span class="coin" aria-hidden="true">&yen;</span>';

const RANK_COLORS = r => r === 4 ? FX.RAINBOW : r === 5 ? ["#ffffff", "#9aa0aa", "#ff2a4a", "#2ee6ff"]
  : r === 6 ? ["#ffffff", "#fff2b8", "#ffd76a", "#bfefff", "#ffd0f0"]
  : r === 7 ? ["#7dffcf", "#4fb8ff", "#a07bff", "#ff7ad9", "#ffffff"]
  : r === 8 ? ["#ff6a1a", "#ffb02e", "#ff2a00", "#ffd27a", "#3a0a00"]
  : r === 9 ? ["#ffffff"].concat(FX.RAINBOW)
  : r === 10 ? ["#ffffff", "#000000", "#ffffff", "#ff3b4e", "#2ee6ff"] : [AF.RARITIES[r].color, "#ffffff"];
// gate and trait icons: game-icons.net artwork from js/icons.js (29 Oct, request: "find free good ones for them all")
const gIcon = gid => AF.icon("gate:" + gid);
const tIcon = tr => (tr ? AF.icon("trait:" + tr.id.replace(/\d$/, "")) || AF.icon("trait:astral") : "?");
// the auto reroll target: a multiplier ("this or better"), or -1 for Golden only (the farm trait)
// (30 Oct, "if you're rolling for golden if you get infinity or singularity make sure it doesnt auto reroll that")
const atTarget = t => !!t && (S().opts.stopMult === -1 ? t.id === "golden" || t.tier >= 6 : t.mult >= S().opts.stopMult);
// is this unit a Defense farm (Golden says so on its banner)
const TD_FARM = u => { const A = AF.TD && AF.TD.attackOf(AF.UNIT[u.k]); return !!(A && A.kind === "farm"); };
const traitColors = tr => tr.id === "inferno" ? ["#ff3d1a", "#ff9a3a", "#ffd23a", "#ffffff"]
  : tr.id === "golden" ? ["#ffd23a", "#fff2a8", "#e8a40c", "#ffffff"]
  : tr.id === "zenith" ? ["#ffffff", "#9feaff", "#ffe48a", "#c9a8ff"]
  : tr.id === "nebula" ? ["#8a5cff", "#ff5ad8", "#4fd8ff", "#ffffff"]
  : tr.id === "infinity" ? ["#ffffff", "#fff2b8"].concat(FX.RAINBOW) : TIER_COLORS(tr.tier);
// every trait with its own look (vis) has an x-<id> class on cards, chips and plates
const XCLS = AF.TRAITS.filter(t => t.vis).map(t => "x-" + t.id);
const xcls = tr => (tr && tr.vis ? " x-" + tr.id : "");
const TIER_COLORS = t => t === 6 ? FX.RAINBOW : t === 5 ? ["#7fe3ff", "#ffe48a", "#c9a8ff", "#ffffff"]
  : t === 4 ? ["#ff3b6b", "#8a2be2", "#ff9ab8"] : [AF.TRAIT_TIERS[Math.max(0, t)].color, "#ffffff"];
const rankOf = u => AF.RAR[AF.UNIT[u.k].rarity].order;

// ---------------- springy card tilt ----------------
const tilts = new Set();
function spring(k, d) { return { x: 0, v: 0, to: 0, k, d }; }
function stepS(s, dt) { const f = -s.k * (s.x - s.to) - s.d * s.v; s.v += f * dt; s.x += s.v * dt; }
function tilt(el) {
  const st = { el, rx: spring(170, 14), ry: spring(170, 14), l: spring(200, 15), sq: spring(420, 13) };
  el.addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    st.ry.to = ((e.clientX - r.left) / r.width - 0.5) * 20;
    st.rx.to = -((e.clientY - r.top) / r.height - 0.5) * 16;
    st.l.to = 1; tilts.add(st);
  });
  el.addEventListener("pointerleave", () => { st.rx.to = st.ry.to = st.l.to = 0; tilts.add(st); });
  el.addEventListener("pointerdown", () => { st.sq.v -= 8; tilts.add(st); });
}
function stepTilts(dt) {
  // fixed small steps: one big step per slow frame made the stiff springs blow up (cards stretched 5x and vanished)
  const n = Math.min(30, Math.ceil(dt / (1 / 240)));
  for (const st of tilts) {
    for (let i = 0; i < n; i++) for (const k of ["rx", "ry", "l", "sq"]) stepS(st[k], dt / n);
    const { rx, ry, l, sq } = st, sc = 1 + l.x * 0.04;
    st.el.style.transform = `perspective(800px) translateY(${(-l.x * 6).toFixed(2)}px) rotateX(${rx.x.toFixed(2)}deg) rotateY(${ry.x.toFixed(2)}deg) scale(${(sc * (1 - sq.x * 0.6)).toFixed(4)}, ${(sc * (1 + sq.x)).toFixed(4)})`;
    const rest = [rx, ry, l, sq].every(s => Math.abs(s.x - s.to) < 0.002 && Math.abs(s.v) < 0.002);
    if (rest && !st.l.to) { st.el.style.transform = ""; tilts.delete(st); }
  }
}

// ---------------- unit card ----------------
// everything a trait does, for the hover card and the compact lines: [what, how much]
function traitPerks(tr) {
  if (!tr) return [];
  // (29 Oct, "instead of 'defense' for all the traits, do 'atk, spa,' etc"): the stats it raises in Defense (td.js
  // TRAIT_TD); Infinity raises all three
  const b = AF.TD ? AF.TD.traitTd(tr) : {}, x = v => "×" + +v.toPrecision(3), out = [];
  if (tr.id === "infinity") out.push(["All stats", `ATK ${x(b.atk)} · SPA ${x(b.spa)} · RNG ${x(b.rng)}`]);
  else {
    if (b.atk) out.push(["ATK", x(b.atk)]);
    if (b.spa) out.push(["SPA", x(b.spa)]);
    if (b.rng) out.push(["RNG", x(b.rng)]);
  }
  if (tr.farm) out.push(["Farm pay", "×" + tr.farm]);
  if (tr.id === "infinity") out.push(["In Defense", "one on the board"]);
  return out;
}
// the compact line: everything but income (the chip or plate already shows that)
const perkLine = tr => traitPerks(tr).slice(1).map(([k, v]) => k === "In Defense" ? v[0].toUpperCase() + v.slice(1) : k === "All stats" ? `All: ${v}` : `${k} ${v}`).join(" · ");
// (30 Oct) the trait pill cut to its icon and multiplier, for the Area's nameplates
function chipMini(tr) { return tr ? `<div class="chip tt${tr.tier}${xcls(tr)}" data-tid="${tr.id}"><i class="ti">${tIcon(tr)}</i><b>${AF.traitShort(tr)}</b></div>` : ""; }
function chipHTML(tr) { return tr ? `<div class="chip tt${tr.tier}${xcls(tr)}" data-tid="${tr.id}"><i class="ti">${tIcon(tr)}</i><span>${esc(tr.name)}</span><b>${AF.traitShort(tr)}</b></div>` : ""; }
function cardEl(u, o = {}) {
  const d = AF.UNIT[(!o.index && AF.formKey(u)) || u.k], tr = !o.index ? AF.traitOf(u) : null, tier = tr ? tr.tier : -1;
  const inc = o.index ? d.base : G.income(u);
  const sh = !o.index && u.sh, st = o.index ? 1 : G.stars(u);
  const el = h(`<div class="ucard r-${d.rarity}${tier >= 3 ? " t" + tier : ""}${xcls(tr)}${sh ? " shiny" : ""}${d.evo ? " evo" : ""}${o.cls ? " " + o.cls : ""}${o.ghost ? " ghost" : ""}" ${u.uid ? `data-uid="${u.uid}"` : ""}>
    <div class="ucard-glow"></div>
    <div class="ucard-frame"><div class="ucard-in">
      <canvas class="ucard-art"></canvas>
      ${sh ? '<div class="foil"></div><div class="shtag">Shiny</div>' : ""}
      ${o.index ? "" : `<div class="ucard-lv"><b>Lv</b><span>${u.lv}</span></div>`}
      <div class="ucard-stars">${st > 1 ? starsHTML(st) : ""}</div>
      ${chipHTML(tr)}
      <div class="ucard-name">${d.evo ? '<i class="evotag">Evo</i>' : ""}<small>${AF.RAR[d.rarity].name}</small><span>${o.ghost ? "???" : esc(d.name)}</span></div>
      <div class="ucard-inc"><span>${esc(AF.skinLine(AF.UNIT[u.k]))}</span></div>
    </div></div>
    <div class="ucard-badges">${u.eq >= 0 && !o.index ? `<i class="b-eq" title="In your Area">${I.check}</i>` : ""}${u.lock ? `<i class="b-lock" title="Locked">${I.lock}</i>` : ""}</div>
  </div>`);
  el._view = R3.view(el.querySelector("canvas"), d.key, { tier: AF.traitVis(tr), hero: !!o.hero, fx: o.ghost ? false : undefined, shiny: sh, gold: !!tr && tr.id === "golden" });
  el._u = u;
  if (o.click) el.addEventListener("click", e => o.click(u, el, e));
  if (o.tilt !== false) tilt(el);
  return el;
}
function patchCard(el, u) {
  if (!el || !u) return;
  const tr = G.trait(u), tier = tr ? tr.tier : -1;
  const lv = $(".ucard-lv span", el); if (lv) lv.textContent = u.lv;
  const stb = $(".ucard-stars", el); if (stb) stb.innerHTML = G.stars(u) > 1 ? starsHTML(G.stars(u)) : "";
  
  const old = $(".chip", el); if (old) old.remove();
  if (tr) $(".ucard-in", el).insertAdjacentHTML("beforeend", chipHTML(tr));
  for (const t of [3, 4, 5, 6]) el.classList.toggle("t" + t, tier === t);
  for (const x of XCLS) el.classList.toggle(x, !!tr && "x-" + tr.id === x);
  R3.setTier(el._view, AF.traitVis(tr));
  if (el._view) el._view.gold = !!tr && tr.id === "golden"; // the gold figure the moment Golden lands
  $(".ucard-badges", el).innerHTML = `${u.eq >= 0 ? `<i class="b-eq" title="In your Area">${I.check}</i>` : ""}${u.lock ? `<i class="b-lock" title="Locked">${I.lock}</i>` : ""}`;
}
function patchAllCards(u) { $$(`.ucard[data-uid="${u.uid}"]`).forEach(el => patchCard(el, u)); }

// ---------------- toasts ----------------
function toast(msg, kind = "") {
  const t = h(`<div class="toast ${kind}"><span>${esc(msg)}</span>${kind === "bad" ? I.alert : I.info}<i class="tbar"></i></div>`);
  $("#toasts").appendChild(t);
  t.animate([{ opacity: 0, transform: "translateX(40px) scale(.9)" }, { opacity: 1, transform: "translateX(-4px) scale(1.02)", offset: 0.7 }, { opacity: 1, transform: "none" }],
    { duration: 420, easing: "cubic-bezier(.2,.9,.3,1.2)" });
  setTimeout(() => t.animate([{ opacity: 1 }, { opacity: 0, transform: "translateX(30px)" }], { duration: 260, fill: "forwards" }).onfinish = () => t.remove(), 2800);
  while ($("#toasts").children.length > 4) $("#toasts").firstElementChild.remove();
}
function broke(btn, need) { FX.nope(btn); sfx("error"); toast(`You need ${fmt(need)} ¥ for that.`, "bad"); }

// ---------------- modals ----------------
function modal(content, o = {}) {
  const back = h(`<div class="modal-back"><div class="modal ${o.cls || ""}" role="dialog" aria-modal="true"${o.style ? ` style="${o.style}"` : ""}>
    ${o.title ? `<div class="modal-head"><h2>${esc(o.title)}</h2><button class="iconbtn m-x" aria-label="Close">${I.x}</button></div>` : ""}
    <div class="modal-body"></div></div></div>`);
  $(".modal-body", back).appendChild(content);
  $("#layer").appendChild(back);
  const box = $(".modal", back);
  back.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  box.animate([{ transform: "translateY(30px) scale(.86)", opacity: 0 }, { transform: "translateY(-4px) scale(1.02)", opacity: 1, offset: 0.65 }, { transform: "none" }],
    { duration: 460, easing: "cubic-bezier(.2,.9,.3,1.15)" });
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    back.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" });
    box.animate([{ transform: "none" }, { transform: "scale(.92) translateY(10px)" }], { duration: 180, fill: "forwards" }).onfinish = () => { back.remove(); if (o.onClose) o.onClose(); };
    UI.modalClose = null;
  };
  back.addEventListener("pointerdown", e => { if (e.target === back) close(); });
  const x = $(".m-x", back); if (x) x.onclick = () => { sfx("click"); close(); };
  UI.modalClose = close;
  return close;
}
// a button you hold to confirm; fills up, then fires
// (30 Oct) UI.holding: the button being held, so a page doesn't rebuild under it; one that's gone stops, never fires
function holdButton(btn, ms, fire) {
  let t0 = 0, raf = 0, hold = 0;
  const stop = () => { hold++; cancelAnimationFrame(raf); btn.style.setProperty("--p", 0); btn.classList.remove("holding"); if (UI.holding === btn) UI.holding = null; };
  btn.addEventListener("pointerdown", e => {
    e.preventDefault(); t0 = performance.now(); btn.classList.add("holding"); UI.holding = btn;
    const my = ++hold; // a step left over from a hold that ended (let go, or a new press) does nothing
    const step = now => {
      if (my !== hold) return;
      if (!btn.isConnected) { stop(); return; }
      const k = Math.min(1, (now - t0) / ms); btn.style.setProperty("--p", k);
      if (k >= 1) { stop(); fire(); } else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, stop));
}
function confirmBox(title, text, yes, fire) {
  const body = h(`<div class="confirm"><p>${text}</p><div class="row"><button class="btn ghost c-no">Keep it</button><button class="btn c-yes">${esc(yes)}</button></div></div>`);
  const close = modal(body, { title, cls: "narrow" });
  $(".c-no", body).onclick = () => { sfx("click"); close(); };
  $(".c-yes", body).onclick = () => { close(); fire(); };
}

// ---------------- the Trait Storm (1 Nov, an easter egg) ----------------
// (1 Nov, Chris: "add an easter egg somewhere in the 3d lobby ... reroll a trait 100 times on each unit at once ... this
// is just for fun tbh, and itll go back to normal after 1 reroll of 100/200"): the windmill by the Area, spun hard
// (island.js stepMill), offers one storm: every Area unit rolls 100 times (200 with Twin Roll), free, and keeps the best
// trait it saw if that beats its own. Real odds, but not rerolls: no cost, no quests, nothing replaced for worse
const tBetter = (a, b) => !!a && (!b || a.mult > b.mult || (a.mult === b.mult && a.w < b.w));
function stormRolls(n) {
  const L = AF.TRAITS.map(t => [t, G.traitW(t)]), tot = L.reduce((s, x) => s + x[1], 0), out = [];
  for (let i = 0; i < n; i++) { let r = Math.random() * tot, pick = L[L.length - 1][0]; for (const [t, w] of L) { r -= w; if (r <= 0) { pick = t; break; } } out.push(pick); }
  return out;
}
// The clock starts when a storm starts, so opening the offer and letting it pass does not use up the day.
const STORM_EVERY = 24 * 3600 * 1000, STORM_ROLLS = 100;
const stormLeft = () => (S().stormAt || 0) + STORM_EVERY - Date.now();
function stormWaitText() {
  const left = Math.ceil(stormLeft() / 1000);
  if (left <= 0) return "The windmill is ready. Spin it up to catch a storm.";
  return `Come back in <b>${Math.floor(left / 3600)}hr ${Math.floor((left % 3600) / 60)}min ${left % 60}s</b> to spin again.`;
}
function stormWait() {
  sfx("click");
  const body = h(`<div class="confirm"><p class="storm-wait">${stormWaitText()}</p><div class="row"><button class="btn gold c-yes">OK</button></div></div>`);
  const close = modal(body, { title: "The windmill is resting", cls: "narrow" });
  const line = $(".storm-wait", body);
  const timer = setInterval(() => { if (!body.isConnected) { clearInterval(timer); return; } line.innerHTML = stormWaitText(); }, 1000);
  $(".c-yes", body).onclick = () => { sfx("click"); clearInterval(timer); close(); };
}
AF.stormOffer = () => {
  if (UI.busy || UI.modalClose || $(".storm") || $(".reveal")) return;
  // (1 Nov, "should be rerolling 1 or 2 units, 100 at once, not all units"): the unit or two in the Trait Lab
  const us = [S().opts.lab, S().opts.lab2].map(id => id && G.unit(id)).filter(Boolean), twin = G.twinRoll();
  // (2 Nov, owner: "only do the windmill thing once per day say like 'come back in _hr _ min _s to spin again' ... make it 100 rolls")
  if (stormLeft() > 0) { stormWait(); return; }
  if (!us.length) { toast("The windmill hums, but the Trait Lab is empty. Put a unit (or two) in the Lab and spin it up again."); return; }
  const names = us.map(u => `<b>${esc(AF.nameOf(u).split(",")[0])}</b>`).join(" and ");
  sfx("unlock");
  const body = h(`<div class="confirm"><p>Spun that hard, the windmill has caught a <b>trait storm</b>. ${names} in the Trait Lab get${us.length > 1 ? "" : "s"} <b>${STORM_ROLLS} rerolls at once</b>${twin ? ", every one a Twin Roll" : ""}, free, and keep${us.length > 1 ? "" : "s"} the best trait seen if it beats the one ${us.length > 1 ? "they have" : "it has"}. It blows once, then dies down.</p>
    <div class="row"><button class="btn ghost c-no">Let it pass</button><button class="btn gold c-yes">Start the storm</button></div></div>`);
  const close = modal(body, { title: "The windmill hums", cls: "narrow" });
  $(".c-no", body).onclick = () => { sfx("click"); close(); };
  $(".c-yes", body).onclick = () => { close(); traitStorm(us, twin); };
};
function traitStorm(us, twin) {
  // a running auto reroll would roll over the storm's result: it stops first
  if (UI.autoRoll) { UI.autoRoll = false; const c = $("#autoRoll"); if (c) c.checked = false; syncPills(); }
  // every reroll is made and kept up front; what follows is only the show
  G.S.stormAt = Date.now();
  const n = STORM_ROLLS, S0 = G.S, runs = us.map(u => {
    const was = AF.traitOf(u), a = stormRolls(n), b = twin ? stormRolls(n) : null, rolls = a.map((t, i) => (b && tBetter(b[i], t) ? b[i] : t));
    let best = null, bi = -1; rolls.forEach((t, i) => { if (tBetter(t, best)) { best = t; bi = i; } });
    // (2 Nov, owner: "let them choose to replace or not after rolling the windmill") Nothing changes until they choose.
    const up = tBetter(best, was);
    return { u, was, rolls, best, bi, up, k: 0, shown: null, done: false, decided: !!was && was.id === best.id, taken: false };
  });
  G.save();
  const cellCls = t => `t${t.tier}${t.vis ? " x-" + t.id : ""}`;
  const el = h(`<div class="storm" role="dialog" aria-label="Trait Storm"><div class="storm-in${runs.length > 1 ? " two" : ""}">
    <header class="storm-top"><div><small>Caught off the windmill</small><h2>Trait Storm</h2><p>${n} rerolls at once${twin ? ", every one a Twin Roll" : ""} &middot; then you choose</p></div>
      <div class="storm-n"><b>0</b><span>of ${(n * runs.length).toLocaleString("en-US")} rerolls</span></div></header>
    <div class="storm-cols">${runs.map((r, i) => `<section class="st-col" data-i="${i}">
      <div class="st-head"><canvas class="st-art"></canvas><div><b>${esc(AF.nameOf(r.u).split(",")[0])}</b><span class="st-had">${r.was ? chipHTML(r.was) : `<span class="st-none">No trait</span>`}</span></div></div>
      <div class="st-reel"></div>
      <div class="st-board">${"<i></i>".repeat(n)}</div>
      <div class="st-best"><small>Best</small><span></span><em class="st-was"></em></div></section>`).join("")}</div>
    <footer class="storm-foot"><p class="storm-sum">The storm is rolling&hellip;</p><button class="btn gold" id="stDone">Skip</button></footer></div></div>`);
  document.body.appendChild(el);
  const cols = $$(".st-col", el), cnt = $(".storm-n b", el);
  cols.forEach((c, i) => { const u = runs[i].u; runs[i].cells = $$(".st-board i", c); runs[i].view = R3.view($(".st-art", c), AF.formKey(u), { tier: AF.traitVis(runs[i].was), fx: false, shiny: !!u.sh, gold: u.tr === "golden" }); });
  const t0 = performance.now();
  let skip = false, finished = false, flareT = 0, raf = 0;
  const finish = () => {
    finished = true;
    const ups = runs.filter(r => r.up), done = $("#stDone", el), sum = $(".storm-sum", el);
    const settled = () => {
      if (runs.some(r => !r.decided)) { done.hidden = true; return; }
      done.hidden = false; done.textContent = "Done";
      sum.textContent = runs.some(r => r.taken) ? "Trait replaced." : "Nothing changed.";
    };
    sum.textContent = `Choose for ${runs.length > 1 ? "each unit" : "this unit"}: take the best roll, or keep what it has.`;
    runs.forEach((r, i) => {
      const C = cols[i];
      if (r.decided) { $(".st-was", C).textContent = "rolled what it already has"; return; }
      const box = h(`<div class="st-choice"><button class="btn gold st-take">Replace with ${esc(r.best.name)}</button><button class="btn ghost st-keep">Keep ${r.was ? esc(r.was.name) : "no trait"}</button></div>`);
      C.appendChild(box);
      $(".st-take", box).onclick = () => {
        const u = r.u, st = G.S.stats;
        u.tr = r.best.id; delete u.dbl; delete u.tw;
        st.bestTier = Math.max(st.bestTier, r.best.tier); st.bestMult = Math.max(st.bestMult || 0, r.best.mult);
        r.decided = r.taken = true;
        if (r.view) R3.setTier(r.view, AF.traitVis(r.best));
        $(".st-was", C).textContent = `replaced ${r.was ? r.was.name : "no trait"}`;
        box.remove(); sfx("win"); G.save(); settled();
      };
      $(".st-keep", box).onclick = () => {
        r.decided = true;
        $(".st-reel", C).innerHTML = chipHTML(r.was) || `<span class="st-none">No trait</span>`;
        $(".st-was", C).textContent = "kept its own";
        box.remove(); sfx("click"); settled();
      };
    });
    settled();
    sfx(ups.length ? "win" : "click");
  };
  const close = () => {
    cancelAnimationFrame(raf); removeEventListener("keydown", key);
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }).onfinish = () => el.remove();
    runs.forEach(r => { if (r.taken) patchAllCards(r.u); });
    if (UI.tab === "traits") renderLab();
    refresh();
  };
  const key = e => { if (e.key === "Escape" && finished && runs.every(r => r.decided)) close(); };
  addEventListener("keydown", key);
  $("#stDone", el).onclick = () => { sfx("click"); if (finished) close(); else skip = true; };
  const tick = () => {
    const now = performance.now(); let total = 0, all = true;
    runs.forEach((r, i) => {
      const C = cols[i], p = skip ? 1 : Math.max(0, Math.min(1, (now - t0 - i * 120) / 4500));
      const k = Math.min(n, Math.floor(n * (1 - Math.pow(1 - p, 2.2))));
      for (; r.k < k; r.k++) {
        const t = r.rolls[r.k], cell = r.cells[r.k];
        cell.className = cellCls(t); cell.title = t.name;
        if (tBetter(t, r.shown)) {
          r.shown = t; $(".st-best span", C).innerHTML = chipHTML(t);
          if (r.bestCell) r.bestCell.classList.remove("best"); cell.classList.add("best"); r.bestCell = cell;
          if (t.tier >= 4 && !skip) { C.classList.remove("hit"); void C.offsetWidth; C.classList.add("hit"); C.style.setProperty("--hc", ["", "", "", "#ffb02e", "#ff3b6b", "#7fe3ff", "#ffffff"][t.tier]); if (now - flareT > 160) { flareT = now; sfx("unlock"); } }
        }
      }
      if (r.k && !r.done) $(".st-reel", C).innerHTML = chipHTML(r.rolls[r.k - 1]);
      total += r.k;
      if (p >= 1 && !r.done) {
        r.done = true; C.classList.add("done", r.up ? "up" : "kept");
        $(".st-reel", C).innerHTML = chipHTML(r.best);
        $(".st-was", C).textContent = `now ${r.was ? r.was.name : "no trait"}`;
      }
      if (!r.done) all = false;
    });
    cnt.textContent = total.toLocaleString("en-US");
    if (all) { finish(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

// ---------------- shell ----------------
const TABS = [["area", "Crew", I.area], ["summon", "Summon", I.summon], ["units", "Units", I.units], ["traits", "Trait Lab", I.traits],
  ["journal", "Journal", I.journal], ["defense", "Defense", I.defense]];
function buildShell() {
  $("#app").innerHTML = `
  <header class="top">
    <div class="brand">${LOGO}<div><b>Picnic Patrol</b><small>v0.1</small></div></div>
    <div class="wallet">
      <div class="bal" id="bal">${COIN}<span id="balN">0</span></div>
      <div class="rate"><b id="rateN">+0</b><span>&yen;/s</span></div>
      <div class="shards" id="shardChip" title="Aura Shards">${SHARD}<b id="shardN">0</b></div>
      <div class="shards stl" id="stlChip" title="Starlight" hidden>${STARL}<b id="stlN">0</b></div>
      <div class="surgechip" id="surgeChip" title="Aura Surge" hidden><b>&times;2</b><span id="surgeT">0s</span></div>
    </div>
    <div class="top-act">
      <div class="vol"><button class="iconbtn" id="bSound" aria-label="Sound"></button>
        <input type="range" id="vol" min="0" max="100" step="1" aria-label="Volume"></div>
      <button class="iconbtn jr-btn" id="bJr" aria-label="Journal" title="Journal">${I.journal}<em class="jr-dot" id="dot-jr" hidden></em></button>
      <button class="iconbtn" id="bCfg" aria-label="Settings">${I.sliders}</button>
    </div>
  </header>
  <nav class="tabs" id="tabs"><i class="tab-ind" id="tabInd"></i>${TABS.map(([id, n, ic], i) =>
    `<button class="tab" data-tab="${id}" title="${n} (${i + 1})">${ic}<span>${n}</span><em class="dot" id="dot-${id}" hidden></em></button>`).join("")}<button class="tab tab-mr" data-tab="relics" title="Merchant">${I.coinT}<span>Merchant</span></button><button class="tab tab-uw" data-tab="evolve" title="Underworld" hidden>${I.uw}<span>Underworld</span></button></nav>
  <main id="main">${TABS.map(([id]) => `<section class="page" id="p-${id}" hidden></section>`).join("")}<section class="page" id="p-relics" hidden></section><section class="page" id="p-evolve" hidden></section></main>`;
  // in 3D these two pages are panels that scroll under their own header (css/world.css; nothing changes in 2D)
  for (const id of ["units", "journal"]) $("#p-" + id).classList.add("w3-scroll", "w3-box");
  $$(".tab").forEach(b => b.addEventListener("click", () => { sfx("tab"); go(b.dataset.tab); }));
  $("#bSound").onclick = () => { S().opts.sound = !S().opts.sound; syncSound(); sfx("click"); G.save(); };
  $("#bCfg").onclick = () => { sfx("click"); openSettings(); };
  $("#bJr").onclick = () => { sfx("tab"); go("journal"); };
  wireVolume($("#vol"));
  syncSound();
}
// (28 Oct, request: "add a volume slider"): header and Settings sliders share opts.volume
function wireVolume(inp) {
  inp.value = Math.round((S().opts.volume === undefined ? 0.7 : S().opts.volume) * 100);
  inp.style.setProperty("--v", inp.value + "%");
  let tickT = 0;
  inp.addEventListener("input", () => {
    S().opts.volume = inp.value / 100;
    inp.style.setProperty("--v", inp.value + "%");
    if (!S().opts.sound && inp.value > 0) { S().opts.sound = true; syncSound(); }
    FX.setVolume();
    $$('input[type="range"].volr, #vol').forEach(o => { if (o !== inp) { o.value = inp.value; o.style.setProperty("--v", inp.value + "%"); } });
    const now = performance.now(); if (now - tickT > 90) { tickT = now; sfx("tick", { i: inp.value / 8 }); }
  });
  inp.addEventListener("change", () => G.save());
}
function syncSound() {
  const b = $("#bSound"), on = S().opts.sound;
  b.innerHTML = on ? I.sound : I.mute; b.classList.toggle("off", !on);
  b.setAttribute("aria-label", on ? "Sound on" : "Sound off"); b.title = on ? "Sound on" : "Sound off";
  const v = $("#vol"); if (v) v.classList.toggle("off", !on);
}
// the sliding tab highlight; measured again once the web font lands, since tab widths change with it
function placeInd() {
  const on = $(`.tab[data-tab="${UI.tab}"]`), ind = $("#tabInd");
  if (!on || !ind) return;
  ind.style.left = on.offsetLeft + "px"; ind.style.width = on.offsetWidth + "px";
}
if (document.fonts) document.fonts.ready.then(placeInd);
addEventListener("resize", placeInd);
// (30 Oct, "switching from one tab to an active dungeon should play the cloud animation, just much faster"): to or from
// the Defense tab while a match is on, a quick cloud crossing covers the swap between the world and the board
let crossing = null;
function go(tab) {
  if (UI.busy && tab !== UI.tab) return;
  if (crossing) { crossing.next = tab; return; } // the clouds are coming in: the switch goes to the latest pick
  const M = AF.Defense && AF.Defense.match;
  // (30 Oct, "the camera move ... to the underworld should move the camera down, like its going to hell, and flip upside
  // down"): the dive (island.js HUB.dive) with the interface faded out for the trip
  // (1 Nov, "he tried to go to the underworld from here and now theres no ui"): the dive runs on the island's frames,
  // which stop while a match has the screen, so a trip between a running match and the Underworld takes the dark crossing
  const matchTrip = !!M && (tab === "defense" || UI.tab === "defense");
  if (W3D && HUB.dive && !matchTrip && tab !== UI.tab && (tab === "evolve" || UI.tab === "evolve") && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const c = crossing = { next: tab };
    document.body.classList.add("uw-dive");
    HUB.dive(tab === "evolve" ? "down" : "up", () => { crossing = null; goNow(c.next); }, () => document.body.classList.remove("uw-dive"))
      .finally(() => { if (crossing === c) { crossing = null; goNow(c.next); } document.body.classList.remove("uw-dive"); });
    return;
  }
  // reduced motion (and a running match's trips): the quick dark crossing
  if (W3D && AF.clouds && tab !== UI.tab && (tab === "evolve" || UI.tab === "evolve")) {
    const c = crossing = { next: tab };
    AF.clouds.swap({ speed: 1.6, soft: true, dark: true, cover: () => { crossing = null; goNow(c.next); if (HUB.jump) HUB.jump(c.next); } })
      .finally(() => { if (crossing === c) { crossing = null; goNow(c.next); } });
    return;
  }
  if (W3D && M && AF.clouds && tab !== UI.tab && (tab === "defense" || UI.tab === "defense") && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const th = tab === "defense" && AF.WORLDS && AF.WORLDS[M.map.theme], c = crossing = { next: tab };
    AF.clouds.swap({ speed: 2.2, soft: true, tint: th ? "#" + new THREE.Color(th.fog).getHexString() : null, cover: () => { crossing = null; goNow(c.next); if (HUB.jump) HUB.jump(c.next); } })
      .finally(() => { if (crossing === c) { crossing = null; goNow(c.next); } });
    return;
  }
  goNow(tab);
}
function goNow(tab) {
  if (UI.busy && tab !== UI.tab) return;
  // leaving mid-reveal closes it; the automation itself keeps going
  // (a reveal for a target you were waiting on is locked: it stays until you click it)
  if (UI.abortReveal && !UI.lockReveal && tab !== UI.tab) UI.abortReveal();
  UI.tab = tab;
  $$(".tab").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  if (tab === "summon") $("#dot-summon").hidden = true;
  placeInd();
  $$(".page").forEach(p => { p.hidden = p.id !== "p-" + tab; });
  const dock = $("body > .dock"); if (dock) dock.hidden = tab !== "area" || W3D;
  const page = $("#p-" + tab);
  PAGES[tab]();
  if (W3D) { if (tip) tip.hidden = true; HUB.go(tab); sync3d(); popIn(page, tab); }
  else page.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.9,.3,1)" });
  syncPills();
  if (AF.Defense) AF.Defense.onTab();
}
// (29 Oct, request: "I'd rather it show nothing until it's all loaded, then pop in at once with an animation"): in 3D a
// tab's page stays out of sight until it has been painted (at 1% opacity: at 0 a browser may skip painting it) and its
// unit cards on screen have drawn, at most 450 ms, then the page and the Area's dock pop in together. translate and
// scale, not transform: the dock is centred with a transform of its own
let popN = 0;
async function popIn(page, tab) {
  const n = ++popN, t0 = performance.now(), dock = tab === "area" && $("body > .dock");
  page.getAnimations().forEach(a => a.cancel());
  page.style.opacity = "0.01"; page.inert = true;
  await Promise.all([document.fonts.ready, ...$$("img", page).map(i => i.decode().catch(() => {}))]);
  for (let f = 0; ; f++) {
    await new Promise(r => requestAnimationFrame(r));
    if (n !== popN) { page.style.opacity = ""; page.inert = false; return; } // another tab was picked meanwhile
    const waiting = $$(".ucard", page).some(c => c._view && c._view.visible && c._view.lt === undefined);
    if ((f >= 2 && !waiting) || performance.now() - t0 > 450) break;
  }
  page.style.opacity = ""; page.inert = false;
  if (dock) dock.hidden = false;
  for (const el of dock ? [page, dock] : [page]) el.animate([{ opacity: 0, translate: "0 22px", scale: ".97" }, { opacity: 1, translate: "0 -3px", scale: "1.006", offset: 0.65 }, { opacity: 1, translate: "0 0", scale: "1" }],
    { duration: 440, easing: "cubic-bezier(.2,.9,.3,1.1)" });
}
// a Defense match shows the flat layout over a hidden world (the board is a 3D scene of its own)
// (29 Oct, request: the match "should become the same 3d view like every other tab"): a match on the Defense tab keeps
// the 3D interface (w3d) and adds w3m, which hides the island (not drawn meanwhile) for the board's full-screen layer
function sync3d() { if (!W3D) return; document.body.classList.add("w3d"); document.body.classList.toggle("w3m", !!(UI.tab === "defense" && AF.Defense && AF.Defense.match)); }

// ---------------- Area ----------------
let slotSig = "";
function pageArea() {
  const p = $("#p-area");
  if (!p.firstChild) {
    const dock = `<div class="dock">
      <div class="vault"><span>Ready to collect</span><b id="pendN">0</b><em id="pendR">+0/s</em></div>
      <button class="collect" id="bCollect"><span class="c-face"><span class="c-t">Collect</span><span class="c-s">Space, from any tab</span></span></button>
    </div>`;
    // in 3D the plots are in the world; (29 Oct, "redesign the your area box dont use a box like that"): no panel, a
    // label, the income large, the plots line, the buttons and switches straight over the world
    p.innerHTML = W3D ? `
    <div class="w3-panel w3-ahud">
      <span class="td-kicker">Your Crew</span><p class="crew-note">Your rarest skins stand here. Win in Defense to earn &yen;, then spin the gates for more.</p>
      <div class="ah-inc">${COIN}<b id="aRate">0</b><span>&yen; a second</span></div>
      <div class="ah-sub"><span id="aSlots"></span><i></i><span id="aNext"></span></div>
      <div class="ah-acts"><button class="btn ghost sm" id="bBest">Show best</button><button class="btn ghost sm" id="bOff">Take all out</button><button class="btn sm" id="bPlot" hidden></button></div>
      <div class="ah-autos" id="autos"></div>
    </div>${dock}` : `
    <div class="area-top">
      <div><h1>Your Crew</h1><p class="lede">Your rarest skins stand here. Win in Defense to earn &yen;, then spin the gates for more.</p></div>
      <div class="area-stats">
        <div class="stat"><span>Income</span><b id="aRate">0</b></div>
        <div class="stat"><span>Slots</span><b id="aSlots">3/12</b></div>
      </div>
      <button class="btn ghost" id="bBest">Equip best</button>
    </div>
    <div class="autos" id="autos"></div>
    <div class="slots" id="slots"></div>${dock}`;
    if (W3D) {
      $("#bOff").onclick = () => {
        const on = G.slotsView().filter(Boolean);
        if (!on.length) { toast("Your Area is already empty."); sfx("click"); return; }
        on.forEach(u => G.unequip(u.uid)); sfx("unequip"); renderSlots(); G.save();
      };
      $("#bPlot").onclick = e => buyPlot(e.currentTarget);
    }
    $("#bBest").onclick = () => {
      const before = G.slotsView().map(u => u && u.uid).join();
      G.equipBest();
      if (G.slotsView().map(u => u && u.uid).join() === before) { toast("Your best units are already placed."); sfx("click"); return; }
      sfx("equip"); slotSig = ""; renderSlots(true); G.save();
    };
    $("#bCollect").onclick = collect;
    // (29 Oct, request: "u cant see the collect bar, it should be fixed to the bottom on the area"): #app carries
    // will-change: transform for the screen shake, which pins fixed children to the bottom of the page, not the
    // screen. Living in <body> keeps the bar on screen however tall the Area gets; go() shows it on the Area only
    $$("body > .dock").forEach(d => d.remove()); // a reset or a loaded save builds the Area again
    document.body.appendChild($(".dock", p));
  }
  slotSig = ""; renderSlots(true); renderAutos();
}
// switches for the automation you've bought in the shard shop
function renderAutos() {
  const box = $("#autos"); if (!box) return;
  const list = [["autoCollect", "Auto collect"], ["autoLevel", "Auto level"], ["autoEquip", "Auto equip"], ["autoStar", "Auto star"]].filter(([id]) => G.has(id));
  // (31 Oct, "toggle the nameplates ... so it only shows yen/s"): always there, in 3D
  if (W3D) list.push(["plateMin", "Simple nameplates"]);
  box.hidden = !list.length;
  box.innerHTML = list.map(([id, n]) => `<label class="switch"><input type="checkbox" data-auto="${id}" ${S().opts[id] ? "checked" : ""}><span class="sw"></span><span>${n}</span></label>`).join("");
  $$("[data-auto]", box).forEach(c => c.onchange = () => { S().opts[c.dataset.auto] = c.checked; sfx("click"); G.save(); });
}
// in 3D: the world's plots. Every open plot shows its unit or a "+", the next one to buy a gold padlock (beating when
// you can afford it), the ascension plots a violet one, the rest grey. drop: the plot a unit was just placed on
function renderPlots(drop) {
  const view = G.slotsView().map(shownUnit), n = S().slots, locks = [];
  for (let i = n; i < G.slotsMax(); i++) locks[i] = i > n ? (AF.ECON.slotAsc[i + 1] ? "asc" : "locked") : G.slotAscNeed() ? "asc" : S().yen >= G.slotCost() ? "ready" : "next";
  HUB.setPads("area", view, drop, locks);
}
function buyPlot(btn) {
  const r = G.buySlot();
  if (r.err === "yen") return broke(btn, r.need);
  if (r.err === "asc") { FX.nope(btn); sfx("error"); toast(`Plot ${S().slots + 1} opens once you've ascended ${r.need} times.`, "bad"); return; }
  if (r.err) return;
  sfx("unlock");
  const c = HUB.padScreen("area", S().slots - 1);
  if (c) { FX.burst(c.x, c.y, { colors: ["#ffd23a", "#ffffff", "#ff7a1a"], n: 40, shape: "star" }); FX.ring(c.x, c.y, { c: "#ffd23a" }); }
  toast(`Plot ${S().slots} unlocked.`); renderSlots(); syncSlotBtn(); G.save();
}
// the heads-up line under the income: plots filled, and the next plot's price or what it waits for
function syncPlotHud() {
  const b = $("#bPlot"), nx = $("#aNext"); if (!b) return;
  const n = S().slots, max = G.slotsMax(), asc = G.slotAscNeed(), c = G.slotCost();
  const filled = `<b>${G.slotsView().filter(Boolean).length}</b> / ${n} plots filled`;
  if ($("#aSlots").innerHTML !== filled) $("#aSlots").innerHTML = filled;
  b.hidden = n >= max || !!asc;
  nx.innerHTML = n >= max ? `All <b>${max}</b> plots open` : asc ? `Plot ${n + 1} opens at <b>${asc}</b> ascensions` : `Next plot <b>${fmt(c)} &yen;</b>`;
  if (!b.hidden) { b.textContent = `Unlock plot ${n + 1}`; b.classList.toggle("gold", S().yen >= c); b.classList.toggle("off", S().yen < c); }
}
function renderSlots(enter, drop) {
  if (W3D) { renderPlots(drop); syncPlotHud(); return; }
  const view = G.slotsView(), sig = S().slots + "|" + view.map(u => (u ? u.uid : 0)).join(",");
  const box = $("#slots");
  if (!box) return;
  if (sig === slotSig) { view.forEach(u => u && patchAllCards(u)); return; }
  slotSig = sig;
  box.innerHTML = "";
  const max = G.slotsMax();
  for (let i = 0; i < max; i++) {
    let el;
    if (i < S().slots) {
      const u = view[i];
      if (u) {
        el = h(`<div class="slot full"><button class="slot-x" aria-label="Take out">${I.x}</button><div class="floats"></div></div>`);
        const card = cardEl(u, { click: () => openUnit(u) });
        el.insertBefore(card, el.firstChild);
        $(".slot-x", el).onclick = e => { e.stopPropagation(); G.unequip(u.uid); sfx("unequip"); renderSlots(); G.save(); };
      } else {
        el = h(`<button class="slot empty">${I.plus}<span>Place a unit</span></button>`);
        el.onclick = () => { sfx("click"); pickUnit("Place a unit", u2 => { G.equip(u2.uid, i); sfx("equip"); renderSlots(); G.save(); }, { exclude: x => x.eq >= 0 }); };
      }
    } else if (i === S().slots && G.slotAscNeed()) {
      // (29 Oct): slots 13-15 open with ascensions
      const a = G.slotAscNeed();
      el = h(`<div class="slot locked asc">${I.ascend}<span>Slot ${i + 1}</span><small>Ascend ${a} times to unlock</small></div>`);
    } else if (i === S().slots) {
      const c = G.slotCost();
      el = h(`<div class="slot locked next${S().yen >= c ? " ready" : ""}">${I.lock}<span class="sl-t">Slot ${i + 1}</span><button class="btn sm${S().yen < c ? " off" : ""}" id="bSlot">Unlock &middot; ${fmt(c)} &yen;</button></div>`);
      $("#bSlot", el).onclick = e => {
        const r = G.buySlot();
        if (r.err === "yen") return broke(e.currentTarget, r.need);
        if (r.err) return;
        sfx("unlock"); const c2 = FX.center(el);
        FX.burst(c2.x, c2.y, { colors: ["#ffd23a", "#ffffff", "#ff7a1a"], n: 40, shape: "star" }); FX.ring(c2.x, c2.y, { c: "#ffd23a" });
        toast(`Slot ${i + 1} unlocked.`); renderSlots(); G.save();
      };
    } else el = h(`<div class="slot locked">${I.lock}<span>Slot ${i + 1}</span></div>`);
    box.appendChild(el);
    if (enter) FX.enter(el, i * 30);
  }
}
function collect() {
  return; // (2 Nov) no idle income, so nothing to collect

  const btn = $("#bCollect");
  const amt = G.collect();
  if (amt < 0.01) { FX.nope(btn); return; }
  UI.hold += amt;
  FX.squash(btn);
  const size = Math.log10(amt + 1);
  sfx("collect", { size });
  const from = FX.center(btn), to = FX.center($("#bal .coin"));
  FX.burst(from.x, from.y, { colors: ["#ffd23a", "#fff3a8", "#ff9a2e", "#ffffff"], n: 26 + size * 6, speed: 520, shape: "star", gravity: 400 });
  FX.ring(from.x, from.y, { c: "#ffd23a", r: 150 + size * 20, w: 10 });
  FX.shakeTo(Math.min(0.3, 0.06 + size * 0.02)); // (30 Oct) smaller, and spamming doesn't stack it
  const n = Math.round(Math.min(36, 6 + size * 4)), part = amt / n;
  FX.coins(from, to, n, () => {
    UI.hold = Math.max(0, UI.hold - part);
    FX.pop($("#bal"), 0.25);
  });
  floatText(btn, "+" + fmt(amt), "gold");
  G.save();
}
// Space on any tab: the Area's full Collect when it's on screen, otherwise coins rise from the bottom into the balance
function collectAnywhere() {
  if (UI.tab === "area") return collect();
  const amt = G.collect(), bal = $("#bal");
  if (amt < 0.01) { FX.nope(bal); return; }
  UI.hold += amt;
  const size = Math.log10(amt + 1);
  sfx("collect", { size });
  const from = { x: innerWidth / 2, y: innerHeight - 40 }, to = FX.center($("#bal .coin"));
  const n = Math.round(Math.min(28, 5 + size * 3)), part = amt / n;
  FX.coins(from, to, n, () => { UI.hold = Math.max(0, UI.hold - part); FX.pop(bal, 0.25); }, { gap: 0.02 });
  floatText(bal, "+" + fmt(amt), "gold");
  G.save();
}
function floatText(el, text, cls = "") {
  const r = el.getBoundingClientRect();
  const f = h(`<div class="floater ${cls}">${esc(text)}</div>`);
  f.style.left = r.left + r.width / 2 + "px"; f.style.top = r.top + "px";
  document.body.appendChild(f);
  f.animate([{ transform: "translate(-50%, 0) scale(.6)", opacity: 0 }, { transform: "translate(-50%, -26px) scale(1.15)", opacity: 1, offset: 0.25 },
    { transform: "translate(-50%, -70px) scale(1)", opacity: 0 }], { duration: 1100, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => f.remove();
}
function incomeTick(n) {
  if (UI.tab !== "area") return;
  if (W3D) return incomeTick3D(n);
  $$("#slots .slot.full").forEach((slot, i) => {
    const u = slot.querySelector(".ucard")._u; if (!u) return;
    // (28 Oct, request: "0.05s delay between them all so its like a wave of coins"): each slot starts 50 ms after the last
    const delay = i * 50;
    const f = h(`<span class="tick">+${fmt(G.income(u))}</span>`);
    $(".floats", slot).appendChild(f);
    f.animate([{ transform: "translateY(0) scale(.7)", opacity: 0 }, { transform: "translateY(-14px) scale(1.1)", opacity: 1, offset: 0.2 },
      { transform: "translateY(-44px) scale(1)", opacity: 0 }], { duration: 1300, delay, easing: "ease-out", fill: "backwards" }).onfinish = () => f.remove();
    if ((n + i) % 3 === 0) setTimeout(() => { if (slot.isConnected) FX.coins(FX.center(slot), FX.center($("#bCollect")), 1, null, { size: 6, dur: 0.7 }); }, delay);
  });
}

// (29 Oct, request: "in the area put their yen/s above their head, it takes the card color so if its mythic the text is
// rainbow chroma"): in 3D each plot's unit has its income over its head, in its card's income colours (world.css
// .w3-yps), placed every frame from the world and sized by how far back it stands; the text is refreshed twice a second.
// Its full name sits above it ("put their name above too, the full version")
let ypsEl = null, ypsSig = "", ypsT = 0;
const ypsK = at => Math.max(0.65, Math.min(1.3, at.s / 46));
function yps3D(dt) {
  if (!ypsEl) { ypsEl = h(`<div class="w3-ypsl" aria-hidden="true"></div>`); document.body.appendChild(ypsEl); }
  const on = UI.tab === "area" && HUB.camS.k > 0.85;
  ypsEl.classList.toggle("on", on);
  ypsEl.classList.toggle("min", !!S().opts.plateMin);
  if (!on) return;
  const v = G.slotsView().map(shownUnit), sig = v.map(u => (u ? u.uid + AF.UNIT[u.k].rarity : "")).join();
  // (30 Oct, "do #1, the swap labels for compact nameplate"): stars, level and the trait's icon and multiplier, then the
  // yen/s; the name is on the hover card
  if (sig !== ypsSig) { ypsSig = sig; ypsT = 0; ypsEl.innerHTML = v.map(u => (u ? `<span class="w3-yps w3-np yr-${AF.UNIT[u.k].rarity}"><em class="w3-lv"><span class="w3-stars"></span><span class="w3-lvn"></span><span></span></em><b></b></span>` : "<span hidden></span>")).join(""); }
  const els = ypsEl.children;
  // (30 Oct, "put their level above their name"): the level, kept current with the yen/s
  // (30 Oct, "their trait should show"): its trait beside the level, kept current too
  if ((ypsT -= dt) <= 0) { ypsT = 0.5; v.forEach((u, i) => { if (u) {
    const lv = els[i].firstChild, [st, ln, tr] = lv.children;
    st.textContent = "★".repeat(G.stars(u)); ln.textContent = `Lv ${u.lv}`;
    const th = chipMini(G.trait(u)); if (tr._h !== th) { tr._h = th; tr.innerHTML = th; }
    els[i].lastChild.innerHTML = `${fmt(G.income(u))}<small>&yen;/s</small>`;
  } }); }
  v.forEach((u, i) => {
    if (!u) return;
    const e = els[i], at = HUB.padScreen("area", i);
    if (!at) { e.style.visibility = "hidden"; return; }
    e.style.visibility = "";
    e.style.transform = `translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px) translate(-50%, -100%) scale(${ypsK(at).toFixed(3)})`;
  });
}
// (30 Oct, request: "put their names above their head on defense, and the 3 stats below with their icons hovering
// above them"): the Defense team's platforms get the same kind of label: the full name, then ATK, SPA and RNG with the
// unit window's icons (a farm: its pay a wave and its cost)
// a trait as the labels over the units show it: its icon and name in its tier's colour
const traitTag = tr => chipHTML(tr); // (30 Oct) the cards' own gradient trait pill
let tdlEl = null, tdlSig = "";
function tdl3D() {
  if (!tdlEl) { tdlEl = h(`<div class="w3-ypsl w3-tdll" aria-hidden="true"></div>`); document.body.appendChild(tdlEl); }
  const on = UI.tab === "defense" && HUB.camS.k > 0.85 && !(AF.Defense && AF.Defense.match);
  tdlEl.classList.toggle("on", on);
  if (!on) return;
  const team = AF.Defense.teamUnits(), v = [0, 1, 2, 3, 4, 5].map(i => shownUnit(team[i] || null));
  const sig = v.map(u => (u ? [u.uid, u.k, u.tr, u.dbl ? 1 : 0, u.st, u.sh ? 1 : 0, u.ev ? 1 : 0].join(":") : "")).join();
  if (sig !== tdlSig) {
    tdlSig = sig;
    const tg = AF.Defense.tags, st = (k, c, val) => `<em style="--sc:${c}">${STAT_IC[k]}<b>${val}</b></em>`;
    tdlEl.innerHTML = v.map(u => {
      if (!u) return "<span hidden></span>";
      const s = AF.TD.statsOf(u), d = AF.UNIT[u.k];
      return `<span class="w3-yps w3-tdl yr-${d.rarity}">${G.trait(u) ? `<em class="w3-lv">${traitTag(G.trait(u))}</em>` : ""}<i>${esc(AF.nameOf(u))}</i><span class="w3-tds">${s.farm
        ? st("pay", "#ffc83a", "$" + tg.num(AF.TD.farmPay(null, { s }, 0))) + st("cost", "#9fb0c8", "$" + tg.num(s.cost))
        : st("atk", "#ff4a5a", tg.num(s.atk)) + st("spa", "#3fd7ff", tg.sec(s.spa)) + st("rng", "#ffc83a", s.rng.toFixed(1))}</span></span>`;
    }).join("");
  }
  const els = tdlEl.children;
  v.forEach((u, i) => {
    if (!u) return;
    const e = els[i], at = HUB.padScreen("defense", i);
    if (!at) { e.style.visibility = "hidden"; return; }
    e.style.visibility = "";
    // a little lower than the Area's: the team stands on low platforms, and the label should sit just over the head
    e.style.transform = `translate(${at.x.toFixed(1)}px, ${(at.y + at.s * 0.3).toFixed(1)}px) translate(-50%, -100%) scale(${ypsK(at).toFixed(3)})`;
  });
}
// in 3D the same wave of +income rises off the plots in the world, once the camera has arrived
function incomeTick3D(n) {
  if (HUB.camS.k < 1 || !document.body.classList.contains("w3d")) return;
  const col = $("#bCollect"), to = col && col.offsetParent ? FX.center(col) : null;
  G.slotsView().forEach((u, i) => {
    const at = u && HUB.padScreen("area", i); if (!at) return;
    const delay = i * 50, f = h(`<span class="w3-tick">+${fmt(G.income(u))}</span>`);
    f.style.left = at.x + "px"; f.style.top = at.y - 40 * ypsK(at) + "px"; // from just above the nameplate
    document.body.appendChild(f);
    f.animate([{ transform: "translateY(0) scale(.7)", opacity: 0 }, { transform: "translateY(-14px) scale(1.1)", opacity: 1, offset: 0.2 },
      { transform: "translateY(-44px) scale(1)", opacity: 0 }], { duration: 1300, delay, easing: "ease-out", fill: "backwards" }).onfinish = () => f.remove();
    if (to && (n + i) % 3 === 0) setTimeout(() => FX.coins(at, to, 1, null, { size: 6, dur: 0.7 }), delay);
  });
}

// ---------------- Summon ----------------
function pageSummon() {
  const p = $("#p-summon");
  if (!p.firstChild) {
    p.innerHTML = `
    <div class="summon">
      <aside class="gates" id="gates"></aside>
      <div class="portal-wrap">
        <canvas class="portal" id="portal"></canvas>
        <div class="portal-name" id="gName"></div>
        <div class="sum-btns">
          <button class="btn big" id="bS1"><span>Summon &times;1</span><small id="c1"></small></button>
          <button class="btn big gold" id="bS10"><span>Summon &times;10</span><small id="c10"></small></button>
        </div>
        <div class="sum-btns bulkrow" id="bulkRow" hidden>
          <button class="btn ghost" id="bS50"><span>&times;50</span><small id="c50"></small></button>
          <button class="btn ghost" id="bS100"><span>&times;100</span><small id="c100"></small></button>
        </div>
        <div class="sum-opts">
          <span class="sum-auto"><label class="switch"><input type="checkbox" id="autoSum"><span class="sw"></span><span>Auto summon</span></label>
            <select id="sumStop" aria-label="Auto summon stops at">${AF.RARITIES.filter(r => r.order >= 3).map(r => `<option value="${r.order}">until ${r.name}${r.order < AF.RARITIES.length - 1 ? " or better" : ""}</option>`).join("")}<option value="99">until never</option></select></span>
          <label class="switch" id="aeWrap" hidden><input type="checkbox" id="autoEq"><span class="sw"></span><span>Auto equip best</span></label>
        </div>
      </div>
      <aside class="panel odds" id="sumOdds"></aside>
    </div>`;
    $("#bS1").onclick = () => summon(1);
    $("#bS10").onclick = () => summon(10);
    $("#bS50").onclick = () => summon(50);
    $("#bS100").onclick = () => summon(100);
    $("#autoSum").checked = !!UI.autoSum; // on when it was resumed before this page was first opened
    $("#autoSum").onchange = e => { UI.autoSum = e.target.checked; sfx("click"); if (UI.autoSum) { onlyOneAuto("sum"); autoSummonLoop(); } else syncPills(); };
    $("#autoEq").onchange = e => { S().opts.autoEquip = e.target.checked; sfx("click"); G.save(); };
    $("#sumStop").value = S().opts.sumStop;
    $("#sumStop").onchange = e => { S().opts.sumStop = +e.target.value; sfx("click"); G.save(); };
  }
  renderGates(); renderSumOdds();
}
// the chosen gate, or the best open one if it has closed (a run reset, or a Defense clear it now waits for)
function gateNow() {
  if (!G.gateOpen(AF.GATE[S().gate])) S().gate = AF.GATES.filter(G.gateOpen).pop().id;
  return AF.GATE[S().gate];
}
function renderGates() {
  const box = $("#gates"); if (!box) return;
  gateNow();
  box.innerHTML = AF.GATES.map(g => {
    const open = G.gateOpen(g), ascShort = S().asc < (g.asc || 0), tdShort = g.td && !G.tdClear(g.td), rebShort = (S().reb || 0) < (g.reb || 0);
    const pct = rebShort ? ((S().reb || 0) / g.reb) * 100 : ascShort ? (S().asc / g.asc) * 100 : tdShort ? 0 : Math.min(100, (S().lifetime / g.unlock) * 100);
    return `<button class="gate${S().gate === g.id ? " on" : ""}${open ? "" : " locked"}" data-g="${g.id}" style="--g1:${g.hue[0]};--g2:${g.hue[1]}">
      <i class="gate-ic" data-gi="${g.id}"><b class="gate-ic-in">${gIcon(g.id)}</b></i><span class="gate-n">${g.name}</span>
      <span class="gate-c">${open ? `${fmt(G.summonCost(g.id, 1))} &yen; a summon` : rebShort ? (g.reb === 1 ? "Rebirth once" : `Rebirth ${g.reb} times (${S().reb || 0}/${g.reb})`)
        : ascShort ? `Ascend ${g.asc} times (${S().asc}/${g.asc})`
        : tdShort ? `Clear ${AF.TD.label(g.td)} in Defense` : `Earn ${fmt(g.unlock)} &yen; this run`}</span>
      ${open ? "" : `<span class="gate-bar"><i style="width:${pct}%"></i></span>`}</button>`;
  }).join("");
  $$(".gate", box).forEach(b => b.onclick = () => {
    const g = AF.GATE[b.dataset.g];
    if (!G.gateOpen(g)) {
      FX.nope(b); sfx("error");
      toast((S().reb || 0) < (g.reb || 0) ? `${g.name} opens with your ${["first", "second", "third"][g.reb - 1] || g.reb + "th"} Rebirth.`
        : S().asc < (g.asc || 0) ? `${g.name} opens from your ${g.asc}th ascension.` : g.td && !G.tdClear(g.td) ? `${g.name} opens once you clear ${AF.TD.label(g.td)} in Defense.`
        : `${g.name} opens once you've earned ${fmt(g.unlock)} ¥ this run.`, "bad");
      return;
    }
    S().gate = g.id; sfx("tab"); FX.pop(b, 0.5); renderGates(); renderSumOdds(); G.save();
  });
  const g = AF.GATE[S().gate];
  syncGate();
  $("#gName").innerHTML = `<i class="gn-ic" style="--g1:${g.hue[0]};--g2:${g.hue[1]}">${gIcon(g.id)}</i><span>${esc(g.name)}</span>`;
  for (const n of [1, 10, 50, 100]) $("#c" + n).textContent = fmt(G.summonCost(g.id, n)) + " ¥";
  $("#bulkRow").hidden = !G.has("bulk");
  $("#aeWrap").hidden = !G.has("autoEquip");
  $("#autoEq").checked = S().opts.autoEquip;
  syncSumBtns();
}
// in 3D the gate in the world paints the chosen gate's portal
let worldGate = null;
function syncGate() { if (W3D && worldGate !== S().gate) { worldGate = S().gate; HUB.setGate(worldGate); } }
function syncSumBtns() {
  const g = AF.GATE[S().gate]; if (!$("#bS1")) return;
  for (const n of [1, 10, 50, 100]) $("#bS" + n).classList.toggle("off", S().yen < G.summonCost(g.id, n));
}
function renderSumOdds() {
  const box = $("#sumOdds"); if (!box) return;
  const g = AF.GATE[S().gate];
  const rows = AF.RARITIES.filter(r => g.odds[r.id]).map(r =>
    `<tr class="r-${r.id}"><td><span class="tn"><i class="rdot"></i>${r.name}</span></td><td class="ch"><b>${g.odds[r.id]}%</b><small>${AF.oneIn(g.odds[r.id])}</small></td></tr>`).join("");
  // (29 Oct, request: "i dont wanna see my pity"): the guarantee is stated, the counters aren't shown
  box.innerHTML = `<h3>${g.name} odds</h3><table class="otab">${rows}</table>
    ${g.odds.divine ? '<p class="note">Divine and rarer units only come from the Void Gate and the gates after it.</p>' : ""}
    ${g.excl ? (AF.FACTIONS || []).some(f => f.id === g.id) ? `<p class="note rift-note">${(n => `The ${AF.UNITS.filter(d => d.gate === g.id).length} units of ${esc(n)} live only here. When you pull a rarity one of them has, it's one of them ${Math.round(g.excl * 100)}% of the time, and an Absolute is always theirs.`)(AF.FACTIONS.find(f => f.id === g.id).name)}</p>`
      : `<p class="note rift-note">${AF.UNITS.filter(d => d.gate === g.id).length} Rift units live only here. When you pull a rarity that has one, it's a Rift unit ${Math.round(g.excl * 100)}% of the time.</p>` : ""}
    ${G.upLv("luck") || G.upLv("favor") ? `<p class="note">Your shard upgrades raise these: Legendary and better +${G.upLv("luck") * 10}%${G.upLv("favor") ? `, Divine and better another +${G.upLv("favor") * 15}%` : ""}.</p>` : ""}
    <p class="note">A Mythic or better is guaranteed within ${AF.SUMMON_PITY[0].at} summons, and a Secret within ${fmt(AF.SUMMON_PITY[1].at)}.</p>
    <h3>Auto sell</h3>
    <button class="as-open" id="asOpen"><span class="as-sum">${autoSellSum()}</span><span class="as-go">Choose</span></button>
    <p class="note">Sells the pulls you pick for a little &yen;. The first copy of any unit is always kept.</p>`;
  $("#asOpen", box).onclick = () => { sfx("click"); openAutoSell(); };
}
// what Auto sell is set to, in a line: "Off", or the rarities it sells, each with "+ shiny" or "shiny only"
function autoSellSum() {
  const o = S().opts.autoSell || {}, on = AF.RARITIES.filter(r => o[r.id] || o[r.id + ":sh"]);
  if (!on.length) return "Off";
  return on.map(r => `<b class="r-${r.id}"><i class="rdot"></i>${r.name}${o[r.id] && o[r.id + ":sh"] ? " + shiny" : o[r.id + ":sh"] ? " shiny only" : ""}</b>`).join("");
}
// the window: every rarity, a switch for its normal pulls and one for its shiny ones
function openAutoSell() {
  const o = S().opts.autoSell || (S().opts.autoSell = {});
  const sw = k => `<label class="switch"><input type="checkbox" data-as="${k}" ${o[k] ? "checked" : ""}><span class="sw"></span></label>`;
  const body = h(`<div class="as-win">
    <p class="note">Pulls you pick here are sold as they land, for a little &yen;. The first copy of any unit is always kept.</p>
    <table class="otab as-tab"><thead><tr><th>Rarity</th><th>Normal</th><th>Shiny</th></tr></thead><tbody>
      ${AF.RARITIES.map(r => `<tr class="r-${r.id}"><td><span class="tn"><i class="rdot"></i>${r.name}</span></td><td>${sw(r.id)}</td><td>${sw(r.id + ":sh")}</td></tr>`).join("")}
    </tbody></table>
    <div class="as-foot"><button class="btn ghost sm" id="asNone">Turn all off</button></div></div>`);
  const sync = () => { const s = $("#asOpen .as-sum"); if (s) s.innerHTML = autoSellSum(); };
  $$("[data-as]", body).forEach(c => c.onchange = () => { o[c.dataset.as] = c.checked; if (!c.checked) delete o[c.dataset.as]; sfx("click"); G.save(); sync(); });
  $("#asNone", body).onclick = () => { for (const k in o) delete o[k]; $$("[data-as]", body).forEach(c => { c.checked = false; }); sfx("click"); G.save(); sync(); };
  modal(body, { title: "Auto sell", cls: "narrow" });
}
// (30 Oct, "give it a cooldown"): a manual summon starts at most every SUMMON_CD ms
const SUMMON_CD = 1000;
async function summon(n) {
  if (UI.sumBusy) return;
  const btn0 = $("#bS" + n);
  if (performance.now() < (UI.sumReadyAt || 0)) { if (btn0) FX.nope(btn0); return; }
  UI.lastN = n;
  const g = gateNow(), btn = btn0;
  const res = G.summon(g.id, n);
  if (res.err === "yen") { UI.autoSum = false; $("#autoSum").checked = false; syncPills(); return broke(btn, res.need); }
  if (res.err === "full") { UI.autoSum = false; $("#autoSum").checked = false; syncPills(); if (btn) FX.nope(btn); sfx("error"); toast(bagFull(n), "bad"); return; }
  if (res.err) return;
  if (UI.autoSum) noteAutoPull(res.units, n);
  UI.sumReadyAt = performance.now() + SUMMON_CD;
  $$('#bS1, #bS10, #bS50, #bS100').forEach(b => { b.classList.remove("cooling"); void b.offsetWidth; b.style.setProperty("--cd", SUMMON_CD + "ms"); b.classList.add("cooling"); });
  setTimeout(() => $$('#bS1, #bS10, #bS50, #bS100').forEach(b => b.classList.remove("cooling")), SUMMON_CD);
  UI.sumBusy = true; FX.squash(btn); portalKick = 1;
  if (W3D) HUB.gate.o.kick = 1; // (29 Oct, "the portal should just animate"): the gate jolts, the opening plays over the screen
  // Lucky Double can make a x10 into 11 or more, which is the bulk reveal's job
  try { await (res.units.length > 10 ? revealBulk(res.units, UI.autoSum) : revealSummon(res.units, UI.autoSum)); } finally { UI.sumBusy = false; }
  if (res.extra) toast(`Lucky Double: ${res.extra} free unit${res.extra === 1 ? "" : "s"}.`);
  starAfterPulls(false);
  renderGates(); renderSumOdds(); refresh(); G.save();
}
// Auto Star runs once the reveal is over, so a card on screen is never a copy that's already been fed
function starAfterPulls(quiet) {
  if (!G.has("autoStar") || !S().opts.autoStar) return;
  const n = G.autoStar();
  if (!n) return;
  if (!quiet) toast(`Auto Star added ${n} star${n === 1 ? "" : "s"}.`);
  if (UI.tab === "units") renderUnits();
  if (UI.tab === "area") { slotSig = ""; renderSlots(); }
}
// portal animation on the summon page
let portalKick = 0;
// (29 Oct, request: "the actual vortex itself looks so ai and boring. find some reference and go off of it. make it
// look cool as hell"): built the way summoning-circle effects are layered: a steady outer circle of runes, inner
// rings and a star turning against it, matter spiralling into a bright core, embers and wisps, and on top each
// gate's own element (Ember flames, Tide ripples, Storm lightning, a Void black hole, Genesis light, a Rift tear)
// glow: the colour the 3D gate glows and lights its stone in, matched to the portal as it looks (29 Oct, "the glow is not
// the right color on all of em": it was a, but the portal's inside is mostly b)
const PTHEME = {
  ember:   { a: "#ff5a2a", b: "#ffb02e", hot: "#fff1c4", star: 5, glow: "#ff9a2a" },
  tide:    { a: "#1fb6ff", b: "#5cf2d6", hot: "#e6fbff", star: 6, glow: "#2fbcff" },
  storm:   { a: "#8a6bff", b: "#4fe6ff", hot: "#f0f6ff", star: 6, glow: "#4fd6ff" },
  void:    { a: "#ff3bc8", b: "#7a2bff", hot: "#ffd6f4", star: 7, dark: true, glow: "#8a34ff" },
  genesis: { a: "#ffd76a", b: "#7dffcf", hot: "#ffffff", star: 8, glow: "#7dffcf" },
  rift:    { a: "#3dffc8", b: "#7a3bff", hot: "#e6fff8", star: 6, dark: true, glow: "#8a4bff" },
  // (30 Oct) the gates a Rebirth opens, in their factions' colours
  aurora:  { a: "#3dffa0", b: "#2ee6ff", hot: "#eafff6", star: 8, glow: "#3dffc0" },
  chrono:  { a: "#ffb02e", b: "#f2efe6", hot: "#fff6e0", star: 12, glow: "#ffc44a" },
  origin:  { a: "#9a6aff", b: "#f4f4f0", hot: "#f4eeff", star: 5, dark: true, glow: "#a07bff" },
};
const newPortal = gid => ({ g: gid, motes: [], fx: [], bolts: [], boltT: 0, acc: 0, glitch: 0, waves: [], zap: 0, bursts: [] });
// a pinwheel of light from the portal's centre, drawn under the portal (FX.rays would draw over everything)
const portalRays = (st, o = {}) => st.bursts.push({ life: 0, max: o.life || 1.6, n: o.n || 16, c: o.c || "#ffffff", len: o.len || 900, rainbow: o.rainbow, spin: o.spin || 0.4 });
const PRUNE = Array.from({ length: 40 }, (_, i) => [((i * 7919) % 5), ((i * 104729) % 4), (i * 31) % 3]);
// one frame of a gate's portal on canvas c. st: its running state (newPortal). o: kick (a jolt, 0-1), power (how
// hard a summon is charging it, 0 up), tint ([a, b] colours that take over as a reveal climbs the rarities), rainbow,
// scale (radius against the canvas), collapse (0-1, folding in before the burst), boom (0-1, the burst fading out)
// o.own: draw at the canvas's own size (the 3D world's gate paints an offscreen canvas onto its texture)
function paintPortal(c, t, dt, st, o = {}) {
  const D = o.own ? 1 : Math.min(o.dpr || 2, devicePixelRatio || 1), W = o.own ? c.width : c.clientWidth, H = o.own ? c.height : c.clientHeight;
  if (!W || !H) return;
  if (!o.own && (c.width !== Math.round(W * D) || c.height !== Math.round(H * D))) { c.width = Math.round(W * D); c.height = Math.round(H * D); }
  const x = c.getContext("2d"), g = AF.GATE[st.g], th = PTHEME[g.id] || PTHEME.ember, PI2 = Math.PI * 2, pst = st;
  x.setTransform(D, 0, 0, D, 0, 0); x.clearRect(0, 0, W, H);
  const k = o.kick || 0, pw = o.power || 0, col = o.collapse || 0, boom = o.boom || 0;
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * (o.scale === undefined ? 0.34 : o.scale) * (1 + k * 0.1) * (1 - col * 0.85) * (1 + boom * 0.7);
  if (R < 2) return;
  const sp = 1 + k * 3 + pw * 1.3 + col * 9, hexA = FX.hexA;
  let A = th.a, Bc = th.b;
  if (o.rainbow) { const RB = FX.RAINBOW, q = Math.floor(t * 5); A = RB[q % RB.length]; Bc = RB[(q + 3) % RB.length]; }
  else if (o.tint) { A = o.tint[0]; Bc = o.tint[1] || o.tint[0]; }
  x.globalAlpha = Math.max(0, 1 - boom);
  // 1. the glow behind everything, breathing
  const breathe = 0.85 + Math.sin(t * 1.6) * 0.15;
  let gr = x.createRadialGradient(cx, cy, R * 0.1, cx, cy, Math.min(W, H) / 2);
  gr.addColorStop(0, hexA(A, 0.55 * breathe + k * 0.3)); gr.addColorStop(0.45, hexA(Bc, 0.22)); gr.addColorStop(1, hexA(Bc, 0));
  x.fillStyle = gr; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "lighter";
  // the rarity steps' pinwheels (portalRays), under everything else the portal draws
  for (let i = pst.bursts.length - 1; i >= 0; i--) {
    const r = pst.bursts[i]; r.life += dt;
    if (r.life > r.max) { pst.bursts.splice(i, 1); continue; }
    const q = r.life / r.max, a = Math.sin(Math.min(1, q * 4) * Math.PI / 2) * (1 - q);
    x.save(); x.translate(cx, cy); x.rotate(r.life * r.spin);
    for (let j = 0; j < r.n; j++) {
      x.rotate(PI2 / r.n);
      const lg = x.createLinearGradient(0, 0, r.len, 0), rc = r.rainbow ? FX.RAINBOW[j % FX.RAINBOW.length] : r.c;
      lg.addColorStop(0, hexA(rc, 0.5 * a)); lg.addColorStop(1, hexA(rc, 0));
      x.fillStyle = lg; x.beginPath(); x.moveTo(0, 0); x.lineTo(r.len, -r.len * 0.05); x.lineTo(r.len, r.len * 0.05); x.fill();
    }
    x.restore();
  }
  // 2. light shafts turning slowly (strong for Genesis)
  const rays = g.id === "genesis" ? 18 : 10, rayA = g.id === "genesis" ? 0.16 : 0.06;
  for (let i = 0; i < rays; i++) {
    const a0 = (i / rays) * PI2 + t * 0.08, w = 0.07 + (i % 3) * 0.03;
    const rg = x.createRadialGradient(cx, cy, 0, cx, cy, R * 1.55);
    rg.addColorStop(0, hexA(th.hot, rayA * (1 + k))); rg.addColorStop(1, hexA(A, 0));
    x.fillStyle = rg; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R * 1.55, a0 - w, a0 + w); x.closePath(); x.fill();
  }
  // 3. the vortex: streaks spiralling in, faster the closer they get
  pst.acc += dt * (240 + k * 500 + pw * 320);
  while (pst.acc > 1 && pst.motes.length < 650 + pw * 260) {
    pst.acc -= 1;
    pst.motes.push({ a: Math.random() * PI2, r: R * (0.75 + Math.random() * 0.35), w: 0.8 + Math.random() * 2.2, h: Math.random() });
  }
  for (let i = pst.motes.length - 1; i >= 0; i--) {
    const m = pst.motes[i], a0 = m.a, r0 = m.r;
    m.r -= dt * (R * 0.18 + (R - m.r) * 0.9) * sp;
    m.a += dt * (0.9 + (R / Math.max(m.r, R * 0.08)) * 0.55) * sp;
    if (m.r < R * 0.09) { pst.motes.splice(i, 1); continue; }
    const f = m.r / R;
    x.strokeStyle = f > 0.6 ? hexA(m.h > 0.5 ? Bc : A, 0.75) : f > 0.3 ? hexA(A, 0.9) : hexA(th.hot, 1);
    x.lineWidth = m.w * (0.7 + f * 0.8);
    x.beginPath(); x.arc(cx, cy, (r0 + m.r) / 2, a0, m.a); x.stroke();
  }
  // faint spiral arms underneath give the swirl its shape
  x.lineWidth = 3;
  for (let arm = 0; arm < 4; arm++) {
    x.beginPath();
    for (let j = 0; j <= 40; j++) {
      const f = j / 40, rr = R * (0.95 - f * 0.82), aa = arm * (PI2 / 4) + f * 4.4 - t * 0.9 * sp;
      j ? x.lineTo(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr) : x.moveTo(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr);
    }
    x.strokeStyle = hexA(arm % 2 ? A : Bc, 0.3); x.stroke();
  }
  // 4. the magic circle: two rings with ticks, a band of runes, an inner star and rings turning the other way
  x.globalCompositeOperation = "source-over";
  x.save(); x.translate(cx, cy);
  x.shadowColor = A; x.shadowBlur = 14;
  x.strokeStyle = hexA(th.hot, 0.9); x.lineWidth = 2.4;
  x.beginPath(); x.arc(0, 0, R, 0, PI2); x.stroke();
  x.lineWidth = 1.2; x.strokeStyle = hexA(Bc, 0.85);
  x.beginPath(); x.arc(0, 0, R * 0.9, 0, PI2); x.stroke();
  x.rotate(t * 0.12 * sp);
  for (let i = 0; i < 72; i++) {
    const a0 = (i / 72) * PI2, l = i % 6 ? 0.025 : 0.05;
    x.beginPath(); x.moveTo(Math.cos(a0) * R * (1 - l), Math.sin(a0) * R * (1 - l)); x.lineTo(Math.cos(a0) * R, Math.sin(a0) * R); x.stroke();
  }
  // runes: little three-stroke marks, each its own shape, in the band between the rings
  x.strokeStyle = hexA(th.hot, 0.85); x.lineWidth = 1.4;
  for (let i = 0; i < 28; i++) {
    const a0 = (i / 28) * PI2, rr = R * 0.95, [p, q, u] = PRUNE[i];
    x.save(); x.rotate(a0); x.translate(rr, 0); x.rotate(Math.PI / 2);
    const s2 = R * 0.022;
    x.beginPath();
    x.moveTo(-s2, -s2); x.lineTo(p % 2 ? s2 : 0, s2 * (q - 1.5) / 1.5);
    x.moveTo(0, -s2); x.lineTo(0, s2);
    if (u) { x.moveTo(-s2 * 0.8, s2 * 0.3 * (p - 2)); x.lineTo(s2 * 0.8, s2 * 0.3 * (2 - p)); }
    x.stroke(); x.restore();
  }
  x.rotate(-t * 0.12 * sp - t * 0.22 * sp);
  // inner star: a {n/2} star for odd n, two interlocking polygons for even n (a hexagram for 6)
  const n = th.star, rs = R * 0.62, va = i => (i / n) * PI2 - Math.PI / 2;
  x.strokeStyle = hexA(A, 0.8); x.lineWidth = 1.6;
  const poly = idx => { x.beginPath(); idx.forEach((i, j) => { const aa = va(i); j ? x.lineTo(Math.cos(aa) * rs, Math.sin(aa) * rs) : x.moveTo(Math.cos(aa) * rs, Math.sin(aa) * rs); }); x.closePath(); x.stroke(); };
  if (n % 2) poly(Array.from({ length: n }, (_, i) => (i * 2) % n));
  else { poly(Array.from({ length: n / 2 }, (_, i) => i * 2)); poly(Array.from({ length: n / 2 }, (_, i) => i * 2 + 1)); }
  for (let i = 0; i < n; i++) { const aa = va(i); x.fillStyle = hexA(th.hot, 0.9); x.beginPath(); x.arc(Math.cos(aa) * rs, Math.sin(aa) * rs, 2.6, 0, PI2); x.fill(); }
  x.strokeStyle = hexA(Bc, 0.7); x.lineWidth = 1.2;
  x.beginPath(); x.arc(0, 0, rs, 0, PI2); x.stroke();
  x.setLineDash([3, 7]); x.beginPath(); x.arc(0, 0, R * 0.44, 0, PI2); x.stroke(); x.setLineDash([]);
  x.restore();
  x.globalCompositeOperation = "lighter";
  // 5. the gate's own element
  const T0 = pst;
  if (g.id === "ember") {
    // flames licking up round the rim, embers rising off the top
    for (let i = 0; i < 30; i++) {
      const a0 = (i / 30) * PI2, fl = 0.5 + 0.5 * Math.sin(t * 7 + i * 1.7), len = R * (0.08 + fl * 0.1) * (1 + k);
      const px0 = cx + Math.cos(a0) * R, py0 = cy + Math.sin(a0) * R, ox = Math.cos(a0) * len, oy = Math.sin(a0) * len - len * 0.6;
      const fg = x.createLinearGradient(px0, py0, px0 + ox, py0 + oy);
      fg.addColorStop(0, hexA("#ffd27a", 0.75)); fg.addColorStop(1, hexA("#ff3a1a", 0));
      x.strokeStyle = fg; x.lineWidth = 6 - fl * 2; x.lineCap = "round";
      x.beginPath(); x.moveTo(px0, py0); x.quadraticCurveTo(px0 + ox * 0.5 + Math.sin(t * 9 + i) * 4, py0 + oy * 0.5, px0 + ox, py0 + oy); x.stroke();
    }
    if (Math.random() < dt * 40) T0.fx.push({ k: "ember", x: cx + (Math.random() - 0.5) * R * 1.6, y: cy + R * (0.2 + Math.random() * 0.6), vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 60, life: 0, max: 1.6 + Math.random() });
  } else if (g.id === "tide") {
    if (Math.random() < dt * 1.2) T0.fx.push({ k: "ripple", life: 0, max: 2.2 });
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * PI2 + t * 0.7, rr = R * (0.8 + Math.sin(t * 2 + i) * 0.04);
      x.fillStyle = hexA("#e6fbff", 0.7); x.beginPath(); x.arc(cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr, 2.2, 0, PI2); x.fill();
    }
    if (Math.random() < dt * 25) T0.fx.push({ k: "bubble", x: cx + (Math.random() - 0.5) * R * 1.2, y: cy + R * 0.7, vx: 0, vy: -25 - Math.random() * 30, life: 0, max: 2 + Math.random(), r: 1.5 + Math.random() * 3 });
  } else if (g.id === "storm") {
    T0.boltT -= dt * sp;
    if (T0.boltT <= 0) {
      T0.boltT = 0.25 + Math.random() * 0.6;
      const a0 = Math.random() * PI2, a1 = a0 + (Math.random() - 0.5) * 1.2;
      T0.bolts.push({ pts: AF.kit.boltPts([cx + Math.cos(a0) * R * 0.15, cy + Math.sin(a0) * R * 0.15], [cx + Math.cos(a1) * R * 1.02, cy + Math.sin(a1) * R * 1.02], 10, R * 0.12), life: 0, max: 0.22 });
    }
  } else if (g.id === "void") {
    // a black hole: the accretion disc seen edge-on, a ring of light bent round it, stars pulled in
    x.save(); x.translate(cx, cy); x.rotate(-0.35);
    for (let j = 0; j < 3; j++) {
      x.strokeStyle = hexA(j % 2 ? "#ff3bc8" : "#ffb0f0", 0.55 - j * 0.12); x.lineWidth = 7 - j * 2;
      x.beginPath(); x.ellipse(0, 0, R * (0.62 + j * 0.1), R * (0.13 + j * 0.03), 0, 0, PI2); x.stroke();
    }
    x.restore();
    if (Math.random() < dt * 30) T0.fx.push({ k: "star", a: Math.random() * PI2, r: R * 1.4, life: 0, max: 1.5 });
  } else if (g.id === "genesis") {
    for (let i = 0; i < 3; i++) {
      x.strokeStyle = hexA("#fff2b8", 0.35 - i * 0.08); x.lineWidth = 1.5;
      x.beginPath(); x.ellipse(cx, cy - R * (0.15 + i * 0.05), R * (0.25 + i * 0.07), R * (0.06 + i * 0.015), 0, 0, PI2); x.stroke();
    }
    if (Math.random() < dt * 18) T0.fx.push({ k: "glint", x: cx + (Math.random() - 0.5) * R * 2.2, y: cy - R * 1.1, vx: (Math.random() - 0.5) * 15, vy: 30 + Math.random() * 30, life: 0, max: 2.5 });
  } else if (g.id === "rift") {
    // a jagged tear down the middle, teal light leaking out, the image slipping now and then
    const pts = [];
    for (let j = 0; j <= 12; j++) pts.push([cx + Math.sin(j * 2.3 + Math.floor(t * 6) * 0.7) * R * 0.08 * (j % 2 ? 1 : -1), cy - R * 0.92 + (j / 12) * R * 1.84]);
    for (const [w, a0] of [[14, 0.25], [6, 0.7], [2, 1]]) {
      x.strokeStyle = w > 10 ? hexA("#3dffc8", a0) : w > 4 ? hexA("#b8fff0", a0) : `rgba(255,255,255,${a0})`; x.lineWidth = w;
      x.beginPath(); pts.forEach(([px, py], j) => (j ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke();
    }
    T0.glitch = Math.max(0, T0.glitch - dt);
    if (Math.random() < dt * 0.8) T0.glitch = 0.18;
    if (T0.glitch > 0) {
      for (const [col, off] of [["#ff2a6a", -6], ["#2ee6ff", 6]]) { x.strokeStyle = hexA(col, 0.6); x.lineWidth = 2; x.beginPath(); x.arc(cx + off, cy, R, 0, PI2); x.stroke(); }
    }
  } else if (g.id === "aurora") {
    // (30 Oct) curtains of the northern lights folding over the top half, snow drifting down through them
    for (let j = 0; j < 3; j++) {
      const c0 = ["#3dffa0", "#2ee6ff", "#a07bff"][j], base = cy - R * (0.15 + j * 0.16);
      for (let i = 0; i <= 26; i++) {
        const u = i / 26, px = cx - R * 0.95 + u * R * 1.9, w = Math.sin(u * 7 + t * (0.8 + j * 0.3) + j * 2) * R * 0.07, py = base + w;
        const hh = R * (0.22 + 0.12 * Math.sin(u * 11 - t * 1.3 + j)) * Math.sin(u * Math.PI);
        const lg = x.createLinearGradient(px, py, px, py - hh);
        lg.addColorStop(0, hexA(c0, 0.34)); lg.addColorStop(1, hexA(c0, 0));
        x.strokeStyle = lg; x.lineWidth = R * 0.08; x.beginPath(); x.moveTo(px, py); x.lineTo(px, py - hh); x.stroke();
      }
    }
    if (Math.random() < dt * 30) T0.fx.push({ k: "snow", x: cx + (Math.random() - 0.5) * R * 2, y: cy - R * 1.05, vx: 0, vy: 18 + Math.random() * 22, life: 0, max: 3 + Math.random() * 2, r: 1 + Math.random() * 1.8 });
  } else if (g.id === "chrono") {
    // a stopped clock: twelve numerals round the rim, the hands at twelve, the second hand stuck twitching on the
    // last second
    x.save(); x.translate(cx, cy);
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * PI2 - Math.PI / 2, big = i % 3 === 0;
      x.strokeStyle = hexA(i ? "#f2efe6" : "#ffb02e", big ? 0.85 : 0.5); x.lineWidth = big ? 4 : 2;
      x.beginPath(); x.moveTo(Math.cos(a0) * R * 0.74, Math.sin(a0) * R * 0.74); x.lineTo(Math.cos(a0) * R * (big ? 0.88 : 0.83), Math.sin(a0) * R * (big ? 0.88 : 0.83)); x.stroke();
    }
    const twitch = -Math.PI / 2 - PI2 / 60 + (Math.floor(t * 2) % 2 ? 0.035 : 0);
    for (const [len, w, c0, a0] of [[0.42, 6, "#f2efe6", -Math.PI / 2 - 0.02], [0.62, 4, "#f2efe6", -Math.PI / 2 + 0.02], [0.7, 1.5, "#ffb02e", twitch]]) {
      x.strokeStyle = hexA(c0, 0.9); x.lineWidth = w; x.lineCap = "round";
      x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a0) * R * len, Math.sin(a0) * R * len); x.stroke();
    }
    x.restore();
    if (Math.random() < dt * 4) T0.fx.push({ k: "ripple", life: 0, max: 1.6, c: "#ffb02e" });
  } else if (g.id === "origin") {
    // a sword hanging point-down through the middle with its round guard, and white petals falling past it
    const top = cy - R * 0.92, bot = cy + R * 0.92, gy = cy - R * 0.5;
    for (const [w, c0, a0] of [[16, "#9a6aff", 0.22], [6, "#d8c8ff", 0.6], [2, "#ffffff", 1]]) {
      x.strokeStyle = hexA(c0, a0); x.lineWidth = w; x.beginPath(); x.moveTo(cx, top); x.lineTo(cx, bot); x.stroke();
    }
    x.strokeStyle = hexA("#f4f4f0", 0.75); x.lineWidth = 3; x.beginPath(); x.arc(cx, gy, R * 0.1, 0, PI2); x.stroke();
    if (Math.random() < dt * 14) T0.fx.push({ k: "petal", x: cx + (Math.random() - 0.5) * R * 2, y: cy - R * 1.05, vx: 6 + Math.random() * 10, vy: 20 + Math.random() * 18, life: 0, max: 3 + Math.random() * 2, r: 2.5 + Math.random() * 2 });
  }
  // the gate's particles and bolts
  for (let i = T0.fx.length - 1; i >= 0; i--) {
    const f = T0.fx[i]; f.life += dt;
    if (f.life >= f.max) { T0.fx.splice(i, 1); continue; }
    const q = f.life / f.max, al = Math.sin(q * Math.PI);
    if (f.k === "ripple") {
      x.strokeStyle = hexA(f.c || "#5cf2d6", 0.6 * (1 - q)); x.lineWidth = 2.5 * (1 - q) + 0.5;
      x.beginPath(); x.arc(cx, cy, R * 0.2 + q * R * 0.9, 0, PI2); x.stroke(); continue;
    }
    if (f.k === "star") {
      f.r -= dt * R * 1.4 * (1 + q * 2); f.a += dt * 1.8;
      if (f.r < R * 0.2) { T0.fx.splice(i, 1); continue; }
      x.strokeStyle = `rgba(255,255,255,${0.8 * al})`; x.lineWidth = 1.5;
      x.beginPath(); x.arc(cx, cy, f.r, f.a - 0.08, f.a); x.stroke(); continue;
    }
    f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.k === "ember") { x.fillStyle = hexA(Math.random() < 0.5 ? "#ffd27a" : "#ff6a2a", al); x.fillRect(f.x, f.y, 2.4, 2.4); }
    else if (f.k === "bubble") { x.strokeStyle = hexA("#e6fbff", 0.7 * al); x.lineWidth = 1; x.beginPath(); x.arc(f.x + Math.sin(f.life * 4) * 4, f.y, f.r, 0, PI2); x.stroke(); }
    else if (f.k === "glint") { x.fillStyle = hexA("#fff2b8", al); AF.kit.star(x, f.x + Math.sin(f.life * 2) * 8, f.y, 4); }
    else if (f.k === "snow") { x.fillStyle = `rgba(255,255,255,${0.85 * al})`; x.beginPath(); x.arc(f.x + Math.sin(f.life * 1.7 + f.r) * 6, f.y, f.r, 0, PI2); x.fill(); }
    else if (f.k === "petal") {
      x.save(); x.translate(f.x + Math.sin(f.life * 2 + f.r) * 10, f.y); x.rotate(f.life * 2.4 + f.r);
      x.fillStyle = `rgba(255,246,236,${0.9 * al})`; x.beginPath(); x.ellipse(0, 0, f.r, f.r * 0.5, 0, 0, PI2); x.fill(); x.restore();
    }
  }
  for (let i = T0.bolts.length - 1; i >= 0; i--) {
    const b2 = T0.bolts[i]; b2.life += dt;
    if (b2.life >= b2.max) { T0.bolts.splice(i, 1); continue; }
    const q = 1 - b2.life / b2.max;
    x.strokeStyle = hexA(b2.c || "#8a6bff", 0.5 * q); x.lineWidth = 7; AF.kit.strokePts(x, b2.pts);
    x.strokeStyle = hexA("#bff6ff", q); x.lineWidth = 2.2; AF.kit.strokePts(x, b2.pts);
  }
  // while a summon charges it: a second band of runes turning the other way, a shockwave each rarity step, and from
  // the higher steps lightning crawling from the rim into the core
  if (pw > 0) {
    x.save(); x.translate(cx, cy); x.rotate(-t * 0.3 * sp);
    x.globalAlpha = Math.min(1, pw / 1.5) * Math.max(0, 1 - boom);
    x.strokeStyle = hexA(A, 0.85); x.lineWidth = 2;
    x.beginPath(); x.arc(0, 0, R * 1.16, 0, PI2); x.stroke();
    x.beginPath(); x.arc(0, 0, R * 1.24, 0, PI2); x.stroke();
    for (let i = 0; i < 36; i++) {
      const a0 = (i / 36) * PI2, [p2, q2] = PRUNE[(i + 7) % 40];
      x.save(); x.rotate(a0); x.translate(R * 1.2, 0); x.rotate(Math.PI / 2);
      const s3 = R * 0.026;
      x.beginPath(); x.moveTo(-s3, 0); x.lineTo(s3, 0); x.moveTo(0, -s3); x.lineTo((p2 - 2) * s3 * 0.5, s3 * (q2 % 2 ? 1 : -1)); x.stroke();
      x.restore();
    }
    x.restore();
    x.globalAlpha = Math.max(0, 1 - boom);
    if (pw >= 2.4) {
      pst.zap -= dt * (1 + pw * 0.3);
      if (pst.zap <= 0) {
        pst.zap = 0.12 + Math.random() * 0.25;
        const a0 = Math.random() * PI2;
        pst.bolts.push({ pts: AF.kit.boltPts([cx + Math.cos(a0) * R * 1.2, cy + Math.sin(a0) * R * 1.2], [cx + Math.cos(a0 + 0.6) * R * 0.15, cy + Math.sin(a0 + 0.6) * R * 0.15], 12, R * 0.14), life: 0, max: 0.2, c: A });
      }
    }
  }
  for (let i = pst.waves.length - 1; i >= 0; i--) {
    const wv = pst.waves[i]; wv.life += dt;
    if (wv.life >= wv.max) { pst.waves.splice(i, 1); continue; }
    if (wv.life < 0) continue;
    const q = wv.life / wv.max;
    x.strokeStyle = hexA(wv.c, 0.85 * (1 - q) * (1 - q)); x.lineWidth = 5 * (1 - q) + 0.5;
    x.beginPath(); x.arc(cx, cy, R * (1 + q * 1.7), 0, PI2); x.stroke();
  }
  // 6. the core: white-hot, or a black hole with a bright edge for the Void and the Rift
  const core = R * (0.2 + Math.sin(t * 3) * 0.01 + k * 0.08 + pw * 0.015) * (1 + col * 1.6);
  if (th.dark && g.id === "void") {
    x.globalCompositeOperation = "source-over";
    x.fillStyle = "#050208"; x.beginPath(); x.arc(cx, cy, core * 0.9, 0, PI2); x.fill();
    x.globalCompositeOperation = "lighter";
    x.strokeStyle = hexA("#ffd6f4", 0.9); x.lineWidth = 2.5; x.shadowColor = "#ff3bc8"; x.shadowBlur = 20;
    x.beginPath(); x.arc(cx, cy, core * 0.95, 0, PI2); x.stroke(); x.shadowBlur = 0;
  } else {
    gr = x.createRadialGradient(cx, cy, 0, cx, cy, core * 2.2);
    gr.addColorStop(0, hexA("#ffffff", 1)); gr.addColorStop(0.25, hexA(o.tint || o.rainbow ? "#ffffff" : th.hot, 0.95)); gr.addColorStop(0.55, hexA(A, 0.5)); gr.addColorStop(1, hexA(Bc, 0));
    x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, core * 2.2, 0, PI2); x.fill();
  }
  // a summon kicks a ring of light out
  if (k > 0.05) {
    x.strokeStyle = hexA(th.hot, k * k * 0.8); x.lineWidth = 3 * k;
    x.beginPath(); x.arc(cx, cy, R * (1.05 + (1 - k) * 0.4), 0, PI2); x.stroke();
  }
  x.globalCompositeOperation = "source-over";
  x.globalAlpha = 1;
}
// the Summon tab's portal
let tabPortal = null;
function drawPortal(t, dt) {
  const c = $("#portal"); if (!c || UI.tab !== "summon") return;
  portalKick = Math.max(0, portalKick - dt * 1.5);
  if (!tabPortal || tabPortal.g !== S().gate) tabPortal = newPortal(S().gate);
  paintPortal(c, t, dt, tabPortal, { kick: portalKick });
}
// the reveal's opening: the gate's portal opens over the screen, climbs every rarity the pull reaches (its colours,
// its name, a shockwave, faster and denser each step), folds in on itself and bursts. Resolves with the point the
// cards fly out from. skipped() ends each stage early.
async function portalOpening(ov, top, skipped) {
  const c = h(`<canvas class="rv-portal"></canvas>`), lab = h(`<div class="rv-tier"></div>`);
  ov.insertBefore(c, ov.children[1]); ov.appendChild(lab);
  const st = newPortal(S().gate), o = { scale: 0, power: 0, kick: 0, tint: null, rainbow: false, collapse: 0, boom: 0, dpr: 1.5 };
  let alive = true, last = performance.now(), gt = 0;
  const run = now => {
    const dt = Math.min(0.05, (now - last) / 1000) * AF.time.scale; last = now; gt += dt;
    o.kick = Math.max(0, o.kick - dt * 2.2);
    if (c.isConnected) paintPortal(c, gt, dt, st, o);
    if (alive && c.isConnected) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
  const tween = (key, to, ms) => new Promise(res => {
    const from = o[key], t0 = performance.now();
    const f = now => {
      const q = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - q, 3);
      o[key] = from + (to - from) * e;
      if (q < 1 && !skipped()) requestAnimationFrame(f); else { o[key] = to; res(); }
    };
    requestAnimationFrame(f);
  });
  // (29 Oct, request: "the summon sound effects ... doesnt sound like a vortex"): a vortex that turns faster with the
  // portal (AF.vortex in fx.js), a chime a step higher per rarity
  sfx("arrive");
  let vx = AF.vortex();
  await tween("scale", 0.3, 650);
  for (let s = 1; s <= top && !skipped(); s++) {
    const cols = RANK_COLORS(s), cc = FX.center(c);
    o.tint = [cols[0], cols[1] || cols[0]]; o.rainbow = s === 4 || s === 9; o.power = s * 0.6; o.kick = 1;
    st.waves.push({ life: 0, max: 0.45, c: s === 5 ? "#ffffff" : cols[0] }, { life: -0.08, max: 0.5, c: "#ffffff" });
    lab.textContent = AF.RARITIES[s].name; lab.className = "rv-tier on r-" + AF.RARITIES[s].id;
    lab.animate([{ transform: "translate(-50%, 0) scale(1.6)", opacity: 0 }, { transform: "translate(-50%, 0) scale(1)", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,1.4,.4,1)" });
    vx = vx || AF.vortex();
    if (vx) { vx.power(s / 9); vx.kick(); }
    sfx("chime", { i: s }); FX.shake(0.06 + s * 0.05);
    FX.burst(cc.x, cc.y, { colors: cols, n: 10 + s * 6, speed: 300 + s * 60, shape: s >= 3 ? "star" : "spark", gravity: 0, life: 0.8 });
    if (s >= 4) {
      ov.classList.add("deep");
      FX.slowmo(0.4, 1.3);
      portalRays(st, { rainbow: s === 4 || s === 9, c: s === 5 ? "#ffffff" : s >= 7 ? cols[0] : "#fff2b8", life: 1.8, n: 20 + (s - 4) * 4 });
      if (s === 5) { document.body.classList.add("glitching"); setTimeout(() => document.body.classList.remove("glitching"), 650); }
      if (s === 6) { FX.flash("#fffbe8", 0.9, 0.7); if (vx) vx.surge(1.4); }
      // past Divine every step hits harder: aurora, then molten, then the screen goes black before the top one
      if (s === 7) { FX.flash("#7dffcf", 0.7, 0.55); FX.burst(cc.x, cc.y, { colors: RANK_COLORS(7), n: 60, shape: "star", speed: 600, gravity: 0, life: 1.4 }); }
      if (s === 8) { FX.flash("#ff4a1a", 0.7, 0.6); FX.shake(0.8); FX.burst(cc.x, cc.y, { colors: RANK_COLORS(8), n: 90, shape: "spark", speed: 800, gravity: -150, life: 1.2 }); sfx("burst", { rank: 6 }); }
      if (s === 9) {
        FX.flash("#000000", 1.2, 0.97); FX.slowmo(0.3, 2.6); if (vx) vx.surge(2.2); FX.shake(1.2);
        setTimeout(() => { FX.flash("#ffffff", 0.8, 0.9); portalRays(st, { rainbow: true, life: 3, n: 36, len: 1800, spin: 0.6 }); }, 700);
      }
    }
    await gUntil(s >= 4 ? 760 : 360, skipped);
  }
  // fold in, then burst
  lab.className = "rv-tier";
  if (vx) vx.collapse(skipped() ? 0.14 : 0.42);
  sfx("swell", { r: skipped() ? 2 : 1.3 });
  o.power = Math.max(o.power, 1.5);
  await tween("collapse", 1, skipped() ? 140 : 420);
  const cc = FX.center(c), cols = RANK_COLORS(top);
  FX.flash("#ffffff", 0.35, top >= 4 ? 0.85 : 0.6); FX.shake(0.4 + top * 0.07);
  FX.burst(cc.x, cc.y, { colors: cols, n: 60 + top * 18, speed: 900, shape: "star", gravity: 200, life: 1.2 });
  FX.ring(cc.x, cc.y, { c: AF.RARITIES[top].color, rainbow: top === 4 || top === 9, r: 520, w: 16, life: 0.8 });
  if (vx) vx.end();
  sfx("portalBurst", { rank: top });
  o.collapse = 0; o.kick = 1;
  tween("boom", 1, 650).then(() => { alive = false; c.remove(); lab.remove(); });
  return cc;
}
// a card coming out of the portal into its place
function flyOut(card, from, delay = 0) {
  const r = card.getBoundingClientRect(), dx = from.x - (r.left + r.width / 2), dy = from.y - (r.top + r.height / 2);
  card.animate([{ transform: `translate(${dx}px, ${dy}px) scale(.08) rotateY(200deg)`, opacity: 0 },
    { transform: `translate(${dx * 0.12}px, ${dy * 0.12}px) scale(1.14) rotateY(-14deg)`, opacity: 1, offset: 0.62 },
    { transform: "scale(.96) rotateY(5deg)", offset: 0.82 }, { transform: "none" }], { duration: 720, delay, easing: "cubic-bezier(.2,.8,.3,1)", fill: "backwards" });
}

// ---- the summon reveal ----
function orbClass(s) { return "orb o-" + s; }
function endReveal(ov, onAny) {
  ov.removeEventListener("pointerdown", onAny);
  UI.skipReveal = null; UI.abortReveal = null;
  ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }).onfinish = () => ov.remove();
}
// waits that end early when cond() turns true; gUntil counts game time, so slow motion stretches it
const until = (ms, cond) => new Promise(res => {
  const t0 = performance.now();
  const f = now => (cond() || now - t0 >= ms ? res() : requestAnimationFrame(f));
  requestAnimationFrame(f);
});
const gUntil = (ms, cond) => new Promise(res => {
  let left = ms / 1000, last = performance.now();
  const f = now => { left -= ((now - last) / 1000) * AF.time.scale; last = now; if (cond() || left <= 0) res(); else requestAnimationFrame(f); };
  requestAnimationFrame(f);
});
async function revealSummon(units, fast) {
  const ov = h(`<div class="reveal n${units.length === 1 ? 1 : 10}${fast ? " auto" : ""}"><div class="rv-dim"></div><div class="rv-grid"></div><div class="rv-foot"></div></div>`);
  $("#layer").appendChild(ov);
  $(".rv-dim", ov).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: "forwards" });
  const grid = $(".rv-grid", ov), foot = $(".rv-foot", ov);
  const ranks = units.map(rankOf), top = Math.max(...ranks), shinies = units.filter(shinyWorth);
  // (29 Oct, request: "make auto summon the whole no interruption duration"): auto summons play the full reveal too,
  // then close themselves; quick is no longer used for them
  const big = top >= 4 || shinies.length > 0, quick = false;
  // (28 Oct, request: "click anywhere to skip so i dont need to move my mouse while summoning"): a click anywhere
  // or Space jumps to the cards, and once they're out the next one closes the reveal
  let skip = false, done = false, close = null, aborted = false;
  const hint = h(`<div class="rv-hint">Click anywhere to skip</div>`);
  foot.appendChild(hint);
  const onAny = () => {
    if (done) { if (close) close(); return; }
    if (!skip) { skip = true; AF.time.target = 1; hint.style.visibility = "hidden"; }
  };
  ov.addEventListener("pointerdown", onAny);
  UI.skipReveal = onAny;
  UI.abortReveal = () => { aborted = true; skip = true; done = true; AF.time.target = 1; ov.style.visibility = "hidden"; $$(".banner").forEach(b => b.remove()); if (close) close(); };
  // empty landing spots, sized like the cards, so nothing shifts as the cards arrive
  const slots = units.map(() => { const s = h(`<div class="rv-slot"></div>`); grid.appendChild(s); return s; });
  // the portal opens, climbs every rarity up to the best pull, folds in and bursts
  const from = await portalOpening(ov, top, () => skip);
  if (aborted) return endReveal(ov, onAny);
  // the cards fly out of it, one after another
  let best = null;
  for (let i = 0; i < units.length; i++) {
    if (aborted) break;
    const sl = slots[i], r = ranks[i], u = units[i];
    const c = FX.center(sl);
    FX.burst(c.x, c.y, { colors: RANK_COLORS(r), n: (quick ? 8 : 16) + r * 12, speed: 280 + r * 90, shape: r >= 4 ? "star" : "spark", gravity: 300 });
    FX.ring(c.x, c.y, { c: AF.RARITIES[r].color, rainbow: r === 4, r: 80 + r * 26 });
    if (r >= 3 && !quick) { FX.flash(r === 5 ? "#000000" : "#ffffff", 0.32, r >= 5 ? 0.85 : 0.45); FX.shake(0.2 + (r - 3) * 0.22); }
    if (r >= 6) { FX.burst(innerWidth / 2, -20, { colors: r >= 9 ? FX.RAINBOW : r >= 7 ? RANK_COLORS(r) : ["#fff2b8", "#ffffff", "#ffd76a", "#bfefff"], n: 160, shape: "confetti", angle: Math.PI / 2, spread: 1.2, speed: 700, gravity: 500, life: 2.4, add: false }); }
    sfx(units.length === 1 || r >= 3 ? "burst" : "tick", { rank: r, i: i });
    const card = cardEl(u, { cls: units.length === 1 ? "lg rv-card" : "rv-card", hero: units.length === 1, click: () => {} });
    if (u.isNew) card.appendChild(h(`<div class="newtag">New</div>`));
    if (u.autoReleased) card.appendChild(h(`<div class="reltag">Sold</div>`));
    sl.innerHTML = ""; sl.appendChild(card);
    flyOut(card, from);
    if (!best || r > rankOf(best.u)) best = { u, card };
    if (units.length > 1) await gUntil(quick ? 35 : skip ? 15 : 110, () => false);
  }
  if (aborted) return endReveal(ov, onAny);
  if (top >= 3 && !quick) {
    const r = AF.RARITIES[top];
    banner(r.name + "!", AF.UNIT[best.u.k].name, "rk" + top);
    if (units.length > 1) best.card.classList.add("best");
  }
  if (shinies.length) shinyFlourish(slots.filter((s, i) => shinyWorth(units[i])).map(s => $(".ucard", s)), shinies, 0, top >= 3);
  // a short guard so the click that skipped doesn't also close it
  if (skip && !aborted) await FX.wait(260);
  done = true;
  if (aborted) return endReveal(ov, onAny);
  if (quick) await new Promise(res => { close = res; setTimeout(res, 650); });
  else {
    hint.textContent = "Click anywhere to continue";
    hint.style.visibility = "";
    FX.enter(hint);
    // auto summon carries on by itself once a big pull has had its moment
    await new Promise(res => { close = res; if (fast) setTimeout(res, shinies.length ? 3200 : big ? 2200 : 1400); });
    sfx("click");
  }
  endReveal(ov, onAny);
  await FX.wait(120);
}
// (30 Oct) a shiny worth a moment: of the best rarity you've pulled, or one below it
const shinyWorth = u => !!u.sh && rankOf(u) >= (S().stats.bestRank || 0) - 1;
const PEARL = ["#ffffff", "#d6f6ff", "#ffd8f4", "#fff4d0", "#e4e8ff"];
// a shiny gets its own moment: a pearl burst on the card, its own banner and chime (low: under a rarity banner)
function shinyFlourish(cards, units, delay, low) {
  setTimeout(() => {
    cards.forEach(c => {
      if (!c || !c.isConnected) return;
      const p = FX.center(c);
      FX.burst(p.x, p.y, { colors: PEARL, n: 90, shape: "star", speed: 700, gravity: 200, life: 1.3 });
      FX.ring(p.x, p.y, { c: "#e8f8ff", r: 280, w: 12 });
      FX.pop(c, 1);
    });
    FX.flash("#ffffff", 0.3, 0.4);
    banner("SHINY!", units.map(u => AF.nameOf(u)).join(", "), "rkshiny" + (low ? " bn-low" : ""));
  }, delay);
}

// ---- 50 and 100 at once: one orb, then a summary and the pulls worth seeing ----
async function revealBulk(units, fast) {
  const ov = h(`<div class="reveal bulk${fast ? " auto" : ""}"><div class="rv-dim"></div><div class="rv-bulk"></div><div class="rv-foot"></div></div>`);
  $("#layer").appendChild(ov);
  $(".rv-dim", ov).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: "forwards" });
  const stage = $(".rv-bulk", ov), foot = $(".rv-foot", ov);
  const ranks = units.map(rankOf), top = Math.max(...ranks), allSh = units.filter(u => u.sh), shinies = allSh.filter(shinyWorth);
  let skip = false, done = false, close = null, aborted = false;
  const hint = h(`<div class="rv-hint">Click anywhere to skip</div>`);
  foot.appendChild(hint);
  const onAny = () => { if (done) { if (close) close(); return; } if (!skip) { skip = true; AF.time.target = 1; hint.style.visibility = "hidden"; } };
  ov.addEventListener("pointerdown", onAny);
  UI.skipReveal = onAny;
  UI.abortReveal = () => { aborted = true; skip = true; done = true; AF.time.target = 1; ov.style.visibility = "hidden"; $$(".banner").forEach(b => b.remove()); if (close) close(); };
  const from = await portalOpening(ov, top, () => skip);
  if (aborted) return endReveal(ov, onAny);
  // the summary: a count per rarity, then the cards worth a look
  const counts = AF.RARITIES.map(r => [r, units.filter(u => AF.UNIT[u.k].rarity === r.id).length]).filter(([, n]) => n);
  const news = units.filter(u => u.isNew).length, rel = units.filter(u => u.autoReleased).length;
  const notable = units.filter(u => rankOf(u) >= 3 || u.sh || u.isNew)
    .sort((a, b) => (b.sh - a.sh) || rankOf(b) - rankOf(a)).slice(0, 10);
  const show = notable.length ? notable : units.slice().sort((a, b) => rankOf(b) - rankOf(a)).slice(0, 5);
  stage.innerHTML = `<div class="bulk-sum">${counts.map(([r, n]) => `<span class="bc r-${r.id}"><i class="rdot"></i>${r.name}<b>&times;${n}</b></span>`).join("")}
    ${allSh.length ? `<span class="bc shinyc">Shiny<b>&times;${allSh.length}</b></span>` : ""}${news ? `<span class="bc newc">New<b>&times;${news}</b></span>` : ""}
    ${rel ? `<span class="bc relc">Auto sold<b>&times;${rel}</b></span>` : ""}</div><div class="bulk-grid"></div>`;
  const grid = $(".bulk-grid", stage);
  show.forEach((u, i) => {
    const card = cardEl(u, { cls: "rv-card", click: () => {} });
    if (u.isNew) card.appendChild(h(`<div class="newtag">New</div>`));
    if (u.autoReleased) card.appendChild(h(`<div class="reltag">Sold</div>`));
    grid.appendChild(card);
    flyOut(card, from, i * 60);
  });
  FX.enter($(".bulk-sum", stage));
  if (top >= 3) banner(AF.RARITIES[top].name + "!", `${units.length} summons`, "rk" + top);
  if (shinies.length) shinyFlourish($$(".ucard.shiny", grid).filter(c => c._u && shinyWorth(c._u)), shinies, 0, top >= 3);
  if (skip && !aborted) await FX.wait(260);
  done = true;
  if (aborted) return endReveal(ov, onAny);
  hint.textContent = "Click anywhere to continue"; hint.style.visibility = ""; FX.enter(hint);
  await new Promise(res => { close = res; if (fast) setTimeout(res, top >= 4 || shinies.length ? 3000 : 1600); });
  sfx("click");
  endReveal(ov, onAny);
  await FX.wait(120);
}
function banner(title, sub, cls) {
  if (document.hidden) return; // (30 Oct) nobody would see it, and it would wait to play on the way back
  // (31 Oct) two at once stack: the next free row (middle, below, above) instead of the same spot
  if (!/bn-(low|high)/.test(cls || "")) {
    const taken = $$("#layer .banner:not(.out)").map(x => (x.classList.contains("bn-low") ? 1 : x.classList.contains("bn-high") ? 2 : 0));
    const row = [0, 1, 2].find(r => !taken.includes(r));
    if (row) cls = (cls || "") + (row === 1 ? " bn-low" : " bn-high");
  }
  const b = h(`<div class="banner ${cls}"><div class="bn-band"></div><div class="bn-t">${[...title].map((ch, i) =>
    `<span style="animation-delay:${0.15 + i * 0.045}s">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("")}</div><div class="bn-s">${esc(sub)}</div></div>`);
  $("#layer").appendChild(b);
  setTimeout(() => b.classList.add("out"), 2300);
  setTimeout(() => b.remove(), 2900);
}

// ---------------- unit search ----------------
// (29 Oct, request: "please add a search bar for units everywhere you can in these unit selectors, dungeon, trait lab,
// etc"): one box on the Units tab, the unit picker (Area, Trait Lab, Defense team) and the Index. A unit matches when
// every word typed is in its name, its rarity, its trait, or "shiny"
// (30 Oct, "if you type farm or summon itll give you only those types"): and what it does in Defense
const kindWords = {};
function defWords(d) {
  if (kindWords[d.key] != null) return kindWords[d.key];
  const TD = AF.TD; let w = "";
  if (TD) {
    const A = TD.attackOf(d), k = A ? A.kind : null, st = k ? Object.assign({}, TD.KINDS[k], A.p || {}) : null;
    const style = k === "farm" ? "farm" : k ? TD.KINDS[k].style : TD.styleOf(d), reach = k === "farm" ? "" : TD.reachOf(d);
    w = [k, k && TD.KIND_NAME[k], style, TD.STYLES[style] && TD.STYLES[style].name, reach, reach === "hybrid" ? "hbd air" : "",
      A && A.name, A && A.el, st && st.slow ? "slow" : "", st && st.stun ? "stun" : "", st && st.knock ? "knockback knock" : "",
      st && st.dot ? "burn dot" : "", A && A.sig ? "signature" : ""].filter(Boolean).join(" ");
  }
  return (kindWords[d.key] = " " + w.toLowerCase());
}
const unitText = u => { const d = AF.UNIT[u.k], tr = AF.traitOf(u); return `${d.name} ${AF.RAR[d.rarity].name}${tr ? " " + tr.name : ""}${u.sh ? " shiny" : ""}`.toLowerCase() + defWords(d); };
const unitMatch = (u, q) => !q || q.split(/\s+/).every(w => unitText(u).includes(w));
const noMatch = q => `<div class="empty-note">No units match &ldquo;${esc(q)}&rdquo;.</div>`;
// onChange gets the words typed, lower case, a moment after typing stops; o.focus puts the cursor in it where there's a
// mouse (a phone would throw its keyboard up over the list)
function searchBox(q, onChange, o = {}) {
  const el = h(`<label class="usearch${q ? " has" : ""}">${I.search}<input type="search" placeholder="Search units or types" value="${esc(q)}" spellcheck="false" autocomplete="off" aria-label="Search units"><button type="button" class="usearch-x" aria-label="Clear the search">${I.x}</button></label>`);
  const inp = $("input", el);
  let tm = 0;
  const set = v => { el.classList.toggle("has", !!v); clearTimeout(tm); tm = setTimeout(() => onChange(v.trim().toLowerCase()), 90); };
  inp.oninput = () => set(inp.value);
  // Esc empties the box first; on an empty box it lets go, so the next Esc closes the picker
  inp.onkeydown = e => { if (e.key !== "Escape") return; if (inp.value) { e.stopPropagation(); inp.value = ""; set(""); } else inp.blur(); };
  $(".usearch-x", el).onclick = e => { e.preventDefault(); inp.value = ""; set(""); inp.focus(); };
  if (o.focus && matchMedia("(pointer: fine)").matches) setTimeout(() => inp.focus({ preventScroll: true }), 60);
  return el;
}

// ---------------- Units ----------------
const SORTS = { income: ["Income", (a, b) => G.income(b) - G.income(a)], rarity: ["Rarity", (a, b) => rankOf(b) - rankOf(a) || G.income(b) - G.income(a)],
  level: ["Level", (a, b) => b.lv - a.lv || G.income(b) - G.income(a)], trait: ["Trait", (a, b) => (G.trait(b) ? G.trait(b).mult : 0) - (G.trait(a) ? G.trait(a).mult : 0) || G.income(b) - G.income(a)],
  newest: ["Newest", (a, b) => b.uid - a.uid] };
const PER = 40;
function pageUnits() {
  const p = $("#p-units");
  if (!p.firstChild) {
    p.innerHTML = `
    <div class="toolbar w3-head">
      <div class="seg" id="uSort">${Object.entries(SORTS).map(([k, [n]]) => `<button data-s="${k}">${n}</button>`).join("")}</div>
      <div class="chips" id="uFilt"><button data-f="all">All</button>${AF.RARITIES.map(r => `<button data-f="${r.id}" class="r-${r.id}"><i class="rdot"></i>${r.name}</button>`).join("")}</div>
      <span class="count" id="uCount"></span>
      <button class="btn ghost sm" id="bBulk">Sell&hellip;</button>
    </div>
    <div class="grid" id="uGrid"></div>
    <div class="pager" id="uPager"></div>`;
    $$("#uSort button").forEach(b => b.onclick = () => { UI.sort = b.dataset.s; UI.page = 0; sfx("click"); renderUnits(true); });
    $$("#uFilt button").forEach(b => b.onclick = () => { UI.filter = b.dataset.f; UI.page = 0; sfx("click"); renderUnits(true); });
    $("#bBulk").onclick = () => { sfx("click"); openBulk(); };
    $("#uCount").before(searchBox(UI.q, q => { UI.q = q; UI.page = 0; renderUnits(); }));
  }
  renderUnits(!W3D); // in 3D the page pops in whole; the cascade is for re-sorting
  if (W3D) showcase3D();
}
// in 3D the Units tab's hall: the picked unit (your best at first) on the dais and its Defense range on the floor. The
// six units that stood round it went on 29 Oct ("just remove those units"). A figure is only rebuilt when it changes
function showcase3D(u) {
  const list = S().units.slice().sort(SORTS.income[1]);
  if (u) UI.showU = u.uid;
  const pick = (UI.showU && G.unit(UI.showU)) || list[0] || null;
  if (HUB.hall.show ? HUB.hall.show.u !== pick : pick) HUB.showcase(pick);
}
function unitList() {
  return S().units.filter(u => (UI.filter === "all" || AF.UNIT[u.k].rarity === UI.filter) && unitMatch(u, UI.q)).sort(SORTS[UI.sort][1]);
}
function renderUnits(enter) {
  const grid = $("#uGrid"); if (!grid) return;
  $$("#uSort button").forEach(b => b.classList.toggle("on", b.dataset.s === UI.sort));
  $$("#uFilt button").forEach(b => b.classList.toggle("on", b.dataset.f === UI.filter));
  const list = unitList(), pages = Math.max(1, Math.ceil(list.length / PER));
  UI.page = Math.min(UI.page, pages - 1);
  // (31 Oct) the backpack: how full it is, amber past 90%, red when full
  const held = S().units.length, uc = $("#uCount");
  uc.innerHTML = `${list.length === held ? "" : `${fmt(list.length)} shown &middot; `}Backpack <b>${fmt(held)}</b> / ${fmt(G.BAG)}`;
  uc.classList.toggle("bag-warn", held >= G.BAG * 0.9 && held < G.BAG); uc.classList.toggle("bag-full", held >= G.BAG);
  grid.innerHTML = "";
  if (!list.length) grid.innerHTML = UI.q ? noMatch(UI.q) : `<div class="empty-note">No units here yet. Summon some on the Summon tab.</div>`;
  list.slice(UI.page * PER, UI.page * PER + PER).forEach((u, i) => {
    const c = cardEl(u, { click: () => { if (W3D) showcase3D(u); openUnit(u); } });
    grid.appendChild(c);
    if (enter) FX.enter(c, Math.min(i, 20) * 18);
  });
  const pg = $("#uPager");
  pg.innerHTML = pages > 1 ? Array.from({ length: pages }, (_, i) => `<button class="${i === UI.page ? "on" : ""}" data-p="${i}">${i + 1}</button>`).join("") : "";
  $$("button", pg).forEach(b => b.onclick = () => { UI.page = +b.dataset.p; sfx("click"); renderUnits(true); $("#main").scrollTo?.(0, 0); window.scrollTo(0, 0); });
}
function openBulk() {
  const body = h(`<div class="bulk"><p>Sell every unit of a rarity that is not in your Area, not locked, not shiny, and has no trait better than Tempest. You get a little &yen; for each.</p>
    <div class="bulk-list">${AF.RARITIES.map(r => {
      const list = S().units.filter(u => AF.UNIT[u.k].rarity === r.id && u.eq < 0 && !u.lock && !u.sh && G.tier(u) < 3);
      const yen = list.reduce((s, u) => s + G.releaseValue(u), 0);
      return `<div class="bulk-row r-${r.id}"><span><i class="rdot"></i>${r.name}</span><em>${list.length} unit${list.length === 1 ? "" : "s"} &middot; ${fmt(yen)} &yen;</em>
        <button class="btn sm${list.length ? "" : " off"}" data-r="${r.id}" ${list.length ? "" : "disabled"}>${r.order >= 3 ? "Hold to sell" : "Sell"}</button></div>`;
    }).join("")}</div></div>`);
  const close = modal(body, { title: "Sell units", cls: "narrow" });
  $$("button[data-r]", body).forEach(b => {
    const fire = () => {
      const r = b.dataset.r;
      const ids = S().units.filter(u => AF.UNIT[u.k].rarity === r && u.eq < 0 && !u.lock && !u.sh && G.tier(u) < 3).map(u => u.uid);
      const res = G.release(ids);
      sfx("collect", { size: 1 }); toast(`Sold ${res.n} unit${res.n === 1 ? "" : "s"} for ${fmt(res.yen)} ¥.`);
      close(); refresh(); if (UI.tab === "units") renderUnits(); G.save();
    };
    if (AF.RAR[b.dataset.r].order >= 3) holdButton(b, 1100, fire); else b.onclick = fire;
  });
}

// ---- one unit in detail ----
// the Defense side of a unit: the board's own hover card laid flat; big for a team platform's window, with its numbers
// on the coloured icons the world's hover card uses
const SI = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const STAT_IC = {
  atk: SI('<path d="M14.5 17.5 4 7V4h3l10.5 10.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/>'),
  spa: SI('<path d="M6.5 3h11M6.5 21h11"/><path d="M7.5 3c0 4.5 9 5 9 9s-9 4.5-9 9"/><path d="M16.5 3c0 4.5-9 5-9 9s9 4.5 9 9"/>'),
  rng: SI('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  pay: SI('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 10a2.5 2 0 0 1 2.5-1.8c1.5 0 2.5.8 2.5 1.9 0 2.6-5 1.6-5 4.1 0 1.1 1 1.9 2.5 1.9a2.5 2 0 0 0 2.5-1.8"/>'),
  cost: SI('<path d="M4 7h16v12H4z"/><path d="M8 7V5h8v2"/><path d="M4 12h16"/>'),
};
const statRow = (k, v, c, n) => `<div class="ht-row" style="--sc:${c}"${n === undefined ? "" : ` data-k="${k}" data-n="${n}"`}><i>${STAT_IC[k]}</i><b>${v}</b></div>`;
const inTeam = u => S().td.team.includes(u.uid);
// (3 Nov, owner: "make the info card look nicer like this hover card looks really nice"): the hover card's coloured stat tiles, large
function defBlock(u) {
  const tg = AF.Defense && AF.Defense.tags; if (!tg) return "";
  const TD = AF.TD, s = TD.statsOf(u), A = TD.attackOfU(u), cs = tg.condLines(s.cfg), { num, sec } = tg, pay = s.farm ? TD.farmPay(null, { s }, 0) : 0;
  const cost = `<div class="ht-row ht-cost" style="--sc:#3fd07f"><i>${STAT_IC.cost}</i><b>$${num(s.cost)}<small>to place</small></b></div>`;
  const st = `<div class="um-bigst">${s.farm ? statRow("pay", "$" + num(pay) + "<small>a wave</small>", "#ffc83a") + cost
    : statRow("atk", num(s.atk) + "<small>damage</small>", "#ff4a5a") + statRow("spa", sec(s.spa) + "<small>per attack</small>", "#3fd7ff") + statRow("rng", s.rng.toFixed(1) + "<small>range</small>", "#ffc83a") + cost}</div>
      ${s.farm ? `<div class="um-dps"><span>Fully upgraded</span><b>$${num(TD.farmPay(null, { s }, TD.UP.max))}</b></div>` : `<div class="um-dps"><span>Damage a second</span><b>${num(TD.dps(s))}</b></div>`}`;
  return `<div class="um-def big">
    <div class="td-hc-atk"><b>${esc(s.name || TD.STYLES[s.style].name)}</b><span class="td-hc-tags">${tg.styleTag(s.style, s.kind)}${tg.reachTag(s.reach)}</span></div>
    <p class="td-hc-info">${esc(s.kind ? TD.KIND_INFO[s.kind] || "" : "")} ${esc(TD.REACH_INFO[s.reach] || "")}</p>
    ${st}${cs.length ? `<ul class="td-hc-c">${cs.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
    ${A && A.sig ? `<div class="td-hc-sig"><b>${esc(A.sig.name)}</b><span>Signature move, every ${A.sig.every === 3 ? "third" : "fourth"} attack: half again the damage.</span></div>` : tg.relLines ? tg.relLines(u.k, u) : ""}
    ${s.cap ? `<div class="td-hc-f"><span><b>1</b> on the board at most</span></div>` : ""}</div>`;
}
// (29 Oct, Chris on the hub: "the area and team ui should be slightly different, showing the information thats needed
// more and the info thats not is smaller or further down ... i was clicking these buttons and didnt know which was
// which, it needs to be a seperate ui"). o.ctx says where it was opened from:
//   "area"    a plot in the world: the farm side in full, Defense as one small line, Swap / Take off for that plot
//   "defense" a team platform: Defense large, the farm side as one small line, Swap / Take out for that slot
//   none      everywhere else: both sides, Place in Area, Add to Defense team, Lock, Sell
function openUnit(u, o = {}) {
  sfx("click");
  const d = AF.UNIT[u.k], ctx = o.ctx || null;
  const head = `<div class="um-head"><span class="rtag r-${d.rarity}">${AF.RAR[d.rarity].name}</span>${AF.speciesTag(d)}${ctx ? `<span class="um-ctx ${ctx}">${ctx === "area" ? `${I.area}Plot ${o.slot + 1}` : `${I.defense}Team slot ${o.slot + 1}`}</span>` : ""}${inTeam(u) && ctx !== "defense" ? `<span class="um-ctx defense">${I.defense}In your team</span>` : ""}<h2>${esc(AF.nameOf(u))}</h2></div>`;
  const farm = `<div class="um-inc"><b id="umInc"></b><span>&yen; per second</span></div>
      <dl class="um-stats" id="umStats"></dl>
      <div class="um-lv"><div class="um-lv-h"><span id="umLv"></span><span id="umCap"></span></div><div class="um-bar"><i id="umBar"></i></div></div>
      <div class="um-up"><button class="btn" data-n="1"></button><button class="btn" data-n="10"></button><button class="btn gold" data-n="999"></button></div>
      <div class="um-star"><div class="stars-big" id="umStars"></div><div class="um-star-t" id="umStarT"></div><button class="btn gold sm" id="umStar">Star up</button></div>`;
  const trait = `<div class="um-trait"><div id="umTrait"></div><button class="btn ghost sm" id="umRoll">Reroll trait</button></div>`;
  const acts = ctx === "area"
    ? `<div class="um-act main"><button class="btn" id="umSwap"><span>Swap unit</span></button><button class="btn ghost" id="umOff"><span>Take off plot ${o.slot + 1}</span></button></div>`
    : ctx === "defense"
      ? `<div class="um-act main"><button class="btn" id="umSwap"><span>Swap unit</span></button><button class="btn ghost" id="umOff"><span>Take out of team slot ${o.slot + 1}</span></button></div>`
      : `<div class="um-act"><button class="btn ghost" id="umEq"></button><button class="btn ghost" id="umTd"></button><button class="btn ghost" id="umLock"></button><button class="btn danger" id="umRel"></button></div>`;
  const right = head + (ctx === "defense" ? "" : farm) + trait + defBlock(u) + acts;
  const body = h(`<div class="umodal${ctx ? " ctx-" + ctx : ""}"><div class="um-left"></div><div class="um-right">${right}</div></div>`);
  const card = cardEl(u, { cls: "lg", hero: true });
  $(".um-left", body).appendChild(card);
  const close = modal(body, { cls: "wide um-win umr-" + d.rarity, style: `--umc:${AF.RAR[d.rarity].color}` });
  const $b = s => $(s, body);
  let combo = 0, comboT = 0;
  const paint = () => {
    const tr = G.trait(u);
    if ($b("#umInc")) {
      $b("#umInc").textContent = fmt(G.income(u));
      const cap = G.cap(u), st = G.stars(u);
      $b("#umStats").innerHTML = `
        <div><dt>Base</dt><dd>${fmt(d.base)} &yen;/s</dd></div>
        <div><dt>Roll</dt><dd class="${u.vr >= 1 ? "good" : "bad"}">${u.vr >= 1 ? "+" : ""}${((u.vr - 1) * 100).toFixed(1)}%</dd></div>
        <div><dt>Level</dt><dd>&times;${fmt(AF.levelMult(u.lv))}</dd></div>
        <div><dt>Trait</dt><dd>${AF.traitShort(tr)}</dd></div>
        <div><dt>Stars</dt><dd>&times;${+G.starMult(st).toFixed(2)}</dd></div>
        ${u.sh ? `<div class="shinyst"><dt>Shiny</dt><dd>&times;${AF.SHINY.mult}</dd></div>` : ""}
        ${G.globalMult() > 1 ? `<div><dt>Bonuses</dt><dd>&times;${fmt(G.globalMult())}</dd></div>` : ""}
        ${G.boost() > 1 ? `<div class="surgest"><dt>Surge</dt><dd>&times;${G.boost()}</dd></div>` : ""}`;
      $b("#umLv").textContent = `Lv ${u.lv}`;
      $b("#umCap").textContent = `Max Lv ${cap}`;
      $b("#umBar").style.width = (u.lv / cap) * 100 + "%";
      // stars: duplicates of this unit feed it
      const need = G.starNeed(u), have = G.fodder(u).length;
      $b("#umStars").innerHTML = starsHTML(st, AF.STARS.max);
      $b("#umStarT").innerHTML = need
        ? `Feed <b>${need}</b> cop${need === 1 ? "y" : "ies"} to reach ${st + 1} stars <span class="muted">(you have ${have})</span><small>Raises income to &times;${+G.starMult(st + 1).toFixed(2)} and max level to ${G.capAt(st + 1)}.</small>`
        : `<b>Fully starred.</b><small>&times;${+G.starMult(st).toFixed(2)} income, max level ${cap}.</small>`;
      const sb = $b("#umStar");
      sb.hidden = !need; sb.classList.toggle("off", have < need);
      $$(".um-up .btn", body).forEach(b => {
        const n = +b.dataset.n, plan = G.upPlan(u, n);
        const max = u.lv >= cap;
        b.classList.toggle("off", !plan.levels);
        b.innerHTML = max ? "<span>Max level</span>" : n === 999
          ? `<span>Max${plan.levels ? " +" + plan.levels : ""}</span><small>${fmt(plan.levels ? plan.cost : G.upCost(u))} &yen;</small>`
          : `<span>+${n} Lv</span><small>${fmt(plan.levels === n ? plan.cost : plan.want)} &yen;</small>`;
        b.disabled = max;
      });
    }
    $b("#umTrait").innerHTML = tr ? chipHTML(tr) + `<span class="um-perk">${esc(perkLine(tr))}</span>` : `<span class="muted">No trait yet</span>`;
    if ($b("#umEq")) {
      $b("#umEq").textContent = u.eq >= 0 ? "Take out of Area" : "Place in Area";
      $b("#umTd").textContent = inTeam(u) ? "Take out of team" : "Add to Defense team";
      $b("#umLock").innerHTML = `${I.lock}<span>${u.lock ? "Unlock" : "Lock"}</span>`;
      $b("#umLock").classList.toggle("on", u.lock);
      const rel = $b("#umRel");
      rel.innerHTML = `<span>${u.eq >= 0 || u.lock ? "Can't sell" : rankOf(u) >= 3 || G.tier(u) >= 3 ? "Hold to sell" : "Sell"}</span><small>${fmt(G.releaseValue(u))} &yen;</small>`;
      rel.classList.toggle("off", u.eq >= 0 || u.lock);
    }
    patchCard(card, u); patchAllCards(u);
  };
  paint();
  $$(".um-up .btn", body).forEach(b => b.onclick = () => {
    const n = +b.dataset.n;
    const got = G.upgrade(u.uid, n);
    if (!got) { if (u.lv < G.cap(u)) broke(b, G.upPlan(u, 1).want); return; }
    const now = performance.now(); combo = now - comboT < 900 ? combo + 1 : 0; comboT = now;
    sfx("pop", { i: combo });
    FX.squash(b); FX.pop(card, 0.5);
    const c = FX.center(card);
    FX.burst(c.x, c.y + 40, { colors: ["#7dff9a", "#ffffff", "#ffd23a"], n: 14 + Math.min(30, got * 3), shape: "star", speed: 380, gravity: 500 });
    floatText($(".ucard-lv", card) || card, `+${got} Lv`, "green");
    paint(); refresh(); G.save();
  });
  const star = $b("#umStar");
  if (star) star.onclick = e => {
    const r = G.starUp(u.uid);
    if (r.err === "copies") { FX.nope(e.currentTarget); sfx("error"); toast(`You need ${r.need} spare cop${r.need === 1 ? "y" : "ies"} of ${d.name}. Locked, placed, shiny and Solar+ copies are never used.`, "bad"); return; }
    if (r.err) return;
    sfx("unlock"); sfx("reveal", { rank: 2 + G.stars(u) / 2 });
    FX.pop(card, 1.1); FX.shake(0.3);
    const c = FX.center(card);
    FX.burst(c.x, c.y, { colors: ["#ffd23a", "#fff3a8", "#ffffff"], n: 70, shape: "star", speed: 620, gravity: 300 });
    FX.ring(c.x, c.y, { c: "#ffd23a", r: 260, w: 10 });
    floatText(card, `${G.stars(u)} stars!`, "gold");
    paint(); refresh(); if (UI.tab === "units") renderUnits(); G.save();
  };
  $b("#umRoll").onclick = () => { S().opts.lab = u.uid; close(); go("traits"); };
  // a plot or a team platform: swap the unit on it, or take it off
  if (ctx) {
    $b("#umSwap").onclick = () => { close(); if (ctx === "area") pickPlot(o.slot); else AF.Defense.choose(o.slot); };
    $b("#umOff").onclick = () => {
      close();
      if (ctx === "area") { G.unequip(u.uid); sfx("unequip"); renderSlots(); }
      else AF.Defense.setTeam(AF.Defense.teamUnits().filter(x => x !== u));
      toast(`${AF.nameOf(u).split(",")[0]} is off ${ctx === "area" ? "plot" : "team slot"} ${o.slot + 1}.`); G.save();
    };
    return;
  }
  $b("#umEq").onclick = e => {
    if (u.eq >= 0) { G.unequip(u.uid); sfx("unequip"); }
    else {
      const free = G.slotsView().findIndex(x => !x);
      if (free < 0) {
        const worst = G.slotsView().slice().sort((a, b) => G.income(a) - G.income(b))[0];
        G.equip(u.uid, worst.eq); toast(`Swapped out ${AF.UNIT[worst.k].name}.`);
      } else G.equip(u.uid, free);
      sfx("equip"); FX.pop(card, 0.6);
    }
    paint(); refresh(); G.save();
  };
  $b("#umTd").onclick = () => {
    const team = AF.Defense.teamUnits();
    if (inTeam(u)) { AF.Defense.setTeam(team.filter(x => x !== u)); sfx("unequip"); }
    else if (team.length >= 6) { FX.nope($b("#umTd")); sfx("error"); toast("Your team is full. Take a unit out first.", "bad"); return; }
    else { AF.Defense.setTeam(team.concat(u)); sfx("equip"); FX.pop(card, 0.6); }
    paint(); G.save();
  };
  $b("#umLock").onclick = () => { u.lock = !u.lock; sfx("click"); paint(); G.save(); };
  const rel = $b("#umRel");
  const doRel = () => {
    if (u.eq >= 0 || u.lock) { FX.nope(rel); sfx("error"); return; }
    if (inTeam(u)) AF.Defense.setTeam(AF.Defense.teamUnits().filter(x => x !== u));
    const r = G.release([u.uid]);
    sfx("collect", { size: 1 }); toast(`Sold ${AF.nameOf(u)} for ${fmt(r.yen)} ¥.`);
    close(); refresh(); if (UI.tab === "units") renderUnits(); G.save();
  };
  if (rankOf(u) >= 3 || G.tier(u) >= 3) holdButton(rel, 1100, doRel); else rel.onclick = doRel;
}
// a plot in the 3D world: pick the unit to stand on it
function pickPlot(i) {
  pickUnit(`Plot ${i + 1}`, u2 => { G.equip(u2.uid, i); sfx("equip"); renderSlots(false, i); refresh(); G.save(); }, { exclude: x => x.eq >= 0 });
}

// pick a unit from your collection
function pickUnit(title, done, o = {}) {
  let filt = "all", q = "";
  // (30 Oct, "i need to see the defense stats on hover"): the world's hover card, beside the pointer (gone with the picker)
  const ptip = h(`<div class="w3-tip pick-tip" hidden></div>`);
  // (30 Oct) the list scrolls in its own box under the filters, so a card never covers them
  const body = h(`<div class="picker"><div class="chips">${["all", ...AF.RARITIES.map(r => r.id)].map(f => `<button data-f="${f}" class="${f === "all" ? "on" : "r-" + f}">${f === "all" ? "All" : `<i class="rdot"></i>${AF.RAR[f].name}`}</button>`).join("")}</div><div class="pick-scroll"><div class="grid pick-grid"></div></div></div>`);
  const close0 = modal(body, { title, cls: "wide", onClose: () => ptip.remove() });
  document.body.appendChild(ptip);
  let ptipU = null;
  const tipAt = (u, e) => {
    if (!matchMedia("(pointer: fine)").matches) return;
    if (ptipU !== u) { ptipU = u; ptip.style.setProperty("--rc", AF.RAR[AF.UNIT[u.k].rarity].color); ptip.innerHTML = unitTip(u); }
    ptip.hidden = false;
    ptip.style.left = (e.clientX + 22 + ptip.offsetWidth > innerWidth - 12 ? e.clientX - 22 - ptip.offsetWidth : e.clientX + 22) + "px";
    ptip.style.top = Math.max(12, Math.min(innerHeight - ptip.offsetHeight - 12, e.clientY - 70)) + "px";
  };
  const tipOff = () => { ptip.hidden = true; ptipU = null; };
  $(".pick-scroll", body).addEventListener("scroll", tipOff, { passive: true });
  const close = () => { ptip.remove(); close0(); };
  // the search goes in the title row, by the close button, where there's room for it
  const head = body.closest(".modal").querySelector(".modal-head");
  head.insertBefore(searchBox("", v => { q = v; fill(false); }, { focus: true }), head.querySelector(".m-x"));
  const fill = (enter = true) => {
    const g = $(".pick-grid", body); g.innerHTML = "";
    // o.sort: the order (income by default); o.note: html shown under each card (Defense shows board stats there)
    const list = S().units.filter(u => (!o.exclude || !o.exclude(u)) && (filt === "all" || AF.UNIT[u.k].rarity === filt) && unitMatch(u, q)).sort(o.sort || SORTS.income[1]).slice(0, 60);
    if (!list.length) g.innerHTML = q ? noMatch(q) : `<div class="empty-note">Nothing to pick here.</div>`;
    list.forEach((u, i) => {
      const c = cardEl(u, { click: () => { close(); done(u); } });
      c.addEventListener("pointermove", e => tipAt(u, e)); c.addEventListener("pointerleave", tipOff);
      if (o.note) { const w = h(`<div class="pick-w"></div>`); w.appendChild(c); w.insertAdjacentHTML("beforeend", o.note(u)); g.appendChild(w); if (enter) FX.enter(w, i * 15); return; }
      g.appendChild(c); if (enter) FX.enter(c, i * 15);
    });
  };
  $$(".chips button", body).forEach(b => b.onclick = () => { filt = b.dataset.f; $$(".chips button", body).forEach(x => x.classList.toggle("on", x === b)); sfx("click"); fill(); });
  fill();
}

// ---------------- Trait Lab ----------------
function pageTraits() {
  const p = $("#p-traits");
  if (!p.firstChild) {
    p.innerHTML = `
    <div class="lab">
      <div class="lab-unit"><div class="lab-slot"><span class="lab-no n1">1</span><div id="labCard"></div><div class="lab-btns"><button class="btn ghost" id="bPick">Choose a unit</button><button class="btn ghost lab-out" id="bOut" hidden>Take out</button></div></div>
        <div class="lab-slot" id="labSlot2" hidden><span class="lab-no n2">2</span><div id="labCard2"></div><div class="lab-btns"><button class="btn ghost" id="bPick2">Choose a unit</button><button class="btn ghost lab-out" id="bOut2" hidden>Take out</button></div></div></div>
      <div class="lab-main">
        <div class="plates" id="plates">
          <div class="plate"><div class="plate-h"><b class="n1">1</b><span id="plateN1"></span></div><div class="sigil" id="sigil"><div class="sg-rays"></div><div class="sg-in"><div class="sg-glyph" id="sgG">?</div><div class="sg-name" id="sgN">No trait</div><div class="sg-mult" id="sgM">&times;1</div></div></div></div>
          <div class="plate" id="plate2" hidden><div class="plate-h"><b class="n2">2</b><span id="plateN2"></span></div><div class="sigil" id="sigil2"><div class="sg-rays"></div><div class="sg-in"><div class="sg-glyph">?</div><div class="sg-name">No trait</div><div class="sg-mult">&times;1</div></div></div></div>
        </div>
        <div class="lab-act">
          <button class="btn big" id="bRoll"><span>Reroll trait</span><small id="rollC">&mdash;</small></button>
          <button class="btn ghost forge" id="bForge" hidden><span>Fuse into Infinity</span><small id="forgeC"></small></button>
          <div class="lab-auto">
            <label class="switch"><input type="checkbox" id="autoRoll"><span class="sw"></span><span>Auto reroll until</span></label>
            <select id="stopAt">${AF.TRAITS.filter(t => t.tier >= 1 && t.id !== "golden").map((t, i, a) => `<option value="${t.mult}">${t.name}${i < a.length - 1 ? " or better" : ""}</option>`).join("")}<option value="-1">Golden (for farms)</option></select>
          </div>
        </div>
        <div class="hist" id="hist"></div><div class="hist hist2" id="hist2" hidden></div>
      </div>
      <aside class="panel odds" id="trOdds"></aside>
    </div>`;
    $("#bPick").onclick = () => { sfx("click"); pickUnit("Choose a unit for the Lab", u => { S().opts.lab = u.uid; renderLab(); G.save(); }, { exclude: u => u.uid === S().opts.lab2 }); };
    // (30 Oct) take a unit out of the Lab; unit 2 moves up when unit 1 leaves
    const takeOut = i => {
      if (UI.rollBusy) { toast("Wait for the roll to land."); return; }
      sfx("click");
      if (i === 0) { S().opts.lab = labUnit2() ? S().opts.lab2 : null; S().opts.lab2 = null; } else S().opts.lab2 = null;
      UI.hist2 = []; renderLab(); G.save();
    };
    $("#bOut").onclick = () => takeOut(0); $("#bOut2").onclick = () => takeOut(1);
    $("#bPick2").onclick = () => { sfx("click"); pickUnit("Choose a second unit for the Lab", u => { S().opts.lab2 = u.uid; renderLab(); G.save(); }, { exclude: u => u.uid === S().opts.lab }); };
    $("#bRoll").onclick = () => rollClick();
    $("#bForge").onclick = () => openForge();
    $("#stopAt").value = S().opts.stopMult;
    $("#stopAt").onchange = e => { S().opts.stopMult = +e.target.value; sfx("click"); G.save(); };
    $("#autoRoll").checked = !!UI.autoRoll;
    $("#autoRoll").onchange = e => { UI.autoRoll = e.target.checked; sfx("click"); if (UI.autoRoll) { onlyOneAuto("roll"); autoRoll(); } else syncPills(); };
    // (29 Oct, "trait lab has the same reroll animation but on a real screen in 3d space"): in 3D the plate and the
    // latest rolls move onto the Lab's screen in the world (the world lays it on with a CSS homography each frame)
    if (W3D) {
      $$(".w3-screen").forEach(e => e.remove()); // a reset or a loaded save rebuilds the pages
      const scr = h(`<div class="w3-screen"><div class="scr-top"><span>TRAIT LAB</span><span id="scrName"></span></div></div>`);
      scr.append($("#plates"), $("#hist"), $("#hist2"));
      document.body.insertBefore(scr, $("#app"));
      HUB.attachScreen(scr);
    }
  }
  renderLab();
}
// in 3D: the Lab's unit on its pad (rebuilt when it changes or turns Golden), the ring in its trait's colour
const labSig = ["", ""];
function syncLab3D() {
  if (!W3D) return;
  const two = twinLab();
  HUB.labDual(two);
  labPair(true).forEach(({ u, i }) => {
    const sig = u ? u.uid + (u.tr === "golden" ? "g" : "") + (u.sh ? "s" : "") + (u.ev ? "e" : "") : "";
    if (sig !== labSig[i]) { labSig[i] = sig; HUB.setLabUnit(u, i); }
    const tr = u && G.trait(u); if (tr) HUB.labTrait(traitColors(tr)[0], i);
  });
  const u = labUnit(), n = $("#scrName"); if (n) n.textContent = two ? "TWIN LAB" : u ? AF.nameOf(u).toUpperCase() : "";
}
let labCard = null, labCard2 = null;
function labUnit() { const u = S().opts.lab && G.unit(S().opts.lab); return u || null; }
// (30 Oct) Twin Automation's second Lab unit (never the first one again)
const twinLab = () => G.has("twinAuto");
function labUnit2() { const u = twinLab() && S().opts.lab2 && S().opts.lab2 !== S().opts.lab && G.unit(S().opts.lab2); return u || null; }
// the Lab's units with their plate and card: i 0 and 1 (all: the empty ones too, with u null)
function labPair(all) {
  const out = [{ u: labUnit(), i: 0, sg: $("#sigil"), card: labCard }];
  if (twinLab()) out.push({ u: labUnit2(), i: 1, sg: $("#sigil2"), card: labCard2 });
  return all ? out : out.filter(x => x.u);
}
// (30 Oct) two reels can land big traits at once: the big reveals (and the background target reveals) take turns
let dramaQ = Promise.resolve();
const dramaLock = fn => { const p = dramaQ.then(fn, fn); dramaQ = p.catch(() => {}); return p; };
// a unit whose roll is still spinning shows its old trait everywhere else (shownUnit)
const setShow = (u, res) => { UI.rollShows[u.uid] = { tr: res.prev, dbl: res.prevDbl || undefined }; };
// sg: which plate (the Lab's by default, or the one a background auto reroll opens)
function setSigil(tr, cls = "", sg = $("#sigil")) {
  if (!sg) return;
  sg.className = "sigil " + (tr ? "tt" + tr.tier + xcls(tr) : "tt-1") + (cls ? " " + cls : "");
  $(".sg-glyph", sg).innerHTML = tIcon(tr);
  $(".sg-name", sg).textContent = tr ? tr.name : "No trait";
  $(".sg-mult", sg).innerHTML = AF.traitShort(tr) + (tr ? `<small class="sg-perk">${esc(perkLine(tr))}</small>` : "");
}
function renderLab() {
  const box = $("#labCard"); if (!box) return;
  const two = twinLab();
  $("#labSlot2").hidden = $("#plate2").hidden = !two;
  $(".lab").classList.toggle("dual", two); $("#plates").classList.toggle("dual", two);
  labCard = labCard2 = null;
  labPair(true).forEach(({ u, i, sg }) => {
    const b = i ? $("#labCard2") : box;
    b.innerHTML = "";
    if (u) { const c = cardEl(u, { cls: "lg", hero: true, click: () => openUnit(u) }); b.appendChild(c); if (i) labCard2 = c; else labCard = c; }
    else b.innerHTML = `<div class="lab-empty">${I.traits}<span>${i ? "Pick a second unit to reroll with the first." : "Pick a unit to reroll its trait."}</span></div>`;
    $(i ? "#bPick2" : "#bPick").textContent = u ? "Change unit" : "Choose a unit";
    $(i ? "#bOut2" : "#bOut").hidden = !u;
    $("#plateN" + (i + 1)).textContent = u ? AF.nameOf(u) : "No unit";
    setSigil(u ? G.trait(u) : null, "", sg);
    // (29 Oct, screenshot: another unit's pair stayed over this one's trait) the plate drops any pair it was showing
    $$(".sg-half", sg).forEach(d => d.remove());
    // with Twin Roll, the last pair this unit rolled
    if (u && u.tw && G.labTwin(labPair().length) && u.tw.includes(u.tr)) twinRest(sg, u.tw.map(id => AF.TRAIT[id]), G.trait(u));
  });
  syncRoll(); renderTrOdds(); renderHist(); syncLab3D();
}
function syncRoll() {
  const b = $("#bRoll"); if (!b) return;
  const us = labPair().map(x => x.u), cost = us.reduce((s, u) => s + G.rerollCost(u), 0);
  $("span", b).textContent = us.length > 1 ? "Reroll both" : "Reroll trait";
  $("#rollC").innerHTML = us.length ? fmt(cost) + " &yen;" : "&mdash;";
  b.classList.toggle("off", !us.length || S().yen < cost);
  const u = labUnit();
  // the Forge shows once you own a Singularity: how many you have toward the three
  const f = $("#bForge"), plan = u && G.forgePlan(u.uid);
  f.hidden = !plan || !plan.have;
  if (plan && plan.have) { $("#forgeC").textContent = u.tr === "infinity" ? "This unit has Infinity" : `${Math.min(plan.have, G.FORGE_NEED)} / ${G.FORGE_NEED} Singularities`; f.classList.toggle("off", !plan.ok); f.classList.toggle("gold", plan.ok); }
}
// (29 Oct, Chris: "3 singularities can get fused into an infinity"): the Forge window says exactly which units give
// their Singularity up, then a hold fuses it and the plate plays the Infinity reveal
function openForge() {
  const u = labUnit(); if (!u || UI.rollBusy) return;
  const plan = G.forgePlan(u.uid);
  if (!plan.ok) { FX.nope($("#bForge")); sfx("error"); toast(u.tr === "infinity" ? `${AF.nameOf(u)} already has Infinity.` : `You need ${G.FORGE_NEED} Singularities to fuse (you have ${plan.have}). Locked units are never used.`, "bad"); return; }
  sfx("click");
  const gives = plan.take.filter(x => x.u !== u), own = plan.take.find(x => x.u === u);
  const body = h(`<div class="forge"><p>Three Singularity traits fuse into one <b>Infinity</b> on <b>${esc(AF.nameOf(u))}</b>.${own ? ` Its own Singularity counts as ${own.n === 2 ? "two" : "one"}.` : ""}</p>
    ${gives.length ? `<h3>Giving theirs up</h3><div class="forge-list"></div><p class="note">They keep their level, stars and everything else. A Double Singularity giving one keeps a single Singularity. Locked units are never used.</p>` : ""}
    <div class="row"><button class="btn big gold" id="fGo"><span>Hold to fuse</span><small>3 Singularities into Infinity</small></button></div></div>`);
  gives.forEach(({ u: x, n }) => { const w = h(`<div class="forge-w"><span class="forge-n">${n === 2 ? "gives 2" : "gives 1"}</span></div>`); w.prepend(cardEl(x, { cls: "sm" })); $(".forge-list", body).appendChild(w); });
  const close = modal(body, { title: "Singularity Forge", cls: gives.length > 1 ? "" : "narrow" });
  holdButton($("#fGo", body), 1400, async () => {
    close();
    const r = G.forge(u.uid); if (!r.ok) return;
    UI.rollBusy = true;
    try { await traitDrama(AF.TRAIT.infinity, u, 1, $("#sigil"), labCard); } finally { UI.rollBusy = false; }
    gives.forEach(({ u: x }) => patchAllCards(x));
    toast(`Fused: ${AF.nameOf(u)} has Infinity.`);
    renderLab(); refresh(); if (UI.tab === "units") renderUnits(); G.save();
  });
}
function renderTrOdds() {
  const box = $("#trOdds"); if (!box) return;
  // your real odds, with Trait Fortune applied; with Twin Roll on, the chance that the better of two rolls is this one
  const tw = AF.TRAITS.reduce((s, x) => s + G.traitW(x), 0), one = x => G.traitW(x) / tw, p3 = v => +v.toPrecision(3);
  const best = new Map();
  if (G.labTwin(labPair().length)) {
    let F = 0;
    AF.TRAITS.slice().sort((a, b) => a.mult - b.mult).forEach(x => { const F2 = F + one(x); best.set(x, F2 * F2 - F * F); F = F2; });
  }
  const pc = x => (best.size ? best.get(x) : one(x)) * 100;
  const basic = AF.TRAITS.filter(x => x.tier === 0), bw = basic.reduce((s, x) => s + pc(x), 0);
  const tiers = `<tr class="tt0"><td><span class="tn"><i class="tico">${tIcon(basic[0])}</i>${basic.length} basic traits</span></td><td>&times;${basic[0].mult}&ndash;${basic[basic.length - 1].mult}</td><td class="ch"><b>${p3(bw)}%</b><small>${AF.oneIn(bw)}</small></td></tr>`
    + AF.TRAITS.filter(x => x.tier >= 1).map(t => `<tr class="tt${t.tier}${xcls(t)}" data-tid="${t.id}"><td><span class="tn"><i class="tico">${tIcon(t)}</i><span>${t.name}<small class="tperk">${esc(perkLine(t))}</small></span></span></td><td>&times;${fmt(t.mult)}</td><td class="ch"><b>${p3(pc(t))}%</b><small>${AF.oneIn(pc(t))}</small></td></tr>`).join("");
  box.innerHTML = `<h3>Trait odds</h3><table class="otab four">${tiers}</table>
    ${G.upLv("tluck") || G.upLv("mastery") ? `<p class="note">Includes ${[G.upLv("tluck") ? `+${G.upLv("tluck") * 10}% for Solar to Golden from Trait Fortune` : "", G.upLv("mastery") ? `+${G.upLv("mastery") * 15}% for Eclipse to Zenith from Trait Mastery` : ""].filter(Boolean).join(" and ")}; Singularity and Infinity are only helped by Twin Roll.</p>` : ""}
    <label class="switch"><input type="checkbox" id="protect" ${S().opts.protect ? "checked" : ""}><span class="sw"></span><span>Ask before replacing Solar or better</span></label>`;
  $("#protect", box).onchange = e => { S().opts.protect = e.target.checked; sfx("click"); G.save(); };
}
// a roll into the latest-rolls row: with Twin Roll the one not kept goes first, so the kept one is the newest
// n: which Lab unit rolled it (1 or 2) while there are two
function histPush(t, twin, n = 0) {
  const L = n === 2 ? UI.hist2 : UI.hist;
  if (twin) { const other = twin[0] === t ? twin[1] : twin[0]; L.push({ t: other, lost: true }); }
  L.push(t);
}
function renderHist() {
  const box = $("#hist"); if (!box) return;
  // (29 Oct, request: "show both rolls on the latest rolls thing too, kept is most recent"): a Twin Roll adds the
  // roll that wasn't kept (dimmed), then the kept one
  // (30 Oct, "one column only, far right"): the newest 12, a single column down the screen's edge
  // (30 Oct, "when you have two should be left and right side"): unit 2's rolls in their own column (#hist2)
  const two = twinLab(), b2 = $("#hist2");
  box.classList.toggle("dual", two); b2.hidden = !two;
  const chips = L => L.slice(-12).map(x => { const t = x.t || x; return `<span class="hchip tt${t.tier}${xcls(t)}${x.lost ? " lost" : ""}" data-tid="${t.id}">${tIcon(t)}</span>`; }).join("");
  box.innerHTML = chips(UI.hist); b2.innerHTML = two ? chips(UI.hist2) : "";
}
function rollClick() {
  if (UI.rollBusy) return;
  const us = labPair().map(x => x.u);
  if (!us.length) { FX.nope($("#bRoll")); sfx("error"); toast("Pick a unit first.", "bad"); return; }
  const top = us.filter(u => { const tr = G.trait(u); return tr && tr.tier >= 3; });
  if (top.length && S().opts.protect) {
    confirmBox("Replace this trait?", top.map(u => `${esc(AF.nameOf(u))} has <b>${esc(G.trait(u).name)} &times;${fmt(G.trait(u).mult)}</b>.`).join(" ") + ` A reroll replaces ${top.length > 1 ? "both" : "it"}.`, "Reroll anyway", () => roll(false));
    return;
  }
  roll(false);
}
// (29 Oct, request: "auto summons / auto rerolls stay when switching tabs"): on the Lab the full roll plays; anywhere
// else the roll happens in the pill at the bottom left, at the same pace
// (30 Oct) resolves at once on a visible tab, else the moment it's shown again
const whenShown = () => (!document.hidden ? Promise.resolve() : new Promise(res => {
  const f = () => { if (!document.hidden) { removeEventListener("visibilitychange", f); res(); } };
  addEventListener("visibilitychange", f);
}));
async function autoRoll() {
  if (UI.rollLoop) return;
  UI.rollLoop = true; AUTO.roll.n = 0;
  try {
    const told = new Set();
    while (UI.autoRoll) {
      const all = labPair();
      if (!all.length) { toast("Auto reroll stopped: the unit is gone."); break; }
      // (30 Oct) with two Lab units, each rolls until it has the target; the other keeps going
      const go = all.filter(x => !atTarget(G.trait(x.u)));
      for (const x of all) if (go.length && !go.includes(x) && !told.has(x.u.uid)) { told.add(x.u.uid); toast(`${AF.UNIT[x.u.k].name} has ${G.trait(x.u).name}. Auto reroll keeps rolling ${AF.UNIT[go[0].u.k].name}.`); sfx("unlock"); }
      if (!go.length) { toast(`Auto reroll stopped: ${all.map(x => `${AF.UNIT[x.u.k].name} has ${G.trait(x.u).name}`).join(", ")}.`); sfx("unlock"); break; }
      const cost = go.reduce((s, x) => s + G.rerollCost(x.u), 0);
      if (S().yen < cost) { toast(`Auto reroll stopped: ${go.length > 1 ? "the rerolls cost" : "a reroll costs"} ${fmt(cost)} \u00A5.`, "bad"); break; }
      // (28 Oct): the normal roll, then "make auto roll traits 1.25x faster"
      // (30 Oct) the full roll only while the tab can be seen; a hidden tab rolls the quiet way
      if (UI.tab === "traits" && $("#sigil") && !document.hidden) { if (!UI.rollBusy) await roll(false, AUTO_SPEED, go); }
      else await Promise.all(go.map((x, j) => bgRoll(x.u, j > 0, all.length > 1 ? x.i + 1 : 0)));
      AUTO.roll.n++;
      syncPills();
      await FX.wait(250 / AUTO_SPEED);
    }
  } finally {
    UI.autoRoll = false; UI.rollLoop = false;
    const c = $("#autoRoll"); if (c) c.checked = false;
    syncPills();
  }
}
const AUTO_SPEED = 1.25;
// speed > 1 plays the whole roll faster (auto reroll)
// only: the Lab units to roll (auto reroll leaves out one that has its target); both by default
async function roll(fast, speed = 1, only) {
  if (UI.rollBusy) return;
  const btn = $("#bRoll"), all = labPair(), list = only || all;
  if (!list.length) return;
  const cost = list.reduce((s, x) => s + G.rerollCost(x.u), 0);
  if (S().yen < cost) return broke(btn, cost);
  const single = !G.labTwin(all.length);
  const rs = list.map(x => Object.assign({ res: G.reroll(x.u.uid, single) }, x)).filter(x => !x.res.err);
  if (!rs.length) return;
  UI.rollBusy = true;
  // G.reroll has already set the new trait: the world's hover card keeps the old one until the plate lands, so it changes
  // (and pops) with the plate instead of giving the roll away
  rs.forEach(x => { setShow(x.u, x.res); x.t = x.res.dbl ? AF.TRAIT_DBL[x.res.trait.id] : x.res.trait; });
  FX.squash(btn); rs.forEach(x => FX.squash(x.sg));
  try { await Promise.all(rs.map((x, j) => playRoll(x.t, x.u, speed, x.sg, x.card, fast ? 6 : 15, x.res.twin, j > 0))); }
  finally { UI.rollBusy = false; rs.forEach(x => { delete UI.rollShows[x.u.uid]; }); }
  rs.forEach(x => {
    histPush(x.t, x.res.twin, all.length > 1 ? x.i + 1 : 0);
    if (x.card) { patchCard(x.card, x.u); if (x.t.tier >= 1) FX.pop(x.card, 0.4 + x.t.tier * 0.1); }
    patchAllCards(x.u);
  });
  renderHist(); renderTrOdds(); syncRoll(); syncLab3D(); refresh(); G.save();
}
// (29 Oct, request: "the trait lab rolling should be like an actual up to down rolling animation"): a slot reel
// in the plate. One item per trait, laid out exactly like the plate's own face so the last one hands over seamlessly
function reelItem(tr, H, myst) {
  if (typeof H === "number") H += "px";
  if (myst) return `<div class="sg-item myst" style="height:${H}"><div class="sg-glyph">?</div><div class="sg-name">? ? ?</div><div class="sg-mult">&nbsp;</div></div>`;
  return `<div class="sg-item tt${tr.tier}${xcls(tr)}" style="height:${H}"><div class="sg-glyph">${tIcon(tr)}</div>`
    + `<div class="sg-name">${esc(tr.name)}</div><div class="sg-mult">${AF.traitShort(tr)}</div></div>`;
}
// the next frame, or 100 ms later when the page isn't drawing (a hidden tab must not hang a roll)
const nextFrame = () => new Promise(res => { const to = setTimeout(() => res(performance.now()), 100); requestAnimationFrame(now => { clearTimeout(to); res(now); }); });
// rolls n traits down through the plate onto t (or onto "? ? ?" when myst); returns the reel, still showing
// host: where the reel goes (one half of the plate for Twin Roll); quiet: no ticks (the second of two reels)
async function reelRoll(sg, t, speed, n, myst, host = sg, quiet = false) {
  const sgH = host.clientHeight || sg.clientHeight || 300, H = Math.max(170, Math.round(sgH * 0.62)), c = (sgH - H) / 2;
  const any = () => AF.TRAITS[(Math.random() * AF.TRAITS.length) | 0];
  const rare = () => { const hi = AF.TRAITS.filter(x => x.tier >= 3); return hi[(Math.random() * hi.length) | 0]; };
  // top to bottom: the trait seen above the result at rest, the result, then the n it rolls past (the one just
  // before the result is a rare one a third of the time, a near miss)
  const list = [any(), t];
  for (let i = 0; i < n; i++) {
    let x = i === 0 && Math.random() < 0.34 ? rare() : any();
    if (x === list[list.length - 1] || x === t) x = any();
    list.push(x);
  }
  if (host === sg) sg.className = "sigil rolling";
  const reel = h(`<div class="sg-reel"><div class="sg-strip">${list.map((x, i) => reelItem(x, H, myst && i === 1)).join("")}</div></div>`);
  const strip = reel.firstChild;
  const at = pos => { strip.style.transform = `translate3d(0, ${(c - (1 + pos) * H).toFixed(1)}px, 0)`; };
  at(n);
  host.appendChild(reel);
  // fast at first, then a long crawl into the last few, a small overshoot and back
  const dur = (myst ? 2300 : n < 10 ? 560 : 1650 + Math.min(3, t.tier) * 120) / speed;
  let q = 0, last = performance.now(), lastIdx = n, lastTick = 0;
  while (q < 1) {
    const now = await nextFrame();
    q = Math.min(1, q + ((now - last) * AF.time.scale) / dur); last = now;
    const pos = n * (1 - q) ** 3 - 0.12 * Math.sin(Math.PI * Math.min(1, Math.max(0, (q - 0.82) / 0.18)));
    at(pos);
    const idx = Math.round(pos);
    if (!quiet && idx !== lastIdx && now - lastTick > 40) { sfx("tick", { i: Math.max(0, 12 - idx) }); lastTick = now; }
    lastIdx = idx;
  }
  return reel;
}
// the reel fades as the plate's own face (showing the same thing) comes back under it
function endReel(reel) {
  if (!reel || !reel.isConnected) return; // Twin Roll's halves fade themselves
  reel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }).onfinish = () => reel.remove();
}
// the traits that stay hidden ("? ? ?") until the big reveal; every other trait shows on the reel as it lands
const HIDDEN_TRAITS = new Set(["golden", "zenith", "singular", "infinity"]); // (31 Oct) Golden too
// the reel and the landing (or the big reveal) on a plate; card is the unit card that changes with it
// (29 Oct, request: "im not seeing the trait reroll roll twice"): Twin Roll's two rolls, side by side on the plate;
// the second lands a beat later, the better one is kept (lit, KEPT), the other dims (29 Oct: no strike, no label)
async function twinReels(sg, twin, t, speed, n) {
  $$(".sg-half", sg).forEach(d => d.remove());
  sg.className = "sigil rolling twin";
  const halves = [0, 1].map(i => { const d = h(`<div class="sg-half h${i}"></div>`); sg.appendChild(d); return d; });
  await Promise.all(twin.map((x, i) => reelRoll(sg, x, speed, n + i * 3, HIDDEN_TRAITS.has(x.id), halves[i], i === 1)));
  const keep = twin[1] === t && twin[0] !== t ? 1 : 0;
  halves[keep].classList.add("kept"); halves[1 - keep].classList.add("lost");
  halves[keep].appendChild(h(`<span class="sg-keep">Kept</span>`));
  sfx("pop", { i: 9 });
  await FX.wait(350 / speed);
  return { remove() {}, animate: () => ({}) };
}
// the plate at rest with Twin Roll: the pair side by side, the kept one lit
function twinRest(sg, twin, t) {
  if (!sg || !twin || !twin.every(Boolean)) return;
  $$(".sg-half", sg).forEach(d => d.remove());
  // both the same: a double, both halves kept
  const both = twin[0].id === twin[1].id, keep = twin[1].id === t.id && twin[0].id !== t.id ? 1 : 0;
  twin.forEach((x, i) => { const k = both || i === keep; sg.appendChild(h(`<div class="sg-half h${i} ${k ? "kept" : "lost"}">${reelItem(x, "100%")}${k ? `<span class="sg-keep${both ? " dbl" : ""}">${both ? "Double" : "Kept"}</span>` : ""}</div>`)); });
  sg.classList.add("twinview");
}
// held: the caller already holds the reveal lock (the background target reveal), so the big reveal runs straight away
async function playRoll(t, u, speed, sg, card, steps = 15, twin = null, quiet = false, held = false) {
  {
    const hide = HIDDEN_TRAITS.has(t.id);
    const reel = twin ? await twinReels(sg, twin, t, speed, steps < 15 ? 6 : 14) : await reelRoll(sg, t, speed, steps < 15 ? 6 : 14, hide, sg, quiet);
    if (hide) {
      if (twin) $$(".sg-half", sg).forEach(d => d.remove());
      setSigil(null, "", sg); $(".sg-name", sg).textContent = "? ? ?"; $(".sg-mult", sg).innerHTML = "&nbsp;"; endReel(reel); await (held ? traitDrama(t, u, speed, sg, card) : dramaLock(() => traitDrama(t, u, speed, sg, card)));
      if (twin) twinRest(sg, twin, t);
    } else {
      setSigil(t, "land", sg);
      endReel(reel);
      if (twin) twinRest(sg, twin, t);
      FX.pop(sg, 0.9 + t.tier * 0.15);
      const c = FX.center((twin && $(".sg-half.kept", sg)) || sg); // the burst comes off the kept side
      FX.burst(c.x, c.y, { colors: traitColors(t), n: 14 + t.tier * 12, speed: 300 + t.tier * 60, shape: t.tier >= 2 ? "star" : "spark", gravity: 300 });
      FX.ring(c.x, c.y, { c: AF.TRAIT_TIERS[t.tier].color, r: 110 + t.tier * 30 });
      if (t.tier >= 2) FX.shake(0.15 + (t.tier - 2) * 0.2);
      if (t.id === "solar") { FX.flash("#ffcf5a", 0.4, 0.35); FX.rays(c.x, c.y, { c: "#ffd76a", life: 1.2, n: 14, len: 600 }); }
      if (t.id === "golden") {
        FX.flash("#ffd23a", 0.4, 0.4); FX.shake(0.4);
        FX.rays(c.x, c.y, { c: "#ffd23a", life: 1.5, n: 16, len: 850 });
        FX.burst(c.x, c.y, { colors: traitColors(t), n: 60, shape: "star", speed: 650, gravity: 350, life: 1.2 });
        banner(t.name.toUpperCase(), `${AF.traitShort(t)} on ${AF.nameOf(u)}${TD_FARM(u) ? `, ×${t.farm} farm pay` : ""}`, "tb3 x-golden");
      }
      if (t.id === "inferno") {
        FX.slowmo(0.5, 0.7); FX.flash("#ff4a1a", 0.5, 0.45); FX.shake(0.55);
        FX.rays(c.x, c.y, { c: "#ff5a1a", life: 1.8, n: 18, len: 900 });
        FX.burst(c.x, c.y, { colors: traitColors(t), n: 70, shape: "spark", speed: 700, gravity: -200, life: 1.1 });
        banner(t.name.toUpperCase(), `${AF.traitShort(t)} on ${AF.nameOf(u)}`, "tbin");
      }
      // Eclipse, Nebula, Astral: shown as they land, then a bigger landing than the tiers below
      if (t.tier >= 4) {
        const tc = traitColors(t);
        FX.flash(tc[0], 0.35, 0.4); FX.shake(0.5);
        FX.rays(c.x, c.y, { c: tc[0], life: 1.4, n: 16, len: 800 });
        if (t.id === "nebula") FX.rays(c.x, c.y, { c: tc[1], life: 1.2, n: 10, len: 700, spin: -0.3 });
        banner(t.name.toUpperCase(), `${AF.traitShort(t)} on ${AF.nameOf(u)}`, "tb" + t.tier + xcls(t));
      }
      // a double below the tiers that have a banner of their own (theirs already say DOUBLE): one of its own
      if (t.dbl && t.tier < 4 && t.id !== "golden" && t.id !== "inferno") {
        FX.flash(traitColors(t)[0], 0.3, 0.35); FX.shake(0.25 + t.tier * 0.1);
        FX.burst(c.x, c.y, { colors: traitColors(t), n: 50, shape: "star", speed: 560, gravity: 300, life: 1.1 });
        banner(t.name.toUpperCase(), `Both rolls landed it: ${AF.traitShort(t)} on ${AF.nameOf(u)}`, "tb" + Math.max(2, t.tier) + xcls(t));
      }
      sfx(t.tier >= 1 ? "reveal" : "pop", { rank: t.tier, i: 6 });
    }
  }
}
// the big one: Eclipse, Astral, Singularity
async function traitDrama(t, u, speed = 1, sg = $("#sigil"), card = labCard) {
  // zen/neb/inf are read by the slow motion below, so they have to exist before anything else runs
  const c = FX.center(sg), tier = t.tier, zen = t.id === "zenith", neb = t.id === "nebula", inf = t.id === "infinity";
  // (31 Oct, "it should be impossible to tell"): the charge-up is the same for every hidden trait; only the slam differs
  const SUSPENSE = ["#ffffff", "#dfe6f2", "#aab4c8", "#ffffff"];
  const dim = h(`<div class="dim t6"></div>`);
  $("#layer").appendChild(dim);
  dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: "forwards" });
  sg.classList.add("charging", "tt6");
  setSigil(null, "charging tc6", sg);
  $(".sg-name", sg).textContent = "? ? ?"; $(".sg-mult", sg).textContent = "";
  FX.slowmo(0.35, 3.0);
  const vx = AF.vortex();
  const beats = 11;
  for (let i = 0; i < beats; i++) {
    if (vx) { vx.power(0.25 + 0.75 * i / beats); vx.kick(); }
    // energy pulled into the sigil from all around
    for (let k = 0; k < 10; k++) {
      const a = Math.random() * Math.PI * 2, r = 260 + Math.random() * 200;
      FX.burst(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, { n: 1, angle: a + Math.PI, spread: 0.05, speed: r * 2.6, gravity: 0, drag: 0, life: 0.38,
        colors: SUSPENSE, shape: "spark", size: 5 });
    }
    FX.shake(0.1 + i * 0.05);
    FX.pop(sg, 0.25 + i * 0.05);
    // rings fall inward onto the plate, faster every beat
    FX.ring(c.x, c.y, { c: "#ffffff", r: 120 + i * 22, w: 3 + i * 0.5, life: 0.5 });
    await FX.gwait((225 - i * 7) / speed);
  }
  // the whole screen goes black, then white, then black, before the slam
  FX.flash("#000000", 0.45, 0.98); await FX.gwait(300 / speed);
  FX.flash("#ffffff", 0.25, 0.7); await FX.gwait(160 / speed);
  FX.flash("#000000", 0.5, 0.98); await FX.gwait(360 / speed);
  // slam
  if (vx) vx.end();
  setSigil(t, "land slam", sg);
  sg.classList.remove("charging");
  FX.flash(tier === 6 ? "#ffffff" : tier === 5 ? "#dff8ff" : neb ? "#b89cff" : t.id === "golden" ? "#ffd23a" : "#ff3b6b", 0.6, inf ? 1 : 0.8);
  FX.shake(inf ? 1.8 : tier === 6 ? 1.3 : zen ? 1.15 : tier === 5 ? 1.0 : neb ? 0.9 : 0.75);
  const cols = traitColors(t);
  FX.burst(c.x, c.y, { colors: cols, n: 80 + tier * 30, speed: 900, shape: "star", gravity: 200, life: 1.4 });
  FX.burst(c.x, c.y, { colors: cols, n: 60, speed: 600, shape: "shard", gravity: 300, life: 1.2 });
  [0, 120, 260].forEach((d, i) => setTimeout(() => FX.ring(c.x, c.y, { c: cols[0], rainbow: tier === 6, r: 300 + i * 160, w: 14 - i * 3, life: 0.8 }), d));
  FX.rays(c.x, c.y, { rainbow: tier === 6, c: cols[0], life: 2.6, n: 24, len: 1400, spin: 0.3 });
  if (tier >= 5) FX.burst(innerWidth / 2, -20, { colors: tier === 6 ? FX.RAINBOW : cols, n: inf ? 320 : tier === 6 ? 220 : zen ? 170 : 120, shape: "confetti", angle: Math.PI / 2, spread: 1.3, speed: 750, gravity: 520, life: 2.6, add: false });
  if (inf) {
    // a second wave from both sides, and the rings keep coming
    [[-20, -0.35], [innerWidth + 20, Math.PI + 0.35]].forEach(([x, a]) => FX.burst(x, innerHeight * 0.6, { colors: cols, n: 140, shape: "star", angle: a, spread: 0.6, speed: 1100, gravity: 400, life: 2.4 }));
    [420, 620, 820, 1020].forEach((d, i) => setTimeout(() => FX.ring(c.x, c.y, { c: "#ffffff", rainbow: true, r: 700 + i * 150, w: 10 - i * 2, life: 1 }), d));
  }
  sfx("portalBurst", { rank: inf ? 9 : tier + 2 });
  banner(t.name.toUpperCase(), `${AF.traitShort(t)} on ${AF.nameOf(u)}${t.id === "golden" && TD_FARM(u) ? `, ×${t.farm} farm pay` : ""}`, "tb" + tier + xcls(t));
  if (card) { patchCard(card, u); FX.pop(card, 1.2); const lc = FX.center(card); FX.burst(lc.x, lc.y, { colors: cols, n: 50, shape: "star", speed: 500 }); }
  await FX.gwait((inf ? 2400 : 1500) / speed);
  dim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: "forwards" }).onfinish = () => dim.remove();
  await FX.wait(400);
}

// ---------------- Index ----------------
function renderIndex(p) {
  const owned = AF.UNITS.filter(d => S().seen[d.key]).length;
  p.innerHTML = `<div class="index-top"><p class="lede">${owned} of ${AF.UNITS.length} units found. Every unit can come from any gate except Divine and rarer, which only the Void Gate and the gates after it give, and the units of the Rift and of each gate a Rebirth opens, which only their own gate gives.</p></div>
    ${AF.RARITIES.map(r => {
      const list = AF.UNITS.filter(d => d.rarity === r.id), got = list.filter(d => S().seen[d.key]).length;
      return `<section class="ix r-${r.id}"><h2><i class="rdot"></i>${r.name}<span>${got}/${list.length}</span></h2><div class="grid ix-grid" data-r="${r.id}"></div></section>`;
    }).join("")}`;
  $$(".ix-grid", p).forEach(g => {
    AF.UNITS.filter(d => d.rarity === g.dataset.r).forEach(d => {
      const have = S().seen[d.key];
      const c = cardEl({ k: d.key, lv: 1, eq: -1 }, { index: true, ghost: !have, cls: "sm" + (d.gate ? " riftc" : ""), click: () => { if (have) toast(`${d.name}: ${have} pulled so far. Base ${fmt(d.base)} ¥/s.${d.gate === "underworld" ? " A gift of the Keeper." : d.gate ? " Rift Gate only." : ""}`); else { sfx("error"); FX.nope(c); if (d.gate === "underworld") toast("This one isn't summoned. Someone in the Underworld keeps him."); else if (d.gate) toast("This one only comes from the Rift Gate."); } } });
      g.appendChild(c);
    });
  });
  // the search hides what doesn't match, and rarities left empty. A unit not found yet shows "???", so only its rarity
  // matches; its name would give it away
  const empty = h(`<div class="empty-note" hidden></div>`);
  p.appendChild(empty);
  $(".index-top", p).appendChild(searchBox("", q => {
    let all = 0;
    $$(".ix", p).forEach(sec => {
      let n = 0;
      $$(".ucard", sec).forEach(c => {
        const d = AF.UNIT[c._u.k], ok = S().seen[d.key] ? unitMatch(c._u, q) : !q || q.split(/\s+/).every(w => AF.RAR[d.rarity].name.toLowerCase().includes(w));
        c.style.display = ok ? "" : "none"; if (ok) n++;
      });
      sec.style.display = n ? "" : "none"; all += n;
    });
    empty.hidden = !!all; if (!all) empty.innerHTML = `No units match &ldquo;${esc(q)}&rdquo;.`;
  }));
}

// ---------------- Ascend ----------------
// (30 Oct) an ascension goal (game.js G.reqMet) as something to do, its icon, and the tab it's done on
function reqDo(k) {
  const [a, b, c] = k.split(":");
  if (a === "floor") return c ? `Reach floor ${c} in ${AF.TD.MAP[b] ? AF.TD.MAP[b].name : b}'s Endless` : `Reach Endless floor ${b} on any world`;
  if (a === "rank") return `Pull ${/^[AEIOU]/.test(AF.RARITIES[+b].name) ? "an" : "a"} ${AF.RARITIES[+b].name}`;
  if (a === "mult") { const t = AF.TRAITS.find(x => x.mult === +b); return `Roll ${t ? t.name : "x" + fmt(+b)} or better`; }
  if (a === "found") return `Find ${b} different units`;
  return `Clear ${AF.TD.label(k)}`;
}
const reqTab = k => { const a = k.split(":")[0]; return a === "rank" || a === "found" ? "summon" : a === "mult" ? "traits" : "defense"; };
const reqIcon = k => I[reqTab(k)];
const TAB_NAME = { summon: "Summon", traits: "the Trait Lab", defense: "Defense" };
let ascSig = "";
function pageAscend() {
  const p = $("#p-ascend");
  const got = G.ascendShards(), can = G.canAscend(), need = G.ascMin(), first = G.shardsAt(need);
  ascSig = can + "|" + got + "|" + G.canRebirth();
  const prog = can ? Math.sqrt(S().lifetime / AF.ASCEND.per) * G.magnet() - got : S().lifetime / first;
  p.innerHTML = `
  <div class="asc-hero">
    <div class="asc-l">
      <h1>Ascend</h1>
      <p class="lede">Start the climb again with permanent power. Shards from quests and ascending can be spent in the shop below at any time.</p>
      <div class="asc-cols">
        <div><h3>Resets</h3><ul><li>Your &yen; and what's waiting to collect</li><li>Unit levels</li><li>Slots, back to ${G.startSlots()}</li><li>Gates, which reopen as you earn</li></ul></div>
        <div><h3>Stays</h3><ul><li>Every unit, trait, star and shiny</li><li>Pity and the Index</li><li>Shards, upgrades and quests</li></ul></div>
      </div>
      <div class="asc-bonus">${I.ascend}<span>Ascension bonus <b>+${Math.round((G.ascMult() - 1) * 100)}%</b> income, and +${Math.round(AF.ASCEND.incomePer * 100)}% more with every ascension.</span></div>
    </div>
    <div class="asc-r">
      <span class="asc-k">Ascend now for</span>
      <div class="asc-n">${SHARD}<b id="ascN">${fmt(got)}</b></div>
      <div class="asc-meter"><i style="width:${Math.min(100, prog * 100).toFixed(1)}%"></i></div>
      <p class="note">${can ? `Next shard at ${fmt(G.nextShardAt())} &yen; earned this run (${fmt(S().lifetime)} so far).`
        : G.ascReq() ? `Ascension ${S().asc + 1} needs you to <b>${reqDo(G.ascReq()).replace(/^./, ch => ch.toLowerCase())}</b>${got < need ? `, and at least ${fmt(need)} shards` : ""}.`
        : `Ascension ${S().asc + 1} needs at least ${fmt(need)} shards: ${fmt(first)} &yen; earned this run. You're at ${fmt(S().lifetime)}.`}</p>
      ${!can && G.ascReq() ? `<button class="btn big" id="bToTd"><span>Go to ${TAB_NAME[reqTab(G.ascReq())]}</span></button>`
        : `<button class="btn big gold" id="bAsc" ${can ? "" : "disabled"}><span>${can ? "Hold to ascend" : "Not yet"}</span></button>`}
      ${S().asc ? `<p class="note">Ascended ${S().asc} time${S().asc === 1 ? "" : "s"}.</p>` : ""}
    </div>
  </div>
  ${pathHTML()}
  ${rebirthHTML()}
  <div class="shop-head"><h2>Shard shop</h2><div class="shards big">${SHARD}<b id="shopN">${fmt(S().shards)}</b></div></div>
  <div class="shop" id="shop"></div>
  <div class="shop-head reb-shop"><h2>Rebirth shop</h2><p class="lede">Opened by Rebirths, priced for the climbs after them.</p></div>
  <div class="shop" id="shopR"></div>`;
  renderShop(); renderRelics();
  // on narrow screens the path scrolls; bring the next ascension into view only when it's off the edge
  const on = $(".anode.next", p), tr = on && on.parentElement;
  if (tr && on.offsetLeft + on.offsetWidth > tr.clientWidth) tr.scrollLeft = on.offsetLeft - 40;
  if ($("#bToTd")) $("#bToTd").onclick = () => { sfx("tab"); go(reqTab(G.ascReq())); };
  else if (can) holdButton($("#bAsc"), 1600, doAscend); else $("#bAsc").classList.add("off");
  if (G.canRebirth()) holdButton($("#bReb"), 2200, doRebirth); else $("#bReb").classList.add("off");
  $("#bSmap").onclick = () => { sfx("click"); openStarMap(); };
}
// (30 Oct) the Rebirth panel: what it does, the gate it opens next, the Starlight it pays now
const ORD = n => ["first", "second", "third"][n - 1] || n + "th";
function rebirthHTML() {
  const can = G.canRebirth(), got = G.rebirthStarlight(), next = AF.GATES.find(g => g.reb && g.reb > (S().reb || 0));
  // (1 Nov) past the gates, the Rebirth shop's next item
  const nextUp = AF.UPGRADES.filter(d => d.reb && d.reb > (S().reb || 0)).sort((a, b) => a.reb - b.reb)[0];
  return `<div class="reb-hero${can ? " can" : ""}">
    <div class="reb-l"><h2>Rebirth</h2>
      <p class="lede">From Ascension ${AF.REBIRTH.asc} you can start the whole climb again. Your ascensions go back to 0, and you get Starlight to spend on the star map, whose boosts last for good.
        ${next ? `Your ${ORD(next.reb)} Rebirth opens the <b>${esc(next.name)}</b>.` : nextUp ? `Your ${ORD(nextUp.reb)} Rebirth opens <b>${esc(nextUp.name)}</b> in the Rebirth shop.` : "Every gate past the Rift is open to you, and every Rebirth shop item."}
        Every Rebirth makes the climb harder: each ascension needs ${AF.REBIRTH.climb} times the shards (${AF.REBIRTH.climbAfter} times after the ${ORD(AF.REBIRTH.climbFull)} Rebirth), and the path asks for new goals.</p>
      <div class="asc-cols"><div><h3>Resets</h3><ul><li>Ascensions, back to 0, and their income bonus</li><li>Everything an ascension resets</li></ul></div>
        <div><h3>Stays</h3><ul><li>Every unit, trait, star and shiny</li><li>Shards, shop upgrades and quests</li><li>Defense clears and the star map</li></ul></div></div></div>
    <div class="reb-r"><span class="asc-k">${can ? "Rebirth now for" : `Rebirth at Ascension ${AF.REBIRTH.asc}`}</span>
      <div class="reb-n">${STARL}<b>${fmt(got)}</b></div>
      <p class="note">${can ? `${AF.REBIRTH.base} Starlight at Ascension ${AF.REBIRTH.asc}, and ${AF.REBIRTH.perAsc} more for every ascension past it.` : `You're at Ascension ${S().asc} of ${AF.REBIRTH.asc}.`}</p>
      <button class="btn big reb-btn" id="bReb" ${can ? "" : "disabled"}><span>${can ? "Hold to rebirth" : "Not yet"}</span></button>
      <button class="btn ghost smap-btn" id="bSmap">${STARL}<span>Star map</span>${S().starlight ? `<em>${fmt(S().starlight)}</em>` : ""}</button>
      ${S().reb ? `<p class="note">Reborn ${S().reb} time${S().reb === 1 ? "" : "s"}.</p>` : ""}</div></div>`;
}
async function doRebirth() {
  if (!G.canRebirth() || UI.busy) return;
  UI.busy = true;
  const c = { x: innerWidth / 2, y: innerHeight / 2 }, was = AF.GATES.filter(g => g.reb && g.reb <= (S().reb || 0)).map(g => g.id);
  FX.slowmo(0.35, 1.8); sfx("win", { at: 0.6 }); FX.shake(0.5);
  FX.rays(c.x, c.y, { c: "#bfe6ff", life: 3, n: 36, len: 1800, spin: 0.3 });
  setTimeout(() => FX.rays(c.x, c.y, { c: "#ffe9a8", life: 2.4, n: 12, len: 1800, spin: -0.4 }), 400);
  await FX.wait(1300);
  FX.flash("#ffffff", 1.4, 1);
  const got = G.rebirth();
  FX.shake(1.2);
  FX.burst(c.x, c.y, { colors: ["#ffffff", "#bfe6ff", "#ffe9a8", "#c9a8ff"], n: 260, shape: "star", speed: 1100, gravity: 80, life: 2.2 });
  [0, 180, 360, 540].forEach((d, i) => setTimeout(() => FX.ring(c.x, c.y, { c: i % 2 ? "#ffe9a8" : "#bfe6ff", r: 420 + i * 220, w: 14 - i * 3, life: 1 }), d));
  banner("REBIRTH", `+${fmt(got)} Starlight`, "tb5 reb-bn");
  const opened = AF.GATES.filter(g => g.reb && g.reb <= S().reb && !was.includes(g.id));
  if (opened.length) setTimeout(() => toast(`The ${opened.map(g => g.name).join(" and ")} is yours: it opens once you've earned ${fmt(opened[0].unlock)} \u00A5 this run.`), 2000);
  UI.disp = S().yen; UI.hold = 0; slotSig = ""; gatesOpen = AF.GATES.filter(G.gateOpen).map(g => g.id).join();
  G.save();
  UI.busy = false;
  go("ascend");
}
// (30 Oct) the star map: the night sky over the whole screen, the constellation from AF.STARMAP
const ARM_C = { core: "#ffffff", inc: "#ffd76a", luck: "#c9a8ff", td: "#ff6a5a", climb: "#7fe3ff", corner: "#fff2c8" };
const STAR_SUM = [["inc", v => `+${Math.round(v * 100)}% income`], ["ascPer", v => `+${Math.round(v * 100)}% more income per ascension`], ["keepAsc", v => `${v} ascensions' bonus kept through a Rebirth`],
  ["offline", v => `+${v}h offline earnings`], ["luck", v => `Legendary+ summons +${Math.round(v * 100)}%`], ["favor", v => `Divine+ summons +${Math.round(v * 100)}%`],
  ["shiny", v => `Shinies +${Math.round(v * 100)}%`], ["tluck", v => `Solar to Golden +${Math.round(v * 100)}%`], ["abs", v => `Absolute summons x${1 + v}`],
  ["tdAtk", v => `Defense damage +${Math.round(v * 100)}%`], ["tdCash", v => `Defense cash +${Math.round(v * 100)}%`], ["relCharge", v => `Releases charge +${Math.round(v * 100)}% faster`],
  ["start", v => `Runs start with x${fmt(v)} \u00A5`], ["shardK", v => `Ascension shards +${Math.round(v * 100)}%`], ["slots", v => `+${v} starting slots`],
  ["sumCost", v => `Summons ${Math.round(v * 100)}% cheaper`], ["star", v => `Starlight +${Math.round(v * 100)}%`]];
function openStarMap() {
  if ($(".smap")) return;
  let sel = null;
  const el = h(`<div class="smap" role="dialog" aria-label="Star map"><canvas class="smap-sky"></canvas>
    <div class="smap-top"><h2>Star map</h2><div class="shards stl big">${STARL}<b class="smap-n"></b></div><button class="iconbtn smap-x" aria-label="Close">${I.x}</button></div>
    <div class="smap-stage"><svg class="smap-svg" viewBox="0 0 1000 700" aria-hidden="true"></svg></div>
    <div class="smap-info"></div><div class="smap-sum"></div></div>`);
  document.body.appendChild(el);
  // the sky: stars painted once, a few twinkling over it in CSS
  const sky = $(".smap-sky", el), dpr = Math.min(2, devicePixelRatio || 1);
  sky.width = innerWidth * dpr; sky.height = innerHeight * dpr;
  const x = sky.getContext("2d");
  for (let i = 0; i < 420; i++) {
    const r = Math.random() < 0.08 ? 1.6 : Math.random() * 0.9 + 0.3;
    x.fillStyle = `rgba(${200 + Math.random() * 55 | 0},${210 + Math.random() * 45 | 0},255,${0.25 + Math.random() * 0.65})`;
    x.beginPath(); x.arc(Math.random() * sky.width, Math.random() * sky.height, r * dpr, 0, Math.PI * 2); x.fill();
  }
  const svg = $(".smap-svg", el), M = AF.SMAP;
  const paint = () => {
    $(".smap-n", el).textContent = fmt(S().starlight);
    let lines = "", dots = "";
    for (const n of AF.STARMAP) for (const f of n.from) {
      const a = M[f], on = G.starOwned(n.id) && G.starOwned(f), half = G.starOwned(f) !== G.starOwned(n.id);
      lines += `<line x1="${a.x}" y1="${a.y}" x2="${n.x}" y2="${n.y}" class="sl${on ? " on" : half ? " half" : ""}" style="--c:${ARM_C[n.arm]}"/>`;
    }
    for (const n of AF.STARMAP) {
      const own = G.starOwned(n.id), open = !own && G.starOpen(n), lv = G.starLv(n.id), r = n.arm === "corner" ? 22 : n.arm === "core" ? 26 : 17;
      const afford = open ? S().starlight >= n.cost : own && G.canBrighten(n) && !G.brightMax(n) && S().starlight >= G.brightCost(n);
      dots += `<g class="sn${own ? " own" : open ? " open" : " shut"}${afford ? " afford" : ""}${sel === n.id ? " sel" : ""}" data-id="${n.id}" style="--c:${ARM_C[n.arm]}" transform="translate(${n.x} ${n.y})">
        <circle class="sn-glow" r="${r * 2.4}"/><circle class="sn-ring" r="${r}"/><path class="sn-star" d="M0 ${-r * 0.62} ${r * 0.16} ${-r * 0.16} ${r * 0.62} 0 ${r * 0.16} ${r * 0.16} 0 ${r * 0.62} ${-r * 0.16} ${r * 0.16} ${-r * 0.62} 0 ${-r * 0.16} ${-r * 0.16}Z"/>
        ${own ? (lv > 1 ? `<text class="sn-cost sn-lv" y="${r + 17}">x${lv}</text>` : "") : `<text class="sn-cost" y="${r + 17}">${n.cost}</text>`}</g>`;
    }
    svg.innerHTML = `<g class="sls">${lines}</g>${dots}`;
    $$(".sn", svg).forEach(g => g.addEventListener("click", () => { sel = g.dataset.id; sfx("click"); paint(); }));
    info(); sum();
  };
  const info = () => {
    const box = $(".smap-info", el), n = sel && M[sel];
    if (!n) { box.innerHTML = `<p class="smap-hint">Click a star to see what it does. A star can be lit once one it hangs from is lit; the four corners need both of theirs. A lit star can be brightened with more Starlight, adding its effect again.</p>`; return; }
    const own = G.starOwned(n.id), open = G.starOpen(n), afford = S().starlight >= n.cost, lv = G.starLv(n.id), bc = G.brightCost(n);
    box.innerHTML = `<div class="smap-card" style="--c:${ARM_C[n.arm]}"><div><b>${esc(n.name)}</b><span>${esc(n.desc)}${own && lv > 1 ? `, brightened ${lv - 1} of ${AF.BRIGHT.max} times: it counts x${lv}` : ""}</span></div>
      ${own ? (!G.canBrighten(n) ? `<em class="smap-lit">Lit</em>` : G.brightMax(n) ? `<em class="smap-lit">As bright as it gets</em>`
        : `<button class="btn ${S().starlight >= bc ? "gold" : "off"}" id="smBright">${STARL}<span>Brighten for ${fmt(bc)}</span></button>`) : !open ? `<em class="smap-shut">Light ${n.from.map(f => esc(M[f].name)).join(n.all ? " and " : " or ")} first</em>`
        : `<button class="btn ${afford ? "gold" : "off"}" id="smBuy">${STARL}<span>Light it for ${n.cost}</span></button>`}</div>`;
    const bb = $("#smBright", box);
    if (bb) bb.onclick = () => {
      const r = G.brightenStar(n.id);
      if (r.err === "starlight") { FX.nope(bb); sfx("error"); toast(`You need ${fmt(r.need - S().starlight)} more Starlight.`, "bad"); return; }
      if (r.err) return;
      const g = $(`.sn[data-id="${n.id}"]`, svg), c = g ? FX.center(g) : FX.center(bb);
      sfx("unlock"); FX.burst(c.x, c.y, { colors: [ARM_C[n.arm], "#ffffff"], n: 60 + 8 * G.starLv(n.id), shape: "star", speed: 480, gravity: 60 }); FX.ring(c.x, c.y, { c: "#ffffff", r: 130 });
      G.save(); refresh(); paint();
      if (UI.tab === "ascend") pageAscend();
    };
    const b = $("#smBuy", box);
    if (b) b.onclick = () => {
      const r = G.buyStar(n.id);
      if (r.err === "starlight") { FX.nope(b); sfx("error"); toast(`You need ${r.need - S().starlight} more Starlight.`, "bad"); return; }
      if (r.err) return;
      const g = $(`.sn[data-id="${n.id}"]`, svg), c = g ? FX.center(g) : FX.center(b);
      sfx("unlock"); FX.burst(c.x, c.y, { colors: [ARM_C[n.arm], "#ffffff"], n: 50, shape: "star", speed: 420, gravity: 60 }); FX.ring(c.x, c.y, { c: ARM_C[n.arm], r: 110 });
      G.save(); refresh(); paint();
      if (UI.tab === "ascend") pageAscend();
    };
  };
  const sum = () => {
    const rows = STAR_SUM.filter(([k]) => G.starLit(k)).map(([k, f]) => `<span>${f(G.starLit(k))}</span>`);
    $(".smap-sum", el).innerHTML = rows.length ? `<b>Lit so far</b>${rows.join("")}` : `<b>Nothing lit yet</b><span>Starlight comes from Rebirths.</span>`;
  };
  paint();
  el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  const close = () => {
    if (UI.modalClose === close) UI.modalClose = null;
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }).onfinish = () => el.remove();
  };
  $(".smap-x", el).onclick = () => { sfx("click"); close(); };
  UI.modalClose = close;
}
// ---------------- Relics (30 Oct) ----------------
// each kind's mark, drawn in the icon set's own line style
const RELIC_IC = {
  inc: '<circle cx="12" cy="13" r="7.5"/><circle cx="12" cy="13" r="4"/><path d="M12 5.5V3"/><circle cx="12" cy="2.4" r="1.2"/>',
  shard: '<path d="M12 3 19 10 12 21 5 10Z"/><path d="M5 10h14M12 3v18M8.5 10 12 21l3.5-11"/>',
  luck: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="8.5" cy="8.5" r="1.1"/><circle cx="15.5" cy="15.5" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="15.5" cy="8.5" r="1.1"/><circle cx="8.5" cy="15.5" r="1.1"/>',
  favor: '<ellipse cx="12" cy="5.5" rx="7" ry="2.4"/><path d="M12 9.5 15.5 15 12 21.5 8.5 15Z"/>',
  tluck: '<path d="M10 4 17 18H3Z"/><path d="M13.6 11.5 21 9M14.3 13 21 13.5M15 14.6l6 3.8"/>',
  shiny: '<path d="M12 2.5c.8 5 3 7.2 8 8-5 .8-7.2 3-8 8-.8-5-3-7.2-8-8 5-.8 7.2-3 8-8Z"/><path d="M19 17v4M17 19h4"/>',
  cash: '<path d="M8 8h8l3.5 4.5V17a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4v-4.5Z"/><path d="M9 8 7 3.5h10L15 8"/><path d="M12 12v5M10 13.5h3.2a1.2 1.2 0 0 1 0 2.4H10"/>',
  nap: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4Z"/><path d="M10 21h4"/><path d="M17 3.5h3l-3 3.5h3"/>',
  star: '<circle cx="12" cy="12" r="9"/><path d="M12 5 14 12 12 19 10 12Z"/><path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21"/>',
};
const relicIc = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${RELIC_IC[k]}</svg>`;
const RELIC_R = ["common", "rare", "epic", "legendary", "mythic"];
// one relic as a tile (sm: the collection's small one)
function relicHTML(x, o = {}) {
  const K = AF.RELIC.KIND[x.k], R = AF.RELIC.rar[x.r];
  return `<div class="relic rr-${RELIC_R[x.r]}${o.sm ? " sm" : ""}${o.on ? " on" : ""}${o.cls ? " " + o.cls : ""}" data-rid="${x.id}" style="--rc:${AF.RAR[RELIC_R[x.r]].color}">
    <canvas class="rl-coin" data-k="${x.k}" data-r="${x.r}"></canvas><div class="rl-t"><b>${esc(K.name)}</b><span class="rl-r">${R.name} &middot; ${Math.round(x.q * 100)}%</span>
    <span class="rl-v">${esc(K.txt(G.relicVal(x)))}</span></div>${o.on && o.sm ? `<i class="rl-worn">Worn</i>` : ""}</div>`;
}
// (30 Oct) every relic canvas under root drawn as its coin
function paintCoins(root) { $$("canvas.rl-coin", root).forEach(cv => AF.coin.draw(cv, cv.dataset.k, +cv.dataset.r)); }
function pageRelics() { $("#p-relics").innerHTML = `<section class="relics store mk" id="relics"></section>`; renderRelics(); }
// (31 Oct, "Take inspiration from the one i sent and remake it"): a wooden market frame with folder tabs on its top edge,
// the stall's awning, a name plate, and the goods as cards with a big picture and a green buy button
const STORE_TABS = [["coins", "Coins", '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><path d="M12 9.5v5"/>'],
  ["mats", "Materials", null], ["deals", "Deals", '<path d="M3.5 12.5V4h8.5l9 9-8.5 8.5Z"/><circle cx="8" cy="8.5" r="1.6"/>'],
  ["mine", "Relics", '<circle cx="12" cy="14.5" r="6"/><circle cx="12" cy="14.5" r="2.6"/><path d="M8.5 3h7l-1.8 6.2h-3.4Z"/>']];
const svgI = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const matIc = id => svgI(AF.MAT_IC[id]);
// (31 Oct, "a real model not just icon") the turning model in place of the line icon (merchant.js AF.matArt)
function matModels(root) {
  if (!AF.matArt) return;
  $$("[data-mat-art]", root).forEach(a => { const ic = $("svg", a), cv = document.createElement("canvas"); cv.className = "mat-3d"; if (ic) ic.replaceWith(cv); else a.prepend(cv); AF.matArt.live(cv, a.dataset.matArt); });
}
const matUsers = id => Object.keys(AF.EVO_REQ).filter(k => (AF.EVO_REQ[k].mats || {})[id]).map(k => AF.UNIT[k].name.split(",")[0]);
const slotMax = () => AF.RELIC.slots + AF.UPG.relicCase.max + AF.UPG.relicVault.max;
const rcol = x => AF.RAR[RELIC_R[x.r]].color;
const coinCv = (k, r) => `<canvas class="rl-coin" data-k="${k}" data-r="${r}"></canvas>`;
const noShards = (b, need) => { FX.nope(b); sfx("error"); toast(`You need ${fmt(need)} Aura Shards for that.`, "bad"); };
function renderRelics() {
  const box = $("#relics"); if (!box) return;
  const open = G.storeOpen(), tab = UI.storeTab || "coins";
  if (W3D && HUB.storeOpen) HUB.storeOpen(open);
  // a re-render on the same aisle keeps where you had scrolled to
  const same = box.dataset.tab === tab, keep = same ? [$(".mk-body", box), $(".mk-inv", box)].map(e => e ? e.scrollTop : 0) : [0, 0];
  box.dataset.tab = tab;
  box.classList.toggle("tall", open && tab === "mine");
  box.innerHTML = `${open ? `<nav class="mk-tabs">${STORE_TABS.map(([id, n, d]) => `<button class="mk-tab${id === tab ? " on" : ""}" data-st="${id}">${svgI(d || AF.MAT_IC.soul)}<span>${n}</span></button>`).join("")}</nav>` : ""}
    <div class="mk-frame"><div class="mk-awn" aria-hidden="true"></div>
      <header class="mk-top"><div class="mk-plate"><small>The Merchant's</small><b>Wandering Market</b></div><div class="mk-purse">${SHARD}<b>${fmt(S().shards)}</b></div></header>
      <div class="mk-body">${open ? "" : `<div class="mk-closed"><div class="st-sign">Closed</div><p>The Merchant is still setting up. He opens his stall after your <b>first Rebirth</b>, with relic coins to flip, materials the Underworld's pacts ask for, and deals that change every day.</p></div>`}</div></div>`;
  if (!open) return;
  const body = $(".mk-body", box);
  ({ coins: shelfCoins, mats: shelfMats, deals: shelfDeals, mine: shelfMine })[tab](body);
  $$("[data-st]", box).forEach(b => b.onclick = () => { if (UI.storeTab === b.dataset.st) return; UI.storeTab = b.dataset.st; UI.rlPick = null; sfx("click"); renderRelics(); });
  paintCoins(box);
  body.scrollTop = keep[0]; const inv = $(".mk-inv", box); if (inv) inv.scrollTop = keep[1];
}
// the slots you wear, small, under the coins (the Relics aisle has the real ones)
function wearStrip() {
  const n = G.relicSlots();
  return `<div class="mk-mini"><b>Wearing</b><div class="mk-mini-s">${Array.from({ length: slotMax() }, (_, i) => {
    const x = i < n && G.relicAt(i);
    return `<span class="${i >= n ? "lk" : x ? "on" : ""}"${x ? ` style="--rc:${rcol(x)}"` : ""}>${x ? coinCv(x.k, x.r) : i >= n ? I.lock : ""}</span>`; }).join("")}</div>
    <button class="btn sm ghost" data-st="mine">Change relics</button></div>`;
}
function shelfCoins(body) {
  const W = G.relicW(), tot = W.reduce((x, w) => x + w, 0), c1 = G.relicCost(1), c10 = G.relicCost(10), sh = S().shards;
  body.innerHTML = `<div class="mk-grid g3">
      <div class="mk-card"><b class="mk-t">One coin</b><div class="mk-art">${coinCv("back", -1)}</div><span class="mk-s">He flips it onto the counter. Its face is your relic.</span>
        <button class="mk-buy${sh < c1 ? " poor" : ""}" data-roll="1">${SHARD}<span>${fmt(c1)}</span></button></div>
      <div class="mk-card"><i class="mk-rib">x10</i><b class="mk-t">Ten coins</b><div class="mk-art stack">${coinCv("back", -1).repeat(3)}</div><span class="mk-s">Ten relics in one throw.</span>
        <button class="mk-buy${sh < c10 ? " poor" : ""}" data-roll="10">${SHARD}<span>${fmt(c10)}</span></button></div>
      <div class="mk-card mk-odds"><b class="mk-t">What lands</b><ul>${AF.RELIC.rar.map((r, i) => `<li style="--rc:${AF.RAR[RELIC_R[i]].color}"><i></i><span>${r.name}</span><b>${+(W[i] / tot * 100).toPrecision(3)}%</b></li>`).join("")}</ul>
        <span class="mk-s">Every flip costs ${Math.round((AF.RELIC.grow - 1) * 100)}% more than the last.</span></div></div>
    ${wearStrip()}`;
  $$("[data-roll]", body).forEach(b => b.onclick = () => rollRelics(+b.dataset.roll, b));
}
function shelfMats(body) {
  const q = UI.matQty || 1, sh = S().shards;
  body.innerHTML = `<div class="mk-bar"><p>The Keeper's pacts ask for these, and nobody else sells them. Each one you buy raises the next one's price.</p>
      <div class="mk-qty">${[1, 5].map(n => `<button data-q="${n}" class="${n === q ? "on" : ""}">x${n}</button>`).join("")}</div></div>
    <div class="mk-grid g4">${AF.MATS.map(m => { const c = G.matCost(m.id, q), who = matUsers(m.id); return `<div class="mk-card" style="--mc:${m.c}">
      <b class="mk-t">${esc(m.name)}</b><div class="mk-art mat" data-mat-art="${m.id}">${matIc(m.id)}<i class="mk-own">Have <b>${G.matHave(m.id)}</b></i></div>
      <span class="mk-s">${who.length ? "For " + esc(who.join(", ")) : esc(m.desc)}</span>
      <button class="mk-buy${sh < c ? " poor" : ""}" data-mat="${m.id}" data-n="${q}">${q > 1 ? `<em>x${q}</em>` : ""}${SHARD}<span>${fmt(c)}</span></button></div>`; }).join("")}</div>`;
  matModels(body);
  $$("[data-q]", body).forEach(b => b.onclick = () => { UI.matQty = +b.dataset.q; sfx("click"); renderRelics(); });
  $$("[data-mat]", body).forEach(b => b.onclick = () => {
    const r = G.buyMat(b.dataset.mat, +b.dataset.n);
    if (r.err === "shards") return noShards(b, r.need);
    if (r.err) return;
    const c = FX.center(b); sfx("unlock"); FX.burst(c.x, c.y, { colors: [AF.MAT[b.dataset.mat].c, "#ffffff"], n: 30, shape: "star", speed: 380, gravity: 300 });
    toast(`Bought ${b.dataset.n} ${AF.MAT[b.dataset.mat].name}${+b.dataset.n > 1 ? "s" : ""}.`); renderRelics(); refresh(); G.save();
  });
}
function shelfDeals(body) {
  const list = G.deals(), left = (G.dealDay() + 1) * 864e5 - Date.now(), hh = Math.floor(left / 36e5), mm = Math.floor((left % 36e5) / 6e4), sh = S().shards;
  const what = d => d.t === "mat" ? { ic: matIc(d.id) + `<i class="mk-own">x<b>${d.n}</b></i>`, cls: "mat", mc: AF.MAT[d.id].c, t: AF.MAT[d.id].name, s: "For the Keeper's pacts", rib: `-${Math.round(d.off * 100)}%`, was: G.matCost(d.id, d.n), mat: d.id }
    : d.t === "coin" ? { ic: coinCv("back", -1), t: "Lucky coin", s: "Lands Epic or better", rib: "Lucky", mc: "#c9a8ff" }
    : d.t === "copy" ? { ic: "", t: AF.UNIT[d.k].name.split(",")[0], s: `${/^[AEIOU]/.test(AF.RAR[AF.UNIT[d.k].rarity].name) ? "An" : "A"} ${AF.RAR[AF.UNIT[d.k].rarity].name} copy, for its stars`, rib: "Unit", mc: AF.RAR[AF.UNIT[d.k].rarity].color }
    : { ic: `<span class="mk-yen">&yen;</span>`, t: "Crate of yen", s: `An hour of income: ${fmt(G.rate() * 3600)} ¥`, mc: "#ffd23a" };
  body.innerHTML = `<div class="mk-bar"><p>Four offers a day. Each one can be bought once.</p>
      <div class="mk-timer">${svgI('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>')}<span>New deals in <b>${hh}h ${mm}m</b></span></div></div>
    <div class="mk-grid g4">${list.map((d, i) => { const w = what(d), got = G.dealGot(i), c = G.dealCost(d); return `<div class="mk-card${got ? " got" : ""}" style="--mc:${w.mc}">
      ${w.rib ? `<i class="mk-rib">${w.rib}</i>` : ""}<b class="mk-t">${esc(w.t)}</b><div class="mk-art${w.cls ? " " + w.cls : ""}" data-i="${i}"${w.mat ? ` data-mat-art="${w.mat}"` : ""}>${w.ic}</div>
      <span class="mk-s">${esc(w.s)}</span>${got ? `<div class="mk-sold">Sold</div>` : ""}
      <button class="mk-buy${sh < c ? " poor" : ""}" data-deal="${i}"${got ? " disabled" : ""}>${w.was ? `<s>${fmt(w.was)}</s>` : ""}${SHARD}<span>${fmt(c)}</span></button></div>`; }).join("")}</div>`;
  matModels(body);
  list.forEach((d, i) => { if (d.t === "copy") { const s = $(`.mk-art[data-i="${i}"]`, body); if (s) s.appendChild(cardEl({ k: d.k, lv: 1, eq: -1 }, { index: true, cls: "sm" })); } });
  $$("[data-deal]", body).forEach(b => b.onclick = async () => {
    if (UI.busy) return;
    const r = G.buyDeal(+b.dataset.deal);
    if (r.err === "shards") return noShards(b, r.need);
    if (r.err) return;
    sfx("unlock"); G.save();
    if (r.relic) { UI.busy = true; try { await (W3D && HUB.coinToss && UI.tab === "relics" ? coinReveal([r.relic]) : relicReveal([r.relic])); } finally { UI.busy = false; } }
    else if (r.unit) toast(`${AF.UNIT[r.unit.k].name} is yours.`);
    else if (r.yen) toast(`+${fmt(r.yen)} ¥`);
    else toast(`Bought ${r.d.n} ${AF.MAT[r.d.id].name}${r.d.n > 1 ? "s" : ""}.`);
    renderRelics(); refresh();
  });
}
// (31 Oct, "it needs an actual slot for em"): numbered sockets you put relics into
function rlCard(x, slot, sel) {
  const K = AF.RELIC.KIND[x.k];
  return `<button class="mk-rl rr-${RELIC_R[x.r]}${slot >= 0 ? " worn" : ""}${sel ? " sel" : ""}" data-rid="${x.id}" draggable="true" style="--rc:${rcol(x)}">${coinCv(x.k, x.r)}
    <span class="mk-rt"><b>${esc(K.name)}</b><em>${AF.RELIC.rar[x.r].name} &middot; ${Math.round(x.q * 100)}%</em><span>${esc(K.txt(G.relicVal(x)))}</span></span>${slot >= 0 ? `<i class="mk-slot">Slot ${slot + 1}</i>` : ""}</button>`;
}
// a coin flying from one place on screen to a coin canvas (the FLIP of a wear or a take-off)
function flyCoin(x, r0, to) {
  if (!r0 || !to) return;
  const r1 = to.getBoundingClientRect(); if (!r1.width) return;
  const cv = document.createElement("canvas"); cv.className = "mk-fly"; AF.coin.draw(cv, x.k, x.r);
  Object.assign(cv.style, { left: r0.left + "px", top: r0.top + "px", width: r0.width + "px", height: r0.width + "px" });
  document.body.appendChild(cv); to.style.opacity = "0";
  const dx = r1.left - r0.left, dy = r1.top - r0.top, s = r1.width / r0.width;
  cv.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${dx}px,${dy}px) scale(${s})` }],
    { duration: 420, easing: "cubic-bezier(.65,0,.35,1)" }).onfinish = () => {
    cv.remove(); to.style.opacity = "";
    const c = FX.center(to); FX.burst(c.x, c.y, { colors: [rcol(x), "#ffffff"], n: 10 + x.r * 5, shape: "star", speed: 220, gravity: 200 });
    const sock = to.closest(".mk-sock"); if (sock) { sock.classList.remove("pop"); void sock.offsetWidth; sock.classList.add("pop"); }
  };
}
// wear id in slot (null: the first empty one); from: the coin canvas it flies from. false when every slot is full
function wearAt(id, slot, from) {
  const B = G.relicBox(), x = B.inv.find(y => y.id === id), r0 = from && from.getBoundingClientRect();
  const r = G.wearRelic(id, true, slot);
  if (r.err) return false;
  UI.rlPick = null; sfx("unlock"); renderRelics(); refresh(); G.save();
  flyCoin(x, r0, $(`.mk-sock[data-slot="${B.eq.indexOf(id)}"] .rl-coin`));
  return true;
}
function takeOff(id, from) {
  const B = G.relicBox(), x = B.inv.find(y => y.id === id), r0 = from && from.getBoundingClientRect();
  G.wearRelic(id, false); sfx("click"); renderRelics(); refresh(); G.save();
  flyCoin(x, r0, $(`.mk-rl[data-rid="${id}"] .rl-coin`));
}
function shelfMine(body) {
  const B = G.relicBox(), n = G.relicSlots(), cut = S().opts.relicScrap == null ? -1 : S().opts.relicScrap;
  if (UI.rlPick != null && !B.inv.some(x => x.id === UI.rlPick)) UI.rlPick = null;
  const pick = UI.rlPick, slotOf = id => { const i = B.eq.indexOf(id); return i >= 0 && i < n ? i : -1; };
  const worn = G.relicsWorn(), sum = {}; worn.forEach(x => { sum[x.k] = (sum[x.k] || 0) + G.relicVal(x); });
  const inv = B.inv.slice().sort((a, b) => { const sa = slotOf(a.id), sb = slotOf(b.id); return ((sb >= 0) - (sa >= 0)) || (sa >= 0 ? sa - sb : 0) || b.r - a.r || b.q - a.q; });
  const pk = pick != null && B.inv.find(x => x.id === pick);
  body.innerHTML = `<div class="mk-socks${pk ? " picking" : ""}">${Array.from({ length: slotMax() }, (_, i) => {
      if (i >= n) return `<div class="mk-sock lk"><div class="mk-well">${I.lock}</div><b>Locked</b><span>Relic Case, Rebirth shop</span></div>`;
      const x = G.relicAt(i);
      return `<button class="mk-sock${x ? " on" : ""}" data-slot="${i}"${x ? ` style="--rc:${rcol(x)}"` : ""}><i class="mk-n">${i + 1}</i>
        <div class="mk-well">${x ? `${coinCv(x.k, x.r)}<i class="mk-off" title="Take off">${I.x}</i>` : `<i class="mk-plus">${I.plus}</i>`}</div>
        <b>${x ? esc(AF.RELIC.KIND[x.k].name) : "Empty"}</b><span>${x ? esc(AF.RELIC.KIND[x.k].txt(G.relicVal(x))) : pk ? "Put it here" : "Pick a relic below"}</span></button>`; }).join("")}</div>
    <div class="mk-tot">${Object.keys(sum).length ? `<b>All worn</b>${Object.keys(sum).map(k => `<span>${esc(AF.RELIC.KIND[k].txt(sum[k]))}</span>`).join("")}` : `<b>Nothing worn yet</b>`}</div>
    <div class="mk-tools"><span class="mk-count">Collection <b>${B.inv.length}</b> / ${AF.RELIC.keep}</span>
      <button class="btn sm gold" id="rlBest">Wear the best</button><button class="btn sm ghost" id="rlOff"${worn.length ? "" : " disabled"}>Take all off</button>
      <select id="rlCut" aria-label="Auto scrap"><option value="-1">Auto scrap: off</option>${AF.RELIC.rar.slice(0, 3).map((r, i) => `<option value="${i}" ${cut === i ? "selected" : ""}>Auto scrap: ${i ? r.name + " and below" : r.name}</option>`).join("")}</select>
      <span class="mk-scrap"><button class="btn sm ghost" id="rlScrap">Scrap unworn</button></span></div>
    <p class="mk-hint${pk ? " pick" : ""}">${pk ? `Every slot is full. Pick a slot above for <b>${esc(AF.RELIC.KIND[pk.k].name)}</b>, or click it again to cancel.`
      : "Click a relic to wear it in the first empty slot, or drag it onto a slot. Click a worn slot to take it off."}</p>
    <div class="mk-inv">${inv.length ? inv.map(x => rlCard(x, slotOf(x.id), x.id === pick)).join("") : `<div class="mk-none">No relics yet. Flip a coin in the Coins aisle.</div>`}</div>`;
  $$(".mk-rl", body).forEach(t => {
    const id = +t.dataset.rid, cv = $(".rl-coin", t);
    t.onclick = () => {
      const at = slotOf(id);
      if (pick != null && pick !== id && at >= 0) { wearAt(pick, at, $(`.mk-rl[data-rid="${pick}"] .rl-coin`, body)); return; }
      if (at >= 0) { takeOff(id, $(`.mk-sock[data-slot="${at}"] .rl-coin`, body)); return; }
      if (pick === id) { UI.rlPick = null; sfx("click"); renderRelics(); return; }
      if (!wearAt(id, null, cv)) { UI.rlPick = id; sfx("click"); renderRelics(); }
    };
    t.ondragstart = e => { e.dataTransfer.setData("text/plain", String(id)); e.dataTransfer.effectAllowed = "move"; t.classList.add("drag"); };
    t.ondragend = () => t.classList.remove("drag");
  });
  $$(".mk-sock[data-slot]", body).forEach(s => {
    const i = +s.dataset.slot;
    s.onclick = () => {
      if (pick != null) { wearAt(pick, i, $(`.mk-rl[data-rid="${pick}"] .rl-coin`, body)); return; }
      const x = G.relicAt(i);
      if (x) takeOff(x.id, $(".rl-coin", s));
      else { const inv = $(".mk-inv", body); if (inv) { inv.classList.remove("nudge"); void inv.offsetWidth; inv.classList.add("nudge"); } }
    };
    s.ondragover = e => { e.preventDefault(); s.classList.add("over"); };
    s.ondragleave = () => s.classList.remove("over");
    s.ondrop = e => { e.preventDefault(); s.classList.remove("over"); const id = +e.dataTransfer.getData("text/plain"); if (id) wearAt(id, i, $(`.mk-rl[data-rid="${id}"] .rl-coin`, body)); };
  });
  $("#rlBest", body).onclick = () => { G.wearBestRelics(); UI.rlPick = null; sfx("unlock"); renderRelics(); refresh(); G.save(); };
  $("#rlOff", body).onclick = () => { G.relicBox().eq = []; G._star = null; UI.rlPick = null; sfx("click"); renderRelics(); refresh(); G.save(); };
  $("#rlCut", body).onchange = e => { const v = +e.target.value; S().opts.relicScrap = v < 0 ? null : v; sfx("click"); renderRelics(); G.save(); };
  // (31 Oct) its own choice of rarities, not the auto scrap setting's
  $("#rlScrap", body).onclick = e => {
    e.stopPropagation();
    const wrap = $(".mk-scrap", body), old = $(".mk-smenu", wrap);
    if (old) { old.remove(); return; }
    const pick = r => B.inv.filter(x => x.r <= r && slotOf(x.id) < 0);
    const m = h(`<div class="mk-smenu">${AF.RELIC.rar.slice(0, 4).map((rr, i) => { const l = pick(i); return `<button data-r="${i}" ${l.length ? "" : "disabled"} style="--rc:${AF.RAR[RELIC_R[i]].color}">
      <i></i><span>${i ? rr.name + " and below" : rr.name}</span><b>${l.length}</b><small>${SHARD}${fmt(l.reduce((t, x) => t + G.relicScrapVal(x), 0))}</small></button>`; }).join("")}</div>`);
    wrap.appendChild(m); sfx("click");
    const mb = m.getBoundingClientRect(), bb = body.getBoundingClientRect();
    if (mb.right > bb.right - 4) m.classList.add("end");
    if (mb.bottom > bb.bottom - 4) m.classList.add("up");
    const close = ev => { if (!m.contains(ev.target)) { m.remove(); removeEventListener("pointerdown", close, true); } };
    setTimeout(() => addEventListener("pointerdown", close, true), 0);
    $$("[data-r]", m).forEach(b => b.onclick = () => {
      const r = +b.dataset.r, ids = pick(r).map(x => x.id), name = r ? `${AF.RELIC.rar[r].name} and below` : AF.RELIC.rar[0].name;
      m.remove(); removeEventListener("pointerdown", close, true);
      confirmBox("Scrap relics?", `Scrap ${ids.length} unworn ${name} relic${ids.length === 1 ? "" : "s"} for Aura Shards? Worn relics are kept.`, "Scrap", () => {
        const got = G.scrapRelics(ids); sfx("unlock"); toast(`Scrapped ${ids.length} for ${fmt(got)} shards.`); renderRelics(); renderShop(); refresh(); G.save();
      });
    });
  };
}
async function rollRelics(n, btn) {
  if (UI.busy) return;
  const r = G.rollRelics(n);
  if (r.err === "shards") { FX.nope(btn); sfx("error"); toast(`You need ${fmt(r.need)} Aura Shards for that.`, "bad"); return; }
  if (r.err) return;
  UI.busy = true; FX.squash(btn); sfx("click");
  G.save();
  try { await (W3D && HUB.coinToss && UI.tab === "relics" ? coinReveal(r.got) : relicReveal(r.got)); } finally { UI.busy = false; }
  renderRelics(); renderShop(); refresh();
}
// (31 Oct, "Make more of a summary of what you got on the coin toss ... when you hover over a coin it moves up and shows
// you everything it does. when you hover over legendary+ it glows cause its got aura"): the coins flip in the world and
// a summary card on the right fills as each one lands; Legendary+ get their moment round the coin (HUB.coinFlair)
function relicTip(x, scrap) {
  const K = AF.RELIC.KIND[x.k], R = AF.RELIC.rar[x.r], v = G.relicVal(x), col = rcol(x);
  const same = G.relicsWorn().filter(y => y.k === x.k && y.id !== x.id).sort((a, b) => G.relicVal(b) - G.relicVal(a))[0];
  const free = G.relicsWorn().length < G.relicSlots();
  const cmp = scrap ? `<span class="rt-cmp lo">Scrapped for ${SHARD}${fmt(G.relicScrapVal(x))}</span>`
    : same ? (v > G.relicVal(same) ? `<span class="rt-cmp up">Better than the ${esc(K.name)} you wear (${esc(K.txt(G.relicVal(same)))})</span>` : `<span class="rt-cmp">The ${esc(K.name)} you wear is stronger (${esc(K.txt(G.relicVal(same)))})</span>`)
    : free ? `<span class="rt-cmp up">You have a free slot for it</span>` : `<span class="rt-cmp">You wear no ${esc(K.name)} yet</span>`;
  const q = Math.round(x.q * 100), qk = Math.max(0, Math.min(1, (x.q - 0.8) / 0.4));
  return `<div class="rt" style="--rc:${col}"><div class="rt-top">${coinCv(x.k, x.r)}<div><b>${esc(K.name)}</b><em>${R.name}${x.r >= 3 ? " &middot; Aura" : ""}</em></div></div>
    <div class="rt-does">${esc(K.txt(v))}</div>
    <div class="rt-q"><span>Quality <b>${q}%</b></span><i><s style="width:${qk * 100}%"></s></i><small>80% to 120%</small></div>
    <ul class="rt-tiers">${AF.RELIC.rar.map((rr, i) => `<li class="${i === x.r ? "on" : ""}" style="--tc:${AF.RAR[RELIC_R[i]].color}"><span>${rr.name}</span><b>${esc(K.txt(K.v[i]))}</b></li>`).join("")}</ul>
    ${cmp}${scrap ? "" : `<span class="rt-sc">Scraps for ${SHARD}${fmt(G.relicScrapVal(x))}</span>`}</div>`;
}
async function coinReveal(got) {
  const panel = $("#relics"); if (panel) panel.classList.add("mr-busy");
  const one = got.length === 1;
  const out = h(`<div class="ro${one ? " one" : ""}"><div class="ro-card">
      <header class="ro-head"><b>${one ? "Your coin" : `${got.length} coins`}</b><span class="ro-sub">On the counter...</span></header>
      <div class="ro-coins">${got.map((g, i) => `<div class="ro-c" data-i="${i}"><i class="ro-ph"></i></div>`).join("")}</div>
      <div class="ro-more"></div>
      <div class="ro-foot"><span class="ro-hint"></span><button class="mk-buy ro-go" hidden>Continue</button></div></div>
    <div class="ro-tip"></div></div>`);
  $("#layer").appendChild(out);
  const tip = $(".ro-tip", out);
  sfx("rise", { dur: 0.6 });
  await HUB.coinToss(got.map(({ x }) => ({ k: x.k, r: x.r })), i => {
    const { x, scrap } = got[i], c = $(`.ro-c[data-i="${i}"]`, out);
    c.innerHTML = `${coinCv(x.k, x.r)}${scrap ? `<em class="ro-x">Scrap</em>` : ""}`;
    c.className = `ro-c in rr-${RELIC_R[x.r]}${scrap ? " gone" : ""}`; c.style.setProperty("--rc", rcol(x));
    paintCoins(c);
    sfx(x.r >= 3 ? "reveal" : "pop", { rank: x.r + 2, i: 4 + x.r * 2 });
    if (x.r >= 3 && HUB.coinFlair) HUB.coinFlair(i, x.r);
  });
  // the summary: a tally by rarity, the best of them, what went to scrap
  const best = got.map(g => g.x).sort((a, b) => b.r - a.r || b.q - a.q)[0];
  const scr = got.filter(g => g.scrap), back = scr.reduce((t, g) => t + G.relicScrapVal(g.x), 0);
  const tally = AF.RELIC.rar.map((r, i) => [i, got.filter(g => g.x.r === i).length]).filter(([, n]) => n).reverse();
  $(".ro-sub", out).textContent = one ? AF.RELIC.rar[best.r].name : `Best: ${AF.RELIC.rar[best.r].name}`;
  $(".ro-more", out).innerHTML = one ? relicTip(best, got[0].scrap)
    : `<div class="ro-tally">${tally.map(([i, n]) => `<span style="--rc:${AF.RAR[RELIC_R[i]].color}"><i></i>${n} ${AF.RELIC.rar[i].name}</span>`).join("")}</div>
      <div class="ro-best" style="--rc:${rcol(best)}">${coinCv(best.k, best.r)}<div><small>Best coin</small><b>${esc(AF.RELIC.KIND[best.k].name)}</b><span>${esc(AF.RELIC.KIND[best.k].txt(G.relicVal(best)))}</span></div></div>
      ${scr.length ? `<div class="ro-scr">${scr.length} scrapped, ${SHARD}${fmt(back)} back</div>` : ""}`;
  paintCoins($(".ro-more", out));
  FX.enter($(".ro-more", out));
  // hover a coin: it lifts and its card shows beside the summary
  $$(".ro-c", out).forEach(c => {
    const i = +c.dataset.i;
    c.onpointerenter = () => {
      tip.innerHTML = relicTip(got[i].x, got[i].scrap); paintCoins(tip);
      tip.style.top = Math.max(0, c.offsetTop + $(".ro-card", out).offsetTop - 30) + "px";
      tip.classList.add("on");
    };
    c.onpointerleave = () => tip.classList.remove("on");
  });
  // (31 Oct, "hover over the coins in 3d space"): the same card beside the pointer for a coin in the world
  const wtip = h(`<div class="ro-wtip"></div>`); document.body.appendChild(wtip);
  HUB.onCoin = (i, x, y, move) => {
    $$(".ro-c.hl", out).forEach(c => c.classList.remove("hl"));
    if (i < 0) { wtip.classList.remove("on"); return; }
    $(`.ro-c[data-i="${i}"]`, out)?.classList.add("hl");
    if (!move) { wtip.innerHTML = relicTip(got[i].x, got[i].scrap); paintCoins(wtip); }
    const z = +getComputedStyle(document.documentElement).getPropertyValue("--uiz") || 1, w = 290 * z, ht = wtip.offsetHeight * z;
    wtip.style.left = (x > innerWidth * 0.55 ? x - w - 24 : x + 24) + "px";
    wtip.style.top = Math.max(8, Math.min(innerHeight - ht - 8, y - ht / 2)) + "px";
    wtip.classList.add("on");
  };
  const go = $(".ro-go", out), hint = $(".ro-hint", out);
  go.hidden = false; hint.textContent = "Hover a coin, here or on the counter, to read it."; FX.enter(go);
  // continue: the button, Space (UI.skipReveal), or a click anywhere outside the card
  await new Promise(res => {
    const done = e => {
      if (e && e.type === "pointerdown" && e.target.closest && e.target.closest(".ro-card") && !e.target.closest(".ro-go")) return;
      removeEventListener("pointerdown", done, true); UI.skipReveal = null; res();
    };
    setTimeout(() => addEventListener("pointerdown", done, true), 50); UI.skipReveal = done; go.onclick = () => done();
  });
  sfx("click");
  HUB.onCoin = null; wtip.remove();
  out.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }).onfinish = () => out.remove();
  const p0 = HUB.camS.push; HUB.tw(0, 0.6, k => { HUB.camS.push = p0 * (1 - HUB.ease(k)); });
  if (panel) panel.classList.remove("mr-busy");
}
// the reveal: the relics turn over one after another; Legendary and Mythic land with a burst, Mythic with a banner
async function relicReveal(got) {
  const ov = h(`<div class="reveal rl-rv"><div class="rv-dim"></div><div class="rl-rv-grid${got.length === 1 ? " one" : ""}"></div><div class="rv-foot"><div class="rv-hint"></div></div></div>`);
  $("#layer").appendChild(ov);
  $(".rv-dim", ov).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, fill: "forwards" });
  const grid = $(".rl-rv-grid", ov);
  got.forEach(({ x, scrap }) => grid.insertAdjacentHTML("beforeend", `<div class="rl-flip"><div class="rl-back"><i></i></div>${relicHTML(x, { cls: "face" })}${scrap ? `<em class="rl-scrapped">Scrapped</em>` : ""}</div>`));
  paintCoins(grid);
  let skip = false;
  const skipNow = () => { skip = true; };
  ov.addEventListener("pointerdown", skipNow);
  await FX.wait(260);
  const tiles = $$(".rl-flip", grid);
  for (let i = 0; i < tiles.length; i++) {
    const { x } = got[i], t = tiles[i];
    t.classList.add("open");
    const c = FX.center(t), col = AF.RAR[RELIC_R[x.r]].color;
    sfx(x.r >= 3 ? "reveal" : "pop", { rank: x.r + 2, i: 4 + x.r * 2 });
    if (x.r >= 2) FX.burst(c.x, c.y, { colors: x.r === 4 ? FX.RAINBOW : [col, "#ffffff"], n: 14 + x.r * 14, shape: "star", speed: 260 + x.r * 80, gravity: 220 });
    if (x.r >= 3) { FX.ring(c.x, c.y, { c: col, rainbow: x.r === 4, r: 140 + x.r * 30 }); FX.shake(0.2 + (x.r - 3) * 0.3); }
    if (x.r === 4) { FX.flash("#ffffff", 0.3, 0.45); banner("MYTHIC RELIC", `${AF.RELIC.KIND[x.k].name}: ${AF.RELIC.KIND[x.k].txt(G.relicVal(x))}`, "tb5"); }
    await FX.wait(skip ? 30 : x.r >= 3 ? 520 : got.length > 1 ? 150 : 320);
  }
  ov.removeEventListener("pointerdown", skipNow);
  const hint = $(".rv-hint", ov); hint.textContent = "Click anywhere to continue"; FX.enter(hint);
  await new Promise(res => { const done = () => { ov.removeEventListener("pointerdown", done); UI.skipReveal = null; res(); }; ov.addEventListener("pointerdown", done); UI.skipReveal = done; });
  sfx("click");
  ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }).onfinish = () => ov.remove();
}
// (29 Oct): what each ascension count opens, read from the data (shop items, gates, slots)
function ascPath() {
  const at = {};
  const add = (n, txt) => { (at[n] = at[n] || []).push(txt); };
  // a Defense clear an ascension waits for comes first in its list
  Object.entries(G.ascPath()).forEach(([n, k]) => add(+n, { req: k }));
  AF.UPGRADES.forEach(d => { if (d.asc) add(d.asc, G.has(d.id) ? { own: d.name } : d.name); });
  add(AF.REBIRTH.asc, "Rebirth");
  AF.GATES.forEach(g => { if (g.asc) add(g.asc, g.name); });
  Object.entries(AF.ECON.slotAsc).forEach(([slot, n]) => add(n, "Slot " + slot));
  return Object.keys(at).map(Number).sort((a, b) => a - b).map(n => ({ n, items: at[n] }));
}
function pathHTML() {
  const a = S().asc, path = ascPath(), next = path.find(p => p.n > a);
  const opens = p => p.items.filter(x => typeof x === "string"), req = p => p.items.find(x => x.req);
  const lede = !next ? "You've opened everything on the path."
    : `Ascension ${next.n}${req(next) ? ` needs you to ${reqDo(req(next).req).replace(/^./, ch => ch.toLowerCase())}` : ""}${opens(next).length ? `${req(next) ? ", and" : ""} opens ${opens(next).join(", ")}` : ""}.`;
  return `<div class="apath"><div class="apath-h"><h2>Ascension path${S().reb ? ` <small>Rebirth ${S().reb}</small>` : ""}</h2><p class="lede">${lede}</p></div>
    <div class="apath-track">${path.map(p => `<div class="anode${a >= p.n ? " done" : p === next ? " next" : ""}">
      <div class="an-top"><span class="an-n">${p.n}</span><i class="an-line"></i></div>
      <ul>${p.items.map(x => x.req ? `<li class="an-req${G.reqMet(x.req) ? " met" : ""}">${reqIcon(x.req)}<span>${esc(reqDo(x.req))}</span></li>`
        : x.own ? `<li class="an-own" title="Owned: the shop is kept through a Rebirth">${I.check}<span>${esc(x.own)}</span></li>` : `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div></div>`;
}
function renderShop() {
  const box = $("#shop"); if (!box) return;
  // (30 Oct) the Rebirth shop's upgrades (reb) get their own row
  const row = d => {
    const lv = G.upLv(d.id), max = lv >= d.max, cost = G.shopCost(d.id), locked = G.upLocked(d), afford = S().shards >= cost && !locked;
    const sw = d.unlock && lv && S().opts[d.id] !== undefined
      ? `<label class="switch"><input type="checkbox" data-auto="${d.id}" ${S().opts[d.id] ? "checked" : ""}><span class="sw"></span><span>On</span></label>` : "";
    return `<div class="upg${d.unlock ? " unlock" : ""}${max ? " maxed" : ""}${!max && afford ? " can" : ""}${!max && locked ? " locked" : ""}">
      <div class="upg-h"><b>${d.name}</b><span>${d.unlock ? (lv ? "Owned" : "Unlock") : `${lv}/${d.max}`}</span></div>
      <p>${d.desc}</p>
      ${d.fx && lv ? `<em>${d.fx(lv)}</em>` : ""}
      ${d.id === "bulk" && lv ? "<em>On the Summon tab</em>" : ""}
      <div class="upg-f">${sw}${max ? (d.unlock ? "" : `<span class="maxtag">Maxed</span>`) : locked
        ? `<span class="asc-lock">${I.lock}${d.reb && (S().reb || 0) < d.reb ? `Rebirth ${d.reb} time${d.reb === 1 ? "" : "s"} first` : d.needs && !d.needs.every(G.has) ? `Needs ${d.needs.map(n => AF.UPG[n].name).join(" and ")}` : `Ascend ${d.asc} time${d.asc === 1 ? "" : "s"} first`}</span>` : `<button class="btn sm row ${afford ? "gold" : "off"}" data-buy="${d.id}">${SHARD}<span>${fmt(cost)}</span></button>`}</div>
    </div>`;
  };
  box.innerHTML = AF.UPGRADES.filter(d => !d.reb).map(row).join("");
  const boxR = $("#shopR"); if (boxR) boxR.innerHTML = AF.UPGRADES.filter(d => d.reb).map(row).join("");
  $$("[data-buy]", box.parentElement).forEach(b => b.onclick = () => {
    const r = G.buyUp(b.dataset.buy);
    if (r.err === "shards") { FX.nope(b); sfx("error"); toast(`You need ${fmt(r.need)} Aura Shards for that.`, "bad"); return; }
    if (r.err === "reb") { FX.nope(b); sfx("error"); toast(`Rebirth ${r.need} time${r.need === 1 ? "" : "s"} to unlock that.`, "bad"); return; }
    if (r.err === "needs") { FX.nope(b); sfx("error"); toast(`Unlock ${r.need.map(n => AF.UPG[n].name).join(" and ")} first.`, "bad"); return; }
    if (r.err === "asc") { FX.nope(b); sfx("error"); toast(`Ascend ${r.need} time${r.need === 1 ? "" : "s"} to unlock that.`, "bad"); return; }
    if (r.err) return;
    sfx("unlock"); const c = FX.center(b);
    FX.burst(c.x, c.y, { colors: ["#c9a8ff", "#7fe3ff", "#ffffff"], n: 40, shape: "shard", speed: 420, gravity: 300 });
    FX.ring(c.x, c.y, { c: "#c9a8ff", r: 120 });
    const d = AF.UPG[b.dataset.buy];
    toast(d.unlock ? `${d.name} unlocked.` : `${d.name} is now level ${G.upLv(d.id)}.`);
    renderShop(); renderRelics(); $("#shopN").textContent = fmt(S().shards); renderAutos(); refresh(); G.save();
  });
  $$("[data-auto]", box.parentElement).forEach(c => c.onchange = () => { S().opts[c.dataset.auto] = c.checked; sfx("click"); renderAutos(); renderTrOdds(); G.save(); });
}
// (30 Oct, "the ascend animation should look way cooler ... its own thing with the new 3d crystal"): with the 3D world
// the crystal does the show (island.js HUB.ascendShow) with the interface faded away, then its own title (ascShow)
function ascShow(got, names) {
  const n = S().asc, ov = h(`<div class="ascx">
    <div class="ascx-k">${[..."ASCENSION"].map((ch, i) => `<span style="animation-delay:${0.05 + i * 0.035}s">${ch}</span>`).join("")}</div>
    <div class="ascx-n">${n.toLocaleString("en-US")}</div>
    <i class="ascx-line"></i>
    <div class="ascx-s">${SHARD}<b>+0</b><span>Aura Shards</span></div>
    <div class="ascx-b">Income bonus <b>+${Math.round((G.ascMult() - 1) * 100)}%</b></div>
    ${names.length ? `<div class="ascx-new"><span>Opened</span>${names.map(x => `<em>${esc(x)}</em>`).join("")}</div>` : ""}
  </div>`);
  $("#layer").appendChild(ov);
  const b = $(".ascx-s b", ov), t0 = performance.now();
  const count = () => { const k = Math.min(1, (performance.now() - t0 - 450) / 900); if (k > 0) b.textContent = "+" + fmt(Math.round(got * (1 - Math.pow(1 - k, 3)))); if (k < 1 && ov.isConnected) setTimeout(count, 30); };
  count();
  // resolves as it goes (a click, or after a few seconds)
  return new Promise(res => {
    let gone = false;
    const out = () => { if (gone) return; gone = true; ov.classList.add("out"); res(); setTimeout(() => ov.remove(), 600); };
    ov.addEventListener("pointerdown", out);
    setTimeout(out, 4600);
  });
}
async function doAscend() {
  if (!G.canAscend() || UI.busy) return;
  UI.busy = true;
  if (W3D && HUB.ascendShow && !document.hidden) {
    document.body.classList.add("asc-show");
    sfx("rise", { dur: 1.8 });
    let got = 0, title = null;
    await HUB.ascendShow(() => {
      got = G.ascend();
      sfx("burst", { rank: 6 }); sfx("win", { at: 0.15 }); FX.shake(1);
      const opened = ascPath().find(p => p.n === S().asc), names = opened ? opened.items.filter(x => typeof x === "string") : [];
      title = ascShow(got, names);
      UI.disp = S().yen; UI.hold = 0; slotSig = ""; gatesOpen = AF.GATES.filter(G.gateOpen).map(g => g.id).join();
      G.save();
    });
    if (title) await title; // the interface comes back once the title has gone
    document.body.classList.remove("asc-show");
    UI.busy = false;
    go("ascend");
    return;
  }
  const c = { x: innerWidth / 2, y: innerHeight / 2 };
  // the win jingle's top note lands with the flash a second in
  FX.slowmo(0.4, 1.4); sfx("win", { at: 0.4 }); FX.shake(0.4);
  FX.rays(c.x, c.y, { rainbow: true, life: 2.6, n: 28, len: 1600, spin: 0.5 });
  await FX.wait(1000);
  FX.flash("#ffffff", 1.0, 1);
  const got = G.ascend();
  FX.shake(1.1);
  FX.burst(c.x, c.y, { colors: ["#c9a8ff", "#7fe3ff", "#ffffff", "#ffd0f0"], n: 220, shape: "shard", speed: 1000, gravity: 120, life: 1.8 });
  [0, 160, 320].forEach((d, i) => setTimeout(() => FX.ring(c.x, c.y, { c: "#c9a8ff", r: 400 + i * 200, w: 14 - i * 3, life: 0.9 }), d));
  banner("ASCENDED", `+${fmt(got)} Aura Shards`, "tb5");
  const opened = ascPath().find(p => p.n === S().asc), names = opened ? opened.items.filter(x => typeof x === "string") : [];
  if (names.length) setTimeout(() => toast(`Ascension ${opened.n} opened ${names.join(", ")}.`), 1800);
  UI.disp = S().yen; UI.hold = 0; slotSig = ""; gatesOpen = AF.GATES.filter(G.gateOpen).map(g => g.id).join();
  G.save();
  UI.busy = false;
  go("ascend");
}

// ---------------- Journal: quests, index, stats ----------------
function pageJournal() {
  const p = $("#p-journal");
  if (!p.firstChild) {
    p.innerHTML = `<div class="journal-top w3-head"><h1>Journal</h1><div class="seg" id="jSeg"><button data-j="quests">Quests<em class="cnt" id="qCnt" hidden></em></button><button data-j="index">Index</button><button data-j="stats">Stats</button></div></div><div id="jBody"></div>`;
    $$("#jSeg button").forEach(b => b.onclick = () => { UI.jtab = b.dataset.j; sfx("click"); renderJournal(); });
  }
  renderJournal();
}
function renderJournal() {
  const t = UI.jtab || "quests", body = $("#jBody");
  $$("#jSeg button").forEach(b => b.classList.toggle("on", b.dataset.j === t));
  if (t === "quests") renderQuests(body, true); else if (t === "index") renderIndex(body); else renderStats(body);
  body.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "ease-out" });
}
const qnum = (q, v) => (q.stat === "earned" || q.stat === "maxRate" ? fmt(v) : fmt(Math.floor(v)));
function renderQuests(box, enter) {
  // (29 Oct, request: "add a claim all button to journal")
  const ready = Object.values(AF.QUEST).filter(q => !S().quests[q.id] && G.questDone(q)), sum = ready.reduce((s, q) => s + q.shards, 0);
  box.innerHTML = `<div class="q-head"><p class="lede">Claim finished quests for &yen;, then spend it on gates and trait rolls.</p>
    ${ready.length ? `<button class="btn gold row" id="qAll"><span>Claim all ${ready.length}</span>${SHARD}<span>${sum}</span></button>` : ""}</div>` + AF.QUESTS.map(([cat, qs]) =>
    `<section class="qsec"><h3>${cat}</h3><div class="qlist">${qs.map(q => {
      const v = G.qstat(q), done = v >= q.goal, claimed = S().quests[q.id];
      const pct = q.bool ? (done ? 100 : 0) : Math.min(100, (v / q.goal) * 100);
      const prog = q.bool ? (done ? "Done" : "Not yet") : `${qnum(q, Math.min(v, q.goal))} / ${qnum(q, q.goal)}`;
      return `<div class="quest${claimed ? " claimed" : done ? " ready" : ""}">
        <div class="q-main"><b>${esc(q.name)}</b><div class="q-bar"><i style="width:${pct.toFixed(1)}%"></i></div><span class="q-prog">${prog}</span></div>
        <div class="q-rew">${SHARD}<b>${fmt(q.shards)}</b></div>
        ${claimed ? `<span class="q-done" title="Claimed">${I.check}</span>` : `<button class="btn sm${done ? " gold" : " off"}" data-claim="${q.id}" ${done ? "" : "disabled"}>Claim</button>`}
      </div>`;
    }).join("")}</div></section>`).join("");
  if (enter) $$(".quest.ready", box).forEach((q, i) => FX.enter(q, i * 40));
  const all = $("#qAll", box);
  if (all) all.onclick = () => {
    const btns = $$("[data-claim]:not([disabled])", box);
    let got = 0;
    btns.forEach((b, i) => {
      const n = G.claim(b.dataset.claim); if (!n) return;
      got += n;
      // a ripple of little bursts down the list, one per quest
      setTimeout(() => { if (!b.isConnected) return; const c = FX.center(b); FX.burst(c.x, c.y, { colors: ["#c9a8ff", "#7fe3ff", "#ffffff"], n: 14, shape: "shard", speed: 300, gravity: 300 }); }, i * 50);
    });
    if (!got) return;
    sfx("unlock"); sfx("collect", { size: 2 });
    const c = FX.center(all);
    FX.burst(c.x, c.y, { colors: ["#c9a8ff", "#7fe3ff", "#ffffff", "#ffd0f0"], n: 70, shape: "shard", speed: 600, gravity: 250 });
    FX.ring(c.x, c.y, { c: "#c9a8ff", r: 200, w: 10 });
    FX.pop($("#shardChip"), 0.9);
    floatText(all, `+${got} ¥`, "violet");
    toast(`Claimed ${btns.length} quest${btns.length === 1 ? "" : "s"} for ${got} ¥.`);
    setTimeout(() => { renderQuests(box); refresh(); }, Math.min(800, btns.length * 50 + 200));
    G.save();
  };
  $$("[data-claim]", box).forEach(b => b.onclick = () => {
    const got = G.claim(b.dataset.claim); if (!got) return;
    sfx("unlock"); sfx("coin", { i: 6 });
    const c = FX.center(b);
    FX.burst(c.x, c.y, { colors: ["#c9a8ff", "#7fe3ff", "#ffffff"], n: 36, shape: "shard", speed: 420, gravity: 300 });
    FX.ring(c.x, c.y, { c: "#c9a8ff", r: 110 });
    FX.pop($("#shardChip"), 0.6);
    floatText(b, `+${got} ¥`, "violet");
    renderQuests(box); refresh(); G.save();
  });
}
function renderStats(box) {
  const st = S().stats, found = AF.UNITS.filter(d => S().seen[d.key]).length;
  const bt = AF.TRAITS.filter(t => t.mult <= (st.bestMult || 0)).pop();
  const bestTrait = !bt ? "None yet" : bt.tier === 0 ? "A basic trait" : bt.name;
  const bp = st.bestPull ? `${AF.UNIT[st.bestPull.k].name}${st.bestPull.sh ? " (shiny)" : ""}` : "None yet";
  const tiles = [["Time played", AF.fmtTime(st.played)], ["Summons", fmt(st.summons)], ["Trait rerolls", fmt(st.rerolls)],
    ["Level-ups", fmt(st.upgrades)], ["Earned, all time", fmt(st.collected) + " ¥"], ["Best income", fmt(st.maxRate) + " ¥/s"],
    ["Units owned", fmt(S().units.length)], ["Units found", `${found} / ${AF.UNITS.length}`], ["Shinies found", st.shinies],
    ["Ascensions", S().asc], ["Best pull", bp], ["Best trait", bestTrait]];
  box.innerHTML = `<div class="panel graph"><div class="g-head"><h3>Income, last 4 hours</h3><b>${fmt(G.rate())} &yen;/s now</b></div><canvas id="incG"></canvas><p class="note" id="gNote"></p></div>
    <div class="stat-grid">${tiles.map(([k, v]) => `<div class="stile"><span>${k}</span><b>${esc(String(v))}</b></div>`).join("")}</div>`;
  drawGraph($("#incG", box), S().hist, $("#gNote", box));
}
function drawGraph(c, hist, note) {
  const W = c.clientWidth, H = 220, D = Math.min(2, devicePixelRatio || 1);
  c.width = W * D; c.height = H * D; c.style.height = H + "px";
  const x = c.getContext("2d"); x.setTransform(D, 0, 0, D, 0, 0);
  const pts = hist.slice(-240);
  if (pts.length < 2) { note.textContent = "The graph fills in as you play: a point every minute."; return; }
  const t0 = pts[0][0], t1 = Date.now(), max = Math.max(1, ...pts.map(p => p[1])) * 1.12;
  const L = 56, R = 12, T = 10, B = 24, gw = W - L - R, gh = H - T - B;
  const px = t => L + ((t - t0) / Math.max(1, t1 - t0)) * gw, py = v => T + gh - (v / max) * gh;
  x.font = "11px Geist, system-ui, sans-serif"; x.fillStyle = "#8a8f98"; x.strokeStyle = "rgba(255,255,255,.06)"; x.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i, y = py(v);
    x.beginPath(); x.moveTo(L, y); x.lineTo(W - R, y); x.stroke();
    x.textAlign = "right"; x.fillText(fmt(v), L - 8, y + 4);
  }
  x.textAlign = "left"; x.fillText(AF.fmtTime((t1 - t0) / 1000) + " ago", L, H - 6);
  x.textAlign = "right"; x.fillText("now", W - R, H - 6);
  const g = x.createLinearGradient(0, T, 0, T + gh);
  g.addColorStop(0, "rgba(255,106,61,.45)"); g.addColorStop(1, "rgba(255,106,61,0)");
  x.beginPath(); x.moveTo(px(pts[0][0]), py(0));
  pts.forEach(p => x.lineTo(px(p[0]), py(p[1])));
  x.lineTo(px(pts[pts.length - 1][0]), py(0)); x.closePath(); x.fillStyle = g; x.fill();
  x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(px(p[0]), py(p[1])) : x.moveTo(px(p[0]), py(p[1]))));
  x.strokeStyle = "#ff6a3d"; x.lineWidth = 2; x.lineJoin = "round"; x.stroke();
  const e = pts[pts.length - 1];
  x.fillStyle = "#fff"; x.beginPath(); x.arc(px(e[0]), py(e[1]), 4, 0, Math.PI * 2); x.fill();
  x.strokeStyle = "#ff6a3d"; x.lineWidth = 2; x.stroke();
  note.textContent = "";
}

// ---------------- auto pills ----------------
// (29 Oct, request: "auto summons / auto rerolls stay when switching tabs, its a little pill at the bottom with the
// roller and a toggle"): each running automation shows as a pill while you're on another tab
const AUTO = { sum: { n: 0, last: null }, roll: { n: 0 } };
function pillsBox() {
  let b = $("#pills");
  if (!b) { b = h(`<div id="pills" aria-live="polite"></div>`); document.body.appendChild(b); }
  return b;
}
function syncPills() {
  const box = pillsBox();
  const want = { sum: !!UI.autoSum, roll: !!UI.autoRoll && UI.tab !== "traits" };
  for (const k of ["sum", "roll"]) {
    let p = $(`.pill[data-p="${k}"]:not(.leaving)`, box);
    if (want[k] && !p) {
      p = buildPill(k); box.appendChild(p);
      p.animate([{ opacity: 0, transform: "translateY(30px) scale(.8)" }, { opacity: 1, transform: "translateY(-4px) scale(1.03)", offset: 0.65 }, { opacity: 1, transform: "none" }],
        { duration: 460, easing: "cubic-bezier(.2,.9,.3,1.2)" });
    } else if (!want[k] && p) {
      p.classList.add("leaving");
      p.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(20px) scale(.9)" }], { duration: 220, fill: "forwards" }).onfinish = () => p.remove();
    }
    if (want[k] && p) paintPill(k, p);
  }
}
function buildPill(k) {
  const p = h(`<div class="pill" data-p="${k}">
    <button class="pill-go" title="Open the ${k === "sum" ? "Summon tab" : "Trait Lab"}"><span class="pill-roll">${k === "sum" ? '<i class="orb mini o-0"></i>' : '<i class="msig tt-1"><b>?</b></i>'}</span>
      <span class="pill-txt"><b>${k === "sum" ? "Auto summon" : "Auto reroll"}</b><span></span></span><span class="pill-last"></span></button>
    <label class="switch" title="Stop"><input type="checkbox" checked aria-label="Auto ${k === "sum" ? "summon" : "reroll"}"><span class="sw"></span></label></div>`);
  $(".pill-go", p).onclick = () => { sfx("tab"); go(k === "sum" ? "summon" : "traits"); };
  $("input", p).onchange = () => {
    if (k === "sum") { UI.autoSum = false; const c = $("#autoSum"); if (c) c.checked = false; }
    else { UI.autoRoll = false; const c = $("#autoRoll"); if (c) c.checked = false; }
    sfx("click"); syncPills();
  };
  return p;
}
function paintPill(k, p) {
  const dot = "·";
  if (k === "sum") {
    const g = AF.GATE[S().gate], l = AUTO.sum.last;
    $(".pill-txt span", p).textContent = `${g.name} ${dot} ×${AUTO.sum.batch || UI.lastN} ${dot} ${fmt(AUTO.sum.n)} pulled`;
    $(".pill-last", p).innerHTML = l ? `<span class="pl r-${AF.UNIT[l.k].rarity}${l.sh ? " sh" : ""}"><i class="rdot"></i>${l.sh ? "Shiny " : ""}${esc(AF.UNIT[l.k].name)}</span>` : "";
  } else {
    const us = labPair().map(x => x.u);
    $(".pill-txt span", p).textContent = `${us.length ? us.map(u => AF.nameOf(u).split(",")[0]).join(" + ") : "No unit"} ${dot} ${fmt(AUTO.roll.n)} rolled`;
    $(".pill-last", p).innerHTML = us.map(u => G.trait(u)).filter(Boolean).map(tr => chipHTML(tr)).join("");
  }
}
// (29 Oct, request: "shouldnt be able to do both at once"): turning one automation on turns the other off
function onlyOneAuto(on) {
  if (G.has("twinAuto")) { syncPills(); return; } // the shard-shop unlock lets both run
  if (on === "sum" && UI.autoRoll) {
    UI.autoRoll = false; const c = $("#autoRoll"); if (c) c.checked = false;
    toast("Auto reroll is off: only one automation runs at a time.");
  }
  if (on === "roll" && UI.autoSum) {
    UI.autoSum = false; const c = $("#autoSum"); if (c) c.checked = false;
    toast("Auto summon is off: only one automation runs at a time.");
  }
  syncPills();
}
function noteAutoPull(units, n) {
  AUTO.sum.n += n;
  AUTO.sum.last = units.slice().sort((a, b) => (shinyWorth(b) - shinyWorth(a)) || rankOf(b) - rankOf(a))[0];
}
async function autoSummonLoop() {
  if (UI.sumLoop) return;
  UI.sumLoop = true; AUTO.sum.n = 0; AUTO.sum.last = null;
  try {
    while (UI.autoSum) {
      // (29 Oct, request: "the roll doesnt need to show up unless you get what you want, like for auto trait"): every
      // summon runs quietly at the full-reveal pace, on every tab; a pull at the target gets the full reveal and stops it
      if (UI.sumBusy) { await FX.wait(200); continue; }
      const units = bgSummon(); syncPills();
      if (!units) break;
      if (Math.max(...units.map(rankOf)) >= S().opts.sumStop) {
        await whenShown(); // (30 Oct) a hit while the tab is hidden waits to be revealed
        UI.sumBusy = true; UI.lockReveal = true;
        try { await (units.length > 10 ? revealBulk(units, false) : revealSummon(units, false)); } finally { UI.sumBusy = false; UI.lockReveal = false; }
        starAfterPulls(false);
        UI.autoSum = false; const c = $("#autoSum"); if (c) c.checked = false;
        toast(`Auto summon stopped: you pulled ${AF.UNIT[AUTO.sum.last.k].name}.`);
        if (UI.tab === "summon") { renderGates(); renderSumOdds(); }
        refresh(); G.save();
        break;
      }
      if (UI.tab === "summon") portalKick = 1;
      starAfterPulls(true);
      await FX.wait(revealMs(units));
    }
  } finally { UI.sumLoop = false; syncPills(); }
}
// how long the full reveal of these units takes on the Summon tab, so auto summon keeps that pace on every tab
function revealMs(units) {
  const top = Math.max(...units.map(rankOf)), sh = units.some(shinyWorth), big = top >= 4 || sh;
  let ms;
  // the portal opening (opens 650, a step per rarity, folds 420), then the cards
  ms = 650 + 420;
  for (let s = 1; s <= top; s++) ms += s >= 4 ? 760 / 0.4 : 360;
  if (units.length > 10) ms += 600 + (big ? 3000 : 1600);
  else ms += (units.length > 1 ? units.length * 110 : 0) + 720 + (sh ? 3200 : big ? 2200 : 1400);
  return ms + 220;
}
// one auto summon away from the Summon tab: no reveal, the pill's orb takes the colour of the best pull
// the biggest batch the yen covers at gate g (100 and 50 need Bulk Summon), else 1
function autoBatch(g) {
  const room = G.bagRoom();
  for (const n of G.has("bulk") ? [100, 50, 10, 1] : [10, 1]) if (n <= room && S().yen >= G.summonCost(g.id, n)) return n;
  return 1;
}
// (31 Oct) what to say when a summon won't fit in the backpack
const bagFull = n => G.bagRoom() ? `Only ${fmt(G.bagRoom())} space${G.bagRoom() === 1 ? "" : "s"} left in your backpack for a x${n} summon. Sell units, or turn on Auto sell so the pulls you don't keep never take a space.`
  : `Your backpack is full (${fmt(S().units.length)} / ${fmt(G.BAG)}). Sell units, or turn on Auto sell so the pulls you don't keep never take a space.`;
function bgSummon() {
  const g = gateNow(), n = AUTO.sum.batch = autoBatch(g);
  const res = G.summon(g.id, n);
  if (res.err) {
    UI.autoSum = false; const c = $("#autoSum"); if (c) c.checked = false;
    toast(res.err === "yen" ? `Auto summon stopped: ${g.name} needs ${fmt(res.need)} ¥.` : res.err === "full" ? "Auto summon stopped. " + bagFull(n) : "Auto summon stopped.", "bad");
    return;
  }
  noteAutoPull(res.units, n);
  const best = AUTO.sum.last, r = rankOf(best), p = $('.pill[data-p="sum"]:not(.leaving)');
  if (p) {
    const orb = $(".orb", p);
    orb.className = "orb mini o-" + r; FX.pop(orb, 0.9);
    const c = FX.center(orb);
    const shw = shinyWorth(best);
    FX.burst(c.x, c.y, { colors: shw ? PEARL : RANK_COLORS(r), n: 6 + r * 6, speed: 200 + r * 50, shape: r >= 3 || shw ? "star" : "spark", gravity: 200 });
    if (r >= 4 || shw) FX.ring(c.x, c.y, { c: shw ? "#e8f8ff" : AF.RARITIES[r].color, rainbow: r === 4 && !shw, r: 90 });
  }
  if (shinyWorth(best) || (r >= 5 && r < S().opts.sumStop)) {
    sfx("chime", { i: 9 });
    toast(`Auto summon: ${shinyWorth(best) ? "a shiny " : ""}${AF.RARITIES[r].name}, ${AF.UNIT[best.k].name}!`);
  } else sfx("tick", { i: 4 + r * 3 });
  refresh();
  if (AUTO.sum.n % 50 < n) G.save();
  return res.units;
}
// (29 Oct, request: "for the auto roll, if you get what you want it should still play the animation as if you were on
// the screen"): a background auto reroll that lands the target opens the Lab's reveal over whatever tab is open
// hit: it's the trait auto reroll was aiming for (waits for a click); otherwise it closes itself and auto reroll carries on
async function targetReveal(t, u, prevId, hit = true, twin = null) {
  UI.rollBusy = true;
  const prev = prevId ? AF.TRAIT[prevId] : null;
  const ov = h(`<div class="reveal tgt"><div class="rv-dim"></div>
    <div class="tgt-stage"><div class="tgt-card"></div>
      <div class="sigil"><div class="sg-rays"></div><div class="sg-in"><div class="sg-glyph">?</div><div class="sg-name"></div><div class="sg-mult"></div></div></div></div>
    <div class="rv-foot"><div class="rv-hint">Auto reroll</div></div></div>`);
  $("#layer").appendChild(ov);
  $(".rv-dim", ov).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: "forwards" });
  // the card starts on the old trait (a copy with no uid, so nothing else repaints it mid-reveal)
  const card = cardEl(Object.assign({}, u, { uid: 0, tr: prevId }), { cls: "lg", hero: true, tilt: false });
  $(".tgt-card", ov).appendChild(card);
  const sg = $(".sigil", ov);
  setSigil(prev, "", sg);
  FX.enter($(".tgt-stage", ov));
  try {
    await FX.wait(450);
    FX.squash(sg);
    await playRoll(t, u, AUTO_SPEED, sg, card, 15, twin, false, true);
    patchCard(card, u);
  } finally { UI.rollBusy = false; }
  const hint = $(".rv-hint", ov);
  hint.textContent = hit ? "Click anywhere to continue" : "Auto reroll keeps going"; FX.enter(hint);
  await new Promise(res => {
    const done = () => { ov.removeEventListener("pointerdown", done); UI.skipReveal = null; res(); };
    ov.addEventListener("pointerdown", done); UI.skipReveal = done;
    if (!hit) setTimeout(done, 2400);
  });
  sfx("click");
  ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }).onfinish = () => ov.remove();
}
// one auto reroll away from the Lab: the pill's little plate flickers and lands like the big one
async function bgRoll(u, quiet = false, n = 0) {
  const res = G.reroll(u.uid, !G.labTwin(n ? 2 : 1));
  if (res.err) return;
  setShow(u, res);
  try { await bgRollShow(u, res, quiet, n); } finally { delete UI.rollShows[u.uid]; }
  patchAllCards(u); refresh(); G.save();
}
async function bgRollShow(u, res, quiet = false, n = 0) {
  const t = res.trait, p = $('.pill[data-p="roll"]:not(.leaving)'), ms = !quiet && p && $(".msig", p);
  // (29 Oct, request: "i only need to know if its what im wanting"): only the target gets the full reveal; every
  // other roll, Eclipse included, just lands in the pill
  if (atTarget(t)) {
    await whenShown(); // (30 Oct) the reveal waits for the tab to come back, then plays once
    await dramaLock(() => targetReveal(t, u, res.prev, true, res.twin));
    histPush(t, res.twin, n);
    return;
  }
  if (ms) {
    for (let i = 0; i < 15; i++) {
      const f = AF.TRAITS[(Math.random() * AF.TRAITS.length) | 0];
      ms.className = "msig tt" + f.tier + xcls(f); $("b", ms).innerHTML = tIcon(f);
      await FX.wait((28 + i * i * 1.9) / AUTO_SPEED);
    }
    ms.className = "msig tt" + t.tier + xcls(t); $("b", ms).innerHTML = tIcon(t);
    FX.pop(ms, 0.9);
    const c = FX.center(ms);
    FX.burst(c.x, c.y, { colors: traitColors(t), n: 6 + t.tier * 8, speed: 200 + t.tier * 50, shape: t.tier >= 2 ? "star" : "spark", gravity: 200 });
    if (t.tier >= 4) FX.ring(c.x, c.y, { c: AF.TRAIT_TIERS[t.tier].color, rainbow: t.tier === 6, r: 100 });
  } else await FX.wait(1600 / AUTO_SPEED);
  if (t.tier >= 1 && !quiet) sfx("pop", { i: t.tier * 3 });
  histPush(t, res.twin, n);
}

// ---------------- settings, welcome ----------------
function openSettings() {
  const o = S().opts;
  const body = h(`<div class="settings">
    <label class="switch"><input type="checkbox" data-o="sound" ${o.sound ? "checked" : ""}><span class="sw"></span><span>Sound</span></label>
    <label class="set-vol"><span>Volume</span><input type="range" class="volr" min="0" max="100" step="1" aria-label="Volume"></label>
    <label class="switch"><input type="checkbox" data-o="reduced" ${o.reduced ? "checked" : ""}><span class="sw"></span><span>Calmer effects (no shake or slow motion)</span></label>
    <label class="switch"><input type="checkbox" data-o="protect" ${o.protect ? "checked" : ""}><span class="sw"></span><span>Ask before replacing Solar or better traits</span></label>
    ${fits3d() ? `<label class="switch"><input type="checkbox" id="sW3d" ${o.world3d !== false ? "checked" : ""}><span class="sw"></span><span>3D world (off: the flat layout, lighter on slow computers)</span></label>` : ""}
    <div class="set-sec"><h3>Save</h3><p class="note">The game saves to this browser every 5 seconds and when you close it. Offline earnings are capped at ${AF.ECON.offlineCapHours} hours.</p>
      <div class="row"><button class="btn ghost sm" id="sExp">Copy save code</button><button class="btn ghost sm" id="sImp">Load a save code</button></div>
      <textarea id="sTxt" rows="3" placeholder="Save code" spellcheck="false"></textarea></div>
    <div class="set-sec"><h3>Start over</h3><p class="note">Deletes your save. This can't be undone.</p><button class="btn danger" id="sReset"><span>Hold to reset</span></button></div>
    <p class="note">Version ${esc((document.querySelector('meta[name="build"]') || {}).content || "dev")}</p>
    <p class="note">${esc(AF.ICON_CREDIT || "")}</p>
    ${AF.SOUND_CREDITS ? `<details class="set-credits"><summary>Unit sound credits</summary><p class="note">Unit attack sounds are cut and mixed from CC0 and public domain recordings, and from these, under CC BY:</p><ul>${AF.SOUND_CREDITS.map(c => `<li>${esc(c)}</li>`).join("")}</ul></details>` : ""}
    <div class="set-stats">${[["Summons", S().stats.summons], ["Rerolls", S().stats.rerolls], ["Level-ups", S().stats.upgrades], ["Collected", fmt(S().stats.collected) + " ¥"]].map(([a, b]) => `<div><span>${a}</span><b>${typeof b === "number" ? fmt(b) : b}</b></div>`).join("")}</div>
  </div>`);
  const close = modal(body, { title: "Settings", cls: "narrow" });
  $$("[data-o]", body).forEach(c => c.onchange = () => { o[c.dataset.o] = c.checked; if (c.dataset.o === "sound") syncSound(); sfx("click"); G.save(); });
  // the world is built once at start, so turning it on or off starts the page again (the save comes along)
  const w3 = $("#sW3d", body);
  if (w3) w3.onchange = () => { o.world3d = w3.checked; G.save(); toast(w3.checked ? "Starting the 3D world..." : "Switching to the flat layout..."); setTimeout(() => location.reload(), 350); };
  wireVolume($(".volr", body));
  $("#sExp", body).onclick = async () => {
    const code = G.exportSave(); $("#sTxt", body).value = code;
    try { await navigator.clipboard.writeText(code); toast("Save code copied."); } catch (e) { $("#sTxt", body).select(); toast("Save code is in the box. Copy it from there."); }
  };
  $("#sImp", body).onclick = () => {
    if (G.importSave($("#sTxt", body).value)) { toast("Save loaded."); close(); boot(true); }
    else { FX.nope($("#sTxt", body)); sfx("error"); toast("That save code didn't work. Paste the whole code.", "bad"); }
  };
  holdButton($("#sReset", body), 1500, () => { G.reset(); close(); toast("Fresh start."); boot(true); });
}
function welcomeBack() {
  const off = G.offline; if (!off) return;
  G.offline = null;
  const body = h(`<div class="welcome"><p>While you were away for <b>${AF.fmtTime(off.secs)}</b>, your Area earned</p>
    <div class="wb-n">${COIN}<span id="wbN">0</span></div><p class="note">It's waiting in your Collect button.</p><button class="btn big gold" id="wbOk">Nice</button></div>`);
  const close = modal(body, { title: "Welcome back", cls: "narrow" });
  FX.count($("#wbN", body), 0, off.gained, 1.4);
  setTimeout(() => sfx("collect", { size: 3 }), 200);
  $("#wbOk", body).onclick = () => { close(); go("area"); };
}
function firstRun() {
  const body = h(`<div class="welcome"><p>Your whole crew is ready: ten animals, ten ways to fight, all equally strong.</p>
    <ol class="steps"><li><b>Defend</b> in Defense to earn &yen;.</li><li><b>Summon</b> rare skins from the gates: new looks, attack effects and sounds, never more power.</li><li><b>Reroll traits</b> for range, attack and cooldown.</li></ol>
    <button class="btn big gold" id="wbOk">Let's go</button></div>`);
  const close = modal(body, { title: "Welcome to Picnic Patrol", cls: "narrow" });
  $("#wbOk", body).onclick = () => { sfx("click"); close(); };
}

// ---------------- refresh and loop ----------------
// (29 Oct, request: "start on build order step 1"): the Defense tab lives in defense.js, board.js and td.js
const PAGES = { area: pageArea, summon: pageSummon, units: pageUnits, traits: pageTraits, ascend: pageAscend, journal: pageJournal,
  defense: () => AF.pageDefense(), evolve: pageEvolve, relics: pageRelics };
// ---------------- the Underworld: Evolution (30 Oct) ----------------
const UW = { step: null, uid: null, typing: null };
const KEEPER = "The Keeper";
const RAR_SOUL = r => AF.RAR[r].name;
// a line typed out in the dialogue box; a click on the box finishes it
function keeperSays(text, choices = []) {
  const box = $("#uwTalk"); if (!box) return;
  const p = $(".uw-line", box), ch = $(".uw-ch", box);
  ch.innerHTML = ""; if (UW.typing) clearInterval(UW.typing);
  let i = 0; p.textContent = "";
  box.classList.add("typing");
  const done = () => {
    clearInterval(UW.typing); UW.typing = null; p.textContent = text; box.classList.remove("typing");
    ch.innerHTML = choices.map((c, k) => `<button class="btn ${c.cls || "ghost"}" data-k="${k}">${c.label}</button>`).join("");
    $$("button", ch).forEach(b => b.onclick = e => { e.stopPropagation(); sfx("click"); choices[+b.dataset.k].go(); });
  };
  box.onclick = () => { if (UW.typing) done(); };
  UW.typing = setInterval(() => { i += 2; p.textContent = text.slice(0, i); if (i % 8 === 0) sfx("tick", { i: 2 }); if (i >= text.length) done(); }, 28);
}
function pageEvolve() {
  const p = $("#p-evolve");
  if (!G.evoOpen()) { p.innerHTML = `<div class="uw-panel"><h1>The Underworld</h1><p class="lede">Rebirth once to find the way down.</p></div>`; return; }
  p.innerHTML = `<div class="uw-panel"><span class="uw-k">The Underworld</span><h1>Evolution</h1><div id="uwBody"></div></div>
    <div class="uw-talk" id="uwTalk"><div class="uw-port"><canvas></canvas></div>
      <div class="uw-box"><i class="uw-bg"></i><i class="uw-cn tl"></i><i class="uw-cn tr"></i><i class="uw-cn bl"></i><i class="uw-cn br"></i>
        <div class="uw-who"><b>${KEEPER}</b></div><p class="uw-line"></p><div class="uw-ch"></div><i class="uw-next"></i></div></div>`;
  AF.R3.view($(".uw-port canvas", p), "@keeper-bust", { hero: true, fx: true });
  if (!G.evoBox().pact) uwGreet(); else { uwPick(); if (S().stats.evolved > 0 && !G.evoBox().gift) setTimeout(uwGift, 1200); }
}
function uwGreet() {
  UW.step = "greet"; if (W3D && HUB.evoUnit) HUB.evoUnit(null);
  $("#uwBody").innerHTML = `<p class="lede">Something waits on the throne at the bottom of the lake. It remakes what you bring it, for a price.</p>`;
  keeperSays("So. Something from the surface climbs all the way down. Everything up there can be made into more, and I can make it so. Nothing down here is free. Hear the terms, or go back up.", [
    { label: "Accept the terms", cls: "uw-yes", go: () => { G.evoBox().pact = true; G.save(); sfx("unlock"); uwPick(true); } },
    { label: "Leave", go: () => go("area") },
  ]);
}
function uwPick(fresh) {
  UW.step = "pick";
  if (W3D && HUB.evoOffer) HUB.evoOffer([]);
  const mine = k => S().units.filter(u => u.k === k).sort((a, b) => (b.ev || 0) - (a.ev || 0) || G.stars(b) - G.stars(a) || G.income(b) - G.income(a))[0];
  const keys = Object.keys(AF.EVO_REQ);
  const body = $("#uwBody");
  const NUM = ["Nothing", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  body.innerHTML = `<p class="lede">${NUM[keys.length] || keys.length} can be remade. Pick one of yours to hear the price.</p><div class="uw-grid"></div>`;
  const grid = $(".uw-grid", body);
  keys.forEach(k => {
    const u = mine(k), w = h(`<div class="uw-c"></div>`);
    if (u) {
      w.appendChild(cardEl(u, { cls: "sm", click: () => { sfx("click"); uwTerms(u); } }));
    } else {
      w.appendChild(cardEl({ k, lv: 1, eq: -1 }, { index: true, ghost: true, cls: "sm" }));
      w.insertAdjacentHTML("beforeend", `<span class="uw-st no">${esc(AF.UNIT[k].name.split(",")[0])}: not yours yet</span>`);
    }
    grid.appendChild(w);
  });
  const sel = UW.uid && G.unit(UW.uid);
  if (W3D && HUB.evoUnit) HUB.evoUnit(sel || null);
  if (!keys.some(k => mine(k))) keeperSays("You own nothing I care to remake. Bring me one of these, then come back down.");
  else keeperSays(fresh ? "Good. Show me which of yours hungers for more." : "Which one?");
}
function uwTerms(u) {
  UW.step = "terms"; UW.uid = u.uid;
  if (W3D && HUB.evoUnit) HUB.evoUnit(u);
  const name = AF.nameOf(u).split(",")[0], body = $("#uwBody");
  // (1 Nov) an evolved unit with a star pact goes to its stars
  if (u.ev && AF.STAR_PACT && AF.STAR_PACT[u.k]) { uwStars(u); return; }
  if (u.ev) {
    body.innerHTML = `<div class="uw-sel"></div><button class="btn ghost" id="uwBack">Choose another</button>`;
    $(".uw-sel", body).appendChild(cardEl(u, { cls: "sm" }));
    $("#uwBack").onclick = () => { sfx("click"); uwPick(); };
    keeperSays(`${name} has already paid. It will not be remade twice.`);
    return;
  }
  const R = AF.EVO_REQ[u.k], reqs = G.evoReqs(u), all = reqs.every(r => r.ok), into = AF.EVO[u.k];
  // (31 Oct) every copy of this unit that can still be remade, for "Choose a copy"
  const copies = S().units.filter(x => x.k === u.k && !x.ev);
  const row = (r, txt, have) => `<li class="${r.ok ? "ok" : ""}">${r.ok ? I.check : I.x}<span>${txt}</span>${have ? `<em>${have}</em>` : ""}</li>`;
  body.innerHTML = `<div class="uw-sel"><div class="uw-from"></div><span class="uw-arrow">${I.uw}</span><div class="uw-to"></div></div>
    <h3>The price</h3>
    <ul class="uw-reqs">
      ${R.stars > 1 ? row(reqs[0], `${name} at ${R.stars} stars`, `${reqs[0].have} / ${R.stars}`) : ""}
      ${row(reqs[1], `${R.offer[1]} ${RAR_SOUL(R.offer[0])} units given up`, `${reqs[1].have} / ${R.offer[1]}`)}
      <li class="uw-give">${Array.from({ length: R.offer[1] }, (_, i) => `<div class="uw-gv" data-i="${i}">${reqs[1].take[i] ? "" : `<span>${RAR_SOUL(R.offer[0])}</span>`}</div>`).join("")}</li>
      ${row(reqs[2], `${fmt(R.shards)} Aura Shards`, `${fmt(S().shards)}`)}
      ${row(reqs[3], esc(reqDo(R.deed)), "")}
      ${reqs.filter(r => r.k === "mat").map(r => row(r, `${AF.matArt && AF.matArt.still(r.id) ? `<img class="uw-mat" src="${AF.matArt.still(r.id)}" alt="">` : ""}${r.need} ${AF.MAT[r.id].name}${r.need > 1 ? "s" : ""} from the Merchant`, `${r.have} / ${r.need}`)).join("")}
    </ul>
    <p class="note">Your weakest ${RAR_SOUL(R.offer[0])} units go first. Locked, placed, shiny, Defense team and Lab units, and anything with Solar or better, are never taken.</p>
    <div class="row"><button class="btn big uw-seal" id="uwSeal" ${all ? "" : "disabled"}><span>${all ? "Hold to seal the pact" : "Not everything is here"}</span></button>
      ${AF.STAR_PACT && AF.STAR_PACT[u.k] ? `<button class="btn ghost" id="uwStars">His stars</button>` : ""}
      <button class="btn ghost" id="uwBack">Choose another</button></div>`;
  $(".uw-from", body).appendChild(cardEl(u, { cls: "sm" }));
  $(".uw-to", body).appendChild(cardEl(Object.assign({}, u, { uid: 0, ev: 1 }), { cls: "sm" }));
  // (30 Oct) the units that would be given up, as cards and standing behind the altar
  reqs[1].take.forEach((o, i) => { const s = $(`.uw-gv[data-i="${i}"]`, body); if (s) s.appendChild(cardEl(o, { cls: "sm" })); });
  if (W3D && HUB.evoOffer) HUB.evoOffer(reqs[1].take);
  $("#uwBack").onclick = () => { sfx("click"); uwPick(); };
  if ($("#uwStars")) $("#uwStars").onclick = () => { sfx("click"); uwStars(u); };
  // (31 Oct) hover the card being remade to swap in another copy of it
  if (copies.length > 1) {
    const from = $(".uw-from", body);
    from.classList.add("swap");
    from.insertAdjacentHTML("beforeend", `<button class="uw-swap" title="Use another ${esc(name)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>`);
    $(".uw-swap", from).onclick = () => { sfx("click"); pickUnit(`Which ${name}?`, x => uwTerms(x), { exclude: x => x.k !== u.k || !!x.ev }); };
  }
  if (all) holdButton($("#uwSeal"), 2200, () => uwSeal(u)); else $("#uwSeal").classList.add("off");
  const n = R.offer[1];
  keeperSays(all ? `${name}. Everything is here. Seal it, and ${name} becomes ${into.name.split(",").slice(1).join(",").trim() || into.name}.`
    : `${name}. I can remake it.${R.stars > 1 ? ` Bring it to ${R.stars} stars.` : ""} Give up ${n} of your ${RAR_SOUL(R.offer[0])}s. ${fmt(R.shards)} Aura Shards. And prove you're worth it: ${reqDo(R.deed).replace(/^./, c => c.toLowerCase())}.${R.mats ? ` Then bring me ${Object.entries(R.mats).map(([id, k]) => `${k} ${AF.MAT[id].name}${k > 1 ? "s" : ""}`).join(" and ")} from the Merchant.` : ""}`);
}
async function uwSeal(u) {
  if (UI.busy) return;
  const r = G.evolve(u.uid);
  if (!r.ok) { toast("Not everything is here.", "bad"); return; }
  UI.busy = true;
  try {
    $("#p-evolve").classList.add("uw-busy");
    sfx("rise", { dur: 2.4 });
    if (W3D && HUB.evoShow) await HUB.evoShow(() => { HUB.evoUnit(u); sfx("portalBurst", { rank: 9 }); FX.shake(0.9); });
    else { FX.flash("#ff2a3a", 0.6, 0.8); FX.shake(0.9); await FX.wait(600); }
    const RQ = AF.EVO_REQ[u.k] || {};
    banner("EVOLVED", `${AF.EVO[u.k].name}: x${RQ.inc || AF.EVO_INC} income, x${RQ.td || AF.EVO_TD} Defense damage`, "tb6 evo-bn");
    G.save();
  } finally { UI.busy = false; $("#p-evolve").classList.remove("uw-busy"); }
  patchAllCards(u); refresh();
  uwTerms(u);
  keeperSays(`It is done. ${AF.nameOf(u).split(",")[0]} will never be what it was.`);
  setTimeout(uwGift, 3200);
}
// (1 Nov, "there needs to be a way to star up vesh too, through the underworld somehow"): a unit that's never summoned
// can't be fed copies, so the Keeper binds its stars for a price (AF.STAR_PACT, game.js G.starPact)
function uwStars(u) {
  UW.step = "stars"; UW.uid = u.uid;
  if (W3D && HUB.evoUnit) HUB.evoUnit(u);
  const name = AF.nameOf(u).split(",")[0], body = $("#uwBody"), st = G.stars(u), P = G.starPact(u);
  const back = `${u.ev ? "" : `<button class="btn ghost" id="uwEvo">His evolution</button>`}<button class="btn ghost" id="uwBack">Choose another</button>`;
  const wire = () => { $("#uwBack").onclick = () => { sfx("click"); uwPick(); }; if ($("#uwEvo")) $("#uwEvo").onclick = () => { sfx("click"); uwTerms(u); }; };
  if (!P) {
    body.innerHTML = `<div class="uw-sel"></div><div class="row">${back}</div>`;
    $(".uw-sel", body).appendChild(cardEl(u, { cls: "sm" })); wire();
    keeperSays(`${name} carries every star I can bind. There is no more of him to wake.`);
    return;
  }
  const reqs = G.starPactReqs(u), all = reqs.every(r => r.ok), [rar, n] = P.offer, mult = AF.STARS.mult[st] / AF.STARS.mult[st - 1];
  const row = (r, txt, have) => `<li class="${r.ok ? "ok" : ""}">${r.ok ? I.check : I.x}<span>${txt}</span>${have ? `<em>${have}</em>` : ""}</li>`;
  body.innerHTML = `<div class="uw-sel"><div class="uw-from"></div><span class="uw-arrow">${I.uw}</span><div class="uw-to"></div></div>
    <h3>Star ${st + 1} of ${AF.STARS.max}</h3>
    <ul class="uw-reqs">
      ${row(reqs[0], `${n} ${RAR_SOUL(rar)} units given up`, `${reqs[0].have} / ${n}`)}
      <li class="uw-give">${Array.from({ length: n }, (_, i) => `<div class="uw-gv" data-i="${i}">${reqs[0].take[i] ? "" : `<span>${RAR_SOUL(rar)}</span>`}</div>`).join("")}</li>
      ${row(reqs[1], `${fmt(P.shards)} Aura Shards`, `${fmt(S().shards)}`)}
      ${reqs.filter(r => r.k === "mat").map(r => row(r, `${AF.matArt && AF.matArt.still(r.id) ? `<img class="uw-mat" src="${AF.matArt.still(r.id)}" alt="">` : ""}${r.need} ${AF.MAT[r.id].name}${r.need > 1 ? "s" : ""} from the Merchant`, `${r.have} / ${r.need}`)).join("")}
    </ul>
    <p class="note">The star raises his income x${+mult.toFixed(2)} and his level cap to ${G.capAt(st + 1)}. Your weakest ${RAR_SOUL(rar)} units go first; locked, placed, shiny, Defense team and Lab units, and anything with Solar or better, are never taken.</p>
    <div class="row"><button class="btn big uw-seal" id="uwBind" ${all ? "" : "disabled"}><span>${all ? "Hold to bind the star" : "Not everything is here"}</span></button>${back}</div>`;
  $(".uw-from", body).appendChild(cardEl(u, { cls: "sm" }));
  $(".uw-to", body).appendChild(cardEl(Object.assign({}, u, { uid: 0, st: st + 1 }), { cls: "sm" }));
  reqs[0].take.forEach((o, i) => { const s = $(`.uw-gv[data-i="${i}"]`, body); if (s) s.appendChild(cardEl(o, { cls: "sm" })); });
  if (W3D && HUB.evoOffer) HUB.evoOffer(reqs[0].take);
  wire();
  if (all) holdButton($("#uwBind"), 1800, () => uwBind(u)); else $("#uwBind").classList.add("off");
  keeperSays(all ? `Everything is here. Hold, and I bind another star into ${name}.`
    : `${name} was never born, so nothing of him can be fed to him. I can bind a star into him instead. Give up ${n} of your ${RAR_SOUL(rar)}s, ${fmt(P.shards)} Aura Shards, and bring me ${Object.entries(P.mats || {}).map(([id, k]) => `${k} ${AF.MAT[id].name}${k > 1 ? "s" : ""}`).join(" and ")} from the Merchant.`);
}
async function uwBind(u) {
  if (UI.busy) return;
  const r = G.starPactSeal(u.uid);
  if (!r.ok) { toast("Not everything is here.", "bad"); return; }
  sfx("unlock"); FX.flash("#ffd76a", 0.35, 0.5); FX.shake(0.5);
  const c = { x: innerWidth / 2, y: innerHeight / 2 };
  FX.burst(c.x, c.y, { colors: ["#ffd76a", "#ff2a3a", "#ffffff"], n: 120, shape: "star", speed: 900, gravity: 120, life: 1.6 });
  banner("STAR BOUND", `${AF.nameOf(u).split(",")[0]}: ${G.stars(u)} stars`, "tb6 evo-bn");
  G.save(); patchAllCards(u); refresh();
  uwStars(u);
}
// (30 Oct) the Keeper gives Vesh after the first evolution (or on the next visit to a save that already did one)
function uwGift() {
  if (UI.tab !== "evolve") return;
  const g = G.evoGift(); if (!g) return;
  G.save(); refresh();
  banner("ABSOLUTE", "The Keeper gives you Vesh, the Chained", "tb6");
  keeperSays("You paid well. Take him too. Vesh has been chained at the bottom of my lake longer than your world has stood. He is nothing now. Bring him back to me when you're ready, and I'll show you what he was.", [
    { label: "Show me", cls: "uw-yes", go: () => uwTerms(g) },
  ]);
  if (W3D && HUB.evoUnit) HUB.evoUnit(g);
}
let gatesOpen = "";
function syncSlotBtn() {
  if (W3D) return syncPlotHud();
  // (28 Oct, request: "make it noticeable. it stays gray even when u have enough"): follow the balance, not the last redraw
  const b = $("#bSlot"); if (!b) return;
  const c = G.slotCost(), ok = c !== undefined && S().yen >= c, slot = b.closest(".slot");
  b.classList.toggle("off", !ok); b.classList.toggle("gold", ok);
  if (ok && !slot.classList.contains("ready")) { FX.pop(slot, 0.6); $(".sl-t", slot).textContent = "Ready to unlock"; }
  if (!ok && slot.classList.contains("ready")) $(".sl-t", slot).textContent = "Slot " + (S().slots + 1);
  slot.classList.toggle("ready", ok);
}
function refresh() {
  const uwb = $(".tab-uw"); if (uwb && uwb.hidden === G.evoOpen()) { uwb.hidden = !G.evoOpen(); placeInd(); }
  if (W3D && HUB.storeOpen) HUB.storeOpen(G.storeOpen());
  if (UI.tab === "area") { renderSlots(); syncSlotBtn(); }
  else if (W3D) renderPlots(); // the plots stand in the world whichever tab is open (a unit placed from its window)
  if (UI.tab === "summon") syncSumBtns();
  if (UI.tab === "traits") syncRoll();
  const open = AF.GATES.filter(G.gateOpen).map(g => g.id).join();
  if (gatesOpen && open !== gatesOpen) {
    const g = AF.GATES.filter(G.gateOpen).pop();
    toast(`${g.name} is open. Try it on the Summon tab.`); sfx("unlock");
    if (UI.tab !== "summon") $("#dot-summon").hidden = false;
    if (UI.tab === "summon") renderGates();
  }
  gatesOpen = open;
  // dots: quests to claim, an ascension or a shop upgrade within reach
  const claim = G.claimable();
  $("#dot-journal").hidden = !claim; $("#dot-jr").hidden = !claim;
  const qc = $("#qCnt"); if (qc) { qc.hidden = !claim; qc.textContent = claim; }
  const shopReady = AF.UPGRADES.some(d => G.upLv(d.id) < d.max && !G.upLocked(d) && S().shards >= G.shopCost(d.id));
  
  if (UI.tab === "ascend" && !UI.busy && !(UI.holding && UI.holding.isConnected)) {
    const sig = G.canAscend() + "|" + G.ascendShards() + "|" + G.canRebirth();
    if (sig !== ascSig) pageAscend();
  }
}
function hud(dt) {
  const target = Math.max(0, S().yen - UI.hold);
  UI.disp += (target - UI.disp) * Math.min(1, dt * 9);
  if (Math.abs(target - UI.disp) < 0.01) UI.disp = target;
  $("#balN").textContent = fmt(UI.disp);
  const rate = G.rate();
  $("#rateN").textContent = "+" + fmt(rate);
  $("#shardN").textContent = fmt(S().shards);
  const stl = $("#stlChip"), showStl = !!(S().reb || S().starlight);
  if (stl.hidden === showStl) stl.hidden = !showStl;
  if (showStl) $("#stlN").textContent = fmt(S().starlight);
  const sl = (G.surge.until - Date.now()) / 1000, sc = $("#surgeChip");
  if (sc.hidden !== !(sl > 0)) { sc.hidden = !(sl > 0); if (sl > 0) FX.pop(sc, 0.8); }
  if (sl > 0) { $("b", sc).innerHTML = "&times;" + G.surge.mult; $("#surgeT").textContent = Math.ceil(sl) + "s"; }
  if (UI.tab === "area") {
    $("#pendN").textContent = fmt(S().pending);
    $("#pendR").textContent = "+" + fmt(rate) + "/s";
    $("#aRate").textContent = W3D ? fmt(rate) : fmt(rate) + " ¥/s";
    if (!W3D) $("#aSlots").textContent = `${G.slotsView().filter(Boolean).length}/${S().slots}`;
    const b = $("#bCollect");
    const ready = S().pending >= 1;
    b.classList.toggle("ready", ready);
    b.style.setProperty("--heat", Math.min(1, S().pending / Math.max(1, S().yen + S().pending)).toFixed(3));
  }
}
let last = performance.now(), gameT = 0, secAcc = 0, saveAcc = 0, uiAcc = 0, secN = 0, autoC = 0, autoL = 0;
function loop(now) {
  // never below 0: a frame's timestamp can be a hair older than the last one we kept
  const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;
  G.tick(dt);
  gameT += dt * AF.time.scale;
  FX.frame(dt);
  stepTilts(dt);
  R3.frame(gameT);
  hud(dt);
  if (!W3D) drawPortal(gameT, dt); // in 3D the gate in the world paints it
  secAcc += dt; if (secAcc >= 1) { secAcc -= 1; incomeTick(secN++); }
  uiAcc += dt; if (uiAcc >= 0.5) { uiAcc = 0; refresh(); }
  // bought automation
  if (G.has("autoCollect") && S().opts.autoCollect) {
    autoC += dt;
    if (autoC >= 10) { autoC = 0; if (S().pending >= 0.01) { if (UI.tab === "area" && !UI.busy && !UI.sumBusy && !UI.modalClose) collect(); else G.collect(); } }
  }
  if (G.has("autoLevel") && S().opts.autoLevel) {
    autoL += dt;
    // (29 Oct, request: "the auto upgrade should upgrade like 3x faster too, same 25% cap"): a level every 0.5 s
    // (1 Nov) Quick Hands: 20% faster a level, up to 4x
    if (autoL >= 0.5 / (1 + 0.2 * G.upLv("quickHands"))) { autoL = 0; const u = G.autoLevel(); if (u) patchAllCards(u); }
  }
  surgeStep(dt);
  // (29 Oct, request: "the whole defense thing should run in the background, with a pill"): off its tab a match
  // keeps going at half speed as numbers only; defense.js shows a pill for it
  if (UI.tab === "defense" && AF.Board) AF.Board.frame(dt);
  else if (AF.Defense && AF.Defense.match) AF.Defense.background(dt);
  saveAcc += dt; if (saveAcc >= 5) { saveAcc = 0; G.save(); }
  // the world, unless a Defense match has the screen (sync3d)
  if (W3D && document.body.classList.contains("w3d") && !document.body.classList.contains("w3m")) { navStep(dt); HUB.step(now); yps3D(dt); tdl3D(); }
  requestAnimationFrame(loop);
}

// ---------------- Aura Surge ----------------
// (29 Oct, request: "add some more stuff in general, like around everywhere"): every few minutes a glowing orb drifts
// onto the screen, on any tab; catch it for x2 income for a minute. It waits while a reveal or a window is open.
const SURGE = { every: [150, 300], life: 14, secs: 60 };
let surgeIn = 60 + Math.random() * 60, surgeEl = null;
function surgeStep(dt) {
  if (surgeEl) return;
  surgeIn -= dt;
  if (surgeIn > 0) return;
  if ($(".reveal") || UI.modalClose || UI.busy) { surgeIn = 8; return; }
  surgeIn = SURGE.every[0] + Math.random() * (SURGE.every[1] - SURGE.every[0]);
  const x = innerWidth * (0.18 + Math.random() * 0.64), y = innerHeight * (0.3 + Math.random() * 0.45);
  const el = surgeEl = h(`<button class="surge" style="left:${x}px;top:${y}px" aria-label="Catch the Aura Surge"><i class="sg-core"></i><span>Surge</span></button>`);
  document.body.appendChild(el);
  sfx("tick", { i: 18 });
  const gone = setTimeout(() => { el.classList.add("leaving"); setTimeout(() => { el.remove(); if (surgeEl === el) surgeEl = null; }, 500); }, SURGE.life * 1000);
  el.onclick = () => {
    clearTimeout(gone);
    G.catchSurge(SURGE.secs);
    const c = FX.center(el);
    sfx("unlock"); sfx("collect", { size: 2 });
    FX.burst(c.x, c.y, { colors: ["#7dffcf", "#ffffff", "#ffd76a", "#c9a8ff"], n: 70, shape: "star", speed: 640, gravity: 200 });
    FX.ring(c.x, c.y, { c: "#7dffcf", r: 220, w: 10 });
    toast(`Aura Surge: x${G.surge.mult} income for ${SURGE.secs} seconds.`);
    el.remove(); surgeEl = null;
    if (UI.tab === "area") { slotSig = ""; renderSlots(); }
    refresh(); G.save();
  };
}

// ---------------- keys ----------------
addEventListener("keydown", e => {
  if (e.target.matches("input, textarea, select")) return;
  if (e.key === "Escape" && UI.modalClose) { UI.modalClose(); return; }
  // a Defense match takes 1-6, Esc, U, N, S and P for itself while its tab is open
  if (UI.tab === "defense" && !UI.modalClose && AF.Defense && AF.Defense.key(e)) { e.preventDefault(); return; }
  if (e.code === "Space") {
    e.preventDefault();
    if (UI.skipReveal) { UI.skipReveal(); return; }
    if (UI.continue) { UI.continue(); return; }
    if (UI.modalClose || UI.busy) return;
    collectAnywhere(); // (28 Oct, request: "make the spacebar collect money from any page")
    return;
  }
  if (e.key === "Enter" && UI.tab === "summon" && !UI.modalClose && !UI.sumBusy && !UI.skipReveal) { e.preventDefault(); summon(UI.lastN); return; }
  if (UI.modalClose || UI.busy) return;
  if (/^[1-7]$/.test(e.key)) { sfx("tab"); go(TABS[+e.key - 1][0]); }
  if ((e.key === "r" || e.key === "R") && UI.tab === "traits") rollClick();
});
// any button press gets a little squash and a click
document.addEventListener("pointerdown", e => {
  const b = e.target.closest(".btn, .iconbtn, .seg button, .chips button, .pager button");
  if (b && !b.classList.contains("off")) FX.squash(b);
});
// (29 Oct): the game loop runs on animation frames, which stop while the tab is hidden; that time used to earn nothing.
// It now lands in "Ready to collect", like offline time, at the rate you had (no surge).
let hiddenAt = 0;
addEventListener("visibilitychange", () => {
  if (document.hidden) { hiddenAt = Date.now(); G.save(); return; }
  if (!hiddenAt) return;
  const secs = Math.min((Date.now() - hiddenAt) / 1000, G.offlineCap()); hiddenAt = 0;
  if (secs < 2) return;
  const gained = (G.rate() / G.boost()) * secs;
  if (gained <= 0) return;
  S().pending += gained;
  if (secs >= 30) toast(`While the tab was hidden: +${fmt(gained)} ¥ ready to collect.`);
});
addEventListener("pagehide", () => G.save());
addEventListener("beforeunload", () => G.save());
// (30 Oct, "add auto save every 10 min")
setInterval(() => G.save(), 10 * 60 * 1000);

// (29 Oct, "hover/click to see all the things it adds"): hovering any trait chip, plate or odds row shows all it does
let perkTip = null;
addEventListener("pointerover", e => {
  const el = e.target.closest && e.target.closest("[data-tid]"), tr = el && AF.TRAIT[el.dataset.tid];
  if (!tr) { if (perkTip) perkTip.hidden = true; return; }
  if (!perkTip) { perkTip = h(`<div class="perktip" role="tooltip"></div>`); document.body.appendChild(perkTip); }
  perkTip.className = "perktip tt" + tr.tier + xcls(tr);
  perkTip.innerHTML = `<b>${esc(tr.name)}</b>${traitPerks(tr).map(([k, v]) => `<div><span>${esc(k)}</span><em>${esc(v)}</em></div>`).join("")}`;
  perkTip.hidden = false;
  const r = el.getBoundingClientRect(), w = perkTip.offsetWidth, ht = perkTip.offsetHeight;
  perkTip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + "px";
  perkTip.style.top = (r.top - ht - 8 < 8 ? r.bottom + 8 : r.top - ht - 8) + "px";
});
addEventListener("scroll", () => { if (perkTip) perkTip.hidden = true; }, true);
// every save notes which automations are on, so a reload or a return starts them again (resumeAutos)
const saveRaw = G.save;
G.save = (...a) => {
  S().opts.autoOn = { sum: !!UI.autoSum, roll: !!UI.autoRoll, n: UI.lastN || 1 };
  const ok = saveRaw(...a);
  // (31 Oct) a save that didn't write says so, once a minute, instead of failing in silence
  if (!ok && Date.now() - (UI.saveWarn || 0) > 60000) {
    UI.saveWarn = Date.now();
    toast(G.saveErr === "full" ? "Progress isn't saving: this site's browser storage is full. Export your save in Settings to keep it." : "Progress couldn't be saved just now. Export your save in Settings to keep it.", "bad");
  }
  return ok;
};
function resumeAutos() {
  const a = S().opts.autoOn; if (!a || (!a.sum && !a.roll)) return;
  UI.lastN = a.n || 1;
  if (a.sum) { UI.autoSum = true; const c = $("#autoSum"); if (c) c.checked = true; autoSummonLoop(); }
  // only one at a time unless Twin Automation is owned (as onlyOneAuto has it); summon wins a tie
  if (a.roll && labPair().length && (!a.sum || G.has("twinAuto"))) { UI.autoRoll = true; const c = $("#autoRoll"); if (c) c.checked = true; autoRoll(); }
  syncPills();
  const on = [UI.autoSum && "auto summon", UI.autoRoll && "auto reroll"].filter(Boolean).join(" and ");
  if (on) toast(on[0].toUpperCase() + on.slice(1) + " picked up where you left off.");
}
// ---------------- the 3D world ----------------
// (29 Oct, Chris: "put it into the main localhost"; phones: "Keep 2D there"; a switch: "Yes, in Settings"): a window at
// least 1100x620 with a mouse plays over the 3D world unless Settings turns it off; anything else, the flat layout
const fits3d = () => matchMedia("(min-width: 1100px) and (min-height: 620px) and (pointer: fine)").matches && !!window.WebGL2RenderingContext;
// the interface was laid out for 1920x1080: it scales with the window (0.75 on a 1440-wide laptop)
function sizeUi() { document.documentElement.style.setProperty("--uiz", Math.max(0.6, Math.min(1.25, innerWidth / 1920, innerHeight / 1080)).toFixed(3)); }
function startWorld() {
  if (S().opts.world3d === false || !fits3d() || typeof AF.initWorld !== "function") return;
  const c = h(`<canvas id="world"></canvas>`);
  document.body.prepend(c); document.body.classList.add("w3d");
  try { HUB = AF.initWorld(c); W3D = true; }
  catch (e) { console.error("Aura Farm: the 3D world didn't start, so the flat layout it is.", e); c.remove(); document.body.classList.remove("w3d"); HUB = null; return; }
  // (29 Oct, "the defense button should be next to area on the right")
  TABS.splice(1, 0, ...TABS.splice(TABS.findIndex(t => t[0] === "defense"), 1));
  sizeUi(); addEventListener("resize", sizeUi);
  // hovering a unit in the world: name, rarity and level, its income in bold gold, then its three Defense numbers on
  // coloured icons (29 Oct, "when you hover over units, it should show the 3 stats for defense"); an empty or locked
  // plot says what a click does
  tip = h(`<div class="w3-tip" hidden></div>`); document.body.appendChild(tip);
  // (29 Oct, "the damage and stuff should update live when you hover over that character"): the card is worked out again
  // every frame and redrawn whenever it changes (a roll landing, a level, a star, a surge), and a number that just
  // changed pops, green when it's better, red when it's worse
  let tipK = null, tipHtml = "";
  HUB.onHover = (f, x, y, pad) => {
    if ((!f && !pad) || UI.modalClose || UI.busy || UI.sumBusy || $(".reveal")) { tip.hidden = true; tipK = null; return; }
    const key = f ? "u" + f.u.uid : pad.pad + pad.slot, html = f ? unitTip(f.u) : padTip(pad);
    if (key !== tipK) {
      tipK = key; tipHtml = html;
      tip.style.setProperty("--rc", f ? AF.RAR[AF.UNIT[f.u.k].rarity].color : "#ffe27a");
      tip.innerHTML = html;
    } else if (html !== tipHtml) {
      const was = {}; $$("[data-k]", tip).forEach(e => (was[e.dataset.k] = +e.dataset.n));
      tipHtml = html; tip.innerHTML = html;
      $$("[data-k]", tip).forEach(e => { const o = was[e.dataset.k], n = +e.dataset.n; if (o !== undefined && Math.abs(n - o) > Math.abs(o) * 1e-6) e.classList.add(n > o ? "up" : "down"); });
    }
    tip.hidden = false;
    // (30 Oct) the card is taller now: kept inside the screen on the right and at the bottom
    tip.style.left = Math.min(innerWidth - tip.offsetWidth - 12, x + 20) + "px"; tip.style.top = Math.max(110, Math.min(innerHeight - tip.offsetHeight - 12, y - 70)) + "px";
  };
  // Clicking the world itself goes home, unless something is open or playing out on top of it.
  HUB.onEmpty = () => {
    if (UI.tab === "area" || UI.modalClose || UI.busy || UI.sumBusy || $(".reveal") || $(".storm")) return;
    sfx("tab");
    go("area");
  };
  HUB.onPick = p => {
    if (UI.modalClose || UI.busy || UI.sumBusy || $(".reveal")) return;
    if (p.world !== undefined) { if (UI.tab === "defense" && AF.Defense) AF.Defense.setWorld(p.world); return; }
    if (p.pad === "area") {
      if (p.fig) return openUnit(p.fig.u, { ctx: "area", slot: p.slot });
      if (p.slot < S().slots) return pickPlot(p.slot);
      if (p.slot === S().slots) return buyPlot($("#bPlot")); // the gold padlock: the next plot
      sfx("error"); toast(AF.ECON.slotAsc[p.slot + 1] && S().asc < AF.ECON.slotAsc[p.slot + 1] ? `Plot ${p.slot + 1} opens once you've ascended ${AF.ECON.slotAsc[p.slot + 1]} times.` : `Unlock plot ${S().slots + 1} first.`, "bad");
      return;
    }
    if (p.pad === "defense") { if (!AF.Defense) return; if (p.fig) openUnit(p.fig.u, { ctx: "defense", slot: p.slot }); else AF.Defense.choose(p.slot); return; }
    if (p.fig && p.fig.u && p.fig.u.uid) { if (UI.tab === "units") showcase3D(p.fig.u); openUnit(p.fig.u); }
  };
  wheelNav();
}
// ---------------- the wheel over the world picks a page ----------------
// (29 Oct, Chris: "add an up and down scroll to switch pages with scroll thats easy to move without overdoing it, shows
// what page you're about to move to, its smooth and 'buttery' ... and it gives you enough time before moving so it
// confirms thats the page you want"; then "you should be able to go from any page to any page, not from one next to the
// other, and thats why i need it to wait a second before confirming"). Only over the 3D world (over a panel the wheel
// scrolls the panel). A page picker opens in the middle: every page in a column that the wheel rolls through, about one
// page per wheel click or short swipe, the tab bar's highlight gliding along. Stop on a page and it settles there; a
// ring round its icon fills for a second while the camera starts drifting toward it, then it goes (the trip carries on
// from the drift). Scroll again and it follows; stop on the page you're on and it fades away. The rest of a scroll that
// started a trip (a trackpad's glide) is ignored until it pauses.
const NAV = { open: false, pos: 0, shown: 0, vis: 0, last: 0, from: null, locked: false, el: null, txt: "", leanTo: null, lean: 0 };
const NAV_STEP = 110, NAV_WAIT = 1000, NAV_SETTLE = 120, NAV_ROW = 128;
const tabIdx = t => TABS.findIndex(x => x[0] === t);
const navReady = () => W3D && document.body.classList.contains("w3d") && !UI.modalClose && !UI.busy && !UI.sumBusy && !$(".reveal");
function wheelNav() {
  // (29 Oct, "the whole scroll thing in the center of the screen should turn into a small pill just below the page header,
  // with the same animation just horizontal, and red"): the pages roll sideways in a red pill under the tab bar; the second
  // before it goes fills it from the left
  NAV.el = h(`<div class="w3-nav" aria-hidden="true"><i class="w3-nav-fill"></i><div class="w3-nav-list">${TABS.map(t => `<div class="w3-nav-it" data-tab="${t[0]}"><i>${t[2]}</i><b>${t[1]}</b></div>`).join("")}</div></div>`);
  document.body.appendChild(NAV.el);
  addEventListener("wheel", e => {
    if (e.target.id !== "world" || e.ctrlKey || !navReady()) return; // ctrl: a trackpad pinch
    e.preventDefault();
    const now = performance.now(), gap = now - NAV.last; NAV.last = now;
    if (NAV.locked) { if (gap < 260) return; NAV.locked = false; }
    if (!NAV.open) { NAV.open = true; NAV.from = UI.tab; NAV.pos = NAV.shown = tabIdx(UI.tab); }
    // a wheel click comes on its own (Safari on a Mac can say 4 for it, Windows 100) and moves about a page; a
    // trackpad's stream moves as it comes
    let d = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 600 : 1);
    if (gap > 35 && d) d = Math.sign(d) * Math.max(NAV_STEP * 0.95, Math.abs(d));
    NAV.pos = Math.max(-0.35, Math.min(TABS.length - 0.65, NAV.pos + Math.max(-150, Math.min(150, d)) / NAV_STEP));
  }, { passive: false });
  addEventListener("keydown", e => { if (e.key === "Escape" && NAV.open) navClose(); });
}
// the tab bar's highlight at a point between two tabs (f: 2.4 = 40% of the way from the third tab to the fourth)
function indAt(f) {
  const ind = $("#tabInd"), tabs = $$(".tab"); if (!ind || !tabs.length) return;
  const i = Math.max(0, Math.min(tabs.length - 1, Math.floor(f))), j = Math.min(tabs.length - 1, i + 1), q = Math.max(0, Math.min(1, f - i));
  ind.style.transition = "none";
  ind.style.left = tabs[i].offsetLeft + (tabs[j].offsetLeft - tabs[i].offsetLeft) * q + "px";
  ind.style.width = tabs[i].offsetWidth + (tabs[j].offsetWidth - tabs[i].offsetWidth) * q + "px";
}
function navClose() {
  if (!NAV.open) return;
  NAV.open = false; // the camera's drift eases back by itself (navStep)
  $("#tabs").classList.remove("picking");
  const ind = $("#tabInd"); if (ind) ind.style.transition = "";
  $$(".tab.peek").forEach(b => b.classList.remove("peek"));
  placeInd(); // the highlight slides back to the page you're on
}
// the camera's drift toward the chosen page, smoothed both ways (29 Oct, "when you scroll on one back to the one youre
// on the camera snaps back"): a change of mind eases it back before it leans toward anything else
function navLean(to, k, dt) {
  if (NAV.leanTo !== to && NAV.lean > 0.002) k = 0; else NAV.leanTo = to;
  NAV.lean += (k - NAV.lean) * Math.min(1, dt * (k > NAV.lean ? 10 : 6));
  if (NAV.lean < 0.002 && !k) NAV.lean = 0;
  HUB.peek(NAV.leanTo, NAV.lean);
}
function navStep(dt) {
  if (!NAV.el) return;
  const now = performance.now(), idle = now - NAV.last, n = TABS.length;
  if (NAV.open && (!navReady() || UI.tab !== NAV.from)) navClose(); // a window opened, or a tab was clicked
  if (NAV.open) {
    const sel = Math.max(0, Math.min(n - 1, Math.round(NAV.pos))), cur = tabIdx(UI.tab);
    if (idle > NAV_SETTLE) NAV.pos += (sel - NAV.pos) * Math.min(1, dt * 10); // stopped: it settles on the nearest page
    NAV.shown += (NAV.pos - NAV.shown) * Math.min(1, dt * 16);
    const c = sel === cur ? 0 : Math.max(0, Math.min(1, (idle - NAV_SETTLE) / (NAV_WAIT - NAV_SETTLE)));
    if (sel === cur && idle > 650) navClose();
    else if (c >= 1) {
      // go: the trip starts from the drift (go() hands it to the world), the highlight slides the last bit itself
      NAV.open = false; NAV.locked = idle < 260; NAV.lean = 0; // go() takes the drift over as the start of the trip
      $("#tabs").classList.remove("picking");
      const ind = $("#tabInd"); if (ind) ind.style.transition = "";
      $$(".tab.peek").forEach(b => b.classList.remove("peek"));
      sfx("tab"); go(TABS[sel][0]);
    } else {
      navLean(sel === cur ? null : TABS[sel][0], c * c * (3 - 2 * c), dt);
      indAt(NAV.shown);
      // (29 Oct, "when you scroll to another page the text on the page youre on gets removed"): its label is dark for the
      // red highlight, which has slid away; while picking, the dark label goes to the tab the highlight is on
      $("#tabs").classList.add("picking");
      $$(".tab").forEach((b, i) => b.classList.toggle("peek", i === sel));
      NAV.el.style.setProperty("--c", c.toFixed(3));
    }
  }
  if (!NAV.open && NAV.lean) navLean(NAV.leanTo, 0, dt); // closed without going: the drift eases back
  // the picker fades in and out; its pages roll with the wheel, the one in the middle large, the rest fading off
  NAV.vis += ((NAV.open ? 1 : 0) - NAV.vis) * Math.min(1, dt * (NAV.open ? 14 : 9));
  if (NAV.vis < 0.005) { if (NAV.el.style.opacity !== "0") NAV.el.style.opacity = "0"; return; }
  const z = +getComputedStyle(document.documentElement).getPropertyValue("--uiz") || 1, tb = $("#tabs").getBoundingClientRect();
  NAV.el.style.left = (tb.left + tb.width / 2).toFixed(1) + "px"; NAV.el.style.top = (tb.bottom + 10 * z).toFixed(1) + "px";
  NAV.el.style.opacity = NAV.vis.toFixed(3);
  NAV.el.style.scale = ((0.9 + 0.1 * NAV.vis) * z).toFixed(3);
  $$(".w3-nav-it", NAV.el).forEach((it, i) => {
    const o = i - NAV.shown, a = Math.min(1, Math.abs(o));
    it.style.transform = `translateX(${(o * NAV_ROW).toFixed(1)}px) scale(${(1 - a * 0.18).toFixed(3)})`;
    it.style.opacity = Math.max(0, 1 - Math.abs(o) / 1.7).toFixed(3);
    it.classList.toggle("on", Math.abs(o) < 0.5);
  });
}
// a unit as the world shows it: while its roll is still spinning, with the trait it had (UI.rollShow), so nothing
// gives the roll away before the plate lands
function shownUnit(u) { const s = u && UI.rollShows[u.uid]; return s ? Object.assign({}, u, { tr: s.tr, dbl: s.dbl }) : u; }
function unitTip(u) {
  u = shownUnit(u); // a roll still spinning
  const d = AF.UNIT[u.k], s = AF.TD.statsOf(u), tg = AF.Defense && AF.Defense.tags;
  const pay = s.farm ? AF.TD.farmPay(null, { s }, 0) : 0, inc = G.income(u);
  // data-n: what each number measures, bigger is better (so SPA, seconds per attack, goes in negative)
  // (30 Oct, "the cost should be more important, like the cost to place in the hover ui"): a row of its own, in Defense's
  // cash green, for fighters and farms alike
  const cost = tg ? `<div class="ht-row ht-cost" style="--sc:#3fd07f" data-k="cost" data-n="${-s.cost}"><i>${STAT_IC.cost}</i><b>$${tg.num(s.cost)}<small>to place</small></b></div>` : "";
  const st = !tg ? "" : s.farm ? statRow("pay", "$" + tg.num(pay) + "<small>/wave</small>", "#ffc83a", pay) + cost
    : statRow("atk", tg.num(s.atk), "#ff4a5a", s.atk) + statRow("spa", tg.sec(s.spa), "#3fd7ff", -s.spa) + statRow("rng", s.rng.toFixed(1), "#ffc83a", s.rng) + cost;
  // (30 Oct, "this hover should be showing more information, like the hover ingame when you hover on a card"): what
  // the match's team-bar card says too (defense.js slotCard)
  const tr = AF.traitOf(u), A = AF.TD.attackOfU(u), stars = u.st || 1;
  const tags = `${chipHTML(tr)}${u.sh ? `<span class="ht-sh">Shiny</span>` : ""}`;
  const more = !tg ? "" : `<div class="ht-atk"><b>${esc(s.name || AF.TD.STYLES[s.style].name)}</b><span>${tg.styleTag(s.style, s.kind)}${tg.reachTag(s.reach)}</span></div>
    <p class="ht-info">${esc(s.kind ? AF.TD.KIND_INFO[s.kind] : "")}</p>
    <div class="ht-dps">${s.farm ? `Fully upgraded it pays <b>$${tg.num(AF.TD.farmPay(null, { s }, AF.TD.UP.max))}</b> a wave`
      : `<b>${tg.num(AF.TD.dps(s))}</b> damage a second`}</div>
    ${(c => (c.length ? `<ul class="ht-c">${c.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""))(tg.condLines(s.cfg))}
    ${A && A.sig ? `<div class="td-hc-sig"><b>${esc(A.sig.name)}</b><span>Signature move, every ${A.sig.every === 3 ? "third" : "fourth"} attack: half again the damage.</span></div>` : tg.relLines ? tg.relLines(d.key, u) : ""}`;
  return `<div class="ht-h"><b>${esc(AF.nameOf(u).split(",")[0])}</b><small>${AF.speciesOf(d)} &middot; ${AF.RAR[d.rarity].name}</small>${tags ? `<div class="ht-tags">${tags}</div>` : ""}</div>
    <div class="ht-inc" data-k="inc" data-n="${inc}">${COIN}<b>${fmt(inc)}</b><small>/s</small></div>${st}${more}`;
}
function padTip(p) {
  const i = p.slot, n = S().slots, asc = AF.ECON.slotAsc[i + 1];
  if (p.pad === "defense") return `<div class="ht-h"><b>Team slot ${i + 1}</b><small>Click to add a unit</small></div>`;
  if (i < n) return `<div class="ht-h"><b>Plot ${i + 1}</b><small>Click to place a unit</small></div>`;
  return `<div class="ht-h"><b>Plot ${i + 1}</b><small>Locked</small></div><p class="ht-lock">${i === n && !G.slotAscNeed() ? `Click to unlock it for <b>${fmt(G.slotCost())} &yen;</b>`
    : asc && S().asc < asc ? `Opens once you've ascended <b>${asc}</b> times` : `Unlock plot ${n + 1} first`}</p>`;
}
function boot(again) {
  if (!again) { G.load(); startWorld(); }
  UI.disp = S().yen; UI.hold = 0; UI.hist = []; UI.hist2 = []; slotSig = "";
  gatesOpen = AF.GATES.filter(G.gateOpen).map(g => g.id).join();
  buildShell();
  go("area");
  if (W3D && AF.Defense) AF.Defense.syncPads(); // a reset or a loaded save changes the team the platforms show
  if (again) return;
  if (G.firstRun) firstRun(); else welcomeBack();
  requestAnimationFrame(loop);
  // after the welcome-back moment, so a pull worth a full reveal doesn't open over it
  setTimeout(resumeAutos, 1500);
}
// what defense.js borrows from here
AF.ui = { h, esc, I, SHARD, STARL, toast, cardEl, pickUnit, confirmBox, banner, modal, refresh, pillsBox, go: t => go(t), hub: () => HUB, sync3d, openUnit };
// what the 3D world borrows: the Summon tab's portal, painted onto the gate's texture
AF.portal = { paint: paintPortal, newPortal, portalRays, PTHEME };
boot();
})();
