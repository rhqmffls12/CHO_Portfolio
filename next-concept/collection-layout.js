// Keep the next section anchored when an individual hovered card contracts.
export function initCollectionLayout() {
  const region = document.querySelector(".project-collections");
  const anchor = document.querySelector("#capabilities");
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");
  if (!region || !anchor) return;
  let frame = 0;
  let restore = null;
  function stopCorrection() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    restore?.();
    restore = null;
  }
  function open(card) {
    if (!pointer.matches) return;
    stopCorrection();
    card.classList.add("is-card-expanded-held");
  }
  function close(card) {
    if (!card.classList.contains("is-card-expanded-held") || card.querySelector(":focus-visible")) return;
    if (document.querySelector("dialog[open]")) return;
    stopCorrection();
    const before = anchor.getBoundingClientRect().top;
    const preserve = pointer.matches && region.getBoundingClientRect().top < 0 && before < window.innerHeight + 120;
    if (!preserve) { card.classList.remove("is-card-expanded-held"); return; }

    // Disable native anchoring and smooth scrolling only during this local correction.
    const styles = [[document.documentElement.style,"scroll-behavior"],
      [document.documentElement.style,"overflow-anchor"], [document.body.style,"overflow-anchor"]];
    const saved = styles.map(([style, name]) => [style,name,style.getPropertyValue(name),style.getPropertyPriority(name)]);
    for (const [style,name] of styles) style.setProperty(name, name === "scroll-behavior" ? "auto" : "none");
    restore = () => saved.forEach(([style,name,value,priority]) => {
      if (value) style.setProperty(name,value,priority); else style.removeProperty(name);
    });
    card.classList.remove("is-card-expanded-held");
    // Correct the section/grid switch before the next paint, including scroll clamping.
    const after = anchor.getBoundingClientRect().top;
    window.scrollBy(0, after - before);
    let documentTop = anchor.getBoundingClientRect().top + window.scrollY;
    const until = performance.now() + 420;
    function stabilize(now) {
      frame = 0;
      const next = anchor.getBoundingClientRect().top + window.scrollY;
      const delta = next - documentTop;
      // Only counteract layout changes. User wheel/trackpad scrolling remains intact.
      if (Math.abs(delta) > .25) window.scrollBy(0, delta);
      documentTop = next;
      if (now < until && !document.hidden) frame = requestAnimationFrame(stabilize);
      else stopCorrection();
    }
    frame = requestAnimationFrame(stabilize);
  }
  const cards = [...region.querySelectorAll("[data-work-card]")];
  cards.forEach(card => {
    card.addEventListener("pointerenter", () => open(card));
    card.addEventListener("pointerleave", () => close(card));
  });
  region.addEventListener("focusin", event => {
    const card = event.target.closest("[data-work-card]");
    if (card && event.target.matches(":focus-visible")) open(card);
  });
  region.addEventListener("focusout", event => queueMicrotask(() => {
    const card = event.target.closest("[data-work-card]");
    if (card && !card.matches(":hover")) close(card);
  }));
  document.addEventListener("portfolio:modalchange", () => {
    cards.forEach(card => { if (!card.matches(":hover")) close(card); });
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopCorrection(); });
  pointer.addEventListener("change", () => {
    stopCorrection();
    if (!pointer.matches) cards.forEach(card => card.classList.remove("is-card-expanded-held"));
  });
  cards.forEach(card => { if (card.matches(":hover")) open(card); });
}
