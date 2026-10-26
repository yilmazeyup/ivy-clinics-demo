import type { PhotoKey } from '../brands';
import { addDays, dateKey, startOfDay } from '../i18n/format';
import type { L10n } from '../i18n/locales';
import { atTime, hash } from './random';

// Treatments, starting prices, locations, phone numbers and opening hours follow pureclinics.nl (October 2026).
// Durations, specialists, availability and the Blanche Beauty Studio prices are demo data.

export type TreatmentCategory = 'consult' | 'removal' | 'conditions' | 'skin' | 'hair' | 'beauty';
export type TreatmentId =
  | 'consult'
  | 'laser'
  | 'epilation'
  | 'tattoo'
  | 'acne'
  | 'couperose'
  | 'pigment'
  | 'legveins'
  | 'eyes'
  | 'skinpen'
  | 'tixel'
  | 'sylfirm'
  | 'skinbooster'
  | 'exosomes'
  | 'pdrn'
  | 'tca'
  | 'deepclean'
  | 'xlhair'
  | 'camouflage'
  | 'ipl'
  | 'massage'
  | 'prx'
  | 'facial'
  | 'peel'
  | 'brows'
  | 'nails';
export type SpecialistId = 'sanne' | 'eva' | 'jade' | 'yara' | 'fien' | 'nina';
export type ConcernId = 'removal' | 'acne' | 'scars' | 'pigment' | 'redness' | 'aging' | 'eyes' | 'hairloss';
export type LocationId = 'nijmegen' | 'uden';

export type Treatment = {
  id: TreatmentId;
  category: TreatmentCategory;
  name: L10n;
  description: L10n;
  minutes: number;
  /** Starting price in euros, as published by the clinic. */
  priceFrom: number;
  /** Paid when booking; Pure Clinics asks none, so this stays 0 in the demo. */
  deposit: number;
  photo: PhotoKey;
  /** Health insurers may pay for part or all of it (pureclinics.nl/tarieven). */
  insurable?: boolean;
};

export type Specialist = {
  id: SpecialistId;
  name: string;
  role: 'therapist' | 'beauty';
  locationId: LocationId;
  categories: TreatmentCategory[];
  /** Working days, as Date#getDay() values. */
  days: number[];
};

export type Concern = { id: ConcernId; photo: PhotoKey; treatments: TreatmentId[] };

/** Opening hours per weekday (Date#getDay()), null when closed. */
type WeekHours = Record<number, { open: number; close: number } | null>;

export type ClinicLocation = { id: LocationId; city: string; address: string; phone: string; hours: WeekHours };

export type IvyAppointment = {
  id: string;
  treatmentId: TreatmentId;
  specialistId: SpecialistId;
  locationId: LocationId;
  start: Date;
};

export type FreeSlot = { start: Date; specialistId: SpecialistId };

export const PURE_CLINICS = {
  phone: '024 679 22 36',
  email: 'info@pureclinics.nl',
  /** "6811 gingen je voor" and ten years, as on pureclinics.nl. */
  clients: 6811,
  years: 10,
};

export const LOCATIONS: ClinicLocation[] = [
  {
    id: 'nijmegen',
    city: 'Nijmegen',
    address: 'Sint Annastraat 1, 6524 EA',
    phone: '024 679 22 36',
    hours: {
      0: null,
      1: { open: 10, close: 17 },
      2: { open: 9, close: 17 },
      3: { open: 9, close: 21 },
      4: { open: 9, close: 18 },
      5: { open: 9, close: 17 },
      6: { open: 9, close: 17 },
    },
  },
  {
    id: 'uden',
    city: 'Uden',
    address: 'Kastanjeweg 1, 5401 GW',
    phone: '0413 35 76 15',
    hours: {
      0: null,
      1: null,
      2: { open: 12, close: 21 },
      3: { open: 12, close: 21 },
      4: null,
      5: { open: 9, close: 17 },
      6: { open: 9, close: 15 },
    },
  },
];

const t = (nl: string, en: string, ar: string, fr: string, de: string, it: string): L10n => ({ nl, en, ar, fr, de, it });
const same = (text: string): L10n => ({ nl: text, en: text, ar: text, fr: text, de: text, it: text });

