// Adapted from Q:/Codex/threejs/sumi-chick.html. The original file stays unchanged.
// Chick geometry, behaviour, IK, butterfly and footprint simulation are retained.
import * as THREE from "./assets/vendor/three-r186/three.module.min.js";
import { createPageCamera } from "./sumi-chick-camera.js?v=document-scroll-20261103";
import { createChaseRhythm, chaseUrgency, chaseSpeedLimit } from "./sumi-chick-chase.js?v=click-pursuit-20261103";
import { createButterflyFlight } from "./sumi-butterfly-flight.js?v=random-flight-20261103";
import { createTextTracks } from "./sumi-text-tracks.js?v=chewy-trail-20261103";
import { createButterflyPollen } from "./sumi-butterfly-pollen.js?v=pollen-20261103";

export function createSumiChick(canvas, { onActivity = () => {} } = {}) {
const events = new AbortController();
let running = false, disposed = false, activity = "";
let viewWidth = Math.max(1, window.innerWidth), viewHeight = Math.max(1, window.innerHeight);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
renderer.setClearColor(0x000000, 0);
if (!renderer.extensions.has("EXT_color_buffer_float")) {
  renderer.dispose();
  throw new Error("Floating-point WebGL render targets are unavailable.");
}
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const { clamp, lerp, damp, smoothstep } = THREE.MathUtils;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const R = (a, b) => a + (b - a) * Math.random();

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeCanvas(w, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/* ------------------------------------------------------------------ document camera
   Ground positions follow page scrolling while projected character size stays constant. */

const scene = new THREE.Scene();
const pageCamera = createPageCamera(viewWidth, viewHeight, window.scrollY);
const camera = pageCamera.camera;
const pollen = createButterflyPollen(scene, camera, { reducedMotion: reduceMotion });
let inkScrollY = window.scrollY;

// Fur keeps a gentle positive sheen; the chick has no directional darkening.
// Its separate ground-contact shadow is retained below.
const LIGHT_DIR = new THREE.Vector3(-0.45, 0.8, 0.4).normalize();

/* ------------------------------------------------------------------ shared GLSL */

const NOISE = /* glsl */ `
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
  float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
  }
`;

const FULLSCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fullscreenTri = new THREE.BufferGeometry();
fullscreenTri.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));

/* ------------------------------------------------------------------ painted textures (drawn once on 2D canvases)
   Textures read by the hand-written shaders stay in NoColorSpace: those shaders work in display values. */

// Turns a solid black shape into an ink stamp: uneven pigment, a darker rim, a faint bleed halo.
function inkStamp(shape, seed) {
  const S = shape.width;
  const blurred = (px) => {
    const c = makeCanvas(S);
    const x = c.getContext("2d");
    x.filter = `blur(${px}px)`;
    x.drawImage(shape, 0, 0);
    return x.getImageData(0, 0, S, S).data;
  };
  const sharp = blurred(1.2), inner = blurred(4), halo = blurred(7);
  const rnd = mulberry32(seed);
  const N = 32, grid = new Float32Array(N * N).map(() => rnd());
  const vn = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const at = (i, j) => grid[(((j % N) + N) % N) * N + (((i % N) + N) % N)];
    return lerp(lerp(at(xi, yi), at(xi + 1, yi), ux), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), ux), uy);
  };
  const out = makeCanvas(S);
  const og = out.getContext("2d");
  const img = og.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const k = (y * S + x) * 4 + 3;
      const a = sharp[k] / 255, inn = inner[k] / 255, h = halo[k] / 255;
      const n = vn((x / S) * 12, (y / S) * 12) * 0.6 + vn((x / S) * 40 + 7, (y / S) * 40) * 0.4;
      const rim = clamp((a - inn) * 2.2, 0, 1);
      const alpha = Math.max(a * (0.55 + 0.45 * n) + rim * 0.35, h * 0.16 * (0.6 + 0.4 * n));
      img.data[k] = Math.round(clamp(alpha, 0, 1) * 255);
    }
  }
  og.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(out);
}

// A chick's track: three knobbly forward toes, a short hind toe, a small heel pad. Toes point to the canvas bottom.
function trackTexture(S = 256) {
  const shape = makeCanvas(S);
  const g = shape.getContext("2d");
  g.fillStyle = "#000";
  const heel = [128, 96];
  for (const [x, y, w0, w1] of [[128, 238, 15, 7], [50, 200, 13, 6], [206, 200, 13, 6], [128, 34, 11, 6]]) {
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const r = (lerp(w0, w1, f) / 2) * (1 + 0.2 * Math.sin(f * Math.PI * 3));
      g.beginPath(); g.arc(lerp(heel[0], x, f), lerp(heel[1], y, f), r, 0, Math.PI * 2); g.fill();
    }
  }
  g.beginPath(); g.ellipse(heel[0], heel[1], 19, 16, 0, 0, Math.PI * 2); g.fill();
  return inkStamp(shape, 9);
}

// Reference-inspired cyan wings, blue roots and wine-red forewing tips.
// Keep the original silhouette, UVs and meshes; only the painted surface changes.
function wingTexture(kind) {
  const S = 512;
  const c = makeCanvas(S);
  const g = c.getContext("2d");
  const rnd = mulberry32(kind === "fore" ? 41 : 43);
  const shape = new Path2D();
  const margin = new Path2D();
  let base, veinEnds;
  if (kind === "fore") {
    base = [6, 300];
    shape.moveTo(6, 296);
    shape.bezierCurveTo(90, 190, 260, 70, 470, 46);
    shape.bezierCurveTo(492, 60, 488, 90, 470, 120);
    shape.bezierCurveTo(440, 190, 420, 250, 392, 318);
    shape.bezierCurveTo(280, 330, 140, 330, 6, 318);
    shape.closePath();
    margin.moveTo(470, 46);
    margin.bezierCurveTo(492, 60, 488, 90, 470, 120);
    margin.bezierCurveTo(440, 190, 420, 250, 392, 318);
    veinEnds = [[450, 52], [478, 90], [462, 140], [440, 200], [420, 260], [392, 316], [250, 326]];
  } else {
    base = [6, 70];
    shape.moveTo(6, 60);
    shape.bezierCurveTo(120, 40, 300, 70, 360, 130);
    shape.bezierCurveTo(390, 170, 370, 230, 330, 270);
    shape.bezierCurveTo(310, 300, 300, 330, 300, 360);
    shape.bezierCurveTo(298, 420, 290, 470, 270, 500);
    shape.bezierCurveTo(258, 470, 255, 420, 250, 370);
    shape.bezierCurveTo(200, 330, 120, 250, 6, 110);
    shape.closePath();
    margin.moveTo(300, 70);
    margin.bezierCurveTo(360, 110, 390, 170, 330, 270);
    margin.bezierCurveTo(310, 300, 300, 330, 300, 360);
    margin.bezierCurveTo(298, 420, 290, 470, 270, 500);
    veinEnds = [[240, 66], [330, 110], [370, 170], [340, 250], [300, 330], [280, 470], [180, 290]];
  }
  g.save();
  g.filter = "blur(3px)";
  g.fillStyle = "rgba(40,36,34,0.6)";
  g.fill(shape);
  g.restore();
  g.save();
  g.clip(shape);
  const wash = kind === "fore"
    ? g.createLinearGradient(6, 300, 470, 46)
    : g.createRadialGradient(6, 70, 0, 6, 70, 370);
  const colors = kind === "fore"
    ? [[0, "#022c78"], [.16, "#0562dc"], [.37, "#2ec6e7"], [.62, "#63e5e8"], [.73, "#34a3b6"], [.79, "#801625"], [.94, "#4b0b17"], [1, "#19191d"]]
    : [[0, "#012d70"], [.22, "#0b6fd2"], [.45, "#38cbe6"], [.78, "#6be4e8"], [1, "#399db6"]];
  for (const [stop, color] of colors) wash.addColorStop(stop, color);
  g.fillStyle = wash;
  g.fillRect(0, 0, S, S);
  if (kind === "hind") {
    // Keep the existing tail, painted dark like the reference wing edge.
    const tail = g.createLinearGradient(0, 285, 0, 400);
    tail.addColorStop(0, "rgba(13,24,31,0)");
    tail.addColorStop(1, "rgba(13,24,31,1)");
    g.fillStyle = tail;
    g.fillRect(0, 285, S, S - 285);
  }
  g.filter = "blur(3px)";
  g.strokeStyle = "rgba(12,20,26,0.97)";
  g.lineWidth = kind === "fore" ? 45 : 36;
  g.stroke(margin);
  g.lineWidth = 16;
  g.strokeStyle = "rgba(13,24,31,0.92)";
  g.stroke(shape);
  if (kind === "fore") {
    const costa = new Path2D();
    costa.moveTo(6, 296);
    costa.bezierCurveTo(90, 190, 260, 70, 470, 46);
    g.stroke(costa);
  }
  g.filter = "none";
  g.strokeStyle = "rgba(12,39,50,0.88)";
  for (const [x, y] of veinEnds) {
    g.lineWidth = 3.8;
    g.beginPath();
    g.moveTo(base[0] + 4, base[1]);
    g.quadraticCurveTo((base[0] + x) * 0.5 + (rnd() - 0.5) * 30, (base[1] + y) * 0.5 + (rnd() - 0.5) * 30, x, y);
    g.stroke();
  }
  // Curved cross-veins divide the blue field into the reference's broad cells.
  const crossVein = new Path2D();
  if (kind === "fore") {
    crossVein.moveTo(204, 141);
    crossVein.bezierCurveTo(246, 161, 274, 186, 273, 220);
    crossVein.bezierCurveTo(274, 255, 258, 291, 237, 325);
  } else {
    crossVein.moveTo(137, 66);
    crossVein.bezierCurveTo(191, 110, 232, 139, 227, 185);
    crossVein.bezierCurveTo(225, 219, 204, 245, 179, 273);
  }
  g.lineWidth = 3.2;
  g.stroke(crossVein);
  g.strokeStyle = "rgba(150,235,240,0.15)";
  g.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const [x, y] = veinEnds[Math.floor(rnd() * veinEnds.length)];
    const f0 = 0.2 + rnd() * 0.6, f1 = f0 + 0.08 + rnd() * 0.12;
    const jx = (rnd() - 0.5) * 24, jy = (rnd() - 0.5) * 24;
    g.beginPath();
    g.moveTo(lerp(base[0], x, f0) + jx, lerp(base[1], y, f0) + jy);
    g.lineTo(lerp(base[0], x, f1) + jx, lerp(base[1], y, f1) + jy);
    g.stroke();
  }
  g.restore();
  g.lineWidth = 2.4;
  g.strokeStyle = "rgba(12,12,14,0.9)";
  g.stroke(shape);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ------------------------------------------------------------------ subtle ambient traces
   A half-resolution feedback buffer carries short-lived color traces from movement,
   landings and dissolving footprints. R = warm trace, G = muted olive dust. */

