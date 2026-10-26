import {
  BEFORE_AFTER,
  CONCERNS,
  LASER_ZONES,
  packagePrice,
  productsAfter,
  TREATMENTS,
  treatmentInfo,
  type Treatment,
  type TreatmentInfo,
} from '@pure-clinics/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Button } from '@/components/Button';
import { Deck } from '@/components/Deck';
import { Glass } from '@/components/Glass';
import { ParallaxPhoto, useLightStatusBar } from '@/components/Hero';
import { Icon, type IconName } from '@/components/Icon';
import { FadeIn, nativeDriver, PressableScale, Stagger } from '@/components/Motion';
import { ProductCard } from '@/components/ProductCard';
import { Footer, Rail, Screen, useScrollY } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { DETAIL_WIDTH, startEdge, useLayout } from '@/layout';
import { useTheme } from '@/theme';

export default function TreatmentScreen() {
  const { id, location } = useLocalSearchParams<{ id: string; location?: string }>();
  const treatment = TREATMENTS.find((tr) => tr.id === id);
  if (!treatment) return <Redirect href="/boeken" />;
  return <TreatmentDetail treatment={treatment} location={location} />;
}

/** Everything about one treatment before booking it: what it is, how it goes, what it costs and what to expect. */
function TreatmentDetail({ treatment, location }: { treatment: Treatment; location?: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const { t, text, euro } = useI18n();
  const info = treatmentInfo(treatment.id);
  const helps = CONCERNS.filter((c) => c.treatments.includes(treatment.id));
  const products = productsAfter(treatment.id);
  // A free intake first makes sense for skin treatments, not for the intake itself or the beauty studio.
  const intakeFirst = treatment.id !== 'consult' && treatment.category !== 'beauty';
  const price = treatment.priceFrom ? t('clinic.price.from', { price: euro(treatment.priceFrom) }) : t('clinic.price.free');
  const heroHeight = wide ? 460 : 470 + insets.top;
  const book = () => router.push({ pathname: '/afspraak/[treatmentId]', params: { treatmentId: treatment.id, ...(location ? { location } : {}) } });

  const footer = (
    <Footer>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color={theme.c.muted}>
            {t('common.minutes', { n: treatment.minutes })}
          </Txt>
          <Txt variant="heading" numberOfLines={1}>
            {price}
          </Txt>
        </View>
        <Button label={t('clinic.info.book')} iconAfter="arrow" onPress={book} style={{ flex: 1.25 }} />
      </View>
    </Footer>
  );

  return (
    <Screen
      padded={false}
      gap={0}
      bottomSpace={24}
      contentStyle={{ paddingTop: 0 }}
      footer={footer}
      enter={false}
      photoTop={wide ? undefined : heroHeight}
      overlay={wide ? null : <CompactBar title={text(treatment.name)} heroHeight={heroHeight} />}
    >
      <Hero treatment={treatment} height={heroHeight} price={price} />

      {/* The page itself slides up over the photo like a sheet. */}
      <View
        style={{
          marginTop: wide ? 0 : -28,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          backgroundColor: theme.c.bg,
          paddingHorizontal: 20,
          paddingTop: wide ? 32 : 28,
          gap: 30,
        }}
      >
        <Stagger start={220} step={80}>
          <Txt variant="body" color={theme.c.ink} style={{ fontSize: 16, lineHeight: 25 }}>
            {text(info?.intro ?? treatment.description)}
          </Txt>

          <Facts treatment={treatment} info={info} price={price} />

          {intakeFirst ? (
            <PressableScale
              onPress={() => router.push({ pathname: '/afspraak/[treatmentId]', params: { treatmentId: 'consult', ...(location ? { location } : {}) } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: theme.r.card, backgroundColor: theme.c.ink }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="sparkle" size={19} color={theme.c.gold} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyStrong" color="#FFFFFF">
                  {t('clinic.info.intakeFirst')}
                </Txt>
                <Txt variant="small" color="rgba(255, 255, 255, 0.7)">
                  {t('clinic.home.consultBody')}
                </Txt>
              </View>
              <Icon name="chevron" size={18} color="#FFFFFF" />
            </PressableScale>
          ) : null}

          {helps.length > 0 ? (
            <Section title={t('clinic.info.helps')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {helps.map((c) => (
                  <PressableScale
                    key={c.id}
                    accessibilityRole="link"
                    onPress={() => router.navigate({ pathname: '/boeken', params: { concern: c.id, at: String(Date.now()) } })}
                    style={{ height: 38, paddingHorizontal: 14, borderRadius: 12, backgroundColor: theme.c.surface, justifyContent: 'center', boxShadow: theme.shadow.card }}
                  >
                    <Txt variant="smallStrong">{t(`clinic.concern.${c.id}`)}</Txt>
                  </PressableScale>
                ))}
              </View>
            </Section>
          ) : null}

          {info ? (
            <Section title={t('clinic.info.how')}>
              <Txt variant="body" color={theme.c.ink}>
                {text(info.how)}
              </Txt>
            </Section>
          ) : null}

          {treatment.id === 'laser' ? <ZonePrices /> : null}

          {info?.results ? (
            <Section title={t('clinic.info.results')}>
              <Txt variant="body" color={theme.c.ink}>
                {text(info.results)}
              </Txt>
            </Section>
          ) : null}

          <BeforeAfter treatment={treatment} />

          {info?.aftercare?.length ? (
            <Section title={t('clinic.info.aftercare')}>
              <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 16, gap: 14, boxShadow: theme.shadow.card }}>
                {info.aftercare.map((tip) => (
                  <View key={tip.nl} style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: theme.c.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="check" size={14} strokeWidth={2.2} />
                    </View>
                    <Txt variant="body" style={{ flex: 1 }}>
                      {text(tip)}
                    </Txt>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {treatment.insurable ? (
            <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: theme.r.control, backgroundColor: theme.c.sand }}>
              <Icon name="wallet" size={18} color={theme.c.primary} />
              <Txt variant="small" color={theme.c.ink} style={{ flex: 1 }}>
                {t('clinic.book.insurance')}
              </Txt>
            </View>
          ) : null}

          {products.length > 0 ? (
            <Section title={t('clinic.info.products')}>
              <Rail gap={12}>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} width={150} />
                ))}
              </Rail>
            </Section>
          ) : null}

          {info?.faq?.length ? (
            <Section title={t('clinic.info.faq')}>
              <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, paddingHorizontal: 16, boxShadow: theme.shadow.card }}>
                {info.faq.map((item, index) => (
                  <Question key={item.q.nl} q={text(item.q)} a={text(item.a)} first={index === 0} />
                ))}
              </View>
            </Section>
          ) : null}
        </Stagger>
      </View>
    </Screen>
  );
}