export const TREATMENTS: Treatment[] = [
  {
    id: 'consult',
    category: 'consult',
    name: t('Gratis intake', 'Free intake', 'جلسة تعارف مجانية', 'Consultation gratuite', 'Kostenloses Erstgespräch', 'Consulenza gratuita'),
    description: t(
      'Een huidtherapeut bekijkt je huid, bespreekt je wensen en geeft eerlijk advies over resultaat, risico’s en herstel.',
      'A skin therapist looks at your skin, talks through your wishes and gives honest advice on results, risks and recovery.',
      'تفحص أخصائية البشرة بشرتك وتناقش رغباتك وتقدم نصيحة صادقة حول النتيجة والمخاطر والتعافي.',
      'Une thérapeute de la peau examine ta peau, écoute tes envies et te conseille honnêtement sur le résultat, les risques et la récupération.',
      'Eine Hauttherapeutin schaut sich deine Haut an, bespricht deine Wünsche und berät ehrlich zu Ergebnis, Risiken und Erholung.',
      'Una terapista della pelle esamina la tua pelle, ascolta i tuoi desideri e ti consiglia onestamente su risultati, rischi e recupero.',
    ),
    minutes: 30,
    priceFrom: 0,
    deposit: 0,
    photo: 'pc-consult',
  },
  {
    id: 'laser',
    category: 'removal',
    name: t('Laser ontharen', 'Laser hair removal', 'إزالة الشعر بالليزر', 'Épilation laser', 'Laser-Haarentfernung', 'Epilazione laser'),
    description: t(
      'Definitief ontharen met de Soprano ICE Platinum. Per zone, met 5+1 gratis in een pakket.',
      'Permanent hair removal with the Soprano ICE Platinum. Per zone, with 5+1 free in a package.',
      'إزالة دائمة للشعر بجهاز Soprano ICE Platinum، حسب المنطقة، مع جلسة مجانية عند حجز خمس جلسات.',
      'Épilation définitive avec le Soprano ICE Platinum. Par zone, 5+1 offerte en forfait.',
      'Dauerhafte Haarentfernung mit dem Soprano ICE Platinum. Pro Zone, im Paket 5+1 gratis.',
      'Epilazione definitiva con Soprano ICE Platinum. Per zona, con 5+1 gratis nel pacchetto.',
    ),
    minutes: 30,
    priceFrom: 35,
    deposit: 0,
    photo: 'pc-laser',
  },
  {
    id: 'epilation',
    category: 'removal',
    name: t('Elektrische epilatie', 'Electrolysis', 'إزالة الشعر بالكهرباء', 'Épilation électrique', 'Elektrische Epilation', 'Elettrocoagulazione'),
    description: t(
      'Haartje voor haartje, ook voor licht en grijs haar dat de laser niet ziet.',
      'Hair by hair, also for light and grey hair that a laser cannot see.',
      'شعرة شعرة، حتى للشعر الفاتح والرمادي الذي لا يلتقطه الليزر.',
      'Poil par poil, même pour les poils clairs et gris que le laser ne voit pas.',
      'Haar für Haar, auch für helles und graues Haar, das der Laser nicht erkennt.',
      'Pelo per pelo, anche per i peli chiari e grigi che il laser non vede.',
    ),
    minutes: 30,
    priceFrom: 60,
    deposit: 0,
    photo: 'pc-epilation',
    insurable: true,
  },
  {
    id: 'tattoo',
    category: 'conditions',
    name: t('Tatoeage verwijderen', 'Tattoo removal', 'إزالة الوشم', 'Détatouage', 'Tattooentfernung', 'Rimozione tatuaggi'),
    description: t(
      'Een tatoeage of permanente make-up laten vervagen met de laser. Prijs naar grootte.',
      'Fade a tattoo or permanent make-up with the laser. Priced by size.',
      'تخفيف الوشم أو المكياج الدائم بالليزر، والسعر حسب الحجم.',
      'Estomper un tatouage ou un maquillage permanent au laser. Prix selon la taille.',
      'Ein Tattoo oder Permanent-Make-up mit dem Laser verblassen lassen. Preis nach Größe.',
      'Schiarire un tatuaggio o il trucco permanente con il laser. Prezzo in base alla misura.',
    ),
    minutes: 30,
    priceFrom: 49,
    deposit: 0,
    photo: 'pc-tattoo',
  },
  {
    id: 'acne',
    category: 'conditions',
    name: t('Acnétherapie', 'Acne therapy', 'علاج حب الشباب', 'Thérapie de l’acné', 'Aknetherapie', 'Terapia per l’acne'),
    description: t(
      'Dieptereiniging en een plan om je acne blijvend te verminderen.',
      'A deep cleanse and a plan to reduce your acne for good.',
      'تنظيف عميق وخطة للحد من حب الشباب بشكل دائم.',
      'Un nettoyage en profondeur et un plan pour réduire durablement ton acné.',
      'Eine Tiefenreinigung und ein Plan, um deine Akne dauerhaft zu verringern.',
      'Una pulizia profonda e un piano per ridurre l’acne in modo duraturo.',
    ),
    minutes: 45,
    priceFrom: 65,
    deposit: 0,
    photo: 'pc-acne',
    insurable: true,
  },
  {
    id: 'couperose',
    category: 'conditions',
    name: t('Couperose · vaatlaser', 'Couperose · vascular laser', 'الشعيرات الدموية · ليزر الأوعية', 'Couperose · laser vasculaire', 'Couperose · Gefäßlaser', 'Couperose · laser vascolare'),
    description: t(
      'Zichtbare bloedvaatjes in gezicht en decolleté wegwerken met de vaatlaser.',
      'Clear visible blood vessels on the face and chest with the vascular laser.',
      'إخفاء الشعيرات الدموية الظاهرة في الوجه والصدر بليزر الأوعية.',
      'Atténuer les petits vaisseaux visibles du visage et du décolleté au laser vasculaire.',
      'Sichtbare Äderchen im Gesicht und Dekolleté mit dem Gefäßlaser entfernen.',
      'Eliminare i capillari visibili su viso e décolleté con il laser vascolare.',
    ),
    minutes: 30,
    priceFrom: 95,
    deposit: 0,
    photo: 'pc-couperose',
    insurable: true,
  },
  {
    id: 'pigment',
    category: 'conditions',
    name: t('Pigmentlaser', 'Pigment laser', 'ليزر التصبغات', 'Laser pigmentaire', 'Pigmentlaser', 'Laser per le macchie'),
    description: t(
      'Pigmentvlekken en verkleuringen lichter maken, per vlekje of per zone.',
      'Lighten pigment spots and discolouration, per spot or per zone.',
      'تفتيح البقع والتصبغات، لكل بقعة أو لكل منطقة.',
      'Éclaircir taches et irrégularités pigmentaires, par tache ou par zone.',
      'Pigmentflecken und Verfärbungen aufhellen, pro Fleck oder pro Zone.',
      'Schiarire macchie e discromie, per macchia o per zona.',
    ),
    minutes: 30,
    priceFrom: 75,
    deposit: 0,
    photo: 'pc-pigment',
  },
  {
    id: 'legveins',
    category: 'conditions',
    name: t('Beenvaten', 'Leg veins', 'أوردة الساقين', 'Varicosités des jambes', 'Besenreiser', 'Capillari delle gambe'),
    description: t(
      'Kleine adertjes op de benen behandelen met de vaatlaser.',
      'Treat small veins on the legs with the vascular laser.',
      'علاج الأوردة الصغيرة في الساقين بليزر الأوعية.',
      'Traiter les petites veines des jambes au laser vasculaire.',
      'Kleine Äderchen an den Beinen mit dem Gefäßlaser behandeln.',
      'Trattare i piccoli capillari delle gambe con il laser vascolare.',
    ),
    minutes: 30,
    priceFrom: 95,
    deposit: 0,
    photo: 'pc-legveins',
  },
  {
    id: 'eyes',
    category: 'conditions',
    name: t('Wallen & donkere kringen', 'Under-eye bags & dark circles', 'الانتفاخات والهالات السوداء', 'Poches & cernes', 'Tränensäcke & Augenringe', 'Borse & occhiaie'),
    description: t(
      'RRS Eyes: een frissere oogopslag in een kuur van vier behandelingen.',
      'RRS Eyes: a fresher look in a course of four treatments.',
      'RRS Eyes: نظرة أكثر إشراقًا عبر أربع جلسات.',
      'RRS Eyes : un regard plus frais en une cure de quatre séances.',
      'RRS Eyes: ein frischerer Blick mit einer Kur aus vier Behandlungen.',
      'RRS Eyes: uno sguardo più fresco in un ciclo di quattro trattamenti.',
    ),
    minutes: 45,
    priceFrom: 150,
    deposit: 0,
    photo: 'pc-eyes',
  },
  {
    id: 'skinpen',
    category: 'skin',
    name: t('SkinPen microneedling', 'SkinPen microneedling', 'ميكرونيدلنغ SkinPen', 'Microneedling SkinPen', 'SkinPen Microneedling', 'Microneedling SkinPen'),
    description: t(
      'Maakt de huid steviger en egaler, bijvoorbeeld bij littekens en grove poriën.',
      'Makes skin firmer and smoother, for example with scars and large pores.',
      'يمنح البشرة شدًا ونعومة، مثلًا مع الندبات والمسام الواسعة.',
      'Raffermit et lisse la peau, par exemple en cas de cicatrices et de pores dilatés.',
      'Macht die Haut straffer und ebenmäßiger, etwa bei Narben und großen Poren.',
      'Rende la pelle più compatta e uniforme, per esempio con cicatrici e pori dilatati.',
    ),
    minutes: 60,
    priceFrom: 195,
    deposit: 0,
    photo: 'pc-skinpen',
  },
  {
    id: 'tixel',
    category: 'skin',
    name: t('Tixel huidverjonging', 'Tixel skin rejuvenation', 'تجديد البشرة بتقنية Tixel', 'Rajeunissement Tixel', 'Tixel Hautverjüngung', 'Ringiovanimento Tixel'),
    description: t(
      'Warmtebehandeling voor fijne lijntjes rond ogen en mond, hals en decolleté.',
      'A heat treatment for fine lines around the eyes and mouth, neck and chest.',
      'علاج حراري للخطوط الدقيقة حول العينين والفم والرقبة والصدر.',
      'Un soin par la chaleur pour les ridules autour des yeux et de la bouche, le cou et le décolleté.',
      'Wärmebehandlung für feine Linien um Augen und Mund, Hals und Dekolleté.',
      'Un trattamento termico per le rughe sottili attorno a occhi e bocca, collo e décolleté.',
    ),
    minutes: 30,
    priceFrom: 65,
    deposit: 0,
    photo: 'pc-tixel',
  },
  {
    id: 'sylfirm',
    category: 'skin',
    name: same('Sylfirm X'),
    description: t(
      'Radiofrequente microneedling tegen pigment, roodheid en verslapping.',
      'Radiofrequency microneedling for pigment, redness and laxity.',
      'ميكرونيدلنغ بالترددات الراديوية للتصبغات والاحمرار وترهل البشرة.',
      'Microneedling par radiofréquence contre pigment, rougeurs et relâchement.',
      'Radiofrequenz-Microneedling gegen Pigment, Rötungen und Erschlaffung.',
      'Microneedling a radiofrequenza contro macchie, rossori e rilassamento.',
    ),
    minutes: 60,
    priceFrom: 325,
    deposit: 0,
    photo: 'pc-sylfirm',
  },
  {
    id: 'skinbooster',
    category: 'skin',
    name: t('Skinboosters', 'Skin boosters', 'معززات البشرة', 'Skinboosters', 'Skinbooster', 'Skinbooster'),
    description: t(
      'Een vitamineboost die de huid van binnenuit hydrateert. Ook als kuur van vier.',
      'A vitamin boost that hydrates the skin from within. Also as a course of four.',
      'جرعة فيتامينات ترطب البشرة من الداخل، متاحة أيضًا كباقة من أربع جلسات.',
      'Un boost de vitamines qui hydrate la peau de l’intérieur. Aussi en cure de quatre.',
      'Ein Vitaminboost, der die Haut von innen mit Feuchtigkeit versorgt. Auch als Kur mit vier Terminen.',
      'Un boost di vitamine che idrata la pelle dall’interno. Anche in un ciclo di quattro.',
    ),
    minutes: 30,
    priceFrom: 150,
    deposit: 0,
    photo: 'pc-skinbooster',
  },
  {
    id: 'exosomes',
    category: 'skin',
    name: t('Exosomen', 'Exosomes', 'الإكسوسومات', 'Exosomes', 'Exosomen', 'Esosomi'),
    description: t(
      'Ingeneedld over het hele gezicht voor herstel en een egale, stralende huid.',
      'Needled in across the whole face for recovery and an even, glowing skin.',
      'تُدخل عبر الوجه كله بالإبر الدقيقة لتعافي البشرة وإشراقها.',
      'Appliqués par microneedling sur tout le visage pour réparer et unifier la peau.',
      'Im ganzen Gesicht eingeneedelt, für Regeneration und einen ebenmäßigen Teint.',
      'Applicati con microneedling su tutto il viso per una pelle uniforme e luminosa.',
    ),
    minutes: 60,
    priceFrom: 325,
    deposit: 0,
    photo: 'pc-exosomes',
  },
  {
    id: 'pdrn',
    category: 'skin',
    name: t('PDRN · zalm-DNA', 'PDRN · salmon DNA', 'PDRN · حمض السلمون النووي', 'PDRN · ADN de saumon', 'PDRN · Lachs-DNA', 'PDRN · DNA di salmone'),
    description: t(
      'Polynucleotiden die het herstel van de huid ondersteunen, als losse behandeling of kuur.',
      'Polynucleotides that support the skin’s recovery, as a single treatment or a course.',
      'بولي نيوكليوتيدات تدعم تعافي البشرة، كجلسة واحدة أو باقة.',
      'Des polynucléotides qui soutiennent la réparation de la peau, en séance unique ou en cure.',
      'Polynukleotide, die die Regeneration der Haut unterstützen, einzeln oder als Kur.',
      'Polinucleotidi che sostengono il recupero della pelle, singolarmente o in un ciclo.',
    ),
    minutes: 60,
    priceFrom: 295,
    deposit: 0,
    photo: 'pc-pdrn',
  },
  {
    id: 'tca',
    category: 'skin',
    name: t('TCA peeling', 'TCA peel', 'تقشير TCA', 'Peeling TCA', 'TCA-Peeling', 'Peeling TCA'),
    description: t(
      'Een middeldiepe peeling tegen pigmentvlekken, littekens en een doffe huid.',
      'A medium-depth peel for pigment spots, scars and dull skin.',
      'تقشير متوسط العمق للبقع والندبات والبشرة الباهتة.',
      'Un peeling moyen contre les taches, les cicatrices et le teint terne.',
      'Ein mitteltiefes Peeling gegen Pigmentflecken, Narben und fahle Haut.',
      'Un peeling di media profondità contro macchie, cicatrici e pelle spenta.',
    ),
    minutes: 45,
    priceFrom: 195,
    deposit: 0,
    photo: 'pc-tca',
  },
  {
    id: 'deepclean',
    category: 'skin',
    name: t('Dieptereiniging met peeling', 'Deep cleanse with peel', 'تنظيف عميق مع تقشير', 'Nettoyage profond avec peeling', 'Tiefenreinigung mit Peeling', 'Pulizia profonda con peeling'),
    description: t(
      'Een frisse, schone huid: reinigen, peelen en verzorgen in één afspraak.',
      'Fresh, clean skin: cleanse, peel and care in one appointment.',
      'بشرة نظيفة ومنتعشة: تنظيف وتقشير وعناية في موعد واحد.',
      'Une peau nette et fraîche : nettoyage, peeling et soin en un rendez-vous.',
      'Frische, klare Haut: reinigen, peelen und pflegen in einem Termin.',
      'Una pelle fresca e pulita: detersione, peeling e cura in un solo appuntamento.',
    ),
    minutes: 45,
    priceFrom: 65,
    deposit: 0,
    photo: 'pc-deepclean',
    insurable: true,
  },
  {
    id: 'xlhair',
    category: 'hair',
    name: t('XL Hair · haaruitval', 'XL Hair · hair loss', 'XL Hair · تساقط الشعر', 'XL Hair · chute de cheveux', 'XL Hair · Haarausfall', 'XL Hair · caduta dei capelli'),
    description: t(
      'Behandeling tegen haaruitval met zichtbaar resultaat, met een startpakket incl. producten.',
      'A treatment for hair loss with visible results, with a starter package including products.',
      'علاج لتساقط الشعر بنتائج واضحة، مع باقة بداية تشمل المنتجات.',
      'Un soin contre la chute de cheveux aux résultats visibles, avec un forfait de départ produits inclus.',
      'Behandlung gegen Haarausfall mit sichtbarem Ergebnis, mit Startpaket inklusive Produkten.',
      'Un trattamento contro la caduta dei capelli con risultati visibili, con pacchetto iniziale e prodotti.',
    ),
    minutes: 30,
    priceFrom: 150,
    deposit: 0,
    photo: 'pc-xlhair',
  },
  {
    id: 'camouflage',
    category: 'conditions',
    name: t('Camouflagetherapie', 'Camouflage therapy', 'علاج التمويه', 'Thérapie de camouflage', 'Camouflage-Therapie', 'Terapia camouflage'),
    description: t(
      'Je leert littekens, pigment of vlekken onzichtbaar maken, met producten in jouw eigen kleur.',
      'Learn to hide scars, pigment or birthmarks, with products in your own shade.',
      'تتعلم إخفاء الندبات والتصبغات والبقع بمنتجات بلون بشرتك.',
      'Apprends à masquer cicatrices, taches ou pigment, avec des produits à ta teinte.',
      'Du lernst, Narben, Pigment oder Flecken unsichtbar zu machen, mit Produkten in deinem Farbton.',
      'Impari a nascondere cicatrici, macchie o discromie, con prodotti nella tua tonalità.',
    ),
    minutes: 30,
    priceFrom: 100,
    deposit: 0,
    photo: 'pc-camouflage',
    insurable: true,
  },
  {
    id: 'ipl',
    category: 'skin',
    name: t('IPL huidverbetering', 'IPL skin improvement', 'تحسين البشرة بتقنية IPL', 'Amélioration de la peau IPL', 'IPL-Hautverbesserung', 'Miglioramento della pelle IPL'),
    description: t(
      'Lichtbehandeling tegen roodheid, pigment en een ongelijke teint.',
      'A light treatment for redness, pigment and an uneven skin tone.',
      'علاج بالضوء للاحمرار والتصبغات وعدم توحد لون البشرة.',
      'Un soin par la lumière contre les rougeurs, le pigment et un teint irrégulier.',
      'Lichtbehandlung gegen Rötungen, Pigment und einen unebenen Teint.',
      'Un trattamento con la luce contro rossori, macchie e incarnato irregolare.',
    ),
    minutes: 30,
    priceFrom: 95,
    deposit: 0,
    photo: 'pc-ipl',
  },
  {
    id: 'massage',
    category: 'conditions',
    name: t('Bindweefselmassage', 'Connective tissue massage', 'تدليك النسيج الضام', 'Massage du tissu conjonctif', 'Bindegewebsmassage', 'Massaggio del tessuto connettivo'),
    description: t(
      'Maakt littekens en verkleefd weefsel soepeler. Ook als pakket van 5+1.',
      'Makes scars and adhered tissue more supple. Also as a 5+1 package.',
      'يجعل الندبات والأنسجة الملتصقة أكثر ليونة، ومتاح أيضًا كباقة 5+1.',
      'Assouplit les cicatrices et les tissus adhérents. Aussi en forfait 5+1.',
      'Macht Narben und verklebtes Gewebe geschmeidiger. Auch als 5+1-Paket.',
      'Rende più morbide cicatrici e tessuti aderenti. Anche in pacchetto 5+1.',
    ),
    minutes: 30,
    priceFrom: 60,
    deposit: 0,
    photo: 'pc-massage',
  },
  {
    id: 'prx',
    category: 'skin',
    name: same('PRX-T33'),
    description: t(
      'Naaldvrije skinbooster voor een directe glow: voller, gladder en stralender, zonder vervellen.',
      'A needle-free skin booster for instant glow: plumper, smoother and more radiant, without peeling.',
      'معزّز بشرة بلا إبر لإشراقة فورية: بشرة أكثر امتلاءً ونعومة وإشراقًا، دون تقشير.',
      'Un skinbooster sans aiguilles pour un éclat immédiat : une peau plus pleine, plus lisse et lumineuse, sans desquamation.',
      'Ein nadelfreier Skinbooster für sofortigen Glow: praller, glatter und strahlender, ohne Schälen.',
      'Uno skinbooster senza aghi per un glow immediato: pelle più piena, liscia e luminosa, senza desquamazione.',
    ),
    minutes: 30,
    priceFrom: 125,
    deposit: 0,
    photo: 'pc-prx',
  },
  {
    id: 'facial',
    category: 'skin',
    name: t('Facial', 'Facial', 'فيشل للوجه', 'Soin du visage', 'Gesichtsbehandlung', 'Trattamento viso'),
    description: t(
      'Reinigen, hydrateren en laten stralen: gezicht, hals en decolleté, afgestemd op je huid.',
      'Cleanse, hydrate and glow: face, neck and décolleté, tailored to your skin.',
      'تنظيف وترطيب وإشراق للوجه والرقبة والصدر، بما يناسب بشرتك.',
      'Nettoyer, hydrater, illuminer : visage, cou et décolleté, adaptés à ta peau.',
      'Reinigen, Feuchtigkeit und Glow: Gesicht, Hals und Dekolleté, abgestimmt auf deine Haut.',
      'Pulire, idratare e illuminare: viso, collo e décolleté, su misura per la tua pelle.',
    ),
    minutes: 60,
    priceFrom: 59,
    deposit: 0,
    photo: 'pc-facial',
  },
  {
    id: 'peel',
    category: 'skin',
    name: t('Chemische peeling', 'Chemical peel', 'التقشير الكيميائي', 'Peeling chimique', 'Chemisches Peeling', 'Peeling chimico'),
    description: t(
      'Amandel-, melk-, glycol- of salicylzuur: het zuur dat bij jouw huid past, voor een gladdere en frissere huid.',
      'Mandelic, lactic, glycolic or salicylic acid: the acid that suits your skin, for smoother, fresher skin.',
      'حمض المندليك أو اللاكتيك أو الجليكوليك أو الساليسيليك: الحمض المناسب لبشرتك لبشرة أنعم وأكثر نضارة.',
      'Acide mandélique, lactique, glycolique ou salicylique : l’acide adapté à ta peau, pour une peau plus lisse et plus fraîche.',
      'Mandel-, Milch-, Glykol- oder Salicylsäure: die Säure, die zu deiner Haut passt, für glattere, frischere Haut.',
      'Acido mandelico, lattico, glicolico o salicilico: l’acido giusto per la tua pelle, per una pelle più liscia e fresca.',
    ),
    minutes: 45,
    priceFrom: 85,
    deposit: 0,
    photo: 'pc-peel',
  },
  {
    id: 'brows',
    category: 'beauty',
    name: t('Wenkbrauwen & wimpers', 'Brows & lashes', 'الحواجب والرموش', 'Sourcils & cils', 'Augenbrauen & Wimpern', 'Sopracciglia & ciglia'),
    description: t(
      'Bij Blanche Beauty Studio: verven, epileren, lifting en laminatie.',
      'At Blanche Beauty Studio: tinting, shaping, lifting and lamination.',
      'في Blanche Beauty Studio: صبغ وتشكيل ورفع وتثبيت.',
      'Chez Blanche Beauty Studio : teinture, épilation, rehaussement et lamination.',
      'Im Blanche Beauty Studio: Färben, Zupfen, Lifting und Laminierung.',
      'Da Blanche Beauty Studio: tinta, depilazione, laminazione e lifting.',
    ),
    minutes: 30,
    priceFrom: 35,
    deposit: 0,
    photo: 'ivy-lashes',
  },
  {
    id: 'nails',
    category: 'beauty',
    name: t('Nagels · BIAB', 'Nails · BIAB', 'الأظافر · BIAB', 'Ongles · BIAB', 'Nägel · BIAB', 'Unghie · BIAB'),
    description: t(
      'Bij Blanche Beauty Studio: BIAB, gellak en verzorging van handen en voeten.',
      'At Blanche Beauty Studio: BIAB, gel polish and care for hands and feet.',
      'في Blanche Beauty Studio: BIAB وطلاء جل والعناية باليدين والقدمين.',
      'Chez Blanche Beauty Studio : BIAB, vernis gel et soin des mains et des pieds.',
      'Im Blanche Beauty Studio: BIAB, Gel-Lack und Pflege für Hände und Füße.',
      'Da Blanche Beauty Studio: BIAB, smalto semipermanente e cura di mani e piedi.',
    ),
    minutes: 60,
    priceFrom: 45,
    deposit: 0,
    photo: 'pc-nails',
  },
];