const MAX_SPLATS = 14;
const rtOpts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
let rtA = new THREE.WebGLRenderTarget(2, 2, rtOpts);
let rtB = new THREE.WebGLRenderTarget(2, 2, rtOpts);

const simMat = new THREE.ShaderMaterial({
  depthTest: false,
  depthWrite: false,
  uniforms: {
    uPrev: { value: null },
    uAspect: { value: 1 },
    uTime: { value: 0 },
    uDt: { value: 0.016 },
    uScrollDelta: { value: 0 },
    uSplat: { value: Array.from({ length: MAX_SPLATS }, () => new THREE.Vector4()) },
    uSplatCount: { value: 0 },
  },
  vertexShader: FULLSCREEN_VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D uPrev;
    uniform float uAspect, uTime, uDt, uScrollDelta;
    uniform vec4 uSplat[${MAX_SPLATS}];
    uniform int uSplatCount;
    varying vec2 vUv;
    ${NOISE}
    float psi(vec2 p, float t) { return snoise(vec3(p, t)) + 0.45 * snoise(vec3(p * 2.3 + 7.1, t * 1.4)); }
    vec2 curl(vec2 p, float t) {
      const float e = 0.015;
      float a = psi(p + vec2(0.0, e), t), b = psi(p - vec2(0.0, e), t);
      float c = psi(p + vec2(e, 0.0), t), d = psi(p - vec2(e, 0.0), t);
      return vec2(a - b, -(c - d)) / (2.0 * e);
    }
    void main() {
      vec2 p = vec2(vUv.x * uAspect, vUv.y);
      vec2 vel = curl(p * 1.8, uTime * 0.06) * 0.0025 + curl(p * 4.6 + 3.0, uTime * 0.1) * 0.001;
      vel += vec2(0.001, 0.004);
      vec2 back = vUv - vel * uDt * vec2(1.0 / uAspect, 1.0) - vec2(0.0, uScrollDelta);
      // Ink is attached to the same document location as the footprints. Do not
      // stretch edge pixels when new content scrolls into the feedback buffer.
      vec4 prev = (back.x >= 0.0 && back.x <= 1.0 && back.y >= 0.0 && back.y <= 1.0)
        ? texture2D(uPrev, back) : vec4(0.0);
      float ink = prev.r * pow(0.10, uDt);
      float amb = prev.g * pow(0.16, uDt);
      for (int i = 0; i < ${MAX_SPLATS}; i++) {
        if (i >= uSplatCount) break;
        vec4 s = uSplat[i];
        vec2 d = (vUv - s.xy) * vec2(uAspect, 1.0);
        ink += s.w * exp(-dot(d, d) / (s.z * s.z));
      }
      gl_FragColor = vec4(min(ink, 2.0), min(amb, 1.2), 0.0, 1.0);
    }
  `,
});
const simScene = new THREE.Scene();
const simQuad = new THREE.Mesh(fullscreenTri, simMat);
simQuad.frustumCulled = false;
simScene.add(simQuad);
const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/* Soft peach/olive traces: normal alpha blending stays subtle on dark and light sections. */
const bgMat = new THREE.ShaderMaterial({
  depthTest: false, depthWrite: false,
  blending: THREE.CustomBlending,
  blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  uniforms: { uInk: { value: null } },
  vertexShader: FULLSCREEN_VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D uInk;
    varying vec2 vUv;
    ${NOISE}
    void main() {
      vec2 ink = texture2D(uInk, vUv).rg;
      float grain = vnoise(gl_FragCoord.xy * 0.4);
      float smoke = (1.0 - exp(-ink.g * 1.3)) * 0.025 * (0.95 + 0.05 * grain);
      float mark = (1.0 - exp(-ink.r * 1.3)) * 0.06 * (0.96 + 0.04 * grain);
      float alpha = mark + smoke * (1.0 - mark);
      if (alpha < 0.0015) discard;
      vec3 color = (vec3(0.867, 0.663, 0.533) * mark
        + vec3(0.69, 0.74, 0.57) * smoke * (1.0 - mark)) / alpha;
      gl_FragColor = vec4(color, alpha);
    }
  `,
});
const bg = new THREE.Mesh(fullscreenTri, bgMat);
bg.frustumCulled = false;
bg.renderOrder = -100;
scene.add(bg);

/* ------------------------------------------------------------------ shell down
   Every fluffy part is an InstancedMesh: instance i is shell i, pushed out along the normal.
   Strands are cells of 3D hash noise in the part's rest space, gathered into tufts toward the
   tips. The colour runs from a warm ochre root to a pale tip, with a soft halo where loose
   down catches the light. Source-over alpha preserves the down on the transparent portfolio layer. */

const SHELLS = 26;
const U = {
  uTime: { value: 0 },
  uComb: { value: new THREE.Vector3(0, -1, 0) },
  uCombHead: { value: new THREE.Vector3(0, -0.3, -1) },
  uLight: { value: LIGHT_DIR },
};

