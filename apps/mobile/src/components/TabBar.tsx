import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLayout } from '@/layout';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

export type TabSpec = { name: string; label: string; icon: IconName; badge?: number };

/** One tab bar for both brands: Pure marks the active tab in ink, Ivy adds a thin underline. */
export function TabBar({ state, navigateToTab, tabs }: BottomTabBarProps & { tabs: TabSpec[] }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  // On a computer screen the menu at the top of every page (SiteHeader) takes over from the tabs.
  if (wide) return null;
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

