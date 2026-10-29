// Jouw traject as one short film on a single master timeline. The scroll plays it forwards and back, or you drag the
// playhead; the camera, the captions and the light all follow the same clock (after GQ & AP's The Extraordinary
// Lab, Site of the Month March 2026).
import { $, $$, clamp, smoothstep, onFrame, onScreen, pinProgress, scroll } from '../core.js';

const CHAPTERS = ['I · Gratis intake', 'II · Een plan op maat', 'III · De behandeling', 'IV · Nazorg'];

export function startFilm() {
  const section = $('#traject');
  if (!section) return;
  const frames = $$('#film-frames img');
  const captions = $$('#film-captions li');
  const copy = $('.film-copy', section);
  const track = $('#film-track');
  const chapter = $('#film-chapter');
  const time = $('#film-time');
  const n = frames.length;
  // The camera of each shot: where it starts and where it drifts to.
  const moves = [
    [1.14, -2, 1, 1.02, 2, -1],
    [1.02, 0, 3, 1.12, 0, -2],
    [1.12, 3, 0, 1.02, -2, 0],
    [1.0, -2, -2, 1.1, 1, 2],
  ];

  let lastP = -1;
  onFrame((_, y) => {
    if (!onScreen(section, y)) return;
    const p = pinProgress(section, y);
    if (Math.abs(p - lastP) < 0.0002) return;
    lastP = p;
    const at = p * n;
    frames.forEach((img, i) => {
      // Each shot fades in a little before its chapter starts, and out a little after it ends.
      const o = smoothstep(i - 0.18, i + 0.05, at) * (1 - smoothstep(i + 0.95, i + 1.18, at));
      const t = clamp(at - i, 0, 1);
      const [s0, x0, y0, s1, x1, y1] = moves[i % moves.length];
      img.style.opacity = String(i === 0 ? 1 - smoothstep(0.95, 1.18, at) : o);
      img.style.transform = `scale(${s0 + (s1 - s0) * t}) translate(${x0 + (x1 - x0) * t}%, ${y0 + (y1 - y0) * t}%)`;
      // The light warms as the visit goes on.
      img.style.filter = `saturate(${0.85 + 0.25 * t}) brightness(${0.92 + 0.08 * Math.sin(t * Math.PI)})`;
    });
    captions.forEach((c, i) => {
      const o = smoothstep(i + 0.08, i + 0.24, at) * (1 - smoothstep(i + 0.82, i + 0.97, at));
      const last = i === n - 1 ? smoothstep(i + 0.08, i + 0.24, at) : o;
      c.style.opacity = String(last);
      c.style.transform = `translateY(${(1 - last) * 24}px)`;
    });
    copy.style.opacity = String(1 - smoothstep(0.02, 0.08, p));
    track.style.setProperty('--p', p.toFixed(4));
    track.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    chapter.textContent = CHAPTERS[Math.min(n - 1, Math.floor(at))];
    time.textContent = `${Math.round(p * 100)}%`;
  });

  // Drag the playhead: the page scrolls to that moment of the film.
  const seek = (p) => {
    const travel = section.offsetHeight - innerHeight;
    scroll.to(section.offsetTop + clamp(p, 0, 1) * travel, true);
  };
  const fromEvent = (e) => {
    const r = track.getBoundingClientRect();
    seek((e.clientX - r.left) / r.width);
  };
  let dragging = false;
  track.addEventListener('pointerdown', (e) => {
    dragging = true;
    track.setPointerCapture(e.pointerId);
    fromEvent(e);
  });
  track.addEventListener('pointermove', (e) => dragging && fromEvent(e));
  track.addEventListener('pointerup', () => (dragging = false));
  track.addEventListener('keydown', (e) => {
    const p = pinProgress(section);
    const step = { ArrowRight: 0.05, ArrowLeft: -0.05, End: 1, Home: -1 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    seek(p + step);
  });
}
