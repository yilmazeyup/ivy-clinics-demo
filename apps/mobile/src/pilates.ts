import { CLASS_TYPES, FREE_CANCEL_HOURS, INSTRUCTORS, onReformer, WINDOW_REFORMERS, waitlistChance, type PureSession } from '@pure-ivy/shared';
import { useMemo } from 'react';

import { useI18n } from './i18n';
import { useDemo, type PureBooking } from './state/demo';

export type SessionView = PureSession & {
  name: string;
  instructor: string;
  booking?: PureBooking;
  onWaitlist: boolean;
  spotsLeft: number;
  full: boolean;
  chance: number;
};

/** Pure data joined with the member's own bookings, ready for screens. */
export function usePilates() {
  const demo = useDemo();
  return useMemo(() => {
    const view = (s: PureSession): SessionView => {
      const booking = demo.bookings.find((b) => b.sessionId === s.id);
      const spotsLeft = s.capacity - s.taken.length - (booking ? 1 : 0);
      return {
        ...s,
        name: CLASS_TYPES[s.typeId].name,
        instructor: INSTRUCTORS[s.instructorId].name,
        booking,
        onWaitlist: demo.waitlist.includes(s.id),
        spotsLeft,
        full: spotsLeft <= 0 && !booking,
        chance: waitlistChance(s),
      };
    };
    const upcoming = demo.sessions.filter((s) => s.start.getTime() > demo.now.getTime()).map(view);
    const myClasses = upcoming.filter((s) => s.booking).sort((a, b) => a.start.getTime() - b.start.getTime());
    return {
      ...demo,
      upcoming,
      myClasses,
      waitlisted: upcoming.filter((s) => s.onWaitlist),
      next: myClasses[0],
      byId: (id: string) => {
        const s = demo.sessions.find((x) => x.id === id);
        return s ? view(s) : undefined;
      },
    };
  }, [demo]);
}

export function seatNote(reformer: number): 'pilates.class.byWindow' | 'pilates.class.frontRow' | 'pilates.class.backRow' {
  if (WINDOW_REFORMERS.includes(reformer)) return 'pilates.class.byWindow';
  return reformer <= 4 ? 'pilates.class.frontRow' : 'pilates.class.backRow';
}

/** Where the member is in class: a reformer and its place in the room, or a spot on a mat in studio 2. */
export function spotLines(session: PureSession, spot: number) {
  return onReformer(session.typeId)
    ? ({ label: 'pilates.class.reformer', note: seatNote(spot), withInstructor: 'pilates.home.withInstructor' } as const)
    : ({ label: 'pilates.class.spot', note: 'pilates.class.matStudio', withInstructor: 'pilates.home.withInstructorSpot' } as const);
}

export function freeCancelUntil(session: PureSession): Date {
  return new Date(session.start.getTime() - FREE_CANCEL_HOURS * 3600000);
}

/** "Gratis annuleren tot do 07:15", or a warning once that moment has passed. */
export function useCancelNote() {
  const { t, weekday, time } = useI18n();
  const { now } = useDemo();
  return (session: PureSession) => {
    const until = freeCancelUntil(session);
    return until.getTime() > now.getTime()
      ? t('pilates.class.freeCancel', { when: `${weekday(until)} ${time(until)}` })
      : t('pilates.class.noFreeCancel');
  };
}
