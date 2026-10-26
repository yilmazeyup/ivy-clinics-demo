import type { PhotoKey } from '../brands';
import { addDays, dateKey, startOfDay } from '../i18n/format';
import type { L10n } from '../i18n/locales';
import { atTime, hash } from './random';

// Treatments, starting prices, locations and opening hours follow ivyclinics.nl (October 2026).
// Durations, deposits, specialists and availability are demo data.

export type TreatmentCategory = 'consult' | 'injectables' | 'skin' | 'laser' | 'facials';
export type TreatmentId =
  | 'consult'
  | 'botox'
  | 'lipfiller'
  | 'profhilo'
  | 'hydrafacial'
  | 'microneedling'
  | 'pigment'
  | 'sparkpro'
  | 'alumier';
export type SpecialistId = 'yasmin' | 'elif' | 'mila' | 'sara' | 'noa' | 'lieke' | 'fleur' | 'iris' | 'demi';
export type ConcernId = 'wrinkles' | 'volume' | 'glow' | 'pigment' | 'texture';
export type LocationId = 'denbosch' | 'amstelveen' | 'amsterdam' | 'westervoort';

export type Treatment = {
  id: TreatmentId;
  category: TreatmentCategory;
  name: L10n;
  description: L10n;
  minutes: number;
  /** Starting price in euros, as published by the clinic. */
  priceFrom: number;
  deposit: number;
  photo: PhotoKey;
};

export type Specialist = {
  id: SpecialistId;
  name: string;
  role: 'doctor' | 'therapist' | 'laser';
  locationId: LocationId;
  categories: TreatmentCategory[];
  /** Working days, as Date#getDay() values. */
  days: number[];
};

export type Concern = { id: ConcernId; photo: PhotoKey; treatments: TreatmentId[] };

export type ClinicLocation = { id: LocationId; city: string; address: string };

export type IvyAppointment = {
  id: string;
  treatmentId: TreatmentId;
  specialistId: SpecialistId;
  locationId: LocationId;
  start: Date;
};

export type FreeSlot = { start: Date; specialistId: SpecialistId };

const same = (text: string): L10n => ({ nl: text, en: text, ar: text, fr: text, de: text, it: text });

export const LOCATIONS: ClinicLocation[] = [
  { id: 'amsterdam', city: 'Amsterdam', address: 'Westeinde 4, 1017 ZN' },
  { id: 'amstelveen', city: 'Amstelveen', address: 'Handelsweg 59, 1181 ZA' },
  { id: 'denbosch', city: "'s-Hertogenbosch", address: 'Vughterstraat 171, 5211 GB' },
  { id: 'westervoort', city: 'Westervoort', address: 'Kerkstraat 1, 6931 DR' },
];