const FUR_VERT = /* glsl */ `
  attribute vec3 aRest;
  uniform float uLen, uShells, uTime, uCombAmt;
  uniform vec3 uComb;
  varying float vH;
  varying vec3 vRest, vN, vView, vT;
  void main() {
    float h = float(gl_InstanceID) / (uShells - 1.0);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vec3 wn = normalize(transpose(inverse(mat3(modelMatrix))) * normal);
    vec3 comb = uComb * uCombAmt;
    vec3 d = wn * uLen * h + comb * (uLen * pow(h, 1.5));
    d += vec3(sin(uTime * 1.7 + wp.y * 19.0 + wp.x * 11.0), 0.3 * sin(uTime * 2.1 + wp.z * 15.0), cos(uTime * 1.3 + wp.z * 17.0)) * uLen * 0.16 * h * h;
    wp.xyz += d;
    vRest = aRest * vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
    vH = h;
    vN = wn;
    vT = normalize(wn + comb * 1.2);
    vView = cameraPosition - wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FUR_FRAG = /* glsl */ `
  uniform float uDensity;
  uniform vec3 uColor, uTip, uLight;
  varying float vH;
  varying vec3 vRest, vN, vView, vT;
  float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  vec3 hash33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  float strand(vec3 p, float h) {
    vec3 c = floor(p);
    vec3 o = 0.25 + 0.5 * hash33(c);
    float len = mix(0.6, 1.0, hash13(c + 19.7));
    float t = h / len;
    if (t >= 1.0) return 0.0;
    float rad = 0.55 * (1.0 - t * 0.85);
    float d = length(fract(p) - o);
    return (1.0 - smoothstep(rad * 0.2, rad, d)) * (1.0 - 0.6 * t);
  }
  void main() {
    float h = vH;
    float a = 1.0;
    if (h > 0.001) {
      // down is soft and dense: many fine strands, only loosely gathered into tufts
      vec3 p = vRest * uDensity;
      vec3 cq = p * 0.2;
      vec3 tuft = (floor(cq) + 0.2 + 0.6 * hash33(floor(cq) + 3.7)) / 0.2;
      p = mix(p, tuft, h * 0.22);
      a = max(strand(p, h), strand(p * 1.31 + vec3(7.1, 3.3, 5.9), h));
      a = max(a, strand(p * 0.77 + 11.0, h));
      a = max(a, strand(p * 1.73 + vec3(2.3, 9.1, 4.4), h));
      if (a < 0.05) discard;
    }
    vec3 n = normalize(vN);
    vec3 v = normalize(vView);
    vec3 L = normalize(uLight);
    vec3 t = normalize(vT);
    float th = dot(t, normalize(L + v));
    float sheen = pow(sqrt(max(0.0, 1.0 - th * th)), 60.0);
    float rim = pow(1.0 - abs(dot(n, v)), 2.5);
    vec3 base = mix(uColor, uTip, pow(h, 1.4));
    // Keep the root-to-tip pigment and soft highlights, without self-darkening.
    vec3 col = base;
    col += vec3(0.08, 0.07, 0.04) * sheen * h;
    col += uTip * 0.18 * rim * h;
    gl_FragColor = vec4(col, a);
  }
`;

function furMat(len, density, combAmt, combUniform, color, tip) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uLen: { value: len },
      uShells: { value: SHELLS },
      uDensity: { value: density },
      uCombAmt: { value: combAmt },
      uColor: { value: color },
      uTip: { value: tip },
      uTime: U.uTime,
      uComb: combUniform,
      uLight: U.uLight,
    },
    vertexShader: FUR_VERT,
    fragmentShader: FUR_FRAG,
    // Write premultiplied RGB + accumulated alpha onto the transparent canvas.
    // The standalone version preserved destination alpha (opaque paper); here it is zero.
    alphaToCoverage: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
}

function prepFur(geo) {
  if (!geo.attributes.aRest) geo.setAttribute("aRest", geo.attributes.position.clone());
  return geo;
}

function fur(geo, mat) {
  const m = new THREE.InstancedMesh(prepFur(geo), mat, SHELLS);
  m.frustumCulled = false;
  return m;
}

const V = (r, g, b) => new THREE.Vector3(r, g, b);
const M = {
  body: furMat(0.06, 150, 0.25, U.uComb, V(0.98, 0.78, 0.34), V(1.0, 0.95, 0.72)),
  head: furMat(0.04, 170, 0.35, U.uCombHead, V(1.0, 0.81, 0.37), V(1.0, 0.96, 0.75)),
  wing: furMat(0.04, 170, 0.6, U.uComb, V(0.98, 0.78, 0.34), V(1.0, 0.95, 0.72)),
  leg: furMat(0.035, 160, 0.3, U.uComb, V(0.96, 0.76, 0.33), V(1.0, 0.94, 0.7)),
};

const SPHERE = prepFur(new THREE.SphereGeometry(1, 48, 32));
const CONE = prepFur(new THREE.ConeGeometry(1, 1, 20, 4));

function part(parent, geo, mat, pos, scale, rot) {
  const m = fur(geo, mat);
  m.position.set(...pos);
  m.scale.set(...scale);
  if (rot) m.rotation.set(...rot);
  parent.add(m);
  return m;
}

function anchor(parent, pos) {
  const o = new THREE.Object3D();
  o.position.set(...pos);
  parent.add(o);
  return o;
}

// a thin tube that narrows along a curve (butterfly antennae)
function taperedTube(curve, segs, r0, r1, sides = 5) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs, p = curve.getPointAt(u), r = lerp(r0, r1, u);
    const N = frames.normals[i], B = frames.binormals[i];
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      pos.push(p.x + (N.x * ca + B.x * sa) * r, p.y + (N.y * ca + B.y * sa) * r, p.z + (N.z * ca + B.z * sa) * r);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j, b = i * sides + ((j + 1) % sides), c = a + sides, d = b + sides;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

/* ------------------------------------------------------------------ the chick
   Chick-local space: +Z is forward. An egg-shaped body of down on two thin legs, a big round
   head on a short neck that can stretch, stubby wings, a tuft of a tail. */

const chick = new THREE.Group();
scene.add(chick);

const body = new THREE.Group();
chick.add(body);
// one long egg with the rear tipped slightly up carries the rump, so the profile has no steps
const bodyMesh = part(body, SPHERE, M.body, [0, 0, -0.01], [0.19, 0.18, 0.24], [0.12, 0, 0]);
const BODY_SCALE = bodyMesh.scale.clone();
part(body, SPHERE, M.body, [0, -0.045, 0.1], [0.15, 0.14, 0.13]);   // breast
part(body, SPHERE, M.body, [0, 0.07, -0.2], [0.06, 0.07, 0.06], [-0.9, 0, 0]); // tail tuft, barely past the body line

const wings = [1, -1].map((s) => {
  const pivot = new THREE.Group();
  // folded, the wing lies on the body's surface so its edge stands out of the down
  pivot.position.set(0.17 * s, 0.045, 0.04);
  body.add(pivot);
  part(pivot, SPHERE, M.wing, [0.02 * s, -0.035, -0.045], [0.035, 0.085, 0.125], [0.35, 0, 0]);
  return { pivot, s };
});

const neck = new THREE.Group();
neck.position.set(0, 0.1, 0.08);
body.add(neck);
part(neck, SPHERE, M.body, [0, 0.04, 0.015], [0.1, 0.11, 0.1]);
const head = new THREE.Group();
head.position.set(0, 0.12, 0.05);
neck.add(head);
part(head, SPHERE, M.head, [0, 0, 0], [0.13, 0.124, 0.128]);
part(head, SPHERE, M.head, [0.055, -0.035, 0.045], [0.06, 0.055, 0.06]);
part(head, SPHERE, M.head, [-0.055, -0.035, 0.045], [0.06, 0.055, 0.06]);

// beak: two little horn-coloured mandibles; the lower one drops for a peep
const beakMat = new THREE.MeshBasicMaterial({ color: 0xe9a648 });
const beakTipMat = new THREE.MeshBasicMaterial({ color: 0xc98a3a });
const upperGeo = new THREE.ConeGeometry(0.03, 0.07, 14).rotateX(Math.PI / 2).translate(0, 0, 0.035);
const lowerGeo = new THREE.ConeGeometry(0.022, 0.05, 14).rotateX(Math.PI / 2).translate(0, 0, 0.025);
const beakUpper = new THREE.Mesh(upperGeo, beakMat);
beakUpper.position.set(0, -0.012, 0.108);
beakUpper.scale.set(1, 0.72, 1);
const beakHinge = new THREE.Group();
beakHinge.position.set(0, -0.026, 0.108);
const beakLower = new THREE.Mesh(lowerGeo, beakTipMat);
beakLower.scale.set(1, 0.6, 1);
beakHinge.add(beakLower);
head.add(beakUpper, beakHinge);

// eyes: glossy black beads set to the sides, each with a catchlight
const eyeGeo = new THREE.SphereGeometry(1, 24, 16);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0b0b0c });
const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const EYE_R = 0.021;
const eyes = [1, -1].map((s) => {
  const holder = new THREE.Group();
  holder.position.set(0.08 * s, 0.024, 0.088);
  holder.rotation.y = 0.75 * s;
  const ball = new THREE.Mesh(eyeGeo, eyeMat);
  ball.scale.setScalar(EYE_R);
  const glint = new THREE.Mesh(eyeGeo, glintMat);
  glint.position.set(EYE_R * 0.25, EYE_R * 0.4, EYE_R * 0.85);
  glint.scale.setScalar(EYE_R * 0.24);
  holder.add(ball, glint);
  head.add(holder);
  return holder;
});

// legs: two-bone IK; the drumstick is down, the shank and toes are bare horn
const hipL = anchor(body, [0.065, -0.12, -0.01]);
const hipR = anchor(body, [-0.065, -0.12, -0.01]);
const TOE_Y = 0.012;
const DUTY = 0.58;
const skinMat = new THREE.MeshBasicMaterial({ color: 0xe7a04c });
const shankGeo = new THREE.CylinderGeometry(0.0105, 0.013, 0.13, 10);
const toeGeo = (len) => new THREE.CapsuleGeometry(0.0065, len, 3, 6).rotateX(Math.PI / 2).translate(0, 0, len / 2);
const TOES = [[-0.62, 0.062], [0, 0.074], [0.62, 0.062], [Math.PI, 0.034]];
const LEGS = [
  { anchor: hipL, x: 0.07, off: 0.0, side: 1 },
  { anchor: hipR, x: -0.07, off: 0.5, side: -1 },
].map((leg) => {
  leg.l1 = 0.1;
  leg.l2 = 0.13;
  leg.upper = fur(new THREE.CapsuleGeometry(0.04, 0.06, 6, 14), M.leg);
  leg.lower = new THREE.Mesh(shankGeo, skinMat);
  leg.foot3 = new THREE.Group();
  leg.toes = TOES.map(([yaw, len]) => {
    const pivot = new THREE.Group();
    pivot.rotation.y = yaw;
    const toe = new THREE.Mesh(toeGeo(len), skinMat);
    pivot.add(toe);
    leg.foot3.add(pivot);
    return { pivot, toe };
  });
  chick.add(leg.upper, leg.lower, leg.foot3);
  leg.a = new THREE.Vector3();
  leg.knee = new THREE.Vector3();
  leg.foot = new THREE.Vector3();
  leg.prevP = 0;
  return leg;
});

// soft ink-wash shadow under the body
const shadowTex = (() => {
  const c = makeCanvas(128);
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(0.45, "rgba(0,0,0,0.45)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({
  map: shadowTex, color: 0x3a3428, transparent: true, opacity: 0.4, depthWrite: false,
}));
shadow.renderOrder = -10;
scene.add(shadow);

/* ------------------------------------------------------------------ footprints that dissolve into a faint color trace
   Each track is stamped crisp, holds, then erodes from a noise front. The visible track and an
   emission pass share one function: whatever the front eats this frame is written into the
   trace buffer, so only a soft hint remains as the footprint fades. */

const PRINTS = 160;
const PRINT_HOLD = 2.4;
const PRINT_FADE = 2.0;
const printGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const printAge = new THREE.InstancedBufferAttribute(new Float32Array(PRINTS).fill(999), 1).setUsage(THREE.DynamicDrawUsage);
const printSeed = new THREE.InstancedBufferAttribute(new Float32Array(PRINTS), 1).setUsage(THREE.DynamicDrawUsage);
const printColor = new THREE.InstancedBufferAttribute(new Float32Array(PRINTS * 3), 3).setUsage(THREE.DynamicDrawUsage);
printGeo.setAttribute("aAge", printAge);
printGeo.setAttribute("aSeed", printSeed);
printGeo.setAttribute("aInk", printColor);
const printUniforms = {
  uTex: { value: trackTexture() },
  uHold: { value: PRINT_HOLD },
  uFade: { value: PRINT_FADE },
  uDt: { value: 0.016 },
};
const PRINT_VERT = /* glsl */ `
  attribute float aAge;
  attribute float aSeed;
  attribute vec3 aInk;
  varying vec2 vUv;
  varying vec3 vInk;
  varying float vAge, vSeed;
  void main() { vUv = uv; vAge = aAge; vSeed = aSeed; vInk = aInk; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }
