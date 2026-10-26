import {
  addDays,
  dateKey,
  LOCATIONS,
  openingHours,
  SPECIALISTS,
  startOfDay,
  TREATMENTS,
  treatmentById,
  type LocationId,
  type Specialist,
  type Treatment,
  type TreatmentId,
} from '@pure-ivy/shared';

import { personName, pick, rng, type Rng } from './random';

export type Appt = {
  id: string;
  clinic: LocationId;
  /** Index into the clinic's rooms; every specialist has one room. */
  room: number;
  specialist: Specialist;
  treatment: Treatment;
  client: string;
  start: Date;
  end: Date;
  price: number;
  firstVisit: boolean;
};

export type ApptPhase = 'done' | 'now' | 'later';

/** One treatment room per specialist, the same team the member app books with. */
export const ROOMS = Object.fromEntries(LOCATIONS.map((l) => [l.id, SPECIALISTS.filter((s) => s.locationId === l.id)])) as Record<
  LocationId,
  Specialist[]
>;

/** How often each treatment is booked relative to the others. */
const WEIGHT: Partial<Record<TreatmentId, number>> = { botox: 4, hydrafacial: 3, consult: 2, sparkpro: 2 };

const menu = (s: Specialist): TreatmentId[] =>
  TREATMENTS.filter((t) => s.categories.includes(t.category)).flatMap((t) => Array<TreatmentId>(WEIGHT[t.id] ?? 1).fill(t.id));

/** How full each clinic's diary tends to be. */
const BUSY: Record<LocationId, number> = { amsterdam: 0.9, amstelveen: 0.84, denbosch: 0.78, westervoort: 0.66 };

/** Starting prices from ivyclinics.nl; Botox and laser go up with the number of zones. */
function priceFor(treatment: Treatment, r: Rng): number {
  if (treatment.id === 'botox') return pick(r, [85, 139, 175, 225]);
  if (treatment.id === 'sparkpro') return pick(r, [35, 70, 105]);
  return treatment.priceFrom;
}

function makeAppt(clinic: LocationId, room: number, treatment: Treatment, start: Date, r: Rng): Appt {
  return {
    id: `${clinic}-${room}-${start.getTime()}`,
    clinic,
    room,
    specialist: ROOMS[clinic][room],
    treatment,
    client: personName(r),
    start,
    end: new Date(start.getTime() + treatment.minutes * 60000),
    price: priceFor(treatment, r),
    firstVisit: r() < (treatment.id === 'consult' ? 0.7 : 0.12),
  };
}

export const works = (s: Specialist, day: Date) => s.days.includes(day.getDay());

/** A full day for all four clinics, the same on every load. Specialists only work on their own days. */
export function clinicDay(day: Date): Appt[] {
  const hours = openingHours(day);
  if (!hours) return [];
  const base = startOfDay(day).getTime();
  const out: Appt[] = [];
  for (const location of LOCATIONS) {
    ROOMS[location.id].forEach((specialist, room) => {
      if (!works(specialist, day)) return;
      const r = rng(`${dateKey(day)}-${specialist.id}`);
      let minute = hours.open * 60 + pick(r, [0, 0, 15, 30]);
      let lunch = false;
      for (;;) {
        if (!lunch && minute >= 12 * 60 + 15) {
          minute = Math.max(minute, 13 * 60) + pick(r, [0, 15]);
          lunch = true;
        }
        const treatment = treatmentById(pick(r, menu(specialist)));
        if (minute + treatment.minutes > hours.close * 60) break;
        if (r() < BUSY[location.id]) {
          out.push(makeAppt(location.id, room, treatment, new Date(base + minute * 60000), r));
          minute += treatment.minutes + pick(r, [0, 0, 15, 15, 30]);
        } else {
          minute += pick(r, [30, 45, 60]);
        }
      }
    });
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function phaseOf(a: Appt, now: Date): ApptPhase {
  if (now.getTime() >= a.end.getTime()) return 'done';
  if (now.getTime() >= a.start.getTime()) return 'now';
  return 'later';
}

/** Finds room for a new booking later today, for the live feed. A free consultation goes to someone who gives them. */
export function bookInGap(appts: Appt[], now: Date, seed: string, consult = false): Appt | null {
  const hours = openingHours(now);
  if (!hours) return null;
  const r = rng(seed);
  const location = pick(r, LOCATIONS);
  const rooms = ROOMS[location.id]
    .map((specialist, room) => ({ specialist, room }))
    .filter(({ specialist }) => works(specialist, now) && (!consult || specialist.categories.includes('consult')));
  if (!rooms.length) return null;
  const { specialist, room } = pick(r, rooms);
  const treatment = treatmentById(consult ? 'consult' : pick(r, menu(specialist)));
  const taken = appts.filter((a) => a.clinic === location.id && a.room === room).sort((a, b) => a.start.getTime() - b.start.getTime());
  const base = startOfDay(now).getTime();
  const close = base + hours.close * 3600000;
  // Start on the next quarter hour at least 45 minutes from now.
  let start = Math.max(Math.ceil((now.getTime() + 45 * 60000) / 900000) * 900000, base + hours.open * 3600000);
  for (const a of taken) {
    if (start + treatment.minutes * 60000 <= a.start.getTime()) break;
    start = Math.max(start, a.end.getTime());
  }
  if (start + treatment.minutes * 60000 > close) return null;
  return makeAppt(location.id, room, treatment, new Date(start), r);
}

export const revenueOf = (appts: Appt[]) => appts.reduce((sum, a) => sum + a.price, 0);

export const clinicRevenue = (day: Date) => revenueOf(clinicDay(day));

/** Booked minutes against the open time of the rooms that are staffed that day. */
export function occupancy(appts: Appt[], day: Date): number {
  const hours = openingHours(day);
  if (!hours) return 0;
  const staffed = LOCATIONS.reduce((n, l) => n + ROOMS[l.id].filter((s) => works(s, day)).length, 0);
  const minutes = appts.reduce((sum, a) => sum + a.treatment.minutes, 0);
  return minutes / ((hours.close - hours.open) * 60 * Math.max(1, staffed));
}

/** The day the clinics view shows: today, or Monday when the clinics are closed on Sunday. */
export const clinicViewDay = (now: Date) => (openingHours(now) ? now : addDays(now, 1));
