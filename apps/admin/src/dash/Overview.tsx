import { addDays, LOCATIONS, productById, sameDay, startOfDay } from '@pure-ivy/shared';
import { useEffect, useRef, useState } from 'react';

import { AgendaView } from '../components/AgendaView';
import { ClinicsView } from '../components/ClinicsView';
import { Insights, LiveFeed, WeekChart, type Insight, type Series, type WeekDay } from '../components/panels';
import { ShopCard } from '../components/ShopCard';
import { StudioView } from '../components/StudioView';
import { KpiTile, MiniBars, Sparkline, Squares, type FeedItem } from '../components/ui';
import { bookInGap, clinicDay, clinicRevenue, clinicViewDay, phaseOf as apptPhase, revenueOf, type Appt } from '../data/clinics';
import {
  bookSeat,
  cancelSeat,
  checkedIn,
  classRevenue,
  focusClass,
  freeSpots,
  onMats,
  passSales,
  phaseOf as classPhase,
  pilatesClasses,
  pilatesRevenue,
  type PilatesClass,
} from '../data/pilates';
import { personName, pick, rng } from '../data/random';
import { makeOrder, orderTotal, ordersUntil, shopDay, shopRevenue, stockOf, type Order } from '../data/shop';
import { useI18n, type Line, type MessageKey } from '../i18n';

const SERIES: Series[] = [
  { label: 'week.treatments', color: '#2F4A3C' },
  { label: 'week.pilates', color: '#9DB5A2' },
  { label: 'week.webshop', color: '#D9C2AC' },
];

const PASSES: [MessageKey, number][] = [
  ['pass.ten', 210],
  ['pass.unlimited', 159],
  ['pass.trial', 15],
];

let feedId = 0;
const item = (fields: Omit<FeedItem, 'id'> & { id?: string }): FeedItem => ({ id: `f-${Date.now().toString(36)}-${++feedId}`, ...fields });
const cityOf = (a: Appt) => LOCATIONS.find((l) => l.id === a.clinic)?.city ?? '';

function orderDetail(order: Order): Line {
  const extra = order.lines.reduce((n, l) => n + l.qty, 0) - 1;
  return { key: 'ev.order.detail', args: { customer: order.customer, product: { product: order.lines[0].product.id, extra } } };
}

const dayTotal = (day: Date) => clinicRevenue(day) + pilatesRevenue(day) + shopRevenue(day);

/** A believable start for the feed: the last half hour across clinics, studio and shop. */
function firstFeed(appts: Appt[], classes: PilatesClass[], orders: Order[], now: Date): FeedItem[] {
  const r = rng(`feed-${now.toDateString()}`);
  const minutes = (m: number) => new Date(now.getTime() - m * 60000);
  const botox = appts.find((a) => a.treatment.id === 'botox');
  const later = classes.filter((c) => c.start.getTime() > now.getTime());
  const evening = later[later.length - 1] ?? classes[classes.length - 1];
  const lastOrder = ordersUntil(orders, now).at(-1);
  const items: FeedItem[] = [];
  if (botox) {
    items.push(
      item({
        at: minutes(3),
        source: 'clinic',
        icon: 'calendar',
        title: { key: 'ev.booking.title', args: { client: botox.client, treatment: { treatment: 'botox' } } },
        detail: { key: 'ev.deposit.detail', args: { city: cityOf(botox), time: botox.start } },
        amount: botox.treatment.deposit,
        accent: true,
      }),
    );
  }
  items.push(
    item({
      at: minutes(6),
      source: 'pilates',
      icon: 'calendar',
      title: { key: 'ev.classBooked.title', args: { member: personName(r), class: evening.name } },
      detail: { key: 'ev.classBooked.detail', args: { time: evening.start, n: 3 } },
    }),
  );
  if (lastOrder) {
    items.push(
      item({
        at: lastOrder.at,
        source: 'webshop',
        icon: 'bag',
        title: { key: 'ev.order.title', args: { number: lastOrder.number } },
        detail: orderDetail(lastOrder),
        amount: lastOrder.total,
      }),
    );
  }
  items.push(
    item({
      at: minutes(17),
      source: 'clinic',
      icon: 'clipboard',
      title: { key: 'ev.intake.title' },
      detail: { key: 'ev.intakeTomorrow.detail', args: { client: personName(r), treatment: { treatment: 'lipfiller' }, time: '10:00' } },
    }),
  );
  items.push(
    item({
      at: minutes(24),
      source: 'pilates',
      icon: 'bag',
      title: { key: 'ev.pass.title' },
      detail: { key: 'ev.pass.detail', args: { member: personName(r), pass: { msg: 'pass.ten' } } },
      amount: 210,
    }),
  );
  items.push(
    item({
      at: minutes(32),
      source: 'clinic',
      icon: 'plus',
      title: { key: 'ev.consult.title' },
      detail: { key: 'ev.consultTomorrow.detail', args: { client: personName(r), city: "'s-Hertogenbosch", time: '16:00' } },
    }),
  );
  return items.sort((a, b) => b.at.getTime() - a.at.getTime());
}

