/* Vlog progress: loads status.json (same folder) now and every 30 s, and draws it.
   Every piece of text from the file goes in with textContent, never as HTML. A region is only redrawn when its
   data changed, so a refresh that brings nothing new does not touch the page. */
(() => {
  'use strict';

  const STATUS_URL = 'status.json';
  const POLL_MS = 30000;
  const AGE_TICK_MS = 15000;
  const FETCH_TIMEOUT_MS = 15000;
  const STALE_MIN = 20;
  const MAX_LOG = 30;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const $ = (s) => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- small helpers ----------
  const str = (v) => (typeof v === 'string' ? v : typeof v === 'number' && isFinite(v) ? String(v) : '');
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
  const objs = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) : []);
  const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== '') e.textContent = text;
    return e;
  }

  const ICONS = {
    check: 'M5 12.5l4.5 4.5L19 7.5',
    x: 'M6 6l12 12M18 6L6 18',
    dash: 'M7 12h10',
    play: 'M9 6.5l8 5.5-8 5.5z',
    dot: 'M12 12h.01',
  };
  function icon(name) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', ICONS[name] || ICONS.dot);
    svg.appendChild(p);
    return svg;
  }

  function mss(sec) {
    const s = Math.max(0, Math.round(sec));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    const two = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${two(m)}:${two(r)}` : `${m}:${two(r)}`;
  }

  function ago(ms) {
    const min = Math.floor(Math.max(0, ms) / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min} min ago`;
    const h = Math.floor(min / 60), m = min % 60;
    if (h < 24) return m ? `${h} h ${m} min ago` : `${h} h ago`;
    const d = Math.floor(h / 24);
    return `${d} d ago`;
  }

  // ---------- the data contract, tolerant ----------
  function normalise(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('status.json is not an object');
    const pct = num(d.overall_pct);
    return {
      updated: str(d.updated),
      title: str(d.title) || 'Vlog progress',
      headline: str(d.headline),
      pct: pct == null ? null : Math.min(100, Math.max(0, pct)),
      phase: str(d.phase),
      steps: objs(d.steps).map((s) => ({ name: str(s.name), state: str(s.state).toLowerCase(), detail: str(s.detail) })),
      sections: objs(d.sections).map((s) => ({
        id: str(s.id), name: str(s.name), state: str(s.state).toLowerCase(), detail: str(s.detail), seconds: num(s.seconds),
      })),
      workers: objs(d.workers).map((w) => ({ name: str(w.name), state: str(w.state).toLowerCase(), detail: str(w.detail) })),
      log: objs(d.log).slice(0, MAX_LOG).map((l) => ({ t: str(l.t), msg: str(l.msg) })),
    };
  }

  // ---------- state vocabularies ----------
  const STEP_STATES = {
    done: { tone: 'good', icon: 'check' },
    active: { tone: 'watch', icon: 'play' },
    pending: { tone: 'idle', icon: 'dash' },
    failed: { tone: 'bad', icon: 'x' },
  };
  const SECTION_LABEL = { pending: 'Pending', building: 'Building', rendered: 'Rendered', reviewed: 'Reviewed', gap: 'Interview gap' };
  const WORKER_STICKER = { running: 'gold', done: 'mint', failed: 'pink', queued: 'sky' };
  const WORKER_LABEL = { running: 'Running', done: 'Done', failed: 'Failed', queued: 'Queued' };
  const known = (table, key) => Object.prototype.hasOwnProperty.call(table, key);

  // ---------- drawing, region by region ----------
  const seen = Object.create(null);
  function region(key, value, draw) {
    const sig = JSON.stringify(value);
    if (seen[key] === sig) return;
    seen[key] = sig;
    draw();
  }

  function drawSteps(steps) {
    const ul = $('#steps');
    if (!steps.length) { ul.replaceChildren(el('li', 'empty', 'No steps reported yet.')); return; }
    ul.replaceChildren(...steps.map((s) => {
      const st = known(STEP_STATES, s.state) ? STEP_STATES[s.state] : { tone: 'idle', icon: 'dot' };
      const li = el('li', known(STEP_STATES, s.state) ? s.state : 'unknown');
      const tone = el('span', 'tone ' + st.tone);
      tone.appendChild(icon(st.icon));
      const who = el('div', 'who');
      who.appendChild(el('b', '', s.name || 'Step'));
      if (s.detail) who.appendChild(el('span', 'muted', s.detail));
      if (!known(STEP_STATES, s.state) && s.state) who.appendChild(el('span', 'muted', clip(s.state, 24)));
      li.append(tone, who);
      return li;
    }));
  }

  function drawSections(sections) {
    const ul = $('#sections');
    if (!sections.length) { ul.replaceChildren(el('li', 'empty', 'No sections yet.')); return; }
    ul.replaceChildren(...sections.map((s) => {
      const ok = known(SECTION_LABEL, s.state);
      const li = el('li', ok ? s.state : 'unknown');
      const who = el('div', 'who');
      const line = el('b');
      if (s.id) line.appendChild(el('span', 'sid', s.id));
      line.appendChild(document.createTextNode(s.name || 'Section'));
      who.appendChild(line);
      if (s.detail) who.appendChild(el('span', 'muted', s.detail));
      const side = el('div', 'side');
      side.appendChild(el('span', 'pill-k ' + (ok ? s.state : 'unknown'), ok ? SECTION_LABEL[s.state] : clip(s.state || 'unknown', 18)));
      side.appendChild(el('span', 'dur', s.seconds == null ? '' : mss(s.seconds)));
      li.append(who, side);
      return li;
    }));
  }

  function drawWorkers(workers) {
    const ul = $('#workers');
    if (!workers.length) { ul.replaceChildren(el('li', 'empty', 'No workers reported.')); return; }
    const rot = [-1.6, 1.2, -.8, 1.8, -1.2, .9];
    ul.replaceChildren(...workers.map((w, i) => {
      const ok = known(WORKER_STICKER, w.state);
      const li = el('li', 'sticker ' + (ok ? WORKER_STICKER[w.state] + ' ' + w.state : 'plain'));
      li.style.setProperty('--r', rot[i % rot.length] + 'deg');
      li.appendChild(el('b', '', w.name || 'Worker'));
      li.appendChild(el('span', '', ok ? WORKER_LABEL[w.state] : clip(w.state || 'unknown', 18)));
      if (w.detail) li.appendChild(el('small', '', w.detail));
      return li;
    }));
  }

  function drawLog(log) {
    const ul = $('#log');
    if (!log.length) { ul.replaceChildren(el('li', 'empty', 'Nothing logged yet.')); return; }
    ul.replaceChildren(...log.map((l) => {
      const li = el('li');
      li.append(el('span', 't', l.t), el('span', 'm', l.msg));
      return li;
    }));
  }

  function draw(d) {
    region('head', [d.title, d.headline], () => {
      $('#title').textContent = d.title;
      $('#headline').textContent = d.headline || ' ';
      $('#headline').hidden = !d.headline;
    });
    region('overall', [d.pct, d.phase], () => {
      const meter = $('#meter');
      $('#pct').textContent = d.pct == null ? '–' : Math.round(d.pct) + '%';
      $('#phase').textContent = d.phase || ' ';
      $('#pbar').style.width = (d.pct == null ? 0 : d.pct) + '%';
      if (d.pct == null) meter.removeAttribute('aria-valuenow'); else meter.setAttribute('aria-valuenow', String(Math.round(d.pct)));
      if (d.phase) meter.setAttribute('aria-valuetext', Math.round(d.pct || 0) + '%, ' + d.phase); else meter.removeAttribute('aria-valuetext');
    });

    const rendered = d.sections.filter((s) => (s.state === 'rendered' || s.state === 'reviewed') && s.seconds != null)
      .reduce((a, s) => a + s.seconds, 0);
    const planned = d.sections.filter((s) => s.seconds != null).reduce((a, s) => a + s.seconds, 0);
    const doneCount = d.sections.filter((s) => s.state === 'rendered' || s.state === 'reviewed').length;
    const gaps = d.sections.filter((s) => s.state === 'gap').length;
    region('kpis', [rendered, planned, doneCount, d.sections.length, gaps], () => {
      $('#k-rendered').textContent = mss(rendered);
      $('#k-rendered-sub').textContent = planned > rendered ? `of ${mss(planned)} planned` : 'rendered runtime';
      $('#k-sections').textContent = `${doneCount} / ${d.sections.length}`;
      $('#k-sections-sub').textContent = gaps ? `${gaps} interview gap${gaps === 1 ? '' : 's'}` : 'rendered or reviewed';
    });

    region('steps', d.steps, () => drawSteps(d.steps));
    region('sections', d.sections, () => drawSections(d.sections));
    region('workers', d.workers, () => drawWorkers(d.workers));
    region('log', d.log, () => drawLog(d.log));
  }

  // ---------- freshness ----------
  let current = null;       // the last good, normalised data
  let offline = false;

  function drawAge() {
    const live = $('#live'), text = $('#live-text'), stale = $('#b-stale'), off = $('#b-offline'), foot = $('#updated');
    off.hidden = !(offline && current);
    if (offline && current) off.textContent = 'Offline: can’t reach the status file right now. Showing the last data that loaded.';
    if (!current) {
      live.className = 'live' + (offline ? ' bad' : '');
      text.textContent = offline ? 'Offline' : 'Loading…';
      stale.hidden = true;
      if (offline) foot.textContent = 'Can’t load the status yet. Trying again every 30 seconds.';
      return;
    }
    const t = Date.parse(current.updated);
    if (!isFinite(t)) {
      live.className = 'live stale';
      text.textContent = 'No update time';
      stale.hidden = false;
      stale.textContent = 'The status has no readable update time, so it can’t be checked for freshness.';
      foot.textContent = 'Update time unknown.';
      return;
    }
    const age = Date.now() - t;
    const isStale = age > STALE_MIN * 60000;
    live.className = 'live' + (offline ? ' bad' : isStale ? ' stale' : '');
    text.textContent = offline ? 'Offline · ' + ago(age) : (isStale ? 'Stale · ' : 'Updated ') + ago(age);
    stale.hidden = !isStale;
    if (isStale) stale.textContent = `No update for ${ago(age).replace(' ago', '')}. The numbers below may be out of date.`;
    foot.textContent = 'Last update ' + new Date(t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) + ' · ' + ago(age);
  }

  // ---------- fetching ----------
  let inflight = false, timer = 0;
  async function load() {
    if (inflight) return;
    inflight = true;
    clearTimeout(timer);
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const killer = ctl ? setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS) : 0;
    try {
      const res = await fetch(`${STATUS_URL}?t=${Date.now()}`, { cache: 'no-store', signal: ctl ? ctl.signal : undefined });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = normalise(await res.json());
      current = data;
      offline = false;
      draw(data);
    } catch (err) {
      offline = true;
      if (!current) $('#headline').textContent = 'Can’t load the status yet. Trying again…';
    } finally {
      clearTimeout(killer);
      inflight = false;
      drawAge();
      timer = setTimeout(load, POLL_MS);
    }
  }

  // ---------- page chrome ----------
  const top = $('#top');
  const onScroll = () => top.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const tapes = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    tapes.forEach((e) => e.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
    tapes.forEach((e) => io.observe(e));
  }

  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
  addEventListener('online', load);
  setInterval(drawAge, AGE_TICK_MS);
  load();
})();
