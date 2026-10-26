import { CLINIC_COLORS, LOCATIONS, sameDay } from '@pure-clinics/shared';
import { useEffect, useRef, type CSSProperties } from 'react';

import { clinicIndex, type DaySales, type LiveEvent } from '../data/live';
import { clinicOfOrder } from '../data/shop';
import { useI18n } from '../i18n';
import { SALES_VIEW, SalesScene } from '../three/sales';
import { Stage, type Tip } from '../three/stage';
import { CardHead } from './ui';

const total = (c: { treatments: number; webshop: number }) => c.treatments + c.webshop;

/**
 * This week's sales as a 3D model: a column per clinic per day, treatments below and the webshop on top, what is still
 * booked as an outline. Today's columns grow while payments and orders come in.
 */
export function SalesView({ week, now, events, fast }: { week: DaySales[]; now: Date; events: LiveEvent[]; fast: boolean }) {
  const i18n = useI18n();
  const { t, eur, weekdayShort, dateShort } = i18n;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<SalesScene | null>(null);
  const describe = useRef<(day: number, clinic: number) => Tip | null>(() => null);
  const todayIndex = week.findIndex((d) => sameDay(d.date, now));

  const paid = week.reduce((sum, d) => sum + d.clinics.reduce((s, c) => s + total(c), 0), 0);
  const booked = week.reduce((sum, d) => sum + d.clinics.reduce((s, c) => s + c.booked, 0), 0);
  const today = todayIndex >= 0 ? week[todayIndex].clinics.reduce((s, c) => s + total(c), 0) : 0;

  describe.current = (day, clinic) => {
    const d = week[day];
    const c = d?.clinics[clinic];
    if (!d || !c) return null;
    const lines = [
      c.treatments ? t('sales.treatments', { amount: eur(c.treatments) }) : '',
      c.webshop ? t('sales.webshop', { amount: eur(c.webshop) }) : '',
      c.booked ? t('sales.booked', { amount: eur(c.booked) }) : '',
    ].filter(Boolean);
    return {
      title: `${dateShort(d.date)} · ${LOCATIONS[clinic].city}`,
      detail: lines.length ? lines.join('<br>') : t('sales.nothing'),
    };
  };

  useEffect(() => {
    const stage = new Stage(host.current!, {
      camera: SALES_VIEW.camera,
      target: SALES_VIEW.target,
      intro: [5, 8, 13],
      minDistance: 7,
      maxDistance: 17,
      minPolarAngle: 0.55,
      maxPolarAngle: 1.36,
      minAzimuthAngle: -0.75,
      maxAzimuthAngle: 0.85,
      fitAspect: 1.9,
      sway: 0.045,
    });
    const sales = new SalesScene(
      stage,
      { days: week.map((d) => `${weekdayShort(d.date)} ${d.date.getDate()}`), clinics: LOCATIONS.map((l) => l.city) },
      todayIndex,
      i18n.rtl,
      (day, clinic) => describe.current(day, clinic),
    );
    scene.current = sales;
    return () => {
      sales.dispose();
      stage.dispose();
      scene.current = null;
    };
    // Built once per mount; the parent remounts this view when the language changes.
  }, []);

  useEffect(() => {
    scene.current?.update(
      week.map((d) => d.clinics),
      `<i></i>${t('sales.today')} · ${eur(today)}`,
    );
  }, [week, today]);

  // Each payment and order that just happened drops a coin onto today's column of its clinic.
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    const money = events.filter((e) => e.kind === 'payment' || e.kind === 'order');
    const before = seen.current;
    seen.current = new Set(money.map((e) => e.id));
    if (!before || !scene.current) return;
    const fresh = money.filter((e) => !before.has(e.id));
    if (fresh.length > 8) return;
    for (const e of fresh) {
      if (e.kind === 'payment') scene.current.pay(clinicIndex(e.appt.clinic), 'treatments', fast);
      else if (e.kind === 'order') scene.current.pay(clinicIndex(clinicOfOrder(e.order)), 'webshop', fast);
    }
  }, [events]);

  return (
    <section id="omzet" className="card week-card rise" style={{ '--d': '520ms' } as CSSProperties}>
      <CardHead eyebrow={t('week.eyebrow')} title={eur(paid)}>
        <span className="phase">{t('sales.bookedChip', { amount: eur(booked) })}</span>
      </CardHead>
      <p className="help">{t('sales.help')}</p>
      <div className="scene-host scene-host--sales" ref={host} role="group" aria-label={t('sales.help')}>
        <div className="scene-legend">
          <span>
            <i style={{ background: '#7A6A55' }} /> {t('week.treatments')}
          </span>
          <span>
            <i style={{ background: '#DCC9B3' }} /> {t('week.webshop')}
          </span>
          <span>
            <i className="legend-outline" /> {t('sales.legendBooked')}
          </span>
          <span>
            <i style={{ background: CLINIC_COLORS.now }} /> {t('sales.legendToday')}
          </span>
        </div>
        <span className="scene-hint">{t('sales.hint')}</span>
      </div>
    </section>
  );
}