/** The skin concerns on pureclinics.nl, as photo cards on Home, with the treatments the site recommends for each. */
export const CONCERNS: Concern[] = [
  { id: 'removal', photo: 'pc-smooth', treatments: ['laser', 'epilation'] },
  { id: 'acne', photo: 'pc-acne-skin', treatments: ['acne', 'deepclean', 'peel', 'ipl', 'skinpen', 'prx'] },
  { id: 'scars', photo: 'pc-skinpen', treatments: ['skinpen', 'sylfirm', 'tixel', 'tca', 'pdrn', 'exosomes', 'camouflage'] },
  { id: 'pigment', photo: 'pc-pigment', treatments: ['pigment', 'ipl', 'tca', 'skinpen', 'prx', 'camouflage'] },
  { id: 'redness', photo: 'pc-couperose', treatments: ['couperose', 'ipl', 'legveins', 'camouflage'] },
  { id: 'aging', photo: 'pc-aging', treatments: ['tixel', 'sylfirm', 'skinpen', 'pdrn', 'exosomes', 'skinbooster', 'prx', 'massage', 'facial'] },
  { id: 'eyes', photo: 'pc-eyes', treatments: ['eyes', 'skinbooster', 'tixel'] },
  { id: 'hairloss', photo: 'pc-xlhair', treatments: ['xlhair'] },
];

