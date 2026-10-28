import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { LookCard } from '@/components/LookCard';
import { Squish } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Rail, Screen, Section } from '@/components/Screen';
import { Tag } from '@/components/Sticker';
import { Ticket } from '@/components/Ticket';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { addOnById, locationBlanche, lookById, LOOKS, MEMBER, polishById, rewardById, STUDIO } from '@/data';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { useStudio, type BookingView } from '@/studio';
import { categoryColors, useTheme } from '@/theme';

/** Everything that is the member's own: bookings, saved looks, history, rewards, orders and the studio's details. */
export default function MineScreen() {
  const theme = useTheme();
  const { t, num, monthYear } = useI18nPlus();
  const { wide } = useLayout();
  const studio = useStudio();
  return (
    <Screen tabs width="page" gap={32}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 66,
            height: 66,
            borderRadius: 22,
            backgroundColor: theme.c.primary,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: '-4deg' }],
          }}
        >
          <Txt variant="display" color="#FFFFFF" style={{ fontSize: 40, lineHeight: 44 }}>
            {MEMBER.firstName[0]}
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="title">{`${MEMBER.firstName} ${MEMBER.lastName}`}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Tag label={`${studio.level.tier.name} · ${num(studio.points)} ${t('club.pts')}`} bg={theme.c.blush} color={theme.c.primary} icon="crown" />
            <Tag label={t('me.since', { date: monthYear(MEMBER.memberSince) })} />
          </View>
        </View>
        <IconButton icon="settings" label={t('settings.title')} tone="chalk" onPress={() => router.push('/instellingen')} />
      </View>

      <View style={wide ? { flexDirection: 'row', gap: 28, alignItems: 'flex-start' } : { gap: 32 }}>
        <View style={{ flex: wide ? 1 : undefined, gap: 32 }}>
          <Upcoming />
          <History />
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 32 }}>
          <Moodboard />
          <Vouchers />
          <Orders />
          <ContactCard />
        </View>
      </View>
    </Screen>
  );
}

/** The shared i18n plus a month-and-year for "lid sinds". */
function useI18nPlus() {
  const i18n = useI18n();
  const monthYear = (date: Date) => {
    const locale = i18n.locale === 'ar' ? 'ar-u-nu-latn' : i18n.locale;
    try {
      return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
    } catch {
      return String(date.getFullYear());
    }
  };
  return { ...i18n, monthYear };
}

function Upcoming() {
  const theme = useTheme();
  const { t, text } = useI18n();
  const studio = useStudio();
  const toast = useToast();
  const [asking, setAsking] = useState<string | null>(null);
  return (
    <Section title={t('me.upcoming')}>
      {studio.upcoming.length === 0 ? (
        <View style={{ gap: 12, padding: 20, borderRadius: 24, backgroundColor: theme.c.chalk }}>
          <Txt variant="body">{t('me.noUpcoming')}</Txt>
          <Button label={t('cta.bookNow')} size="md" icon="sparkle" style={{ alignSelf: 'flex-start' }} onPress={() => router.navigate('/boeken')} />
        </View>
      ) : (
        studio.upcoming.map((b) => (
          <View key={b.id} style={{ gap: 10 }}>
            <Ticket booking={b} />
            {b.location === 'uden' ? <Tag label={`${locationBlanche('uden').city} · ${locationBlanche('uden').address}`} icon="pin" /> : null}
            {asking === b.id ? (
              <View style={{ padding: 16, borderRadius: 22, backgroundColor: theme.c.blush, gap: 12 }}>
                <Txt variant="bodyStrong">{t('me.cancelAsk', { service: text(b.service.name) })}</Txt>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    label={t('me.cancelYes')}
                    size="sm"
                    onPress={() => {
                      studio.cancel(b.id);
                      setAsking(null);
                      toast(t('me.cancelled'));
                    }}
                  />
                  <Button label={t('me.cancelNo')} size="sm" kind="white" onPress={() => setAsking(null)} />
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  label={t('me.move')}
                  kind="ink"
                  size="sm"
                  icon="calendar"
                  onPress={() =>
                    router.push({
                      pathname: '/afspraak/[serviceId]',
                      params: { serviceId: b.serviceId, replace: b.id, stylist: b.stylistId, location: b.location },
                    })
                  }
                />
                <Button label={t('me.cancel')} kind="outline" size="sm" onPress={() => setAsking(b.id)} />
              </View>
            )}
          </View>
        ))
      )}
      <Txt variant="caption" color={theme.c.muted}>
        {t('book.policy')}
      </Txt>
    </Section>
  );
}

