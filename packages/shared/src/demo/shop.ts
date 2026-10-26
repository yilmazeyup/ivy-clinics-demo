import type { PhotoKey } from '../brands';
import type { L10n } from '../i18n/locales';
import type { TreatmentId } from './ivy';

// Product names, brands and prices follow the ivyclinics.nl webshop (October 2026); the descriptions are
// our own short summaries. The site lists no shipping costs, so SHIPPING_FEE is a demo value.

export type ShopCategory = 'face' | 'aftercare' | 'body' | 'kits';
export type ProductId =
  | 'pomegranate-cleanser'
  | 'blue-poppy-polish'
  | 'earth-cream'
  | 'eyelight-serum'
  | 'protocell-eye'
  | 'arugot-spf'
  | 'alhydran'
  | 'bapscarcare'
  | 'ayz-drops'
  | 'ginger-lime-scrub'
  | 'best-seller-edit';

/** A close-up from a texture photo: zoom factor and focus point, both axes from 0 to 1. */
export type Texture = { photo: PhotoKey; zoom: number; x: number; y: number };

export type Product = {
  id: ProductId;
  brand: string | null;
  name: L10n;
  category: ShopCategory;
  /** Price in euros, as in the clinic's webshop. */
  price: number;
  description: L10n;
  texture: Texture;
  soldOut?: boolean;
  /** Treatments after which a specialist would point to this product. */
  after?: TreatmentId[];
};

export const SHOP_CATEGORIES: ShopCategory[] = ['face', 'aftercare', 'body', 'kits'];
export const SHIPPING_FEE = 4.95;
/** Webshop orders are processed within five working days (general conditions on ivyclinics.nl). */
export const DELIVERY_DAYS = 5;

const same = (text: string): L10n => ({ nl: text, en: text, ar: text, fr: text, de: text, it: text });