export const TREATMENTS: Treatment[] = [
  {
    id: 'consult',
    category: 'consult',
    name: { nl: 'Gratis adviesgesprek', en: 'Free consultation', ar: 'استشارة مجانية', fr: 'Consultation gratuite', de: 'Kostenlose Beratung', it: 'Consulenza gratuita' },
    description: {
      nl: 'Kennismaken, je wensen bespreken en een eerlijk advies. Vrijblijvend.',
      en: 'Meet us, talk through your wishes and get honest advice. No obligation.',
      ar: 'تعارف ومناقشة رغباتك ونصيحة صادقة، دون أي التزام.',
      fr: 'Faire connaissance, parler de tes envies et recevoir un avis honnête. Sans engagement.',
      de: 'Kennenlernen, Wünsche besprechen und ehrlich beraten werden. Unverbindlich.',
      it: 'Conoscersi, parlare dei tuoi desideri e ricevere un consiglio onesto. Senza impegno.',
    },
    minutes: 30,
    priceFrom: 0,
    deposit: 0,
    photo: 'ivy-room',
  },
  {
    id: 'botox',
    category: 'injectables',
    name: { nl: 'Botox', en: 'Botox', ar: 'البوتوكس', fr: 'Botox', de: 'Botox', it: 'Botox' },
    description: {
      nl: 'Verzacht expressielijntjes, met een natuurlijk resultaat.',
      en: 'Softens expression lines, with a natural result.',
      ar: 'يخفف خطوط التعبير بنتيجة طبيعية.',
      fr: 'Adoucit les rides d’expression, avec un résultat naturel.',
      de: 'Mildert Mimikfalten, mit natürlichem Ergebnis.',
      it: 'Attenua le rughe d’espressione, con un risultato naturale.',
    },
    minutes: 30,
    priceFrom: 85,
    deposit: 25,
    photo: 'ivy-hero',
  },
  {
    id: 'lipfiller',
    category: 'injectables',
    name: { nl: 'Lipfiller', en: 'Lip filler', ar: 'فيلر الشفاه', fr: 'Filler des lèvres', de: 'Lippenfiller', it: 'Filler labbra' },
    description: {
      nl: 'Meer volume en definitie, afgestemd op jouw gezicht.',
      en: 'More volume and definition, tailored to your face.',
      ar: 'حجم وتحديد أكثر، بما يناسب ملامح وجهك.',
      fr: 'Plus de volume et de définition, adaptés à ton visage.',
      de: 'Mehr Volumen und Kontur, abgestimmt auf dein Gesicht.',
      it: 'Più volume e definizione, su misura per il tuo viso.',
    },
    minutes: 45,
    priceFrom: 395,
    deposit: 50,
    photo: 'ivy-facial',
  },
  {
    id: 'profhilo',
    category: 'injectables',
    name: { ...same('Profhilo'), ar: 'بروفايلو' },
    description: {
      nl: 'Hydrateert de huid van binnenuit voor meer stevigheid.',
      en: 'Hydrates the skin from within for more firmness.',
      ar: 'يرطب البشرة من الداخل لمزيد من التماسك.',
      fr: 'Hydrate la peau de l’intérieur pour plus de fermeté.',
      de: 'Spendet der Haut von innen Feuchtigkeit für mehr Festigkeit.',
      it: 'Idrata la pelle dall’interno per una maggiore compattezza.',
    },
    minutes: 30,
    priceFrom: 295,
    deposit: 50,
    photo: 'ivy-neck',
  },
  {
    id: 'hydrafacial',
    category: 'skin',
    name: { ...same('HydraFacial'), ar: 'هايدرافيشل' },
    description: {
      nl: 'Diepe reiniging en hydratatie in één behandeling.',
      en: 'Deep cleansing and hydration in one treatment.',
      ar: 'تنظيف عميق وترطيب في جلسة واحدة.',
      fr: 'Nettoyage en profondeur et hydratation en un seul soin.',
      de: 'Tiefenreinigung und Feuchtigkeit in einer Behandlung.',
      it: 'Pulizia profonda e idratazione in un unico trattamento.',
    },
    minutes: 60,
    priceFrom: 150,
    deposit: 25,
    photo: 'ivy-peel',
  },
  {
    id: 'microneedling',
    category: 'skin',
    name: { ...same('Microneedling'), ar: 'الميكرونيدلينغ' },
    description: {
      nl: 'Stimuleert de huid voor een egalere, stevigere huid.',
      en: 'Stimulates the skin for a smoother, firmer finish.',
      ar: 'يحفّز البشرة لتصبح أنعم وأكثر تماسكًا.',
      fr: 'Stimule la peau pour un grain plus lisse et plus ferme.',
      de: 'Regt die Haut an für ein glatteres, festeres Hautbild.',
      it: 'Stimola la pelle per un aspetto più liscio e compatto.',
    },
    minutes: 60,
    priceFrom: 145,
    deposit: 25,
    photo: 'ivy-microneedling',
  },
  {
    id: 'pigment',
    category: 'skin',
    name: {
      nl: 'Pigmentvlekken behandeling',
      en: 'Pigmentation treatment',
      ar: 'علاج التصبغات',
      fr: 'Traitement des taches pigmentaires',
      de: 'Pigmentfleckenbehandlung',
      it: 'Trattamento macchie pigmentarie',
    },
    description: {
      nl: 'Vermindert pigmentvlekken voor een egalere teint.',
      en: 'Reduces pigmentation spots for a more even tone.',
      ar: 'يخفف البقع الداكنة لبشرة أكثر توحدًا.',
      fr: 'Atténue les taches pigmentaires pour un teint plus uniforme.',
      de: 'Mildert Pigmentflecken für einen ebenmäßigeren Teint.',
      it: 'Riduce le macchie per un incarnato più uniforme.',
    },
    minutes: 45,
    priceFrom: 125,
    deposit: 25,
    photo: 'ivy-white',
  },
  {
    id: 'sparkpro',
    category: 'laser',
    name: { ...same('Spark Pro laser'), ar: 'ليزر Spark Pro' },
    description: {
      nl: 'Lasertherapie die de huid vernieuwt en egaliseert.',
      en: 'Laser therapy that renews and evens out the skin.',
      ar: 'علاج بالليزر يجدد البشرة ويوحد لونها.',
      fr: 'Un laser qui renouvelle et unifie la peau.',
      de: 'Lasertherapie, die die Haut erneuert und ebnet.',
      it: 'Laser che rinnova e uniforma la pelle.',
    },
    minutes: 30,
    priceFrom: 35,
    deposit: 10,
    photo: 'ivy-glow',
  },
  {
    id: 'alumier',
    category: 'facials',
    name: { ...same('AlumierMD facial'), ar: 'عناية AlumierMD' },
    description: {
      nl: 'Professionele facial met medische huidverzorging.',
      en: 'A professional facial with medical-grade skincare.',
      ar: 'عناية احترافية بالوجه بمستحضرات طبية.',
      fr: 'Un soin professionnel avec des produits de qualité médicale.',
      de: 'Professionelle Gesichtsbehandlung mit medizinischer Hautpflege.',
      it: 'Trattamento viso professionale con skincare di grado medico.',
    },
    minutes: 60,
    priceFrom: 100,
    deposit: 25,
    photo: 'ivy-hands',
  },
];

