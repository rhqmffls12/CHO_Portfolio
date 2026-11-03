import * as THREE from './assets/vendor/three-r186/three.module.min.js';

// A bounded, one-draw-call burst. No textures, timers or per-click GPU allocations.
export function createButterflyPollen(scene, camera, { reducedMotion = false } = {}) {
  const capacity = 120;
  const position = new THREE.Float32BufferAttribute(new Float32Array(capacity * 3), 3);
  const color = new THREE.Float32BufferAttribute(new Float32Array(capacity * 3), 3);
  const alpha = new THREE.Float32BufferAttribute(new Float32Array(capacity), 1);
  const size = new THREE.Float32BufferAttribute(new Float32Array(capacity), 1);
  for (const attribute of [position, color, alpha, size]) attribute.setUsage(THREE.DynamicDrawUsage);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', position);
  geometry.setAttribute('color', color);
  geometry.setAttribute('aAlpha', alpha);
  geometry.setAttribute('aSize', size);
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { uPixelRatio: { value: 1 } },
    vertexShader: `
      attribute vec3 color;
      attribute float aAlpha;
      attribute float aSize;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = color; vAlpha = aAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.0, aSize * uPixelRatio);
      }`,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float radius = length((gl_PointCoord - .5) * 2.0);
        float coverage = 1.0 - smoothstep(.48, 1.0, radius);
        if (coverage * vAlpha < .005) discard;
        gl_FragColor = vec4(vColor, coverage * vAlpha);
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'butterfly-click-pollen';
  points.frustumCulled = false;
  points.visible = false;
  scene.add(points);
  const palette = ['#E5BE6B', '#DDA988', '#C4CF83', '#FFF0CB'].map(hex => new THREE.Color(hex));
  const particles = Array.from({ length: capacity }, () => ({
    active: false, origin: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(),
    age: 0, life: 1, angle: 0, radius: 0, phase: 0, scale: 0, size: 0,
  }));
  const right = new THREE.Vector3(), up = new THREE.Vector3();
  let cursor = 0;

  function burst(origin, viewportHeight) {
    camera.updateMatrixWorld();
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    const scale = (camera.top - camera.bottom) / (camera.zoom * Math.max(1, viewportHeight));
    const count = reducedMotion ? 10 : 28;
    for (let i = 0; i < count; i++) {
      const index = cursor++ % capacity;
      const p = particles[index];
      p.active = true;
      p.origin.copy(origin);
      p.right.copy(right); p.up.copy(up);
      // Two tiny wingbeat pulses, with an immediate first response.
      p.age = i < count / 2 ? 0 : -.075;
      p.life = reducedMotion ? .55 : .72 + Math.random() * .38;
      p.angle = i / count * Math.PI * 2 + (Math.random() - .5) * .35;
      p.radius = (18 + Math.random() * 23) * (reducedMotion ? .5 : 1);
      p.phase = Math.random() * Math.PI * 2;
      p.scale = scale;
      p.size = 2.2 + Math.random() * 2.2;
      color.setXYZ(index, ...palette[i % palette.length].toArray());
      alpha.setX(index, 0);
      position.setXYZ(index, origin.x, origin.y, origin.z);
    }
    color.needsUpdate = true;
    points.visible = true;
  }

  function update(dt, pixelRatio) {
    let alive = false;
    material.uniforms.uPixelRatio.value = pixelRatio;
    for (let i = 0; i < capacity; i++) {
      const p = particles[i];
      if (!p.active) continue;
      p.age += dt;
      if (p.age >= p.life) { p.active = false; alpha.setX(i, 0); continue; }
      alive = true;
      if (p.age < 0) { alpha.setX(i, 0); continue; }
      const progress = p.age / p.life;
      const spread = 1 - Math.exp(-p.age * 7.5);
      const flutter = Math.sin(p.age * 10 + p.phase) - Math.sin(p.phase);
      const x = (Math.cos(p.angle) * p.radius * spread + flutter * 1.8 * progress) * p.scale;
      const y = (Math.sin(p.angle) * p.radius * .72 * spread + 12 * p.age - 16 * p.age * p.age) * p.scale;
      position.setXYZ(i,
        p.origin.x + p.right.x * x + p.up.x * y,
        p.origin.y + p.right.y * x + p.up.y * y,
        p.origin.z + p.right.z * x + p.up.z * y);
      const fade = 1 - THREE.MathUtils.smoothstep(progress, .18, 1);
      alpha.setX(i, .76 * Math.min(1, p.age / .035) * fade);
      size.setX(i, p.size * (1 - .3 * progress));
    }
    points.visible = alive;
    position.needsUpdate = alpha.needsUpdate = size.needsUpdate = true;
  }

  function clear() {
    for (const p of particles) p.active = false;
    alpha.array.fill(0); alpha.needsUpdate = true;
    points.visible = false;
  }
  return { burst, update, clear, dispose() { scene.remove(points); geometry.dispose(); material.dispose(); } };
}
