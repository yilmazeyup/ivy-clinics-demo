// A loupe lies on the photo with "Pak me op". Move it over the face and find what a skin therapist looks at in an
// intake; a counter keeps score (after metic., CSS Design Awards Website of the Day, 21 October 2026).
import { $, clamp } from '../core.js';

// Places on the photo (fractions of its width and height) and what the therapist sees there, in Pure's own terms.
const SPOTS = [
  {
    x: 0.5,
    y: 0.13,
    name: 'Poriën',
    text: 'Verstopte poriën en mee-eters. Een dieptereiniging met peeling maakt je huid frisser en egaler.',
    treatment: 'deepclean',
    label: 'Dieptereiniging',
  },
  {
    x: 0.5,
    y: 0.47,
    name: 'Pigment',
    text: 'Sproetjes en pigmentvlekken. Met het licht van een laser of IPL worden vlekken lichter.',
    treatment: 'pigment',
    label: 'Pigmentlaser',
  },
  {
    x: 0.71,
    y: 0.445,
    name: 'Kringen',
    text: 'Donkere kringen en wallen. Een skinbooster rond de ogen houdt vocht vast en maakt je blik frisser.',
    treatment: 'eyes',
    label: 'Wallen & kringen',
  },
  {
    x: 0.24,
    y: 0.63,
    name: 'Huidstructuur',
    text: 'Oneffenheden en kleine littekens. Microneedling zet je huid aan tot nieuw collageen.',
    treatment: 'skinpen',
    label: 'SkinPen',
  },
];
const ZOOM = 2.4;

export function startLoupe() {
  const stage = $('#loupe-stage');
  const loupe = $('#loupe');
  const lens = $('#loupe-lens');
  const photo = $('#loupe-photo');
  const count = $('#loupe-count');
  if (!stage) return;

  $('#loupe-spots').innerHTML = SPOTS.map(
    (s, i) => `<div class="spot ${s.x > 0.6 ? 'left' : ''}" style="--x:${s.x * 100}%;--y:${s.y * 100}%" data-i="${i}">
      <span class="spot-pin"></span>
      <div class="spot-card"><strong>${s.name}</strong><p>${s.text}</p><button type="button" data-open="${s.treatment}">Over ${s.label}</button></div>
    </div>`,
  ).join('');
  const spotEls = [...stage.querySelectorAll('.spot')];
  const found = new Set();

  const pos = { x: 0.84, y: 0.84 };
  let size = 0;
  const layout = () => {
    size = stage.clientWidth;
    const l = clamp(size * 0.27, 130, 230);
    stage.style.setProperty('--lens', `${l}px`);
    lens.style.backgroundImage = `url("${photo.currentSrc || photo.src}")`;
    lens.style.backgroundSize = `${size * ZOOM}px ${size * ZOOM}px`;
    place();
  };
  function place() {
    const l = parseFloat(stage.style.getPropertyValue('--lens')) || 180;
    const x = pos.x * size;
    const y = pos.y * size;
    loupe.style.transform = `translate(${x}px, ${y}px)`;
    lens.style.backgroundPosition = `${-(x * ZOOM - l / 2)}px ${-(y * ZOOM - l / 2)}px`;
    // What lies under the middle of the glass counts as found.
    SPOTS.forEach((s, i) => {
      if (found.has(i)) return;
      if (Math.hypot((s.x - pos.x) * size, (s.y - pos.y) * size) < l * 0.32) discover(i);
    });
  }
  function discover(i) {
    found.add(i);
    spotEls[i].classList.add('seen');
    count.textContent = found.size === SPOTS.length ? 'Alles ontdekt · precies wat we in je intake doen' : `${found.size} van ${SPOTS.length} ontdekt`;
  }

  let drag = null;
  let follow = false;
  const toLocal = (e) => {
    const r = stage.getBoundingClientRect();
    return { x: clamp((e.clientX - r.left) / r.width, 0.03, 0.97), y: clamp((e.clientY - r.top) / r.height, 0.03, 0.97) };
  };
  loupe.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    loupe.setPointerCapture(e.pointerId);
    loupe.classList.add('held', 'used');
  });
  loupe.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true;
    Object.assign(pos, toLocal(e));
    place();
  });
  loupe.addEventListener('pointerup', (e) => {
    if (!drag) return;
    // A click without moving picks the loupe up: it then follows the mouse until the next click.
    if (!drag.moved && e.pointerType === 'mouse') follow = !follow;
    drag = null;
    loupe.classList.toggle('held', follow);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!follow || drag) return;
    Object.assign(pos, toLocal(e));
    place();
  });
  stage.addEventListener('click', (e) => {
    if (follow && !e.target.closest('.loupe, .spot-card')) {
      follow = false;
      loupe.classList.remove('held');
    }
  });
  loupe.addEventListener('keydown', (e) => {
    const step = 0.03;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    loupe.classList.add('used');
    pos.x = clamp(pos.x + m[0], 0.03, 0.97);
    pos.y = clamp(pos.y + m[1], 0.03, 0.97);
    place();
  });
  $('#loupe-all').addEventListener('click', () => SPOTS.forEach((_, i) => !found.has(i) && discover(i)));

  if (photo.complete) layout();
  else photo.addEventListener('load', layout, { once: true });
  new ResizeObserver(layout).observe(stage);
}
