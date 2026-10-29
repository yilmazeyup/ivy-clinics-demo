// The Pure Clinics website: loads the clinic's own data, builds the sections and runs the motion.
import { logoSvg } from './logo.js';
import { startHeroGL, daylight } from './gl.js';
import { startHero } from './hero.js';
import { buildLogoFromSquares } from './loader.js';
import { startToc } from './features/toc.js';
import { startParticles } from './features/particles.js';
import { startLoupe } from './features/loupe.js';
import { startDrop } from './features/drop.js';
import { startLayers } from './features/layers.js';
import { startFilm } from './features/film.js';
import { startLeaves } from './features/leaves.js';
import { startMirror } from './features/mirror.js';
import { startTilt } from './features/tilt.js';
import { $, $$, clamp, lerp, smoothstep, REDUCED, FINE, scroll, pointer, onFrame, transition } from './core.js';

const APP = '../app/';

const CONCERN_NAMES = {
  removal: 'Definitief ontharen',
  acne: 'Acne',
  scars: 'Acnelittekens',
  pigment: 'Pigmentvlekken',
  redness: 'Couperose en adertjes',
  aging: 'Huidverjonging',
  eyes: 'Wallen en kringen',
  hairloss: 'Haaruitval',
};
const CATEGORY_NAMES = {
  consult: 'Intake',
  removal: 'Ontharen',
  conditions: 'Huidproblemen',
  skin: 'Huidverbetering',
  hair: 'Haaruitval',
};
const DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

const photo = (key, small = true) => `img/${key}${small && !key.startsWith('ba-') ? '-s' : ''}.webp`;
const price = (t) => (t.priceFrom === 0 ? 'Gratis' : `vanaf €${t.priceFrom}`);
// "3–6" becomes "3–6 behandelingen"; "Kuur van 4+1" stays as it is.
const sessions = (s) => (s ? (/^[\d–\s]+$/.test(s) ? `${s} behandelingen` : s) : '');

/* ---------- Logo ---------- */

for (const el of $$('[data-logo]')) el.innerHTML = logoSvg();

// In-page links glide to their section.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = id === 'top' ? document.body : document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  closeMenu();
  const top = id === 'top' ? 0 : el.getBoundingClientRect().top + scrollY - (id === 'behandelingen' ? 0 : 8);
  scroll.to(top);
  history.replaceState(null, '', `#${id}`);
});

/* ---------- Header ---------- */

const header = $('#header');
let heroPassed = false;
startHero({ onSolid: (v) => (heroPassed = v) });
onFrame((_, y) => {
  header.classList.toggle('solid', heroPassed || menuOpen);
  // Hidden while reading down, back as soon as the visitor scrolls up.
  header.classList.toggle('hide', !menuOpen && y > innerHeight * 0.8 && scroll.velocity > 1.5);
  if (scroll.velocity < -1.5 || y < innerHeight * 0.8) header.classList.remove('hide');
});

// The nav underlines the section on screen.
const navLinks = $$('.nav a');
const navObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      for (const a of navLinks) a.setAttribute('aria-current', String(a.hash === `#${e.target.id}`));
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
for (const id of ['huidscan', 'behandelingen', 'resultaten', 'kliniek']) navObserver.observe(document.getElementById(id));

/* ---------- Menu ---------- */

const menu = $('#menu');
const menuButton = $('#menu-button');
let menuOpen = false;
function setMenu(open) {
  menuOpen = open;
  menuButton.setAttribute('aria-expanded', String(open));
  document.documentElement.classList.toggle('locked', open);
  if (open) {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('open'));
  } else {
    menu.classList.remove('open');
    setTimeout(() => !menuOpen && (menu.hidden = true), 900);
  }
}
function closeMenu() {
  if (menuOpen) setMenu(false);
}
menuButton.addEventListener('click', () => setMenu(!menuOpen));
addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());
for (const a of $$('.menu-links a')) {
  const swap = () => ($('#menu-photo').src = photo(a.dataset.photo));
  a.addEventListener('pointerenter', swap);
  a.addEventListener('focus', swap);
}

