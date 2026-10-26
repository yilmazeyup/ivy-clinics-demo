import { CLINIC_COLORS, LOCATIONS, openingHours, sameDay, type Treatment, type TreatmentCategory } from '@pure-clinics/shared';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

import { isOpen, phaseOf, revenueOf, ROOMS, works, type Appt } from '../data/clinics';
import { clinicIndex, type LiveEvent } from '../data/live';
import { hourOf } from '../data/format';
import { Accent, useI18n, type I18n } from '../i18n';
import { ClinicsScene, OVERVIEW, type RoomRef, type RoomView } from '../three/clinics';
import type { Spot } from '../three/figures';
import { Stage, type Tip } from '../three/stage';
import { ClientCard } from './ClientCard';
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
  /** What has happened today so far; new payments and online bookings play in the model. */
  events: LiveEvent[];
  /** The day is playing fast: shorter animations. */
  fast: boolean;
};

/** Keeps a Latin name in one piece inside Arabic text, so "Noor V." keeps its full stop at the end. */
const isolate = (name: string) => `\u2068${name}\u2069`;

/** Where the specialist stands for a treatment: by the face for skin work, at the middle for laser, by the hands for nails. */
function spotFor(treatment: Treatment): Spot {
  if (treatment.id === 'nails') return 'hands';
  if (treatment.category === 'removal') return 'middle';
  return 'head';
}

const roomList = (appts: Appt[], clinic: number, room: number) =>
  appts.filter((a) => a.clinic === LOCATIONS[clinic].id && a.room === room).sort((a, b) => a.start.getTime() - b.start.getTime());

function roomViews(appts: Appt[], day: Date, now: Date, i18n: I18n): RoomView[][] {
  const { t } = i18n;
  const isToday = sameDay(day, now);
  return LOCATIONS.map((location, clinic) => {
    const hours = openingHours(day, location.id);
    // The specialist is in while the doors are open; before and after, the room is empty.
    const openNow = isToday && hours !== null && hourOf(now) >= hours.open && hourOf(now) < hours.close;
    return ROOMS[location.id].map((specialist, room): RoomView => {
      if (!isOpen(location.id, day)) return { state: 'off', status: t('room.closed'), staffed: false, client: null };
      if (!works(specialist, day)) return { state: 'off', status: t('room.off'), staffed: false, client: null };
      const list = roomList(appts, clinic, room);
      const current = isToday ? list.find((a) => phaseOf(a, now) === 'now') : undefined;
      if (current) {
        return {
          state: 'busy',
          status: t('room.busy', { treatment: { treatment: current.treatment.id }, time: current.end }),
          staffed: true,
          client: {
            id: current.id,
            name: current.client,
            with: t('room.with', { client: isolate(current.client) }),
            treatment: i18n.text(current.treatment.name),
            until: t('room.until', { time: current.end }),
            action: t('client.open', { client: current.client }),
            spot: spotFor(current.treatment),
          },
        };
      }
      const next = isToday ? list.find((a) => a.start.getTime() > now.getTime()) : list[0];
      if (next) return { state: 'free', status: t('room.next', { time: next.start }), staffed: openNow, client: null };
      return { state: 'done', status: t('room.done'), staffed: openNow, client: null };
    });
  });
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

type OpenCard = RoomRef & { id: string };

/**
 * Both clinics right now, as models: in every room the specialist by the chair, and the client in it while a treatment
 * is going on. Clicking a client opens her card inside the model.
 */
export function ClinicsView({ appts, day, now, focus, onFocus, events, fast }: Props) {
  const i18n = useI18n();
  const { t, tn, eur } = i18n;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ClinicsScene | null>(null);
  const [cardHost, setCardHost] = useState<HTMLElement | null>(null);
  const [card, setCard] = useState<OpenCard | null>(null);
  const describe = useRef<(clinic: number, room: number) => Tip | null>(() => null);
  const select = useRef<(room: RoomRef | null) => void>(() => {});
  const mounted = useRef(false);
  const isToday = sameDay(day, now);

  const views = useMemo(() => roomViews(appts, day, now, i18n), [appts, day, now, i18n]);

  const currentIn = (clinic: number, room: number) =>
    isToday ? roomList(appts, clinic, room).find((a) => phaseOf(a, now) === 'now') : undefined;

  describe.current = (clinic, room) => {
    const list = roomList(appts, clinic, room);
    const current = currentIn(clinic, room);
    if (current) return { ...appointmentTip(current, i18n), hint: t('room.cardHint') };
    const next = list.find((a) => !isToday || a.start.getTime() > now.getTime());
    if (next) return appointmentTip(next, i18n);
    const specialist = ROOMS[LOCATIONS[clinic].id][room];
    return { title: `${specialist.name} · ${t(`role.${specialist.role}`)}`, detail: views[clinic]?.[room]?.status ?? '' };
  };

  const closeCard = () => {
    if (!card) return;
    // Keyboard users go back to the room's sign they came from.
    const inside = cardHost?.contains(document.activeElement) ?? false;
    setCard(null);
    scene.current?.closeCard(true);
    if (inside) scene.current?.roomTag(card.clinic, card.room)?.focus({ preventScroll: true });
  };

  select.current = (ref) => {
    if (!ref) {
      closeCard();
      return;
    }
    const current = currentIn(ref.clinic, ref.room);
    if (!current) return;
    setCard({ ...ref, id: current.id });
    scene.current?.openCard(ref.clinic, ref.room);
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
    const clinicsScene = new ClinicsScene(
      stage,
      clinics,
      (clinic, room) => describe.current(clinic, room),
      (room) => select.current(room),
    );
    scene.current = clinicsScene;
    setCardHost(clinicsScene.cardElement);
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

  // Payments and online bookings that just happened play in the model; the ones before the page opened do not.
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    const moments = events.filter((e) => e.kind === 'payment' || e.kind === 'booking');
    const before = seen.current;
    seen.current = new Set(moments.map((e) => e.id));
    if (!before || !scene.current) return;
    const fresh = moments.filter((e) => !before.has(e.id));
    // A jump in time (a new day, the clock set back) is not a burst of payments.
    if (fresh.length > 8) return;
    for (const e of fresh) {
      if (e.kind !== 'payment' && e.kind !== 'booking') continue;
      const clinic = clinicIndex(e.appt.clinic);
      if (e.kind === 'payment') scene.current.pay(clinic, e.appt.room, `+ ${eur(e.appt.price)}`, fast);
      else scene.current.booked(clinic, e.appt.room, t('room.booked', { time: e.appt.start }), fast);
    }
  }, [events]);

  useEffect(() => {
    // The opening fly-in already ends on the overview, so only react to later changes.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setCard(null);
    scene.current?.focus(focus);
  }, [focus]);

  // Escape closes the card, wherever the focus is.
  useEffect(() => {
    if (!card) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCard();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card]);

  const cardAppt = card ? appts.find((a) => a.id === card.id) : undefined;
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

      <div className="scene-host" ref={host} role="group" aria-label={t('clinics.help')}>
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
      {card && cardAppt && cardHost ? createPortal(<ClientCard key={card.id} appt={cardAppt} now={now} onClose={closeCard} />, cardHost) : null}

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
