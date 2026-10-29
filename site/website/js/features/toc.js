// The framed index with roman numerals. Once you read past it, the same frame slides into a slim rail on the left
// and keeps showing where you are (after Shopify Editions Winter '26, Site of the Month February 2026).
import { $, $$, onFrame, transition } from '../core.js';

export function startToc() {
  const section = $('#inhoud');
  const frame = $('#toc');
  const links = $$('a', frame);
  const targets = links.map((a) => document.getElementById(a.hash.slice(1)));
  const wide = matchMedia('(min-width: 1280px)');
  const dark = ['resultaten', 'traject'].map((id) => document.getElementById(id));
  let docked = false;

  onFrame((_, y) => {
    const pastIndex = y > section.offsetTop + section.offsetHeight * 0.75;
    const beforeEnd = y + innerHeight < document.getElementById('intake').offsetTop + innerHeight * 0.6;
    const want = wide.matches && pastIndex && beforeEnd;
    if (want !== docked) {
      docked = want;
      // Keep the room the frame took, so the page does not jump when it leaves.
      section.style.minHeight = `${section.offsetHeight}px`;
      transition(() => frame.classList.toggle('docked', docked));
    }
    if (!docked) return;
    const mid = y + innerHeight * 0.45;
    let current = -1;
    targets.forEach((t, i) => {
      if (t && t.offsetTop <= mid) current = i;
    });
    links.forEach((a, i) => a.setAttribute('aria-current', String(i === current)));
    frame.classList.toggle(
      'over-dark',
      dark.some((d) => d && mid > d.offsetTop && mid < d.offsetTop + d.offsetHeight),
    );
  });
}
