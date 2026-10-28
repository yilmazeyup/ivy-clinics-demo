import type { L10n } from '../i18n/locales';
import type { BlanchePhoto } from './photos';
import type { StudioLocationId } from './studio';

// Blanche Beauty's menu as published on blanchebeauty.nl/services and in its Salonized booking (October 2026): BIAB and
// nail art, a manicure, BIAB on toes, brow lamination and shaping, and the Korean lash lift. Names and prices are the
// studio's; durations are its booking lengths. The brows-and-lashes combination is a demo deal.

export type CategoryId = 'nails' | 'lashes' | 'brows';

export type ServiceId =
  | 'biab-nude'
  | 'biab-color'
  | 'manicure'
  | 'biab-removal'
  | 'toes-nude'
  | 'toes-french'
  | 'lash-lift'
  | 'lash-lift-tint'
  | 'lash-tint'
  | 'brow-lamination'
  | 'brow-shape'
  | 'brow-lash-combo';

/** Nail art from the menu, booked on top of a BIAB treatment; and taking off an old set first. */
export type AddOnId = 'polka' | 'chrome' | 'stripes' | 'french' | 'flowers' | 'mixed' | 'sparkle' | 'removal';

export type Service = {
  id: ServiceId;
  category: CategoryId;
  name: L10n;
  /** One line on the menu. */
  short: L10n;
  minutes: number;
  /** In euros. */
  price: number;
  photo: BlanchePhoto;
  popular?: boolean;
  /** New on the menu, like the Korean lash lift. */
  fresh?: boolean;
  /** A set that grows out: which service tops it up, and after how many days. */
  refill?: { service: ServiceId; days: number };
  /** How long the result lasts. */
  lasts: L10n;
  addOns?: AddOnId[];
  /** Where it can be booked; Nijmegen when left out. */
  at?: StudioLocationId[];
  /** Hidden from the menu, e.g. a deal that combines two treatments. */
  menu?: boolean;
};

export type AddOn = { id: AddOnId; name: L10n; price: number; minutes: number; from?: boolean };

export type Category = { id: CategoryId; name: L10n; tagline: L10n; photo: BlanchePhoto };

const t = (nl: string, en: string, ar: string, fr: string, de: string, it: string): L10n => ({ nl, en, ar, fr, de, it });
const same = (text: string): L10n => ({ nl: text, en: text, ar: text, fr: text, de: text, it: text });

export const CATEGORIES: Category[] = [
  {
    id: 'nails',
    name: t('Nagels', 'Nails', 'الأظافر', 'Ongles', 'Nägel', 'Unghie'),
    tagline: t(
      'BIAB, nail art & manicure',
      'BIAB, nail art & manicure',
      'BIAB ورسم الأظافر والمانيكير',
      'BIAB, nail art & manucure',
      'BIAB, Nail Art & Maniküre',
      'BIAB, nail art & manicure',
    ),
    photo: 'nails-red',
  },
  {
    id: 'lashes',
    name: t('Wimpers', 'Lashes', 'الرموش', 'Cils', 'Wimpern', 'Ciglia'),
    tagline: t(
      'Korean lash lift & verven',
      'Korean lash lift & tint',
      'رفع الرموش الكوري والصبغ',
      'Rehaussement coréen & teinture',
      'Korean Lash Lift & Färben',
      'Laminazione coreana & tinta',
    ),
    photo: 'lashes-lift',
  },
  {
    id: 'brows',
    name: t('Wenkbrauwen', 'Brows', 'الحواجب', 'Sourcils', 'Augenbrauen', 'Sopracciglia'),
    tagline: t(
      'Lamination & shaping',
      'Lamination & shaping',
      'التثبيت والتشكيل',
      'Lamination & restructuration',
      'Lamination & Formen',
      'Laminazione & modellatura',
    ),
    photo: 'brows-lami',
  },
];

export const ADD_ONS: AddOn[] = [
  { id: 'polka', name: same('Polka dots'), price: 5, minutes: 10 },
  { id: 'chrome', name: same('Chrome'), price: 5, minutes: 10 },
  {
    id: 'stripes',
    name: t('Stripes & swirls', 'Stripes & swirls', 'خطوط ودوامات', 'Rayures & swirls', 'Stripes & Swirls', 'Righe & swirl'),
    price: 7,
    minutes: 10,
  },
  { id: 'french', name: same('French tip'), price: 10, minutes: 10 },
  { id: 'flowers', name: t('Bloemetjes', 'Flowers', 'زهور', 'Fleurs', 'Blümchen', 'Fiori'), price: 10, minutes: 15 },
  { id: 'mixed', name: same('Mixed art'), price: 10, minutes: 25, from: true },
  { id: 'sparkle', name: same('Blanche’s Sparkle set'), price: 15, minutes: 20 },
  {
    id: 'removal',
    name: t('Oude BIAB eraf', 'Remove old BIAB', 'إزالة BIAB القديم', 'Retrait de l’ancien BIAB', 'Altes BIAB entfernen', 'Rimozione vecchio BIAB'),
    price: 10,
    minutes: 15,
  },
];

