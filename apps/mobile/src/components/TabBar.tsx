import { LOCALE_NAMES } from '@pure-ivy/shared';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { PAGE_WIDTH, useLayout } from '@/layout';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { IvyLogo } from './IvyLogo';
import { Txt } from './Txt';

export type TabSpec = { name: string; label: string; icon: IconName; badge?: number };

/** One tab bar for both brands: Pure marks the active tab in ink, Ivy adds a thin underline. */
export function TabBar(props: BottomTabBarProps & { tabs: TabSpec[] }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const { state, navigateToTab, tabs } = props;
  if (wide) return <TopBar {...props} />;
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingHorizontal: 8,
        backgroundColor: theme.c.surface,
        borderTopWidth: 1,
        borderTopColor: theme.c.line,
      }}
    >
      {state.routes.map((route, index) => {
        const tab = tabs.find((t) => t.name === route.name);
        if (!tab) return null;
        const active = index === state.index;
        const color = active ? theme.c.ink : theme.c.muted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            onPress={() => {
              Haptics.selectionAsync();
              navigateToTab(route.key);
            }}
            style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <View>
              <Icon name={tab.icon} size={24} color={color} strokeWidth={active ? theme.stroke + 0.2 : theme.stroke} />
              {tab.badge ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    end: -9,
                    minWidth: 17,
                    height: 17,
                    paddingHorizontal: 4,
                    borderRadius: 5,
                    backgroundColor: theme.c.highlight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt variant="caption" color={theme.c.onHighlight} style={{ fontSize: 10, lineHeight: 12, fontFamily: theme.f.strong }}>
                    {String(tab.badge)}
                  </Txt>
                </View>
              ) : null}
            </View>
            <Txt variant="caption" color={color} numberOfLines={1} style={{ fontFamily: active ? theme.f.strong : theme.f.medium }}>
              {tab.label}
            </Txt>
            {theme.brand === 'ivy' ? (
              <View style={{ width: 16, height: 2, backgroundColor: active ? theme.c.ink : 'transparent' }} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** On a computer screen the tabs become a website menu along the top: the logo, the pages and the language. */
function TopBar({ state, navigateToTab, tabs }: BottomTabBarProps & { tabs: TabSpec[] }) {
  const theme = useTheme();
  const { gutter } = useLayout();
  const { t, locale } = useI18n();
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
        <Pressable accessibilityRole="link" accessibilityLabel="Ivy Clinics" onPress={() => navigateToTab(state.routes[0].key)}>
          <IvyLogo width={124} />
        </Pressable>
        <View accessibilityRole="tablist" style={{ flex: 1, flexDirection: 'row', alignItems: 'stretch', gap: 30, height: '100%' }}>
          {state.routes.map((route, index) => {
            const tab = tabs.find((x) => x.name === route.name);
            if (!tab) return null;
            const active = index === state.index;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => navigateToTab(route.key)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  borderBottomWidth: 2,
                  borderBottomColor: active ? theme.c.ink : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Txt variant="body" color={active ? theme.c.ink : theme.c.muted} style={{ fontFamily: active ? theme.f.strong : theme.f.medium }}>
                  {tab.label}
                </Txt>
                {tab.badge ? (
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
                      {String(tab.badge)}
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
