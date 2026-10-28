import { addDays, dateKey, sameDay, startOfDay } from '@pure-clinics/shared';
import { studioHours, type CategoryId } from '@pure-clinics/shared/src/blanche';

import { between, personName, pick, rng } from '../../../src/data/random';
import { phaseOf, studioDay, type Appt } from './day';
import { dueClients, type DueClient } from './clients';
import { shopDay, type Order } from './shop';

/** Something that happens at a set moment of the day; the overview plays these as the clock runs. */
export type LiveEvent =
  /** Booked in the app today, into a free slot of the diary. */
  | { id: string; at: Date; kind: 'booking'; appt: Appt }
  /** She walks in a few minutes early and waits on the sofa. */
  | { id: string; at: Date; kind: 'arrive'; appt: Appt }
  /** Paid at the desk when the treatment ends. */
  | { id: string; at: Date; kind: 'payment'; appt: Appt }
  | { id: string; at: Date; kind: 'order'; order: Order }
  /** A client whose BIAB grew out booked her next set from the app's reminder. */
  | { id: string; at: Date; kind: 'refill'; client: DueClient; planned: Date }
  /** Someone tagged the studio in a post or story. */
  | { id: string; at: Date; kind: 'tag'; client: string; appt: Appt | null }
  | { id: string; at: Date; kind: 'review'; client: string; stars: number }
  | { id: string; at: Date; kind: 'member'; client: string };

export type LiveDay = {
  day: Date;
  appts: Appt[];
  orders: Order[];
  due: DueClient[];
  events: LiveEvent[];
};

const at = (day: Date, minutes: number) => new Date(startOfDay(day).getTime() + Math.round(minutes) * 60000);
const minuteOf = (date: Date) => date.getHours() * 60 + date.getMinutes();

/**
 * Today as a stream of events, the same on every load: app bookings land in free slots, clients arrive and pay, shop
 * orders come in, grown-out BIAB clients book their next set, posts get tagged, reviews and new Club members arrive.
 */
export function liveDay(day: Date, today: Date): LiveDay {
  const r = rng(`blanche-live-${dateKey(today)}`);
  const isToday = sameDay(day, today);
  const appts = studioDay(day).map((a) => ({ ...a }));
  const orders = shopDay(today);
  const due = dueClients(today);
  const events: LiveEvent[] = [];
  const hours = studioHours(day);
  const DAY_START = 7 * 60;

  if (isToday && hours) {
    for (const appt of appts) {
      const start = minuteOf(appt.start);
      // About a quarter is booked in the app during the day, at least an hour ahead.
      if (start - hours.open * 60 >= 90 && r() < 0.26) {
        const latest = start - 60;
        const earliest = Math.max(DAY_START, start - 7 * 60);
        if (latest > earliest) {
          appt.bookedAt = at(day, between(r, earliest, latest));
          events.push({ id: `booking-${appt.id}`, at: appt.bookedAt, kind: 'booking', appt });
        }
      }
      events.push({ id: `arrive-${appt.id}`, at: new Date(appt.start.getTime() - between(r, 4, 12) * 60000), kind: 'arrive', appt });
      events.push({ id: `payment-${appt.id}`, at: appt.end, kind: 'payment', appt });
      if (r() < 0.22) {
        events.push({ id: `tag-${appt.id}`, at: new Date(appt.end.getTime() + between(r, 10, 90) * 60000), kind: 'tag', client: appt.client, appt });
      }
    }
  }

  for (const order of orders) events.push({ id: `order-${order.id}`, at: order.at, kind: 'order', order });

  for (const client of due.slice(0, between(r, 3, 5))) {
    const planned = addDays(startOfDay(today), between(r, 1, 9));
    planned.setHours(pick(r, [10, 11, 13, 15, 17, 18, 19]), pick(r, [0, 15, 30]), 0, 0);
    events.push({ id: `refill-${client.id}`, at: at(today, between(r, 8 * 60, 22 * 60)), kind: 'refill', client, planned });
  }
  for (let i = 0, n = between(r, 1, 3); i < n; i++) {
    events.push({ id: `review-${i}`, at: at(today, between(r, 10 * 60, 22 * 60)), kind: 'review', client: personName(r), stars: 5 });
  }
  for (let i = 0, n = between(r, 2, 4); i < n; i++) {
    events.push({ id: `member-${i}`, at: at(today, between(r, DAY_START + 30, 23 * 60)), kind: 'member', client: personName(r) });
  }

  events.sort((a, b) => a.at.getTime() - b.at.getTime());
  return { day, appts, orders, due, events };
}

export const happenedBy = (events: LiveEvent[], now: Date) => events.filter((e) => e.at.getTime() <= now.getTime());

/** The diary as it stands now: app bookings appear once they are made. */
export const diaryAt = (appts: Appt[], now: Date) => appts.filter((a) => !a.bookedAt || a.bookedAt.getTime() <= now.getTime());

export const paidBy = (appts: Appt[], now: Date) => appts.filter((a) => a.end.getTime() <= now.getTime());

/** Who is in a chair right now, and who is on the sofa waiting for her turn. */
export function inStudio(appts: Appt[], events: LiveEvent[], now: Date) {
  const busy = appts.filter((a) => phaseOf(a, now) === 'now');
  const arrived = new Set(events.filter((e) => e.kind === 'arrive' && e.at.getTime() <= now.getTime()).map((e) => (e.kind === 'arrive' ? e.appt.id : '')));
  const waiting = appts.filter((a) => phaseOf(a, now) === 'later' && arrived.has(a.id));
  return { busy, waiting };
}

/** Revenue on an earlier day up to the same time of day, for "compared with a usual Wednesday". */
export function revenueAt(appts: Appt[], orders: Order[], time: Date): number {
  const cut = minuteOf(time);
  return (
    appts.filter((a) => minuteOf(a.end) <= cut).reduce((s, a) => s + a.price, 0) +
    orders.filter((o) => minuteOf(o.at) <= cut).reduce((s, o) => s + o.total, 0)
  );
}

export type DaySales = { date: Date; crafts: Record<CategoryId, number>; shop: number; booked: number };

const byCraft = (appts: Appt[]) => {
  const out: Record<CategoryId, number> = { nails: 0, lashes: 0, brows: 0 };
  for (const a of appts) out[a.service.category] += a.price;
  return out;
};

/** This week day by day: earlier days as they ended, today up to now, later days with what is booked so far. */
export function weekSales(today: Date, live: LiveDay, now: Date): DaySales[] {
  const monday = addDays(startOfDay(today), -((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    if (sameDay(date, today)) {
      const diary = sameDay(live.day, today) ? diaryAt(live.appts, now) : [];
      const paid = paidBy(diary, now);
      return {
        date,
        crafts: byCraft(paid),
        shop: live.orders.filter((o) => o.at.getTime() <= now.getTime()).reduce((s, o) => s + o.total, 0),
        booked: diary.filter((a) => a.end.getTime() > now.getTime()).reduce((s, a) => s + a.price, 0),
      };
    }
    const appts = studioDay(date);
    if (date.getTime() < today.getTime()) return { date, crafts: byCraft(appts), shop: shopDay(date).reduce((s, o) => s + o.total, 0), booked: 0 };
    return { date, crafts: { nails: 0, lashes: 0, brows: 0 }, shop: 0, booked: appts.reduce((s, a) => s + a.price, 0) };
  });
}
