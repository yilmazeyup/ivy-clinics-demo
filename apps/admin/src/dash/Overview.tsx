import { addDays, LOCATIONS, productById, sameDay, startOfDay } from '@pure-clinics/shared';
import { useEffect, useRef, useState } from 'react';

import { AgendaView } from '../components/AgendaView';
import { ClinicsView } from '../components/ClinicsView';
import { CoursesCard } from '../components/CoursesCard';
import { Insights, LiveFeed, WeekChart, type Insight, type Series, type WeekDay } from '../components/panels';
import { ShopCard } from '../components/ShopCard';
import { KpiTile, MiniBars, Sparkline, Squares, useToast, type FeedItem } from '../components/ui';
import { bookInGap, clinicDay, clinicViewDay, isOpen, occupancy, phaseOf, revenueOf, ROOMS, works, type Appt } from '../data/clinics';
import { courseState, coursesOn, type Course } from '../data/courses';
import { between, personName, pick, rng } from '../data/random';
import { makeOrder, orderTotal, ordersUntil, shopDay, shopRevenue, stockOf, type Order } from '../data/shop';
import { useI18n, type Line } from '../i18n';

const SERIES: Series[] = [
  { label: 'week.treatments', color: '#6B5B48' },
  { label: 'week.beauty', color: '#B39C80' },
  { label: 'week.webshop', color: '#DCC9B3' },
];

let feedId = 0;
const item = (fields: Omit<FeedItem, 'id'> & { id?: string }): FeedItem => ({ id: `f-${Date.now().toString(36)}-${++feedId}`, ...fields });
const cityOf = (clinic: Appt['clinic']) => LOCATIONS.find((l) => l.id === clinic)?.city ?? '';
/** Brows, lashes and nails are Blanche Beauty Studio's; everything else is the clinic's. */
const sourceOf = (a: Appt | Course): FeedItem['source'] => (a.treatment.category === 'beauty' ? 'blanche' : 'clinic');

function orderDetail(order: Order): Line {
  const extra = order.lines.reduce((n, l) => n + l.qty, 0) - 1;
  return { key: 'ev.order.detail', args: { customer: order.customer, product: { product: order.lines[0].product.id, extra } } };
}

function courseDetail(c: Course): Line {
  return { key: 'ev.course.detail', args: { client: c.client, treatment: { treatment: c.treatment.id }, n: c.done + 1, total: c.total } };
}

/** A day's revenue in three parts: treatments, Blanche Beauty Studio and the webshop. */
function dayParts(day: Date): number[] {
  const appts = clinicDay(day);
  const beauty = revenueOf(appts.filter((a) => a.treatment.category === 'beauty'));
  return [revenueOf(appts) - beauty, beauty, shopRevenue(day)];
}

/** A believable start for the feed: the last half hour across both clinics and the shop. */
function firstFeed(appts: Appt[], courses: Course[], orders: Order[], now: Date): FeedItem[] {
  const r = rng(`feed-${now.toDateString()}`);
  const minutes = (m: number) => new Date(now.getTime() - m * 60000);
  const laser = appts.find((a) => a.treatment.id === 'laser');
  const planned = courses.find((c) => c.planned);
  const lastOrder = ordersUntil(orders, now).at(-1);
  const items: FeedItem[] = [];
  if (laser) {
    items.push(
      item({
        at: minutes(3),
        source: 'clinic',
        icon: 'calendar',
        title: { key: 'ev.booking.title', args: { client: laser.client, treatment: { treatment: 'laser' } } },
        detail: { key: 'ev.booking.detail', args: { city: cityOf(laser.clinic), time: laser.start, specialist: laser.specialist.name } },
        amount: laser.price,
        accent: true,
      }),
    );
  }
  if (planned) {
    items.push(item({ at: minutes(7), source: sourceOf(planned), icon: 'repeat', title: { key: 'ev.course.title' }, detail: courseDetail(planned) }));
  }
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
      at: minutes(16),
      source: 'clinic',
      icon: 'clipboard',
      title: { key: 'ev.intake.title' },
      detail: { key: 'ev.intakeTomorrow.detail', args: { client: personName(r), treatment: { treatment: 'acne' }, time: '10:00' } },
    }),
  );
  items.push(
    item({ at: minutes(23), source: 'clinic', icon: 'star', title: { key: 'ev.member.title' }, detail: { key: 'ev.member.detail', args: { client: personName(r) } } }),
  );
  items.push(
    item({
      at: minutes(31),
      source: 'clinic',
      icon: 'plus',
      title: { key: 'ev.consult.title' },
      detail: { key: 'ev.consultTomorrow.detail', args: { client: personName(r), city: 'Uden', time: '16:00' } },
    }),
  );
  return items.sort((a, b) => b.at.getTime() - a.at.getTime());
}

