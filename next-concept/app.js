import { catalog } from "./catalog.js?v=workflow-thumbnail-20261030";
import { profile } from "./profile.js?v=slack-contact-20261027";
import { imageManifest } from "./image-manifest.js?v=cinematic-shading-revision2-20261030";
import { initHoverPreviews } from "./hover-preview.js?v=instant-hover-20261027";
import { initCompactScroll } from "./compact-scroll.js?v=expand-scroll-reset-fix-20261030";
import { initIndependentCardLayout } from "./independent-card-layout.js?v=expand-footer-row-alignment-20261030";
import { initCardDetailsToggle } from "./card-details-toggle.js?v=segmented-card-view-20261028";

const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
const toRootPath = (path = "") => path.startsWith("./") ? `../${path.slice(2)}` : path;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const yearValue = value => Math.max(...(String(value).match(/\d{4}/g) || [0]).map(Number));
const work = [...catalog].sort((a,b) => Number(a.archive)-Number(b.archive) || (a.featuredOrder ?? 10)-(b.featuredOrder ?? 10) || (a.selectedOrder ?? 10)-(b.selectedOrder ?? 10) || yearValue(b.sortYear || b.year)-yearValue(a.sortYear || a.year));
const filters = [...document.querySelectorAll("[data-filter]")];
const filterGroups = { "worlds-render":["worlds","render"], rig:["rig"], "cfx-fx":["cfx","fx"], "tool-pipeline":["tool","pipeline"] };
let activeFilter = "all";
let stopCardPreview = () => {};
const dialog = document.querySelector("#project-dialog");
const dialogBody = dialog.querySelector(".dialog-body");
const imageViewer = document.querySelector("#image-viewer");
let projectTrigger = null;
let imageTrigger = null;
let imageZoom = 1;
let heroVisible = true;
let reelIndex = 0;
let reelPlaybackMode = reduceMotion.matches ? "pause" : "play";
const heroVideo = document.querySelector(".hero-video");
const reelPlayButton = document.querySelector("[data-reel-play]");
const reelEntries = catalog.filter(entry => entry.discipline === "cinematic" && entry.video);

