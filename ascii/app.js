// soju.gg/ascii — the asciiwizard page.
// The hero terminal runs the newest scene live, with the very same engine/ascii.js and scenes/<scene>.js the reel
// is made from. The photo layers move with the pointer only (no scroll-linked motion in the hero).
import { render, RAMP } from "./engine/ascii.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch = matchMedia("(hover: none)").matches;
if (reduce) document.documentElement.classList.add("no-motion");

const hero = $("#hero");
let REELS = [];
let sel = null;

// ---------------------------------------------------------------- parallax: the pointer slides the layers
{
  let tx = 0, ty = 0, mx = 0, my = 0, visible = true;
  if (!reduce) {
    addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = hero.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { tx = ty = 0; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    const t0 = performance.now();
    const frame = (now) => {
      if (visible && !document.hidden) {
        if (touch) {                                    // phones: a very slow, seamless idle drift (40 s loop)
          const p = ((now - t0) / 40000) * Math.PI * 2;
          tx = 0.85 * Math.sin(p); ty = 0.5 * Math.sin(p * 2);
        }
        mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;  // eased, like the dashboard
        hero.style.setProperty("--mx", mx.toFixed(4));
        hero.style.setProperty("--my", my.toFixed(4));
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

// ---------------------------------------------------------------- header + reveals
const topbar = $("#top");
const onScroll = () => topbar.classList.toggle("scrolled", scrollY > 30);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

function observeReveals() {
  const els = document.querySelectorAll("[data-reveal]:not(.in)");
  if (reduce || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  els.forEach((el) => io.observe(el));
}

// ---------------------------------------------------------------- the live terminal
const ink = [];                                         // sparse twinkling stars in the empty cells
{
  let s = 7; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 70; i++) ink.push([r(), r() * 0.86, r(), 1 + Math.floor(r() * 3)]);
}

async function startLive(reel) {
  const canvas = $("#live-canvas"), boot = $("#term-boot");
  $("#term-file").textContent = `~/asciiwizard/${reel.scene}.js`;
  $("#term-cmd").textContent = `$ node ${reel.scene}.js`;
  const countEl = $("#term-count"), statEl = $("#term-stat");
  let sc;
  try { sc = await import(`./${reel.file}`); }
  catch (e) { boot.textContent = "could not load the scene"; console.error(e); return; }
  await new Promise((r) => setTimeout(r, 30));          // let the first paint happen before the heavy build
  const cloud = sc.build();
  const D = sc.meta.duration;
  const ctx = canvas.getContext("2d");
  const small = document.createElement("canvas"), sctx = small.getContext("2d");
  const CELL = [9, 16];
  let cols = 64, rows = 26, dpr = 1, scale = 1;

  function fit() {                                      // cols/rows follow the window width so letters stay readable
    const w = canvas.parentElement.clientWidth || 560;
    cols = Math.max(80, Math.min(124, Math.round(w / 3.7)));
    rows = Math.round(cols * 0.4);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(((w * rows * CELL[1]) / (cols * CELL[0])) * dpr);
    canvas.style.aspectRatio = `${cols * CELL[0]} / ${rows * CELL[1]}`;
    scale = canvas.width / (cols * CELL[0]);
    small.width = Math.ceil(canvas.width / 6); small.height = Math.ceil(canvas.height / 6);
  }
  fit();
  let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(fit, 120); });
  await (document.fonts ? document.fonts.load('600 15px "IBM Plex Mono"').catch(() => {}) : 0);

  const draw = (t) => {
    const v = { ...sc.view(t) };
    v.focal *= Math.min(1.95, 1.45 * canvas.width / canvas.height); v.horizon = 0.5;                                     // the reel is 9:16, this window is wider: fill it
    const g = render(cloud, v, cols, rows, CELL, sc.extras ? sc.extras(t) : []);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.font = '600 15px "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    const dusk = v.dusk ?? 0.5;
    for (const [x, y, ph, cyc] of ink) {                // stars, only where the model is not
      const c = Math.floor(x * cols), r = Math.floor(y * rows);
      if (g.ch[r * cols + c]) continue;
      const tw = 0.5 + 0.5 * Math.sin(6.2832 * (cyc * t / D + ph));
      const b = (0.25 + 0.75 * dusk) * (0.35 + 0.65 * tw), val = Math.round(210 * b);
      ctx.fillStyle = `rgb(${val},${val},${Math.min(255, Math.round(val * 1.15))})`;
      ctx.fillText(RAMP[tw < 0.55 ? 1 : tw < 0.9 ? 8 : 9], c * CELL[0] + CELL[0] / 2, r * CELL[1] + 15);
    }
    const glows = [];
    for (let r = 0, k = 0; r < rows; r++) {
      const y = r * CELL[1] + 15;
      for (let c = 0; c < cols; c++, k++) {
        const ch = g.ch[k]; if (!ch) continue;
        ctx.fillStyle = `rgb(${g.rgb[3 * k]},${g.rgb[3 * k + 1]},${g.rgb[3 * k + 2]})`;
        ctx.fillText(RAMP[ch], c * CELL[0] + CELL[0] / 2, y);
        if (g.glow[k]) glows.push(k);
      }
    }
    ctx.globalCompositeOperation = "lighter";           // bloom on the lights
    for (const k of glows) {
      const cx = (k % cols) * CELL[0] + CELL[0] / 2, cy = Math.floor(k / cols) * CELL[1] + CELL[1] / 2;
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 9);
      const r = g.rgb[3 * k], gg = g.rgb[3 * k + 1], b = g.rgb[3 * k + 2];
      rg.addColorStop(0, `rgba(${r},${gg},${b},.6)`); rg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      ctx.fillStyle = rg; ctx.fillRect(cx - 9, cy - 9, 18, 18);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);                 // and a soft glow on everything, as in the reel
    sctx.clearRect(0, 0, small.width, small.height);
    sctx.drawImage(canvas, 0, 0, small.width, small.height);
    ctx.globalAlpha = 0.22;
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    countEl.textContent = `${g.letters.toLocaleString("en-US")} letters`;
    return v;
  };

  // 30 fps at most; stops when the terminal is off-screen or the tab is hidden
  let on = true, last = 0, frames = 0, fpsT = performance.now(), fps = 30, tm = 0, prev = performance.now();
  new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe($("#term"));
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!on || document.hidden) { prev = now; return; }
    if (now - last < 1000 / 30 - 2) return;
    last = now;
    if (!reduce) tm += Math.min(0.1, (now - prev) / 1000);   // time only runs while it is on screen
    prev = now;
    const v = draw(reduce ? D * 0.17 : tm % D);
    frames++;
    if (now - fpsT > 1000) { fps = Math.round((frames * 1000) / (now - fpsT)); frames = 0; fpsT = now; }
    statEl.textContent = `yaw ${(((-v.yaw * 180) / Math.PI) % 360 + 360) % 360 | 0}°  ${reduce ? "paused" : fps + " fps"}`;
  };
  draw(reduce ? D * 0.17 : 0);
  boot.classList.add("gone");
  requestAnimationFrame(loop);
  window.__live = { get fps() { return fps; }, get letters() { return countEl.textContent; } };
}

