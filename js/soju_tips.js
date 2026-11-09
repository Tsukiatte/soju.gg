/* Our own tooltips (3 Nov, owner: "make the hover tooltips custom instead of the native browser ones"). Anything with a title gets this
   instead of the browser's: the title is lifted off while the pointer is on it, so the browser never shows its own, and put back after.
   On a touch screen, press and hold. "Name: what it does" shows the name in gold over the rest. */
(function () {
const tip = document.createElement('div'); tip.className = 'sj-tip'; tip.hidden = true;
let on = null, timer = 0, raf = 0, lastHide = 0, holdT = 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function fill(text) {
  // a short name before a colon or a full stop, with no numbers in it, is a heading; a whole sentence stays a sentence
  const m = text.match(/^([^:.\d]{1,26})[:.] (.+)$/);
  tip.innerHTML = m ? `<b>${esc(m[1])}</b><span>${esc(m[2])}</span>` : text.length <= 26 ? `<b>${esc(text)}</b>` : `<span>${esc(text)}</span>`;
}
function place() {
  const r = on.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, above = r.top - h - 9 >= 6;
  tip.classList.toggle('below', !above);
  const x = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2));
  tip.style.left = x + 'px'; tip.style.top = (above ? r.top - h - 9 : r.bottom + 9) + 'px';
  tip.style.setProperty('--ax', Math.max(10, Math.min(w - 10, r.left + r.width / 2 - x)) + 'px');
}
const lift = el => { if (el.hasAttribute('title')) { el.dataset.tip = el.getAttribute('title'); el.removeAttribute('title'); } };
function watch() {
  if (!on) return;
  // a repaint can take it away, or write it a new title, while the pointer rests on it
  if (!on.isConnected) { hide(); return; }
  if (on.hasAttribute('title')) { lift(on); if (!tip.hidden) { fill(on.dataset.tip); place(); } }
  raf = requestAnimationFrame(watch);
}
function show(el, delay) {
  hide(true);
  on = el; lift(el);
  timer = setTimeout(() => {
    if (on !== el || !el.isConnected) return;
    if (!tip.isConnected) document.body.appendChild(tip);
    fill(el.dataset.tip);
    tip.hidden = false;
    place();
    tip.classList.remove('in'); void tip.offsetWidth; tip.classList.add('in');
    lastHide = 0;
  }, delay);
  raf = requestAnimationFrame(watch);
}
function hide(quiet) {
  clearTimeout(timer); cancelAnimationFrame(raf);
  if (!tip.hidden && !quiet) lastHide = performance.now();
  tip.hidden = true;
  if (on) { if (!on.hasAttribute('title') && on.dataset.tip != null) on.setAttribute('title', on.dataset.tip); delete on.dataset.tip; on = null; }
}
const target = e => (e.target && e.target.closest ? e.target.closest('[title],[data-tip]') : null);
document.addEventListener('pointerover', e => {
  if (e.pointerType === 'touch' || e.buttons) return;
  const el = target(e);
  if (el === on) return;
  if (!el) { hide(); return; }
  // moving along a row of icons, the next one answers at once
  show(el, performance.now() - lastHide < 350 || !tip.hidden ? 0 : 160);
});
document.addEventListener('pointerout', e => { if (on && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[title],[data-tip]') === on)) hide(); });
document.addEventListener('pointerdown', e => {
  hide(true);
  if (e.pointerType === 'touch') { const el = target(e); if (el) holdT = setTimeout(() => show(el, 0), 420); }
}, true);
for (const t of ['pointerup', 'pointercancel']) document.addEventListener(t, e => { clearTimeout(holdT); if (e.pointerType === 'touch') hide(true); }, true);
document.addEventListener('wheel', () => hide(true), { passive: true, capture: true });
addEventListener('blur', () => hide(true));
window.AF.tips = { hide };
})();
