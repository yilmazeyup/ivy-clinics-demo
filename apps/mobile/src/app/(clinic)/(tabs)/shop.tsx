import { PRODUCTS, productsAfter, type ShopCategory } from '@pure-clinics/shared';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { CartButton } from '@/components/CartButton';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { ProductCard } from '@/components/ProductCard';
import { Rail, Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { useClinic } from '@/clinic';
import { PAGE_WIDTH, useLayout } from '@/layout';
import { useTheme } from '@/theme';

type Category = 'all' | ShopCategory;
const CATEGORIES: Category[] = ['all', 'face', 'aftercare', 'body', 'kits'];

export default function Shop() {
  const theme = useTheme();
  const { wide, inner } = useLayout();
  const { t, text } = useI18n();
  const clinic = useClinic();
  const params = useLocalSearchParams<{ category?: string; at?: string }>();
  const [category, setCategory] = useState<Category>('all');

  // Another screen can open the shop on one category; `at` makes a repeated tap count.
  useEffect(() => {
    const match = CATEGORIES.find((c) => c === params.category);
    if (match) setCategory(match);
  }, [params.category, params.at]);

  // Suggestions follow the member's next treatment, or else the most recent one.
  const basis = clinic.next ?? clinic.past[0];
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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap, rowGap: wide ? 32 : 20 }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} width={tile} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon name="check" size={15} color={theme.c.muted} />
        <Txt variant="small" color={theme.c.muted}>
          {`${t('shop.returns')} · iDEAL`}
        </Txt>
      </View>
    </Screen>
  );
}
