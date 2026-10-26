import {
  addDays,
  DEALS,
  LASER_ZONES,
  openingHours,
  SPECIALISTS,
  startOfDay,
  TREATMENTS,
  type L10n,
  type LocationId,
  type Specialist,
  type Treatment,
  type TreatmentCategory,
  type TreatmentId,
} from '@pure-clinics/shared';

import type { MessageKey } from '../i18n';
import { works, type Appt } from './clinics';
import { COURSE_PLAN } from './courses';
import { between, pick, rng, type Rng } from './random';

/** A one-line note the therapist wrote after a visit; the words live in the language files. */
export type NoteKey = Extract<MessageKey, `note.${string}`>;

export type Visit = { date: Date; treatment: Treatment; specialist: Specialist; price: number; note: NoteKey };

/** Fitzpatrick skin type, I (very fair, always burns) to VI (deeply pigmented, never burns). */
export type SkinType = 1 | 2 | 3 | 4 | 5 | 6;

export type ClientFile = {
  /** The first visit: the free intake, or today for someone new. */
  since: Date;
  skinType: SkinType;
  /** For laser hair removal: the zone or deal that today's price belongs to. */
  zone: L10n | null;
  /** Where today's session sits in the series, when the treatment is given as one. */
  series: { session: number; total: number } | null;
  next: { date: Date; treatment: Treatment; specialist: Specialist } | null;
  /** The last visits before today, newest first; empty for a first visit. */
  visits: Visit[];
};

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;

/** Types II to IV are the most common among the clinic's clients. */
const SKIN_WEIGHTS = [1, 4, 5, 3, 2, 1];

const NOTES_BY_CATEGORY: Record<TreatmentCategory, NoteKey[]> = {
  consult: ['note.intakePlan', 'note.patchTest'],
  removal: ['note.laserCalm', 'note.laserFewer', 'note.laserEnergy', 'note.laserRedness', 'note.laserTan'],
  conditions: ['note.acneCalmer', 'note.pigmentLighter', 'note.rednessLess'],
  skin: ['note.skinEven', 'note.skinSpf', 'note.skinHome'],
  hair: ['note.hairFuller', 'note.skinHome'],
  beauty: ['note.brows', 'note.nails'],
};

const NOTES_BY_TREATMENT: Partial<Record<TreatmentId, NoteKey[]>> = {
  epilation: ['note.epilation', 'note.laserRedness'],
  acne: ['note.acneCalmer', 'note.skinHome'],
  deepclean: ['note.acneCalmer', 'note.skinEven'],
  pigment: ['note.pigmentLighter', 'note.skinSpf'],
  ipl: ['note.pigmentLighter', 'note.rednessLess', 'note.skinSpf'],
  couperose: ['note.rednessLess', 'note.skinSpf'],
  legveins: ['note.rednessLess'],
  tattoo: ['note.tattooFading', 'note.skinSpf'],
  camouflage: ['note.skinEven'],
  massage: ['note.skinEven', 'note.skinHome'],
  eyes: ['note.skinEven', 'note.skinSpf'],
  brows: ['note.brows'],
  nails: ['note.nails'],
};

const notesFor = (t: Treatment) => NOTES_BY_TREATMENT[t.id] ?? NOTES_BY_CATEGORY[t.category];

/** Laser prices in the diary are zones or deals from pureclinics.nl; this finds which one. */
function zoneFor(price: number): L10n | null {
  return LASER_ZONES.find((z) => z.price === price)?.name ?? DEALS.find((d) => d.price === price)?.zones ?? null;
}

function weighted(r: Rng, weights: number[]): number {
  let roll = r() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return i;
  }
  return weights.length - 1;
}

/** The nearest day on or before `day` when the specialist works and the clinic is open. */
function workday(day: Date, specialist: Specialist, step: 1 | -1): Date {
  let d = day;
  for (let i = 0; i < 14 && !(works(specialist, d) && openingHours(d, specialist.locationId)); i++) d = addDays(d, step);
  return d;
}

/** Someone at the clinic who gives the treatment; the client's own therapist when she can. */
function therapistFor(treatment: Treatment, clinic: LocationId, usual: Specialist, r: Rng): Specialist {
  if (usual.categories.includes(treatment.category) && r() < 0.8) return usual;
  const team = SPECIALISTS.filter((s) => s.locationId === clinic && s.categories.includes(treatment.category));
  return team.length ? pick(r, team) : usual;
}

