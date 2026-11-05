// Large text takes on the element for as long as it lasts (sumi-chick.css): fire sways slowly like
// heat shimmer, lightning glitches, ice holds sharply bent angles like light through ice. Only the
// cheap parts of CSS are used: an animated transform (composited on the GPU, no layout or repaint)
// and a static text-shadow (painted once when the effect starts and once when it ends).
//
// Dark is different: the page sinks under the WebGL darkness, and several titles live under
// transformed or isolated ancestors that cannot be lifted above it. So the text gets light clones
// laid over the darkness instead, in a layer screened onto the page (black adds nothing, so
// nothing under it is hidden). The layer sits above the darkness's own canvas and under the
// chick's canvas, so the chick passes in front of the text:
//  - large text: black glyphs with a thin white, faintly blue rim that breathes (CSS opacity
//    animation per clone, compositor only);
//  - small text: white glyphs in the thinnest weight with a faint glow, twinkling in four groups
//    (one CSS opacity animation per group);
//  - the toolkit's dot field: white stars that twinkle in three groups (CSS opacity only).
// The clones scroll with their surface. Per frame the layer's opacity follows the darkness and a
// small round-robin slice of clones is checked against its text; building is spread over frames.
const MIN_PX = 22;   // "large text": at least this font size; body copy and small labels are left alone
const DURATION = { fire: 2.6, lightning: 2.2, ice: 3.4 };
const GLOW_PULSE = 3.2;     // seconds for one breath of the dark rim (sumi-chick.css)
const PLACE_BUDGET = 32;    // clones checked per frame, round-robin
const BUILD_BUDGET = 40;    // small-text clones built per frame
const TWINKLE_GROUPS = 4;   // small text twinkles in this many groups (sumi-chick.css)
// dark: in the hero title the word openings "art" (artistic) and "tech" (technical) sparkle white
// while the rest of the title stays black with its thin rim (sumi-spark in sumi-chick.css)
const SPARK_WORDS = '.hero-title--vision .hero-title-word';
const SPARK_PREFIXES = ['art', 'tech'];
const SKIP = '[data-sumi-control], .sumi-growth-debug, .sumi-fire-layer, .sumi-mark-layer, .sumi-tglow-layer, .sumi-seed-counter, .sumi-veil, script, style, svg, noscript, canvas';
// above the darkness already (z 20), so left as it is
const DARK_SKIP = '.site-header';

// The outermost block-level boxes that hold large text. Transforms do not apply to inline boxes,
// so an inline holder hands over to its nearest block ancestor.
export function largeText(root) {
  const found = new Set(), seen = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.trim().length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    let el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (el.closest(SKIP) || parseFloat(getComputedStyle(el).fontSize) < MIN_PX) continue;
    while (el && el !== root && getComputedStyle(el).display === 'inline') el = el.parentElement;
    if (!el || el === root) continue;
    // never take over a box that already moves (a marquee, a hover scale): it keeps its own motion
    const cs = getComputedStyle(el);
    if (cs.animationName !== 'none' || cs.transform !== 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width > 4 && r.height > 4) found.add(el);
  }
  return [...found].filter(el => ![...found].some(o => o !== el && o.contains(el)));
}

// The block boxes holding small text (dark only): the nearest non-inline holder of every text
// below MIN_PX, outermost only. Hidden ones are kept; they show when the page shows them.
export function smallText(root) {
  const found = new Set(), seen = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    let el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (el.closest(SKIP) || el.closest(DARK_SKIP) || (root === document.body && el.closest('dialog'))) continue;
    if (parseFloat(getComputedStyle(el).fontSize) >= MIN_PX) continue;
    while (el && el !== root && /^(inline|contents)$/.test(getComputedStyle(el).display)) el = el.parentElement;
    if (el && el !== root) found.add(el);
  }
  return [...found].filter(el => { for (let p = el.parentElement; p && p !== root; p = p.parentElement) if (found.has(p)) return false; return true; });
}

