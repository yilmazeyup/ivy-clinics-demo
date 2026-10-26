import type { PhotoKey } from '../brands';
import { addDays, dateKey, startOfDay } from '../i18n/format';
import type { L10n } from '../i18n/locales';
import { atTime, hash, shuffle } from './random';

export type PureLevel = 'all' | 'beginner' | 'advanced' | 'calm';
/** The kinds of class. Reformer pilates has its own studio; everything else happens on mats in the second studio. */
export type Discipline = 'reformer' | 'mat' | 'yoga' | 'barre' | 'stretch';
export const DISCIPLINES: Discipline[] = ['reformer', 'mat', 'yoga', 'barre', 'stretch'];
export type ClassTypeId =
  | 'flow'
  | 'core'
  | 'lunch'
  | 'burn'
  | 'stretch'
  | 'slowflow'
  | 'matpilates'
  | 'vinyasa'
  | 'yin'
  | 'barre'
  | 'breathe';
export type InstructorId = 'noor' | 'femke' | 'lotte' | 'anouk' | 'roos';

export type ClassType = {
  id: ClassTypeId;
  name: string;
  discipline: Discipline;
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
  /** Spots booked by other members: reformers in the reformer studio, mats in the mat studio. */
  taken: number[];
  waitlist: number;
  offPeak: boolean;
};

/** Reformers in the reformer studio. */
export const PURE_CAPACITY = 8;
/** Mats in the second studio, for mat pilates, yoga, barre and stretch. */
export const MAT_CAPACITY = 12;
export const WINDOW_REFORMERS = [1, 5];
export const FREE_CANCEL_HOURS = 12;

export const INSTRUCTORS: Record<InstructorId, { id: InstructorId; name: string }> = {
  noor: { id: 'noor', name: 'Noor' },
  femke: { id: 'femke', name: 'Femke' },
  lotte: { id: 'lotte', name: 'Lotte' },
  anouk: { id: 'anouk', name: 'Anouk' },
  roos: { id: 'roos', name: 'Roos' },
};

