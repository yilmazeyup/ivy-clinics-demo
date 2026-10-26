import { Tabs } from 'expo-router/js-tabs';

import { TabBar, type TabSpec } from '@/components/TabBar';
import { useI18n } from '@/i18n';
import { useDemo } from '@/state/demo';

export default function ClinicTabs() {
  const { t } = useI18n();
  const { cart } = useDemo();
  const inCart = cart.reduce((n, line) => n + line.qty, 0);
  const tabs: TabSpec[] = [
    { name: 'index', label: t('clinic.tab.home'), icon: 'home' },
    { name: 'boeken', label: t('clinic.tab.book'), icon: 'calendarPlus' },
    { name: 'shop', label: t('clinic.tab.shop'), icon: 'bag', badge: inCart },
    { name: 'mijn', label: t('clinic.tab.mine'), icon: 'user' },
  ];
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} tabs={tabs} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="boeken" />
      <Tabs.Screen name="shop" />
      <Tabs.Screen name="mijn" />
    </Tabs>
  );
}
