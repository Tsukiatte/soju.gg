/* Aura Farm Defense, the page: the lobby (map, difficulty, a team of six) and the match around the board (wave,
   lives, cash, speed, the team bar to place from, the panel for a placed unit, and the result). The rules are td.js,
   the board is board.js; ui.js lends its helpers through AF.ui and calls AF.pageDefense when the tab opens. */
(function () {
const AF = window.AF, G = AF.G, TD = AF.TD, Bd = AF.Board, FX = AF.fx, fmt = AF.fmt, sfx = AF.sfx;
const D = AF.Defense = { match: null };
const S = () => G.S;
const ui = () => AF.ui;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const STYLE_C = { melee: "#ff8a5a", ranged: "#7fd0ff", splash: "#c9a8ff", chain: "#ffe14a", nova: "#9ff2ff", farm: "#ffc83a" };
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.7c0 5.8-7.5 10.4-7.5 10.4z"/></svg>';

// what the save keeps: the team (unit ids), the chosen map and difficulty, and clears per map and difficulty
const td = () => S().td;
const teamUnits = () => td().team.map(id => G.unit(id)).filter(Boolean);
const num = n => (n >= 1000 ? fmt(n) : String(Math.round(n)));
const sec = n => (Math.round(n * 100) / 100).toFixed(2).replace(/0$/, "") + "s";
const styleTag = (st, kind) => `<span class="td-style" style="--sc:${STYLE_C[st]}">${kind ? TD.KIND_NAME[kind] : TD.STYLES[st].name}</span>`;
// what an attack does to what it hits, in words
function condLines(cf) {
  if (!cf) return [];
  const out = [];
  if (cf.slow) out.push(`Slows by ${Math.round(cf.slow[0] * 100)}% for ${cf.slow[1]}s`);
  if (cf.stun) out.push(`Stuns for ${cf.stun}s`);
  if (cf.dot) out.push(`Burns for ${Math.round(cf.dot[0] * 100)}% of its damage a second, ${cf.dot[1]}s`);
  if (cf.knock) out.push(`Knocks back ${cf.knock}`);
  if (cf.pull) out.push(`Pulls enemies back down the road`);
  if (cf.pierce > 1) out.push(`Goes through ${cf.pierce} enemies`);
  if (cf.stunSig) out.push(`Its signature runner stops enemies for ${cf.stunSig}s (each at most once every ${cf.stunSig + 3}s)`);
  if (cf.hits) out.push(cf.hits > 1 ? `Each runner hits up to ${cf.hits} enemies` : "Each runner hits one enemy");
  if (cf.n > 1) out.push(`${cf.n} at a time`);
  if (cf.aoe) out.push(`Blast ${cf.aoe.toFixed(1)} wide`);
  return out;
}
// (29 Oct, request: "When you hover over this bar it should show everything, their atk type, dmg, spa, name, etc")
function slotCard(t) {
  const { esc } = ui(), d = AF.UNIT[t.u.k], s = t.s, A = TD.attackOfU(t.u), tr = AF.traitOf(t.u);
  const sig = A && A.sig ? `<div class="td-hc-sig"><b>${esc(A.sig.name)}</b><span>Signature move, every ${A.sig.every === 3 ? "third" : "fourth"} attack: half again the damage.</span></div>` : relLines(d.key, t.u);
  const conds = condLines(s.cfg);
  return `<div class="td-hc-h"><b>${esc(AF.nameOf(t.u))}</b><small><span class="rtag r-${d.rarity}">${AF.RAR[d.rarity].name}</span>${AF.speciesTag(d)}${tr ? `<span class="td-hc-tr tt${tr.tier}">${esc(tr.name)}</span>` : ""}${t.u.sh ? `<span class="td-hc-sh">Shiny</span>` : ""}</small></div>
    <div class="td-hc-atk"><b>${esc(s.name || TD.STYLES[s.style].name)}</b><span class="td-hc-tags">${styleTag(s.style, s.kind)}${reachTag(s.reach)}</span></div>
    <p class="td-hc-info">${esc(s.kind ? TD.KIND_INFO[s.kind] : "")} ${esc(TD.REACH_INFO[s.reach] || "")}</p>
    <div class="td-hc-st"><span><b>${num(s.atk)}</b>Damage</span><span><b>${sec(s.spa)}</b>Per attack</span><span><b>${s.rng.toFixed(1)}</b>Reach</span>${s.farm
      ? `<span class="td-farmpay"><b>$${num(TD.farmPay(D.match, { s }, 0))}</b>A wave</span></div><p class="td-hc-info">Fully upgraded it pays <b>$${num(TD.farmPay(D.match, { s }, TD.UP.max))}</b> a wave.</p><div hidden>`
      : `<span><b>${num(TD.dps(s))}</b>Per second</span>`}</div>
    ${conds.length ? `<ul class="td-hc-c">${conds.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}${sig}
    <div class="td-hc-f"><span>Costs <b>$${num(s.cost)}</b></span><span><b>${t.placed}/${TD.capOf(t)}</b> placed</span><span>Upgrades to x${Math.round(Math.pow(TD.UP.atk, TD.UP.max) / Math.pow(TD.UP.spa, TD.UP.max))} damage a second</span></div>`;
}
// (30 Oct) a gate unit's passive and its Release, from its notes (units_gates.js)
function relLines(k, u) {
  const n = AF.GATE_NOTES && AF.GATE_NOTES[k]; if (!n || !(AF.REL && AF.REL[k])) return "";
  const { esc } = ui();
  return `<div class="td-hc-sig td-hc-pas"><b>Passive</b><span>${esc(n.atk)}</span></div>
    <div class="td-hc-sig td-hc-rel"><b>Release &middot; &ldquo;${esc(n.cmd)}&rdquo;</b><span>${esc(n.rel)} Every ${TD.relCd({ u })}s.</span></div>`;
}
// Ground or Hybrid, in its own colour
const REACH_C = { ground: "#c8955a", hybrid: "#c9a8ff" };
const reachTag = r => (r ? `<span class="td-style td-reach" style="--sc:${REACH_C[r]}">${TD.REACH_NAME[r]}</span>` : "");
const statLine = s => `${styleTag(s.style, s.kind)}${reachTag(s.reach)}<span><b>${num(s.atk)}</b> ATK</span><span><b>${sec(s.spa)}</b> SPA</span><span><b>${s.rng.toFixed(1)}</b> RNG</span>${s.farm ? `<span class="td-farmpay"><b>$${num(TD.farmPay(null, { s }, 0))}</b> a wave</span>` : ""}`;

AF.pageDefense = () => {
  const p = $("#p-defense");
  paintPill();
  if (D.match) { if (!$("#tdStage", p) || (is3d() && !$(".td-gl3"))) matchView(p); return; }
  lobby(p);
};

// ---------------- the world screen ----------------
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const CHEV = right => svg(right ? '<path d="m9 6 6 6-6 6"/>' : '<path d="m15 6-6 6 6 6"/>');
const MAPI = svg('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>');
// a world's state: open, and which difficulties are cleared
// (30 Oct) done: each difficulty actually beaten; beat: the world counts as cleared (any difficulty of it beaten)
function worldState(m) { const done = TD.DIFFS.map(d => G.tdWon(m.id + ":" + d.id)), n = done.filter(Boolean).length; return { open: opened(m), done, n, all: n === done.length, beat: n > 0 }; }
function openWorlds(onPick) {
  const { esc } = ui(), T0 = td(), list = TD.MAPS.map(m => Object.assign({ m }, worldState(m))), next = list.find(w => w.open && !w.beat);
  const tagOf = w => !w.open ? ["LOCKED", ""] : w.all ? ["COMPLETE", "good"] : w === next ? ["UP NEXT", "next"] : w.n ? [`${w.n} / ${TD.DIFFS.length} CLEARED`, ""] : ["NEW", ""];
  const el = document.createElement("div");
  el.className = "tdw"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Worlds"); el.tabIndex = -1;
  el.innerHTML = `<div class="tdw-back"><img alt=""></div><div class="tdw-shade"></div><div class="tdw-glow"></div><div class="tdw-edge"></div>
    <div class="tdw-bar"><span class="tdw-title">${MAPI}<b>Worlds</b></span><span class="tdw-count">${list.length} worlds &middot; ${list.filter(w => w.beat).length} cleared &middot; easiest first</span>
      <button class="tdw-x" aria-label="Close">${ui().I.x}</button></div>
    <div class="tdw-info"><div class="tdw-l"><div class="tdw-eye"><span></span><i></i></div><h2></h2><p></p><div class="tdw-segs"></div></div>
      <div class="tdw-r"><b class="tdw-rank"></b><button class="tdw-pick"><span></span>${CHEV(1)}</button></div></div>
    <div class="tdw-row"><div class="tdw-track">${list.map((w, i) => { const m = w.m, on = m.id === T0.map, [a, b] = ART[m.id] || ["#888888", "#333333"], [tag, tc] = tagOf(w);
      return `<div class="tdw-card${on ? " on" : ""}${w.open ? "" : " locked"}" data-i="${i}" style="--a:${a};--b:${b}"><div class="tdw-in">
        <img src="art/worlds/${m.id}.webp" alt="" draggable="false" onerror="this.remove()"><span class="tdw-fade"></span><span class="tdw-dim"></span>
        <span class="tdw-tag ${tc}">${tag}</span>${on ? `<span class="tdw-ck">${ui().I.check}</span>` : `<span class="tdw-n">${String(i + 1).padStart(2, "0")}</span>`}
        ${w.open ? "" : `<span class="tdw-stamp"><b>LOCKED</b><small>Clear ${esc(TD.MAPS[i - 1].name)} first</small></span>`}
        <span class="tdw-txt"><b>${esc(m.name)}</b><small>${esc(m.world)} &middot; Boss: ${esc(TD.bossOf(m).name)}</small>
          <span class="tdw-seg">${w.done.map(d => `<i class="${d ? "on" : ""}"></i>`).join("")}</span></span></div></div>`; }).join("")}</div></div>
    <button class="tdw-arrow l" aria-label="Earlier worlds">${CHEV(0)}</button><button class="tdw-arrow r" aria-label="Later worlds">${CHEV(1)}</button>
    <div class="tdw-cover"></div>`;
  document.body.appendChild(el);
  const row = $(".tdw-row", el), track = $(".tdw-track", el), cards = $$(".tdw-card", el), back = $(".tdw-back img", el);
  const S = { pos: 0, target: null, targetCard: null, snapAt: 0, drag: null, focus: -1, hover: -1, cw: 200, ch: 400, gap: 20, side: 0, W: 1, fresh: 3, fast: false, leaving: false };
  cards.forEach((c, i) => { c._s = { y: 0, s: 1, d: 0 }; c._max = !list[i].open ? 0.72 : list[i].beat ? 0 : 0.3; c._on = c.classList.contains("on"); c._in = c.firstElementChild; c._dim = $(".tdw-dim", c); });
  // sizes from the screen, as the hub does: a header row, the info band on wide screens, the cards filling the rest
  function layout() {
    const W = el.clientWidth, H = el.clientHeight, small = Math.min(W, H) < 520, m = small ? 12 : Math.round(Math.min(44, Math.max(18, W * 0.025)));
    const wide = W >= 900 && H >= 600, barH = m - 3 + 36 + (small ? 10 : 16), infoH = wide ? Math.round(Math.min(200, Math.max(130, H * 0.18))) : 0;
    el.classList.toggle("wide", wide); el.style.setProperty("--m", m + "px"); el.style.setProperty("--bar", barH + "px"); el.style.setProperty("--info", infoH + "px");
    const top = 3 + barH + infoH, bottom = small ? 12 : m, holderH = Math.max(160, H - top - 12 - bottom);
    S.gap = small ? 10 : 20; S.ch = Math.floor(holderH * 0.88); S.cw = Math.floor(Math.min(Math.max(S.ch * 0.56, 120), 420, Math.max(120, (W - 2 * m) * 0.62)));
    S.side = Math.max(m, Math.floor((W - S.cw) / 2)); S.W = W;
    row.style.top = top + "px"; row.style.height = holderH + "px";
    track.style.gap = S.gap + "px"; track.style.paddingLeft = track.style.paddingRight = S.side + "px";
    el.style.setProperty("--cw", S.cw + "px"); el.style.setProperty("--ch", S.ch + "px"); el.style.setProperty("--name", Math.min(30, Math.max(14, Math.floor(S.cw * 0.1))) + "px");
  }
  const mid = i => S.side + i * (S.cw + S.gap) + S.cw / 2, centre = i => mid(i) - S.W / 2, maxX = () => Math.max(0, centre(cards.length - 1));
  const nearest = x => { let bi = 0, bd = Infinity; cards.forEach((c, i) => { const d = Math.abs(centre(i) - x); if (d < bd) { bd = d; bi = i; } }); return bi; };
  const base = () => (S.target != null ? S.target : S.pos);
  function push(x) { const over = S.W * 0.18; S.targetCard = nearest(Math.min(maxX(), Math.max(0, x))); S.target = Math.min(maxX() + over, Math.max(-over, x)); S.snapAt = 0; S.rate = 0; }
  function setFocus(i) {
    S.focus = i;
    const w = list[i], m = w.m, [tag, tc] = tagOf(w), prev = TD.MAPS[i - 1];
    $(".tdw-eye span", el).textContent = `WORLD ${String(i + 1).padStart(2, "0")} OF ${String(list.length).padStart(2, "0")}`;
    const t = $(".tdw-eye i", el); t.textContent = tag; t.className = tc;
    $(".tdw-info h2", el).textContent = m.name;
    $(".tdw-info p", el).textContent = w.open ? `${m.world}  ·  Boss: ${TD.bossOf(m).name}  ·  ${m.waves} waves${m.hpK > 1 ? `  ·  enemy health x${m.hpK}` : ""}` : `Clear ${prev.name} on Normal to open this world.`;
    $(".tdw-segs", el).innerHTML = TD.DIFFS.map((d, k) => `<span class="${w.done[k] ? "on" : ""}"><i></i>${d.name}</span>`).join("");
    $(".tdw-rank", el).textContent = String(i + 1).padStart(2, "0");
    const pk = $(".tdw-pick", el); pk.classList.toggle("off", !w.open); $("span", pk).textContent = w.open ? `Pick ${m.name}` : "Locked";
    back.style.opacity = 0; const src = `art/worlds/${m.id}.webp`;
    setTimeout(() => { back.onload = () => { back.style.opacity = ""; }; back.onerror = () => { back.removeAttribute("src"); }; back.src = src; el.style.setProperty("--a", (ART[m.id] || [])[0] || "#888"); el.style.setProperty("--b", (ART[m.id] || [])[1] || "#333"); }, 120);
  }
  // the glide: ease toward the target, snap to the nearest card a moment after the input stops, cards follow the middle
  let raf = 0, last = performance.now();
  function step(now) {
    raf = requestAnimationFrame(step);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let cur = S.pos;
    if (!S.drag) {
      if (S.target != null) { const d = S.target - cur; if (Math.abs(d) < 0.5) { cur = S.target; S.target = null; S.snapAt = now + 120; S.fast = false; S.rate = 0; } else cur += d * (1 - Math.exp(-dt * (S.rate || (S.fast ? 11 : 6.5)))); }
      else if (S.snapAt && now > S.snapAt) { S.snapAt = 0; const ni = S.targetCard != null ? S.targetCard : nearest(cur), x = Math.min(maxX(), Math.max(0, centre(ni))); if (Math.abs(x - cur) > 2) { S.target = x; S.targetCard = ni; } else S.targetCard = null; }
    }
    S.pos = cur;
    const max = maxX(), canvas = Math.min(max, Math.max(0, cur)), off = canvas + (cur - canvas) * 0.5;
    if (!S.leaving) track.style.transform = `translate3d(${-off}px,0,0)`;
    $(".tdw-arrow.l", el).classList.toggle("off", canvas <= 2); $(".tdw-arrow.r", el).classList.toggle("off", canvas >= max - 2);
    const k = S.fresh > 0 ? 1 : 1 - Math.exp(-dt * 14), midC = off + S.W / 2;
    let best = Infinity, bi = S.focus;
    cards.forEach((c, i) => {
      const ad = Math.min(1, Math.abs((mid(i) - midC) / S.W)), hov = S.hover === i, st = c._s;
      if (ad < best) { best = ad; bi = i; }
      st.y += (ad * 60 + (hov ? -10 : 0) - st.y) * k; st.s += (1 - ad * 0.22 + (hov ? 0.02 : 0) - st.s) * k;
      const dim = Math.max(c._on || hov ? 0 : Math.min(0.68, 0.08 + ad * 0.85), hov ? Math.max(0, c._max - 0.2) : c._max);
      st.d += (dim - st.d) * k;
      c._in.style.transform = `translate3d(0,${st.y.toFixed(1)}px,0) scale(${st.s.toFixed(4)})`; c._dim.style.opacity = st.d.toFixed(3);
    });
    if (S.fresh > 0) S.fresh--;
    if (S.targetCard != null) bi = S.targetCard;
    if (bi !== S.focus) setFocus(bi);
  }
  function close() {
    if (S.leaving) return;
    S.leaving = true; sfx("click");
    el.classList.add("leaving");
    setTimeout(() => { cancelAnimationFrame(raf); removeEventListener("resize", layout); removeEventListener("keydown", key); el.remove(); }, 640);
  }
  function pick(i) {
    const w = list[i];
    if (!w.open) { const c = cards[i]; FX.nope(c._in); sfx("error"); ui().toast(`Clear ${TD.MAPS[i - 1].name} on Normal to open ${w.m.name}.`, "bad"); return; }
    T0.map = w.m.id; sfx("equip"); G.save();
    cards.forEach(c => c.classList.toggle("on", c === cards[i]));
    if (onPick) onPick();
    close();
  }
  // the wheel moves along the row (about three quarters of a card a notch); drag, arrows and keys do too
  el.addEventListener("wheel", e => {
    e.preventDefault(); if (S.leaving) return;
    const d = (e.deltaMode === 1 ? 33 : 1) * (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX);
    push(base() + (d / 100) * (S.cw + S.gap) * 0.73);
  }, { passive: false });
  // (29 Oct, request: "I should be able to click and select maps on this screen, not ahve to press the button"): the row
  // holds the pointer while it's down so a drag can leave it, which sends the click to the row, so a press that didn't
  // drag picks the card it started on
  // (3 Nov, owner: "using my finger touchscreen to scroll the map selector is cluncky ... when i let go it still goes"): a press
  // that catches the row mid-coast only stops it, it doesn't pick the card under the finger
  row.addEventListener("pointerdown", e => { if (e.button) return; const c = e.target.closest(".tdw-card"); S.drag = { x: e.clientX, pos: S.pos, moved: 0, card: c ? cards.indexOf(c) : -1, coasting: S.rate > 0 && S.target != null, trail: [[e.timeStamp, S.pos]] }; S.target = null; S.targetCard = null; S.rate = 0; row.setPointerCapture(e.pointerId); });
  row.addEventListener("pointermove", e => {
    if (!S.drag) return;
    const dx = e.clientX - S.drag.x, tr = S.drag.trail; S.drag.moved = Math.max(S.drag.moved, Math.abs(dx)); S.pos = S.drag.pos - dx;
    tr.push([e.timeStamp, S.pos]); while (tr.length > 2 && e.timeStamp - tr[0][0] > 100) tr.shift();
  });
  // the coast: it leaves at the finger's speed and slows to rest exactly on a card, so there is no second move to line up
  function flick(d, now) {
    const tr = d.trail, a = tr[0], z = tr[tr.length - 1];
    if (now - z[0] > 90 || z[0] <= a[0]) return false;
    const v = (z[1] - a[1]) / (z[0] - a[0]) * 1000;
    if (Math.abs(v) < 200) return false;
    let ni = nearest(Math.min(maxX(), Math.max(0, S.pos + v / 2.6)));
    if ((centre(ni) - S.pos) * v <= 0) ni = Math.max(0, Math.min(cards.length - 1, ni + Math.sign(v)));
    const x = Math.min(maxX(), Math.max(0, centre(ni))), to = x - S.pos;
    if (to * v <= 0) return false;
    S.target = x; S.targetCard = ni; S.rate = Math.min(14, Math.max(2, v / to)); S.snapAt = 0;
    return true;
  }
  const endDrag = e => {
    if (!S.drag) return;
    const d = S.drag; S.drag = null; S.snapAt = performance.now() + 250;
    if (e.type !== "pointerup" || S.leaving) return;
    if (d.moved > 6) flick(d, e.timeStamp);
    else if (d.card >= 0 && !d.coasting) pick(d.card);
  };
  row.addEventListener("pointerup", endDrag); row.addEventListener("pointercancel", endDrag);
  cards.forEach((c, i) => {
    c.addEventListener("pointerenter", () => { S.hover = i; });
    c.addEventListener("pointerleave", () => { if (S.hover === i) S.hover = -1; });
  });
  $(".tdw-arrow.l", el).onclick = () => push(base() - S.W * 0.8);
  $(".tdw-arrow.r", el).onclick = () => push(base() + S.W * 0.8);
  $(".tdw-pick", el).onclick = () => pick(S.focus);
  $(".tdw-x", el).onclick = close;
  function key(e) {
    if (S.leaving) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); const i = Math.max(0, Math.min(cards.length - 1, (S.targetCard != null ? S.targetCard : S.focus) + (e.key === "ArrowLeft" ? -1 : 1))); push(centre(i)); }
    else if (e.key === "Enter") { e.preventDefault(); pick(S.focus); }
  }
  addEventListener("keydown", key); addEventListener("resize", layout);
  // opening: in from black, the row gliding in from a few cards away onto the picked world (or the next to clear)
  layout();
  const fi = Math.max(0, list.findIndex(w => w.m.id === T0.map));
  S.pos = Math.min(maxX(), Math.max(0, centre(fi) + (fi > 3 ? -1 : 1) * 3.5 * (S.cw + S.gap)));
  S.target = Math.min(maxX(), Math.max(0, centre(fi))); S.targetCard = fi; S.fast = true;
  setFocus(fi); el.focus({ preventScroll: true });
  requestAnimationFrame(t => { last = t; el.classList.add("in"); step(t); });
  sfx("click");
}

// ---------------- lobby ----------------
// each world's colours, shown on its tile and card under its picture (and instead of it while there is none)
const ART = { village: ["#cfe6c4", "#5f9f48"], harbor: ["#cdeef4", "#2fa8c4"], desert: ["#f8e2a8", "#c8964a"], frost: ["#f2f8ff", "#8fb8dc"],
  grave: ["#5a4a7a", "#1a1628"], volcano: ["#ff8a3a", "#3a1a16"], neon: ["#ff3aa8", "#141a34"], space: ["#8a5aff", "#0a0622"] };
const artHTML = (m, cls) => { const [a, b] = ART[m.id] || ["#888888", "#333333"]; return `<div class="${cls}" aria-hidden="true" style="--a:${a};--b:${b}"><img src="art/worlds/${m.id}.webp" alt="" onerror="this.remove()"></div>`; };
const opened = m => TD.mapOpen(m.id, G.tdClear);
const rewardOf = (map, diff, i) => TD.reward(map, diff, i === 0);
// what a first clear of map:difficulty opens elsewhere in the game
function opensOf(key) {
  const out = AF.GATES.filter(g => g.td === key).map(g => g.name);
  const [mid, did] = key.split(":"), next = TD.MAPS[TD.MAPS.findIndex(m => m.id === mid) + 1];
  if (did === "normal" && next) out.unshift(`World ${next.n}, ${next.name}`);
  // (30 Oct) the current Rebirth's path
  return out;
}
function opensHTML(key) {
  // (30 Oct, "just say what it would say as if it completed normal"): beaten on a harder difficulty counts
  const done = G.tdClear(key);
  return `<div class="td-opens${done ? " done" : ""}"><span>${done ? "Cleared, so these are open" : "A first clear opens"}</span><ul>${opensOf(key).map(x => `<li>${ui().esc(x)}</li>`).join("")}</ul></div>`;
}
// ---------------- the Endless tower (tdtower.js) ----------------
// (30 Oct) best: the Starlight peak, in reference-curve floors (TD.TOWER.eq); bests and wk (this week's): per world
const tower = () => {
  const R = td().tower || (td().tower = { best: 0, week: -1, weekBest: 0, runs: 0 });
  R.bests = R.bests || {}; R.wk = R.wk || {};
  return R;
};
// (30 Oct) the chosen world's Endless: its picture and Change world, its name, the climb, the week's twist
function towerSection(row, world) {
  const { esc, I, SHARD, STARL } = ui(), TT = TD.TOWER, now = Date.now(), w = TT.week(now), tw = TT.twistOf(w), R = tower();
  const open = TT.open(world.id, G.tdClear), left = TT.nextWeekAt(now) - now, dd = Math.floor(left / 864e5), hh = Math.floor((left % 864e5) / 36e5);
  const best = R.bests[world.id] || 0, weekBest = R.week === w ? R.wk[world.id] || 0 : 0;
  return `<section class="td-map td-tower">
    ${artBtn(world)}
    <div class="td-map-b">
      <span class="td-kicker">Endless &middot; World ${world.n} &middot; ${esc(world.world)}</span>
      <h2>${esc(world.name)}</h2>
      <p>Floor after floor, each tougher than the last, with a boss every ${tw.bossEvery || TT.bossEvery}th. The climb ends when your lives run out, and every floor pays as you clear it.</p>
      <div class="tw-twist"><span class="tw-tk">This week's twist, on every world</span><b>${esc(tw.name)}</b><span>${esc(tw.desc)}</span><small>A new twist in ${dd ? `${dd}d ` : ""}${hh}h</small></div>
      <div class="td-facts"><span>Best floor here <b>${best || "none yet"}</b></span><span>This week <b>${weekBest || "none yet"}</b></span><span><b>${tw.lives || TT.lives}</b> lives</span></div>
      ${row}
      <p class="td-rew tw-stl">${STARL}<span>Starlight for the toughest enemies you've ever reached, on any world: <b>1</b> a step past your best, <b>6</b> on every 10th. Later worlds get tough sooner.</span></p>
      <p class="td-rew">${SHARD}<span>Every 5th floor pays ¥, more the higher it is: ${shardSteps(world.id)}.</span></p>
      ${open ? `<button class="btn big gold" id="twGo"><span>Climb</span><small>${esc(world.name)} &middot; ${esc(tw.name)}</small></button>`
        : `<p class="td-lockmsg">${I.lock}<span>Clear <b>${esc(world.name)}</b> on Hard to open its Endless.</span></p>`}
    </div>
  </section>`;
}
// (30 Oct) a world's Endless shard pay at a few floors, up to where it stops growing
function shardSteps(id) {
  const TT = TD.TOWER, out = [], top = TT.shards(id, 400);
  for (let n = 10; n <= 400 && out.length < 4; n += 10) {
    const v = TT.shards(id, n);
    if (v >= top) { out.push(`floor ${n} and up <b>${num(v)}</b>`); break; }
    out.push(`floor ${n} <b>${num(v)}</b>`);
  }
  return out.join(", ");
}
// (30 Oct, "this selector looks horrible ... It should go near the difficulty selector"): Normal | Hard | Nightmare,
// and Endless (the tower) beside them; in the tower a difficulty takes you back to the worlds (in 3D the panel is all
// there is of the lobby). open: the chosen world is open (else only Endless shows)
const INF = svg('<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/>');
const modeRow = (twr, diff, open, map) => `<div class="td-modes">${open ? `<div class="seg td-diff">${TD.DIFFS.map(d => `<button data-d="${d.id}" class="${!twr && d.id === diff.id ? "on" : ""}">${d.name}</button>`).join("")}</div>` : ""}<button class="td-endless${twr ? " on" : ""}" aria-pressed="${twr}" title="The Endless tower">${TD.TOWER.open(map.id, G.tdClear) ? INF : ui().I.lock}<span>Endless</span></button></div>`;
// the world's picture, a button that opens the world list (Worlds and Endless both)
const artBtn = map => `<button class="td-artbtn" id="tdArt" aria-label="Choose a world">${artHTML(map, "td-art")}<span class="td-change">${MAPI}<b>Change world</b><small>${TD.MAPS.filter(opened).length} / ${TD.MAPS.length} open</small><svg class="td-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></span></button>`;
function startTower(team) {
  const B = TD.TOWER.build((TD.MAP[td().map] || TD.MAPS[0]).id);
  crossing(B.map, () => {
    D.match = TD.newMatch(B.map, B.diff, frozen(team));
    D.match.autoNext = !!td().autoNext;
    D.match.autoRel = td().autoRel !== false;
    D.match.run = { shards: 0, star: 0, top: 0, best0: tower().bests[B.map.tower.world] || 0 };
    ui().sync3d();
    matchView($("#p-defense"));
  });
}
// a floor cleared (td.js, on or off the tab): paid at once
TD.TOWER.onFloor = (M, n) => {
  const R = tower(), TT = TD.TOWER, id = M.map.tower.world, run = M.run || (M.run = { shards: 0, star: 0, top: 0, best0: R.bests[id] || 0 });
  if (R.week !== M.map.tower.week) { R.week = M.map.tower.week; R.weekBest = 0; R.wk = {}; }
  // (30 Oct) Starlight for each reference-curve step past the toughest climb yet (any world)
  const sh = Math.round(TT.shards(id, n) * (1 + G.star("towerSh"))), peak = Math.floor(TT.eq(id, n)); // (30 Oct) Long Climb
  let st = 0; for (let k = R.best + 1; k <= peak; k++) st += TT.starlight(k);
  const best = n > (R.bests[id] || 0);
  if (sh) { S().yen += sh; run.shards += sh; }
  if (st) { R.best = peak; S().starlight = (S().starlight || 0) + st; run.star += st; }
  if (best) R.bests[id] = n;
  R.wk[id] = Math.max(R.wk[id] || 0, n); R.weekBest = Math.max(R.weekBest, n); run.top = n;
  M.ev.push({ t: "floorpay", n, sh, st, best });
  G.save();
};
function lobby(p) {
  const { esc } = ui(), T0 = td(), map = TD.MAP[T0.map] || TD.MAPS[0], diff = TD.DIFF[T0.diff] || TD.DIFFS[0];
  const twr = T0.mode === "tower";
  const key = map.id + ":" + diff.id, clears = T0.clears[key] || 0, open = opened(map), prev = TD.MAPS[TD.MAPS.indexOf(map) - 1];
  p.innerHTML = `
  <div class="td-lobby">
    <div class="td-top"><div><h1>Defense</h1><p class="lede">Enemies walk the road and your team fights from beside it. Place units with match cash, upgrade them, and hold every wave.</p></div></div>
    <div class="td-grid">
      ${twr ? towerSection(modeRow(true, diff, open, map), map) : `<section class="td-map">
        ${artBtn(map)}
        <div class="td-map-b">
          <span class="td-kicker">World ${map.n} &middot; ${esc(map.world)}</span>
          <h2>${esc(map.name)}</h2>
          <p>${esc(map.blurb)}</p>
          <div class="td-facts"><span><b>${map.waves}</b> waves</span><span><b>${map.lives}</b> lives</span><span>Boss: <b>${esc(TD.bossOf(map).name)}</b></span>${map.hpK * diff.hp > 1 ? `<span>Enemy health <b>x${+(map.hpK * diff.hp).toFixed(1)}</b></span>` : ""}</div>
          ${open ? `${modeRow(false, diff, true, map)}
          <p class="td-rew">${ui().SHARD}<span>${clears ? `Cleared ${clears} time${clears === 1 ? "" : "s"}. A win pays <b>${num(rewardOf(map, diff, 1))}</b> ¥.`
            : `First clear pays <b>${num(rewardOf(map, diff, 0))}</b> ¥, then ${num(rewardOf(map, diff, 1))} a win.`}</span></p>
          <p class="note">${diff.id === "normal" ? "Enemies as listed." : `Enemies have ${diff.hp} times the health${diff.speed > 1 ? " and move faster" : ""}; you start with more cash and earn more per kill.`}</p>
          ${opensHTML(key)}
          <button class="btn big gold" id="tdGo"><span>Start</span><small>${esc(map.name)} &middot; ${diff.name}</small></button>`
          : `${modeRow(false, diff, false, map)}<p class="td-lockmsg">${ui().I.lock}<span>Clear <b>${esc(prev.name)}</b> on Normal to open this world.</span></p>`}
        </div>
      </section>`}
      <section class="td-team">
        <div class="td-team-h"><h3>Your team</h3><div class="row"><button class="btn ghost sm" id="tdBest">Best team</button><button class="btn ghost sm" id="tdClear">Clear</button></div></div>
        <div class="td-slots" id="tdSlots"></div>
      </section>
    </div>
  </div>`;
  renderSlots();
  const hub = ui().hub(); if (hub) hub.selectWorld(TD.MAPS.indexOf(map));
  const endless = $(".td-endless", p);
  if (endless) endless.onclick = () => { if (twr) return; T0.mode = "tower"; sfx("tab"); G.save(); lobby(p); };
  $$(".td-diff button", p).forEach(b => b.onclick = () => { T0.diff = b.dataset.d; T0.mode = "worlds"; sfx(twr ? "tab" : "click"); G.save(); lobby(p); });
  if ($("#tdArt", p)) $("#tdArt", p).onclick = () => openWorlds(() => lobby(p));
  $("#tdBest", p).onclick = () => { bestTeam(); sfx("equip"); renderSlots(true); G.save(); };
  $("#tdClear", p).onclick = () => { T0.team = []; sfx("unequip"); renderSlots(); G.save(); };
  if (twr) {
    const go = $("#twGo", p); if (!go) return;
    go.onclick = e => {
      const team = teamUnits();
      if (!team.length) { FX.nope(e.currentTarget); sfx("error"); ui().toast("Add at least one unit to your team.", "bad"); return; }
      startTower(team);
    };
    return;
  }
  if (!open) return; // a world not open yet has no Start button
  $("#tdGo", p).onclick = e => {
    const team = teamUnits();
    if (!team.length) { FX.nope(e.currentTarget); sfx("error"); ui().toast("Add at least one unit to your team.", "bad"); return; }
    start(map.id, diff.id, team);
  };
}
// in 3D (ui.js) the team stands on the six platforms in the world, kept in step with every change to it
function syncPads() { const hub = ui().hub(); if (hub) { const team = teamUnits(); hub.setPads("defense", [0, 1, 2, 3, 4, 5].map(i => team[i] || null)); } }
function renderSlots(enter) {
  syncPads();
  const box = $("#tdSlots"); if (!box) return;
  const T0 = td(), team = teamUnits();
  T0.team = team.map(u => u.uid);
  box.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const u = team[i];
    let el;
    if (u) {
      const s = TD.statsOf(u);
      el = document.createElement("div"); el.className = "td-pick";
      // the card and its remove button share a box the card's shape, so the button stays on the card's corner
      const card = ui().cardEl(u, { cls: "sm", click: () => choose(i) }), cw = document.createElement("div");
      cw.className = "td-pick-c"; cw.appendChild(card); el.appendChild(cw);
      cw.insertAdjacentHTML("beforeend", `<button class="iconbtn td-pick-x" aria-label="Take out of the team">${ui().I.x}</button>`);
      // (29 Oct, request: "these need boxes of their own they look weird with the text on the sides, or fix that"):
      // two lines as wide as the card, its tags and price, then its numbers
      el.insertAdjacentHTML("beforeend", `<div class="td-pick-s"><div class="td-ps1">${styleTag(s.style, s.kind)}${reachTag(s.reach)}${s.farm ? `<span class="td-farmpay"><b>$${num(TD.farmPay(null, { s }, 0))}</b>/wave</span>` : ""}<span class="td-cost">$${num(s.cost)}</span></div>
        <div class="td-ps2"><span><b>${num(s.atk)}</b> ATK</span><span><b>${sec(s.spa)}</b> SPA</span><span><b>${s.rng.toFixed(1)}</b> RNG</span></div></div>`);
      $(".td-pick-x", el).onclick = () => { T0.team.splice(i, 1); sfx("unequip"); renderSlots(); G.save(); };
    } else {
      el = document.createElement("button"); el.className = "td-pick empty";
      el.innerHTML = `${ui().I.plus}<span>Add a unit</span>`;
      el.onclick = () => choose(i);
    }
    box.appendChild(el);
    if (enter) FX.enter(el, i * 40);
  }
}
function choose(i) {
  sfx("click");
  const T0 = td();
  ui().pickUnit(`Team slot ${i + 1}`, u => {
    const list = teamUnits().map(x => x.uid);
    if (i < list.length) list[i] = u.uid; else list.push(u.uid);
    T0.team = list.slice(0, 6); sfx("equip"); renderSlots(); G.save();
  }, {
    exclude: u => T0.team.includes(u.uid),
    sort: (a, b) => TD.power(TD.statsOf(b)) - TD.power(TD.statsOf(a)),
    note: u => `<div class="td-pick-s">${statLine(TD.statsOf(u))}</div>`,
  });
}
// (29 Oct, request: "the best team button should automatically give them a farmer in their 6th slot, and an air/hbd
// combo thats good"): the five strongest attackers (one copy of each unit) with at least two Hybrids among them, so
// the flyers are covered (the weakest Ground ones make way for the best Hybrids left), then the best-paying farm in
// the 6th slot (the next strongest attacker when there's no farm)
const MIN_HYBRID = 2;
function bestTeam() {
  const seen = new Set(), fighters = [], farms = [];
  S().units.map(u => ({ u, s: TD.statsOf(u) })).sort((a, b) => (b.s.farm || TD.power(b.s)) - (a.s.farm || TD.power(a.s))).forEach(x => {
    if (seen.has(x.u.k)) return;
    seen.add(x.u.k); (x.s.kind === "farm" ? farms : fighters).push(x);
  });
  const team = fighters.slice(0, 5), rest = fighters.slice(5), hyb = x => x.s.reach !== "ground";
  for (let n = team.filter(hyb).length; n < MIN_HYBRID; n++) {
    const add = rest.find(hyb), drop = team.slice().reverse().find(x => !hyb(x));
    if (!add || !drop) break;
    team[team.indexOf(drop)] = add; rest.splice(rest.indexOf(add), 1); rest.unshift(drop);
  }
  team.sort((a, b) => TD.power(b.s) - TD.power(a.s));
  const sixth = farms[0] || rest.find(x => !team.includes(x));
  td().team = team.concat(sixth ? [sixth] : []).map(x => x.u.uid);
}

// ---------------- the match ----------------
// (31 Oct, "whatever i play with is whatever the traits are"): a match keeps its own copy of each team unit, so a
// trait rerolled in the Lab while it runs doesn't reach it (u.real: the unit itself)
const frozen = team => team.map(u => Object.assign({}, u, { real: u }));
function start(mapId, diffId, team) {
  crossing(TD.MAP[mapId], () => {
    D.match = TD.newMatch(mapId, diffId, frozen(team));
    D.match.autoNext = !!td().autoNext;
    D.match.autoRel = td().autoRel !== false;
    D.match.autoUp = G.has("autoUpgrade") && td().autoUp !== false;
    ui().sync3d();
    matchView($("#p-defense"));
  });
}
// (29 Oct, request: "When you go into a match, it should play a animation to switch the view ... the map switches when
// it full covers, then they come out"): the cloud crossing (clouds.js). The view being left leans in as they come,
// swap runs under full cover, and the new view settles from a little closer as they part
function crossing(map, swap) {
  if (!AF.clouds || AF.UI.tab !== "defense" || matchMedia("(prefers-reduced-motion: reduce)").matches) { swap(); return; }
  const th = map && AF.WORLDS && AF.WORLDS[map.theme], world = $("#world");
  const lean = () => (Bd.match() ? $(".td-gl3") || $("#tdStage") : world);
  AF.clouds.swap({
    tint: th ? "#" + new THREE.Color(th.fog).getHexString() : null,
    push: k => { const el = lean(); if (el) el.style.transform = `scale(${(1 + 0.07 * k).toFixed(4)})`; },
    cover: () => { [world, $(".td-gl3"), $("#tdStage")].forEach(e => { if (e) e.style.transform = ""; }); swap(); },
    settle: k => {
      if (Bd.match()) { Bd.zoom = 1 + 0.16 * k; Bd.refit(); }
      else if (world) world.style.transform = k > 0 ? `scale(${(1 + 0.06 * k).toFixed(4)})` : "";
    },
  });
}
let hudSig = "", selSig = "";
// in 3D (29 Oct, "the same 3d view like every other tab") the board's canvases go in a full-screen layer of their own
// (.td-gl3, outside the zoomed #app) and #tdStage is just the HUD over it
const is3d = () => !!(ui().hub && ui().hub());
const uiz = () => +getComputedStyle(document.documentElement).getPropertyValue("--uiz") || 1;
function matchView(p) {
  const M = D.match, { esc } = ui(), w3 = is3d();
  $$(".td-gl3").forEach(e => e.remove());
  p.innerHTML = `
  <div class="td-match${w3 ? " td-m3" : ""}">
    <div class="td-stage" id="tdStage">
      <div class="td-hud">
        <div class="td-hud-l">
          <div class="td-chip"><span>${M.map.tower ? "Floor" : "Wave"}</span><b id="tdWave"></b></div>
          <div class="td-chip lives">${HEART}<b id="tdLives"></b></div>
          <div class="td-chip cash"><span>$</span><b id="tdCash"></b></div>
          <span class="td-mapname">${M.map.tower ? `Endless tower &middot; ${esc(M.map.name)} &middot; ${esc(M.map.tower.twist.name)}` : `${esc(M.map.name)} &middot; ${M.diff.name}`}</span>
        </div>
        <div class="td-hud-r">
          ${M.team.some(t => t.s.gate) ? `<label class="switch" title="Gate units use their Release on their own when a boss, a brute or a crowd is in reach"><input type="checkbox" id="tdAutoRel" ${M.autoRel ? "checked" : ""}><span class="sw"></span><span>Auto release</span></label>` : ""}
          ${G.has("autoUpgrade") ? `<label class="switch" title="Upgrades what you've placed on its own: farms while it's safe, damage where the enemies are"><input type="checkbox" id="tdAutoUp" ${M.autoUp ? "checked" : ""}><span class="sw"></span><span>Auto upgrade</span></label>` : ""}
          <label class="switch"><input type="checkbox" id="tdAuto" ${M.autoNext ? "checked" : ""}><span class="sw"></span><span>Auto next</span></label>
          <button class="btn sm ghost" id="tdView" title="Scroll to zoom, right drag to move, drag to turn" hidden>Reset view</button>
          <button class="btn sm ghost" id="tdSpeed" title="Speed (S)">1x</button>
          <button class="btn sm ghost" id="tdPause" title="Pause (P)">Pause</button>
          <button class="btn sm gold" id="tdNext" title="Next wave (N)"></button>
          <button class="btn sm ghost" id="tdLeave">Leave</button>
        </div>
      </div>
      <div class="td-call" id="tdCall"></div>
      <div class="td-bar" id="tdBar">${M.team.map((t, i) => `<button class="td-slot r-${AF.UNIT[t.u.k].rarity}" data-s="${i}" title="${esc(AF.nameOf(t.u))} (${i + 1})">
        <canvas class="td-port"></canvas><i class="td-key">${i + 1}</i><span class="td-n"></span><span class="td-cost">$${num(t.s.cost)}</span></button>`).join("")}</div>
      <aside class="td-sel" id="tdSel" hidden></aside>
      <div class="td-pausednote" id="tdPausedNote" hidden>Paused</div>
    </div>
  </div>`;
  hudSig = ""; selSig = "";
  // the hover card over the team bar
  const hc = ui().h(`<div class="td-hc" hidden></div>`);
  $("#tdStage", p).appendChild(hc);
  $$(".td-slot", p).forEach(b => {
    b.removeAttribute("title");
    b.addEventListener("mouseenter", () => {
      hc.innerHTML = slotCard(M.team[+b.dataset.s]); hc.hidden = false;
      // z: screen pixels per CSS pixel here (the 3D HUD is zoomed with the interface)
      const se = $("#tdStage", p), st = se.getBoundingClientRect(), r = b.getBoundingClientRect(), w = hc.offsetWidth, z = st.width / (se.offsetWidth || st.width);
      hc.style.left = Math.max(8, Math.min(st.width / z - w - 8, (r.left - st.left + r.width / 2) / z - w / 2)) + "px";
      hc.style.bottom = (st.bottom - r.top) / z + 10 + "px";
    });
    b.addEventListener("mouseleave", () => { hc.hidden = true; });
  });
  $$(".td-slot", p).forEach(b => {
    const t = M.team[+b.dataset.s];
    AF.R3.view($(".td-port", b), AF.formKey(t.u), { tier: AF.traitVis(G.trait(t.u)), fx: false, shiny: !!t.u.sh, gold: t.u.tr === "golden" });
    b.onclick = () => togglePlace(+b.dataset.s);
  });
  $("#tdAuto").onchange = e => { M.autoNext = td().autoNext = e.target.checked; if (M.autoNext && M.state === "build" && M.wave > 0) M.nextAt = Math.min(M.nextAt, M.t + 3); sfx("click"); G.save(); };
  if ($("#tdAutoRel")) $("#tdAutoRel").onchange = e => { M.autoRel = td().autoRel = e.target.checked; sfx("click"); G.save(); };
  if ($("#tdAutoUp")) $("#tdAutoUp").onchange = e => { M.autoUp = td().autoUp = e.target.checked; sfx("click"); G.save(); };
  $("#tdSpeed").onclick = cycleSpeed;
  $("#tdView").onclick = () => { Bd.resetView(); sfx("click"); };
  $("#tdPause").onclick = togglePause;
  $("#tdNext").onclick = callNext;
  $("#tdLeave").onclick = () => {
    if (M.state === "won" || M.state === "lost") { leave(); return; }
    if (M.map.tower) { ui().confirmBox("End this climb?", "The climb ends here. What the floors paid is yours to keep.", "End climb", leave); return; }
    ui().confirmBox("Leave this match?", "The match ends here and nothing is won.", "Leave", leave);
  };
  let host = $("#tdStage", p);
  if (w3) { host = document.createElement("div"); host.className = "td-gl3"; document.body.appendChild(host); }
  // the room the header and tabs (top) and the team bar (bottom) take, in screen pixels
  Bd.pad = w3 ? () => { const z = uiz(); return { top: 168 * z, bottom: 168 * z, side: 60 * z }; } : null;
  Bd.mount(host, M, { tick, event: onEvent, select: showSel, place });
}
function leave() {
  sfx("click");
  crossing(null, () => { Bd.unmount(); Bd.zoom = 1; $$(".td-gl3").forEach(e => e.remove()); D.match = null; paintPill(); ui().sync3d(); AF.pageDefense(); });
}
function togglePlace(i) {
  const M = D.match, t = M.team[i]; if (!t) return;
  if (Bd.placing === i) { Bd.setPlacing(null); sfx("click"); return; }
  if (t.placed >= TD.capOf(t)) { sfx("error"); ui().toast(TD.capOf(t) === 1 ? `${AF.nameOf(t.u)} has Infinity: only one can be on the board.` : `${AF.nameOf(t.u)} is on the board ${TD.capOf(t)} times already.`, "bad"); return; }
  Bd.setPlacing(i); sfx("tab");
}
function cycleSpeed() { Bd.speed = Bd.speed === 1 ? 2 : Bd.speed === 2 ? 3 : 1; $("#tdSpeed").textContent = Bd.speed + "x"; sfx("click"); }
function togglePause() { Bd.paused = !Bd.paused; $("#tdPause").textContent = Bd.paused ? "Resume" : "Pause"; $("#tdPausedNote").hidden = !Bd.paused; sfx("click"); }
function callNext() {
  const M = D.match;
  if (!TD.callWave(M)) { sfx("error"); return; }
  sfx("whoosh");
}
// the page's side of placing: the board asks, the rules decide, the page explains a no
function place(slot, c, r) {
  const M = D.match, res = TD.place(M, slot, c, r);
  if (res.ok) return true;
  const why = { cash: `You need $${num(res.need - M.cash)} more.`, cap: TD.capOf(M.team[slot]) === 1 ? "An Infinity unit can only be on the board once." : `That unit is on the board ${TD.PER_SLOT} times already.`, road: "Units can't stand on the road.",
    blocked: "Something's in the way there.", crowded: "Too close to another unit.", edge: "Keep units inside the play area.", void: "Units can only stand on the platforms." }[res.err];
  if (why) { sfx("error"); ui().toast(why, "bad"); }
  return false;
}

// ---------------- HUD ----------------
// (31 Oct) Auto Upgrade (Rebirth shop): one upgrade at most every 0.4 s of match time. Farms first while the wave is
// under control; when it isn't, the damage upgrade that buys the most damage a second per cash where the enemies are.
// Never places, and keeps back the price of the cheapest team unit not on the board yet
function autoUpgrade(M) {
  if (!M.autoUp || M.state === "won" || M.state === "lost" || !M.units.length || M.t < (M.upAt || 0)) return;
  M.upAt = M.t + 0.4;
  const waiting = M.team.filter(t => t.placed === 0), reserve = waiting.length ? Math.min(...waiting.map(t => t.s.cost)) : 0;
  const spend = M.cash - reserve;
  const cands = M.units.filter(p => { const c = TD.upCost(p); return c > 0 && c <= spend; });
  if (!cands.length) return;
  // the trouble: health on the road and still to come this wave, against the team's damage over the walk
  const len = M.map.len, alive = M.enemies.filter(e => e.hp > 0);
  let hp = 0, walk = 0, n = 0, late = false, boss = false;
  for (const e of alive) { hp += e.hp; walk += (len - e.d) / Math.max(0.05, e.speed); n++; if (e.d > len * 0.65) late = true; if (e.def.boss) boss = true; }
  for (const q of M.queue) {
    const d = TD.ENEMIES[q.type]; if (!d) continue;
    hp += d.hp * TD.waveHp(M, d) * M.diff.hp * (M.map.hpK || 1); walk += len / Math.max(0.05, d.speed * M.diff.speed); n++;
    if (d.boss) boss = true;
  }
  const fighters = M.units.filter(p => p.s.kind !== "farm");
  const dps = fighters.reduce((s, p) => s + TD.dps(TD.live(p)), 0), time = n ? walk / n : 0;
  const trouble = late || boss || (hp > 0 && hp > dps * time * 0.5);
  // a farm upgrade worth buying: it pays itself back with waves to spare
  const left = M.map.tower ? 10 : Math.max(0, M.map.waves - M.wave);
  const farm = cands.filter(p => p.s.kind === "farm").map(p => ({ p, back: TD.upCost(p) / Math.max(1, TD.farmPay(M, p, p.lv + 1) - TD.farmPay(M, p, p.lv)) }))
    .filter(x => x.back < left - 1).sort((a, b) => a.back - b.back)[0];
  // the damage upgrade with the most damage a second per cash, doubled for a unit with enemies in reach now
  const dmg = cands.filter(p => p.s.kind !== "farm").map(p => {
    const L = TD.live(p), gain = TD.dps(L) * (TD.UP.atk - 1), busy = alive.some(e => Math.hypot(e.x - p.x, e.z - p.z) <= L.rng + TD.UP.rng);
    return { p, v: (gain / TD.upCost(p)) * (busy ? 2 : 1) };
  }).sort((a, b) => b.v - a.v)[0];
  const pick = (!trouble && farm) ? farm.p : dmg ? dmg.p : farm ? farm.p : null;
  if (pick && TD.upgrade(M, pick).ok && Bd.selected === pick && AF.UI.tab === "defense") showSel(pick);
}
function tick(M) {
  autoUpgrade(M);
  // (1 Nov) Reset view shows once the camera's been zoomed, moved or turned
  const rv = $("#tdView"), mv = Bd.viewMoved(); if (rv && rv.hidden === mv) rv.hidden = !mv;
  const canCall = TD.canCall(M), sig = [M.wave, M.lives, Math.floor(M.cash), M.state, canCall, M.state === "build" && M.autoNext ? Math.ceil(M.nextAt - M.t) : 0, Bd.placing].join("|");
  if (sig !== hudSig) {
    hudSig = sig;
    $("#tdWave").textContent = M.map.tower ? `${M.wave}` : `${M.wave}/${M.map.waves}`;
    $("#tdLives").textContent = M.lives;
    $("#tdCash").textContent = num(M.cash);
    const nb = $("#tdNext");
    nb.disabled = !canCall || M.state === "won" || M.state === "lost";
    nb.classList.toggle("off", nb.disabled);
    const wv = M.map.tower ? "floor" : "wave", Wv = M.map.tower ? "Floor" : "Wave";
    nb.textContent = M.wave === 0 ? `Start ${wv} 1`
      : M.state === "build" ? (M.autoNext ? `Next ${wv} in ${Math.max(0, Math.ceil(M.nextAt - M.t))}s` : `Start ${wv} ${M.wave + 1}`)
      : canCall ? `Call ${wv} ${M.wave + 1} early` : `${Wv} ${M.wave} coming in`;
    $$(".td-slot").forEach(b => {
      const t = M.team[+b.dataset.s];
      b.classList.toggle("poor", M.cash < t.s.cost); b.classList.toggle("full", t.placed >= TD.capOf(t));
      b.classList.toggle("on", Bd.placing === +b.dataset.s);
      $(".td-n", b).textContent = `${t.placed}/${TD.capOf(t)}`;
    });
    const call = $("#tdCall");
    call.textContent = Bd.placing != null ? "Click open ground to place. Right-click or Esc to cancel. Hold Shift to place more." : "";
    call.hidden = Bd.placing == null;
  }
  if (Bd.selected) paintSel(M, Bd.selected);
}
// the kinds that never choose an enemy say what they do instead of showing targeting buttons
const TGT_NOTE = { nova: "Hits everything in range", spin: "Hits everything in range", stop: "Hits everything in range",
  orbit: "Hits everything in range", runner: "Runs back down the road" };
function showSel(p) {
  const box = $("#tdSel"); if (!box) return;
  selSig = "";
  box.hidden = !p;
  if (!p) return;
  const { esc } = ui(), d = AF.UNIT[p.u.k];
  box.innerHTML = `
    <div class="td-sel-h"><canvas class="td-port"></canvas><div><b>${esc(AF.nameOf(p.u))}</b><small><span class="rtag r-${d.rarity}">${AF.RAR[d.rarity].name}</span>${AF.speciesTag(d)}${styleTag(p.s.style, p.s.kind)}${reachTag(p.s.reach)}</small></div>
      <button class="iconbtn" id="tdSelX" aria-label="Close">${ui().I.x}</button></div>
    <dl class="td-st" id="tdSt"></dl>
    <div class="td-pips" id="tdPips"></div>
    ${p.s.kind === "farm" ? "" : TGT_NOTE[p.s.kind] ? `<div class="td-tgt-n">${TGT_NOTE[p.s.kind]}</div>` : `<div class="seg td-tgt">${[["first", "First"], ["strong", "Strongest"], ["close", "Closest"]].map(([m, n]) => `<button data-m="${m}">${n}</button>`).join("")}</div>`}
    ${p.s.gate && AF.GATE_NOTES[p.u.k] ? `<p class="td-pas"><b>Passive</b> ${esc(AF.GATE_NOTES[p.u.k].atk)}</p>
    <button class="td-relbtn" id="tdRel" title="Release (R)"><i class="td-relfill"></i><span class="td-rel-t">Release</span><span class="td-rel-c">&ldquo;${esc(AF.GATE_NOTES[p.u.k].cmd)}&rdquo;</span><small class="td-rel-s"></small></button>` : ""}
    <div class="td-sel-act"><button class="btn gold" id="tdUp"></button><button class="btn danger" id="tdSell"></button></div>`;
  AF.R3.view($(".td-port", box), AF.formKey(p.u), { tier: AF.traitVis(G.trait(p.u)), fx: false, shiny: !!p.u.sh, gold: p.u.tr === "golden" });
  $("#tdSelX", box).onclick = () => Bd.select(null);
  $$(".td-tgt button", box).forEach(b => b.onclick = () => { p.mode = p.u.tm = b.dataset.m; if (p.u.real) p.u.real.tm = p.mode; sfx("click"); selSig = ""; });
  $("#tdUp", box).onclick = e => upgradeSel(e.currentTarget);
  $("#tdSell", box).onclick = () => { TD.sell(D.match, p); Bd.select(null); };
  if ($("#tdRel", box)) $("#tdRel", box).onclick = e => releaseSel(e.currentTarget);
  paintSel(D.match, p);
}
// (29 Oct, "sometimes im spam clicking and it wont work"): every kill changed the cash and so redrew the panel,
// which replaced the Upgrade button's insides between press and release, and the click was lost. Parts are only
// rewritten when what they say changes
const setHTML = (el, html) => { if (el && el._h !== html) { el._h = html; el.innerHTML = html; } };
function paintSel(M, p) {
  if (p.s.gate) paintRel(M, p);
  const sig = [p.id, p.lv, Math.floor(M.cash), p.mode, Math.floor(p.dealt / 10), p.earned || 0].join("|");
  if (sig === selSig) return;
  selSig = sig;
  const L = TD.live(p), up = TD.upCost(p), N = p.lv < TD.UP.max ? TD.live(Object.assign({}, p, { lv: p.lv + 1 })) : null;
  const arrow = (a, b, f) => (N ? `${f(a)}<em>${f(b)}</em>` : f(a));
  $("#tdSt").innerHTML = p.s.kind === "farm" ? `
    <div class="td-farmrow"><dt>Per wave</dt><dd>$${num(TD.farmPay(M, p))}${N ? `<em>$${num(TD.farmPay(M, p, p.lv + 1))}</em>` : ""}</dd></div>
    <div><dt>ATK / SPA / Range</dt><dd>0 / 0s / 0</dd></div>
    <div><dt>Earned</dt><dd>$${num(p.earned || 0)}</dd></div>` : `
    <div><dt>ATK</dt><dd>${arrow(L.atk, N && N.atk, num)}</dd></div>
    <div><dt>SPA</dt><dd>${arrow(L.spa, N && N.spa, sec)}</dd></div>
    <div><dt>Range</dt><dd>${arrow(L.rng, N && N.rng, v => v.toFixed(1))}</dd></div>
    <div><dt>Damage dealt</dt><dd>${num(p.dealt)}</dd></div>`;
  setHTML($("#tdPips"), `<span>Upgrades</span>${Array.from({ length: TD.UP.max }, (_, i) => `<i class="${i < p.lv ? "on" : ""}"></i>`).join("")}`);
  $$(".td-tgt button").forEach(b => b.classList.toggle("on", b.dataset.m === p.mode));
  const ub = $("#tdUp");
  setHTML(ub, up ? `<span>Upgrade</span><small>$${num(up)}</small>` : "<span>Fully upgraded</span>");
  ub.classList.toggle("off", !up || M.cash < up);
  setHTML($("#tdSell"), `<span>Sell</span><small>+$${num(TD.sellValue(p))}</small>`);
}
// the Release button: filling while it charges, then ready (and glowing), then counting down while it lasts
function paintRel(M, p) {
  const b = $("#tdRel"); if (!b) return;
  const k = TD.relCharge(p), on = p.relT > 0, ready = TD.canRelease(M, p);
  b.style.setProperty("--k", on ? 1 : k.toFixed(3));
  b.classList.toggle("ready", ready); b.classList.toggle("on", on);
  const cd = p.relCd == null ? TD.relCd(p) * 0.5 : p.relCd;
  setHTML($(".td-rel-s", b), on ? `Released, ${Math.ceil(p.relT)}s` : ready ? "Ready (R)" : cd > 0 ? `Ready in ${Math.ceil(cd)}s` : "Waiting");
}
function releaseSel(btn) {
  const M = D.match, p = Bd.selected; if (!M || !p || !p.s.gate) return;
  if (TD.release(M, p)) { FX.squash(btn); return; }
  FX.nope(btn); sfx("error");
  const cd = p.relCd == null ? TD.relCd(p) * 0.5 : p.relCd, name = AF.nameOf(p.u).split(",")[0];
  ui().toast(p.relT > 0 ? `${name} is already released.` : cd > 0 ? `${name}'s Release is ready in ${Math.ceil(cd)}s.` : "Another Release is still going.", "bad");
}
// (30 Oct) a unit releasing: its name and its command across the board for a moment (at most one at a time)
let capAt = -1e9;
function releaseCaption(p) {
  const st = $("#tdStage"), n = AF.GATE_NOTES && AF.GATE_NOTES[p.u.k]; if (!st || !n) return;
  if (performance.now() - capAt < 2200) return;
  capAt = performance.now();
  $$(".td-relcap", st).forEach(e => e.remove());
  const d = AF.UNIT[p.u.k], el = ui().h(`<div class="td-relcap r-${d.rarity}"><small>${ui().esc(AF.nameOf(p.u))}</small><b>&ldquo;${ui().esc(n.cmd)}&rdquo;</b></div>`);
  st.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}
function upgradeSel(btn) {
  const M = D.match, p = Bd.selected; if (!p) return;
  const r = TD.upgrade(M, p);
  if (r.err === "cash") { FX.nope(btn); sfx("error"); ui().toast(`You need $${num(r.need - M.cash)} more.`, "bad"); return; }
  if (r.err) return;
  FX.squash(btn); selSig = "";
}
function callout(text, cls = "") {
  const st = $("#tdStage"); if (!st) return;
  const el = document.createElement("div");
  el.className = "td-flash " + cls; el.textContent = text;
  st.appendChild(el);
  setTimeout(() => el.remove(), 1700);
}
function onEvent(ev) {
  const M = D.match;
  const TWR = M.map.tower;
  if (ev.t === "wave" && TWR) { const boss = TD.TOWER.isBoss(ev.n, TWR.twist); callout(boss ? `Boss floor ${ev.n}` : `Floor ${ev.n}`, boss ? "boss" : ""); }
  else if (ev.t === "wave") callout(M.map.waves === ev.n ? `Final wave` : `Wave ${ev.n}`, ev.n === M.map.waves ? "boss" : "");
  else if (ev.t === "clear") callout(TWR ? `Floor ${ev.n} cleared` : `Wave ${ev.n} cleared`, "good");
  else if (ev.t === "floorpay") {
    // after the "cleared" callout: a new best (and its Starlight), then the shards
    if (ev.best) setTimeout(() => { callout(`New best floor! +${ev.st} Starlight`, "boss"); sfx("unlock"); }, 900);
    if (ev.sh) setTimeout(() => callout(`+${num(ev.sh)} ¥`, "cash"), ev.best ? 2000 : 900);
  }
  else if (ev.t === "bonus") callout(`+$${num(ev.cash)}`, "cash");
  else if (ev.t === "leak") { const l = $("#tdLives"); if (l) FX.nope(l.parentElement); }
  else if (ev.t === "release") releaseCaption(ev.p);
  else if (ev.t === "won" || ev.t === "lost") setTimeout(() => finish(ev.t === "won"), 700);
}
// (29 Oct, request: "a victory / defeat screen should show up once you win or lose in tower defense. no matter if
// youre in the tab or not. with the time played, lives leaked (if none, 0), and stuff earned"): rewards are paid
// once, here, and the result opens as a modal over whatever tab is up
function finish(won) {
  const M = D.match; if (!M || M.over) return;
  M.over = true;
  if (M.map.tower) { tower().runs++; G.save(); ui().refresh(); paintPill(); showResult(M, { tower: true, won: false, opens: [] }); return; }
  const key = M.map.id + ":" + M.diff.id, T0 = td(), first = won && !T0.clears[key];
  let shards = 0;
  if (won) {
    shards = rewardOf(M.map, M.diff, first ? 0 : 1);
    S().yen += shards; T0.clears[key] = (T0.clears[key] || 0) + 1;
    S().stats.tdWins = (S().stats.tdWins || 0) + 1;
    G.save(); ui().refresh();
  }
  paintPill();
  showResult(M, { won, first, shards, opens: first ? opensOf(key) : [] });
}
function showResult(M, r) {
  // a summon reveal or a big trait reveal on screen finishes first
  if (document.querySelector(".reveal, #layer .dim")) { setTimeout(() => showResult(M, r), 400); return; }
  if (D.match !== M) return;
  const secs = Math.round(M.played || 0), played = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const leaked = M.map.lives - M.lives;
  // (30 Oct) the tower's end: how high, the best, and what the climb paid
  const run = M.run || { shards: 0, star: 0, top: 0, best0: 0 }, newBest = r.tower && run.top > run.best0;
  const ov = r.tower ? ui().h(`<div class="td-over tower ${newBest ? "won" : "lost"}">
    <span class="td-over-k">Endless tower &middot; ${ui().esc(M.map.tower.twist.name)}</span>
    <h2>Floor ${run.top}</h2>
    <p class="td-over-sub">${newBest ? "New best floor here!" : `Best floor here ${tower().bests[M.map.tower.world] || 0}`}</p>
    <i class="td-over-sep"></i>
    <div class="td-over-st">
      <div><b>${played}</b><span>Time played</span></div>
      <div><b>${ui().SHARD}+${num(run.shards)}</b><span>¥ earned</span></div>
      <div><b>${ui().STARL}+${num(run.star)}</b><span>Starlight earned</span></div>
    </div>
    <p class="td-over-hint">Click anywhere to continue</p></div>`) : ui().h(`<div class="td-over ${r.won ? "won" : "lost"}">
    <h2>${r.won ? "Victory" : "Defeat"}</h2>
    <i class="td-over-sep"></i>
    <div class="td-over-st">
      <div><b>${played}</b><span>Time played</span></div>
      <div class="${leaked ? "bad" : ""}"><b>${leaked}</b><span>Lives leaked</span></div>
      <div><b>${ui().SHARD}+${num(r.shards)}</b><span>¥ earned</span></div>
    </div>
    <p class="td-over-hint">Click anywhere to continue</p></div>`);
  $("#layer").appendChild(ov);
  // continuing ends the match (back to the lobby on the Defense tab; anywhere else it just goes)
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    if (AF.UI.modalClose === close) AF.UI.modalClose = null;
    ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }).onfinish = () => ov.remove();
    if (D.match === M) leave();
  };
  // not before it has landed, so a click already on its way doesn't skip it
  setTimeout(() => { ov.addEventListener("pointerdown", close); AF.UI.modalClose = close; }, 700);
  if (r.opens.length) ui().toast(`First clear: ${r.opens.join(", ")}.`);
  if (r.tower) {
    if (newBest) { sfx("win"); FX.burst(innerWidth / 2, -20, { colors: ["#ffd23a", "#7fe3ff", "#c9a8ff", "#ffffff"], n: 140, shape: "confetti", angle: Math.PI / 2, spread: 1.3, speed: 700, gravity: 520, life: 2.4, add: false }); }
    else sfx("lose");
  } else if (r.won) {
    sfx("win");
    FX.burst(innerWidth / 2, -20, { colors: ["#ffd23a", "#7fe3ff", "#c9a8ff", "#ffffff"], n: 140, shape: "confetti", angle: Math.PI / 2, spread: 1.3, speed: 700, gravity: 520, life: 2.4, add: false });
  } else { sfx("lose"); FX.shake(0.3); }
}

