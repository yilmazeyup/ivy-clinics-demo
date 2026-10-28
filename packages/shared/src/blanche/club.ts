import type { L10n } from '../i18n/locales';
import type { CategoryId, ServiceId } from './catalog';
import type { BlanchePhoto } from './photos';

// Blanche Club: points, levels, rewards, deals and passes. The studio has no loyalty scheme or packages today, so all of
// this is a demo proposal with demo values; rewards and deals are built from its real menu.

const t = (nl: string, en: string, ar: string, fr: string, de: string, it: string): L10n => ({ nl, en, ar, fr, de, it });

export const MEMBER = {
  firstName: 'Lisa',
  lastName: 'de Vries',
  /** Club points at the start of the demo. */
  points: 380,
  memberSince: new Date(2024, 2, 9),
  /** Her code for friends: they get € 10 off, she gets 100 points. */
  code: 'LISA-BLANCHE',
};

export type TierId = 'blanc' | 'rose' | 'cerise';
export type Tier = { id: TierId; name: string; from: number; perks: L10n[] };

/** Levels are named after the studio's colours: white, rosé and cherry. Points earned in the last twelve months count. */
export const TIERS: Tier[] = [
  {
    id: 'blanc',
    name: 'Blanc',
    from: 0,
    perks: [t('1 punt per euro', '1 point per euro', 'نقطة لكل يورو', '1 point par euro', '1 Punkt pro Euro', '1 punto per euro')],
  },
  {
    id: 'rose',
    name: 'Rosé',
    from: 300,
    perks: [
      t(
        'Verjaardagscadeau in de studio',
        'A birthday treat at the studio',
        'هدية عيد ميلاد في الاستوديو',
        'Une surprise d’anniversaire au studio',
        'Geburtstagsgeschenk im Studio',
        'Un regalo di compleanno in studio',
      ),
      t(
        'Als eerste nieuwe sets boeken',
        'First to book new sets',
        'أول من يحجز المجموعات الجديدة',
        'La première à réserver les nouveaux sets',
        'Neue Sets als Erste buchen',
        'Prima a prenotare i nuovi set',
      ),
    ],
  },
  {
    id: 'cerise',
    name: 'Cerise',
    from: 900,
    perks: [
      t(
        'Elke vijfde BIAB gratis nail art',
        'Free nail art with every fifth BIAB',
        'رسم أظافر مجاني مع كل BIAB خامس',
        'Nail art offert à chaque cinquième BIAB',
        'Gratis Nail Art bei jedem fünften BIAB',
        'Nail art gratis ogni quinto BIAB',
      ),
      t(
        'Voorrang op de wachtlijst',
        'Priority on the waiting list',
        'أولوية في قائمة الانتظار',
        'Priorité sur la liste d’attente',
        'Vorrang auf der Warteliste',
        'Priorità in lista d’attesa',
      ),
    ],
  },
];

export function tierFor(points: number): { tier: Tier; next: Tier | null } {
  const reached = TIERS.filter((tier) => points >= tier.from);
  const tier = reached[reached.length - 1];
  return { tier, next: TIERS.find((x) => x.from > points) ?? null };
}

export type Reward = { id: string; name: L10n; points: number; category: CategoryId | 'all' };

