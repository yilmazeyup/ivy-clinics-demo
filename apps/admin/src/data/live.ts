import { addDays, dateKey, LOCATIONS, openingHours, sameDay, startOfDay, type LocationId } from '@pure-clinics/shared';

import { clinicDay, type Appt } from './clinics';
import { courseState, coursesOn, type Course } from './courses';
import { between, personName, pick, rng } from './random';
import { clinicOfOrder, shopDay, type Order } from './shop';

/** Something that happens at a set moment of the day; the overview plays these as the clock runs. */
export type LiveEvent =
  /** Booked online into a free slot of today's diary. */
  | { id: string; at: Date; kind: 'booking'; appt: Appt }
  /** Paid at the desk when the treatment ends. */
  | { id: string; at: Date; kind: 'payment'; appt: Appt }
  /** The intake form for a later appointment came in. */
  | { id: string; at: Date; kind: 'intake'; appt: Appt }
  /** The reminder for a later appointment went out. */
  | { id: string; at: Date; kind: 'reminder'; appt: Appt }
  | { id: string; at: Date; kind: 'order'; order: Order }
  /** A client in a series booked her next session. */
  | { id: string; at: Date; kind: 'course'; course: Course; planned: Date }
  | { id: string; at: Date; kind: 'member'; client: string };

export type LiveDay = {
  /** The day the clinics show: today, or Monday while both clinics are closed on Sunday. */
  day: Date;
  /** Every appointment of that day; the ones booked online today carry `bookedAt`. */
  appts: Appt[];
  /** Today's webshop orders, all day. */
  orders: Order[];
  courses: Course[];
  /** Everything that happens today, in time order. */
  events: LiveEvent[];
};

const at = (day: Date, minutes: number) => new Date(startOfDay(day).getTime() + Math.round(minutes) * 60000);
const minuteOf = (date: Date) => date.getHours() * 60 + date.getMinutes();

/**
 * Today as a stream of events, the same on every load: online bookings land in free slots, every treatment is paid at
 * the desk when it ends, intake forms and reminders go out ahead of appointments, webshop orders come in, clients in a
 * series book their next session and new members join.
 */
export function liveDay(day: Date, today: Date): LiveDay {
  const r = rng(`live-${dateKey(today)}`);
  const isToday = sameDay(day, today);
  const appts = clinicDay(day).map((a) => ({ ...a }));
  const orders = shopDay(today);
  const courses = coursesOn(today);
  const events: LiveEvent[] = [];
  const DAY_START = 7 * 60;

  if (isToday) {
    for (const appt of appts) {
      const start = minuteOf(appt.start);
      const opens = (openingHours(day, appt.clinic)?.open ?? 9) * 60;
      // About one in five is booked online during the day, at least an hour before it starts.
      if (start - opens >= 90 && r() < 0.22) {
        const latest = start - 60;
        const earliest = Math.max(DAY_START, start - 6 * 60);
        if (latest > earliest) {
          appt.bookedAt = at(day, between(r, earliest, latest));
          events.push({ id: `booking-${appt.id}`, at: appt.bookedAt, kind: 'booking', appt });
        }
      }
      // The free intake costs nothing, so there is nothing to pay.
      if (appt.price > 0) events.push({ id: `payment-${appt.id}`, at: appt.end, kind: 'payment', appt });
      const ready = appt.bookedAt ? minuteOf(appt.bookedAt) + 5 : DAY_START;
      if ((appt.firstVisit || appt.treatment.id === 'consult') && start - 40 > ready && r() < 0.7) {
        events.push({ id: `intake-${appt.id}`, at: at(day, between(r, ready, start - 40)), kind: 'intake', appt });
      } else if (!appt.bookedAt && start - 150 > DAY_START && r() < 0.18) {
        events.push({ id: `reminder-${appt.id}`, at: at(day, start - between(r, 120, 180)), kind: 'reminder', appt });
      }
    }
  }

  for (const order of orders) events.push({ id: `order-${order.id}`, at: order.at, kind: 'order', order });

  // A handful of clients who are due book their next session, spread over the day.
  const due = courses.filter((c) => {
    const state = courseState(c, today);
    return state === 'due' || state === 'late';
  });
  for (const course of due.slice(0, between(r, 4, 7))) {
    const planned = addDays(startOfDay(today), between(r, 2, 12));
    planned.setHours(pick(r, [9, 10, 11, 13, 14, 15, 16, 18]), pick(r, [0, 15, 30, 45]), 0, 0);
    events.push({ id: `course-${course.id}`, at: at(today, between(r, 8 * 60, 21 * 60)), kind: 'course', course, planned });
  }
  for (let i = 0, n = between(r, 4, 6); i < n; i++) {
    events.push({ id: `member-${i}`, at: at(today, between(r, DAY_START + 20, 22 * 60)), kind: 'member', client: personName(r) });
  }

  events.sort((a, b) => a.at.getTime() - b.at.getTime());
  return { day, appts, orders, courses, events };
}