/** What else a client of this clinic has had: mostly what her therapist gives, never another intake. */
function otherTreatment(clinic: LocationId, usual: Specialist, r: Rng): Treatment {
  const team = SPECIALISTS.filter((s) => s.locationId === clinic);
  const giver = r() < 0.6 ? usual : pick(r, team);
  const menu = TREATMENTS.filter((t) => t.category !== 'consult' && giver.categories.includes(t.category));
  return pick(r, menu.length ? menu : TREATMENTS.filter((t) => t.id === 'facial'));
}

const LASER_PRICES = [55, 65, 75, 120, 140];

/**
 * A client's file, made up from her name so it is the same on every load: skin type, how long she has been coming,
 * where today's treatment sits in its series, the next appointment and the last four to six visits.
 */
export function clientFile(appt: Appt): ClientFile {
  const r = rng(`client-${appt.client}`);
  const today = startOfDay(appt.start);
  const skinType = (weighted(r, SKIN_WEIGHTS) + 1) as SkinType;
  const plan = COURSE_PLAN[appt.treatment.id];
  const zone = appt.treatment.id === 'laser' ? zoneFor(appt.price) : null;
  const usual = appt.specialist;

  // Notes vary from visit to visit: never the same line twice in a row.
  let lastNote: NoteKey | null = null;
  const visit = (day: Date, treatment: Treatment, specialist: Specialist, price: number): Visit => {
    const options = notesFor(treatment).filter((n) => n !== lastNote);
    const note = pick(r, options.length ? options : notesFor(treatment));
    lastNote = note;
    return { date: workday(day, specialist, -1), treatment, specialist, price, note };
  };

  const visits: Visit[] = [];
  let session = plan ? 1 : 0;
  if (!appt.firstVisit) {
    let cursor = today;
    if (plan) {
      // Earlier sessions of today's series, the plan's weeks apart, with the intake before the first one.
      // Most clients are somewhere in the middle of their series.
      session = Math.min(plan.sessions, 2 + Math.floor(((r() + r()) / 2) * (plan.sessions - 1)));
      for (let n = session - 1; n >= 1; n--) {
        cursor = addDays(cursor, -(plan.weeks * 7 + between(r, -3, 6)));
        visits.push(visit(cursor, appt.treatment, usual, appt.treatment.id === 'laser' ? appt.price : appt.treatment.priceFrom));
        cursor = visits[visits.length - 1].date;
      }
    }
    // Older visits for other treatments, until the history is long enough to show.
    const wanted = between(r, 4, 6);
    while (visits.length < wanted) {
      cursor = addDays(cursor, -between(r, 24, 75));
      const treatment = otherTreatment(appt.clinic, usual, r);
      const specialist = therapistFor(treatment, appt.clinic, usual, r);
      visits.push(visit(cursor, treatment, specialist, treatment.id === 'laser' ? pick(r, LASER_PRICES) : treatment.priceFrom));
      cursor = visits[visits.length - 1].date;
    }
    // Everyone starts with the free intake.
    const consult = TREATMENTS.find((t) => t.id === 'consult')!;
    visits.push(visit(addDays(cursor, -between(r, 10, 30)), consult, therapistFor(consult, appt.clinic, usual, r), 0));
  }

  const since = visits.length ? visits[visits.length - 1].date : today;

  let next: ClientFile['next'] = null;
  if (plan && session < plan.sessions) {
    const date = workday(addDays(today, plan.weeks * 7), usual, 1);
    next = { date: atHour(date, appt.clinic, r), treatment: appt.treatment, specialist: usual };
  } else if (r() < 0.55) {
    const treatment = otherTreatment(appt.clinic, usual, r);
    const specialist = therapistFor(treatment, appt.clinic, usual, r);
    const date = workday(addDays(today, between(r, 14, 42)), specialist, 1);
    next = { date: atHour(date, appt.clinic, r), treatment, specialist };
  }

  return {
    since,
    skinType,
    zone,
    series: plan ? { session, total: plan.sessions } : null,
    next,
    // The file keeps the last six at most; the intake drops off once there are more recent visits.
    visits: visits.slice(0, 6),
  };
}

/** A believable start time inside the clinic's hours on that day. */
function atHour(day: Date, clinic: LocationId, r: Rng): Date {
  const hours = openingHours(day, clinic) ?? { open: 10, close: 17 };
  const date = new Date(day);
  date.setHours(between(r, hours.open, hours.close - 1), pick(r, [0, 15, 30, 45]), 0, 0);
  return date;
}
