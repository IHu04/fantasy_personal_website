import * as THREE from 'three';

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1536;
const FRAME_INSET = 40;
const MAX_TEXT_WIDTH = CANVAS_WIDTH * 0.8;

export class ContentTablet extends THREE.Mesh {
  constructor({
    title,
    body,
    metadata = null,
    width = 2,
    height = 3,
    depth = 0.3,
  }) {
    const frontTexture = createTabletTexture({ title, body, metadata });
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x6d6a5f,
      roughness: 0.96,
      metalness: 0.02,
    });
    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTexture,
      roughness: 0.92,
      metalness: 0,
    });

    super(
      new THREE.BoxGeometry(width, height, depth),
      [stoneMaterial, stoneMaterial, stoneMaterial, stoneMaterial, frontMaterial, stoneMaterial]
    );
  }
}

function createTabletTexture({ title, body, metadata }) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext('2d');
  drawStoneNoise(ctx);
  drawFrame(ctx);
  drawText(ctx, { title, body, metadata });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function drawStoneNoise(ctx) {
  const base = { r: 91, g: 88, b: 78 };
  const image = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let i = 0; i < image.data.length; i += 4) {
    const noise = 0.72 + Math.random() * 0.42;
    const grain = Math.random() > 0.985 ? 22 : 0;
    image.data[i] = Math.min(255, base.r * noise + grain);
    image.data[i + 1] = Math.min(255, base.g * noise + grain);
    image.data[i + 2] = Math.min(255, base.b * noise + grain);
    image.data[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  ctx.fillStyle = 'rgba(28, 25, 20, 0.24)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawFrame(ctx) {
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.56)';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    FRAME_INSET,
    FRAME_INSET,
    CANVAS_WIDTH - FRAME_INSET * 2,
    CANVAS_HEIGHT - FRAME_INSET * 2
  );
}

function drawText(ctx, { title, body, metadata }) {
  const centerX = CANVAS_WIDTH / 2;
  let y = 154;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#c9a84c';
  ctx.font = '64px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(title, centerX, y);
  y += 104;

  if (metadata) {
    ctx.fillStyle = 'rgba(201, 168, 76, 0.74)';
    ctx.font = 'italic 24px "Cormorant Garamond", Georgia, serif';
    for (const line of normalizeMetadata(metadata)) {
      ctx.fillText(line, centerX, y);
      y += 38;
    }
    y += 26;
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#d4c8a8';
  ctx.font = '18px "Cormorant Garamond", Georgia, serif';
  const lineHeight = 18 * 1.7;
  const x = (CANVAS_WIDTH - MAX_TEXT_WIDTH) / 2;
  y = Math.max(y, 324);

  for (const paragraph of body.split('\n')) {
    if (!paragraph.trim()) {
      y += lineHeight;
      continue;
    }

    for (const line of wrapText(ctx, paragraph, MAX_TEXT_WIDTH)) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
    y += lineHeight * 0.7;
  }
}

function normalizeMetadata(metadata) {
  if (Array.isArray(metadata)) return metadata;
  if (typeof metadata === 'string') return [metadata];
  return Object.entries(metadata).map(([key, value]) => `${key}: ${value}`);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line);
  return lines;
}
