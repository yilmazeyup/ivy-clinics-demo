import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { endEdge, startEdge, useLayout } from '@/layout';
import { useTheme } from '@/theme';

import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';
import { nativeDriver } from './Motion';
import { Txt } from './Txt';

export type TabSpec = { name: string; label: string; icon: IconName; badge?: number };

const BAR_HEIGHT = 66;
const INSET = 5;

/** Room to leave under the content of a tab, so the floating bar never covers the last card. */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  return wide ? 32 : BAR_HEIGHT + Math.max(insets.bottom, 14) + 28;
}

/**
 * The tab bar on a phone: a dark glass capsule floating above the page. A light lens slides to the chosen tab,
 * stretching a little on the way like a drop of liquid, and the icons turn dark as it passes over them.
 */
export function TabBar({ state, navigateToTab, tabs }: BottomTabBarProps & { tabs: TabSpec[] }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const [width, setWidth] = useState(0);
  const position = useRef(new Animated.Value(state.index)).current;
  const stretch = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(position, { toValue: state.index, stiffness: 260, damping: 26, mass: 1, useNativeDriver: nativeDriver }),
      Animated.sequence([
        Animated.timing(stretch, { toValue: 1, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: nativeDriver }),
        Animated.spring(stretch, { toValue: 0, stiffness: 220, damping: 13, useNativeDriver: nativeDriver }),
      ]),
    ]).start();
  }, [state.index, position, stretch]);

  // On a computer screen the menu at the top of every page (SiteHeader) takes over from the tabs.
  if (wide) return null;

  const count = state.routes.length;
  const tabWidth = width > 0 ? (width - INSET * 2) / count : 0;
  // In a right-to-left layout the first tab sits on the right, so the lens travels the other way.
  const direction = theme.rtl ? -1 : 1;
  const lensX =
    count > 1
      ? position.interpolate({ inputRange: [0, count - 1], outputRange: [0, (count - 1) * tabWidth * direction] })
      : 0;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', start: 0, end: 0, bottom: 0, paddingHorizontal: 18, paddingBottom: Math.max(insets.bottom - 4, 14) }}
    >
      <Glass
        tone="dark"
        style={{ height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2, width: '100%', maxWidth: 440, alignSelf: 'center', boxShadow: theme.shadow.float }}
      >
        <View style={{ flex: 1, flexDirection: 'row', padding: INSET }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {tabWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: INSET,
                bottom: INSET,
                ...startEdge(theme.rtl, INSET),
                width: tabWidth,
                borderRadius: (BAR_HEIGHT - INSET * 2) / 2,
                backgroundColor: theme.c.bg,
                transform: [
                  { translateX: lensX },
                  { scaleX: stretch.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) },
                  { scaleY: stretch.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) },
                ],
              }}
            />
          ) : null}
          {state.routes.map((route, index) => {
            const tab = tabs.find((t) => t.name === route.name);
            if (!tab) return null;
            const active = index === state.index;
            // How much of the lens covers this tab: 1 right under it, 0 one tab away.
            const under = position.interpolate({ inputRange: [index - 1, index, index + 1], outputRange: [0, 1, 0], extrapolate: 'clamp' });
            const away = position.interpolate({ inputRange: [index - 1, index, index + 1], outputRange: [1, 0, 1], extrapolate: 'clamp' });
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.label}
                onPress={() => {
                  if (!active) Haptics.selectionAsync().catch(() => {});
                  navigateToTab(route.key);
                }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <View style={{ alignItems: 'center', gap: 3 }}>
                  <View style={{ width: 22, height: 22 }}>
                    <Animated.View style={{ position: 'absolute', opacity: away }}>
                      <Icon name={tab.icon} size={22} color="rgba(255, 255, 255, 0.78)" />
                    </Animated.View>
                    <Animated.View style={{ position: 'absolute', opacity: under }}>
                      <Icon name={tab.icon} size={22} color={theme.c.ink} strokeWidth={theme.stroke + 0.3} />
                    </Animated.View>
                    {tab.badge ? <TabBadge count={tab.badge} /> : null}
                  </View>
                  <View>
                    <Animated.View style={{ opacity: away }}>
                      <Txt variant="caption" color="rgba(255, 255, 255, 0.7)" numberOfLines={1} style={{ fontSize: 10.5, fontFamily: theme.f.medium }}>
                        {tab.label}
                      </Txt>
                    </Animated.View>
                    <Animated.View style={{ position: 'absolute', start: 0, end: 0, opacity: under }}>
                      <Txt variant="caption" color={theme.c.ink} numberOfLines={1} align="center" style={{ fontSize: 10.5, fontFamily: theme.f.strong }}>
                        {tab.label}
                      </Txt>
                    </Animated.View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </View>
  );
}

function TabBadge({ count }: { count: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        position: 'absolute',
        top: -6,
        ...endEdge(theme.rtl, -11),
        minWidth: 18,
        height: 18,
        paddingHorizontal: 5,
        borderRadius: 6,
        backgroundColor: theme.c.gold,
        borderWidth: 2,
        borderColor: '#2A2926',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt variant="caption" color="#FFFFFF" style={{ fontSize: 9.5, lineHeight: 11, fontFamily: theme.f.strong }}>
        {String(count)}
      </Txt>
    </View>
  );
}
