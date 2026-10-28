import { addDays, dateKey, sameDay, startOfDay } from '@pure-clinics/shared';
import {
  addOnById,
  POLISH,
  SERVICES,
  serviceById,
  studioHours,
  STYLISTS,
  worksAt,
  type AddOnId,
  type Service,
  type ServiceId,
  type Stylist,
} from '@pure-clinics/shared/src/blanche';

import { between, personName, pick, rng, type Rng } from '../../../src/data/random';

/** One appointment in the studio: who, with whom, what, and what it costs. */
export type Appt = {
  id: string;
  stylist: Stylist;
  /** The station: the two nail tables, then the lash & brow bed. */
  station: number;
  service: Service;
  addOns: AddOnId[];
  shade: string | null;
  client: string;
  start: Date;
  end: Date;
  price: number;
  firstVisit: boolean;
  /** Booked through the app today; until then the slot is free in the diary. */
  bookedAt?: Date;
};

export type Phase = 'done' | 'now' | 'later';

/** Each stylist has her own place: Mila and Zoë at the nail tables, Nova at the lash & brow bed. */
export const STATIONS = STYLISTS.map((s, i) => ({ stylist: s, index: i }));

/** How often each service is booked relative to the others: BIAB is most of the diary. */
const WEIGHT: Partial<Record<ServiceId, number>> = {
  'biab-nude': 5,
  'biab-color': 6,
  manicure: 1,
  'biab-removal': 1,
  'toes-nude': 1,
  'toes-french': 1,
  'lash-lift': 5,
  'lash-lift-tint': 3,
  'lash-tint': 1,
  'brow-lamination': 5,
  'brow-shape': 2,
};

const menu = (s: Stylist): Service[] =>
  SERVICES.filter((x) => x.menu !== false && s.crafts.includes(x.category) && !s.skips?.includes(x.id)).flatMap((x) => Array<Service>(WEIGHT[x.id] ?? 1).fill(x));

const ART: AddOnId[] = ['chrome', 'polka', 'french', 'sparkle', 'flowers', 'stripes', 'mixed'];
const COLOURS = POLISH.map((p) => p.id);

function makeAppt(stylist: Stylist, station: number, service: Service, start: Date, r: Rng): Appt {
  const addOns: AddOnId[] = service.addOns && r() < 0.42 ? [pick(r, ART)] : [];
  const minutes = service.minutes + addOns.reduce((sum, id) => sum + addOnById(id).minutes, 0);
  return {
    id: `${stylist.id}-${start.getTime()}`,
    stylist,
    station,
    service,
    addOns,
    shade: service.category === 'nails' && service.id !== 'manicure' && service.id !== 'biab-removal' ? pick(r, COLOURS) : null,
    client: personName(r),
    start,
    end: new Date(start.getTime() + minutes * 60000),
    price: service.price + addOns.reduce((sum, id) => sum + addOnById(id).price, 0),
    firstVisit: r() < 0.14,
  };
}

/** A full day in the Nijmegen studio, the same on every load. Each stylist works her own days. */
export function studioDay(day: Date): Appt[] {
  const hours = studioHours(day);
  if (!hours) return [];
  const base = startOfDay(day).getTime();
  const out: Appt[] = [];
  STATIONS.forEach(({ stylist, index }) => {
    if (!worksAt(stylist, day, 'nijmegen')) return;
    const r = rng(`blanche-${dateKey(day)}-${stylist.id}`);
    let minute = hours.open * 60 + pick(r, [0, 0, 15, 30]);
    let lunch = false;
    for (;;) {
      if (!lunch && minute >= 12 * 60 + 30) {
        minute = Math.max(minute, 13 * 60) + pick(r, [0, 15]);
        lunch = true;
      }
      const service = pick(r, menu(stylist));
      if (minute + service.minutes > hours.close * 60) break;
      if (r() < 0.84) {
        const appt = makeAppt(stylist, index, service, new Date(base + minute * 60000), r);
        out.push(appt);
        minute += (appt.end.getTime() - appt.start.getTime()) / 60000 + pick(r, [0, 0, 15, 15, 30]);
      } else {
        minute += pick(r, [30, 45, 60]);
      }
    }
  });
  out.sort((a, b) => a.start.getTime() - b.start.getTime());
  // Nobody sits in two chairs on one day.
  const names = rng(`blanche-names-${dateKey(day)}`);
  const seen = new Set<string>();
  for (const appt of out) {
    while (seen.has(appt.client)) appt.client = personName(names);
    seen.add(appt.client);
  }
  return out;
}

export function phaseOf(a: Appt, now: Date): Phase {
  if (now.getTime() >= a.end.getTime()) return 'done';
  if (now.getTime() >= a.start.getTime()) return 'now';
  return 'later';
}

/** The day the studio view shows: today, or the next day the studio is open. */
export function studioViewDay(now: Date): Date {
  for (let d = 0; d < 7; d++) {
    const day = addDays(now, d);
    if (studioHours(day)) return d === 0 ? now : startOfDay(day);
  }
  return now;
}

export const isToday = (day: Date, now: Date) => sameDay(day, now);

/** Booked minutes against the open minutes of every stylist who works that day. */
export function occupancy(appts: Appt[], day: Date): number {
  const hours = studioHours(day);
  if (!hours) return 0;
  const staffed = STYLISTS.filter((s) => worksAt(s, day, 'nijmegen')).length;
  const open = (hours.close - hours.open) * 60 * staffed;
  const minutes = appts.reduce((sum, a) => sum + (a.end.getTime() - a.start.getTime()) / 60000, 0);
  return open ? minutes / open : 0;
}

export const revenueOf = (appts: Appt[]) => appts.reduce((sum, a) => sum + a.price, 0);

/** The service a refill reminder is about. */
export const BIAB = serviceById('biab-color');

/** A client card's stable random numbers. */
export const clientRng = (name: string) => rng(`blanche-client-${name}`);

export { between, pick };