// ---------------------------------------------------------------- code highlighting (the reel's own palette)
const KW = "const|let|for|of|return|export|import|from|function|new|if|else|class|this|Math|extends|static|get|set|async|await|null|true|false|typeof|while|break|continue|in|throw|undefined";
const TOK = new RegExp(`(\\/\\/.*)|("[^"]*"|'[^']*'|\`[^\`]*\`)|(\\d+\\.?\\d*)|\\b(${KW})\\b|([A-Za-z_$][\\w$]*)(?=\\()|(\\s+|[A-Za-z_$][\\w$]*|.)`, "g");
function highlight(src) {
  const lines = src.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  return lines.map((ln) => {
    let out = "";
    TOK.lastIndex = 0;
    for (const m of ln.matchAll(TOK)) {
      const cls = m[1] ? "com" : m[2] ? "str" : m[3] ? "tn" : m[4] ? "kw" : m[5] ? "fn" : "";
      out += cls ? `<span class="${cls}">${esc(m[0])}</span>` : esc(m[0]);
    }
    return `<span class="l">${out || " "}</span>`;
  }).join("");
}

// ---------------------------------------------------------------- reels + code
const fileText = new Map();
async function getText(path) {
  if (!fileText.has(path)) fileText.set(path, fetch(path).then((r) => { if (!r.ok) throw new Error(path); return r.text(); }));
  return fileText.get(path);
}
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function renderCards() {
  $("#cards").innerHTML = REELS.map((r, i) => `
    <article class="card${r === sel ? " sel" : ""}" data-id="${esc(r.id)}">
      <button class="pick" type="button" aria-pressed="${r === sel}" aria-label="Show the code of ${esc(r.title)}">
        <span class="cover">${r.cover ? `<img src="${esc(r.cover)}" alt="Cover of the reel ${esc(r.title)}" width="360" height="640" loading="lazy">` : `<span class="none">no cover yet</span>`}
          ${i === 0 ? `<span class="tag">newest</span>` : ""}</span>
        <span class="cap"><b>${esc(r.title)}</b><i>${esc(r.sub)}</i></span>
      </button>
      <div class="card-foot">
        <span>${r.posted ? esc(fmtDate(r.posted)) : "not posted yet"}</span>
        ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">Watch on Instagram</a>` : `<span class="soon">coming soon</span>`}
      </div>
    </article>`).join("");
  if (REELS.length < 3) $("#cards").insertAdjacentHTML("beforeend", `<article class="card next" aria-label="The next reel is on its way"><span class="cover"><span class="none">next reel<br>coming soon<br><i class="blink">_</i></span></span><span class="cap"><b>What's next?</b><i>A new model, drawn in letters</i></span></article>`);
  document.querySelectorAll(".card .pick").forEach((b) => b.addEventListener("click", () => {
    select(REELS.find((r) => r.id === b.closest(".card").dataset.id), true);
  }));
}

