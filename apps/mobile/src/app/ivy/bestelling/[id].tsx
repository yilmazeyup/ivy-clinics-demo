import { DELIVERY_DAYS, IVY_COLORS, IVY_MEMBER, locationById } from '@pure-ivy/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { CartLineRow } from '@/components/CartLineRow';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName } from '@/ivy';
import { shopItem } from '@/shop';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

// Close the checkout screens underneath, then show a tab.
function leaveTo(href: '/ivy/shop' | '/ivy') {
  if (router.canDismiss()) router.dismissAll();
  router.navigate(href);
}

export default function OrderConfirmation() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, euro } = useI18n();
  const { orders } = useDemo();
  const order = orders.find((o) => o.id === id);
  if (!order) return <Redirect href="/ivy/shop" />;

  const physical = order.lines.some((l) => shopItem(l.id)?.kind === 'product');
  const credits = order.lines.some((l) => shopItem(l.id)?.kind === 'package');
  const location = locationById(order.locationId);
  const notes = [
    physical && order.delivery === 'ship' ? t('shop.orderShip', { days: DELIVERY_DAYS }) : null,
    physical && order.delivery === 'pickup' ? t('shop.orderPickup', { city: cityName(location), address: location.address }) : null,
    credits ? t('shop.orderCredits') : null,
  ].filter((n): n is string => Boolean(n));

  return (
    <Screen gap={24}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <IconButton icon="close" label={t('common.close')} tone="surface" onPress={() => leaveTo('/ivy/shop')} />
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="hero">{t('shop.orderTitle', { name: IVY_MEMBER.firstName })}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="check" size={18} color={theme.c.primary} strokeWidth={2} />
          <Txt variant="body" color={IVY_COLORS.body} style={{ flex: 1 }}>
            {t('shop.orderPaid', { amount: euro(order.total) })}
          </Txt>
        </View>
      </View>

      <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 16, gap: 12 }}>
        <Txt variant="eyebrow" color={theme.c.muted}>
          {t('shop.orderNumber', { number: order.number })}
        </Txt>
        {notes.map((note) => (
          <Txt key={note} variant="body">
            {note}
          </Txt>
        ))}
      </View>

      <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, paddingHorizontal: 14 }}>
        {order.lines.map((line, index) => (
          <CartLineRow key={line.id} line={line} first={index === 0} />
        ))}
        <View style={{ borderTopWidth: 1, borderTopColor: theme.c.line, paddingVertical: 14, gap: 8 }}>
          {physical ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt variant="body" color={theme.c.muted}>
                {t('shop.shipping')}
              </Txt>
              <Txt variant="body">{order.shipping ? euro(order.shipping) : t('ivy.price.free')}</Txt>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt variant="bodyStrong">{t('shop.total')}</Txt>
            <Txt variant="bodyStrong">{euro(order.total)}</Txt>
          </View>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Button label={t('shop.continue')} onPress={() => leaveTo('/ivy/shop')} />
        <Button kind="secondary" label={t('ivy.confirm.home')} onPress={() => leaveTo('/ivy')} />
      </View>
    </Screen>
  );
}
