import type { L10n } from '../i18n/locales';
import type { AddOnId, ServiceId } from './catalog';
import type { BlanchePhoto } from './photos';
import type { StylistId } from './team';

const t = (nl: string, en: string, ar: string, fr: string, de: string, it: string): L10n => ({ nl, en, ar, fr, de, it });
const same = (text: string): L10n => ({ nl: text, en: text, ar: text, fr: text, de: text, it: text });

/**
 * A finished set, as in the inspo deck and the trending row: book it and the stylist knows the look. True Red, Peony,
 * Laguna and the Sparkle set are the studio's own named sets from its Instagram; the others are stock inspiration.
 */
export type Look = {
  id: string;
  name: string;
  photo: BlanchePhoto;
  service: ServiceId;
  addOns: AddOnId[];
  /** Gel colour from the colour wall (POLISH). */
  shade: string;
  by: StylistId;
  saves: number;
  /** One of the studio's own sets. */
  own?: boolean;
};

export const LOOKS: Look[] = [
  { id: 'look-red', name: 'True Red', photo: 'nails-red', service: 'biab-color', addOns: [], shade: 'truered', by: 'mila', saves: 1240, own: true },
  { id: 'look-peony', name: 'Peony', photo: 'nails-peony', service: 'biab-color', addOns: [], shade: 'peony', by: 'mila', saves: 1875, own: true },
  {
    id: 'look-sparkle',
    name: 'Blanche’s Sparkle',
    photo: 'nails-sparkle',
    service: 'biab-nude',
    addOns: ['sparkle'],
    shade: 'ballet',
    by: 'zoe',
    saves: 2310,
    own: true,
  },
  { id: 'look-laguna', name: 'Laguna', photo: 'nails-nude', service: 'biab-nude', addOns: [], shade: 'milk', by: 'mila', saves: 1530, own: true },
  { id: 'look-chrome', name: 'Golden Hour', photo: 'nails-chrome', service: 'biab-color', addOns: ['chrome'], shade: 'latte', by: 'zoe', saves: 1105 },
  { id: 'look-daisy', name: 'Daisy French', photo: 'nails-french', service: 'biab-nude', addOns: ['french'], shade: 'milk', by: 'zoe', saves: 980 },
  { id: 'look-hearts', name: 'Love Notes', photo: 'nails-art', service: 'biab-nude', addOns: ['mixed'], shade: 'ballet', by: 'zoe', saves: 860 },
  { id: 'look-blue', name: 'Blue Lagoon', photo: 'nails-blue', service: 'biab-color', addOns: ['french'], shade: 'cobalt', by: 'zoe', saves: 740 },
];

export const lookById = (id: string) => LOOKS.find((l) => l.id === id);

/** Stories on Home, like the studio's Instagram: what is new, a set of the week, a tip, the club. */
export type Story = {
  id: string;
  label: L10n;
  frames: { photo: BlanchePhoto; title: L10n; body: L10n }[];
  cta: { kind: 'service'; id: ServiceId } | { kind: 'look'; id: string } | { kind: 'club' };
};

