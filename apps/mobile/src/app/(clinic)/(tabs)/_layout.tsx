import { Tabs, type BottomTabNavigationOptions } from 'expo-router/js-tabs';
import { useMemo } from 'react';

import { EASE_OUT } from '@/components/Motion';
import { TabBar, type TabSpec } from '@/components/TabBar';
import { useI18n } from '@/i18n';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

/**
 * Switching tabs glides: the new page drifts in from the side of its tab while the old one recedes,
 * both fading, with a slight depth so it reads as one movement rather than a cut.
 */
function tabTransition(rtl: boolean): Pick<BottomTabNavigationOptions, 'animation' | 'sceneStyleInterpolator' | 'transitionSpec'> {
  const shift = rtl ? -42 : 42;
  return {
    animation: 'shift',
    transitionSpec: { animation: 'timing', config: { duration: 460, easing: EASE_OUT } },
    sceneStyleInterpolator: ({ current }) => ({
      sceneStyle: {
        opacity: current.progress.interpolate({ inputRange: [-1, -0.4, 0, 0.4, 1], outputRange: [0, 0.2, 1, 0.2, 0] }),
        transform: [
          { translateX: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [-shift, 0, shift] }) },
          { scale: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.97, 1, 0.97] }) },
        ],
      },
    }),
  };
}

export default function ClinicTabs() {
  const { t } = useI18n();
  const theme = useTheme();
  const { cart } = useDemo();
  const inCart = cart.reduce((n, line) => n + line.qty, 0);
  const transition = useMemo(() => tabTransition(theme.rtl), [theme.rtl]);
  const tabs: TabSpec[] = [
    { name: 'index', label: t('clinic.tab.home'), icon: 'home' },
    { name: 'boeken', label: t('clinic.tab.book'), icon: 'calendarPlus' },
    { name: 'shop', label: t('clinic.tab.shop'), icon: 'bag', badge: inCart },
    { name: 'mijn', label: t('clinic.tab.mine'), icon: 'user' },
  ];
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.c.bg }, ...transition }}
      tabBar={(props) => <TabBar {...props} tabs={tabs} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="boeken" />
      <Tabs.Screen name="shop" />
      <Tabs.Screen name="mijn" />
    </Tabs>
  );
}
