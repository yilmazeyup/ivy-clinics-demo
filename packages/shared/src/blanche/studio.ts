import type { L10n } from '../i18n/locales';
import type { ServiceId } from './catalog';

// Where Blanche Beauty works and how to reach it, from blanchebeauty.nl and pureclinics.nl (October 2026). The studio is
// inside Pure Clinics in Nijmegen; Korean lash lifts are also booked at Pure Clinics Uden, on demo days here.

export type StudioLocationId = 'nijmegen' | 'uden';

type WeekHours = Record<number, { open: number; close: number } | null>;

export type StudioLocation = { id: StudioLocationId; city: string; address: string; postcode: string; hours: WeekHours };

export const LOCATIONS_BLANCHE: StudioLocation[] = [
  {
    id: 'nijmegen',
    city: 'Nijmegen',
    address: 'Sint Annastraat 1',
    postcode: '6524 EA',
    // Opening hours as listed on blanchebeauty.nl.
    hours: {
      0: { open: 12, close: 17 },
      1: null,
      2: { open: 9, close: 21 },
      3: { open: 9, close: 21 },
      4: { open: 9, close: 21 },
      5: null,
      6: { open: 9, close: 17 },
    },
  },
  {
    id: 'uden',
    city: 'Uden',
    address: 'Kastanjeweg 1',
    postcode: '5401 GW',
    // Demo: lash lifts in Uden on Fridays, when Pure Clinics Uden is open.
    hours: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: { open: 9, close: 17 }, 6: null },
  },
];

export const STUDIO = {
  name: 'Blanche Beauty',
  /** Inside Pure Clinics, the skin clinic of the same family. */
  inside: 'Pure Clinics',
  phone: '06 39 04 95 60',
  phoneLink: '+31639049560',
  instagram: 'blanchebeauty.nl',
  website: 'www.blanchebeauty.nl',
  /** The rating on the studio's Salonized page. */
  rating: 5,
  /** Free to move or cancel until this many hours before, as at Pure Clinics. */
  cancelHours: 48,
};

export function locationBlanche(id: StudioLocationId): StudioLocation {
  return LOCATIONS_BLANCHE.find((l) => l.id === id) ?? LOCATIONS_BLANCHE[0];
}

export function studioHours(day: Date, location: StudioLocationId = 'nijmegen'): { open: number; close: number } | null {
  return locationBlanche(location).hours[day.getDay()] ?? null;
}

export type Review = { name: string; service: ServiceId; text: L10n };

const t = (nl: string, en: string, ar: string, fr: string, de: string, it: string): L10n => ({ nl, en, ar, fr, de, it });

// Example reviews for the demo, in the spirit of what clients write on the studio's booking page.
export const REVIEWS: Review[] = [
  {
    name: 'Sanne V.',
    service: 'biab-nude',
    text: t(
      'Mijn BIAB zit na vier weken nog perfect. En nu plan ik mijn refill gewoon zelf in de app.',
      'My BIAB is still perfect after four weeks. And now I simply plan my refill in the app.',
      'ما زال BIAB مثاليًا بعد أربعة أسابيع، والآن أخطط موعدي التالي بنفسي في التطبيق.',
      'Mon BIAB est encore parfait après quatre semaines. Et je planifie mon prochain rendez-vous dans l’appli.',
      'Mein BIAB sitzt nach vier Wochen noch perfekt. Und jetzt plane ich den nächsten Termin einfach in der App.',
      'Il mio BIAB è perfetto dopo quattro settimane. E ora prenoto il prossimo direttamente nell’app.',
    ),
  },
  {
    name: 'Yasmina K.',
    service: 'brow-lamination',
    text: t(
      'Super mooie brow lamination. Ze luistert echt naar wat je wilt voordat ze begint.',
      'Gorgeous brow lamination. She really listens to what you want before she starts.',
      'تثبيت حواجب رائع. تستمع فعلًا لما تريدينه قبل أن تبدأ.',
      'Une brow lamination superbe. Elle écoute vraiment ce que tu veux avant de commencer.',
      'Wunderschöne Brow Lamination. Sie hört wirklich zu, was du willst, bevor sie anfängt.',
      'Laminazione bellissima. Ascolta davvero cosa vuoi prima di iniziare.',
    ),
  },
  {
    name: 'Iris M.',
    service: 'biab-color',
    text: t(
      'Ik liet een foto zien en ze maakte hem precies na, met chrome. Topproducten en heel precies.',
      'I showed a photo and she recreated it exactly, with chrome. Top products and very precise.',
      'أريتها صورة فنفذتها تمامًا مع الكروم. منتجات ممتازة ودقة عالية.',
      'J’ai montré une photo, elle l’a refaite à l’identique, avec du chrome. Top produits, très précis.',
      'Ich habe ein Foto gezeigt und sie hat es genau nachgemacht, mit Chrome. Top-Produkte, sehr präzise.',
      'Ho mostrato una foto e l’ha rifatta identica, con il chrome. Prodotti top e grande precisione.',
    ),
  },
  {
    name: 'Fenna D.',
    service: 'lash-lift',
    text: t(
      'De Korean lash lift is zo natuurlijk. Ik word wakker en hoef niks meer te doen.',
      'The Korean lash lift looks so natural. I wake up and don’t need to do a thing.',
      'رفع الرموش الكوري طبيعي جدًا. أستيقظ ولا أحتاج إلى فعل شيء.',
      'Le rehaussement coréen est si naturel. Je me réveille et je n’ai rien à faire.',
      'Der Korean Lash Lift ist so natürlich. Ich wache auf und muss nichts mehr machen.',
      'La laminazione coreana è così naturale. Mi sveglio e non devo fare nulla.',
    ),
  },
];
