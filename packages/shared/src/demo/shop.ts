import type { PhotoKey } from '../brands';
import type { L10n } from '../i18n/locales';
import type { TreatmentId } from './ivy';

// The brands Pure Clinics works with, as named on pureclinics.nl: ZO Skin Health, Lycogel, WiQo and XL Hair. Its own webshop
// is not in use yet, so this catalogue, its prices and SHIPPING_FEE are demo values. The descriptions are our own summaries.

export type ShopCategory = 'face' | 'aftercare' | 'body' | 'kits';
export type ProductId =
  | 'zo-cleanser'
  | 'zo-defense'
  | 'zo-spf'
  | 'lycogel-camouflage'
  | 'wiqo-cream'
  | 'xlhair-revitalix'
  | 'xlhair-scalpfit'
  | 'xlhair-spray'
  | 'camouflage-set'
  | 'laser-aftercare-set';

/** A close-up from a texture photo: zoom factor and focus point, both axes from 0 to 1. */
export type Texture = { photo: PhotoKey; zoom: number; x: number; y: number };

export type Product = {
  id: ProductId;
  brand: string | null;
  name: L10n;
  category: ShopCategory;
  /** Price in euros. */
  price: number;
  description: L10n;
  texture: Texture;
  soldOut?: boolean;
  /** Treatments after which a specialist would point to this product. */
  after?: TreatmentId[];
};

export const SHOP_CATEGORIES: ShopCategory[] = ['face', 'aftercare', 'body', 'kits'];
export const SHIPPING_FEE = 4.95;
/** Orders ship within five working days; members get free delivery from € 40 (pureclinics.nl/membership). */
export const DELIVERY_DAYS = 5;

const same = (text: string): L10n => ({ nl: text, en: text, ar: text, fr: text, de: text, it: text });
const t = (nl: string, en: string, ar: string, fr: string, de: string, it: string): L10n => ({ nl, en, ar, fr, de, it });