/** The photo the tapped card grew into, with the treatment's name over it and a few facts on glass. */
function Hero({ treatment, height, price }: { treatment: Treatment; height: number; price: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const { t, text } = useI18n();
  useLightStatusBar(wide ? 0 : height);
  return (
    <ParallaxPhoto photo={treatment.photo} height={height} morph radius={wide ? 28 : 0}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id="heroShade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#141210" stopOpacity={0.35} />
            <Stop offset="0.3" stopColor="#141210" stopOpacity={0} />
            <Stop offset="0.55" stopColor="#141210" stopOpacity={0.05} />
            <Stop offset="1" stopColor="#141210" stopOpacity={0.72} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#heroShade)" />
      </Svg>
      {wide ? (
        <View style={{ position: 'absolute', top: 18, ...startEdge(theme.rtl, 18) }}>
          <BackButton />
        </View>
      ) : null}
      <View style={{ position: 'absolute', start: 20, end: 20, bottom: wide ? 28 : 48, gap: 12 }}>
        <FadeIn delay={380} distance={14}>
          <View style={{ gap: 6 }}>
            <Txt variant="eyebrow" color="rgba(255, 255, 255, 0.86)">
              {t(`clinic.cat.${treatment.category}`)}
            </Txt>
            <Txt variant="hero" color="#FFFFFF" accentColor="#FFFFFF" style={{ fontSize: 46, lineHeight: 48 }}>
              {text(treatment.name)}
            </Txt>
          </View>
        </FadeIn>
        <FadeIn delay={520} distance={10}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <HeroChip icon="clock" label={t('common.minutes', { n: treatment.minutes })} />
            <HeroChip icon="wallet" label={price} />
            {treatment.insurable ? <HeroChip icon="check" label={t('clinic.book.insurable')} /> : null}
          </View>
        </FadeIn>
      </View>
    </ParallaxPhoto>
  );
}

function HeroChip({ icon, label }: { icon: IconName; label: string }) {
  const theme = useTheme();
  return (
    <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 11, borderRadius: 11 }}>
      <Icon name={icon} size={14} />
      <Txt variant="caption" style={{ fontFamily: theme.f.medium, fontSize: 12 }}>
        {label}
      </Txt>
    </Glass>
  );
}

function BackButton() {
  const { t } = useI18n();
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityLabel={t('common.back')}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/boeken'))}
      style={{ borderRadius: 14 }}
    >
      <Glass style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }} interactive>
        <Icon name="back" size={20} />
      </Glass>
    </PressableScale>
  );
}

