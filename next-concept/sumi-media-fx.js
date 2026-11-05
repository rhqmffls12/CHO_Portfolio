// A short distortion burst on the page's own media: lightning glitches (torn horizontal bands and
// an RGB split), fire shimmers with heat haze, ice refracts through crystal facets. At the moment
// of transformation every medium on screen takes part (the hero video frame, visible card
// thumbnails, an open dialog's stage); while the element lasts, a single thumbnail plays it when
// hovered and a dialog's stage when the dialog opens (playOn). Each burst lasts 1–2 s and the SVG
// filters animate themselves (SMIL), so there is no per-frame script work between bursts.
const SVGNS = 'http://www.w3.org/2000/svg';
const TARGETS = '.hero-video-frame, .work-card-visual, .dialog-stage';
const MAX_TARGETS = 8;
const DURATION = { lightning: 0.9, fire: 1.6, ice: 1.9 };

// a displacement map: R and G store an offset per pixel (128 = none)
function mapURL(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d'), img = ctx.createImageData(w, h);
  paint(img.data, w, h);
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

// glitch: horizontal bands, most still, some torn sideways
function bandMap() {
  return mapURL(4, 96, (d, w, h) => {
    for (let y = 0; y < h; y++) {
      const torn = Math.random() < 0.28, r = torn ? (Math.random() < 0.5 ? 40 : 216) + Math.random() * 30 - 15 : 128;
      for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; d[i] = r; d[i + 1] = 128; d[i + 2] = 128; d[i + 3] = 255; }
    }
  });
}

// ice: Voronoi facets, each tilted its own way, like light through broken ice
function facetMap() {
  const N = 26, pts = Array.from({ length: N }, () => [Math.random(), Math.random(), 60 + Math.random() * 136, 60 + Math.random() * 136]);
  return mapURL(160, 160, (d, w, h) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let best = 9, cell = pts[0];
      for (const p of pts) { const dx = x / w - p[0], dy = y / h - p[1], dd = dx * dx + dy * dy; if (dd < best) { best = dd; cell = p; } }
      const i = (y * w + x) * 4;
      d[i] = cell[2]; d[i + 1] = cell[3]; d[i + 2] = 128; d[i + 3] = 255;
    }
  });
}

export function createMediaFx({ reducedMotion = false } = {}) {
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  Object.assign(svg.style, { position: 'absolute', width: '0', height: '0', overflow: 'hidden' });
  svg.innerHTML = `
    <filter id="sumi-mfx-glitch" x="-4%" y="0" width="108%" height="100%" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">
      <feImage href="${bandMap()}" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="bands"/>
      <feDisplacementMap in="SourceGraphic" in2="bands" scale="0" xChannelSelector="R" yChannelSelector="G" result="torn">
        <animate attributeName="scale" values="0;0.07;0;0.05;0.09;0;0.04;0" keyTimes="0;0.1;0.22;0.4;0.52;0.66;0.8;1" calcMode="discrete" dur="${DURATION.lightning}s" begin="indefinite" fill="freeze"/>
      </feDisplacementMap>
      <feColorMatrix in="torn" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
      <feOffset in="r" dx="0" result="ro">
        <animate attributeName="dx" values="0;0.008;0.003;0.012;0.004;0" calcMode="discrete" dur="${DURATION.lightning}s" begin="indefinite" fill="freeze"/>
      </feOffset>
      <feColorMatrix in="torn" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/>
      <feOffset in="gb" dx="0" result="gbo">
        <animate attributeName="dx" values="0;-0.006;-0.002;-0.009;-0.003;0" calcMode="discrete" dur="${DURATION.lightning}s" begin="indefinite" fill="freeze"/>
      </feOffset>
      <feBlend in="ro" in2="gbo" mode="screen"/>
    </filter>
    <filter id="sumi-mfx-wave" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.035" numOctaves="1" seed="7" result="haze">
        <animate attributeName="baseFrequency" values="0.006 0.035;0.0068 0.042;0.006 0.035" dur="0.8s" repeatCount="2" begin="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="haze" scale="0" xChannelSelector="R" yChannelSelector="G">
        <animate attributeName="scale" values="0;18;12;0" keyTimes="0;0.25;0.7;1" dur="${DURATION.fire}s" begin="indefinite" fill="freeze"/>
      </feDisplacementMap>
    </filter>
    <filter id="sumi-mfx-refract" x="0" y="0" width="100%" height="100%" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">
      <feImage href="${facetMap()}" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="facets"/>
      <feDisplacementMap in="SourceGraphic" in2="facets" scale="0" xChannelSelector="R" yChannelSelector="G" result="bent">
        <animate attributeName="scale" values="0;0.065;0.05;0.05;0" keyTimes="0;0.18;0.32;0.8;1" dur="${DURATION.ice}s" begin="indefinite" fill="freeze"/>
      </feDisplacementMap>
      <feColorMatrix in="bent" values="0.85 0 0 0 0.04  0 0.92 0 0 0.07  0 0 1 0 0.12  0 0 0 1 0"/>
    </filter>`;
  document.body.append(svg);
  const FILTER = { lightning: 'sumi-mfx-glitch', fire: 'sumi-mfx-wave', ice: 'sumi-mfx-refract' };
  let active = [], timer = 0;

  function stop() {
    clearTimeout(timer);
    for (const el of active) el.classList.remove('sumi-mfx', 'sumi-mfx-lightning', 'sumi-mfx-fire', 'sumi-mfx-ice');
    active = [];
  }
  // The filters are shared and restart as a whole, so one burst runs at a time: a new one ends the last.
  function burst(element, targets) {
    stop();
    active = targets;
    for (const el of active) el.classList.add('sumi-mfx', `sumi-mfx-${element}`);
    for (const a of svg.querySelectorAll(`#${FILTER[element]} animate`)) a.beginElement();
    timer = setTimeout(stop, DURATION[element] * 1000 + 50);
    return active.length;
  }

  return {
    // which media take part: an open dialog's stage, or what is on screen on the page
    targets() {
      const dialog = document.querySelector('.project-dialog[open]');
      const pool = dialog ? [...dialog.querySelectorAll('.dialog-stage')] : [...document.querySelectorAll(TARGETS)];
      return pool.filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 40 && r.height > 30 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      }).slice(0, MAX_TARGETS);
    },
    play(element) {
      if (reducedMotion || !FILTER[element]) return 0;
      return burst(element, this.targets());
    },
    // one medium only: a hovered thumbnail, or a dialog's stage as the dialog opens; a burst
    // already running on it is left to finish
    playOn(element, target) {
      if (reducedMotion || !FILTER[element] || !target?.isConnected) return 0;
      if (active.includes(target)) return 0;
      return burst(element, [target]);
    },
    supports(element) { return Boolean(FILTER[element]) && !reducedMotion; },
    get active() { return active.length; },
    stop,
    dispose() { stop(); svg.remove(); },
  };
}
