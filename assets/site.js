/* GSU homepage behaviour. Everything on the page is readable without this file; it adds motion.
   Needs (all optional): gsap + ScrollTrigger, Lenis, GSUBook (assets/book.js). */
const GATE_WORKER = 'https://gsu-gate.guduruadip.workers.dev';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = matchMedia('(min-width: 901px)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const motion = !!(window.gsap && window.ScrollTrigger) && !reduced;
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.append(e); return e; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const debounce = (fn, ms = 150) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; };
/* run fn once when el first comes into view; independent of pinned sections above it */
function inView(el, fn, margin = '0px 0px -4% 0px') {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } }), { rootMargin: margin });
  io.observe(el);
}

/* ---------- navigation ---------- */
const nav = $('#nav'), menuBtn = $('#menuBtn'), links = $('#navLinks');
menuBtn.addEventListener('click', () => { const o = links.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });
links.addEventListener('click', e => { if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });
let lenis = null;
function goTo(target) { const el = typeof target === 'string' ? $(target) : target; if (!el) return; if (lenis) lenis.scrollTo(el, { offset: -70 }); else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href').length < 2) return; const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); goTo(t); } });

/* ---------- page motion: smooth scroll, headline, reveals ---------- */
function split(el) { el.innerHTML = el.innerHTML.split(/(\s+)/).map(p => (/^\s+$/.test(p) ? ' ' : `<span class="w"><span>${p}</span></span>`)).join(''); return $$('.w > span', el); }
function showAll() { $$('[data-anim],[data-rise]').forEach(e => (e.style.opacity = 1)); $$('.w > span').forEach(e => (e.style.transform = 'none')); }
function pageMotion() {
  if (!motion) { showAll(); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) { lenis = new Lenis({ lerp: .09, smoothWheel: true }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  let lastY = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => { const y = s.scroll(); nav.classList.toggle('solid', y > 80); nav.classList.toggle('hide', y > lastY && y > 400 && !links.classList.contains('open')); lastY = y; } });
  const heroWords = $$('.hero h1 .line').flatMap(l => split(l));
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to(heroWords, { y: 0, duration: 1.1, stagger: .09, delay: .15 })
    .to('.hero [data-rise]', { opacity: 1, y: 0, duration: .9, stagger: .12, startAt: { y: 16 } }, '-=.8');
  gsap.to('#canvas-container', { yPercent: 14, opacity: .25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  $$('main h2').forEach(h => { const ws = split(h); h.classList.add('h2-split'); inView(h, () => gsap.to(ws, { y: 0, duration: .8, ease: 'expo.out', stagger: .05 })); });
  $$('[data-anim]').forEach(el => inView(el, () => {
    const kind = el.dataset.anim, d = parseFloat(el.dataset.delay || 0);
    const from = kind === 'left' ? { x: -60, opacity: 0 } : kind === 'right' ? { x: 60, opacity: 0 } : kind === 'fade' ? { opacity: 0 } : { y: 48, opacity: 0 };
    gsap.fromTo(el, from, { x: 0, y: 0, opacity: 1, duration: .85, delay: d * .7, ease: 'expo.out', clearProps: 'transform' });
  }));
  setTimeout(() => $$('.h2-split .w > span').forEach(e => { if (!gsap.isTweening(e) && e.getBoundingClientRect().top < innerHeight) e.style.transform = 'none'; }), 5000);
}

/* ---------- how we work with you: three lines into one outcome ---------- */
function flowmap() {
  const map = $('#flowmap'); if (!map) return;
  const svg = $('.flow-lines', map), rows = $$('.flow-row', map), goal = $('.flow-goal', map);
  const defs = svgEl('defs', {}, svg);
  const parts = rows.map((row, k) => {
    const grad = svgEl('linearGradient', { id: 'flow-g' + k, gradientUnits: 'userSpaceOnUse', y1: 0, y2: 0 }, defs);
    svgEl('stop', { offset: 0, 'stop-color': '#C2A56D', 'stop-opacity': 0 }, grad); svgEl('stop', { offset: 1, 'stop-color': '#C2A56D', 'stop-opacity': 1 }, grad);
    const path = svgEl('path', { stroke: `url(#flow-g${k})` }, svg);
    const pip = svgEl('circle', { class: 'pip', r: 2.6, opacity: 0 }, svg);
    const land = svgEl('circle', { class: 'land', r: 5 }, svg);
    return { row, grad, path, pip, land, nodes: $$('.flow-track li', row) };
  });
  let drawn = !motion;
  function layout() {
    if (getComputedStyle(svg).display === 'none') return false;
    const m = map.getBoundingClientRect(), g = goal.getBoundingClientRect();
    const cx = g.left - m.left + g.width / 2, cy = g.top - m.top + g.height / 2, ri = (g.width / 2) * .82;
    svg.setAttribute('viewBox', `0 0 ${m.width} ${m.height}`);
    parts.forEach((p, k) => {
      const track = $('.flow-track', p.row).getBoundingClientRect(), node = $('i', p.row).getBoundingClientRect();
      const y = node.top - m.top + node.height / 2, x0 = track.left - m.left - 14, x1 = track.right - m.left;
      const dy = (k - 1) * ri * .3, lx = cx - Math.sqrt(ri * ri - dy * dy), ly = cy + dy, c = (lx - x1) * .55;
      p.d = `M${x0.toFixed(1)} ${y.toFixed(1)}H${x1.toFixed(1)}C${(x1 + c).toFixed(1)} ${y.toFixed(1)} ${(lx - c).toFixed(1)} ${ly.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)}`;
      p.path.setAttribute('d', p.d);
      p.grad.setAttribute('x1', x0); p.grad.setAttribute('x2', x0 + 90);
      p.land.setAttribute('cx', lx); p.land.setAttribute('cy', ly);
      p.len = p.path.getTotalLength();
      p.fracs = p.nodes.map(li => { const n = $('i', li).getBoundingClientRect(); return clamp((n.left - m.left + n.width / 2 - x0) / p.len, 0, 1); });
      p.path.style.strokeDasharray = drawn ? 'none' : p.len; p.path.style.strokeDashoffset = drawn ? 0 : p.len;
      if (p.motion) p.motion.setAttribute('path', p.d);
    });
    return true;
  }
  function pips() {
    parts.forEach((p, k) => {
      p.pip.setAttribute('opacity', 1);
      p.motion = svgEl('animateMotion', { dur: '5.5s', repeatCount: 'indefinite', begin: `${-k * 1.8}s`, path: p.d, calcMode: 'linear' }, p.pip);
      svgEl('animate', { attributeName: 'opacity', values: '0;1;1;0', keyTimes: '0;.08;.9;1', dur: '5.5s', repeatCount: 'indefinite', begin: `${-k * 1.8}s` }, p.pip);
    });
  }
  const relayout = debounce(layout, 120);
  addEventListener('resize', relayout); if (document.fonts) document.fonts.ready.then(layout); addEventListener('load', layout);
  rows.forEach((row, k) => {
    row.addEventListener('mouseenter', () => parts.forEach((p, j) => { p.path.classList.toggle('hot', j === k); p.path.classList.toggle('dim', j !== k); }));
    row.addEventListener('mouseleave', () => parts.forEach(p => p.path.classList.remove('hot', 'dim')));
  });
  if (!layout() || !motion) { drawn = true; layout(); return; }
  /* where along a power2.inOut tween the line reaches a given fraction of its length */
  const when = f => (f < .5 ? Math.sqrt(f / 2) : 1 - Math.sqrt((1 - f) / 2));
  const D = 1.3;
  gsap.set($$('.flow-track i', map), { scale: 0 }); gsap.set($$('.flow-track span', map), { opacity: 0, y: 10 });
  gsap.set(parts.map(p => p.land), { scale: 0, transformOrigin: '50% 50%' });
  gsap.set($$('.flow-head', map), { opacity: 0, x: -28 });
  gsap.set($$('.flow-goal p span, .flow-goal p em', map), { opacity: 0, y: 14 });
  gsap.set($$('.flow-goal .ring-out, .flow-goal .ring-in', map), { strokeDasharray: 1, strokeDashoffset: 1 });
  inView(map, () => {
    layout();
    const tl = gsap.timeline({ onComplete() { drawn = true; parts.forEach(p => (p.path.style.strokeDasharray = 'none')); pips(); } });
    parts.forEach((p, k) => {
      const at = k * .16;
      tl.to($('.flow-head', p.row), { opacity: 1, x: 0, duration: .9, ease: 'expo.out' }, at)
        .to(p.path, { strokeDashoffset: 0, duration: D, ease: 'power2.inOut' }, at + .15);
      p.nodes.forEach((li, j) => {
        const t = at + .15 + when(p.fracs[j]) * D;
        tl.to($('i', li), { scale: 1, duration: .5, ease: 'back.out(2.6)' }, t).to($('span', li), { opacity: 1, y: 0, duration: .5, ease: 'power2.out' }, t + .06);
      });
      tl.to(p.land, { scale: 1, duration: .45, ease: 'back.out(3)' }, at + .15 + D - .05);
    });
    tl.to('.flow-goal .ring-out', { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, 1)
      .to('.flow-goal .ring-in', { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut' }, 1.15)
      .to('.flow-goal p span, .flow-goal p em', { opacity: 1, y: 0, duration: .7, stagger: .12, ease: 'expo.out' }, 1.5);
  }, '0px 0px -8% 0px');
}

/* ---------- book stages: Barometer, India Horizon ----------
   The book never takes over the page. It turns only when the wheel is used with the pointer on the book
   itself; anywhere else the page scrolls past it. Clicks, the arrow buttons and the arrow keys also turn it. */
const stages = [];
let lastPageWheel = 0;
addEventListener('wheel', () => { lastPageWheel = performance.now(); }, { passive: true });   /* only wheels the book did not take reach here */
function bookStage(section) {
  if (!window.GSUBook) return;
  const books = GSUBook.group(section.dataset.group); if (!books.length) return;
  const host = $('.book', section), list = $('.editions', section), label = $('.book-hint b', section);
  const prev = $('[data-prev]', section), next = $('[data-next]', section);
  const s = { section, book: null, target: 0, cur: 0, pending: null, lastOwn: 0, snap: 0 };
  const buttons = () => { if (prev) { prev.disabled = s.target <= .001; next.disabled = s.target >= s.book.max - .001; } };
  s.buttons = buttons;
  function mount(b) { s.book = GSUBook.mount(host, b); s.cur = 0; s.target = 0; s.pending = null; if (label) label.textContent = b.label; section.dataset.current = b.slug; buttons(); }
  s.mount = mount;
  function choose(b, btn) {
    $$('button', list).forEach(x => { const on = x === btn; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    /* a new edition always starts from its cover: close whatever is open first, then swap */
    if (!s.book || s.cur < .02 || reduced) mount(b); else { s.pending = b; s.target = 0; }
  }
  let first = null;
  books.forEach((b, i) => {
    const btn = document.createElement('button'); btn.type = 'button';
    btn.innerHTML = '<span>' + b.label + '</span>' + (i === 0 ? '<small>Latest</small>' : '');
    btn.addEventListener('click', () => { if ((s.pending || s.book.book) !== b) choose(b, btn); });
    list.append(btn); if (!i) first = btn;
  });
  choose(books[0], first);
  $$('[data-request]', section).forEach(btn => btn.addEventListener('click', () => {
    const b = s.pending || s.book.book;
    if (b.gate) openGate(b.gate); else if (b.href) window.open(b.href, '_blank', 'noopener'); else { pickKind('subscribe'); goTo('#contact'); }
  }));
  const step = d => { if (s.pending) return; s.target = clamp(Math.round(s.target) + d, 0, s.book.max); s.book.load(); buttons(); };
  if (prev) { prev.addEventListener('click', () => step(-1)); next.addEventListener('click', () => step(1)); }
  host.addEventListener('click', e => { const r = host.getBoundingClientRect(); step(s.target < .5 || e.clientX > r.left + r.width / 2 ? 1 : -1); });
  host.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } });
  host.addEventListener('wheel', e => {
    if (s.pending) return;
    const now = performance.now(), dir = Math.sign(e.deltaY);
    if (!dir) return;
    if (now - lastPageWheel < 260 && now - s.lastOwn > 260) return;                        /* the page is mid-scroll and just passing under the pointer */
    if ((dir > 0 && s.target >= s.book.max - .001) || (dir < 0 && s.target <= .001)) return; /* nothing left to turn: give the wheel back to the page */
    e.preventDefault(); e.stopPropagation();
    s.lastOwn = now;
    const px = e.deltaMode === 1 ? e.deltaY * 34 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    s.target = clamp(s.target + px / 300, 0, s.book.max);
    s.book.load(); buttons();
    clearTimeout(s.snap); s.snap = setTimeout(() => { s.target = Math.round(s.target); buttons(); }, 200);   /* settle flat on a spread */
  }, { passive: false });
  inView(section, () => s.book.load(), '900px 0px 900px 0px');
  stages.push(s);
}
function stageLoop() {
  for (const s of stages) {
    if (!s.book) continue;
    const d = s.target - s.cur;
    if (Math.abs(d) > .0004) { s.cur = reduced ? s.target : s.cur + d * (s.pending ? .22 : .14); s.book.setProgress(s.cur); }
    if (s.pending && s.cur < .02) s.mount(s.pending);
  }
  requestAnimationFrame(stageLoop);
}

/* ---------- four pillars ---------- */
function pillars() {
  const root = $('#pillars'); if (!root) return;
  const stack = $('.stack', root), slabs = $$('.slab', root), items = $$('.pillar-list li', root);
  const setActive = i => { slabs.forEach((s, k) => s.classList.toggle('on', k === i)); items.forEach((s, k) => s.classList.toggle('on', k === i)); };
  [slabs, items].forEach(group => group.forEach((el, i) => { el.addEventListener('mouseenter', () => setActive(i)); el.addEventListener('focusin', () => setActive(i)); }));
  setActive(0);
  if (!motion) { stack.classList.add('ready'); return; }
  const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 95%', end: 'top 46%', scrub: .35, onUpdate: st => stack.classList.toggle('ready', st.progress > .97) } });
  [3, 2, 1, 0].forEach((i, n) => {
    tl.fromTo(slabs[i], { y: -170 - n * 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, n * .6)
      .fromTo(items[i], { x: 40, opacity: 0, '--line': 0 }, { x: 0, opacity: 1, '--line': 1, duration: .8, ease: 'power2.out' }, n * .6 + .45);
  });
  gsap.to('#processFill', { width: '100%', ease: 'none', scrollTrigger: { trigger: '#process', start: 'top 95%', end: 'top 60%', scrub: .3 } });
}

/* ---------- how we work: the climb ---------- */
function climb() {
  const root = $('#climb'); if (!root) return;
  const svg = $('svg', root), sky = $('.climb-sky', root), folds = $$('.fold', root), goal = $('.climb-goal', root);
  let tl = null;
  function build() {
    const had = !!tl;
    if (tl) { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); tl = null; }
    svg.innerHTML = '';
    if (getComputedStyle(sky).display === 'none') { if (had) folds.forEach(f => { f.style.opacity = 1; f.style.transform = 'none'; }); return false; }
    const c = root.getBoundingClientRect(), H = sky.getBoundingClientRect().height, yb = H - 4;
    svg.setAttribute('viewBox', `0 0 ${c.width} ${c.height}`);
    const gems = folds.map(f => { const g = $('.gem', f).getBoundingClientRect(); return { x: g.left - c.left + g.width / 2, y: g.top - c.top - 2 }; });
    const ys = [.8, .6, .4, .2].map(f => f * H), xs = gems.map(g => g.x), x0 = -Math.min(c.left, 72);
    const pts = [[x0, yb], [xs[0], ys[0]], [xs[0] + (xs[1] - xs[0]) * .3, ys[0] + H * .045], [xs[1], ys[1]], [xs[1] + (xs[2] - xs[1]) * .3, ys[1] + H * .02], [xs[2], ys[2]], [xs[2] + (xs[3] - xs[2]) * .3, ys[2] - H * .012], [xs[3], ys[3]]];
    const line = p => p.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
    const area = svgEl('path', { class: 'area', d: line(pts) + `L${xs[3]} ${yb}L${x0} ${yb}Z` }, svg);
    const base = svgEl('path', { class: 'base', d: `M${x0} ${yb}H${xs[3]}` }, svg);
    svgEl('path', { class: 'base', d: `M${xs[3]} ${yb}H${c.width}`, 'stroke-dasharray': '7 7', opacity: .7 }, svg);
    const echo = svgEl('path', { class: 'echo', d: line(pts.map((q, i) => [q[0], i ? q[1] + H * .07 : q[1]])) }, svg);
    const drops = gems.map((g, i) => svgEl('path', { class: 'drop', d: `M${xs[i]} ${ys[i]}V${g.y}` }, svg));
    const rise = svgEl('path', { class: 'rise', d: line(pts) }, svg);
    svgEl('circle', { class: 'node', cx: x0 + 8, cy: yb, r: 7 }, svg);
    const nodes = xs.map((x, i) => svgEl('circle', { class: 'node', cx: x, cy: ys[i], r: 8 }, svg));
    const pole = svgEl('path', { class: 'pole', d: `M${xs[3]} ${ys[3]}V${ys[3] - 40}` }, svg);
    const flag = svgEl('path', { class: 'flag', d: `M${xs[3]} ${ys[3] - 40}l32 9l-32 9z` }, svg);
    goal.style.left = Math.max(0, xs[3] - 76) + 'px'; goal.style.right = 'auto'; goal.style.top = (ys[3] - 48 - goal.offsetHeight) + 'px';
    if (!motion) return true;
    /* how far along the line each node sits, so nodes appear as the line reaches them */
    let total = 0; const cum = [0];
    for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(total); }
    const fr = [1, 3, 5, 7].map(i => cum[i] / total), len = rise.getTotalLength(), T = 6;
    gsap.set(rise, { strokeDasharray: len, strokeDashoffset: len });
    tl = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 96%', end: 'top 44%', scrub: .35 } });
    tl.fromTo(base, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 1, ease: 'none' }, 0)
      .to(rise, { strokeDashoffset: 0, duration: T, ease: 'none' }, .4)
      .fromTo([area, echo], { opacity: 0 }, { opacity: i => (i ? .7 : 1), duration: T, ease: 'none' }, .4);
    fr.forEach((f, i) => {
      const t = .4 + f * T, dl = drops[i].getTotalLength();
      tl.fromTo(nodes[i], { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .5, ease: 'back.out(3)' }, t - .1)
        .fromTo(drops[i], { strokeDasharray: `${dl} ${dl}`, strokeDashoffset: dl }, { strokeDashoffset: 0, duration: .7, ease: 'none' }, t)
        .fromTo(folds[i], { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, t + .25)
        .fromTo($('.gem', folds[i]), { scale: 0, rotation: -135 }, { scale: 1, rotation: 45, duration: .8, ease: 'back.out(2)' }, t + .45);
    });
    tl.fromTo(pole, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: .4, ease: 'power2.out' }, .4 + T)
      .fromTo(flag, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: .5, ease: 'back.out(2)' }, .4 + T + .2)
      .fromTo(goal, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, .4 + T + .3);
    return true;
  }
  build();
  let w = innerWidth; addEventListener('resize', debounce(() => { if (innerWidth !== w) { w = innerWidth; build(); if (motion) ScrollTrigger.refresh(); } }, 250));
}

/* ---------- small things ---------- */
function marquee() { const track = $('#logoTrack'); if (!track) return; [...track.children].forEach(a => { const c = a.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; track.append(c); }); }

const form = $('#contactForm'), segs = $$('.seg button', form), statusEl = $('#cStatus'), msgWrap = $('#msgWrap');
let kind = 'advisory';
function pickKind(k) { kind = k; segs.forEach(b => { const on = b.dataset.kind === k; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); msgWrap.style.display = k === 'subscribe' ? 'none' : ''; }
segs.forEach(b => b.addEventListener('click', () => pickKind(b.dataset.kind)));
form.addEventListener('submit', async e => {
  e.preventDefault(); const d = Object.fromEntries(new FormData(form));
  if (!d.name || !/^\S+@\S+\.\S+$/.test(d.email)) { statusEl.textContent = 'Please add your name and a valid work email.'; return; }
  const btn = $('#cSubmit'); btn.disabled = true; statusEl.textContent = 'Sending…';
  try {
    const res = await fetch(`${GATE_WORKER}/${kind === 'subscribe' ? 'subscribe' : 'contact'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, role: kind, message: d.message || (kind === 'subscribe' ? 'Subscription request from the website' : '') }) });
    if (!res.ok) throw new Error(); statusEl.textContent = kind === 'subscribe' ? 'Thank you. We will confirm your subscription by email.' : 'Thank you. We will reply by email.'; form.reset();
  } catch { statusEl.textContent = kind === 'subscribe' ? 'Subscriptions open shortly. Email us at [Research email].' : 'Something went wrong. Email us at [Research email].'; }
  finally { btn.disabled = false; }
});

let _gatePdf = '';
function openGate(pdf) { _gatePdf = pdf; $('#gateOverlay').hidden = false; document.body.style.overflow = 'hidden'; if (lenis) lenis.stop(); $('#gateForm').hidden = false; $('#gateSuccess').hidden = true; $('#gateName').focus(); }
function closeGate() { $('#gateOverlay').hidden = true; document.body.style.overflow = ''; if (lenis) lenis.start(); $('#gateError').hidden = true; $('#gateName').value = ''; $('#gateEmail').value = ''; const b = $('#gateSubmitBtn'); b.textContent = 'Send me the report'; b.disabled = false; }
async function submitGate(e) {
  e.preventDefault(); const name = $('#gateName').value.trim(), email = $('#gateEmail').value.trim(), btn = $('#gateSubmitBtn'), err = $('#gateError');
  btn.textContent = 'Sending…'; btn.disabled = true; err.hidden = true;
  try { const res = await fetch(`${GATE_WORKER}/send-report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, pdf: _gatePdf }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Something went wrong.'); $('#gateEmailDisplay').textContent = email; $('#gateForm').hidden = true; $('#gateSuccess').hidden = false; }
  catch (ex) { err.textContent = ex.message; err.hidden = false; } finally { btn.textContent = 'Send me the report'; btn.disabled = false; }
}
$('#gateOverlay').addEventListener('click', function (e) { if (e.target === this) closeGate(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#gateOverlay').hidden) closeGate(); });

/* ---------- start, in page order so pinned sections measure correctly ---------- */
climb.prepare = () => { if (getComputedStyle($('.climb-sky')).display === 'none' || !motion) $$('#climb .fold').forEach((f, i) => { f.dataset.anim = 'up'; f.dataset.delay = (i * .08).toFixed(2); }); };
climb.prepare();
pageMotion();
flowmap();
$$('.bookstage').forEach(bookStage);
requestAnimationFrame(stageLoop);
pillars();
climb();
marquee();
if (motion) {
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 300));
}