export const STORIES: Story[] = [
  {
    id: 's-new',
    label: t('Nieuw', 'New', 'جديد', 'Nouveau', 'Neu', 'Novità'),
    frames: [
      {
        photo: 'lashes-lift',
        title: t(
          'Nieuw: Korean lash lift',
          'New: Korean lash lift',
          'جديد: رفع الرموش الكوري',
          'Nouveau : rehaussement coréen',
          'Neu: Korean Lash Lift',
          'Novità: laminazione coreana',
        ),
        body: t(
          'Zachter gelift vanaf de wortel, voor een natuurlijke krul die zes tot acht weken blijft.',
          'Lifted gently from the root, for a natural curl that lasts six to eight weeks.',
          'رفع لطيف من الجذور لانحناءة طبيعية تدوم من ستة إلى ثمانية أسابيع.',
          'Rehaussés en douceur dès la racine, pour une courbe naturelle qui tient six à huit semaines.',
          'Sanft ab dem Ansatz geliftet, für einen natürlichen Schwung, der sechs bis acht Wochen hält.',
          'Sollevate con delicatezza dalla radice, per una curva naturale che dura sei-otto settimane.',
        ),
      },
      {
        photo: 'lashes-up',
        title: t('Ook in Uden', 'Also in Uden', 'متوفر أيضًا في أودن', 'Aussi à Uden', 'Auch in Uden', 'Anche a Uden'),
        body: t(
          'Boek je lash lift in Nijmegen of bij Pure Clinics Uden.',
          'Book your lash lift in Nijmegen or at Pure Clinics Uden.',
          'احجزي رفع الرموش في نايميخن أو في Pure Clinics أودن.',
          'Réserve ton rehaussement à Nimègue ou chez Pure Clinics Uden.',
          'Buche deinen Lash Lift in Nijmegen oder bei Pure Clinics Uden.',
          'Prenota la laminazione a Nimega o da Pure Clinics Uden.',
        ),
      },
    ],
    cta: { kind: 'service', id: 'lash-lift' },
  },
  {
    id: 's-red',
    label: same('True Red'),
    frames: [
      {
        photo: 'nails-red',
        title: same('True Red 🍒'),
        body: t(
          'Het rood van het seizoen, op een sterke BIAB-basis. Door Mila.',
          'The red of the season, on a strong BIAB base. By Mila.',
          'أحمر الموسم على قاعدة BIAB قوية. من ميلا.',
          'Le rouge de la saison, sur une base BIAB solide. Par Mila.',
          'Das Rot der Saison auf starker BIAB-Basis. Von Mila.',
          'Il rosso di stagione, su una base BIAB resistente. Di Mila.',
        ),
      },
      {
        photo: 'nails-color',
        title: t('Glans voor weken', 'Shine for weeks', 'لمعان لأسابيع', 'De l’éclat pour des semaines', 'Glanz für Wochen', 'Brillantezza per settimane'),
        body: t(
          'Drie tot vier weken mooi, daarna plan je je volgende set in de app.',
          'Pretty for three to four weeks, then plan your next set in the app.',
          'جميلة من ثلاثة إلى أربعة أسابيع، ثم خططي لمجموعتك التالية في التطبيق.',
          'Belle trois à quatre semaines, puis tu planifies la suivante dans l’appli.',
          'Drei bis vier Wochen schön, dann planst du das nächste Set in der App.',
          'Belle per tre-quattro settimane, poi prenoti il prossimo set nell’app.',
        ),
      },
    ],
    cta: { kind: 'look', id: 'look-red' },
  },
  {
    id: 's-sparkle',
    label: same('Sparkle ✨'),
    frames: [
      {
        photo: 'nails-sparkle',
        title: same('Blanche’s Sparkle set'),
        body: t(
          'Onze signature nail art: zachte nude met een vleugje glinster. € 15 extra op je BIAB.',
          'Our signature nail art: a soft nude with a touch of sparkle. € 15 on top of your BIAB.',
          'رسم الأظافر المميز لدينا: نود ناعم مع لمسة بريق. 15 يورو إضافية على BIAB.',
          'Notre nail art signature : un nude doux avec une touche de paillettes. 15 € en plus de ton BIAB.',
          'Unsere Signature-Nail-Art: zartes Nude mit einem Hauch Glitzer. 15 € zusätzlich zum BIAB.',
          'La nostra nail art firma: nude delicato con un tocco di glitter. 15 € in più sul BIAB.',
        ),
      },
    ],
    cta: { kind: 'look', id: 'look-sparkle' },
  },
  {
    id: 's-brow',
    label: t('Brows', 'Brows', 'الحواجب', 'Sourcils', 'Brauen', 'Sopracciglia'),
    frames: [
      {
        photo: 'brows-map',
        title: t(
          'Eerst mappen, dan lamineren',
          'Map first, then laminate',
          'القياس أولًا ثم التثبيت',
          'D’abord le mapping, puis la lamination',
          'Erst mappen, dann laminieren',
          'Prima il mapping, poi la laminazione',
        ),
        body: t(
          'We meten je brows af op je gezicht, zodat de vorm echt bij jou past.',
          'We map your brows to your face, so the shape really suits you.',
          'نقيس الحواجب على ملامح وجهك ليناسبك الشكل حقًا.',
          'On dessine tes sourcils selon ton visage, pour une forme qui te ressemble.',
          'Wir vermessen deine Brauen am Gesicht, damit die Form wirklich passt.',
          'Mappiamo le sopracciglia sul tuo viso, perché la forma ti stia davvero bene.',
        ),
      },
      {
        photo: 'brows-lami',
        title: t(
          'Fluffy brows, zero effort',
          'Fluffy brows, zero effort',
          'حواجب منفوشة دون جهد',
          'Des sourcils fluffy sans effort',
          'Fluffy Brows, null Aufwand',
          'Sopracciglia fluffy, zero fatica',
        ),
        body: t(
          'Zes tot acht weken in model. Borstelen, klaar.',
          'In shape for six to eight weeks. Brush and go.',
          'مرتبة من ستة إلى ثمانية أسابيع. سرّحي وانطلقي.',
          'En forme six à huit semaines. Un coup de brosse et c’est parti.',
          'Sechs bis acht Wochen in Form. Bürsten, fertig.',
          'In forma per sei-otto settimane. Pettina e vai.',
        ),
      },
    ],
    cta: { kind: 'service', id: 'brow-lamination' },
  },
  {
    id: 's-club',
    label: t('Club', 'Club', 'النادي', 'Club', 'Club', 'Club'),
    frames: [
      {
        photo: 'polish-wall',
        title: t(
          'Spaar voor gratis nail art',
          'Save up for free nail art',
          'اجمعي النقاط لرسم أظافر مجاني',
          'Cumule pour du nail art offert',
          'Sammle für gratis Nail Art',
          'Accumula per una nail art gratis',
        ),
        body: t(
          'Elke euro is een punt. Tag @blanchebeauty.nl in je post en krijg er 50 bij.',
          'Every euro is a point. Tag @blanchebeauty.nl in your post and get 50 more.',
          'كل يورو نقطة. أشيري إلى ‎@blanchebeauty.nl في منشورك واحصلي على 50 نقطة إضافية.',
          'Chaque euro vaut un point. Tague @blanchebeauty.nl dans ton post pour 50 de plus.',
          'Jeder Euro ist ein Punkt. Markier @blanchebeauty.nl in deinem Post und bekomm 50 dazu.',
          'Ogni euro è un punto. Tagga @blanchebeauty.nl nel tuo post e ne ricevi altri 50.',
        ),
      },
    ],
    cta: { kind: 'club' },
  },
];
