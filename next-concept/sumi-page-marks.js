// Settled elemental marks (scorch, lightning burn, frost) stamped onto the page itself, the way the
// garden's flowers are placed: absolutely positioned images in document coordinates. Once stamped
// a mark costs nothing per frame; the browser scrolls it with the content. sumi-element-fx.js plays
// each mark's hot birth in WebGL and hands it over here when it settles.
export function createPageMarks() {
  const layer = document.createElement('div');
  layer.className = 'sumi-mark-layer';
  layer.setAttribute('aria-hidden', 'true');
  // Clipped to the host's width and scroll height, so a mark at an edge never adds scrolling.
  Object.assign(layer.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '0', overflow: 'hidden', zIndex: '13', pointerEvents: 'none' });
  // The host is the page (body) or an open project dialog, which scrolls its own content; stamps
  // are positioned in the host's scrolled content, so they move with it.
  let host = document.body;
  host.append(layer);
  let count = 0, fading = false;
  function clear() {
    fading = false;
    layer.replaceChildren();
    count = 0;
    layer.style.transition = 'none';
    layer.style.opacity = '1';
    layer.style.height = '0';
  }

  return {
    get count() { return count; },
    setHost(el) {
      if (el === host) return;
      clear();
      host = el;
      host.append(layer);
    },
    // where a viewport point lands in the host's scrolled content
    offset() {
      if (host === document.body) return { x: window.scrollX, y: window.scrollY };
      const r = host.getBoundingClientRect();
      return { x: host.scrollLeft - r.left - host.clientLeft, y: host.scrollTop - r.top - host.clientTop };
    },
    // url: a baked stamp image; x, y: px of the centre in the host's content; size: px of the
    // square image; matrix: [a, b, c, d] turn and foreshortening, as in CSS matrix()
    stamp(url, x, y, size, [a, b, c, d]) {
      const height = host === document.body ? document.documentElement.scrollHeight : host.scrollHeight;
      if (parseFloat(layer.style.height) < height) layer.style.height = `${height}px`;
      const el = document.createElement('i');
      el.className = 'sumi-mark';
      Object.assign(el.style, {
        left: `${(x - size / 2).toFixed(1)}px`, top: `${(y - size / 2).toFixed(1)}px`,
        width: `${size.toFixed(1)}px`, height: `${size.toFixed(1)}px`,
        backgroundImage: `url(${url})`,
        transform: `matrix(${a.toFixed(4)}, ${b.toFixed(4)}, ${c.toFixed(4)}, ${d.toFixed(4)}, 0, 0)`,
      });
      layer.append(el);
      count++;
    },
    // all marks fade together (one composited layer); the caller clears them when its fade ends
    fadeOut(seconds) {
      if (!count || fading) return;
      fading = true;
      layer.style.transition = `opacity ${seconds}s ease`;
      layer.style.opacity = '0';
    },
    clear,
    setVisible(value) { layer.style.display = value ? '' : 'none'; },
    dispose() { layer.remove(); },
  };
}
