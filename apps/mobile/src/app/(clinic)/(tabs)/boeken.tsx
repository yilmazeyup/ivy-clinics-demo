import {
  CONCERNS,
  concernInfo,
  CLINIC_COLORS,
  MEMBER,
  LOCATIONS,
  TREATMENTS,
  treatmentById,
  type ConcernId,
  type LocationId,
  type Treatment,
  type TreatmentCategory,
} from '@pure-clinics/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Rail, Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName } from '@/clinic';
import { useLayout } from '@/layout';
import { useTheme } from '@/theme';

type Category = 'all' | TreatmentCategory;
const CATEGORIES: Category[] = ['all', 'consult', 'removal', 'conditions', 'skin', 'hair', 'beauty'];

export default function BookScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ concern?: string; at?: string }>();
  const [category, setCategory] = useState<Category>('all');
  const [location, setLocation] = useState<LocationId>(MEMBER.locationId);
  const [concern, setConcern] = useState<ConcernId | null>(null);
  const { wide } = useLayout();

  // A concern tapped on Home arrives as a route parameter; `at` makes a repeated tap count again.
  useEffect(() => {
    const match = CONCERNS.find((c) => c.id === params.concern);
    if (match) {
      setConcern(match.id);
      setCategory('all');
    }
  }, [params.concern, params.at]);

  const forConcern = concern ? (CONCERNS.find((c) => c.id === concern)?.treatments ?? []) : null;
  const treatments = TREATMENTS.filter(
    (tr) => tr.id !== 'consult' && (category === 'all' || tr.category === category) && (!forConcern || forConcern.includes(tr.id)),
  );
  const showConsult = !concern && (category === 'all' || category === 'consult');
  // A treatment opens on its own page first: what it is, how it goes and what it costs.
  const open = (treatment: Treatment) => router.push({ pathname: '/behandeling/[id]', params: { id: treatment.id, location } });

  return (
    <Screen gap={22} width="page">
      <View style={{ gap: 8 }}>
        <Txt variant="display">{t('clinic.book.title')}</Txt>
        <Txt variant="body" color={theme.c.muted}>
          {t('clinic.book.intro')}
        </Txt>
      </View>

      <Steps />

      <View style={{ gap: 10 }}>
        <Txt variant="eyebrow" color={theme.c.muted}>
          {t('clinic.book.location')}
        </Txt>
        <Rail gap={8}>
          {LOCATIONS.map((l) => (
            <Chip key={l.id} label={cityName(l)} icon={l.id === location ? 'pin' : undefined} selected={l.id === location} onPress={() => setLocation(l.id)} />
          ))}
        </Rail>
      </View>

      <Rail gap={8}>
        {concern ? (
          <Chip label={t(`clinic.concern.${concern}`)} selected iconAfter="close" onPress={() => setConcern(null)} />
        ) : null}
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={t(`clinic.cat.${c}`)}
            selected={!concern && category === c}
            onPress={() => {
              setConcern(null);
              setCategory(c);
            }}
          />
        ))}
      </Rail>

      {concern ? <ConcernNote concern={concern} /> : null}

      {showConsult ? <ConsultCard onPress={() => open(treatmentById('consult'))} /> : null}

      {/* Two columns of treatments on a computer screen. */}
      <View style={wide ? { flexDirection: 'row', flexWrap: 'wrap', columnGap: 40 } : { gap: 4 }}>
        {treatments.map((tr, index) => (
          <View key={tr.id} style={wide ? { flexBasis: '40%', flexGrow: 1 } : undefined}>
            <TreatmentRow treatment={tr} first={index < (wide ? 2 : 1)} onPress={() => open(tr)} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

/** How a treatment at Pure goes, from the free intake to the aftercare. */
function Steps() {
  const theme = useTheme();
  const { t } = useI18n();
  const steps = [t('clinic.steps.1'), t('clinic.steps.2'), t('clinic.steps.3'), t('clinic.steps.4')];
  return (
    <View accessibilityRole="list" accessibilityLabel={t('clinic.steps.title')} style={{ flexDirection: 'row', gap: 6 }}>
      {steps.map((step, index) => (
        <View key={step} style={{ flex: 1, gap: 6, paddingTop: 10, borderTopWidth: 2, borderTopColor: index === 0 ? theme.c.ink : theme.c.line }}>
          <Txt variant="caption" color={theme.c.muted}>
            {`0${index + 1}`}
          </Txt>
          <Txt variant="smallStrong">{step}</Txt>
        </View>
      ))}
    </View>
  );
}

/** What the chosen concern is, in two sentences from the condition pages on pureclinics.nl. */
function ConcernNote({ concern }: { concern: ConcernId }) {
  const theme = useTheme();
  const { t, text } = useI18n();
  return (
    <View style={{ padding: 16, gap: 6, borderRadius: theme.r.card, backgroundColor: theme.c.surface, borderWidth: 1, borderColor: theme.c.line }}>
      <Txt variant="eyebrow" color={theme.c.muted}>
        {t('clinic.concern.about', { concern: t(`clinic.concern.${concern}`) })}
      </Txt>
      <Txt variant="body">{text(concernInfo(concern))}</Txt>
    </View>
  );
}

function ConsultCard({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const { t, text } = useI18n();
  const consult = treatmentById('consult');
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        backgroundColor: CLINIC_COLORS.sand,
        borderRadius: theme.r.card,
        overflow: 'hidden',
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Photo photo={consult.photo} style={{ width: 112 }} />
      <View style={{ flex: 1, padding: 16, gap: 6 }}>
        <Badge label={t('clinic.book.startHere')} tone="ink" />
        <Txt variant="heading">{text(consult.name)}</Txt>
        <Txt variant="small" color={CLINIC_COLORS.body}>
          {text(consult.description)}
        </Txt>
        <Txt variant="smallStrong">{`${t('common.minutes', { n: consult.minutes })} · ${t('clinic.price.free')}`}</Txt>
      </View>
    </Pressable>
  );
}

function TreatmentRow({ treatment, first, onPress }: { treatment: Treatment; first: boolean; onPress: () => void }) {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: theme.c.line,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Photo photo={treatment.photo} style={{ width: 80, height: 96, borderRadius: theme.r.small }} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt variant="caption" color={theme.c.muted}>
            {t(`clinic.cat.${treatment.category}`)}
          </Txt>
          {treatment.insurable ? <Badge label={t('clinic.book.insurable')} tone="outline" /> : null}
        </View>
        <Txt variant="heading">{text(treatment.name)}</Txt>
        <Txt variant="small" color={theme.c.muted} numberOfLines={2}>
          {text(treatment.description)}
        </Txt>
        <Txt variant="smallStrong">{`${t('common.minutes', { n: treatment.minutes })} · ${t('clinic.price.from', { price: euro(treatment.priceFrom) })}`}</Txt>
      </View>
      <Icon name="chevron" size={18} color={theme.c.muted} />
    </Pressable>
  );
}
