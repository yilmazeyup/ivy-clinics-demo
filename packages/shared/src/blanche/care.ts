import type { L10n } from '../i18n/locales';
import type { CategoryId } from './catalog';

const t = (nl: string, en: string, ar: string, fr: string, de: string, it: string): L10n => ({ nl, en, ar, fr, de, it });

/** What happens in the chair, per craft, in three short steps. */
export const STEPS: Record<CategoryId, L10n[]> = {
  nails: [
    t(
      'Even bijpraten over vorm, lengte en kleur. Neem gerust een foto mee.',
      'A quick chat about shape, length and colour. Feel free to bring a photo.',
      'حديث قصير عن الشكل والطول واللون. يمكنك إحضار صورة.',
      'On parle forme, longueur et couleur. Apporte une photo si tu veux.',
      'Kurz über Form, Länge und Farbe sprechen. Bring gern ein Foto mit.',
      'Due parole su forma, lunghezza e colore. Porta pure una foto.',
    ),
    t(
      'Een Russische manicure: nagelriemen netjes weg, zodat de BIAB strak aansluit.',
      'A Russian manicure: cuticles neatly removed, so the BIAB sits perfectly.',
      'مانيكير روسي: إزالة الجلد المحيط بعناية ليلتصق BIAB تمامًا.',
      'Une manucure russe : cuticules retirées avec soin pour un BIAB impeccable.',
      'Eine russische Maniküre: Nagelhaut sauber entfernt, damit das BIAB perfekt sitzt.',
      'Una manicure russa: cuticole rimosse con cura, perché il BIAB aderisca alla perfezione.',
    ),
    t(
      'BIAB opbouwen, kleur of nail art erop en uitharden onder de lamp. Afronden met nagelolie.',
      'BIAB built up, colour or nail art on top, cured under the lamp. Finished with cuticle oil.',
      'بناء BIAB ثم اللون أو الرسم والتجفيف تحت المصباح، وأخيرًا زيت الأظافر.',
      'Construction du BIAB, couleur ou nail art, séchage sous la lampe. Finition à l’huile.',
      'BIAB aufbauen, Farbe oder Nail Art drauf, unter der Lampe aushärten. Zum Schluss Nagelöl.',
      'BIAB costruito, colore o nail art e asciugatura sotto la lampada. Finitura con olio.',
    ),
  ],
  lashes: [
    t(
      'We kiezen samen de krul: zacht en natuurlijk of juist extra open.',
      'Together we choose the curl: soft and natural or extra open.',
      'نختار معًا الانحناءة: ناعمة وطبيعية أو أكثر انفتاحًا.',
      'On choisit ensemble la courbe : douce et naturelle ou bien ouverte.',
      'Gemeinsam wählen wir den Schwung: weich und natürlich oder extra offen.',
      'Scegliamo insieme la curva: morbida e naturale o più aperta.',
    ),
    t(
      'Je ligt lekker met je ogen dicht terwijl de lotions je wimpers vanaf de wortel liften.',
      'You lie back with your eyes closed while the lotions lift your lashes from the root.',
      'تستلقين وعيناك مغمضتان بينما ترفع المستحضرات رموشك من الجذور.',
      'Tu te détends les yeux fermés pendant que les lotions rehaussent tes cils dès la racine.',
      'Du liegst entspannt mit geschlossenen Augen, während die Lotionen deine Wimpern ab dem Ansatz liften.',
      'Ti rilassi a occhi chiusi mentre le lozioni sollevano le ciglia dalla radice.',
    ),
    t(
      'Eventueel verven, dan een voedende serum en samen kijken in de spiegel.',
      'A tint if you like, then a nourishing serum and a look in the mirror together.',
      'صبغ إن رغبت، ثم سيروم مغذٍّ ونظرة معًا في المرآة.',
      'Une teinture si tu veux, puis un sérum nourrissant et on admire ensemble.',
      'Auf Wunsch färben, dann ein pflegendes Serum und gemeinsam in den Spiegel schauen.',
      'Tinta se vuoi, poi un siero nutriente e uno sguardo allo specchio insieme.',
    ),
  ],
  brows: [
    t(
      'We meten je brows af op je gezicht en kiezen samen de vorm.',
      'We map your brows to your face and choose the shape together.',
      'نقيس الحواجب على ملامح وجهك ونختار الشكل معًا.',
      'On dessine tes sourcils selon ton visage et on choisit la forme ensemble.',
      'Wir vermessen deine Brauen am Gesicht und wählen gemeinsam die Form.',
      'Mappiamo le sopracciglia sul tuo viso e scegliamo la forma insieme.',
    ),
    t(
      'De haartjes krijgen een nieuwe richting en worden gefixeerd.',
      'The hairs are set in a new direction and fixed in place.',
      'يأخذ الشعر اتجاهًا جديدًا ويُثبّت.',
      'Les poils prennent une nouvelle direction et sont fixés.',
      'Die Härchen bekommen eine neue Richtung und werden fixiert.',
      'I peli prendono una nuova direzione e vengono fissati.',
    ),
    t(
      'Epileren en bijknippen in model, en afronden met een voedende serum.',
      'Tweezed and trimmed into shape, finished with a nourishing serum.',
      'نتف وقص للتشكيل ثم سيروم مغذٍّ.',
      'Pince et taille pour la forme, finition avec un sérum nourrissant.',
      'Zupfen und Trimmen in Form, zum Schluss ein pflegendes Serum.',
      'Pinzetta e taglio per la forma, poi un siero nutriente.',
    ),
  ],
};

