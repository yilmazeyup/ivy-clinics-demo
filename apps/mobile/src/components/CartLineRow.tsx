import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useI18n } from '@/i18n';
import { PACKAGE_PHOTOS, shopItem, type CartLine } from '@/shop';
import { useTheme } from '@/theme';

import { Photo, TexturePhoto } from './Photo';
import { Txt } from './Txt';

/** One line of a bag or an order: picture, name and price, with room for controls on the end side. */
export function CartLineRow({ line, first, children }: { line: CartLine; first?: boolean; children?: ReactNode }) {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  const item = shopItem(line.id);
  if (!item) return null;
  const name = item.kind === 'product' ? text(item.product.name) : t(`pilates.pkg.${item.pkg.id}`);
  const brand = item.kind === 'product' ? item.product.brand : t('ivy.tab.pilates');
  const style = { width: 56, height: 66, borderRadius: theme.r.small };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: theme.c.line,
      }}
    >
      {item.kind === 'product' ? <TexturePhoto texture={item.product.texture} style={style} /> : <Photo photo={PACKAGE_PHOTOS[item.pkg.id]} style={style} />}
      <View style={{ flex: 1, gap: 2 }}>
        {brand ? (
          <Txt variant="caption" color={theme.c.muted}>
            {brand}
          </Txt>
        ) : null}
        <Txt variant="bodyStrong" numberOfLines={2}>
          {line.qty > 1 ? `${name} × ${line.qty}` : name}
        </Txt>
        <Txt variant="small" color={theme.c.muted}>
          {euro(Math.round(item.price * line.qty * 100) / 100)}
        </Txt>
      </View>
      {children}
    </View>
  );
}