/** Once the photo has scrolled away, a pane of glass with the treatment's name settles in at the top. */
function CompactBar({ title, heroHeight }: { title: string; heroHeight: number }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useScrollY();
  const shown = scrollY.interpolate({ inputRange: [heroHeight - insets.top - 140, heroHeight - insets.top - 70], outputRange: [0, 1], extrapolate: 'clamp' });
  return (
    <>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, start: 0, end: 0, opacity: shown }}>
        <Glass style={{ borderWidth: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(30, 30, 28, 0.08)' }}>
          <View style={{ height: insets.top + 60, paddingTop: insets.top, paddingHorizontal: 72, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{ transform: [{ translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
              <Txt variant="heading" numberOfLines={1}>
                {title}
              </Txt>
            </Animated.View>
          </View>
        </Glass>
      </Animated.View>
      <View style={{ position: 'absolute', top: insets.top + 8, ...startEdge(theme.rtl, 16) }}>
        <BackButton />
      </View>
    </>
  );
}

/** The clinic's own before-and-after photos for this treatment, as a deck to flick through. */
function BeforeAfter({ treatment }: { treatment: Treatment }) {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide, inner } = useLayout();
  const { width } = useWindowDimensions();
  const photos = BEFORE_AFTER[treatment.id] ?? [];
  if (!photos.length) return null;
  return (
    <Section title={t('clinic.info.results2')}>
      <Deck photos={photos} width={wide ? inner(DETAIL_WIDTH) : width - 40} nextLabel={t('clinic.results.next')} />
      <Txt variant="small" color={theme.c.muted}>
        {t('clinic.info.results2Note')}
      </Txt>
    </Section>
  );
}

/** Duration, number of sessions, time between them, recovery and price, as tiles to swipe through. */
function Facts({ treatment, info, price }: { treatment: Treatment; info: TreatmentInfo | undefined; price: string }) {
  const theme = useTheme();
  const { wide } = useLayout();
  const { t, text } = useI18n();
  type Fact = { icon: IconName; label: string; value: string };
  const all: (Fact | null)[] = [
    { icon: 'clock', label: t('clinic.info.minutes'), value: t('common.minutes', { n: treatment.minutes }) },
    info?.sessions ? { icon: 'list', label: t('clinic.info.sessions'), value: text(info.sessions) } : null,
    info?.interval ? { icon: 'calendar', label: t('clinic.info.interval'), value: text(info.interval) } : null,
    info?.downtime ? { icon: 'leaf', label: t('clinic.info.downtime'), value: text(info.downtime) } : null,
    { icon: 'wallet', label: t('clinic.info.price'), value: price },
  ];
  const facts = all.filter((f): f is Fact => f !== null);
  const tiles = facts.map((f) => (
    <View
      key={f.label}
      style={{ width: wide ? undefined : 148, flex: wide ? 1 : undefined, padding: 14, gap: 10, borderRadius: 20, backgroundColor: theme.c.surface, boxShadow: theme.shadow.card }}
    >
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: theme.c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={f.icon} size={17} />
      </View>
      <View style={{ gap: 2 }}>
        <Txt variant="caption" color={theme.c.muted}>
          {f.label}
        </Txt>
        <Txt variant="bodyStrong">{f.value}</Txt>
      </View>
    </View>
  ));
  if (wide) return <View style={{ flexDirection: 'row', gap: 10 }}>{tiles}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingVertical: 6 }}>
      {tiles}
    </ScrollView>
  );
}

/** Laser is priced per zone (pureclinics.nl/tarieven); the 5+1 package makes each time a sixth cheaper. */
function ZonePrices() {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  return (
    <Section title={t('clinic.info.zones')}>
      <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, paddingHorizontal: 16, boxShadow: theme.shadow.card }}>
        {LASER_ZONES.map((zone, index) => (
          <View
            key={zone.id}
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 12,
              paddingVertical: 12,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: theme.c.line,
            }}
          >
            <Txt variant="body" style={{ flex: 1 }}>
              {text(zone.name)}
            </Txt>
            <Txt variant="small" color={theme.c.muted}>
              {t('clinic.info.zonePackage', { price: euro(packagePrice(zone.price)) })}
            </Txt>
            <Txt variant="bodyStrong" style={{ minWidth: 56, textAlign: 'right' }}>
              {euro(zone.price)}
            </Txt>
          </View>
        ))}
      </View>
      <Txt variant="small" color={theme.c.muted}>
        {t('clinic.zones.hint')}
      </Txt>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 14 }}>
      <Txt variant="title">{title}</Txt>
      {children}
    </View>
  );
}

/** A question that opens to its answer; the chevron turns as it opens. */
function Question({ q, a, first }: { q: string; a: string; first: boolean }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const turn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(turn, { toValue: open ? 1 : 0, speed: 20, bounciness: 6, useNativeDriver: nativeDriver }).start();
  }, [open, turn]);
  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderTopColor: theme.c.line }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, opacity: pressed ? 0.8 : 1 })}
      >
        <Txt variant="bodyStrong" style={{ flex: 1 }}>
          {q}
        </Txt>
        <Animated.View style={{ transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
          <Icon name="chevronDown" size={18} color={theme.c.muted} />
        </Animated.View>
      </Pressable>
      {open ? (
        <FadeIn distance={6} duration={420}>
          <Txt variant="body" color={theme.c.muted} style={{ paddingBottom: 16 }}>
            {a}
          </Txt>
        </FadeIn>
      ) : null}
    </View>
  );
}