/** The one overview of Pure Clinics: both clinics, the treatment series and the webshop, live. */
export function Overview({ now, playing }: { now: Date; playing: boolean }) {
  const { t, eur, num, pct, locale, weekdayLong } = useI18n();
  const toast = useToast();
  const [clinicsDay] = useState(() => clinicViewDay(now));
  const [appts, setAppts] = useState(() => clinicDay(clinicsDay));
  const [courses, setCourses] = useState(() => coursesOn(now));
  const [orders, setOrders] = useState(() => shopDay(now));
  const [feed, setFeed] = useState(() => firstFeed(appts, courses, orders, now));
  const [focus, setFocus] = useState<number | null>(null);
  const live = useRef({ appts, courses, orders, now });
  live.current = { appts, courses, orders, now };

  // A new language rebuilds the clinic models, which open on both clinics again.
  useEffect(() => setFocus(null), [locale]);

  const push = (...items: FeedItem[]) => setFeed((current) => [...items, ...current].slice(0, 40));

  /** Reminders for clients who are due for their next session; in the demo nothing is really sent. */
  const remind = (ids: string[]) => {
    const { courses: list, now: at } = live.current;
    const picked = list.filter((c) => ids.includes(c.id) && !c.reminded);
    if (!picked.length) return;
    setCourses((cs) => cs.map((c) => (ids.includes(c.id) && !c.reminded ? { ...c, reminded: at } : c)));
    push(
      picked.length === 1
        ? item({ at, source: sourceOf(picked[0]), icon: 'mail', title: { key: 'ev.courseReminder.title' }, detail: courseDetail(picked[0]) })
        : item({ at, source: 'clinic', icon: 'mail', title: { key: 'ev.reminders.title', args: { n: picked.length } }, detail: { key: 'ev.reminders.detail' } }),
    );
    toast(t('courses.toast', { n: picked.length }));
  };

  // Every few seconds something happens somewhere: a booking, a next session, a new member, an order.
  useEffect(() => {
    let timer = 0;
    const fire = () => {
      const { appts: diary, courses: list, orders: shop, now: at } = live.current;
      const seed = `${at.getTime()}-${Math.random()}`;
      const r = rng(seed);
      const roll = r();
      const sub = r();

      if (roll < 0.5) {
        if (sub < 0.6) {
          const consult = sub < 0.18;
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
                    detail: { key: 'ev.consult.detail', args: { client: booking.client, city: cityOf(booking.clinic), time: booking.start } },
                    accent: true,
                  })
                : item({
                    at,
                    source: sourceOf(booking),
                    icon: 'calendar',
                    title: { key: 'ev.booking.title', args: { client: booking.client, treatment: { treatment: booking.treatment.id } } },
                    detail: {
                      key: 'ev.booking.detail',
                      args: { city: cityOf(booking.clinic), time: booking.start, specialist: booking.specialist.name },
                    },
                    amount: booking.price || undefined,
                    accent: true,
                  }),
            );
            return;
          }
        }
        const later = diary.filter((a) => phaseOf(a, at) === 'later' && a.treatment.id !== 'consult');
        if (!later.length) return;
        const a = pick(r, later);
        const args = { client: a.client, treatment: { treatment: a.treatment.id }, time: a.start, city: cityOf(a.clinic) };
        push(
          sub < 0.85
            ? item({ at, source: sourceOf(a), icon: 'clipboard', title: { key: 'ev.intake.title' }, detail: { key: 'ev.intake.detail', args } })
            : item({ at, source: sourceOf(a), icon: 'mail', title: { key: 'ev.reminder.title' }, detail: { key: 'ev.reminder.detail', args } }),
        );
        return;
      }

      if (roll < 0.72) {
        // A client in a series books the next session, often after a reminder; or someone becomes a member.
        const open = list.filter((c) => {
          const state = courseState(c, at);
          return state === 'due' || state === 'late';
        });
        if (sub < 0.7 && open.length) {
          const c = pick(r, [...open.filter((x) => x.reminded), ...open]);
          const when = addDays(startOfDay(at), between(r, 1, 12));
          when.setHours(pick(r, [9, 10, 11, 13, 14, 15, 16]), pick(r, [0, 15, 30, 45]));
          setCourses((cs) => cs.map((x) => (x.id === c.id ? { ...x, planned: when } : x)));
          push(item({ at, source: sourceOf(c), icon: 'repeat', title: { key: 'ev.course.title' }, detail: courseDetail(c), accent: true }));
          return;
        }
        push(item({ at, source: 'clinic', icon: 'star', title: { key: 'ev.member.title' }, detail: { key: 'ev.member.detail', args: { client: personName(r) } } }));
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
  const running = isClinicDay ? appts.filter((a) => phaseOf(a, now) === 'now').length : 0;
  const staffed = LOCATIONS.reduce((n, l) => n + (isOpen(l.id, clinicsDay) ? ROOMS[l.id].filter((s) => works(s, clinicsDay)).length : 0), 0);
  const intakes = appts.filter((a) => a.treatment.id === 'consult').length;
  const newClients = appts.filter((a) => a.firstVisit).length;
  const todaysOrders = ordersUntil(orders, now);
  const shopToday = orderTotal(todaysOrders);
  const revenue = (isClinicDay ? revenueOf(appts) : 0) + shopToday;
  // Like for like: the same weekday over the last four weeks, with the webshop counted up to this time of day.
  const [usual] = useState(() => {
    const totals = [7, 14, 21, 28].map((days) => {
      const then = addDays(now, -days);
      return revenueOf(clinicDay(then)) + orderTotal(ordersUntil(shopDay(then), then));
    });
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  });
  const [history] = useState(() => Array.from({ length: 14 }, (_, i) => dayParts(addDays(now, i - 13)).reduce((a, b) => a + b, 0)));
  const [week] = useState<WeekDay[]>(() => {
    const monday = addDays(startOfDay(now), -((now.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      return { date, parts: dayParts(date) };
    });
  });

  const apptsPerHour = Array.from({ length: 13 }, (_, i) => appts.filter((a) => a.start.getHours() === 9 + i).length);
  const ordersPerHour = Array.from({ length: 17 }, (_, i) => todaysOrders.filter((o) => o.at.getHours() === 7 + i).length);

  const due = courses.filter((c) => {
    const state = courseState(c, now);
    return state === 'due' || state === 'late';
  });
  const waiting = due.filter((c) => !c.reminded);
  const aftercare = productById('zo-spf')!;
  const aftercareLeft = Math.max(
    0,
    stockOf(aftercare, now) - todaysOrders.reduce((n, o) => n + o.lines.filter((l) => l.product.id === aftercare.id).reduce((q, l) => q + l.qty, 0), 0),
  );
  const insights: Insight[] = [
    {
      id: 'followUp',
      icon: 'repeat',
      title: t('tip.followUp.title', { n: due.length }),
      body: t('tip.followUp.body'),
      action: t('tip.followUp.action'),
      run: waiting.length ? () => remind(waiting.map((c) => c.id)) : undefined,
    },
    { id: 'season', icon: 'sun', title: t('tip.season.title'), body: t('tip.season.body'), action: t('tip.season.action') },
    {
      id: 'stock',
      icon: 'bag',
      title: t('tip.stock.title', { product: { product: aftercare.id } }),
      body: t('tip.stock.body', { n: aftercareLeft }),
      action: t('tip.stock.action'),
    },
    { id: 'intake', icon: 'trend', title: t('tip.intake.title'), body: t('tip.intake.body'), action: t('tip.intake.action') },
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
        label={t('kpi.occupancy')}
        value={occupancy(appts, clinicsDay)}
        format={pct}
        sub={t('kpi.occupancySub', { intakes, first: newClients })}
        chart={<Squares total={staffed} filled={running} size={10} />}
      />
      <KpiTile
        index={3}
        label={t('kpi.webshop')}
        value={todaysOrders.length}
        format={num}
        sub={t('kpi.webshopSub', { revenue: eur(shopToday), avg: eur(todaysOrders.length ? shopToday / todaysOrders.length : 0) })}
        chart={<MiniBars values={ordersPerHour} current={now.getHours() - 7} />}
      />

      {/* The 3D view draws its labels once, so a new language rebuilds it. */}
      <ClinicsView key={`clinics-${locale}`} appts={appts} day={clinicsDay} now={now} focus={focus} onFocus={setFocus} />
      <LiveFeed items={feed} now={now} />
      <AgendaView appts={appts} day={clinicsDay} now={now} />
      <CoursesCard courses={courses} now={now} onRemind={remind} />
      <ShopCard orders={orders} now={now} />
      <WeekChart days={week} series={SERIES} today={now} />
      <Insights items={insights} />
    </div>
  );
}
