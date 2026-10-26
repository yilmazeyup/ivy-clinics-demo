import { addDays, dateKey, LOCATIONS, productById, sameDay } from '@pure-clinics/shared';
import { useEffect, useMemo, useState } from 'react';

import { AgendaView } from '../components/AgendaView';
import { ClinicsView } from '../components/ClinicsView';
import { CoursesCard } from '../components/CoursesCard';
import { Insights, LiveFeed, type Insight } from '../components/panels';
import { SalesView } from '../components/SalesView';
import { ShopView } from '../components/ShopView';
import { KpiTile, MiniBars, Sparkline, Squares, useToast, type FeedItem } from '../components/ui';
import { clinicDay, clinicViewDay, isOpen, occupancy, phaseOf, revenueOf, ROOMS, works, type Appt } from '../data/clinics';
import { courseState, type Course } from '../data/courses';
import { diaryAt, happenedBy, liveDay, paidBy, revenueAt, weekFrame, weekSales, type LiveEvent } from '../data/live';
import { orderTotal, ordersUntil, shopDay, stockOf, type Order } from '../data/shop';
import { useI18n, type Line } from '../i18n';

let feedId = 0;
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

/** How each moment of the day reads in the live feed. */
function feedItem(e: LiveEvent): FeedItem {
  const base = { id: e.id, at: e.at };
  switch (e.kind) {
    case 'booking': {
      const a = e.appt;
      if (a.treatment.id === 'consult') {
        return {
          ...base,
          source: 'clinic',
          icon: 'plus',
          title: { key: 'ev.consult.title' },
          detail: { key: 'ev.consult.detail', args: { client: a.client, city: cityOf(a.clinic), time: a.start } },
          accent: true,
        };
      }
      return {
        ...base,
        source: sourceOf(a),
        icon: 'calendar',
        title: { key: 'ev.booking.title', args: { client: a.client, treatment: { treatment: a.treatment.id } } },
        detail: { key: 'ev.online.detail', args: { city: cityOf(a.clinic), time: a.start, specialist: a.specialist.name } },
        amount: a.price || undefined,
        accent: true,
      };
    }
    case 'payment': {
      const a = e.appt;
      return {
        ...base,
        source: sourceOf(a),
        icon: 'card',
        title: { key: 'ev.paid.title' },
        detail: { key: 'ev.paid.detail', args: { client: a.client, treatment: { treatment: a.treatment.id }, city: cityOf(a.clinic) } },
        amount: a.price,
      };
    }
    case 'intake': {
      const a = e.appt;
      return {
        ...base,
        source: sourceOf(a),
        icon: 'clipboard',
        title: { key: 'ev.intake.title' },
        detail: { key: 'ev.intake.detail', args: { client: a.client, treatment: { treatment: a.treatment.id }, time: a.start } },
      };
    }
    case 'reminder': {
      const a = e.appt;
      return {
        ...base,
        source: sourceOf(a),
        icon: 'mail',
        title: { key: 'ev.reminder.title' },
        detail: { key: 'ev.reminder.detail', args: { client: a.client, treatment: { treatment: a.treatment.id }, time: a.start, city: cityOf(a.clinic) } },
      };
    }
    case 'order':
      return {
        ...base,
        source: 'webshop',
        icon: 'bag',
        title: { key: 'ev.order.title', args: { number: e.order.number } },
        detail: orderDetail(e.order),
        amount: e.order.total,
        accent: Boolean(e.order.afterTreatment),
      };
    case 'course':
      return { ...base, source: sourceOf(e.course), icon: 'repeat', title: { key: 'ev.course.title' }, detail: courseDetail(e.course), accent: true };
    case 'member':
      return { ...base, source: 'clinic', icon: 'star', title: { key: 'ev.member.title' }, detail: { key: 'ev.member.detail', args: { client: e.client } } };
  }
}

