import { useEffect, useMemo, useRef, useState } from 'react';

import { phaseOf, type Appt } from '../data/clinics';
import { clientFile, ROMAN } from '../data/clients';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

/**
 * A client's card, shown inside the clinics model next to her chair: who she is, what is happening today, where she is
 * in her treatment plan, the next appointment and her last visits with the therapist's notes.
 */
export function ClientCard({ appt, now, onClose }: { appt: Appt; now: Date; onClose: () => void }) {
  const { t, text, eur, monthYear, dayMonth } = useI18n();
  const file = useMemo(() => clientFile(appt), [appt]);
  const card = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  // The last visit fades out while there is more to scroll to.
  const [more, setMore] = useState(false);
  const measure = () => {
    const el = list.current;
    setMore(Boolean(el && el.scrollTop + el.clientHeight < el.scrollHeight - 2));
  };
  useEffect(measure);

  // Focus goes into the card once it is placed, so Escape, Tab and screen readers start here.
  useEffect(() => {
    const timer = window.setTimeout(() => card.current?.focus({ preventScroll: true }), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const live = phaseOf(appt, now) === 'now';
  const heading = `client-card-${appt.id}`;
  const series = file.series;
  const role = { msg: `role.${appt.specialist.role}` as const };

  return (
    <section ref={card} className="client-card" role="dialog" aria-labelledby={heading} tabIndex={-1}>
      <header className="client-head">
        <div>
          <span className="eyebrow">{t('client.eyebrow')}</span>
          <h3 id={heading} className="client-name">
            <bdi>{appt.client}</bdi>
          </h3>
          <p className="client-meta">
            {appt.firstVisit ? t('client.firstVisit') : t('client.since', { date: monthYear(file.since) })}
            <span aria-hidden="true"> · </span>
            {t('client.skin', { type: ROMAN[file.skinType - 1] })}
          </p>
        </div>
        <button className="icon-button small client-close" aria-label={t('client.close')} onClick={onClose}>
          <Icon name="close" size={16} />
        </button>
      </header>

      <div className={`client-now${live ? ' is-live' : ''}`}>
        <span className="client-when">{live ? t('client.now', { time: appt.end }) : t('client.done', { start: appt.start, end: appt.end })}</span>
        <strong>
          {text(appt.treatment.name)}
          {file.zone ? ` · ${text(file.zone)}` : ''}
        </strong>
        <span>
          {t('client.with', { specialist: appt.specialist.name, role })} · {appt.price ? eur(appt.price) : t('appt.free')}
        </span>
        {series ? (
          <span className="client-series" role="img" aria-label={`${t('client.series')}: ${t('client.session', { n: series.session, total: series.total })}`}>
            <span className="client-steps" aria-hidden="true">
              {Array.from({ length: series.total }, (_, i) => (
                <i key={i} className={i < series.session - 1 || (i === series.session - 1 && !live) ? 'on' : i === series.session - 1 ? 'now' : ''} />
              ))}
            </span>
            <small aria-hidden="true">
              {t('client.series')} · {t('client.session', { n: series.session, total: series.total })}
            </small>
          </span>
        ) : (
          <small className="client-single">{t('client.single')}</small>
        )}
      </div>

      <p className="client-next">
        <span>{t('client.next')}</span>
        <b>
          {file.next
            ? `${t('client.nextAt', { day: { date: file.next.date }, time: file.next.date, specialist: file.next.specialist.name })} · ${text(file.next.treatment.name)}`
            : t('client.noNext')}
        </b>
      </p>

      <div className="client-history">
        <span className="eyebrow">{t('client.history')}</span>
        {file.visits.length ? (
          <ol ref={list} className={`client-visits${more ? ' client-visits--more' : ''}`} onScroll={measure}>
            {file.visits.map((visit) => (
              <li key={visit.date.getTime()}>
                <span className="client-visit">
                  <time dateTime={`${visit.date.getFullYear()}-${String(visit.date.getMonth() + 1).padStart(2, '0')}-${String(visit.date.getDate()).padStart(2, '0')}`}>
                    {dayMonth(visit.date, now)}
                  </time>
                  <strong>
                    {text(visit.treatment.name)} · {visit.specialist.name}
                  </strong>
                  <b>{visit.price ? eur(visit.price) : t('appt.free')}</b>
                </span>
                <span className="client-note">{t(visit.note)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="client-empty">{t('client.noHistory')}</p>
        )}
      </div>
    </section>
  );
}