/** Rewards are the studio's own extras: nail art from the menu, a lash tint, money off, a lash lift. */
export const REWARDS: Reward[] = [
  {
    id: 'r-chrome',
    name: t(
      'Gratis chrome of polka dots',
      'Free chrome or polka dots',
      'كروم أو نقاط مجانًا',
      'Chrome ou pois offerts',
      'Gratis Chrome oder Polka Dots',
      'Chrome o pois gratis',
    ),
    points: 100,
    category: 'nails',
  },
  {
    id: 'r-sparkle',
    name: t(
      'Gratis Blanche’s Sparkle set',
      'Free Blanche’s Sparkle set',
      'مجموعة Blanche’s Sparkle مجانًا',
      'Blanche’s Sparkle set offert',
      'Gratis Blanche’s Sparkle Set',
      'Blanche’s Sparkle set gratis',
    ),
    points: 200,
    category: 'nails',
  },
  {
    id: 'r-tint',
    name: t('Gratis wimpers verven', 'Free lash tint', 'صبغ رموش مجاني', 'Teinture des cils offerte', 'Gratis Wimpern färben', 'Tinta ciglia gratis'),
    points: 250,
    category: 'lashes',
  },
  {
    id: 'r-ten',
    name: t(
      '€ 10 korting op je volgende afspraak',
      '€10 off your next appointment',
      'خصم 10 يورو على موعدك القادم',
      '10 € de remise sur ton prochain rendez-vous',
      '10 € Rabatt auf deinen nächsten Termin',
      '10 € di sconto sul prossimo appuntamento',
    ),
    points: 300,
    category: 'all',
  },
  {
    id: 'r-lift',
    name: t(
      'Gratis Korean lash lift',
      'Free Korean lash lift',
      'رفع رموش كوري مجاني',
      'Rehaussement coréen offert',
      'Gratis Korean Lash Lift',
      'Laminazione coreana gratis',
    ),
    points: 650,
    category: 'lashes',
  },
];

export const rewardById = (id: string) => REWARDS.find((r) => r.id === id);

/** Ways to earn points besides paying for a treatment. */
export type EarnWay = { id: 'visit' | 'review' | 'friend' | 'post' | 'birthday'; points: number | null };
export const EARN: EarnWay[] = [
  { id: 'visit', points: null },
  { id: 'post', points: 50 },
  { id: 'review', points: 25 },
  { id: 'friend', points: 100 },
  { id: 'birthday', points: 75 },
];

export type Deal = {
  id: string;
  title: L10n;
  body: L10n;
  price: number;
  was: number;
  service: ServiceId;
  photo: BlanchePhoto;
  /** Which colour the card gets. */
  shade: 'cherry' | 'lilac' | 'honey';
  /** Small print: when it applies. */
  when: L10n;
};

export const DEALS: Deal[] = [
  {
    id: 'combo',
    title: t(
      'Brows + lashes combi',
      'Brows + lashes combo',
      'ثنائي الحواجب والرموش',
      'Duo sourcils + cils',
      'Brauen + Wimpern Kombi',
      'Combo sopracciglia + ciglia',
    ),
    body: t(
      'Brow lamination én Korean lash lift in één afspraak.',
      'Brow lamination and a Korean lash lift in one appointment.',
      'تثبيت الحواجب ورفع الرموش الكوري في موعد واحد.',
      'Brow lamination et rehaussement coréen en un rendez-vous.',
      'Brow Lamination und Korean Lash Lift in einem Termin.',
      'Laminazione sopracciglia e ciglia coreana in un solo appuntamento.',
    ),
    price: 99,
    was: 110,
    service: 'brow-lash-combo',
    photo: 'brows-serum',
    shade: 'lilac',
    when: t('Altijd', 'Always', 'دائمًا', 'Toujours', 'Immer', 'Sempre'),
  },
  {
    id: 'friend',
    title: t('Bring a friend', 'Bring a friend', 'أحضري صديقة', 'Viens avec une amie', 'Bring a friend', 'Porta un’amica'),
    body: t(
      'Samen BIAB laten zetten? Jullie krijgen allebei € 5 korting.',
      'Getting BIAB together? You both get € 5 off.',
      'BIAB معًا؟ تحصلان كلتاكما على خصم 5 يورو.',
      'Un BIAB à deux ? Vous avez chacune 5 € de remise.',
      'Zusammen BIAB machen? Ihr bekommt beide 5 € Rabatt.',
      'BIAB insieme? Avete entrambe 5 € di sconto.',
    ),
    price: 45,
    was: 50,
    service: 'biab-nude',
    photo: 'nails-peony',
    shade: 'cherry',
    when: t('Per persoon', 'Per person', 'للشخص الواحد', 'Par personne', 'Pro Person', 'A persona'),
  },
  {
    id: 'sparkle',
    title: t('Sparkle season', 'Sparkle season', 'موسم البريق', 'Saison sparkle', 'Sparkle Season', 'Sparkle season'),
    body: t(
      'BIAB + gelkleur met Blanche’s Sparkle set voor de prijs van een gewone set.',
      'BIAB + gel colour with Blanche’s Sparkle set for the price of a plain set.',
      'BIAB + لون جل مع مجموعة Sparkle بسعر المجموعة العادية.',
      'BIAB + couleur gel avec le Sparkle set au prix d’une pose simple.',
      'BIAB + Gel-Farbe mit Sparkle Set zum Preis eines normalen Sets.',
      'BIAB + colore gel con lo Sparkle set al prezzo di un set semplice.',
    ),
    price: 55,
    was: 70,
    service: 'biab-color',
    photo: 'nails-sparkle',
    shade: 'honey',
    when: t('Tot 31 december', 'Until 31 December', 'حتى 31 ديسمبر', 'Jusqu’au 31 décembre', 'Bis 31. Dezember', 'Fino al 31 dicembre'),
  },
];