/** The one overview of Ivy Clinics: the four clinics, the pilates studio and the webshop, live. */
export function Overview({ now, playing }: { now: Date; playing: boolean }) {
  const { t, eur, num, pct, locale, weekdayLong } = useI18n();
  const [clinicsDay] = useState(() => clinicViewDay(now));
  const [appts, setAppts] = useState(() => clinicDay(clinicsDay));
  const [classes, setClasses] = useState(() => pilatesClasses(now));
  const [passes, setPasses] = useState(0);
  const [orders, setOrders] = useState(() => shopDay(now));
  const [feed, setFeed] = useState(() => firstFeed(appts, classes, orders, now));
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const live = useRef({ appts, classes, orders, now });
  live.current = { appts, classes, orders, now };

  // A new language rebuilds the clinic models, which open on all four clinics again.
  useEffect(() => setFocus(null), [locale]);

  const push = (...items: FeedItem[]) => setFeed((current) => [...items, ...current].slice(0, 40));

  // Every few seconds something happens somewhere: a booking, a sale, a waitlist move, an order.
  useEffect(() => {
    let timer = 0;
    const fire = () => {
      const { appts: diary, classes: list, orders: shop, now: at } = live.current;
      const seed = `${at.getTime()}-${Math.random()}`;
      const r = rng(seed);
      const roll = r();
      const sub = r();

      if (roll < 0.4) {
        if (sub < 0.6) {
          const consult = sub < 0.15;
          const booking = bookInGap(diary, at, seed, consult);
          if (booking) {
            setAppts((current) => [...current, booking]);
            push(
              consult
                ? item({
                    at,
                    source: 'clinic',
                    icon: 'plus',
                    title: { key: 'ev.consult.title' },
                    detail: { key: 'ev.consult.detail', args: { client: booking.client, city: cityOf(booking), time: booking.start } },
                    accent: true,
                  })
                : item({
                    at,
                    source: 'clinic',
                    icon: 'calendar',
                    title: { key: 'ev.booking.title', args: { client: booking.client, treatment: { treatment: booking.treatment.id } } },
                    detail: { key: 'ev.booking.detail', args: { city: cityOf(booking), time: booking.start, specialist: booking.specialist.name } },
                    amount: booking.treatment.deposit || undefined,
                    accent: true,
                  }),
            );
            return;
          }
        }
        const later = diary.filter((a) => apptPhase(a, at) === 'later' && a.treatment.id !== 'consult');
        if (!later.length) return;
        const a = pick(r, later);
        const args = { client: a.client, treatment: { treatment: a.treatment.id }, time: a.start, city: cityOf(a) };
        push(
          sub < 0.85
            ? item({ at, source: 'clinic', icon: 'clipboard', title: { key: 'ev.intake.title' }, detail: { key: 'ev.intake.detail', args } })
            : item({ at, source: 'clinic', icon: 'mail', title: { key: 'ev.reminder.title' }, detail: { key: 'ev.reminder.detail', args } }),
        );
        return;
      }

      if (roll < 0.72) {
        const upcoming = list.filter((c) => classPhase(c, at) === 'later' || classPhase(c, at) === 'soon');
        const open = upcoming.filter((c) => freeSpots(c).length > 0);
        const full = upcoming.filter((c) => freeSpots(c).length === 0);
        const cancellable = list.filter((c) => classPhase(c, at) === 'later' && c.seats.length > 0);
        if (sub < 0.45 && open.length) {
          const c = pick(r, open);
          const booked = bookSeat(c, seed);
          if (booked) {
            setClasses((cs) => cs.map((x) => (x.id === c.id ? booked.next : x)));
            push(
              item({
                at,
                source: 'pilates',
                icon: 'calendar',
                title: { key: 'ev.classBooked.title', args: { member: booked.seat.member, class: c.name } },
                detail: { key: 'ev.classBooked.detail', args: { time: c.start, spot: { spot: booked.seat.spot, mat: onMats(c) } } },
              }),
            );
            return;
          }
        }
        if (sub < 0.65) {
          const [name, price] = pick(r, PASSES);
          setPasses((p) => p + price);
          push(
            item({
              at,
              source: 'pilates',
              icon: 'bag',
              title: { key: 'ev.pass.title' },
              detail: { key: 'ev.pass.detail', args: { member: personName(r), pass: { msg: name } } },
              amount: price,
            }),
          );
          return;
        }
        if (sub < 0.8 && full.length) {
          const c = pick(r, full);
          setClasses((cs) => cs.map((x) => (x.id === c.id ? { ...x, waitlist: x.waitlist + 1 } : x)));
          push(
            item({
              at,
              source: 'pilates',
              icon: 'queue',
              title: { key: 'ev.waitlist.title', args: { member: personName(r) } },
              detail: { key: 'ev.waitlist.detail', args: { class: c.name, time: c.start, n: c.waitlist + 1 } },
            }),
          );
          return;
        }
        if (cancellable.length) {
          const c = pick(r, cancellable);
          const seat = pick(r, c.seats);
          const result = cancelSeat(c, seat.spot, seed);
          setClasses((cs) => cs.map((x) => (x.id === c.id ? result.next : x)));
          const events = [
            item({
              at,
              source: 'pilates',
              icon: 'undo',
              title: { key: 'ev.cancelled.title' },
              detail: { key: 'ev.cancelled.detail', args: { member: seat.member, class: c.name, time: c.start } },
            }),
          ];
          if (result.promoted) {
            events.unshift(
              item({
                at,
                source: 'pilates',
                icon: 'queue',
                title: { key: 'ev.promoted.title' },
                detail: { key: 'ev.promoted.detail', args: { member: result.promoted.member, spot: { spot: seat.spot, mat: onMats(c) } } },
                accent: true,
              }),
            );
          }
          push(...events);
        }
        return;
      }

      // A webshop order placed right now; the order effect below announces it.
      const number = Math.max(0, ...shop.map((o) => o.number)) + 1;
      setOrders((current) => [...current, makeOrder(seed, at, number)]);
    };
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          fire();
          schedule();
        },
        playing ? 1800 + Math.random() * 1400 : 4200 + Math.random() * 3800,
      );
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [playing]);

  // Check-ins follow the clock; each class keeps one feed line that counts up.
  const seenSeats = useRef<Set<string> | null>(null);
  useEffect(() => {
    const inside = new Set<string>();
    for (const c of classes) for (const s of c.seats) if (checkedIn(s, c, now)) inside.add(`${c.id}|${s.spot}|${s.member}`);
    const before = seenSeats.current;
    seenSeats.current = inside;
    if (!before) return;
    const byClass = new Map<string, string[]>();
    for (const key of inside) {
      if (before.has(key)) continue;
      const [id, , member] = key.split('|');
      byClass.set(id, [...(byClass.get(id) ?? []), member]);
    }
    if (!byClass.size) return;
    const lines: FeedItem[] = [];
    for (const [id, members] of byClass) {
      const c = classes.find((x) => x.id === id);
      if (!c) continue;
      const count = c.seats.filter((s) => checkedIn(s, c, now)).length;
      lines.push(
        item({
          id: `in-${id}-${count}`,
          at: now,
          source: 'pilates',
          icon: 'scan',
          title:
            members.length === 1
              ? { key: 'ev.checkin.title.one', args: { member: members[0] } }
              : { key: 'ev.checkin.title.other', args: { n: members.length } },
          detail: { key: 'ev.checkin.detail', args: { class: c.name, time: c.start, count, total: c.seats.length } },
        }),
      );
    }
    setFeed((current) => [...lines, ...current.filter((f) => !lines.some((l) => f.id.startsWith(l.id.replace(/-\d+$/, '-'))))].slice(0, 40));
  }, [classes, now]);

  // Orders appear in the feed when their time comes, also while the day is being played.
  const seenOrders = useRef<Set<string> | null>(null);
  useEffect(() => {
    const visible = ordersUntil(orders, now);
    const before = seenOrders.current;
    seenOrders.current = new Set(visible.map((o) => o.id));
    if (!before) return;
    const fresh = visible.filter((o) => !before.has(o.id));
    if (!fresh.length) return;
    if (fresh.length > 2) {
      push(
        item({
          at: now,
          source: 'webshop',
          icon: 'bag',
          title: { key: 'ev.orders.title', args: { n: fresh.length } },
          detail: { key: 'ev.orders.detail', args: { numbers: fresh.map((o) => `#${o.number}`).join(' · ') } },
          amount: orderTotal(fresh),
        }),
      );
      return;
    }
    push(
      ...fresh.map((o) =>
        item({
          at: o.at,
          source: 'webshop',
          icon: 'bag',
          title: { key: 'ev.order.title', args: { number: o.number } },
          detail: orderDetail(o),
          amount: o.total,
          accent: Boolean(o.afterTreatment),
        }),
      ),
    );
  }, [orders, now]);

  const isClinicDay = sameDay(clinicsDay, now);
  const running = isClinicDay ? appts.filter((a) => apptPhase(a, now) === 'now').length : 0;
  const todaysOrders = ordersUntil(orders, now);
  const shopToday = orderTotal(todaysOrders);
  const revenue = (isClinicDay ? revenueOf(appts) : 0) + classRevenue(classes) + passSales(now) + passes + shopToday;
  // Like for like: the same weekday over the last four weeks, with the webshop counted up to this time of day.
  const [usual] = useState(() => {
    const totals = [7, 14, 21, 28].map((days) => {
      const then = addDays(now, -days);
      return clinicRevenue(then) + pilatesRevenue(then) + orderTotal(ordersUntil(shopDay(then), then));
    });
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  });
  const [history] = useState(() => Array.from({ length: 14 }, (_, i) => dayTotal(addDays(now, i - 13))));
  const [week] = useState<WeekDay[]>(() => {
    const monday = addDays(startOfDay(now), -((now.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      return { date, parts: [clinicRevenue(date), pilatesRevenue(date), shopRevenue(date)] };
    });
  });

  const booked = classes.reduce((n, c) => n + c.seats.length, 0);
  const capacity = classes.reduce((n, c) => n + c.capacity, 0);
  const fullClasses = classes.filter((c) => freeSpots(c).length === 0).length;
  const apptsPerHour = Array.from({ length: 12 }, (_, i) => appts.filter((a) => a.start.getHours() === 9 + i).length);
  const ordersPerHour = Array.from({ length: 17 }, (_, i) => todaysOrders.filter((o) => o.at.getHours() === 7 + i).length);

  const selected = (selectedClass === null ? focusClass(classes, now) : classes.find((c) => c.id === selectedClass)) ?? classes[0];
  const busiest = classes.find((c) => freeSpots(c).length === 0 && c.waitlist > 0);
  const aftercare = productById('alhydran')!;
  const aftercareLeft = Math.max(
    0,
    stockOf(aftercare, now) - todaysOrders.reduce((n, o) => n + o.lines.filter((l) => l.product.id === aftercare.id).reduce((q, l) => q + l.qty, 0), 0),
  );
  const extraClass = busiest ? { class: busiest.name, time: new Date(busiest.start.getTime() - 3600000), start: busiest.start } : { class: 'Slow Burn', time: '17:00', start: '18:00' };
  const insights: Insight[] = [
    { id: 'crossSell', icon: 'users', title: t('tip.crossSell.title'), body: t('tip.crossSell.body'), action: t('tip.crossSell.action') },
    {
      id: 'stock',
      icon: 'bag',
      title: t('tip.stock.title', { product: { product: aftercare.id } }),
      body: t('tip.stock.body', { n: aftercareLeft }),
      action: t('tip.stock.action'),
    },
    { id: 'followUp', icon: 'mail', title: t('tip.followUp.title'), body: t('tip.followUp.body'), action: t('tip.followUp.action') },
    {
      id: 'extraClass',
      icon: 'trend',
      title: t('tip.extraClass.title', extraClass),
      body: t('tip.extraClass.body', { ...extraClass, amount: eur(1150) }),
      action: t('tip.extraClass.action'),
    },
  ];

  return (
    <div className="dash">
      <KpiTile
        index={0}
        label={t('kpi.revenue')}
        value={revenue}
        format={eur}
        delta={revenue / usual - 1}
        sub={t('kpi.revenueSub', { weekday: weekdayLong(now) })}
        chart={<Sparkline values={[...history.slice(0, -1), revenue]} />}
      />
      <KpiTile
        index={1}
        label={t('kpi.treatments')}
        value={appts.length}
        format={num}
        sub={isClinicDay ? t('kpi.treatmentsSub', { n: running }) : t('kpi.treatmentsClosed')}
        chart={<MiniBars values={apptsPerHour} current={isClinicDay ? now.getHours() - 9 : -1} />}
      />
      <KpiTile
        index={2}
        label={t('kpi.pilates')}
        value={booked / capacity}
        format={pct}
        sub={t('kpi.pilatesSub', { booked, capacity, full: fullClasses })}
        chart={<Squares total={classes.length} filled={fullClasses} size={10} />}
      />
      <KpiTile
        index={3}
        label={t('kpi.webshop')}
        value={todaysOrders.length}
        format={num}
        sub={t('kpi.webshopSub', { revenue: eur(shopToday), avg: eur(todaysOrders.length ? shopToday / todaysOrders.length : 0) })}
        chart={<MiniBars values={ordersPerHour} current={now.getHours() - 7} />}
      />

      {/* The 3D views draw their labels once, so a new language rebuilds them. */}
      <ClinicsView key={`clinics-${locale}`} appts={appts} day={clinicsDay} now={now} focus={focus} onFocus={setFocus} />
      <LiveFeed items={feed} now={now} />
      <AgendaView appts={appts} day={clinicsDay} now={now} />
      <StudioView
        key={`studio-${locale}-${onMats(selected) ? 'mat' : 'reformer'}`}
        classes={classes}
        selected={selected}
        now={now}
        follow={selectedClass === null}
        onSelect={(id) => setSelectedClass(id)}
        onFollow={() => setSelectedClass(null)}
      />
      <ShopCard orders={orders} now={now} />
      <WeekChart days={week} series={SERIES} today={now} />
      <Insights items={insights} />
    </div>
  );
}