// What decides where the glyphs land: font, spacing, wrapping, clamping and the box model of each
// element. Colours and decorations stay out (the clone draws its own).
const GLYPH_STYLE = ['font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'font-variant', 'font-feature-settings',
  'font-variation-settings', 'font-kerning', 'font-optical-sizing', 'letter-spacing', 'word-spacing', 'line-height', 'text-transform',
  'text-indent', 'text-align', 'white-space', 'word-break', 'overflow-wrap', 'text-wrap-mode', 'text-wrap-style', 'hyphens',
  '-webkit-text-stroke-width', 'paint-order', 'display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'row-gap',
  'column-gap', 'flex-grow', 'flex-shrink', 'flex-basis', 'vertical-align', 'box-sizing',
  'overflow-x', 'overflow-y', 'text-overflow', '-webkit-line-clamp', '-webkit-box-orient',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left'];
const CHILD_STYLE = ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'];
const REPLACED = new Set(['img', 'svg', 'video', 'canvas', 'iframe', 'picture', 'object']);

// A style-only copy of `src` made of plain custom elements, so no page rule can reach it.
// hideLarge (small-text clones): large text inside keeps its room but is not drawn, since it has
// a clone of its own.
function mirror(src, root, hideLarge = false, parentVisibility = 'visible') {
  const out = document.createElement(root ? 'sumi-tg' : 'sumi-ts');
  const cs = getComputedStyle(src);
  for (const p of GLYPH_STYLE) { const v = cs.getPropertyValue(p); if (v) out.style.setProperty(p, v); }
  if (cs.display === 'list-item') out.style.display = 'block';   // no list bullet on the copy
  if (!root) for (const p of CHILD_STYLE) out.style.setProperty(p, cs.getPropertyValue(p));
  // visibility: only what is set inside the copied text (a hidden badge). A hidden state inherited
  // from outside (a card's info panel before hover) must not be copied: it would stick on the
  // clone after the page shows the text. Whether the text shows is decided per clone (place()).
  if (!root && cs.visibility !== parentVisibility) out.style.visibility = cs.visibility;
  if (hideLarge && !root && parseFloat(cs.fontSize) >= MIN_PX) out.style.visibility = 'hidden';
  for (const n of src.childNodes) {
    if (n.nodeType === Node.TEXT_NODE) { out.append(n.nodeValue); continue; }
    if (n.nodeType !== Node.ELEMENT_NODE) continue;
    if (n.localName === 'br') { out.append(document.createElement('br')); continue; }
    const ncs = getComputedStyle(n);
    if (ncs.display === 'none') continue;
    if (REPLACED.has(n.localName) || n.matches(SKIP)) {
      // an icon in a title keeps its room, but draws nothing
      const r = n.getBoundingClientRect(), gap = document.createElement('sumi-ts');
      gap.style.cssText = `display:inline-block;width:${r.width}px;height:${r.height}px;vertical-align:${ncs.verticalAlign}`;
      for (const p of CHILD_STYLE) gap.style.setProperty(p, ncs.getPropertyValue(p));
      out.append(gap);
      continue;
    }
    out.append(mirror(n, false, hideLarge, cs.visibility));
  }
  return out;
}

// Wrap a sparkling word opening ("art" of artistic) in the clone's first text in a sumi-spark.
function addSpark(clone) {
  const node = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT).nextNode();
  if (!node) return;
  const text = node.nodeValue, lead = text.match(/^\s*/)[0], rest = text.slice(lead.length);
  const prefix = SPARK_PREFIXES.find(p => rest.toLowerCase().startsWith(p));
  if (!prefix) return;
  const spark = document.createElement('sumi-spark');
  spark.textContent = rest.slice(0, prefix.length);
  node.nodeValue = lead;
  node.after(spark, document.createTextNode(rest.slice(prefix.length)));
}

