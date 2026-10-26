import { PURE_CAPACITY, WINDOW_REFORMERS } from '@pure-ivy/shared';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

import { clock, hourOf } from '../data/format';
import { checkedIn, freeReformers, phaseOf, type ClassPhase, type PilatesClass } from '../data/pilates';
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

function phaseText(c: PilatesClass, phase: ClassPhase, now: Date): string {
  if (phase === 'done') return `${c.seats.filter((s) => checkedIn(s, c, now)).length} van ${c.seats.length} kwamen`;
  if (phase === 'live') return 'Nu bezig';
  if (phase === 'soon') return `Over ${Math.max(1, Math.round((c.start.getTime() - now.getTime()) / 60000))} min`;
  const free = freeReformers(c).length;
  if (free === 0) return c.waitlist > 0 ? `Vol · ${c.waitlist} wachtend` : 'Vol';
  return `${free} ${free === 1 ? 'plek' : 'plekken'} vrij`;
}

/** The pilates studio in 3D for the chosen class, with today's classes underneath to switch between. */
export function StudioView({ classes, selected, now, follow, onSelect, onFollow }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<StudioScene | null>(null);
  const describe = useRef<(reformer: number) => Tip | null>(() => null);
  const phase = phaseOf(selected, now);

  const seats = useMemo<SeatView[]>(
    () =>
      selected.seats.map((seat) => {
        const inside = checkedIn(seat, selected, now);
        const state = inside ? 'in' : phase === 'done' ? 'noshow' : 'booked';
        return { reformer: seat.reformer, state, name: seat.member };
      }),
    [selected, now, phase],
  );

  describe.current = (reformer) => {
    const seat = selected.seats.find((s) => s.reformer === reformer);
    const place = WINDOW_REFORMERS.includes(reformer) ? 'bij het raam' : reformer <= 4 ? 'voorste rij' : 'achterste rij';
    if (!seat) return { title: `Reformer ${reformer}`, detail: `Vrij · ${place}` };
    const visits = seat.visits === 1 ? 'eerste les' : `${seat.visits}e les`;
    const credits = seat.credits === 'unlimited' ? 'onbeperkt' : `${seat.credits} credits over`;
    const state = checkedIn(seat, selected, now) ? 'ingecheckt' : phase === 'done' ? 'niet gekomen' : 'nog niet binnen';
    return { title: `${seat.member} · reformer ${reformer}`, detail: `${visits} · ${credits} · ${state}` };
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
    const studio = new StudioScene(stage, (n) => describe.current(n));
    scene.current = studio;
    return () => {
      studio.dispose();
      stage.dispose();
      scene.current = null;
    };
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
        eyebrow="Pilates live"
        title={
          <>
            {selected.name} <span className="title-time">{clock(selected.start)}</span>
          </>
        }
      >
        <div className="head-actions">
          <span className={`phase phase--${phase}`}>{phaseText(selected, phase, now)}</span>
          {follow ? (
            <span className="follow on">
              <i className="live-dot" /> Volgt de klok
            </span>
          ) : (
            <button className="follow" onClick={onFollow}>
              <Icon name="arrow" size={15} /> Terug naar nu
            </button>
          )}
        </div>
      </CardHead>

      <div className="scene-host" ref={host} role="img" aria-label={`3D-weergave van de pilatesstudio tijdens ${selected.name} om ${clock(selected.start)}`}>
        <div className="scene-overlay">
          <span>
            <b>{seats.length}</b> geboekt
          </span>
          <span>
            <b>{inside}</b> binnen
          </span>
          <span>
            <b>{PURE_CAPACITY - seats.length}</b> vrij
          </span>
          {selected.waitlist > 0 ? (
            <span>
              <b>{selected.waitlist}</b> wachtlijst
            </span>
          ) : null}
        </div>
        <div className="scene-legend">
          <span>
            <i style={{ background: SEAT_COLORS.free }} /> Vrij
          </span>
          <span>
            <i style={{ background: SEAT_COLORS.booked }} /> Geboekt
          </span>
          <span>
            <i style={{ background: SEAT_COLORS.in }} /> Binnen
          </span>
          <span>
            <i style={{ background: SEAT_COLORS.noshow }} /> Niet gekomen
          </span>
        </div>
        <span className="scene-hint">Sleep om te draaien · scroll om te zoomen</span>
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
              <Squares total={PURE_CAPACITY} filled={c.seats.length} size={8} />
              <span className="cs-status">{phaseText(c, p, now)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
