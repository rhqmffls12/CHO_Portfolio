const clamp01 = value => Math.max(0, Math.min(1, value));
export function chaseUrgency(distance) {
  const t = clamp01((distance - 1.2) / 6.3);
  return t * t * (3 - 2 * t);
}

// Integrate a random hazard over time instead of stopping after every fixed run.
// Random values are sampled only when a new interval begins, not once per frame.
export function createChaseRhythm(random = Math.random) {
  const range = (min, max) => min + (max - min) * random();
  const nextThreshold = () => -Math.log(Math.max(.000001, 1 - random()));
  let threshold = nextThreshold();
  let hazard = 0, pause = 0, cooldown = range(.2, .65);
  return {
    update(dt, distance, moving, uninterrupted) {
      const urgency = chaseUrgency(distance);
      if (!moving || uninterrupted) {
        pause = 0;
        hazard = 0;
        cooldown = Math.max(cooldown, uninterrupted ? .8 : .25);
        return 0;
      }
      // Keep visible hesitations readable even when the butterfly pulls away.
      // Offscreen recovery and click-driven catch-up cancel them immediately (above).
      if (pause > 0) {
        pause = Math.max(0, pause - dt);
        return pause;
      }
      cooldown = Math.max(0, cooldown - dt);
      if (cooldown > 0) return 0;
      const rate = 1.1 - .6 * urgency;
      hazard += rate * dt;
      if (hazard >= threshold && distance > 1.05) {
        hazard = 0;
        threshold = nextThreshold();
        pause = (random() < .75 ? range(.32, .56) : range(.56, .9)) * (1 - .15 * urgency);
        cooldown = range(.45, 1.25) * (1 + urgency * .4);
      }
      return pause;
    },
  };
}

export function chaseSpeedLimit(distance, urgency, recoveryBlend) {
  // The faster limit (5.4) is reserved for offscreen recovery or click-driven catch-up.
  const normal = 1.65 + 1.5 * urgency;
  const returning = Math.min(5.4, 3.6 + distance * .24);
  return normal + (returning - normal) * recoveryBlend;
}
