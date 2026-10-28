import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { IconButton } from '@/components/Button';
import { GiftCard } from '@/components/GiftCard';
import { PopIn, Squish } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Pills } from '@/components/Pills';
import { ProductCard } from '@/components/ProductCard';
import { Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { Txt } from '@/components/Txt';
import { productById, PRODUCTS, SHOP, type ShopCategoryId } from '@/data';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { useStudio } from '@/studio';
import { useTheme } from '@/theme';

type Filter = 'all' | ShopCategoryId;

/** Aftercare that goes with the treatments, and gift cards. The stylist's tip comes first. */
export default function ShopScreen() {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  const { wide, inner } = useLayout();
  const studio = useStudio();
  const [filter, setFilter] = useState<Filter>('all');
  const inCart = studio.cart.reduce((n, l) => n + l.qty, 0);
  const columns = wide ? 4 : 2;
  const width = (inner(1120) - 14 * (columns - 1)) / columns;
  const shown = PRODUCTS.filter((p) => filter === 'all' || p.category === filter);
  const last = studio.past[0];
  const tip = last ? PRODUCTS.find((p) => p.kind === 'product' && p.after?.includes(last.service.category)) : undefined;

  return (
    <Screen tabs width="page" gap={26}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Txt variant="display" style={wide ? { fontSize: 64, lineHeight: 62 } : undefined}>
            {t('shop.title')}
          </Txt>
          <Txt variant="body" color={theme.c.inkSoft}>
            {t('shop.intro', { amount: euro(SHOP.freeShippingFrom) })}
          </Txt>
        </View>
        {wide ? null : <IconButton icon="bag" label={t('shop.cart')} tone="chalk" badge={inCart || undefined} onPress={() => router.push('/winkelmand')} />}
      </View>

      {tip ? (
        <Squish onPress={() => router.push({ pathname: '/product/[id]', params: { id: tip.id } })} scaleTo={0.97}>
          <View style={{ flexDirection: 'row', gap: 14, padding: 14, borderRadius: 26, backgroundColor: theme.c.ink, alignItems: 'center' }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Sticker label={t('shop.tip', { name: last!.stylist.name })} bg={theme.c.bubble} angle={-3} />
              <Txt variant="title" color="#FFFFFF">
                {t('shop.after', { service: text(last!.service.name) })}
              </Txt>
              <Txt variant="small" color="rgba(255,255,255,0.75)">{`${text(tip.name)} · ${euro(tip.price)}`}</Txt>
            </View>
            <PopIn tilt={6}>
              <View
                style={{
                  width: 96,
                  height: 120,
                  borderRadius: 20,
                  overflow: 'hidden',
                  borderWidth: 3,
                  borderColor: '#FFFFFF',
                  transform: [{ rotate: '5deg' }],
                }}
              >
                <ProductPhoto id={tip.id} />
              </View>
            </PopIn>
          </View>
        </Squish>
      ) : null}

      <Pills
        label={t('shop.filter')}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('common.all') },
          { value: 'nails', label: t('shop.cat.nails'), icon: 'polish' },
          { value: 'lashes', label: t('shop.cat.lashes'), icon: 'lash' },
          { value: 'brows', label: t('shop.cat.brows'), icon: 'brow' },
          { value: 'gift', label: t('shop.cat.gift'), icon: 'gift' },
        ]}
      />

      {filter === 'all' || filter === 'gift' ? (
        <Squish onPress={() => setFilter('gift')} scaleTo={0.98}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 18, padding: 18, borderRadius: 26, backgroundColor: theme.c.blush, overflow: 'hidden' }}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <Txt variant="title">{t('shop.giftTitle')}</Txt>
              <Txt variant="small" color={theme.c.inkSoft}>
                {t('shop.giftBody')}
              </Txt>
            </View>
            <View style={{ width: wide ? 220 : 130 }}>
              <GiftCard amount={50} small={!wide} style={{ transform: [{ rotate: '-6deg' }] }} />
            </View>
          </View>
        </Squish>
      ) : null}

      <PopIn key={filter}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, rowGap: 22 }}>
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} width={width} />
          ))}
        </View>
      </PopIn>
      <Txt variant="caption" color={theme.c.muted}>
        {t('shop.demo')}
      </Txt>
    </Screen>
  );
}

function ProductPhoto({ id }: { id: string }) {
  const product = productById(id);
  return product ? <Photo photo={product.photo} style={{ flex: 1 }} /> : null;
}
