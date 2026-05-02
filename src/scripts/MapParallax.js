const MAP_ASPECT = 1672 / 941;
const LERP_FACTOR = 0.075;
const MAX_X = 14; // px
const MAX_Y = 10; // px
const MOBILE_BREAKPOINT = 760;
const MOBILE_WORLD_MIN_WIDTH = 1180;
const MOBILE_WORLD_SCALE = 2.2;
const MOBILE_HEIGHT_SCALE = 1.38;
const DESKTOP_WORLD_SCALE = 1.12;
const WIDE_WORLD_SCALE = 1.04;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class MapParallax {
  #viewport;
  #targetX = 0;
  #targetY = 0;
  #currentX = 0;
  #currentY = 0;
  #mouseX = 0;
  #mouseY = 0;
  #panX = 0;
  #panY = 0;
  #panStartX = 0;
  #panStartY = 0;
  #dragStartX = 0;
  #dragStartY = 0;
  #lastClientX = null;
  #lastClientY = null;
  #worldWidth = 0;
  #worldHeight = 0;
  #rafId = null;
  #dragging = false;
  #isCoarsePointer = false;
  #tickListeners = [];
  #onMouseMove;
  #onMouseLeave;
  #onPointerDown;
  #onPointerMove;
  #onPointerUp;
  #onMouseDown;
  #onMouseUp;
  #onTouchStart;
  #onTouchMove;
  #onTouchEnd;
  #onResize;

  constructor(layerEl, { viewport = layerEl.parentElement } = {}) {
    this.#viewport = viewport;
    this.#isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    this.#onMouseMove = this.#handleMouseMove.bind(this);
    this.#onMouseLeave = this.#handleMouseLeave.bind(this);
    this.#onPointerDown = this.#handlePointerDown.bind(this);
    this.#onPointerMove = this.#handlePointerMove.bind(this);
    this.#onPointerUp = this.#handlePointerUp.bind(this);
    this.#onMouseDown = this.#handleMouseDown.bind(this);
    this.#onMouseUp = this.#handleMouseUp.bind(this);
    this.#onTouchStart = this.#handleTouchStart.bind(this);
    this.#onTouchMove = this.#handleTouchMove.bind(this);
    this.#onTouchEnd = this.#handleTouchEnd.bind(this);
    this.#onResize = this.#layoutWorld.bind(this);
  }

  start() {
    this.#layoutWorld();
    window.addEventListener('resize', this.#onResize);
    window.addEventListener('mousemove', this.#onMouseMove);
    window.addEventListener('mouseleave', this.#onMouseLeave);
    this.#viewport.addEventListener('pointerdown', this.#onPointerDown);
    this.#viewport.addEventListener('pointermove', this.#onPointerMove, { passive: false });
    this.#viewport.addEventListener('pointerup', this.#onPointerUp);
    this.#viewport.addEventListener('pointercancel', this.#onPointerUp);
    this.#viewport.addEventListener('mousedown', this.#onMouseDown);
    this.#viewport.addEventListener('touchstart', this.#onTouchStart, { passive: false });
    this.#viewport.addEventListener('touchmove', this.#onTouchMove, { passive: false });
    this.#viewport.addEventListener('touchend', this.#onTouchEnd);
    this.#viewport.addEventListener('touchcancel', this.#onTouchEnd);
    window.addEventListener('pointermove', this.#onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.#onPointerUp);
    window.addEventListener('pointercancel', this.#onPointerUp);
    window.addEventListener('mouseup', this.#onMouseUp);
    this.#tick();
    return this;
  }

  // Register a callback to be invoked on every RAF frame.
  addTickListener(fn) {
    this.#tickListeners.push(fn);
    return this;
  }

  stop() {
    window.removeEventListener('resize', this.#onResize);
    window.removeEventListener('mousemove', this.#onMouseMove);
    window.removeEventListener('mouseleave', this.#onMouseLeave);
    this.#viewport.removeEventListener('pointerdown', this.#onPointerDown);
    this.#viewport.removeEventListener('pointermove', this.#onPointerMove);
    this.#viewport.removeEventListener('pointerup', this.#onPointerUp);
    this.#viewport.removeEventListener('pointercancel', this.#onPointerUp);
    this.#viewport.removeEventListener('mousedown', this.#onMouseDown);
    this.#viewport.removeEventListener('touchstart', this.#onTouchStart);
    this.#viewport.removeEventListener('touchmove', this.#onTouchMove);
    this.#viewport.removeEventListener('touchend', this.#onTouchEnd);
    this.#viewport.removeEventListener('touchcancel', this.#onTouchEnd);
    window.removeEventListener('pointermove', this.#onPointerMove);
    window.removeEventListener('pointerup', this.#onPointerUp);
    window.removeEventListener('pointercancel', this.#onPointerUp);
    window.removeEventListener('mouseup', this.#onMouseUp);
    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  #handleMouseMove(e) {
    if (e.buttons === 1 && !e.target.closest('.region-marker, .return-button, .tablet-reader')) {
      if (!this.#dragging) {
        this.#beginDrag(this.#lastClientX ?? e.clientX, this.#lastClientY ?? e.clientY);
      }
      this.#moveDrag(e.clientX, e.clientY);
      this.#lastClientX = e.clientX;
      this.#lastClientY = e.clientY;
      return;
    }

    if (this.#dragging) {
      this.#moveDrag(e.clientX, e.clientY);
      this.#lastClientX = e.clientX;
      this.#lastClientY = e.clientY;
      return;
    }

    if (this.#isCoarsePointer) return;

    // Normalize to -0.5 .. +0.5 relative to viewport center.
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    this.#mouseX = nx * MAX_X;
    this.#mouseY = ny * MAX_Y;
    this.#lastClientX = e.clientX;
    this.#lastClientY = e.clientY;
    this.#syncTarget();
  }

  #handleMouseLeave() {
    this.#mouseX = 0;
    this.#mouseY = 0;
    this.#syncTarget();
  }

  #handlePointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.region-marker, .return-button, .tablet-reader')) return;

    this.#beginDrag(e.clientX, e.clientY);
    this.#viewport.setPointerCapture?.(e.pointerId);
  }

  #handlePointerMove(e) {
    if (
      !this.#dragging &&
      e.buttons === 1 &&
      !e.target.closest('.region-marker, .return-button, .tablet-reader')
    ) {
      this.#beginDrag(this.#lastClientX ?? e.clientX, this.#lastClientY ?? e.clientY);
    }

    if (!this.#dragging) return;

    e.preventDefault();
    this.#moveDrag(e.clientX, e.clientY);
    this.#lastClientX = e.clientX;
    this.#lastClientY = e.clientY;
  }

  #handlePointerUp(e) {
    if (!this.#dragging) return;

    this.#dragging = false;
    this.#viewport.classList.remove('is-map-dragging');
    this.#viewport.releasePointerCapture?.(e.pointerId);
    this.#syncTarget();
  }

  #handleMouseDown(e) {
    if (this.#dragging || e.button !== 0) return;
    if (e.target.closest('.region-marker, .return-button, .tablet-reader')) return;

    e.preventDefault();
    this.#beginDrag(e.clientX, e.clientY);
  }

  #handleMouseUp() {
    this.#lastClientX = null;
    this.#lastClientY = null;
    this.#endDrag();
  }

  #handleTouchStart(e) {
    if (this.#dragging || e.touches.length !== 1) return;
    if (e.target.closest('.region-marker, .return-button, .tablet-reader')) return;

    const touch = e.touches[0];
    e.preventDefault();
    this.#beginDrag(touch.clientX, touch.clientY);
  }

  #handleTouchMove(e) {
    if (!this.#dragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    e.preventDefault();
    this.#moveDrag(touch.clientX, touch.clientY);
  }

  #handleTouchEnd() {
    this.#endDrag();
  }

  #beginDrag(clientX, clientY) {
    this.#dragging = true;
    this.#mouseX = 0;
    this.#mouseY = 0;
    this.#panStartX = this.#panX;
    this.#panStartY = this.#panY;
    this.#dragStartX = clientX;
    this.#dragStartY = clientY;
    this.#viewport.classList.add('is-map-dragging');
  }

  #moveDrag(clientX, clientY) {
    this.#panX = this.#panStartX + clientX - this.#dragStartX;
    this.#panY = this.#panStartY + clientY - this.#dragStartY;
    this.#clampPan();
    this.#syncTarget();
  }

  #endDrag() {
    if (!this.#dragging) return;

    this.#dragging = false;
    this.#viewport.classList.remove('is-map-dragging');
    this.#syncTarget();
  }

  #layoutWorld() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const coverWidth = Math.max(width, height * MAP_ASPECT);
    const isSmall = width < MOBILE_BREAKPOINT || this.#isCoarsePointer;
    const scale = width >= 1600 ? WIDE_WORLD_SCALE : DESKTOP_WORLD_SCALE;
    const worldWidth = isSmall
      ? Math.max(
        coverWidth * 1.08,
        width * MOBILE_WORLD_SCALE,
        height * MAP_ASPECT * MOBILE_HEIGHT_SCALE,
        MOBILE_WORLD_MIN_WIDTH
      )
      : coverWidth * scale;
    const worldHeight = worldWidth / MAP_ASPECT;

    this.#worldWidth = Math.ceil(worldWidth);
    this.#worldHeight = Math.ceil(worldHeight);
    this.#viewport.style.setProperty('--map-world-width', `${this.#worldWidth}px`);
    this.#viewport.style.setProperty('--map-world-height', `${this.#worldHeight}px`);
    this.#clampPan();
    this.#syncTarget();
  }

  #clampPan() {
    this.#panX = clamp(this.#panX, -this.#maxPanX(), this.#maxPanX());
    this.#panY = clamp(this.#panY, -this.#maxPanY(), this.#maxPanY());
  }

  #syncTarget() {
    this.#targetX = clamp(this.#panX + this.#mouseX, -this.#maxPanX(), this.#maxPanX());
    this.#targetY = clamp(this.#panY + this.#mouseY, -this.#maxPanY(), this.#maxPanY());
  }

  #maxPanX() {
    return Math.max(0, (this.#worldWidth - window.innerWidth) / 2);
  }

  #maxPanY() {
    return Math.max(0, (this.#worldHeight - window.innerHeight) / 2);
  }

  #tick() {
    const factor = this.#dragging ? 0.28 : LERP_FACTOR;
    this.#currentX += (this.#targetX - this.#currentX) * factor;
    this.#currentY += (this.#targetY - this.#currentY) * factor;

    for (const fn of this.#tickListeners) fn(this.#currentX, this.#currentY);

    this.#rafId = requestAnimationFrame(() => this.#tick());
  }
}