`;
const PRINT_COMMON = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uHold, uFade, uDt;
  varying vec2 vUv;
  varying float vAge, vSeed;
  ${NOISE}
  // x: visible footprint, y: faint trace at its dissolving edge; z: dissolve progress
  vec3 printSample() {
    float k = clamp((vAge - uHold) / uFade, 0.0, 1.0);
    vec2 warp = vec2(vnoise(vUv * 6.0 + vSeed * 13.1), vnoise(vUv * 6.0 + vSeed * 7.7 + 3.1)) - 0.5;
    float m = texture2D(uTex, vUv + warp * k * 0.22).a;
    float n = vnoise(vUv * 7.0 + vSeed * 21.0) * 0.65 + vnoise(vUv * 17.0 + vSeed * 5.0) * 0.35;
    float front = k * 1.2 - 0.1;
    float keep = smoothstep(front - 0.04, front + 0.06, n);
    float band = (1.0 - smoothstep(0.0, 0.1, abs(n - front))) * step(0.001, k) * step(k, 0.999);
    return vec3(m * keep * smoothstep(0.0, 0.15, vAge), m * band, k);
  }
`;
const prints = new THREE.InstancedMesh(printGeo, new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  toneMapped: false,
  uniforms: printUniforms,
  vertexShader: PRINT_VERT,
  fragmentShader: /* glsl */ `
    ${PRINT_COMMON}
    varying vec3 vInk;
    void main() {
      vec3 s = printSample();
      float a = s.x * 0.90 * (1.0 - 0.65 * s.z);
      if (a < 0.003) discard;
      gl_FragColor = vec4(vInk, a);
      #include <colorspace_fragment>
    }
  `,
}), PRINTS);
prints.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
prints.frustumCulled = false;
prints.renderOrder = -5;
scene.add(prints);

const printsEmit = new THREE.InstancedMesh(printGeo, new THREE.ShaderMaterial({
  transparent: true,
  depthTest: false,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: printUniforms,
  vertexShader: PRINT_VERT,
  fragmentShader: /* glsl */ `
    ${PRINT_COMMON}
    void main() {
      float e = printSample().y * uDt * 1.6;
      if (e <= 0.0) discard;
      gl_FragColor = vec4(e * 0.25, e * 0.6, 0.0, 1.0);
    }
  `,
}), PRINTS);
printsEmit.instanceMatrix = prints.instanceMatrix;
printsEmit.frustumCulled = false;
const emitScene = new THREE.Scene();
emitScene.add(printsEmit);

const FOOTPRINT_SIZE = .085;
const FOOT_SPACING = Math.abs(LEGS[0].x - LEGS[1].x);
const textTracks = createTextTracks(scene, camera, {
  hold: PRINT_HOLD, fade: PRINT_FADE,
  glyphHeight: (FOOT_SPACING + FOOTPRINT_SIZE) * .64,
});
const textFootPosition = new THREE.Vector3();
let printHead = 0;
const _pm = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _pe = new THREE.Euler(), _ps = new THREE.Vector3(), _pp = new THREE.Vector3();

function stampPrint(worldPos, heading, side) {
  const printHeading = heading - side * .14 + (Math.random() - .5) * .15;
  // A letter spans both foot lanes instead of alternating between tiny left/right stamps.
  textFootPosition.set(
    worldPos.x - Math.cos(heading) * side * FOOT_SPACING / 2,
    .002,
    worldPos.z + Math.sin(heading) * side * FOOT_SPACING / 2,
  );
  if (textTracks.tryStamp(textFootPosition, heading, viewWidth, viewHeight)) return;
  const i = printHead;
  printHead = (printHead + 1) % PRINTS;
  _pe.set(0, printHeading, 0); // chicks toe in a little
  _pq.setFromEuler(_pe);
  _ps.setScalar(FOOTPRINT_SIZE);
  _pp.set(worldPos.x, 0.002, worldPos.z);
  _pm.compose(_pp, _pq, _ps);
  prints.setMatrixAt(i, _pm);
  prints.instanceMatrix.needsUpdate = true;
  printAge.array[i] = 0;
  printSeed.array[i] = Math.random() * 50;
  printSeed.needsUpdate = true;
  const ink = textTracks.colorAt(_pp, viewWidth, viewHeight);
  printColor.setXYZ(i, ink.r, ink.g, ink.b);
  printColor.needsUpdate = true;
}

/* ------------------------------------------------------------------ the butterfly (the cursor) */

