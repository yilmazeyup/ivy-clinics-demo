import type { PhotoKey } from '../brands';
import { addDays, dateKey, startOfDay } from '../i18n/format';
import type { L10n } from '../i18n/locales';
import { atTime, hash, shuffle } from './random';

export type PureLevel = 'all' | 'beginner' | 'advanced' | 'calm';
export type ClassTypeId = 'flow' | 'core' | 'lunch' | 'burn' | 'stretch' | 'slowflow';
export type InstructorId = 'noor' | 'femke' | 'lotte';

export type ClassType = {
  id: ClassTypeId;
  name: string;
  level: PureLevel;
  minutes: number;
  credits: number;
  photo: PhotoKey;
  description: L10n;
};

export type PureSession = {
  id: string;
  typeId: ClassTypeId;
  instructorId: InstructorId;
  start: Date;
  end: Date;
  capacity: number;
  /** Reformers booked by other members. */
  taken: number[];
  waitlist: number;
  offPeak: boolean;
};

export const PURE_CAPACITY = 8;
export const WINDOW_REFORMERS = [1, 5];
export const FREE_CANCEL_HOURS = 12;

export const INSTRUCTORS: Record<InstructorId, { id: InstructorId; name: string }> = {
  noor: { id: 'noor', name: 'Noor' },
  femke: { id: 'femke', name: 'Femke' },
  lotte: { id: 'lotte', name: 'Lotte' },
};

export const CLASS_TYPES: Record<ClassTypeId, ClassType> = {
  flow: {
    id: 'flow',
    name: 'Reformer Flow',
    level: 'all',
    minutes: 50,
    credits: 1,
    photo: 'pure-flow',
    description: {
      nl: 'Vloeiende full-body les voor kracht, balans en houding.',
      en: 'A flowing full-body class for strength, balance and posture.',
      ar: 'حصة متكاملة وسلسة للقوة والتوازن واستقامة القوام.',
      fr: 'Un cours fluide pour tout le corps : force, équilibre et posture.',
      de: 'Fließender Ganzkörperkurs für Kraft, Balance und Haltung.',
      it: 'Una lezione fluida per tutto il corpo: forza, equilibrio e postura.',
    },
  },
  core: {
    id: 'core',
    name: 'Core & Stretch',
    level: 'beginner',
    minutes: 50,
    credits: 1,
    photo: 'pure-core',
    description: {
      nl: 'Rustig opbouwen: een sterke core en soepele heupen.',
      en: 'Build up gently: a strong core and supple hips.',
      ar: 'بناء تدريجي: عضلات جذع قوية ووركان مرنان.',
      fr: 'Une progression douce : sangle abdominale solide et hanches souples.',
      de: 'Sanfter Aufbau: starke Körpermitte und bewegliche Hüften.',
      it: 'Progressione dolce: core forte e anche flessibili.',
    },
  },
  lunch: {
    id: 'lunch',
    name: 'Lunch Express',
    level: 'all',
    minutes: 30,
    credits: 1,
    photo: 'pure-detail',
    description: {
      nl: 'Dertig minuten volle workout, op tijd terug aan je bureau.',
      en: 'Thirty minutes, a full workout, back at your desk on time.',
      ar: 'ثلاثون دقيقة من التمرين الكامل، وتعود إلى مكتبك في الموعد.',
      fr: 'Trente minutes d’entraînement complet, de retour au bureau à l’heure.',
      de: 'Dreißig Minuten volles Workout, pünktlich zurück am Schreibtisch.',
      it: 'Trenta minuti di allenamento completo, di nuovo alla scrivania in tempo.',
    },
  },
  burn: {
    id: 'burn',
    name: 'Slow Burn',
    level: 'advanced',
    minutes: 50,
    credits: 1,
    photo: 'pure-burn',
    description: {
      nl: 'Langzaam, gecontroleerd en intens. Voor wie al vertrouwd is met de reformer.',
      en: 'Slow, controlled and intense. For those already at home on the reformer.',
      ar: 'بطيئة ومنضبطة ومكثفة. لمن اعتاد على جهاز الريفورمر.',
      fr: 'Lent, contrôlé et intense. Pour qui est déjà à l’aise sur le reformer.',
      de: 'Langsam, kontrolliert und intensiv. Für alle, die den Reformer schon kennen.',
      it: 'Lenta, controllata e intensa. Per chi ha già familiarità con il reformer.',
    },
  },
  stretch: {
    id: 'stretch',
    name: 'Stretch & Release',
    level: 'calm',
    minutes: 50,
    credits: 1,
    photo: 'pure-stretch',
    description: {
      nl: 'Rustig tempo met nadruk op mobiliteit en ademhaling.',
      en: 'A calm pace with a focus on mobility and breathing.',
      ar: 'إيقاع هادئ مع تركيز على المرونة والتنفس.',
      fr: 'Un rythme calme, axé sur la mobilité et la respiration.',
      de: 'Ruhiges Tempo mit Fokus auf Beweglichkeit und Atmung.',
      it: 'Ritmo tranquillo, con attenzione a mobilità e respiro.',
    },
  },
  slowflow: {
    id: 'slowflow',
    name: 'Slow Flow',
    level: 'calm',
    minutes: 50,
    credits: 1,
    photo: 'pure-hero',
    description: {
      nl: 'Zachte, doorlopende bewegingen om de dag af te sluiten.',
      en: 'Soft, continuous movement to close the day.',
      ar: 'حركات ناعمة ومتواصلة لختام اليوم.',
      fr: 'Des mouvements doux et continus pour terminer la journée.',
      de: 'Sanfte, fließende Bewegungen zum Tagesausklang.',
      it: 'Movimenti morbidi e continui per chiudere la giornata.',
    },
  },
};

