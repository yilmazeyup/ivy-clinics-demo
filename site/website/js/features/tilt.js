// Sections arrive like sheets of paper dealt onto the page: tilted, sliding over what came before, straightening as
// they settle (after FOLLOW.ART, Webby 2026 Best Visual Design – Function).
import { $$, clamp, onFrame, REDUCED } from '../core.js';

export function startTilt() {
  const sheets = $$('.tilt');
  if (REDUCED) return;
  onFrame((_, y) => {
    for (const el of sheets) {
      const top = el.offsetTop - y;
      if (top > innerHeight || top < -innerHeight) continue;
      const p = clamp(1 - top / (innerHeight * 0.9), 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.style.transform = p >= 1 ? '' : `translate3d(0, ${((1 - e) * 90).toFixed(1)}px, 0) rotate(${((1 - e) * -7).toFixed(2)}deg)`;
    }
  });
}
