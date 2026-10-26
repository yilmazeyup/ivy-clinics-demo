import {
  CONCERNS,
  DEALS,
  LASER_SERIES,
  locationById,
  MEMBER,
  PURE_CLINICS,
  specialistById,
  timeOfDay,
  treatmentById,
  type Concern,
  type Deal,
  type PhotoKey,
  type TreatmentId,
} from '@pure-clinics/shared';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { DepthCarousel } from '@/components/Carousel';
import { Deck } from '@/components/Deck';
import { Glass } from '@/components/Glass';
import { ParallaxPhoto, SkyShade, skyPhase, useLightStatusBar } from '@/components/Hero';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale, useCountUp } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { PureLogo } from '@/components/PureLogo';
import { Screen } from '@/components/Screen';
import { SessionRing } from '@/components/SessionRing';
import { SkinScan } from '@/components/SkinScan';
import { TreatmentCard } from '@/components/TreatmentCard';
import { Txt } from '@/components/Txt';
import { cityName, useClinic, type AppointmentView } from '@/clinic';
import { useI18n } from '@/i18n';
import { PAGE_WIDTH, useLayout } from '@/layout';
import { useTheme } from '@/theme';

const POPULAR: TreatmentId[] = ['laser', 'acne', 'couperose', 'pigment', 'skinpen', 'prx', 'facial'];
const RESULTS: { photo: PhotoKey; treatment: TreatmentId }[] = [
  { photo: 'ba-acne-1', treatment: 'acne' },
  { photo: 'ba-couperose-1', treatment: 'couperose' },
  { photo: 'ba-pigment-1', treatment: 'pigment' },
  { photo: 'ba-ipl-1', treatment: 'ipl' },
  { photo: 'ba-xlhair-1', treatment: 'xlhair' },
];

export default function HomeScreen() {
  const { wide } = useLayout();
  return wide ? <WideHome /> : <PhoneHome />;
}

/** The photo at the top takes most of the first screen on a phone, never less than 560 points. */
const phoneHeroHeight = (screen: number) => Math.round(Math.min(Math.max(screen * 0.74, 560), 680));

function PhoneHome() {
  const { height } = useWindowDimensions();
  const hero = phoneHeroHeight(height);
  return (
    <Screen padded={false} gap={36} tabs contentStyle={{ paddingTop: 0 }} photoTop={hero}>
      <Hero height={hero} />
      <Block>
        <QuickActions />
      </Block>
      <Block>
        <Journey />
      </Block>
      <Block>
        <ScanBanner />
      </Block>
      <Block>
        <Popular />
      </Block>
      <Block>
        <Concerns />
      </Block>
      <Block>
        <Deals />
      </Block>
      <Block>
        <Results />
      </Block>
      <Block>
        <Consult />
      </Block>
      <Block>
        <Facts />
      </Block>
    </Screen>
  );
}

/** A computer screen: the same parts as on the phone, laid out side by side like a website. */
function WideHome() {
  return (
    <Screen gap={48} width="page" tabs>
      <Hero height={540} />
      <QuickActions />
      <View style={{ flexDirection: 'row', gap: 24 }}>
        <View style={{ flex: 1 }}>
          <Journey />
        </View>
        <View style={{ flex: 1 }}>
          <ScanBanner />
        </View>
      </View>
      <Popular />
      <Concerns />
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Deals />
        </View>
        <View style={{ flex: 1 }}>
          <Results />
        </View>
      </View>
      <Consult />
      <Facts />
    </Screen>
  );
}

function Block({ children }: { children: ReactNode }) {
  return <View style={{ paddingHorizontal: 20 }}>{children}</View>;
}

function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: { label: string; onPress: () => void } }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
      <View style={{ flex: 1, gap: 6 }}>
        {eyebrow ? (
          <Txt variant="eyebrow" color={theme.c.muted}>
            {eyebrow}
          </Txt>
        ) : null}
        <Txt variant="title">{title}</Txt>
      </View>
      {action ? (
        <PressableScale onPress={action.onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 }}>
          <Txt variant="smallStrong">{action.label}</Txt>
          <Icon name="chevron" size={15} />
        </PressableScale>
      ) : null}
    </View>
  );
}

/**
 * The opening view: the clinic's photo from the intro, tinted like the sky outside right now, with the greeting
 * and the next appointment on a pane of glass. The photo drifts slower than the page when you scroll.
 */
