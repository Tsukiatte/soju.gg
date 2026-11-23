// soju.gg/story: copy buttons, and "Save to Photos" through the phone's share sheet.
(() => {
  // ---- copy caption / comment
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const label = btn.querySelector('.label');
    const idle = label.textContent;
    let timer = 0;
    btn.addEventListener('click', async () => {
      const src = document.getElementById(btn.dataset.copy);
      const ok = await copyText(src.dataset.text || src.innerText);
      label.textContent = ok ? 'Copied' : 'Press and hold the text to copy it';
      btn.classList.toggle('done', ok);
      clearTimeout(timer);
      timer = setTimeout(() => { label.textContent = idle; btn.classList.remove('done'); }, 2400);
    });
  });

  // ---- save a file to Photos (or straight into Instagram) with the share sheet
  const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  function canShareFile(name, type) {
    try {
      return typeof File === 'function' && !!navigator.canShare &&
        navigator.canShare({ files: [new File([new Blob(['x'], { type })], name, { type })] });
    } catch (e) {
      return false;
    }
  }

  async function fetchFile(url, name, type, bytes, onProgress) {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const total = Number(res.headers.get('content-length')) || bytes || 0;
    if (!res.body || !res.body.getReader) {
      const blob = await res.blob();
      return new File([blob], name, { type });
    }
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      got += value.length;
      if (total) onProgress(Math.min(100, Math.round((got / total) * 100)));
    }
    return new File(chunks, name, { type });
  }

  document.querySelectorAll('[data-save]').forEach((btn) => {
    const url = btn.dataset.save;
    const name = btn.dataset.name;
    const type = btn.dataset.type || 'video/mp4';
    const bytes = Number(btn.dataset.bytes) || 0;
    if (!coarse || !canShareFile(name, type)) return;      // desktops keep the plain download button

    const label = btn.querySelector('.label');
    const bar = btn.querySelector('.bar i');
    const idle = label.textContent;
    const group = btn.closest('[data-group]');
    btn.hidden = false;
    if (group) {
      group.querySelectorAll('[data-fallback]').forEach((a) => a.classList.remove('primary'));
      const tip = group.parentElement.querySelector('[data-tip-share]');
      if (tip) tip.hidden = false;
      const tipDl = group.parentElement.querySelector('[data-tip-download]');
      if (tipDl) tipDl.hidden = true;
    }

    let file = null;
    let busy = false;
    const ready = () => {
      btn.classList.remove('loading');
      btn.classList.add('ready');
      label.textContent = btn.dataset.readyLabel || 'Ready: tap to save';
    };

    async function load() {
      busy = true;
      btn.classList.add('loading');
      try {
        file = await fetchFile(url, name, type, bytes, (p) => {
          bar.style.width = p + '%';
          label.textContent = 'Getting it… ' + p + '%';
        });
        ready();
      } catch (e) {
        btn.classList.remove('loading');
        label.textContent = 'Could not load it. Tap to retry';
      }
      busy = false;
    }

    // small files (the cover) are fetched straight away, so one tap opens the share sheet
    if (bytes && bytes < 2.5e6) {
      load().then(() => { if (file) { btn.classList.remove('ready'); label.textContent = idle; } });
    }

    btn.addEventListener('click', async () => {
      if (busy) return;
      if (!file) { await load(); return; }
      try {
        await navigator.share({ files: [file] });
      } catch (e) {
        if (e && e.name !== 'AbortError') label.textContent = 'Share did not open. Use Download below';
      }
    });
  });
})();
