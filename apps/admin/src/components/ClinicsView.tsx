import { IVY_COLORS, LOCATIONS, openingHours, sameDay, type TreatmentCategory } from '@pure-ivy/shared';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

import { phaseOf, revenueOf, ROOMS, works, type Appt } from '../data/clinics';
import { hourOf } from '../data/format';
import { Accent, useI18n, type I18n } from '../i18n';
import { ClinicsScene, type RoomView } from '../three/clinics';
import { Stage } from '../three/stage';
import type { Tip } from '../three/studio';
import { CardHead } from './ui';

export const CATEGORY_COLOR: Record<TreatmentCategory, string> = {
  consult: '#FFFFFF',
  injectables: IVY_COLORS.ivy,
  skin: '#9A8676',
  laser: '#CDB79E',
  facials: '#E7D5CA',
};

type Props = {
  appts: Appt[];
  day: Date;
  now: Date;
  focus: number | null;
  onFocus: (clinic: number | null) => void;
};

function roomViews(appts: Appt[], day: Date, now: Date, i18n: I18n): RoomView[][] {
  const isToday = sameDay(day, now);
  return LOCATIONS.map((location) =>
    ROOMS[location.id].map((specialist, room) => {
      if (!works(specialist, day)) return { state: 'off', status: i18n.t('room.off') };
      const list = appts.filter((a) => a.clinic === location.id && a.room === room).sort((a, b) => a.start.getTime() - b.start.getTime());
      const current = isToday ? list.find((a) => phaseOf(a, now) === 'now') : undefined;
      if (current) return { state: 'busy', status: i18n.t('room.busy', { treatment: { treatment: current.treatment.id }, time: current.end }) };
      const next = isToday ? list.find((a) => a.start.getTime() > now.getTime()) : list[0];
      if (next) return { state: 'free', status: i18n.t('room.next', { time: next.start }) };
      return { state: 'done', status: i18n.t('room.done') };
    }),
  );
}

export function appointmentTip(a: Appt, i18n: I18n): Tip {
  const { t, eur } = i18n;
  const city = LOCATIONS.find((l) => l.id === a.clinic)?.city ?? '';
  const when = t('appt.tipWhen', { start: a.start, end: a.end, client: a.client });
  return {
    title: t('appt.tipTitle', { treatment: { treatment: a.treatment.id }, price: a.price === 0 ? t('appt.free') : eur(a.price) }),
    detail: `${when}${a.firstVisit ? ` · ${t('appt.new')}` : ''}<br>${t('appt.tipWho', { specialist: a.specialist.name, role: { msg: `role.${a.specialist.role}` }, city })}`,
  };
}

/** The four clinics right now, as models: a chair per treatment room that turns green while it is in use. */
export function ClinicsView({ appts, day, now, focus, onFocus }: Props) {
  const i18n = useI18n();
  const { t, eur } = i18n;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ClinicsScene | null>(null);
  const describe = useRef<(clinic: number, room: number) => Tip | null>(() => null);
  const mounted = useRef(false);
  const isToday = sameDay(day, now);

  const views = useMemo(() => roomViews(appts, day, now, i18n), [appts, day, now, i18n]);

  describe.current = (clinic, room) => {
    const location = LOCATIONS[clinic];
    const list = appts.filter((a) => a.clinic === location.id && a.room === room).sort((a, b) => a.start.getTime() - b.start.getTime());
    const current = isToday ? list.find((a) => phaseOf(a, now) === 'now') : undefined;
    const next = list.find((a) => !isToday || a.start.getTime() > now.getTime());
    const shown = current ?? next;
    if (shown) return appointmentTip(shown, i18n);
    const specialist = ROOMS[location.id][room];
    return { title: `${specialist.name} · ${t(`role.${specialist.role}`)}`, detail: views[clinic]?.[room]?.status ?? '' };
  };

  useEffect(() => {
    const stage = new Stage(host.current!, {
      camera: [2, 19, 12.8],
      target: [0, 0, 1.1],
      intro: [16, 20, 24],
      minDistance: 6,
      maxDistance: 30,
      fitAspect: 1.7,
    });
    const clinics = LOCATIONS.map((l) => ({
      name: l.city,
      detail: `${l.address.split(',')[0]} · ${t('clinics.rooms', { n: ROOMS[l.id].length })}`,
      rooms: ROOMS[l.id].map((s) => s.name),
    }));
    const clinicsScene = new ClinicsScene(stage, clinics, (clinic, room) => describe.current(clinic, room));
    scene.current = clinicsScene;
    return () => {
      clinicsScene.dispose();
      stage.dispose();
      scene.current = null;
    };
    // Built once per mount; the parent remounts this view when the language changes.
  }, []);

  useEffect(() => {
    scene.current?.update(views);
  }, [views]);

  useEffect(() => {
    // The opening fly-in already ends on the overview, so only react to later changes.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    scene.current?.focus(focus);
  }, [focus]);

  const running = isToday ? appts.filter((a) => phaseOf(a, now) === 'now') : [];
  const hours = openingHours(day);
  const closedNow = isToday && hours ? hourOf(now) < hours.open || hourOf(now) >= hours.close : false;

  return (
    <section id="klinieken" className="card scene-card rise" style={{ '--d': '300ms' } as CSSProperties}>
      <CardHead eyebrow={t('clinics.eyebrow')} title={<Accent text={t('clinics.title')} />}>
        <div className="head-actions">
          <span className={`phase ${running.length ? 'phase--live' : ''}`}>
            {!isToday ? t('clinics.sunday') : closedNow ? t('clinics.closedNow') : t('clinics.busy', { n: running.length })}
          </span>
        </div>
      </CardHead>
      <p className="help">{t('clinics.help')}</p>

      <div className="scene-host" ref={host} role="img" aria-label={t('clinics.help')}>
        <div className="scene-legend">
          <span>
            <i style={{ background: IVY_COLORS.ivy }} /> {t('clinics.legendBusy')}
          </span>
          <span>
            <i style={{ background: '#FFFFFF' }} /> {t('clinics.legendFree')}
          </span>
          <span>
            <i style={{ background: '#D9D2C8' }} /> {t('clinics.legendOff')}
          </span>
        </div>
        <span className="scene-hint">{t('clinics.hint')}</span>
      </div>

      <div className="clinic-row">
        <button className="clinic-card" aria-pressed={focus === null} onClick={() => onFocus(null)}>
          <strong>{t('clinics.all')}</strong>
          <span>{t('clinics.appts', { n: appts.length, revenue: eur(revenueOf(appts)) })}</span>
          <span className="clinic-busy">{t('clinics.busyNow', { n: running.length })}</span>
        </button>
        {LOCATIONS.map((location, index) => {
          const list = appts.filter((a) => a.clinic === location.id);
          const busy = list.filter((a) => isToday && phaseOf(a, now) === 'now').length;
          return (
            <button key={location.id} className="clinic-card" aria-pressed={focus === index} onClick={() => onFocus(focus === index ? null : index)}>
              <strong>{location.city}</strong>
              <span>{t('clinics.appts', { n: list.length, revenue: eur(revenueOf(list)) })}</span>
              <span className="clinic-busy">{t('clinics.busyNow', { n: busy })}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
