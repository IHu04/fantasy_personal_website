const GOLD = { r: 201, g: 168, b: 76 };

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(c, a) {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset(true);
  }

  reset(initial = false) {
    const { width, height } = this.canvas;
    this.x = Math.random() * width;
    this.y = initial ? Math.random() * height : height + 4;
    this.size = Math.random() * 1.2 + 0.3;
    this.speed = Math.random() * 0.25 + 0.05;
    this.opacity = Math.random() * 0.5 + 0.1;
    this.drift = (Math.random() - 0.5) * 0.15;
    this.life = 0;
    this.maxLife = Math.random() * 400 + 200;
  }

  update() {
    this.y -= this.speed;
    this.x += this.drift;
    this.life++;
    if (this.y < -4 || this.life > this.maxLife) this.reset();
  }

  draw(ctx) {
    const fade = Math.min(this.life / 60, 1) * Math.min((this.maxLife - this.life) / 60, 1);
    ctx.globalAlpha = this.opacity * fade;
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function initCanvas(canvas, { onFrame } = {}) {
  const ctx = canvas.getContext('2d');
  const particles = [];
  const PARTICLE_COUNT = 80;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function populate() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle(canvas));
    }
  }

  function drawVignette() {
    const grad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.height * 0.25,
      canvas.width / 2, canvas.height / 2, canvas.height * 0.85
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawVignette();
    for (const p of particles) {
      p.update();
      p.draw(ctx);
    }
    ctx.globalAlpha = 1;
    onFrame?.();
    requestAnimationFrame(frame);
  }

  resize();
  populate();
  frame();

  window.addEventListener('resize', () => { resize(); populate(); });
}
