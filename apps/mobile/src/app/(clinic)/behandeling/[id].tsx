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
} from '@pure-ivy/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/Badge';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { ProductCard } from '@/components/ProductCard';
import { Footer, Rail, Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { DETAIL_WIDTH, useLayout } from '@/layout';
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
  const { t, text, euro } = useI18n();
  const info = treatmentInfo(treatment.id);
  const helps = CONCERNS.filter((c) => c.treatments.includes(treatment.id));
  const products = productsAfter(treatment.id);
  // A free intake first makes sense for skin treatments, not for the intake itself or the beauty studio.
  const intakeFirst = treatment.id !== 'consult' && treatment.category !== 'beauty';
  const price = treatment.priceFrom ? t('ivy.price.from', { price: euro(treatment.priceFrom) }) : t('ivy.price.free');

  const footer = (
    <Footer>
      <Button
        label={t('ivy.info.book')}
        iconAfter="arrow"
        onPress={() => router.push({ pathname: '/afspraak/[treatmentId]', params: { treatmentId: treatment.id, ...(location ? { location } : {}) } })}
      />
    </Footer>
  );

  return (
    <Screen padded={false} gap={0} bottomSpace={24} contentStyle={{ paddingTop: 0 }} footer={footer}>
      <Photo photo={treatment.photo} style={{ height: 300 + insets.top }}>
        <View style={{ position: 'absolute', top: insets.top + 8, start: 16 }}>
          <IconButton icon="back" label={t('common.back')} tone="surface" onPress={() => router.back()} />
        </View>
      </Photo>

      <View style={{ padding: 20, gap: 24 }}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Txt variant="eyebrow" color={theme.c.muted}>
              {t(`ivy.cat.${treatment.category}`)}
            </Txt>
            {treatment.insurable ? <Badge label={t('ivy.book.insurable')} tone="outline" /> : null}
          </View>
          <Txt variant="display">{text(treatment.name)}</Txt>
          <Txt variant="body" color={theme.c.ink}>
            {text(info?.intro ?? treatment.description)}
          </Txt>
        </View>

        <Facts treatment={treatment} info={info} price={price} />

        {intakeFirst ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/afspraak/[treatmentId]', params: { treatmentId: 'consult', ...(location ? { location } : {}) } })}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: theme.r.card,
              backgroundColor: theme.c.sand,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Icon name="sparkle" size={20} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="bodyStrong">{t('ivy.info.intakeFirst')}</Txt>
              <Txt variant="small" color={theme.c.muted}>
                {t('ivy.home.consultBody')}
              </Txt>
            </View>
            <Icon name="chevron" size={18} color={theme.c.muted} />
          </Pressable>
        ) : null}

        {helps.length > 0 ? (
          <Section title={t('ivy.info.helps')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {helps.map((c) => (
                <Pressable
                  key={c.id}
                  accessibilityRole="link"
                  onPress={() => router.navigate({ pathname: '/boeken', params: { concern: c.id, at: String(Date.now()) } })}
                  style={({ pressed }) => ({
                    height: 34,
                    paddingHorizontal: 12,
                    borderRadius: theme.r.chip,
                    backgroundColor: theme.c.sand,
                    justifyContent: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Txt variant="smallStrong">{t(`ivy.concern.${c.id}`)}</Txt>
                </Pressable>
              ))}
            </View>
          </Section>
        ) : null}

        {info ? (
          <Section title={t('ivy.info.how')}>
            <Txt variant="body" color={theme.c.ink}>
              {text(info.how)}
            </Txt>
          </Section>
        ) : null}

        {treatment.id === 'laser' ? <ZonePrices /> : null}

        {info?.results ? (
          <Section title={t('ivy.info.results')}>
            <Txt variant="body" color={theme.c.ink}>
              {text(info.results)}
            </Txt>
          </Section>
        ) : null}

        <BeforeAfter treatment={treatment} />

        {info?.aftercare?.length ? (
          <Section title={t('ivy.info.aftercare')}>
            <View style={{ gap: 10 }}>
              {info.aftercare.map((tip) => (
                <View key={tip.nl} style={{ flexDirection: 'row', gap: 10 }}>
                  <Icon name="check" size={17} strokeWidth={2.2} />
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
              {t('ivy.book.insurance')}
            </Txt>
          </View>
        ) : null}

        {products.length > 0 ? (
          <Section title={t('ivy.info.products')}>
            <Rail gap={12}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} width={148} />
              ))}
            </Rail>
          </Section>
        ) : null}

        {info?.faq?.length ? (
          <Section title={t('ivy.info.faq')}>
            <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, paddingHorizontal: 16 }}>
              {info.faq.map((item, index) => (
                <Question key={item.q.nl} q={text(item.q)} a={text(item.a)} first={index === 0} />
              ))}
            </View>
          </Section>
        ) : null}
      </View>
    </Screen>
  );
}

