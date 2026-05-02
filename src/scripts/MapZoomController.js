const ZOOM_SCALE = 2.6;
const ZOOM_IN_MS = 1500;
const ZOOM_OUT_MS = 1650;
const ZOOM_TO_FLASH_MS = 620;
const FLASH_IN_MS = 420;
const FLASH_HOLD_MS = 520;
const FLASH_CLEAR_MS = 420;
const RETURN_IN_MS = 460;
const RETURN_HOLD_MS = 280;
const RETURN_CLEAR_MS = 620;
const PARALLAX_RESUME_MS = 720;

const settled = (current, target) => Math.abs(current - target) < 0.35;
const easeInOutCubic = (value) => (
  value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
);

export class MapZoomController {
  #app;
  #mapViewport;
  #mapLayer;
  #markerLayer;
  #glowCanvas;
  #ambientCanvas;
  #returnButton;
  #regions;
  #regionScenes;
  #sceneManager;
  #state = 'map';
  #flashTriggered = false;
  #activeScene = null;
  #current = { x: 0, y: 0, scale: 1 };
  #target = { x: 0, y: 0, scale: 1 };
  #start = { x: 0, y: 0, scale: 1 };
  #motion = null;
  #returnGlowFadeStart = null;
  #parallaxResumeStart = null;
  #timers = new Set();

  constructor({
    app,
    mapViewport,
    mapLayer,
    markerLayer,
    glowCanvas,
    ambientCanvas,
    regions,
    regionScenes,
    sceneManager,
  }) {
    this.#app = app;
    this.#mapViewport = mapViewport;
    this.#mapLayer = mapLayer;
    this.#markerLayer = markerLayer;
    this.#glowCanvas = glowCanvas;
    this.#ambientCanvas = ambientCanvas;
    this.#regions = regions;
    this.#regionScenes = regionScenes;
    this.#sceneManager = sceneManager;
    this.#returnButton = this.#createReturnButton();
    this.#bindMarkers();
  }

  get isParallaxSuppressed() {
    return this.#state !== 'map';
  }