function HistoryRow({ b }: { b: BookingView }) {
  const theme = useTheme();
  const { t, text, dayShort, ago } = useI18n();
  const shade = b.shadeId ? polishById(b.shadeId) : null;
  const look = b.lookId ? lookById(b.lookId) : null;
  const colors = categoryColors(b.service.category);
  return (
    <View
      style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 10, borderRadius: 22, backgroundColor: '#FFFFFF', boxShadow: theme.shadow.card }}
    >
      <Photo photo={look?.photo ?? b.service.photo} style={{ width: 58, height: 70, borderRadius: 14 }} />
      <View style={{ flex: 1, gap: 3 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {text(b.service.name)}
        </Txt>
        <Txt variant="small" color={theme.c.muted} numberOfLines={1}>
          {`${dayShort(b.start)} · ${b.stylist.name} · ${ago(b.start)}`}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {shade ? <View style={{ width: 11, height: 15, borderRadius: 4, backgroundColor: shade.hex }} /> : null}
          <Txt variant="caption" color={colors.ink} numberOfLines={1}>
            {[shade?.name, ...(b.addOns ?? []).map((id) => text(addOnById(id).name))].filter(Boolean).join(' · ') || text(b.service.lasts)}
          </Txt>
        </View>
      </View>
      <Squish
        onPress={() =>
          router.push({
            pathname: '/afspraak/[serviceId]',
            params: { serviceId: b.serviceId, stylist: b.stylistId, addOns: (b.addOns ?? []).join(','), shade: b.shadeId ?? '', location: b.location },
          })
        }
        scaleTo={0.9}
        accessibilityLabel={t('me.again')}
        style={{ paddingHorizontal: 12, height: 36, borderRadius: 999, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}
      >
        <Txt variant="smallStrong" color={colors.ink}>
          {t('me.again')}
        </Txt>
      </Squish>
    </View>
  );
}

function History() {
  const { t } = useI18n();
  const { past } = useStudio();
  if (!past.length) return null;
  return (
    <Section title={t('me.history')} sub={t('me.historySub')}>
      <View style={{ gap: 10 }}>
        {past.map((b) => (
          <HistoryRow key={b.id} b={b} />
        ))}
      </View>
    </Section>
  );
}

function Moodboard() {
  const theme = useTheme();
  const { t } = useI18n();
  const { saved } = useStudio();
  const looks = LOOKS.filter((l) => saved.includes(l.id));
  return (
    <Section title={t('me.moodboard')} sub={t('me.moodboardSub', { n: looks.length })} action={t('me.addLooks')} onAction={() => router.push('/inspiratie')}>
      {looks.length ? (
        <Rail gap={12} wrap={false}>
          {looks.map((look, i) => (
            <LookCard key={look.id} look={look} tilt={i % 2 ? 1.5 : -1.5} width={150} />
          ))}
        </Rail>
      ) : (
        <View style={{ padding: 18, borderRadius: 22, backgroundColor: theme.c.lilacSoft }}>
          <Txt variant="small">{t('me.moodboardEmpty')}</Txt>
        </View>
      )}
    </Section>
  );
}

function Vouchers() {
  const theme = useTheme();
  const { t, text } = useI18n();
  const { vouchers } = useStudio();
  if (!vouchers.length) return null;
  return (
    <Section title={t('me.vouchers')}>
      {vouchers.map((id, i) => {
        const reward = rewardById(id);
        return reward ? (
          <View
            key={`${id}-${i}`}
            style={{
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
              padding: 14,
              borderRadius: 20,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: theme.c.mint,
              backgroundColor: theme.c.mintSoft,
            }}
          >
            <Icon name="gift" size={22} color={theme.c.mint} />
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              {text(reward.name)}
            </Txt>
            <Tag label={t('me.ready')} bg="#FFFFFF" color={theme.c.mint} />
          </View>
        ) : null;
      })}
    </Section>
  );
}

function Orders() {
  const theme = useTheme();
  const { t, euro, dayShort } = useI18n();
  const { orders } = useStudio();
  if (!orders.length) return null;
  return (
    <Section title={t('me.orders')}>
      {orders.map((o) => (
        <Squish key={o.id} onPress={() => router.push({ pathname: '/bestelling/[id]', params: { id: o.id } })} scaleTo={0.97}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: theme.c.chalk }}>
            <Icon name="bag" size={22} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{o.number}</Txt>
              <Txt variant="small" color={theme.c.muted}>{`${dayShort(o.createdAt)} · ${euro(o.total)}`}</Txt>
            </View>
            <Tag label={o.delivery === 'ship' ? t('me.shipping') : t('me.pickup')} bg="#FFFFFF" />
          </View>
        </Squish>
      ))}
    </Section>
  );
}

function ContactCard() {
  const theme = useTheme();
  const { t } = useI18n();
  const items: { icon: IconName; label: string; sub: string; go: () => void }[] = [
    {
      icon: 'pin',
      label: t('contact.title'),
      sub: `${locationBlanche('nijmegen').address}, ${locationBlanche('nijmegen').city}`,
      go: () => router.push('/contact'),
    },
    { icon: 'instagram', label: 'Instagram', sub: `@${STUDIO.instagram}`, go: () => router.push('/contact') },
    { icon: 'globe', label: t('settings.language'), sub: t('settings.languageSub'), go: () => router.push('/instellingen') },
  ];
  return (
    <View style={{ borderRadius: 26, backgroundColor: theme.c.chalk, padding: 6 }}>
      {items.map((item, i) => (
        <Squish
          key={item.label}
          onPress={item.go}
          scaleTo={0.98}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: theme.c.line }}
        >
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={item.icon} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{item.label}</Txt>
            <Txt variant="small" color={theme.c.muted}>
              {item.sub}
            </Txt>
          </View>
          <Icon name="chevron" size={18} color={theme.c.muted} />
        </Squish>
      ))}
    </View>
  );
}