/** Laser hair removal is priced per zone, as on pureclinics.nl/tarieven; a package gives the sixth time free. */
export type LaserZone = { id: string; name: L10n; price: number };
export const LASER_ZONES: LaserZone[] = [
  { id: 'brows', name: t('Wenkbrauwen', 'Eyebrows', 'الحاجبان', 'Sourcils', 'Augenbrauen', 'Sopracciglia'), price: 35 },
  { id: 'upperlip', name: t('Bovenlip', 'Upper lip', 'الشفة العليا', 'Lèvre supérieure', 'Oberlippe', 'Labbro superiore'), price: 55 },
  { id: 'chin', name: t('Kin', 'Chin', 'الذقن', 'Menton', 'Kinn', 'Mento'), price: 60 },
  { id: 'cheeks', name: t('Wangen', 'Cheeks', 'الخدان', 'Joues', 'Wangen', 'Guance'), price: 75 },
  { id: 'neck', name: t('Hals', 'Neck', 'الرقبة', 'Cou', 'Hals', 'Collo'), price: 85 },
  { id: 'armpits', name: t('Oksels', 'Underarms', 'الإبطان', 'Aisselles', 'Achseln', 'Ascelle'), price: 65 },
  { id: 'bikini', name: t('Bikinilijn', 'Bikini line', 'خط البكيني', 'Maillot', 'Bikinizone', 'Inguine'), price: 75 },
  { id: 'fullbikini', name: t('Bikini geheel', 'Full bikini', 'البكيني كاملًا', 'Maillot intégral', 'Ganze Bikinizone', 'Inguine completo'), price: 125 },
  { id: 'stomach', name: t('Buik', 'Stomach', 'البطن', 'Ventre', 'Bauch', 'Addome'), price: 125 },
  { id: 'halflegs', name: t('Onder- of bovenbenen', 'Lower or upper legs', 'أسفل أو أعلى الساقين', 'Demi-jambes', 'Unter- oder Oberschenkel', 'Mezza gamba'), price: 195 },
  { id: 'legs', name: t('Gehele benen', 'Full legs', 'الساقان كاملتان', 'Jambes entières', 'Ganze Beine', 'Gambe intere'), price: 350 },
  { id: 'forearms', name: t('Onderarmen', 'Forearms', 'الساعدان', 'Avant-bras', 'Unterarme', 'Avambracci'), price: 125 },
  { id: 'arms', name: t('Gehele armen', 'Full arms', 'الذراعان كاملتان', 'Bras entiers', 'Ganze Arme', 'Braccia intere'), price: 140 },
  { id: 'back', name: t('Gehele rug', 'Full back', 'الظهر كاملًا', 'Dos entier', 'Ganzer Rücken', 'Schiena intera'), price: 175 },
];
/** Price per time in a 5+1 package: pay for five, the sixth is free. */
export const packagePrice = (price: number) => Math.round(((price * 5) / 6) * 100) / 100;