  tick(parallaxX, parallaxY) {
    if (this.#state === 'map') {
      const blend = this.#getParallaxBlend();
      const effectiveX = parallaxX * blend;
      const effectiveY = parallaxY * blend;
      this.#current.x = effectiveX;
      this.#current.y = effectiveY;
      this.#current.scale = 1;
      this.#applyTransform(effectiveX, effectiveY, 1, 0, 0, 1);
      return { x: effectiveX, y: effectiveY };
    }

    this.#updateMotion();

    this.#applyTransform(this.#current.x, this.#current.y, this.#current.scale);
    this.#updateReturnGlowFade();

    if (
      this.#state === 'zooming-out' &&
      (!this.#motion || this.#motion.done) &&
      settled(this.#current.x, this.#target.x) &&
      settled(this.#current.y, this.#target.y) &&
      Math.abs(this.#current.scale - this.#target.scale) < 0.01
    ) {
      this.#finishReturn();
    }

    return { x: 0, y: 0 };
  }

  #bindMarkers() {
    const markers = this.#markerLayer.querySelectorAll('.region-marker');
    markers.forEach((marker) => {
      marker.addEventListener('click', () => {
        const index = Number(marker.dataset.regionIndex);
        const region = this.#regions[index];
        if (!region || this.#state !== 'map') return;
        this.#zoomToRegion(region, marker, index);
      });
    });
  }

  #zoomToRegion(region, marker, index) {
    const width = this.#mapLayer.offsetWidth || window.innerWidth;
    const height = this.#mapLayer.offsetHeight || window.innerHeight;
    this.#clearTimers();
    this.#parallaxResumeStart = null;
    this.#state = 'zooming-in';
    this.#flashTriggered = false;
    this.#activeScene = this.#regionScenes[index] ?? null;
    this.#start = { ...this.#current };
    this.#target = {
      x: (0.5 - region.px) * width * ZOOM_SCALE,
      y: (0.5 - region.py) * height * ZOOM_SCALE,
      scale: ZOOM_SCALE,
    };
    this.#beginMotion(this.#target, ZOOM_IN_MS);

    this.#mapViewport.style.opacity = '1';
    this.#glowCanvas.style.opacity = '1';
    this.#ambientCanvas.style.opacity = '1';
    this.#sceneManager.setScene(null);
    this.#returnButton.hidden = true;

    this.#app.classList.add('is-region-zooming');
    this.#app.classList.remove('is-3d-scene', 'is-grace-flashing', 'is-map-returning', 'is-scene-handoff');
    this.#markerLayer.querySelectorAll('.region-marker').forEach((item) => {
      item.classList.toggle('is-active', item === marker);
    });

    this.#queue(() => {
      if (this.#state === 'zooming-in' && !this.#flashTriggered) {
        this.#triggerGraceTransition();
      }
    }, ZOOM_TO_FLASH_MS);
  }

  #triggerGraceTransition() {
    this.#flashTriggered = true;
    this.#state = 'handoff-in';
    this.#app.classList.add('is-grace-flashing', 'is-scene-handoff');
    this.#queue(() => {
      if (this.#state === 'scene') {
        this.#app.classList.remove('is-grace-flashing', 'is-scene-handoff');
      }
    }, FLASH_IN_MS + FLASH_HOLD_MS + FLASH_CLEAR_MS + 240);

    this.#queuePainted(() => {
      this.#state = 'scene';
      this.#current = { ...this.#target };
      this.#motion = null;
      this.#mapViewport.style.opacity = '0';
      this.#glowCanvas.style.opacity = '0';
      this.#ambientCanvas.style.opacity = '0';
      this.#markerLayer.style.opacity = '0';
      this.#sceneManager.setScene(this.#activeScene);
      this.#returnButton.hidden = false;
      this.#app.classList.add('is-3d-scene');

      this.#queue(() => {
        this.#app.classList.remove('is-grace-flashing');
        this.#queue(() => {
          this.#app.classList.remove('is-scene-handoff');
        }, FLASH_CLEAR_MS);
      }, FLASH_HOLD_MS);
    }, FLASH_IN_MS);
  }

  #returnToMap() {
    if (this.#state !== 'scene') return;

    this.#clearTimers();
    this.#state = 'handoff-out';
    this.#flashTriggered = false;
    this.#start = { ...this.#current };
    this.#target = { x: 0, y: 0, scale: 1 };
    this.#returnGlowFadeStart = null;

    this.#app.classList.remove('is-grace-flashing');
    this.#app.classList.add('is-map-returning', 'is-scene-handoff');
    this.#returnButton.hidden = true;
    this.#queue(() => {
      if (this.#state === 'map') {
        this.#app.classList.remove('is-map-returning', 'is-scene-handoff', 'is-grace-flashing');
      }
    }, RETURN_IN_MS + RETURN_HOLD_MS + RETURN_CLEAR_MS + 240);

    this.#queuePainted(() => {
      this.#state = 'zooming-out';
      this.#beginMotion(this.#target, ZOOM_OUT_MS);
      this.#returnGlowFadeStart = performance.now();
      this.#mapViewport.style.opacity = '1';
      this.#glowCanvas.style.opacity = '0';
      this.#ambientCanvas.style.opacity = '1';
      this.#markerLayer.style.opacity = '1';
      this.#sceneManager.setScene(null);
      this.#app.classList.remove('is-3d-scene', 'is-grace-flashing');

      this.#queuePainted(() => {
        this.#app.classList.remove('is-map-returning');
        this.#queue(() => {
          this.#app.classList.remove('is-scene-handoff');
        }, RETURN_CLEAR_MS);
      }, RETURN_HOLD_MS);
    }, RETURN_IN_MS);
  }

  #finishReturn() {
    this.#state = 'map';
    this.#activeScene = null;
    this.#current = { x: 0, y: 0, scale: 1 };
    this.#target = { x: 0, y: 0, scale: 1 };
    this.#motion = null;
    this.#returnGlowFadeStart = null;
    this.#parallaxResumeStart = performance.now();
    this.#app.classList.remove(
      'is-region-zooming',
      'is-3d-scene',
      'is-map-returning',
      'is-grace-flashing',
      'is-scene-handoff'
    );
    this.#markerLayer.querySelectorAll('.region-marker').forEach((item) => {
      item.classList.remove('is-active');
    });
    this.#applyTransform(0, 0, 1, 0, 0, 1);
    this.#glowCanvas.style.opacity = '1';
    this.#ambientCanvas.style.opacity = '1';
  }

  #getProgress() {
    const scaleDistance = Math.abs(this.#target.scale - this.#start.scale) || 1;
    const xDistance = Math.abs(this.#target.x - this.#start.x) || 1;
    const yDistance = Math.abs(this.#target.y - this.#start.y) || 1;
    const scaleProgress = 1 - Math.abs(this.#target.scale - this.#current.scale) / scaleDistance;
    const xProgress = 1 - Math.abs(this.#target.x - this.#current.x) / xDistance;
    const yProgress = 1 - Math.abs(this.#target.y - this.#current.y) / yDistance;

    return Math.max(0, Math.min(1, Math.min(scaleProgress, xProgress, yProgress)));
  }

  #applyTransform(x, y, scale, glowX = x, glowY = y, glowScale = scale) {
    const mapTransform = [
      'translate(-50%, -50%)',
      `translate(${x.toFixed(3)}px, ${y.toFixed(3)}px)`,
      `scale(${scale.toFixed(4)})`,
    ].join(' ');
    const glowTransform = [
      `translate(${glowX.toFixed(3)}px, ${glowY.toFixed(3)}px)`,
      `scale(${glowScale.toFixed(4)})`,
    ].join(' ');

    this.#mapLayer.style.transform = mapTransform;
    this.#markerLayer.style.transform = mapTransform;
    this.#glowCanvas.style.transform = glowTransform;
  }

  #beginMotion(target, duration) {
    this.#motion = {
      from: { ...this.#current },
      to: { ...target },
      startTime: performance.now(),
      duration,
      done: false,
    };
  }

  #updateMotion() {
    if (!this.#motion) return;

    const rawProgress = Math.min(1, (performance.now() - this.#motion.startTime) / this.#motion.duration);
    const progress = easeInOutCubic(rawProgress);
    this.#current.x = this.#motion.from.x + (this.#motion.to.x - this.#motion.from.x) * progress;
    this.#current.y = this.#motion.from.y + (this.#motion.to.y - this.#motion.from.y) * progress;
    this.#current.scale = this.#motion.from.scale + (this.#motion.to.scale - this.#motion.from.scale) * progress;

    if (rawProgress >= 1) {
      this.#current = { ...this.#motion.to };
      this.#motion.done = true;
    }
  }

  #updateReturnGlowFade() {
    if (this.#state !== 'zooming-out' || this.#returnGlowFadeStart === null) return;

    const progress = Math.min(1, (performance.now() - this.#returnGlowFadeStart) / ZOOM_OUT_MS);
    const eased = easeInOutCubic(progress);
    const scaleProgress = 1 - Math.max(0, this.#current.scale - 1) / (ZOOM_SCALE - 1);
    const opacity = Math.max(0, Math.min(1, eased * scaleProgress));
    this.#glowCanvas.style.opacity = opacity.toFixed(3);
  }

  #getParallaxBlend() {
    if (this.#parallaxResumeStart === null) return 1;

    const rawProgress = Math.min(1, (performance.now() - this.#parallaxResumeStart) / PARALLAX_RESUME_MS);
    if (rawProgress >= 1) {
      this.#parallaxResumeStart = null;
      return 1;
    }

    return easeInOutCubic(rawProgress);
  }

  #queue(callback, delay) {
    const timer = window.setTimeout(() => {
      this.#timers.delete(timer);
      callback();
    }, delay);
    this.#timers.add(timer);
  }

  #queuePainted(callback, delay) {
    this.#queue(() => {
      let hasRun = false;
      const run = () => {
        if (hasRun) return;
        hasRun = true;
        window.clearTimeout(fallbackTimer);
        this.#timers.delete(fallbackTimer);
        callback();
      };
      const fallbackTimer = window.setTimeout(run, 96);
      this.#timers.add(fallbackTimer);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(run);
      });
    }, delay);
  }

  #clearTimers() {
    for (const timer of this.#timers) {
      window.clearTimeout(timer);
    }
    this.#timers.clear();
  }

  #createReturnButton() {
    const button = document.createElement('button');
    button.className = 'return-button';
    button.type = 'button';
    button.hidden = true;
    button.textContent = '← Return';
    button.addEventListener('click', () => this.#returnToMap());
    this.#app.append(button);
    return button;
  }
}