// The toolkit's dot field as stars: dot positions and sizes are read once from its own canvas
// (sampled on the field's grid: spacing = width / max(14, round(width / 16)), as app.js lays it
// out), then drawn white into three canvases, one per twinkle group, with a soft halo baked in.
function buildStars(field) {
  const source = field.querySelector('canvas.toolkit-dots');
  const width = field.clientWidth, height = field.clientHeight;
  if (!source || !width || !height || !source.width) return null;
  const dpr = source.width / width;
  let data;
  try { data = source.getContext('2d').getImageData(0, 0, source.width, source.height).data; } catch { return null; }
  const steps = Math.max(14, Math.round(width / 16)), spacing = width / steps, win = Math.max(1, Math.round(spacing * 0.4 * dpr));
  const wrap = document.createElement('sumi-stars');
  const groups = [0, 1, 2].map(() => {
    const c = document.createElement('canvas');
    c.width = Math.round(width * dpr); c.height = Math.round(height * dpr);
    c.style.width = `${width}px`; c.style.height = `${height}px`;
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wrap.append(c);
    return { c, ctx };
  });
  let count = 0;
  for (let row = 0; row <= Math.floor(height / spacing); row++) {
    for (let column = 0; column <= steps; column++) {
      const cx = Math.round(column * spacing * dpr), cy = Math.round(row * spacing * dpr);
      let alpha = 0;
      for (let y = Math.max(0, cy - win); y <= Math.min(source.height - 1, cy + win); y++) {
        for (let x = Math.max(0, cx - win); x <= Math.min(source.width - 1, cx + win); x++) alpha += data[(y * source.width + x) * 4 + 3];
      }
      const area = alpha / 255 / (dpr * dpr);   // CSS px²
      if (area < 0.12) continue;
      const star = Math.random() < 0.09, b = 0.6 + 0.4 * Math.random();
      const radius = Math.min(2.2, Math.max(0.75, Math.sqrt(area / Math.PI) * 1.2)) * (star ? 1.5 : 1);
      const { ctx } = groups[Math.floor(Math.random() * 3)];
      ctx.fillStyle = `rgba(244,248,255,${star ? 1 : b})`;
      ctx.beginPath(); ctx.arc(column * spacing, row * spacing, radius, 0, Math.PI * 2); ctx.fill();
      count++;
    }
  }
  if (!count) return null;
  // halo: each canvas laid under itself, blurred (twice, so the small dots read as lit)
  for (const { c, ctx } of groups) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'destination-over';
    ctx.filter = `blur(${(2.2 * dpr).toFixed(1)}px)`; ctx.drawImage(c, 0, 0); ctx.drawImage(c, 0, 0);
    ctx.restore();
  }
  return { el: wrap, width, height, count };
}