function Hero({ height }: { height: number }) {
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const { t, dayLong, time } = useI18n();
  const clinic = useClinic();
  const phase = skyPhase(clinic.now);
  useLightStatusBar(wide ? 0 : height);
  const greeting = t(`clinic.greeting.${timeOfDay(clinic.now)}`, { name: MEMBER.firstName });

  return (
    <ParallaxPhoto photo="pc-intro" height={height} position={{ left: '54%', top: '50%' }} radius={wide ? 28 : 0}>
      <SkyShade phase={phase} />
      {wide ? null : (
        <View style={{ position: 'absolute', top: insets.top + 14, start: 20, end: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <PureLogo width={150} color="#FFFFFF" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <GlassIcon icon="bell" label={t('common.notifications')} />
            <GlassIcon icon="user" label={t('common.settings')} onPress={() => router.push('/settings')} />
          </View>
        </View>
      )}
      <View
        style={[
          { position: 'absolute', start: 20, end: 20, bottom: 20, gap: 18 },
          wide ? { start: 44, end: 44, bottom: 40, flexDirection: 'row', alignItems: 'flex-end', gap: 40 } : null,
        ]}
      >
        <View style={{ gap: 10, flex: wide ? 1 : undefined }}>
          <Txt variant="eyebrow" color="rgba(255, 255, 255, 0.82)">
            {`${dayLong(clinic.now)} · ${time(clinic.now)} · ${t(`clinic.sky.${phase}`)}`}
          </Txt>
          <Txt variant="hero" color="#FFFFFF" accentColor="#FFFFFF" style={wide ? { fontSize: 64, lineHeight: 66 } : { fontSize: 50, lineHeight: 52 }}>
            {greeting}
          </Txt>
        </View>
        <View style={wide ? { width: 420 } : undefined}>
          {clinic.next ? <NextCard appointment={clinic.next} /> : <NoNextCard />}
        </View>
      </View>
    </ParallaxPhoto>
  );
}

function GlassIcon({ icon, label, onPress }: { icon: IconName; label: string; onPress?: () => void }) {
  return (
    <PressableScale accessibilityLabel={label} onPress={onPress} style={{ borderRadius: 14 }}>
      <Glass style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }} interactive>
        <Icon name={icon} size={20} />
      </Glass>
    </PressableScale>
  );
}

/** The next appointment as a live card: what, when, with whom, and how long until then. */
function NextCard({ appointment }: { appointment: AppointmentView }) {
  const theme = useTheme();
  const { t, text, relativeDay, time, fromNow } = useI18n();
  return (
    <PressableScale onPress={() => router.navigate('/mijn')} accessibilityLabel={t('clinic.home.next')} style={{ borderRadius: 22 }}>
      <Glass style={{ borderRadius: 22, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }} interactive>
        <Photo photo={appointment.treatment.photo} style={{ width: 60, height: 68, borderRadius: 14 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="eyebrow" color={theme.c.muted} style={{ fontSize: 10 }}>
            {t('clinic.home.next')}
          </Txt>
          <Txt variant="heading" numberOfLines={1}>
            {text(appointment.treatment.name)}
          </Txt>
          <Txt variant="small" color={theme.c.muted} numberOfLines={1}>
            {`${relativeDay(appointment.start)} · ${time(appointment.start)} · ${appointment.specialist.name} · ${cityName(appointment.location)}`}
          </Txt>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: theme.c.ink, marginEnd: 4 }}>
          <Txt variant="caption" color="#FFFFFF" style={{ fontFamily: theme.f.medium }} numberOfLines={1}>
            {fromNow(appointment.start)}
          </Txt>
        </View>
      </Glass>
    </PressableScale>
  );
}

function NoNextCard() {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <PressableScale onPress={() => router.push('/afspraak/consult')} style={{ borderRadius: 22 }}>
      <Glass style={{ borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }} interactive>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">{t('clinic.home.noNext')}</Txt>
          <Txt variant="small" color={theme.c.muted}>
            {t('clinic.home.consultCta')}
          </Txt>
        </View>
        <Icon name="arrow" size={18} />
      </Glass>
    </PressableScale>
  );
}

