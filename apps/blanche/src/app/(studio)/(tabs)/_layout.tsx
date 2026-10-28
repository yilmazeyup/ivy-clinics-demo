import { Tabs, type BottomTabNavigationOptions } from 'expo-router/js-tabs';

import { SWIPE } from '@/components/Motion';
import { TabBar, type TabSpec } from '@/components/TabBar';
import { useI18n } from '@/i18n';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

/**
 * Switching tabs pops: the new page rises a little and grows into place with a soft overshoot while the old one
 * sinks back and fades, like flipping to the next card in a deck.
 */
const transition: Pick<BottomTabNavigationOptions, 'animation' | 'sceneStyleInterpolator' | 'transitionSpec'> = {
  animation: 'shift',
  transitionSpec: { animation: 'timing', config: { duration: 420, easing: SWIPE } },
  sceneStyleInterpolator: ({ current }) => ({
    sceneStyle: {
      opacity: current.progress.interpolate({ inputRange: [-1, -0.5, 0, 0.5, 1], outputRange: [0, 0.1, 1, 0.1, 0] }),
      transform: [
        { translateY: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [-18, 0, 26] }) },
        { scale: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.96, 1, 0.94] }) },
      ],
    },
  }),
};

export default function StudioTabs() {
  const { t } = useI18n();
  const theme = useTheme();
  const { cart } = useDemo();
  const inCart = cart.reduce((n, line) => n + line.qty, 0);
  const tabs: TabSpec[] = [
    { name: 'index', label: t('tab.home'), icon: 'home' },
    { name: 'club', label: t('tab.club'), icon: 'crown' },
    { name: 'boeken', label: t('tab.book'), icon: 'sparkle', center: true },
    { name: 'shop', label: t('tab.shop'), icon: 'bag', badge: inCart },
    { name: 'mijn', label: t('tab.me'), icon: 'user' },
  ];
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.c.paper }, ...transition }}
      tabBar={(props) => <TabBar {...props} tabs={tabs} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="club" />
      <Tabs.Screen name="boeken" />
      <Tabs.Screen name="shop" />
      <Tabs.Screen name="mijn" />
    </Tabs>
  );
}
