// A steamed-up mirror. Wipe it with the mouse or a finger; draw a whole circle and it clears completely, the way
// "Draw a zero" unlocks Why Zero (Site of the Month September 2026). Wiped streaks slowly steam up again, and a
// button skips the game.
import { $, REDUCED } from '../core.js';

export function startMirror() {
  const box = $('#mirror');
  const canvas = $('#mirror-fog');
  const img = $('.mirror-photo', box);
  if (!box || !canvas) return;
  const ctx = canvas.getContext('2d');
  const fog = document.createElement('canvas');
  const fctx = fog.getContext('2d');
  let w = 0;
  let h = 0;
  let dpr = 1;
  let cleared = false;

  function paintFog() {
    dpr = Math.min(devicePixelRatio, 2);
    w = box.clientWidth;
    h = box.clientHeight;
    for (const c of [canvas, fog]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The photo, blurred and pale, with a haze and a few drops: steam on glass.
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    fctx.filter = 'blur(16px) saturate(0.55) brightness(1.12)';
    fctx.drawImage(img, (w - dw) * 0.62, (h - dh) * 0.4, dw, dh);
    fctx.filter = 'none';
    const haze = fctx.createLinearGradient(0, 0, 0, h);
    haze.addColorStop(0, 'rgba(255,255,255,0.5)');
    haze.addColorStop(1, 'rgba(240,232,222,0.38)');
    fctx.fillStyle = haze;
    fctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 2.2 + 0.6;
      fctx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.35})`;
      fctx.beginPath();
      fctx.arc(x, y, r, 0, Math.PI * 2);
      fctx.fill();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(fog, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const start = () => {
    paintFog();
    if (!REDUCED) requestAnimationFrame(steam);
  };
  if (img.complete && img.naturalWidth) start();
  else img.addEventListener('load', start, { once: true });
  new ResizeObserver(() => !cleared && img.naturalWidth && paintFog()).observe(box);

  // Wiped glass steams up again, slowly.
  function steam() {
    if (cleared) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.006;
    ctx.drawImage(fog, 0, 0);
    ctx.restore();
    requestAnimationFrame(steam);
  }

  let stroke = [];
  let last = null;
  let lastTime = 0;
  function wipe(x, y) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(36, w * 0.09);
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(last ? last.x : x, last ? last.y : y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
    last = { x, y };
  }

  // A circle: the path goes all the way round a middle point at a fairly even distance.
  function isCircle(pts) {
    if (pts.length < 18) return false;
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const radii = pts.map((p) => Math.hypot(p.x - cx, p.y - cy));
    const r = radii.reduce((s, v) => s + v, 0) / radii.length;
    if (r < Math.min(w, h) * 0.12) return false;
    const spread = Math.sqrt(radii.reduce((s, v) => s + (v - r) ** 2, 0) / radii.length) / r;
    if (spread > 0.38) return false;
    let swept = 0;
    for (let i = 1; i < pts.length; i++) {
      let d = Math.atan2(pts[i].y - cy, pts[i].x - cx) - Math.atan2(pts[i - 1].y - cy, pts[i - 1].x - cx);
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      swept += d;
    }
    return Math.abs(swept) > Math.PI * 1.7;
  }

  function clearAll(from) {
    if (cleared) return;
    cleared = true;
    const cx = from ? from.x : w / 2;
    const cy = from ? from.y : h / 2;
    const max = Math.hypot(w, h);
    const t0 = performance.now();
    const grow = (now) => {
      const t = Math.min(1, Math.max(0, (now - t0) / 900));
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, max * (1 - Math.pow(1 - t, 3)), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (t < 1) requestAnimationFrame(grow);
      else box.classList.add('clear');
    };
    requestAnimationFrame(grow);
    box.classList.add('wiping');
  }

  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  let pressed = false;
  canvas.addEventListener('pointerdown', (e) => {
    pressed = true;
    canvas.setPointerCapture(e.pointerId);
    last = null;
    stroke = [];
  });
  canvas.addEventListener('pointerup', () => {
    pressed = false;
    last = null;
  });
  canvas.addEventListener('pointerleave', () => {
    last = null;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (cleared) return;
    // With a mouse, moving over the glass wipes it; with a finger, touching it does.
    if (e.pointerType !== 'mouse' && !pressed) return;
    const p = local(e);
    const now = performance.now();
    if (now - lastTime > 500) {
      stroke = [];
      last = null;
    }
    lastTime = now;
    box.classList.add('wiping');
    wipe(p.x, p.y);
    stroke.push(p);
    if (stroke.length > 160) stroke.shift();
    if (isCircle(stroke.slice(-120))) {
      const cx = stroke.reduce((s, q) => s + q.x, 0) / stroke.length;
      const cy = stroke.reduce((s, q) => s + q.y, 0) / stroke.length;
      clearAll({ x: cx, y: cy });
    }
  });
  $('#mirror-skip').addEventListener('click', () => clearAll(null));
}
