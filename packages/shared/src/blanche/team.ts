import type { L10n } from '../i18n/locales';
import type { CategoryId, ServiceId } from './catalog';
import type { BlanchePhoto } from './photos';
import type { StudioLocationId } from './studio';

export type StylistId = 'mila' | 'zoe' | 'nova';

export type Stylist = {
  id: StylistId;
  name: string;
  crafts: CategoryId[];
  /** Services she does not do within her crafts. */
  skips?: ServiceId[];
  /** What she is known for in the studio. */
  known: L10n;
  /** A photo of her work, shown instead of a portrait. */
  work: BlanchePhoto;
  /** Working days in Nijmegen, as Date#getDay() values. */
  days: number[];
  /** Days she does lash lifts in Uden. */
  uden?: number[];
  rating: number;
};

const t = (nl: string, en: string, ar: string, fr: string, de: string, it: string): L10n => ({ nl, en, ar, fr, de, it });

// A fictional team for the demo; the studio's real stylists are not named here.
export const STYLISTS: Stylist[] = [
  {
    id: 'mila',
    name: 'Mila',
    crafts: ['nails'],
    known: t(
      'BIAB, nudes & strakke vormen',
      'BIAB, nudes & clean shapes',
      'BIAB والنود والأشكال المتقنة',
      'BIAB, nudes & formes nettes',
      'BIAB, Nudes & klare Formen',
      'BIAB, nude & forme pulite',
    ),
    work: 'nails-nude',
    days: [2, 3, 4, 6],
    rating: 4.9,
  },
  {
    id: 'zoe',
    name: 'Zoë',
    crafts: ['nails'],
    known: t(
      'Nail art, chrome & Sparkle sets',
      'Nail art, chrome & Sparkle sets',
      'رسم الأظافر والكروم ومجموعات Sparkle',
      'Nail art, chrome & Sparkle sets',
      'Nail Art, Chrome & Sparkle-Sets',
      'Nail art, chrome & Sparkle set',
    ),
    work: 'nails-sparkle',
    days: [0, 3, 4, 6],
    rating: 5,
  },
  {
    id: 'nova',
    name: 'Nova',
    crafts: ['lashes', 'brows'],
    known: t(
      'Korean lash lifts & brow lamination',
      'Korean lash lifts & brow lamination',
      'رفع الرموش الكوري وتثبيت الحواجب',
      'Rehaussements coréens & brow lamination',
      'Korean Lash Lifts & Brow Lamination',
      'Laminazione coreana & sopracciglia',
    ),
    work: 'lashes-lift',
    days: [0, 2, 3, 4, 6],
    uden: [5],
    rating: 4.9,
  },
];

export function stylistById(id: StylistId): Stylist {
  return STYLISTS.find((s) => s.id === id) ?? STYLISTS[0];
}

/** Whether a stylist works at a location on a day. */
export function worksAt(stylist: Stylist, day: Date, location: StudioLocationId): boolean {
  return location === 'uden' ? (stylist.uden ?? []).includes(day.getDay()) : stylist.days.includes(day.getDay());
}
