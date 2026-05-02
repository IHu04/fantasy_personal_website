function lerp(a, b, t) { return a + (b - a) * t; }

function rand(min, max) { return min + Math.random() * (max - min); }

function pulse(t) {
  return Math.sin(t * 1.1) + Math.sin(t * 2.3) * 0.4;
}

const PARTICLE_COUNT = 55;
const WISP_COUNT     = 7;

// ── Cloud wisp ───────────────────────────────────────────────
class CloudWisp {
  x = 0; y = 0;
  halfW = 80; halfH = 18;
  speed = 0.12;
  alpha = 0.06;

  // scatter=true  → place anywhere across the canvas width (initial fill)
  // scatter=false → spawn just off the left edge (wrap respawn)
  reset(w, h, scatter = false) {
    this.halfW = rand(40, 100);    // half of 80–200px width
    this.halfH = rand(9, 20);      // half of 18–40px height
    this.speed = rand(0.08, 0.20);
    this.alpha = rand(0.13, 0.26);
    this.y     = h * (0.15 + Math.random() * 0.70); // middle 70%
    this.x     = scatter
      ? rand(-this.halfW, w + this.halfW)
      : -this.halfW;
  }
}

class Ember {
  x = 0; y = 0;
  vx = 0; vy = 0;
  size = 1;
  life = 0;
  maxLife = 180;

  reset(cx, cy, spawnR) {
    const angle = Math.random() * Math.PI * 2;
    const r     = Math.random() * spawnR;
    this.x       = cx + Math.cos(angle) * r;
    this.y       = cy + Math.sin(angle) * r;
    this.vx      = rand(-0.30,  0.30);
    this.vy      = rand(-0.80, -0.25);
    this.size    = rand(0.4, 2.2);
    this.maxLife = Math.floor(rand(120, 260));
    this.life    = 0;
  }

  // Scatter life so all particles don't expire simultaneously on first load
  resetScattered(cx, cy, spawnR) {
    this.reset(cx, cy, spawnR);
    this.life = Math.floor(Math.random() * this.maxLife);
  }

  alpha() {
    const p = this.life / this.maxLife;
    if (p < 0.20) return p / 0.20;
    if (p > 0.70) return (1 - p) / 0.30;
    return 1;
  }
}

export class ErdtreeGlow {
  #canvas;
  #ctx;
  #mapViewport;
  #nx;
  #ny;
  #particles = [];
  #wisps     = [];
  #onResize;

