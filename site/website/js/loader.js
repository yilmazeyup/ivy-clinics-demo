// The loader builds the Pure Clinics wordmark out of small squares that settle into place, then hands over to the
// crisp letters (after Lama Lama's intro, Site of the Month July 2026).
import { logoSvg } from './logo.js';

export async function buildLogoFromSquares(holder, { duration = 1300 } = {}) {
  const width = holder.clientWidth;
  const height = Math.round((width * 78) / 1206.8);
  const dpr = Math.min(devicePixelRatio, 2);
  const cell = Math.max(3, Math.round(width / 150));

  // Draw the letters once, off screen, to learn which cells they cover.
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg().replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" `))}`;
  await img.decode();
  const probe = document.createElement('canvas');
  probe.width = width;
  probe.height = height;
  const pctx = probe.getContext('2d');
  pctx.drawImage(img, 0, 0, width, height);
  const px = pctx.getImageData(0, 0, width, height).data;
  const squares = [];
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      const i = ((Math.min(height - 1, y + (cell >> 1)) * width + Math.min(width - 1, x + (cell >> 1))) << 2) + 3;
      if (px[i] > 110) squares.push({ x, y, at: Math.random() * 0.75 + (x / width) * 0.2 });
    }
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'loader-squares';
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  holder.prepend(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const color = getComputedStyle(holder).color;
  const t0 = performance.now();

  await new Promise((resolve) => {
    const step = (now) => {
      const t = (now - t0) / duration;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      for (const s of squares) {
        const k = Math.min(1, Math.max(0, (t - s.at) / 0.22));
        if (k <= 0) continue;
        const e = 1 - Math.pow(1 - k, 3);
        const size = cell * e * 0.92;
        ctx.globalAlpha = e;
        ctx.fillRect(s.x + (cell - size) / 2, s.y + (cell - size) / 2 - (1 - e) * cell * 2, size, size);
      }
      if (t < 1.05) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
  holder.classList.add('crisp');
}