// ---------------- off the tab ----------------
// (29 Oct, request: "the whole defense thing should run in the background, with a pill like the auto roll stuff if
// they tab out. it gives them a status and tells them if they need to click back, like they're leaking"): the match
// steps at half speed as numbers only (board.js), and a pill bottom left says how it's going
let leakAt = -1e9, pillT = 0;
// (1 Nov) Double Time: off the tab the match keeps the speed you picked, up to 2x (1x stays 1x, 3x runs at 2x)
const bgSpeed = () => (G.has("doubleTime") ? Math.min(2, Bd.speed || 1) : 0.5);
D.background = dt => {
  const M = D.match; if (!M) return;
  for (const ev of Bd.background(dt, bgSpeed())) if (ev.t === "leak") leakAt = performance.now();
  autoUpgrade(M); // (1 Nov, "the auto upgrade doesn't work out of defense, it should work wherever you are")
  pillT += dt; if (pillT > 0.25) { pillT = 0; paintPill(); }
};
function paintPill() {
  const M = D.match, box = ui().pillsBox();
  let p = $('.pill[data-p="td"]', box);
  const want = M && AF.UI.tab !== "defense";
  if (!want) { if (p) p.remove(); return; }
  if (!p) {
    p = ui().h(`<div class="pill td-pill" data-p="td"><button class="pill-go" title="Back to the match"><span class="pill-roll"><i class="td-pill-ic">${ui().I.defense}</i></span>
      <span class="pill-txt"><b></b><span></span></span><span class="pill-last"></span></button></div>`);
    $(".pill-go", p).onclick = () => { sfx("tab"); ui().go("defense"); };
    box.appendChild(p);
    p.animate([{ opacity: 0, transform: "translateY(30px) scale(.8)" }, { opacity: 1, transform: "none" }], { duration: 400, easing: "cubic-bezier(.2,.9,.3,1.2)" });
  }
  const leaking = performance.now() - leakAt < 5000, needs = M.state === "build" && !M.autoNext && M.wave > 0;
  const st = M.state === "won" ? ["good", "Victory: see results"] : M.state === "lost" ? ["bad", M.map.tower ? "The climb is over: see results" : "Overrun: see results"]
    : leaking ? ["bad", "Leaking! Click to go back"] : M.wave === 0 ? ["warn", "Waiting to start"]
    : needs ? ["warn", `Start wave ${M.wave + 1}`] : M.state === "build" ? ["good", `Next wave in ${Math.max(0, Math.ceil(M.nextAt - M.t))}s`] : ["good", "Holding"];
  p.className = "pill td-pill s-" + st[0];
  $(".pill-txt b", p).textContent = M.map.tower ? "Endless tower" : `Defense \u00B7 ${M.map.name}`;
  $(".pill-txt span", p).textContent = `${M.map.tower ? `Floor ${M.wave}` : `Wave ${M.wave}/${M.map.waves}`} \u00B7 \u2665 ${M.lives} \u00B7 $${num(M.cash)} \u00B7 ${bgSpeed() < 1 ? "half speed" : bgSpeed() + "x"}`;
  $(".pill-last", p).innerHTML = `<span class="td-pill-st">${st[1]}</span>`;
}
D.onTab = () => paintPill();
// what ui.js borrows: the unit window's Defense side, the team, a team slot's picker, and a world clicked in 3D
D.tags = { styleTag, reachTag, condLines, statLine, num, sec, relLines };
D.teamUnits = teamUnits;
D.start = start;
D.leave = leave;
D.setTeam = list => { td().team = list.slice(0, 6).map(u => u.uid); renderSlots(); };
D.choose = choose;
D.syncPads = syncPads;
D.setWorld = i => {
  const m = TD.MAPS[i]; if (!m) return;
  if (!opened(m)) { sfx("error"); ui().toast(`Clear ${TD.MAPS[i - 1].name} on Normal to open ${m.name}.`, "bad"); return; }
  td().map = m.id; sfx("click"); G.save(); lobby($("#p-defense"));
};

// keys while a match is open on the Defense tab: 1-6 pick a unit to place, Esc cancels, U upgrades, N calls the
// next wave, S changes speed, P pauses. Returns true when it used the key.
D.key = e => {
  const M = D.match; if (!M || !$("#tdStage")) return false;
  if (/^[1-6]$/.test(e.key)) { togglePlace(+e.key - 1); return true; }
  if (e.key === "Escape") { if (Bd.placing != null || Bd.selected) { Bd.setPlacing(null); Bd.select(null); return true; } return false; }
  const k = e.key.toLowerCase();
  if (k === "u" && Bd.selected) { upgradeSel($("#tdUp")); return true; }
  if (k === "r" && Bd.selected && Bd.selected.s.gate) { releaseSel($("#tdRel")); return true; }
  if (k === "n") { callNext(); return true; }
  if (k === "s") { cycleSpeed(); return true; }
  if (k === "p") { togglePause(); return true; }
  return false;
};
// the saved team on the world's platforms from the start (the world is built before this file runs)
syncPads();
})();
