import { type LiveEvent } from '../data/live';
import { useI18n, type I18n } from '../i18n';
import { Icon, type IconName } from './Icon';

/** An action taken in the panel, shown in the feed next to the day's events. */
export type ActionItem = { id: string; at: Date; kind: 'reminders'; n: number };

export type FeedEntry = LiveEvent | ActionItem;

function render(e: FeedEntry, i18n: I18n): { icon: IconName; tone: string; title: string; detail: string; amount?: string } {
  const { t, text, eur, dateShort } = i18n;
  switch (e.kind) {
    case 'booking':
      return {
        icon: 'calendar',
        tone: e.appt.service.category,
        title: t('ev.booking', { client: e.appt.client, service: text(e.appt.service.name) }),
        detail: t('ev.bookingDetail', { time: e.appt.start, stylist: e.appt.stylist.name }),
      };
    case 'arrive':
      return { icon: 'door', tone: 'wait', title: t('ev.arrive', { client: e.appt.client }), detail: t('ev.arriveDetail', { service: text(e.appt.service.name), time: e.appt.start }) };
    case 'payment':
      return {
        icon: 'coin',
        tone: e.appt.service.category,
        title: t('ev.payment', { amount: eur(e.appt.price) }),
        detail: t('ev.paymentDetail', { client: e.appt.client, service: text(e.appt.service.name) }),
        amount: eur(e.appt.price),
      };
    case 'order':
      return {
        icon: 'bag',
        tone: 'shop',
        title: t('ev.order', { number: e.order.number }),
        detail: t('ev.orderDetail', { client: e.order.customer, items: e.order.lines.map((l) => `${l.qty}× ${text(l.product.name)}`).join(', ') }),
        amount: eur(e.order.total),
      };
    case 'refill':
      return { icon: 'refresh', tone: 'nails', title: t('ev.refill', { client: e.client.name }), detail: t('ev.refillDetail', { date: dateShort(e.planned) }) };
    case 'tag':
      return { icon: 'instagram', tone: 'social', title: t('ev.tag', { client: e.client }), detail: t('ev.tagDetail') };
    case 'review':
      return { icon: 'star', tone: 'honey', title: t('ev.review'), detail: t('ev.reviewDetail', { client: e.client }) };
    case 'member':
      return { icon: 'crown', tone: 'lashes', title: t('ev.member'), detail: t('ev.memberDetail', { client: e.client }) };
    case 'reminders':
      return { icon: 'mail', tone: 'ink', title: t('ev.reminders', { n: e.n }), detail: t('ev.remindersDetail') };
  }
}

/** The day so far, newest on top: bookings, arrivals, payments, orders, tags and reviews as they happen. */
export function Feed({ items }: { items: FeedEntry[] }) {
  const i18n = useI18n();
  const { t, clock } = i18n;
  return (
    <section className="panel feed-panel" aria-live="polite">
      <header className="feed-head">
        <h2>
          <i className="pulse" /> {t('feed.title')}
        </h2>
      </header>
      {items.length === 0 ? <p className="muted">{t('feed.empty')}</p> : null}
      <ol className="feed">
        {items.map((e) => {
          const r = render(e, i18n);
          return (
            <li key={e.id} className={`tone-${r.tone}`}>
              <span className="feed-icon">
                <Icon name={r.icon} size={17} />
              </span>
              <div>
                <b>{r.title}</b>
                <span>{r.detail}</span>
              </div>
              <time>{clock(e.at)}</time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
