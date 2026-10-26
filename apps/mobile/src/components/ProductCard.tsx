import type { Product } from '@pure-clinics/shared';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useI18n } from '@/i18n';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

import { Badge } from './Badge';
import { Icon } from './Icon';
import { TexturePhoto } from './Photo';
import { useToast } from './Toast';
import { Txt } from './Txt';

/** A shop product as a texture close-up, with a quick add button. */
export function ProductCard({ product, width }: { product: Product; width: number }) {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  const { addToCart } = useDemo();
  const toast = useToast();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/product/${product.id}`)}
      style={({ pressed }) => ({ width, gap: 8, opacity: pressed ? 0.9 : 1 })}
    >
      <TexturePhoto texture={product.texture} style={{ height: Math.round(width * 1.15), borderRadius: theme.r.photo }}>
        {product.soldOut ? (
          <View style={{ position: 'absolute', top: 10, start: 10 }}>
            <Badge label={t('shop.soldOut')} tone="surface" />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('shop.add')}
            onPress={() => {
              addToCart(product.id);
              toast(t('shop.added', { name: text(product.name) }));
            }}
            style={({ pressed }) => ({
              position: 'absolute',
              bottom: 10,
              end: 10,
              width: 38,
              height: 38,
              borderRadius: theme.r.control,
              backgroundColor: theme.c.surface,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Icon name="plus" size={18} />
          </Pressable>
        )}
      </TexturePhoto>
      <View style={{ gap: 2 }}>
        {product.brand ? (
          <Txt variant="caption" color={theme.c.muted}>
            {product.brand}
          </Txt>
        ) : null}
        <Txt variant="bodyStrong" numberOfLines={2}>
          {text(product.name)}
        </Txt>
        <Txt variant="small" color={theme.c.muted}>
          {euro(product.price)}
        </Txt>
      </View>
    </Pressable>
  );
}
