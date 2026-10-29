// What every part of the site shares: one smoothed scroll position, one pointer, one frame loop.

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const FINE = matchMedia('(pointer: fine)').matches;

/* ---------- Scroll ---------- */

export const scroll = {
  y: scrollY,
  target: scrollY,
  velocity: 0,
  smooth: FINE && !REDUCED,
  animating: false,
  max: () => document.documentElement.scrollHeight - innerHeight,
  to(y, instant = false) {
    this.target = clamp(y, 0, this.max());
    if (!this.smooth || instant) {
      scrollTo({ top: this.target, behavior: instant || REDUCED ? 'instant' : 'smooth' });
      return;
    }
    this.animating = true;
  },
};

if (scroll.smooth) {
  addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || document.documentElement.classList.contains('locked')) return;
      // Let scrollable panels (the results list, the treatment sheet) scroll themselves.
      if (e.target.closest('.compare-pick, .sheet, .menu')) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1;
      scroll.target = clamp(scroll.target + e.deltaY * unit, 0, scroll.max());
      scroll.animating = true;
    },
    { passive: false },
  );
}
addEventListener(
  'scroll',
  () => {
    // Keyboard, scrollbar and touch move the page natively; follow them.
    if (!scroll.animating) scroll.target = scroll.y = scrollY;
  },
  { passive: true },
);

/* ---------- Pointer ---------- */

export const pointer = { x: innerWidth / 2, y: innerHeight / 2, moved: false };
addEventListener(
  'pointermove',
  (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.moved = true;
  },
  { passive: true },
);

/* ---------- Frame loop ---------- */

const hooks = [];
/** Runs fn(time, scrollY) on every frame. */
export const onFrame = (fn) => hooks.push(fn);
let lastY = scrollY;
function frame(time) {
  if (scroll.animating) {
    scroll.y = lerp(scroll.y, scroll.target, 0.095);
    if (Math.abs(scroll.target - scroll.y) < 0.5) {
      scroll.y = scroll.target;
      scroll.animating = false;
    }
    scrollTo(0, scroll.y);
  }
  const y = scrollY;
  scroll.velocity = lerp(scroll.velocity, y - lastY, 0.2);
  lastY = y;
  for (const fn of hooks) {
    // One effect that fails must not stop the others.
    try {
      fn(time, y);
    } catch (e) {
      console.error(e);
      hooks.splice(hooks.indexOf(fn), 1);
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/** The element's top in page coordinates, whatever it sits inside. */
export function pageTop(el) {
  let top = 0;
  for (let e = el; e; e = e.offsetParent) top += e.offsetTop;
  return top;
}

/** How far the page has scrolled through a tall section that pins its content: 0 at its top, 1 at its end. */
export function pinProgress(section, y = scrollY) {
  const travel = section.offsetHeight - innerHeight;
  return travel > 0 ? clamp((y - pageTop(section)) / travel, 0, 1) : 0;
}

/** True while any part of the element is within the window. */
export function onScreen(el, y = scrollY, margin = 0) {
  const top = pageTop(el);
  return y + innerHeight > top - margin && y < top + el.offsetHeight + margin;
}

/** A view transition that is skipped (another one started, the tab hid) still applies its change. */
export function transition(update) {
  if (!document.startViewTransition || REDUCED) return update();
  const vt = document.startViewTransition(update);
  vt.ready.catch(() => {});
  vt.finished.catch(() => {});
  vt.updateCallbackDone.catch(() => {});
  return vt;
}