const BF_H = 0.62;
const butterfly = new THREE.Group();
const bfInner = new THREE.Group();
const bfWings = (() => {
  const make = (tex, baseV) => {
    const geo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5 - baseV, 0).rotateX(Math.PI / 2);
    return [geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, depthWrite: false })];
  };
  const [fGeo, fMat] = make(wingTexture("fore"), 1 - 300 / 512);
  const [hGeo, hMat] = make(wingTexture("hind"), 1 - 70 / 512);
  const w = {
    foreR: new THREE.Mesh(fGeo, fMat), foreL: new THREE.Mesh(fGeo, fMat),
    hindR: new THREE.Mesh(hGeo, hMat), hindL: new THREE.Mesh(hGeo, hMat),
  };
  w.foreL.scale.x = -1;
  w.hindL.scale.x = -1;
  w.hindR.position.y = w.hindL.position.y = -0.005;
  bfInner.add(w.foreR, w.foreL, w.hindR, w.hindL);
  return w;
})();
{
  const bodyMat = new THREE.MeshBasicMaterial({ color: 0x141416 });
  const piece = (pos, scale) => {
    const m = new THREE.Mesh(eyeGeo, bodyMat);
    m.position.set(...pos);
    m.scale.set(...scale);
    bfInner.add(m);
  };
  piece([0, 0, 0.02], [0.045, 0.045, 0.09]);
  piece([0, -0.005, -0.2], [0.032, 0.03, 0.17]);
  piece([0, 0.005, 0.115], [0.036, 0.034, 0.036]);
  for (const s of [1, -1]) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.015 * s, 0.015, 0.14),
      new THREE.Vector3(0.05 * s, 0.07, 0.3),
      new THREE.Vector3(0.13 * s, 0.06, 0.46),
    );
    bfInner.add(new THREE.Mesh(taperedTube(curve, 14, 0.006, 0.003), bodyMat));
    piece([0.13 * s, 0.06, 0.46], [0.014, 0.014, 0.02]);
  }
}
bfInner.scale.setScalar(0.14);
bfInner.rotation.x = -0.2;
butterfly.add(bfInner);
butterfly.position.set(0.9, BF_H, 0.7);
scene.add(butterfly);

/* ------------------------------------------------------------------ pointer */

