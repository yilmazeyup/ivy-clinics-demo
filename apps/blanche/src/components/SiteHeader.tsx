import { router, usePathname } from 'expo-router';
import { View } from 'react-native';

import { useI18n } from '@/i18n';
import { PAGE_WIDTH } from '@/layout';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

import { Button, IconButton } from './Button';
import { Squish } from './Motion';
import { Txt } from './Txt';
import { Wordmark } from './Wordmark';

const LINKS = [
  { path: '/', key: 'tab.home' },
  { path: '/boeken', key: 'tab.book' },
  { path: '/club', key: 'tab.club' },
  { path: '/shop', key: 'tab.shop' },
  { path: '/mijn', key: 'tab.me' },
] as const;

/** On a computer screen the app reads like a website: the logo, the menu and a booking button along the top. */
export function SiteHeader() {
  const theme = useTheme();
  const { t } = useI18n();
  const path = usePathname();
  const { cart } = useDemo();
  const inCart = cart.reduce((n, l) => n + l.qty, 0);
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: theme.c.line, zIndex: 10 }}>
      <View
        style={{
          width: '100%',
          maxWidth: PAGE_WIDTH + 80,
          alignSelf: 'center',
          paddingHorizontal: 40,
          height: 84,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <Squish onPress={() => router.navigate('/')} accessibilityLabel="Blanche Beauty" haptic={false}>
          <Wordmark size={34} />
        </Squish>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {LINKS.map((link) => {
            const on = link.path === '/' ? path === '/' : path.startsWith(link.path);
            return (
              <Squish
                key={link.path}
                haptic={false}
                onPress={() => router.navigate(link.path)}
                style={{
                  paddingHorizontal: 16,
                  height: 40,
                  borderRadius: theme.r.pill,
                  justifyContent: 'center',
                  backgroundColor: on ? theme.c.ink : 'transparent',
                }}
              >
                <Txt variant="smallStrong" color={on ? '#FFFFFF' : theme.c.ink} style={{ fontSize: 14 }}>
                  {t(link.key)}
                </Txt>
              </Squish>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconButton icon="bag" label={t('shop.cart')} tone="chalk" badge={inCart || undefined} onPress={() => router.push('/winkelmand')} />
          <IconButton icon="globe" label={t('settings.title')} tone="chalk" onPress={() => router.push('/instellingen')} />
          <Button label={t('cta.bookNow')} size="md" icon="sparkle" onPress={() => router.navigate('/boeken')} />
        </View>
      </View>
    </View>
  );
}