export const CLASS_TYPES: Record<ClassTypeId, ClassType> = {
  flow: {
    id: 'flow',
    name: 'Reformer Flow',
    discipline: 'reformer',
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
    discipline: 'reformer',
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
    discipline: 'reformer',
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
    discipline: 'reformer',
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
    discipline: 'reformer',
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
    discipline: 'reformer',
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
  matpilates: {
    id: 'matpilates',
    name: 'Mat Pilates',
    discipline: 'mat',
    level: 'beginner',
    minutes: 45,
    credits: 1,
    photo: 'pure-mat',
    description: {
      nl: 'Pilates op de mat, zonder toestel: sterke buikspieren, een rechte rug en een rustige ademhaling.',
      en: 'Pilates on the mat, no machine: strong abs, a straight back and calm breathing.',
      ar: 'بيلاتس على البساط دون جهاز: عضلات بطن قوية وظهر مستقيم وتنفس هادئ.',
      fr: 'Le Pilates au tapis, sans machine : abdos solides, dos droit et respiration calme.',
      de: 'Pilates auf der Matte, ohne Gerät: starke Bauchmuskeln, ein gerader Rücken und ruhiger Atem.',
      it: 'Pilates sul tappetino, senza macchina: addominali forti, schiena dritta e respiro calmo.',
    },
  },
  vinyasa: {
    id: 'vinyasa',
    name: 'Vinyasa Yoga',
    discipline: 'yoga',
    level: 'all',
    minutes: 60,
    credits: 1,
    photo: 'pure-yoga',
    description: {
      nl: 'Vloeiende yoga waarin beweging en ademhaling samenvallen. Je gaat vol energie naar huis.',
      en: 'Flowing yoga where movement and breath go together. You leave full of energy.',
      ar: 'يوغا انسيابية تتناغم فيها الحركة مع التنفس، فتخرج مفعمًا بالطاقة.',
      fr: 'Un yoga fluide où le mouvement suit la respiration. Tu repars plein d’énergie.',
      de: 'Fließendes Yoga, bei dem Bewegung und Atem eins werden. Du gehst voller Energie nach Hause.',
      it: 'Yoga fluido in cui movimento e respiro vanno insieme. Esci pieno di energia.',
    },
  },
  yin: {
    id: 'yin',
    name: 'Yin Yoga',
    discipline: 'yoga',
    level: 'calm',
    minutes: 60,
    credits: 1,
    photo: 'pure-yin',
    description: {
      nl: 'Lang aangehouden houdingen op de mat. Ontspant diep en maakt je soepeler.',
      en: 'Poses held for longer on the mat. Deeply relaxing and good for flexibility.',
      ar: 'وضعيات تُثبَّت طويلًا على البساط، تمنح استرخاءً عميقًا ومرونة أكبر.',
      fr: 'Des postures tenues longtemps sur le tapis. Relaxant en profondeur et assouplissant.',
      de: 'Lange gehaltene Haltungen auf der Matte. Tief entspannend und gut für die Beweglichkeit.',
      it: 'Posizioni mantenute a lungo sul tappetino. Rilassa a fondo e rende più flessibili.',
    },
  },
  barre: {
    id: 'barre',
    name: 'Barre Sculpt',
    discipline: 'barre',
    level: 'all',
    minutes: 45,
    credits: 1,
    photo: 'pure-barre',
    description: {
      nl: 'Kleine, precieze bewegingen aan de balletbarre. Voor sterke benen, billen en een mooie houding.',
      en: 'Small, precise movements at the ballet barre. For strong legs and glutes and good posture.',
      ar: 'حركات صغيرة ودقيقة على عارضة الباليه، لساقين وأرداف قوية وقوام مستقيم.',
      fr: 'De petits mouvements précis à la barre. Pour des jambes et des fessiers toniques et une belle posture.',
      de: 'Kleine, präzise Bewegungen an der Ballettstange. Für starke Beine, einen festen Po und gute Haltung.',
      it: 'Movimenti piccoli e precisi alla sbarra. Per gambe e glutei tonici e una bella postura.',
    },
  },
  breathe: {
    id: 'breathe',
    name: 'Stretch & Breathe',
    discipline: 'stretch',
    level: 'calm',
    minutes: 45,
    credits: 1,
    photo: 'pure-breathe',
    description: {
      nl: 'Rustig rekken en bewust ademhalen. Fijn na een drukke dag of om te herstellen.',
      en: 'Gentle stretching and mindful breathing. Lovely after a busy day or for recovery.',
      ar: 'تمدد هادئ وتنفس واعٍ، مثالي بعد يوم مزدحم أو للتعافي.',
      fr: 'Des étirements doux et une respiration consciente. Idéal après une journée chargée ou pour récupérer.',
      de: 'Sanftes Dehnen und bewusstes Atmen. Schön nach einem vollen Tag oder zur Erholung.',
      it: 'Allungamenti dolci e respiro consapevole. Ideale dopo una giornata piena o per recuperare.',
    },
  },
};

type Slot = { time: string; type: ClassTypeId; instructor: InstructorId; base: number; offPeak?: boolean };

// Reformer classes and mat classes run in their own studio, so their times may overlap.
const WEEKDAY: Slot[] = [
  { time: '07:00', type: 'vinyasa', instructor: 'anouk', base: 9 },
  { time: '07:30', type: 'flow', instructor: 'noor', base: 6 },
  { time: '09:00', type: 'core', instructor: 'femke', base: 4 },
  { time: '09:30', type: 'matpilates', instructor: 'roos', base: 7 },
  { time: '12:15', type: 'lunch', instructor: 'lotte', base: 3, offPeak: true },
  { time: '12:30', type: 'barre', instructor: 'roos', base: 6, offPeak: true },
  { time: '17:30', type: 'barre', instructor: 'roos', base: 10 },
  { time: '18:00', type: 'burn', instructor: 'noor', base: 8 },
  { time: '18:15', type: 'vinyasa', instructor: 'anouk', base: 10 },
  { time: '19:15', type: 'stretch', instructor: 'lotte', base: 5 },
  { time: '19:30', type: 'breathe', instructor: 'roos', base: 6 },
  { time: '20:30', type: 'slowflow', instructor: 'femke', base: 6 },
  { time: '20:30', type: 'yin', instructor: 'anouk', base: 7 },
];
const SATURDAY: Slot[] = [
  { time: '09:00', type: 'flow', instructor: 'noor', base: 8 },
  { time: '09:30', type: 'vinyasa', instructor: 'anouk', base: 10 },
  { time: '10:15', type: 'burn', instructor: 'femke', base: 7 },
  { time: '10:45', type: 'barre', instructor: 'roos', base: 9 },
  { time: '11:30', type: 'stretch', instructor: 'lotte', base: 5 },
  { time: '12:00', type: 'matpilates', instructor: 'roos', base: 6 },
];
const SUNDAY: Slot[] = [
  { time: '10:00', type: 'flow', instructor: 'femke', base: 7 },
  { time: '10:30', type: 'yin', instructor: 'anouk', base: 8 },
  { time: '11:15', type: 'stretch', instructor: 'lotte', base: 6 },
  { time: '11:45', type: 'breathe', instructor: 'roos', base: 6 },
];

/** Whether a class is on the reformers; all other classes are on mats in the second studio. */
export const onReformer = (typeId: ClassTypeId) => CLASS_TYPES[typeId].discipline === 'reformer';

/** How many people fit in a class: eight reformers or twelve mats. */
export const capacityOf = (typeId: ClassTypeId) => (onReformer(typeId) ? PURE_CAPACITY : MAT_CAPACITY);

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
      const id = `${dateKey(day)}-${slot.time.replace(':', '')}-${slot.type}`;
      const seed = hash(id);
      const capacity = capacityOf(slot.type);
      let booked = Math.max(1, Math.min(capacity, slot.base + (seed % 5) - 2));
      if (slot.type === 'burn' && slot.time === '18:00') booked = capacity;
      // Calm classes keep the window spot free, so "by the window" always works in the demo.
      const pool = Array.from({ length: capacity }, (_, i) => i + 1).filter((n) => !(slot.type === 'stretch' && n === 1));
      const taken = shuffle(pool, seed).slice(0, booked).sort((a, b) => a - b);
      sessions.push({
        id,
        typeId: slot.type,
        instructorId: slot.instructor,
        start,
        end: new Date(start.getTime() + type.minutes * 60000),
        capacity,
        taken,
        waitlist: taken.length >= capacity ? 1 + (seed % 4) : 0,
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
export function initialPureBooking(sessions: PureSession[], now: Date): { sessionId: string; spot: number } | null {
  const preferred = [4, 2, 6, 3, 7, 8, 5, 1];
  for (const session of sessions) {
    if (session.typeId !== 'flow' || session.start.getTime() < now.getTime() + 2 * 3600000) continue;
    const reformer = preferred.find((n) => !session.taken.includes(n));
    if (reformer) return { sessionId: session.id, spot: reformer };
  }
  return null;
}