let tabFiles = [], tabIdx = 0, curText = "";
async function select(reel, scroll) {
  sel = reel;
  document.querySelectorAll(".card:not(.next)").forEach((c) => {
    const on = c.dataset.id === reel.id;
    c.classList.toggle("sel", on); c.querySelector(".pick").setAttribute("aria-pressed", on);
  });
  tabFiles = [{ name: `${reel.scene}.js`, path: reel.file }, { name: "ascii.js", path: "engine/ascii.js" }];
  $("#tabs").innerHTML = tabFiles.map((f, i) => `<button class="tab" role="tab" type="button" aria-selected="${i === 0}" data-i="${i}">${esc(f.name)}</button>`).join("");
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => showTab(+b.dataset.i)));
  $("#code-sub").textContent = `${reel.title}: ${reel.sub}. Two files make the picture.`;
  $("#zip-btn").href = reel.zip; $("#zip-btn").setAttribute("download", `asciiwizard-${reel.scene}.zip`);
  $("#runhtml-btn").href = `run-${reel.scene}.html`;
  $("#runlive-btn").href = `run.html?scene=${encodeURIComponent(reel.scene)}`;
  $("#run-f1").textContent = `${reel.scene}.js`;
  await showTab(0);
  if (scroll) $("#code").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

async function showTab(i) {
  tabIdx = i;
  document.querySelectorAll(".tab").forEach((b, j) => b.setAttribute("aria-selected", j === i));
  const f = tabFiles[i], dl = $("#dl-btn");
  dl.href = f.path; dl.setAttribute("download", f.name);
  try {
    curText = await getText(f.path);
  } catch (e) { $("#code-pre").textContent = "Could not load " + f.path; return; }
  if (tabIdx !== i) return;
  $("#code-pre").innerHTML = highlight(curText);
  $("#code-scroll").scrollTo(0, 0);
  const n = curText.replace(/\n$/, "").split("\n").length;
  $("#code-foot").textContent = `${f.path} · ${n} lines · ${(new Blob([curText]).size / 1024).toFixed(1)} KB`;
}

$("#copy-btn").addEventListener("click", async () => {
  const b = $("#copy-btn"), lab = $("span", b);
  let ok = false;
  try { await navigator.clipboard.writeText(curText); ok = true; }
  catch (e) {
    const ta = document.createElement("textarea"); ta.value = curText; ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand("copy"); } catch (e2) { /* ignore */ }
    ta.remove();
  }
  lab.textContent = ok ? "Copied" : "Copy failed"; b.classList.toggle("ok", ok);
  $("#code-foot").textContent = ok ? `Copied ${tabFiles[tabIdx].name} (${curText.length.toLocaleString("en-US")} characters)` : "Select the code and copy it by hand";
  setTimeout(() => { lab.textContent = "Copy"; b.classList.remove("ok"); }, 1800);
});

async function init() {
  observeReveals();
  let data;
  try { data = await (await fetch("reels.json", { cache: "no-cache" })).json(); }
  catch (e) { $("#term-boot").textContent = "could not load the reels"; console.error(e); return; }
  REELS = data.reels;
  if (!REELS.length) return;
  sel = REELS[0];
  renderCards();
  await select(sel, false);
  startLive(REELS[0]).catch((e) => console.error(e));
}
init();