/* ---------- Split headlines into lines that rise one after another ---------- */

function splitLines(el) {
  if (!el.dataset.source) el.dataset.source = el.innerHTML;
  el.innerHTML = el.dataset.source;
  // Wrap every word, keeping <em> around the words it held.
  const words = [];
  const wrap = (node, parentEm) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.append(' ');
            continue;
          }
          const w = document.createElement('span');
          w.className = 'w';
          w.textContent = part;
          w.dataset.em = parentEm ? '1' : '';
          words.push(w);
          frag.append(w);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === 1) {
        wrap(child, parentEm || child.tagName === 'EM');
      }
    }
  };
  wrap(el, false);
  const lines = [];
  let top = null;
  for (const w of words) {
    const t = w.offsetTop;
    if (top === null || Math.abs(t - top) > 4) {
      lines.push([]);
      top = t;
    }
    lines.at(-1).push(w);
  }
  el.innerHTML = lines
    .map((ws, i) => {
      let html = '';
      let inEm = false;
      ws.forEach((w, j) => {
        const em = w.dataset.em === '1';
        if (em && !inEm) html += '<em>';
        if (!em && inEm) html += '</em>';
        inEm = em;
        html += (j ? ' ' : '') + w.textContent;
      });
      if (inEm) html += '</em>';
      return `<span class="line" style="--l:${i}"><span>${html}</span></span>`;
    })
    .join('');
}
const splits = $$('.split');
const runSplits = () => splits.forEach(splitLines);

/* ---------- Reveal on scroll ---------- */

const revealer = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealer.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -12% 0px' },
);
const watch = (els) => els.forEach((el) => revealer.observe(el));

/* ---------- Ticker: drifts on its own and speeds up with the scroll ---------- */

const ticker = $('#ticker');
ticker.innerHTML += ticker.innerHTML;
let tickerX = 0;
let tickerDir = -1;
onFrame(() => {
  const v = scroll.velocity;
  if (Math.abs(v) > 0.4) tickerDir = v > 0 ? -1 : 1;
  tickerX += tickerDir * (0.55 + Math.min(Math.abs(v) * 0.35, 14));
  const half = ticker.scrollWidth / 2;
  if (tickerX <= -half) tickerX += half;
  if (tickerX > 0) tickerX -= half;
  ticker.style.transform = `translate3d(${tickerX}px,0,0) skewX(${clamp(-v * 0.25, -8, 8)}deg)`;
});

/* ---------- Cursor and magnetic buttons ---------- */

const cursor = $('#cursor');
const cur = { x: pointer.x, y: pointer.y };
if (FINE) {
  addEventListener('pointermove', (e) => {
    document.body.classList.add('has-cursor');
    const target = e.target.closest?.('[data-cursor]');
    cursor.classList.toggle('label', !!target);
    if (target) cursor.firstElementChild.textContent = target.dataset.cursor;
  });
  document.addEventListener('pointerleave', () => document.body.classList.remove('has-cursor'));
  onFrame(() => {
    cur.x = lerp(cur.x, pointer.x, 0.22);
    cur.y = lerp(cur.y, pointer.y, 0.22);
    cursor.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
  });
  for (const el of $$('.magnetic')) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.32}px)`;
      el.firstElementChild.style.transform = `translate(${dx * 0.08}px, ${dy * 0.12}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
      el.firstElementChild.style.transform = '';
    });
  }
}

/* ---------- Data ---------- */

const data = await fetch('data/pure.json').then((r) => r.json());
const treatments = data.treatments.filter((t) => t.category !== 'beauty');
const byId = Object.fromEntries(treatments.map((t) => [t.id, t]));

/* ---------- Huidscan ---------- */

const concernList = $('#concerns');
concernList.innerHTML = data.concerns
  .map(
    (c, i) => `<li class="concern">
      <button type="button" aria-pressed="false" data-id="${c.id}" data-photo="${c.photo}">
        <span class="idx">${String(i + 1).padStart(2, '0')}</span>
        <span class="name">${CONCERN_NAMES[c.id]}</span>
        <span class="tick" aria-hidden="true"></span>
      </button>
      <div class="concern-text"><p>${c.text}</p></div>
    </li>`,
  )
  .join('');

