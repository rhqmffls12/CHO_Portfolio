// Start preview media immediately on hover; warm YouTube connections near the grid.
let youtubeAPI;
function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeAPI) return youtubeAPI;
  youtubeAPI = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const timeout = setTimeout(() => reject(new Error("YouTube API timeout")), 15000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      try { previous?.(); } finally { resolve(window.YT); }
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { clearTimeout(timeout); reject(new Error("YouTube API unavailable")); };
    document.head.append(script);
  });
  return youtubeAPI;
}

export function initHoverPreviews({ entries, toRootPath, dialog, reduceMotion }) {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let current = null;
  let serial = 0;
  function stop() {
    const state = current;
    current = null;
    if (!state) return;
    clearTimeout(state.deadline);
    state.button.classList.remove("has-hover-preview");
    state.player?.destroy();
    if (state.video) {
      state.video.pause();
      state.video.removeAttribute("src");
      state.video.load();
    }
    state.layer?.remove();
  }
  const allowed = () => finePointer.matches && !reduceMotion.matches && !document.hidden && !dialog.open;
  async function play(state, entry) {
    if (current !== state || !allowed()) return;
    const layer = document.createElement("span");
    layer.className = "card-hover-preview";
    layer.setAttribute("aria-hidden", "true");
    state.layer = layer;
    state.button.append(layer);
    // Keep the original poster visible until the first playback event.
    const reveal = () => {
      if (current !== state) return;
      clearTimeout(state.deadline);
      state.button.classList.add("has-hover-preview");
    };
    state.deadline = setTimeout(() => { if (current === state) stop(); }, 20000);
    const source = entry.video || (entry.media?.type === "video" && entry.media.src);
    try {
      if (source) {
        const video = document.createElement("video");
        state.video = video;
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.preload = "none";
        video.tabIndex = -1;
        video.src = toRootPath(source);
        video.addEventListener("playing", reveal);
        video.addEventListener("error", () => { if (current === state) stop(); });
        layer.append(video);
        await video.play();
      } else {
        // Begin API and iframe requests in parallel rather than serially.
        const apiReady = loadYouTubeAPI();
        const iframe = document.createElement("iframe");
        iframe.id = `card-preview-${++serial}`;
        iframe.title = `${entry.title} muted preview`;
        iframe.tabIndex = -1;
        iframe.allow = "autoplay; encrypted-media";
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        const params = new URLSearchParams({autoplay:"1", mute:"1", controls:"0", playsinline:"1", enablejsapi:"1", origin:location.origin, rel:"0", disablekb:"1", loop:"1", playlist:entry.media.id, start:String(Number(entry.media.start) || 0)});
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(entry.media.id)}?${params}`;
        layer.append(iframe);
        const YT = await apiReady;
        if (current !== state || !allowed()) return;
        state.player = new YT.Player(iframe.id, {events:{
          onReady: event => {
            if (current !== state) return;
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: event => { if (event.data === YT.PlayerState.PLAYING) reveal(); },
          onError: () => { if (current === state) stop(); }
        }});
      }
    } catch { if (current === state) stop(); }
  }
  const observer = "IntersectionObserver" in window ? new IntersectionObserver(records => {
    if (records.some(record => record.target === current?.button && !record.isIntersecting)) stop();
  }) : null;
  document.querySelectorAll(".work-card-visual[data-open-work]").forEach(button => {
    const entry = entries.find(item => item.id === button.dataset.openWork);
    if (!entry || !(entry.video || entry.media?.type === "video" || entry.media?.type === "youtube")) return;
    button.addEventListener("pointerenter", event => {
      if (event.pointerType !== "mouse" || !allowed()) return;
      stop();
      const state = {button};
      current = state;
      play(state, entry);
    });
    button.addEventListener("pointerleave", () => { if (current?.button === button) stop(); });
    button.addEventListener("pointerdown", stop);
    observer?.observe(button);
  });
  let warmed = false;
  function warmYouTube() {
    if (warmed || !allowed()) return;
    warmed = true;
    for (const origin of ["https://www.youtube.com", "https://www.youtube-nocookie.com", "https://i.ytimg.com", "https://s.ytimg.com"]) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = origin;
      document.head.append(link);
    }
    loadYouTubeAPI().catch(() => {});
  }
  const grid = document.querySelector(".work-section");
  if (grid && "IntersectionObserver" in window) {
    const warmObserver = new IntersectionObserver(records => {
      if (records.some(record => record.isIntersecting) && allowed()) {
        warmYouTube();
        warmObserver.disconnect();
      }
    }, {rootMargin:"600px"});
    warmObserver.observe(grid);
  }
  grid?.addEventListener("pointerenter", warmYouTube);
  document.addEventListener("visibilitychange", stop);
  window.addEventListener("pagehide", stop);
  window.addEventListener("blur", stop);
  reduceMotion.addEventListener("change", stop);
  finePointer.addEventListener("change", stop);
  return stop;
}
