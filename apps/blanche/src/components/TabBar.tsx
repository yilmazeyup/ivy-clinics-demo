import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { startEdge, useLayout } from '@/layout';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { nativeDriver } from './Motion';
import { Txt } from './Txt';

export type TabSpec = { name: string; label: string; icon: IconName; badge?: number; center?: boolean };

const BAR_HEIGHT = 64;

/** Room to leave under the content of a tab, so the floating bar never covers the last card. */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  return wide ? 40 : BAR_HEIGHT + Math.max(insets.bottom, 12) + 36;
}

/**
 * The tab bar on a phone: a white bar floating over the page with the booking button raised in the middle, a cherry
 * square like a dab of polish. A short cherry stroke slides under the chosen tab and the icon pops as it lands.
 */
export function TabBar({ state, navigateToTab, tabs }: BottomTabBarProps & { tabs: TabSpec[] }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const [width, setWidth] = useState(0);
  const position = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.spring(position, { toValue: state.index, stiffness: 240, damping: 20, mass: 0.9, useNativeDriver: nativeDriver }).start();
  }, [state.index, position]);

  if (wide) return null;

  const count = state.routes.length;
  const tabWidth = width > 0 ? width / count : 0;
  const direction = theme.rtl ? -1 : 1;
  const strokeX = position.interpolate({ inputRange: [0, Math.max(1, count - 1)], outputRange: [0, Math.max(1, count - 1) * tabWidth * direction] });
  const centerIndex = state.routes.findIndex((r) => tabs.find((t) => t.name === r.name)?.center);

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', start: 0, end: 0, bottom: 0, paddingHorizontal: 14, paddingBottom: Math.max(insets.bottom - 6, 12) }}
    >
      <View
        style={{
          height: BAR_HEIGHT,
          width: '100%',
          maxWidth: 460,
          alignSelf: 'center',
          borderRadius: 26,
          backgroundColor: '#FFFFFF',
          boxShadow: theme.shadow.lift,
          borderWidth: 1,
          borderColor: theme.c.line,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row' }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {tabWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: 7,
                ...startEdge(theme.rtl, tabWidth / 2 - 10),
                width: 20,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.c.primary,
                opacity: position.interpolate({
                  inputRange: [centerIndex - 0.6, centerIndex, centerIndex + 0.6],
                  outputRange: [1, 0, 1],
                  extrapolate: 'clamp',
                }),
                transform: [{ translateX: strokeX }],
              }}
            />
          ) : null}
          {state.routes.map((route, index) => {
            const tab = tabs.find((t) => t.name === route.name);
            if (!tab) return null;
            const active = index === state.index;
            const press = () => {
              if (!active) Haptics.selectionAsync().catch(() => {});
              navigateToTab(route.key);
            };
            if (tab.center) return <CenterTab key={route.key} tab={tab} active={active} onPress={press} />;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.label}
                onPress={press}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingBottom: 4 }}
              >
                <PopIcon name={tab.icon} active={active} badge={tab.badge} />
                <Txt
                  variant="caption"
                  color={active ? theme.c.ink : theme.c.muted}
                  numberOfLines={1}
                  style={{ fontSize: 10.5, fontFamily: active ? theme.f.heavy : theme.f.medium }}
                >
                  {tab.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** A tab icon that pops when its tab is chosen. */
function PopIcon({ name, active, badge }: { name: IconName; active: boolean; badge?: number }) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) return;
    scale.setValue(0.7);
    Animated.spring(scale, { toValue: 1, stiffness: 320, damping: 9, useNativeDriver: nativeDriver }).start();
  }, [active, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Icon name={name} size={23} color={active ? theme.c.ink : theme.c.muted} strokeWidth={active ? 2.2 : 1.8} />
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: -5,
            end: -9,
            minWidth: 17,
            height: 17,
            paddingHorizontal: 4,
            borderRadius: 6,
            backgroundColor: theme.c.primary,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt variant="caption" color="#FFFFFF" style={{ fontSize: 9, lineHeight: 10, fontFamily: theme.f.heavy }}>
            {String(badge)}
          </Txt>
        </View>
      ) : null}
    </Animated.View>
  );
}

/** The raised booking button in the middle of the bar. */
function CenterTab({ tab, active, onPress }: { tab: TabSpec; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(spin, { toValue: active ? 1 : 0, stiffness: 200, damping: 12, useNativeDriver: nativeDriver }).start();
  }, [active, spin]);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={tab.label}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center' }}
    >
      <Animated.View
        style={{
          marginTop: -20,
          width: 60,
          height: 60,
          borderRadius: 21,
          backgroundColor: theme.c.primary,
          borderWidth: 3,
          borderColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme.shadow.pop,
          transform: [
            { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] }) },
            { scale: spin.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
          ],
        }}
      >
        <Icon name="sparkle" size={26} color="#FFFFFF" strokeWidth={2} />
      </Animated.View>
      <Txt variant="caption" color={theme.c.ink} numberOfLines={1} style={{ fontSize: 10.5, marginTop: 2, fontFamily: theme.f.heavy }}>
        {tab.label}
      </Txt>
    </Pressable>
  );
}