const picked = new Set();
function renderRoute() {
  const score = new Map();
  for (const c of data.concerns) {
    if (!picked.has(c.id)) continue;
    c.treatments.forEach((id, rank) => {
      if (!byId[id]) return;
      // Treatments named for more of the chosen concerns, and named earlier, come first.
      score.set(id, (score.get(id) ?? 0) + 10 - rank);
    });
  }
  const list = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => byId[id]);
  $('#route-empty').hidden = list.length > 0;
  $('#route-full').hidden = list.length === 0;
  $('#route-count').textContent = `${picked.size} ${picked.size === 1 ? 'onderwerp' : 'onderwerpen'}`;
  $('#route-list').innerHTML = list
    .map(
      (t, i) => `<li class="route-item" style="--i:${i}">
        <button type="button" data-open="${t.id}" aria-label="Meer over ${t.name}">
          <img src="${photo(t.photo)}" alt="" loading="lazy" />
          <span><strong>${t.name}</strong><small>${[sessions(t.info?.sessions), t.info?.downtime && `herstel: ${t.info.downtime.toLowerCase()}`].filter(Boolean).join(' · ')}</small><span class="price">${price(t)}</span></span>
        </button>
      </li>`,
    )
    .join('');
}
concernList.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-id]');
  if (!b) return;
  const on = b.getAttribute('aria-pressed') !== 'true';
  b.setAttribute('aria-pressed', String(on));
  on ? picked.add(b.dataset.id) : picked.delete(b.dataset.id);
  renderRoute();
});

// The concern's photo follows the pointer, leaning into the direction it moves.
const float = $('#scan-float');
const floatImg = float.firstElementChild;
const fp = { x: 0, y: 0, vx: 0 };
if (FINE) {
  concernList.addEventListener('pointerover', (e) => {
    const b = e.target.closest('button[data-photo]');
    if (!b) return;
    floatImg.src = photo(b.dataset.photo);
    float.classList.add('on');
  });
  concernList.addEventListener('pointerleave', () => float.classList.remove('on'));
  onFrame(() => {
    if (!float.classList.contains('on')) {
      fp.x = pointer.x;
      fp.y = pointer.y;
      return;
    }
    const nx = lerp(fp.x, pointer.x + 150, 0.12);
    fp.vx = lerp(fp.vx, nx - fp.x, 0.2);
    fp.x = nx;
    fp.y = lerp(fp.y, pointer.y, 0.12);
    float.style.transform = `translate3d(${fp.x}px, ${fp.y}px, 0) translate(-50%, -50%) rotate(${clamp(fp.vx * 0.6, -12, 12)}deg)`;
  });
}

/* ---------- Behandelkamers: a row that moves sideways while the page scrolls ---------- */

const roomsSection = $('#behandelingen');
const track = $('#rooms-track');
const roomList = treatments.filter((t) => t.id !== 'consult');
track.innerHTML = roomList
  .map(
    (t) => `<button type="button" class="room" data-open="${t.id}" data-cat="${t.category}" data-cursor="Bekijk">
      <div class="room-photo">
        <img src="${photo(t.photo)}" alt="" loading="lazy" />
        <span class="room-tag">${t.insurable ? 'Soms vergoed' : CATEGORY_NAMES[t.category]}</span>
      </div>
      <div class="room-meta"><span class="room-name">${t.name}</span><span class="room-price">${price(t)}</span></div>
      <p class="room-desc">${t.description}</p>
    </button>`,
  )
  .join('');

const filters = ['all', 'removal', 'conditions', 'skin', 'hair'];
$('#rooms-filter').innerHTML = filters
  .map((f, i) => `<button type="button" class="chip" role="tab" aria-selected="${i === 0}" data-f="${f}">${f === 'all' ? 'Alles' : CATEGORY_NAMES[f]}</button>`)
  .join('');
