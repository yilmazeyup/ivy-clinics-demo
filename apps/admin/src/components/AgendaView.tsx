import { LOCATIONS, openingHours, sameDay, type TreatmentCategory } from '@pure-clinics/shared';
import type { CSSProperties } from 'react';

import { isOpen, phaseOf, ROOMS, works, type Appt } from '../data/clinics';
import { hourOf } from '../data/format';
import { useI18n } from '../i18n';
import { appointmentTip, CATEGORY_COLOR } from './ClinicsView';
import { CardHead } from './ui';

/** Blocks on these colours need white text. */
const DARK: TreatmentCategory[] = ['conditions', 'hair'];

/** The day as a plain diary: a row per treatment room, an appointment per block, a line for now. Each clinic keeps its own hours. */
export function AgendaView({ appts, day, now }: { appts: Appt[]; day: Date; now: Date }) {
  const i18n = useI18n();
  const { t, text, clock } = i18n;
  const hours = openingHours(day) ?? { open: 9, close: 21 };
  const span = hours.close - hours.open;
  const at = (hour: number) => `${((hour - hours.open) / span) * 100}%`;
  const isToday = sameDay(day, now);
  const nowHour = hourOf(now);
  const showNow = isToday && nowHour >= hours.open && nowHour <= hours.close;
  const ticks = Array.from({ length: span + 1 }, (_, i) => hours.open + i);

  return (
    <section id="agenda" className="card agenda-card rise" style={{ '--d': '420ms' } as CSSProperties}>
      <CardHead eyebrow={isToday ? t('agenda.eyebrow') : t('agenda.eyebrowMonday')} title={t('agenda.title')}>
        <span className="week-legend">
          {(Object.keys(CATEGORY_COLOR) as TreatmentCategory[]).map((category) => (
            <span key={category}>
              <i style={{ background: CATEGORY_COLOR[category] }} /> {t(`cat.${category}`)}
            </span>
          ))}
        </span>
      </CardHead>
      <p className="help">{t('agenda.help')}</p>

      <div className="agenda-scroll">
        <div className="agenda">
          <div className="agenda-row agenda-axis" aria-hidden="true">
            <span />
            <span className="agenda-track">
              {ticks.map((hour) => (
                <span key={hour} className="agenda-tick" style={{ insetInlineStart: at(hour) }}>
                  {(hour - hours.open) % 2 === 0 ? `${String(hour).padStart(2, '0')}:00` : ''}
                </span>
              ))}
            </span>
          </div>

          {LOCATIONS.map((location) => (
            <div key={location.id} className="agenda-clinic">
              <div className="agenda-clinic-name">{location.city}</div>
              {ROOMS[location.id].map((specialist, room) => {
                const closed = !isOpen(location.id, day);
                const off = closed || !works(specialist, day);
                return (
                  <div key={specialist.id} className="agenda-row">
                    <span className="agenda-label">
                      {specialist.name} <small>{t(`role.${specialist.role}`)}</small>
                    </span>
                    <span className={`agenda-track ${off ? 'off' : ''}`}>
                      {ticks.map((hour) => (
                        <i key={hour} className="agenda-grid" style={{ insetInlineStart: at(hour) }} />
                      ))}
                      {off ? <span className="agenda-off">{closed ? t('room.closed') : t('room.off')}</span> : null}
                      {appts
                        .filter((a) => a.clinic === location.id && a.room === room)
                        .map((a) => {
                          const tip = appointmentTip(a, i18n);
                          const phase = isToday ? phaseOf(a, now) : 'later';
                          return (
                            <span
                              key={a.id}
                              className={`agenda-block ${phase} ${DARK.includes(a.treatment.category) ? 'dark' : ''}`}
                              style={{
                                insetInlineStart: at(hourOf(a.start)),
                                width: `${(a.treatment.minutes / 60 / span) * 100}%`,
                                background: CATEGORY_COLOR[a.treatment.category],
                              }}
                              title={`${tip.title}\n${tip.detail.replace('<br>', '\n')}`}
                            >
                              <span className="agenda-name">{text(a.treatment.name)}</span>
                            </span>
                          );
                        })}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}

          {showNow ? (
            <div className="agenda-now" style={{ '--at': (nowHour - hours.open) / span } as CSSProperties}>
              <span>
                {t('agenda.now')} {clock(now)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
