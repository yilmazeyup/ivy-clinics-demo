import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/Button';
import { GiftCard } from '@/components/GiftCard';
import { Icon } from '@/components/Icon';
import { PopIn, Squish } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Footer, Screen } from '@/components/Screen';
import { Tag } from '@/components/Sticker';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { categoryById, productById, SHOP, type BlancheProduct } from '@/data';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { useDemo } from '@/state/demo';
import { categoryColors, useTheme } from '@/theme';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = id ? productById(id) : undefined;
  if (!product) return <Redirect href="/shop" />;
  return <ProductDetail product={product} />;
}

function ProductDetail({ product }: { product: BlancheProduct }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const { t, text, euro } = useI18n();
  const { addToCart } = useDemo();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const gift = product.kind === 'giftcard';

  const footer = (
    <Footer>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: theme.r.pill, backgroundColor: theme.c.chalk, padding: 4 }}>
          <Squish
            onPress={() => setQty((q) => Math.max(1, q - 1))}
            scaleTo={0.85}
            accessibilityLabel={t('shop.decrease')}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}
          >
            <Icon name="minus" size={18} strokeWidth={2.4} />
          </Squish>
          <Txt variant="bodyStrong" style={{ width: 28, textAlign: 'center' }}>
            {String(qty)}
          </Txt>
          <Squish
            onPress={() => setQty((q) => q + 1)}
            scaleTo={0.85}
            accessibilityLabel={t('shop.increase')}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}
          >
            <Icon name="plus" size={18} strokeWidth={2.4} />
          </Squish>
        </View>
        <Button
          label={`${t('shop.add')} · ${euro(product.price * qty)}`}
          style={{ flex: 1 }}
          onPress={() => {
            addToCart(product.id, qty);
            toast(t('shop.added', { name: text(product.name) }));
            router.back();
          }}
        />
      </View>
    </Footer>
  );

  return (
    <Screen
      padded={false}
      gap={24}
      footer={footer}
      contentStyle={{ paddingTop: wide ? 36 : 0 }}
      overlay={
        wide ? null : (
          <View style={{ position: 'absolute', top: insets.top + 8, start: 16, end: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconButton icon="back" label={t('common.back')} onPress={() => router.back()} />
            <IconButton icon="bag" label={t('shop.cart')} onPress={() => router.push('/winkelmand')} />
          </View>
        )
      }
    >
      {gift ? (
        <View
          style={{
            height: 420,
            backgroundColor: theme.c.blush,
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomLeftRadius: 38,
            borderBottomRightRadius: 38,
            padding: 34,
          }}
        >
          <PopIn tilt={-8} from={0.8}>
            <GiftCard amount={product.price} style={{ width: 300, transform: [{ rotate: '-5deg' }] }} />
          </PopIn>
        </View>
      ) : (
        <Photo photo={product.photo} style={{ height: 440, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, borderRadius: wide ? 32 : undefined }} />
      )}
      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {gift ? <Tag label={t('shop.cat.gift')} icon="gift" bg={theme.c.blush} color={theme.c.primary} /> : null}
          {product.after?.map((c) => (
            <Tag key={c} label={t('shop.goesWith', { craft: text(categoryById(c).name) })} bg={categoryColors(c).soft} color={categoryColors(c).ink} />
          ))}
        </View>
        <Txt variant="display">{text(product.name)}</Txt>
        <Txt variant="price" style={{ fontSize: 34, lineHeight: 36 }}>
          {euro(product.price)}
        </Txt>
        <Txt variant="body" color={theme.c.inkSoft} style={{ fontSize: 16, lineHeight: 24 }}>
          {text(product.description)}
        </Txt>
        <View style={{ gap: 10, padding: 16, borderRadius: 22, backgroundColor: theme.c.chalk }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name={gift ? 'chat' : 'truck'} size={20} />
            <Txt variant="small" style={{ flex: 1 }}>
              {gift ? t('shop.giftMail') : t('shop.shipNote', { days: SHOP.deliveryDays, amount: euro(SHOP.freeShippingFrom) })}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="store" size={20} />
            <Txt variant="small" style={{ flex: 1 }}>
              {gift ? t('shop.giftUse') : t('shop.pickupNote')}
            </Txt>
          </View>
        </View>
      </View>
    </Screen>
  );
}