$('#rooms-filter').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  for (const c of $$('.chip')) c.setAttribute('aria-selected', String(c === chip));
  const f = chip.dataset.f;
  const apply = () => {
    for (const r of $$('.room', track)) r.hidden = f !== 'all' && r.dataset.cat !== f;
    sizeRooms();
  };
  transition(apply);
  scroll.to(roomsSection.offsetTop, true);
});

let roomsTravel = 0;
function sizeRooms() {
  const wide = innerWidth > 900;
  roomsTravel = Math.max(0, track.scrollWidth - innerWidth);
  roomsSection.style.setProperty('--rooms-h', wide ? `${innerHeight + roomsTravel}px` : `${innerHeight + roomsTravel}px`);
}
// The reel and its headline lean with the speed of the scroll and spring back upright when it stops
// (after AUGE Experience, CSS Design Awards Website of the Day, 20 October 2026).
const roomsTitle = $('#rooms-title');
let lean = 0;
let leanV = 0;
onFrame((_, y) => {
  const top = roomsSection.offsetTop;
  const p = roomsTravel ? clamp((y - top) / roomsTravel, 0, 1) : 0;
  const inside = y > top - innerHeight && y < top + roomsSection.offsetHeight;
  const target = inside && !REDUCED ? clamp(-scroll.velocity * 0.35, -6, 6) : 0;
  leanV += (target - lean) * 0.09;
  leanV *= 0.78;
  lean += leanV;
  track.style.transform = `translate3d(${-p * roomsTravel}px, 0, 0) skewX(${lean.toFixed(2)}deg)`;
  roomsTitle.style.transform = `skewX(${(lean * 0.6).toFixed(2)}deg)`;
  $('#rooms-bar').parentElement.style.setProperty('--p', p.toFixed(4));
  // Each photo drifts a little inside its frame: a window onto the room, not a flat card.
  if (y + innerHeight > top && y < top + roomsSection.offsetHeight) {
    for (const img of track.querySelectorAll('.room:not([hidden]) img')) {
      const r = img.parentElement.getBoundingClientRect();
      const c = (r.left + r.width / 2 - innerWidth / 2) / innerWidth;
      img.style.setProperty('--px', `${(-c * 30).toFixed(1)}px`);
    }
  }
});

/* ---------- Prijskaart: a menu card, with a round photo that peeks out at the pointer ---------- */

$('#menu-card').innerHTML = ['consult', 'removal', 'conditions', 'skin', 'hair']
  .map(
    (cat) => `<div class="menu-group"><h3>${CATEGORY_NAMES[cat]}</h3>${treatments
      .filter((t) => t.category === cat)
      .map(
        (t) => `<button type="button" class="menu-row" data-open="${t.id}" data-photo="${t.photo}">
          <span class="n">${t.name}</span>${t.insurable ? '<span class="v">soms vergoed</span>' : ''}<span class="dots"></span><span class="p">${t.priceFrom === 0 ? 'gratis' : `v.a. €${t.priceFrom}`}</span>
        </button>`,
      )
      .join('')}</div>`,
  )
  .join('');
const peek = $('#price-peek');
const pk = { x: 0, y: 0 };
if (FINE) {
  $('#menu-card').addEventListener('pointerover', (e) => {
    const row = e.target.closest('.menu-row');
    if (!row) return;
    peek.firstElementChild.src = photo(row.dataset.photo);
    peek.classList.add('on');
  });
  $('#menu-card').addEventListener('pointerleave', () => peek.classList.remove('on'));
  onFrame(() => {
    pk.x = lerp(pk.x, pointer.x + 140, 0.14);
    pk.y = lerp(pk.y, pointer.y - 40, 0.14);
    peek.style.transform = `translate3d(${pk.x}px, ${pk.y}px, 0) translate(-50%, -50%) scale(${peek.classList.contains('on') ? 1 : 0.4})`;
  });
}

/* ---------- Booking bar on phones: there after the opening, gone near the end ---------- */

const bookBar = $('#book-bar');
const intake = $('#intake');
onFrame((_, y) => {
  bookBar.classList.toggle('on', y > innerHeight * 0.7 && y + innerHeight < intake.offsetTop + 80 && !menuOpen);
});

