// Elemental transformation and skill effects, drawn inside the chick's own WebGL scene.
// Four pooled draws cover everything: two particle layers (lightning channels included),
// ground decals and instanced ice crystals. Emitting only rewrites pool slots, so the
// always-on skills never allocate GPU resources, and every effect sits on the same
// document-aligned ground as the chick.
//
// Skills are staged as a screen-scale event: while the element is charged the breath, the
// storm and the frost field run continuously at roughly five times the chick's own scale.
import * as THREE from './assets/vendor/three-r186/three.module.min.js';
import { createPageMarks } from './sumi-page-marks.js?v=dialog-fx-20261105';

const KIND = { FIRE: 0, SMOKE: 1, EMBER: 2, SPARK: 3, SHARD: 4, MIST: 5, FLASH: 6, MOTE: 7, DUST: 8, SHADE: 9, BOLT: 10 };
const DECAL = { SCORCH: 0, BURN: 1, FROST: 2, RING: 3, CIRCLE: 4 };   // CIRCLE + 0/1/2: fire, lightning, ice
// BOLT segment flags (stored in the seed): the last / first segment of a strand narrows to a point
const TIP_END = 1, TIP_START = 2;
const ELEMENT_INDEX = { fire: 0, lightning: 1, ice: 2, dark: 3 };

// fur/tip: the coat after the wipe; kind: one-hot weights for the coat's surface effect;
// shade: how far the coat greys toward its silhouette (dark's white coat only).
export const ELEMENT_FX_STYLE = {
  fire: { fur: [0.62, 0.07, 0.03], tip: [1, 0.62, 0.18], kind: [1, 0, 0], mote: [1, 0.55, 0.15], ring: [1, 0.42, 0.1], glow: [1, 0.55, 0.2] },
  lightning: { fur: [0.96, 0.64, 0.05], tip: [1, 0.96, 0.55], kind: [0, 1, 0], mote: [1, 0.88, 0.35], ring: [1, 0.74, 0.12], glow: [1, 0.82, 0.3] },
  ice: { fur: [0.12, 0.45, 0.82], tip: [0.84, 0.97, 1], kind: [0, 0, 1], mote: [0.78, 0.95, 1], ring: [0.5, 0.82, 1], glow: [0.6, 0.85, 1] },
  // dark: a quiet special element. A pure white coat against the dark (greying softly toward its
  // silhouette so it still reads on the white smoke), no surface effect, pale lines, and the page
  // itself sinks into smoke.
  dark: { fur: [0.97, 0.97, 0.99], tip: [1, 1, 1], kind: [0, 0, 0], shade: 0.55, mote: [0.85, 0.85, 0.95], ring: [0.82, 0.82, 0.92], glow: [0.3, 0.3, 0.36] },
};
// Dark's two coats: it transforms white and swaps white <-> black at every move (shadow step),
// while it is hidden in the smoke. Black is the earlier pitch-black coat with a faint grey rim.
export const DARK_COATS = {
  white: { fur: ELEMENT_FX_STYLE.dark.fur, tip: ELEMENT_FX_STYLE.dark.tip, shade: ELEMENT_FX_STYLE.dark.shade },
  black: { fur: [0.022, 0.022, 0.027], tip: [0.17, 0.17, 0.2], shade: 0 },
};

// Every effect writes premultiplied colour, matching the fur's source-over result on the
// transparent canvas. Glows may exceed their alpha slightly, which reads as light on dark sections.
const PREMULTIPLIED = {
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
};

const NOISE2 = /* glsl */ `
  float sq(float x) { return x * x; }
  float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s / 0.875; }
`;

/* ------------------------------------------------------------------ particles
   Stateless: each slot stores its spawn state and the vertex shader integrates drag,
   gravity/buoyancy and a little billowing from the age alone. Emitting rewrites one slot.

   Lightning uses the same pool: each channel segment is a BOLT particle stretched between
   two points (iP, iP + iV). A strike is a stepped leader that descends in 50 ms, a return
   stroke, two re-strikes and a faint afterglow; the channel comes from midpoint displacement
   with side branches, so no two bolts share a silhouette. Only the thin core flickers with
   the re-strikes; the rim and the wide glow follow the main stroke alone, which keeps the
   large bright areas to a single pulse per strike. */

const PARTICLE_VERT = /* glsl */ `
  attribute vec3 iP;
  attribute vec3 iV;
  attribute vec4 iT;   // spawn time, life, start size, end size   (BOLT: width, intensity)
  attribute vec4 iK;   // kind, seed, drag, vertical acceleration   (BOLT: along, re-strikes)
  attribute vec4 iC;   // tint rgb, alpha (or streak stretch)        (BOLT: core, rim, glow weights)
  uniform float uTime;
  varying vec2 vUv;
  varying float vLife, vKind, vSeed;
  varying vec4 vCol;
  varying vec2 vBolt;
  float sq(float x) { return x * x; }
  float strike(float a, float dur, float restrike) {
    if (a < 0.05) return 0.35;
    float x = a - 0.05;
    float i = exp(-x * 11.0)
      + restrike * (0.7 * exp(-sq((x - 0.09) * 45.0)) + 0.45 * exp(-sq((x - 0.19) * 45.0)));
    return min(i, 1.0) * (1.0 - smoothstep(dur * 0.7, dur, a)) + 0.12 * (1.0 - a / dur);
  }
  void main() {
    float age = uTime - iT.x;
    float u = age / iT.y;
    vUv = uv; vLife = u; vKind = iK.x; vSeed = iK.y; vCol = iC; vBolt = vec2(0.0);
    // No early returns: one gl_Position write at the end keeps every compiler path consistent.
    bool alive = u >= 0.0 && u < 1.0;
    int kind = int(iK.x + 0.5);
    float drag = iK.z;
    float f = drag > 0.0 ? (1.0 - exp(-drag * age)) / drag : age;
    vec3 p = iP + iV * f + vec3(0.0, 0.5 * iK.w * age * age, 0.0);
    vec3 vel = iV * (drag > 0.0 ? exp(-drag * age) : 1.0) + vec3(0.0, iK.w * age, 0.0);
    if (kind == 7) {           // converging mote: iV is the offset to its destination
      p = iP + iV * (u * u);
      vel = iV * 2.0 * u / iT.y;
    }
    if (kind == 0 || kind == 1 || kind == 5 || kind == 8) {
      float s = iK.y * 6.2831;
      p += vec3(sin(age * 2.3 + s), 0.0, cos(age * 1.9 + s * 1.3)) * (kind == 0 ? 0.05 : 0.14) * age * max(1.0, iT.w);
    }
    float size = mix(iT.z, iT.w, kind == 0 ? sqrt(u) : u);
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vec2 c = position.xy;
    vec2 off;
    if (kind == 2 || kind == 3) {
      vec2 d = (viewMatrix * vec4(vel, 0.0)).xy;
      float sp = length(d);
      vec2 dir = sp > 1e-4 ? d / sp : vec2(0.0, 1.0);
      off = dir * c.y * size * (1.0 + sp * iC.w) + vec2(-dir.y, dir.x) * c.x * size * 0.35;
    } else {
      float ang = iK.y * 6.2831 + age * (iK.y - 0.5) * (kind == 4 ? 14.0 : 1.5);
      float cs = cos(ang), sn = sin(ang);
      off = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs) * size;
    }
    mv.xy += off;
    if (kind == 10) {
      float gate = step(iK.z, clamp(age / 0.05, 0.0, 1.0));
      float intensity = strike(age, iT.y, iK.w) * iT.w * gate;
      vSeed = strike(age, iT.y, 0.0) * iT.w * gate;    // the stroke without re-strike flicker
      vKind = 10.0 + floor(iK.y + 0.5) * 0.1;          // tip flags ride along in the fraction
      // Each segment overruns both of its joints by ext: 15% of its length, or its half-width
      // when that is larger (the wide glow strands), so a joint's blend is as long as the glow is
      // wide. vBolt carries the along position and the half length, both in units of ext.
      vec2 d = (mat3(viewMatrix) * iV).xy;
      float l = length(d), h = iT.z;
      d = l > 1e-5 ? d / l : vec2(0.0, 1.0);
      l = max(l, 1e-4);
      float ext = max(0.15 * l, h), stretch = min(1.0 + 2.0 * ext / l, 40.0);
      mv = viewMatrix * vec4(iP + iV * (c.y * stretch + 0.5), 1.0);
      vBolt = vec2(c.y * stretch * l / ext, 0.5 * l / ext);
      // (across, along) must stay a rotation: a mirrored basis flips the quad's winding
      mv.xy += vec2(d.y, -d.x) * c.x * 2.0 * h;
      vCol = vec4(iC.rgb, intensity);
      alive = alive && max(intensity, vSeed) > 0.0001;
    }
    gl_Position = alive ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  varying vec2 vUv;
  varying float vLife, vKind, vSeed;
  varying vec4 vCol;
  varying vec2 vBolt;
  ${NOISE2}
  // Blackbody-like ramp: soot red, orange, yellow, a near-white core.
  vec3 fireRamp(float t) {
    vec3 c = mix(vec3(0.18, 0.03, 0.01), vec3(0.78, 0.12, 0.02), smoothstep(0.0, 0.3, t));
    c = mix(c, vec3(1.0, 0.45, 0.06), smoothstep(0.25, 0.55, t));
    c = mix(c, vec3(1.0, 0.8, 0.3), smoothstep(0.5, 0.8, t));
    return mix(c, vec3(1.0, 0.97, 0.85), smoothstep(0.82, 1.0, t));
  }
  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float r = length(q);
    float u = vLife;
    int kind = int(vKind + 0.5);
    vec3 col;
    float a;
    float boost = 1.0;
    if (kind == 0) {
      float n = fbm(q * 1.7 + vec2(vSeed * 13.0, -u * 2.5 - vSeed));
      float shape = 1.0 - smoothstep(0.35, 1.0, r + (n - 0.5) * 0.85);
      float heat = clamp((1.0 - u) * 1.15 - (n - 0.5) * 0.5 - r * 0.25, 0.0, 1.0) * vCol.x;
      col = fireRamp(heat);
      a = shape * smoothstep(0.0, 0.06, u) * (1.0 - smoothstep(0.55, 1.0, u)) * mix(0.55, 1.0, heat);
      boost = 1.0 + heat * 0.3;
    } else if (kind == 1 || kind == 8) {
      float n = fbm(q * 1.3 + vec2(vSeed * 9.0, -u * 1.2));
      float shape = 1.0 - smoothstep(0.2, 1.0, r + (n - 0.5) * 0.9);
      col = kind == 1 ? mix(vec3(0.13, 0.11, 0.10), vec3(0.42, 0.40, 0.39), u) : mix(vec3(0.55, 0.50, 0.42), vec3(0.72, 0.69, 0.63), u);
      a = shape * smoothstep(0.0, 0.25, u) * (1.0 - smoothstep(0.5, 1.0, u)) * vCol.a;
    } else if (kind == 2 || kind == 3) {
      float core = exp(-q.x * q.x * 10.0) * (1.0 - smoothstep(0.2, 1.0, abs(q.y)));
      col = kind == 2 ? mix(vec3(1.0, 0.92, 0.6), vec3(0.95, 0.3, 0.05), u) : mix(vec3(1.0, 0.98, 0.85), vec3(1.0, 0.62, 0.08), u * 0.85);
      a = core * (1.0 - smoothstep(0.6, 1.0, u));
      boost = kind == 2 ? 1.5 : 1.8;
    } else if (kind == 4) {
      float d = abs(q.x) * 1.6 + abs(q.y);
      if (d > 1.0) discard;
      float facet = q.x > 0.0 ? 1.0 : 0.6;
      col = mix(vec3(0.34, 0.68, 0.9), vec3(0.93, 0.99, 1.0), facet * (1.0 - d * 0.5));
      col += vec3(0.4) * (1.0 - smoothstep(0.0, 0.07, abs(q.x)));
      a = (1.0 - smoothstep(0.85, 1.0, d)) * (1.0 - smoothstep(0.7, 1.0, u)) * vCol.a;
    } else if (kind == 5) {
      float n = fbm(q * 1.2 + vec2(vSeed * 5.0, u));
      float shape = 1.0 - smoothstep(0.1, 1.0, r + (n - 0.5) * 0.8);
      col = mix(vec3(0.82, 0.94, 1.0), vec3(0.96, 0.98, 1.0), u);
      a = shape * smoothstep(0.0, 0.2, u) * (1.0 - smoothstep(0.45, 1.0, u)) * vCol.a;
    } else if (kind == 6) {
      col = vCol.rgb;
      a = exp(-r * r * 4.0) * vCol.a * (1.0 - u) * (1.0 - u);
      boost = 1.5;
    } else if (kind == 7) {
      float g = exp(-r * r * 9.0);
      col = mix(vCol.rgb, vec3(1.0), g * 0.6);
      a = g * smoothstep(0.0, 0.2, u) * (1.0 - smoothstep(0.88, 1.0, u)) * vCol.a;
      boost = 1.6;
    } else if (kind == 10) {
      // lightning channel: a white-hot core, a saturated gold rim that keeps it readable on
      // light pages, and a soft amber glow. vCol.rgb weights the three, so a wide halo strand
      // can carry the glow alone; vCol.a flickers with re-strikes, vSeed is the smooth stroke.
      // Joints: each segment's weight is a ramp up across its start joint minus a ramp up across
      // its end joint (both 2*ext wide). Along a chain those differences add up to exactly one,
      // so joints never draw twice (the old bright tick at every joint read as a dotted railway)
      // and the wide glow strands merge into one smooth tube instead of a stack of short bars.
      // Tips: the last (TIP_END) and/or first (TIP_START) segment narrows to a point instead.
      float x = vBolt.x, y = vBolt.y;   // along position and half length, in units of ext
      float tip = floor(fract(vKind) * 10.0 + 0.5);
      bool tipEnd = tip == 1.0 || tip == 3.0, tipStart = tip >= 2.0;
      float rampIn = tipStart ? 1.0 : smoothstep(-y - 1.0, -y + 1.0, x);
      float rampOut = tipEnd ? 0.0 : smoothstep(y - 1.0, y + 1.0, x);
      float join = max(rampIn - rampOut, 0.0);
      float prof = 1.0;
      if (tipEnd) prof = min(prof, clamp((y - x) / (2.0 * y), 0.0, 1.0));
      if (tipStart) prof = min(prof, clamp((x + y) / (2.0 * y), 0.0, 1.0));
      float s = abs(q.x) / max(pow(prof, 0.75), 1e-3);
      float core = exp(-sq(s * 6.0)) * vCol.r * vCol.a;
      float rim = exp(-sq((s - 0.19) * 12.0)) * 0.8 * vCol.g * vSeed;
      float haze = exp(-s * 2.6) * 0.55 * vCol.b * vSeed * step(s, 1.0);
      float sum = core + rim + haze;
      col = (vec3(1.0, 0.98, 0.88) * core + vec3(1.0, 0.66, 0.06) * rim + vec3(1.0, 0.8, 0.28) * haze) / max(sum, 0.001);
      a = clamp(sum, 0.0, 1.0) * join;
      boost = 1.25;
    } else {
      // storm shade: a soft dark sky patch so the bolts read on light pages too
      col = vec3(0.13, 0.11, 0.08);
      a = exp(-r * r * 3.0) * vCol.a * sin(u * 3.14159);
    }
    if (a < 0.003) discard;
    gl_FragColor = vec4(col * a * boost, a);
  }
`;

function particleLayer(capacity, renderOrder, uTime) {
  const quad = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = quad.index;
  geo.setAttribute('position', quad.attributes.position);
  geo.setAttribute('uv', quad.attributes.uv);
  const make = (name, n) => {
    const attr = new THREE.InstancedBufferAttribute(new Float32Array(capacity * n), n).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute(name, attr);
    return [attr, n];
  };
  const attrs = [make('iP', 3), make('iV', 3), make('iT', 4), make('iK', 4), make('iC', 4)];
  const [P, Vv, T, K, Cc] = attrs.map(([a]) => a.array);
  geo.instanceCount = capacity;
  // Double-sided so a stretched quad can never be culled by its own winding.
  const material = new THREE.ShaderMaterial({ ...PREMULTIPLIED, side: THREE.DoubleSide, uniforms: { uTime }, vertexShader: PARTICLE_VERT, fragmentShader: PARTICLE_FRAG });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = renderOrder;
  let head = 0, lo = Infinity, hi = -1;

  function kill() {
    for (let i = 0; i < capacity; i++) { T[i * 4] = -1e9; T[i * 4 + 1] = 1; }
    lo = 0; hi = capacity - 1;
  }
  kill();
  return {
    mesh,
    emit(kind, p, v, life, s0, s1, o = {}) {
      const i = head;
      head = (head + 1) % capacity;
      const c = o.color || WHITE;
      P[i * 3] = p.x; P[i * 3 + 1] = p.y; P[i * 3 + 2] = p.z;
      Vv[i * 3] = v.x; Vv[i * 3 + 1] = v.y; Vv[i * 3 + 2] = v.z;
      T[i * 4] = uTime.value + (o.delay || 0); T[i * 4 + 1] = life; T[i * 4 + 2] = s0; T[i * 4 + 3] = s1;
      K[i * 4] = kind; K[i * 4 + 1] = o.seed ?? Math.random(); K[i * 4 + 2] = o.drag || 0; K[i * 4 + 3] = o.grav || 0;
      Cc[i * 4] = c[0]; Cc[i * 4 + 1] = c[1]; Cc[i * 4 + 2] = c[2]; Cc[i * 4 + 3] = o.alpha ?? 1;
      lo = Math.min(lo, i); hi = Math.max(hi, i);
    },
    flush() {
      if (hi < lo) return;
      for (const [attr, n] of attrs) {
        attr.clearUpdateRanges();
        attr.addUpdateRange(lo * n, (hi - lo + 1) * n);
        attr.needsUpdate = true;
      }
      lo = Infinity; hi = -1;
    },
    clear: kill,
  };
}

/* ------------------------------------------------------------------ ground decals
   Flat quads on the virtual ground, each a procedural mark: scorched earth with cooling
   embers, a branching lightning burn, spreading frost, a shock ring, a charge circle. */

