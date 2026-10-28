import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Confetti } from '@/components/Confetti';
import { Icon } from '@/components/Icon';
import { PopIn } from '@/components/Motion';
import { Screen } from '@/components/Screen';
import { Tag } from '@/components/Sticker';
import { Txt } from '@/components/Txt';
import { locationBlanche, MEMBER, SHOP } from '@/data';
import { useI18n } from '@/i18n';
import { shopItem } from '@/shop';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

export default function OrderScreen() {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders } = useDemo();
  const order = orders.find((o) => o.id === id);
  if (!order) return <Redirect href="/shop" />;
  const studio = locationBlanche('nijmegen');
  const physical = order.lines.some((l) => shopItem(l.id)?.physical);
  return (
    <View style={{ flex: 1 }}>
      <Screen gap={22} enter={false}>
        <PopIn delay={80}>
          <View style={{ alignItems: 'center', gap: 10, paddingTop: 20 }}>
            <Tag label={t('order.number', { number: order.number })} bg={theme.c.mintSoft} color={theme.c.mint} icon="check" style={{ alignSelf: 'center' }} />
            <Txt variant="mega" align="center">
              {t('order.title', { name: MEMBER.firstName })}
            </Txt>
            <Txt variant="body" align="center" color={theme.c.inkSoft}>
              {t('order.paid', { amount: euro(order.total) })}
            </Txt>
          </View>
        </PopIn>
        <PopIn delay={220}>
          <View style={{ gap: 12, padding: 18, borderRadius: 26, backgroundColor: theme.c.chalk }}>
            {order.lines.map((line) => {
              const item = shopItem(line.id);
              return item ? (
                <View key={line.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Txt variant="body" style={{ flex: 1 }}>{`${line.qty}× ${text(item.name)}`}</Txt>
                  <Txt variant="bodyStrong">{euro(item.price * line.qty)}</Txt>
                </View>
              ) : null;
            })}
          </View>
        </PopIn>
        <PopIn delay={320}>
          <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderRadius: 22, backgroundColor: theme.c.ink }}>
            <Icon name={!physical ? 'chat' : order.delivery === 'ship' ? 'truck' : 'store'} size={22} color="#FFFFFF" />
            <Txt variant="small" color="#FFFFFF" style={{ flex: 1 }}>
              {!physical
                ? t('order.digital')
                : order.delivery === 'ship'
                  ? t('order.ship', { days: SHOP.deliveryDays })
                  : t('order.pickup', { address: `${studio.address}, ${studio.city}` })}
            </Txt>
          </View>
        </PopIn>
        <PopIn delay={420}>
          <Button label={t('order.more')} kind="outline" onPress={() => router.dismissTo('/shop')} />
        </PopIn>
      </Screen>
      <Confetti count={26} />
    </View>
  );
}
