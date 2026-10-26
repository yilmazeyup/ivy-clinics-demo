import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { CartLineRow } from '@/components/CartLineRow';
import { Footer, Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cartTotals, shopItem } from '@/shop';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

export default function Cart() {
  const theme = useTheme();
  const { t, tp, euro } = useI18n();
  const { cart, setCartQty } = useDemo();
  const totals = cartTotals(cart, 'pickup');

  const footer =
    cart.length > 0 ? (
      <Footer>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt variant="body" color={theme.c.muted}>
            {t('shop.subtotal')}
          </Txt>
          <Txt variant="bodyStrong">{euro(totals.subtotal)}</Txt>
        </View>
        <Button label={t('shop.checkout')} iconAfter="arrow" onPress={() => router.push('/afrekenen')} />
      </Footer>
    ) : undefined;

  return (
    <Screen gap={20} footer={footer}>
      <View style={{ flexDirection: 'row' }}>
        <IconButton icon="back" label={t('common.back')} tone="surface" onPress={() => router.back()} />
      </View>
      <View style={{ gap: 4 }}>
        <Txt variant="display">{t('shop.cart')}</Txt>
        <Txt variant="body" color={theme.c.muted}>
          {cart.length > 0 ? tp('shop.items', totals.count) : t('shop.cartEmpty')}
        </Txt>
      </View>

      {cart.length > 0 ? (
        <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, paddingHorizontal: 14 }}>
          {cart.map((line, index) => (
            <CartLineRow key={line.id} line={line} first={index === 0}>
              {shopItem(line.id)?.kind === 'product' ? (
                <Stepper value={line.qty} min={0} onChange={(qty) => setCartQty(line.id, qty)} />
              ) : (
                <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setCartQty(line.id, 0)}>
                  <Txt variant="smallStrong" color={theme.c.primary}>
                    {t('shop.remove')}
                  </Txt>
                </Pressable>
              )}
            </CartLineRow>
          ))}
        </View>
      ) : (
        <Button kind="secondary" label={t('shop.continue')} onPress={() => router.navigate('/shop')} />
      )}
    </Screen>
  );
}