const DECAL_VERT = /* glsl */ `
  attribute vec4 iD;   // spawn time, life, kind, seed
  attribute vec4 iDc;  // tint rgb, alpha
  attribute float iDp; // 1: held on the page until the element ends
  uniform float uTime;
  varying vec2 vUv, vGround;
  varying vec4 vD, vDc;
  varying float vHeld;
  void main() {
    vUv = uv; vD = iD; vDc = iDc; vHeld = iDp;
    float u = (uTime - iD.x) / iD.y;
    if (u < 0.0 || (u > 1.0 && iDp < 0.5)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vGround = wp.xz;   // world ground position: frost detail keeps its size on any decal scale
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const DECAL_FRAG = /* glsl */ `
  uniform float uTime, uMarkFade, uPulse;
  varying vec2 vUv, vGround;
  varying vec4 vD, vDc;
  varying float vHeld;
  ${NOISE2}
  float lineAt(float x, float w) { return exp(-sq(x / w)); }
  // outline of a regular n-gon (circumradius R, rotated by rot) as a soft line
  float polyLine(vec2 p, float n, float R, float rot, float w) {
    float s = 6.2831853 / n;
    float m = mod(atan(p.y, p.x) + rot, s) - 0.5 * s;
    return lineAt(length(p) * cos(m) - R * cos(0.5 * s), w);
  }
  float sdSeg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
  }
  // a procedural rune: three strokes between points of a 3x3 grid
  float rune(vec2 g, float id) {
    float d = 1e3;
    for (int k = 0; k < 3; k++) {
      float h1 = hash12(vec2(id, float(k) * 7.13)), h2 = hash12(vec2(float(k) * 3.7 + 1.0, id * 1.91));
      vec2 a = (vec2(floor(h1 * 3.0), floor(fract(h1 * 9.7) * 3.0)) - 1.0) * vec2(0.55, 0.7);
      vec2 b = (vec2(floor(h2 * 3.0), floor(fract(h2 * 7.3) * 3.0)) - 1.0) * vec2(0.55, 0.7);
      if (dot(a - b, a - b) < 0.01) b = vec2(-a.x, 0.7 - a.y);
      d = min(d, sdSeg(g, a, b));
    }
    return d;
  }
  // The transformation magic circle. el: 0 fire, 1 lightning, 2 ice. u: 0..1 over its life.
  // It draws itself on until the burst at u = 0.3, flares, spins up, swells and fades.
  void magicCircle(vec2 p, float u, float seed, int el, out vec3 col, out float a) {
    float spin = seed >= 50.0 ? -1.0 : 1.0;
    float draw = smoothstep(0.0, 0.3, u);
    float flare = exp(-sq((u - 0.3) / 0.035));
    float fade = 1.0 - smoothstep(0.72, 1.0, u);
    vec2 q = p / (1.0 + 0.12 * smoothstep(0.3, 1.0, u));
    float rr = length(q), aa = atan(q.y, q.x);
    float turn = uTime * 0.45 + u * u * 5.0;                       // spin accelerates toward the end
    float stroke = step(fract((aa * spin + 1.5708) / 6.2831853), draw * 1.02);
    float L = (lineAt(rr - 0.95, 0.010) + lineAt(rr - 0.885, 0.006) * 0.8) * stroke;
    // rune band, turning against the frame; glyphs light up one by one
    float N = 40.0, ra = (aa - spin * turn * 0.6) / 6.2831853 * N, cid = floor(ra);
    vec2 g = vec2((fract(ra) - 0.5) * 6.2831853 * 0.835 / N, rr - 0.835) / 0.034;
    float glyph = (1.0 - smoothstep(0.09, 0.22, rune(g, mod(cid, N) + floor(seed) * 17.0))) * step(abs(rr - 0.835), 0.04);
    L += glyph * step(hash12(vec2(mod(cid, N), 3.0)), draw * 1.15);
    float ticks = step(0.45, fract((aa + spin * turn) / 6.2831853 * 60.0));
    L += (lineAt(rr - 0.765, 0.006) + lineAt(rr - 0.728, 0.010) * ticks * 0.8) * stroke;
    // the element's sigil grows in from the centre
    vec2 s = q / mix(0.55, 1.0, draw);
    float sr = length(s), sa = atan(s.y, s.x), rot = spin * turn * 0.8, sig = 0.0;
    if (el == 0) {
      // fire: a hexagram inside a ring of licking flame
      sig += polyLine(s, 3.0, 0.68, rot, 0.008) + polyLine(s, 3.0, 0.68, rot + 3.14159, 0.008);
      float lick = 0.47 + 0.05 * sin(8.0 * (sa - rot) + uTime * 3.0) + 0.025 * sin(13.0 * sa - uTime * 4.3);
      sig += lineAt(sr - lick, 0.009) * 1.2 + lineAt(sr - 0.22, 0.006) + lineAt(sr - 0.17, 0.004) * 0.7;
    } else if (el == 1) {
      // lightning: an octagram crossed by eight flickering zigzag bolts
      sig += polyLine(s, 4.0, 0.66, rot, 0.007) + polyLine(s, 4.0, 0.66, rot + 0.7854, 0.007);
      float sec = 6.2831853 / 8.0, ab = sa - rot * 1.3;
      float am = mod(ab + sec * 0.5, sec) - sec * 0.5;
      float zig = 0.022 * (abs(fract(sr * 12.0) - 0.5) * 4.0 - 1.0);
      float flick = step(0.3, hash12(vec2(floor(uTime * 12.0), floor(ab / sec + 0.5) + seed)));
      sig += lineAt(am * sr - zig, 0.007) * step(0.2, sr) * step(sr, 0.56) * (0.45 + 0.55 * flick) * 1.3;
      sig += lineAt(sr - 0.18, 0.006);
    } else if (el == 3) {
      // dark: a quiet crescent inside a ring of twelve dots, turning slowly
      vec2 off = vec2(cos(rot + 0.6), sin(rot + 0.6)) * 0.13;
      float outer = lineAt(sr - 0.42, 0.007) * step(0.36, length(s - off));
      float inner = lineAt(length(s - off) - 0.36, 0.006) * step(sr, 0.42);
      float sec = 6.2831853 / 12.0, am = mod(sa - rot * 0.5 + sec * 0.5, sec) - sec * 0.5;
      vec2 dp = vec2(cos(am), sin(am)) * sr - vec2(0.62, 0.0);
      sig += outer + inner + exp(-dot(dp, dp) / 0.0004) * 1.2 + lineAt(sr - 0.17, 0.004) * 0.6;
    } else {
      // ice: a hexagon around a six-fold dendrite with branches at sixty degrees
      sig += polyLine(s, 6.0, 0.66, rot, 0.007) + polyLine(s, 6.0, 0.16, rot + 0.5236, 0.005);
      float sec = 6.2831853 / 6.0;
      float am = mod(sa - rot + sec * 0.5, sec) - sec * 0.5;
      vec2 l = vec2(cos(am), abs(sin(am))) * sr;
      sig += lineAt(l.y, 0.007) * step(l.x, 0.6) * step(0.16, l.x);
      for (int k = 0; k < 3; k++) {
        float r0 = 0.22 + float(k) * 0.12, t = l.x - r0;
        sig += lineAt(l.y - t * 1.732, 0.006) * step(0.0, t) * step(t, 0.07 - float(k) * 0.012);
      }
    }
    L += sig * smoothstep(0.1, 0.6, draw) + lineAt(rr - 0.06, 0.008) * draw;
    float glow = (1.0 - smoothstep(0.0, 0.98, rr)) * 0.16 + lineAt(rr - 0.95, 0.06) * 0.22;
    float energy = (0.78 + 0.22 * sin(uTime * 7.0 - rr * 14.0)) * (1.0 + flare * 1.6);
    // line edges take a deep shade of the element colour and their cores glow near white,
    // so the circle reads as inked lines on light pages and as light on dark ones
    float lineA = clamp(L, 0.0, 1.5) * energy, glowA = glow * draw * (1.0 + flare);
    vec3 lineCol = mix(vDc.rgb * 0.62, mix(vDc.rgb, vec3(1.0), 0.4) * 1.4, smoothstep(0.2, 0.85, L));
    col = (lineCol * lineA + vDc.rgb * 1.2 * glowA) / max(lineA + glowA, 1e-3);
    a = (lineA + glowA) * fade * vDc.a;
  }
  void main() {
    float u = (uTime - vD.x) / vD.y;
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float ang = atan(p.y, p.x);
    int kind = int(vD.z + 0.5);
    float seed = vD.w;
    // A held mark stops at its settled look (cooled scorch, dark burn, full frost) and stays
    // until the element ends; then it erodes away through noise as uMarkFade drops to 0.
    bool held = vHeld > 0.5;
    if (held) u = min(u, kind == 0 ? 0.5 : kind == 1 ? 0.42 : 0.62);
    vec3 col;
    float a;
    if (kind == 0) {
      float edge = 0.62 + 0.3 * fbm(vec2(ang * 1.6 + seed * 10.0, seed));
      float m = 1.0 - smoothstep(edge - 0.3, edge, r);
      float soot = fbm(p * 3.0 + seed * 3.0);
      col = mix(vec3(0.09, 0.07, 0.06), vec3(0.22, 0.17, 0.13), soot);
      a = m * (0.42 + 0.2 * soot) * (1.0 - smoothstep(0.55, 1.0, u)) * smoothstep(0.0, 0.05, u);
      float hn = fbm(p * 5.0 + seed * 7.0);
      float heat = (1.0 - smoothstep(0.0, 0.45, u)) * smoothstep(0.55, 0.8, hn) * m;
      // a held scorch keeps a few embers smouldering in it
      if (held) heat = max(heat, smoothstep(0.66, 0.82, hn) * m * (0.45 + 0.35 * sin(uTime * uPulse + seed * 9.0 + p.x * 3.0)));
      col = mix(col, vec3(1.0, 0.45, 0.08) * 1.3, heat);
      a = max(a, heat * 0.9);
    } else if (kind == 1) {
      float w = fbm(p * 2.5 + seed * 4.0) * 3.0;
      float ray = abs(sin(ang * 5.0 + w + seed * 6.0));
      float ray2 = abs(sin(ang * 11.0 - w * 1.7 + seed * 3.0));
      float lines = (1.0 - smoothstep(0.0, 0.06 + r * 0.08, ray))
        + (1.0 - smoothstep(0.0, 0.04 + r * 0.05, ray2)) * step(0.35, r) * 0.7;
      float reach = 0.35 + 0.65 * fbm(vec2(ang * 2.0, seed * 5.0));
      lines *= 1.0 - smoothstep(reach * 0.7, reach, r);
      float centre = 1.0 - smoothstep(0.0, 0.28, r + (fbm(p * 4.0) - 0.5) * 0.15);
      float hot = 1.0 - smoothstep(0.0, 0.18, u);
      col = mix(vec3(0.2, 0.14, 0.06), vec3(1.0, 0.86, 0.4) * 1.35, hot);
      // a held burn keeps a faint golden charge breathing along its lines
      if (held) col = mix(col, vec3(1.0, 0.78, 0.25), lines * (0.25 + 0.2 * sin(uTime * uPulse * 0.7 + seed * 5.0)));
      a = clamp(lines * 0.75 + centre * 0.6, 0.0, 1.0) * (1.0 - smoothstep(0.5, 1.0, u)) * smoothstep(0.0, 0.03, u);
    } else if (kind == 2) {
      float grow = smoothstep(0.0, 0.3, u);
      float edge = grow * (0.7 + 0.3 * fbm(vec2(ang * 2.2 + seed * 9.0, seed * 2.0)));
      float m = 1.0 - smoothstep(edge - 0.12, edge, r);
      // feathery frost and pin-point glints in world units (about 16 px and 1-2 px on desktop)
      vec2 w = vGround;
      float rid = 1.0 - abs(vnoise(w * 7.0 + seed) * 2.0 - 1.0);
      float rid2 = 1.0 - abs(vnoise(w * 19.0 + seed * 3.0) * 2.0 - 1.0);
      float crystal = pow(rid, 8.0) * 0.6 + pow(rid2, 10.0) * 0.5;
      float glint = step(0.992, hash12(floor(w * 90.0) + floor(uTime * 3.0 + seed * 10.0)));
      col = mix(vec3(0.7, 0.88, 0.98), vec3(1.0), crystal) + glint * 0.8;
      a = m * (0.22 + crystal * 0.45 + glint * 0.5) * (1.0 - smoothstep(0.7, 1.0, u));
    } else if (kind == 3) {
      float rad = sqrt(u);
      float ring = exp(-sq((r - rad) * 9.0));
      col = vDc.rgb * 1.3;
      a = ring * (1.0 - u) * vDc.a;
    } else {
      magicCircle(p, u, seed, kind - 4, col, a);
    }
    if (held && uMarkFade < 0.999) a *= smoothstep(0.0, 0.18, uMarkFade * 1.2 - fbm(p * 2.5 + seed));
    if (a < 0.003) discard;
    gl_FragColor = vec4(col * a, min(a, 1.0));
  }
