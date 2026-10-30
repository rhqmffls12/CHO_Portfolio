// Crossing a viewport threshold triggers a timed cascade, never scroll-scrubbed.
export function initCompactScroll(reduceMotion) {
  const region = document.querySelector(".project-collections");
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");
  if (!region || !("IntersectionObserver" in window)) return;
  const cards = [...region.querySelectorAll("[data-work-card]")];
  const pending = new Set(cards);
  const active = new Map();
  let observer;
  let frame = 0;
  let triggered = false;
  const enabled = () => pointer.matches && !reduceMotion.matches;
  const compact = () => enabled() && !region.classList.contains("show-all-card-info");
  function finish(card) {
    clearTimeout(active.get(card));
    active.delete(card);
    pending.delete(card);
    card.classList.remove("compact-enter-pending", "compact-enter-running");
    card.style.removeProperty("--compact-enter-delay");
  }
  function check() {
    frame = 0;
    if (!compact() || document.hidden || triggered) return;
    const bounds = region.getBoundingClientRect();
    if (bounds.top > window.innerHeight * .72) return;
    triggered = true;
    observer?.disconnect();
    let order = 0;
    const ready = [];
    for (const card of pending) {
      if (card.hidden || card.closest("[data-work-group][hidden]") || card.matches(":hover, :focus-within") || bounds.bottom < 0) {
        ready.push({card, skip:true}); continue;
      }
      ready.push({card, delay:Math.min(order++ * 65, 390)});
    }
    for (const {card, skip, delay} of ready) {
      if (skip) { finish(card); continue; }
      pending.delete(card);
      card.style.setProperty("--compact-enter-delay", `${delay}ms`);
      card.classList.remove("compact-enter-pending");
      card.classList.add("compact-enter-running");
      active.set(card, setTimeout(() => finish(card), delay + 650));
    }
  }
  function schedule() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(check);
  }
  function sync() {
    region.classList.toggle("has-compact-cascade", compact());
    observer?.disconnect();
    if (!compact()) {
      for (const card of cards) finish(card);
      return;
    }
    if (!triggered) {
      observer = new IntersectionObserver(schedule, {rootMargin:`0px 0px -${Math.round(window.innerHeight * .28)}px 0px`, threshold:0});
      observer.observe(region);
    }
    schedule();
  }
  function resetAboveProjects() {
    if (!compact() || !triggered) return;
    // Reset only when returning above the entire collection, never between rows.
    for (const card of cards) finish(card);
    triggered = false;
    for (const card of cards) {
      pending.add(card);
      card.classList.add("compact-enter-pending");
    }
    sync();
  }
  // Keep this observer alive after the entrance-trigger observer disconnects.
  const resetObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting && entry.boundingClientRect.top >= window.innerHeight - 1) resetAboveProjects();
  }, {threshold:0});
  resetObserver.observe(region);
  if (compact()) for (const card of cards) card.classList.add("compact-enter-pending");
  cards.forEach(card => card.addEventListener("pointerenter", () => finish(card)));
  region.addEventListener("pointerleave", schedule);
  region.addEventListener("focusout", schedule);
  region.addEventListener("focusin", event => {
    const card = event.target.closest("[data-work-card]");
    if (card) finish(card);
  });
  region.addEventListener("animationend", event => {
    if (event.animationName === "compact-thumbnail-enter") finish(event.target);
  });
  window.addEventListener("resize", sync, {passive:true});
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) for (const card of [...active.keys()]) finish(card);
    else schedule();
  });
  new MutationObserver(schedule).observe(region, {attributes:true, subtree:true, attributeFilter:["hidden"]});
  pointer.addEventListener("change", sync);
  document.addEventListener("portfolio:detailmodechange", () => {
    if (region.classList.contains("show-all-card-info")) {
      for (const card of [...pending, ...active.keys()]) finish(card);
      triggered = true;
    }
    sync();
  });
  reduceMotion.addEventListener("change", sync);
  sync();
}