/** Four shortcuts to what members do most. */
function QuickActions() {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide } = useLayout();
  const actions: { icon: IconName; label: string; go: () => void }[] = [
    { icon: 'sparkle', label: t('clinic.quick.scan'), go: () => router.push('/advies') },
    { icon: 'calendarPlus', label: t('clinic.quick.intake'), go: () => router.push('/afspraak/consult') },
    { icon: 'mic', label: t('clinic.quick.assistant'), go: () => router.push('/assistent') },
    { icon: 'gift', label: t('clinic.quick.deals'), go: () => router.push({ pathname: '/afspraak/[treatmentId]', params: { treatmentId: 'laser' } }) },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {actions.map((a) => (
        <PressableScale
          key={a.label}
          onPress={a.go}
          accessibilityLabel={a.label}
          style={[
            { flex: 1, minHeight: 96, borderRadius: 20, backgroundColor: theme.c.surface, boxShadow: theme.shadow.card, padding: 12, justifyContent: 'space-between', gap: 10 },
            // A computer screen has room to set the icon beside its label.
            wide ? { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 14, paddingHorizontal: 16 } : null,
          ]}
        >
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.c.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={a.icon} size={19} />
          </View>
          <Txt variant="smallStrong" numberOfLines={2} style={wide ? { fontSize: 15 } : { fontSize: 12.5, lineHeight: 16 }}>
            {a.label}
          </Txt>
        </PressableScale>
      ))}
    </View>
  );
}

/** Six weeks after a laser session: the series as a ring, and the next session with the same skin therapist. */
function Journey() {
  const theme = useTheme();
  const { t, text, time, relativeDayInline } = useI18n();
  const { followUp } = useClinic();
  const { wide } = useLayout();
  if (!followUp) return null;
  const specialist = specialistById(followUp.slot.specialistId);
  const location = locationById(followUp.locationId);
  return (
    <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 18, gap: 16, boxShadow: theme.shadow.card, flex: wide ? 1 : undefined }}>
      <Txt variant="eyebrow" color={theme.c.muted}>
        {t('clinic.journey.eyebrow', { treatment: text(followUp.treatment.name) })}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <SessionRing done={followUp.session - 1} total={LASER_SERIES} caption={t('clinic.journey.of', { total: LASER_SERIES })} />
        <View style={{ flex: 1, gap: 6 }}>
          <Txt variant="title">{t('clinic.home.followUpTitle')}</Txt>
          <Txt variant="small" color={theme.c.muted}>
            {t('clinic.home.followUpEyebrow', { n: followUp.weeksAgo })}
          </Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: theme.c.bg }}>
        <Icon name="clock" size={18} color={theme.c.highlight} />
        <Txt variant="small" style={{ flex: 1 }}>
          {t('clinic.journey.slot', {
            name: specialist.name,
            when: `${relativeDayInline(followUp.slot.start)} ${time(followUp.slot.start)}`,
            city: cityName(location),
          })}
        </Txt>
      </View>
      <Button
        label={t('clinic.home.followUpCta')}
        iconAfter="arrow"
        onPress={() =>
          router.push({
            pathname: '/afspraak/[treatmentId]',
            params: { treatmentId: followUp.treatment.id, specialist: specialist.id, location: location.id, slot: String(followUp.slot.start.getTime()) },
          })
        }
      />
    </View>
  );
}