/** The deals on pureclinics.nl/deals: combined laser zones, per treatment. */
export type Deal = { id: string; group: 'women' | 'men' | 'students'; zones: L10n; price: number; was: number | null };
export const DEALS: Deal[] = [
  { id: 'w1', group: 'women', zones: t('Oksels & bikinilijn', 'Underarms & bikini line', 'الإبطان وخط البكيني', 'Aisselles & maillot', 'Achseln & Bikinizone', 'Ascelle & inguine'), price: 120, was: 140 },
  { id: 'w2', group: 'women', zones: t('Oksels & bikini geheel', 'Underarms & full bikini', 'الإبطان والبكيني كاملًا', 'Aisselles & maillot intégral', 'Achseln & ganze Bikinizone', 'Ascelle & inguine completo'), price: 140, was: 190 },
  { id: 'w3', group: 'women', zones: t('Oksels, bikinilijn & onder- of bovenbenen', 'Underarms, bikini line & lower or upper legs', 'الإبطان وخط البكيني وأسفل أو أعلى الساقين', 'Aisselles, maillot & demi-jambes', 'Achseln, Bikinizone & Unter- oder Oberschenkel', 'Ascelle, inguine & mezza gamba'), price: 225, was: 335 },
  { id: 'w4', group: 'women', zones: t('Oksels, bikini geheel & onder- of bovenbenen', 'Underarms, full bikini & lower or upper legs', 'الإبطان والبكيني كاملًا وأسفل أو أعلى الساقين', 'Aisselles, maillot intégral & demi-jambes', 'Achseln, ganze Bikinizone & Unter- oder Oberschenkel', 'Ascelle, inguine completo & mezza gamba'), price: 255, was: 385 },
  { id: 'm1', group: 'men', zones: t('Buik & borst + hals gratis', 'Stomach & chest + neck free', 'البطن والصدر + الرقبة مجانًا', 'Ventre & torse + cou offert', 'Bauch & Brust + Hals gratis', 'Addome & petto + collo gratis'), price: 295, was: null },
  { id: 'm2', group: 'men', zones: t('Gehele rug + nek gratis', 'Full back + neck free', 'الظهر كاملًا + الرقبة مجانًا', 'Dos entier + nuque offerte', 'Ganzer Rücken + Nacken gratis', 'Schiena intera + nuca gratis'), price: 295, was: null },
  { id: 's1', group: 'students', zones: t('Oksels', 'Underarms', 'الإبطان', 'Aisselles', 'Achseln', 'Ascelle'), price: 35, was: 52 },
];

