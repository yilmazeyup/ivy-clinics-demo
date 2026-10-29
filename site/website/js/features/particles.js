// While the route is still empty, a cloud of particles drifts in the card. Point at a concern and the particles swirl
// together into its name; they glow warmer the faster they fly (after Igloo Inc, Webby 2026 Best Visual Design).
import { $, onFrame, REDUCED } from '../core.js';

export function startParticles(list, names) {
  const canvas = $('#route-particles');
  const card = $('#route-empty');
  if (!canvas || REDUCED) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio, 2);
  const N = 700;
  let w = 0;
  let h = 0;
  const ps = Array.from({ length: N }, () => ({ x: 0, y: 0, vx: 0, vy: 0, tx: null, ty: null }));
  let seeded = false;
  const cache = new Map();

  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cache.clear();
  };
  resize();
  addEventListener('resize', resize);

  // Points inside the letters of a word, drawn once off screen.
  function shapeOf(word) {
    if (cache.has(word)) return cache.get(word);
    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(w));
    off.height = Math.max(1, Math.round(h));
    const o = off.getContext('2d');
    let size = Math.min(h * 0.42, 96);
    o.font = `italic ${size}px "Instrument Serif", Georgia, serif`;
    // Two lines when the name is long.
    const parts = word.split(' ');
    let lines = [word];
    if (o.measureText(word).width > w * 0.92 && parts.length > 1) {
      const half = Math.ceil(parts.length / 2);
      lines = [parts.slice(0, half).join(' '), parts.slice(half).join(' ')];
    }
    while (Math.max(...lines.map((l) => o.measureText(l).width)) > w * 0.92 && size > 20) {
      size -= 4;
      o.font = `italic ${size}px "Instrument Serif", Georgia, serif`;
    }
    o.fillStyle = '#000';
    o.textBaseline = 'middle';
    lines.forEach((l, i) => o.fillText(l, (w - o.measureText(l).width) / 2, h * 0.5 + (i - (lines.length - 1) / 2) * size * 0.95));
    const data = o.getImageData(0, 0, off.width, off.height).data;
    const pts = [];
    const step = 3;
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        if (data[(y * off.width + x) * 4 + 3] > 128) pts.push([x, y]);
      }
    }
    for (let i = pts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }
    cache.set(word, pts);
    return pts;
  }

  function form(word) {
    card.classList.toggle('forming', !!word);
    const pts = word ? shapeOf(word) : [];
    ps.forEach((p, i) => {
      const t = pts.length ? pts[i % pts.length] : null;
      p.tx = t ? t[0] + (Math.random() - 0.5) * 1.5 : null;
      p.ty = t ? t[1] + (Math.random() - 0.5) * 1.5 : null;
    });
  }

  list.addEventListener('pointerover', (e) => {
    const b = e.target.closest('button[data-id]');
    if (b) form(names[b.dataset.id]);
  });
  list.addEventListener('focusin', (e) => {
    const b = e.target.closest('button[data-id]');
    if (b) form(names[b.dataset.id]);
  });
  list.addEventListener('pointerleave', () => form(null));

  let time = 0;
  onFrame((now) => {
    if (card.hidden) return;
    if (!w) resize();
    if (!w) return;
    if (!seeded) {
      for (const p of ps) {
        p.x = Math.random() * w;
        p.y = Math.random() * h;
      }
      seeded = true;
    }
    const r = canvas.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    time = now / 1000;
    ctx.clearRect(0, 0, w, h);
    for (const p of ps) {
      if (p.tx !== null) {
        // Spring towards the letter, with a little swirl on the way.
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        p.vx += dx * 0.012 - dy * 0.004;
        p.vy += dy * 0.012 + dx * 0.004;
        p.vx *= 0.86;
        p.vy *= 0.86;
      } else {
        // Drift on a slow flow field.
        const a = Math.sin(p.x * 0.012 + time * 0.4) + Math.cos(p.y * 0.015 - time * 0.3);
        p.vx += Math.cos(a * 2) * 0.05;
        p.vy += Math.sin(a * 2) * 0.05;
        p.vx *= 0.96;
        p.vy *= 0.96;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.tx === null) {
        if (p.x < 0) p.x += w;
        if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h;
        if (p.y > h) p.y -= h;
      }
      const speed = Math.min(1, Math.hypot(p.vx, p.vy) / 6);
      // Taupe at rest, a warm glow when fast.
      ctx.fillStyle = `rgb(${122 + speed * 90}, ${106 + speed * 60}, ${85 + speed * 20})`;
      ctx.globalAlpha = p.tx !== null ? 0.9 : 0.45;
      ctx.fillRect(p.x, p.y, 1.8 + speed * 1.4, 1.8 + speed * 1.4);
    }
    ctx.globalAlpha = 1;
  });
}