/** The AI skin scan, previewed: the light keeps sweeping over a face. */
function ScanBanner() {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide } = useLayout();
  return (
    <PressableScale
      onPress={() => router.push('/advies')}
      accessibilityLabel={t('clinic.home.aiTitle').replace(/\*/g, '')}
      style={{ borderRadius: theme.r.card, backgroundColor: theme.c.ink, padding: 12, flexDirection: 'row', gap: 16, alignItems: 'center', boxShadow: theme.shadow.lift, flex: wide ? 1 : undefined }}
    >
      <SkinScan width={wide ? 150 : 118} height={wide ? 190 : 150} preview />
      <View style={{ flex: 1, gap: 8, paddingEnd: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="sparkle" size={14} color={theme.c.gold} />
          <Txt variant="eyebrow" color={theme.c.gold}>
            {t('clinic.home.aiEyebrow')}
          </Txt>
        </View>
        <Txt variant="title" color="#FFFFFF" accentColor="#FFFFFF">
          {t('clinic.home.aiTitle')}
        </Txt>
        <Txt variant="small" color="rgba(255, 255, 255, 0.7)">
          {t('clinic.home.aiBody')}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Txt variant="smallStrong" color="#FFFFFF">
            {t('clinic.scan.cta')}
          </Txt>
          <Icon name="arrow" size={15} color="#FFFFFF" />
        </View>
      </View>
    </PressableScale>
  );
}

function Popular() {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const { wide } = useLayout();
  const treatments = POPULAR.map(treatmentById);
  const cardWidth = Math.min(width * 0.68, 290);
  return (
    <View>
      <SectionTitle eyebrow={t('clinic.popular.eyebrow')} title={t('clinic.popular.title')} action={{ label: t('clinic.popular.all'), onPress: () => router.navigate('/boeken') }} />
      <DepthCarousel
        items={wide ? treatments.slice(0, 4) : treatments}
        itemWidth={cardWidth}
        keyOf={(tr) => tr.id}
        render={(tr) => <TreatmentCard treatment={tr} height={wide ? 380 : Math.round(cardWidth * 1.3)} />}
      />
    </View>
  );
}

/** The eight skin concerns as a bento of photos: big and small tiles in a rhythm, like a magazine page. */
function Concerns() {
  const { t } = useI18n();
  const { wide } = useLayout();
  const [a, b, c, d, e, f, g, h] = CONCERNS;
  const tile = (concern: Concern, style: ViewStyle) => <ConcernTile key={concern.id} concern={concern} style={style} large={(style.flex ?? 1) > 1.2} />;
  if (wide) {
    return (
      <View>
        <SectionTitle title={t('clinic.home.concerns')} />
        <View style={{ flexDirection: 'row', gap: 14, height: 460 }}>
          {tile(a, { flex: 2 })}
          <View style={{ flex: 1, gap: 14 }}>
            {tile(b, { flex: 1 })}
            {tile(c, { flex: 1 })}
          </View>
          <View style={{ flex: 1, gap: 14 }}>
            {tile(d, { flex: 1 })}
            {tile(e, { flex: 1 })}
          </View>
          <View style={{ flex: 1, gap: 14 }}>
            {tile(f, { flex: 1 })}
            {tile(g, { flex: 1 })}
            {tile(h, { flex: 1 })}
          </View>
        </View>
      </View>
    );
  }
  return (
    <View>
      <SectionTitle title={t('clinic.home.concerns')} />
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10, height: 250 }}>
          {tile(a, { flex: 1.35 })}
          <View style={{ flex: 1, gap: 10 }}>
            {tile(b, { flex: 1 })}
            {tile(c, { flex: 1 })}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, height: 150 }}>
          {tile(d, { flex: 1 })}
          {tile(e, { flex: 1 })}
        </View>
        <View style={{ flexDirection: 'row', gap: 10, height: 250 }}>
          <View style={{ flex: 1, gap: 10 }}>
            {tile(f, { flex: 1 })}
            {tile(g, { flex: 1 })}
          </View>
          {tile(h, { flex: 1.35 })}
        </View>
      </View>
    </View>
  );
}

function ConcernTile({ concern, style, large }: { concern: Concern; style: ViewStyle; large?: boolean }) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <PressableScale
      accessibilityLabel={t(`clinic.concern.${concern.id}`)}
      onPress={() => router.navigate({ pathname: '/boeken', params: { concern: concern.id, at: String(Date.now()) } })}
      style={[{ borderRadius: theme.r.photo, overflow: 'hidden' }, style]}
    >
      <Photo photo={concern.photo} scrim style={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute', start: 14, end: 14, bottom: 12 }}>
        <Txt variant={large ? 'title' : 'heading'} color="#FFFFFF" numberOfLines={3} style={large ? undefined : { fontSize: 15, lineHeight: 19 }}>
          {t(`clinic.concern.${concern.id}`)}
        </Txt>
      </View>
    </PressableScale>
  );
}

