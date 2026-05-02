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

class DustParticle {
  constructor(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.6 + 0.45;
    this.x = x;
    this.y = y;
    this.previousX = x;
    this.previousY = y;
    this.vx = Math.cos(angle) * speed * 0.72;
    this.vy = Math.sin(angle) * speed * 0.38 - Math.random() * 0.72;
    this.size = Math.random() * 0.9 + 0.45;
    this.life = 0;
    this.maxLife = Math.random() * 24 + 18;
    this.warmth = Math.random();
  }

  update() {
    this.life++;
    this.previousX = this.x;
    this.previousY = this.y;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy = this.vy * 0.95 - 0.004;
  }

  get isDead() {
    return this.life >= this.maxLife;
  }

  draw(ctx) {
    const progress = this.life / this.maxLife;
    const fadeIn = Math.min(1, progress / 0.14);
    const fadeOut = Math.max(0, 1 - progress);
    const alpha = fadeIn * fadeOut;
    const color = this.warmth > 0.45
      ? { r: 201, g: 168, b: 76 }
      : { r: 176, g: 151, b: 104 };

    ctx.globalAlpha = alpha * 0.72;
    ctx.strokeStyle = rgba(color, 1);
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.previousX, this.previousY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = rgba(color, 1);
    ctx.fillRect(this.x - this.size * 0.35, this.y - this.size * 0.35, this.size * 0.7, this.size * 0.7);
  }
}

export function initCanvas(canvas, { onFrame } = {}) {
  const ctx = canvas.getContext('2d');
  const particles = [];
  const dustParticles = [];
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
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = dustParticles.length - 1; i >= 0; i--) {
      const dust = dustParticles[i];
      dust.update();
      dust.draw(ctx);
      if (dust.isDead) dustParticles.splice(i, 1);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    onFrame?.();
    requestAnimationFrame(frame);
  }

  function emitDust(x, y) {
    const count = 18 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
      dustParticles.push(new DustParticle(
        x + (Math.random() - 0.5) * 7,
        y + (Math.random() - 0.5) * 5
      ));
    }
    if (dustParticles.length > 180) {
      dustParticles.splice(0, dustParticles.length - 180);
    }
  }

  resize();
  populate();
  frame();

  window.addEventListener('resize', () => { resize(); populate(); });

  return { emitDust };
}