export const PRODUCTS: Product[] = [
  {
    id: 'pomegranate-cleanser',
    brand: 'emerginC',
    name: same('Pomegranate Cleanser'),
    category: 'face',
    price: 49,
    description: {
      nl: 'Milde reiniger met granaatappel voor elke ochtend en avond.',
      en: 'A gentle pomegranate cleanser for every morning and evening.',
      ar: 'منظف لطيف بالرمان للاستخدام صباحًا ومساءً.',
      fr: 'Un nettoyant doux à la grenade, matin et soir.',
      de: 'Milder Reiniger mit Granatapfel für morgens und abends.',
      it: 'Detergente delicato al melograno, mattina e sera.',
    },
    texture: { photo: 'ivy-cream', zoom: 2.4, x: 0.42, y: 0.02 },
    after: ['hydrafacial', 'alumier'],
  },
  {
    id: 'blue-poppy-polish',
    brand: 'emerginC',
    name: same('Blue Poppy Enzyme Polish'),
    category: 'face',
    price: 55,
    description: {
      nl: 'Enzympeeling die de huid zacht en glad maakt.',
      en: 'An enzyme polish that leaves the skin soft and smooth.',
      ar: 'مقشر بالإنزيمات يترك البشرة ناعمة وملساء.',
      fr: 'Un exfoliant enzymatique pour une peau douce et lisse.',
      de: 'Enzympeeling für eine weiche, glatte Haut.',
      it: 'Esfoliante enzimatico per una pelle morbida e liscia.',
    },
    texture: { photo: 'ivy-cream', zoom: 2.2, x: 0.12, y: 0.42 },
  },
  {
    id: 'earth-cream',
    brand: 'emerginC',
    name: same('Earth Hydrating Phytelene Cream'),
    category: 'face',
    price: 93,
    description: {
      nl: 'Rijke, hydraterende crème voor dag en nacht.',
      en: 'A rich, hydrating cream for day and night.',
      ar: 'كريم غني ومرطب للنهار والليل.',
      fr: 'Une crème riche et hydratante, pour le jour et la nuit.',
      de: 'Reichhaltige, feuchtigkeitsspendende Creme für Tag und Nacht.',
      it: 'Crema ricca e idratante, per il giorno e la notte.',
    },
    texture: { photo: 'ivy-serum', zoom: 2.8, x: 0.7, y: 0.62 },
    after: ['hydrafacial', 'microneedling', 'profhilo'],
  },
  {
    id: 'eyelight-serum',
    brand: 'emerginC',
    name: same('Eyelight Serum'),
    category: 'face',
    price: 79,
    description: {
      nl: 'Licht oogserum voor een frisse, uitgeruste blik.',
      en: 'A light eye serum for a fresh, rested look.',
      ar: 'سيروم خفيف للعينين لإطلالة منتعشة.',
      fr: 'Un sérum léger pour un regard frais et reposé.',
      de: 'Leichtes Augenserum für einen frischen, wachen Blick.',
      it: 'Siero leggero per uno sguardo fresco e riposato.',
    },
    texture: { photo: 'ivy-serum', zoom: 2.8, x: 0.12, y: 0.66 },
    after: ['botox'],
  },
  {
    id: 'protocell-eye',
    brand: 'emerginC',
    name: same('Protocell Eye Cream'),
    category: 'face',
    price: 75,
    description: {
      nl: 'Verzorgende crème voor de tere huid rond de ogen.',
      en: 'A nourishing cream for the delicate skin around the eyes.',
      ar: 'كريم مغذٍّ للبشرة الرقيقة حول العينين.',
      fr: 'Une crème nourrissante pour le contour des yeux.',
      de: 'Pflegende Creme für die zarte Haut um die Augen.',
      it: 'Crema nutriente per la pelle delicata del contorno occhi.',
    },
    texture: { photo: 'ivy-cream', zoom: 2.2, x: 0.62, y: 0.98 },
    after: ['botox'],
  },
  {
    id: 'arugot-spf',
    brand: 'Arugot',
    name: same('Mineral Sunscreen Cream'),
    category: 'face',
    price: 39.5,
    description: {
      nl: 'Minerale zonnebrandcrème voor elke dag.',
      en: 'A mineral sunscreen for every day.',
      ar: 'واقٍ معدني من الشمس للاستخدام اليومي.',
      fr: 'Une crème solaire minérale pour tous les jours.',
      de: 'Mineralische Sonnencreme für jeden Tag.',
      it: 'Crema solare minerale per tutti i giorni.',
    },
    texture: { photo: 'ivy-cream', zoom: 2.6, x: 0.98, y: 0.7 },
    soldOut: true,
  },
  {
    id: 'alhydran',
    brand: 'Alhydran',
    name: same('Barrier Repair Care'),
    category: 'aftercare',
    price: 41.95,
    description: {
      nl: 'Verzorgt en beschermt de huidbarrière na een behandeling.',
      en: 'Cares for and protects the skin barrier after a treatment.',
      ar: 'يعتني بحاجز البشرة ويحميه بعد العلاج.',
      fr: 'Prend soin de la barrière cutanée et la protège après un soin.',
      de: 'Pflegt und schützt die Hautbarriere nach einer Behandlung.',
      it: 'Cura e protegge la barriera cutanea dopo un trattamento.',
    },
    texture: { photo: 'ivy-cream', zoom: 2.6, x: 0.08, y: 0.86 },
    after: ['microneedling', 'sparkpro', 'pigment', 'hydrafacial'],
  },
  {
    id: 'bapscarcare',
    brand: 'BAPSCARCARE',
    name: { nl: 'Siliconengel', en: 'Silicone gel', ar: 'جل السيليكون', fr: 'Gel de silicone', de: 'Silikongel', it: 'Gel al silicone' },
    category: 'aftercare',
    price: 48.55,
    description: {
      nl: 'Siliconengel voor de verzorging van littekens.',
      en: 'A silicone gel for scar care.',
      ar: 'جل سيليكون للعناية بالندبات.',
      fr: 'Un gel de silicone pour prendre soin des cicatrices.',
      de: 'Silikongel zur Pflege von Narben.',
      it: 'Gel al silicone per la cura delle cicatrici.',
    },
    texture: { photo: 'ivy-serum', zoom: 3.2, x: 0.44, y: 0.5 },
    after: ['microneedling', 'sparkpro'],
  },
  {
    id: 'ayz-drops',
    brand: 'AYZ',
    name: { nl: 'Protect oogdruppels', en: 'Protect eye drops', ar: 'قطرات العين Protect', fr: 'Gouttes oculaires Protect', de: 'Protect Augentropfen', it: 'Gocce oculari Protect' },
    category: 'aftercare',
    price: 13.95,
    description: {
      nl: 'Verzorgende oogdruppels, ook na een behandeling rond de ogen.',
      en: 'Soothing eye drops, also after a treatment around the eyes.',
      ar: 'قطرات مهدئة للعين، مناسبة أيضًا بعد العلاج حول العينين.',
      fr: 'Des gouttes apaisantes, aussi après un soin autour des yeux.',
      de: 'Pflegende Augentropfen, auch nach einer Behandlung rund um die Augen.',
      it: 'Gocce lenitive, anche dopo un trattamento intorno agli occhi.',
    },
    texture: { photo: 'ivy-serum', zoom: 3.4, x: 0.47, y: 0.42 },
  },
  {
    id: 'ginger-lime-scrub',
    brand: 'emerginC',
    name: same('Ginger-Lime Sugar Scrub'),
    category: 'body',
    price: 55,
    description: {
      nl: 'Suikerscrub met gember en limoen voor een zachte huid.',
      en: 'A sugar scrub with ginger and lime for soft skin.',
      ar: 'مقشر بالسكر مع الزنجبيل والليمون لبشرة ناعمة.',
      fr: 'Un gommage au sucre, gingembre et citron vert, pour une peau douce.',
      de: 'Zuckerpeeling mit Ingwer und Limette für weiche Haut.',
      it: 'Scrub allo zucchero con zenzero e lime per una pelle morbida.',
    },
    texture: { photo: 'ivy-cream', zoom: 1.8, x: 0.2, y: 0.5 },
  },
  {
    id: 'best-seller-edit',
    brand: null,
    name: same('Best Seller Edit'),
    category: 'kits',
    price: 212.5,
    description: {
      nl: 'De bestsellers uit onze webshop in één set.',
      en: 'The best sellers from our webshop in one set.',
      ar: 'المنتجات الأكثر مبيعًا في متجرنا ضمن مجموعة واحدة.',
      fr: 'Les meilleures ventes de notre boutique, réunies en un coffret.',
      de: 'Die Bestseller aus unserem Shop in einem Set.',
      it: 'I best seller del nostro shop riuniti in un set.',
    },
    texture: { photo: 'ivy-serum', zoom: 1, x: 0.5, y: 0.5 },
  },
];

export function productById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Products a specialist would suggest after a treatment, in catalogue order. */
export function productsAfter(treatment: TreatmentId): Product[] {
  return PRODUCTS.filter((p) => p.after?.includes(treatment) && !p.soldOut);
}