// Fictional team of HBO-trained skin therapists, plus a beauty specialist for Blanche Beauty Studio in Nijmegen.
export const SPECIALISTS: Specialist[] = [
  { id: 'sanne', name: 'Sanne', role: 'therapist', locationId: 'nijmegen', categories: ['consult', 'removal', 'conditions', 'hair'], days: [1, 2, 3, 5] },
  { id: 'eva', name: 'Eva', role: 'therapist', locationId: 'nijmegen', categories: ['consult', 'conditions', 'skin'], days: [2, 3, 4, 6] },
  { id: 'jade', name: 'Jade', role: 'therapist', locationId: 'nijmegen', categories: ['consult', 'removal', 'skin', 'hair'], days: [1, 3, 4, 5, 6] },
  { id: 'yara', name: 'Yara', role: 'beauty', locationId: 'nijmegen', categories: ['beauty'], days: [2, 3, 4, 5, 6] },
  { id: 'fien', name: 'Fien', role: 'therapist', locationId: 'uden', categories: ['consult', 'removal', 'conditions', 'skin'], days: [2, 3, 5, 6] },
  { id: 'nina', name: 'Nina', role: 'therapist', locationId: 'uden', categories: ['consult', 'removal', 'conditions', 'skin', 'hair'], days: [2, 3, 6] },
];

