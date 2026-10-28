import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { LookCard } from '@/components/LookCard';
import { Squish } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Footer, Rail, Screen, Section } from '@/components/Screen';
import { Sticker, Tag } from '@/components/Sticker';
import { StylistCard } from '@/components/StylistCard';
import { Txt } from '@/components/Txt';
import { addOnById, AFTERCARE, categoryById, isServiceId, LOOKS, PRODUCTS, serviceById, STEPS, stylistsFor, type AddOnId, type Service } from '@/data';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { categoryColors, useTheme } from '@/theme';

export default function ServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id || !isServiceId(id)) return <Redirect href="/boeken" />;
  return <Detail service={serviceById(id)} />;
}

function Detail({ service }: { service: Service }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { wide } = useLayout();
  const { t, text, euro } = useI18n();
  const colors = categoryColors(service.category);
  const category = categoryById(service.category);
  const [extras, setExtras] = useState<AddOnId[]>([]);
  const extra = extras.reduce((sum, id) => sum + addOnById(id).price, 0);
  const team = stylistsFor(service);
  const looks = service.id === 'biab-nude' || service.id === 'biab-color' ? LOOKS : [];
  const products = PRODUCTS.filter((p) => p.after?.includes(service.category)).slice(0, 3);
  const hero = wide ? 460 : Math.round(Math.min(Math.max(height * 0.56, 400), 520));

  const book = (stylist?: string) =>
    router.push({ pathname: '/afspraak/[serviceId]', params: { serviceId: service.id, addOns: extras.join(','), ...(stylist ? { stylist } : null) } });

  const footer = (
    <Footer>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color={theme.c.muted}>
            {extras.length ? t('service.withExtras', { n: extras.length }) : t('common.minutes', { n: service.minutes })}
          </Txt>
          <Txt variant="price" style={{ fontSize: 30, lineHeight: 32 }}>
            {euro(service.price + extra)}
          </Txt>
        </View>
        <Button label={t('service.pick')} iconAfter="arrow" onPress={() => book()} style={{ flex: 1.4 }} />
      </View>
    </Footer>
  );

  return (
    <Screen
      padded={false}
      gap={30}
      footer={footer}
      photoTop={hero}
      contentStyle={{ paddingTop: wide ? 36 : 0 }}
      overlay={
        wide ? null : (
          <View style={{ position: 'absolute', top: insets.top + 8, start: 16, end: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconButton icon="back" label={t('common.back')} onPress={() => router.back()} />
            <IconButton icon="share" label={t('common.share')} />
          </View>
        )
      }
    >
      <View style={{ paddingHorizontal: wide ? 0 : 0 }}>
        <Photo photo={service.photo} style={{ height: hero, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, borderRadius: wide ? 32 : undefined }}>
          <View style={{ position: 'absolute', bottom: 22, start: 20 }}>
            <Sticker
              label={text(category.name)}
              bg={colors.soft}
              angle={-5}
              big
              icon={service.category === 'nails' ? 'polish' : service.category === 'lashes' ? 'lash' : 'brow'}
            />
          </View>
        </Photo>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        <Txt variant="display">{text(service.name)}</Txt>
        <Txt variant="body" color={theme.c.inkSoft} style={{ fontSize: 16, lineHeight: 24 }}>
          {text(service.short)}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Tag label={t('common.minutes', { n: service.minutes })} icon="clock" />
          <Tag label={t('service.lasts', { time: text(service.lasts) })} icon="sparkle" bg={colors.soft} color={colors.ink} />
          {service.refill ? <Tag label={t('service.refillAfter', { days: service.refill.days })} icon="refresh" /> : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        <Txt variant="title">{t('service.steps')}</Txt>
        {STEPS[service.category].map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <Txt variant="display" color={colors.ink} style={{ width: 52, fontSize: 40, lineHeight: 40 }}>
              {`0${i + 1}`}
            </Txt>
            <Txt variant="body" style={{ flex: 1, paddingTop: 6 }}>
              {text(step)}
            </Txt>
          </View>
        ))}
      </View>

      {service.addOns?.length ? (
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <Txt variant="title">{t('service.extras')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {service.addOns.map((id) => {
              const addOn = addOnById(id);
              const on = extras.includes(id);
              return (
                <Squish
                  key={id}
                  scaleTo={0.92}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => setExtras((list) => (on ? list.filter((x) => x !== id) : [...list, id]))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    height: 44,
                    paddingHorizontal: 14,
                    borderRadius: theme.r.pill,
                    borderWidth: 1.5,
                    borderColor: on ? colors.ink : theme.c.lineStrong,
                    backgroundColor: on ? colors.soft : '#FFFFFF',
                  }}
                >
                  <Icon name={on ? 'check' : 'plus'} size={16} color={on ? colors.ink : theme.c.ink} strokeWidth={2.4} />
                  <Txt variant="smallStrong">{text(addOn.name)}</Txt>
                  <Txt variant="small" color={theme.c.muted}>{`+${euro(addOn.price)}`}</Txt>
                </Squish>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 20 }}>
        <Section title={t('service.team')} sub={t('service.teamSub')}>
          <Rail gap={12} wrap={false}>
            {team.map((stylist) => (
              <StylistCard key={stylist.id} stylist={stylist} service={service} onPress={() => book(stylist.id)} />
            ))}
          </Rail>
        </Section>
      </View>

      {looks.length ? (
        <View style={{ paddingHorizontal: 20 }}>
          <Section title={t('service.looks')}>
            <Rail gap={14} wrap={false}>
              {looks.map((look, i) => (
                <LookCard key={look.id} look={look} tilt={i % 2 ? 1.5 : -1.5} width={156} />
              ))}
            </Rail>
          </Section>
        </View>
      ) : null}

      <View style={{ marginHorizontal: 20, padding: 20, borderRadius: theme.r.card, backgroundColor: colors.soft, gap: 12 }}>
        <Txt variant="title">{t('service.aftercare')}</Txt>
        {AFTERCARE[service.category].map((tip, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="check" size={18} color={colors.ink} strokeWidth={2.4} />
            <Txt variant="body" style={{ flex: 1 }}>
              {text(tip)}
            </Txt>
          </View>
        ))}
        {products.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {products.map((p) => (
              <Squish key={p.id} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} scaleTo={0.94}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    padding: 6,
                    paddingEnd: 14,
                    borderRadius: theme.r.pill,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Photo photo={p.photo} style={{ width: 32, height: 32, borderRadius: 12 }} />
                  <Txt variant="smallStrong">{text(p.name)}</Txt>
                </View>
              </Squish>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