`;

/* ------------------------------------------------------------------ ice crystals
   Hexagonal prisms with a pyramidal tip. Facets are flat-shaded from screen derivatives,
   with a cold depth gradient, fresnel rim, sharp highlights and fracture planes inside. */

const CRYSTAL_VERT = /* glsl */ `
  attribute vec4 iG;   // start time, grow time, life, seed
  attribute float iO;  // opacity (lowered while the crystal hides the chick)
  uniform float uTime;
  varying vec3 vView, vLocal;
  varying float vFade, vSeed, vOpacity;
  void main() {
    float age = uTime - iG.x;
    vLocal = position; vSeed = iG.w; vOpacity = iO;
    if (age < 0.0 || age > iG.z) { vFade = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    float w = clamp(age / iG.y, 0.0, 1.0) - 1.0;   // overshoot, then settle
    float grow = 1.0 + 2.25 * w * w * w + 1.25 * w * w;
    float fade = 1.0 - smoothstep(iG.z - 0.3, iG.z, age);
    vec3 p = position;
    p.y *= max(grow, 0.0) * mix(0.55, 1.0, fade);
    p.xz *= mix(0.8, 1.0, fade);
    vFade = fade;
    vec4 mv = viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.0);
    vView = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const CRYSTAL_FRAG = /* glsl */ `
  uniform vec3 uLightView;
  varying vec3 vView, vLocal;
  varying float vFade, vSeed, vOpacity;
  void main() {
    if (vFade <= 0.0) discard;
    vec3 N = normalize(cross(dFdx(vView), dFdy(vView)));
    if (N.z < 0.0) N = -N;
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 L = normalize(uLightView);
    float ndl = max(dot(N, L), 0.0);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5);
    float spec = pow(max(dot(reflect(-L, N), V), 0.0), 36.0);
    vec3 col = mix(vec3(0.07, 0.3, 0.52), vec3(0.6, 0.88, 0.98), clamp(vLocal.y * 0.6 + ndl * 0.55, 0.0, 1.0));
    float plane = dot(vLocal, vec3(0.7, 1.3, 0.4)) * 2.2 + vSeed * 5.0;
    float crack = (1.0 - smoothstep(0.0, 0.025, abs(fract(plane) - 0.5))) * step(0.5, fract(vSeed * 7.3 + floor(plane) * 0.37));
    col += vec3(0.85, 0.97, 1.0) * crack * 0.5;
    col += vec3(0.9, 0.98, 1.0) * fres * 0.8 + vec3(1.0) * spec;
    col = mix(col, vec3(0.92, 0.98, 1.0), smoothstep(0.08, 0.0, vLocal.y) * 0.6);
    float a = clamp(0.74 + 0.26 * fres + spec * 0.3, 0.0, 1.0) * vFade * vOpacity;
    gl_FragColor = vec4(col * a, a);
  }
`;

/* ------------------------------------------------------------------ light pillar
   An open cylinder of element-coloured light that rises out of the magic circle while the
   chick charges and flares at the burst. Streaks use the angle's sine and cosine as noise
   coordinates, so there is no seam where the cylinder's UVs wrap. */

const PILLAR_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const PILLAR_FRAG = /* glsl */ `
  uniform float uTime, uPillar, uPillarWhite;
  uniform vec3 uPillarColor;
  varying vec2 vUv;
  ${NOISE2}
  void main() {
    float v = vUv.y, th = vUv.x * 6.2831853;
    float streak = smoothstep(0.42, 0.95, vnoise(vec2(cos(th) * 5.0 + v * 2.0 - uTime * 2.4, sin(th) * 5.0 + v * 1.3)));
    float fall = pow(1.0 - v, 1.5) * smoothstep(0.0, 0.03, v);
    float a = (0.16 + streak * 0.75) * fall * uPillar;
    if (a < 0.003) discard;
    // uPillarWhite 0 keeps the streaks in the column's own colour (the dark element's smoke column)
    gl_FragColor = vec4(mix(uPillarColor, vec3(1.0), streak * 0.45 * uPillarWhite) * a * 1.5, a * 0.6);
  }
`;

/* ------------------------------------------------------------------ ink smoke
   The dark element's smoke, made like the sumi ink cat's: a low-resolution feedback buffer whose
   contents are carried along a curl-noise flow, drift upward and fade, while the effects pour in
   fresh ink. R = white smoke, G = black ink. Drawn as a wash behind the chick, so its black body
   reads as a silhouette against the white smoke. */

const SIMPLEX3 = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`;
const INK_SPLATS = 16;
const INK_SIM_FRAG = /* glsl */ `
  uniform sampler2D uPrev;
  uniform float uAspect, uTime, uDt;
  uniform vec2 uShift, uTexel;
  uniform vec4 uSplat[${INK_SPLATS}];
  uniform int uSplatCount;
  varying vec2 vUv;
  ${SIMPLEX3}
  float psi(vec2 p, float t) { return snoise(vec3(p, t)) + 0.45 * snoise(vec3(p * 2.3 + 7.1, t * 1.4)); }
  vec2 curl(vec2 p, float t) {
    const float e = 0.015;
    float a = psi(p + vec2(0.0, e), t), b = psi(p - vec2(0.0, e), t);
    float c = psi(p + vec2(e, 0.0), t), d = psi(p - vec2(e, 0.0), t);
    return vec2(a - b, -(c - d)) / (2.0 * e);
  }
  void main() {
    // the ink cat's flow: two curl octaves and a slow upward drift; uShift keeps the smoke on the page
    // while it scrolls. The fine octave is a little stronger than the cat's, so round pours tear
    // into wisps instead of staying separate lumps.
    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    vec2 vel = curl(p * 1.8, uTime * 0.06) * 0.022 + curl(p * 5.6 + 3.0, uTime * 0.12) * 0.014 + vec2(0.004, 0.03);
    vec2 back = vUv - vel * uDt * vec2(1.0 / uAspect, 1.0) - uShift;
    vec4 prev = (back.x >= 0.0 && back.x <= 1.0 && back.y >= 0.0 && back.y <= 1.0) ? texture2D(uPrev, back) : vec4(0.0);
    // a slight diffusion each frame: neighbouring pours merge into one continuous plume
    vec4 nb = texture2D(uPrev, back + vec2(uTexel.x, 0.0)) + texture2D(uPrev, back - vec2(uTexel.x, 0.0))
            + texture2D(uPrev, back + vec2(0.0, uTexel.y)) + texture2D(uPrev, back - vec2(0.0, uTexel.y));
    prev = mix(prev, nb * 0.25, clamp(uDt * 14.0, 0.0, 0.5));
    float white = prev.r * pow(0.45, uDt), black = prev.g * pow(0.5, uDt);
    for (int i = 0; i < ${INK_SPLATS}; i++) {
      if (i >= uSplatCount) break;
      vec4 s = uSplat[i];
      vec2 d = (vUv - s.xy) * vec2(uAspect, 1.0);
      float g = exp(-dot(d, d) / (s.z * s.z));
      if (s.w > 0.0) white += s.w * g; else black -= s.w * g;
    }
    gl_FragColor = vec4(min(white, 2.0), min(black, 2.0), 0.0, 1.0);
  }
`;
const INK_VIEW_FRAG = /* glsl */ `
  uniform sampler2D uSmoke;
  uniform vec2 uTexel;
  varying vec2 vUv;
  ${NOISE2}
  void main() {
    vec2 s = texture2D(uSmoke, vUv).rg;
    float grain = vnoise(gl_FragCoord.xy * 0.4);
    // a gentler curve than first tuned (2.4): dense smoke no longer flattens into a plateau with a
    // sharp rim, which made every pour read as its own cotton lump
    float aW = (1.0 - exp(-s.r * 1.7)) * 0.94 * (0.9 + 0.1 * grain);
    float aB = (1.0 - exp(-s.g * 1.5)) * 0.92 * (0.9 + 0.1 * grain);
    // the white smoke glows: a soft halo from the smoke around this point, added as light
    // (premultiplied colour above the coverage brightens whatever lies beneath)
    float halo = 0.0;
    for (int i = 0; i < 6; i++) {
      float an = float(i) * 1.0472;
      halo += texture2D(uSmoke, vUv + vec2(cos(an), sin(an)) * uTexel * 4.0).r;
    }
    float glow = (1.0 - exp(-halo / 6.0 * 1.6)) * 0.55 + aW * 0.35;
    // where black ink thins out its edge catches a little light, so it still reads on the dark page
    float gx = texture2D(uSmoke, vUv + vec2(uTexel.x, 0.0)).g - texture2D(uSmoke, vUv - vec2(uTexel.x, 0.0)).g;
    float gy = texture2D(uSmoke, vUv + vec2(0.0, uTexel.y)).g - texture2D(uSmoke, vUv - vec2(0.0, uTexel.y)).g;
    float rim = clamp(length(vec2(gx, gy)) * 2.5, 0.0, 1.0);
    vec3 black = vec3(0.035, 0.035, 0.045) + vec3(0.3, 0.3, 0.34) * rim;
    float a = aB + aW * (1.0 - aB);
    vec3 col = black * aB + (vec3(1.0) * aW + vec3(0.9, 0.93, 1.0) * glow) * (1.0 - aB);
    if (a < 0.003 && glow < 0.003) discard;
    gl_FragColor = vec4(col, a);
  }
`;

/* ------------------------------------------------------------------ darkness
   The dark element's page: a full-screen pass drawn into a canvas of its own under the chick's
   canvas (see renderDarkness), so the page beneath sinks into smoky black while the page's text
   glow, then the chick, its white smoke and the butterfly stay on top. It spreads from the chick
   with a ragged smoke front (uDark 0..1) and draws back the same way. */

// Full-screen layers sit at the far end of the depth range: transparent materials always draw
// after opaque ones in three.js, whatever their renderOrder, so a depth-tested far plane is what
// keeps the darkness and the ink smoke behind the chick instead of painted over it.
const DARK_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }
`;
const DARK_RECTS = 32;
const DARK_FRAG = /* glsl */ `
  uniform float uTime, uDark, uAspect, uClipTop;
  uniform vec2 uOrigin, uView;
  uniform vec4 uRects[${DARK_RECTS}];   // boxes in CSS px (left, top, right, bottom)
  // per box: corner radius; brightness it keeps through the dark (0 = fully dark); rim strength
  // (1 = thumbnail rim, below 1 thinner and fainter, 0 = none); phase seed, negative when the box
  // ignores the clip line (a control inside a dialog's pinned header)
  uniform vec4 uBoxStyle[${DARK_RECTS}];
  uniform int uRectCount;
  varying vec2 vUv;
  ${NOISE2}
  float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  void main() {
    vec2 p = (vUv * 2.0 - 1.0) * vec2(uAspect, 1.0), o = uOrigin * vec2(uAspect, 1.0);
    float n = fbm(p * 1.1 + vec2(uTime * 0.05, -uTime * 0.03));
    float n2 = fbm(p * 2.6 - vec2(uTime * 0.04, uTime * 0.06));
    // The front spreads from the chick and reaches the far corner; the distance is capped at that
    // reach, so a page scrolled far from the chick is still wholly dark at full darkness.
    float reach = length(vec2(uAspect, 1.0)) * 2.0;
    float front = uDark * (reach + 1.4);
    float m = 1.0 - smoothstep(front - 0.6, front, min(length(p - o), reach + 0.1) + (n - 0.5) * 1.0);
    float a = m * (0.95 + 0.04 * n2);
    // faint smoke drifting in the dark
    vec3 col = vec3(0.028, 0.028, 0.036) + vec3(0.05, 0.05, 0.06) * smoothstep(0.5, 0.85, n2);
    // Boxes on the page: some keep part of their brightness through the dark (thumbnails, a
    // dialog's stage and close button), and card and thumbnail edges get a thin white-blue light
    // rim with a soft halo, breathing slowly, with a brighter band running around each edge, like
    // light circling into a black hole.
    vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uView;
    float glow = 0.0, keep = 0.0;
    for (int i = 0; i < ${DARK_RECTS}; i++) {
      if (i >= uRectCount) break;
      vec4 r = uRects[i];
      if (any(lessThan(px, r.xy - 24.0)) || any(greaterThan(px, r.zw + 24.0))) continue;   // cheap reject first
      vec4 st = uBoxStyle[i];
      float shown = max(step(st.w, -0.5), step(uClipTop, px.y));   // under a pinned header: hidden
      vec2 c = (r.xy + r.zw) * 0.5, b = (r.zw - r.xy) * 0.5;
      float d = sdRound(px - c, b, st.x);
      keep = max(keep, st.y * (1.0 - smoothstep(-0.75, 0.75, d)) * shown);
      if (st.z <= 0.0 || abs(d) > 24.0) continue;
      float fi = abs(st.w);
      float breathe = 0.72 + 0.28 * sin(uTime * 1.3 + fi * 1.7);
      vec2 q = (px - c) / max(b, vec2(1.0));
      // a comet of light: a bright head with a long tail fading behind it
      float s = fract((atan(q.y, q.x) + uTime * 0.9 + fi * 2.1) / 6.28318);
      float band = pow(s, 7.0) * smoothstep(1.0, 0.96, s);
      // a weaker rim is also narrower: below 1 it thins to a hairline
      glow += (exp(-d * d / (1.4 * st.z)) * 0.6 + exp(-abs(d) / (7.0 * st.z)) * 0.15) * st.z * breathe * (1.0 + band * 1.8) * shown;
    }
    glow *= m;
    a = min(a, 1.0 - keep);
    if (a < 0.003 && glow < 0.003) discard;
    gl_FragColor = vec4(col * a + vec3(0.86, 0.9, 1.0) * glow, a);
  }
`;

/* ------------------------------------------------------------------ head crest
   Replaces the old flat crown sprite while an element is charged: a camera-facing quad on the
   head with a procedural mark (a living flame, a crackling bolt, a frost halo behind 3D ice
   crystals). Sized in head units like the sprite it replaces; drawn without depth test so the
   head never hides it. */

const CREST_VERT = /* glsl */ `
  uniform vec2 uSize;
  uniform float uPop;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += vec2(position.x, position.y + 0.38) * uSize * length(modelMatrix[0].xyz) * uPop;   // anchored 12% above its base
    gl_Position = projectionMatrix * mv;
  }
`;
const CREST_FRAG = /* glsl */ `
  uniform float uTime, uShow, uOrb;   // uOrb (dark): 0 black orb, 1 white, 2 half and half
  uniform int uKind;
  varying vec2 vUv;
  ${NOISE2}
  vec3 fireRamp(float t) {
    vec3 c = mix(vec3(0.18, 0.03, 0.01), vec3(0.78, 0.12, 0.02), smoothstep(0.0, 0.3, t));
    c = mix(c, vec3(1.0, 0.45, 0.06), smoothstep(0.25, 0.55, t));
    c = mix(c, vec3(1.0, 0.8, 0.3), smoothstep(0.5, 0.8, t));
    return mix(c, vec3(1.0, 0.97, 0.85), smoothstep(0.82, 1.0, t));
  }
  // the lightning glyph, in quad units (iq's polygon distance)
  float sdBolt(vec2 p) {
    vec2 v[7] = vec2[](vec2(0.08, 0.96), vec2(-0.42, 0.0), vec2(-0.07, 0.03), vec2(-0.22, -0.86),
                       vec2(0.48, 0.24), vec2(0.11, 0.18), vec2(0.30, 0.96));
    float d = dot(p - v[0], p - v[0]), s = 1.0;
    for (int i = 0, j = 6; i < 7; j = i, i++) {
      vec2 e = v[j] - v[i], w = p - v[i];
      vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
      d = min(d, dot(b, b));
      bvec3 c = bvec3(p.y >= v[i].y, p.y < v[j].y, e.x * w.y > e.y * w.x);
      if (all(c) || all(not(c))) s = -s;
    }
    return s * sqrt(d);
  }
  // one flame tongue (x offset, height scale, lean): domain-warped noise in a tapering
  // silhouette; returns temperature in x and coverage in y
  vec2 tongue(vec2 q, float ox, float hs, float lean, float seed) {
    float t = uTime;
    float y = (q.y + 0.76) / (1.62 * hs);
    float n = fbm(vec2((q.x - ox) * 2.6 + seed, y * 2.4 - t * 2.6));
    float n2 = fbm(vec2((q.x - ox) * 5.0 + 4.0 + seed, y * 5.0 - t * 4.2));
    float x = q.x - ox - lean * y - (n - 0.5) * 0.55 * y - sin(t * 2.7 + y * 5.0 + seed) * 0.05 * y;
    float w = 0.6 * hs * pow(clamp(1.0 - y, 0.0, 1.0), 0.75) * (0.85 + 0.3 * n2) * smoothstep(-0.16, 0.1, y);
    float d = abs(x) / max(w, 1e-3);
    float body = 1.0 - smoothstep(0.55, 1.0, d + (n2 - 0.5) * 0.5);
    float heat = clamp((1.0 - d * 0.8) * (1.25 - y) + (n2 - 0.5) * 0.35, 0.0, 1.0);
    return vec2(heat, body * smoothstep(0.02, 0.22, heat));
  }
  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    vec3 col = vec3(0.0);
    float a = 0.0, t = uTime;
    if (uKind == 0) {
      // a living flame: a tall central tongue between two shorter ones leaning outward,
      // standing on a white-hot ember bed and coloured by temperature
      vec2 m = tongue(q, 0.0, 1.0, 0.0, 0.0);
      vec2 l = tongue(q, -0.27, 0.62, -0.2, 3.1);
      vec2 r = tongue(q, 0.27, 0.58, 0.2, 7.7);
      float fa = max(m.y, max(l.y, r.y));
      float heat = max(m.x * step(0.01, m.y), max(l.x * step(0.01, l.y), r.x * step(0.01, r.y)));
      float bed = exp(-(q.x * q.x * 7.0 + sq(q.y + 0.7) * 40.0));
      heat = max(heat, bed);
      fa = max(fa, bed * 0.9);
      vec3 fc = fireRamp(heat);
      // embers lifting off the tip
      float sparks = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i), life = fract(t * (0.5 + 0.09 * fi) + fi * 0.37);
        vec2 sp = vec2((hash12(vec2(fi, floor(t * (0.5 + 0.09 * fi) + fi * 0.37))) - 0.5) * 0.6 + sin(t * 2.0 + fi) * 0.08, 0.05 + life * 0.95);
        sparks += exp(-dot(q - sp, q - sp) * 1500.0) * (1.0 - life);
      }
      float halo = exp(-(q.x * q.x * 2.4 + sq(q.y + 0.25) * 1.6)) * 0.32;
      a = clamp(fa + halo + sparks, 0.0, 1.0);
      col = (fc * fa * (1.0 + heat * 0.4) + vec3(1.0, 0.45, 0.12) * halo + vec3(1.0, 0.75, 0.3) * sparks * 1.6) / max(a, 1e-3);
    } else if (uKind == 1) {
      // a crackling bolt: white-hot core, gold body, dark amber outline (readable on light pages),
      // a soft glow and short arcs that leap off it in flickering steps
      vec2 b = (q - vec2(0.0, 0.06)) / 0.82;
      float d = sdBolt(b) * 0.82 + (vnoise(q * 14.0 + vec2(t * 23.0, -t * 17.0)) - 0.5) * 0.02;
      float fill = 1.0 - smoothstep(-0.008, 0.008, d);
      float core = 1.0 - smoothstep(-0.09, -0.025, d);
      float outline = exp(-sq((d - 0.012) / 0.009));
      float glow = exp(-max(d, 0.0) * 8.0) * 0.5 * (0.85 + 0.15 * step(0.5, fract(t * 9.0)));
      float arcs = 0.0;
      for (int k = 0; k < 4; k++) {
        float fk = float(k), st = floor(t * 13.0 + fk * 3.1);
        float ang = hash12(vec2(st, fk)) * 6.2831853;
        vec2 dir = vec2(cos(ang), sin(ang));
        float along = dot(q, dir), across = dot(q, vec2(-dir.y, dir.x));
        float wob = (vnoise(vec2(along * 10.0, st * 1.7 + fk)) - 0.5) * 0.25 * along;
        arcs += exp(-sq((across - wob) / 0.014)) * smoothstep(0.2, 0.36, along) * (1.0 - smoothstep(0.55, 0.95, along))
          * step(0.35, hash12(vec2(fk, st * 0.37)));
      }
      vec3 bodyCol = mix(vec3(1.0, 0.66, 0.08), vec3(1.0, 0.9, 0.35), clamp(b.y * 0.5 + 0.5, 0.0, 1.0));
      vec3 fc = mix(bodyCol, vec3(1.0, 0.99, 0.88), core);
      a = clamp(fill + outline * 0.9 + glow + arcs, 0.0, 1.0);
      col = (fc * fill * 1.15 + vec3(0.62, 0.32, 0.02) * outline * 0.9 * (1.0 - fill) + vec3(1.0, 0.8, 0.28) * glow
        + vec3(1.0, 0.96, 0.72) * arcs * 1.4) / max(a, 1e-3);
    } else if (uKind == 3) {
      // dark: a still black orb with a thin pale halo, and white smoke curling up from it
      vec2 c = q - vec2(0.0, -0.12);
      float r = length(c);
      float orb = 1.0 - smoothstep(0.25, 0.28, r);
      float halo = exp(-sq((r - 0.3) / 0.03)) * (0.7 + 0.3 * sin(t * 1.2));
      float soft = exp(-max(r - 0.29, 0.0) * 8.0) * 0.3 * (1.0 - orb);
      float n = fbm(vec2(q.x * 3.0 + 1.7, q.y * 2.2 - t * 0.35));
      float sway = abs(q.x - 0.08 * sin(q.y * 4.0 + t * 0.9));
      float wisp = smoothstep(0.5, 0.82, n) * smoothstep(0.12, 0.4, q.y) * (1.0 - smoothstep(0.5, 0.95, q.y)) * (1.0 - smoothstep(0.12, 0.4, sway)) * 0.65;
      a = clamp(orb + halo + soft + wisp, 0.0, 1.0);
      // the minigame colours the orb with the colour to break next: black, white, or half and half
      float white = uOrb < 0.5 ? 0.0 : uOrb < 1.5 ? 1.0 : step(0.0, c.x);
      vec3 orbCol = mix(vec3(0.02, 0.02, 0.03), vec3(0.97, 0.97, 1.0), white);
      vec3 haloCol = mix(vec3(0.93, 0.93, 1.0), vec3(0.05, 0.05, 0.07), uOrb > 0.5 && uOrb < 1.5 ? 1.0 : 0.0);   // a white orb gets a dark ring
      col = (orbCol * orb + haloCol * halo + vec3(0.8, 0.8, 0.9) * soft + vec3(0.9) * wisp) / max(a, 1e-3);
    } else {
      // frost halo behind the crystal crown: a cold glow, a slowly turning six-fold snowflake
      // and four twinkling glints
      vec2 c = q - vec2(0.0, -0.05);
      float r = length(c), sa = atan(c.y, c.x) - t * 0.25;
      float sec = 6.2831853 / 6.0, am = mod(sa + sec * 0.5, sec) - sec * 0.5;
      vec2 l = vec2(cos(am), abs(sin(am))) * r;
      float flake = exp(-sq(l.y / 0.012)) * step(l.x, 0.82) * step(0.12, l.x);
      for (int k = 0; k < 3; k++) {
        float r0 = 0.3 + float(k) * 0.16, tt = l.x - r0;
        flake += exp(-sq((l.y - tt * 1.732) / 0.011)) * step(0.0, tt) * step(tt, 0.1 - float(k) * 0.02);
      }
      flake *= 0.55;
      float halo = exp(-r * r * 3.2) * 0.4;
      float glints = 0.0;
      for (int k = 0; k < 4; k++) {
        float fk = float(k);
        vec2 gp = vec2(cos(fk * 1.9 + 0.6), sin(fk * 2.3 + 1.1)) * vec2(0.62, 0.55);
        vec2 dq = abs(q - gp);
        float tw = pow(0.5 + 0.5 * sin(t * (2.2 + fk * 0.7) + fk * 1.7), 6.0);
        glints += (exp(-dq.x * 90.0) * exp(-dq.y * 16.0) + exp(-dq.y * 90.0) * exp(-dq.x * 16.0)) * tw;
      }
      a = clamp(halo + flake + glints, 0.0, 1.0);
      col = (vec3(0.55, 0.85, 1.0) * halo + vec3(0.85, 0.97, 1.0) * flake + vec3(1.0) * glints * 1.4) / max(a, 1e-3);
    }
    a *= uShow;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col * a, a);
  }
`;

function crystalGeometry() {
  const sides = 6, top = 0.82, body = 0.74, pos = [];
  const ring = (r, y, i) => {
    const a = (i / sides) * Math.PI * 2;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  for (let i = 0; i < sides; i++) {
    const b0 = ring(1, 0, i), b1 = ring(1, 0, i + 1), t0 = ring(top, body, i), t1 = ring(top, body, i + 1);
    pos.push(...b0, ...t0, ...b1, ...b1, ...t0, ...t1, ...t0, 0, 1, 0, ...t1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

const WHITE = [1, 1, 1];
const HALO = [0, 0.2, 1];    // bolt layer weights for a wide strand that only glows
const ZERO = new THREE.Vector3();
const v = () => new THREE.Vector3();

export function createElementFx(scene, camera, { reducedMotion = false, lowPower = false, furUniforms, head = null, renderer = null, onBurst = null, onIcePillar = null, blinkSpeed = null } = {}) {
  const quality = reducedMotion ? 0.3 : lowPower ? 0.55 : 1;
  // Scale of everything a skill emits relative to the chick (sizes, speeds, reach). The coat's
  // own aura stays chick-sized; the transformation burst and footsteps use fractions of it.
  const S = reducedMotion ? 2 : lowPower ? 3 : 5;
  const B = S * 0.8;                     // transformation burst
  const FOOT = S * 0.45;                 // footstep marks
  const SLOW = 1 + (S - 1) * 0.1;        // larger plumes move slower relative to their size
  const BOLT_W = Math.sqrt(S) * 0.9;     // lightning stays long and thin: width grows with sqrt
  // Placement in the chick's own units (it stands about 0.49 wide and 0.83 tall).
  const CHICK_H = 0.83;
  const STORM_R = 1.45;                  // strikes land within this ground radius of the chick
  const RING_R = 0.6;                    // small crystals hug the chick within this radius
  const TRAIL_LAG = 0.6;                 // big crystals rise this far back along the walked path
  const uTime = { value: 0 };
  const group = new THREE.Group();
  group.name = 'sumi-element-fx';
  scene.add(group);

  const back = particleLayer(lowPower ? 1000 : 2000, 1, uTime);
  const front = particleLayer(lowPower ? 2400 : 4800, 4, uTime);
  group.add(back.mesh, front.mesh);

  // ground decals. Scorch, burn and frost marks made while the element is charged are held on
  // the page (the ground is document-aligned, so they scroll with the content) until it ends.
  const DECALS = 256, HELD_MAX = lowPower ? 60 : 110;
  const decalGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const decalD = new THREE.InstancedBufferAttribute(new Float32Array(DECALS * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const decalC = new THREE.InstancedBufferAttribute(new Float32Array(DECALS * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const decalP = new THREE.InstancedBufferAttribute(new Float32Array(DECALS), 1).setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < DECALS; i++) { decalD.array[i * 4] = -1e9; decalD.array[i * 4 + 1] = 1; }
  decalGeo.setAttribute('iD', decalD);
  decalGeo.setAttribute('iDc', decalC);
  decalGeo.setAttribute('iDp', decalP);
  const markU = { uTime, uMarkFade: { value: 1 }, uPulse: { value: reducedMotion ? 0 : 2 } };
  const decals = new THREE.InstancedMesh(decalGeo, new THREE.ShaderMaterial({
    ...PREMULTIPLIED, uniforms: markU, vertexShader: DECAL_VERT, fragmentShader: DECAL_FRAG,
  }), DECALS);
  // held marks: {i, kind, x, z, r, zs, angle, variant, settleAt}; i is the decal slot while the
  // mark is still live in WebGL, -1 once it has been stamped onto the page. Release fades them
  // out once the element ends.
  let held = [], holding = false, release = -1, pageFlash = 0, lastPageFlash = -1;

  // Hybrid marks: a held mark plays its hot birth here in WebGL; once it has settled it is
  // stamped onto the page as a static image (sumi-page-marks.js) and its decal slot is freed, so
  // accumulated marks cost nothing per frame. The stamp images are baked from this very shader in
  // four seeds per kind, and live marks use the same seeds, so a stamp matches the mark it replaces.
  // Only scorch and lightning burns are stamped: their patterns live in the decal's own UV space,
  // so a baked image matches at any size. Frost detail is in world units (a magnified bake would
  // coarsen it), and frost was the cheapest held mark anyway, so it stays live in WebGL.
  const STAMP_SEEDS = [1.3, 3.7, 6.1, 8.9];
  const STAMPED = [DECAL.SCORCH, DECAL.BURN];
  const SETTLE = { [DECAL.SCORCH]: 0.5, [DECAL.BURN]: 0.42, [DECAL.FROST]: 0.62 };      // held look (as in the shader)
  const FADE_FROM = { [DECAL.SCORCH]: 0.55, [DECAL.BURN]: 0.5 };                        // where each kind's own fade begins
  const stampURL = { [DECAL.SCORCH]: [], [DECAL.BURN]: [] };
  const STAMP_MAX = lowPower ? 160 : 320;
  const pageMarks = renderer ? createPageMarks() : null;
  let disposed = false;
  decals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  decals.frustumCulled = false;
  decals.renderOrder = -7;
  group.add(decals);
  let decalHead = 0;

  // ice crystals
  const CRYSTALS = 220;
  const crystalGeo = crystalGeometry();
  const crystalG = new THREE.InstancedBufferAttribute(new Float32Array(CRYSTALS * 4), 4).setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < CRYSTALS; i++) { crystalG.array[i * 4] = -1e9; crystalG.array[i * 4 + 2] = 0; }
  crystalGeo.setAttribute('iG', crystalG);
  // per-crystal opacity: a crystal standing between the chick and the viewer turns see-through
  const crystalO = new THREE.InstancedBufferAttribute(new Float32Array(CRYSTALS).fill(1), 1).setUsage(THREE.DynamicDrawUsage);
  crystalGeo.setAttribute('iO', crystalO);
  const lightView = new THREE.Vector3();
  const crystals = new THREE.InstancedMesh(crystalGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: true,
    blending: PREMULTIPLIED.blending, blendEquation: PREMULTIPLIED.blendEquation,
    blendSrc: PREMULTIPLIED.blendSrc, blendDst: PREMULTIPLIED.blendDst,
    blendSrcAlpha: PREMULTIPLIED.blendSrcAlpha, blendDstAlpha: PREMULTIPLIED.blendDstAlpha,
    uniforms: { uTime, uLightView: { value: lightView } },
    vertexShader: CRYSTAL_VERT, fragmentShader: CRYSTAL_FRAG,
  }), CRYSTALS);
  crystals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crystals.frustumCulled = false;
  crystals.renderOrder = 2;
  group.add(crystals);
  let crystalHead = 0;
  // light pillar out of the magic circle
  const pillarU = { uTime, uPillar: { value: 0 }, uPillarWhite: { value: 1 }, uPillarColor: { value: new THREE.Vector3() } };
  // the dark element's darkness pass (drawn before everything else in the scene)
  const darkU = {
    uTime, uDark: { value: 0 }, uAspect: { value: 1 }, uOrigin: { value: new THREE.Vector2() }, uView: { value: new THREE.Vector2(1, 1) },
    uRects: { value: Array.from({ length: DARK_RECTS }, () => new THREE.Vector4()) }, uBoxStyle: { value: Array.from({ length: DARK_RECTS }, () => new THREE.Vector4()) }, uRectCount: { value: 0 }, uClipTop: { value: 0 },
  };
  const darkness = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    ...PREMULTIPLIED, depthTest: false, uniforms: darkU, vertexShader: DARK_VERT, fragmentShader: DARK_FRAG,
  }));
  darkness.name = 'sumi-element-darkness';
  darkness.frustumCulled = false;
  darkness.renderOrder = -60;
  darkness.visible = false;
  let darkAmount = 0;
  // dark's coat, 'white' or 'black' (DARK_COATS): swapped by every move while the chick is hidden
  let darkCoat = 'white';
  function swapDarkCoat() {
    darkCoat = darkCoat === 'white' ? 'black' : 'white';
    const c = DARK_COATS[darkCoat];
    furUniforms.uElemColor.value.fromArray(c.fur);
    furUniforms.uElemTip.value.fromArray(c.tip);
    if (furUniforms.uElemShade) furUniforms.uElemShade.value = c.shade;
  }
  // The darkness has a canvas of its own (.sumi-dark-canvas, z 14) under the page's text glow
  // (sumi-text-fx.js, also z 14 but later in the DOM) and under the chick's canvas (z 15): the
  // glowing text sits above the dark, and the chick, its smoke and the butterfly above the text.
  // Only this full-screen quad renders into it. Made on first use; if a second WebGL context is
  // refused, the darkness falls back into this scene, behind the chick by depth as before.
  const darkScene = new THREE.Scene(), darkCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  darkScene.add(darkness);
  let darkRenderer = null, darkHost = null, darkW = 0, darkH = 0, darkPR = 0;
  function placeDarkCanvas() {
    const c = darkRenderer?.domElement;
    if (!c) return;
    const host = darkHost || document.body;
    // above the edge veil, under the text glow layers that are appended after it
    const veils = host.querySelectorAll(':scope > .sumi-veil');
    if (veils.length) veils[veils.length - 1].after(c); else host.append(c);
  }
  function renderDarkness() {
    if (darkRenderer === null) {
      if (!darkness.visible) return;
      try {
        darkRenderer = new THREE.WebGLRenderer({ alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
        darkRenderer.setClearColor(0x000000, 0);
        const c = darkRenderer.domElement;
        c.className = 'sumi-dark-canvas';
        c.setAttribute('aria-hidden', 'true');
        placeDarkCanvas();
      } catch {
        darkRenderer = false;
        darkScene.remove(darkness);
        darkness.material.depthTest = true;
        group.add(darkness);
      }
    }
    if (!darkRenderer) return;
    const c = darkRenderer.domElement;
    if (!darkness.visible) { if (!c.hidden) c.hidden = true; return; }
    if (c.hidden) c.hidden = false;
    if (c.parentElement !== (darkHost || document.body)) placeDarkCanvas();
    const w = window.innerWidth, h = window.innerHeight, pr = renderer?.getPixelRatio?.() || 1;
    if (w !== darkW || h !== darkH || pr !== darkPR) { darkW = w; darkH = h; darkPR = pr; darkRenderer.setPixelRatio(pr); darkRenderer.setSize(w, h, false); }
    darkRenderer.render(darkScene, darkCam);
  }

  // the dark element's ink smoke buffer: simulated off-screen, shown by inkView behind the chick
  const inkOpts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
  const inkRT = [new THREE.WebGLRenderTarget(2, 2, inkOpts), new THREE.WebGLRenderTarget(2, 2, inkOpts)];
  const inkSimU = {
    uPrev: { value: null }, uAspect: { value: 1 }, uTime: { value: 0 }, uDt: { value: 0 }, uShift: { value: new THREE.Vector2() }, uTexel: { value: new THREE.Vector2() },
    uSplat: { value: Array.from({ length: INK_SPLATS }, () => new THREE.Vector4()) }, uSplatCount: { value: 0 },
  };
  const inkSim = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, uniforms: inkSimU, vertexShader: DARK_VERT, fragmentShader: INK_SIM_FRAG,
  }));
  inkSim.frustumCulled = false;
  const inkSimScene = new THREE.Scene();
  inkSimScene.add(inkSim);
  const inkCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const inkViewU = { uSmoke: { value: inkRT[0].texture }, uTexel: { value: new THREE.Vector2() } };
  const inkView = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    ...PREMULTIPLIED, depthTest: true, uniforms: inkViewU, vertexShader: DARK_VERT, fragmentShader: INK_VIEW_FRAG,
  }));
  inkView.name = 'sumi-element-ink';
  inkView.frustumCulled = false;
  inkView.renderOrder = -59;   // over the darkness, behind the chick
  inkView.visible = false;
  inkView.userData.splats = 0;
  group.add(inkView);
  let inkSplatN = 0, inkLast = -1e9, inkLive = false, inkHasOrigin = false;
  const inkOrigin = new THREE.Vector2(), _bufferSize = new THREE.Vector2(), _clear = new THREE.Color();

  function clearInk() {
    if (!renderer) return;
    const target = renderer.getRenderTarget(), alpha = renderer.getClearAlpha();
    renderer.getClearColor(_clear);
    renderer.setClearColor(0x000000, 0);
    for (const rt of inkRT) { renderer.setRenderTarget(rt); renderer.clear(); }
    renderer.setRenderTarget(target);
    renderer.setClearColor(_clear, alpha);
  }
  // Pours a scene of additive emitters into the ink buffer, drawn with the page camera (the buffer
  // is screen-aligned, like the scene's own trace buffer). R adds white smoke, G black ink.
  // The chick's dissolving footprints use it while dark, the way the ink cat's paw prints do.
  function pourIntoInk(emitters, cam) {
    if (!renderer) return;
    inkLast = time;   // keeps the buffer awake
    if (!inkLive) return;   // it wakes, sizes and clears on the next step
    const target = renderer.getRenderTarget(), autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(inkRT[0]);
    renderer.render(emitters, cam);
    renderer.setRenderTarget(target);
    renderer.autoClear = autoClear;
  }

  // Runs only while ink is alive (poured within the last 9 s); otherwise the buffer sleeps.
  function stepInk(dt) {
    if (!renderer) return;
    if (time - inkLast > 9) { inkView.visible = false; inkLive = false; inkSplatN = 0; return; }
    renderer.getDrawingBufferSize(_bufferSize);
    const scale = lowPower ? 0.25 : 0.35;
    const w = Math.max(2, Math.round(_bufferSize.x * scale)), h = Math.max(2, Math.round(_bufferSize.y * scale));
    if (inkRT[0].width !== w || inkRT[0].height !== h) { for (const rt of inkRT) rt.setSize(w, h); inkLive = false; }
    if (!inkLive) { clearInk(); inkLive = true; inkHasOrigin = false; }
    // the page scrolls the world under a fixed screen: follow a world point to keep the smoke on the page
    _n.set(0, 0, 0).project(camera);
    if (inkHasOrigin) inkSimU.uShift.value.set((_n.x - inkOrigin.x) * 0.5, (_n.y - inkOrigin.y) * 0.5);
    else inkSimU.uShift.value.set(0, 0);
    inkOrigin.set(_n.x, _n.y);
    inkHasOrigin = true;
    const speed = reducedMotion ? 0.35 : 1;
    inkSimU.uAspect.value = (camera.right - camera.left) / Math.max(1e-6, camera.top - camera.bottom);
    inkSimU.uTime.value = time * speed;
    inkSimU.uDt.value = dt * speed;
    inkSimU.uPrev.value = inkRT[0].texture;
    inkSimU.uTexel.value.set(1 / w, 1 / h);
    inkSimU.uSplatCount.value = inkSplatN;
    const target = renderer.getRenderTarget();
    renderer.setRenderTarget(inkRT[1]);
    renderer.render(inkSimScene, inkCam);
    renderer.setRenderTarget(target);
    inkRT.reverse();
    inkViewU.uSmoke.value = inkRT[0].texture;
    inkViewU.uTexel.value.set(1 / w, 1 / h);
    inkView.visible = fxVisible;
    inkSplatN = 0;
  }
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 64, 1, true).translate(0, 0.5, 0),
    new THREE.ShaderMaterial({ ...PREMULTIPLIED, side: THREE.DoubleSide, uniforms: pillarU, vertexShader: PILLAR_VERT, fragmentShader: PILLAR_FRAG }));
  pillar.frustumCulled = false;
  pillar.renderOrder = 3;
  pillar.visible = false;
  group.add(pillar);

  // head crest: a procedural mark on the head plus, for ice, a small crown of 3D crystals.
  // Both are children of the head, so they follow its turns and bobbing.
  const crestU = { uTime, uShow: { value: 0 }, uPop: { value: 1 }, uKind: { value: 0 }, uOrb: { value: 0 }, uSize: { value: new THREE.Vector2(0.42, 0.56) } };
  const crest = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    ...PREMULTIPLIED, depthTest: false, uniforms: crestU, vertexShader: CREST_VERT, fragmentShader: CREST_FRAG,
  }));
  crest.name = 'sumi-element-crest';
  crest.frustumCulled = false;
  crest.renderOrder = 5;
  crest.position.set(0.015, 0.155, 0.015);
  crest.visible = false;
  const CREST_ICE = [   // head-local: x, z, height, width, tilt about z, tilt about x
    [0, 0, 0.42, 0.065, 0, 0], [-0.085, 0.01, 0.29, 0.05, 0.4, 0.06], [0.085, 0.01, 0.3, 0.05, -0.38, -0.05],
    [-0.045, -0.055, 0.22, 0.04, 0.22, -0.32], [0.05, -0.05, 0.2, 0.038, -0.24, -0.3],
    [-0.13, 0.03, 0.15, 0.032, 0.7, 0.1], [0.13, 0.03, 0.16, 0.032, -0.68, -0.1],
  ];
  const crestGeo = crystalGeometry();
  const crestG = new THREE.InstancedBufferAttribute(new Float32Array(CREST_ICE.length * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const crestO = new THREE.InstancedBufferAttribute(new Float32Array(CREST_ICE.length), 1).setUsage(THREE.DynamicDrawUsage);
  crestGeo.setAttribute('iG', crestG);
  crestGeo.setAttribute('iO', crestO);
  const crestIce = new THREE.InstancedMesh(crestGeo, crystals.material, CREST_ICE.length);
  crestIce.name = 'sumi-element-crest-ice';
  crestIce.frustumCulled = false;
  crestIce.renderOrder = 6;
  crestIce.visible = false;
  {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    CREST_ICE.forEach(([x, z, h, w, rz, rx], i) => {
      q.setFromEuler(e.set(rx, i * 0.7, rz));
      crestIce.setMatrixAt(i, m.compose(new THREE.Vector3(0.015 + x, 0.14, 0.015 + z), q, new THREE.Vector3(w, h, w)));
      crestG.array.set([-1e9, 0.32, 1e9, i * 0.23 + 0.1], i * 4);
    });
  }
  if (head) head.add(crest, crestIce);
  let crestShow = 0, crestPop = -1, crestElement = '';
  const _crestTip = new THREE.Vector3();

  // CPU copy of each slot's footprint, so a crystal the chick walks behind can turn see-through
  const crystalInfo = Array.from({ length: CRYSTALS }, () => ({ start: 0, end: -1, x: 0, z: 0, h: 0, w: 0, serial: 0 }));
  // the walked path (recent ice footsteps) and where big trail crystals recently rose
  let trail = [], trailSpawns = [];

  const LIGHT = new THREE.Vector3(-0.45, 0.8, 0.4).normalize();
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
  // _f is private to the emit helpers, whose source position may itself be _a; _g and _n to placement.
  const _a = v(), _b = v(), _c = v(), _d = v(), _e = v(), _f = v(), _g = v(), _n = v();
  const UP = new THREE.Vector3(0, 1, 0);
  const R = (a, b) => a + (b - a) * Math.random();
  const glow = new THREE.Vector3();
  // rise: world height of the whole chick (the fire leap and meteor); hidden: the chick is
  // inside its element (lightning streak, ice pillar, above the page)
  const pose = { crouch: 0, shake: 0, lift: 0, wings: 0, rise: 0, hidden: false };
  let events = [], tf = null, wipe = 0, lastStep = -1, lastMark = -1, lastSpike = -1, lastScorch = -1;
  let nextArc = 0, nextStrike = 0, nextShade = 0, nextCluster = 0;
  const acc = { breath: 0, smoke: 0, ember: 0, aura: 0, auraB: 0, mote: 0, splash: 0, crest: 0, blink: 0, blinkB: 0 };
  let fxVisible = true, crestOn = false;
  let time = 0;
  const at = (delay, run) => events.push({ at: time + delay, run });
  // Emit count for a rate and frame time, carrying the fractional remainder.
  const take = (key, rate, dt) => { acc[key] += rate * quality * dt; const n = Math.floor(acc[key]); acc[key] -= n; return n; };

  // `lift` raises a decal off the ground (the hovering magic circles); `spin` -1 turns a magic
  // circle the other way (encoded in the seed: 50 and up).
  // `zStretch` stretches a mark in world depth after its random turn; 2 cancels the camera's
  // 30-degree foreshortening, so the mark reads round on the flat page.
  // `forceHold` holds a mark even where it overlaps others (the big floor a move leaves behind).
  function decal(kind, pos, scale, life, color = WHITE, alpha = 1, delay = 0, { lift = 0, spin = 1, zStretch = 1, forceHold = false } = {}) {
    // Hold a mark only where it adds coverage: a mark of the same kind mostly overlapping a held
    // one stays transient, and the held set is capped, so the page never stacks hundreds of quads.
    const markable = kind <= DECAL.FROST;
    const hold = holding && markable && held.length < HELD_MAX + STAMP_MAX
      && held.reduce((n, h) => n + (h.i >= 0), 0) < HELD_MAX && (forceHold || !overlapsHeld(kind, pos, scale));
    let i = decalHead;
    for (let n = 0; n < DECALS && decalP.array[i] > 0.5; n++) i = (i + 1) % DECALS;   // never overwrite a held mark
    decalHead = (i + 1) % DECALS;
    decalP.array[i] = hold ? 1 : 0;
    decalP.needsUpdate = true;
    const angle = Math.random() * Math.PI * 2, variant = Math.floor(Math.random() * STAMP_SEEDS.length);
    if (hold) held.push({ i, kind, x: pos.x, z: pos.z, r: scale * 0.5, zs: zStretch, angle, variant, settleAt: time + delay + SETTLE[kind] * life });
    _q.setFromAxisAngle(UP, angle);
    _m.compose(_p.set(0, 0, 0), _q, _s.set(scale, 1, scale));
    if (zStretch !== 1) { const e = _m.elements; e[2] *= zStretch; e[6] *= zStretch; e[10] *= zStretch; }
    _m.setPosition(pos.x, 0.003 + lift + i * 0.00002, pos.z);
    decals.setMatrixAt(i, _m);
    decals.instanceMatrix.needsUpdate = true;
    // marks that may be stamped use the baked seeds; magic circles keep their spin flag in the seed
    const seed = markable ? STAMP_SEEDS[variant] : (spin < 0 ? 50 : 0) + Math.random() * 10;
    decalD.array.set([time + delay, life, kind, seed], i * 4);
    decalC.array.set([color[0], color[1], color[2], alpha], i * 4);
    decalD.needsUpdate = decalC.needsUpdate = true;
  }

  // `reach` is how close (as a fraction of the larger radius) a same-kind held mark may be
  // before a new one counts as covering the same spot
  function overlapsHeld(kind, pos, scale, reach = 0.55) {
    return held.some(h => h.kind === kind && Math.hypot(h.x - pos.x, (h.z - pos.z) / h.zs) < Math.max(h.r, scale * 0.5) * reach);
  }

  // The ground point that sits right behind world point p on screen, along the camera's view
  // direction; `viewStretch` is the depth stretch that makes a ground mark read round there.
  const _view = v();
  let viewStretch = 2;
  function groundBehind(p) {
    _view.set(0, 0, -1).transformDirection(camera.matrixWorld);
    viewStretch = 1 / Math.max(0.2, -_view.y);
    const t = _view.y < -1e-3 ? p.y / -_view.y : 0;
    return _g.set(p.x + _view.x * t, 0, p.z + _view.z * t);
  }

  // A scorch mark on the page: it glows hot, cools to soot and is held until the element ends.
  // Spots already charred are skipped, so a long breath never stacks marks.
  function scorch(pos, size, life = 3) {
    if (overlapsHeld(DECAL.SCORCH, pos, size, 0.8)) return;
    decal(DECAL.SCORCH, pos, size, life, WHITE, 1, 0, { zStretch: viewStretch });
  }

  // On-screen test for a world point, in normalized device coordinates.
  function onScreen(p, margin = 0.9) {
    _n.copy(p).project(camera);
    return Math.abs(_n.x) < margin && _n.y > -margin && _n.y < margin;
  }
  // A visible ground point between rMin and rMax around `centre`. `behind` is the chance of
  // picking from the far half (smaller z), where tall effects rise behind the chick; `zScale`
  // stretches the ring in depth (the camera halves depth on screen, so 2 reads as a circle).
  function groundAround(centre, rMin, rMax, behind = 0.5, zScale = 0.85) {
    for (let i = 0; i < 10; i++) {
      const back = Math.random() < behind;
      const a = (back ? Math.PI : 0) + Math.random() * Math.PI, r = R(rMin, rMax);
      _g.set(centre.x + Math.cos(a) * r, 0, centre.z + Math.sin(a) * r * zScale);
      if (onScreen(_g)) return _g.clone();
    }
    return null;
  }
  // Under the parallel camera a height h rises h*cos(30°) on screen while a step dz toward the
  // viewer drops dz*sin(30°), so a crystal standing in front of the chick is capped to keep its
  // tip below the chick's feet.
  function heightLimit(base, foot, h, width = 0) {
    const dz = base.z - foot.z, dx = Math.abs(base.x - foot.x);
    if (dz <= 0 || dx > 0.9 + width + h * 0.35) return h;
    return Math.min(h, Math.max(0.15, dz * 0.55));
  }

  function jagged(a, b, levels, rough, flat = 1) {
    let pts = [a.clone(), b.clone()];
    for (let l = 0; l < levels; l++) {
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], q = pts[i], len = p.distanceTo(q);
        const mid = p.clone().add(q).multiplyScalar(0.5);
        _e.subVectors(q, p).normalize();
        _d.set(Math.random() - 0.5, (Math.random() - 0.5) * flat, Math.random() - 0.5);
        _d.addScaledVector(_e, -_d.dot(_e)).multiplyScalar(len * rough);
        out.push(mid.add(_d), q);
      }
      pts = out;
      rough *= 0.9;
    }
    return pts;
  }

  // strands: [{pts, width, intensity, along0, along1, color?, restrike?, taper?}]; each segment is one BOLT particle.
  // Channels thin toward their end; taper 'in' instead grows out of a thin tip (a short strike
  // that starts in mid-air) and thins slightly toward the ground.
  function boltSlot(strands, duration, delay = 0) {
    for (const s of strands) {
      const restrike = reducedMotion ? 0 : (s.restrike ?? 1);
      const n = s.pts.length;
      for (let j = 0; j < n - 1; j++) {
        const k = j / n, along = THREE.MathUtils.lerp(s.along0, s.along1, j / Math.max(1, n - 1));
        const taper = s.taper === 'in' ? THREE.MathUtils.lerp(0.35, 1, Math.min(1, k / 0.3)) * THREE.MathUtils.lerp(1, 0.6, k)
          : THREE.MathUtils.lerp(1, 0.45, k);
        // every strand ends in a point; a short strand that starts in mid-air also starts in one
        const tip = (j === n - 2 ? TIP_END : 0) | (j === 0 && (s.tipStart || s.taper === 'in') ? TIP_START : 0);
        front.emit(KIND.BOLT, s.pts[j], _e.subVectors(s.pts[j + 1], s.pts[j]), duration,
          s.width * taper, s.intensity, { delay, drag: along, grav: restrike, seed: tip, color: s.color });
      }
    }
  }

  // A cloud-to-ground strike. A full strike (reach 1) starts above the top edge of the viewport,
  // wherever the page is scrolled; a smaller one starts lower, at `reach` of that height.
  function skyBolt(ground, delay = 0, power = 1, reach = 1) {
    _n.copy(ground).project(camera);
    const rise = _d.set(0, 1, 0).transformDirection(camera.matrixWorldInverse).y || 0.87;
    const full = Math.max(2.5, ((1 - _n.y) * camera.top / camera.zoom + 0.8) / rise);
    const height = Math.max(1.2, full * reach);
    const top = new THREE.Vector3(ground.x + R(-0.12, 0.12) * height, height, ground.z + R(-0.08, 0.08) * height);
    const main = jagged(top, ground.clone(), height > 4 ? 6 : 5, 0.26);
    const N = main.length - 1, taper = reach < 1 ? 'in' : 'out';
    const w = 0.2 * BOLT_W * power, intensity = 0.75 + 0.25 * Math.min(1, power);
    const strands = [
      { pts: main, width: w, intensity, along0: 0, along1: 1, taper },
      { pts: main, width: w * 3.6, intensity: 0.42 * intensity, along0: 0, along1: 1, color: HALO, restrike: 0, taper },
    ];
    const branches = reducedMotion ? 1 : Math.round(1 + 3 * Math.min(1, power));
    for (let b = 0; b < branches; b++) {
      const k = Math.floor(R(0.12, 0.78) * N), p = main[k];
      _b.subVectors(main[k + 1], p).normalize();
      _b.x += R(-0.9, 0.9); _b.z += R(-0.5, 0.5); _b.y -= 0.4;
      const end = p.clone().addScaledVector(_b.normalize(), R(0.12, 0.36) * height);
      end.y = Math.max(end.y, 0.3);
      strands.push({ pts: jagged(p.clone(), end, 4, 0.35), width: w * 0.4, intensity: 0.5, along0: k / N, along1: Math.min(1, k / N + 0.4) });
    }
    boltSlot(strands, 0.5, delay);
  }

  function groundArcs(center, count, reach, delay = 0, duration = 0.35) {
    const strands = [];
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2, len = R(reach * 0.5, reach);
      const a = center.clone(); a.y = 0.02;
      const b = a.clone().add(_c.set(Math.cos(ang) * len, 0, Math.sin(ang) * len));
      strands.push({ pts: jagged(a, b, 4, 0.32, 0.15), width: 0.05 * BOLT_W, intensity: 0.75, along0: 0, along1: 1 });
    }
    boltSlot(strands, duration, delay);
  }

  // One strike and its impact: a ground flash, sparks, dust, crawling arcs and a burn.
  // `power` 1 is a full strike out of the sky; down to 1/3 everything shrinks with it, and the
  // channel starts lower (a quarter of the sky height at 1/3).
  function strike(ground, power = 1) {
    const s = S * power, reach = 0.25 + 0.75 * THREE.MathUtils.clamp((power - 1 / 3) * 1.5, 0, 1);
    skyBolt(ground, 0, power, reach);
    at(0.05, () => {
      flash(_a.copy(ground).setY(0.2), 1.0 * s, [1, 0.93, 0.62], 0.35 + 0.25 * Math.min(1, power), 0.32);
      sparks(ground, 10 + 20 * power, KIND.SPARK, 1.1 * s, 0.9 + 0.9 * power);
      dust(ground, 3 + 5 * power, 0.45 * s, 0.35 * s);
      groundArcs(ground, reducedMotion ? 1 : Math.round(1 + 4 * Math.min(1, power)), 0.5 * s);
      if (power > 0.5 || Math.random() < 0.35) decal(DECAL.BURN, ground, 0.8 * s, 1.4 + 1.8 * Math.min(1, power));
      addGlow(ELEMENT_FX_STYLE.lightning.glow, 0.2 + 0.35 * Math.min(1, power));
      // only strong strikes light up the whole page, at most every 0.4 s (under the 3 Hz flash limit)
      if (!reducedMotion && power > 0.75 && time - lastPageFlash > 0.4) { lastPageFlash = time; pageFlash = Math.max(pageFlash, 0.45 + 0.55 * power); }
    });
  }

  // solid: never turned see-through (the ice pillar that swallows the chick on purpose)
  function crystal(base, height, width, tiltAxis, tilt, delay, life, solid = false) {
    const i = crystalHead;
    crystalHead = (crystalHead + 1) % CRYSTALS;
    _q.setFromAxisAngle(tiltAxis, tilt).multiply(new THREE.Quaternion().setFromAxisAngle(UP, Math.random() * Math.PI));
    _m.compose(_p.set(base.x, 0, base.z), _q, _s.set(width, height, width));
    crystals.setMatrixAt(i, _m);
    crystals.instanceMatrix.needsUpdate = true;
    crystalG.array.set([time + delay, 0.22 + height * 0.04, life, Math.random()], i * 4);
    crystalG.needsUpdate = true;
    const info = crystalInfo[i], serial = ++info.serial;
    Object.assign(info, { start: time + delay, end: time + delay + life, x: base.x, z: base.z, h: height, w: width, solid });
    crystalO.array[i] = 1;
    crystalO.needsUpdate = true;
    const p = base.clone();
    at(delay + life - 0.25, () => { if (info.serial === serial) shards(p.setY(height * 0.45), Math.round(4 + 3 * height), Math.max(0.5, height * 0.3)); });
  }

  // The chick wanders, so a crystal can end up between it and the viewer (a trail crystal
  // when it walks away from the camera, for instance). Such a crystal turns glassy-faint so the
  // chick shows through, and regains its body once the chick has moved on. The fur is opaque
  // and drawn first, so lowering the crystal's alpha is enough.
  function seeThrough(foot, dt) {
    const k = 1 - Math.exp(-dt * 10);
    let changed = false;
    for (let i = 0; i < CRYSTALS; i++) {
      const c = crystalInfo[i];
      if (c.end < time || c.solid) continue;
      const dz = c.z - foot.z, dx = Math.abs(c.x - foot.x);
      const covers = dz > -0.05 && dx < c.w + 0.28 + c.h * 0.35 && c.h * 0.87 - dz * 0.5 > 0.05;
      const o = crystalO.array[i], target = covers ? 0.2 : 1;
      if (Math.abs(o - target) > 0.002) { crystalO.array[i] = o + (target - o) * k; changed = true; }
    }
    if (changed) crystalO.needsUpdate = true;
  }

  // A cluster of crystals bursting out of the ground at `base`, leaning away from `leanFrom`.
  // With `limit`, crystals in front of the chick's feet at `foot` are height-capped so they never
  // cover it; without it (the big trail crystals) they rely on seeThrough instead.
  function iceCluster(base, h, leanFrom, foot, { satellites = reducedMotion ? 1 : 2, limit = true, life = R(3, 4.2) } = {}) {
    _b.subVectors(base, leanFrom).setY(0);
    if (_b.lengthSq() < 1e-4) _b.set(1, 0, 0);
    _b.normalize();
    const w = h * R(0.14, 0.19);
    const main = limit ? heightLimit(base, foot, h, w) : h;
    crystal(base, main, w * Math.min(1, 0.4 + main / h), new THREE.Vector3(_b.z, 0, -_b.x), R(0.05, 0.3), 0, life);
    for (let k = 0; k < satellites; k++) {
      const a = Math.random() * Math.PI * 2, r = R(0.55, 1.2) * w;
      const sat = base.clone().add(_c.set(Math.cos(a) * r, 0, Math.sin(a) * r));
      const sw = w * R(0.5, 0.7), sh = h * R(0.3, 0.6);
      crystal(sat, limit ? heightLimit(sat, foot, sh, sw) : sh, sw, new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)), R(0.3, 0.65), R(0.03, 0.12), life - R(0, 0.3));
    }
    shards(_a.copy(base).setY(0.1), Math.round(4 + 3 * main), Math.max(0.4, main * 0.35));
    mist(base, main > 1 ? 2 : 1, Math.max(0.25, main * 0.3));
    decal(DECAL.FROST, base, Math.max(0.5, h * 0.9), life + 0.6);
    flash(_a.copy(base).setY(main * 0.3), main * 0.5, [0.8, 0.95, 1], 0.4, 0.25);
  }

  // scale multiplies speeds, gravity and size together, so the same motion plays bigger
  function shards(p, count, scale = 1) {
    for (let i = 0; i < count * quality; i++) {
      const a = Math.random() * Math.PI * 2;
      front.emit(KIND.SHARD, p, _c.set(Math.cos(a) * R(0.6, 2) * scale, R(1.5, 3.6) * scale, Math.sin(a) * R(0.6, 2) * scale),
        R(0.5, 0.95), R(0.035, 0.07) * Math.max(1, scale * 0.6), R(0.02, 0.05) * Math.max(1, scale * 0.6), { drag: 0.6, grav: -7 * scale, alpha: 0.95 });
    }
  }
  function mist(p, count, size = 0.5) {
    // big banks of mist thin out, so they never wash a whole section white
    const k = Math.max(1, size * 0.8), alpha = 0.45 / Math.max(1, size * 0.6);
    for (let i = 0; i < count * quality; i++) {
      back.emit(KIND.MIST, _f.copy(p).add(_c.set(R(-0.15, 0.15) * k, R(0, 0.1) * k, R(-0.15, 0.15) * k)),
        _c.set(R(-0.4, 0.4), R(0.05, 0.35), R(-0.4, 0.4)).multiplyScalar(k), R(1.2, 2), size * 0.4, size * R(1, 1.6), { drag: 1.2, alpha });
    }
  }
  function sparks(p, count, kind = KIND.SPARK, speed = 3, size = 1) {
    for (let i = 0; i < count * quality; i++) {
      const a = Math.random() * Math.PI * 2, h = R(0.3, 1);
      front.emit(kind, p, _c.set(Math.cos(a) * speed * R(0.4, 1), speed * h, Math.sin(a) * speed * R(0.4, 1)),
        R(0.35, 0.8), R(0.02, 0.035) * size, 0.012 * size, { drag: 1.2, grav: -2 * speed, alpha: 0.1 });
    }
  }
  function dust(p, count, speed = 1.6, size = 1) {
    for (let i = 0; i < count * quality; i++) {
      const a = (i / count) * Math.PI * 2 + R(-0.2, 0.2);
      back.emit(KIND.DUST, _f.set(p.x, 0.05, p.z), _c.set(Math.cos(a) * speed, R(0.1, 0.4) * size, Math.sin(a) * speed),
        R(0.7, 1.1), 0.12 * size, R(0.35, 0.55) * size, { drag: 2.4, alpha: 0.35 });
    }
  }
  function flash(p, size, color, alpha = 0.85, life = 0.35, delay = 0) {
    front.emit(KIND.FLASH, p, ZERO, life, size * 0.6, size, { color, alpha, delay });
  }
  function flames(p, count, speed, up, size, life = [0.35, 0.6]) {
    for (let i = 0; i < count * quality; i++) {
      const a = Math.random() * Math.PI * 2;
      front.emit(KIND.FIRE, p, _c.set(Math.cos(a) * speed * R(0.4, 1), up * R(0.6, 1.2), Math.sin(a) * speed * R(0.4, 1)),
        R(life[0], life[1]), size * 0.3, size * R(0.8, 1.3), { drag: 1.8, grav: 1.6 * Math.max(1, size * 2), color: [R(0.85, 1.1), 0, 0] });
    }
  }
  function smoke(p, count, size = 0.6, alpha = 0.4) {
    const k = Math.max(1, size * 0.7);
    for (let i = 0; i < count * quality; i++) {
      _f.copy(p).add(_c.set(R(-0.1, 0.1) * k, R(0, 0.1) * k, R(-0.1, 0.1) * k));
      back.emit(KIND.SMOKE, _f, _c.set(R(-0.3, 0.3), R(0.4, 0.9), R(-0.3, 0.3)).multiplyScalar(k),
        R(1.2, 2), size * 0.35, size * R(1, 1.5), { drag: 1, grav: 0.3 * k, alpha });
    }
  }
  // Dark element smoke goes into the ink buffer (see stepInk): amount > 0 pours white smoke,
  // < 0 black ink; radius is in screen heights. Continuous sources scale the amount by dt.
  const INK_SIZE = 0.78;   // every pour a little smaller than first tuned: narrower plumes
  function inkSplat(world, radius, amount) {
    if (!renderer || inkSplatN >= INK_SPLATS || !amount) return;
    _n.copy(world).project(camera);
    if (_n.z > 1 || Math.abs(_n.x) > 1.3 || Math.abs(_n.y) > 1.3) return;
    inkSimU.uSplat.value[inkSplatN++].set(_n.x * 0.5 + 0.5, _n.y * 0.5 + 0.5, radius * INK_SIZE, amount * INK_SIZE);
    inkLast = time;
    inkView.userData.splats++;
  }
  // a burst of ink: one large splat with smaller ones around it, depth-stretched to read round
  function inkBurst(p, radius, amount, around = 0, reach = 0.5) {
    inkSplat(_g.set(p.x, 0.3, p.z), radius, amount);
    const zs = roundStretch() * 0.7, seed = Math.random() * Math.PI * 2;
    for (let i = 0; i < around; i++) {
      const a = seed + (i / around) * Math.PI * 2, r = reach * R(0.75, 1.1);
      inkSplat(_g.set(p.x + Math.cos(a) * r, R(0.1, 0.4), p.z + Math.sin(a) * r * zs), radius * R(0.45, 0.65), amount * R(0.5, 0.8));
    }
  }
  function embers(p, count, speed = 2) {
    for (let i = 0; i < count * quality; i++) {
      const a = Math.random() * Math.PI * 2;
      front.emit(KIND.EMBER, p, _c.set(Math.cos(a) * speed * R(0.2, 0.8), speed * R(0.6, 1.4), Math.sin(a) * speed * R(0.2, 0.8)),
        R(0.7, 1.4), R(0.018, 0.03) * Math.max(1, speed * 0.25), 0.01, { drag: 0.8, grav: -0.75 * speed, alpha: 0.12 });
    }
  }
  function addGlow(color, amount) {
    glow.x = Math.max(glow.x, color[0] * amount);
    glow.y = Math.max(glow.y, color[1] * amount);
    glow.z = Math.max(glow.z, color[2] * amount);
  }

  /* ---------------------------------------------------------------- transformation
     Charge (motes pour in, the chick crouches and trembles), burst (flash, shock rings,
     an element-specific eruption), then the coat is repainted from the feet up. */

  const TRANSFORM = reducedMotion ? 0.9 : 2.2;
  const BURST = reducedMotion ? 0.25 : 0.75;
  const WIPE = reducedMotion ? 0.3 : 0.75;

  function transform(element, g) {
    const s = ELEMENT_FX_STYLE[element];
    furUniforms.uElemColor.value.fromArray(s.fur);
    furUniforms.uElemTip.value.fromArray(s.tip);
    furUniforms.uElemKind.value.fromArray(s.kind);
    if (furUniforms.uElemShade) furUniforms.uElemShade.value = s.shade || 0;
    darkCoat = 'white';   // dark always transforms white
    tf = { element, t0: time, burst: false, origin: g.foot.clone(), body: g.body.clone() };
    wipe = 0;
    // The magic circle draws itself on during the charge and flares at the burst (30% of its
    // life). Two smaller circles hover around the chest and above the head, turning the other
    // way, and a pillar of light rises through them.
    const circle = DECAL.CIRCLE + ELEMENT_INDEX[element], life = BURST / 0.3;
    decal(circle, g.foot, 2.2 * B * 0.6, life, s.ring, 0.95);
    if (!reducedMotion) {
      decal(circle, g.foot, 1.5, life, s.ring, 0.8, 0, { lift: 0.42, spin: -1 });
      decal(circle, g.foot, 0.95, life, s.ring, 0.75, 0, { lift: 1.02 });
    }
    pillar.position.copy(g.foot).setY(0);
    // dark rises as a column of black smoke instead of light
    pillarU.uPillarColor.value.fromArray(element === 'dark' ? [0.04, 0.04, 0.055] : s.ring);
    pillarU.uPillarWhite.value = element === 'dark' ? 0 : 1;
    if (element === 'ice') decal(DECAL.FROST, g.foot, 1.6 * B * 0.6, TRANSFORM + 2.5, WHITE, 1);
  }

  function burst(element, origin, body) {
    const s = ELEMENT_FX_STYLE[element];
    onBurst?.(element);   // the page's own media take the hit too (sumi-media-fx.js)
    if (element === 'dark') {
      // no flash and no ring: an ink cloud blooms out of the floor, white smoke settles around
      // the chick, and the darkness spreads over the page from here (see update)
      inkBurst(origin, 0.1, -2.2, 8, 1.1);
      inkSplat(_a.copy(body).setY(body.y + 0.1), 0.06, 1.4);  // and white smoke wraps the chick
      addGlow(s.glow, 0.5);
      return;
    }
    flash(_a.copy(body).setY(body.y + 0.2 * B), 1.1 * B, s.glow, 0.7, 0.5);
    decal(DECAL.RING, origin, 3.6 * B, 0.8, s.ring, 0.9);
    decal(DECAL.RING, origin, 2.4 * B, 0.7, s.ring, 0.7, 0.1);
    dust(origin, 28, 2.2 * B, B * 0.8);
    addGlow(s.glow, 0.9);
    if (element === 'fire') {
      flames(body, 110, 3.6 * B, 1.2 * B, 0.5 * B, [0.5, 0.9]);
      for (let i = 0; i < 50 * quality; i++) {
        front.emit(KIND.FIRE, _a.copy(body).add(_c.set(R(-0.08, 0.08), 0, R(-0.08, 0.08)).multiplyScalar(B)),
          _c.set(R(-0.4, 0.4), R(3.5, 6), R(-0.4, 0.4)).multiplyScalar(B), R(0.45, 0.8), 0.12 * B, R(0.4, 0.6) * B,
          { drag: 1.4, grav: B, color: [1.05, 0, 0] });
      }
      embers(body, 60, 3 * B * 0.7);
      smoke(_a.copy(body).setY(0.9 * B), 22, 1.1 * B, 0.3);
      decal(DECAL.SCORCH, origin, 2.2 * B, 5);
    } else if (element === 'lightning') {
      back.emit(KIND.SHADE, _a.copy(origin).setY(0.7 * B), ZERO, 1.4, 1.5 * B, 2 * B, { alpha: 0.2 });
      skyBolt(_b.copy(body).setY(body.y + 0.2), 0, 1.3);
      const around = reducedMotion ? 1 : 3;
      for (let i = 0; i < around; i++) {
        const ground = groundAround(origin, 0.6 * B * 0.5, 1.2 * B * 0.5);
        if (ground) at(0.1 + i * 0.12, () => strike(ground, 0.8));
      }
      groundArcs(origin, 8, 1.4 * B * 0.6, 0.05, 0.5);
      sparks(body, 60, KIND.SPARK, 3.5 * B * 0.6, 2);
      decal(DECAL.BURN, origin, 2.4 * B, 4);
    } else {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + R(-0.2, 0.2), r = R(0.55, 0.8) * B * 0.8;
        const base = _a.copy(origin).add(_c.set(Math.cos(a) * r, 0, Math.sin(a) * r)).clone();
        const axis = _b.set(Math.sin(a), 0, -Math.cos(a)).clone();
        const w = R(0.09, 0.14) * B, h = R(0.45, 0.8) * B * 1.2, capped = heightLimit(base, origin, h, w);
        crystal(base, capped, w * Math.min(1, 0.4 + capped / h), axis, R(0.25, 0.45), i * 0.025, 2.6);
      }
      shards(body, 50, B * 0.6);
      mist(origin, 10, 0.6 * B);
      decal(DECAL.FROST, origin, 3.2 * B, 5);
    }
  }

  /* ---------------------------------------------------------------- always-on skills
     While the element is charged its skill runs on its own; clicks only steer the aim. */

  function breath(dt, g) {
    const fwd = g.forward, mouth = g.mouth;
    const k = S * 0.7 / SLOW;            // speed scale: reach grows with S, timing stretches by SLOW
    // the roar swells and ebbs, so the stream never reads as a looping sprite
    const roar = 0.78 + 0.22 * Math.sin(time * 4.7) * Math.sin(time * 1.3 + 0.7);
    const n = take('breath', 120 * roar, dt);
    const side = _d.crossVectors(fwd, UP);
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize();
    const lift = _e.crossVectors(side, fwd).normalize();
    for (let i = 0; i < n; i++) {
      // a tight, fast core that widens and slows into a towering, rolling plume
      const sx = R(-0.16, 0.16), sy = R(-0.1, 0.16), speed = R(6.5, 8.2) * k;
      _c.copy(fwd).addScaledVector(side, sx).addScaledVector(lift, sy).normalize().multiplyScalar(speed);
      front.emit(KIND.FIRE, mouth, _c, R(0.6, 0.85) * SLOW, 0.04 * S, R(0.4, 0.62) * S * 0.9,
        { drag: 1.5 / SLOW, grav: 1.1 * k / SLOW, color: [R(0.78, 0.98), 0, 0] });   // cooler: overlapping puffs add up
    }
    const reach = 3.2 * S * 0.7;
    for (let i = take('smoke', 30, dt); i > 0; i--) {
      _a.copy(mouth).addScaledVector(fwd, R(0.35, 0.6) * reach);
      back.emit(KIND.SMOKE, _a, _c.copy(fwd).multiplyScalar(R(0.8, 1.6) * k).add(_b.set(0, R(0.4, 0.9) * k, 0)),
        R(1.2, 1.8) * SLOW, 0.3 * S, R(0.9, 1.4) * S * 0.9, { drag: 1.2 / SLOW, grav: 0.4 * k / SLOW, alpha: 0.26 });
    }
    for (let i = take('ember', 70, dt); i > 0; i--) {
      _c.copy(fwd).addScaledVector(side, R(-0.35, 0.35)).addScaledVector(lift, R(-0.2, 0.35)).normalize().multiplyScalar(R(4, 7) * k);
      front.emit(KIND.EMBER, mouth, _c, R(0.7, 1.3) * SLOW, R(0.018, 0.03) * 1.6, 0.012, { drag: 0.8 / SLOW, grav: -2.5 * k / SLOW, alpha: 0.12 });
    }
    if (take('mote', 20, dt)) flash(mouth, 0.5 * S * 0.5, [1, 0.6, 0.25], 0.7, 0.12);
    // The page scorches where the fire passes: a point along the stream (where a puff of that age
    // would be) is dropped along the view ray, so the mark lands right behind the flames on screen.
    if (time - lastScorch > 0.08) {
      lastScorch = time;
      const age = R(0.2, 0.8) * 0.72 * SLOW, drag = 1.5 / SLOW;
      _c.copy(fwd).addScaledVector(side, R(-0.1, 0.1)).normalize();
      _a.copy(mouth).addScaledVector(_c, 7.35 * k * (1 - Math.exp(-drag * age)) / drag);
      _a.y += 0.55 * k / SLOW * age * age;
      scorch(groundBehind(_a), (0.04 * S + 0.46 * S * Math.sqrt(age / (0.72 * SLOW))) * 0.6);
    }
    // where the stream meets the floor it also splashes
    if (fwd.y < -0.05) {
      const dist = -mouth.y / fwd.y;
      if (dist < reach) {
        const hit = _a.copy(mouth).addScaledVector(fwd, dist).setY(0.02);
        if (take('splash', 16, dt)) flames(hit, 3, 2.2 * k, 0.8 * k, 0.35 * S * 0.6);
      }
    }
    addGlow(ELEMENT_FX_STYLE.fire.glow, 0.35 + 0.15 * Math.sin(time * 40));
  }

  function storm(g) {
    if (time >= nextShade) {
      nextShade = time + 0.8;
      back.emit(KIND.SHADE, _a.copy(g.foot).setY(0.45 * S), ZERO, 1.8, 1.1 * S, 1.6 * S, { alpha: reducedMotion ? 0.08 : 0.13 });
    }
    if (time < nextStrike) return;
    // About five strikes a second, packed into a tight ring around the chick. Power is skewed
    // low (1/3..1), so most strikes are small: a full strike, with its large flash, lands about
    // once a second and full plus medium ones stay under the 3 Hz photosensitivity limit.
    nextStrike = time + (reducedMotion ? R(0.5, 0.8) : lowPower ? R(0.15, 0.27) : R(0.12, 0.25));
    const power = 1 / 3 + (2 / 3) * Math.random() ** 2.5;
    const ground = groundAround(g.foot, 0.2, STORM_R, 0.5, 1.25) || g.foot.clone();
    strike(ground, power);
    // a strong strike sometimes forks a second, shorter channel nearby within the same flash
    if (!reducedMotion && power > 0.6 && Math.random() < 0.3) {
      const near = groundAround(ground, 0.25, 0.6, 0.5, 1.25);
      if (near) at(R(0.03, 0.08), () => skyBolt(near, 0, power * 0.6, 0.6));
    }
  }

  // Dark, the quiet skill: the smoke comes off the chick itself. Each frame it pours from a few
  // random points just around the body's outline (different every frame, so no point can be
  // followed by eye), and the flow carries it up and away. Nothing circles or appears apart from
  // the chick (three orbiting streams read as things chasing it).
  function shadowField(dt, g) {
    const amount = (reducedMotion ? 0.5 : 1) * dt;
    for (let k = 0; k < 3; k++) {
      const ang = Math.random() * Math.PI * 2, r = R(0.16, 0.3);
      inkSplat(_a.set(g.body.x + Math.cos(ang) * r, g.body.y + R(-0.18, 0.22), g.body.z + Math.sin(ang) * r * 0.8), 0.02, 0.9 * amount);
    }
  }

  // Around the chick: small crystals (up to its own height) keep forming in a tight ring.
  // The big ones grow along the walked path instead (see footstep).
  function frostField(g) {
    if (time < nextCluster) return;
    nextCluster = time + (reducedMotion ? R(0.8, 1.1) : lowPower ? R(0.32, 0.45) : R(0.2, 0.32));
    const base = groundAround(g.foot, 0.3, RING_R, 0.6, 1.35);
    if (base) iceCluster(base, R(0.3, 0.85) * CHICK_H, g.foot, g.foot);
  }

  function aura(element, dt, g) {
    if (element === 'fire') {
      for (let i = take('aura', 24, dt); i > 0; i--) {
        _a.copy(g.body).add(_c.set(R(-0.15, 0.15), R(0.02, 0.18), R(-0.18, 0.15)));
        front.emit(KIND.FIRE, _a, _c.set(R(-0.15, 0.15), R(0.9, 1.4), R(-0.15, 0.15)), R(0.35, 0.55), 0.04, R(0.12, 0.2), { drag: 1.5, grav: 1.2, color: [R(0.8, 1), 0, 0] });
      }
      if (take('auraB', 4, dt)) {
        embers(g.body, 1, 1.4);
        smoke(_a.copy(g.body).setY(g.body.y + 0.3), 1, 0.35, 0.18);
      }
    } else if (element === 'lightning') {
      if (time > nextArc) {
        nextArc = time + R(0.28, 0.7);
        const a = _a.copy(g.body).add(_c.set(R(-0.18, 0.18), R(-0.1, 0.2), R(-0.18, 0.18))).clone();
        const b = a.clone().add(_c.set(R(-0.35, 0.35), R(-0.3, 0.1), R(-0.35, 0.35)));
        boltSlot([{ pts: jagged(a, b, 3, 0.4), width: 0.04, intensity: 0.8, along0: 0, along1: 0, tipStart: true }], 0.16);
      }
      if (take('aura', 5, dt)) sparks(g.body, 1, KIND.SPARK, 1.6);
    } else if (element === 'dark') {
      // white ink smoke pours from the black body and is carried up and away by the flow, so
      // the silhouette always stands against it (the ink cat's torso, in white)
      const amount = (reducedMotion ? 0.5 : 1) * dt;
      inkSplat(g.body, 0.055, 2.4 * amount);
      inkSplat(_a.copy(g.body).setY(g.body.y + 0.28), 0.034, 1.2 * amount);
      inkSplat(_a.set(g.body.x + R(-0.22, 0.22), 0.2, g.body.z + R(-0.1, 0.1)), 0.026, 0.8 * amount);
    } else {
      if (take('aura', 4, dt)) mist(_a.copy(g.foot), 1, 0.35);
      for (let i = take('auraB', 6, dt); i > 0; i--) {
        _a.copy(g.body).add(_c.set(R(-0.25, 0.25), R(-0.1, 0.3), R(-0.25, 0.25)));
        front.emit(KIND.MOTE, _a, _c.set(R(-0.1, 0.1), R(0.15, 0.4), R(-0.1, 0.1)), R(0.6, 1), 0.03, 0.01, { color: [0.85, 0.97, 1], alpha: 0.8 });
      }
    }
  }

  function footstep(element, pos) {
    if (time - lastStep < 0.09) return;
    lastStep = time;
    if (element === 'fire') {
      flames(pos, 2, 0.3 * FOOT, 0.6 * FOOT, 0.12 * FOOT, [0.25, 0.45]);
      if (Math.random() < 0.4) embers(pos, 1, FOOT);   // no footprint scorch: the page scorches where the breath goes
    } else if (element === 'lightning') {
      sparks(pos, 2, KIND.SPARK, 1.4 * FOOT * 0.6);
      if (time - lastMark > 0.45) { lastMark = time; groundArcs(pos, 2, 0.3 * FOOT, 0, 0.18); }
    } else if (element === 'dark') {
      // nothing at the step itself: the glowing print turns to white smoke as it dissolves (scene)
    } else {
      // ice: frost spreads under every step, and big crystals (one to three times the chick's
      // height) rise along the path it walked, a little behind it so they never grow through it
      if (time - lastMark > 0.16) {
        lastMark = time;
        decal(DECAL.FROST, pos, 0.9, 4);
        mist(pos, 1, 0.3);
      }
      trail.push({ x: pos.x, z: pos.z });
      if (trail.length > 60) trail.shift();
      if (time - lastSpike < (reducedMotion ? 0.6 : lowPower ? 0.28 : 0.18)) return;
      let k = trail.length - 1;
      while (k >= 0 && Math.hypot(trail[k].x - pos.x, trail[k].z - pos.z) < TRAIL_LAG) k--;
      if (k < 0) return;
      const t = trail[k], next = trail[Math.min(k + 1, trail.length - 1)];
      _d.set(next.x - t.x, 0, next.z - t.z);
      if (_d.lengthSq() < 1e-6) _d.set(pos.x - t.x, 0, pos.z - t.z);
      _d.normalize();
      // spread across the path's width, on either side of the footprints
      const side = R(-0.75, 0.75);
      const base = new THREE.Vector3(t.x - _d.z * side, 0, t.z + _d.x * side);
      trailSpawns = trailSpawns.filter(q => time - q.t < 3);
      if (trailSpawns.some(q => Math.hypot(q.x - base.x, q.z - base.z) < 0.28)) return;
      lastSpike = time;
      trailSpawns.push({ x: base.x, z: base.z, t: time });
      const life = R(3.5, 5);
      iceCluster(base, R(1, 3) * CHICK_H * (reducedMotion ? 0.7 : 1), new THREE.Vector3(t.x, 0, t.z), pos,
        { limit: false, life });
      onIcePillar?.(base, life);   // the minigame freezes mobs on these (walking pillars only, never a move's)
    }
  }

  function dissipate(element, g) {
    const s = ELEMENT_FX_STYLE[element], k = B * 0.5;
    flash(_a.copy(g.body), 1.2 * k, s.glow, 0.5, 0.4);
    if (element === 'fire') { smoke(g.body, 25, 0.8 * k, 0.3); embers(g.body, 20, 2.2 * k); }
    else if (element === 'lightning') { sparks(g.body, 30, KIND.SPARK, 2.6 * k, 1.5); groundArcs(g.foot, 3, 0.6 * k); }
    else if (element === 'dark') { inkSplat(g.body, 0.07, 1.6); inkBurst(g.foot, 0.07, -1.4, 6, 0.8); }
    else { shards(g.body, 30, k * 0.6); mist(g.foot, 15, 0.6 * k); }
  }

  // The pillar rises with the charge, flares at the burst and dies away within about a second.
  function updatePillar() {
    if (!tf) { pillar.visible = false; return; }
    const a = time - tf.t0, rise = THREE.MathUtils.smoothstep(a, 0.05, BURST), after = Math.max(0, a - BURST);
    const k = a < BURST ? 0.55 * rise : 1.5 * Math.exp(-after * 3.2);
    pillarU.uPillar.value = k;
    pillar.visible = fxVisible && k > 0.01;
    const radius = a < BURST ? THREE.MathUtils.lerp(1, 0.72, rise) : 0.72 + after * 0.9;
    pillar.scale.set(radius, (reducedMotion ? 3 : 6) * (a < BURST ? 0.35 + 0.65 * rise : 1), radius);
  }

  // The crest appears with a springy pop at the burst (or when the element changes), fades out
  // with the coat at expiry, and sheds real embers or sparks into the scene.
  function updateCrest(dt, g) {
    if (!head) return;
    const on = g.unlocked && (g.charged || g.ending) && (!tf || tf.burst);
    if (on && (!crestOn || g.element !== crestElement)) {
      crestPop = time;
      crestElement = g.element;
      for (let i = 0; i < CREST_ICE.length; i++) crestG.array[i * 4] = time + i * 0.05;
      crestG.needsUpdate = true;
    }
    crestOn = on;
    crestShow = on ? Math.min(1, crestShow + dt * 8) : Math.max(0, crestShow - dt * 5);
    const show = crestShow * (g.ending ? g.tint : 1);
    const p = THREE.MathUtils.clamp((time - crestPop) / 0.4, 0, 1) - 1;
    const pop = reducedMotion ? 1 : 1 + 2.7 * p * p * p + 1.7 * p * p;   // ease-out-back
    const kind = ELEMENT_INDEX[crestElement] ?? 0;
    crest.visible = fxVisible && show > 0.003;
    crestU.uShow.value = show;
    crestU.uPop.value = Math.max(0.001, pop);
    crestU.uKind.value = kind;
    crestU.uSize.value.set(...[[0.56, 0.66], [0.46, 0.56], [0.66, 0.66], [0.5, 0.62]][kind]);   // flame, bolt, frost halo, dark orb
    crestIce.visible = crest.visible && kind === 2;
    if (crestIce.visible) { crestO.array.fill(show); crestO.needsUpdate = true; }
    if (show > 0.5) {
      head.localToWorld(_crestTip.set(0.015, 0.155 + 0.3, 0.015));
      if (kind === 0 && take('crest', 7, dt)) embers(_crestTip, 1, 0.8);
      if (kind === 1 && take('crest', 3, dt)) sparks(_crestTip, 1, KIND.SPARK, 1.2);
      if (kind === 3) inkSplat(_crestTip, 0.013, 0.6 * dt);   // a thread of white smoke from the orb
    }
  }

  // Bake the stamp images: render each kind's settled look with the decal shader into a small
  // target, read it back once, un-premultiply and keep it as a blob URL the page can share.
  function bakeStamps() {
    const N = 320, rt = new THREE.WebGLRenderTarget(N, N);
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const aD = new THREE.InstancedBufferAttribute(new Float32Array(4), 4);
    geo.setAttribute('iD', aD);
    geo.setAttribute('iDc', new THREE.InstancedBufferAttribute(new Float32Array([1, 1, 1, 1]), 4));
    geo.setAttribute('iDp', new THREE.InstancedBufferAttribute(new Float32Array([1]), 1));
    const mesh = new THREE.InstancedMesh(geo, decals.material, 1);
    mesh.frustumCulled = false;
    const bake = new THREE.Scene();
    bake.add(mesh);
    // looking straight down with -z up: image right is the decal's +x, image up its -z
    const cam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    cam.position.set(0, 5, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
    const pixels = new Uint8Array(N * N * 4), canvas = document.createElement('canvas');
    canvas.width = canvas.height = N;
    const ctx = canvas.getContext('2d'), image = ctx.createImageData(N, N);
    const prevTarget = renderer.getRenderTarget(), prevColor = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    for (const kind of STAMPED) {
      STAMP_SEEDS.forEach((seed, v) => {
        aD.array.set([uTime.value - SETTLE[kind], 1, kind, seed]);
        aD.needsUpdate = true;
        renderer.setRenderTarget(rt);
        renderer.clear();
        renderer.render(bake, cam);
        renderer.readRenderTargetPixels(rt, 0, 0, N, N, pixels);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {   // flip rows, un-premultiply
          const s = ((N - 1 - y) * N + x) * 4, d = (y * N + x) * 4, a = pixels[s + 3], k = a ? 255 / a : 0;
          image.data[d] = Math.min(255, pixels[s] * k);
          image.data[d + 1] = Math.min(255, pixels[s + 1] * k);
          image.data[d + 2] = Math.min(255, pixels[s + 2] * k);
          image.data[d + 3] = a;
        }
        ctx.putImageData(image, 0, 0);
        canvas.toBlob(blob => { if (blob && !disposed) stampURL[kind][v] = URL.createObjectURL(blob); }, 'image/png');
      });
    }
    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(prevColor, prevAlpha);
    rt.dispose();
    geo.dispose();
  }

  // Stamp a settled mark onto the page at the spot it occupies on screen, turned and foreshortened
  // like the ground decal, and let the decal fade out through its own fade while the stamp fades in.
  function stampMark(h, url) {
    const w = renderer.domElement.clientWidth, hgt = renderer.domElement.clientHeight;
    _n.set(h.x, 0, h.z).project(camera);
    const sx = (_n.x + 1) / 2 * w, sy = (1 - _n.y) / 2 * hgt;
    const ppu = (_b.set(h.x + 1, 0, h.z).project(camera).x - _n.x) / 2 * w;
    _view.set(0, 0, -1).transformDirection(camera.matrixWorld);
    const f = h.zs * -_view.y, c = Math.cos(h.angle), s = Math.sin(h.angle);
    const o = pageMarks.offset();
    pageMarks.stamp(url, sx + o.x, sy + o.y, h.r * 2 * ppu, [c, -f * s, s, f * c]);
    const from = FADE_FROM[h.kind], life = 0.45 / (1 - from);
    decalD.array[h.i * 4] = time - from * life;
    decalD.array[h.i * 4 + 1] = life;
    decalP.array[h.i] = 0;
    decalD.needsUpdate = decalP.needsUpdate = true;
    h.i = -1;
  }

  // Hold marks while the element is charged; settled ones move to the page. Once the element ends
  // (or is cancelled) the live ones erode away and the stamps fade, together over 1.6 s.
  function updateMarks(dt, g) {
    holding = g.unlocked && g.charged && release < 0;
    if (pageMarks && release < 0) {
      for (const h of held) {
        if (h.i < 0 || !stampURL[h.kind] || time < h.settleAt || pageMarks.count >= STAMP_MAX) continue;
        const url = stampURL[h.kind][h.variant];
        if (url) stampMark(h, url);
      }
    }
    if (release < 0 && held.length && !holding) { release = time; pageMarks?.fadeOut(1.6); }
    if (release >= 0) {
      const k = (time - release) / 1.6;
      markU.uMarkFade.value = Math.max(0, 1 - k);
      if (k >= 1) {
        for (const h of held) if (h.i >= 0) { decalD.array[h.i * 4] = -1e9; decalP.array[h.i] = 0; }
        pageMarks?.clear();
        decalD.needsUpdate = decalP.needsUpdate = true;
        held = [];
        release = -1;
        markU.uMarkFade.value = 1;
      }
    }
    pageFlash *= Math.exp(-dt * 9);
    if (pageFlash < 0.005) pageFlash = 0;
  }

  /* ---------------------------------------------------------------- blink
     A click while charged sends the chick to the butterfly, each element its own way:
     lightning dashes there as a zigzag streak and lands under a thunderbolt; ice is swallowed by a
     pillar that shatters, frost streams across and a second pillar breaks open at the butterfly;
     fire leaps off the top of the page and crashes down onto the spot as a meteor. The scene reads
     blinkPos and pose.rise / pose.hidden to place the chick. */

  const blinkPos = v();
  let bk = null, blinkReadyAt = 0;
  const BLINK_TIME = reducedMotion ? { lightning: 0.35, ice: 0.35, fire: 0.35, dark: 0.35 } : { lightning: 0.42, ice: 1.25, fire: 0.8, dark: 0.85 };

  function blink(element, from, to) {
    if (tf || bk || time < blinkReadyAt) return false;
    const dist = Math.hypot(to.x - from.x, to.z - from.z);
    if (dist < 0.25) return false;
    // blinkSpeed (minigame panel): >1 plays the whole move faster, its timing and travel alike
    bk = { element, t0: time, speed: Math.max(0.1, blinkSpeed?.(element) || 1), from: v().set(from.x, 0, from.z), to: v().set(to.x, 0, to.z), dist, done: false, impact: false };
    blinkPos.copy(bk.from);
    if (reducedMotion) startPoof(bk);
    else if (element === 'lightning') startQuickAttack(bk);
    else if (element === 'ice') startIcePillars(bk);
    else if (element === 'dark') startShadowStep(bk);
    else startMeteor(bk);
    return true;
  }

  // Arrival on a new surface (a project dialog opening or closing): the move runs from a ground
  // point just beyond the left or right edge of the view, so the chick dashes, breaks out of a
  // pillar or crashes down as a meteor where it now stands. It ignores the click cooldown.
  function arrive(element, to) {
    if (tf) return false;
    const side = Math.random() < 0.5 ? -1 : 1;
    _n.copy(to).project(camera);
    const near = v().set(side * 1.3, THREE.MathUtils.clamp(_n.y, -0.8, 0.8), -1).unproject(camera);
    const far = v().set(side * 1.3, THREE.MathUtils.clamp(_n.y, -0.8, 0.8), 1).unproject(camera);
    const from = near.lerp(far, near.y / (near.y - far.y)).setY(0);
    bk = null;
    blinkReadyAt = 0;
    return blink(element, from, to);
  }

  function endBlink() {
    if (!bk) return;
    blinkPos.copy(bk.to);
    bk = null;
    pose.rise = 0; pose.hidden = false; pose.crouch = 0;
    blinkReadyAt = time + 0.25;
  }

  // depth stretch that makes a ground mark read round on screen under the tilted camera
  function roundStretch() {
    _view.set(0, 0, -1).transformDirection(camera.matrixWorld);
    return 1 / Math.max(0.2, -_view.y);
  }

  // A circular burst of ground lightning: bolts radiate in every direction from the centre with
  // side forks, each segment lighting as the wave reaches it (spreadTime), so the burst races
  // outward. Depth is stretched (zs) so the burst reads nearly round on screen.
  function radialBolts(center, count, reach, { duration = 0.55, spreadTime = 0.12, delay = 0, levels = 5, width = 0.11 } = {}) {
    const zs = roundStretch() * 0.7, restrike = reducedMotion ? 0 : 1, seed = Math.random() * Math.PI * 2;
    const emitStrand = (pts, along0, along1, width, intensity, color, re) => {
      const n = pts.length - 1;
      for (let j = 0; j < n; j++) {
        const along = THREE.MathUtils.lerp(along0, along1, j / n);
        front.emit(KIND.BOLT, pts[j], _e.subVectors(pts[j + 1], pts[j]), duration,
          width * THREE.MathUtils.lerp(1, 0.4, j / n), intensity, { delay: delay + along * spreadTime, drag: 0, grav: re, seed: j === n - 1 ? TIP_END : 0, color });
      }
    };
    for (let i = 0; i < count; i++) {
      const ang = seed + (i / count) * Math.PI * 2 + R(-0.18, 0.18), len = R(0.7, 1) * reach;
      const a = new THREE.Vector3(center.x, 0.04, center.z);
      const end = a.clone().add(_c.set(Math.cos(ang) * len, 0, Math.sin(ang) * len * zs));
      const pts = jagged(a, end, levels, 0.28, 0.1);
      emitStrand(pts, 0, 1, width * BOLT_W, 1, undefined, restrike);
      emitStrand(pts, 0, 1, width * 3.6 * BOLT_W, 0.38, HALO, 0);
      for (let f = 0; f < 2; f++) {
        const k = Math.floor(R(0.3, 0.75) * (pts.length - 1)), p = pts[k];
        const fa = ang + (f ? 1 : -1) * R(0.35, 0.8), fl = len * R(0.2, 0.4);
        const fe = p.clone().add(_c.set(Math.cos(fa) * fl, 0, Math.sin(fa) * fl * zs));
        emitStrand(jagged(p.clone(), fe, 3, 0.35, 0.1), k / (pts.length - 1), 1, width * 0.45 * BOLT_W, 0.75, undefined, restrike);
      }
    }
  }

  // the height that puts a point above the top edge of the viewport, wherever the page is scrolled
  function skyHeight(ground, margin = 1) {
    _n.copy(ground).project(camera);
    const rise = _d.set(0, 1, 0).transformDirection(camera.matrixWorldInverse).y || 0.87;
    return ((1 - _n.y) * camera.top / camera.zoom + margin) / rise;
  }

  // Reduced motion: a soft vanish and reappear with a small burst of the element at both ends.
  function startPoof(b) {
    const burstAt = p => {
      if (b.element === 'fire') flames(p, 10, 1.2, 0.6, 0.3);
      else if (b.element === 'lightning') sparks(p, 14, KIND.SPARK, 2);
      else if (b.element === 'dark') { inkSplat(_g.set(p.x, 0.3, p.z), 0.05, 1); inkSplat(_g.set(p.x, 0.4, p.z), 0.04, 0.6); }
      else { shards(_a.copy(p).setY(0.2), 10, 0.6); mist(p, 3, 0.5); }
    };
    burstAt(b.from);
    at(0.25, () => burstAt(b.to));
    if (b.element === 'dark') at(0.16, () => { if (bk === b) swapDarkCoat(); });   // while hidden (0.08-0.25 s)
  }

  // Lightning, quick attack: a 70 ms wind-up, a 140 ms zigzag dash drawn as a thick lightning
  // channel lit segment by segment as the chick passes, then a skidding stop under a thunderbolt.
  const QA_WIND = 0.07, QA_DASH = 0.14;
  function startQuickAttack(b) {
    const d = _d.subVectors(b.to, b.from).setY(0).normalize(), n = v().set(-d.z, 0, d.x), amp = Math.min(0.9, b.dist * 0.28);
    b.path = [b.from.clone(), b.from.clone().lerp(b.to, 0.33).addScaledVector(n, amp), b.from.clone().lerp(b.to, 0.66).addScaledVector(n, -amp), b.to.clone()];
    sparks(b.from, 24, KIND.SPARK, 1.4 * S * 0.5, 1.5);
    flash(_a.copy(b.from).setY(0.3), 1.2 * S * 0.4, [1, 0.93, 0.6], 0.6, 0.2);
    groundArcs(b.from, 3, 0.3 * S);
    const pts = [];
    for (let k = 0; k < 3; k++) {
      const seg = jagged(b.path[k].clone().setY(0.3), b.path[k + 1].clone().setY(0.3), 3, 0.18, 0.4);
      pts.push(...(k ? seg.slice(1) : seg));
    }
    const N = pts.length - 1, w = 0.3 * BOLT_W;
    for (let j = 0; j < N; j++) {
      const delay = QA_WIND + (j / N) * QA_DASH;
      _e.subVectors(pts[j + 1], pts[j]);
      const tip = (j === 0 ? TIP_START : 0) | (j === N - 1 ? TIP_END : 0);
      front.emit(KIND.BOLT, pts[j], _e, 0.55, w, 1, { delay, drag: 0, grav: 1, seed: tip });
      front.emit(KIND.BOLT, pts[j], _e, 0.55, w * 3.6, 0.42, { delay, drag: 0, grav: 0, seed: tip, color: HALO });
    }
    for (let k = 1; k <= 3; k++) {
      const p = pathAt(b.path, k / 4).clone();
      at(QA_WIND + QA_DASH * k / 4, () => { sparks(p, 12, KIND.SPARK, 1.2 * S * 0.5, 1.2); decal(DECAL.BURN, p, 0.5 * S * 0.6, 2.4); });
    }
    at(QA_WIND + QA_DASH, () => {
      const zs = roundStretch() * 0.7;
      skyBolt(b.to, 0, 1.1);
      flash(_a.copy(b.to).setY(0.25), 1.1 * S, [1, 0.93, 0.62], 0.7, 0.35);
      sparks(b.to, 50, KIND.SPARK, 1.3 * S, 1.8);
      dust(b.to, 16, 0.55 * S, 0.35 * S);
      // lightning races out across the ground in every direction, nearly round on screen
      // (a third of the first version's reach, rings and burn)
      radialBolts(b.to, lowPower ? 7 : 10, 0.27 * S, { levels: 4, width: 0.08 });
      decal(DECAL.RING, b.to, 0.73 * S, 0.6, ELEMENT_FX_STYLE.lightning.ring, 0.9, 0, { zStretch: zs });
      decal(DECAL.RING, b.to, 0.47 * S, 0.5, ELEMENT_FX_STYLE.lightning.ring, 0.7, 0.06, { zStretch: zs });
      decal(DECAL.BURN, b.to, 0.43 * S, 3.2, WHITE, 1, 0, { zStretch: zs, forceHold: true });
      addGlow(ELEMENT_FX_STYLE.lightning.glow, 0.8);
      if (time - lastPageFlash > 0.4) { lastPageFlash = time; pageFlash = Math.max(pageFlash, 1); }
    });
  }
  function pathAt(path, s) {
    const f = Math.min(0.9999, Math.max(0, s)) * (path.length - 1), k = Math.floor(f);
    return _g.copy(path[k]).lerp(path[k + 1], f - k);
  }

  // Dark, shadow step (0.85 s): white smoke gathers at the chick's feet and swallows it with a soft
  // whoomp; while it is hidden a streak of white smoke races along a shallow arc to the butterfly,
  // blooms there, and the chick steps out of it. Quiet on purpose: no flash, only smoke.
  const DK = { vanish: 0.16, appear: 0.5, swap: 0.34, trail0: 0.13, trail1: 0.38 };
  const TRAIL_STEP = 1 / 28;   // the streak is poured every 1/28 of the way
  // the whoomp: a cloud of white smoke blooms where the chick stands (white reads far stronger on
  // the dark than the black ink it replaced, so it is a smaller, tighter cloud)
  function shadowPuff(p, delay) {
    at(delay, () => inkBurst(p, 0.06, 0.85, 4, 0.32));
  }
  function startShadowStep(b) {
    inkSplat(_g.set(b.from.x, 0.15, b.from.z), 0.045, 0.5);   // smoke gathers at the feet
    shadowPuff(b.from, 0.1);
    shadowPuff(b.to, DK.trail1);   // blooms as the streak arrives
    // hidden in the smoke, the coat turns over: white comes out black, black comes out white
    at(DK.swap, () => { if (bk === b) swapDarkCoat(); });
    at(DK.appear, () => inkSplat(_g.set(b.to.x, 0.35, b.to.z), 0.05, 1.1));   // it steps out of the smoke
    // the streak's path bows a little to a random side, more for a longer move
    const side = Math.random() < 0.5 ? -1 : 1;
    b.trailBow = new THREE.Vector3(-(b.to.z - b.from.z), 0, b.to.x - b.from.x).normalize().multiplyScalar(side * Math.min(0.6, b.dist * 0.14));
    b.trailS = 0;
  }
  // The streak: white smoke poured along the path up to its racing head (from DK.trail0 to
  // DK.trail1), at fixed steps so it is as dense at any frame rate, plus a fuller puff at the head.
  // The ink buffer then swirls it, lets it rise and fades it.
  function smokeTrail(b, a) {
    const head = Math.min(1, Math.max(0, (a - DK.trail0) / (DK.trail1 - DK.trail0)));
    if (head <= 0 || b.trailS >= 1) return;
    for (let n = 0; b.trailS < head && n < 9; n++) {
      b.trailS = Math.min(head, b.trailS + TRAIL_STEP);
      const bow = Math.sin(Math.PI * b.trailS);
      _g.copy(b.from).lerp(b.to, b.trailS).addScaledVector(b.trailBow, bow).setY(0.2 + 0.16 * bow);
      inkSplat(_g, 0.012 + 0.008 * bow, 0.45);
    }
    const bow = Math.sin(Math.PI * head);
    _g.copy(b.from).lerp(b.to, head).addScaledVector(b.trailBow, bow).setY(0.2 + 0.16 * bow);
    inkSplat(_g, 0.024, 0.35);
  }

  // Ice: a pillar erupts around the chick and shatters, frost streams to the butterfly, and a
  // second pillar breaks open there with the chick inside.
  function icePillar(base, delay, life) {
    crystal(base, 3.2, 0.5, _b.set(1, 0, 0).clone(), 0, delay, life, true);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + R(-0.3, 0.3), r = R(0.36, 0.6);
      const sat = base.clone().add(_c.set(Math.cos(a) * r, 0, Math.sin(a) * r * 0.85));
      crystal(sat, R(0.9, 1.9), R(0.13, 0.22), new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)), R(0.35, 0.6), delay + R(0.02, 0.1), life - R(0, 0.1), true);
    }
    const p = base.clone();
    at(delay, () => {
      shards(_a.copy(p).setY(0.2), 24, 1.1);
      mist(p, 5, 0.9);
      decal(DECAL.FROST, p, 1.8, 5);
      flash(_a.copy(p).setY(0.8), 2.2, [0.8, 0.95, 1], 0.55, 0.3);
    });
    at(delay + life - 0.2, () => {   // the shatter
      shards(_a.copy(p).setY(1.1), 36, 1.4);
      mist(p, 6, 1.1);
      decal(DECAL.RING, p, 3.2, 0.6, ELEMENT_FX_STYLE.ice.ring, 0.85);
      flash(_a.copy(p).setY(0.9), 2.6, [0.85, 0.97, 1], 0.6, 0.3);
    });
  }
  // the frozen floor left where the chick reappears: a wide frost field spreading out from the
  // pillar, with a cold shock ring and small spikes breaking through around its rim
  function iceFloor(p) {
    const zs = roundStretch() * 0.75;
    decal(DECAL.FROST, p, 6, 3, WHITE, 1, 0, { zStretch: zs, forceHold: true });
    for (let k = 0; k < 4; k++) {   // ragged lobes so the field is not a perfect disc
      const a = (k / 4) * Math.PI * 2 + R(-0.4, 0.4), r = R(1.4, 2.1);
      decal(DECAL.FROST, _a.set(p.x + Math.cos(a) * r, 0, p.z + Math.sin(a) * r * zs), R(2.4, 3.2), 3, WHITE, 1, R(0.05, 0.2), { zStretch: zs, forceHold: true });
    }
    decal(DECAL.RING, p, 7, 0.7, ELEMENT_FX_STYLE.ice.ring, 0.85, 0, { zStretch: zs });
    const spikes = reducedMotion ? 0 : lowPower ? 8 : 14;
    for (let k = 0; k < spikes; k++) {
      const a = (k / spikes) * Math.PI * 2 + R(-0.2, 0.2), r = R(1.7, 2.6);
      const base = new THREE.Vector3(p.x + Math.cos(a) * r, 0, p.z + Math.sin(a) * r * zs);
      const w = R(0.07, 0.12), h = heightLimit(base, p, R(0.3, 0.75), w);
      crystal(base, h, w, new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)), R(0.3, 0.6), R(0.05, 0.3), R(2.5, 3.5));
    }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; mist(_a.set(p.x + Math.cos(a) * 1.8, 0, p.z + Math.sin(a) * 1.8 * zs), 1, 0.8); }
  }
  function startIcePillars(b) {
    icePillar(b.from, 0, 0.75);
    icePillar(b.to, 0.45, 0.7);
    at(0.45, () => iceFloor(b.to));
    at(0.32, () => {
      for (let k = 0; k < 46 * quality; k++) {
        _a.copy(b.from).add(_c.set(R(-0.3, 0.3), R(0.2, 1.6), R(-0.3, 0.3)));
        _f.copy(b.to).add(_c.set(R(-0.25, 0.25), R(0.2, 1.4), R(-0.25, 0.25))).sub(_a);
        front.emit(KIND.MOTE, _a, _f, R(0.45, 0.6), 0.07, 0.03, { color: [0.85, 0.97, 1], alpha: 0.95, delay: R(0, 0.12) });
      }
      for (let k = 1; k <= 3; k++) decal(DECAL.FROST, b.from.clone().lerp(b.to, k / 4), 0.9, 4);
    });
  }

  // Fire: a crouch and a ring of flame, a rocket leap off the top of the page, a fire sigil on the
  // landing spot, then the chick falls onto it as a burning meteor and the ground explodes.
  // 1.7x the original pace (launch 0.12, gone 0.42, fall 0.55, impact 0.95 s)
  const MT = { launch: 0.07, gone: 0.25, fall: 0.32, impact: 0.56 };
  function startMeteor(b) {
    b.top = skyHeight(b.from, 1.2);
    // the meteor enters just above the top edge, so it is on screen for most of its fall
    b.sky = b.to.clone().add(_c.set(-1.6, 0, -0.9));
    b.sky.y = skyHeight(b.sky, 0.25);
    flames(b.from, 22, 1.6, 0.7, 0.35);
    embers(b.from, 14, 2);
    at(MT.launch, () => { decal(DECAL.SCORCH, b.from, 0.9 * S * 0.5, 3); dust(b.from, 14, 0.4 * S, 0.3 * S); flash(_a.copy(b.from).setY(0.2), 1.6, [1, 0.6, 0.25], 0.7, 0.25); });
    // the landing sigil draws itself on and flares (30% of its life) exactly at the impact
    const sigilAt = 0.26;
    at(sigilAt, () => decal(DECAL.CIRCLE, b.to, 2.2, (MT.impact - sigilAt) / 0.3, ELEMENT_FX_STYLE.fire.ring, 0.95, 0, { zStretch: roundStretch() * 0.6 }));
  }
  // The impact: a white-hot core and fireball, a flame column, a wall of fire rolling outward
  // along the floor, flying embers, smoke, three shock rings, a crater, a second blast a beat
  // later, the page flashing and a smouldering ring in the crater.
  function meteorImpact(b) {
    const k = S * 0.47, p = b.to, zs = roundStretch() * 0.7;   // 2/3 of the 0.7*S blast first tried
    flash(_a.copy(p).setY(0.5), 3.6 * k, [1, 0.6, 0.22], 0.9, 0.6);
    flash(_a.copy(p).setY(0.3), 1.5 * k, [1, 0.95, 0.8], 0.95, 0.25);
    flames(p, 150, 3.2 * k, 1.3 * k, 0.5 * k, [0.45, 0.9]);
    for (let i = 0; i < 60 * quality; i++) {
      front.emit(KIND.FIRE, _a.copy(p).add(_c.set(R(-0.15, 0.15), 0, R(-0.15, 0.15))), _c.set(R(-0.4, 0.4), R(3, 6), R(-0.4, 0.4)).multiplyScalar(k),
        R(0.45, 0.8), 0.12 * k, R(0.4, 0.65) * k, { drag: 1.4, grav: k, color: [1.05, 0, 0] });
    }
    for (let i = 0; i < 80 * quality; i++) {   // the fire wall rolling out along the floor
      const a = (i / 80) * Math.PI * 2 + R(-0.05, 0.05), sp = R(2.6, 3.6) * k;
      front.emit(KIND.FIRE, _a.copy(p).setY(0.12), _c.set(Math.cos(a) * sp, R(0.3, 1), Math.sin(a) * sp * zs),
        R(0.5, 0.75), 0.15 * k, R(0.35, 0.55) * k, { drag: 2.6, grav: 0.8 * k, color: [R(0.9, 1.05), 0, 0] });
    }
    embers(p, 110, 2.6 * k);
    smoke(_a.copy(p).setY(0.8), 28, 1.1 * k, 0.32);
    dust(p, 36, 2 * k, k * 0.8);
    decal(DECAL.RING, p, 4.5 * k, 0.75, ELEMENT_FX_STYLE.fire.ring, 0.95, 0, { zStretch: zs });
    decal(DECAL.RING, p, 3 * k, 0.6, ELEMENT_FX_STYLE.fire.ring, 0.75, 0.08, { zStretch: zs });
    decal(DECAL.RING, p, 6 * k, 0.9, ELEMENT_FX_STYLE.fire.ring, 0.5, 0.16, { zStretch: zs });
    decal(DECAL.SCORCH, p, 2 * k, 4, WHITE, 1, 0, { zStretch: zs, forceHold: true });
    addGlow(ELEMENT_FX_STYLE.fire.glow, 1);
    if (time - lastPageFlash > 0.4) { lastPageFlash = time; pageFlash = 1; }
    at(0.12, () => {   // the second blast
      flash(_a.copy(p).setY(0.4), 2.4 * k, [1, 0.5, 0.15], 0.7, 0.4);
      flames(p, 50, 2.2 * k, 1.6 * k, 0.4 * k, [0.4, 0.7]);
    });
    for (let s = 1; s <= 4; s++) at(0.1 * s + 0.1, () => {   // the crater keeps burning for a moment
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, r = R(0.6, 1.1) * k * 0.5;
        flames(_a.set(p.x + Math.cos(a) * r, 0, p.z + Math.sin(a) * r * zs), 1, 0.3, 0.9 * k * 0.4, 0.22 * k);
      }
    });
  }

  function updateBlink(dt) {
    if (!bk) return;
    const b = bk, a = (time - b.t0) * b.speed;
    if (a >= BLINK_TIME[b.element]) { endBlink(); return; }
    if (reducedMotion) {
      pose.hidden = a > 0.08 && a < 0.25;
      blinkPos.copy(a < 0.16 ? b.from : b.to);
      return;
    }
    if (b.element === 'lightning') {
      if (a < QA_WIND) { pose.crouch = 0.6 * a / QA_WIND; pose.hidden = false; blinkPos.copy(b.from); }
      else if (a < QA_WIND + QA_DASH) { pose.crouch = 0; pose.hidden = true; blinkPos.copy(pathAt(b.path, (a - QA_WIND) / QA_DASH)); }
      else { pose.hidden = false; blinkPos.copy(b.to); pose.crouch = Math.max(0, 0.8 - (a - QA_WIND - QA_DASH) * 4); }
    } else if (b.element === 'dark') {
      // sinks a little into the gathering smoke, hidden from the whoomp until it steps out
      pose.crouch = a < DK.vanish ? 0.4 * a / DK.vanish : a > DK.appear ? Math.max(0, 0.4 - (a - DK.appear) * 2) : 0;
      pose.hidden = a >= DK.vanish && a < DK.appear;
      blinkPos.copy(a < DK.swap ? b.from : b.to);
      smokeTrail(b, a);
    } else if (b.element === 'ice') {
      pose.crouch = a < 0.22 ? 0.4 * a / 0.22 : 0;
      pose.hidden = a >= 0.24 && a < 0.95;
      blinkPos.copy(a < 0.6 ? b.from : b.to);
    } else {
      if (a < MT.launch) { pose.crouch = 0.8 * a / MT.launch; pose.rise = 0; pose.hidden = false; blinkPos.copy(b.from); }
      else if (a < MT.gone) {
        const s = (a - MT.launch) / (MT.gone - MT.launch);
        pose.crouch = 0; pose.rise = b.top * s * s; pose.hidden = false; blinkPos.copy(b.from);
        // rocket exhaust under the climbing chick
        for (let i = take('blink', 190, dt); i > 0; i--) {   // rates x1.7 keep the shorter phases as dense
          _a.set(b.from.x + R(-0.08, 0.08), pose.rise + 0.15, b.from.z + R(-0.08, 0.08));
          front.emit(KIND.FIRE, _a, _c.set(R(-0.4, 0.4), -R(2, 4), R(-0.4, 0.4)), R(0.3, 0.5), 0.12, R(0.5, 0.9), { drag: 2, grav: 2, color: [R(0.9, 1.1), 0, 0] });
        }
        if (take('blinkB', 30, dt)) smoke(_a.set(b.from.x, pose.rise * 0.6, b.from.z), 1, 0.7, 0.25);
      } else if (a < MT.fall) { pose.hidden = true; pose.rise = 0; blinkPos.copy(b.from); }
      else if (a < MT.impact) {
        // the falling meteor: the chick itself at the head of a long fire trail
        const s = (a - MT.fall) / (MT.impact - MT.fall), e = Math.pow(s, 1.5);
        const head = b.head || (b.head = v()), land = b.land || (b.land = v().set(b.to.x, 0.3, b.to.z));
        head.copy(b.sky).lerp(land, e);
        pose.hidden = false; pose.rise = Math.max(0, head.y - 0.3); pose.crouch = 0.3;
        blinkPos.set(head.x, 0, head.z);
        _e.subVectors(land, b.sky).normalize();
        for (let i = take('blink', 290, dt); i > 0; i--) {
          _a.copy(head).add(_c.set(R(-0.15, 0.15), R(-0.1, 0.25), R(-0.15, 0.15)));
          _c.copy(_e).multiplyScalar(-R(1, 3)).add(_b.set(R(-0.5, 0.5), R(0, 0.6), R(-0.5, 0.5)));
          front.emit(KIND.FIRE, _a, _c, R(0.3, 0.5), 0.35, R(0.8, 1.4), { drag: 1.5, grav: 1.2, color: [R(0.95, 1.12), 0, 0] });
        }
        if (take('blinkB', 50, dt)) smoke(head, 1, 0.9, 0.28);
        if (take('ember', 85, dt)) embers(head, 1, 1.5);
        flash(_a.copy(head).setY(head.y + 0.1), 2, [1, 0.72, 0.3], 0.85, 0.08);
      } else {
        if (!b.impact) { b.impact = true; meteorImpact(b); }
        pose.hidden = false; pose.rise = 0; blinkPos.copy(b.to);
        pose.crouch = Math.max(0, 1 - (a - MT.impact) * 4.5);
      }
    }
  }

  function clear() {
    back.clear(); front.clear();
    for (let i = 0; i < DECALS; i++) { decalD.array[i * 4] = -1e9; decalP.array[i] = 0; }
    decalD.needsUpdate = decalP.needsUpdate = true;
    held = []; release = -1; markU.uMarkFade.value = 1; pageFlash = 0;
    pageMarks?.clear();
    inkLast = -1e9; inkSplatN = 0; inkLive = false; inkView.visible = false;   // the ink belongs to the old surface
    for (let i = 0; i < CRYSTALS; i++) { crystalG.array[i * 4] = -1e9; crystalInfo[i].end = -1; }
    crystalG.needsUpdate = true;
    events = []; trail = []; trailSpawns = [];
    // an interrupted transformation completes its look without the show
    if (tf) { tf = null; wipe = 1; }
    endBlink();   // a move in progress lands at once
    pose.crouch = pose.shake = pose.lift = pose.wings = 0;
    glow.set(0, 0, 0);
  }

  if (renderer) bakeStamps();

  return {
    transform, footstep, dissipate, clear,
    get pose() { return pose; },
    get transforming() { return Boolean(tf); },
    blink, arrive,
    get blinking() { return Boolean(bk); },
    get blinkPos() { return blinkPos; },
    get wipe() { return wipe; },
    get pageFlash() { return pageFlash; },
    // 0..1: how far the dark element's smoke has spread (drives the butterfly's white glow)
    get darkness() { return darkAmount; },
    // dark's current coat: 'white' or 'black' (the scene colours the beak and legs to match)
    get darkCoat() { return darkCoat; },
    // dark minigame: colour the head orb with the colour to break next ('black' | 'white' | 'either'; null: plain black)
    setOrbCue(cue) { crestU.uOrb.value = cue === 'white' ? 1 : cue === 'either' ? 2 : 0; },
    get orbCue() { return ['black', 'white', 'either'][crestU.uOrb.value]; },
    // the surface the chick is on: the page (body) or an open project dialog; every effect,
    // the darkness included, applies on both, and page stamps follow it
    setSurface(host) { pageMarks?.setHost(host); darkHost = host; placeDarkCanvas(); },
    // the darkness's own canvas (null until first used, or when it fell back into the scene)
    get darkCanvas() { return darkRenderer ? darkRenderer.domElement : null; },
    get darknessPass() { return darkness; },
    pourIntoInk,
    // dark: the boxes that keep some brightness or glow at their edges in the darkness (CSS px,
    // viewport-relative): {left, top, right, bottom, radius, keep (brightness kept, 0-1), rim
    // (1 = thumbnail rim, less = thinner, 0 = none), seed (phase), free (ignores clipTop)}.
    // clipTop: nothing shows above this line (a project dialog's pinned header) unless free.
    setDarkGlow(boxes, viewW, viewH, clipTop = 0) {
      const n = Math.min(boxes.length, DARK_RECTS);
      for (let i = 0; i < n; i++) {
        const b = boxes[i];
        darkU.uRects.value[i].set(b.left, b.top, b.right, b.bottom);
        darkU.uBoxStyle.value[i].set(b.radius, b.keep, b.rim, b.free ? -1 - b.seed : b.seed);
      }
      darkU.uRectCount.value = n;
      darkU.uView.value.set(viewW, viewH);
      darkU.uClipTop.value = clipTop;
    },
    get heldMarks() { return held.length; },
    get pageMarks() { return pageMarks ? pageMarks.count : 0; },
    setVisible(value) {
      fxVisible = value;
      group.visible = value;
      pageMarks?.setVisible(value);
      if (!value && darkRenderer) darkRenderer.domElement.hidden = true;
      if (!value) crest.visible = crestIce.visible = false;
    },
    update(dt, g) {
      dt = Math.min(Math.max(dt, 0), 0.1);
      time += dt;
      uTime.value = time;
      furUniforms.uFxTime.value = time;
      lightView.copy(LIGHT).transformDirection(camera.matrixWorldInverse);

      // lowering the debug slider below the goal cancels a transformation in progress
      if (tf && !g.unlocked && !g.ending) { tf = null; pose.crouch = pose.shake = pose.lift = pose.wings = 0; }
      if (events.length) {
        const due = events.filter(e => e.at <= time);
        if (due.length) { events = events.filter(e => e.at > time); due.forEach(e => e.run()); }
      }

      if (tf) {
        const a = time - tf.t0, s = ELEMENT_FX_STYLE[tf.element];
        if (a < BURST) {
          if (tf.element === 'dark') {
            // black ink gathers on a shrinking ring around the chick instead of glowing motes
            const k = a / BURST, r = (1 - k) * 1.3 + 0.25;
            for (let i = 0; i < 2; i++) {
              const ang = time * 2.1 + i * Math.PI + R(-0.3, 0.3);
              inkSplat(_a.set(g.body.x + Math.cos(ang) * r, 0.3, g.body.z + Math.sin(ang) * r * 0.85), 0.022, -2.6 * dt);
            }
          } else for (let i = take('mote', 150, dt); i > 0; i--) {
            const ang = Math.random() * Math.PI * 2, r = R(0.9, 1.5) * B * 0.6;
            _a.copy(g.body).add(_c.set(Math.cos(ang) * r, R(-0.25, 0.5) * B * 0.5, Math.sin(ang) * r));
            front.emit(KIND.MOTE, _a, _c.subVectors(g.body, _a), Math.max(0.2, BURST - a), 0.05 * Math.sqrt(B), 0.02, { color: s.mote, alpha: 0.9 });
          }
          if (tf.element === 'fire' && take('aura', 40, dt)) {
            flames(_a.copy(g.foot).add(_c.set(R(-0.4, 0.4), 0, R(-0.4, 0.4)).multiplyScalar(B * 0.5)), 1, 0.2, 0.9 * B * 0.4, 0.18 * B * 0.5);
          }
          if (tf.element === 'lightning' && time > nextArc) {
            nextArc = time + 0.09;
            const ang = Math.random() * Math.PI * 2, r = 1.1 * B * 0.5;
            const from = _a.copy(g.foot).add(_c.set(Math.cos(ang) * r, 0.02, Math.sin(ang) * r)).clone();
            boltSlot([{ pts: jagged(from, g.body.clone(), 4, 0.35), width: 0.05 * BOLT_W, intensity: 0.7, along0: 0, along1: 1 }], 0.14);
          }
          if (tf.element === 'ice' && take('aura', 10, dt)) mist(_a.copy(g.foot), 1, 0.45 * B * 0.5);
          const k = a / BURST;
          pose.crouch = reducedMotion ? 0 : k * k * (3 - 2 * k);
          pose.shake = reducedMotion ? 0 : k * k * (tf.element === 'dark' ? 0.25 : 1);   // dark barely trembles
          addGlow(s.glow, 0.25 * k);
        } else {
          if (!tf.burst) { tf.burst = true; burst(tf.element, g.foot.clone(), g.body.clone()); }
          // the chick rises out of its crouch and stays grounded: no celebratory jump or flap
          const b = (a - BURST) / 0.45;
          pose.crouch = reducedMotion ? 0 : Math.max(0, 1 - b * 4);
          pose.shake = 0;
          pose.lift = 0;
          pose.wings = 0;
        }
        wipe = THREE.MathUtils.smoothstep(a, BURST, BURST + WIPE);
        if (a >= TRANSFORM) { tf = null; pose.crouch = pose.shake = pose.lift = pose.wings = 0; }
      } else if (g.charged) {
        wipe = Math.min(1, wipe + dt * 4);
      }
      if (g.ending) wipe = Math.min(wipe, g.tint);
      if (!g.unlocked && !g.ending) wipe = 0;
      furUniforms.uWipe.value = wipe;

      // a move in progress ends at once if the element runs out; it pauses the continuous skill
      if (bk && !g.charged) endBlink();
      updateBlink(dt);
      if (g.charged && !tf && !bk) {
        if (g.element === 'fire') breath(dt, g);
        else if (g.element === 'lightning') storm(g);
        else if (g.element === 'dark') shadowField(dt, g);
        else frostField(g);
        aura(g.element, dt, g);
      }
      // dark: the page sinks into smoke with the coat (and draws back with it), the butterfly
      // keeps a soft white glow
      darkAmount = g.element === 'dark' ? wipe : 0;
      darkU.uDark.value = darkAmount;
      darkness.visible = fxVisible && darkAmount > 0.001;
      if (darkness.visible) {
        _n.copy(g.body).project(camera);
        darkU.uOrigin.value.set(_n.x, _n.y);
        darkU.uAspect.value = (camera.right - camera.left) / Math.max(1e-6, camera.top - camera.bottom);
      }
      renderDarkness();
      if (darkAmount > 0.5 && g.aim) {
        if (take('auraB', 14, dt)) flash(g.aim, 0.6, [0.95, 0.95, 1], 0.7 * darkAmount, 0.35);
        if (take('blinkB', 5, dt)) front.emit(KIND.MOTE, g.aim, _c.set(R(-0.15, 0.15), -R(0.15, 0.35), R(-0.15, 0.15)), R(0.6, 1), 0.035, 0.01, { color: [0.95, 0.95, 1], alpha: 0.7 });
      }
      seeThrough(g.foot, dt);
      updateMarks(dt, g);
      updatePillar();
      updateCrest(dt, g);
      stepInk(dt);   // after every pour of this frame

      glow.multiplyScalar(Math.exp(-dt * 7));
      furUniforms.uFxGlow.value.copy(glow);
      back.flush(); front.flush();
    },
    dispose() {
      scene.remove(group);
      if (head) head.remove(crest, crestIce);
      for (const rt of inkRT) rt.dispose();
      inkSim.geometry.dispose(); inkSim.material.dispose();
      for (const object of [back.mesh, front.mesh, decals, crystals, pillar, crest, darkness, inkView]) {
        object.geometry.dispose();
        object.material.dispose();
      }
      crestGeo.dispose();   // its material is the shared crystal material, disposed above
      if (darkRenderer) { darkRenderer.domElement.remove(); darkRenderer.dispose(); darkRenderer.forceContextLoss(); }
      disposed = true;
      pageMarks?.dispose();
      for (const list of Object.values(stampURL)) list.forEach(url => url && URL.revokeObjectURL(url));
      furUniforms.uWipe.value = 0;
      furUniforms.uFxGlow.value.set(0, 0, 0);
    },
  };
}