/** Which greeting fits the hour: good morning, afternoon or evening. */
export function timeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export const IVY_MEMBER = { firstName: 'Lisa', lastName: 'de Vries', locationId: 'nijmegen' as LocationId };

/**
 * Opening hours on a day: of one location, or without a location the span of all of them
 * (the earliest opening and the latest closing). Null when closed.
 */
export function openingHours(day: Date, locationId?: LocationId): { open: number; close: number } | null {
  const dow = day.getDay();
  const spans = (locationId ? LOCATIONS.filter((l) => l.id === locationId) : LOCATIONS).map((l) => l.hours[dow]).filter((h) => h !== null);
  if (!spans.length) return null;
  return { open: Math.min(...spans.map((h) => h.open)), close: Math.max(...spans.map((h) => h.close)) };
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
  const hours = openingHours(day, locationId);
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
 * Bookable start times for a treatment on a day: inside the location's opening hours, clear of other clients
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
  const hours = openingHours(day, locationId);
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
  // At most one time per half hour, so a long day (Wednesday until nine) still shows its evening.
  const times: FreeSlot[] = [];
  for (const [start, sid] of Array.from(found.entries()).sort((a, b) => a[0] - b[0])) {
    const previous = times[times.length - 1];
    if (!previous || start - previous.start.getTime() >= 30 * 60000) times.push({ start: new Date(start), specialistId: sid });
  }
  return times;
}