export function createTextFx() {
  let element = '', key = '', marked = [];
  // dark: a scrolling layer per surface (and a pinned one for a dialog's fixed header), the
  // clones, the toolkit stars, and the building still to do
  let layer = null, pinned = null, clones = [], stars = null, glowOpacity = -1, clipKey = '', cursor = 0;
  let pendingSmall = null, starsPending = false, starsRetry = 0, host = null;
  function clearGlow() {
    for (const c of clones) if (c.kind === 'small') c.src.classList.remove('sumi-tglow-src');
    document.documentElement.classList.remove('sumi-tglow-hide');
    layer?.remove(); pinned?.remove();
    layer = pinned = null; clones = []; stars = null; glowOpacity = -1; clipKey = ''; cursor = 0;
    pendingSmall = null; starsPending = false; host = null;
  }
  function clear() {
    for (const el of marked) { el.classList.remove('sumi-tfx', 'sumi-tfx-fire', 'sumi-tfx-lightning', 'sumi-tfx-ice'); el.style.removeProperty('--sumi-tfx-d'); }
    marked = [];
    clearGlow();
    document.documentElement.classList.remove('sumi-tfx-on');
    element = ''; key = '';
  }
  function newLayer(className) {
    const l = document.createElement('div');
    l.className = className;
    l.setAttribute('aria-hidden', 'true');
    l.style.opacity = glowOpacity > 0 ? glowOpacity.toFixed(2) : '0';
    host.append(l);
    return l;
  }
  function addClone(src, kind) {
    // a dialog's header stays put while its body scrolls: its text goes to the pinned layer
    const isPinned = host !== document.body && Boolean(src.closest('.dialog-header'));
    if (isPinned && !pinned) pinned = newLayer('sumi-tglow-layer sumi-tglow-pinned');
    const el = mirror(src, true, kind === 'small');
    if (kind === 'small') el.classList.add('is-small');
    else {
      el.style.setProperty('--sumi-tglow-d', `${(-Math.random() * GLOW_PULSE * 2).toFixed(2)}s`);
      if (src.matches(SPARK_WORDS)) addSpark(el);
    }
    const align = getComputedStyle(src).textAlign;
    const target = isPinned ? pinned : layer;
    // small text twinkles in four groups out of step (one opacity animation per group, not per text)
    if (kind === 'small') {
      // the copy is set thinner than the text it covers, so the original steps aside while the
      // light is up (html.sumi-tglow-hide, sumi-chick.css): no ghost of it shows through the dark
      // or a thumbnail's kept brightness
      src.classList.add('sumi-tglow-src');
      const i = Math.floor(Math.random() * TWINKLE_GROUPS);
      target.groups ||= [];
      if (!target.groups[i]) { const grp = document.createElement('sumi-tgroup'); grp.dataset.twinkle = String(i); target.append(grp); target.groups[i] = grp; }
      target.groups[i].append(el);
    } else target.append(el);
    const c = { el, src, kind, pinned: isPinned, display: el.style.display, text: src.textContent, show: null,
      shift: align === 'center' ? 0.5 : align === 'right' || align === 'end' ? 1 : 0, left: NaN, top: NaN, width: NaN, height: NaN };
    clones.push(c);
    return c;
  }
  // Put a clone on its text again; writes only what moved (fonts loading, a reflow, a card opening).
  function place(c, origin, pinnedOrigin) {
    if (c.src.isConnected && c.src.textContent !== c.text) {   // the page rewrote it (a hover detail)
      const fresh = mirror(c.src, true, c.kind === 'small');
      fresh.className = c.el.className; fresh.style.setProperty('--sumi-tglow-d', c.el.style.getPropertyValue('--sumi-tglow-d'));
      if (c.kind !== 'small' && c.src.matches(SPARK_WORDS)) addSpark(fresh);
      c.el.replaceWith(fresh);
      Object.assign(c, { el: fresh, display: fresh.style.display, text: c.src.textContent, show: null, left: NaN, top: NaN, width: NaN, height: NaN });
    }
    // text the page itself hides (a card's info panel held at opacity 0 until hover) gets no clone
    const seen = c.src.isConnected && (c.src.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) ?? true);
    const r = seen ? c.src.getBoundingClientRect() : null;
    const show = Boolean(r && r.width > 1 && r.height > 1);
    if (show !== c.show) { c.show = show; c.el.style.display = show ? c.display : 'none'; }
    if (!show) return;
    const o = c.pinned ? pinnedOrigin : origin;
    // a hair wider than measured so sub-pixel rounding never wraps a line early; centred and
    // right-aligned text gives the extra width back on its own side
    const left = r.left - o.left - c.shift, top = r.top - o.top, width = r.width + 1, height = r.height;
    if (!(Math.abs(left - c.left) <= 0.25 && Math.abs(top - c.top) <= 0.25 && Math.abs(width - c.width) <= 0.25 && Math.abs(height - c.height) <= 0.25)) {
      c.left = left; c.top = top; c.width = width; c.height = height;
      const s = c.el.style;
      s.left = `${left}px`; s.top = `${top}px`; s.width = `${width}px`; s.height = `${height}px`;
    }
  }
  function placeSome(all) {
    if (!clones.length) return;
    const origin = layer.getBoundingClientRect(), pinnedOrigin = pinned ? pinned.getBoundingClientRect() : origin;
    const n = all ? clones.length : Math.min(PLACE_BUDGET, clones.length);
    for (let i = 0; i < n; i++) { cursor = (cursor + 1) % clones.length; place(clones[cursor], origin, pinnedOrigin); }
    if (stars) placeStars(origin);
  }
  function placeStars(origin) {
    const field = stars.field;
    if (!field.isConnected) { stars.el.remove(); stars = null; return; }
    const r = field.getBoundingClientRect();
    if (Math.abs(field.clientWidth - stars.width) > 1 || Math.abs(field.clientHeight - stars.height) > 1) {   // resized: draw again
      stars.el.remove(); stars = null; starsPending = true; starsRetry = 0; return;
    }
    const left = r.left - origin.left, top = r.top - origin.top;
    if (!(Math.abs(left - stars.left) <= 0.25 && Math.abs(top - stars.top) <= 0.25)) {
      stars.left = left; stars.top = top; stars.el.style.left = `${left}px`; stars.el.style.top = `${top}px`;
    }
  }
  // One piece of building per frame, so the darkness never stalls: large text, then small text in
  // slices, then the stars.
  function buildStep() {
    if (pendingSmall === null) { pendingSmall = smallText(host); return true; }
    if (pendingSmall.length) {
      // add the whole slice first, then place it: one layout for the slice, not one per clone
      const added = pendingSmall.splice(0, BUILD_BUDGET).map(src => addClone(src, 'small'));
      const origin = layer.getBoundingClientRect(), pinnedOrigin = pinned ? pinned.getBoundingClientRect() : origin;
      for (const c of added) place(c, origin, pinnedOrigin);
      return true;
    }
    if (starsPending) {
      const field = host === document.body ? host.querySelector('.toolkit-field') : null;
      const built = field && buildStars(field);
      if (built) {
        stars = { ...built, field, left: NaN, top: NaN };
        layer.append(built.el);
        placeStars(layer.getBoundingClientRect());
        starsPending = false;
      } else if (!field || ++starsRetry > 20) starsPending = false;   // no field here, or never drawn
      return true;
    }
    return false;
  }
  function buildGlow(surface) {
    host = surface;
    layer = newLayer('sumi-tglow-layer');
    for (const src of largeText(host)) addClone(src, 'large');
    pendingSmall = null; starsPending = host === document.body;
    placeSome(true);
  }
  // A project dialog keeps its header pinned over the scrolling body: clones scrolled under it
  // are cut at its lower edge, as the text they copy is.
  function clipUnderHeader() {
    let clip = '';
    if (host !== document.body) {
      const header = host.querySelector('.dialog-header');
      if (header) clip = `inset(${(header.getBoundingClientRect().bottom - layer.getBoundingClientRect().top).toFixed(1)}px -100000px -100000px -100000px)`;
    }
    if (clip !== clipKey) { clipKey = clip; layer.style.clipPath = clip; }
  }
  return {
    // element: 'fire' | 'lightning' | 'ice' | 'dark' while active, '' to stop; host: the page or a
    // dialog; amount: how far the darkness has spread (dark only). Cheap to call every frame: it
    // only rescans when the element, the surface or the dialog's project changes.
    update(next, surface, amount = 1) {
      if (!DURATION[next] && next !== 'dark') { if (element) clear(); return; }
      const k = surface === document.body ? 'page' : `dialog:${surface.dataset.activeWork || ''}`;
      if (next !== element || k !== key) {
        clear();
        element = next; key = k;
        if (next === 'dark') buildGlow(surface);
        else {
          marked = largeText(surface);
          for (const el of marked) {
            el.classList.add('sumi-tfx', `sumi-tfx-${next}`);
            el.style.setProperty('--sumi-tfx-d', `${(-Math.random() * DURATION[next]).toFixed(2)}s`);   // out of step with each other
          }
          document.documentElement.classList.add('sumi-tfx-on');
        }
        return;
      }
      if (!layer) return;
      // the light comes up once the darkness has nearly covered the page, and goes with it
      const t = Math.min(1, Math.max(0, (amount - 0.5) / 0.45)), opacity = t * t * (3 - 2 * t);
      if (Math.abs(opacity - glowOpacity) > 0.02 || (opacity === 0) !== (glowOpacity === 0)) {
        glowOpacity = opacity;
        layer.style.opacity = opacity.toFixed(2);
        if (pinned) pinned.style.opacity = opacity.toFixed(2);
        document.documentElement.classList.toggle('sumi-tglow-hide', opacity > 0.3);
      }
      if (!buildStep()) placeSome(false);
      clipUnderHeader();
    },
    get count() { return marked.length + clones.length; },
    get glow() { return layer ? Math.max(0, glowOpacity) : 0; },
    get stars() { return stars ? stars.count : 0; },
    get building() { return Boolean(layer) && (pendingSmall === null || pendingSmall.length > 0 || starsPending); },
    clear,
    dispose: clear,
  };
}
