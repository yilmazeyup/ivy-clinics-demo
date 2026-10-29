// The opening: on scroll the full-screen photo shrinks into a framed portrait on ivory paper, while botanicals drawn
// in engraving hatch lines grow in around it (after Son Daven, Site of the Month June 2026).
import { $, clamp, smoothstep, onFrame, REDUCED } from './core.js';

const NS = 'http://www.w3.org/2000/svg';

/** Where the photo ends up: a portrait frame in the middle, wider margins on wide screens. */
export function frameRect(w, h) {
  const portrait = w < h;
  const fw = portrait ? w * 0.74 : Math.min(w * 0.36, h * 0.62);
  const fh = portrait ? h * 0.5 : h * 0.72;
  return { x: (w - fw) / 2, y: portrait ? h * 0.2 : (h - fh) / 2 - h * 0.02, w: fw, h: fh };
}

// A small seeded random, so the garden looks the same on every visit.
function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function buildEngraving(svg, w, h) {
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = '';
  const rand = rng(7);
  const f = frameRect(w, h);
  const defs = document.createElementNS(NS, 'defs');
  // One leaf, 100 long and 34 wide, pointing right from its base at 0,0: outline, midrib and hatching.
  const leafPath = 'M0,0 C30,-20 70,-19 100,0 C70,19 30,20 0,0 Z';
  let hatch = '';
  for (let x = -20; x < 110; x += 5.5) hatch += `M${x},-20 L${x + 16},20 `;
  defs.innerHTML = `
    <clipPath id="leaf-clip" clipPathUnits="userSpaceOnUse"><path d="${leafPath}"/></clipPath>
    <g id="leaf" fill="none" stroke="currentColor" stroke-linecap="round">
      <path d="${hatch}" clip-path="url(#leaf-clip)" stroke-width="0.7" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <path d="${leafPath}" stroke-width="1.3" vector-effect="non-scaling-stroke"/>
      <path d="M2,0 C40,-2 70,-1 98,0" stroke-width="0.9" vector-effect="non-scaling-stroke"/>
    </g>`;
  svg.append(defs);

  // Where plants grow: the margins beside the frame on wide screens, above and below it on tall ones.
  const plants = [];
  const portrait = w < h;
  const count = portrait ? 6 : 8;
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    let base, height, lean;
    if (!portrait) {
      // Stay in the margin beside the frame, leaning outwards, so the middle stays calm.
      const margin = f.x - 70;
      const d = margin * (0.15 + rand() * 0.7);
      const bx = side < 0 ? d : w - d;
      base = [bx, h + 10];
      height = h * (0.42 + rand() * 0.45);
      const out = -(10 + rand() * 50);
      const room = margin - d - 40;
      lean = side < 0 ? Math.min(room, out) : -Math.min(room, out);
    } else {
      const bx = (i / (count - 1)) * w * 0.9 + w * 0.05;
      base = [bx, h + 10];
      height = (h - f.y - f.h) * (0.6 + rand() * 0.7) + 20;
      lean = (rand() - 0.5) * 70;
    }
    plants.push({ base, height, lean, rand });
  }

  const order = [];
  for (const p of plants) {
    const [bx, by] = p.base;
    const top = [bx + p.lean, by - p.height];
    const ctrl = [bx + p.lean * 0.15, by - p.height * 0.55];
    const stem = document.createElementNS(NS, 'path');
    stem.setAttribute('d', `M${bx},${by} Q${ctrl[0]},${ctrl[1]} ${top[0]},${top[1]}`);
    stem.setAttribute('class', 'stem');
    svg.append(stem);
    const len = stem.getTotalLength();
    stem.style.strokeDasharray = `${len}`;
    stem.style.strokeDashoffset = `${len}`;
    const leaves = [];
    const n = 6 + Math.floor(rand() * 5);
    for (let k = 1; k <= n; k++) {
      const at = k / (n + 1);
      const pt = stem.getPointAtLength(len * at);
      const ahead = stem.getPointAtLength(Math.min(len, len * at + 2));
      const dir = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
      const side = k % 2 ? 1 : -1;
      const angle = dir + side * (38 + rand() * 22);
      const size = (0.42 + rand() * 0.4) * (1 - at * 0.4) * (portrait ? 0.75 : 1);
      const outer = document.createElementNS(NS, 'g');
      outer.setAttribute('transform', `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${size.toFixed(2)})`);
      const grow = document.createElementNS(NS, 'g');
      grow.setAttribute('class', 'grow');
      const use = document.createElementNS(NS, 'use');
      use.setAttribute('href', '#leaf');
      grow.append(use);
      outer.append(grow);
      svg.append(outer);
      leaves.push({ at, el: grow });
    }
    order.push({ stem, len, leaves, delay: rand() * 0.25 });
  }
  return order;
}

export function startHero({ onSolid }) {
  const wrap = $('#top');
  const hero = $('.hero');
  const media = $('#hero-media');
  const copy = $('.hero-copy');
  const foot = $('.hero-foot');
  const welcome = $('#hero-welcome');
  const svg = $('#engraving');
  let plants = [];
  let size = '';
  let last = -1;

  const layout = () => {
    const key = `${hero.clientWidth}x${hero.clientHeight}`;
    if (key === size) return;
    size = key;
    plants = buildEngraving(svg, hero.clientWidth, hero.clientHeight);
    last = -1;
  };
  layout();
  addEventListener('resize', layout);

  onFrame((_, y) => {
    const travel = wrap.offsetHeight - innerHeight;
    const p = REDUCED ? (y > 10 ? 1 : 0) : clamp(y / travel, 0, 1);
    onSolid(p > 0.42 || y > travel);
    if (Math.abs(p - last) < 0.0005) return;
    last = p;
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    const f = frameRect(w, h);
    const k = smoothstep(0.05, 0.62, p);
    const top = f.y * k;
    const left = f.x * k;
    const bottom = (h - f.y - f.h) * k;
    media.style.clipPath = `inset(${top}px ${left}px ${bottom}px ${left}px round ${k * 18}px)`;
    media.style.transform = `scale(${1 + (1 - k) * 0.06})`;
    copy.style.opacity = String(1 - smoothstep(0, 0.22, p));
    copy.style.transform = `translate3d(0, ${-p * 30}vh, 0)`;
    foot.style.opacity = String(1 - smoothstep(0, 0.12, p));
    welcome.style.opacity = String(smoothstep(0.55, 0.8, p));
    welcome.style.transform = `translate3d(0, ${(1 - smoothstep(0.55, 0.85, p)) * 30}px, 0)`;
    // The garden grows with the scroll, each stem first, then its leaves from the bottom up.
    for (const plant of plants) {
      const g = clamp((smoothstep(0.12, 0.95, p) - plant.delay) / (1 - plant.delay), 0, 1);
      plant.stem.style.strokeDashoffset = String(plant.len * (1 - g));
      for (const leaf of plant.leaves) {
        const s = clamp((g - leaf.at * 0.85) / 0.22, 0, 1);
        leaf.el.style.transform = `scale(${s})`;
        leaf.el.style.opacity = String(Math.min(1, s * 1.6));
      }
    }
  });
}