/* ---------- Resultaten ---------- */

// Faces first: they show the difference best at a glance.
const RESULT_ORDER = ['acne', 'pigment', 'couperose', 'prx', 'sylfirm', 'skinpen', 'ipl', 'xlhair', 'peel', 'legveins', 'tattoo'];
const results = RESULT_ORDER.flatMap((id) => (byId[id]?.ba ?? []).map((key) => ({ key, t: byId[id] })));
const seen = new Set();
const uniqueResults = results.filter((r) => !seen.has(r.key) && seen.add(r.key));
const pick = $('#compare-pick');
pick.innerHTML = uniqueResults
  .map(
    (r, i) => `<button type="button" class="pick" role="option" aria-selected="${i === 0}" data-key="${r.key}" data-name="${r.t.name}">
      <img src="img/${r.key}-na.webp" alt="" loading="lazy" /><span>${r.t.name}</span>
    </button>`,
  )
  .join('');
const compare = $('#compare');
const voor = $('#compare-voor');
const na = $('#compare-na');
const handle = $('#compare-handle');
function showResult(key, name) {
  na.src = `img/${key}-na.webp`;
  voor.firstElementChild.src = `img/${key}-voor.webp`;
  na.alt = `${name}: na de behandeling`;
  voor.firstElementChild.alt = `${name}: voor de behandeling`;
  na.onload = () => compare.style.setProperty('--ratio', `${na.naturalWidth} / ${na.naturalHeight}`);
  $('#compare-caption').textContent = `${name} · cliënt van Pure Clinics`;
  for (const p of $$('.pick', pick)) p.setAttribute('aria-selected', String(p.dataset.key === key));
  sweep();
}
let split = 50;
function setSplit(v) {
  split = clamp(v, 0, 100);
  compare.style.setProperty('--split', `${split}%`);
  handle.setAttribute('aria-valuenow', String(Math.round(split)));
}
// A new result opens with a slow sweep, so the difference shows itself.
let sweepAnim = 0;
function sweep() {
  if (REDUCED) return setSplit(50);
  const start = performance.now();
  cancelAnimationFrame(sweepAnim);
  const step = (now) => {
    const t = Math.min((now - start) / 1800, 1);
    setSplit(50 + Math.sin(t * Math.PI * 2) * 32 * (1 - t));
    if (t < 1) sweepAnim = requestAnimationFrame(step);
  };
  sweepAnim = requestAnimationFrame(step);
}
pick.addEventListener('click', (e) => {
  const b = e.target.closest('.pick');
  if (b) showResult(b.dataset.key, b.dataset.name);
});

// The words in the headline are the switch: "voor" shows the photo before, "na" the one after (after ERA Residence's
// "by day / by night", Site of the Month August 2026).
const eraButtons = $$('.era-switch button');
function glideTo(target) {
  cancelAnimationFrame(sweepAnim);
  const from = split;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / (REDUCED ? 1 : 900), 1);
    setSplit(from + (target - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) sweepAnim = requestAnimationFrame(step);
  };
  sweepAnim = requestAnimationFrame(step);
}
for (const b of eraButtons) {
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => {
    for (const o of eraButtons) o.setAttribute('aria-pressed', String(o === b));
    glideTo(b.dataset.side === 'voor' ? 100 : 0);
  });
}
let dragging = false;
const fromEvent = (e) => {
  const r = compare.getBoundingClientRect();
  setSplit(((e.clientX - r.left) / r.width) * 100);
};
compare.addEventListener('pointerdown', (e) => {
  dragging = true;
  for (const o of eraButtons) o.setAttribute('aria-pressed', 'false');
  cancelAnimationFrame(sweepAnim);
  compare.setPointerCapture(e.pointerId);
  fromEvent(e);
});
compare.addEventListener('pointermove', (e) => dragging && fromEvent(e));
compare.addEventListener('pointerup', () => (dragging = false));
handle.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') setSplit(split - 5);
  if (e.key === 'ArrowRight') setSplit(split + 5);
});
const first = uniqueResults[0];
showResult(first.key, first.t.name);
new IntersectionObserver(([e], o) => {
  if (e.isIntersecting) {
    sweep();
    o.disconnect();
  }
}).observe(compare);