  /**
   * @param {HTMLCanvasElement} canvasEl
   * @param {{ nx?: number, ny?: number, mapViewport?: HTMLElement }} opts  Normalized map position (0–1).
   */
  constructor(canvasEl, { nx = 0.5, ny = 0.48, mapViewport = null } = {}) {
    this.#canvas = canvasEl;
    this.#ctx    = canvasEl.getContext('2d');
    this.#mapViewport = mapViewport;
    this.#nx     = nx;
    this.#ny     = ny;

    this.#onResize = this.#resize.bind(this);
    this.#resize();
    window.addEventListener('resize', this.#onResize);
  }

  // Driven by MapParallax — no own RAF loop.
  // offsetX/offsetY are the current parallax translate (in px). Glow + embers
  // ride that offset; wisps stay anchored to the viewport as a foreground layer.
  tick(offsetX = 0, offsetY = 0) {
    const t   = performance.now() / 1000;
    const ctx = this.#ctx;
    const w   = this.#canvas.width;
    const h   = this.#canvas.height;

    const { cx, cy, worldWidth } = this.#getMapPoint(w, h);
    const spawnR = worldWidth * 0.025;
    if (this.#particles.length === 0 || this.#wisps.length === 0) {
      this.#initParticles();
    }

    const pn         = (pulse(t) + 1.4) / 2.8;
    const outerAlpha = lerp(0.18, 0.36, pn);
    const coreAlpha  = lerp(0.35, 0.55, pn);
    const outerR     = w * 0.28;
    const coreR      = w * 0.04;

    ctx.clearRect(0, 0, w, h);

    // ═══ Parallax-tracking layer (glow + embers) ═══════════════
    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Outer bloom
    ctx.globalCompositeOperation = 'source-over';
    const outerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
    outerGrad.addColorStop(0.00, `rgba(255,220,80,${outerAlpha.toFixed(3)})`);
    outerGrad.addColorStop(0.45, `rgba(255,220,80,${(outerAlpha * 0.30).toFixed(3)})`);
    outerGrad.addColorStop(1.00, `rgba(255,220,80,0)`);
    ctx.fillStyle = outerGrad;
    ctx.fillRect(-offsetX, -offsetY, w, h);

    // Inner core (additive)
    ctx.globalCompositeOperation = 'lighter';
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    coreGrad.addColorStop(0.00, `rgba(255,240,140,${coreAlpha.toFixed(3)})`);
    coreGrad.addColorStop(0.50, `rgba(255,240,140,${(coreAlpha * 0.35).toFixed(3)})`);
    coreGrad.addColorStop(1.00, `rgba(255,240,140,0)`);
    ctx.fillStyle = coreGrad;
    ctx.fillRect(-offsetX, -offsetY, w, h);

    // Embers
    ctx.globalCompositeOperation = 'source-over';
    for (const p of this.#particles) {
      p.life++;
      if (p.life >= p.maxLife) {
        p.reset(cx, cy, spawnR);
        continue;
      }

      const wobble = Math.sin(t + p.y * 0.05) * 0.08;
      p.x += p.vx + wobble;
      p.y += p.vy;

      ctx.globalAlpha = p.alpha();
      ctx.fillStyle   = 'rgba(240,210,80,1)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ═══ Foreground atmospheric layer (wisps) ═══════════════════
    // Use ctx.filter blur so a solid ellipse fades naturally to transparent
    // at the edges — bypasses any non-uniform-scale gradient quirks.
    for (const wisp of this.#wisps) {
      wisp.x += wisp.speed;
      if (wisp.x - wisp.halfW > w) wisp.reset(w, h, false);

      ctx.save();
      ctx.filter   = `blur(${(wisp.halfH * 0.7).toFixed(1)}px)`;
      ctx.fillStyle = `rgba(200,195,180,${(wisp.alpha * 1.4).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(
        wisp.x, wisp.y,
        wisp.halfW * 0.65, wisp.halfH * 0.55,
        0, 0, Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  }

  destroy() {
    window.removeEventListener('resize', this.#onResize);
  }

  #resize() {
    this.#canvas.width  = window.innerWidth;
    this.#canvas.height = window.innerHeight;
    this.#particles = [];
    this.#wisps = [];
  }

  #initParticles() {
    const w      = this.#canvas.width;
    const h      = this.#canvas.height;
    const { cx, cy, worldWidth } = this.#getMapPoint(w, h);
    const spawnR = worldWidth * 0.025;

    this.#particles = Array.from({ length: PARTICLE_COUNT }, () => {
      const p = new Ember();
      p.resetScattered(cx, cy, spawnR);
      return p;
    });

    this.#wisps = Array.from({ length: WISP_COUNT }, () => {
      const wisp = new CloudWisp();
      wisp.reset(w, h, true); // scatter across full width on init
      return wisp;
    });
  }

  #getMapPoint(viewportWidth, viewportHeight) {
    const styles = this.#mapViewport ? getComputedStyle(this.#mapViewport) : null;
    const worldWidth = parseFloat(styles?.getPropertyValue('--map-world-width')) || viewportWidth;
    const worldHeight = parseFloat(styles?.getPropertyValue('--map-world-height')) || viewportHeight;

    return {
      worldWidth,
      worldHeight,
      cx: viewportWidth * 0.5 + (this.#nx - 0.5) * worldWidth,
      cy: viewportHeight * 0.5 + (this.#ny - 0.5) * worldHeight,
    };
  }
}