/** The laser deals from pureclinics.nl/deals as cards to swipe, the price set large like a shop window. */
function Deals() {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  const { wide } = useLayout();
  const shown = (['women', 'men', 'students'] as const)
    .map((group) => DEALS.filter((d) => d.group === group).slice(0, group === 'women' ? 2 : 1))
    .flat()
    .filter((d): d is Deal => Boolean(d));
  const cards = shown.map((deal) => (
    <PressableScale
      key={deal.id}
      onPress={() => router.push({ pathname: '/afspraak/[treatmentId]', params: { treatmentId: 'laser', deal: deal.id } })}
      style={{ width: wide ? undefined : 250, height: 196, borderRadius: theme.r.card, overflow: 'hidden', boxShadow: theme.shadow.card }}
    >
      <Photo photo={deal.group === 'men' ? 'pc-laser' : deal.group === 'students' ? 'pc-epilation' : 'pc-smooth'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(24, 20, 16, 0.5)' }]} />
      <View style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}>
        <Glass tone="dark" style={{ alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Txt variant="caption" color="#FFFFFF" style={{ fontFamily: theme.f.medium }}>
            {t(`clinic.deals.${deal.group}`)}
          </Txt>
        </Glass>
        <View style={{ gap: 4 }}>
          <Txt variant="small" color="rgba(255, 255, 255, 0.86)" numberOfLines={2}>
            {text(deal.zones)}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Txt variant="hero" color="#FFFFFF" style={{ fontSize: 40, lineHeight: 44 }}>
              {euro(deal.price)}
            </Txt>
            {deal.was ? (
              <Txt variant="small" color="rgba(255, 255, 255, 0.7)" style={{ textDecorationLine: 'line-through' }}>
                {euro(deal.was)}
              </Txt>
            ) : null}
          </View>
        </View>
      </View>
    </PressableScale>
  ));
  return (
    <View>
      <SectionTitle eyebrow={t('clinic.deals.eyebrow')} title={t('clinic.deals.title')} />
      {wide ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {cards.map((card, i) => (
            <View key={i} style={{ flexBasis: '45%', flexGrow: 1 }}>
              {card}
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingVertical: 6 }}>
          {cards}
        </ScrollView>
      )}
      <Txt variant="caption" color={theme.c.muted} style={{ marginTop: 10 }}>
        {t('clinic.deals.note')}
      </Txt>
    </View>
  );
}

/** Real results: the clinic's own before-and-after photos as a deck to flick through. */
function Results() {
  const { t, text } = useI18n();
  const { width } = useWindowDimensions();
  const { wide } = useLayout();
  const deckWidth = wide ? Math.min((PAGE_WIDTH - 24) / 2, 560) : width - 40;
  return (
    <View>
      <SectionTitle eyebrow={t('clinic.results.eyebrow')} title={t('clinic.results.title')} />
      <Deck
        photos={RESULTS.map((r) => r.photo)}
        width={deckWidth}
        label={(photo) => {
          const match = RESULTS.find((r) => r.photo === photo);
          return match ? text(treatmentById(match.treatment).name) : undefined;
        }}
        nextLabel={t('clinic.results.next')}
      />
    </View>
  );
}

function Consult() {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide } = useLayout();
  return (
    <View style={{ height: wide ? 380 : 420, borderRadius: theme.r.card, overflow: 'hidden', boxShadow: theme.shadow.card }}>
      <Photo photo="pc-room" scrim position={{ top: '30%', left: '50%' }} style={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute', start: 20, end: 20, bottom: 20, gap: 10, maxWidth: 520 }}>
        <Txt variant="eyebrow" color="rgba(255, 255, 255, 0.82)">
          {t('clinic.home.consultEyebrow')}
        </Txt>
        <Txt variant="hero" color="#FFFFFF" accentColor="#FFFFFF" style={{ fontSize: 40, lineHeight: 42 }}>
          {t('clinic.home.consultTitle')}
        </Txt>
        <Txt variant="body" color="rgba(255, 255, 255, 0.86)">
          {t('clinic.home.consultBody')}
        </Txt>
        <Button kind="light" label={t('clinic.home.consultCta')} iconAfter="arrow" onPress={() => router.push('/afspraak/consult')} style={{ marginTop: 6, alignSelf: wide ? 'flex-start' : 'stretch' }} />
      </View>
    </View>
  );
}

/** The clinic's own numbers from pureclinics.nl, counting up, plus opening hours. */
function Facts() {
  const theme = useTheme();
  const { t, num } = useI18n();
  const clients = useCountUp(PURE_CLINICS.clients, { duration: 1800 });
  const years = useCountUp(PURE_CLINICS.years, { duration: 1400 });
  const facts = [
    { value: `${num(Math.round(clients))}+`, label: t('clinic.home.clients') },
    { value: String(Math.round(years)), label: t('clinic.home.years') },
    { value: '2', label: t('clinic.home.locations') },
  ];
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', backgroundColor: theme.c.surface, borderRadius: theme.r.card, paddingVertical: 22, boxShadow: theme.shadow.card }}>
        {facts.map((fact, index) => (
          <View key={fact.label} style={{ flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 6, borderStartWidth: index === 0 ? 0 : 1, borderColor: theme.c.line }}>
            <Txt variant="display" style={{ fontSize: 34, lineHeight: 38 }}>
              {fact.value}
            </Txt>
            <Txt variant="caption" color={theme.c.muted} align="center">
              {fact.label}
            </Txt>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon name="clock" size={15} color={theme.c.muted} />
        <Txt variant="small" color={theme.c.muted}>
          {t('clinic.hours')}
        </Txt>
      </View>
    </View>
  );
}