/* ---------- Kliniek: opening hours and whether the door is open now ---------- */

function amsterdamNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { day, hour: Number(parts.hour) + Number(parts.minute) / 60 };
}
const hh = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
function statusFor(loc) {
  const { day, hour } = amsterdamNow();
  const today = loc.hours[day];
  if (today && hour >= today.open && hour < today.close) return { open: true, text: `Nu open · tot ${hh(today.close)}` };
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    const h = loc.hours[d];
    if (h && (i > 0 || hour < h.open)) return { open: false, text: `Gesloten · opent ${i === 0 ? 'vandaag' : i === 1 ? 'morgen' : DAYS[d]} om ${hh(h.open)}` };
  }
  return { open: false, text: 'Gesloten' };
}
const PLACE_PHOTOS = { nijmegen: 'pc-room', uden: 'pc-consult' };
function renderPlaces() {
  const { day } = amsterdamNow();
  const shown = $$('.place.in').length > 0;
  $('#places').innerHTML = data.locations
    .map((loc) => {
      const s = statusFor(loc);
      const order = [1, 2, 3, 4, 5, 6, 0];
      return `<article class="place">
        <div class="place-photo">
          <img src="${photo(PLACE_PHOTOS[loc.id], false)}" alt="" loading="lazy" />
          <span class="status ${s.open ? 'open' : ''}"><i></i>${s.text}</span>
          <h3>${loc.city}</h3>
        </div>
        <div class="place-info">
          <dl class="hours">${order
            .map((d) => {
              const h = loc.hours[d];
              const cls = d === day ? ' class="today"' : '';
              return `<dt${cls}>${DAYS[d]}</dt><dd${cls}>${h ? `${hh(h.open)} – ${hh(h.close)}` : 'gesloten'}</dd>`;
            })
            .join('')}</dl>
          <p class="place-links"><span>${loc.address}<br />${loc.city}</span><a href="tel:${loc.phone.replace(/\s/g, '')}">${loc.phone}</a><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Pure Clinics ${loc.address} ${loc.city}`)}" target="_blank" rel="noopener">Route plannen</a></p>
        </div>
      </article>`;
    })
    .join('');
  for (const p of $$('.place')) shown ? p.classList.add('in') : revealer.observe(p);
  // The same light for everyone at the same moment: the hour in Nijmegen, and what the photo shows of it.
  const nij = statusFor(data.locations[0]);
  const light = daylight();
  $('#hero-clock').textContent = `Nijmegen ${light.time} · ${light.name} · ${nij.open ? 'nu open' : 'nu gesloten'}`;
}
renderPlaces();
setInterval(renderPlaces, 60_000);

/* ---------- Numbers count up when they come into view ---------- */

const counter = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      counter.unobserve(e.target);
      const end = Number(e.target.dataset.count);
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / 1600, 1);
        e.target.textContent = Math.round(end * (1 - Math.pow(1 - t, 4))).toLocaleString('nl-NL');
        if (t < 1) requestAnimationFrame(tick);
      };
      if (!REDUCED) requestAnimationFrame(tick);
    }
  },
  { threshold: 0.6 },
);
$$('.numbers [data-count]').forEach((el) => counter.observe(el));

/* ---------- Treatment sheet ---------- */

const sheet = $('#sheet');
function fillSheet(t) {
  $('#sheet-img').src = photo(t.photo, false);
  $('#sheet-img').alt = '';
  $('#sheet-cat').textContent = `${CATEGORY_NAMES[t.category]}${t.insurable ? ' · soms vergoed' : ''}`;
  $('#sheet-title').textContent = t.name;
  $('#sheet-intro').textContent = t.info?.intro ?? t.description;
  const facts = [
    ['Prijs', price(t)],
    ['Duur', `${t.minutes} min`],
    ['Behandelingen', t.info?.sessions],
    ['Herstel', t.info?.downtime],
  ].filter(([, v]) => v);
  $('#sheet-facts').innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('#sheet-how').textContent = t.info?.how ?? '';
  const ba = t.ba[0];
  $('#sheet-ba').innerHTML = ba
    ? `<figure><img src="img/${ba}-voor.webp" alt="Voor de behandeling" loading="lazy" /><figcaption>Voor</figcaption></figure><figure><img src="img/${ba}-na.webp" alt="Na de behandeling" loading="lazy" /><figcaption>Na</figcaption></figure>`
    : '';
  $('#sheet-book').href = `${APP}afspraak/${t.id}`;
  sheet.querySelector('.sheet-body').scrollTop = 0;
}
function openSheet(id, fromImg) {
  const t = byId[id];
  if (!t) return;
  const show = () => {
    fillSheet(t);
    if (fromImg) fromImg.style.viewTransitionName = '';
    sheet.showModal();
    document.documentElement.classList.add('locked');
  };
  // The photo grows from its card into the sheet when the card is on screen.
  const r = fromImg?.getBoundingClientRect();
  const visible = r && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  if (document.startViewTransition && visible && !REDUCED) {
    fromImg.style.viewTransitionName = 'sheet-photo';
    transition(show);
  } else show();
}

function closeSheet() {
  const done = () => {
    sheet.close();
    document.documentElement.classList.remove('locked');
  };
  transition(done);
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-open]');
  if (!b) return;
  openSheet(b.dataset.open, b.querySelector('img'));
});
$('#sheet-close').addEventListener('click', closeSheet);
sheet.addEventListener('cancel', (e) => {
  e.preventDefault();
  closeSheet();
});
sheet.addEventListener('click', (e) => e.target === sheet && closeSheet());

/* ---------- The parts borrowed from 2026's award winners ---------- */

startToc();
startParticles(concernList, CONCERN_NAMES);
startLoupe();
startDrop();
startLayers(byId);
startFilm();
startLeaves();
startMirror();
startTilt();

// The booking button rises out of its rings as the last section comes in (after Aether 1, Webby 2026 Best Use of
// Animation or Motion Graphics).
const ringCta = $('#ring-cta');
onFrame((_, y) => {
  const r = ringCta.getBoundingClientRect();
  if (r.top > innerHeight || r.bottom < 0) return;
  const p = smoothstep(innerHeight, innerHeight * 0.55, r.top);
  ringCta.style.transform = `translate3d(0, ${((1 - p) * 60).toFixed(1)}px, 0) scale(${(0.9 + p * 0.1).toFixed(3)})`;
});

/* ---------- Start: the loader counts while the fonts and the first photo arrive ---------- */

const loader = $('#loader');
const count = $('#loader-count');
const heroImg = $('#hero-img');
const ready = Promise.all([document.fonts.ready, heroImg.decode().catch(() => {})]);
const t0 = performance.now();
let loaded = false;
ready.then(() => (loaded = true));
const squares = REDUCED ? Promise.resolve() : buildLogoFromSquares($('.loader-logo')).catch(() => $('.loader-logo').classList.add('crisp'));
if (REDUCED) $('.loader-logo').classList.add('crisp');
await new Promise((resolve) => {
  const step = (now) => {
    const t = Math.min((now - t0) / (REDUCED ? 200 : 1500), 1);
    const n = Math.round((loaded ? t : Math.min(t, 0.86)) * 100);
    count.textContent = String(n);
    if (n >= 100) resolve();
    else requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});
await squares;
// The dots are on screen before the loader lifts; they sharpen into the photo as it does.
const heroGL = await startHeroGL($('#hero-gl'), heroImg, pointer, onFrame).catch(() => null);
runSplits();
loader.classList.add('done');
heroGL?.reveal();
setTimeout(() => loader.remove(), 1400);
watch($$('.split, .reveal, .step, .place'));
sizeRooms();

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    for (const el of splits) {
      const wasIn = el.classList.contains('in');
      splitLines(el);
      if (wasIn) el.classList.add('in');
    }
    sizeRooms();
  }, 200);
});
