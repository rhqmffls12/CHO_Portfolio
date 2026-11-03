const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// Continuous forward flight with changing curvature, not stops at random points.
export function createButterflyFlight(random = Math.random) {
  const range = (a, b) => a + random() * (b - a);
  let x = 0, y = 0, heading = 0, turn = 0, turnTarget = 0;
  let speed = 0, speedTarget = 135, timer = 0;
  return {
    reset() {
      x = y = speed = turn = timer = 0;
      heading = range(-Math.PI, Math.PI);
      turnTarget = 0;
    },
    update(dt, bounds) {
      // Small integration steps keep boundary steering consistent at 30/60fps.
      const steps = Math.max(1, Math.ceil(dt * 120));
      const step = dt / steps;
      for (let i = 0; i < steps; i++) {
        timer -= step;
        if (timer <= 0) {
          timer = range(1.1, 2.6);
          turnTarget = range(-1.45, 1.45);
          speedTarget = range(125, 155);
        }
        const distance = Math.hypot(x, y);
        const rim = smooth((distance - 150) / 70);
        let inwardX = distance > 0 ? -x / distance * rim : 0;
        let inwardY = distance > 0 ? -y / distance * rim : 0;
        inwardX += smooth((bounds.minX + 85 - x) / 75) - smooth((x - bounds.maxX + 85) / 75);
        inwardY += smooth((bounds.minY + 85 - y) / 75) - smooth((y - bounds.maxY + 85) / 75);
        const awayX = x - bounds.avoidX, awayY = y - bounds.avoidY;
        const separation = Math.hypot(awayX, awayY);
        const avoidance = Number.isFinite(separation) ? smooth((135 - separation) / 75) : 0;
        if (separation > .001) {
          inwardX += awayX / separation * avoidance * 1.5;
          inwardY += awayY / separation * avoidance * 1.5;
        }
        const influence = clamp(Math.hypot(inwardX, inwardY), 0, 1);
        const error = wrap(Math.atan2(inwardY, inwardX) - heading);
        const inwardTurn = clamp(error * 3.5, -3.4, 3.4);
        const desiredTurn = turnTarget * (1 - influence) + inwardTurn * influence;
        turn = damp(turn, desiredTurn, 2.5 + influence * 6, step);
        heading = wrap(heading + turn * step);
        speed = damp(speed, speedTarget + avoidance * 20, 2.5, step);
        x += Math.cos(heading) * speed * step;
        y += Math.sin(heading) * speed * step;
        // Safety envelope for tiny viewports or a resize during flight.
        const radius = Math.hypot(x, y);
        if (radius > 294) { x *= 294 / radius; y *= 294 / radius; }
      }
      return { x, y };
    },
  };
}
