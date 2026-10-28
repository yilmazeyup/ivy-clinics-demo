import { router } from 'expo-router';
import { View } from 'react-native';

import type { BlancheProduct } from '@/data';
import { useI18n } from '@/i18n';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

import { GiftCard } from './GiftCard';
import { Icon } from './Icon';
import { Squish } from './Motion';
import { Photo } from './Photo';
import { Sticker } from './Sticker';
import { useToast } from './Toast';
import { Txt } from './Txt';

/** A product tile: photo (or the gift card itself), name, price and a quick add button that pops. */
export function ProductCard({ product, width }: { product: BlancheProduct; width: number }) {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  const { addToCart } = useDemo();
  const toast = useToast();
  return (
    <View style={{ width }}>
      <Squish onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })} scaleTo={0.96} accessibilityLabel={text(product.name)}>
        <View style={{ gap: 10 }}>
          {product.kind === 'giftcard' ? (
            <View
              style={{ height: width * 1.15, borderRadius: 22, backgroundColor: theme.c.chalk, alignItems: 'center', justifyContent: 'center', padding: 14 }}
            >
              <GiftCard amount={product.price} style={{ width: '100%', transform: [{ rotate: '-4deg' }] }} small={width < 200} />
            </View>
          ) : (
            <Photo photo={product.photo} style={{ height: width * 1.15, borderRadius: 22 }} />
          )}
          {product.bestseller ? (
            <View style={{ position: 'absolute', top: 10, start: 10 }}>
              <Sticker label={t('shop.bestseller')} bg={theme.c.honeySoft} angle={-5} still />
            </View>
          ) : null}
          <View style={{ gap: 2, paddingHorizontal: 4 }}>
            <Txt variant="bodyStrong" numberOfLines={2}>
              {text(product.name)}
            </Txt>
            <Txt variant="price" style={{ fontSize: 22, lineHeight: 24 }}>
              {euro(product.price)}
            </Txt>
          </View>
        </View>
      </Squish>
      <Squish
        onPress={() => {
          addToCart(product.id);
          toast(t('shop.added', { name: text(product.name) }));
        }}
        scaleTo={0.8}
        accessibilityLabel={t('shop.add')}
        style={{ position: 'absolute', top: width * 1.15 - 52, end: 10 }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 15,
            backgroundColor: theme.c.ink,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#FFFFFF',
          }}
        >
          <Icon name="plus" size={20} color="#FFFFFF" strokeWidth={2.4} />
        </View>
      </Squish>
    </View>
  );
}