export const PRODUCTS: Product[] = [
  {
    id: 'zo-cleanser',
    brand: 'ZO Skin Health',
    name: same('Gentle Cleanser'),
    category: 'face',
    price: 42,
    description: t(
      'Milde reiniger die vuil en make-up verwijdert zonder je huid uit te drogen. De basis van elk ZO-protocol.',
      'A mild cleanser that removes dirt and make-up without drying your skin. The basis of every ZO protocol.',
      'منظف لطيف يزيل الأوساخ والمكياج دون أن يجفف بشرتك. أساس كل بروتوكول من ZO.',
      'Un nettoyant doux qui élimine impuretés et maquillage sans dessécher ta peau. La base de chaque protocole ZO.',
      'Milder Reiniger, der Schmutz und Make-up entfernt, ohne deine Haut auszutrocknen. Die Basis jedes ZO-Protokolls.',
      'Detergente delicato che rimuove impurità e trucco senza seccare la pelle. La base di ogni protocollo ZO.',
    ),
    texture: { photo: 'ivy-cream', zoom: 1.8, x: 0.25, y: 0.55 },
    after: ['acne', 'deepclean', 'peel', 'pigment'],
  },
  {
    id: 'zo-defense',
    brand: 'ZO Skin Health',
    name: same('Daily Power Defense'),
    category: 'face',
    price: 139,
    description: t(
      'Serum dat je huid elke dag beschermt en herstelt; vaak onderdeel van het thuisprotocol bij pigment en acne.',
      'A serum that protects and repairs your skin every day; often part of the home protocol for pigmentation and acne.',
      'سيروم يحمي بشرتك ويرممها كل يوم، وغالبًا ما يكون جزءًا من البروتوكول المنزلي للتصبغات وحب الشباب.',
      'Un sérum qui protège et répare ta peau chaque jour ; souvent au programme à la maison contre les taches et l’acné.',
      'Serum, das deine Haut täglich schützt und repariert; oft Teil des Heimprotokolls bei Pigmentflecken und Akne.',
      'Siero che protegge e ripara la pelle ogni giorno; spesso parte del protocollo a casa per macchie e acne.',
    ),
    texture: { photo: 'ivy-serum', zoom: 1.6, x: 0.35, y: 0.6 },
    after: ['pigment', 'acne', 'tca', 'skinpen'],
  },
  {
    id: 'zo-spf',
    brand: 'ZO Skin Health',
    name: same('Smart Tone SPF 50'),
    category: 'aftercare',
    price: 55,
    description: t(
      'Zonbescherming met een lichte tint, voor elke dag en zeker na laser, IPL en peelings.',
      'Sun protection with a light tint, for every day and especially after laser, IPL and peels.',
      'واقٍ من الشمس بلون خفيف، للاستخدام اليومي وخاصة بعد الليزر وIPL والتقشير.',
      'Une protection solaire légèrement teintée, pour tous les jours et surtout après un laser, l’IPL ou un peeling.',
      'Leicht getönter Sonnenschutz für jeden Tag, vor allem nach Laser, IPL und Peelings.',
      'Protezione solare leggermente colorata, per ogni giorno e soprattutto dopo laser, IPL e peeling.',
    ),
    texture: { photo: 'ivy-cream', zoom: 1.4, x: 0.5, y: 0.5 },
    after: ['laser', 'ipl', 'couperose', 'pigment', 'tca', 'peel', 'skinpen', 'sylfirm', 'tixel', 'tattoo'],
  },
  {
    id: 'lycogel-camouflage',
    brand: 'Lycogel',
    name: same('Breathable Camouflage'),
    category: 'aftercare',
    price: 59,
    description: t(
      'Ademende camouflagecrème met SPF 30 die roodheid en kleurverschil dekt, ook vlak na een behandeling.',
      'A breathable camouflage cream with SPF 30 that covers redness and uneven colour, even right after a treatment.',
      'كريم تمويه يسمح للبشرة بالتنفس مع SPF 30، يغطي الاحمرار واختلاف اللون حتى بعد العلاج مباشرة.',
      'Une crème de camouflage respirante SPF 30 qui couvre rougeurs et différences de teinte, même juste après un soin.',
      'Atmungsaktive Camouflage-Creme mit SPF 30, die Rötungen und Farbunterschiede abdeckt, auch direkt nach einer Behandlung.',
      'Crema coprente traspirante con SPF 30 che copre rossori e discromie, anche subito dopo un trattamento.',
    ),
    texture: { photo: 'ivy-cream', zoom: 2, x: 0.7, y: 0.4 },
    after: ['camouflage', 'couperose', 'ipl', 'eyes'],
  },
  {
    id: 'wiqo-cream',
    brand: 'WiQo',
    name: same('Nourishing and Moisturizing Face Cream'),
    category: 'aftercare',
    price: 39,
    description: t(
      'Voedende crème die je na een PRX-behandeling een week lang twee keer per dag gebruikt.',
      'A nourishing cream you use twice a day for a week after a PRX treatment.',
      'كريم مغذٍّ تستخدمه مرتين يوميًا لمدة أسبوع بعد علاج PRX.',
      'Une crème nourrissante à utiliser deux fois par jour pendant une semaine après un soin PRX.',
      'Pflegende Creme, die du nach einer PRX-Behandlung eine Woche lang zweimal täglich verwendest.',
      'Crema nutriente da usare due volte al giorno per una settimana dopo un trattamento PRX.',
    ),
    texture: { photo: 'ivy-cream', zoom: 1.2, x: 0.4, y: 0.6 },
    after: ['prx', 'facial'],
  },
  {
    id: 'xlhair-revitalix',
    brand: 'XL Hair',
    name: same('Revitalix Shampoo'),
    category: 'body',
    price: 34.95,
    description: t(
      'Milde shampoo die de hoofdhuid versterkt tijdens je XL Hair-traject.',
      'A gentle shampoo that strengthens the scalp during your XL Hair treatment.',
      'شامبو لطيف يقوي فروة الرأس خلال علاج XL Hair.',
      'Un shampooing doux qui renforce le cuir chevelu pendant ton traitement XL Hair.',
      'Milde Shampoo, das die Kopfhaut während deiner XL-Hair-Behandlung stärkt.',
      'Shampoo delicato che rinforza il cuoio capelluto durante il trattamento XL Hair.',
    ),
    texture: { photo: 'ivy-serum', zoom: 2.2, x: 0.6, y: 0.35 },
    after: ['xlhair'],
  },
  {
    id: 'xlhair-scalpfit',
    brand: 'XL Hair',
    name: same('Scalpfit Shampoo'),
    category: 'body',
    price: 32.95,
    description: t(
      'Voor een gezonde hoofdhuid, de basis voor sterker haar.',
      'For a healthy scalp, the basis for stronger hair.',
      'لفروة رأس صحية، أساس شعر أقوى.',
      'Pour un cuir chevelu sain, la base de cheveux plus forts.',
      'Für eine gesunde Kopfhaut, die Basis für kräftigeres Haar.',
      'Per un cuoio capelluto sano, la base di capelli più forti.',
    ),
    texture: { photo: 'ivy-serum', zoom: 1.8, x: 0.8, y: 0.6 },
    after: ['xlhair'],
  },
  {
    id: 'xlhair-spray',
    brand: 'XL Hair',
    name: same('Hairspray'),
    category: 'body',
    price: 49.95,
    description: t(
      'Verzorgende spray voor de hoofdhuid, dagelijks tussen de behandelingen door.',
      'A nourishing scalp spray for every day between treatments.',
      'بخاخ مغذٍّ لفروة الرأس يُستخدم يوميًا بين الجلسات.',
      'Un spray nourrissant pour le cuir chevelu, chaque jour entre les séances.',
      'Pflegendes Spray für die Kopfhaut, täglich zwischen den Behandlungen.',
      'Spray nutriente per il cuoio capelluto, ogni giorno tra un trattamento e l’altro.',
    ),
    texture: { photo: 'ivy-serum', zoom: 1.3, x: 0.5, y: 0.5 },
    soldOut: true,
    after: ['xlhair'],
  },
  {
    id: 'camouflage-set',
    brand: null,
    name: t('Camouflageset', 'Camouflage set', 'مجموعة التمويه', 'Coffret camouflage', 'Camouflage-Set', 'Set camouflage'),
    category: 'kits',
    price: 95,
    description: t(
      'De producten uit je camouflagetherapie, in jouw eigen kleur gemengd.',
      'The products from your camouflage therapy, mixed in your own shade.',
      'منتجات علاج التمويه، ممزوجة بلون بشرتك.',
      'Les produits de ta thérapie de camouflage, mélangés à ta teinte.',
      'Die Produkte aus deiner Camouflage-Therapie, in deinem Farbton gemischt.',
      'I prodotti della tua terapia camouflage, miscelati nella tua tonalità.',
    ),
    texture: { photo: 'ivy-cream', zoom: 1.1, x: 0.5, y: 0.45 },
  },
  {
    id: 'laser-aftercare-set',
    brand: null,
    name: t('Nazorgset laser', 'Laser aftercare set', 'مجموعة العناية بعد الليزر', 'Coffret après-laser', 'Laser-Nachsorge-Set', 'Set post-laser'),
    category: 'kits',
    price: 64.95,
    description: t(
      'Gentle Cleanser en Smart Tone SPF 50 van ZO Skin Health samen: alles voor de weken na je laserbehandeling.',
      'ZO Skin Health Gentle Cleanser and Smart Tone SPF 50 together: all you need for the weeks after your laser treatment.',
      'Gentle Cleanser وSmart Tone SPF 50 من ZO Skin Health معًا: كل ما تحتاجه في الأسابيع التي تلي الليزر.',
      'Le Gentle Cleanser et le Smart Tone SPF 50 de ZO Skin Health ensemble : tout pour les semaines après ton laser.',
      'Gentle Cleanser und Smart Tone SPF 50 von ZO Skin Health zusammen: alles für die Wochen nach deiner Laserbehandlung.',
      'Gentle Cleanser e Smart Tone SPF 50 di ZO Skin Health insieme: tutto per le settimane dopo il laser.',
    ),
    texture: { photo: 'ivy-serum', zoom: 1, x: 0.5, y: 0.5 },
    after: ['laser'],
  },
];

export function productById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Products a specialist would suggest after a treatment, in catalogue order. */
export function productsAfter(treatment: TreatmentId): Product[] {
  return PRODUCTS.filter((p) => p.after?.includes(treatment) && !p.soldOut);
}