export const CONCERNS: Concern[] = [
  { id: 'wrinkles', photo: 'ivy-brows', treatments: ['botox', 'profhilo'] },
  { id: 'volume', photo: 'ivy-facial', treatments: ['lipfiller', 'profhilo'] },
  { id: 'glow', photo: 'ivy-glow', treatments: ['hydrafacial', 'alumier'] },
  { id: 'pigment', photo: 'ivy-white', treatments: ['pigment', 'sparkpro'] },
  { id: 'texture', photo: 'ivy-neck', treatments: ['microneedling', 'sparkpro'] },
];

// Fictional team: every location has a doctor for injectables and a therapist for skin, laser and facials.
export const SPECIALISTS: Specialist[] = [
  { id: 'yasmin', name: 'Yasmin', role: 'doctor', locationId: 'amsterdam', categories: ['consult', 'injectables'], days: [1, 2, 4, 6] },
  { id: 'elif', name: 'Elif', role: 'therapist', locationId: 'amsterdam', categories: ['consult', 'skin', 'facials'], days: [1, 2, 3, 5] },
  { id: 'mila', name: 'Mila', role: 'laser', locationId: 'amsterdam', categories: ['skin', 'laser'], days: [2, 3, 4, 5, 6] },
  { id: 'sara', name: 'Sara', role: 'doctor', locationId: 'amstelveen', categories: ['consult', 'injectables'], days: [1, 3, 5, 6] },
  { id: 'noa', name: 'Noa', role: 'therapist', locationId: 'amstelveen', categories: ['consult', 'skin', 'laser', 'facials'], days: [2, 3, 4, 5, 6] },
  { id: 'lieke', name: 'Lieke', role: 'doctor', locationId: 'denbosch', categories: ['consult', 'injectables'], days: [2, 4, 5, 6] },
  { id: 'fleur', name: 'Fleur', role: 'therapist', locationId: 'denbosch', categories: ['consult', 'skin', 'laser', 'facials'], days: [1, 2, 3, 4, 5] },
  { id: 'iris', name: 'Iris', role: 'doctor', locationId: 'westervoort', categories: ['consult', 'injectables'], days: [1, 3, 4, 6] },
  { id: 'demi', name: 'Demi', role: 'therapist', locationId: 'westervoort', categories: ['consult', 'skin', 'laser', 'facials'], days: [1, 2, 3, 5, 6] },
];

export const IVY_MEMBER = { firstName: 'Lisa', lastName: 'de Vries', locationId: 'amsterdam' as LocationId };

/** Mon–Fri 09:00–21:00, Saturday 09:00–17:00, Sunday closed. */
export function openingHours(day: Date): { open: number; close: number } | null {
  const dow = day.getDay();
  if (dow === 0) return null;
  return dow === 6 ? { open: 9, close: 17 } : { open: 9, close: 21 };
}

export function treatmentById(id: TreatmentId): Treatment {
  return TREATMENTS.find((t) => t.id === id) ?? TREATMENTS[0];
}

export function specialistById(id: SpecialistId): Specialist {
  return SPECIALISTS.find((s) => s.id === id) ?? SPECIALISTS[0];
}

export function locationById(id: LocationId): ClinicLocation {
  return LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0];
}

/** Specialists who give a treatment, optionally only those working at one location. */
export function specialistsFor(treatment: Treatment, locationId?: LocationId): Specialist[] {
  return SPECIALISTS.filter((s) => s.categories.includes(treatment.category) && (!locationId || s.locationId === locationId));
}

type Block = { start: number; end: number };

