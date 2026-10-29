// Soft leaf shadows drift over the clinic section, as if a window with a plant in front of it were letting in the sun.
// They sway in a slow wind and lean a little towards the pointer (after Floema, Site of the Month May 2026).
import { $, onFrame, onScreen, pointer, REDUCED } from '../core.js';

const LEAF = 'M0,0 C22,-14 58,-14 80,0 C58,14 22,14 0,0 Z';

export function startLeaves() {
  const svg = $('#leaf-shadows');
  const section = $('#kliniek');
  if (!svg) return;
  svg.setAttribute('viewBox', '0 0 1000 1000');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

  // Four branches reaching in from the top edge and the sides.
  const branches = [
    { x: 80, y: -40, angle: 62, len: 520 },
    { x: 420, y: -60, angle: 96, len: 380 },
    { x: 1040, y: 120, angle: 150, len: 560 },
    { x: -40, y: 560, angle: 18, len: 420 },
  ];
  svg.innerHTML = branches
    .map((b, i) => {
      const leaves = [];
      for (let k = 1; k <= 11; k++) {
        const d = (k / 12) * b.len;
        const side = k % 2 ? 1 : -1;
        const size = 0.9 + ((k * 37) % 10) / 14;
        leaves.push(
          `<path d="${LEAF}" transform="translate(${d.toFixed(0)},0) rotate(${side * (40 + ((k * 13) % 25))}) scale(${size.toFixed(2)})"/>`,
        );
      }
      return `<g class="branch" data-i="${i}" transform="translate(${b.x},${b.y}) rotate(${b.angle})">
        <g class="sway"><path d="M0,0 L${b.len},0" stroke="currentColor" stroke-width="6" fill="none"/>${leaves.join('')}</g>
      </g>`;
    })
    .join('');
  svg.setAttribute('fill', 'currentColor');
  const sways = [...svg.querySelectorAll('.sway')];
  if (REDUCED) return;

  let px = 0;
  let py = 0;
  onFrame((time, y) => {
    if (!onScreen(section, y)) return;
    const t = time / 1000;
    px += ((pointer.x / innerWidth - 0.5) * 30 - px) * 0.04;
    py += ((pointer.y / innerHeight - 0.5) * 20 - py) * 0.04;
    svg.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
    svg.style.opacity = String(0.13 + 0.05 * Math.sin(t * 0.25));
    sways.forEach((g, i) => {
      const a = Math.sin(t * 0.55 + i * 1.7) * 2.6 + Math.sin(t * 1.3 + i) * 0.8;
      g.setAttribute('transform', `rotate(${a.toFixed(2)})`);
    });
  });
}
