import { Tabs } from 'expo-router/js-tabs';

import { TabBar, type TabSpec } from '@/components/TabBar';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { useDemo } from '@/state/demo';

export default function IvyTabs() {
  const { t } = useI18n();
  const { cart } = useDemo();
  const { wide } = useLayout();
  const inCart = cart.reduce((n, line) => n + line.qty, 0);
  const tabs: TabSpec[] = [
    { name: 'index', label: t('ivy.tab.home'), icon: 'home' },
    { name: 'boeken', label: t('ivy.tab.book'), icon: 'calendarPlus' },
    { name: 'pilates', label: t('ivy.tab.pilates'), icon: 'activity' },
    { name: 'shop', label: t('ivy.tab.shop'), icon: 'bag', badge: inCart },
    { name: 'mijn', label: t('ivy.tab.mine'), icon: 'user' },
  ];
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarPosition: wide ? 'top' : 'bottom' }} tabBar={(props) => <TabBar {...props} tabs={tabs} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="boeken" />
      <Tabs.Screen name="pilates" />
      <Tabs.Screen name="shop" />
      <Tabs.Screen name="mijn" />
    </Tabs>
  );
}
