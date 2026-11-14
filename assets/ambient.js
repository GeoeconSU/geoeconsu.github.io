/* Ambient background and pointer for the GSU homepage. No dependencies.
   - A fixed canvas holds a quiet grid of dots. Near the pointer the dots light up, drift apart and
     link into a faint mesh; the light trails behind the pointer and fades. Clicks send a ring through
     the grid. Left alone, single dots surface and sink at random.
   - On devices with a mouse the pointer becomes a silver arrow with a soft halo that trails it.
   Reduced-motion: a still grid, the native pointer, nothing else. */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cv = document.createElement('canvas');
  cv.id = 'ambient'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');

  const GAP = fine ? 34 : 44, LEVELS = 8, R = 210;
  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, n = 0;
  let energy, offX, offY, phase, speedF;              /* per-dot state */
  const ptr = { x: -9999, y: -9999, sx: -9999, sy: -9999, v: 0, seen: false, last: 0 };
  const ripples = [];
  let glow;                                            /* pre-rendered light sprite: no per-frame gradients */

  function makeGlow() {
    glow = document.createElement('canvas'); glow.width = glow.height = 560;
    const g = glow.getContext('2d'), rg = g.createRadialGradient(280, 280, 0, 280, 280, 280);
    rg.addColorStop(0, 'rgba(206,182,128,.16)'); rg.addColorStop(.45, 'rgba(160,172,205,.06)'); rg.addColorStop(1, 'rgba(160,172,205,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 560, 560);
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / GAP) + 2; rows = Math.ceil(H / GAP) + 3; n = cols * rows;
    energy = new Float32Array(n); offX = new Float32Array(n); offY = new Float32Array(n);
    phase = new Float32Array(n); speedF = new Float32Array(n);
    for (let i = 0; i < n; i++) { phase[i] = Math.random() * Math.PI * 2; speedF[i] = .25 + Math.random() * .5; }
    if (reduced) drawStill();
  }
  function drawStill() {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = 'rgba(200,208,228,.07)'; ctx.beginPath();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = c * GAP, y = r * GAP; ctx.moveTo(x + 1, y); ctx.arc(x, y, 1, 0, 6.2832); }
    ctx.fill();
  }

  /* eight batches from cool silver (quiet) to warm gold (lit): one path and one fill per batch */
  const COL = [];
  for (let k = 0; k < LEVELS; k++) {
    const t = k / (LEVELS - 1), a = .06 + t * .74;
    COL.push(`rgba(${Math.round(196 + 36 * t)},${Math.round(206 + 0 * t)},${Math.round(228 - 84 * t)},${a.toFixed(3)})`);
  }
  const bx = [], by = [], br = [];
  for (let k = 0; k < LEVELS; k++) { bx.push([]); by.push([]); br.push([]); }

  let raf = 0, tPrev = 0, frame = 0;
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(50, now - (tPrev || now)); tPrev = now; frame++;
    const idle = now - ptr.last > 2500 && !ripples.length;
    if (idle && frame % 2) return;                      /* nothing under the hand: half rate is plenty */
    const k = dt / 16.67, time = now * .001;

    /* smoothed pointer and how fast it is moving */
    if (ptr.seen) {
      const px = ptr.sx, py = ptr.sy;
      ptr.sx += (ptr.x - ptr.sx) * Math.min(1, .16 * k); ptr.sy += (ptr.y - ptr.sy) * Math.min(1, .16 * k);
      const sp = Math.hypot(ptr.sx - px, ptr.sy - py);
      ptr.v += (Math.min(sp, 40) - ptr.v) * .12;
    }
    for (let i = ripples.length - 1; i >= 0; i--) { ripples[i].r += 7.5 * k; ripples[i].s *= Math.pow(.972, k); if (ripples[i].s < .03) ripples.splice(i, 1); }

    const drift = (window.scrollY * .12) % GAP;        /* the grid slips a little as the page scrolls */
    const reach = R + ptr.v * 3, decay = Math.pow(.945, k), spring = Math.min(1, .14 * k);
    for (let b = 0; b < LEVELS; b++) { bx[b].length = 0; by[b].length = 0; br[b].length = 0; }
    ctx.clearRect(0, 0, W, H);
    if (ptr.seen) ctx.drawImage(glow, Math.round(ptr.sx - 280), Math.round(ptr.sy - 280));

    /* mesh between lit neighbours, drawn first so dots sit on top */
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(214,190,138,.11)'; ctx.beginPath();
    let i = 0;
    for (let r = 0; r < rows; r++) {
      const gy = r * GAP - drift;
      for (let c = 0; c < cols; c++, i++) {
        const gx = c * GAP;
        let target = 0, tx = 0, ty = 0;
        if (ptr.seen) {
          const dx = gx - ptr.sx, dy = gy - ptr.sy, d = Math.hypot(dx, dy);
          if (d < reach) {
            const f = 1 - d / reach, s = f * f * (3 - 2 * f);
            target = s * (.5 + Math.min(ptr.v / 22, .5));
            if (d > .01) { const push = s * (10 + ptr.v * .5); tx = dx / d * push; ty = dy / d * push; }
          }
        }
        for (let q = 0; q < ripples.length; q++) {
          const rp = ripples[q], d = Math.hypot(gx - rp.x, gy - rp.y) - rp.r;
          if (d > -60 && d < 60) target = Math.max(target, Math.exp(-(d * d) / 900) * rp.s);
        }
        let e = energy[i] * decay; if (target > e) e += (target - e) * .5; energy[i] = e;
        offX[i] += (tx - offX[i]) * spring; offY[i] += (ty - offY[i]) * spring;
        const tw = Math.pow(Math.max(0, Math.sin(time * speedF[i] + phase[i])), 14) * .42;   /* a dot surfacing on its own */
        const lit = Math.min(1, e + tw);
        const x = gx + offX[i], y = gy + offY[i];
        const b = Math.min(LEVELS - 1, (lit * LEVELS) | 0);
        bx[b].push(x); by[b].push(y); br[b].push(1 + e * 1.9 + tw * .9);
        if (e > .3) {
          if (c + 1 < cols && energy[i + 1] > .3) { ctx.moveTo(x, y); ctx.lineTo(gx + GAP + offX[i + 1], gy + offY[i + 1]); }
          if (r + 1 < rows && energy[i + cols] > .3) { ctx.moveTo(x, y); ctx.lineTo(gx + offX[i + cols], gy + GAP + offY[i + cols]); }
        }
      }
    }
    ctx.stroke();
    for (let b = 0; b < LEVELS; b++) {
      const xs = bx[b], ys = by[b], rs = br[b]; if (!xs.length) continue;
      ctx.fillStyle = COL[b]; ctx.beginPath();
      for (let j = 0; j < xs.length; j++) { ctx.moveTo(xs[j] + rs[j], ys[j]); ctx.arc(xs[j], ys[j], rs[j], 0, 6.2832); }
      ctx.fill();
    }
    if (halo) {
      hx += (ptr.x - hx) * Math.min(1, .2 * k); hy += (ptr.y - hy) * Math.min(1, .2 * k);
      halo.style.transform = `translate3d(${hx.toFixed(1)}px,${hy.toFixed(1)}px,0)`;
    }
  }
  function start() { if (!raf && !reduced) { tPrev = 0; raf = requestAnimationFrame(tick); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  /* ---- the pointer ---- */
  let cur = null, halo = null, hx = 0, hy = 0;
  function makeCursor() {
    cur = document.createElement('div'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<svg viewBox="0 0 32 32"><defs><linearGradient id="cur-silver" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#ffffff"/><stop offset=".32" stop-color="#d5dae5"/><stop offset=".5" stop-color="#8f97a9"/>' +
      '<stop offset=".62" stop-color="#eef1f6"/><stop offset="1" stop-color="#a3abbc"/></linearGradient></defs>' +
      '<path d="M4 3v21.2l5.7-5.2 4.3 9.6 4.1-1.8-4.2-9.4h7.9z" fill="url(#cur-silver)" stroke="#0a0f1d" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke"/>' +
      '<path d="M6.3 7.6v11.6" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".85" fill="none"/></svg>';
    halo = document.createElement('div'); halo.className = 'cursor-halo'; halo.setAttribute('aria-hidden', 'true');
    document.body.append(halo, cur);
  }
  const LINKS = 'a,button,[role="button"],label,summary,.flow-row,.pillar-list li,.slab,#canvas-container';
  function onMove(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.last = performance.now();
    if (!ptr.seen) { ptr.seen = true; ptr.sx = ptr.x; ptr.sy = ptr.y; hx = ptr.x; hy = ptr.y; if (cur) document.documentElement.classList.add('has-cursor'); }
    if (!cur) return;
    cur.style.transform = `translate3d(${ptr.x - 4}px,${ptr.y - 3}px,0)`;        /* 1:1 with the hand, tip on the hotspot */
    const t = e.target, link = !!(t.closest && t.closest(LINKS)), text = !!(t.closest && t.closest('input,textarea,select'));
    cur.classList.add('on'); halo.classList.add('on');
    cur.classList.toggle('is-link', link); halo.classList.toggle('is-link', link);
    cur.classList.toggle('is-text', text); halo.classList.toggle('is-text', text);
  }

  makeGlow(); resize();
  addEventListener('resize', resize);
  if (!reduced) {
    if (fine) {
      makeCursor();
      addEventListener('pointermove', onMove, { passive: true });
      addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { cur.classList.add('is-down'); halo.classList.add('is-down'); ripples.push({ x: e.clientX, y: e.clientY, r: 0, s: 1 }); ptr.last = performance.now(); } }, { passive: true });
      addEventListener('pointerup', () => { cur.classList.remove('is-down'); halo.classList.remove('is-down'); }, { passive: true });
      document.documentElement.addEventListener('mouseleave', () => { cur.classList.remove('on'); halo.classList.remove('on'); ptr.seen = false; });
    } else {
      addEventListener('pointerdown', e => { ripples.push({ x: e.clientX, y: e.clientY, r: 0, s: .8 }); ptr.last = performance.now(); }, { passive: true });
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }
})();
