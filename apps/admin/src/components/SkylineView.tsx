import { IVY_COLORS, LOCATIONS, openingHours, sameDay, type TreatmentCategory } from '@pure-ivy/shared';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

import { CATEGORY_LABEL, phaseOf, revenueOf, ROLE_LABEL, ROOMS, type Appt } from '../data/clinics';
import { clock, eur, hourOf } from '../data/format';
import { SkylineScene, type BlockView } from '../three/skyline';
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

const CLINIC_INDEX = Object.fromEntries(LOCATIONS.map((l, i) => [l.id, i])) as Record<string, number>;

type Props = {
  appts: Appt[];
  day: Date;
  now: Date;
  focus: number | null;
  onFocus: (clinic: number | null) => void;
};

/** The four clinics' day as a 3D skyline, with a card per clinic to zoom in. */
export function SkylineView({ appts, day, now, focus, onFocus }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<SkylineScene | null>(null);
  const describe = useRef<(id: string) => Tip | null>(() => null);
  const mounted = useRef(false);
  const isToday = sameDay(day, now);

  const views = useMemo<BlockView[]>(
    () =>
      appts.map((a) => ({
        id: a.id,
        clinic: CLINIC_INDEX[a.clinic],
        room: a.room,
        startHour: hourOf(a.start),
        endHour: hourOf(a.end),
        height: 0.14 + (a.price / 400) * 1.3,
        color: CATEGORY_COLOR[a.treatment.category],
        phase: isToday ? phaseOf(a, now) : 'later',
      })),
    [appts, now, isToday],
  );

  describe.current = (id) => {
    const a = appts.find((x) => x.id === id);
    if (!a) return null;
    const price = a.price === 0 ? 'gratis' : eur(a.price);
    const city = LOCATIONS[CLINIC_INDEX[a.clinic]].city;
    return {
      title: `${a.treatment.name.nl} · ${price}`,
      detail: `${clock(a.start)}–${clock(a.end)} · ${a.client}${a.firstVisit ? ' (nieuw)' : ''}<br>${a.specialist.name}, ${ROLE_LABEL[a.specialist.role]} · ${city}`,
    };
  };

  useEffect(() => {
    const hours = openingHours(day) ?? { open: 9, close: 21 };
    const stage = new Stage(host.current!, {
      camera: [-4.5, 9.8, 12.8],
      target: [-0.8, 0, 0.5],
      intro: [-14, 1.6, 7.5],
      minDistance: 6,
      maxDistance: 26,
      fitAspect: 2.2,
    });
    const lanes = LOCATIONS.map((l) => ({
      name: l.city,
      detail: `${l.address.split(',')[0]} · ${ROOMS[l.id].length} kamers`,
      rooms: ROOMS[l.id].length,
    }));
    const skyline = new SkylineScene(stage, lanes, hours.open, hours.close, (id) => describe.current(id));
    scene.current = skyline;
    return () => {
      skyline.dispose();
      stage.dispose();
      scene.current = null;
    };
  }, [day]);

  useEffect(() => {
    scene.current?.setBlocks(views);
  }, [views]);

  useEffect(() => {
    scene.current?.setNow(isToday ? hourOf(now) : null, `Nu ${clock(now)}`);
  }, [now, isToday]);

  useEffect(() => {
    // The opening fly-in already ends on the overview, so only react to later changes.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    scene.current?.focus(focus);
  }, [focus]);

  const running = isToday ? appts.filter((a) => phaseOf(a, now) === 'now') : [];
  const realised = isToday ? revenueOf(appts.filter((a) => phaseOf(a, now) === 'done')) : 0;
  const hours = openingHours(day);
  const closedNow = isToday && hours ? hourOf(now) < hours.open || hourOf(now) >= hours.close : false;

  return (
    <section id="klinieken" className="card scene-card rise" style={{ '--d': '300ms' } as CSSProperties}>
      <CardHead
        eyebrow="Klinieken live"
        title={
          <>
            Agenda van <em>{isToday ? 'vandaag' : 'maandag'}</em>
          </>
        }
      >
        <div className="head-actions">
          <span className={`phase ${running.length ? 'phase--live' : ''}`}>
            {!isToday ? 'Zondag gesloten' : closedNow ? 'Nu gesloten' : `${running.length} behandelingen bezig`}
          </span>
        </div>
      </CardHead>

      <div className="scene-host" ref={host} role="img" aria-label="3D-weergave van de afspraken in de vier klinieken">
        <div className="scene-overlay">
          <span>
            <b>{appts.length}</b> afspraken
          </span>
          <span>
            <b>{eur(realised)}</b> gerealiseerd
          </span>
          <span>hoogte = prijs</span>
        </div>
        <div className="scene-legend">
          {(Object.keys(CATEGORY_COLOR) as TreatmentCategory[]).map((category) => (
            <span key={category}>
              <i style={{ background: CATEGORY_COLOR[category] }} /> {CATEGORY_LABEL[category]}
            </span>
          ))}
        </div>
        <span className="scene-hint">Sleep om te draaien · wijs een blok aan</span>
      </div>

      <div className="clinic-row">
        <button className="clinic-card" aria-pressed={focus === null} onClick={() => onFocus(null)}>
          <strong>Alle klinieken</strong>
          <span>
            {appts.length} afspraken · {eur(revenueOf(appts))}
          </span>
          <span className="clinic-busy">{running.length} nu bezig</span>
        </button>
        {LOCATIONS.map((location, index) => {
          const list = appts.filter((a) => a.clinic === location.id);
          const busy = list.filter((a) => isToday && phaseOf(a, now) === 'now').length;
          return (
            <button key={location.id} className="clinic-card" aria-pressed={focus === index} onClick={() => onFocus(focus === index ? null : index)}>
              <strong>{location.city}</strong>
              <span>
                {list.length} afspraken · {eur(revenueOf(list))}
              </span>
              <span className="clinic-busy">{busy} nu bezig</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
