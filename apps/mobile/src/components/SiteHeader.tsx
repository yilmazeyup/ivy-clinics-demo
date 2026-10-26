import { LOCALE_NAMES } from '@pure-ivy/shared';
import { router, usePathname } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useI18n } from '@/i18n';
import { PAGE_WIDTH, useLayout } from '@/layout';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { IvyLogo } from './IvyLogo';
import { Txt } from './Txt';

type Section = 'home' | 'book' | 'pilates' | 'shop' | 'mine';

/** Which menu item a page belongs to, so the menu still shows where you are on a detail page. */
function sectionOf(path: string): Section | null {
  if (/^\/ivy\/(boeken|afspraak|bevestiging)/.test(path)) return 'book';
  if (/^\/ivy\/(pilates|les|ticket)/.test(path)) return 'pilates';
  if (/^\/ivy\/(shop|product|winkelmand|afrekenen|bestelling)/.test(path)) return 'shop';
  if (/^\/ivy\/(mijn|journaal)/.test(path)) return 'mine';
  if (/^\/ivy\/?$/.test(path) || /^\/ivy\/(advies|assistent)/.test(path)) return 'home';
  return null;
}

/** The website menu along the top on a computer screen: the logo, the pages and the language, on every page. */
export function SiteHeader() {
  const theme = useTheme();
  const { gutter } = useLayout();
  const { t, locale } = useI18n();
  const { cart } = useDemo();
  const active = sectionOf(usePathname());
  const inCart = cart.reduce((n, line) => n + line.qty, 0);
  const items = [
    { key: 'home', href: '/ivy', label: t('ivy.tab.home') },
    { key: 'book', href: '/ivy/boeken', label: t('ivy.tab.book') },
    { key: 'pilates', href: '/ivy/pilates', label: t('ivy.tab.pilates') },
    { key: 'shop', href: '/ivy/shop', label: t('ivy.tab.shop'), badge: inCart },
    { key: 'mine', href: '/ivy/mijn', label: t('ivy.tab.mine') },
  ] as const;

  return (
    <View style={{ backgroundColor: theme.c.surface, borderBottomWidth: 1, borderBottomColor: theme.c.line }}>
      <View
        style={{
          width: '100%',
          maxWidth: PAGE_WIDTH + gutter * 2,
          alignSelf: 'center',
          paddingHorizontal: gutter,
          height: 76,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 40,
        }}
      >
        <Pressable accessibilityRole="link" accessibilityLabel="Ivy Clinics" onPress={() => router.navigate('/ivy')}>
          <IvyLogo width={124} />
        </Pressable>
        <View accessibilityRole="menubar" style={{ flex: 1, flexDirection: 'row', alignItems: 'stretch', gap: 30, height: '100%' }}>
          {items.map((item) => {
            const current = item.key === active;
            const badge = 'badge' in item ? item.badge : 0;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="link"
                accessibilityState={{ selected: current }}
                onPress={() => router.navigate(item.href)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  borderBottomWidth: 2,
                  borderBottomColor: current ? theme.c.ink : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Txt variant="body" color={current ? theme.c.ink : theme.c.muted} style={{ fontFamily: current ? theme.f.strong : theme.f.medium }}>
                  {item.label}
                </Txt>
                {badge ? (
                  <View
                    style={{
                      minWidth: 18,
                      height: 18,
                      paddingHorizontal: 5,
                      borderRadius: 5,
                      backgroundColor: theme.c.highlight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Txt variant="caption" color={theme.c.onHighlight} style={{ fontSize: 10, lineHeight: 12, fontFamily: theme.f.strong }}>
                      {String(badge)}
                    </Txt>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.language')}
          onPress={() => router.push('/settings')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 40,
            paddingHorizontal: 12,
            borderRadius: theme.r.control,
            borderWidth: 1,
            borderColor: theme.c.line,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Icon name="globe" size={17} />
          <Txt variant="small">{LOCALE_NAMES[locale]}</Txt>
        </Pressable>
      </View>
    </View>
  );
}
