import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { Squish } from '@/components/Motion';
import { Footer, Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { locationBlanche, MEMBER, SHOP } from '@/data';
import { useI18n } from '@/i18n';
import { cartTotals, type Delivery } from '@/shop';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

/** Delivery or pick-up at the studio, then a test iDEAL payment. */
export default function CheckoutScreen() {
  const theme = useTheme();
  const { t, euro } = useI18n();
  const { cart, placeOrder } = useDemo();
  const [delivery, setDelivery] = useState<Delivery>('pickup');
  const [paying, setPaying] = useState(false);
  if (cart.length === 0) return <Redirect href="/shop" />;
  const totals = cartTotals(cart, delivery);
  const studio = locationBlanche('nijmegen');

  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      const number = placeOrder(delivery);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace({ pathname: '/bestelling/[id]', params: { id: number } });
    }, 900);
  };

  const option = (value: Delivery, icon: IconName, title: string, note: string) => {
    const on = delivery === value;
    return (
      <Squish
        key={value}
        onPress={() => setDelivery(value)}
        scaleTo={0.97}
        accessibilityRole="radio"
        accessibilityState={{ checked: on }}
        style={{
          flexDirection: 'row',
          gap: 14,
          alignItems: 'center',
          padding: 16,
          borderRadius: 22,
          borderWidth: 2,
          borderColor: on ? theme.c.ink : theme.c.line,
          backgroundColor: on ? theme.c.chalk : '#FFFFFF',
        }}
      >
        <Icon name={icon} size={22} />
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">{title}</Txt>
          <Txt variant="small" color={theme.c.muted}>
            {note}
          </Txt>
        </View>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: on ? theme.c.ink : theme.c.lineStrong,
            backgroundColor: on ? theme.c.ink : '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {on ? <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} /> : null}
        </View>
      </Squish>
    );
  };

  const row = (label: string, value: string, strong?: boolean) => (
    <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Txt variant={strong ? 'bodyStrong' : 'body'} color={strong ? theme.c.ink : theme.c.inkSoft}>
        {label}
      </Txt>
      <Txt variant={strong ? 'price' : 'body'}>{value}</Txt>
    </View>
  );

  const footer = (
    <Footer>
      <Button label={paying ? t('checkout.paying') : t('checkout.pay', { amount: euro(totals.total) })} icon="card" disabled={paying} onPress={pay} />
      <Txt variant="caption" color={theme.c.muted} align="center">
        {t('checkout.test')}
      </Txt>
    </Footer>
  );

  return (
    <Screen footer={footer} gap={22}>
      <IconButton icon="back" label={t('common.back')} tone="chalk" onPress={() => router.back()} />
      <Txt variant="display">{t('checkout.title')}</Txt>
      {totals.physical ? (
        <View style={{ gap: 10 }}>
          <Txt variant="title">{t('checkout.delivery')}</Txt>
          {option('pickup', 'store', t('checkout.pickup'), t('checkout.pickupNote', { address: `${studio.address}, ${studio.city}` }))}
          {option('ship', 'truck', t('checkout.ship'), t('checkout.shipNote', { days: SHOP.deliveryDays }))}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10, padding: 16, borderRadius: 22, backgroundColor: theme.c.mintSoft }}>
          <Icon name="chat" size={20} color={theme.c.mint} />
          <Txt variant="small" style={{ flex: 1 }}>
            {t('checkout.digital', { name: MEMBER.firstName })}
          </Txt>
        </View>
      )}
      <View style={{ gap: 10 }}>
        <Txt variant="title">{t('checkout.payment')}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, borderWidth: 2, borderColor: theme.c.ink }}>
          <View style={{ width: 44, height: 32, borderRadius: 8, backgroundColor: '#CC0066', alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="caption" color="#FFFFFF" style={{ fontFamily: theme.f.heavy }}>
              iDEAL
            </Txt>
          </View>
          <Txt variant="bodyStrong" style={{ flex: 1 }}>
            iDEAL
          </Txt>
          <Icon name="check" size={18} strokeWidth={2.6} />
        </View>
      </View>
      <View style={{ gap: 10, padding: 18, borderRadius: 24, backgroundColor: theme.c.chalk }}>
        {row(t('shop.subtotal'), euro(totals.subtotal))}
        {totals.physical ? row(t('shop.shipping'), totals.shipping ? euro(totals.shipping) : t('common.free')) : null}
        <View style={{ height: 1, backgroundColor: theme.c.lineStrong }} />
        {row(t('shop.total'), euro(totals.total), true)}
      </View>
    </Screen>
  );
}