const ART: AddOnId[] = ['polka', 'chrome', 'stripes', 'french', 'flowers', 'mixed', 'sparkle', 'removal'];
const W3 = t('3 à 4 weken', '3 to 4 weeks', 'من 3 إلى 4 أسابيع', '3 à 4 semaines', '3 bis 4 Wochen', 'da 3 a 4 settimane');
const W6 = t('4 à 6 weken', '4 to 6 weeks', 'من 4 إلى 6 أسابيع', '4 à 6 semaines', '4 bis 6 Wochen', 'da 4 a 6 settimane');
const W8 = t('6 à 8 weken', '6 to 8 weeks', 'من 6 إلى 8 أسابيع', '6 à 8 semaines', '6 bis 8 Wochen', 'da 6 a 8 settimane');

export const SERVICES: Service[] = [
  {
    id: 'biab-nude',
    category: 'nails',
    name: same('BIAB Nude'),
    short: t(
      'Russische manicure en een sterke BIAB-laag in een zachte nude: verzorgd, natuurlijk en weken mooi.',
      'A Russian manicure and a strong BIAB layer in a soft nude: groomed, natural and pretty for weeks.',
      'مانيكير روسي وطبقة BIAB قوية بلون نود ناعم: أنيقة وطبيعية وجميلة لأسابيع.',
      'Une manucure russe et une couche de BIAB solide dans un nude doux : soigné, naturel et beau pendant des semaines.',
      'Russische Maniküre und eine starke BIAB-Schicht in zartem Nude: gepflegt, natürlich und wochenlang schön.',
      'Manicure russa e uno strato di BIAB resistente in un nude delicato: curate, naturali e belle per settimane.',
    ),
    minutes: 60,
    price: 50,
    photo: 'nails-nude',
    popular: true,
    refill: { service: 'biab-nude', days: 21 },
    lasts: W3,
    addOns: ART,
  },
  {
    id: 'biab-color',
    category: 'nails',
    name: t('BIAB + gelkleur', 'BIAB + gel colour', 'BIAB + لون جل', 'BIAB + couleur gel', 'BIAB + Gel-Farbe', 'BIAB + colore gel'),
    short: t(
      'Russische manicure, BIAB en een gellak in de kleur van je keuze. Van True Red tot Peony.',
      'Russian manicure, BIAB and a gel polish in the colour of your choice. From True Red to Peony.',
      'مانيكير روسي وBIAB وطلاء جل باللون الذي تختارينه، من True Red إلى Peony.',
      'Manucure russe, BIAB et un vernis gel dans la couleur de ton choix. De True Red à Peony.',
      'Russische Maniküre, BIAB und Gel-Lack in deiner Wunschfarbe. Von True Red bis Peony.',
      'Manicure russa, BIAB e un semipermanente del colore che vuoi. Da True Red a Peony.',
    ),
    minutes: 75,
    price: 55,
    photo: 'nails-red',
    popular: true,
    refill: { service: 'biab-color', days: 21 },
    lasts: W3,
    addOns: ART,
  },
  {
    id: 'manicure',
    category: 'nails',
    name: t('Manicure', 'Manicure', 'مانيكير', 'Manucure', 'Maniküre', 'Manicure'),
    short: t(
      'Nagelriemen netjes verwijderd en je nagels gevijld of geknipt. Puur verzorgd, zonder kleur.',
      'Cuticles neatly removed and your nails filed or clipped. Simply groomed, no colour.',
      'إزالة الجلد المحيط بعناية وبرد الأظافر أو قصها. عناية خالصة دون لون.',
      'Cuticules retirées avec soin et ongles limés ou coupés. Soigné, sans couleur.',
      'Nagelhaut sauber entfernt und Nägel gefeilt oder geschnitten. Einfach gepflegt, ohne Farbe.',
      'Cuticole rimosse con cura e unghie limate o tagliate. Curate, senza colore.',
    ),
    minutes: 30,
    price: 25,
    photo: 'nails-pink',
    lasts: t('1 à 2 weken', '1 to 2 weeks', 'من أسبوع إلى أسبوعين', '1 à 2 semaines', '1 bis 2 Wochen', 'da 1 a 2 settimane'),
  },
  {
    id: 'biab-removal',
    category: 'nails',
    name: t('BIAB verwijderen', 'BIAB removal', 'إزالة BIAB', 'Retrait du BIAB', 'BIAB entfernen', 'Rimozione BIAB'),
    short: t(
      'Je BIAB netjes eraf, zonder je eigen nagel te beschadigen.',
      'Your BIAB taken off neatly, without harming your own nail.',
      'إزالة BIAB بعناية دون إيذاء ظفرك الطبيعي.',
      'Ton BIAB retiré proprement, sans abîmer ton ongle.',
      'Dein BIAB sauber entfernt, ohne den eigenen Nagel zu schädigen.',
      'Il tuo BIAB rimosso con cura, senza rovinare l’unghia.',
    ),
    minutes: 15,
    price: 10,
    photo: 'nails-work',
    lasts: same('—'),
  },
  {
    id: 'toes-nude',
    category: 'nails',
    name: t('BIAB teennagels · nude', 'BIAB toenails · nude', 'BIAB لأظافر القدمين · نود', 'BIAB orteils · nude', 'BIAB Fußnägel · Nude', 'BIAB piedi · nude'),
    short: t(
      'BIAB op je teennagels voor mooie, sterke nagels in sandalenweer. Cosmetisch, zonder eelt- of nagelzorg.',
      'BIAB on your toenails for pretty, strong nails in sandal season. Cosmetic only, no callus or nail care.',
      'BIAB لأظافر القدمين لأظافر جميلة وقوية في موسم الصنادل. تجميلي فقط دون علاج الجلد القاسي.',
      'Du BIAB sur tes orteils pour des ongles beaux et solides en saison de sandales. Esthétique uniquement, sans soin des callosités.',
      'BIAB auf den Fußnägeln für schöne, starke Nägel in der Sandalenzeit. Rein kosmetisch, ohne Hornhaut- oder Nagelpflege.',
      'BIAB sulle unghie dei piedi per unghie belle e forti nella stagione dei sandali. Solo estetico, senza cura dei calli.',
    ),
    minutes: 70,
    price: 50,
    photo: 'nails-toes',
    lasts: W6,
  },
  {
    id: 'toes-french',
    category: 'nails',
    name: t(
      'BIAB teennagels + French',
      'BIAB toenails + French',
      'BIAB لأظافر القدمين + فرنسي',
      'BIAB orteils + french',
      'BIAB Fußnägel + French',
      'BIAB piedi + french',
    ),
    short: t(
      'Je teennagels in BIAB met een strakke French tip. Cosmetisch, zonder eelt- of nagelzorg.',
      'Your toenails in BIAB with a crisp French tip. Cosmetic only, no callus or nail care.',
      'أظافر القدمين بـ BIAB مع أطراف فرنسية أنيقة. تجميلي فقط.',
      'Tes orteils en BIAB avec une french impeccable. Esthétique uniquement.',
      'Deine Fußnägel in BIAB mit klarem French Tip. Rein kosmetisch.',
      'Le unghie dei piedi in BIAB con una french precisa. Solo estetico.',
    ),
    minutes: 80,
    price: 55,
    photo: 'nails-toes',
    lasts: W6,
  },
  {
    id: 'lash-lift',
    category: 'lashes',
    name: same('Korean lash lift'),
    short: t(
      'Nieuw bij Blanche: je eigen wimpers zacht gelift vanaf de wortel, voor een open, wakkere blik zonder mascara.',
      'New at Blanche: your own lashes gently lifted from the root, for an open, wide-awake look without mascara.',
      'جديد في Blanche: رفع لطيف لرموشك الطبيعية من الجذور لنظرة مفتوحة ومشرقة دون ماسكارا.',
      'Nouveau chez Blanche : tes cils rehaussés en douceur dès la racine, pour un regard ouvert sans mascara.',
      'Neu bei Blanche: deine eigenen Wimpern sanft ab dem Ansatz geliftet, für einen offenen, wachen Blick ohne Mascara.',
      'Novità da Blanche: le tue ciglia sollevate con delicatezza dalla radice, per uno sguardo aperto senza mascara.',
    ),
    minutes: 50,
    price: 60,
    photo: 'lashes-lift',
    popular: true,
    fresh: true,
    lasts: W8,
    at: ['nijmegen', 'uden'],
  },
  {
    id: 'lash-lift-tint',
    category: 'lashes',
    name: t(
      'Korean lash lift + verven',
      'Korean lash lift + tint',
      'رفع الرموش الكوري + صبغ',
      'Rehaussement coréen + teinture',
      'Korean Lash Lift + Färben',
      'Laminazione coreana + tinta',
    ),
    short: t(
      'De Korean lash lift met een tint erbij: donkerder tot in de puntjes, dus nog meer effect.',
      'The Korean lash lift with a tint: darker right to the tips, so even more effect.',
      'رفع الرموش الكوري مع الصبغ: أغمق حتى الأطراف لتأثير أكبر.',
      'Le rehaussement coréen avec teinture : plus foncés jusqu’aux pointes, encore plus d’effet.',
      'Der Korean Lash Lift mit Färben: dunkler bis in die Spitzen, noch mehr Wirkung.',
      'La laminazione coreana con tinta: più scure fino alle punte, ancora più effetto.',
    ),
    minutes: 60,
    price: 65,
    photo: 'lashes-up',
    lasts: W8,
    at: ['nijmegen', 'uden'],
  },
  {
    id: 'lash-tint',
    category: 'lashes',
    name: t('Wimpers verven', 'Lash tint', 'صبغ الرموش', 'Teinture des cils', 'Wimpern färben', 'Tinta ciglia'),
    short: t(
      'Donkerdere wimpers tot aan de puntjes, in een kwartier.',
      'Darker lashes right to the tips, in fifteen minutes.',
      'رموش أغمق حتى الأطراف في ربع ساعة.',
      'Des cils plus foncés jusqu’aux pointes, en un quart d’heure.',
      'Dunklere Wimpern bis in die Spitzen, in einer Viertelstunde.',
      'Ciglia più scure fino alle punte, in un quarto d’ora.',
    ),
    minutes: 15,
    price: 17.5,
    photo: 'lashes-up',
    lasts: W6,
  },
  {
    id: 'brow-lamination',
    category: 'brows',
    name: same('Brow lamination'),
    short: t(
      'Je wenkbrauwhaartjes in model gezet en gefixeerd, voor vollere, opgetilde brows die de hele dag blijven zitten.',
      'Your brow hairs styled and set, for fuller, lifted brows that stay in place all day.',
      'تصفيف شعر الحواجب وتثبيته لحواجب أكثف ومرفوعة تبقى طوال اليوم.',
      'Tes poils de sourcils disciplinés et fixés, pour des sourcils plus fournis et rehaussés toute la journée.',
      'Deine Brauenhärchen in Form gebracht und fixiert, für vollere, geliftete Brauen, die den ganzen Tag halten.',
      'I peli delle sopracciglia modellati e fissati, per sopracciglia più piene e sollevate tutto il giorno.',
    ),
    minutes: 55,
    price: 50,
    photo: 'brows-lami',
    popular: true,
    lasts: W8,
  },
  {
    id: 'brow-shape',
    category: 'brows',
    name: same('Brow shaping'),
    short: t(
      'Epileren en bijknippen in de vorm die bij jouw gezicht past.',
      'Tweezing and trimming into the shape that suits your face.',
      'نتف وقص بالشكل الذي يناسب وجهك.',
      'Pince et taille pour la forme qui va à ton visage.',
      'Zupfen und Trimmen in die Form, die zu deinem Gesicht passt.',
      'Pinzetta e taglio nella forma giusta per il tuo viso.',
    ),
    minutes: 20,
    price: 20,
    photo: 'brows-map',
    lasts: W3,
  },
  {
    id: 'brow-lash-combo',
    category: 'brows',
    name: t(
      'Brow lamination + Korean lash lift',
      'Brow lamination + Korean lash lift',
      'تثبيت الحواجب + رفع الرموش الكوري',
      'Brow lamination + rehaussement coréen',
      'Brow Lamination + Korean Lash Lift',
      'Laminazione sopracciglia + ciglia coreana',
    ),
    short: t(
      'Brows en lashes in één afspraak: wakker worden met een fresh face.',
      'Brows and lashes in one appointment: wake up with a fresh face.',
      'الحواجب والرموش في موعد واحد: استيقظي بوجه منتعش.',
      'Sourcils et cils en un rendez-vous : un visage frais au réveil.',
      'Brauen und Wimpern in einem Termin: mit Fresh Face aufwachen.',
      'Sopracciglia e ciglia in un solo appuntamento: risvegliati con un viso fresco.',
    ),
    minutes: 105,
    price: 110,
    photo: 'brows-serum',
    lasts: W8,
    menu: false,
  },
];

export function serviceById(id: ServiceId): Service {
  return SERVICES.find((s) => s.id === id) ?? SERVICES[0];
}

export const isServiceId = (id: string): id is ServiceId => SERVICES.some((s) => s.id === id);

export function servicesIn(category: CategoryId): Service[] {
  return SERVICES.filter((s) => s.category === category && s.menu !== false);
}

export function addOnById(id: AddOnId): AddOn {
  return ADD_ONS.find((a) => a.id === id) ?? ADD_ONS[0];
}

export function categoryById(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

/** Where a service can be booked. */
export const placesFor = (service: Service): StudioLocationId[] => service.at ?? ['nijmegen'];

/** The lowest price on the menu for a craft, for "vanaf" stickers. */
export const fromPrice = (category: CategoryId) =>
  Math.min(
    ...servicesIn(category)
      .filter((s) => s.price >= 15)
      .map((s) => s.price),
  );
