/* GSU flip-book. Builds a 3D book from a list of page images and exposes one number, progress:
   0 = closed on its cover, 1 = cover open on the first spread, 2 = next spread, and so on.
   Whatever drives that number (scroll, buttons) is up to the page. Data comes from assets/books/books.js,
   which tools/build_book.py generates from a PDF.

     const book = GSUBook.mount(element, window.GSU_BOOKS.books['grb-q3-2026']);
     book.setProgress(1.4);      // any value between 0 and book.max
*/
(function () {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const el = (cls) => { const d = document.createElement('div'); d.className = cls; return d; };

  function mount(host, book) {
    host.innerHTML = '';
    host.classList.add('book');
    host.style.setProperty('--ratio', book.ratio);
    const N = book.pages.length, L = Math.ceil(N / 2), max = Math.max(1, L - 1);
    const shadow = el('book-shadow'), inner = el('book-inner'), blockR = el('book-block r'), blockL = el('book-block l');
    inner.append(blockL, blockR);
    const leaves = [], imgs = [];

    function face(src, side, i) {
      const f = el('face ' + side);
      if (src) {
        const img = new Image();
        img.decoding = 'async'; img.draggable = false; img.alt = i === 0 && side === 'front' ? `${book.title}, ${book.label}: cover` : '';
        img.dataset.src = src; imgs.push(img); f.append(img);
      }
      return f;
    }
    for (let i = 0; i < L; i++) {
      const leaf = el('leaf');
      leaf.append(face(book.pages[2 * i], 'front', i), face(book.pages[2 * i + 1], 'back', i));
      inner.append(leaf); leaves.push(leaf);
    }
    host.append(shadow, inner);

    /* the cover and first spread load at once; the rest when asked, decoded off the main thread first */
    const loadImg = img => { if (img.src) return; img.src = img.dataset.src; if (img.decode) img.decode().catch(() => {}); };
    imgs.slice(0, 3).forEach(loadImg);
    let loadedAll = false;
    function load() { if (loadedAll) return; loadedAll = true; imgs.forEach(loadImg); }

    let progress = -1;
    function setProgress(p) {
      p = clamp(p, 0, max);
      if (Math.abs(p - progress) < .0005) return;
      progress = p;
      if (p > .05) load();
      const open = ease(clamp(p, 0, 1));
      /* closed, the cover sits centred and turned a little toward the reader; opening straightens it */
      inner.style.transform = `translateX(${lerp(-25, 0, open)}%) rotateX(${lerp(9, 2.5, open)}deg) rotateY(${lerp(-24, 0, open)}deg)`;
      shadow.style.transform = `scaleX(${lerp(.5, 1, open)})`;
      blockL.style.opacity = open;
      for (let i = 0; i < L; i++) {
        const t = ease(clamp(p - i, 0, 1)), bend = Math.sin(Math.PI * t);
        const z = lerp(L - i, i + 1, t);                       /* unturned leaves stack one way, turned leaves the other */
        leaves[i].style.transform = `translateZ(${z.toFixed(2)}px) rotateY(${(-180 * t).toFixed(2)}deg) skewY(${(-3.2 * bend).toFixed(2)}deg)`;
        leaves[i].style.setProperty('--shade', bend.toFixed(3));
      }
    }
    setProgress(0);
    return { el: host, book, max, leaves: L, load, setProgress, get progress() { return progress; } };
  }

  /* books of one group, newest first */
  function group(name) {
    const all = (window.GSU_BOOKS && window.GSU_BOOKS.books) || {};
    return Object.values(all).filter(b => b.group === name).sort((a, b) => b.order - a.order);
  }

  window.GSUBook = { mount, group };
})();
