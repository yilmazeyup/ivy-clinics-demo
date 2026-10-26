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
} from '@pure-clinics/shared';

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
  /** When the client booked it online, if that happened today; until then the slot is free in the diary. */
  bookedAt?: Date;
};

export type ApptPhase = 'done' | 'now' | 'later';

/** One treatment room per specialist, the same team the member app books with. */
export const ROOMS = Object.fromEntries(LOCATIONS.map((l) => [l.id, SPECIALISTS.filter((s) => s.locationId === l.id)])) as Record<
  LocationId,
  Specialist[]
>;

/** How often each treatment is booked relative to the others: laser hair removal is most of the diary. */
const WEIGHT: Partial<Record<TreatmentId, number>> = { laser: 6, consult: 3, acne: 2, epilation: 2, pigment: 2, couperose: 2, brows: 3, nails: 3 };

const menu = (s: Specialist): TreatmentId[] =>
  TREATMENTS.filter((t) => s.categories.includes(t.category)).flatMap((t) => Array<TreatmentId>(WEIGHT[t.id] ?? 1).fill(t.id));

/** How full each clinic's diary tends to be. */
const BUSY: Record<LocationId, number> = { nijmegen: 0.88, uden: 0.76 };

/** Prices from pureclinics.nl; laser goes by zone, from the upper lip to full legs or a combination deal. */
function priceFor(treatment: Treatment, r: Rng): number {
  if (treatment.id === 'laser') return pick(r, [55, 65, 75, 120, 140, 195, 225, 350]);
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

/** A full day for both clinics, the same on every load. Each clinic keeps its own hours; specialists work on their own days. */
export function clinicDay(day: Date): Appt[] {
  const base = startOfDay(day).getTime();
  const out: Appt[] = [];
  for (const location of LOCATIONS) {
    const hours = openingHours(day, location.id);
    if (!hours) continue;
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
  out.sort((a, b) => a.start.getTime() - b.start.getTime());
  // Names are drawn per room, so two rooms can pick the same one; nobody is in two chairs on one day.
  const names = rng(`names-${dateKey(day)}`);
  const seen = new Set<string>();
  for (const appt of out) {
    while (seen.has(appt.client)) appt.client = personName(names);
    seen.add(appt.client);
  }
  return out;
}

export function phaseOf(a: Appt, now: Date): ApptPhase {
  if (now.getTime() >= a.end.getTime()) return 'done';
  if (now.getTime() >= a.start.getTime()) return 'now';
  return 'later';
}

export const revenueOf = (appts: Appt[]) => appts.reduce((sum, a) => sum + a.price, 0);

export const clinicRevenue = (day: Date) => revenueOf(clinicDay(day));

/** Booked minutes against the open minutes of every staffed room, each clinic with its own hours. */
export function occupancy(appts: Appt[], day: Date): number {
  const open = LOCATIONS.reduce((sum, l) => {
    const hours = openingHours(day, l.id);
    return hours ? sum + (hours.close - hours.open) * 60 * ROOMS[l.id].filter((s) => works(s, day)).length : sum;
  }, 0);
  const minutes = appts.reduce((sum, a) => sum + a.treatment.minutes, 0);
  return open ? minutes / open : 0;
}

/** Whether a clinic has its doors open today; Uden, for one, is closed on Mondays and Thursdays. */
export const isOpen = (location: LocationId, day: Date) => openingHours(day, location) !== null;

/** The day the clinics view shows: today, or Monday when both clinics are closed on Sunday. */
export const clinicViewDay = (now: Date) => (openingHours(now) ? now : addDays(now, 1));
