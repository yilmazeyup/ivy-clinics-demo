import { SHADES, studioHours } from '@pure-clinics/shared/src/blanche';
import { useEffect, useMemo, useRef, useState } from 'react';

import { hourOf } from '../../../src/data/format';
import { Stage, type Tip } from '../../../src/three/stage';
import { phaseOf, STATIONS, type Appt } from '../data/day';
import { inStudio, type LiveEvent } from '../data/live';
import { Accent, useI18n, type I18n } from '../i18n';
import { OVERVIEW, StudioScene, type StationView, type Waiting } from '../three/studio';
import { ClientCard } from './ClientCard';
import { Head } from './ui';

type Props = { appts: Appt[]; day: Date; now: Date; today: boolean; events: LiveEvent[]; fast: boolean };

/** Keeps a Latin name in one piece inside Arabic text. */
const isolate = (name: string) => `⁨${name}⁩`;

function stationViews(appts: Appt[], day: Date, now: Date, today: boolean, i18n: I18n): StationView[] {
  const { t, text } = i18n;
  const hours = studioHours(day);
  const open = today && hours !== null && hourOf(now) >= hours.open && hourOf(now) < hours.close;
  return STATIONS.map(({ stylist, index }) => {
    const list = appts.filter((a) => a.station === index).sort((a, b) => a.start.getTime() - b.start.getTime());
    if (!list.length) return { state: 'off', status: hours ? t('studio.off') : t('studio.closed'), staffed: false, client: null };
    const current = today ? list.find((a) => phaseOf(a, now) === 'now') : undefined;
    if (current) {
      return {
        state: 'busy',
        status: t('studio.busy', { service: text(current.service.name), time: current.end }),
        staffed: true,
        client: { id: current.id, name: current.client, with: t('studio.with', { client: isolate(current.client) }) },
      };
    }
    const next = today ? list.find((a) => a.start.getTime() > now.getTime()) : list[0];
    void stylist;
    if (next) return { state: 'free', status: t('studio.next', { time: next.start }), staffed: open, client: null };
    return { state: 'done', status: t('studio.done'), staffed: open, client: null };
  });
}

/**
 * The studio right now as a 3D model: each stylist at her station, clients in the chair, on the lash bed or waiting on
 * the sofa. Clicking a client opens her card beside the model. Payments, bookings, shop orders and tags play in it.
 */
export function StudioView({ appts, day, now, today, events, fast }: Props) {
  const i18n = useI18n();
  const { t, tn, eur, dayLong } = i18n;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<StudioScene | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const describe = useRef<(station: number) => Tip | null>(() => null);
  const select = useRef<(id: string | null) => void>(() => {});
  const views = useMemo(() => stationViews(appts, day, now, today, i18n), [appts, day, now, today, i18n]);
  const presence = useMemo(() => (today ? inStudio(appts, events, now) : { busy: [], waiting: [] }), [appts, events, now, today]);
  const waiting: Waiting[] = presence.waiting.slice(0, 3).map((a) => ({ id: a.id, name: a.client }));

  describe.current = (station) => {
    const list = appts.filter((a) => a.station === station);
    const current = today ? list.find((a) => phaseOf(a, now) === 'now') : undefined;
    const stylist = STATIONS[station].stylist;
    if (current) {
      return {
        title: `${current.client} · ${i18n.text(current.service.name)}`,
        detail: `${i18n.clock(current.start)}–${i18n.clock(current.end)} · ${stylist.name} · ${eur(current.price)}`,
        hint: t('studio.hint'),
      };
    }
    return { title: stylist.name, detail: views[station]?.status ?? '' };
  };
  select.current = (id) => setOpen(id);

  useEffect(() => {
    const stage = new Stage(host.current!, {
      camera: OVERVIEW.camera,
      target: OVERVIEW.target,
      intro: [12, 15, 20],
      minDistance: 7,
      maxDistance: 30,
      maxPolarAngle: 1.25,
      fitAspect: 1.45,
      sway: 0.16,
    });
    const studio = new StudioScene(
      stage,
      {
        stylists: STATIONS.map((s) => s.stylist.name),
        crafts: [t('studio.nails'), t('studio.nails'), t('studio.lashes')],
        desk: t('studio.desk'),
        wall: t('studio.wall'),
        sofa: t('studio.sofa'),
        hint: t('studio.hint'),
      },
      (station) => describe.current(station),
      (id) => select.current(id),
    );
    scene.current = studio;
    return () => {
      studio.dispose();
      stage.dispose();
      scene.current = null;
    };
    // Built once per mount; the parent remounts this view when the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scene.current?.update(views, waiting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [views, waiting.map((w) => w.id).join()]);

  // What just happened plays in the model; the moments before the page opened do not.
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    const before = seen.current;
    seen.current = new Set(events.map((e) => e.id));
    if (!before || !scene.current) return;
    const fresh = events.filter((e) => !before.has(e.id));
    if (fresh.length > 10) return;
    for (const e of fresh) {
      if (e.kind === 'payment') scene.current.pay(e.appt.station, `+ ${eur(e.appt.price)}`, fast);
      else if (e.kind === 'booking') scene.current.booked(e.appt.station, t('agenda.new'));
      else if (e.kind === 'order') scene.current.order(`+ ${eur(e.order.total)}`);
      else if (e.kind === 'tag' && e.appt) scene.current.tagged(e.appt.station);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const card = open ? appts.find((a) => a.id === open) : undefined;
  return (
    <section id="studio" className="panel studio-panel">
      <Head title={<Accent text={t('studio.title')} />} sub={today ? t('studio.sub') : t('studio.closedToday', { day: dayLong(day) })}>
        <span className={`live-pill ${presence.busy.length ? 'is-live' : ''}`}>
          <i />
          {presence.waiting.length ? tn('studio.waiting', presence.waiting.length) : `${presence.busy.length} / ${STATIONS.length}`}
        </span>
        <button className="btn btn-soft btn-sm" onClick={() => scene.current?.flyHome()}>
          {t('studio.reset')}
        </button>
      </Head>
      <div className="scene-wrap">
        <div className="scene-host" ref={host} role="group" aria-label={t('studio.sub')}>
          <div className="scene-legend">
            <span>
              <i style={{ background: SHADES.cherry.soft }} /> {t('studio.legend.busy')}
            </span>
            <span>
              <i style={{ background: '#FFFFFF' }} /> {t('studio.legend.free')}
            </span>
            <span>
              <i style={{ background: '#FFE58F' }} /> {t('studio.legend.wait')}
            </span>
          </div>
        </div>
        {card ? <ClientCard key={card.id} appt={card} onClose={() => setOpen(null)} /> : null}
      </div>
    </section>
  );
}