const ndc = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const bfPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BF_H);
const pointerTarget = new THREE.Vector3(0.9, BF_H, 0.7);
let pointerActive = false;
let lastPointerMove = -10;
let idleWandering = false;
const wanderOffset = new THREE.Vector2();
const butterflyFlight = createButterflyFlight();
let clickFlutter = 0;
const interactive = 'a, button, input, textarea, select, summary, iframe, dialog, [contenteditable], [role="button"], [data-sumi-control]';
function setPointer(e) {
  if (!running || e.isPrimary === false || e.pointerType === "touch") return;
  if (e.target?.closest?.('[data-sumi-control]')) return;
  aimAt(e);
}
function aimAt(e) {
  ndc.set((e.clientX / viewWidth) * 2 - 1, -(e.clientY / viewHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (raycaster.ray.intersectPlane(bfPlane, pointerTarget)) {
    pointerActive = true;
    lastPointerMove = performance.now() / 1000;
  }
}
const listenerOptions = { passive: true, signal: events.signal };
window.addEventListener("pointermove", setPointer, listenerOptions);
window.addEventListener("pointerdown", (e) => {
  // Observe page input without taking hit targets, preventing scrolling, or intercepting links.
  if (!running || e.isPrimary === false || e.button > 0 || e.target?.closest?.(interactive)) return;
  // The decorative hero video is page background; other videos keep their input isolation.
  const video = e.target?.closest?.('video');
  if (video && (video.controls || !video.matches('.hero .hero-video'))) return;
  aimAt(e);
  pollen.burst(butterfly.position, viewHeight);
  clickFlutter = reduceMotion ? 0 : 1;
  C.startle = 1;
  C.clickChase = true;
  C.clickHopPending = C.hopT < 0;
  C.pauseT = 0;
}, listenerOptions);
document.documentElement.addEventListener("pointerleave", () => { pointerActive = false; }, listenerOptions);
window.addEventListener("blur", () => { pointerActive = false; }, listenerOptions);

/* ------------------------------------------------------------------ behaviour
   A chick does not glide after things: it scurries in short bursts, stops dead to stare,
   then scurries again. Its head snaps from pose to pose instead of turning smoothly, and to
   look up it cocks its head so one eye faces the sky. In quiet moments it pecks the floor;
   left alone long enough it hunkers down into a ball. A butterfly right overhead gets a hop. */

const FOLLOW = 1.0;   // start scurrying when the butterfly's ground point is farther than this
const STOP = 0.55;    // stop when this close
const HOP_TIME = 0.48;
const PECK_TIME = 0.3;
const chaseRhythm = createChaseRhythm();

const C = {
  pos: new THREE.Vector3(0, 0, 0.1),
  heading: 0,
  speed: 0,
  move: 0,
  linShare: 1,
  phase: 0,
  cycleLen: 0.2,
  moving: false,
  turning: false,
  pauseT: 0,
  recovering: false,
  chaseBoost: 0,
  clickChase: false,
  clickHopPending: false,
  idleT: 0,
  settle: 0,
  peck: 0,
  peckT: -1,
  peckLeft: 0,
  nextPeck: 2.5,
  hopT: -1,
  hopCool: 1.5,
  hopY: 0,
  hopDir: 0,
  hopReach: 0,
  landed: 0,
  startle: 0,
  puff: 0,
  peep: 0,
  peepIn: 2,
  blink: 0,
  blinkIn: 2,
  yaw: 0, pitch: 0, roll: 0,
  gYaw: 0, gPitch: 0, gRoll: 0,
  snapIn: 0,
  wingFlap: 0,
  wingPhase: 0,
  stretch: 0,
  stretchIn: 7,
  bfNear: 9,
};

const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion();
const eLook = new THREE.Euler(0, 0, 0, "YXZ");
const UP = new THREE.Vector3(0, 1, 0);
const XAXIS = new THREE.Vector3(1, 0, 0);
const chickQInv = new THREE.Quaternion();

// keep the spot the chick runs to inside the visible frame, whatever the window shape
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _ndc = new THREE.Vector2();
const goalPt = new THREE.Vector3();
function goalInView(x, z) {
  v3.set(x, 0, z).project(camera);
  const cx = clamp(v3.x, -0.8, 0.8), cy = clamp(v3.y, -0.7, 0.5);
  goalPt.set(x, 0, z);
  if (cx !== v3.x || cy !== v3.y) {
    raycaster.setFromCamera(_ndc.set(cx, cy), camera);
    raycaster.ray.intersectPlane(groundPlane, goalPt);
  }
  return goalPt;
}

const easeOut = (x) => 1 - (1 - x) * (1 - x);
const easeInOut = (x) => x * x * (3 - 2 * x);

function updateBehaviour(dt) {
  const goal = goalInView(butterfly.position.x, butterfly.position.z);
  const dx = goal.x - C.pos.x, dz = goal.z - C.pos.z;
  const dist = Math.hypot(dx, dz);
  const bearing = wrap(Math.atan2(dx, dz) - C.heading);
  C.bfNear = Math.hypot(butterfly.position.x - C.pos.x, butterfly.position.z - C.pos.z);
  v3.set(C.pos.x, .35 + C.hopY, C.pos.z).project(camera);
  const outside = Math.abs(v3.x) > 1 || Math.abs(v3.y) > 1 || Math.abs(v3.z) > 1;
  // Stay in recovery until comfortably inside; crossing the edge must not chatter.
  C.recovering = outside || (C.recovering && (Math.abs(v3.x) > .84 || Math.abs(v3.y) > .84));
  C.chaseBoost = damp(C.chaseBoost, C.recovering ? 1 : 0, C.recovering ? 12 : 7, dt);
  if (C.recovering) {
    C.settle = 0;
    C.peckT = -1;
    C.peck = 0;
    C.clickHopPending = false;
    if (C.hopT >= 0) { C.hopT = -1; C.hopY = 0; C.landed = 1; }
  }
  const hopping = C.hopT >= 0;
  const urgency = chaseUrgency(C.bfNear);
  // a fluttering butterfly invites a hop; one that has gone still is soon ignored for the floor
  const bfFluttering = !pointerActive || idleWandering || performance.now() / 1000 - lastPointerMove < 1.5;

  // Irregular curiosity pauses nearby; longer uninterrupted runs at a distance.
  const followDistance = idleWandering ? 1.35 : FOLLOW;
  const stopDistance = idleWandering ? .85 : STOP;
  // A click owns one hop-and-catch-up run; release only after landing near the target.
  if (C.clickChase && !hopping && !C.clickHopPending && dist <= stopDistance + .25) C.clickChase = false;
  const pursuitBoost = C.clickChase ? 1 : C.chaseBoost;
  if (C.clickChase) { C.settle = 0; C.peckT = -1; C.peck = 0; }
  if (!C.moving && dist > followDistance) C.moving = true;
  if (C.clickChase && dist > stopDistance) C.moving = true;
  if (C.moving && dist < stopDistance) C.moving = false;
  C.pauseT = chaseRhythm.update(dt, C.bfNear, C.moving, C.recovering || C.clickChase);
  if (C.moving) {
    C.turning = false;
  } else {
    C.pauseT = 0;
    if (!C.turning && Math.abs(bearing) > 1.3 && dist > 0.3) C.turning = true;
    if (C.turning && Math.abs(bearing) < 0.25) C.turning = false;
  }
  const running = C.moving && C.pauseT <= 0;
  const active = C.moving || C.turning || hopping;
  C.idleT = active || C.startle > 0.5 ? 0 : C.idleT + dt;

  // hunker down after a long quiet spell; the butterfly coming close or a click wakes it
  const settleTarget = C.idleT > 7 && C.bfNear > 0.7 ? 1 : 0;
  const wasDown = C.settle > 0.5;
  C.settle = damp(C.settle, settleTarget, settleTarget ? 1.6 : 7, dt);
  if (C.settle > 0.5 !== wasDown) C.puff = 1;
  const canMove = C.settle < 0.15 && !hopping && !C.clickHopPending;

  let desired = 0;
  if (running && canMove) {
    const limit = chaseSpeedLimit(dist, urgency, pursuitBoost);
    const remaining = Math.max(0, dist - stopDistance);
    const arrivalSpeed = Math.min(remaining * 2.2 + .35, Math.sqrt(40 * remaining));
    desired = Math.min(limit, arrivalSpeed) * clamp(1.2 - Math.abs(bearing) / 1.5, 0, 1);
  }
  // Ease into a run, but stop promptly enough for a short hesitation to read.
  const response = C.pauseT > 0 ? 22 : desired > C.speed ? 5 : 11;
  C.speed = damp(C.speed, desired, response + pursuitBoost * 6, dt);

  let turn = 0;
  if ((C.moving || C.turning) && canMove) {
    const turnRate = 5 + pursuitBoost * 5;
    turn = clamp(bearing * (8 + pursuitBoost * 6) * dt, -turnRate * dt, turnRate * dt);
  }
  C.heading = wrap(C.heading + turn);
  const forwardAlignment = Math.max(0, Math.cos(wrap(Math.atan2(dx, dz) - C.heading)));
  const travel = Math.min(C.speed * dt * forwardAlignment, Math.max(0, dist - stopDistance * .7));
  C.pos.x += Math.sin(C.heading) * travel;
  C.pos.z += Math.cos(C.heading) * travel;

  // a hop at a butterfly just overhead, or a startled hop on the spot
  C.hopCool -= dt;
  if (!hopping && !C.recovering && C.settle < 0.1) {
    if (C.clickHopPending) {
      C.hopT = 0;
      C.hopDir = C.heading;
      C.hopReach = 0;
      C.hopCool = Math.max(C.hopCool, 1.5);
      C.clickHopPending = false;
    } else if (!C.moving && C.hopCool <= 0 && C.bfNear < 0.6 && bfFluttering) {
      C.hopT = 0;
      C.hopCool = R(2.5, 5);
      C.hopDir = Math.atan2(butterfly.position.x - C.pos.x, butterfly.position.z - C.pos.z);
      C.hopReach = Math.min(C.bfNear, 0.22);
    } else if (C.startle > 0.95) {
      C.hopT = 0;
      C.hopDir = C.heading;
      C.hopReach = 0;
    }
  }
  if (C.hopT >= 0) {
    C.hopT += dt;
    const s = C.hopT / HOP_TIME;
    if (s >= 1) {
      C.hopT = -1;
      C.hopY = 0;
      C.landed = 1;
    } else {
      C.hopY = 0.13 * Math.sin(Math.PI * s);
      const step = (C.hopReach * dt) / HOP_TIME;
      C.pos.x += Math.sin(C.hopDir) * step;
      C.pos.z += Math.cos(C.hopDir) * step;
      C.heading = wrap(C.heading + wrap(C.hopDir - C.heading) * Math.min(1, dt * 10));
    }
  }
  if (C.startle > 0.5 && C.settle > 0.3) C.settle = 0.3;
  C.startle = Math.max(0, C.startle - dt * 3);

  // gait: tiny quick steps; phase advances with distance and with turning on the spot
  const turnStep = (Math.abs(turn) / Math.max(dt, 1e-4)) * 0.1;
  const gaitSpeed = Math.min(C.speed, 4.8);
  const adv = gaitSpeed + turnStep;
  C.linShare = adv > 1e-4 ? gaitSpeed / adv : 1;
  C.move = damp(C.move, Math.min(1, adv / 0.25), 10, dt);
  C.cycleLen = Math.min(0.14 + gaitSpeed * 0.07, 0.36);
  C.phase += (adv * dt) / C.cycleLen;

  // pecking at the floor in quiet moments, a few quick jabs at a time
  const quiet = !active && C.settle < 0.1;
  if (!quiet) C.peckT = -1;
  if (C.peckT >= 0) {
    C.peckT += dt;
    if (C.peckT > PECK_TIME) {
      C.peckLeft--;
      C.peckT = C.peckLeft > 0 ? 0 : -1;
    }
  } else if (quiet) {
    C.nextPeck -= dt;
    if (C.nextPeck < 0 && (C.bfNear > 0.8 || !bfFluttering)) {
      C.peckLeft = 1 + Math.floor(Math.random() * 3);
      C.peckT = 0;
      C.nextPeck = R(2.5, 6);
    }
  }
  if (C.peckT >= 0) {
    const s = C.peckT / PECK_TIME;
    C.peck = s < 0.3 ? easeOut(s / 0.3) : s < 0.45 ? 1 : 1 - easeInOut((s - 0.45) / 0.55);
  } else C.peck = damp(C.peck, 0, 14, dt);

  // wings: flutter for balance at a run, beat hard in a hop, a lazy stretch now and then
  C.stretchIn -= dt;
  if (C.stretchIn < 0 && quiet) { C.stretch = 1; C.stretchIn = R(6, 12); }
  C.stretch = Math.max(0, C.stretch - dt * 0.9);
  const flapTarget = hopping ? 1 : running ? smoothstep(C.speed, 0.7, 1.4) * 0.55 : 0;
  C.wingFlap = damp(C.wingFlap, flapTarget, 10, dt);
  C.wingPhase += dt * (hopping ? 42 : 30);

  C.peepIn -= dt;
  if (C.peepIn < 0) { C.peep = 1; C.peepIn = running ? R(0.5, 1.2) : R(1.5, 4.5); }
  C.peep = Math.max(0, C.peep - dt * 6);
  C.blinkIn -= dt;
  if (C.blinkIn < 0) { C.blink = 1; C.blinkIn = R(1.8, 5); }
  C.blink = Math.max(0, C.blink - dt * 8);
  C.puff = Math.max(0, C.puff - dt * 1.4);

  let label = "갸웃 바라보는 중";
  if (hopping) label = "폴짝!";
  else if (running) label = C.speed > 1.1 ? "종종종 쫓아가는 중" : "종종 쫓아가는 중";
  else if (C.moving) label = "멈칫, 두리번";
  else if (C.turning) label = "돌아보는 중";
  else if (C.settle > 0.6) label = "웅크려 쉬는 중";
  else if (C.peckT >= 0) label = "콕콕 쪼는 중";
  if (activity !== label) { activity = label; onActivity(label); }
}

function solveLeg(leg) {
  const { a, foot, knee } = leg;
  v1.subVectors(foot, a);
  const reach = leg.l1 + leg.l2 - 1e-4;
  const d = clamp(v1.length(), 0.02, reach);
  v1.normalize();
  const cosA = clamp((leg.l1 * leg.l1 + d * d - leg.l2 * leg.l2) / (2 * leg.l1 * d), -1, 1);
  const ang = Math.acos(cosA);
  v2.crossVectors(v1, XAXIS).normalize();
  // a bird's visible "knee" is its ankle, and it points backward
  knee.copy(a).addScaledVector(v1, Math.cos(ang) * leg.l1).addScaledVector(v2, -Math.sin(ang) * leg.l1);
  foot.copy(a).addScaledVector(v1, d);
}

function placeBetween(mesh, from, to) {
  mesh.position.lerpVectors(from, to, 0.5);
  v3.subVectors(to, from).normalize();
  mesh.quaternion.setFromUnitVectors(UP, v3);
}

function updatePose(dt, t) {
  const settle = smoothstep(C.settle, 0, 1);
  const step = C.phase * Math.PI * 2;
  const breathe = Math.sin(t * 3.4) * 0.004;
  const hopS = C.hopT >= 0 ? C.hopT / HOP_TIME : 0;

  chick.position.set(C.pos.x, 0, C.pos.z);
  chick.rotation.y = C.heading;
  body.position.set(0, lerp(0.32, 0.17, settle) + C.hopY - Math.abs(Math.sin(step)) * 0.014 * C.move + breathe, 0);
  body.rotation.set(
    lerp(-0.06, 0.04, settle) + Math.min(C.speed * 0.14, .52) - Math.sin(Math.PI * hopS) * 0.15,
    0,
    Math.sin(step) * 0.07 * C.move,
  );
  // fluffs up and shakes when settling or rising
  const puff = Math.sin(Math.min(C.puff, 1) * Math.PI);
  bodyMesh.scale.copy(BODY_SCALE).multiplyScalar(1 + puff * 0.07 + Math.sin(t * 3.4) * 0.01);

  // head-bob: while walking the head holds still in the world, then thrusts forward
  const bobAmp = Math.min(0.035, C.cycleLen * 0.25) * C.move;
  const sb = (C.phase * 2) % 1;
  const bob = sb < 0.7 ? bobAmp * (0.5 - sb / 0.7) : bobAmp * (-0.5 + (sb - 0.7) / 0.3);
  neck.position.set(0, 0.1 + Math.max(0, C.pitch) * 0.035 + Math.sin(Math.PI * hopS) * 0.02, 0.08 + bob + C.peck * 0.05);
  neck.rotation.set(C.peck * 0.95, C.yaw * 0.25, 0);
  chick.updateMatrixWorld(true);

  // the gaze snaps from pose to pose; to look up, the head cocks so one eye faces the butterfly
  head.getWorldPosition(v1);
  v2.subVectors(butterfly.position, v1);
  chickQInv.copy(chick.quaternion).invert();
  v2.applyQuaternion(chickQInv);
  const rawYaw = clamp(Math.atan2(v2.x, v2.z), -1.8, 1.8);
  const rawPitch = clamp(Math.atan2(v2.y, Math.hypot(v2.x, v2.z)), -0.9, 1.1);
  const cock = rawPitch > 0.3 ? Math.min(0.75, (rawPitch - 0.3) * 1.5) : 0;
  C.snapIn -= dt;
  if (C.snapIn <= 0 || Math.abs(rawYaw - C.gYaw) > 0.7) {
    const sideSign = Math.abs(rawYaw) > 0.1 ? Math.sign(rawYaw) : C.gRoll >= 0 ? 1 : -1;
    C.gYaw = rawYaw + R(-0.06, 0.06);
    C.gPitch = rawPitch * (1 - cock * 0.5);
    C.gRoll = sideSign * cock + R(-0.12, 0.12);
    C.snapIn = C.moving ? R(0.08, 0.18) : R(0.18, 0.5);
  }
  C.yaw = damp(C.yaw, C.gYaw, 30, dt);
  C.pitch = damp(C.pitch, C.gPitch, 26, dt);
  C.roll = damp(C.roll, C.gRoll, 26, dt);
  const shake = Math.sin(C.puff * 34) * 0.35 * C.puff;
  eLook.set(-lerp(C.pitch, -1.3, C.peck), lerp(C.yaw, C.yaw * 0.3, C.peck), lerp(C.roll, 0, C.peck) + shake, "YXZ");
  q1.setFromEuler(eLook).premultiply(chick.quaternion);
  neck.getWorldQuaternion(q2).invert();
  head.quaternion.copy(q2.multiply(q1));
  head.updateMatrixWorld(true);
  head.getWorldQuaternion(q3);
  U.uCombHead.value.set(0, -0.3, -1).applyQuaternion(q3).normalize().multiplyScalar(0.6);

  beakHinge.rotation.x = Math.sin(Math.min(C.peep, 1) * Math.PI) * 0.5;
  const lid = 1 - Math.sin(Math.min(C.blink, 1) * Math.PI) * 0.9;
  for (const e of eyes) e.scale.set(1, lid, 1);

  for (const w of wings) {
    const fold = (1 - settle) * 0.08;
    const flap = C.wingFlap * (0.55 + 0.65 * Math.sin(C.wingPhase));
    const stretch = Math.sin(C.stretch * Math.PI) * 0.9;
    w.pivot.rotation.set(-stretch * 0.25, 0, w.s * (fold + flap + stretch));
  }

  // legs
  const amp = DUTY * C.cycleLen * C.linShare * C.move;
  const lift = 0.045 * Math.min(1, (C.speed + 0.15) / 0.4) * C.move;
  const legsShown = settle < 0.8;
  for (const leg of LEGS) {
    leg.upper.visible = leg.lower.visible = leg.foot3.visible = legsShown;
    leg.anchor.getWorldPosition(leg.a);
    chick.worldToLocal(leg.a);
    const p = (((C.phase + leg.off) % 1) + 1) % 1;
    let z, y, curl;
    if (p < DUTY) {
      z = amp * (0.5 - p / DUTY);
      y = 0;
      curl = 0;
    } else {
      const s = (p - DUTY) / (1 - DUTY);
      z = amp * (-0.5 + s * s * (3 - 2 * s));
      y = lift * Math.sin(Math.PI * s);
      curl = Math.sin(Math.PI * s) * C.move;
    }
    if (C.hopT >= 0) { y = C.hopY * 0.8; curl = Math.sin(Math.PI * hopS); }
    leg.foot.set(leg.x, TOE_Y + y, leg.a.z + 0.01 + z);
    if (p < leg.prevP && C.speed > 0.15 && C.hopT < 0) {
      v3.copy(leg.foot);
      chick.localToWorld(v3);
      stampPrint(v3, C.heading, leg.side);
    }
    leg.prevP = p;
    solveLeg(leg);
    placeBetween(leg.upper, leg.a, leg.knee);
    placeBetween(leg.lower, leg.knee, leg.foot);
    leg.foot3.position.copy(leg.foot);
    leg.foot3.position.y -= TOE_Y * 0.4;
    for (const toe of leg.toes) toe.pivot.rotation.x = curl * 0.7;
  }
  if (C.landed) {
    for (const leg of LEGS) {
      v3.copy(leg.foot);
      chick.localToWorld(v3);
      stampPrint(v3, C.heading, leg.side);
    }
  }

  body.getWorldPosition(v1);
  shadow.position.set(v1.x, 0.0015, v1.z);
  shadow.rotation.y = C.heading;
  const sh = 1 - C.hopY * 2.5;
  shadow.scale.set(0.5 * sh, 1, 0.58 * sh);
}

/* ------------------------------------------------------------------ butterfly motion */

const bfPrev = new THREE.Vector3().copy(butterfly.position);
const bfVel = new THREE.Vector3();
let bfYaw = 0;
let flapPhase = 0;

function updateButterfly(dt, t) {
  const shouldWander = pointerActive && performance.now() / 1000 - lastPointerMove >= 7;
  const cursorX = (ndc.x + 1) * viewWidth / 2;
  const cursorY = (1 - ndc.y) * viewHeight / 2;
  if (shouldWander) {
    if (!idleWandering) butterflyFlight.reset();
    v3.set(C.pos.x, BF_H, C.pos.z).project(camera);
    const offset = butterflyFlight.update(dt, {
      minX: 12 - cursorX, maxX: viewWidth - 12 - cursorX,
      minY: 12 - cursorY, maxY: viewHeight - 12 - cursorY,
      avoidX: (v3.x + 1) * viewWidth / 2 - cursorX,
      avoidY: (1 - v3.y) * viewHeight / 2 - cursorY,
    });
    wanderOffset.set(offset.x, offset.y);
  } else {
    wanderOffset.set(0, 0);
  }
  idleWandering = shouldWander;
  if (!pointerActive) {
    // until someone moves the cursor, it wanders around the middle of the frame
    _ndc.set(Math.sin(t * 0.31) * 0.55 + Math.sin(t * 0.83) * 0.1, Math.cos(t * 0.23) * 0.35 - 0.05);
    raycaster.setFromCamera(_ndc, camera);
    raycaster.ray.intersectPlane(bfPlane, pointerTarget);
  } else {
    // A stationary cursor still points at a new ground location after scrolling.
    const x = clamp(cursorX + wanderOffset.x, 4, viewWidth - 4);
    const y = clamp(cursorY + wanderOffset.y, 4, viewHeight - 4);
    _ndc.set(x / viewWidth * 2 - 1, 1 - y / viewHeight * 2);
    raycaster.setFromCamera(_ndc, camera);
    raycaster.ray.intersectPlane(bfPlane, pointerTarget);
  }
  const k = pointerActive && !idleWandering ? 16 : 2.2;
  butterfly.position.x = damp(butterfly.position.x, pointerTarget.x, k, dt);
  butterfly.position.z = damp(butterfly.position.z, pointerTarget.z, k, dt);
  butterfly.position.y = BF_H;
  bfVel.subVectors(butterfly.position, bfPrev).divideScalar(Math.max(dt, 1e-4));
  bfPrev.copy(butterfly.position);
  const sp = Math.hypot(bfVel.x, bfVel.z);
  const previousYaw = bfYaw;
  // The antennae point along local +Z. Even a slow turn must follow velocity;
  // an unrelated idle yaw caused the butterfly to keep flying tail-first.
  if (sp > .001) {
    const heading = Math.atan2(bfVel.x, bfVel.z);
    bfYaw = wrap(bfYaw + wrap(heading - bfYaw) * (1 - Math.exp(-18 * dt)));
  }
  butterfly.rotation.y = bfYaw;
  const yawRate = dt > 0 ? wrap(bfYaw - previousYaw) / dt : 0;
  butterfly.rotation.z = damp(butterfly.rotation.z, clamp(-yawRate * .09, -.22, .22), 6, dt);

  const resting = pointerActive && !idleWandering && performance.now() / 1000 - lastPointerMove > 1.2;
  clickFlutter = Math.max(0, clickFlutter - dt / .28);
  flapPhase += ((resting ? 9 : 24 + Math.min(sp / 3, 3) * 6) + clickFlutter * 26) * dt;
  const s1 = 0.5 + 0.5 * Math.sin(flapPhase);
  const s2 = 0.5 + 0.5 * Math.sin(flapPhase - 0.45);
  const lo = resting ? 0.5 : 0.05, span = resting ? 0.75 : 1.25;
  const fore = lo + span * Math.pow(s1, 0.7);
  const hind = lo + span * 0.92 * Math.pow(s2, 0.7);
  bfWings.foreR.rotation.z = fore;
  bfWings.foreL.rotation.z = -fore;
  bfWings.hindR.rotation.z = hind;
  bfWings.hindL.rotation.z = -hind;
  bfInner.position.y = Math.sin(t * 5.3) * 0.015 - s1 * 0.01;
  return sp;
}

/* ------------------------------------------------------------------ restrained interaction traces */

const splats = simMat.uniforms.uSplat.value;
let splatCount = 0;
function splat(world, radius, amount) {
  if (splatCount >= MAX_SPLATS || amount <= 0) return;
  v3.copy(world).project(camera);
  if (v3.z > 1) return;
  splats[splatCount++].set(v3.x * 0.5 + 0.5, v3.y * 0.5 + 0.5, radius, amount);
}

function emitInk(dt, bfSpeed) {
  splatCount = 0;
  if (C.landed) {
    // A landing leaves a small, low-opacity warm glint.
    v1.set(C.pos.x, 0.02, C.pos.z);
    splat(v1, 0.007, 0.12);
    C.landed = 0;
  }
  splat(butterfly.position, 0.004, Math.min(bfSpeed, 6) * 0.018 * dt);
  simMat.uniforms.uSplatCount.value = splatCount;
}

/* ------------------------------------------------------------------ loop */

function resize() {
  viewWidth = Math.max(1, canvas.clientWidth || window.innerWidth);
  viewHeight = Math.max(1, canvas.clientHeight || window.innerHeight);
  const mobile = matchMedia("(pointer: coarse)").matches;
  const pixelBudget = mobile ? 1100000 : 2400000;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(pixelBudget / (viewWidth * viewHeight))));
  renderer.setSize(viewWidth, viewHeight, false);
  pageCamera.resize(viewWidth, viewHeight);
  const aspect = viewWidth / viewHeight;
  const simScale = Math.min(0.5, 960 / Math.max(viewWidth, viewHeight));
  rtA.setSize(Math.max(2, Math.round(viewWidth * simScale)), Math.max(2, Math.round(viewHeight * simScale)));
  rtB.setSize(rtA.width, rtA.height);
  simMat.uniforms.uAspect.value = aspect;
  // Avoid uninitialized feedback pixels after a resize.
  for (const target of [rtA, rtB]) { renderer.setRenderTarget(target); renderer.clear(); }
  renderer.setRenderTarget(null);
  inkScrollY = window.scrollY;
  pointerActive = false;
}
window.addEventListener("resize", resize, listenerOptions);
resize();