/** Aftercare the stylist gives along, per craft. */
export const AFTERCARE: Record<CategoryId, L10n[]> = {
  nails: [
    t(
      'Smeer elke avond nagelolie op je nagelriemen.',
      'Rub cuticle oil into your cuticles every evening.',
      'ضعي زيت الأظافر على الجلد المحيط كل مساء.',
      'Masse tes cuticules avec de l’huile chaque soir.',
      'Massiere jeden Abend Nagelöl in die Nagelhaut.',
      'Massaggia l’olio sulle cuticole ogni sera.',
    ),
    t(
      'Draag handschoenen bij schoonmaken en afwassen.',
      'Wear gloves for cleaning and washing up.',
      'ارتدي قفازات عند التنظيف وغسل الأطباق.',
      'Porte des gants pour le ménage et la vaisselle.',
      'Trag Handschuhe beim Putzen und Abwaschen.',
      'Usa i guanti per pulire e lavare i piatti.',
    ),
    t(
      'Niet pulken: laat je BIAB altijd in de studio verwijderen.',
      'No picking: always have your BIAB removed at the studio.',
      'لا تقشريه: أزيلي BIAB دائمًا في الاستوديو.',
      'On ne gratte pas : fais toujours retirer ton BIAB au studio.',
      'Nicht abknibbeln: BIAB immer im Studio entfernen lassen.',
      'Non staccarlo: fai sempre rimuovere il BIAB in studio.',
    ),
  ],
  lashes: [
    t(
      'De eerste 24 uur geen water, stoom of sauna.',
      'No water, steam or sauna for the first 24 hours.',
      'لا ماء ولا بخار ولا ساونا خلال أول 24 ساعة.',
      'Ni eau, ni vapeur, ni sauna pendant 24 heures.',
      'Die ersten 24 Stunden kein Wasser, Dampf oder Sauna.',
      'Niente acqua, vapore o sauna per le prime 24 ore.',
    ),
    t(
      'Borstel ze elke ochtend met het borsteltje dat je meekrijgt.',
      'Brush them every morning with the spoolie you take home.',
      'سرّحيها كل صباح بالفرشاة التي تأخذينها معك.',
      'Brosse-les chaque matin avec la petite brosse offerte.',
      'Bürste sie jeden Morgen mit dem Bürstchen, das du mitbekommst.',
      'Pettinale ogni mattina con lo scovolino che ti diamo.',
    ),
    t(
      'Een wimperkruller heb je niet meer nodig.',
      'You won’t need an eyelash curler any more.',
      'لن تحتاجي إلى مكواة الرموش بعد الآن.',
      'Plus besoin de recourbe-cils.',
      'Eine Wimpernzange brauchst du nicht mehr.',
      'Non ti servirà più il piegaciglia.',
    ),
  ],
  brows: [
    t(
      'De eerste 24 uur niet nat maken en geen make-up op je brows.',
      'Keep them dry and make-up free for the first 24 hours.',
      'أبقيها جافة ودون مكياج خلال أول 24 ساعة.',
      'Garde-les au sec et sans maquillage pendant 24 heures.',
      'Die ersten 24 Stunden trocken und ohne Make-up lassen.',
      'Tienile asciutte e senza trucco per 24 ore.',
    ),
    t(
      'Borstel ze elke ochtend omhoog in model.',
      'Brush them up into shape every morning.',
      'سرّحيها إلى الأعلى كل صباح.',
      'Brosse-les vers le haut chaque matin.',
      'Bürste sie jeden Morgen nach oben in Form.',
      'Pettinale all’insù ogni mattina.',
    ),
    t(
      'Een druppel serum houdt de haartjes zacht en gezond.',
      'A drop of serum keeps the hairs soft and healthy.',
      'قطرة من السيروم تبقي الشعر ناعمًا وصحيًا.',
      'Une goutte de sérum garde les poils doux et sains.',
      'Ein Tropfen Serum hält die Härchen weich und gesund.',
      'Una goccia di siero mantiene i peli morbidi e sani.',
    ),
  ],
};