type Slot = { time: string; type: ClassTypeId; instructor: InstructorId; base: number; offPeak?: boolean };

const WEEKDAY: Slot[] = [
  { time: '07:30', type: 'flow', instructor: 'noor', base: 6 },
  { time: '09:00', type: 'core', instructor: 'femke', base: 4 },
  { time: '12:15', type: 'lunch', instructor: 'lotte', base: 3, offPeak: true },
  { time: '18:00', type: 'burn', instructor: 'noor', base: 8 },
  { time: '19:15', type: 'stretch', instructor: 'lotte', base: 5 },
  { time: '20:30', type: 'slowflow', instructor: 'femke', base: 6 },
];
const SATURDAY: Slot[] = [
  { time: '09:00', type: 'flow', instructor: 'noor', base: 8 },
  { time: '10:15', type: 'burn', instructor: 'femke', base: 7 },
  { time: '11:30', type: 'stretch', instructor: 'lotte', base: 5 },
];
const SUNDAY: Slot[] = [
  { time: '10:00', type: 'flow', instructor: 'femke', base: 7 },
  { time: '11:15', type: 'stretch', instructor: 'lotte', base: 6 },
];

/** Two weeks of classes from `today`, with stable occupancy so the demo looks the same every time. */
export function generatePureSessions(today: Date, days = 14): PureSession[] {
  const sessions: PureSession[] = [];
  for (let d = 0; d < days; d++) {
    const day = addDays(startOfDay(today), d);
    const dow = day.getDay();
    const slots = dow === 6 ? SATURDAY : dow === 0 ? SUNDAY : WEEKDAY;
    for (const slot of slots) {
      const type = CLASS_TYPES[slot.type];
      const start = atTime(day, slot.time);
      const id = `${dateKey(day)}-${slot.time.replace(':', '')}`;
      const seed = hash(id);
      let booked = Math.max(1, Math.min(PURE_CAPACITY, slot.base + (seed % 5) - 2));
      if (slot.type === 'burn' && slot.time === '18:00') booked = PURE_CAPACITY;
      // Calm classes keep the window spot free, so "by the window" always works in the demo.
      const pool = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => !(slot.type === 'stretch' && n === 1));
      const taken = shuffle(pool, seed).slice(0, booked).sort((a, b) => a - b);
      sessions.push({
        id,
        typeId: slot.type,
        instructorId: slot.instructor,
        start,
        end: new Date(start.getTime() + type.minutes * 60000),
        capacity: PURE_CAPACITY,
        taken,
        waitlist: taken.length >= PURE_CAPACITY ? 1 + (seed % 4) : 0,
        offPeak: Boolean(slot.offPeak),
      });
    }
  }
  return sessions;
}

/** Shown on full classes: fewer people waiting means a better chance. */
export function waitlistChance(session: PureSession): number {
  return Math.max(15, 92 - session.waitlist * 7);
}

export function timeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export const PURE_MEMBER = {
  firstName: 'Sanne',
  lastName: 'Jansen',
  credits: 7,
  weeksActive: 3,
  classesThisMonth: 12,
};

export type PurePackage = { id: 'trial' | 'ten' | 'unlimited'; credits: number; price: number; monthly: boolean };

export const PURE_PACKAGES: PurePackage[] = [
  { id: 'trial', credits: 1, price: 15, monthly: false },
  { id: 'ten', credits: 10, price: 210, monthly: false },
  { id: 'unlimited', credits: 0, price: 159, monthly: true },
];

/** The member's first booking: the next morning Reformer Flow, preferably on reformer 4. */
export function initialPureBooking(sessions: PureSession[], now: Date): { sessionId: string; reformer: number } | null {
  const preferred = [4, 2, 6, 3, 7, 8, 5, 1];
  for (const session of sessions) {
    if (session.typeId !== 'flow' || session.start.getTime() < now.getTime() + 2 * 3600000) continue;
    const reformer = preferred.find((n) => !session.taken.includes(n));
    if (reformer) return { sessionId: session.id, reformer };
  }
  return null;
}