/** The member's history and next visit: acne therapy coming up, and two laser sessions behind her. */
export function initialIvyAppointments(now: Date): IvyAppointment[] {
  const today = startOfDay(now);
  let next = addDays(today, 3);
  while (!specialistById('eva').days.includes(next.getDay())) next = addDays(next, 1);
  return [
    { id: 'appt-next', treatmentId: 'acne', specialistId: 'eva', locationId: 'nijmegen', start: atTime(next, '10:30') },
    { id: 'appt-laser-2', treatmentId: 'laser', specialistId: 'sanne', locationId: 'nijmegen', start: atTime(addDays(today, -49), '16:00') },
    { id: 'appt-laser-1', treatmentId: 'laser', specialistId: 'sanne', locationId: 'nijmegen', start: atTime(addDays(today, -98), '16:00') },
  ];
}

/** Laser hair removal takes eight to ten sessions, four to six weeks apart (pureclinics.nl). */
export const LASER_SERIES = 8;

/**
 * Five weeks or more after a laser session, suggest the next one with the same specialist: Pure Clinics calls this a
 * vervolgafspraak. It shows which session of the series it would be.
 */
export function followUpSuggestion(
  now: Date,
  booked: IvyAppointment[],
): { treatment: Treatment; slot: FreeSlot; weeksAgo: number; session: number; locationId: LocationId } | null {
  const laser = booked.filter((a) => a.treatmentId === 'laser');
  const past = laser.filter((a) => a.start.getTime() < now.getTime()).sort((a, b) => b.start.getTime() - a.start.getTime());
  const last = past[0];
  if (!last || past.length >= LASER_SERIES) return null;
  // Once the next session is planned, the reminder has done its job.
  if (laser.some((a) => a.start.getTime() > now.getTime())) return null;
  const weeksAgo = Math.floor((now.getTime() - last.start.getTime()) / (7 * 86400000));
  if (weeksAgo < 5) return null;
  const treatment = treatmentById('laser');
  for (let d = 1; d <= 14; d++) {
    const day = addDays(startOfDay(now), d);
    const slots = freeSlots(treatment, last.specialistId, day, now, last.locationId, booked);
    const evening = slots.find((s) => s.start.getHours() >= 15) ?? slots[0];
    if (evening) return { treatment, slot: evening, weeksAgo, session: past.length + 1, locationId: last.locationId };
  }
  return null;
}