export type Pack = { id: string; name: L10n; body: L10n; visits: number; price: number; was: number; service: ServiceId; shade: 'cherry' | 'lilac' | 'honey' };

/** Prepaid series: pay once, book each visit in the app. */
export const PACKS: Pack[] = [
  {
    id: 'biab-4',
    name: t('BIAB year pass', 'BIAB year pass', 'باقة BIAB السنوية', 'Pass BIAB', 'BIAB-Pass', 'Pass BIAB'),
    body: t(
      '4× BIAB Nude, € 15 voordeel. Elke keer zelf je moment kiezen.',
      '4× BIAB Nude, € 15 off. Pick each moment yourself.',
      '4 جلسات BIAB نود بتوفير 15 يورو، واختاري موعدك بنفسك.',
      '4× BIAB Nude, 15 € d’économie. Tu choisis chaque moment.',
      '4× BIAB Nude, 15 € gespart. Jeden Termin selbst wählen.',
      '4× BIAB Nude, 15 € di risparmio. Scegli tu ogni momento.',
    ),
    visits: 4,
    price: 185,
    was: 200,
    service: 'biab-nude',
    shade: 'cherry',
  },
  {
    id: 'lift-2',
    name: t('Lash lift duo', 'Lash lift duo', 'ثنائي رفع الرموش', 'Duo rehaussement', 'Lash-Lift-Duo', 'Duo laminazione'),
    body: t(
      '2× Korean lash lift: nu en over acht weken.',
      '2× Korean lash lift: now and in eight weeks.',
      'جلستا رفع رموش كوري: الآن وبعد ثمانية أسابيع.',
      '2× rehaussement coréen : maintenant et dans huit semaines.',
      '2× Korean Lash Lift: jetzt und in acht Wochen.',
      '2× laminazione coreana: ora e tra otto settimane.',
    ),
    visits: 2,
    price: 110,
    was: 120,
    service: 'lash-lift',
    shade: 'lilac',
  },
  {
    id: 'brow-3',
    name: t('Brow pass', 'Brow pass', 'باقة الحواجب', 'Pass sourcils', 'Brauen-Pass', 'Pass sopracciglia'),
    body: t(
      '3× brow lamination, verspreid over het jaar.',
      '3× brow lamination, spread over the year.',
      '3 جلسات تثبيت حواجب على مدار السنة.',
      '3× brow lamination réparties sur l’année.',
      '3× Brow Lamination, übers Jahr verteilt.',
      '3× laminazione sopracciglia durante l’anno.',
    ),
    visits: 3,
    price: 135,
    was: 150,
    service: 'brow-lamination',
    shade: 'honey',
  },
];
