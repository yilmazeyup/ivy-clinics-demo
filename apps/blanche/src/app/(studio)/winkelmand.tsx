import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { GiftCard } from '@/components/GiftCard';
import { Icon } from '@/components/Icon';
import { Squish } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Footer, Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { SHOP } from '@/data';
import { useI18n } from '@/i18n';
import { cartTotals, shopItem } from '@/shop';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

export default function CartScreen() {
  const theme = useTheme();
  const { t, tp, text, euro } = useI18n();
  const { cart, setCartQty } = useDemo();
  const totals = cartTotals(cart, 'ship');
  const toFree = Math.max(0, SHOP.freeShippingFrom - totals.subtotal);

  const footer = cart.length ? (
    <Footer>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt variant="body" color={theme.c.inkSoft}>
          {t('shop.subtotal')}
        </Txt>
        <Txt variant="price">{euro(totals.subtotal)}</Txt>
      </View>
      <Button label={t('shop.checkout')} iconAfter="arrow" onPress={() => router.push('/afrekenen')} />
    </Footer>
  ) : undefined;

  return (
    <Screen footer={footer} gap={22}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="back" label={t('common.back')} tone="chalk" onPress={() => (router.canGoBack() ? router.back() : router.replace('/shop'))} />
        <Txt variant="small" color={theme.c.muted}>
          {tp('shop.items', totals.count)}
        </Txt>
      </View>
      <Txt variant="display">{t('shop.cart')}</Txt>
      {cart.length === 0 ? (
        <View style={{ alignItems: 'flex-start', gap: 14, padding: 22, borderRadius: 26, backgroundColor: theme.c.chalk }}>
          <Icon name="bag" size={30} />
          <Txt variant="title">{t('shop.empty')}</Txt>
          <Button label={t('shop.browse')} kind="ink" size="md" onPress={() => router.navigate('/shop')} />
        </View>
      ) : (
        <>
          {totals.physical ? (
            <View style={{ gap: 8, padding: 14, borderRadius: 20, backgroundColor: toFree ? theme.c.honeySoft : theme.c.mintSoft }}>
              <Txt variant="smallStrong">{toFree ? t('shop.toFree', { amount: euro(toFree) }) : t('shop.freeShipping')}</Txt>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(20,17,20,0.08)', overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${Math.min(1, totals.subtotal / SHOP.freeShippingFrom) * 100}%`,
                    backgroundColor: toFree ? theme.c.honey : theme.c.mint,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          ) : null}
          {cart.map((line) => {
            const item = shopItem(line.id);
            if (!item) return null;
            return (
              <View
                key={line.id}
                style={{
                  flexDirection: 'row',
                  gap: 14,
                  alignItems: 'center',
                  padding: 10,
                  borderRadius: 24,
                  backgroundColor: '#FFFFFF',
                  boxShadow: theme.shadow.card,
                }}
              >
                {item.product?.kind === 'giftcard' ? (
                  <View
                    style={{
                      width: 72,
                      height: 84,
                      borderRadius: 16,
                      backgroundColor: theme.c.chalk,
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 6,
                    }}
                  >
                    <GiftCard amount={item.price} small style={{ width: '100%' }} />
                  </View>
                ) : (
                  <Photo photo={item.photo} style={{ width: 72, height: 84, borderRadius: 16 }} />
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt variant="bodyStrong" numberOfLines={2}>
                    {text(item.name)}
                  </Txt>
                  <Txt variant="price" style={{ fontSize: 20, lineHeight: 22 }}>
                    {euro(item.price * line.qty)}
                  </Txt>
                </View>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Squish
                    onPress={() => setCartQty(line.id, line.qty + 1)}
                    scaleTo={0.85}
                    accessibilityLabel={t('shop.increase')}
                    style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: theme.c.chalk, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name="plus" size={16} strokeWidth={2.4} />
                  </Squish>
                  <Txt variant="bodyStrong">{String(line.qty)}</Txt>
                  <Squish
                    onPress={() => setCartQty(line.id, line.qty - 1)}
                    scaleTo={0.85}
                    accessibilityLabel={t('shop.decrease')}
                    style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: theme.c.chalk, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name={line.qty === 1 ? 'close' : 'minus'} size={16} strokeWidth={2.4} />
                  </Squish>
                </View>
              </View>
            );
          })}
        </>
      )}
    </Screen>
  );
}
