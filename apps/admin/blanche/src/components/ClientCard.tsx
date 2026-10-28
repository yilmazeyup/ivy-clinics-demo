import { LOOKS, polishById, type CategoryId } from '@pure-clinics/shared/src/blanche';
import { useEffect, useMemo, useRef, useState } from 'react';

import { clientFile } from '../data/clients';
import type { Appt } from '../data/day';
import { useI18n } from '../i18n';
import { photoUrl } from '../photos';
import { Icon } from './Icon';

const CRAFT_CLASS: Record<CategoryId, string> = { nails: 'nails', lashes: 'lashes', brows: 'brows' };

/**
 * The client in the chair: who she is, her sets so far with the colours she wore, notes from earlier visits, Club points,
 * what she saved in the app and whether her next visit is planned.
 */
export function ClientCard({ appt, onClose }: { appt: Appt; onClose: () => void }) {
  const { t, text, eur, num, dayMonth, monthYear, dateShort, clock } = useI18n();
  const file = useMemo(() => clientFile(appt), [appt]);
  const [reminded, setReminded] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => closeButton.current?.focus({ preventScroll: true }), []);
  const shade = appt.shade ? polishById(appt.shade) : null;
  const saved = LOOKS.filter((l) => file.saved.includes(l.id));
  return (
    <aside className={`client-card craft-${CRAFT_CLASS[appt.service.category]}`} role="dialog" aria-label={appt.client}>
      <button ref={closeButton} className="card-close" onClick={onClose} aria-label={t('card.close')}>
        <Icon name="close" size={18} />
      </button>
      <div className="client-top">
        <span className="client-initial">{appt.client[0]}</span>
        <div>
          <h3>{appt.client}</h3>
          <p>{file.visits.length ? t('card.since', { date: monthYear(file.since) }) : t('card.first')}</p>
        </div>
      </div>
      <div className="client-tags">
        <span className="chip chip-tier">
          <Icon name="crown" size={14} /> {file.tier.name} · {t('card.points', { n: num(file.points) })}
        </span>
        <span className="chip">
          {t('card.source')}: {t(`source.${file.source}`)}
        </span>
      </div>

      <div className="client-today">
        <span className="eyebrow">{t('card.today')}</span>
        <strong>{text(appt.service.name)}</strong>
        <span>
          {clock(appt.start)}–{clock(appt.end)} · {t('card.with', { name: appt.stylist.name })} · {eur(appt.price)}
        </span>
        {shade ? (
          <span className="shade-line">
            <i style={{ background: shade.hex }} /> {shade.name}
          </span>
        ) : null}
      </div>

      <div className="client-facts">
        {file.shape ? (
          <div>
            <span className="eyebrow">{t('card.shape')}</span>
            <b>{t(`shape.${file.shape}`)}</b>
          </div>
        ) : null}
        {file.patch ? (
          <div>
            <span className="eyebrow">{t('card.patch')}</span>
            <b>{t('card.patchDone', { date: dayMonth(file.patch) })}</b>
          </div>
        ) : null}
        <div>
          <span className="eyebrow">{t('card.next')}</span>
          <b>{file.next ? `${dateShort(file.next.date)} · ${file.next.stylist.name}` : t('card.noNext')}</b>
        </div>
      </div>

      <span className="eyebrow">{t('card.history')}</span>
      {file.visits.length ? (
        <ol className="history">
          {file.visits.map((v, i) => {
            const s = v.shade ? polishById(v.shade) : null;
            return (
              <li key={i}>
                <span className={`dot craft-${v.service.category}`} />
                <div>
                  <b>{text(v.service.name)}</b>
                  <span>
                    {dateShort(v.date)} · {v.stylist.name}
                    {s ? (
                      <>
                        {' · '}
                        <i className="swatch" style={{ background: s.hex }} /> {s.name}
                      </>
                    ) : null}
                  </span>
                  <em>{t(v.note)}</em>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="muted">{t('card.none')}</p>
      )}

      {saved.length ? (
        <>
          <span className="eyebrow">{t('card.saved')}</span>
          <div className="saved-row">
            {saved.slice(0, 4).map((look) => (
              <figure key={look.id}>
                <img src={photoUrl(look.photo)} alt="" />
                <figcaption>{look.name}</figcaption>
              </figure>
            ))}
          </div>
        </>
      ) : null}

      {!file.next ? (
        <button className={`btn ${reminded ? 'btn-done' : 'btn-ink'}`} onClick={() => setReminded(true)} disabled={reminded}>
          <Icon name={reminded ? 'check' : 'mail'} size={16} />
          {reminded ? t('card.reminded') : t('card.remind')}
        </button>
      ) : null}
    </aside>
  );
}
