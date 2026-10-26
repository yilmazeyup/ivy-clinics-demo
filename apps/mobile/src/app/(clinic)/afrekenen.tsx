import { DELIVERY_DAYS, IVY_MEMBER, LOCATIONS, SHIPPING_FEE, type LocationId } from '@pure-ivy/shared';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon, type IconName } from '@/components/Icon';
import { Footer, Rail, Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName } from '@/ivy';
import { cartTotals, type CartLine, type Delivery } from '@/shop';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

// The demo member's delivery address; clearly an example.
const ADDRESS = 'Voorbeeldstraat 12, 1012 AB Amsterdam';

export default function Checkout() {
  const theme = useTheme();
  const { t, tp, euro } = useI18n();
  const { cart, placeOrder } = useDemo();
  const [delivery, setDelivery] = useState<Delivery>('ship');
  const [locationId, setLocationId] = useState<LocationId>(IVY_MEMBER.locationId);
  // Paying empties the cart, so the screen keeps showing what was paid for while the confirmation slides in.
  const [paid, setPaid] = useState<CartLine[] | null>(null);
  const lines = paid ?? cart;
  const totals = cartTotals(lines, delivery);

  if (lines.length === 0) return <Redirect href="/shop" />;

  const pay = () => {
    setPaid(cart);
    const id = placeOrder(delivery, locationId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/bestelling/${id}`);
  };

  const footer = (
    <Footer>
      <Button label={t('shop.pay', { amount: euro(totals.total) })} disabled={paid !== null} onPress={pay} />
      <Txt variant="caption" color={theme.c.muted} align="center">
        {t('shop.idealNote')}
      </Txt>
    </Footer>
  );

  return (
    <Screen gap={22} footer={footer}>
      <View style={{ flexDirection: 'row' }}>
        <IconButton icon="back" label={t('common.back')} tone="surface" onPress={() => router.back()} />
      </View>
      <Txt variant="display">{t('shop.checkoutTitle')}</Txt>

      {totals.physical ? (
        <Group label={t('shop.delivery')}>
          <Option
            icon="truck"
            title={t('shop.ship')}
            note={`${t('shop.shipNote', { days: DELIVERY_DAYS })} · ${euro(SHIPPING_FEE)}`}
            selected={delivery === 'ship'}
            onPress={() => setDelivery('ship')}
          />
          <Option icon="pin" title={t('shop.pickup')} note={t('shop.pickupNote')} selected={delivery === 'pickup'} onPress={() => setDelivery('pickup')} />
          {delivery === 'pickup' ? (
            <Rail gap={8}>
              {LOCATIONS.map((l) => (
                <Chip key={l.id} label={cityName(l)} icon={l.id === locationId ? 'pin' : undefined} selected={l.id === locationId} onPress={() => setLocationId(l.id)} />
              ))}
            </Rail>
          ) : (
            <View style={{ padding: 16, borderRadius: theme.r.card, backgroundColor: theme.c.surface, gap: 2 }}>
              <Txt variant="caption" color={theme.c.muted}>
                {t('shop.address')}
              </Txt>
              <Txt variant="bodyStrong">{`${IVY_MEMBER.firstName} ${IVY_MEMBER.lastName}`}</Txt>
              <Txt variant="small">{ADDRESS}</Txt>
            </View>
          )}
        </Group>
      ) : null}

      <Group label={t('shop.payment')}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            borderRadius: theme.r.card,
            borderWidth: 1.5,
            borderColor: theme.c.ink,
            backgroundColor: theme.c.surface,
          }}
        >
          <View style={{ paddingHorizontal: 8, height: 28, borderRadius: theme.r.small, backgroundColor: IDEAL_PINK, justifyContent: 'center' }}>
            <Txt variant="smallStrong" color="#FFFFFF">
              iDEAL
            </Txt>
          </View>
          <Txt variant="bodyStrong" style={{ flex: 1 }}>
            iDEAL
          </Txt>
          <Icon name="check" size={18} strokeWidth={2.2} />
        </View>
      </Group>

      <View style={{ padding: 16, borderRadius: theme.r.card, backgroundColor: theme.c.surface, gap: 10 }}>
        <Row label={`${t('shop.subtotal')} · ${tp('shop.items', totals.count)}`} value={euro(totals.subtotal)} />
        {totals.physical ? <Row label={t('shop.shipping')} value={totals.shipping ? euro(totals.shipping) : t('ivy.price.free')} /> : null}
        <View style={{ height: 1, backgroundColor: theme.c.line }} />
        <Row label={t('shop.total')} value={euro(totals.total)} strong />
      </View>
    </Screen>
  );
}

const IDEAL_PINK = '#CC0066';

function Group({ label, children }: { label: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Txt variant="eyebrow" color={theme.c.muted}>
        {label}
      </Txt>
      {children}
    </View>
  );
}

function Option({ icon, title, note, selected, onPress }: { icon: IconName; title: string; note: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: theme.r.card,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? theme.c.ink : theme.c.line,
        backgroundColor: theme.c.surface,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Icon name={icon} size={20} color={selected ? theme.c.ink : theme.c.muted} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        <Txt variant="small" color={theme.c.muted}>
          {note}
        </Txt>
      </View>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          borderWidth: selected ? 6 : 1.5,
          borderColor: selected ? theme.c.ink : theme.c.lineStrong,
        }}
      />
    </Pressable>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Txt variant={strong ? 'bodyStrong' : 'body'} color={strong ? theme.c.ink : theme.c.muted} style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt variant={strong ? 'bodyStrong' : 'body'}>{value}</Txt>
    </View>
  );
}
