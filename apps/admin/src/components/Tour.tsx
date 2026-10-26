import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useI18n, type MessageKey } from '../i18n';
import { Icon } from './Icon';

type Step = { target: string; title: MessageKey; body: MessageKey };

/** The walk-through, in reading order: numbers, clinics, diary, feed, studio, shop, then the play button. */
const STEPS: Step[] = [
  { target: '.kpi', title: 'tour.kpis.title', body: 'tour.kpis.body' },
  { target: '#klinieken', title: 'tour.clinics.title', body: 'tour.clinics.body' },
  { target: '#agenda', title: 'tour.agenda.title', body: 'tour.agenda.body' },
  { target: '#live', title: 'tour.feed.title', body: 'tour.feed.body' },
  { target: '#pilates', title: 'tour.pilates.title', body: 'tour.pilates.body' },
  { target: '#webshop', title: 'tour.webshop.title', body: 'tour.webshop.body' },
  { target: '.play', title: 'tour.play.title', body: 'tour.play.body' },
];

type Box = { top: number; left: number; width: number; height: number };

/** The area covered by every element that matches, in viewport coordinates. */
function measure(selector: string): Box | null {
  const rects = Array.from(document.querySelectorAll(selector), (el) => el.getBoundingClientRect());
  if (!rects.length) return null;
  const top = Math.min(...rects.map((r) => r.top));
  const left = Math.min(...rects.map((r) => r.left));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  const right = Math.max(...rects.map((r) => r.right));
  return { top, left, width: right - left, height: bottom - top };
}

const SEEN = 'admin-tour-seen';

/** The landing page shows the panel as a small picture (?embed=1); the welcome card waits for the real visit. */
function seen(): boolean {
  if (new URLSearchParams(window.location.search).has('embed')) return true;
  try {
    return localStorage.getItem(SEEN) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN, '1');
  } catch {
    // Without storage the welcome card simply shows again next time.
  }
}

/** Offers the tour once, and runs it: a spotlight on each part of the page with a short explanation. */
export function Tour({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const { t, rtl } = useI18n();
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [welcome, setWelcome] = useState(() => !seen());
  const primary = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    markSeen();
    setStep(0);
    onClose();
  }, [onClose]);

  // Bring the step's part of the page into view, then follow it while the page moves.
  useLayoutEffect(() => {
    if (!open) return;
    setWelcome(false);
    markSeen();
    const target = STEPS[step].target;
    const first = document.querySelector(target);
    first?.scrollIntoView({ behavior: 'smooth', block: step === 0 ? 'center' : 'start' });
    const update = () => setBox(measure(target));
    update();
    const timer = window.setInterval(update, 120);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    primary.current?.focus({ preventScroll: true });
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') setStep((s) => Math.min(STEPS.length - 1, s + 1));
      if (event.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) {
    return welcome ? (
      <div className="tour-welcome" role="dialog" aria-label={t('tour.welcomeTitle')}>
        <strong>{t('tour.welcomeTitle')}</strong>
        <p>{t('tour.welcomeBody')}</p>
        <div className="tour-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setWelcome(false);
              onOpen();
            }}
          >
            {t('tour.start')}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setWelcome(false);
              markSeen();
            }}
          >
            {t('tour.skip')}
          </button>
        </div>
      </div>
    ) : null;
  }

  const last = step === STEPS.length - 1;
  const pad = 10;
  // The card goes under the highlighted part, else above it, else at the bottom of the screen.
  const width = Math.min(360, window.innerWidth - 32);
  const height = card.current?.offsetHeight ?? 220;
  let cardTop = 80;
  let cardLeft = 16;
  if (box) {
    const under = box.top + box.height + pad + 12;
    const over = box.top - pad - 12 - height;
    cardTop = under + height < window.innerHeight - 16 ? under : over > 16 ? over : window.innerHeight - height - 16;
    const anchor = rtl ? box.left + box.width - width : box.left;
    cardLeft = Math.min(Math.max(16, anchor), window.innerWidth - width - 16);
  }

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={t(STEPS[step].title)}>
      {box ? (
        <div
          className="tour-spot"
          style={{ top: box.top - pad, left: box.left - pad, width: box.width + pad * 2, height: box.height + pad * 2 }}
        />
      ) : null}
      <div ref={card} className="tour-card" style={{ top: cardTop, left: cardLeft, width }}>
        <div className="tour-head">
          <span className="eyebrow">{t('tour.step', { n: step + 1, total: STEPS.length })}</span>
          <button className="icon-button small" aria-label={t('tour.close')} onClick={close}>
            <Icon name="close" size={16} />
          </button>
        </div>
        <strong>{t(STEPS[step].title)}</strong>
        <p>{t(STEPS[step].body)}</p>
        <div className="tour-actions">
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              {t('tour.back')}
            </button>
          ) : null}
          <button ref={primary} className="btn btn-primary" onClick={() => (last ? close() : setStep(step + 1))}>
            {last ? t('tour.done') : t('tour.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