/** Other clients' appointments for a specialist on a day, the same on every run. */
function busyBlocks(specialist: Specialist, day: Date, locationId: LocationId): Block[] {
  const hours = openingHours(day);
  if (!hours) return [];
  const seed = hash(`${specialist.id}-${locationId}-${dateKey(day)}`);
  const blocks: Block[] = [];
  for (let i = 0; i < 6; i++) {
    const part = hash(`${seed}-${i}`);
    const startHour = hours.open + (part % (hours.close - hours.open - 1));
    const start = atTime(day, `${String(startHour).padStart(2, '0')}:${part % 2 === 0 ? '00' : '30'}`).getTime();
    blocks.push({ start, end: start + (45 + ((part >> 4) % 3) * 15) * 60000 });
  }
  return blocks;
}

/**
 * Bookable start times for a treatment on a day: inside opening hours, clear of other clients
 * and of `extraBusy` (the member's own appointments), at least 45 minutes apart.
 */
export function freeSlots(
  treatment: Treatment,
  specialistId: SpecialistId | 'any',
  day: Date,
  now: Date,
  locationId: LocationId,
  extraBusy: IvyAppointment[] = [],
): FreeSlot[] {
  const hours = openingHours(day);
  if (!hours) return [];
  const candidates = specialistsFor(treatment, locationId).filter((s) => specialistId === 'any' || s.id === specialistId);
  const durationMs = treatment.minutes * 60000;
  const found = new Map<number, SpecialistId>();
  for (const specialist of candidates) {
    if (!specialist.days.includes(day.getDay())) continue;
    const blocks = busyBlocks(specialist, day, locationId).concat(
      extraBusy
        .filter((a) => a.specialistId === specialist.id)
        .map((a) => ({ start: a.start.getTime(), end: a.start.getTime() + treatmentById(a.treatmentId).minutes * 60000 })),
    );
    let lastAccepted = -Infinity;
    for (let minutes = hours.open * 60; minutes + treatment.minutes <= hours.close * 60; minutes += 15) {
      const start = startOfDay(day).getTime() + minutes * 60000;
      if (start < now.getTime() + 3600000) continue;
      const end = start + durationMs;
      const clash = blocks.some((b) => start < b.end && end > b.start);
      if (clash || start - lastAccepted < 45 * 60000) continue;
      lastAccepted = start;
      if (!found.has(start)) found.set(start, specialist.id);
    }
  }
  return Array.from(found.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(0, 12)
    .map(([start, sid]) => ({ start: new Date(start), specialistId: sid }));
}

/** The member's history and next visit. */
export function initialIvyAppointments(now: Date): IvyAppointment[] {
  const today = startOfDay(now);
  let next = addDays(today, 3);
  while (!specialistById('elif').days.includes(next.getDay())) next = addDays(next, 1);
  return [
    { id: 'appt-next', treatmentId: 'hydrafacial', specialistId: 'elif', locationId: 'amsterdam', start: atTime(next, '10:30') },
    { id: 'appt-botox', treatmentId: 'botox', specialistId: 'yasmin', locationId: 'amsterdam', start: atTime(addDays(today, -112), '17:30') },
    { id: 'appt-hydra', treatmentId: 'hydrafacial', specialistId: 'elif', locationId: 'amsterdam', start: atTime(addDays(today, -70), '11:00') },
  ];
}

/**
 * Three to four months after an injectable treatment, invite the client for a free check-up with the
 * same doctor. The reminder never names the product: in the Netherlands, prescription medicines such as
 * botulinum toxin may not be advertised to the public.
 */
export function checkupSuggestion(
  now: Date,
  booked: IvyAppointment[],
): { treatment: Treatment; slot: FreeSlot; monthsAgo: number; locationId: LocationId } | null {
  const injectable = (a: IvyAppointment) => treatmentById(a.treatmentId).category === 'injectables';
  const last = booked
    .filter((a) => injectable(a) && a.start.getTime() < now.getTime())
    .sort((a, b) => b.start.getTime() - a.start.getTime())[0];
  if (!last) return null;
  // Once a check-up or a new treatment is planned, the reminder has done its job.
  if (booked.some((a) => (injectable(a) || a.treatmentId === 'consult') && a.start.getTime() > now.getTime())) return null;
  const treatment = treatmentById('consult');
  for (let d = 1; d <= 10; d++) {
    const day = addDays(startOfDay(now), d);
    const slots = freeSlots(treatment, last.specialistId, day, now, last.locationId, booked);
    const evening = slots.find((s) => s.start.getHours() >= 17) ?? slots[0];
    if (evening) {
      const monthsAgo = Math.round((now.getTime() - last.start.getTime()) / (30.44 * 86400000));
      return { treatment, slot: evening, monthsAgo, locationId: last.locationId };
    }
  }
  return null;
}
