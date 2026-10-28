import { studioHours } from '@pure-clinics/shared/src/blanche';
import type { CSSProperties } from 'react';

import { hourOf } from '../../../src/data/format';
import { phaseOf, STATIONS, type Appt } from '../data/day';
import { Accent, useI18n } from '../i18n';
import { Head } from './ui';

/** Today per stylist on one timeline: blocks in the colour of the craft, a line for now, new app bookings marked. */
export function Agenda({ appts, day, now, today }: { appts: Appt[]; day: Date; now: Date; today: boolean }) {
  const { t, text, clock } = useI18n();
  const hours = studioHours(day) ?? { open: 9, close: 21 };
  const span = hours.close - hours.open;
  const at = (date: Date) => ((hourOf(date) - hours.open) / span) * 100;
  const nowAt = today ? Math.min(100, Math.max(0, ((hourOf(now) - hours.open) / span) * 100)) : -1;
  return (
    <section id="agenda" className="panel">
      <Head title={<Accent text={t('agenda.title')} />} sub={t('agenda.sub')} />
      <div className="agenda" style={{ '--hours': span } as CSSProperties}>
        <div className="agenda-hours">
          <span />
          <div>
            {Array.from({ length: span + 1 }, (_, i) => (
              <span key={i} style={{ insetInlineStart: `${(i / span) * 100}%` }}>
                {hours.open + i}
              </span>
            ))}
          </div>
        </div>
        {STATIONS.map(({ stylist, index }, row) => (
          <div key={stylist.id} className="agenda-row">
            <span className={`agenda-who craft-${stylist.crafts[0]}`}>{stylist.name}</span>
            <div className="agenda-track">
              {appts
                .filter((a) => a.station === index)
                .map((a) => {
                  const phase = today ? phaseOf(a, now) : 'later';
                  const fresh = a.bookedAt && now.getTime() - a.bookedAt.getTime() < 45 * 60000;
                  return (
                    <div
                      key={a.id}
                      className={`block craft-${a.service.category} phase-${phase} ${fresh ? 'is-new' : ''}`}
                      style={{ insetInlineStart: `${at(a.start)}%`, width: `${at(a.end) - at(a.start)}%` }}
                      title={`${clock(a.start)}–${clock(a.end)} · ${a.client} · ${text(a.service.name)}`}
                    >
                      <b>{a.client}</b>
                      <span>{text(a.service.name)}</span>
                      {fresh ? <em>{t('agenda.new')}</em> : a.firstVisit ? <em>{t('agenda.first')}</em> : null}
                    </div>
                  );
                })}
              {nowAt >= 0 ? (
                <div className="now-line" style={{ insetInlineStart: `${nowAt}%` }}>
                  {row === 0 ? <span>{clock(now)}</span> : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
