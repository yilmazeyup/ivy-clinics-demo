import { CLASS_TYPES, generatePureSessions, INSTRUCTORS, startOfDay, type Discipline, type PureLevel } from '@pure-ivy/shared';

import { between, personName, rng } from './random';

export type Seat = {
  /** A reformer in studio 1, or a mat in studio 2. */
  spot: number;
  member: string;
  /** Minutes before the start at which the member scans in at the door; null is a no-show. */
  checkInBefore: number | null;
  credits: number | 'unlimited';
  visits: number;
};

export type PilatesClass = {
  id: string;
  name: string;
  discipline: Discipline;
  level: PureLevel;
  instructor: string;
  start: Date;
  end: Date;
  capacity: number;
  seats: Seat[];
  waitlist: number;
  offPeak: boolean;
};

export type ClassPhase = 'done' | 'live' | 'soon' | 'later';

/** What a seat brings in on average: a credit from the 10-class pass, or a share of the monthly unlimited. */
export const seatValue = (seat: Seat) => (seat.credits === 'unlimited' ? 15 : 21);

function makeSeat(seed: string, spot: number): Seat {
  const r = rng(seed);
  return {
    spot,
    member: personName(r),
    checkInBefore: r() < 0.06 ? null : between(r, 1, 26),
    credits: r() < 0.3 ? 'unlimited' : between(r, 0, 14),
    visits: r() < 0.08 ? 1 : between(r, 2, 96),
  };
}

/** Mat classes (yoga, barre, mat pilates, stretch) are in studio 2; reformer classes in studio 1. */
export const onMats = (c: PilatesClass) => c.discipline !== 'reformer';

/** The day's classes from the member app's schedule, with a member on every booked spot. */
export function pilatesClasses(day: Date): PilatesClass[] {
  return generatePureSessions(startOfDay(day), 1).map((s) => ({
    id: s.id,
    name: CLASS_TYPES[s.typeId].name,
    discipline: CLASS_TYPES[s.typeId].discipline,
    level: CLASS_TYPES[s.typeId].level,
    instructor: INSTRUCTORS[s.instructorId].name,
    start: s.start,
    end: s.end,
    capacity: s.capacity,
    seats: s.taken.map((n) => makeSeat(`${s.id}-${n}`, n)),
    waitlist: s.waitlist,
    offPeak: s.offPeak,
  }));
}

export function phaseOf(c: PilatesClass, now: Date): ClassPhase {
  const t = now.getTime();
  if (t >= c.end.getTime()) return 'done';
  if (t >= c.start.getTime()) return 'live';
  if (c.start.getTime() - t <= 45 * 60000) return 'soon';
  return 'later';
}

export function checkedIn(seat: Seat, c: PilatesClass, now: Date): boolean {
  return seat.checkInBefore !== null && now.getTime() >= c.start.getTime() - seat.checkInBefore * 60000;
}

/** The class worth looking at: the one running now, else the next one, else the last of the day. */
export function focusClass(classes: PilatesClass[], now: Date): PilatesClass | undefined {
  return (
    classes.find((c) => phaseOf(c, now) === 'live') ??
    classes.find((c) => c.start.getTime() > now.getTime()) ??
    classes[classes.length - 1]
  );
}

export function freeSpots(c: PilatesClass): number[] {
  const taken = new Set(c.seats.map((s) => s.spot));
  return Array.from({ length: c.capacity }, (_, i) => i + 1).filter((n) => !taken.has(n));
}

/** A new booking on a free spot, used by the live feed. */
export function bookSeat(c: PilatesClass, seed: string): { next: PilatesClass; seat: Seat } | null {
  const free = freeSpots(c);
  if (free.length === 0) return null;
  const r = rng(seed);
  const seat = { ...makeSeat(seed, free[Math.floor(r() * free.length)]), checkInBefore: between(r, 2, 20) };
  return { next: { ...c, seats: [...c.seats, seat].sort((a, b) => a.spot - b.spot) }, seat };
}

/** Cancels a seat; when people are waiting, the first of them gets the spot straight away. */
export function cancelSeat(c: PilatesClass, spot: number, seed: string): { next: PilatesClass; cancelled: Seat; promoted: Seat | null } {
  const cancelled = c.seats.find((s) => s.spot === spot)!;
  const rest = c.seats.filter((s) => s.spot !== spot);
  if (c.waitlist === 0) return { next: { ...c, seats: rest }, cancelled, promoted: null };
  const promoted = { ...makeSeat(seed, spot), checkInBefore: between(rng(`${seed}-in`), 2, 20) };
  return {
    next: { ...c, seats: [...rest, promoted].sort((a, b) => a.spot - b.spot), waitlist: c.waitlist - 1 },
    cancelled,
    promoted,
  };
}

export function classRevenue(classes: PilatesClass[]): number {
  return classes.reduce((sum, c) => sum + c.seats.reduce((s, seat) => s + seatValue(seat), 0), 0);
}

/** Passes and subscriptions sold at the desk or in the app, on top of the classes themselves. */
export function passSales(date: Date): number {
  const r = rng(`pilates-sales-${date.toDateString()}`);
  return between(r, 1, 4) * 210 + between(r, 0, 2) * 159;
}

export const pilatesRevenue = (day: Date) => classRevenue(pilatesClasses(day)) + passSales(day);
