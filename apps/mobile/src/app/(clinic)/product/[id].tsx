import { DELIVERY_DAYS, productById, treatmentById, type Product } from '@pure-ivy/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/Button';
import { CartButton } from '@/components/CartButton';
import { Icon, type IconName } from '@/components/Icon';
import { TexturePhoto } from '@/components/Photo';
import { Footer, Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = productById(id);
  if (!product) return <Redirect href="/shop" />;
  return <ProductDetail product={product} />;
}

function ProductDetail({ product }: { product: Product }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, text, euro } = useI18n();
  const { addToCart } = useDemo();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const name = text(product.name);
  const after = product.after?.map(treatmentById) ?? [];

  const footer = (
    <Footer>
      {product.soldOut ? (
        <Button kind="secondary" icon="bell" label={t('shop.notify')} onPress={() => toast(t('shop.notified'))} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Stepper value={qty} onChange={setQty} />
          <Button
            label={`${t('shop.add')} · ${euro(Math.round(product.price * qty * 100) / 100)}`}
            style={{ flex: 1 }}
            onPress={() => {
              addToCart(product.id, qty);
              toast(t('shop.added', { name }));
              router.back();
            }}
          />
        </View>
      )}
    </Footer>
  );

  return (
    <Screen padded={false} gap={0} bottomSpace={24} contentStyle={{ paddingTop: 0 }} footer={footer}>
      <TexturePhoto texture={product.texture} style={{ height: 340 + insets.top }}>
        <View style={{ position: 'absolute', top: insets.top + 8, start: 16, end: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
          <IconButton icon="back" label={t('common.back')} tone="surface" onPress={() => router.back()} />
          <CartButton />
        </View>
      </TexturePhoto>

      <View style={{ padding: 20, gap: 16 }}>
        <View style={{ gap: 4 }}>
          {/* Brands keep their own spelling, e.g. emerginC, so no capitals here. */}
          {product.brand ? (
            <Txt variant="smallStrong" color={theme.c.muted}>
              {product.brand}
            </Txt>
          ) : null}
          <Txt variant="display">{name}</Txt>
          <Txt variant="title" color={theme.c.muted}>
            {euro(product.price)}
          </Txt>
        </View>

        <Txt variant="body" color={theme.c.ink}>
          {text(product.description)}
        </Txt>

        {after.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Txt variant="eyebrow" color={theme.c.muted}>
              {t('shop.cat.aftercare')}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {after.map((tr) => (
                <View key={tr.id} style={{ paddingHorizontal: 12, height: 32, borderRadius: theme.r.chip, backgroundColor: theme.c.sand, justifyContent: 'center' }}>
                  <Txt variant="smallStrong">{text(tr.name)}</Txt>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, paddingHorizontal: 16 }}>
          <InfoRow icon="truck" label={`${t('shop.ship')} · ${t('shop.shipNote', { days: DELIVERY_DAYS })}`} first />
          <InfoRow icon="pin" label={`${t('shop.pickup')} · ${t('shop.pickupNote')}`} />
          <InfoRow icon="check" label={t('shop.returns')} />
        </View>
      </View>
    </Screen>
  );
}

function InfoRow({ icon, label, first }: { icon: IconName; label: string; first?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, borderTopWidth: first ? 0 : 1, borderTopColor: theme.c.line }}>
      <Icon name={icon} size={18} color={theme.c.muted} />
      <Txt variant="small" style={{ flex: 1 }}>
        {label}
      </Txt>
    </View>
  );
}
