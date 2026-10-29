// Independent columns, with an optional large two-card featured band.
const CARD_SPACING = Object.freeze({gap:5.5, aboveLift:8, sideShift:12, diagonalGap:16, expandedGap:24});
export function initIndependentCardLayout() {
  const region = document.querySelector(".project-collections");
  if (!region || !("ResizeObserver" in window)) return;
  const cards = [...region.querySelectorAll("[data-work-card]")];
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const featuredIds = new Set(["cinematic-workflow-toolkit", "production-breakdown"]);
  let frame = 0;
  const {gap, aboveLift, sideShift, diagonalGap, expandedGap} = CARD_SPACING;
  function layout() {
    frame = 0;
    const columns = Math.max(1, Number(getComputedStyle(region).getPropertyValue("--project-columns")) || 3);
    const regionWidth = region.getBoundingClientRect().width;
    if (regionWidth <= 0) return;
    const visible = cards.filter(card => !card.hidden && !card.closest("[data-work-group][hidden]"));
    const allOpen = region.classList.contains("show-all-card-info");
    const groups = region.hasAttribute("data-featured-pair") ? [
      {cards:visible.filter(card => featuredIds.has(card.dataset.workId)), columns:Math.min(2,columns)},
      {cards:visible.filter(card => !featuredIds.has(card.dataset.workId)), columns}
    ].filter(group => group.cards.length) : [{cards:visible,columns}];
    for (const group of groups) {
      group.width = (regionWidth - gap * (group.columns - 1)) / group.columns;
      const cssWidth = `${group.width.toFixed(3)}px`;
      for (const card of group.cards) if (card.style.width !== cssWidth) card.style.width = cssWidth;
    }
    const metrics = new Map(visible.map(card => {
      const visual = card.querySelector(".work-card-visual").offsetHeight;
      return [card, {visual, info:card.querySelector(".work-card-info").offsetHeight,
        expansion:Math.max(0,card.offsetHeight - visual)}];
    }));
    // This pure planner also estimates every single fully open card scenario.
    function plan(getExpansion) {
      let baseY = 0;
      let extent = 0;
      const positions = [];
      for (const group of groups) {
        const count = group.columns;
        const bottoms = Array(count).fill(0);
        const neighborShift = Array(count).fill(0);
        const upwardSources = group.cards.map(card => finePointer.matches && !allOpen
          ? aboveLift * Math.min(1,getExpansion(card) / Math.max(1,metrics.get(card).info)) : 0);
        const remainingUpward = Array(count).fill(0);
        upwardSources.forEach((shift,index) => { remainingUpward[index % count] += shift; });
        let groupExtent = 0;
        let maxOpen = 0;
        for (let row = 0; row < group.cards.length; row += count) {
          for (let column = 0; column < count && row + column < group.cards.length; column++) {
            if (finePointer.matches && !allOpen) {
              for (const adjacent of [column - 1, column + 1]) {
                if (adjacent < 0 || adjacent >= count || row + adjacent >= group.cards.length) continue;
                const sourceCard = group.cards[row + adjacent];
                const sourceProgress = Math.min(1,getExpansion(sourceCard) / Math.max(1,metrics.get(sourceCard).info));
                // Carry the same-row nudge through the column tail to prevent overlap.
                neighborShift[column] += sideShift * sourceProgress;
              }
            }
            const card = group.cards[row + column];
            const metric = metrics.get(card);
            const expansion = getExpansion(card);
            const progress = Math.min(1, expansion / Math.max(1,metric.info));
            const height = metric.visual + expansion;
            remainingUpward[column] -= upwardSources[row + column];
            const top = bottoms[column] + neighborShift[column] - Math.max(0,remainingUpward[column]);
            positions.push({card,top:baseY + top,left:column * (group.width + gap)});
            groupExtent = Math.max(groupExtent,top + height);
            maxOpen = Math.max(maxOpen,progress);
            bottoms[column] += height + gap + (expandedGap-gap) * progress;
          }
          if (finePointer.matches && !allOpen) for (let column = 0; column < count && row + column < group.cards.length; column++) {
            const source = group.cards[row + column];
            const progress = Math.min(1,getExpansion(source) / Math.max(1,metrics.get(source).info));
            const nudge = (diagonalGap-gap) * progress;
            if (column > 0) neighborShift[column-1] += nudge;
            if (column+1 < count) neighborShift[column+1] += nudge;
          }
        }
        extent = baseY + groupExtent;
        baseY = extent + gap + (expandedGap-gap) * maxOpen;
      }
      return {positions,height:extent};
    }
    const actual = plan(card => metrics.get(card).expansion);
    for (const {card,top,left} of actual.positions) {
      const cssTop = `${top.toFixed(3)}px`;
      const cssLeft = `${left.toFixed(3)}px`;
      if (card.style.top !== cssTop) card.style.top = cssTop;
      if (card.style.left !== cssLeft) card.style.left = cssLeft;
    }
    let height = actual.height;
    if (finePointer.matches && visible.length) {
      let reserved = allOpen ? plan(card => metrics.get(card).info).height : plan(() => 0).height;
      if (!allOpen) for (const opened of visible) {
        reserved = Math.max(reserved,plan(card => card === opened ? metrics.get(card).info : 0).height);
      }
      height = Math.ceil(reserved) + 2;
    }
    const cssHeight = `${height.toFixed(3)}px`;
    if (region.style.height !== cssHeight) region.style.height = cssHeight;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(layout);
  }
  region.classList.add("has-independent-cards");
  layout();
  const observer = new ResizeObserver(schedule);
  observer.observe(region);
  cards.forEach(card => {
    observer.observe(card);
    observer.observe(card.querySelector(".work-card-info"));
  });
  document.fonts?.ready.then(schedule);
  window.addEventListener("resize", schedule, {passive:true});
  finePointer.addEventListener("change", schedule);
  document.addEventListener("portfolio:filterchange", layout);
  document.addEventListener("portfolio:detailmodechange", layout);
}
