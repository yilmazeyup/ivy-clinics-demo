import { addDays, dateKey, SPECIALISTS, treatmentById, type LocationId, type Specialist, type Treatment, type TreatmentId } from '@pure-clinics/shared';

import { between, personName, pick, rng } from './random';

/** How a treatment is usually given as a series, after pureclinics.nl: the number of sessions and the weeks between them. */
export const COURSE_PLAN: Partial<Record<TreatmentId, { sessions: number; weeks: number }>> = {
  laser: { sessions: 8, weeks: 5 },
  epilation: { sessions: 10, weeks: 4 },
  acne: { sessions: 5, weeks: 3 },
  couperose: { sessions: 3, weeks: 5 },
  pigment: { sessions: 3, weeks: 4 },
  skinpen: { sessions: 6, weeks: 5 },
  sylfirm: { sessions: 4, weeks: 4 },
  tattoo: { sessions: 8, weeks: 10 },
  xlhair: { sessions: 8, weeks: 2 },
};

/** A client partway through a series of treatments. */
export type Course = {
  id: string;
  client: string;
  treatment: Treatment;
  specialist: Specialist;
  clinic: LocationId;
  /** Sessions done so far, out of the plan's total. */
  done: number;
  total: number;
  last: Date;
  /** When the next session is due, from the plan's interval. */
  due: Date;
  /** The next session, once it is in the diary. */
  planned: Date | null;
  /** When a reminder went out, so the button is not pressed twice. */
  reminded: Date | null;
};

export type CourseState = 'planned' | 'late' | 'due' | 'onTrack';

/** Planned when the next session is booked; due from a week before the date; late two weeks after it. */
export function courseState(course: Course, now: Date): CourseState {
  if (course.planned) return 'planned';
  const days = (now.getTime() - course.due.getTime()) / 86400000;
  if (days > 14) return 'late';
  if (days >= -7) return 'due';
  return 'onTrack';
}

const ORDER: Record<CourseState, number> = { late: 0, due: 1, planned: 2, onTrack: 3 };

/** Who needs attention first: late, then due, then booked, then the rest. */
export const byUrgency = (now: Date) => (a: Course, b: Course) =>
  ORDER[courseState(a, now)] - ORDER[courseState(b, now)] || a.due.getTime() - b.due.getTime();

/** Thirty clients partway through a series, the same on every load of the day. Laser is most of them. */
export function coursesOn(now: Date): Course[] {
  const r = rng(`courses-${dateKey(now)}`);
  const ids = Object.keys(COURSE_PLAN) as TreatmentId[];
  const weighted = ids.flatMap((id) => Array<TreatmentId>(id === 'laser' ? 6 : id === 'acne' || id === 'xlhair' ? 2 : 1).fill(id));
  return Array.from({ length: 30 }, (_, i) => {
    const treatment = treatmentById(pick(r, weighted));
    const plan = COURSE_PLAN[treatment.id]!;
    const specialist = pick(r, SPECIALISTS.filter((s) => s.categories.includes(treatment.category)));
    const last = addDays(now, -between(r, plan.weeks * 7 - 24, plan.weeks * 7 + 24));
    const planned = r() < 0.4 ? addDays(now, between(r, 1, 20)) : null;
    if (planned) planned.setHours(pick(r, [9, 10, 11, 13, 14, 15, 16, 18]), pick(r, [0, 15, 30, 45]), 0, 0);
    return {
      id: `course-${i}`,
      client: personName(r),
      treatment,
      specialist,
      clinic: specialist.locationId,
      done: between(r, 1, plan.sessions - 1),
      total: plan.sessions,
      last,
      due: addDays(last, plan.weeks * 7),
      planned,
      reminded: null,
    };
  });
}
