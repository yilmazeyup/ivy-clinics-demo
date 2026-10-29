// A slice of skin, three layers deep. One click and the layers fly apart and settle side by side in a labelled
// flat-lay, each with the treatments that work there (after Body Layout, FWA of the Day, 28 October 2026).
import { $ } from '../core.js';

const svg = (body, w, h) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`;

// Where each treatment works, from Pure's own explanations: peelings loosen dead cells at the surface and the
// pigment laser's light is taken up by the pigment; SkinPen, Sylfirm X and Tixel reach the deeper layer where
// collagen is made; the vascular laser closes the vessel; laser hair removal switches off the hair follicle.
const LAYERS = [
  {
    name: 'Opperhuid',
    sub: 'De buitenste laag, met pigment en poriën',
    h: 46,
    fill: 'linear-gradient(180deg, #f7e3d6, #efcdb9)',
    pattern: svg(
      "<g fill='none' stroke='white' stroke-opacity='.55'><rect x='1' y='2' width='20' height='9' rx='4'/><rect x='12' y='13' width='20' height='9' rx='4'/></g>",
      22,
      22,
    ),
    treatments: ['peel', 'pigment', 'deepclean', 'prx'],
  },
  {
    name: 'Lederhuid',
    sub: 'Collageen, elastine en kleine vaatjes',
    h: 118,
    fill: 'linear-gradient(180deg, #e8b4a1, #d79583)',
    pattern: svg(
      "<path d='M0 10 C15 0 25 20 40 10 S65 0 80 10' fill='none' stroke='white' stroke-opacity='.45' stroke-width='1.5'/><path d='M0 30 C15 20 25 40 40 30 S65 20 80 30' fill='none' stroke='white' stroke-opacity='.3'/><path d='M0 46 C20 40 30 52 50 44 S70 40 80 46' fill='none' stroke='%23a83a3a' stroke-opacity='.45' stroke-width='1.6'/>",
      80,
      52,
    ),
    treatments: ['skinpen', 'sylfirm', 'tixel', 'couperose', 'legveins'],
  },
  {
    name: 'Onderhuid',
    sub: 'Vet, en de wortels van je haren',
    h: 132,
    fill: 'linear-gradient(180deg, #f2e0b6, #e5cd94)',
    pattern: svg(
      "<g fill='white' fill-opacity='.32'><path d='M4 6 q10 -6 18 2 q4 10 -6 14 q-14 2 -12 -16z'/><path d='M28 22 q12 -4 16 6 q0 10 -10 10 q-12 -2 -6 -16z'/></g>",
      48,
      40,
    ),
    treatments: ['laser', 'epilation'],
  },
];

export function startLayers(byId) {
  const root = $('#layers');
  const scene = $('#layers-scene');
  const toggle = $('#layers-toggle');
  if (!root) return;

  const total = LAYERS.reduce((sum, l) => sum + l.h, 0);
  let acc = 0;
  scene.innerHTML = `<div class="layers-rig">${LAYERS.map((l, i) => {
    const top = acc;
    acc += l.h;
    return `<figure class="layer" style="--i:${i};--h:${l.h}px;--stack-y:${top}px;--flat-x:${[18, 50, 82][i]}%;--flat-y:${[3, 35, 67][i]}%">
      <div class="layer-slab"><span class="face"></span></div>
      <figcaption class="layer-label">
        <strong>${l.name}</strong><small>${l.sub}</small>
        <span class="chips">${l.treatments
          .filter((id) => byId[id])
          .map((id) => `<button type="button" data-open="${id}">${byId[id].name}</button>`)
          .join('')}</span>
      </figcaption>
    </figure>`;
  }).join('')}</div>`;
  scene.style.setProperty('--total', `${total}px`);
  // The fills hold quotes, so they are set here rather than in the markup.
  scene.querySelectorAll('.layer').forEach((el, i) => {
    el.style.setProperty('--fill', LAYERS[i].fill);
    el.style.setProperty('--pattern', LAYERS[i].pattern);
  });

  toggle.addEventListener('click', () => {
    const flat = root.dataset.state !== 'flat';
    root.dataset.state = flat ? 'flat' : 'stack';
    toggle.setAttribute('aria-pressed', String(flat));
    toggle.firstElementChild.textContent = flat ? 'Leg de lagen weer op elkaar' : 'Haal de lagen uit elkaar';
  });
}
