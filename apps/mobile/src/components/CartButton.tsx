import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { useI18n } from '@/i18n';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { Txt } from './Txt';

/** Opens the bag; shows how many items are in it. */
export function CartButton() {
  const theme = useTheme();
  const { t } = useI18n();
  const { cart } = useDemo();
  const count = cart.reduce((n, line) => n + line.qty, 0);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('shop.cart')}
      onPress={() => router.push('/ivy/winkelmand')}
      style={({ pressed }) => ({
        height: 44,
        minWidth: 44,
        paddingHorizontal: count ? 12 : 0,
        borderRadius: theme.r.control,
        backgroundColor: count ? theme.c.ink : theme.c.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon name="bag" size={20} color={count ? theme.c.onPrimary : theme.c.ink} />
      {count ? (
        <Txt variant="smallStrong" color={theme.c.onPrimary}>
          {String(count)}
        </Txt>
      ) : null}
    </Pressable>
  );
}
