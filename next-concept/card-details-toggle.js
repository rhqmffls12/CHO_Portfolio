export function initCardDetailsToggle() {
  const control = document.querySelector("[data-card-details-controls]");
  const region = document.querySelector(".project-collections");
  if (!control || !region) return;
  const options = [...control.querySelectorAll("[data-details-mode]")];
  let settle;
  control.hidden = false;
  function setExpanded(expanded) {
    if (region.classList.contains("show-all-card-info") === expanded) return;
    clearTimeout(settle);
    // Keep the following section clear while drawers finish changing modes.
    region.style.minHeight = `${region.getBoundingClientRect().height}px`;
    region.classList.toggle("show-all-card-info", expanded);
    control.dataset.expanded = String(expanded);
    options.forEach(option => {
      option.setAttribute("aria-pressed", String((option.dataset.detailsMode === "expanded") === expanded));
    });
    document.dispatchEvent(new Event("portfolio:detailmodechange"));
    const status = document.querySelector("[data-page-status]");
    if (status) status.textContent = expanded ? "모든 프로젝트 정보를 펼쳤습니다." : "마우스를 올린 카드만 정보를 표시합니다.";
    settle = setTimeout(() => {
      region.style.removeProperty("min-height");
      document.dispatchEvent(new Event("portfolio:detailmodechange"));
    }, 400);
  }
  options.forEach(option => option.addEventListener("click", () => setExpanded(option.dataset.detailsMode === "expanded")));
}
