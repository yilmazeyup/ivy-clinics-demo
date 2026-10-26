import {
  CONCERNS,
  concernInfo,
  LOCATIONS,
  MEMBER,
  TREATMENTS,
  treatmentById,
  type ConcernId,
  type LocationId,
  type PhotoKey,
  type Treatment,
  type TreatmentCategory,
} from '@pure-clinics/shared';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { FadeIn, PressableScale } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { TreatmentCard, useOpenTreatment } from '@/components/TreatmentCard';
import { Txt } from '@/components/Txt';
import { cityName } from '@/clinic';
import { useI18n } from '@/i18n';
import { startEdge, useLayout } from '@/layout';
import { useTheme } from '@/theme';

type Category = 'all' | TreatmentCategory;
const CATEGORIES: { id: Category; photo: PhotoKey }[] = [
  { id: 'all', photo: 'pc-facial' },
  { id: 'consult', photo: 'pc-consult' },
  { id: 'removal', photo: 'pc-smooth' },
  { id: 'conditions', photo: 'pc-acne-skin' },
  { id: 'skin', photo: 'pc-skinbooster' },
  { id: 'hair', photo: 'pc-xlhair' },
  { id: 'beauty', photo: 'pc-nails' },
];

export default function BookScreen() {
  const theme = useTheme();
  const { t, text } = useI18n();
  const params = useLocalSearchParams<{ concern?: string; at?: string }>();
  const [category, setCategory] = useState<Category>('all');
  const [location, setLocation] = useState<LocationId>(MEMBER.locationId);
  const [concern, setConcern] = useState<ConcernId | null>(null);
  const [query, setQuery] = useState('');

  // A concern tapped on Home arrives as a route parameter; `at` makes a repeated tap count again.
  useEffect(() => {
    const match = CONCERNS.find((c) => c.id === params.concern);
    if (match) {
      setConcern(match.id);
      setCategory('all');
      setQuery('');
    }
  }, [params.concern, params.at]);

  const forConcern = concern ? (CONCERNS.find((c) => c.id === concern)?.treatments ?? []) : null;
  const needle = query.trim().toLowerCase();
  const treatments = TREATMENTS.filter(
    (tr) =>
      tr.id !== 'consult' &&
      (category === 'all' || tr.category === category) &&
      (!forConcern || forConcern.includes(tr.id)) &&
      (!needle || `${text(tr.name)} ${text(tr.description)}`.toLowerCase().includes(needle)),
  );
  const showConsult = !concern && !needle && (category === 'all' || category === 'consult');

  return (
    <Screen gap={24} width="page" tabs>
      <View style={{ gap: 8 }}>
        <Txt variant="hero">{t('clinic.book.title')}</Txt>
        <Txt variant="body" color={theme.c.muted}>
          {t('clinic.book.intro')}
        </Txt>
      </View>

      <View style={{ gap: 12 }}>
        <Search value={query} onChange={setQuery} />
        <Segmented
          label={t('clinic.book.location')}
          value={location}
          onChange={setLocation}
          options={LOCATIONS.map((l) => ({ value: l.id, label: cityName(l), icon: 'pin' as const }))}
        />
      </View>

      <Categories
        value={concern ? null : category}
        onChange={(c) => {
          setConcern(null);
          setCategory(c);
        }}
      />

      {concern ? <ConcernNote concern={concern} onClear={() => setConcern(null)} /> : null}

      {showConsult ? <ConsultHero location={location} /> : null}

      {treatments.length ? (
        <Mosaic key={`${category}-${concern}-${needle}`} treatments={treatments} location={location} />
      ) : (
        <Txt variant="body" color={theme.c.muted} align="center" style={{ paddingVertical: 40 }}>
          {t('clinic.book.none')}
        </Txt>
      )}
    </Screen>
  );
}

function Search({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 50,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: theme.c.surface,
        boxShadow: theme.shadow.card,
      }}
    >
      <Icon name="search" size={19} color={theme.c.muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t('clinic.book.search')}
        placeholderTextColor={theme.c.muted}
        accessibilityLabel={t('clinic.book.search')}
        returnKeyType="search"
        style={{ flex: 1, height: 50, fontFamily: theme.f.body, fontSize: 15, color: theme.c.ink, textAlign: theme.rtl ? 'right' : 'left' }}
      />
      {value ? (
        <PressableScale accessibilityLabel={t('common.close')} onPress={() => onChange('')} style={{ padding: 4 }}>
          <Icon name="close" size={16} color={theme.c.muted} />
        </PressableScale>
      ) : null}
    </View>
  );
}