const simSpeed = reduceMotion ? 0.35 : 1;
let lastFrame = null, elapsed = 0;
const frameInterval = matchMedia("(pointer: coarse)").matches ? 1000 / 30 : 1000 / 60;
function animate(now) {
  if (lastFrame !== null && now - lastFrame < frameInterval - 1) return;
  const dt = lastFrame === null ? 1 / 60 : Math.min((now - lastFrame) / 1000, 1 / 20);
  lastFrame = now;
  elapsed += dt;
  frame(dt, elapsed);
}
function setActive(active) {
  running = Boolean(active) && !disposed;
  lastFrame = null;
  if (!running) { pollen.clear(); clickFlutter = 0; }
  canvas.hidden = !running;
  renderer.setAnimationLoop(running ? animate : null);
  if (!running) pointerActive = false;
}

function frame(dt, t) {
  const scrollY = window.scrollY;
  const groundDelta = pageCamera.scrollTo(scrollY);
  // The butterfly acts as the cursor, so it stays in viewport coordinates.
  // Chick, contact shadow and stamped footprints stay at their document positions.
  butterfly.position.z += groundDelta;
  bfPrev.z += groundDelta;
  simMat.uniforms.uScrollDelta.value = (scrollY - inkScrollY) / viewHeight;
  inkScrollY = scrollY;
  U.uTime.value = t;
  U.uComb.value.set(-Math.sin(C.heading) * 0.4, -0.35, -Math.cos(C.heading) * 0.4);

  const bfSpeed = updateButterfly(dt, t);
  pollen.update(dt, renderer.getPixelRatio());
  updateBehaviour(dt);
  textTracks.update(dt);
  updatePose(dt, t);

  for (let i = 0; i < PRINTS; i++) printAge.array[i] += dt;
  printAge.needsUpdate = true;

  emitInk(dt, bfSpeed);
  simMat.uniforms.uPrev.value = rtA.texture;
  simMat.uniforms.uTime.value = t * simSpeed;
  simMat.uniforms.uDt.value = dt * simSpeed;
  renderer.setRenderTarget(rtB);
  renderer.render(simScene, simCam);
  // Dissolving footprints contribute only a faint olive trace.
  printUniforms.uDt.value = dt;
  renderer.autoClear = false;
  renderer.render(emitScene, camera);
  renderer.autoClear = true;
  [rtA, rtB] = [rtB, rtA];

  bgMat.uniforms.uInk.value = rtA.texture;
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
}

// Render once while hidden so the first visible frame already has a valid alpha channel.
frame(0, 0);
return {
  setActive,
  dispose() {
    if (disposed) return;
    setActive(false);
    disposed = true;
    events.abort();
    textTracks.dispose();
    pollen.dispose();
    const resources = new Set();
    for (const root of [scene, simScene, emitScene]) root.traverse(object => {
      if (object.geometry) resources.add(object.geometry);
      const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
      for (const material of materials) {
        resources.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
        for (const uniform of Object.values(material.uniforms || {})) if (uniform.value?.isTexture) resources.add(uniform.value);
      }
    });
    resources.delete(rtA.texture); resources.delete(rtB.texture);
    for (const resource of resources) resource.dispose();
    rtA.dispose(); rtB.dispose();
    renderer.dispose();
  },
};
}
