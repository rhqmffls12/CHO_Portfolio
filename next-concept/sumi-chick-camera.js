import { MathUtils, OrthographicCamera } from './assets/vendor/three-r186/three.module.min.js';

// Translate along the virtual ground as the document scrolls. Parallel projection
// gives every world point exactly the same CSS-pixel scroll delta, without dolly zoom.
export function createPageCamera(width, height, initialScrollY) {
  const elevation = MathUtils.degToRad(30);
  const aspect = width / height;
  const referenceDistance = aspect < 1 ? 15 / Math.max(aspect, .45) * .62 + 6.3 : 15;
  const unitsPerPixel = 2 * Math.tan(MathUtils.degToRad(15)) * referenceDistance / height;
  const groundUnitsPerPixel = unitsPerPixel / Math.sin(elevation);
  const camera = new OrthographicCamera(-1, 1, 1, -1, .05, 60);
  let currentScrollY = initialScrollY;
  let distance = referenceDistance;

  function place() {
    const groundZ = (currentScrollY - initialScrollY) * groundUnitsPerPixel;
    camera.position.set(0, .28 + Math.sin(elevation) * distance, groundZ + Math.cos(elevation) * distance);
    camera.lookAt(0, .28, groundZ);
    camera.updateMatrixWorld(true);
  }

  function resize(nextWidth, nextHeight) {
    const halfHeight = nextHeight * unitsPerPixel / 2;
    const halfWidth = nextWidth * unitsPerPixel / 2;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    // Keep the whole ground plane visible even in unusually tall browser windows.
    distance = Math.max(referenceDistance, halfHeight / Math.tan(elevation) + 3);
    camera.far = Math.max(60, distance * 4);
    camera.updateProjectionMatrix();
    place();
  }

  function scrollTo(scrollY) {
    const delta = (scrollY - currentScrollY) * groundUnitsPerPixel;
    currentScrollY = scrollY;
    place();
    return delta;
  }

  resize(width, height);
  return { camera, resize, scrollTo };
}
