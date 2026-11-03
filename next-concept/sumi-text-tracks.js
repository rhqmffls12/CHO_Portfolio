import * as THREE from './assets/vendor/three-r186/three.module.min.js';

// An occasional run of footsteps writes a phrase one character at a time.
// Resample the planted trail by glyph width, not by a fixed number of footsteps.
const SECTIONS = [
  { selector: '.hero', key: 'hero', dark: true, lines: ['SHOWREEL'] },
  { selector: '#work', key: 'work', dark: false, lines: ['PROJECTS'] },
  { selector: '#capabilities', key: 'career', dark: true, lines: ['EXPERTISE'] },
  { selector: '#about', key: 'closing', dark: false, lines: ['CONNECT'] },
];
const INK = {
  light: '#FFF4E2',
  dark: '#3F4D24',
};
const FREQUENCY_MULTIPLIER = 2;
const MIN_INTERVAL = 6.5 / FREQUENCY_MULTIPLIER, STAMP_LIMIT = 64, FONT_SIZE = 48;
const FONT = `400 ${FONT_SIZE}px "Sumi Trail Chewy", "Comic Sans MS", cursive`;
const IDLE_RELEASE = 8;
let trailFontLoad;
function loadTrailFont() {
  if (!trailFontLoad) {
    const source = new URL('./assets/fonts/Chewy-Regular.ttf', import.meta.url).href;
    const face = new FontFace('Sumi Trail Chewy', `url("${source}")`, { weight: '400', style: 'normal' });
    trailFontLoad = face.load().then(loaded => { document.fonts.add(loaded); });
  }
  return trailFontLoad;
}

