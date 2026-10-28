import { PRODUCTS, polishById, SHADES, type CategoryId } from '@pure-clinics/shared/src/blanche';
import type { CSSProperties } from 'react';

import { dueState, type DueClient } from '../data/clients';
import type { DaySales } from '../data/live';
import { stockOf, type Order } from '../data/shop';
import { Accent, useI18n } from '../i18n';
import { photoUrl } from '../photos';
import { Icon } from './Icon';
import { Head } from './ui';

const CRAFTS: CategoryId[] = ['nails', 'lashes', 'brows'];

/** Clients whose BIAB grew out, with a reminder per person or for everyone at once. */
export function Refills({ due, sent, booked, onRemind }: { due: DueClient[]; sent: Set<string>; booked: Set<string>; onRemind: (ids: string[]) => void }) {
  const { t, dateShort } = useI18n();
  const open = due.filter((c) => !sent.has(c.id) && !booked.has(c.id));
  return (
    <section id="refills" className="panel">
      <Head title={<Accent text={t('refills.title')} />} sub={t('refills.sub')}>
        <button className="btn btn-primary btn-sm" disabled={!open.length} onClick={() => onRemind(open.map((c) => c.id))}>
          <Icon name="mail" size={16} />
          {t('refills.remind')}
        </button>
      </Head>
      <ul className="refills">
        {due.map((c) => {
          const state = booked.has(c.id) ? 'booked' : sent.has(c.id) ? 'sent' : dueState(c.days);
          const shade = polishById(c.shade);
          return (
            <li key={c.id} className={`refill state-${state}`}>
              <span className="refill-swatch" style={{ background: shade.hex }} />
              <div>
                <b>{c.name}</b>
                <span>
                  {shade.name} · {c.stylist.name} · {dateShort(c.last)}
                </span>
              </div>
              <span className={`days ${state === 'late' ? 'is-late' : ''}`}>{t('refills.days', { n: c.days })}</span>
              {state === 'booked' ? (
                <span className="chip chip-mint">
                  <Icon name="check" size={14} /> {t('refills.booked')}
                </span>
              ) : state === 'sent' ? (
                <span className="chip">
                  <Icon name="mail" size={14} /> {t('refills.sent')}
                </span>
              ) : (
                <button className="btn btn-soft btn-xs" onClick={() => onRemind([c.id])}>
                  {t('refills.remindOne')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** This week's revenue per day as stacked pills: nails, lashes, brows and the shop; still booked is striped. */
export function Sales({ week, now }: { week: DaySales[]; now: Date }) {
  const { t, eur, weekdayShort, dayMonth } = useI18n();
  const totals = week.map((d) => CRAFTS.reduce((s, c) => s + d.crafts[c], 0) + d.shop + d.booked);
  const max = Math.max(...totals, 1);
  const done = week.reduce((s, d) => s + CRAFTS.reduce((x, c) => x + d.crafts[c], 0) + d.shop, 0);
  const booked = week.reduce((s, d) => s + d.booked, 0);
  const colour: Record<CategoryId | 'shop', string> = { nails: SHADES.cherry.ink, lashes: SHADES.lilac.ink, brows: SHADES.honey.ink, shop: '#141114' };
  return (
    <section id="sales" className="panel">
      <Head title={<Accent text={t('sales.title')} />} sub={t('sales.sub')}>
        <div className="sales-total">
          <b>{eur(done)}</b>
          <span>
            + {eur(booked)} {t('sales.booked')}
          </span>
        </div>
      </Head>
      <div className="bars">
        {week.map((d, i) => {
          const today = d.date.toDateString() === now.toDateString();
          const parts: { key: CategoryId | 'shop' | 'booked'; value: number }[] = [...CRAFTS.map((c) => ({ key: c, value: d.crafts[c] })), { key: 'shop', value: d.shop }, { key: 'booked', value: d.booked }];
          return (
            <div key={i} className={`bar-col ${today ? 'is-today' : ''}`}>
              <span className="bar-sum">{totals[i] ? eur(totals[i]) : '–'}</span>
              <div className="bar" style={{ '--h': `${(totals[i] / max) * 100}%` } as CSSProperties}>
                {parts
                  .filter((p) => p.value > 0)
                  .map((p) => (
                    <i key={p.key} className={`seg seg-${p.key}`} style={{ flexGrow: p.value, background: p.key === 'booked' ? undefined : colour[p.key] }} />
                  ))}
              </div>
              <span className="bar-day">
                <b>{weekdayShort(d.date)}</b> {dayMonth(d.date)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="legend">
        {([...CRAFTS, 'shop'] as const).map((c) => (
          <span key={c}>
            <i style={{ background: colour[c] }} /> {t(`sales.${c}`)}
          </span>
        ))}
        <span>
          <i className="seg-booked" /> {t('sales.booked')}
        </span>
      </div>
    </section>
  );
}

/** Today's shop: orders as they come in, and stock of the aftercare products. */
export function Shop({ orders, day }: { orders: Order[]; day: Date }) {
  const { t, tn, text, eur, clock } = useI18n();
  const sold = new Map<string, number>();
  for (const o of orders) for (const l of o.lines) sold.set(l.product.id, (sold.get(l.product.id) ?? 0) + l.qty);
  return (
    <section id="shop" className="panel">
      <Head title={<Accent text={t('shop.title')} />} sub={`${t('shop.sub')} ${tn('shop.orders', orders.length)} · ${eur(orders.reduce((s, o) => s + o.total, 0))}`} />
      <div className="shop-grid">
        <ol className="orders">
          {orders.length === 0 ? <p className="muted">{t('shop.empty')}</p> : null}
          {[...orders].reverse().map((o) => (
            <li key={o.id}>
              <time>{clock(o.at)}</time>
              <div>
                <b>
                  #{o.number} · {o.customer}
                </b>
                <span>{o.lines.map((l) => `${l.qty}× ${text(l.product.name)}`).join(', ')}</span>
              </div>
              <span className="chip">{o.lines.every((l) => l.product.kind === 'giftcard') ? t('shop.digital') : o.pickup ? t('shop.pickup') : t('shop.ship')}</span>
              <b className="amount">{eur(o.total)}</b>
            </li>
          ))}
        </ol>
        <ul className="stock">
          {PRODUCTS.filter((p) => p.kind === 'product').map((p) => {
            const start = stockOf(p, day) ?? 0;
            const left = Math.max(0, start - (sold.get(p.id) ?? 0));
            return (
              <li key={p.id}>
                <img src={photoUrl(p.photo)} alt="" />
                <div>
                  <b>{text(p.name)}</b>
                  <span className={left < 6 ? 'low' : ''}>{t('shop.left', { n: left })}</span>
                  <i className="meter">
                    <i style={{ width: `${Math.min(100, (left / 26) * 100)}%` }} />
                  </i>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Instagram at a glance (demo numbers) and the studio's own recent posts. */
export function Social({ tags }: { tags: number }) {
  const { t, num } = useI18n();
  const posts = [
    { photo: 'nails-red', likes: 214 },
    { photo: 'lashes-lift', likes: 168 },
    { photo: 'nails-peony', likes: 241 },
    { photo: 'nails-sparkle', likes: 302 },
    { photo: 'brows-map', likes: 133 },
    { photo: 'nails-nude', likes: 187 },
  ] as const;
  const stats = [
    { label: t('social.followers'), value: num(605 + tags), icon: 'instagram' as const },
    { label: t('social.tags'), value: num(11 + tags), icon: 'heart' as const },
    { label: t('social.clicks'), value: num(146 + tags * 9), icon: 'arrow' as const },
    { label: t('social.bookings'), value: num(17 + Math.floor(tags / 2)), icon: 'calendar' as const },
  ];
  return (
    <section id="social" className="panel social-panel">
      <Head title={<Accent text={t('social.title')} />} sub={t('social.sub')} />
      <div className="social-stats">
        {stats.map((s) => (
          <div key={s.label}>
            <Icon name={s.icon} size={18} />
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="posts">
        {posts.map((p) => (
          <figure key={p.photo}>
            <img src={photoUrl(p.photo)} alt="" />
            <figcaption>
              <Icon name="heart" size={13} /> {num(p.likes)}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
