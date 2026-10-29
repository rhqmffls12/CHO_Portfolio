// Closed information consumes no height; unfolding pushes following rows downward.
export function initCardReveals(reduceMotion) {
  if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
  const pending = new Map();
  const nearby = new Set();
  let frame = 0;
  const section = document.querySelector(".work-section");
  const sizeObserver = "ResizeObserver" in window ? new ResizeObserver(() => schedule()) : null;

  function complete(card) {
    const state = pending.get(card);
    if (!state) return;
    card.classList.remove("has-scroll-info");
    state.info.style.removeProperty("--card-info-shift");
    state.drawer.style.removeProperty("--card-drawer-height");
    sizeObserver?.unobserve(state.info);
    pending.delete(card);
    nearby.delete(card);
    observer.unobserve(card);
  }
  function update() {
    frame = 0;
    if (reduceMotion.matches || document.hidden) return;
    const height = window.innerHeight;
    const start = height * .78;
    const travel = Math.max(120, Math.min(220, height * .24));
    const changes = [];
    // The thumbnail is the stable anchor, independent of its own drawer height.
    for (const card of nearby) {
      const state = pending.get(card);
      if (!state || card.hidden) continue;
      const top = state.drawer.getBoundingClientRect().top;
      const progress = Math.max(state.progress, Math.min(1, Math.max(0, (start - top) / travel)));
      const fullHeight = state.info.getBoundingClientRect().height;
      const drawerHeight = fullHeight * progress;
      if (progress !== state.progress || drawerHeight !== state.height) changes.push({card, state, progress, drawerHeight});
    }
    for (const {card, state, progress, drawerHeight} of changes) {
      state.progress = progress;
      state.height = drawerHeight;
      if (progress >= 1) { complete(card); continue; }
      state.info.style.setProperty("--card-info-shift", `${(-18 * (1-progress)).toFixed(2)}px`);
      state.drawer.style.setProperty("--card-drawer-height", `${drawerHeight.toFixed(2)}px`);
    }
    // Reconcile positions below an expanded row after the browser lays it out.
    if (changes.length) schedule();
  }
  function schedule() {
    if (!frame && !document.hidden && !reduceMotion.matches) frame = requestAnimationFrame(update);
  }
  const observer = new IntersectionObserver(records => {
    for (const record of records) {
      if (record.isIntersecting) nearby.add(record.target);
      else nearby.delete(record.target);
    }
    schedule();
  }, {rootMargin:"240px 0px 240px 0px", threshold:0});

  for (const card of section.querySelectorAll("[data-work-card]")) {
    const info = card.querySelector(".work-card-info");
    if (!info) continue;
    const drawer = document.createElement("div");
    drawer.className = "card-info-drawer";
    info.before(drawer);
    drawer.append(info);
    pending.set(card, {info, drawer, progress:0, height:0});
    card.classList.add("has-scroll-info");
    card.parentElement.classList.add("info-drawer-grid");
    sizeObserver?.observe(info);
    observer.observe(card);
  }
  window.addEventListener("scroll", schedule, {passive:true});
  window.addEventListener("resize", schedule, {passive:true});
  document.addEventListener("visibilitychange", schedule);
  new MutationObserver(schedule).observe(section, {subtree:true, attributes:true, attributeFilter:["hidden"]});
  section.addEventListener("focusin", event => {
    const card = event.target.closest("[data-work-card]");
    if (card && event.target.closest(".work-card-info")) complete(card);
  });
  reduceMotion.addEventListener("change", event => {
    if (!event.matches) return;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    for (const card of [...pending.keys()]) complete(card);
    observer.disconnect();
    sizeObserver?.disconnect();
  });
  schedule();
}