/** What happened up to now. */
export const happenedBy = (events: LiveEvent[], now: Date) => events.filter((e) => e.at.getTime() <= now.getTime());

/** The diary as it stands now: online bookings appear once they are made. */
export const diaryAt = (appts: Appt[], now: Date) => appts.filter((a) => !a.bookedAt || a.bookedAt.getTime() <= now.getTime());

/** Treatments are paid at the desk when they end. */
export const paidBy = (appts: Appt[], now: Date) => appts.filter((a) => a.end.getTime() <= now.getTime());

export const sum = <T>(items: T[], value: (item: T) => number) => items.reduce((total, item) => total + value(item), 0);

/** One clinic on one day: treatments paid, webshop sales near it, and treatments still booked to come. */
export type ClinicSales = { treatments: number; webshop: number; booked: number };
export type DaySales = { date: Date; clinics: ClinicSales[] };

function salesOf(appts: Appt[], orders: Order[], booked: Appt[]): ClinicSales[] {
  return LOCATIONS.map((l) => ({
    treatments: sum(
      appts.filter((a) => a.clinic === l.id),
      (a) => a.price,
    ),
    webshop: sum(
      orders.filter((o) => clinicOfOrder(o) === l.id),
      (o) => o.total,
    ),
    booked: sum(
      booked.filter((a) => a.clinic === l.id),
      (a) => a.price,
    ),
  }));
}

/** The days of this week other than today: earlier days as they ended, later days with what is booked so far. */
export function weekFrame(today: Date): DaySales[] {
  const monday = addDays(startOfDay(today), -((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    if (sameDay(date, today)) return { date, clinics: LOCATIONS.map(() => ({ treatments: 0, webshop: 0, booked: 0 })) };
    const appts = clinicDay(date);
    if (date.getTime() < today.getTime()) return { date, clinics: salesOf(appts, shopDay(date), []) };
    return { date, clinics: salesOf([], [], appts) };
  });
}

/** This week with today filled in up to now: paid so far, sold online so far, and what is still booked today. */
export function weekSales(frame: DaySales[], live: LiveDay, now: Date): DaySales[] {
  return frame.map((day) => {
    if (!sameDay(day.date, now)) return day;
    const isClinicDay = sameDay(live.day, now);
    const diary = isClinicDay ? diaryAt(live.appts, now) : [];
    const paid = paidBy(diary, now);
    const open = diary.filter((a) => a.end.getTime() > now.getTime());
    return { date: day.date, clinics: salesOf(paid, live.orders.filter((o) => o.at.getTime() <= now.getTime()), open) };
  });
}

/** Revenue on an earlier day up to the same time of day: treatments paid by then and webshop orders by then. */
export function revenueAt(appts: Appt[], orders: Order[], time: Date): number {
  const cut = minuteOf(time);
  return (
    sum(
      appts.filter((a) => minuteOf(a.end) <= cut),
      (a) => a.price,
    ) +
    sum(
      orders.filter((o) => minuteOf(o.at) <= cut),
      (o) => o.total,
    )
  );
}

export const clinicIndex = (id: LocationId) => LOCATIONS.findIndex((l) => l.id === id);
