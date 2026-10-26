import { WINDOW_REFORMERS } from '@pure-ivy/shared';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

import { hourOf } from '../data/format';
import { checkedIn, freeSpots, onMats, phaseOf, type ClassPhase, type PilatesClass } from '../data/pilates';
import { useI18n, type I18n } from '../i18n';
import { Stage } from '../three/stage';
import { SEAT_COLORS, StudioScene, type SeatView, type Tip } from '../three/studio';
import { Icon } from './Icon';
import { CardHead, Squares } from './ui';

type Props = {
  classes: PilatesClass[];
  selected: PilatesClass;
  now: Date;
  follow: boolean;
  onSelect: (id: string) => void;
  onFollow: () => void;
};

function phaseText(c: PilatesClass, phase: ClassPhase, now: Date, { t, tn }: I18n): string {
  if (phase === 'done') return t('phase.done', { n: c.seats.filter((s) => checkedIn(s, c, now)).length, total: c.seats.length });
  if (phase === 'live') return t('phase.live');
  if (phase === 'soon') return t('phase.soon', { n: Math.max(1, Math.round((c.start.getTime() - now.getTime()) / 60000)) });
  const free = freeSpots(c).length;
  if (free === 0) return c.waitlist > 0 ? t('phase.fullWaiting', { n: c.waitlist }) : t('phase.full');
  return tn('phase.free', free);
}

/** The pilates studio in 3D for the chosen class, with today's classes underneath to switch between. */
export function StudioView({ classes, selected, now, follow, onSelect, onFollow }: Props) {
  const i18n = useI18n();
  const { t, clock } = i18n;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<StudioScene | null>(null);
  const describe = useRef<(spot: number) => Tip | null>(() => null);
  const mats = onMats(selected);
  const phase = phaseOf(selected, now);

  const seats = useMemo<SeatView[]>(
    () =>
      selected.seats.map((seat) => {
        const inside = checkedIn(seat, selected, now);
        const state = inside ? 'in' : phase === 'done' ? 'noshow' : 'booked';
        return { spot: seat.spot, state, name: seat.member };
      }),
    [selected, now, phase],
  );

  describe.current = (spot) => {
    const seat = selected.seats.find((s) => s.spot === spot);
    const place = mats ? t('seat.matRoom') : t(WINDOW_REFORMERS.includes(spot) ? 'seat.window' : spot <= 4 ? 'seat.front' : 'seat.back');
    if (!seat) return { title: t(mats ? 'seat.spot' : 'seat.reformer', { n: spot }), detail: t('seat.freeAt', { place }) };
    const visits = seat.visits === 1 ? t('seat.firstClass') : t('seat.nthClass', { n: seat.visits });
    const credits = seat.credits === 'unlimited' ? t('seat.unlimited') : t('seat.credits', { n: seat.credits });
    const state = t(checkedIn(seat, selected, now) ? 'seat.in' : phase === 'done' ? 'seat.noShow' : 'seat.waiting');
    return { title: t(mats ? 'seat.titleSpot' : 'seat.title', { member: seat.member, n: spot }), detail: `${visits} · ${credits} · ${state}` };
  };

  useEffect(() => {
    const stage = new Stage(host.current!, {
      camera: [8.1, 7.9, 11.8],
      target: [-0.3, 0.2, 0.3],
      intro: [14, 16, 18],
      minDistance: 8,
      maxDistance: 24,
      fitAspect: 1.45,
    });
    const studio = new StudioScene(
      stage,
      (n) => describe.current(n),
      { instructor: t('pilates.instructor'), checkin: t('pilates.checkin'), noShow: t('pilates.noShow') },
      mats ? 'mat' : 'reformer',
    );
    scene.current = studio;
    return () => {
      studio.dispose();
      stage.dispose();
      scene.current = null;
    };
    // Built once per mount; the parent remounts this view when the language or the room (reformers or mats) changes.
  }, []);

  useEffect(() => {
    scene.current?.update(seats, { live: phase === 'live', instructor: selected.instructor });
  }, [seats, phase, selected.instructor]);

  useEffect(() => {
    scene.current?.setHour(hourOf(now));
  }, [now]);

  const inside = seats.filter((s) => s.state === 'in').length;

  return (
    <section id="pilates" className="card scene-card studio-card rise" style={{ '--d': '380ms' } as CSSProperties}>
      <CardHead
        eyebrow={`${t('pilates.eyebrow')} · ${t(`class.${selected.discipline}`)}`}
        title={
          <>
            {selected.name} <span className="title-time">{clock(selected.start)}</span>
          </>
        }
      >
        <div className="head-actions">
          <span className={`phase phase--${phase}`}>{phaseText(selected, phase, now, i18n)}</span>
          {follow ? (
            <span className="follow on">
              <i className="live-dot" /> {t('pilates.follow')}
            </span>
          ) : (
            <button className="follow" onClick={onFollow}>
              <Icon name="arrow" size={15} /> {t('pilates.back')}
            </button>
          )}
        </div>
      </CardHead>
      <p className="help">{t('pilates.help')}</p>

      <div className="scene-host" ref={host} role="img" aria-label={t('pilates.aria', { class: selected.name, time: selected.start })}>
        <div className="scene-overlay">
          <span>{t('pilates.booked', { n: seats.length })}</span>
          <span>{t('pilates.inside', { n: inside })}</span>
          <span>{t('pilates.free', { n: selected.capacity - seats.length })}</span>
          {selected.waitlist > 0 ? <span>{t('pilates.waitlist', { n: selected.waitlist })}</span> : null}
        </div>
        <div className="scene-legend">
          <span>
            <i style={{ background: SEAT_COLORS.free }} /> {t('pilates.legendFree')}
          </span>
          <span>
            <i style={{ background: SEAT_COLORS.booked }} /> {t('pilates.legendBooked')}
          </span>
          <span>
            <i style={{ background: SEAT_COLORS.in }} /> {t('pilates.legendIn')}
          </span>
          <span>
            <i style={{ background: SEAT_COLORS.noshow }} /> {t('pilates.legendNoShow')}
          </span>
        </div>
        <span className="scene-hint">{t('pilates.hint')}</span>
      </div>

      <div className="class-strip" role="list">
        {classes.map((c) => {
          const p = phaseOf(c, now);
          return (
            <button key={c.id} className={`class-chip ${p}`} aria-pressed={c.id === selected.id} onClick={() => onSelect(c.id)}>
              <span className="cs-time">
                {clock(c.start)}
                {p === 'live' ? <i className="live-dot" /> : null}
              </span>
              <span className="cs-name">{c.name}</span>
              <span className="cs-kind">{t(`class.${c.discipline}`)}</span>
              <Squares total={c.capacity} filled={c.seats.length} size={8} />
              <span className="cs-status">{phaseText(c, p, now, i18n)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