/** The clinic's own before-and-after photos for this treatment, side by side to swipe through. */
function BeforeAfter({ treatment }: { treatment: Treatment }) {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide, inner } = useLayout();
  const photos = BEFORE_AFTER[treatment.id] ?? [];
  if (!photos.length) return null;
  // The photos are 800 × 434; one fills the column on a computer, and the next one peeks in on a phone.
  const width = photos.length === 1 || wide ? inner(DETAIL_WIDTH) : 300;
  return (
    <Section title={t('ivy.info.results2')}>
      <Rail gap={12}>
        {photos.map((photo) => (
          <Photo key={photo} photo={photo} style={{ width, height: Math.round((width * 434) / 800), borderRadius: theme.r.photo }} />
        ))}
      </Rail>
      <Txt variant="small" color={theme.c.muted}>
        {t('ivy.info.results2Note')}
      </Txt>
    </Section>
  );
}

/** Duration, number of sessions, time between them and recovery, as four small tiles; then the price. */
function Facts({ treatment, info, price }: { treatment: Treatment; info: TreatmentInfo | undefined; price: string }) {
  const theme = useTheme();
  const { t, text } = useI18n();
  const facts = [
    { label: t('ivy.info.minutes'), value: t('common.minutes', { n: treatment.minutes }) },
    info?.sessions ? { label: t('ivy.info.sessions'), value: text(info.sessions) } : null,
    info?.interval ? { label: t('ivy.info.interval'), value: text(info.interval) } : null,
    info?.downtime ? { label: t('ivy.info.downtime'), value: text(info.downtime) } : null,
    { label: t('ivy.info.price'), value: price },
  ].filter((f): f is { label: string; value: string } => f !== null);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {facts.map((f) => (
        <View key={f.label} style={{ flexBasis: '47%', flexGrow: 1, padding: 14, gap: 4, borderRadius: theme.r.control, backgroundColor: theme.c.surface }}>
          <Txt variant="caption" color={theme.c.muted}>
            {f.label}
          </Txt>
          <Txt variant="bodyStrong">{f.value}</Txt>
        </View>
      ))}
    </View>
  );
}

/** Laser is priced per zone (pureclinics.nl/tarieven); the 5+1 package makes each time a sixth cheaper. */
function ZonePrices() {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  return (
    <Section title={t('ivy.info.zones')}>
      <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, paddingHorizontal: 16 }}>
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
              {t('ivy.info.zonePackage', { price: euro(packagePrice(zone.price)) })}
            </Txt>
            <Txt variant="bodyStrong" style={{ minWidth: 56, textAlign: 'right' }}>
              {euro(zone.price)}
            </Txt>
          </View>
        ))}
      </View>
      <Txt variant="small" color={theme.c.muted}>
        {t('ivy.zones.hint')}
      </Txt>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Txt variant="eyebrow" color={theme.c.muted}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

/** A question that opens to its answer. */
function Question({ q, a, first }: { q: string; a: string; first: boolean }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderTopColor: theme.c.line }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, opacity: pressed ? 0.8 : 1 })}
      >
        <Txt variant="bodyStrong" style={{ flex: 1 }}>
          {q}
        </Txt>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon name="chevronDown" size={18} color={theme.c.muted} />
        </View>
      </Pressable>
      {open ? (
        <Txt variant="body" color={theme.c.muted} style={{ paddingBottom: 14 }}>
          {a}
        </Txt>
      ) : null}
    </View>
  );
}
