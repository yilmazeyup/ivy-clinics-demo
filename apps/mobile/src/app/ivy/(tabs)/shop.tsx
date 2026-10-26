import { PRODUCTS, productsAfter, PURE_PACKAGES, type PurePackage, type ShopCategory } from '@pure-ivy/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { CartButton } from '@/components/CartButton';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { ProductCard } from '@/components/ProductCard';
import { Rail, Screen } from '@/components/Screen';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { useIvy } from '@/ivy';
import { PAGE_WIDTH, useLayout } from '@/layout';
import { PACKAGE_PHOTOS, packageItemId } from '@/shop';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

type Category = 'all' | ShopCategory | 'pilates';
// Pilates comes early so it stays in view when another screen opens the shop on it.
const CATEGORIES: Category[] = ['all', 'pilates', 'face', 'aftercare', 'body', 'kits'];

export default function Shop() {
  const theme = useTheme();
  const { wide, inner } = useLayout();
  const { t, text } = useI18n();
  const ivy = useIvy();
  const params = useLocalSearchParams<{ category?: string; at?: string }>();
  const [category, setCategory] = useState<Category>('all');

  // "Credits kopen" elsewhere in the app opens the shop on the pilates packages; `at` makes a repeated tap count.
  useEffect(() => {
    const match = CATEGORIES.find((c) => c === params.category);
    if (match) setCategory(match);
  }, [params.category, params.at]);

  // Suggestions follow the member's next treatment, or else the most recent one.
  const basis = ivy.next ?? ivy.past[0];
  const picks = basis ? productsAfter(basis.treatmentId) : [];
  const products = PRODUCTS.filter((p) => category === 'all' || p.category === category);
  // Two products per row on a phone, four on a computer screen.
  const columns = wide ? 4 : 2;
  const columnGap = wide ? 20 : 12;
  const tile = Math.floor((inner(PAGE_WIDTH) - columnGap * (columns - 1)) / columns);

  return (
    <Screen gap={22} width="page">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <Txt variant="display" style={{ flex: 1 }}>
          {t('shop.title')}
        </Txt>
        <CartButton />
      </View>
      <Txt variant="body" color={theme.c.muted} style={{ marginTop: -10 }}>
        {t('shop.intro')}
      </Txt>

      {basis && picks.length > 0 && category === 'all' ? (
        <View style={{ gap: 12 }}>
          <View style={{ gap: 2 }}>
            <Txt variant="heading">{t('shop.forYou', { treatment: text(basis.treatment.name) })}</Txt>
            <Txt variant="small" color={theme.c.muted}>
              {t('shop.forYouBody', { name: basis.specialist.name })}
            </Txt>
          </View>
          <Rail gap={columnGap}>
            {picks.map((p) => (
              <ProductCard key={p.id} product={p} width={wide ? tile : 148} />
            ))}
          </Rail>
        </View>
      ) : null}

      <Rail gap={8}>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={t(`shop.cat.${c}`)} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </Rail>

      {category === 'pilates' ? (
        <View style={wide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 20 } : { gap: 12 }}>
          {PURE_PACKAGES.map((pkg) => (
            <View key={pkg.id} style={wide ? { flexBasis: '30%', flexGrow: 1 } : undefined}>
              <PackageCard pkg={pkg} />
            </View>
          ))}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap, rowGap: wide ? 32 : 20 }}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} width={tile} />
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon name="check" size={15} color={theme.c.muted} />
        <Txt variant="small" color={theme.c.muted}>
          {`${t('shop.returns')} · iDEAL`}
        </Txt>
      </View>
    </Screen>
  );
}

function PackageCard({ pkg }: { pkg: PurePackage }) {
  const theme = useTheme();
  const { t, tp, euro } = useI18n();
  const { addToCart, unlimited, cart } = useDemo();
  const toast = useToast();
  const name = t(`pilates.pkg.${pkg.id}`);
  const owned = pkg.monthly && unlimited;
  const inCart = cart.some((l) => l.id === packageItemId(pkg.id));
  const detail = pkg.monthly
    ? t('pilates.pkg.perMonth')
    : pkg.credits > 1
      ? t('pilates.pkg.perClass', { price: euro(pkg.price / pkg.credits) })
      : tp('common.credit', pkg.credits);

  return (
    <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 12, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Photo photo={PACKAGE_PHOTOS[pkg.id]} style={{ width: 64, height: 76, borderRadius: theme.r.photo }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">{name}</Txt>
          <Txt variant="small" color={theme.c.muted}>
            {detail}
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt variant="title">{euro(pkg.price)}</Txt>
          <Txt variant="caption" color={theme.c.muted}>
            {pkg.monthly ? t('pilates.pkg.perMonth') : t('pilates.pkg.once')}
          </Txt>
        </View>
      </View>
      <Button
        size="sm"
        kind={inCart ? 'secondary' : 'primary'}
        icon={owned || inCart ? 'check' : undefined}
        disabled={owned}
        label={owned ? t('shop.unlimitedOwned') : inCart ? t('shop.cart') : t('shop.add')}
        onPress={() => {
          if (inCart) {
            router.push('/ivy/winkelmand');
            return;
          }
          addToCart(packageItemId(pkg.id));
          toast(t('shop.added', { name }));
        }}
      />
    </View>
  );
}