function groupLabel(groups) { return groups.map(group => ({worlds:"WORLDS",render:"RENDER",rig:"RIG",cfx:"CFX",fx:"FX",tool:"TOOL",pipeline:"PIPELINE"})[group]).filter(Boolean).join(" · "); }
function matchesFilter(entry) { return activeFilter === "all" || entry.groups.some(tag => filterGroups[activeFilter]?.includes(tag)); }
function imageInfo(path = "") { return imageManifest[path.replace(/^\.\//, "").split("?")[0]]; }
function imagePath(path = "", mode = "detail") { return imageInfo(path)?.[mode] || toRootPath(path); }
function imageMarkup(path, alt = "", mode = "card", eager = false) {
  if (!path) return "";
  const info = imageInfo(path);
  const srcset = info && mode === "card" ? ` srcset="${escapeHTML(info.small)} ${Math.round(info.width * Math.min(1,480 / Math.max(info.width,info.height)))}w, ${escapeHTML(info.card)} ${Math.round(info.width * Math.min(1,960 / Math.max(info.width,info.height)))}w" sizes="(max-width:600px) 90vw, (max-width:1100px) 43vw, 30vw"` : "";
  return `<img src="${escapeHTML(imagePath(path,mode))}"${srcset} alt="${escapeHTML(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async"${info ? ` width="${info.width}" height="${info.height}"` : ""} />`;
}
function cardMarkup(entry) {
  const index = work.indexOf(entry);
  const discipline = entry.kind === "tool" || entry.groups.some(group => group === "tool" || group === "pipeline") ? "tech" : "production";
  const poster = entry.thumbnail || entry.poster;
  const logos = (entry.toolLogos || []).map(({name,src}) => `<img src="${escapeHTML(toRootPath(name.toLowerCase().includes("unreal") ? "./assets/tools/unreal-engine-black.png" : src))}" alt="${escapeHTML(name)}" title="${escapeHTML(name)}" loading="lazy" width="24" height="24" />`).join("");
  return `<article class="work-card" data-work-card data-work-id="${entry.id}" data-card-discipline="${discipline}">
    <button class="work-card-visual${poster ? "" : " is-text-poster"}" type="button" data-open-work="${entry.id}" aria-label="View ${escapeHTML(entry.title)}">
      ${imageMarkup(poster)}${!poster ? `<span class="visual-placeholder">${escapeHTML(entry.thumbnailLabel || entry.title)}</span>` : ""}
      <span class="visual-open" aria-hidden="true">↗</span>
      <span class="thumbnail-compact-year" aria-hidden="true">${escapeHTML(entry.year)}</span>
      <span class="thumbnail-compact-title" aria-hidden="true">${escapeHTML(entry.title)}</span>
      <span class="thumbnail-category-label">${escapeHTML(groupLabel(entry.groups))}</span>
      ${entry.featuredOrder !== null ? `<span class="featured-badge">FEATURED / 0${entry.featuredOrder+1}</span>` : ""}
    </button>
    <div class="card-info-panel"><div class="card-info-clip"><div class="work-card-info"><p class="work-card-meta"><span>${escapeHTML(entry.year)}</span><span class="card-discipline-label">${escapeHTML(groupLabel(entry.groups))}</span><span class="card-index">${String(index+1).padStart(2,"0")}</span></p>
    <h3><button id="work-${entry.id}" type="button" data-open-work="${entry.id}">${escapeHTML(entry.title)}</button></h3>
    <p class="work-card-description">${escapeHTML(entry.description || "")}</p>
    <div class="work-card-footer"><div class="card-tool-logos" aria-label="Project software">${logos}</div><div class="card-actions">${entry.releaseUrl ? `<a class="release-link" href="${escapeHTML(entry.releaseUrl)}" target="_blank" rel="noopener noreferrer">RELEASE ↗</a>` : ""}</div></div></div></div></div></article>`;
}
function renderWork() {
  for (const [name, predicate] of Object.entries({featured:e => e.featuredOrder !== null, current:e => e.featuredOrder === null && !e.archive, archive:e => e.archive})) {
    document.querySelector(`[data-work-grid="${name}"]`).innerHTML = work.filter(predicate).map(cardMarkup).join("");
  }
  document.querySelector(".work-section").addEventListener("click", event => {
    const button = event.target.closest("[data-open-work]");
    if (button) openWork(button.dataset.openWork, button);
  });
  filters.forEach(button => {
    const group = button.dataset.filter;
    const count = work.filter(entry => group === "all" || entry.groups.some(tag => filterGroups[group]?.includes(tag))).length;
    button.querySelector("span").textContent = String(count).padStart(2,"0");
    button.addEventListener("click", () => setFilter(group));
  });
  document.querySelector(".main-nav a[href='#work'] span").textContent = String(work.length).padStart(2,"0");
  initIndependentCardLayout();
  stopCardPreview = initHoverPreviews({entries:work, toRootPath, dialog, reduceMotion});
  initCompactScroll(reduceMotion);
  initCardDetailsToggle();
}
function setFilter(filter) {
  stopCardPreview();
  activeFilter = filter === "all" || filterGroups[filter] ? filter : "all";
  filters.forEach(button => {
    const selected = button.dataset.filter === activeFilter;
    button.classList.toggle("is-active",selected);
    button.setAttribute("aria-pressed",String(selected));
  });
  let count = 0;
  document.querySelectorAll("[data-work-card]").forEach(card => {
    const entry = work.find(item => item.id === card.dataset.workId);
    card.hidden = !matchesFilter(entry);
    if (!card.hidden) count++;
  });
  document.querySelector("[data-visible-count]").textContent = String(count).padStart(2,"0");
  document.querySelectorAll("[data-work-group]").forEach(group => { group.hidden = !group.querySelector("[data-work-card]:not([hidden])"); });
  document.dispatchEvent(new Event("portfolio:filterchange"));
}
function mediaStage(entry) {
  const poster = entry.poster || entry.thumbnail || entry.media?.images?.[0];
  if (entry.video || entry.media?.type === "video") return `<div class="dialog-stage"><video controls muted playsinline preload="metadata"${poster ? ` poster="${escapeHTML(imagePath(poster))}"` : ""}><source src="${escapeHTML(toRootPath(entry.video || entry.media.src))}" type="video/mp4" /></video><p class="media-error" hidden>영상을 불러오지 못했습니다. <a href="${escapeHTML(toRootPath(entry.video || entry.media.src))}">Open video ↗</a></p></div>`;
  if (entry.media?.type === "youtube") return `<div class="dialog-stage video-stage-placeholder" data-youtube-stage="${entry.media.id}">${poster ? imageMarkup(poster,`${entry.title} video preview`,"detail",true) : `<span class="gallery-video-label">${escapeHTML(entry.title)}</span>`}<button class="load-youtube youtube-play-button" type="button" data-play-youtube aria-label="Play ${escapeHTML(entry.title)}"></button></div>`;
  return `<div class="dialog-stage is-gallery-image" data-gallery-stage>${imageMarkup(poster || entry.media?.src,entry.title,"detail",true)}<button class="image-expand" type="button" data-expand-image>EXPAND IMAGE ↗</button></div>`;
}
function dialogMarkup(entry) {
  const sections = (entry.technicalSections || []).map(({heading,items}) => `<section class="technical-notes"><h3>${escapeHTML(heading)}</h3><ul>${items.map(text => `<li>${escapeHTML(text)}</li>`).join("")}</ul></section>`).join("");
  const images = entry.media?.images || [];
  const videoPoster = entry.poster || entry.thumbnail || images[0];
  const videoThumb = entry.media?.type === "youtube" ? `<button class="gallery-video-thumb" type="button" data-play-youtube data-gallery-video aria-current="true" aria-label="Play video">${videoPoster ? imageMarkup(videoPoster) : `<span class="gallery-video-label">${escapeHTML(entry.title)}</span>`}<span class="gallery-play-badge" aria-hidden="true"></span></button>` : "";
  const gallery = images.length ? `<div class="dialog-gallery" role="group" aria-label="Select project video or image">${videoThumb}${images.map((path,index) => `<button type="button" data-gallery-image="${escapeHTML(path)}" aria-current="false" aria-label="View project image ${index+1}">${imageMarkup(path)}</button>`).join("")}</div><p class="gallery-hint">이미지를 선택한 뒤 크게 보기를 눌러 세부 내용을 확인할 수 있습니다.</p>` : "";
  const youtubeUrl = entry.media?.type === "youtube" ? `https://www.youtube.com/watch?v=${entry.media.id}${entry.media.start ? `&t=${entry.media.start}s` : ""}` : "";
  const notes = [["MY CONTRIBUTION",entry.contribution || entry.role],["TECH STACK",entry.stack || entry.tools || (entry.toolLogos || []).map(t => t.name).join(" · ")],["PERIOD",entry.year]].filter(([,value]) => value);
  const caseSteps = [["01 / OBJECTIVE",entry.objective],["02 / MY CONTRIBUTION",entry.contribution || entry.role],["03 / IMPLEMENTATION",entry.technicalDescription || entry.description],["04 / RESULT",entry.result]].filter(([,value]) => value);
  const caseMarkup = caseSteps.map(([heading,text]) => {
    const [number, title] = heading.split(" / ");
    return `<section class="case-step"><h3><span class="case-step-number">${number} /</span><span>${title}</span></h3><p>${escapeHTML(text)}</p></section>`;
  }).join("");
  return `<div class="dialog-content"><div class="dialog-main">${mediaStage(entry)}${youtubeUrl ? `<div class="video-fallback"><span>Video walkthrough</span><a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer">WATCH ON YOUTUBE ↗</a></div>` : ""}${gallery}<div class="dialog-copy"><p class="eyebrow dialog-year">${escapeHTML(entry.year)} · ${escapeHTML(groupLabel(entry.groups))}</p><h2 id="dialog-title">${escapeHTML(entry.title)}</h2><p class="dialog-description">${escapeHTML(entry.description || "")}</p>${entry.archive ? "" : `<div class="case-study">${caseMarkup}</div>`}${sections ? `<section class="technical-breakdown"><h3 class="technical-breakdown-heading">TECHNICAL BREAKDOWN</h3>${sections}</section>` : ""}${entry.relevance ? `<section class="transferable-skills"><h3>RELATED TA SKILLS</h3><p>${escapeHTML(entry.relevance)}</p></section>` : ""}</div></div><aside class="dialog-aside"><h3>PROJECT NOTES</h3>${notes.map(([label,value]) => `<div class="dialog-detail"><span>${label}</span><p>${escapeHTML(value)}</p></div>`).join("")}${entry.releaseUrl ? `<a class="dialog-release" href="${escapeHTML(entry.releaseUrl)}" target="_blank" rel="noopener noreferrer">OPEN RELEASE ↗</a>` : ""}</aside></div><nav class="project-pagination" aria-label="Project navigation"></nav>`;
}
function projectURL(id) {
  const url = new URL(location.href);
  const params = new URLSearchParams({project:id,filter:activeFilter});
  url.hash = params.toString();
  return url;
}
function openWork(id, trigger, fromHistory = false) {
  const entry = work.find(item => item.id === id);
  if (!entry) return;
  stopCardPreview();
  if (!dialog.open) projectTrigger = trigger || document.querySelector(`#work-${entry.id}`);
  if (!fromHistory) {
    if (dialog.open) history.replaceState({portfolioProject:true},"",projectURL(id));
    else history.pushState({portfolioProject:true},"",projectURL(id));
  }
  dialog.querySelector("[data-dialog-category]").textContent = groupLabel(entry.groups);
  dialog.dataset.activeWork = id;
  dialogBody.querySelector("video")?.pause();
  dialogBody.innerHTML = dialogMarkup(entry);
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("has-modal");
  document.dispatchEvent(new Event("portfolio:modalchange"));
  dialog.scrollTop = 0;
  dialog.querySelector(".dialog-close").focus({preventScroll:true});
  updateProjectPagination();
  syncHeroPlayback();
  const video = dialogBody.querySelector("video");
  if (video) {
    const errorMessage = video.closest(".dialog-stage").querySelector(".media-error");
    video.addEventListener("error", () => { if (errorMessage) errorMessage.hidden = false; });
    video.play().catch(() => {});
  }
}
function updateProjectPagination() {
  const sequence = work.filter(matchesFilter);
  const index = sequence.findIndex(entry => entry.id === dialog.dataset.activeWork);
  const previous = sequence[index-1];
  const next = sequence[index+1];
  dialogBody.querySelector(".project-pagination").innerHTML = `${previous ? `<button type="button" data-navigate-project="${previous.id}"><small>← PREVIOUS</small>${escapeHTML(previous.title)}</button>` : "<span></span>"}<span>${index+1} / ${sequence.length}</span>${next ? `<button type="button" data-navigate-project="${next.id}"><small>NEXT →</small>${escapeHTML(next.title)}</button>` : "<span></span>"}`;
}
function requestCloseProject() {
  if (imageViewer.open) { imageViewer.close(); return; }
  if (history.state?.portfolioProject) history.back();
  else { history.replaceState(null,"",new URL("#work",location.href)); dialog.close(); }
}
function syncLocation() {
  const params = new URLSearchParams(location.hash.slice(1));
  const id = params.get("project");
  if (id && work.some(entry => entry.id === id)) {
    setFilter(params.get("filter") || "all");
    if (!matchesFilter(work.find(entry => entry.id === id))) setFilter("all");
    if (dialog.dataset.activeWork !== id || !dialog.open) openWork(id,null,true);
  } else if (dialog.open) {
    if (imageViewer.open) imageViewer.close();
    dialog.close();
  }
}
function showGalleryImage(path, trigger) {
  const stage = dialogBody.querySelector(".dialog-stage");
  const entry = work.find(item => item.id === dialog.dataset.activeWork);
  stage.querySelector("video")?.pause();
  stage.classList.remove("is-playing");
  stage.classList.add("is-gallery-image");
  stage.dataset.imagePath = path;
  stage.innerHTML = `${imageMarkup(path,entry.title,"detail",true)}<button class="image-expand" type="button" data-expand-image>크게 보기 ↗</button>`;
  setGalleryCurrent(trigger);
}
function setGalleryCurrent(trigger) { dialogBody.querySelectorAll(".dialog-gallery button").forEach(button => button.setAttribute("aria-current",String(button === trigger))); }
function loadYouTube(trigger) {
  const entry = work.find(item => item.id === dialog.dataset.activeWork);
  if (!entry?.media?.id) return;
  const stage = dialogBody.querySelector(".dialog-stage");
  stage.classList.remove("is-gallery-image");
  stage.classList.add("is-playing");
  delete stage.dataset.imagePath;
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(entry.media.id)}?autoplay=1&rel=0&start=${Number(entry.media.start || 0)}`;
  iframe.title = `${entry.title} — video walkthrough`;
  iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.addEventListener("error", () => {
    document.querySelector("[data-page-status]").textContent = "영상 재생이 어려우면 Watch on YouTube 링크를 이용해 주세요.";
  });
  stage.replaceChildren(iframe);
  setGalleryCurrent(dialogBody.querySelector("[data-gallery-video]"));
}
function setImageZoom(value) {
  imageZoom = Math.max(1,Math.min(4,value));
  imageViewer.querySelector(".image-canvas").style.width = `${imageZoom*100}%`;
  imageViewer.querySelector(".image-canvas").style.height = `${imageZoom*100}%`;
  imageViewer.querySelector("[data-zoom-label]").textContent = `${Math.round(imageZoom*100)}%`;
  imageViewer.querySelector("[data-zoom-out]").disabled = imageZoom <= 1;
  imageViewer.querySelector("[data-zoom-in]").disabled = imageZoom >= 4;
}
function expandImage(trigger) {
  const stage = dialogBody.querySelector(".dialog-stage");
  const entry = work.find(item => item.id === dialog.dataset.activeWork);
  const path = stage.dataset.imagePath || entry.poster || entry.media?.src;
  if (!path) return;
  imageTrigger = trigger;
  const img = imageViewer.querySelector("img");
  img.src = toRootPath(path); img.alt = entry.title;
  imageViewer.querySelector("[data-image-original]").href = toRootPath(path);
  imageViewer.showModal(); setImageZoom(1);
}
dialogBody.addEventListener("click", event => {
  const image = event.target.closest("[data-gallery-image]");
  if (image) showGalleryImage(image.dataset.galleryImage,image);
  if (event.target.closest("[data-play-youtube]")) loadYouTube(event.target);
  const next = event.target.closest("[data-navigate-project]");
  if (next) openWork(next.dataset.navigateProject);
  const expand = event.target.closest("[data-expand-image]") || event.target.closest(".is-gallery-image>img");
  if (expand) expandImage(expand);
});
dialog.querySelector(".dialog-close").addEventListener("click",requestCloseProject);
dialog.addEventListener("cancel", event => { event.preventDefault(); requestCloseProject(); });
dialog.addEventListener("click", event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) requestCloseProject();
});
dialog.addEventListener("close", () => {
  dialogBody.replaceChildren(); delete dialog.dataset.activeWork;
  document.body.classList.remove("has-modal");
  document.dispatchEvent(new Event("portfolio:modalchange"));
  projectTrigger?.focus({preventScroll:true}); syncHeroPlayback();
});
imageViewer.querySelector("[data-image-close]").addEventListener("click", () => imageViewer.close());
imageViewer.querySelector("[data-zoom-in]").addEventListener("click", () => setImageZoom(imageZoom+.5));
imageViewer.querySelector("[data-zoom-out]").addEventListener("click", () => setImageZoom(imageZoom-.5));
imageViewer.querySelector("[data-zoom-reset]").addEventListener("click", () => setImageZoom(1));
imageViewer.addEventListener("click",event => { if (event.target === imageViewer) imageViewer.close(); });
imageViewer.addEventListener("close", () => imageTrigger?.focus({preventScroll:true}));
window.addEventListener("popstate",syncLocation);
window.addEventListener("hashchange",syncLocation);

function updateReelControls() {
  const playing = !heroVideo.paused;
  reelPlayButton.innerHTML = playing
    ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5V12.5M10.5 3.5V12.5" fill="none" stroke="currentColor" stroke-width="1.1" /></svg>'
    : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5L12 8L5 12.5Z" fill="currentColor" /></svg>';
  reelPlayButton.setAttribute("aria-label",playing ? "Pause reel" : "Play reel");
  reelPlayButton.setAttribute("aria-pressed",String(playing));
}
function syncHeroPlayback() {
  if (reelPlaybackMode === "play" && heroVisible && !document.hidden && !dialog.open) {
    heroVideo.play().then(updateReelControls).catch(error => { if (error.name === "NotAllowedError") reelPlaybackMode="pause"; updateReelControls(); });
  } else heroVideo.pause();
  updateReelControls();
}
function selectReelProject(index) {
  reelIndex = (index+reelEntries.length)%reelEntries.length;
  const entry = reelEntries[reelIndex];
  document.querySelector("[data-reel-error]").hidden = true;
  heroVideo.pause(); heroVideo.muted=true;
  heroVideo.poster = imagePath(entry.thumbnail,"detail");
  heroVideo.src = toRootPath(entry.video); heroVideo.load();
  document.querySelector("[data-reel-year]").textContent=entry.year;
  document.querySelector("[data-reel-title]").textContent=entry.title;
  document.querySelector("[data-reel-category]").textContent=entry.category;
  document.querySelector("[data-reel-role]").textContent=entry.role;
  document.querySelector(".hero-video-timeline i").style.transform="scaleX(0)";
  syncHeroPlayback();
}
heroVideo.addEventListener("play",updateReelControls);
heroVideo.addEventListener("pause",updateReelControls);
heroVideo.addEventListener("timeupdate", () => {
  if (Number.isFinite(heroVideo.duration) && heroVideo.duration>0) document.querySelector(".hero-video-timeline i").style.transform=`scaleX(${heroVideo.currentTime/heroVideo.duration})`;
});
heroVideo.addEventListener("ended", () => { if (reelPlaybackMode === "play") selectReelProject(reelIndex+1); });
heroVideo.addEventListener("error", () => { reelPlaybackMode="pause"; document.querySelector("[data-reel-error]").hidden=false; updateReelControls(); });
reelPlayButton.addEventListener("click", () => { reelPlaybackMode=heroVideo.paused ? "play" : "pause"; syncHeroPlayback(); });
document.addEventListener("visibilitychange",syncHeroPlayback);
reduceMotion.addEventListener("change", () => { if (reduceMotion.matches) reelPlaybackMode="pause"; syncHeroPlayback(); });
if ("IntersectionObserver" in window) new IntersectionObserver(([entry]) => { heroVisible=entry.isIntersecting; syncHeroPlayback(); },{threshold:.15}).observe(document.querySelector(".hero-media"));

function initProfileLinks() {
  const email = profile.contactEmail;
  if (email) document.querySelectorAll("[data-contact-link]").forEach(link => {
    link.href=`mailto:${email}`;
    if (!link.classList.contains("contact-icon-link")) link.textContent="LET’S TALK ↗";
  });
  document.querySelectorAll("[data-slack-link]").forEach(link => {
    link.hidden = !profile.slackProfileUrl;
    if (profile.slackProfileUrl) link.href = profile.slackProfileUrl;
  });
  if (profile.resumeUrl) {
    const link = document.createElement("a"); link.href=profile.resumeUrl; link.className="text-link"; link.textContent="DOWNLOAD RESUME ↗";
    document.querySelector(".profile-intro").append(link);
  }
}
renderWork(); setFilter("all"); initProfileLinks(); selectReelProject(0);

function initHeroTitleAlignment() {
  const title = document.querySelector(".hero-title--vision");
  if (!title) return;
  let previousWidth = 0;
  let frame = 0;
  const fitLines = () => {
    const width = title.getBoundingClientRect().width;
    if (!width || width === previousWidth) return;
    previousWidth = width;
    const baseSize = parseFloat(getComputedStyle(title).fontSize);
    title.querySelectorAll(".hero-title-line").forEach((line) => {
      const size = baseSize * Number(line.dataset.titleScale || 1);
      line.style.fontSize = `${size}px`;
      const words = [...line.children];
      const textWidth = words.reduce((sum, word) => sum + word.getBoundingClientRect().width, 0);
      const gapWidth = Math.max(0, words.length - 1) * size * .16;
      const availableWidth = width - 4;
      if (textWidth > 0 && (words.length === 1 || textWidth + gapWidth > availableWidth)) {
        line.style.fontSize = `${size * availableWidth / (textWidth + gapWidth)}px`;
      }
    });
  };
  fitLines();
  document.fonts.ready.then(() => { previousWidth = 0; fitLines(); });
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fitLines);
    }).observe(title);
  } else {
    window.addEventListener("resize", fitLines);
  }
}


function renderFloatingToolkit(container, tools) {
  if (!tools.length) return;
  container.innerHTML = `<div class="toolkit-field" role="group" aria-label="Production software"><canvas class="toolkit-dots" aria-hidden="true"></canvas>${tools.map((tool) => `<button class="tool-orb" type="button" data-priority="${tool.priority || 1}" data-enlarged="${Boolean(tool.enlarged)}" aria-pressed="false" aria-label="${escapeHTML(tool.name)} · Usage ${tool.priority || 1}/4"><img src="${escapeHTML(tool.icon)}" alt="" width="48" height="48" loading="lazy" draggable="false" /></button>`).join("")}</div><div class="toolkit-hover-detail" aria-live="polite" aria-atomic="true"></div><button class="toolkit-touch-control" type="button" aria-pressed="false">아이콘 멈추기</button>`;
  const field = container.querySelector(".toolkit-field");
  const usageHint = container.parentElement.querySelector(".toolkit-usage-hint");
  if (usageHint) container.querySelector(".toolkit-hover-detail").after(usageHint);
  const bodies = [...field.querySelectorAll(".tool-orb")].map((element, index) => {
    const angle = index * Math.PI * 2 / tools.length - Math.PI / 2;
    const heading = angle + .7 + (index % 3) * .8;
    const speed = { 1: .21, 2: .15, 3: .105, 4: .075 }[tools[index].priority] || .15;
    return { element, boundary: .8, collisionRadius: .1, speed, x: Math.cos(angle) * .62, y: Math.sin(angle) * .62,
      vx: Math.cos(heading) * speed, vy: Math.sin(heading) * speed };
  });
  const detail = container.querySelector(".toolkit-hover-detail");
  let hovered = false;
  let focused = false;
  let selectedIndex = -1;
  let touchPaused = false;
  const touchControl = container.querySelector(".toolkit-touch-control");
  const setTouchPause = (paused) => {
    touchPaused = paused;
    touchControl.setAttribute("aria-pressed", String(paused));
    touchControl.textContent = paused ? "아이콘 다시 움직이기" : "아이콘 멈추기";
    if (!paused) { focused = false; clearTool(); }
  };
  touchControl.addEventListener("click", () => {
    setTouchPause(!touchPaused);
    if (!touchPaused && field.contains(document.activeElement)) document.activeElement.blur();
  });
  field.addEventListener("pointerdown", (event) => { if (event.pointerType === "touch") setTouchPause(true); });
  const showTool = (index) => {
    if (selectedIndex === index) return;
    selectedIndex = index;
    bodies.forEach(({element}, i) => element.setAttribute("aria-pressed", String(i === index)));
    const tool = tools[index];
    const priority = tool.priority || 1;
    detail.innerHTML = `<img src="${escapeHTML(tool.icon)}" alt="" width="32" height="32" /><span class="toolkit-detail-name">${escapeHTML(tool.name)}</span><span class="toolkit-detail-priority">Usage <b>${priority} / 4</b><span class="toolkit-priority-bars" aria-hidden="true">${[1, 2, 3, 4].map((tier) => `<i class="${tier <= priority ? "is-active" : ""}"></i>`).join("")}</span></span>`;
    detail.classList.add("is-visible");
  };
  const clearTool = () => {
    if (hovered || focused || touchPaused) return;
    detail.classList.remove("is-visible");
    detail.replaceChildren();
    selectedIndex = -1;
    bodies.forEach(({element}) => element.setAttribute("aria-pressed", "false"));
  };
  field.addEventListener("pointerenter", (event) => { if (event.pointerType !== "touch") hovered = true; });
  field.addEventListener("pointerleave", () => { hovered = false; clearTool(); });
  field.addEventListener("pointercancel", () => { hovered = false; clearTool(); });
  field.addEventListener("focusin", () => { focused = true; });
  field.addEventListener("focusout", (event) => {
    focused = field.contains(event.relatedTarget);
    clearTool();
  });
  bodies.forEach(({ element }, index) => {
    element.addEventListener("pointerenter", () => showTool(index));
    element.addEventListener("focus", () => showTool(index));
    element.addEventListener("click", () => showTool(index));
  });
  const canvas = field.querySelector(".toolkit-dots");
  const context = canvas.getContext("2d");
  // Cloud-soft brain profile: indentations filled 50% toward the convex envelope, no stem.
  // The same outline masks Cartesian dots and reflects the floating icons.
  const cloudAnchors = [
    [-0.9430,0.1200],[-0.9635,-0.1000],[-0.8610,-0.3000],[-0.7420,-0.3728],
    [-0.6047,-0.5600],[-0.3895,-0.6500],[-0.2239,-0.6461],[-0.0410,-0.7500],
    [0.1947,-0.7300],[0.3832,-0.6234],[0.5433,-0.6100],[0.7380,-0.4600],
    [0.8187,-0.2971],[0.9430,-0.1700],[0.9737,0.0400],[0.8712,0.2500],
    [0.6970,0.3600],[0.4952,0.3831],[0.3443,0.3703],[0.1754,0.4240],
    [0.0717,0.4800],[-0.0533,0.4616],[-0.1844,0.4285],[-0.3280,0.4900],
    [-0.5433,0.4800],[-0.7075,0.3802],[-0.8405,0.3000]
  ];
  // Taller profile inside a narrower panel; retain the shallow, stem-free base.
  cloudAnchors.forEach((point) => { point[1] = point[1] * 1.38 + .15; });
  const cloudContour = [];
  cloudAnchors.forEach((point, index) => {
    const count = cloudAnchors.length;
    const p0 = cloudAnchors[(index + count - 1) % count];
    const p1 = point, p2 = cloudAnchors[(index + 1) % count];
    const p3 = cloudAnchors[(index + 2) % count];
    for (let step = 0; step < 6; step++) {
      const t = step / 6, t2 = t * t, t3 = t2 * t;
      cloudContour.push([0, 1].map((axis) => .5 * (
        2 * p1[axis] + (-p0[axis] + p2[axis]) * t +
        (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2 +
        (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * t3
      )));
    }
  });
  const profileDistance = (x, y) => {
    let inside = false, nearest = Infinity, inwardX = 0, inwardY = 0;
    for (let i = 0, j = cloudContour.length - 1; i < cloudContour.length; j = i++) {
      const [ax, ay] = cloudContour[j], [bx, by] = cloudContour[i];
      if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
      const dx = bx - ax, dy = by - ay, length2 = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length2));
      const distance = Math.hypot(x - ax - dx * t, y - ay - dy * t);
      if (distance < nearest) {
        nearest = distance;
        const length = Math.sqrt(length2);
        inwardX = -dy / length; inwardY = dx / length;
      }
    }
    return { distance: inside ? nearest : -nearest, nx: inwardX, ny: inwardY };
  };
  const pointer = { x: 0, y: 0, active: false };
  let dots = [];
  let diameter = 0;
  let fieldHeight = 0;
  const drawDots = (snap = false) => {
    if (!context || !diameter) return;
    context.clearRect(0, 0, diameter, fieldHeight);
    const influence = diameter * .23;
    dots.forEach((dot) => {
      const proximity = pointer.active ? Math.max(0, 1 - Math.hypot(dot.x - pointer.x, dot.y - pointer.y) / influence) : 0;
      const target = dot.baseRadius * (1 + 2 * proximity * proximity);
      dot.radius += (target - dot.radius) * (snap ? 1 : .18);
      const brightnessTarget = proximity * proximity;
      dot.brightness = (dot.brightness || 0) + (brightnessTarget - (dot.brightness || 0)) * (snap ? 1 : .18);
      // Blend the base green into the existing olive accent near the pointer.
      const blend = dot.brightness;
      context.fillStyle = `rgb(${Math.round(41 + 148 * blend)}, ${Math.round(52 + 168 * blend)}, ${Math.round(43 + 64 * blend)})`;
      context.beginPath();
      context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      context.fill();
    });
  };
  field.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || reduceMotion.matches) return;
    const bounds = field.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  });
  field.addEventListener("pointerleave", () => { pointer.active = false; });
  field.addEventListener("pointercancel", () => { pointer.active = false; });
  let visible = !("IntersectionObserver" in window);
  let frame = 0;
  let previousTime = 0;
  const paint = () => bodies.forEach(({ element, x, y }) => {
    element.style.transform = `translate3d(${x * diameter / 2}px, ${y * fieldHeight / 2}px, 0) translate(-50%, -50%)`;
  });
  const constrain = (body) => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const { distance, nx, ny } = profileDistance(body.x, body.y);
      if (distance >= body.boundary) return;
      const correction = body.boundary - distance + .002;
      body.x += nx * correction;
      body.y += ny * correction;
      const outward = body.vx * nx + body.vy * ny;
      if (outward < 0) {
        body.vx -= 2 * outward * nx;
        body.vy -= 2 * outward * ny;
      }
    }
  };
  const resize = () => {
    diameter = field.clientWidth;
    fieldHeight = field.clientHeight;
    if (!diameter) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(diameter * pixelRatio);
    canvas.height = Math.round(fieldHeight * pixelRatio);
    context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    dots = [];
    const center = diameter / 2;
    const centerY = fieldHeight / 2;
    const steps = Math.max(14, Math.round(diameter / 16));
    const spacing = diameter / steps;
    // Keep the Cartesian grid; only its clipping silhouette changes.
    for (let row = 0; row <= Math.floor(fieldHeight / spacing); row++) {
      for (let column = 0; column <= steps; column++) {
        const x = column * spacing;
        const y = row * spacing;
        const { distance } = profileDistance((x - center) / center, (y - centerY) / centerY);
        if (distance <= 0) continue;
        const edge = Math.min(1, distance * Math.min(center, centerY) / (spacing * 1.3));
        const baseRadius = .45 + 1.15 * edge;
        dots.push({ x, y, baseRadius, radius: baseRadius });
      }
    }
    drawDots(true);
    bodies.forEach((body) => {
      const iconSize = body.element.getBoundingClientRect().width;
      body.collisionRadius = (iconSize + 10) / diameter;
      body.boundary = (iconSize * Math.SQRT2 + 12) / Math.min(diameter, fieldHeight);
      constrain(body);
    });
    paint();
  };
  const resolveOverlaps = () => {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        const minimum = a.collisionRadius + b.collisionRadius;
        if (distance >= minimum) continue;
        const nx = distance > .0001 ? dx / distance : Math.cos(i + j);
        const ny = distance > .0001 ? dy / distance : Math.sin(i + j);
        const push = (minimum - distance) / 2;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
        // Gently redirect approaching icons while preserving each usage tier's speed.
        if ((b.vx - a.vx) * nx + (b.vy - a.vy) * ny < 0) {
          for (const [body, sign] of [[a, -1], [b, 1]]) {
            body.vx += sign * nx * .035;
            body.vy += sign * ny * .035;
            const length = Math.hypot(body.vx, body.vy) || 1;
            body.vx = body.vx / length * body.speed;
            body.vy = body.vy / length * body.speed;
          }
        }
        constrain(a); constrain(b);
      }
    }
  };
  const animate = (time) => {
    const elapsed = previousTime ? Math.min((time - previousTime) / 1000, .04) : 0;
    previousTime = time;
    if (!hovered && !focused && !touchPaused) {
      bodies.forEach((body) => {
        body.x += body.vx * elapsed;
        body.y += body.vy * elapsed;
        constrain(body);
      });
      resolveOverlaps();
      paint();
    }
    drawDots();
    frame = requestAnimationFrame(animate);
  };
  const updateMotion = () => {
    cancelAnimationFrame(frame);
    previousTime = 0;
    if (reduceMotion.matches) { pointer.active = false; drawDots(true); }
    if (visible && !document.hidden && !dialog.open && !reduceMotion.matches) frame = requestAnimationFrame(animate);
  };
  reduceMotion.addEventListener("change", updateMotion);
  document.addEventListener("visibilitychange", updateMotion);
  document.addEventListener("portfolio:modalchange", updateMotion);
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(field);
  else window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateMotion();
    }).observe(field);
  }
  resize();
  updateMotion();
}

function renderProfile() {
  const careerList = document.querySelector("[data-profile-career]");
  const toolkit = document.querySelector("[data-profile-toolkit]");
  if (!careerList || !toolkit) return;
  const responsibilities = (entry) => `<p class="career-description">${escapeHTML(entry.description)}</p><ul class="career-tags" aria-label="Responsibilities">${(entry.tags || []).map((tag) => `<li>${escapeHTML(tag)}</li>`).join("")}</ul>`;
  careerList.innerHTML = profile.career.map((entry) => {
    if (entry.roles?.length) {
      return `<li class="career-entry career-entry--group reveal"><p class="career-period">${escapeHTML(entry.period)}</p><h4 class="career-studio">${escapeHTML(entry.studio)}</h4><ol class="career-roles" aria-label="Roles at ${escapeHTML(entry.studio)}">${entry.roles.map((role) => `<li class="career-role"><p class="career-period">${escapeHTML(role.period)}</p><h5>${escapeHTML(role.role)}</h5>${responsibilities(role)}</li>`).join("")}</ol></li>`;
    }
    return `<li class="career-entry reveal"><p class="career-period">${escapeHTML(entry.period)}</p><h4>${escapeHTML(entry.role)}</h4><p class="career-studio">${escapeHTML(entry.studio)}</p>${responsibilities(entry)}</li>`;
  }).join("");
  renderFloatingToolkit(toolkit, profile.tools);
}

renderProfile();
initHeroTitleAlignment();
syncLocation();
