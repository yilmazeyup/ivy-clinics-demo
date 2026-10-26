import { CLINIC_COLORS, LOCATIONS, openingHours, sameDay, type TreatmentCategory } from '@pure-clinics/shared';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

import { isOpen, phaseOf, revenueOf, ROOMS, works, type Appt } from '../data/clinics';
import { hourOf } from '../data/format';
import { Accent, useI18n, type I18n } from '../i18n';
import { ClinicsScene, OVERVIEW, type RoomView } from '../three/clinics';
import { Stage, type Tip } from '../three/stage';
import { CardHead } from './ui';

/** One colour per kind of treatment, in the clinic's own warm range; Blanche Beauty Studio is the blush one. */
export const CATEGORY_COLOR: Record<TreatmentCategory, string> = {
  consult: '#FFFFFF',
  removal: '#D9C4A6',
  conditions: CLINIC_COLORS.taupeDark,
  skin: '#B29C82',
  hair: '#4E463F',
  beauty: '#EBD9CF',
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
      if (!isOpen(location.id, day)) return { state: 'off', status: i18n.t('room.closed') };
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

/** Both clinics right now, as models: a chair per treatment room that turns green while it is in use. */
export function ClinicsView({ appts, day, now, focus, onFocus }: Props) {
  const i18n = useI18n();
  const { t, tn, eur } = i18n;
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
      camera: OVERVIEW.camera,
      target: OVERVIEW.target,
      intro: [14, 17, 21],
      minDistance: 6,
      maxDistance: 30,
      fitAspect: 1.55,
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
  // "Closed now" only when neither clinic is open at this hour.
  const closedNow =
    isToday &&
    LOCATIONS.every((l) => {
      const hours = openingHours(day, l.id);
      return !hours || hourOf(now) < hours.open || hourOf(now) >= hours.close;
    });

  return (
    <section id="klinieken" className="card scene-card rise" style={{ '--d': '300ms' } as CSSProperties}>
      <CardHead eyebrow={t('clinics.eyebrow')} title={<Accent text={t('clinics.title')} />}>
        <div className="head-actions">
          <span className={`phase ${running.length ? 'phase--live' : ''}`}>
            {!isToday ? t('clinics.sunday') : closedNow ? t('clinics.closedNow') : tn('clinics.busy', running.length)}
          </span>
        </div>
      </CardHead>
      <p className="help">{t('clinics.help')}</p>

      <div className="scene-host" ref={host} role="img" aria-label={t('clinics.help')}>
        <div className="scene-legend">
          <span>
            <i style={{ background: CLINIC_COLORS.now }} /> {t('clinics.legendBusy')}
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
          const open = isOpen(location.id, day);
          return (
            <button key={location.id} className="clinic-card" aria-pressed={focus === index} onClick={() => onFocus(focus === index ? null : index)}>
              <strong>{location.city}</strong>
              <span>{open ? t('clinics.appts', { n: list.length, revenue: eur(revenueOf(list)) }) : t('clinics.closedDay')}</span>
              <span className="clinic-busy">{open ? t('clinics.busyNow', { n: busy }) : ''}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