/** The one overview of Pure Clinics: both clinics, the treatment series, the webshop and the week, all following the clock. */
export function Overview({ now, playing }: { now: Date; playing: boolean }) {
  const { t, eur, num, pct, locale, weekdayLong } = useI18n();
  const toast = useToast();
  const dayKey = dateKey(now);
  // The day's stream is fixed; the clock decides how much of it has happened.
  const live = useMemo(() => liveDay(clinicViewDay(now), now), [dayKey]);
  const [reminded, setReminded] = useState<Record<string, Date>>({});
  const [actions, setActions] = useState<FeedItem[]>([]);
  const [focus, setFocus] = useState<number | null>(null);

  // A new language rebuilds the clinic models, which open on both clinics again.
  useEffect(() => setFocus(null), [locale]);

  const clinicsDay = live.day;
  const isClinicDay = sameDay(clinicsDay, now);
  const happened = useMemo(() => happenedBy(live.events, now), [live, now]);
  const appts = useMemo(() => (isClinicDay ? diaryAt(live.appts, now) : live.appts), [live, now, isClinicDay]);
  const todaysOrders = useMemo(() => ordersUntil(live.orders, now), [live, now]);

  const courses = useMemo(() => {
    const planned = new Map<string, Date>();
    for (const e of happened) if (e.kind === 'course') planned.set(e.course.id, e.planned);
    return live.courses.map((c) => ({ ...c, planned: c.planned ?? planned.get(c.id) ?? null, reminded: reminded[c.id] ?? null }));
  }, [live, happened, reminded]);

  const feed = useMemo(
    () =>
      [...happened.map(feedItem), ...actions.filter((a) => a.at.getTime() <= now.getTime())]
        .sort((a, b) => b.at.getTime() - a.at.getTime())
        .slice(0, 60),
    [happened, actions, now],
  );

  /** Reminders for clients who are due for their next session; in the demo nothing is really sent. */
  const remind = (ids: string[]) => {
    const picked = courses.filter((c) => ids.includes(c.id) && !c.reminded);
    if (!picked.length) return;
    setReminded((current) => ({ ...current, ...Object.fromEntries(picked.map((c) => [c.id, now])) }));
    const item: FeedItem =
      picked.length === 1
        ? { id: `action-${++feedId}`, at: now, source: sourceOf(picked[0]), icon: 'mail', title: { key: 'ev.courseReminder.title' }, detail: courseDetail(picked[0]) }
        : {
            id: `action-${++feedId}`,
            at: now,
            source: 'clinic',
            icon: 'mail',
            title: { key: 'ev.reminders.title', args: { n: picked.length } },
            detail: { key: 'ev.reminders.detail' },
          };
    setActions((current) => [item, ...current]);
    toast(t('courses.toast', { n: picked.length }));
  };

  // Revenue so far: treatments paid at the desk and webshop orders, against the same weekday at this time of day.
  const paid = isClinicDay ? revenueOf(paidBy(appts, now)) : 0;
  const shopToday = orderTotal(todaysOrders);
  const revenue = paid + shopToday;
  const past = useMemo(
    () =>
      [7, 14, 21, 28].map((days) => {
        const then = addDays(now, -days);
        return { appts: clinicDay(then), orders: shopDay(then) };
      }),
    [dayKey],
  );
  const usual = past.reduce((total, p) => total + revenueAt(p.appts, p.orders, now), 0) / past.length;
  const history = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const day = addDays(now, i - 13);
        return revenueOf(clinicDay(day)) + orderTotal(shopDay(day));
      }),
    [dayKey],
  );
  const frame = useMemo(() => weekFrame(now), [dayKey]);
  const week = useMemo(() => weekSales(frame, live, now), [frame, live, now]);

  const running = isClinicDay ? appts.filter((a) => phaseOf(a, now) === 'now').length : 0;
  const staffed = LOCATIONS.reduce((n, l) => n + (isOpen(l.id, clinicsDay) ? ROOMS[l.id].filter((s) => works(s, clinicsDay)).length : 0), 0);
  const intakes = appts.filter((a) => a.treatment.id === 'consult').length;
  const newClients = appts.filter((a) => a.firstVisit).length;
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
        delta={usual > 0 ? revenue / usual - 1 : undefined}
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

      {/* The 3D views draw their labels once, so a new language rebuilds them. */}
      <ClinicsView key={`clinics-${locale}`} appts={appts} day={clinicsDay} now={now} focus={focus} onFocus={setFocus} events={happened} fast={playing} />
      <LiveFeed items={feed} now={now} />
      <AgendaView appts={appts} day={clinicsDay} now={now} />
      <CoursesCard courses={courses} now={now} onRemind={remind} />
      <ShopView key={`shop-${locale}`} orders={live.orders} now={now} fast={playing} />
      <SalesView key={`sales-${locale}`} week={week} now={now} events={happened} fast={playing} />
      <Insights items={insights} />
    </div>
  );
}