export function createTextTracks(scene, camera, { hold, fade, glyphHeight, random = Math.random }) {
  const sections = SECTIONS.map(section => ({ ...section, element: document.querySelector(section.selector) }));
  const inkColors = { light: new THREE.Color(INK.light), dark: new THREE.Color(INK.dark) };
  const textures = new Map();
  const group = new THREE.Group();
  group.name = 'section-text-footprints';
  scene.add(group);
  // Same XZ ground plane as normal prints. Text reading direction is local +X.
  const geometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const stamps = Array.from({ length: STAMP_LIMIT }, () => {
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true, toneMapped: false,
      uniforms: {
        uTex: { value: null }, uOpacity: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          vec4 ink = texture2D(uTex, vUv);
          float alpha = ink.a * uOpacity;
          if (alpha < .001) discard;
          gl_FragColor = vec4(ink.rgb, alpha);
          #include <colorspace_fragment>
        }
      `,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'section-text-footprint';
    mesh.visible = false;
    mesh.renderOrder = -5; // Same depth-tested ground layer as ordinary footprints.
    group.add(mesh);
    return { mesh, age: 0, fadeAge: null };
  });
  const projected = new THREE.Vector3();
  const candidate = new THREE.Vector3();
  const metrics = new Map();
  const measureContext = document.createElement('canvas').getContext('2d');
  const nextStepCount = () => Math.round((15 + Math.floor(random() * 11)) / FREQUENCY_MULTIPLIER);
  let stepsRemaining = nextStepCount(), sinceLast = 0;
  let sequence = null, stampHead = 0, closingIndex = 0, runId = 0, disposed = false;
  let tail = null;
  // Load only for the companion and wait before measuring/caching any letters.
  let fontReady = false;
  loadTrailFont().then(() => { fontReady = true; }, () => { fontReady = true; });

  function getTexture(text, theme) {
    const key = `${text}|${theme}`;
    if (textures.has(key)) return textures.get(key);
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
    ctx.font = FONT;
    const cap = ctx.measureText('H');
    const capHeight = cap.actualBoundingBoxAscent + cap.actualBoundingBoxDescent;
    const width = Math.ceil(ctx.measureText(text).width) + 16, height = FONT_SIZE + 16;
    // Supersampled fill-only glyphs, cached and reused without an outline or halo.
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const baseline = (height + cap.actualBoundingBoxAscent - cap.actualBoundingBoxDescent) / 2;
    ctx.fillStyle = INK[theme];
    ctx.fillText(text, width / 2, baseline);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const item = { texture, width, height, capHeight };
    textures.set(key, item);
    return item;
  }

  function measure(text) {
    if (metrics.has(text)) return metrics.get(text);
    measureContext.font = FONT;
    const cap = measureContext.measureText('H');
    const m = measureContext.measureText(text);
    const scale = glyphHeight / (cap.actualBoundingBoxAscent + cap.actualBoundingBoxDescent);
    const value = { advance: m.width * scale, inkWidth: (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * scale };
    metrics.set(text, value);
    return value;
  }

  // Shared by glyphs and ordinary footprints: resolve the surface at the planted
  // point, including image tiles inside the otherwise light project section.
  function surfaceAt(x, y, width, height) {
    const section = sections.find(({ element }) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return y >= rect.top && y < rect.bottom;
    });
    const hit = x >= 0 && x < width && y >= 0 && y < height ? document.elementFromPoint(x, y) : null;
    const onMedia = Boolean(hit?.closest('.work-card-visual, .hero-media, video, iframe'));
    return { section, hit, theme: section?.dark || onMedia ? 'light' : 'dark' };
  }

  function colorAt(worldPosition, width, height) {
    projected.set(worldPosition.x, .002, worldPosition.z).project(camera);
    const x = (projected.x + 1) * width / 2, y = (1 - projected.y) * height / 2;
    return inkColors[surfaceAt(x, y, width, height).theme];
  }

  function visibleSurface(worldPosition, width, height) {
    projected.set(worldPosition.x, .002, worldPosition.z).project(camera);
    const x = (projected.x + 1) * width / 2, y = (1 - projected.y) * height / 2;
    if (projected.z < -1 || projected.z > 1 || x < 0 || x > width || y < 40 || y > height - 24) return null;
    const { section, hit, theme } = surfaceAt(x, y, width, height);
    if (!section || hit?.closest('.site-header, [data-sumi-control], dialog')) return null;
    return { section, theme };
  }

  function releaseSequence(completed) {
    if (!sequence) return;
    for (const slot of sequence.slots) slot.fadeAge = 0;
    if (completed && sequence.section === 'closing') closingIndex++;
    tail = sequence.lastGlyph;
    sequence = null;
    sinceLast = 0;
    stepsRemaining = nextStepCount();
  }

  function plant(worldPosition, heading, theme) {
    const { text, characterIndex, advance, inkWidth } = sequence.glyphs[sequence.index];
    const item = getTexture(text, theme);
    const slot = stamps[stampHead];
    stampHead = (stampHead + 1) % STAMP_LIMIT;
    const stamp = slot.mesh, material = stamp.material;
    material.uniforms.uTex.value = item.texture;
    material.uniforms.uOpacity.value = 0;
    // Reading axis follows travel, including true 180-degree reversal. No toe jitter.
    stamp.rotation.y = heading - Math.PI / 2;
    stamp.position.set(worldPosition.x, .002, worldPosition.z);
    const unitsPerTexel = glyphHeight / item.capHeight;
    stamp.scale.set(item.width * unitsPerTexel, 1, item.height * unitsPerTexel);
    stamp.userData = { section: sequence.section, text, phrase: sequence.phrase, characterIndex,
      theme, heading, glyphHeight, advance, inkWidth, runId: sequence.id };
    stamp.visible = true;
    slot.age = 0;
    slot.fadeAge = null;
    sequence.slots.push(slot);
    sequence.lastGlyph = { position: worldPosition.clone(), heading, inkWidth };
    sequence.index++;
    if (sequence.index >= sequence.glyphs.length) { releaseSequence(true); return; }
    const next = sequence.glyphs[sequence.index];
    // Mildly varied optical tracking; word spaces remain empty, never footprints.
    const tracking = glyphHeight * .24 * (.94 + random() * .12);
    sequence.remaining = (advance + next.advance) / 2 + tracking + next.wordGap;
  }

  function clearOfPrevious(point, heading, inkWidth) {
    const last = sequence.lastGlyph;
    const dx = point.x - last.position.x, dz = point.z - last.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 1e-6) return false;
    const extent = (angle, width) => (Math.abs(Math.sin(angle) * dx + Math.cos(angle) * dz) * width
      + Math.abs(Math.cos(angle) * dx - Math.sin(angle) * dz) * glyphHeight) / (2 * distance);
    // Reserve rotated glyph bounds on tight bends instead of piling letters up.
    return distance >= extent(last.heading, last.inkWidth) + extent(heading, inkWidth) + glyphHeight * .14;
  }

  // true consumes the footfall even when waiting for space or crossing a word gap.
  function tryStamp(worldPosition, heading, width, height) {
    if (disposed || !fontReady) return false;
    const surface = visibleSurface(worldPosition, width, height);
    if (!sequence) {
      if (tail && worldPosition.distanceTo(tail.position) < glyphHeight * 1.1) return true;
      tail = null;
      if (!surface) return false;
      stepsRemaining = Math.max(0, stepsRemaining - 1);
      if (stepsRemaining || sinceLast < MIN_INTERVAL) return false;
      const section = surface.section;
      const phrase = section.lines[section.key === 'closing' ? closingIndex % section.lines.length : 0];
      const glyphs = [];
      let wordGap = 0;
      Array.from(phrase).forEach((text, characterIndex) => {
        if (/\s/.test(text)) { wordGap += glyphHeight * .55; return; }
        glyphs.push({ text, characterIndex, wordGap, ...measure(text) });
        wordGap = 0;
      });
      sequence = { section: section.key, phrase, glyphs, index: 0, slots: [], id: ++runId,
        point: worldPosition.clone(), heading, remaining: 0, idle: 0, lastGlyph: null };
      plant(worldPosition, heading, surface.theme);
      return true;
    }

    const start = sequence.point;
    const length = Math.hypot(worldPosition.x - start.x, worldPosition.z - start.z);
    if (length < glyphHeight * .025) return true; // In-place taps do not stack letters.
    if (!surface || length > Math.max(2, glyphHeight * 12)) {
      // Never bridge an offscreen/teleport gap with a burst. Reserve the phrase
      // until movement resumes; abandoned runs release through the idle timeout.
      sequence.point.copy(worldPosition);
      sequence.heading = heading;
      return true;
    }
    const headingDelta = Math.atan2(Math.sin(heading - sequence.heading), Math.cos(heading - sequence.heading));
    let travelled = 0;
    for (let guard = 0; sequence && guard < 128; guard++) {
      const available = length - travelled;
      if (sequence.remaining > available) { sequence.remaining -= available; break; }
      travelled += sequence.remaining;
      const t = travelled / length;
      candidate.lerpVectors(start, worldPosition, t);
      candidate.y = .002;
      const angle = sequence.heading + headingDelta * t;
      const at = visibleSurface(candidate, width, height);
      if (!at || !clearOfPrevious(candidate, angle, sequence.glyphs[sequence.index].inkWidth)) {
        sequence.remaining = glyphHeight * .08;
        continue;
      }
      plant(candidate, angle, at.theme);
      if (sequence) sequence.idle = 0;
    }
    if (sequence) { sequence.point.copy(worldPosition); sequence.heading = heading; }
    return true;
  }

  function update(dt) {
    sinceLast += dt;
    if (sequence && (sequence.idle += dt) >= IDLE_RELEASE) releaseSequence(false);
    for (const slot of stamps) {
      if (!slot.mesh.visible) continue;
      slot.age += dt;
      if (slot.fadeAge !== null) slot.fadeAge += dt;
      const progress = slot.fadeAge === null ? 0 : THREE.MathUtils.smoothstep(slot.fadeAge, hold, hold + fade);
      slot.mesh.material.uniforms.uOpacity.value = .98 * THREE.MathUtils.smoothstep(slot.age, 0, .12) * (1 - progress);
      if (slot.fadeAge !== null && slot.fadeAge >= hold + fade) slot.mesh.visible = false;
    }
  }

  return {
    tryStamp, update, colorAt,
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(group);
      for (const { mesh } of stamps) mesh.material.dispose();
      geometry.dispose();
      for (const item of textures.values()) item.texture.dispose();
      textures.clear();
    },
  };
}
