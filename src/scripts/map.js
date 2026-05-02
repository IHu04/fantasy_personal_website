import { MapParallax } from './MapParallax.js';
import { ErdtreeGlow  } from './ErdtreeGlow.js';
import { MapZoomController } from './MapZoomController.js';
import { createRegionScenes } from './regionScenes.js';
import { initRegionMarkers, regions } from './regions.js';

const CLICK_MOVE_THRESHOLD = 7;
const CLICK_TIME_THRESHOLD = 360;

export function initMap(sceneManager, { emitDust } = {}) {
  const app        = document.getElementById('app');
  const img        = document.getElementById('map-img');
  const layer      = document.getElementById('map-layer');
  const mapViewport = document.getElementById('map-viewport');
  const glowCanvas = document.getElementById('glow-canvas');
  const ambientCanvas = document.getElementById('bg-canvas');
  const markerLayer = initRegionMarkers(mapViewport);

  // Fade in map image once loaded
  const reveal = () => { img.style.opacity = '1'; };
  img.addEventListener('load', reveal);
  img.addEventListener('error', () => {
    console.warn('[map] world-map.png not found — place it at /public/assets/map/world-map.png');
  });
  if (img.complete && img.naturalWidth > 0) reveal();

  // Erdtree glow — nudged right and down to sit over the hole in the water
  const glow = new ErdtreeGlow(glowCanvas, { nx: 0.508, ny: 0.535, mapViewport });
  const regionScenes = createRegionScenes(regions);
  const zoom = new MapZoomController({
    app,
    mapViewport,
    mapLayer: layer,
    markerLayer,
    glowCanvas,
    ambientCanvas,
    regions,
    regionScenes,
    sceneManager,
  });

  initMapDust(mapViewport, zoom, emitDust);

  new MapParallax(layer, { viewport: mapViewport })
    .addTickListener((x, y) => {
      const offset = zoom.tick(x, y);
      glow.tick(offset.x, offset.y);
    })
    .start();
}

function initMapDust(mapViewport, zoom, emitDust) {
  if (!emitDust) return;

  let pointerStart = null;

  mapViewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    if (event.target.closest('.region-marker, .return-button, .tablet-reader')) return;
    if (zoom.isParallaxSuppressed) return;

    pointerStart = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      pointerId: event.pointerId,
    };
  });

  mapViewport.addEventListener('pointerup', (event) => {
    if (!pointerStart || pointerStart.pointerId !== event.pointerId) return;

    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    const distance = Math.hypot(dx, dy);
    const duration = performance.now() - pointerStart.time;
    const isQuickClick = distance <= CLICK_MOVE_THRESHOLD && duration <= CLICK_TIME_THRESHOLD;
    pointerStart = null;

    if (!isQuickClick || zoom.isParallaxSuppressed) return;

    emitDust(event.clientX, event.clientY);
  });

  mapViewport.addEventListener('pointercancel', () => {
    pointerStart = null;
  });
}