/** Categories as small photo tiles in a row; the chosen one is framed in ink. */
function Categories({ value, onChange }: { value: Category | null; onChange: (c: Category) => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide } = useLayout();
  const tiles = CATEGORIES.map((c) => {
    const on = value === c.id;
    return (
      <PressableScale
        key={c.id}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={t(`clinic.cat.${c.id}`)}
        onPress={() => onChange(c.id)}
        style={{ width: wide ? undefined : 84, flex: wide ? 1 : undefined, gap: 8, alignItems: 'center' }}
      >
        <View style={{ padding: 3, borderRadius: 22, borderWidth: 1.5, borderColor: on ? theme.c.ink : 'transparent', alignSelf: 'stretch' }}>
          <Photo photo={c.photo} style={{ height: wide ? 110 : 84, borderRadius: 18 }} />
        </View>
        <Txt variant={on ? 'smallStrong' : 'small'} color={on ? theme.c.ink : theme.c.muted} numberOfLines={1}>
          {t(`clinic.cat.${c.id}`)}
        </Txt>
      </PressableScale>
    );
  });
  if (wide) return <View style={{ flexDirection: 'row', gap: 14 }}>{tiles}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
      {tiles}
    </ScrollView>
  );
}

/** What the chosen concern is, in two sentences from the condition pages on pureclinics.nl. */
function ConcernNote({ concern, onClear }: { concern: ConcernId; onClear: () => void }) {
  const theme = useTheme();
  const { t, text } = useI18n();
  const photo = CONCERNS.find((c) => c.id === concern)?.photo ?? 'pc-facial';
  return (
    <FadeIn>
      <View style={{ borderRadius: theme.r.card, overflow: 'hidden', backgroundColor: theme.c.surface, boxShadow: theme.shadow.card }}>
        <Photo photo={photo} scrim style={{ height: 150 }}>
          <View style={{ position: 'absolute', start: 16, end: 16, bottom: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            <Txt variant="title" color="#FFFFFF" style={{ flex: 1 }}>
              {t(`clinic.concern.${concern}`)}
            </Txt>
            <PressableScale accessibilityLabel={t('common.close')} onPress={onClear} style={{ borderRadius: 12 }}>
              <Glass style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="close" size={16} />
              </Glass>
            </PressableScale>
          </View>
        </Photo>
        <View style={{ padding: 16, gap: 6 }}>
          <Txt variant="eyebrow" color={theme.c.muted}>
            {t('clinic.concern.about', { concern: t(`clinic.concern.${concern}`) })}
          </Txt>
          <Txt variant="body">{text(concernInfo(concern))}</Txt>
        </View>
      </View>
    </FadeIn>
  );
}

/** The free intake, where every treatment starts, as a wide photo card. */
function ConsultHero({ location }: { location: LocationId }) {
  const theme = useTheme();
  const { t, text } = useI18n();
  const consult = treatmentById('consult');
  const { ref, open } = useOpenTreatment(consult, theme.r.card, location);
  return (
    <PressableScale onPress={open} accessibilityLabel={text(consult.name)} style={{ borderRadius: theme.r.card, boxShadow: theme.shadow.card }}>
      <View ref={ref} collapsable={false} style={{ height: 230, borderRadius: theme.r.card, overflow: 'hidden' }}>
        <Photo photo={consult.photo} scrim style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', top: 14, ...startEdge(theme.rtl, 14) }}>
          <Badge label={t('clinic.book.startHere')} tone="ink" />
        </View>
        <View style={{ position: 'absolute', start: 18, end: 18, bottom: 16, gap: 4 }}>
          <Txt variant="title" color="#FFFFFF">
            {text(consult.name)}
          </Txt>
          <Txt variant="small" color="rgba(255, 255, 255, 0.86)" numberOfLines={2}>
            {text(consult.description)}
          </Txt>
          <Txt variant="smallStrong" color="#FFFFFF" style={{ marginTop: 4 }}>
            {`${t('common.minutes', { n: consult.minutes })} · ${t('clinic.price.free')}`}
          </Txt>
        </View>
      </View>
    </PressableScale>
  );
}

/**
 * The treatments as a mosaic of photo cards in staggered columns (two on a phone, four on a computer),
 * each card arriving a moment after the one before.
 */
function Mosaic({ treatments, location }: { treatments: Treatment[]; location: LocationId }) {
  const { wide } = useLayout();
  const columns = wide ? 4 : 2;
  const tall = wide ? 340 : 250;
  const short = wide ? 280 : 200;
  return (
    <View style={{ flexDirection: 'row', gap: wide ? 20 : 12, alignItems: 'flex-start' }}>
      {Array.from({ length: columns }, (_, column) => (
        <View key={column} style={{ flex: 1, gap: wide ? 20 : 12 }}>
          {treatments
            .map((tr, index) => ({ tr, index }))
            .filter(({ index }) => index % columns === column)
            .map(({ tr, index }) => (
              <FadeIn key={tr.id} delay={Math.min(index, 10) * 60}>
                <TreatmentCard treatment={tr} location={location} compact height={(Math.floor(index / columns) + column) % 2 === 0 ? tall : short} />
              </FadeIn>
            ))}
        </View>
      ))}
    </View>
  );
}
