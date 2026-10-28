import type { L10n } from '../i18n/locales';
import type { CategoryId } from './catalog';
import type { BlanchePhoto } from './photos';

// The studio shop: aftercare for nails, lashes and brows, and gift cards. The studio's booking system has gift cards set
// up (€ 10 to € 150); the aftercare products, prices and shipping are demo values.

export type ShopCategoryId = 'nails' | 'lashes' | 'brows' | 'gift';

export type BlancheProduct = {
  id: string;
  kind: 'product' | 'giftcard';
  name: L10n;
  category: ShopCategoryId;
  price: number;
  description: L10n;
  photo: BlanchePhoto;
  /** Crafts after which the stylist would point to it. */
  after?: CategoryId[];
  bestseller?: boolean;
  soldOut?: boolean;
};

export const SHOP = { shippingFee: 3.95, freeShippingFrom: 35, deliveryDays: 2 };

const t = (nl: string, en: string, ar: string, fr: string, de: string, it: string): L10n => ({ nl, en, ar, fr, de, it });
const gift = (amount: number): L10n =>
  t(
    `Cadeaukaart € ${amount}`,
    `Gift card €${amount}`,
    `بطاقة هدية ${amount} €`,
    `Carte cadeau ${amount} €`,
    `Geschenkkarte ${amount} €`,
    `Carta regalo ${amount} €`,
  );

export const PRODUCTS: BlancheProduct[] = [
  {
    id: 'cuticle-oil',
    kind: 'product',
    name: t('Nagelriemolie', 'Cuticle oil', 'زيت الجلد المحيط بالظفر', 'Huile pour cuticules', 'Nagelhautöl', 'Olio per cuticole'),
    category: 'nails',
    price: 12.5,
    description: t(
      'Elke avond een penseelstreek: soepele nagelriemen en een BIAB die langer mooi blijft.',
      'One stroke of the brush every evening: supple cuticles and a BIAB that stays pretty for longer.',
      'لمسة فرشاة كل مساء: جلد ناعم حول الأظافر وBIAB يبقى جميلًا أطول.',
      'Un coup de pinceau chaque soir : des cuticules souples et un BIAB beau plus longtemps.',
      'Jeden Abend ein Pinselstrich: geschmeidige Nagelhaut und ein BIAB, das länger schön bleibt.',
      'Una pennellata ogni sera: cuticole morbide e un BIAB bello più a lungo.',
    ),
    photo: 'product-serum',
    after: ['nails'],
    bestseller: true,
  },
  {
    id: 'hand-cream',
    kind: 'product',
    name: t('Rijke handcrème', 'Rich hand cream', 'كريم يدين غني', 'Crème mains riche', 'Reichhaltige Handcreme', 'Crema mani ricca'),
    category: 'nails',
    price: 16,
    description: t(
      'Trekt snel in en laat geen vettig laagje achter. Zachte handen bij je nieuwe set.',
      'Absorbs quickly and leaves no greasy film. Soft hands to go with your new set.',
      'يمتص بسرعة دون ترك طبقة دهنية. يدان ناعمتان مع مجموعتك الجديدة.',
      'Pénètre vite sans film gras. Des mains douces avec ta nouvelle pose.',
      'Zieht schnell ein, ohne Fettfilm. Weiche Hände zum neuen Set.',
      'Si assorbe in fretta senza ungere. Mani morbide con il tuo nuovo set.',
    ),
    photo: 'product-cream',
    after: ['nails'],
  },
  {
    id: 'lash-serum',
    kind: 'product',
    name: t(
      'Lash & brow serum',
      'Lash & brow serum',
      'سيروم الرموش والحواجب',
      'Sérum cils & sourcils',
      'Wimpern- & Brauenserum',
      'Siero ciglia & sopracciglia',
    ),
    category: 'lashes',
    price: 29,
    description: t(
      'Voedt je haartjes na een lash lift of brow lamination. Eén streep per avond.',
      'Nourishes your hairs after a lash lift or brow lamination. One stroke each evening.',
      'يغذي الشعر بعد رفع الرموش أو تثبيت الحواجب. خط واحد كل مساء.',
      'Nourrit tes poils après un rehaussement ou une brow lamination. Un trait chaque soir.',
      'Pflegt deine Härchen nach Lash Lift oder Brow Lamination. Jeden Abend ein Strich.',
      'Nutre i peli dopo una laminazione di ciglia o sopracciglia. Una passata ogni sera.',
    ),
    photo: 'brows-serum',
    after: ['lashes', 'brows'],
    bestseller: true,
  },
  {
    id: 'brow-gel',
    kind: 'product',
    name: t('Brow fixing gel', 'Brow fixing gel', 'جل تثبيت الحواجب', 'Gel fixateur sourcils', 'Brauen-Fixiergel', 'Gel fissante sopracciglia'),
    category: 'brows',
    price: 17.5,
    description: t(
      'Transparante gel die je gelamineerde brows de hele dag in model houdt.',
      'A clear gel that keeps your laminated brows in place all day.',
      'جل شفاف يثبت الحواجب طوال اليوم.',
      'Un gel transparent qui garde tes sourcils laminés en place toute la journée.',
      'Transparentes Gel, das laminierte Brauen den ganzen Tag in Form hält.',
      'Un gel trasparente che tiene in piega le sopracciglia laminate tutto il giorno.',
    ),
    photo: 'brows-lami',
    after: ['brows'],
  },
  ...[25, 50, 75, 100].map((amount): BlancheProduct => ({
    id: `gift-${amount}`,
    kind: 'giftcard',
    name: gift(amount),
    category: 'gift',
    price: amount,
    description: t(
      'Digitaal in je mail, te besteden aan elke behandeling in de studio. Een jaar geldig.',
      'Sent by e-mail, to spend on any treatment at the studio. Valid for a year.',
      'تصلك بالبريد الإلكتروني وتُستخدم لأي خدمة في الاستوديو. صالحة لمدة عام.',
      'Envoyée par e-mail, valable sur tous les soins du studio pendant un an.',
      'Per Mail, für jede Behandlung im Studio. Ein Jahr gültig.',
      'Via e-mail, da usare per ogni trattamento in studio. Valida un anno.',
    ),
    photo: 'polish-wall',
    bestseller: amount === 50,
  })),
];

export const SHOP_CATEGORIES: ShopCategoryId[] = ['nails', 'lashes', 'brows', 'gift'];

export function productById(id: string): BlancheProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
